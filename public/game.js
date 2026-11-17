// Chorsu Run: an original 3D lane runner through a bazaar street.
// The world is built in run-world.js, sound in run-audio.js; this file is the game itself.
// Controls: swipe left/right = change lane, up = jump, down = roll, double tap = acrobatic trick.

const Game = (() => {
  const tr = (s, v) => window.T(s, v);   // the app translation function (this file has its own T: three.js)
  const LIB = "./lib/three.module.min.js";      // three.js is kept in the app itself so it works offline
  const MODELS = ["damas", "tree1", "tree2", "mosque", "city", "wagon"];
  const C = { SLOT: 10, SLOTS: 20, LOOP: 200, BACK: 50 };     // scenery repeats every LOOP metres, BACK of them behind the runner
  const LANE = 2, FAR = -150, GONE = 14;
  let HIP = 0.83;          // hip height of the current runner
  const CAM_Y = 4.3, CAM_Z = 8.4, GRAV = 26, JUMP = 9.6, ROLL = 0.62, V0 = 15, VMAX = 46;
  // top speed per level: levels 1-2 stay relaxed, from level 3 the run gets fast and needs full attention
  const VCAP = [0, 26, 28, 37, 42], vcap = () => (level >= 4 ? Math.min(VMAX, 42 + (dist - 4500) / 1000) : VCAP[level]);
  // where each level starts and what the arrival banner says (level 1 is the street at the start)
  const LEVELS = { 2: [1500, "Bozor ichida"], 3: [3000, "Istanbul"], 4: [4500, "Dengiz bo'yi"] };
  const HEARTS = 3, STAKE = 25, SLOT_MS = 30 * 60 * 1000;
  const AIR = ["salto", "oldinga", "twist"], GROUND = ["salto", "burilish"];
  const LABEL = { salto: "Orqaga salto", oldinga: "Oldinga salto", twist: "Burama salto", burilish: "360 burilish" };

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

  let T = null, root = null, el = {}, alive = false, tmp = null;
  let renderer = null, scene = null, camera = null, raf = 0, last = 0, time = 0, W = 0, H = 0, baseFov = 70;
  let S = {}, P = null, cur = null, moodIdx = 0, moodOverride = null, objs = [], pools = {};
  let state = "load", prevState = "play", speed = V0, dist = 0, coins = 0, hearts = HEARTS, spawnIn = 0, rows = 0, runT = 0;
  let lane = 1, prevLane = 1, px = 0, py = 0, vy = 0, gy = 0, grounded = true, rollT = 0, lowT = 0, jumpBuf = 0, fastFall = false;
  let invuln = 0, stumbleT = 0, crashT = 0, nmSlow = 0, shake = 0, camX = 0, kick = 0, bolt = 8, ts = 1;
  let laneAt = -9, jumpAt = -9, rollAt = -9, auto = false;
  let trick = null, airIdx = 0, gndIdx = 0, cineSide = 1, wave = null, lastWave = -9, eat = null, nextEat = 12, rest = null, nextRest = 500;
  let introT = 0, introK = 0, menuT = 0, paintP = 0, guardT = -1, guardX = -2.4;
  let combo = 0, comboAt = -9, games = 0, tipA = false, tipB = false, lastTap = 0, bumpAt = 0;
  let flowTimer = 0, hintTimer = 0, muted = false;
  let frozen = false;      // test hook: stop the clock but keep drawing
  let loaded = null;       // downloaded models, kept between games
  let level = 1, portalOn = false, nextBoost = 300, punch = 0, speedFx = -1;
  let pace = 1, gateObj = null, trans = null, calm = 0;
  // power-ups: seconds left of each, and where the next one appears
  const PW = { x2: [15, "2x tanga"], jump: [10, "Super sakrash"], fly: [7, "Uchar gilam"], shield: [20, "Qalqon"], dash: [0, "Oldinga!"] }, FLY_H = 5.2;
  const pw = { dash: 0, x2: 0, jump: 0, fly: 0, shield: 0 };
  let nextPow = 260, flyK = 0, G_BOX = null;
  // energy: runs down all the time (faster on later levels), coins and food fill it; empty = he collapses (a crash)
  const DRAIN = [0, 1 / 20, 1 / 18, 1 / 14, 1 / 11];
  let energy = 1, enWarn = 0;
  // two players: 4 lanes, the friend's runner, the road comes from the host phone; each can be one step ahead or behind
  let NL = 3, net = null, fr = null, outbox = [], netApplying = false, offT = 0, offPos = 0, hostB = null, lastSend = 0, lastDown = -9;
  let rdy = { me: false, fr: false, replied: false }, cdT = 0, cdN = 0, saveT = 0, netCard = "";
  const STEP = 3;
  let moment = null, lastSnapT = 0, momentURL = null, momentCanvas = null, momentPng = null;     // the most spectacular moment of this run, for the picture at the end
  let nextWagon = 700, tubeK = 0, inTube = null;     // the train wagon to run through
  const feed = (a) => { energy = Math.min(1, energy + a); };    // slow-down near a gate, the fade through it, the quiet start of a new level
  let dbl = false, ninjaT = 0, ninjaK = 0, flipT = 0, safe = 0, ar = null;     // second jump used, ninja flip timer, no-crash window after a trick, AR view
  const shown = {}, quality = { n: 0, k: 0, sum: 0, done: false };

  /* ---------- small helpers ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const laneX = (l) => (l - (NL - 1) / 2) * LANE;
  const best = () => store.get("run_best", 0);
  let moodStart = Date.now();
  const slotMood = () => Math.floor((Date.now() - moodStart) / SLOT_MS) % MOODS.length;     // 0 = sunny day first
  const num = (v) => String(v).replace(".", ",");
  const score = () => Math.floor(dist) + coins * 10;
  const sfx = (n, p) => RunAudio.sfx(n, p);
  // true when the runner is simply running and free to play a small extra animation
  const free = () => state === "play" && grounded && !trick && !wave && !eat && rollT <= 0 && stumbleT <= 0 && crashT <= 0;

  function buzz(kind, pattern) {
    try { kind === "select" ? tg.HapticFeedback.selectionChanged() : /error|success|warning/.test(kind) ? tg.HapticFeedback.notificationOccurred(kind) : tg.HapticFeedback.impactOccurred(kind); } catch {}
    if (pattern && navigator.vibrate) { try { navigator.vibrate(pattern); } catch {} }
  }

  /* ---------- DOM shell ---------- */
  const LOADING = `<div class="run-spin"></div><p>Yuklanmoqda…</p>`;
  // the picture behind the loading spinner: a tiny blurred copy is inlined so something shows at once, the real one (76 KB, cached offline) fades in over it
  const SPLASH_TINY = "data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAAAwBQCdASoSACAAPu1ip02ppaMiMBgMATAdiWoAnTKAALznNy1gO5LQrcukY4JmUGWlgADN4AARbsv31WVjBIJ7INPuge02bR6DYDyZvGkeG8NE93MdF4EZ2xc+QA9QwO4aAMASd18oZOoNpXwsNWYv6M+Gt7uhR+sfEqxAso2jdEX37BUZj66VA64Hm8MBFKMqjJeEKAA=";
  function hideSplash() { const sp = root && root.querySelector(".run-splash"); if (!sp) return; root.classList.remove("loading"); sp.classList.add("gone"); setTimeout(() => sp.remove(), 700); }
  function mount() {
    root = document.createElement("div");
    root.className = "run loading";
    root.innerHTML = `
      <canvas class="run-cv"></canvas>
      <div class="run-splash" style="background-image:url(${SPLASH_TINY})"><img alt="" src="img/loading.webp" decoding="async" fetchpriority="high" onload="this.classList.add('in')"></div>
      <div class="run-flash"></div>
      <div class="run-speed"></div>
      <div class="run-title"></div>
      <div class="run-ov"></div>
      <div class="run-fx"></div>
      <div class="run-hint"></div>
      <div class="run-kuch"><span class="ic-bolt">${ic("zap")}</span><i><b></b></i></div>
      <div class="run-pw"></div>
      <div class="run-friend" style="display:none"></div>
      <div class="run-top">
        <div class="run-hud"><button class="run-btn" data-k="pause" aria-label="Pauza">${ic("pause")}</button><span class="run-coins">${ic("coin")}<b data-k="coins">0</b></span></div>
        <div class="run-right"><span class="run-hearts"></span><button class="run-btn" data-k="map" aria-label="Xarita">${ic("map")}</button><button class="run-btn" data-k="x" aria-label="Yopish">${ic("x")}</button></div>
      </div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    el = { cv: q(".run-cv"), flash: q(".run-flash"), speed: q(".run-speed"), title: q(".run-title"), ov: q(".run-ov"), fx: q(".run-fx"), hint: q(".run-hint"), coins: q('[data-k="coins"]'), chip: q(".run-coins"), hearts: q(".run-hearts"), pwBox: q(".run-pw"), kuch: q(".run-kuch"), kuchBar: q(".run-kuch b"), friend: q(".run-friend") };
    q('[data-k="x"]').onclick = exit; q('[data-k="pause"]').onclick = pause; q('[data-k="map"]').onclick = openMap;
    el.arBtn = q('[data-k="map"]');
    muted = store.get("run_mute", false); RunAudio.mute(muted);
    alive = true; state = "load"; moodOverride = null;
    net = typeof Duo !== "undefined" && Duo.S.playing && Duo.linked ? { host: Duo.host, name: (Duo.friend && Duo.friend.name) || "Do'st" } : null;
    NL = net ? 4 : 3;
    card(LOADING, {}, "loading");
    init();
  }
  function unmount() {
    if (net) { for (const u of net.subs || []) u(); net = null; }
    arStop(); alive = false; cancelAnimationFrame(raf); clearTimeout(flowTimer); clearTimeout(hintTimer); RunAudio.music(false);
    window.removeEventListener("resize", resize); window.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onHide);
    if (renderer) { renderer.dispose(); try { renderer.forceContextLoss(); } catch {} renderer = null; }
    scene = null; objs = []; pools = {}; P = null; S = {};
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
  function tip(text) {
    el.hint.innerHTML = `<span>${ic("tap")}${text}</span>`; el.hint.className = "run-hint show";
    clearTimeout(hintTimer); hintTimer = setTimeout(() => { if (alive) el.hint.className = "run-hint"; }, 3600);
  }
  function confetti(n) {
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i"); c.className = "run-conf";
      c.style.cssText = `left:${rnd(2, 98)}%;background:${pick(["#FFC233", "#2748F5", "#12995B", "#E5484D", "#FFFFFF"])};animation-delay:${rnd(0, 0.4)}s`;
      el.fx.appendChild(c); setTimeout(() => c.remove(), 2600);
    }
  }
  function flash(color, a) {
    const f = el.flash;
    f.style.transition = "none"; f.style.background = color; f.style.opacity = a;
    void f.offsetWidth;
    f.style.transition = "opacity .55s ease-out"; f.style.opacity = 0;
  }
  function bump() {          // the coin counter pops when it grows
    const now = performance.now(); if (now - bumpAt < 110) return; bumpAt = now;
    el.chip.classList.remove("bump"); void el.chip.offsetWidth; el.chip.classList.add("bump");
  }
  function hudPw() {
    for (const k in pw) {
      if (!PW[k][0]) continue;
      const c = el.pw[k], on = pw[k] > 0;
      if (on !== c.on) { c.on = on; c.el.style.display = on ? "" : "none"; }
      if (on) { const f = Math.round(pw[k] / PW[k][0] * 40) / 40; if (f !== c.f) { c.f = f; c.bar.style.transform = `scaleX(${f})`; } }
    }
  }
  function hud(force) {
    if (el.pw) hudPw();
    if (net && fr) {
      const rel = fr.o - offT, t = `${esc(net.name)} · ${"♥".repeat(Math.max(0, fr.h))} · ${fr.co}${rel > 0 ? " · oldinda" : rel < 0 ? " · orqada" : ""}`;
      if (t !== shown.f) { shown.f = t; el.friend.innerHTML = t; }
    }
    const e = Math.round(energy * 60) / 60;
    if (force || e !== shown.e) {
      shown.e = e; el.kuchBar.style.transform = `scaleY(${e})`;
      const c = e > 0.6 ? "g" : e > 0.3 ? "y" : "r";
      if (c !== shown.ec) { shown.ec = c; el.kuch.className = "run-kuch " + c; }
    }
    if (force || coins !== shown.c) el.coins.textContent = shown.c = coins;
    if (force || hearts !== shown.h) { shown.h = hearts; el.hearts.innerHTML = [0, 1, 2].map((i) => ic("heart", i < hearts ? "on" : "")).join(""); }
  }
  function reward(text) {    // every prize looks and sounds the same way, so it reads as a reward
    pop(text, "gold"); buzz("success"); burst(px, py + 1.2, 0, "#FFE08A", 16, 3.2); bump(); hud();
  }
  function fail(title, text) {
    if (!alive) return;
    card(`${chip("alert", "lg solid")}<h2>${title}</h2><p>${text}</p><button class="btn-primary" data-a="retry">${ic("refresh")} Qayta urinish</button>`, { retry: () => { card(LOADING); init(); } });
  }

  async function loadLib() { return import(LIB); }
  // Downloads the 3D models once (they are kept between games and cached for offline play).
  let fetching = null, modelsIn = false;
  function fetchModels() {
    if (!fetching) fetching = (async () => {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import("./lib/GLTFLoader.js"), import("./lib/meshopt_decoder.module.js")]);
      const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
      const got = {}, scenes = await Promise.all(MODELS.map((n) => l.loadAsync(`models/${n}.glb`).then((g) => g.scene).catch(() => null)));
      MODELS.forEach((n, i) => { got[n] = scenes[i]; });
      loaded = got;
    })().catch(() => { fetching = null; });
    return fetching;
  }
  // Puts the models into the world. Done before the run starts, or later only while the screen is covered
  // (pause, results, the fade into the next level), so the swap is never seen as a stutter.
  function applyModels() {
    if (modelsIn || !loaded || !S.make) return;
    modelsIn = true;
    try {
      RunWorld.useModels(loaded);
      for (const o of pools.damas || []) scene.remove(o);      // vans waiting in the pool are swapped for the new model
      pools.damas = [];
      prewarm();
    } catch {}
  }
  // Draws one of everything once, out of sight of the player, so the phone prepares every shader, texture and
  // buffer now instead of stalling the first time each thing comes into view.
  const POWC = { dash: "#0EA5A4", x2: "#F4A300", jump: "#22B455", fly: "#8B3FD9", shield: "#2E86E8" };
  function powIcon(k) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const gr = g.createRadialGradient(54, 46, 8, 64, 64, 62); gr.addColorStop(0, "#fff"); gr.addColorStop(0.25, POWC[k]); gr.addColorStop(1, POWC[k]);
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = "#fff"; g.stroke();
    g.fillStyle = g.strokeStyle = "#fff"; g.lineCap = g.lineJoin = "round";
    if (k === "dash") { g.lineWidth = 12; for (const x of [46, 70]) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 16, 64); g.lineTo(x, 88); g.stroke(); } }
    else if (k === "x2") { g.font = "900 54px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("x2", 64, 68); }
    else if (k === "jump") { g.lineWidth = 12; for (const y of [50, 74]) { g.beginPath(); g.moveTo(40, y + 12); g.lineTo(64, y - 10); g.lineTo(88, y + 12); g.stroke(); } }
    else if (k === "fly") { g.beginPath(); g.moveTo(28, 52); g.quadraticCurveTo(64, 38, 100, 52); g.lineTo(100, 80); g.quadraticCurveTo(64, 66, 28, 80); g.closePath(); g.fill();
      g.fillStyle = POWC.fly; g.beginPath(); g.moveTo(64, 50); g.lineTo(76, 61); g.lineTo(64, 72); g.lineTo(52, 61); g.fill(); g.fillStyle = "#fff"; for (let i = 0; i < 6; i++) g.fillRect(30 + i * 13, 82, 4, 9); }
    else { g.beginPath(); g.moveTo(64, 28); g.lineTo(94, 40); g.quadraticCurveTo(94, 82, 64, 100); g.quadraticCurveTo(34, 82, 34, 40); g.closePath(); g.fill(); g.fillStyle = POWC.shield; g.beginPath(); g.moveTo(64, 42); g.lineTo(82, 50); g.quadraticCurveTo(82, 76, 64, 88); g.closePath(); g.fill(); }
    return c;
  }
  function powerUps() {                 // pickups (a floating badge with a glow), the carpet and the shield bubble
    const glowMap = S.glowMat.map;
    for (const k in PW) {
      const cv = powIcon(k), t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
      const im = new T.SpriteMaterial({ map: t, depthWrite: false }), gm = new T.SpriteMaterial({ map: glowMap, color: POWC[k], transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending });
      S.make["pw_" + k] = () => { const g = new T.Group(), a = new T.Sprite(gm), b = new T.Sprite(im); a.scale.set(2.6, 2.6, 1); b.scale.set(1.15, 1.15, 1); g.add(a, b); return g; };
      S.defs["pw_" + k] = { kind: "pick", hd: 0.5, val: 0, pw: k };
      const c = el.pw[k] = { on: false, f: -1 };
      c.el = document.createElement("div"); c.el.className = "run-pwc"; c.el.style.display = "none"; c.el.innerHTML = `<img alt="" src="${cv.toDataURL()}"><i><b></b></i>`; c.bar = c.el.querySelector("b");
      el.pwBox.appendChild(c.el);
    }
    // the flying carpet: woven pattern, tassels at the ends
    const rc = document.createElement("canvas"); rc.width = 128; rc.height = 192; const g = rc.getContext("2d");
    g.fillStyle = "#9E1B32"; g.fillRect(0, 0, 128, 192); g.fillStyle = "#F2C14E"; g.fillRect(8, 8, 112, 176); g.fillStyle = "#1B4F8A"; g.fillRect(16, 16, 96, 160);
    for (let y = 0; y < 5; y++) { g.fillStyle = y % 2 ? "#F2C14E" : "#E5383B"; g.beginPath(); g.moveTo(64, 26 + y * 30); g.lineTo(90, 40 + y * 30); g.lineTo(64, 54 + y * 30); g.lineTo(38, 40 + y * 30); g.fill(); }
    const ct = new T.CanvasTexture(rc); ct.colorSpace = T.SRGBColorSpace;
    S.carpet = new T.Group();
    const rug = new T.Mesh(new T.BoxGeometry(1.5, 0.06, 2.3), new T.MeshStandardMaterial({ map: ct, roughness: 0.9 })); rug.castShadow = true; S.carpet.add(rug);
    for (const z of [-1.2, 1.2]) for (let i = 0; i < 6; i++) { const f = new T.Mesh(G_BOX, new T.MeshStandardMaterial({ color: 0xF2C14E })); f.scale.set(0.05, 0.03, 0.16); f.position.set(-0.6 + i * 0.24, 0, z); S.carpet.add(f); }
    S.carpet.visible = false; scene.add(S.carpet);
    S.shield = new T.Mesh(new T.SphereGeometry(1.15, 24, 16), new T.MeshStandardMaterial({ color: 0x7CC6FF, emissive: 0x2E86E8, emissiveIntensity: 0.6, transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.2 }));
    S.shield.visible = false; scene.add(S.shield);
  }
  function prewarm() {
    const temp = [], hidden = [];
    let i = 0;
    for (const type of Object.keys(S.make)) {
      const m = take(type); m.position.set((i % 3 - 1) * 2.5, 0, -14 - Math.floor(i / 3) * 4); i++; temp.push([type, m]);
    }
    const show = (o, z) => { if (!o) return; hidden.push([o, o.visible, o.position.z]); o.visible = true; if (z != null) o.position.z = z; };
    show(S.portal, -30); show(S.in); show(S.mosque); show(S.sea); show(S.carpet); show(S.shield); if (S.guard) show(S.guard.g);
    try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch {}
    for (const [o, v, z] of hidden) { o.visible = v; o.position.z = z; }
    for (const [type, m] of temp) { m.visible = false; (pools[type] || (pools[type] = [])).push(m); }
    try { renderer.render(scene, camera); } catch {}
  }
  async function init() {
    try { T = T || (await loadLib()); }
    catch { return fail("Yuklab bo'lmadi", "Internetga ulanib, qayta urinib ko'ring. Ilova bir marta ochilgandan keyin o'yin internetsiz ham ishlaydi."); }
    if (!alive) return;
    try { renderer = new T.WebGLRenderer({ canvas: el.cv, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch { return fail("3D grafika ishlamadi", "Bu qurilma yoki brauzer 3D grafikani qo'llab-quvvatlamaydi."); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
    for (const m of MOODS) if (!m.c) {
      m.c = {}; for (const c of COL) m.c[c] = new T.Color(m[c]);
      m.v = { dir: new T.Vector3(...m.dir).normalize(), discDir: new T.Vector3(...m.discDir).normalize() };
    }
    if (store.get("run_lowq", false)) { renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; quality.done = true; }   // a slow phone, found in an earlier game
    S = RunWorld.build(T, C); scene = S.scene; if (runnerColor() && runnerColor() !== S.theme) { P = S.P; paintRunner(runnerColor()); } G_BOX = G_BOX || new T.BoxGeometry(1, 1, 1); camera = S.camera; P = S.P; HIP = P.hip || 0.83; modelsIn = false;
    if (!renderer.shadowMap.enabled) S.sun.castShadow = false;
    el.pwBox.innerHTML = ""; el.pw = {}; powerUps();
    tmp = { p: new T.Vector3(), l: new T.Vector3(), a: new T.Vector3(), b: new T.Vector3() };
    for (const f of S.flocks) f.birds.forEach((b, j) => {
      if (f.kind === "sky") { const n = f.birds.length, mid = (n - 1) / 2; b.x = -30 - Math.abs(j - mid) * 1.3 - (n === 5 ? 40 : 0); b.z = (n === 5 ? -78 : -50) + (j - mid) * 1.5; b.y = (n === 5 ? 25 : 17) + rnd(-0.4, 0.4); b.vx = n === 5 ? 4.5 : 6.5; }
      else resetPigeon(b, -40 - j * 0.7);
    });
    moodStart = Date.now(); moodIdx = slotMood();
    const m = MOODS[moodIdx];
    cur = { dir: m.v.dir.clone(), discDir: m.v.discDir.clone() };
    for (const c of COL) cur[c] = m.c[c].clone();
    for (const n of NUM) cur[n] = m[n];
    if (renderer.shadowMap.enabled) { quality.done = false; quality.n = quality.sum = 0; }
    resize(); window.addEventListener("resize", resize);
    bindInput(); document.addEventListener("visibilitychange", onHide);
    // wait a moment for the models (instant when cached), then prepare everything before the first frame
    await Promise.race([fetchModels(), new Promise((r) => setTimeout(r, 2500))]);
    if (!alive) return;
    if (loaded) applyModels(); else { prewarm(); fetchModels(); }
    play();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    hideSplash();
    if (net) netStart();
    else { const sv = store.get("run_save", null); if (sv && Date.now() - sv.t < 12 * 3600e3 && state === "play") askResume(sv); else if (state === "play") startPanel(); }
  }
  function resize() {
    if (!renderer) return;
    W = root.clientWidth; H = root.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // widen the view on tall phone screens so all three lanes stay visible
    baseFov = clamp(T.MathUtils.radToDeg(2 * Math.atan((LANE * (NL - 1) / 2 + 0.85) / (CAM_Z * camera.aspect))), 54, NL > 3 ? 88 : 78);
    camera.fov = baseFov; camera.updateProjectionMatrix();
  }
  // A slow phone: lower the resolution and refresh shadows less often now (switching shadows off would rebuild every
  // shader and freeze the run), and start without shadows from the next game on.
  function lowQuality() {
    quality.low = true; store.set("run_lowq", true);
    renderer.setPixelRatio(1); renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    W = 0; resize();
  }

  /* ---------- moods, weather, particles, birds ---------- */
  function applyMood(k) {
    if (level === 2) return;     // the bazaar hall has its own fixed light, no weather
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
    for (const s of S.signMats) s.emissiveIntensity = 0.12 + cur.lamps * 0.7;
    S.lamp.intensity = cur.lamps * 45;
    S.cloudMat.opacity = cur.cloud; S.cloudMat.color.copy(S.white).lerp(cur.fog, 0.45);
    S.snowMat.opacity = cur.snow;
    const sv = cur.snow > 0.03; if (sv !== S.snowOn) { S.snowOn = sv; for (const s of S.snow) s.visible = sv; }
    S.rain.visible = cur.rain > 0.03; S.rain.material.opacity = 0.5 * cur.rain;
    S.flakes.visible = cur.flakes > 0.03; S.flakes.material.opacity = 0.95 * cur.flakes;
    S.disc.material.color.copy(cur.disc); S.disc.material.opacity = cur.discA; S.glow.material.color.copy(cur.disc); S.glow.material.opacity = cur.glow;
    S.disc.position.copy(cur.discDir).normalize().multiplyScalar(950); S.glow.position.copy(S.disc.position);
    for (const t of S.tints) { t.base = t.base || t.m.color.clone(); t.m.color.copy(t.base).lerp(cur.fog, t.k); }   // far things take on the haze colour
    if (S.mosqueMats) for (const m of S.mosqueMats) m.emissiveIntensity = 0.04 + cur.lamps * 0.85;   // floodlit at night
    if (S.waterU) {
      const u = S.waterU; u.uSky.value.copy(cur.top); u.uHor.value.copy(cur.fog).lerp(cur.bot, 0.5); u.uSunDir.value.copy(cur.discDir);
      u.uSunCol.value.copy(cur.disc); u.uSun.value = cur.discA * (1 - cur.rain); u.uLight.value = 0.3 + 0.7 * Math.min(1, cur.sun / 2.6) * (1 - 0.3 * cur.rain);
    }
    if (S.cityMat) S.cityMat.userData.glow.value = cur.lamps;
    for (const m of S.leafMats) { m.userData.base = m.userData.base || m.color.clone(); m.color.copy(m.userData.base).lerp(S.white, cur.snow * 0.7); }   // snow on the leaves
    const day = cur.stars < 0.5 && cur.rain < 0.5;
    S.flocks[0].mesh.visible = S.flocks[1].mesh.visible = day;
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
  function resetPigeon(b, z) { b.fly = false; b.side = Math.random() < 0.5 ? -1 : 1; b.x = b.side * rnd(2.8, 3.5); b.y = 0.1; b.z = z == null ? -rnd(70, 140) : z; }
  function birds(dt, ds) {
    for (const f of S.flocks) {
      if (!f.mesh.visible) continue;
      const p = f.pos, sky = f.kind === "sky", s = sky ? 0.55 : 0.3;
      for (const b of f.birds) {
        let flap;
        if (sky) { b.x += b.vx * dt; if (b.x > 46) b.x -= 92; flap = Math.sin(time * 9 + b.ph); }
        else {
          b.z += ds;
          if (b.fly) { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; flap = Math.sin(time * 24 + b.ph); }
          else {            // pecking on the kerb until the runner gets close, then the flock takes off
            flap = -0.9; b.y = 0.1 + Math.max(0, Math.sin(time * 6 + b.ph)) * 0.04;
            if (b.z > -10 && state === "play") { b.fly = true; b.vx = b.side * rnd(2, 5); b.vy = rnd(4, 7); b.vz = -rnd(1, 5); }
          }
          if (b.z > 20 || b.y > 16) resetPigeon(b);
        }
        const i = b.i * 18, wy = b.y + flap * s * 0.75, wr = s * (1 - Math.abs(flap) * 0.25), a = s * 0.45;
        for (let w = 0; w < 2; w++) {       // one triangle per wing: nose, tail, wing tip
          const o = i + w * 9, sg = w ? 1 : -1;
          if (sky) { p[o] = b.x + a; p[o + 1] = b.y; p[o + 2] = b.z; p[o + 3] = b.x - a; p[o + 4] = b.y; p[o + 5] = b.z; p[o + 6] = b.x; p[o + 7] = wy; p[o + 8] = b.z + sg * wr; }
          else { p[o] = b.x; p[o + 1] = b.y; p[o + 2] = b.z - a; p[o + 3] = b.x; p[o + 4] = b.y; p[o + 5] = b.z + a; p[o + 6] = b.x + sg * wr; p[o + 7] = wy; p[o + 8] = b.z; }
        }
      }
      f.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* ---------- obstacles and pickups ---------- */
  function take(type) {
    const pool = pools[type] || (pools[type] = []);
    let m = pool.pop();
    if (!m) { m = S.make[type](); scene.add(m); }
    m.visible = true; return m;
  }
  function drop(o) { o.m.visible = false; o.m.scale.setScalar(1); o.m.position.x = laneX(o.lane); (pools[o.type] || (pools[o.type] = [])).push(o.m); }
  function put(type, l, z, y = 0) {
    if (net && !net.host && !netApplying) return;
    const d = S.defs[type], m = take(type);
    m.position.set(laneX(l), y, z);
    objs.push({ type, def: d, kind: d.kind, hd: d.hd, val: d.val || 0, lane: l, z, y, m, ph: rnd(0, 6), x: laneX(l) });
    if (net && net.host && !netApplying) outbox.push(objs[objs.length - 1]);
  }
  function trail(l, z, n) {
    for (let i = 0; i < n; i++) put(i === n - 1 && Math.random() < 0.22 ? pick(["non", "samsa"]) : "coin", l, z + (n - 1) * 1.2 - i * 2.4, 0.95);
  }
  function arc(l, z) {     // coins along the path of a jump
    const step = speed * 0.14;
    for (let i = 0; i < 5; i++) put("coin", l, z + (2 - i) * step, 1.5 + 1.2 * (1 - Math.pow((i - 2) / 2.4, 2)));
  }
  const lanes = () => [...Array(NL).keys()].sort(() => Math.random() - 0.5);
  function zig(l, z, n) {                 // a coin line that steps across the lanes, inviting a swipe
    let d = l === 0 ? 1 : l === NL - 1 ? -1 : (Math.random() < 0.5 ? -1 : 1);
    for (let i = 0; i < n; i++) { if (i && i % 4 === 0) { if (l + d < 0 || l + d > NL - 1) d = -d; l += d; } put("coin", l, z - i * 2.4, 0.95); }
  }
  function spawnRow(z = FAR) {
    if (net && !net.host) { spawnIn = 1e9; return 60; }
    rows++;
    const lv = portalOn ? level + 1 : level;
    let gap = (lv >= 4 ? 10 + speed * 0.42 : lv >= 3 ? 11 + speed * 0.47 : 13 + speed * 0.55) + rnd(0, lv >= 3 ? 3.5 : 5);     // rows come closer together from level 3, closest by the sea
    if (pw.fly > 2.5) { spawnIn = gap; return gap; }    // the road stays empty under the carpet (it fills again just before landing)
    if (S.wagonReady && lv !== 2 && rows > 6 && dist >= nextWagon) {
      nextWagon = dist + rnd(650, 950);
      const l = Math.random() < 0.5 ? 0 : NL - 1, zc = z - 6.8;      // sized so the far lane stays clear beside it
      put("wagon", l, zc); objs[objs.length - 1].m.scale.x = l === 0 ? 1 : -1;
      put("wagonWall", l === 0 ? 1 : NL - 2, zc);
      trail(l, z + 7, 4); trail(l, zc + 1.5, 5); put("samsa", l, zc - 4.5, 0.95);
      spawnIn = gap + 15; return gap + 15;
    }
    if (lv >= 4 && rows > 4 && Math.random() < 0.35) {      // the seaside's own tricky rows
      const L = lanes();
      if (NL > 3) trail(L[3], z - 6, 7);
      if (Math.random() < 0.5) {        // roll, then jump, in the same lane, with a stall beside it: one lane free
        const d = speed * 0.85 + 4;     // room to finish the roll before the jump
        put("banner", L[0], z); put(pick(["barrier", "crates", "melons"]), L[0], z - d); put(pick(["meat", "cart"]), L[1], z - d / 2);
        trail(L[0], z - d / 2, 5); arc(L[0], z - d); trail(L[2], z - d / 2, 6);
        spawnIn = gap + d; return gap + d;
      }
      // a slalom: stalls in turn on two lanes, coins weaving between them
      put(pick(["meat", "cart"]), L[0], z); put(pick(["meat", "cart"]), L[1], z - 11); put(pick(["meat", "cart"]), L[0], z - 22);
      trail(L[1], z + 1, 4); trail(L[0], z - 11, 4); trail(L[1], z - 22, 4);
      spawnIn = gap + 22; return gap + 22;
    }
    if (rows > 4 && dist >= nextPow) {          // a power-up in its own lane, coins beside it
      nextPow = dist + rnd(380, 560);
      const ks = Object.keys(PW).filter((k) => (k !== "dash" || net) && (k !== "fly" || lv !== 2)),     // no flying carpet under the bazaar roof
      k = ks[Math.floor(Math.random() * ks.length)], l = Math.floor(Math.random() * NL);
      put("pw_" + k, l, z, 1.15); trail((l + 1) % NL, z + 4, 6);
      spawnIn = gap + 6; return gap + 6;
    }
    // one obstacle per row, so a single swipe to the side always gets past it
    const L = lanes(), r = Math.random();
    if (NL > 3) Math.random() < 0.5 ? trail(L[3], z, 6) : put(pick(["barrier", "crates", "banner"]), L[3], z);      // the 4th lane: coins or something to jump or roll
    const next = portalOn ? level + 1 : level, inside = next === 2 || next === 4;     // no cars in the bazaar or on the promenade
    const low = () => pick(["barrier", "crates", "melons", "teleshka"]), full = () => pick(inside ? ["meat", "cart"] : ["damas", "damas", "cart", "meat"]);
    if (rows < 4) { put(pick(["barrier", "crates", "sedan"]), L[0], z); trail(L[1], z, 5); }
    else if (r < 0.26) { put(low(), L[0], z); r < 0.17 ? arc(L[0], z) : trail(L[1], z, 7); if (next >= 3 && Math.random() < (next >= 4 ? 0.7 : 0.45)) put("banner", L[2], z); }
    else if (r < 0.42) { put("banner", L[0], z); trail(L[1], z, 7); if (next >= 3 && Math.random() < (next >= 4 ? 0.7 : 0.45)) put(low(), L[2], z); }
    else if (r < 0.64) { put(full(), L[0], z); const q = Math.random(); q < 0.35 ? zig(L[1], z + 6, 9) : q < 0.7 ? (trail(L[0], z + 13, 4), trail(L[1], z - 3, 5)) : trail(L[1], z, 7); if (next >= 3 && Math.random() < (next >= 4 ? 0.75 : 0.5)) put(pick(["banner", low()]), L[2], z); }
    else if (inside && r < 0.92) { put(pick(["banner", low()]), L[0], z); arc(L[0], z); trail(L[1], z, 4); }
    else if (r < 0.78) { put("sedan", L[0], z); for (let i = 0; i < 3; i++) put("coin", L[0], z + 1 - i * 1.2, 2.3); trail(L[1], z, 4); }
    else if (r < 0.92) {        // run over the cars: a plank ramp, then two cars bumper to bumper
      put("ramp", L[0], z); put("sedan", L[0], z - 3.8); put("sedan", L[0], z - 8.05);
      for (let i = 0; i < 6; i++) put("coin", L[0], z - 2.4 - i * 1.5, 2.3);
      trail(L[1], z - 4, 4); gap += 9;
    } else { zig(L[0], z, 10); put(pick(["non", "samsa"]), L[2], z - 5, 0.95); gap += 6; }
    spawnIn = gap;
    return gap;
  }
  // would this obstacle hit the runner in their current pose?
  function hits(o) {
    if (o.def.wall) return pw.fly <= 0;
    if (o.kind === "tube") return false;
    if (pw.fly > 0 || (pw.jump > 0 && py - gy > 2.2 && o.kind !== "plat")) return false;
    if (dbl && py - gy > 0.9 && o.kind !== "plat") return false;      // after a ninja jump nothing can stop him
    if (o.kind === "full") return py < (o.def.top || 99);
    if (o.kind === "low") return py < 0.5;
    if (o.kind === "high") return !(rollT > 0 || lowT > 0);
    return o.kind === "plat" && !o.on && py < (o.def.clear || o.def.front - 0.45);
  }
  // height of whatever is under the runner's feet: the road, a ramp or a car roof
  function groundAt() {
    let g = 0;
    for (const o of objs) {
      const d = o.def;
      if (!d.h || o.gone || Math.abs(laneX(o.lane) - px) > 0.95 || o.z + o.hd < -0.25 || o.z - o.hd > 0.25) continue;
      const h = d.h(clamp(-o.z / o.hd, -1, 1));
      if (o.kind === "ramp" || o.on || py >= h - 0.8) { if (h > g) g = h; if (o.kind === "plat") o.on = true; }
    }
    return g;
  }

  /* ---------- player actions ---------- */
  function doJump() {
    if (inTube) return;                 // under the wagon's roof
    if (!grounded) {
      if (dbl) { jumpBuf = 0.18; return; }       // remembered, fires on landing
      dbl = true; vy = Math.max(JUMP * 0.95, Math.sqrt(2 * GRAV * Math.max(0, 3.4 - (py - gy)))); ninjaT = 0.6;   // always high enough to clear the tallest stall or banner ninjaK = (ninjaK + 1) % 4; flipT = 0; jumpAt = time;
      sfx("jump", 1.3); buzz("medium"); return;
    }
    const over = gy > 0.3 || objs.some((o) => o.lane === lane && !o.gone && o.kind !== "pick" && o.kind !== "ramp" && o.z < 0 && o.z > -(speed * 0.6 + 2));
    vy = pw.jump > 0 ? JUMP * 1.4 : JUMP; py += 0.03; grounded = false; jumpAt = time; jumpBuf = 0; rollT = 0;
    if (pw.jump > 0) burst(px, 0.2, 0, "#7CF29A", 12, 2.6);
    if (over && Math.random() < 1 / 3) flipT = 0.55;      // one jump in three off a car or over an obstacle is a quick back flip
    sfx("jump"); buzz("light");
  }
  function startRoll() { rollT = ROLL; rollAt = time; sfx("roll"); buzz("light"); }
  function doRoll() {
    if (trick) return;
    if (!grounded) { vy = Math.min(vy, -20); fastFall = true; }   // dive, then roll on landing
    else if (rollT < 0.15) startRoll();
  }
  function move(d) {
    const nl = clamp(lane + d, 0, NL - 1);
    if (nl === lane) return;
    const over = (o) => !o.gone && o.z + o.hd > -0.9 && o.z - o.hd < 0.9;
    if (pw.fly <= 0 && objs.some((o) => o.kind === "tube" && (o.lane === lane || o.lane === nl) && over(o))) return graze(d);   // the wagon's walls
    const side = invuln <= 0 && objs.some((o) => o.kind !== "pick" && o.kind !== "ramp" && o.kind !== "tube" && o.lane === nl && over(o) && hits(o));
    if (side) return graze(d);
    prevLane = lane; lane = nl; laneAt = time;
    sfx("swish"); buzz("light");
  }
  // double tap: a flip in the air, or a spinning hop from the ground
  function doTrick() {
    if (state !== "play" || trick || rollT > 0) return;
    const air = !grounded, name = air ? AIR[airIdx++ % AIR.length] : GROUND[gndIdx++ % GROUND.length], dur = air ? 0.72 : 0.54;
    if (air) {                // stay up long enough to finish the move
      const need = dur * 1.08, h = Math.max(0.01, py - gy), left = (vy + Math.sqrt(vy * vy + 2 * GRAV * h)) / GRAV;
      if (left < need) vy = GRAV * need / 2 - h / need;
    } else { vy = 7.4; py += 0.03; grounded = false; jumpAt = time; }
    cineSide = px > 0.5 ? -1 : px < -0.5 ? 1 : Math.random() < 0.5 ? -1 : 1;
    trick = { name, t: 0, dur, air, side: cineSide };
    wave = null; sfx("trick"); buzz("medium");
  }
  function endTrick() {
    const t = trick; trick = null; safe = 0.4; coins += t.air ? 5 : 2; feed(0.03);
    reward(`${LABEL[t.name]} +${t.air ? 5 : 2}`);
  }
  function graze(d) {
    px += d * 0.55; speed = Math.max(V0 * 0.8, speed * 0.88); shake = 0.3; stumbleT = 0.95;
    sfx("bump"); buzz("warning", 40); buzz("rigid");
    burst(px + d * 0.5, 1.0, 0, "#FFFFFF", 8, 2.5); pop("Ehtiyot bo'ling!", "bad");
  }
  // inside the wagon: the camera follows him in, the lamps glow, star dust drifts; leaving it pays a bonus
  function tube(o) {
    const inside = o.lane === lane && pw.fly <= 0 && o.z + o.hd > -0.2 && o.z - o.hd < 0.2;
    if (inside && inTube !== o) { inTube = o; o.been = true; sfx("swish"); buzz("medium"); burst(px, 1.4, -2, "#FFE08A", 18, 2.6); }
    if (!inside && inTube === o) {
      inTube = null;
      if (o.z - o.hd > 0) { offer("wagon", 6.8); coins += 20; feed(0.2); punch = 0.5; reward("Yulduzli vagon! +20"); burst(px, 1.3, -1, "#FFD45A", 30, 4.5); burst(px, 1.8, -1, "#9AD8FF", 20, 3.5); }
    }
    if (o.z - o.hd > 0.4) o.done = true;
  }
  function nearMiss() {
    coins += 3; nmSlow = 0.22; feed(0.02); if (!trick) stumbleT = 0.95;
    sfx("near"); buzz("medium"); burst(px, 1.2, 0, "#FFE08A", 10, 3); pop("Zo'r! +3", "gold"); bump();
  }
  function collect(o) {
    if (o.def.pw) { o.gone = true; return power(o.def.pw); }
    o.fly = 0; o.gone = true; const v = o.val * (pw.x2 > 0 ? 2 : 1); coins += v; feed(o.val > 1 ? (o.val >= 10 ? 0.18 : 0.1) : 0.009);
    combo = time - comboAt < 0.6 ? combo + 1 : 1; comboAt = time;
    buzz("select"); bump();
    burst(laneX(o.lane), o.y, o.z, "#FFD45A", o.val > 1 ? 12 : 5, 2.4);
    if (o.val > 1) { buzz("soft"); pop(`+${v}`, "gold"); }
    if (combo === 10 || combo === 20) { coins += 5; reward(`Combo x${combo}! +5`); }
  }
  function power(k) {
    if (k === "dash") { offT = Math.min(1, offT + 1, fr ? fr.o + 1 : 1); feed(0.1); sfx("trick"); reward("Bir qadam oldinga!"); return; }
    pw[k] = PW[k][0]; feed(0.1);
    if (k === "fly") {                // up on the flying carpet, with a long line of coins in the air
      vy = 0; rollT = 0; trick = null; ninjaT = flipT = 0;
      let l = lane;
      const gapC = Math.max(3, speed * 0.2), z0 = -(speed * 0.8 + 8);      // starts once he is up there
      for (let i = 0; i < 28; i++) { if (i % 8 === 7) l = clamp(l + (Math.random() < 0.5 ? -1 : 1), 0, NL - 1); netApplying = true; put("coin", l, z0 - i * gapC, FLY_H + 1.0); netApplying = false; }
    }
    sfx("trick"); reward(PW[k][1] + "!"); burst(px, py + 1.2, 0, POWC[k], 22, 3.6);
  }
  function shieldHit() {              // the shield takes the hit instead of a heart
    pw.shield = 0; invuln = 1.4; shake = 0.35; speed = Math.max(V0, speed * 0.92);
    sfx("bump"); buzz("warning"); flash("#7CC6FF", 0.35); burst(px, py + 1.1, 0, "#9AD8FF", 30, 4.2); pop("Qalqon saqladi!", "gold");
  }
  function act(dir) {
    if (dir === "T") return doTrick();
    if (state !== "play") return;
    if (trick) { trick = null; safe = 0.4; }
    if (pw.fly > 0 && (dir === "U" || dir === "D")) return;     // on the carpet only left and right
    if (dir === "D" && net && grounded && time - lastDown < 0.42) { lastDown = -9; const t = Math.max(-1, offT - 1, fr ? fr.o - 1 : -1); if (t !== offT) { offT = t; pop("Bir qadam orqaga"); buzz("light"); } }
    else if (dir === "D") lastDown = time;
    if (dir === "L") move(-1); else if (dir === "R") move(1); else if (dir === "U") doJump(); else doRoll();
  }
  function onKey(e) {
    if (e.key === "Escape" || e.key === "p") return pause();
    const k = { ArrowLeft: "L", a: "L", ArrowRight: "R", d: "R", ArrowUp: "U", w: "U", " ": "U", ArrowDown: "D", s: "D", f: "T", Enter: "T" }[e.key];
    if (k) { e.preventDefault(); act(k); }
  }
  function bindInput() {
    window.addEventListener("keydown", onKey);
    const cv = el.cv; let id = null, sx = 0, sy = 0, x0 = 0, y0 = 0, t0 = 0, lastDir = "";
    cv.addEventListener("pointerdown", (e) => { RunAudio.wake(); id = e.pointerId; sx = x0 = e.clientX; sy = y0 = e.clientY; t0 = performance.now(); lastDir = ""; try { cv.setPointerCapture(id); } catch {} });
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
    cv.addEventListener("pointerup", (e) => {
      if (e.pointerId !== id) return; id = null;
      const now = performance.now();
      if (lastDir || now - t0 > 260 || Math.hypot(e.clientX - x0, e.clientY - y0) > 14) return;     // not a tap
      if (now - lastTap < 340) { lastTap = 0; doTrick(); } else lastTap = now;
    });
    cv.addEventListener("pointercancel", () => { id = null; });
    cv.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }
  function onHide() { if (document.hidden) { pause(); saveRun(); } }
  // plays the game by itself: used for testing
  function autopilot() {
    const ahead = (l, win) => objs.filter((o) => o.kind !== "pick" && o.kind !== "ramp" && o.kind !== "tube" && !o.gone && !o.on && o.lane === l && o.z - o.hd < 0.5 && o.z + o.hd > -win).sort((a, b) => b.z - a.z);
    const win = 3 + speed * 0.5, here = ahead(lane, win)[0];
    if (!here || py > 0.6) return;
    if (here.kind === "full" || (here.kind === "plat" && here.def.front > 1.5)) {
      const ok = [lane - 1, lane + 1].filter((l) => l >= 0 && l <= NL - 1 && !ahead(l, win).some((o) => o.kind === "full"));
      if (ok.length) move(ok[0] - lane);
    } else if (-here.z - here.hd < speed * 0.12 + 0.6) {
      if (here.kind === "high") { if (rollT <= 0 && grounded) startRoll(); } else if (grounded) doJump();
    }
  }

  /* ---------- small story moments ---------- */
  function startEat() {         // a seller throws a bag of apples; the runner drops the bag but keeps one apple
    const s = S.stalls.find((m) => m.position.z > -18 && m.position.z < -11);
    if (!s) return;
    nextEat = runT + rnd(30, 45);
    eat = { t: 0, side: s.userData.side, sx: s.userData.side * 5.3, sz: s.position.z, got: false, drop: false, vy: 0 };
    s.userData.calls = true; S.bag.visible = true; S.bag.rotation.set(0, 0, 0);
  }
  function eatStep(dt, ds) {
    const e = eat, bag = S.bag, hx = px + 0.3, hy = py + 1.15, hz = -0.3;
    e.t += dt; e.sz += ds;
    if (e.t < 0.55) { const q = e.t / 0.55; bag.position.set(e.sx + (hx - e.sx) * q, 1.3 + (hy - 1.3) * q + Math.sin(q * Math.PI) * 1.2, e.sz + (hz - e.sz) * q); bag.rotation.x = q * 5; }
    else if (e.t < 1.0) {
      if (!e.got) { e.got = true; coins += 10; reward("Olma! +10"); S.apple.visible = true; }
      bag.position.set(hx, hy - 0.1, hz); bag.rotation.x = 0;
    } else {
      if (!e.drop) { e.drop = true; e.vy = 1.2; burst(hx, hy, hz, "#D7372F", 6, 1.6); }
      if (bag.visible) { e.vy -= 16 * dt; bag.position.y = Math.max(0.15, bag.position.y + e.vy * dt); bag.position.z += ds; if (bag.position.y > 0.16) bag.rotation.x += dt * 7; if (bag.position.z > GONE) bag.visible = false; }
      if (Math.random() < dt * 3) sfx("bite");
    }
    if (e.t > 3.1) { eat = null; S.apple.visible = false; }
  }
  function guardStep(raw) {     // the watchman from the opening scene chases for a moment, then falls behind
    if (guardT < 0) return;
    guardT += raw;
    const g = S.guard, e = Math.min(1, guardT / 0.9), z = guardT < 2.3 ? 10 - 5.6 * (1 - Math.pow(1 - e, 2)) : 4.4 + (guardT - 2.3) * 7;
    if (z > 15) { g.g.visible = false; guardT = -1; return; }
    guardX += (px - 0.5 - guardX) * (1 - Math.exp(-raw * 2));
    g.g.visible = true; g.g.position.set(guardX, 0, z);
    runPose(g, guardT * 13, true);
  }
  // A sprint, as keyframes over one stride (8 steps; p = 0: the left foot lands in front).
  // Hips swing far forward with a high knee, the back leg kicks up behind, both feet leave the ground between steps.
  const RUN_HIP = [0.55, 0.25, -0.1, -0.45, -0.6, -0.2, 0.55, 0.9], RUN_KNEE = [0.3, 0.55, 0.45, 0.4, 0.9, 1.9, 1.75, 1.0];
  const loopKey = (k, p) => {        // smooth looping curve through the keys
    const n = k.length, f = (((p % 1) + 1) % 1) * n, i = Math.floor(f), t = f - i;
    const a = k[(i - 1 + n) % n], b = k[i], c = k[(i + 1) % n], d = k[(i + 2) % n];
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  };
  function runCycle(ph) {
    const p = ph / (Math.PI * 2), hl = loopKey(RUN_HIP, p), hr = loopKey(RUN_HIP, p + 0.5);
    return {
      hl, hr, kl: loopKey(RUN_KNEE, p), kr: loopKey(RUN_KNEE, p + 0.5),
      sl: -hl * 0.85 + 0.1, sr: -hr * 0.85 + 0.1, fl: 1.45 + 0.3 * Math.sin(ph), fr: 1.45 - 0.3 * Math.sin(ph),     // arms pump against the legs
      lift: 0.07 * (0.5 + 0.5 * Math.cos(4 * Math.PI * (p - 0.47))), twist: 0.08 * Math.sin(ph),                   // highest in the flight phase
    };
  }
  function runPose(r, ph, fist) {
    const rc = runCycle(ph);
    r.hL.rotation.x = rc.hl; r.hR.rotation.x = rc.hr; r.kL.rotation.x = -rc.kl; r.kR.rotation.x = -rc.kr;
    r.sL.rotation.x = rc.sl; r.eL.rotation.x = rc.fl; r.sR.rotation.x = fist ? 2.6 : rc.sr; r.eR.rotation.x = fist ? 0.6 + Math.sin(ph * 1.7) * 0.4 : rc.fr;
    r.body.rotation.x = -0.22; r.pivot.position.y = HIP + rc.lift;
  }
  function scenery(dt, ds, playing) {
    for (const [t, per] of S.scroll) t.offset.y = (t.offset.y + ds / per) % 1;
    if (S.out.visible) for (const o of S.scn) {
      o.position.z += ds;
      if (o.position.z > C.BACK) {        // comes round again further up the street, slightly changed
        o.position.z -= C.LOOP; const u = o.userData;
        if (u.arm) { u.calls = Math.random() < 0.15; u.hi = false; u.bub.material = pick(S.bubbleMats); }
        if (u.gate) { u.n = (u.n + 1) % S.gateMats.length; u.gate.material = S.gateMats[u.n]; }
      }
    }
    if (S.in.visible) for (const o of S.inScn) { o.position.z += ds; if (o.position.z > C.BACK) o.position.z -= C.LOOP; }
    if (S.sea.visible) {
      for (const o of S.seaScn) { o.position.z += ds; if (o.position.z > C.BACK) o.position.z -= C.LOOP; }
      const u = S.waterU; u.uTime.value = time; u.uOff.value = (u.uOff.value + ds) % 6283.2;
      for (const b of S.boats) {
        const d = b.userData; b.position.z += ds * 0.55 + d.v * dt * 0.3;
        if (b.position.z > 60) { b.position.z -= 960; b.position.x = -rnd(28, 140); }
        b.position.y = -0.75 + Math.sin(time * 1.3 + d.ph) * 0.07; b.rotation.z = Math.sin(time * 1.1 + d.ph) * 0.05; b.rotation.x = Math.sin(time * 0.9 + d.ph * 2) * 0.03;
      }
      for (const c of S.cities) { c.position.z += ds * 0.4; if (c.position.z > 200) c.position.z -= 1200; }
    }
    for (const gate of [S.portal]) {
      if (!gate.visible) continue;
      gate.position.z += ds;
      if (portalOn && !trans && gate.position.z > CAM_Z - 3) trans = { t: 0, n: level + 1, done: false };     // the camera is about to pass through the gate
      if (gate.position.z > 60) gate.visible = false;
    }
    if (S.wall.visible) { S.wall.position.z += ds; if (S.wall.position.z > 24) S.wall.visible = false; }
    for (const s of S.stalls) {            // sellers wave and call out as the runner comes past
      const z = s.position.z, u = s.userData, on = u.calls && z > -32 && z < 5 && state !== "menu";
      u.k += ((on ? 1 : 0) - u.k) * (1 - Math.exp(-dt * 8));
      u.arm.rotation.z = -0.12 - u.k * (2.25 + Math.sin(time * 9 + u.ph) * 0.4);
      u.bub.visible = on && z > -26 && z < 2;
      if (on && !u.hi && z > -3) { u.hi = true; if (time - lastWave > 6 && free()) { wave = { t: 0, side: u.side }; lastWave = time; } }
    }
    for (const w of S.walkers) {
      const g = w.g; g.position.z += ds + w.v * dt;
      if (g.position.z > C.BACK) g.position.z -= C.LOOP; else if (g.position.z < C.BACK - C.LOOP) g.position.z += C.LOOP;
      const s = Math.sin(time * 7 + w.ph);
      g.position.y = 0.07 + Math.abs(s) * 0.03;
      if (w.legs[0]) { w.legs[0].rotation.x = s * 0.6; w.legs[1].rotation.x = -s * 0.6; }
      w.arms[0].rotation.x = -s * 0.5; w.arms[1].rotation.x = s * 0.5;
    }
    for (const c of S.clouds) { c.position.x += dt * 1.5; if (c.position.x > 380) c.position.x = -380; }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i]; o.z += ds;
      if (o.fly != null) {             // a taken coin jumps up, spins fast and shrinks away
        o.fly += dt; const q = o.fly / 0.24;
        o.m.position.set(o.x + (px - o.x) * q, o.y + q * 1.6, o.z * (1 - q)); o.m.scale.setScalar(Math.max(0.01, 1 - q * q)); o.m.rotation.y = time * 18;
        if (q >= 1) { o.m.scale.setScalar(1); o.fly = null; drop(o); objs.splice(i, 1); }
        continue;
      }
      if (o.kind === "tube") {
        const k = clamp((o.z + o.hd + 45) / 18, 0, 1), e = k * k * (3 - 2 * k);
        const f = o.m.getObjectByName("doorF"), b = o.m.getObjectByName("doorB");
        if (f) f.rotation.y = -1.75 * e; if (b) b.rotation.y = 1.75 * e;
        if (S.wagonGlow) S.wagonGlow.opacity = 0.75 * e * (1 - 0.65 * tubeK);
      }
      if (o.kind === "pick") {
        o.m.rotation.y = time * 4 + o.ph;
        if (o.def.pw) o.m.position.y = o.y + Math.sin(time * 3 + o.ph) * 0.15;
      }
      o.m.position.z = o.z;
      if (o.gone || o.z > GONE) { drop(o); objs.splice(i, 1); }
    }
  }

  /* ---------- frame update ---------- */
  function update(dt, raw) {
    time += dt;
    let v = 0;
    if (state === "intro" && (introT += raw) > 0.45) state = "play";
    const playing = state === "play";
    if (playing) v = speed * pace;
    if (state === "intro" || playing) introK = Math.max(0, introK - raw / 0.9);
    if (state === "menu") {       // the picture on the wall slowly grows while the menu is open
      menuT += raw;
      const p = Math.min(0.6, 0.36 + menuT * 0.02);
      if (Math.abs(p - paintP) > 0.006) { paintP = p; S.paint(p); }
      if (Math.random() < raw * 10) burst(-3.36, 1.45 + rnd(-0.55, 0.55), 2.4 - 4.4 * p, S.theme, 1, 0.45);
    }
    let ds = v * dt;
    if (net && playing) ds += netAdjust(dt);
    if (playing) {
      runT += dt;
      const cap = vcap();
      if (net && !net.host && hostB) speed = hostB.v; else if (speed < cap) speed = Math.min(cap, speed + dt * (level >= 3 ? 0.55 : 0.05 + 0.3 * (1 - (speed - V0) / (cap - V0))));   // gentle at first, a steady push from level 3
      pace = 1;                      // full speed straight through the gates
      dist += v * dt;
      if (calm > 0 && (calm -= dt) <= 0) fillRoad();
      if (pw.fly <= 0 && calm <= 0 && !trans) energy -= dt * (DRAIN[level] || DRAIN[4]);
      const band = energy < 0.15 ? 2 : energy < 0.3 ? 1 : 0;
      if (band > enWarn) { buzz(band === 2 ? "warning" : "light"); if (band === 2) pop("Kuch kam! Tanga yig'ing", "bad"); }
      enWarn = band;
      if (energy <= 0) { energy = 0; pop("Kuch tugadi!", "bad"); return crash(); }
      if (dist >= nextBoost) boost();
      if (LEVELS[level + 1] && !portalOn && dist >= LEVELS[level + 1][0] - 150) openPortal();
      px += (laneX(lane) - px) * (1 - Math.exp(-dt * 16));
      for (const k in pw) if (pw[k] > 0 && (pw[k] -= dt) <= 0) { pw[k] = 0; if (k === "fly") { invuln = Math.max(invuln, 1.6); vy = 0; } }
      gy = groundAt();
      flyK += ((pw.fly > 0 ? 1 : 0) - flyK) * (1 - Math.exp(-dt * 3));
      if (pw.fly > 0) { grounded = false; dbl = true; vy = 0; py += (FLY_H - py) * (1 - Math.exp(-dt * 5)); }
      else if (py > gy + 0.02 || vy > 0) {
        grounded = false; vy -= GRAV * dt; py += vy * dt;
        if (py <= gy && vy <= 0) { py = gy; vy = 0; grounded = true; dbl = false; burst(px, gy + 0.1, 0, "#D8C7A8", 6, 1.6); if (fastFall) { fastFall = false; startRoll(); } }
      } else { grounded = true; dbl = false; py = py < gy ? Math.min(gy, py + 12 * dt) : gy; }
      if (rollT > 0 && (rollT -= dt) <= 0) { rollT = 0; lowT = 0.1; }
      if (lowT > 0) lowT -= dt;
      if (jumpBuf > 0) { jumpBuf -= dt; if (grounded) doJump(); }
      if (invuln > 0) invuln -= dt;
      if (safe > 0) safe -= dt;
      momentWatch();
      if (ninjaT > 0) ninjaT -= dt;
      if (flipT > 0) flipT -= dt;
      if (trick && ((trick.t += dt) >= trick.dur || (grounded && trick.t > 0.12))) endTrick();
      if ((spawnIn -= v * dt) <= 0) spawnRow();
      if (auto) autopilot();
      if (runT > nextEat && free()) startEat();
    } else if (crashT > 0 && py > 0) py = Math.max(0, py - 12 * dt);
    if (crashT > 0) crashT += dt;
    if (stumbleT > 0) stumbleT -= dt;
    if (wave && (wave.t += dt) > 0.9) wave = null;
    if (eat) eatStep(dt, ds); else if (S.bag.visible) { S.bag.position.z += ds; if (S.bag.position.z > GONE) S.bag.visible = false; }
    guardStep(raw);
    scenery(dt, ds, playing);
    if (state === "play") collide();

    // Istanbul is always at golden hour
    const want = level === 3 ? 1 : moodOverride == null ? slotMood() : moodOverride;
    if (want !== moodIdx) { moodIdx = want; if (playing && level === 1) pop(MOODS[want].name); }
    applyMood(1 - Math.exp(-raw * 1.4));
    tubeK += ((inTube ? 1 : 0) - tubeK) * (1 - Math.exp(-raw * 6));
    if (tubeK > 0.01) {                // warm light inside the wagon
      S.lamp.position.set(px, 2.2, -3); S.lamp.intensity = Math.max(S.lamp.intensity, tubeK * 38);
      if (playing && Math.random() < raw * 22) burst(px + rnd(-0.6, 0.6), rnd(0.4, 2.2), -rnd(1, 7), Math.random() < 0.5 ? "#FFE08A" : "#FFFFFF", 1, 0.5);
    } else S.lamp.position.set(0, 3.4, -3);
    weather(dt, ds); particles(dt, ds); birds(dt, ds); pose(dt); cam(raw);
    const fx = Math.round((playing ? clamp((speed - 28) / 14, 0, 0.3) + punch * 0.3 : 0) * 50) / 50;   // speed lines, kept faint
    if (fx !== speedFx) { speedFx = fx; el.speed.style.opacity = fx; }
    if (trans) fadeStep(raw);
    if (ar && ar.on) arApply();
    if (state === "count") countStep(raw);
    if (net) { friendStep(raw); netTick(); }
    if (playing && (saveT += raw) > 2) { saveT = 0; saveRun(); }
    hud();
  }
  function collide() {
    for (const o of objs) {
      if (o.gone || o.done || o.kind === "ramp") continue;
      if (o.kind === "tube") { tube(o); continue; }
      const dx = Math.abs(laneX(o.lane) - px);
      if (o.kind === "pick") { if (Math.abs(o.z) < 1.1 && Math.abs(o.x - px) < 0.95 && Math.abs(o.y - (py + 0.9)) < 1.25) collect(o); continue; }
      const near = o.z + o.hd > -0.4 && o.z - o.hd < 0.4;
      if (near && !o.seen) {
        o.seen = true;       // a last-moment jump, roll or dodge counts as a near miss
        o.nm = (o.lane === lane && ((o.kind === "low" && time - jumpAt < 0.16) || (o.kind === "high" && time - rollAt < 0.14))) || (o.kind === "full" && o.lane === prevLane && o.lane !== lane && time - laneAt < 0.26);
      }
      if (near && dx < 0.85 && invuln <= 0 && safe <= 0 && !trick && hits(o)) return pw.shield > 0 ? shieldHit() : crash();
      if (o.nm && !o.snap && Math.abs(o.z) < o.hd + 0.3) o.snap = takeSnap("near");
      if (o.z - o.hd > 0.4) { o.done = true; if (o.nm) { nearMiss(); offer("near", 6.5, o.snap); } }
    }
  }
  function pose(dt) {
    const A = P, k = 1 - Math.exp(-dt * 22), menu = state === "menu", startle = state === "intro" && introT < 0.2;
    A.phase += dt * (state === "play" || state === "intro" ? 6 + speed * 0.4 : 0);
    // hips, knees, shoulders, forearms (f); z = arms spread sideways; hy/hx = head turn and tilt
    const rc = runCycle(A.phase);
    let hl = rc.hl, hr = rc.hr, kl = rc.kl, kr = rc.kr;
    let sl = rc.sl, sr = rc.sr, fl = rc.fl, fr = rc.fr, zl = -0.12, zr = 0.12;
    let lean = -0.22, pivY = HIP + rc.lift, hy = 0, hx = 0, twist = rc.twist, wob = 0, pz = 0;
    let fx = 0, fyaw = 0, fz = 0;      // whole-body flips: applied directly, not eased
    const busy = crashT > 0 || trick || rollT > 0 || ninjaT > 0 || flipT > 0;
    if (crashT > 0) {                  // knocked onto the back, legs in the air
      const e = 1 - Math.pow(1 - clamp(crashT / 0.4, 0, 1), 2);
      fx = 1.4 * e; pivY = HIP * (1 - 0.67 * e); pz = 1.1 * e; lean = 0;
      hl = 0.9; hr = 0.5; kl = 0.7; kr = 0.4; sl = 2.7; sr = 2.4; zl = -0.5; zr = 0.5; fl = 0.3; fr = 0.5;
    } else if (trick) {
      const q = clamp(trick.t / trick.dur, 0, 1), e = q * q * (3 - 2 * q), tuck = Math.sin(Math.PI * q), n = trick.name, turn = Math.PI * 2 * e;
      pivY = HIP;
      if (n === "salto" || n === "oldinga") { fx = n === "salto" ? turn : -turn; hl = hr = 0.3 + 1.6 * tuck; kl = kr = 0.3 + 1.9 * tuck; sl = sr = 2.6 - 1.5 * tuck; fl = fr = 0.3 + 1.5 * tuck; lean = -0.1 - 0.35 * tuck; }
      else if (n === "twist") { fx = turn; fyaw = turn; hl = hr = 0.1; kl = kr = 0.15; sl = sr = 0.9; fl = fr = 2.2; zl = 0.4; zr = -0.4; lean = 0; }
      else { fyaw = turn * trick.side; hl = 0.6; kl = 1.1; hr = -0.1; kr = 0.2; zl = -1.4; zr = 1.4; sl = sr = 0.2; fl = fr = 0.3; lean = 0; }
    } else if (ninjaT > 0) {           // ninja jump: four poses in turn
      pivY = HIP;
      if (ninjaK === 0) { fx = -Math.PI * 2 * (1 - ninjaT / 0.6); hl = hr = 1.8; kl = kr = 2.1; sl = sr = 1.2; fl = fr = 1.8; lean = -0.4; }   // tucked front flip
      else if (ninjaK === 1) { hl = hr = 1.4; kl = kr = 2.0; sl = sr = 2.9; zl = -0.55; zr = 0.55; fl = fr = 0.1; lean = 0.05; }               // arms up in a V, knees tucked
      else if (ninjaK === 2) { hl = hr = 1.5; kl = kr = 1.9; sl = sr = 0.5; zl = -1.35; zr = 1.35; fl = fr = 0.6; lean = -0.15; }             // arms out wide, crouched in the air
      else { hl = 1.7; kl = 2.0; hr = -0.7; kr = 0.5; sl = sr = -0.9; zl = -0.25; zr = 0.25; fl = fr = 0.3; lean = -0.35; }                    // flying knee, arms swept back
    } else if (flipT > 0) {            // quick back flip
      fx = Math.PI * 2 * (1 - flipT / 0.55); pivY = HIP; lean = -0.2;
      hl = hr = 1.7; kl = kr = 2.0; sl = sr = 2.2; fl = fr = 1.2;
    } else if (rollT > 0) {            // tucked forward somersault
      fx = -Math.PI * 2 * (1 - rollT / ROLL); pivY = HIP * 0.72 + (A.reach || 0.9) * 0.66 * Math.max(0, -Math.cos(fx - 1)); lean = -0.9;   // rises while he is upside down, so his head clears the ground
      hl = hr = 1.9; kl = kr = 2.2; sl = sr = 1.3; fl = fr = 1.9;
    } else if (menu) {                 // painting the wall, glancing over the shoulder now and then
      hl = hr = 0; kl = kr = 0.05; lean = -0.03; pivY = HIP; sl = 0.1; fl = 0.3;
      sr = 1.75 + Math.sin(time * 5) * 0.3; fr = 0.55 + Math.sin(time * 5 + 1) * 0.25; zr = 0.15 + Math.sin(time * 2.3) * 0.3; hy = time % 6 > 5.2 ? 1.2 : 0;
    } else if (startle) {
      hl = hr = 0; kl = kr = 0.1; lean = 0; pivY = HIP + 0.1; sl = sr = 2.5; zl = -0.6; zr = 0.6; fl = fr = 0.4; hy = 1.3;
    } else if (pw.fly > 0 && state === "play") {
      pivY = HIP * 0.62; lean = -0.12 + Math.sin(time * 2.4) * 0.05; hl = hr = 1.45; kl = kr = 2.3; sl = sr = 0.5; zl = -1.25; zr = 1.25; fl = fr = 0.35; twist = Math.sin(time * 1.7) * 0.12;
    } else if (!grounded && state === "play") {
      pivY = HIP; lean = -0.06;
      if (vy > 0) { hl = 1.15; kl = 1.35; hr = -0.55; kr = 1.2; sl = 2.1; sr = 1.9; zl = -0.3; zr = 0.3; fl = fr = 0.5; }
      else { hl = 0.5; kl = 0.5; hr = -0.2; kr = 0.6; sl = 0.4; sr = 0.4; zl = -1.0; zr = 1.0; fl = fr = 0.4; }
    }
    if (!busy && state === "play") {
      if (stumbleT > 0) {              // looks back over the shoulder and shakes a fist
        const e = Math.sin(Math.PI * clamp(1 - stumbleT / 0.95, 0, 1));
        hy = -2.3 * e; twist = -0.55 * e; wob = Math.sin(time * 26) * 0.1 * e;
        sr += (0.3 - sr) * e; zr = 0.1 + 2.25 * e; fr += (0.7 + 0.5 * Math.sin(time * 34) - fr) * e;
      } else if (eat) {                // catch the bag, then eat the apple; a quick look and a wave of thanks
        if (eat.t < 0.55) { sr = 1.7; fr = 0.4; zr = 0.2; hy = -eat.side * 0.9; }
        else { sr = 1.25; fr = 2.15 + Math.sin(time * 9) * 0.22; zr = 0.22; if (eat.t > 1.3 && eat.t < 2.1) { hy = -eat.side; zl = -2.2 - Math.sin(time * 20) * 0.3; sl = 0; fl = 0.4; } }
      } else if (wave) {               // "see you later" to a seller who called out
        const e = Math.sin(Math.PI * clamp(wave.t / 0.9, 0, 1)), w = 2.3 * e + Math.sin(time * 20) * 0.25 * e;
        hy = -wave.side * e;
        if (wave.side > 0) { zr = 0.1 + w; sr *= 1 - e; fr += (0.5 - fr) * e; } else { zl = -0.1 - w; sl *= 1 - e; fl += (0.5 - fl) * e; }
      }
    }
    const dx = laneX(lane) - px, R = (o, a, v) => { o.rotation[a] += (v - o.rotation[a]) * k; };
    R(A.hL, "x", hl); R(A.hR, "x", hr); R(A.kL, "x", -kl); R(A.kR, "x", -kr);
    R(A.sL, "x", sl); R(A.sR, "x", sr); R(A.sL, "z", zl); R(A.sR, "z", zr); R(A.eL, "x", fl); R(A.eR, "x", fr);
    R(A.body, "x", lean); R(A.head, "y", hy); R(A.head, "x", hx);
    A.tilt += (-dx * 0.2 + wob - A.tilt) * k; A.yaw += (-dx * 0.22 + twist - A.yaw) * k;
    A.pivot.rotation.set(fx, A.yaw + fyaw, A.tilt + fz);
    A.pivot.position.y += (pivY - A.pivot.position.y) * k;
    A.g.rotation.y += ((menu || (state === "intro" && introT < 0.12) ? Math.PI / 2 : 0) - A.g.rotation.y) * (1 - Math.exp(-dt * 14));
    A.g.position.set(px, py, A.g.position.z + (pz - A.g.position.z) * k);
    A.g.visible = invuln <= 0 || Math.floor(time * 16) % 2 === 0;
    S.can.visible = menu || startle; S.bottle.visible = false;
    S.blob.position.set(px, gy + 0.02, A.g.position.z); S.blob.scale.setScalar(Math.max(0.4, 1 - (py - gy) * 0.3));
    S.carpet.visible = flyK > 0.05 && pw.fly > 0; if (S.carpet.visible) { S.carpet.position.set(px, py + 0.04, A.g.position.z); S.carpet.rotation.set(Math.sin(time * 3.1) * 0.06, A.yaw * 0.5, Math.sin(time * 2.3) * 0.08 - (laneX(lane) - px) * 0.15); }
    S.shield.visible = pw.shield > 0 && (pw.shield > 2.5 || Math.floor(time * 8) % 2 === 0); if (S.shield.visible) { S.shield.position.set(px, py + 0.95, A.g.position.z); S.shield.rotation.y = time; }
    S.dizzy.visible = crashT > 0.35;
    if (S.dizzy.visible) { S.dizzy.position.set(px, 0.9, A.g.position.z + 1.0); S.dizzy.rotation.y = time * 5; }
  }
  function cam(raw) {
    const k = 1 - Math.exp(-raw * 9), sm = (x) => x * x * (3 - 2 * x);
    camX += (px * 0.62 - camX) * k;
    shake = Math.max(0, shake - raw * 1.7); punch = Math.max(0, punch - raw * 1.3);
    kick += ((state === "play" ? clamp((speed - V0) / (VMAX - V0), 0, 1) * 7 : 0) - kick) * k;
    const p = tmp.p.set(camX + (Math.random() - 0.5) * shake * 0.8, CAM_Y + py * 0.25 + flyK * 3.6 + (Math.random() - 0.5) * shake * 0.6, CAM_Z);
    const l = tmp.l.set(camX * 1.2, 1.3 + py * 0.2 + flyK * 3.9, -10);
    // opening scene: looking at the wall from the road
    if (tubeK > 0.002) { p.lerp(tmp.a.set(px, 2.75, 4.4), tubeK); l.lerp(tmp.b.set(px, 1.1, -10), tubeK); }
    if (introK > 0.002) { const e = sm(introK); p.lerp(tmp.a.set(3.9, 1.6, 0.6), e); l.lerp(tmp.b.set(-3.5, -0.3, 0.2), e); }
    camera.position.copy(p); camera.lookAt(l);
    camera.fov = baseFov + kick + punch * 7; camera.updateProjectionMatrix();
  }
  function step(raw) {
    // slow motion for flips and near misses
    const target = state !== "play" ? 1 : trick ? (trick.air ? (trick.t / trick.dur < 0.72 ? 0.42 : 1) : 0.8) : nmSlow > 0 ? 0.45 : 1;
    nmSlow -= raw;
    ts += (target - ts) * (1 - Math.exp(-raw * 16));
    update(raw * ts, raw);
  }
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const raw = Math.min(0.05, (now - last) / 1000), real = (now - last) / 1000; last = now;
    if (root.clientWidth !== W || root.clientHeight !== H) resize();
    if (state === "play" && !quality.done && !document.hidden && ++quality.n > 60) {     // slow phone: lighter graphics
      quality.sum += Math.min(0.1, real);
      if (quality.n >= 240) { quality.done = true; if (quality.sum / (quality.n - 60) > 0.027) lowQuality(); }
    }
    if (quality.low && ++quality.k % 3 === 0) renderer.shadowMap.needsUpdate = true;
    if (!frozen) step(raw);
    renderer.render(scene, camera);
  }

  /* ---------- AR: the game keeps running, on top of the phone's camera picture ---------- */
  // The sky, far scenery and grass are hidden so the room shows through; the street, stalls, obstacles and coins stay.
  async function arToggle() {
    if (ar && ar.on) return arStop();
    if (!["play", "pause"].includes(state)) return;
    if (state === "play") { prevState = "play"; state = "pause"; }          // hold the run while the camera starts
    hideCard();
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); } catch {}
    if (!alive) { if (stream) stream.getTracks().forEach((t) => t.stop()); return; }
    if (!stream) return arFail();
    const v = document.createElement("video");
    v.className = "run-video"; v.setAttribute("playsinline", ""); v.muted = true; v.autoplay = true; v.srcObject = stream;
    root.prepend(v); v.play().catch(() => {});
    ar = { on: true, stream, video: v };
    root.classList.add("ar");
    state = prevState; RunAudio.music(true); last = performance.now();
    buzz("medium"); pop("AR");
  }
  function arFail() {
    card(`${chip("alert", "lg solid")}<h2>Kamera ochilmadi</h2><p>AR uchun kameraga ruxsat bering. Telegram'ning ba'zi versiyalarida kamera Mini App ichida ishlamaydi.</p><button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>`,
      { go: () => { hideCard(); state = prevState; RunAudio.music(true); last = performance.now(); } });
  }
  const arHidden = () => [S.water, ...(S.cities || []), S.skyMesh, S.mtMesh, S.grassMesh, S.stars, S.disc, S.glow, S.landmark, S.mosque, ...S.clouds, ...S.flocks.map((f) => f.mesh)].filter(Boolean);
  function arApply() {               // runs every frame while AR is on, after the light and weather have been set
    for (const o of arHidden()) o.visible = false;
    scene.background = null; scene.fog.near = 900; scene.fog.far = 1000;
  }
  function arStop() {
    if (!ar || !ar.on) return;
    ar.on = false; ar.stream.getTracks().forEach((t) => t.stop()); ar.video.remove();
    if (!root) return;
    root.classList.remove("ar");
    for (const o of [S.water, ...(S.cities || []), S.skyMesh, S.mtMesh, S.grassMesh, S.disc, S.glow, ...S.clouds]) if (o) o.visible = true;
    showWorld(level);                 // puts back the landmark, background and fog of the current place
  }

  // every 300 m: a short burst of speed effects so the player feels it getting faster
  function boost() {
    nextBoost += 300; punch = 0.6; buzz("light");
    pop(`Tezlashdi! ${Math.round(speed * 3.6)} km/soat`, "gold");
  }
  function openPortal() {
    portalOn = true;
    for (const o of objs) if (o.z < FAR + 30) o.gone = true;       // keep the gateway clear
    spawnIn = Math.max(spawnIn, 34);
    const gate = gateObj = S.portal;
    gate.position.set(0, 0, FAR); gate.visible = true;
  }
  function setIndoor() {
    const fog = 0x3b2a1c;
    scene.fog.color.setHex(fog); scene.fog.near = 18; scene.fog.far = 95; scene.background = new T.Color(fog);
    S.hemi.color.set("#FFE4BF"); S.hemi.groundColor.set("#6B4A2E"); S.hemi.intensity = 1.35;
    S.sun.color.set("#FFE9C6"); S.sun.intensity = 1.2; S.sun.position.set(6, 40, 10).add(S.sun.target.position);
    S.lamp.color.set("#FFC98A"); S.lamp.intensity = 30; renderer.toneMappingExposure = 1.05;
  }
  // which world is shown: the street (levels 1 and 3), the bazaar hall (2) or the seaside promenade (4)
  function showWorld(n) {
    const sea = n === 4;
    S.out.visible = n !== 2; S.in.visible = n === 2; S.sea.visible = sea;
    for (const o of S.scn) o.visible = !sea; for (const w of S.walkers) w.g.visible = !sea;    // the street's houses, stalls and people stay behind
    S.grassMesh.visible = S.mtMesh.visible = !sea;      // open sea to the horizon instead of the mountains
    S.landmark.visible = !sea && !(n === 3 && S.mosque); if (S.mosque) S.mosque.visible = n === 3;
    if (n === 2) setIndoor(); else { scene.background = null; S.lamp.color.set("#FFD9A0"); }
  }
  function fadeStep(raw) {
    const tr = trans, IN = 0.4, OUT = 1.1;
    tr.t += raw;
    if (!tr.done && tr.t >= IN) { tr.done = true; applyModels(); enterLevel(tr.n); }
    const a = tr.t < IN ? tr.t / IN : Math.max(0, 1 - (tr.t - IN) / OUT);
    el.flash.style.transition = "none"; el.flash.style.background = tr.n === 4 ? "#DFF4FA" : "#FFF3D6"; el.flash.style.opacity = (a * 0.92).toFixed(3);
    if (tr.t > IN + OUT) { trans = null; el.flash.style.opacity = 0; }
  }
  // Arriving: an empty road with a line of coins, the place's name, green fireworks; the obstacles come after a few seconds.
  function enterLevel(n) {
    if (n === 2 && pw.fly > 0) { pw.fly = 0; invuln = Math.max(invuln, 1.6); vy = 0; }     // the carpet lands before the covered bazaar
    level = n; portalOn = false; showWorld(n);
    for (const o of objs) o.gone = true;
    spawnIn = 1e9; calm = 1.4;
    trail(lane, -14, 8); trail(lane, -38, 6);
    coins += 50; feed(0.3); bump(); buzz("success");
    el.title.innerHTML = `<small>${n}-bosqich</small><b>${LEVELS[n][1]}</b><span>+50 tanga</span>`;
    el.title.className = "run-title"; void el.title.offsetWidth; el.title.className = "run-title show";
    fireworks(n === 4 ? ["#4ADE80", "#22D3EE", "#38BDF8", "#A3E635", "#FDE047"] : ["#22C55E", "#4ADE80", "#A3E635", "#34D399", "#FDE047"]);
  }
  function fillRoad() {             // the first obstacles of the new level, close enough to arrive soon
    let z = -60;
    while (z > FAR) z -= spawnRow(z);
    spawnIn = FAR - z;
  }
  function fireworks(colors) {
    for (let k = 0; k < 6; k++) setTimeout(() => {
      if (!alive) return;
      const b = document.createElement("div"), n = 18;
      b.className = "run-fw"; b.style.left = rnd(14, 86) + "%"; b.style.top = rnd(12, 38) + "%";
      for (let i = 0; i < n; i++) {
        const sp = document.createElement("i"), c = pick(colors);
        sp.style.cssText = `--a:${(360 / n) * i + rnd(-6, 6)}deg;--d:${rnd(80, 140)}px;--c:${c}`;
        b.appendChild(sp);
      }
      el.fx.appendChild(b); setTimeout(() => b.remove(), 1400);
    }, k * 260 + rnd(0, 120));
  }
  function backToStreet() {
    level = 1; portalOn = false; trans = null; calm = 0; pace = 1;
    S.portal.visible = false; showWorld(1);
    el.flash.style.opacity = 0; el.title.className = "run-title";
  }

  /* ---------- game flow ---------- */
  function reset(first) {
    for (const o of objs) drop(o);
    objs = [];
    speed = V0; dist = 0; coins = 0; hearts = HEARTS; rows = 0; runT = 0; nextBoost = 300; punch = 0; pace = 1;
    if (level !== 1 || portalOn) backToStreet();
    lane = prevLane = first ? 0 : 1; px = first ? -2.55 : 0; py = vy = gy = 0; grounded = true; fastFall = false;
    rollT = lowT = jumpBuf = invuln = stumbleT = crashT = nmSlow = shake = 0;
    moment = null; lastSnapT = 0; momentURL = null; momentCanvas = null; momentPng = null;
    for (const k in pw) pw[k] = 0; nextPow = 260; flyK = 0; nextWagon = 700; tubeK = 0; inTube = null; energy = 1; enWarn = 0; shown.e = -1;
    laneAt = jumpAt = rollAt = lastWave = -9; trick = wave = eat = rest = null; nextEat = 12; dbl = false; ninjaT = flipT = safe = 0; combo = 0; tipA = tipB = false; ts = 1;
    P.pivot.rotation.set(0, 0, 0); P.g.position.set(px, 0, 0); P.yaw = P.tilt = 0; P.g.rotation.y = first ? Math.PI / 2 : 0;
    S.apple.visible = S.bottle.visible = S.bag.visible = false;
    if (!first) { S.wall.visible = false; introK = 0; }
    hud(true);
  }
  // The very first game: two short cartoon panels (energy, then controls). Never shown again.
  const SW = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ARROW = { L: SW('<path d="M19 12H5M11 6l-6 6 6 6"/>'), R: SW('<path d="M5 12h14M13 6l6 6-6 6"/>'), U: SW('<path d="M12 19V5M6 11l6-6 6 6"/>'), D: SW('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    UU: SW('<path d="M6 13l6-6 6 6M6 19l6-6 6 6"/>'), T: SW('<circle cx="9" cy="10" r="3"/><circle cx="16" cy="13" r="3"/><path d="M9 3v2M16 6v2"/>') };
  function help() {
    const back = state; state = "help"; RunAudio.music(false);
    const done = () => { store.set("run_help", 1); el.kuch.classList.remove("spot"); hideCard(); state = back; RunAudio.music(true); last = performance.now(); buzz("medium"); };
    el.kuch.classList.add("spot"); buzz("light");
    card(`<div class="toon-step"><i class="on"></i><i></i></div>
      <div class="toon-ico">${ic("zap")}</div>
      <h2>Tanga yig'ing, kuchli bo'ling!</h2>
      <div class="toon-bar"><i class="g"></i><i class="y"></i><i class="r"></i></div>
      <p>Yuqoridagi chiziq: sizning kuchingiz. Tanga yig'sangiz to'ladi, tugasa yiqilasiz!</p>
      <button class="toon-btn" data-a="next">Tushundim</button>`,
      { next: () => {
        el.kuch.classList.remove("spot"); buzz("light");
        const row = (a, c, t) => `<div class="toon-ctl"><span class="toon-key ${c}">${a}</span><b>${t}</b></div>`;
        card(`<div class="toon-step"><i></i><i class="on"></i></div>
          <h2>Boshqarish</h2>
          <div class="toon-grid">
            ${row(ARROW.L + ARROW.R, "k1", "Chapga, o'ngga")}
            ${row(ARROW.U, "k2", "Sakrash")}
            ${row(ARROW.UU, "k3", "2 marta: ninja sakrash")}
            ${row(ARROW.D, "k4", "Sirpanish")}
            ${row(ARROW.T, "k5", "2 marta bosing: akrobatika")}
          </div>
          <button class="toon-btn" data-a="go">${ic("play")} O'ynash!</button>`, { go: done }, "toon");
      } }, "toon");
  }
  function play() {
    clearTimeout(flowTimer); root.classList.remove("over");
    const first = state === "menu";
    if (!first) reset(false);
    hideCard(); RunAudio.music(true); buzz("medium");
    games = store.get("run_games", 0) + 1; store.set("run_games", games);
    // coins right in front of the runner, and the street already filled with obstacles
    trail(lane, -15, 7);
    let z = -40; while (z > FAR) z -= spawnRow(z);
    spawnIn = FAR - z;
    if (first) { state = "intro"; introT = 0; guardT = 0; guardX = -2.4; sfx("whistle"); pop("Hoy, to'xtang!", "bad"); }   // the watchman turns up
    else state = "play";
    last = performance.now();
  }
  function pause(fromNet) {
    if (!["play", "intro", "rest", "count"].includes(state)) return;
    prevState = state === "count" ? "play" : state; state = "pause"; RunAudio.music(false);
    if (net && fromNet !== true) Duo.send({ t: "pause" });
    saveRun(); pauseCard(fromNet === true); applyModels();
  }
  function pauseCard(byFriend) {
    card(`${chip("pause", "lg solid")}<h2>${byFriend && net ? esc(net.name) + " pauza qildi" : "Pauza"}</h2>
      <button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>
      <div class="run-tools">
        <button data-a="snd">${ic(muted ? "mute" : "sound")}<span>${muted ? "Ovoz o'chiq" : "Ovoz"}</span></button>
        <button data-a="ar">${ic("ar")}<span>AR kamera</span></button>
        <button data-a="me"><i style="background:${myColor()}"></i><span>Yuguruvchim</span></button>
      </div>
      ${net ? "" : `<button class="btn-ghost" data-a="duo">${ic("users")} Do'st bilan o'ynash</button>`}<button class="btn-ghost" data-a="out">Chiqish</button>`,
      { go: () => unpause(false), out: exit, duo: () => { location.hash = "#/duo"; },
        snd: () => { muted = !muted; store.set("run_mute", muted); RunAudio.mute(muted); buzz("light"); pauseCard(byFriend); },
        ar: () => arToggle(), me: () => runnerCard(() => pauseCard(byFriend)) });
  }
  /* ---------- my runner: name and colour ---------- */
  const myName = () => runnerName();
  const myColor = () => runnerColor() || S.theme || RUN_COLORS[0];
  function runnerCard(back) {
    let col = myColor();
    card(`<h2>Yuguruvchim</h2>
      <input class="run-name" maxlength="16" value="${esc(myName())}" placeholder="Ismingiz" autocomplete="off">
      <div class="run-colors">${RUN_COLORS.map((c) => `<button data-c="${c}" class="${c === col ? "on" : ""}" style="background:${c}" aria-label="Rang"></button>`).join("")}</div>
      <button class="btn-primary" data-a="ok">${ic("check")} Saqlash</button><button class="btn-ghost" data-a="back">Orqaga</button>`,
      { ok: () => {
          const n = el.ov.querySelector(".run-name").value.trim().slice(0, 16);
          if (n) store.set("run_name", n);
          store.set("run_color", col); paintRunner(col); buzz("success");
          if (net) Duo.hello();
          back();
        }, back });
    el.ov.querySelectorAll("[data-c]").forEach((b) => { b.onclick = () => { col = b.dataset.c; el.ov.querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x === b)); buzz("select"); }; });
  }
  function paintRunner(col) {          // rebuilds the runner in the chosen colour, in place
    if (!S.makeRunner || !P) return;
    const old = P, nr = S.makeRunner(col);
    nr.g.position.copy(old.g.position); nr.g.rotation.copy(old.g.rotation); nr.g.visible = old.g.visible;
    for (const it of [S.can, S.bottle, S.apple]) if (it) nr.eR.add(it);
    scene.remove(old.g); scene.add(nr.g); S.P = P = nr;
  }
  /* ---------- the route map ---------- */
  const PLACES = [[0, "Chorsu bozori", "dome"], [1500, "Bozor ichida", "arch"], [3000, "Istanbul", "mosque"], [4500, "Dengiz bo'yi", "wave"]];
  const PLACE_IC = {
    dome: '<path d="M4 20h16M6 20v-6h12v6M5 14a7 7 0 0 1 14 0M12 7V4"/>',
    arch: '<path d="M3 20h18M5 20V10a7 7 0 0 1 14 0v10M9 20v-6a3 3 0 0 1 6 0v6"/>',
    mosque: '<path d="M3 20h18M7 20v-5a5 5 0 0 1 10 0v5M12 10V7M4 20V9M20 20V9M4 9l0-3M20 9l0-3"/>',
    wave: '<path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0M15 10l3-5 3 5z"/>',
  };
  function openMap() {
    const was = state;
    if (["play", "count"].includes(state)) pause();
    else if (state !== "pause") return;
    const total = 6000, at = (m) => clamp(m / total, 0, 1), pos = (f) => `calc(26px + ${f.toFixed(4)} * (100% - 52px))`;
    const me = Math.floor(dist), fd = net && fr ? Math.floor(dist + (fr.op - offPos) * STEP) : null;
    const next = PLACES.find((p) => p[0] > me);
    const stops = PLACES.map(([m, name, k], i) => `<div class="map-stop ${me >= m ? "done" : ""} ${i + 1 === level ? "here" : ""}" style="bottom:${pos(at(m))}">
        <span class="map-ic">${`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PLACE_IC[k]}</svg>`}</span>
        <span class="map-tx"><b>${name}</b><small>${m ? fmtNum(m) + " m" : "Boshlanish"}</small></span></div>`).join("");
    card(`<div class="map-head"><h2>Yo'l xaritasi</h2><p>${next ? `Keyingi: <b>${next[1]}</b> · ${fmtNum(next[0] - me)} m qoldi` : "Barcha manzillar ochildi"}</p></div>
      <div class="map-road">
        <div class="map-line"><i style="height:${at(me) * 100}%"></i></div>
        ${stops}
        <div class="map-dot me" style="bottom:${pos(at(me))};background:${myColor()}" title="${esc(myName())}">${esc(myName().slice(0, 1).toUpperCase())}</div>
        ${fd != null ? `<div class="map-dot fr" style="bottom:${pos(at(fd))};background:${(Duo.friend && Duo.friend.color) || "#F97316"}" title="${esc(net.name)}">${esc(net.name.slice(0, 1).toUpperCase())}</div>` : ""}
      </div>
      <div class="map-foot"><span>${fmtNum(me)} m</span><span>${coins} tanga</span><span>${level}-bosqich</span></div>
      <button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>`,
      { go: () => unpause(false) }, "mapv");
  }
  const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  function unpause(fromNet) {
    if (net && !fromNet) Duo.send({ t: "go" });
    hideCard(); state = prevState; RunAudio.music(true); last = performance.now();
  }
  // Telegram's back button pauses a run instead of leaving the game
  function onBack() { if (["play", "intro", "rest", "count"].includes(state)) { pause(); return true; } return false; }
  function crash() {
    if (net) Duo.send({ t: "wait" });
    state = "dead"; hearts--; crashT = 0.001; rollT = 0; fastFall = false; shake = 0.7; nmSlow = 0;
    trick = wave = null; if (eat) { eat = null; S.apple.visible = false; }
    flash("#FF5A5F", 0.45); sfx("crash"); buzz("error", [90, 50, 180]); buzz("heavy");
    burst(px, py + 1.1, -0.4, "#FFFFFF", 26, 4.5); burst(px, py + 0.4, -0.3, "#D8C7A8", 14, 3);
    hud();
    clearTimeout(flowTimer);
    flowTimer = setTimeout(() => { if (alive && state === "dead") hearts > 0 ? showMath() : gameOver(); }, 620);
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
    const st = Number.isInteger(ans) ? 1 : 0.5, set = new Set([ans]);
    while (set.size < 3) { const v = ans + pick([1, 2, 10, -1, -2, -10]) * st; if (v >= 0) set.add(v); }
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
    coins = Math.max(0, coins + (ok ? STAKE : -STAKE)); hud(); bump();
    pop(ok ? `+${STAKE} tanga` : `−${STAKE} tanga`, ok ? "gold" : "bad"); if (!ok) sfx("bad"); buzz(ok ? "success" : "warning");
    flowTimer = setTimeout(() => { if (alive) resume(); }, 420);
  }
  function resume() {
    hideCard();
    for (const o of objs) if (o.z > -45) o.gone = true;      // clear the road just ahead
    crashT = 0; py = vy = gy = 0; grounded = true; rollT = lowT = jumpBuf = stumbleT = 0;
    invuln = 1.6; speed = Math.max(V0, speed * 0.85); spawnIn = net && !net.host ? 1e9 : Math.max(spawnIn, 16); energy = 1; enWarn = 0;
    if (net) Duo.send({ t: "go2" });
    trail(lane, -14, 5);
    state = "play"; last = performance.now();
  }
  /* ---------- two players ---------- */
  function netAdjust(dt) {          // the step ahead/behind, and the guest following the host's road
    const d = (offT - offPos) * Math.min(1, dt * 5); offPos += d; let extra = d * STEP;
    if (!net.host && hostB) {
      const hb = hostB.b + hostB.v * (performance.now() - hostB.at) / 1000, err = hb + offPos * STEP - (dist + extra);
      extra += Math.abs(err) > 25 ? err : err * Math.min(1, dt * 2.5);
    }
    dist += extra; return extra;
  }
  function netTick() {
    const now = performance.now();
    if (net.host && state === "wait") outbox = [];          // the whole road is sent when the friend is ready
    if (net.host && outbox.length) { Duo.send({ t: "o", i: outbox.filter((o) => !o.gone).map((o) => [o.type, o.lane, Math.round((dist - o.z) * 100) / 100, o.y, o.m.scale.x]) }); outbox = []; }
    if (now - lastSend < 66) return;
    lastSend = now;
    const m = { t: "s", x: +px.toFixed(2), y: +py.toFixed(2), r: rollT > 0 ? 1 : 0, n: ninjaT > 0 ? 1 : 0, f: flipT > 0 ? 1 : 0, c: crashT > 0 ? 1 : 0, o: offT, op: +offPos.toFixed(3), h: hearts, co: coins };
    if (net.host) { m.b = +(dist - offPos * STEP).toFixed(2); m.v = +speed.toFixed(2); }
    Duo.send(m);
  }
  function friendStep(dt) {
    const F = S.friend; if (!F) return;
    const on = !!(fr && performance.now() - fr.at < 3000 && state !== "over");
    F.g.visible = S.friendTag.visible = on;
    if (!on) return;
    const k = 1 - Math.exp(-dt * 14);
    F.x = F.x == null ? fr.x : F.x + (fr.x - F.x) * k; F.y = F.y == null ? fr.y : F.y + (fr.y - F.y) * k;
    const z = -(fr.op - offPos) * STEP;
    F.g.position.set(F.x, F.y, F.g.position.z + (z - F.g.position.z) * k);
    F.phase += dt * (["play", "count"].includes(state) ? 6 + speed * 0.4 : 0);
    runPose(F, F.phase, false);
    let fx = 0;
    if (fr.c) { fx = 1.4; F.pivot.position.y = HIP * 0.4; }
    else if (fr.r || fr.n || fr.f) { F.spin = (F.spin || 0) + dt * (fr.r ? 10 : 11); fx = fr.f ? F.spin : -F.spin; F.hL.rotation.x = F.hR.rotation.x = 1.8; F.kL.rotation.x = F.kR.rotation.x = -2.1; F.sL.rotation.x = F.sR.rotation.x = 1.3; if (fr.r) F.pivot.position.y = HIP * 0.72; }
    else { F.spin = 0; if (fr.y > 0.3) { F.hL.rotation.x = 1.15; F.kL.rotation.x = -1.35; F.hR.rotation.x = -0.55; F.kR.rotation.x = -1.2; F.sL.rotation.x = 2.1; F.sR.rotation.x = 1.9; } }
    F.pivot.rotation.set(fx, 0, 0);
    S.friendTag.position.set(F.x, F.y + 2.35, F.g.position.z);
  }
  function nameTag(text) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d");
    g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect ? g.roundRect(8, 8, 240, 48, 24) : g.rect(8, 8, 240, 48); g.fill();
    g.fillStyle = "#1F2937"; g.font = "500 28px -apple-system, Segoe UI, Roboto, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text.slice(0, 14), 128, 33);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, depthWrite: false })); sp.scale.set(1.6, 0.4, 1); return sp;
  }
  function netStart() {
    const fc = (Duo.friend && Duo.friend.color) || "#F97316";
    S.friend = S.makeRunner(fc === myColor() ? (fc === "#F97316" ? "#16A34A" : "#F97316") : fc); S.friend.phase = 0; scene.add(S.friend.g);
    S.friendTag = nameTag(net.name); scene.add(S.friendTag);
    el.friend.style.display = "";
    net.subs = [Duo.on("msg", netMsg), Duo.on("lost", netLost), Duo.on("friend", netBack)];
    lane = prevLane = net.host ? 1 : 2; px = laneX(lane); offT = offPos = 0; hostB = null; fr = null; outbox = [];
    if (!net.host) { for (const o of objs) o.gone = true; spawnIn = 1e9; }
    if (net.host && Duo.S.resume) applyRun(Duo.S.resume);
    state = "wait"; netWait(`${esc(net.name)} kutilmoqda…`);
    rdy = { me: true, fr: false, replied: false }; Duo.send({ t: "rdy" });
  }
  function netWait(text, acts) { netCard = text; card(`<div class="run-spin"></div><p>${text}</p>${acts ? acts.html : ""}`, acts ? acts.on : {}); }
  function countdown() { hideCard(); state = "count"; cdT = 3.2; cdN = 0; RunAudio.music(true); last = performance.now(); }
  function countStep(raw) {
    cdT -= raw; const n = Math.ceil(cdT - 0.2);
    if (n !== cdN && n > 0 && n <= 3) { cdN = n; pop(String(n)); buzz("light"); }
    if (cdT <= 0) { state = "play"; pop("Ketdik!", "gold"); buzz("medium"); }
  }
  function netMsg(m) {
    if (!alive || !net) return;
    if (m.t === "s") { fr = m; fr.at = performance.now(); if (!net.host && m.b != null) hostB = { b: m.b, v: m.v, at: fr.at }; return; }
    if (m.t === "o") {
      if (net.host) return;
      netApplying = true;
      for (const it of m.i) { put(it[0], it[1], dist - it[2], it[3]); objs[objs.length - 1].m.scale.x = it[4]; }
      netApplying = false; return;
    }
    if (m.t === "rdy") { rdy.fr = true; if (rdy.me && !rdy.replied) { rdy.replied = true; Duo.send({ t: "rdy" }); } if (net.host && rdy.me && state === "wait") { Duo.send({ t: "go0", dist: Math.floor(dist), level }); countdown(); outbox = objs.filter((o) => !o.gone && o.fly == null && o.y < FLY_H); netTick(); } return; }
    if (m.t === "go0") { if (!net.host && state === "wait") { if (m.dist > 0) applyRun({ ...(Duo.S.resume || {}), dist: m.dist, level: m.level }); countdown(); } return; }
    if (m.t === "pause") { if (["play", "count"].includes(state)) pause(true); return; }
    if (m.t === "go") { if (state === "pause") unpause(true); return; }
    if (m.t === "wait") { if (state === "play" || state === "count") { state = "fwait"; RunAudio.music(false); netWait(`${esc(net.name)} savolga javob bermoqda…`); } return; }
    if (m.t === "go2") { if (state === "fwait") { hideCard(); for (const o of objs) if (o.z > -45) o.gone = true; invuln = 1.6; state = "play"; RunAudio.music(true); last = performance.now(); } return; }
    if (m.t === "over") { if (state !== "over") { net.result = { won: true, fs: m.s, fn: net.name }; clearTimeout(flowTimer); gameOver(); } return; }
    if (m.t === "bye") { if (state !== "over") { netCard = ""; pause(true); card(`${chip("user", "lg solid")}<h2>${esc(net.name)} o'yindan chiqdi</h2><button class="btn-primary" data-a="solo">${ic("play")} Yolg'iz davom etish</button><button class="btn-ghost" data-a="out">Chiqish</button>`, { solo: goSolo, out: exit }); } }
  }
  function netLost() {
    if (!alive || !net || state === "over") return;
    if (["play", "count", "fwait"].includes(state)) { prevState = "play"; state = "pause"; RunAudio.music(false); }
    net.lost = true;
    card(`<div class="run-spin"></div><h2>Aloqa uzildi</h2><p>Qayta ulanmoqda… O'yin saqlandi.</p><button class="btn-ghost" data-a="solo">Yolg'iz davom etish</button><button class="btn-ghost" data-a="out">Chiqish</button>`, { solo: goSolo, out: exit });
    saveRun();
  }
  function netBack() {
    if (!alive || !net || !net.lost) return;
    net.lost = false;
    card(`${chip("user", "lg solid")}<h2>${esc(net.name)} qaytdi</h2><button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>`, { go: () => unpause(false) });
  }
  function goSolo() {                 // the friend is gone: the run goes on alone (the host's job falls to this phone)
    if (net) { for (const u of net.subs || []) u(); Duo.leave(); }
    net = null; fr = null; if (S.friend) S.friend.g.visible = S.friendTag.visible = false; el.friend.style.display = "none";
    spawnIn = 0; hideCard(); state = "play"; RunAudio.music(true); last = performance.now();
  }
  /* ---------- the run is saved, so it can go on after leaving the app ---------- */
  function saveRun() {
    if (!["play", "pause", "fwait", "count", "dead", "math"].includes(state) || dist < 30) return;
    store.set("run_save", { t: Date.now(), duo: !!net, host: net ? net.host : false, dist: Math.floor(dist), coins, hearts, level, energy: +energy.toFixed(3), speed: +speed.toFixed(2) });
  }
  function applyRun(sv) {
    for (const o of objs) o.gone = true;
    level = sv.level || 1; portalOn = false; S.portal.visible = false; showWorld(level);
    dist = sv.dist || 0; coins = sv.coins || 0; hearts = clamp(sv.hearts || 3, 1, HEARTS); energy = clamp(sv.energy || 1, 0.5, 1);
    speed = clamp(sv.speed || V0, V0, vcap()); nextBoost = Math.ceil((dist + 1) / 300) * 300; nextPow = dist + 200; nextWagon = dist + 500; nextEat = runT + 12;
    if (!net || net.host) { trail(lane, -14, 6); fillRoad(); }
    invuln = 1.5; hud(true);
  }
  // Before every new game: start alone with one big round button, or go and play with a friend.
  function startPanel() {
    state = "startQ"; RunAudio.music(false);
    const rec = best();
    card(`<div class="st-logo">${ic("gamepad")}</div>
      <h2>Chorsu game</h2>
      <p>${rec ? `Rekordingiz: ${rec} ball` : "Yuguring, tanga yig'ing, to'siqlardan o'ting"}</p>
      <button class="st-play" data-a="go" aria-label="O'yinni boshlash"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg></button>
      <span class="st-label">O'yinni boshlash</span>
      <button class="st-duo" data-a="duo"><span class="st-duo-ic">${ic("users")}</span><span class="st-duo-tx">Do'stingiz bilan o'ynang<small>Ikki kishi, uzoqda bo'lsangiz ham</small></span>${ic("chev")}</button>`,
      { go: begin, duo: () => { location.hash = "#/duo"; } }, "start");
  }
  function begin() {
    hideCard(); state = "play"; RunAudio.music(true); last = performance.now(); buzz("medium");
    if (!store.get("run_help", 0)) help();
  }
  function askResume(sv) {
    state = "resumeQ"; RunAudio.music(false);
    const info = `${sv.dist} m · ${sv.coins} tanga · ${sv.hearts} jon`;
    const go = () => { hideCard(); applyRun(sv); state = "play"; RunAudio.music(true); last = performance.now(); };
    const fresh = () => { store.set("run_save", null); startPanel(); };
    card(`${chip("refresh", "lg solid")}<h2>Davom etamizmi?</h2><p>Saqlangan o'yin: ${info}</p>
      ${sv.duo ? `<button class="btn-primary" data-a="duo">${ic("users")} Do'st bilan davom etish</button><button class="btn-ghost" data-a="go">Yolg'iz davom etish</button>` : `<button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>`}
      <button class="btn-ghost" data-a="fresh">Yangi o'yin</button>`,
      { go, fresh, duo: () => { Duo.S.resume = sv; location.hash = "#/duo"; } });
  }

  /* ---------- the best moment: remembered during the run, filmed as a still at the end ---------- */
  const BONES = ["pivot", "body", "head", "sL", "eL", "sR", "eR", "hL", "kL", "hR", "kR"];
  const CAPTION = { near: "Juda yaqin edi!", ninja: "Ninja sakrash!", flip: "Havoda salto!", wagon: "Yulduzli vagondan!", fly: "Uchar gilamda!", trick: "Havoda akrobatika!", run: "Oldinga, to'xtamay!" };
  function takeSnap(kind) {
    return {
      kind, level, mood: moodIdx, px, py, gz: P.g.position.z, fly: pw.fly > 0, shield: pw.shield > 0,
      bones: BONES.map((b) => [P[b].rotation.x, P[b].rotation.y, P[b].rotation.z, P[b].position.y]),
      objs: objs.filter((o) => !o.gone && o.fly == null && o.z > -34 && o.z < 7 && S.make[o.type]).map((o) => ({ type: o.type, x: o.x, y: o.y, z: o.z, sx: o.m.scale.x })),
    };
  }
  function offer(kind, sc, sn) {
    sc += level * 0.6 + speed / 20 + Math.random() * 0.3;
    if (moment && moment.score >= sc) return;
    moment = sn || takeSnap(kind); moment.kind = kind; moment.score = sc;
  }
  const overObstacle = () => objs.some((o) => !o.gone && o.kind !== "pick" && o.kind !== "tube" && Math.abs(o.x - px) < 1 && Math.abs(o.z) < o.hd + 1.2);
  function momentWatch() {           // called every frame while running
    if (ninjaT > 0.27 && ninjaT < 0.33) offer("ninja", overObstacle() ? 8 : 4);
    if (flipT > 0.24 && flipT < 0.3) offer("flip", overObstacle() ? 7.5 : 3.5);
    if (trick && trick.air && trick.t > trick.dur * 0.42 && trick.t < trick.dur * 0.5) offer("trick", 4.5);
    if (pw.fly > 3.4 && pw.fly < 3.5) offer("fly", 5);
    if (!moment && time - lastSnapT > 2 && grounded && invuln <= 0 && rollT <= 0) { lastSnapT = time; moment = takeSnap("run"); moment.score = 0; }
  }
  // Rebuilds the remembered moment, films it from a dramatic angle at 1080x1920 and finishes it like a film still.
  function filmMoment() {
    const sn = moment; if (!sn || !renderer || (ar && ar.on)) return null;
    const keep = { lvl: level, mood: moodIdx, vis: objs.map((o) => o.m.visible), bones: BONES.map((b) => [P[b].rotation.clone(), P[b].position.y]),
      g: P.g.position.clone(), gv: P.g.visible, cam: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov, asp: camera.aspect,
      extra: [S.blob, S.dizzy, S.partsMesh, S.bag, S.apple, S.carpet, S.shield, S.guard && S.guard.g].filter(Boolean).map((o) => [o, o.visible]) };
    const temp = [];
    try {
      for (const o of objs) o.m.visible = false;
      for (const [o] of keep.extra) o.visible = false;
      if (sn.level !== level) showWorld(sn.level);
      moodIdx = sn.level === 3 ? 1 : sn.mood; applyMood(1);
      for (const t of sn.objs) {
        const m = take(t.type); m.position.set(t.x, t.y, t.z); m.scale.x = t.sx; temp.push([t.type, m]);
        if (t.type === "wagon") { const f = m.getObjectByName("doorF"), b = m.getObjectByName("doorB"); if (f) f.rotation.y = -1.75; if (b) b.rotation.y = 1.75; }
      }
      BONES.forEach((b, i) => { const v = sn.bones[i]; P[b].rotation.set(v[0], v[1], v[2]); if (b === "pivot") P[b].position.y = v[3]; });
      P.g.position.set(sn.px, sn.py, sn.gz); P.g.visible = true;
      if (sn.fly) { S.carpet.visible = true; S.carpet.position.set(sn.px, sn.py + 0.04, sn.gz); }
      if (sn.shield) { S.shield.visible = true; S.shield.position.set(sn.px, sn.py + 0.95, sn.gz); }
      S.blob.visible = true; S.blob.position.set(sn.px, 0.02, sn.gz);
      // the camera: several film angles are tried; one with a clear view of the runner is kept
      const R = new T.Vector3(sn.px, sn.py, sn.gz), air = sn.py > 0.6, aim = new T.Vector3(R.x, R.y + 1.0, R.z);
      const solid = sn.objs.filter((t) => !/coin|non|samsa|pw_|wagonWall/.test(t.type)).map((t) => ({ p: new T.Vector3(t.x, 1.0, t.z), r: t.type === "wagon" ? 3.4 : Math.max(1.0, (S.defs[t.type] || {}).hd || 1) + 0.4 }));
      const clear = (c) => solid.every((o) => {
        if (c.distanceTo(o.p) < o.r + 0.3) return false;
        const d = aim.clone().sub(c), t = clamp(o.p.clone().sub(c).dot(d) / d.lengthSq(), 0, 1);
        return c.clone().addScaledVector(d, t).distanceTo(o.p) > o.r * 0.85;
      }) && Math.abs(c.x) < 4.3;
      const sd = Math.random() < 0.5 ? -1 : 1;
      const base = air
        ? [[2.4, 0.7 - R.y, -6.8, 0.2 - R.y * 0.45, 48], [3.9, 0.9 - R.y * 0.6, 0.8, 0.3 - R.y * 0.4, 50], [2.2, 2.0 - R.y * 0.5, 7.2, 0.4 - R.y * 0.4, 46], [1.2, 0.5 - R.y, -7.5, 0.3 - R.y * 0.4, 46]]
        : sn.kind === "wagon" ? [[0.8, 1.2, -6.2, 1.0, 46], [1.6, 1.8, 6.8, 1.0, 46]]
        : [[2.6, 1.4, 6.8, 0.9, 46], [2.2, 0.9, -6.4, 1.0, 46], [3.9, 1.5, 1.4, 0.9, 50], [1.2, 2.2, 7.5, 0.8, 44]];
      const order = sd > 0 ? base : base.map((b) => [-b[0], ...b.slice(1)]);
      let sh = order[0], cpos = null;
      for (const b of order) { const c = new T.Vector3(R.x + b[0], Math.max(0.2, R.y + b[1]), R.z + b[2]); if (clear(c)) { sh = b; cpos = c; break; } }
      if (!cpos) { sh = [0.4, 2.6, 5.5, 1.0, 42]; cpos = new T.Vector3(R.x + 0.4, R.y + 2.6, R.z + 5.5); }
      camera.position.copy(cpos);
      camera.lookAt(R.x * 0.85, R.y + sh[3], R.z - 1.5);
      camera.fov = sh[4]; camera.aspect = 1080 / 1920; camera.updateProjectionMatrix();
      renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
      renderer.render(scene, camera);
      const shot = document.createElement("canvas"); shot.width = 1080; shot.height = 1920;
      shot.getContext("2d").drawImage(el.cv, 0, 0, 1080, 1920);
      return finishStill(shot, sn);
    } catch { return null; }
    finally {
      for (const [t, m] of temp) { m.visible = false; (pools[t] || (pools[t] = [])).push(m); }
      objs.forEach((o, i) => { o.m.visible = keep.vis[i]; });
      for (const [o, v] of keep.extra) o.visible = v;
      BONES.forEach((b, i) => { P[b].rotation.copy(keep.bones[i][0]); if (b === "pivot") P[b].position.y = keep.bones[i][1]; });
      P.g.position.copy(keep.g); P.g.visible = keep.gv;
      if (sn.level !== keep.lvl) showWorld(keep.lvl);
      moodIdx = keep.mood;
      camera.position.copy(keep.cam); camera.quaternion.copy(keep.q); camera.fov = keep.fov; camera.aspect = keep.asp; camera.updateProjectionMatrix();
      renderer.setPixelRatio(quality.low ? 1 : Math.min(window.devicePixelRatio || 1, 1.25)); W = 0; resize();
    }
  }
  // Film look: soft zoom blur towards the edges, teal-and-orange grade, vignette, the title, the player and the caption.
  function finishStill(shot, sn) {
    const Wd = 1080, Hd = 1920, c = document.createElement("canvas"); c.width = Wd; c.height = Hd; const g = c.getContext("2d");
    g.drawImage(shot, 0, 0);
    const blur = document.createElement("canvas"); blur.width = Wd; blur.height = Hd; const b = blur.getContext("2d");
    for (let i = 1; i <= 5; i++) { const k = 1 + i * 0.012; b.globalAlpha = 1 / i; b.drawImage(shot, (Wd - Wd * k) / 2, (Hd - Hd * k) / 2, Wd * k, Hd * k); }
    b.globalAlpha = 1; b.globalCompositeOperation = "destination-in";
    let gr = b.createRadialGradient(Wd / 2, Hd * 0.48, Hd * 0.18, Wd / 2, Hd * 0.48, Hd * 0.62); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    b.fillStyle = gr; b.fillRect(0, 0, Wd, Hd); g.drawImage(blur, 0, 0);
    // speed: streaks rushing out from the runner, warm specks of light
    g.save(); g.globalCompositeOperation = "lighter";
    const cx = Wd / 2, cy = Hd * 0.47;
    for (let i = 0; i < 110; i++) {
      const a = Math.random() * Math.PI * 2, r0 = 380 + Math.random() * 520, len = 140 + Math.random() * 360;
      const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 1.55, x1 = cx + Math.cos(a) * (r0 + len), y1 = cy + Math.sin(a) * (r0 + len) * 1.55;
      const lg = g.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(1, `rgba(255,248,235,${0.06 + Math.random() * 0.16})`);
      g.strokeStyle = lg; g.lineWidth = 1 + Math.random() * 2.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * Wd, y = Math.random() * Hd * 0.8, r = 6 + Math.random() * 26, rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(255,214,150,${0.12 + Math.random() * 0.2})`); rg.addColorStop(1, "rgba(255,214,150,0)"); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.restore();
    g.globalCompositeOperation = "soft-light";
    gr = g.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, "rgba(255,170,90,0.55)"); gr.addColorStop(0.55, "rgba(255,200,150,0.15)"); gr.addColorStop(1, "rgba(20,90,130,0.6)");
    g.fillStyle = gr; g.fillRect(0, 0, Wd, Hd);
    g.globalCompositeOperation = "source-over";
    gr = g.createRadialGradient(Wd / 2, Hd * 0.46, Hd * 0.3, Wd / 2, Hd * 0.5, Hd * 0.78); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = gr; g.fillRect(0, 0, Wd, Hd);
    gr = g.createLinearGradient(0, Hd * 0.62, 0, Hd); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.72)");
    g.fillStyle = gr; g.fillRect(0, Hd * 0.62, Wd, Hd * 0.38);
    gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, "rgba(0,0,0,0.5)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, Wd, 300);
    const F = "-apple-system, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    g.textAlign = "center"; g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,0.35)"; g.shadowBlur = 18;
    g.font = `600 40px ${F}`; g.letterSpacing = "12px"; g.fillText("CHORSU GAME", Wd / 2 + 6, 132); g.letterSpacing = "0px";
    g.globalAlpha = 0.8; g.font = `400 30px ${F}`; g.fillText(`${tr("{n}-bosqich", { n: sn.level })} · ${tr(sn.level === 1 ? "Chorsu bozori" : LEVELS[sn.level][1])}`, Wd / 2, 182); g.globalAlpha = 1;
    g.textAlign = "left";
    g.font = `700 92px ${F}`; g.fillText(tr(CAPTION[sn.kind] || CAPTION.run), 72, Hd - 300);
    const who = myName();
    g.font = `500 44px ${F}`; g.fillText(who, 72, Hd - 218);
    g.globalAlpha = 0.78; g.font = `400 34px ${F}`; g.fillText(`${Math.floor(dist)} m  ·  ${tr("{n} tanga", { n: coins })}  ·  ${tr("{n} ball", { n: score() })}`, 72, Hd - 160);
    g.globalAlpha = 0.6; g.font = `400 28px ${F}`; g.fillText(`t.me/${BOT}`, 72, Hd - 100); g.globalAlpha = 1;
    momentCanvas = c;                  // kept for the full-quality PNG
    return c.toDataURL("image/jpeg", 0.9);
  }
  function showPhoto() {
    if (!momentURL) return;
    const v = document.createElement("div"); v.className = "run-photo";
    v.innerHTML = `<img alt="" src="${momentURL}"><div class="run-photo-bar"><button data-a="share">${ic("send")} Ulashish</button><button data-a="save">${ic("download")} Saqlash</button></div><button class="run-photo-x" data-a="x" aria-label="Yopish">${ic("x")}</button><p>Rasmni bosib turib ham saqlashingiz mumkin</p>`;
    // the picture as a PNG file (made once, then reused)
    const png = () => momentPng || (momentPng = new Promise((ok) => momentCanvas.toBlob((b) => ok(b), "image/png")));
    const caption = () => `${myName()} · Chorsu game · ${tr("{n} ball", { n: score() })}`;
    const busy = (b, on) => { b.disabled = on; b.classList.toggle("busy", on); };
    v.querySelector('[data-a="x"]').onclick = () => v.remove();
    v.querySelector('[data-a="save"]').onclick = async () => {
      const b = await png(), u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = "chorsu-game.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    };
    v.querySelector('[data-a="share"]').onclick = async (e) => {
      const btn = e.currentTarget; busy(btn, true);
      try {
        const blob = await png(), f = new File([blob], "chorsu-game.png", { type: "image/png" });
        // 1) the phone's own share sheet, where the browser offers it (iPhone, some Android)
        if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: "Chorsu game", text: caption() }); return; } catch (er) { if (er && er.name === "AbortError") return; } }
        // 2) Telegram: the bot sends the PNG and opens Telegram's "send to a chat" window
        if (SHARE_API && tg && tg.initData && tg.shareMessage) {
          const r = await fetch(`${SHARE_API}/share?c=${encodeURIComponent(caption())}`, { method: "POST", headers: { "Content-Type": "image/png", "X-Init-Data": tg.initData }, body: blob });
          const j = await r.json().catch(() => ({}));
          if (j.id) { tg.shareMessage(j.id, () => {}); toast("Rasm bot chatiga ham yuborildi"); return; }
        }
        toast("Rasmni bosib turing va saqlang, keyin do'stingizga yuboring");
      } catch { toast("Ulashib bo'lmadi, rasmni saqlab yuboring"); }
      finally { busy(btn, false); }
    };
    root.appendChild(v); buzz("light");
  }

  function gameOver() {
    state = "over"; RunAudio.music(false); applyModels(); store.set("run_save", null);
    if (net && !net.result) { net.result = { won: false, fn: net.name, fs: fr ? fr.co * 10 : 0 }; Duo.send({ t: "over", s: score() }); }
    const duoRes = net && net.result;
    const s = score(), b = best(), isBest = s > b;
    if (isBest) store.set("run_best", s);
    const me = [store.get("school", tr("Sizning maktabingiz")), myName(), Math.max(s, b)];
    const board = [...SCHOOL_BOARD, me].sort((a, c) => c[2] - a[2]), mine = board.indexOf(me);
    const row = (r, i) => `<div class="${r === me ? "me" : ""}"><span>${i + 1}</span><span>${r[1]}<small>${r[0]}</small></span><b>${r[2]}</b></div>`;
    root.classList.add("over");
    card(`
      ${chip(isBest ? "trophy" : "flag", "lg solid")}
      <h2>${duoRes ? (duoRes.won ? "G'alaba!" : esc(duoRes.fn) + " yutdi") : isBest ? "Yangi rekord!" : "O'yin tugadi"}</h2>
      ${duoRes ? `<p class="run-duo">${duoRes.won ? esc(duoRes.fn) + " barcha jonini yo'qotdi" : "Sizning jonlaringiz tugadi"}</p>` : ""}
      <div class="run-score">${s}</div>
      <p>${Math.floor(dist)} m · ${coins} tanga</p>
      ${moment ? `<button class="run-moment" data-a="photo"><span class="run-moment-img"><i></i></span><span><small>Eng zo'r lahza</small><b>${CAPTION[moment.kind] || CAPTION.run}</b><em>Ko'rish va ulashish</em></span></button>` : ""}
      <div class="run-board">
        <b>Haftalik maktablar reytingi</b>
        ${board.slice(0, 5).map(row).join("")}${mine >= 5 ? row(me, mine) : ""}
      </div>
      <button class="btn-primary" data-a="play">${ic("refresh")} Qayta o'ynash</button>
      ${net ? "" : `<button class="btn-ghost" data-a="duo">${ic("users")} Do'st bilan o'ynash</button>`}
      <button class="btn-ghost" data-a="share">Do'stlarni chaqirish</button>`,
      { play: net ? () => { location.hash = "#/duo"; } : play, share: () => share(s), photo: showPhoto, duo: () => { location.hash = "#/duo"; } });
    if (isBest) { buzz("success"); confetti(28); }
    if (moment) setTimeout(() => {          // film the moment just after the results appear
      if (!alive || state !== "over") return;
      momentURL = filmMoment();
      const im = root.querySelector(".run-moment-img");
      if (im && momentURL) im.innerHTML = `<img alt="" src="${momentURL}">`; else if (!momentURL) { const b = root.querySelector(".run-moment"); if (b) b.remove(); }
    }, 120);
  }
  function share(s) {
    const link = `https://t.me/${BOT}?start=run_${user.id}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(tr("Chorsu Run'da {s} ball to'pladim. Meni yenga olasizmi?", { s }))}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
  }
  function exit() { if (net) { Duo.send({ t: "bye" }); for (const u of net.subs || []) u(); net = null; Duo.leave(); } if (state !== "over") saveRun(); location.hash = "#/"; }

  // test hooks: the hidden preview pane throttles animation frames, so tests step the game by hand
  function _sim(sec, pilot = true) {
    const was = auto; auto = pilot;
    for (let i = 0; i < sec * 60 && ["play", "rest", "intro", "count"].includes(state); i++) step(1 / 60);
    auto = was; renderer.render(scene, camera);
    return _info();
  }
  function _mood(i) { moodOverride = moodIdx = i; applyMood(1); renderer.render(scene, camera); return MOODS[i].name; }
  const _info = () => ({ state, dist: Math.floor(dist), coins, hearts, speed: Math.round(speed), py: +py.toFixed(2), trick: trick && trick.name, eat: !!eat, level, objs: objs.length, calls: renderer && renderer.info.render.calls });
  const _set = (o) => { if (o.wagon) nextWagon = 0; if (o.energy != null) energy = o.energy; if (o.dist != null) { dist = o.dist; nextBoost = Math.ceil(dist / 300) * 300; } if (o.eat != null) nextEat = o.eat; if (o.rest != null) nextRest = o.rest; };

  return { mount, unmount, play, pause, exit, onBack, _end: () => gameOver(), _road: () => objs.filter((o) => o.kind !== "pick" && !o.gone).map((o) => o.type + ":" + o.lane + ":" + Math.round(dist - o.z)).sort(), _net: () => ({ fr, offT, offPos, host: net && net.host, NL, dist: +dist.toFixed(1) }), _moment: () => moment && moment.kind, _sim, _mood, _act: act, _info, _set, _freeze: (f) => { frozen = f; }, _rig: () => ({ P, S, T, camera }), _put: (type, z) => { for (const o of objs) if (o.z < 5 && o.z > -70) { o.gone = true; o.m.visible = false; } spawnIn = Math.max(spawnIn, 70); put(type, lane, z); } };
})();

const SCHOOL_BOARD = [
  ["Xiva sh. 3-IDUM", "Dilnoza", 4820], ["Toshkent, 110-maktab", "Jasur", 4310], ["Samarqand sh. 12-maktab", "Madina", 3975],
  ["Andijon sh. 5-IDUM", "Sardor", 3540], ["Buxoro sh. 21-maktab", "Kamola", 3120], ["Namangan sh. 34-maktab", "Bekzod", 2760],
];
