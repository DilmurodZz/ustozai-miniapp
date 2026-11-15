// Chorsu Run: an original 3D lane runner through a bazaar street.
// The world is built in run-world.js, sound in run-audio.js; this file is the game itself.
// Controls: swipe left/right = change lane, up = jump, down = roll, double tap = acrobatic trick.

const Game = (() => {
  const LIBS = [
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js",
    "https://unpkg.com/three@0.160.0/build/three.module.min.js",
  ];
  const C = { SLOT: 10, SLOTS: 20, LOOP: 200, BACK: 50 };     // scenery repeats every LOOP metres, BACK of them behind the runner
  const LANE = 2, FAR = -150, GONE = 14, HIP = 0.83;
  const CAM_Y = 4.3, CAM_Z = 8.4, GRAV = 26, JUMP = 9.6, ROLL = 0.62, V0 = 15, VMAX = 33;
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
  let dbl = false, ninjaT = 0, ninjaK = 0, flipT = 0, safe = 0, ar = null;     // second jump used, ninja flip timer, no-crash window after a trick, AR view
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
  const sfx = (n, p) => RunAudio.sfx(n, p);
  // true when the runner is simply running and free to play a small extra animation
  const free = () => state === "play" && grounded && !trick && !wave && !eat && rollT <= 0 && stumbleT <= 0 && crashT <= 0;

  function buzz(kind, pattern) {
    try { kind === "select" ? tg.HapticFeedback.selectionChanged() : /error|success|warning/.test(kind) ? tg.HapticFeedback.notificationOccurred(kind) : tg.HapticFeedback.impactOccurred(kind); } catch {}
    if (pattern && navigator.vibrate) { try { navigator.vibrate(pattern); } catch {} }
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
      <div class="run-arbar"></div>
      <div class="run-top">
        <div class="run-hud"><button class="run-btn" data-k="pause" aria-label="Pauza">${ic("pause")}</button><span class="run-coins">${ic("coin")}<b data-k="coins">0</b></span></div>
        <div class="run-right"><span class="run-hearts"></span><button class="run-btn" data-k="ar" aria-label="AR">${ic("ar")}</button><button class="run-btn" data-k="snd" aria-label="Ovoz"></button><button class="run-btn" data-k="x" aria-label="Yopish">${ic("x")}</button></div>
      </div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    el = { cv: q(".run-cv"), flash: q(".run-flash"), ov: q(".run-ov"), fx: q(".run-fx"), hint: q(".run-hint"), coins: q('[data-k="coins"]'), chip: q(".run-coins"), hearts: q(".run-hearts"), snd: q('[data-k="snd"]') };
    q('[data-k="x"]').onclick = exit; q('[data-k="pause"]').onclick = pause; q('[data-k="ar"]').onclick = arOpen;
    el.arbar = q(".run-arbar");
    muted = store.get("run_mute", false); RunAudio.mute(muted);
    el.snd.onclick = () => { muted = !muted; store.set("run_mute", muted); RunAudio.mute(muted); el.snd.innerHTML = ic(muted ? "mute" : "sound"); };
    el.snd.innerHTML = ic(muted ? "mute" : "sound");
    alive = true; state = "load"; moodOverride = null;
    card(LOADING);
    init();
  }
  function unmount() {
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
  function hud(force) {
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

  async function loadLib() {
    for (const url of LIBS) { try { return await import(url); } catch {} }
    throw new Error("three.js could not be loaded");
  }
  async function init() {
    try { T = T || (await loadLib()); }
    catch { return fail("Yuklab bo'lmadi", "Internetga ulanib, qayta urinib ko'ring. Ilova bir marta ochilgandan keyin o'yin internetsiz ham ishlaydi."); }
    if (!alive) return;
    try { renderer = new T.WebGLRenderer({ canvas: el.cv, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch { return fail("3D grafika ishlamadi", "Bu qurilma yoki brauzer 3D grafikani qo'llab-quvvatlamaydi."); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    for (const m of MOODS) if (!m.c) {
      m.c = {}; for (const c of COL) m.c[c] = new T.Color(m[c]);
      m.v = { dir: new T.Vector3(...m.dir).normalize(), discDir: new T.Vector3(...m.discDir).normalize() };
    }
    S = RunWorld.build(T, C); scene = S.scene; camera = S.camera; P = S.P;
    tmp = { p: new T.Vector3(), l: new T.Vector3(), a: new T.Vector3(), b: new T.Vector3() };
    for (const f of S.flocks) f.birds.forEach((b, j) => {
      if (f.kind === "sky") { const n = f.birds.length, mid = (n - 1) / 2; b.x = -30 - Math.abs(j - mid) * 1.3 - (n === 5 ? 40 : 0); b.z = (n === 5 ? -78 : -50) + (j - mid) * 1.5; b.y = (n === 5 ? 25 : 17) + rnd(-0.4, 0.4); b.vx = n === 5 ? 4.5 : 6.5; }
      else resetPigeon(b, -40 - j * 0.7);
    });
    moodIdx = slotMood();
    const m = MOODS[moodIdx];
    cur = { dir: m.v.dir.clone(), discDir: m.v.discDir.clone() };
    for (const c of COL) cur[c] = m.c[c].clone();
    for (const n of NUM) cur[n] = m[n];
    quality.done = false; quality.n = quality.sum = 0;
    resize(); window.addEventListener("resize", resize);
    bindInput(); document.addEventListener("visibilitychange", onHide);
    play();
    raf = requestAnimationFrame(loop);
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

  /* ---------- moods, weather, particles, birds ---------- */
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
  function drop(o) { o.m.visible = false; (pools[o.type] || (pools[o.type] = [])).push(o.m); }
  function put(type, l, z, y = 0) {
    const d = S.defs[type], m = take(type);
    m.position.set(laneX(l), y, z);
    objs.push({ type, def: d, kind: d.kind, hd: d.hd, val: d.val || 0, lane: l, z, y, m, ph: rnd(0, 6) });
  }
  function trail(l, z, n) {
    for (let i = 0; i < n; i++) put(i === n - 1 && Math.random() < 0.22 ? pick(["non", "samsa"]) : "coin", l, z + (n - 1) * 1.2 - i * 2.4, 0.95);
  }
  function arc(l, z) {     // coins along the path of a jump
    const step = speed * 0.14;
    for (let i = 0; i < 5; i++) put("coin", l, z + (2 - i) * step, 0.95 + 1.5 * (1 - Math.pow((i - 2) / 2.4, 2)));
  }
  function spawnRow(z = FAR) {
    rows++;
    let gap = 13 + speed * 0.55 + rnd(0, 5);
    // one obstacle per row, so a single swipe to the side always gets past it
    const L = [0, 1, 2].sort(() => Math.random() - 0.5), r = Math.random();
    const low = () => pick(["barrier", "crates", "melons", "teleshka"]), full = () => pick(["damas", "damas", "cart", "meat"]);
    if (rows < 4) { put(pick(["barrier", "crates", "sedan"]), L[0], z); trail(L[1], z, 5); }
    else if (r < 0.26) { put(low(), L[0], z); r < 0.13 ? arc(L[0], z) : trail(L[1], z, 5); }
    else if (r < 0.42) { put("banner", L[0], z); trail(L[1], z, 5); }
    else if (r < 0.64) { put(full(), L[0], z); trail(L[1], z, 6); }
    else if (r < 0.78) { put("sedan", L[0], z); for (let i = 0; i < 3; i++) put("coin", L[0], z + 1 - i * 1.2, 2.3); trail(L[1], z, 4); }
    else if (r < 0.92) {        // run over the cars: a plank ramp, then two cars bumper to bumper
      put("ramp", L[0], z); put("sedan", L[0], z - 3.8); put("sedan", L[0], z - 8.05);
      for (let i = 0; i < 6; i++) put("coin", L[0], z - 2.4 - i * 1.5, 2.3);
      trail(L[1], z - 4, 4); gap += 9;
    } else { trail(L[0], z, 4); trail(L[1], z - 11, 4); put(pick(["non", "samsa"]), L[2], z - 5, 0.95); gap += 6; }
    spawnIn = gap;
    return gap;
  }
  // would this obstacle hit the runner in their current pose?
  function hits(o) {
    if (o.kind === "full") return true;
    if (o.kind === "low") return py < 0.5;
    if (o.kind === "high") return !(rollT > 0 || lowT > 0);
    return o.kind === "plat" && !o.on && py < o.def.front - 0.45;
  }
  // height of whatever is under the runner's feet: the road, a ramp or a car roof
  function groundAt() {
    let g = 0;
    for (const o of objs) {
      const d = o.def;
      if (!d.h || o.gone || Math.abs(laneX(o.lane) - px) > 0.95 || o.z + o.hd < -0.25 || o.z - o.hd > 0.25) continue;
      const h = d.h(clamp(-o.z / o.hd, -1, 1));
      if (o.kind === "ramp" || o.on || py >= h - 0.5) { if (h > g) g = h; if (o.kind === "plat") o.on = true; }
    }
    return g;
  }

  /* ---------- player actions ---------- */
  function doJump() {
    if (!grounded) {
      if (dbl) { jumpBuf = 0.18; return; }       // remembered, fires on landing
      dbl = true; vy = JUMP * 0.95; ninjaT = 0.6; ninjaK = (ninjaK + 1) % 4; flipT = 0; jumpAt = time;
      sfx("jump", 1.3); buzz("medium"); return;
    }
    const over = gy > 0.3 || objs.some((o) => o.lane === lane && !o.gone && o.kind !== "pick" && o.kind !== "ramp" && o.z < 0 && o.z > -(speed * 0.6 + 2));
    vy = JUMP; py += 0.03; grounded = false; jumpAt = time; jumpBuf = 0; rollT = 0;
    if (over && Math.random() < 1 / 3) flipT = 0.55;      // one jump in three off a car or over an obstacle is a quick back flip
    sfx("jump"); buzz("light");
    if (games <= 3 && !tipB) { tipB = true; tip("Havoda yana yuqoriga suring: ninja sakrash"); }
  }
  function startRoll() { rollT = ROLL; rollAt = time; sfx("roll"); buzz("light"); }
  function doRoll() {
    if (trick) return;
    if (!grounded) { vy = Math.min(vy, -20); fastFall = true; }   // dive, then roll on landing
    else if (rollT < 0.15) startRoll();
  }
  function move(d) {
    const nl = clamp(lane + d, 0, 2);
    if (nl === lane) return;
    const side = invuln <= 0 && objs.some((o) => o.kind !== "pick" && o.kind !== "ramp" && !o.gone && o.lane === nl && o.z + o.hd > -0.9 && o.z - o.hd < 0.9 && hits(o));
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
    const t = trick; trick = null; safe = 0.4; coins += t.air ? 5 : 2;
    reward(`${LABEL[t.name]} +${t.air ? 5 : 2}`);
  }
  function graze(d) {
    px += d * 0.55; speed = Math.max(V0 * 0.8, speed * 0.88); shake = 0.3; stumbleT = 0.95;
    sfx("bump"); buzz("warning", 40); buzz("rigid");
    burst(px + d * 0.5, 1.0, 0, "#FFFFFF", 8, 2.5); pop("Ehtiyot bo'l!", "bad");
  }
  function nearMiss() {
    coins += 3; nmSlow = 0.22; if (!trick) stumbleT = 0.95;
    sfx("near"); buzz("medium"); burst(px, 1.2, 0, "#FFE08A", 10, 3); pop("Zo'r! +3", "gold"); bump();
  }
  function collect(o) {
    o.gone = true; coins += o.val;
    combo = time - comboAt < 0.6 ? combo + 1 : 1; comboAt = time;
    buzz("select"); bump();
    burst(laneX(o.lane), o.y, o.z, "#FFD45A", o.val > 1 ? 12 : 5, 2.4);
    if (o.val > 1) { buzz("soft"); pop(`+${o.val}`, "gold"); }
    if (combo === 10 || combo === 20) { coins += 5; reward(`Combo x${combo}! +5`); }
  }
  function act(dir) {
    if (dir === "T") return doTrick();
    if (state !== "play") return;
    if (trick) { trick = null; safe = 0.4; }
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
      if (state === "ar") { ar.yaw += (e.clientX - sx) * 0.012; sx = e.clientX; return; }
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
      if (state === "ar") { if (now - t0 < 260 && Math.hypot(e.clientX - x0, e.clientY - y0) < 14) arFlip(); return; }
      if (lastDir || now - t0 > 260 || Math.hypot(e.clientX - x0, e.clientY - y0) > 14) return;     // not a tap
      if (state === "ar") { arFlip(); return; }
      if (now - lastTap < 340) { lastTap = 0; doTrick(); } else lastTap = now;
    });
    cv.addEventListener("pointercancel", () => { id = null; });
    cv.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }
  function onHide() { if (document.hidden) pause(); }
  // plays the game by itself: used for testing
  function autopilot() {
    const ahead = (l, win) => objs.filter((o) => o.kind !== "pick" && o.kind !== "ramp" && !o.gone && !o.on && o.lane === l && o.z - o.hd < 0.5 && o.z + o.hd > -win).sort((a, b) => b.z - a.z);
    const win = 3 + speed * 0.5, here = ahead(lane, win)[0];
    if (!here || py > 0.6) return;
    if (here.kind === "full") {
      const ok = [lane - 1, lane + 1].filter((l) => l >= 0 && l <= 2 && !ahead(l, win).some((o) => o.kind === "full"));
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
  function runPose(r, ph, fist) {
    const s = Math.sin(ph), c = Math.cos(ph + 0.4);
    r.hL.rotation.x = s * 0.95; r.hR.rotation.x = -s * 0.95; r.kL.rotation.x = -(0.15 + 1.25 * Math.max(0, c)); r.kR.rotation.x = -(0.15 + 1.25 * Math.max(0, -c));
    r.sL.rotation.x = -s * 0.85; r.eL.rotation.x = 1.3; r.sR.rotation.x = fist ? 2.6 : s * 0.85; r.eR.rotation.x = fist ? 0.6 + Math.sin(ph * 1.7) * 0.4 : 1.3;
    r.body.rotation.x = -0.16; r.pivot.position.y = HIP + Math.abs(Math.cos(ph)) * 0.05;
  }
  function scenery(dt, ds, playing) {
    for (const [t, per] of S.scroll) t.offset.y = (t.offset.y + ds / per) % 1;
    for (const o of S.scn) {
      o.position.z += ds;
      if (o.position.z > C.BACK) {        // comes round again further up the street, slightly changed
        o.position.z -= C.LOOP; const u = o.userData;
        if (u.arm) { u.calls = Math.random() < 0.15; u.hi = false; u.bub.material = pick(S.bubbleMats); }
        if (u.gate) { u.n = (u.n + 1) % S.gateMats.length; u.gate.material = S.gateMats[u.n]; }
      }
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
      const o = objs[i]; o.z += ds; o.m.position.z = o.z;
      if (o.kind === "pick") o.m.rotation.y = time * 4 + o.ph;
      if (o.gone || o.z > GONE) { drop(o); objs.splice(i, 1); }
    }
  }

  /* ---------- frame update ---------- */
  function update(dt, raw) {
    time += dt;
    let v = 0;
    if (state === "intro" && (introT += raw) > 0.45) state = "play";
    const playing = state === "play";
    if (playing) v = speed;
    if (state === "intro" || playing) introK = Math.max(0, introK - raw / 0.9);
    if (state === "menu") {       // the picture on the wall slowly grows while the menu is open
      menuT += raw;
      const p = Math.min(0.6, 0.36 + menuT * 0.02);
      if (Math.abs(p - paintP) > 0.006) { paintP = p; S.paint(p); }
      if (Math.random() < raw * 10) burst(-3.36, 1.45 + rnd(-0.55, 0.55), 2.4 - 4.4 * p, S.theme, 1, 0.45);
    }
    const ds = v * dt;
    if (playing) {
      runT += dt;
      speed = Math.min(VMAX, speed + dt * 0.2); dist += speed * dt;
      px += (laneX(lane) - px) * (1 - Math.exp(-dt * 16));
      gy = groundAt();
      if (py > gy + 0.02 || vy > 0) {
        grounded = false; vy -= GRAV * dt; py += vy * dt;
        if (py <= gy && vy <= 0) { py = gy; vy = 0; grounded = true; dbl = false; burst(px, gy + 0.1, 0, "#D8C7A8", 6, 1.6); if (fastFall) { fastFall = false; startRoll(); } }
      } else { grounded = true; dbl = false; py = py < gy ? Math.min(gy, py + 12 * dt) : gy; }
      if (rollT > 0 && (rollT -= dt) <= 0) { rollT = 0; lowT = 0.1; }
      if (lowT > 0) lowT -= dt;
      if (jumpBuf > 0) { jumpBuf -= dt; if (grounded) doJump(); }
      if (invuln > 0) invuln -= dt;
      if (safe > 0) safe -= dt;
      if (ninjaT > 0) ninjaT -= dt;
      if (flipT > 0) flipT -= dt;
      if (trick && ((trick.t += dt) >= trick.dur || (grounded && trick.t > 0.12))) endTrick();
      if ((spawnIn -= speed * dt) <= 0) spawnRow();
      if (auto) autopilot();
      if (runT > nextEat && free()) startEat();
      if (games <= 3 && !tipA && runT > 2.2) { tipA = true; tip("Ekranni 2 marta bosing: akrobatika"); }
    } else if (crashT > 0 && py > 0) py = Math.max(0, py - 12 * dt);
    if (crashT > 0) crashT += dt;
    if (stumbleT > 0) stumbleT -= dt;
    if (wave && (wave.t += dt) > 0.9) wave = null;
    if (eat) eatStep(dt, ds); else if (S.bag.visible) { S.bag.position.z += ds; if (S.bag.position.z > GONE) S.bag.visible = false; }
    guardStep(raw);
    scenery(dt, ds, playing);
    if (state === "play") collide();

    const want = moodOverride == null ? slotMood() : moodOverride;
    if (want !== moodIdx) { moodIdx = want; if (playing) pop(MOODS[want].name); }
    applyMood(1 - Math.exp(-raw * 1.4));
    weather(dt, ds); particles(dt, ds); birds(dt, ds); pose(dt); cam(raw);
    hud();
  }
  function collide() {
    for (const o of objs) {
      if (o.gone || o.done || o.kind === "ramp") continue;
      const dx = Math.abs(laneX(o.lane) - px);
      if (o.kind === "pick") { if (Math.abs(o.z) < 1.1 && dx < 0.95 && Math.abs(o.y - (py + 0.9)) < 1.25) collect(o); continue; }
      const near = o.z + o.hd > -0.4 && o.z - o.hd < 0.4;
      if (near && !o.seen) {
        o.seen = true;       // a last-moment jump, roll or dodge counts as a near miss
        o.nm = (o.lane === lane && ((o.kind === "low" && time - jumpAt < 0.16) || (o.kind === "high" && time - rollAt < 0.14))) || (o.kind === "full" && o.lane === prevLane && o.lane !== lane && time - laneAt < 0.26);
      }
      if (near && dx < 0.85 && invuln <= 0 && safe <= 0 && !trick && hits(o)) return crash();
      if (o.z - o.hd > 0.4) { o.done = true; if (o.nm) nearMiss(); }
    }
  }
  function pose(dt) {
    const A = P, k = 1 - Math.exp(-dt * 22), menu = state === "menu", startle = state === "intro" && introT < 0.2;
    A.phase += dt * (state === "play" || state === "intro" ? 6 + speed * 0.4 : 0);
    const s = Math.sin(A.phase), c = Math.cos(A.phase + 0.4);
    // hips, knees, shoulders, forearms (f); z = arms spread sideways; hy/hx = head turn and tilt
    let hl = s * 0.95, hr = -s * 0.95, kl = 0.15 + 1.25 * Math.max(0, c), kr = 0.15 + 1.25 * Math.max(0, -c);
    let sl = -s * 0.85, sr = s * 0.85, fl = 1.3, fr = 1.3, zl = -0.1, zr = 0.1;
    let lean = -0.16, pivY = HIP + Math.abs(Math.cos(A.phase)) * 0.05, hy = 0, hx = 0, twist = 0, wob = 0, pz = 0;
    let fx = 0, fyaw = 0, fz = 0;      // whole-body flips: applied directly, not eased
    const busy = crashT > 0 || trick || rollT > 0 || ninjaT > 0 || flipT > 0;
    if (crashT > 0) {                  // knocked onto the back, legs in the air
      const e = 1 - Math.pow(1 - clamp(crashT / 0.4, 0, 1), 2);
      fx = 1.4 * e; pivY = HIP - 0.56 * e; pz = 1.1 * e; lean = 0;
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
      fx = -Math.PI * 2 * (1 - rollT / ROLL); pivY = 0.45; lean = -0.5;
      hl = hr = 1.9; kl = kr = 2.2; sl = sr = 1.3; fl = fr = 1.9;
    } else if (menu) {                 // painting the wall, glancing over the shoulder now and then
      hl = hr = 0; kl = kr = 0.05; lean = -0.03; pivY = HIP; sl = 0.1; fl = 0.3;
      sr = 1.75 + Math.sin(time * 5) * 0.3; fr = 0.55 + Math.sin(time * 5 + 1) * 0.25; zr = 0.15 + Math.sin(time * 2.3) * 0.3; hy = time % 6 > 5.2 ? 1.2 : 0;
    } else if (startle) {
      hl = hr = 0; kl = kr = 0.1; lean = 0; pivY = HIP + 0.1; sl = sr = 2.5; zl = -0.6; zr = 0.6; fl = fr = 0.4; hy = 1.3;
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
    S.dizzy.visible = crashT > 0.35;
    if (S.dizzy.visible) { S.dizzy.position.set(px, 0.9, A.g.position.z + 1.0); S.dizzy.rotation.y = time * 5; }
  }
  function cam(raw) {
    const k = 1 - Math.exp(-raw * 9), sm = (x) => x * x * (3 - 2 * x);
    camX += (px * 0.62 - camX) * k;
    shake = Math.max(0, shake - raw * 1.7);
    kick += ((state === "play" ? clamp((speed - V0) / (VMAX - V0), 0, 1) * 7 : 0) - kick) * k;
    const p = tmp.p.set(camX + (Math.random() - 0.5) * shake * 0.8, CAM_Y + py * 0.25 + (Math.random() - 0.5) * shake * 0.6, CAM_Z);
    const l = tmp.l.set(camX * 1.2, 1.3 + py * 0.2, -10);
    // opening scene: looking at the wall from the road
    if (introK > 0.002) { const e = sm(introK); p.lerp(tmp.a.set(3.9, 1.6, 0.6), e); l.lerp(tmp.b.set(-3.5, -0.3, 0.2), e); }
    camera.position.copy(p); camera.lookAt(l);
    camera.fov = baseFov + kick; camera.updateProjectionMatrix();
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
    if (state === "play" && !quality.done && !document.hidden) {     // slow phone: drop shadows and resolution
      quality.sum += Math.min(0.1, real);
      if (++quality.n >= 150) { quality.done = true; if (quality.sum / quality.n > 0.027) lowQuality(); }
    }
    if (state === "ar") { arStep(raw); renderer.render(ar.scene, ar.cam); return; }
    if (!frozen) step(raw);
    renderer.render(scene, camera);
  }

  /* ---------- AR: the runner on top of the phone's camera picture ---------- */
  async function arOpen() {
    if (!["play", "pause"].includes(state)) return;
    const back = state === "pause" ? prevState : state;
    prevState = back; state = "ar"; hideCard(); RunAudio.music(false);
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); } catch {}
    if (!alive) { if (stream) stream.getTracks().forEach((t) => t.stop()); return; }
    if (!stream) { state = "pause"; return arFail(); }
    if (!ar) {
      const sc = new T.Scene(), d = new T.DirectionalLight(0xffffff, 2);
      d.position.set(2, 4, 3); sc.add(new T.HemisphereLight(0xffffff, 0x8a8f99, 2.2), d);
      const blob = new T.Mesh(new T.CircleGeometry(0.42, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = 0.01; sc.add(blob);
      ar = { scene: sc, cam: new T.PerspectiveCamera(50, 1, 0.1, 100), blob };
    }
    const v = document.createElement("video");
    v.className = "run-video"; v.setAttribute("playsinline", ""); v.muted = true; v.autoplay = true; v.srcObject = stream;
    root.prepend(v); v.play().catch(() => {});
    Object.assign(ar, { on: true, stream, video: v, back, yaw: Math.PI, flip: -1, mode: "run" });
    ar.scene.add(P.g); P.g.position.set(0, 0, 0); P.g.visible = true;
    S.can.visible = S.bottle.visible = S.apple.visible = false;
    root.classList.add("ar");
    el.arbar.innerHTML = `<p>Barmoq bilan aylantiring · bosing: salto</p><div>
      <button data-m="run">${ic("zap")}Yugurish</button><button data-m="wave">${ic("hand")}Salom</button><button data-m="flip">${ic("sparkles")}Salto</button><button data-m="x" class="x" aria-label="Yopish">${ic("x")}</button></div>`;
    el.arbar.querySelectorAll("button").forEach((b) => { b.onclick = () => { const m = b.dataset.m; m === "x" ? arClose() : m === "flip" ? arFlip() : (ar.mode = m); }; });
    buzz("medium");
  }
  function arFail() {
    card(`${chip("alert", "lg solid")}<h2>Kamera ochilmadi</h2><p>AR uchun kameraga ruxsat bering. Telegram'ning ba'zi versiyalarida kamera Mini App ichida ishlamaydi.</p><button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>`,
      { go: () => { hideCard(); state = prevState; RunAudio.music(true); last = performance.now(); } });
  }
  function arStop() {
    if (!ar || !ar.on) return;
    ar.on = false; ar.stream.getTracks().forEach((t) => t.stop()); ar.video.remove();
    if (root) { root.classList.remove("ar"); el.arbar.innerHTML = ""; }
  }
  function arClose() {
    arStop();
    scene.add(P.g); P.pivot.rotation.set(0, 0, 0); P.g.rotation.set(0, 0, 0); P.g.position.set(px, py, 0);
    state = "pause"; prevState = ar.back; pauseCard();
  }
  function arFlip() { if (ar && ar.on && ar.flip < 0) { ar.flip = 0; sfx("trick"); buzz("medium"); } }
  function arStep(raw) {
    const A = P; time += raw;
    ar.cam.aspect = Math.max(1, W) / Math.max(1, H);
    ar.cam.position.set(0, 1.25, 3.6); ar.cam.lookAt(0, 0.85, 0); ar.cam.updateProjectionMatrix();
    A.g.rotation.y = ar.yaw;
    let y = 0, fx = 0;
    A.head.rotation.set(0, 0, 0);
    if (ar.flip >= 0) {            // standing back flip
      ar.flip += raw;
      const q = Math.min(1, ar.flip / 0.9), e = q * q * (3 - 2 * q), t = Math.sin(Math.PI * q);
      y = t * 1.1; fx = Math.PI * 2 * e;
      A.hL.rotation.x = A.hR.rotation.x = 1.6 * t; A.kL.rotation.x = A.kR.rotation.x = -2 * t;
      A.sL.rotation.set(2.4, 0, -0.3); A.sR.rotation.set(2.4, 0, 0.3); A.eL.rotation.x = A.eR.rotation.x = 0.4 + t;
      A.pivot.position.y = HIP;
      if (q >= 1) ar.flip = -1;
    } else if (ar.mode === "wave") {   // waving with both hands
      const w = Math.sin(time * 12) * 0.35;
      A.hL.rotation.x = A.hR.rotation.x = 0; A.kL.rotation.x = A.kR.rotation.x = -0.05;
      A.sL.rotation.set(0.2, 0, -2.5 - w); A.sR.rotation.set(0.2, 0, 2.5 + w); A.eL.rotation.x = A.eR.rotation.x = 0.4;
      A.body.rotation.x = 0; A.pivot.position.y = HIP + Math.abs(Math.sin(time * 6)) * 0.03;
    } else { A.sL.rotation.z = -0.1; A.sR.rotation.z = 0.1; runPose(A, time * 11, false); }
    A.pivot.rotation.set(fx, 0, 0);
    A.g.position.set(0, y, 0);
    ar.blob.scale.setScalar(Math.max(0.4, 1 - y * 0.4));
  }

  /* ---------- game flow ---------- */
  function reset(first) {
    for (const o of objs) drop(o);
    objs = [];
    speed = V0; dist = 0; coins = 0; hearts = HEARTS; rows = 0; runT = 0;
    lane = prevLane = first ? 0 : 1; px = first ? -2.55 : 0; py = vy = gy = 0; grounded = true; fastFall = false;
    rollT = lowT = jumpBuf = invuln = stumbleT = crashT = nmSlow = shake = 0;
    laneAt = jumpAt = rollAt = lastWave = -9; trick = wave = eat = rest = null; nextEat = 12; dbl = false; ninjaT = flipT = safe = 0; combo = 0; tipA = tipB = false; ts = 1;
    P.pivot.rotation.set(0, 0, 0); P.g.position.set(px, 0, 0); P.yaw = P.tilt = 0; P.g.rotation.y = first ? Math.PI / 2 : 0;
    S.apple.visible = S.bottle.visible = S.bag.visible = false;
    if (!first) { S.wall.visible = false; introK = 0; }
    hud(true);
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
    if (first) { state = "intro"; introT = 0; guardT = 0; guardX = -2.4; sfx("whistle"); pop("Hoy, to'xta!", "bad"); }   // the watchman turns up
    else state = "play";
    last = performance.now();
  }
  function pause() {
    if (!["play", "intro", "rest"].includes(state)) return;
    prevState = state; state = "pause"; RunAudio.music(false);
    pauseCard();
  }
  function pauseCard() {
    card(`${chip("pause", "lg solid")}<h2>Pauza</h2><button class="btn-primary" data-a="go">${ic("play")} Davom etish</button><button class="btn-ghost" data-a="out">Chiqish</button>`,
      { go: () => { hideCard(); state = prevState; RunAudio.music(true); last = performance.now(); }, out: exit });
  }
  // Telegram's back button pauses a run instead of leaving the game
  function onBack() { if (["play", "intro", "rest"].includes(state)) { pause(); return true; } return false; }
  function crash() {
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
    invuln = 1.6; speed = Math.max(V0, speed * 0.85); spawnIn = Math.max(spawnIn, 16);
    trail(lane, -14, 5);
    state = "play"; last = performance.now();
  }
  function gameOver() {
    state = "over"; RunAudio.music(false);
    const s = score(), b = best(), isBest = s > b;
    if (isBest) store.set("run_best", s);
    const me = [store.get("school", "Sening maktabing"), user.first_name || "Sen", Math.max(s, b)];
    const board = [...SCHOOL_BOARD, me].sort((a, c) => c[2] - a[2]), mine = board.indexOf(me);
    const row = (r, i) => `<div class="${r === me ? "me" : ""}"><span>${i + 1}</span><span>${r[1]}<small>${r[0]}</small></span><b>${r[2]}</b></div>`;
    root.classList.add("over");
    card(`
      ${chip(isBest ? "trophy" : "flag", "lg solid")}
      <h2>${isBest ? "Yangi rekord!" : "O'yin tugadi"}</h2>
      <div class="run-score">${s}</div>
      <p>${Math.floor(dist)} m · ${coins} tanga</p>
      <div class="run-board">
        <b>Haftalik maktablar reytingi</b>
        ${board.slice(0, 5).map(row).join("")}${mine >= 5 ? row(me, mine) : ""}
      </div>
      <button class="btn-primary" data-a="play">${ic("refresh")} Qayta o'ynash</button>
      <button class="btn-ghost" data-a="share">Do'stlarni chaqirish</button>`,
      { play, share: () => share(s) });
    if (isBest) { buzz("success"); confetti(28); }
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
    for (let i = 0; i < sec * 60 && ["play", "rest", "intro"].includes(state); i++) step(1 / 60);
    auto = was; renderer.render(scene, camera);
    return _info();
  }
  function _mood(i) { moodOverride = moodIdx = i; applyMood(1); renderer.render(scene, camera); return MOODS[i].name; }
  const _info = () => ({ state, dist: Math.floor(dist), coins, hearts, speed: Math.round(speed), py: +py.toFixed(2), trick: trick && trick.name, eat: !!eat, objs: objs.length, calls: renderer && renderer.info.render.calls });
  const _set = (o) => { if (o.dist != null) dist = o.dist; if (o.eat != null) nextEat = o.eat; if (o.rest != null) nextRest = o.rest; };

  return { mount, unmount, play, pause, exit, onBack, _sim, _mood, _act: act, _info, _set, _freeze: (f) => { frozen = f; } };
})();

const SCHOOL_BOARD = [
  ["Xiva sh. 3-IDUM", "Dilnoza", 4820], ["Toshkent, 110-maktab", "Jasur", 4310], ["Samarqand sh. 12-maktab", "Madina", 3975],
  ["Andijon sh. 5-IDUM", "Sardor", 3540], ["Buxoro sh. 21-maktab", "Kamola", 3120], ["Namangan sh. 34-maktab", "Bekzod", 2760],
];
