// Chorsu Run: an original 3-lane runner set in Chorsu bazaar.
// Swipe left/right to change lane, swipe up (or tap the middle) to jump.

const REVIVE_QUIZ = [
  { q: "Excelda ustundagi sonlarni qo'shish uchun qaysi funksiya?", a: ["SUM", "COUNT", "IF"], ok: 0 },
  { q: "\"I ___ a student\": bo'sh joyga nima qo'yiladi?", a: ["is", "am", "are"], ok: 1 },
  { q: "HTML nima uchun ishlatiladi?", a: ["Rasm chizish", "Veb sahifa tuzilishi", "Ma'lumotlar bazasi"], ok: 1 },
  { q: "Python'da ekranga chiqarish buyrug'i?", a: ["echo()", "print()", "show()"], ok: 1 },
  { q: "SMM nimani anglatadi?", a: ["Ijtimoiy tarmoq marketingi", "Sayt muhandisligi", "Server boshqaruvi"], ok: 0 },
  { q: "Figma qaysi soha uchun dastur?", a: ["Buxgalteriya", "Dizayn", "Montaj"], ok: 1 },
  { q: "1 GB necha MB ga teng (taxminan)?", a: ["100", "1000", "10"], ok: 1 },
  { q: "\"Thank you\" so'zining tarjimasi?", a: ["Rahmat", "Salom", "Kechirasiz"], ok: 0 },
  { q: "ChatGPT qanday texnologiya?", a: ["Antivirus", "Sun'iy intellekt", "Brauzer"], ok: 1 },
  { q: "IELTS imtihoni nimani baholaydi?", a: ["Matematika", "Ingliz tili", "Informatika"], ok: 1 },
];

const SCHOOL_BOARD = [
  ["Xiva sh. 3-IDUM", "Dilnoza", 4820], ["Toshkent, 110-maktab", "Jasur", 4310], ["Samarqand sh. 12-maktab", "Madina", 3975],
  ["Andijon sh. 5-IDUM", "Sardor", 3540], ["Buxoro sh. 21-maktab", "Kamola", 3120], ["Namangan sh. 34-maktab", "Bekzod", 2760],
];

const Game = (() => {
  let cv, ctx, W, H, raf = null, last = 0, state = "menu";
  let lane = 1, laneX = 1, jumpT = 0, objs = [], speed, dist, coins, spawnIn, revived, t = 0, runPhase = 0;
  let root, overlay, hud;

  const HORIZON = 0.30, PLAYER_Y = 0.80, FAR = 60;
  const KINDS = {
    damas: { e: "🚐", size: 1.25, tall: true },
    cart:  { e: "🛒", size: 0.95, tall: false },
    puddle:{ e: null, size: 1.0, tall: false },
    non:   { e: "🫓", size: 0.7, pick: 5 },
    samsa: { e: "🥟", size: 0.7, pick: 10 },
    coin:  { e: "🪙", size: 0.6, pick: 1 },
  };
  const AWNINGS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

  const best = () => store.get("run_best", 0);

  function mount() {
    // attached to body: #app's fade animation would otherwise trap position:fixed
    root = document.createElement("div");
    document.body.appendChild(root);
    root.innerHTML = `
      <div class="run">
        <canvas id="runcv"></canvas>
        <div class="run-hud" id="runhud"></div>
        <button class="run-x" onclick="Game.exit()" aria-label="Yopish">${ic("x")}</button>
        <div class="run-ov" id="runov"></div>
      </div>`;
    cv = root.querySelector("#runcv"); ctx = cv.getContext("2d");
    overlay = root.querySelector("#runov"); hud = root.querySelector("#runhud");
    resize(); window.addEventListener("resize", resize);
    bindInput();
    reset(); showMenu();
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function unmount() {
    cancelAnimationFrame(raf); raf = null;
    if (root) { root.remove(); root = null; }
    window.removeEventListener("resize", resize);
    window.removeEventListener("keydown", onKey);
  }
  function resize() {
    const r = window.devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * r; cv.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
  }

  function reset() {
    lane = 1; laneX = 1; jumpT = 0; objs = []; speed = 18; dist = 0; coins = 0; spawnIn = 1; revived = false;
  }

  /* ---------- input ---------- */
  function move(d) { if (state !== "play") return; lane = Math.max(0, Math.min(2, lane + d)); haptic("light"); }
  function jump() { if (state !== "play" || jumpT > 0) return; jumpT = 0.0001; haptic("light"); }
  function onKey(e) {
    if (e.key === "ArrowLeft" || e.key === "a") move(-1);
    else if (e.key === "ArrowRight" || e.key === "d") move(1);
    else if (e.key === "ArrowUp" || e.key === " " || e.key === "w") { e.preventDefault(); jump(); }
  }
  function bindInput() {
    window.addEventListener("keydown", onKey);
    let sx = 0, sy = 0, st = 0;
    cv.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
    cv.addEventListener("pointerup", (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
      else if (dy < -30) jump();
      else if (Date.now() - st < 250) {
        const x = e.clientX / W;
        x < 0.33 ? move(-1) : x > 0.67 ? move(1) : jump();
      }
    });
  }

  /* ---------- world ---------- */
  function spawn() {
    const r = Math.random();
    const free = [0, 1, 2];
    // obstacles: never block all three lanes
    const n = speed > 26 && r < 0.35 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const l = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const k = Math.random();
      objs.push({ kind: k < 0.45 ? "damas" : k < 0.75 ? "cart" : "puddle", lane: l, d: FAR });
    }
    // pickups in a remaining lane, as a short trail
    const pl = free[Math.floor(Math.random() * free.length)];
    const pk = Math.random() < 0.15 ? "samsa" : Math.random() < 0.35 ? "non" : "coin";
    for (let j = 0; j < 4; j++) objs.push({ kind: pk, lane: pl, d: FAR + 6 + j * 3.2 });
  }

  function update(dt) {
    t += dt;
    if (state !== "play") return;
    speed = Math.min(40, speed + dt * 0.45);
    dist += speed * dt;
    runPhase += dt * speed * 0.6;
    laneX += (lane - laneX) * Math.min(1, dt * 14);
    if (jumpT > 0) { jumpT += dt; if (jumpT > 0.62) jumpT = 0; }
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.55, 1.35 - speed / 60); }

    const airborne = jumpT > 0.08 && jumpT < 0.54;
    for (const o of objs) {
      o.d -= speed * dt;
      if (o.hit || o.d > 1.2 || o.d < -0.6) continue;
      if (Math.abs(o.lane - laneX) > 0.45) continue;
      const k = KINDS[o.kind];
      if (k.pick) { o.hit = true; coins += k.pick; haptic("light"); continue; }
      if (!k.tall && airborne) continue;
      o.hit = true; crash(); return;
    }
    objs = objs.filter((o) => o.d > -3 && !(o.hit && KINDS[o.kind].pick));
    hud.innerHTML = `<span>${ic("flag")}${Math.floor(dist)} m</span><span>${ic("coin")}${coins}</span>`;
  }

  function score() { return Math.floor(dist) + coins * 10; }

  /* ---------- drawing ---------- */
  const persp = (d) => 1 / (1 + Math.max(d, -0.9) * 0.22);
  function project(laneF, d) {
    const s = persp(d), hy = H * HORIZON, py = H * PLAYER_Y;
    return { x: W / 2 + (laneF - 1) * W * 0.30 * s, y: hy + (py - hy) * s, s };
  }

  function draw() {
    const hy = H * HORIZON;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, "#7DD3FC"); sky.addColorStop(1, "#E0F2FE");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy + 1);
    // sun + Chorsu dome on the horizon
    ctx.fillStyle = "rgba(255,237,150,.9)"; ctx.beginPath(); ctx.arc(W * 0.82, hy * 0.35, 22, 0, 7); ctx.fill();
    const dx = W / 2, dw = W * 0.34;
    ctx.fillStyle = "#C7A27C"; ctx.fillRect(dx - dw * 0.62, hy - 26, dw * 1.24, 26);
    ctx.fillStyle = "#1D6FD8"; ctx.beginPath(); ctx.ellipse(dx, hy - 26, dw / 2, dw * 0.42, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(dx, hy - 26, Math.abs(i) * dw / 8, dw * 0.42, 0, Math.PI, 0); ctx.stroke(); }
    ctx.fillStyle = "#1557B0"; ctx.beginPath(); ctx.ellipse(dx - dw * 0.55, hy - 26, dw * 0.14, dw * 0.13, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(dx + dw * 0.55, hy - 26, dw * 0.14, dw * 0.13, 0, Math.PI, 0); ctx.fill();

    // ground
    ctx.fillStyle = "#E9DCC5"; ctx.fillRect(0, hy, W, H - hy);
    // road (stone)
    const L = project(-0.55, FAR), R = project(2.55, FAR), BL = project(-0.55, -0.9), BR = project(2.55, -0.9);
    ctx.fillStyle = "#B9AFA3"; ctx.beginPath();
    ctx.moveTo(L.x, hy); ctx.lineTo(R.x, hy); ctx.lineTo(BR.x + 200, H); ctx.lineTo(BL.x - 200, H); ctx.fill();
    // moving stripes across the road
    for (let i = 0; i < 26; i++) {
      const d = ((i * 2.5 - (dist % 2.5)) + 2.5) - 1;
      if (d < -0.9 || d > FAR) continue;
      const a = project(-0.55, d), b = project(2.55, d);
      ctx.strokeStyle = i % 2 ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.05)"; ctx.lineWidth = Math.max(1, 6 * a.s);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // lane lines
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2;
    for (const lf of [0.5, 1.5]) { const a = project(lf, FAR), b = project(lf, -0.9); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }

    // bazaar stalls on both sides
    for (let i = 0; i < 14; i++) {
      const d = (i * 4.5 - (dist % 4.5)) + 1;
      if (d < -0.5) continue;
      for (const side of [-1, 1]) {
        const p = project(side < 0 ? -1.35 : 3.35, d), w = 70 * p.s, h = 60 * p.s;
        ctx.fillStyle = "#8B5E3C"; ctx.fillRect(p.x - w / 2, p.y - h, w, h);
        ctx.fillStyle = AWNINGS[(i + (side > 0 ? 3 : 0)) % AWNINGS.length];
        ctx.beginPath(); ctx.moveTo(p.x - w * 0.65, p.y - h); ctx.lineTo(p.x + w * 0.65, p.y - h); ctx.lineTo(p.x + w / 2, p.y - h * 1.45); ctx.lineTo(p.x - w / 2, p.y - h * 1.45); ctx.fill();
        ctx.fillStyle = "#000"; ctx.font = `${Math.max(6, 26 * p.s)}px serif`; ctx.textAlign = "center";
        ctx.fillText(["🍉", "🍇", "🍑", "🥕", "🍅", "🍈"][(i + (side > 0 ? 2 : 0)) % 6], p.x, p.y - h * 0.25);
      }
    }

    // objects far to near
    const sorted = objs.filter((o) => !o.hit || !KINDS[o.kind].pick).sort((a, b) => b.d - a.d);
    for (const o of sorted) {
      if (o.d > FAR || o.d < -0.9) continue;
      const p = project(o.lane, o.d), k = KINDS[o.kind];
      if (o.kind === "puddle") {
        ctx.fillStyle = "rgba(56,130,220,.55)";
        ctx.beginPath(); ctx.ellipse(p.x, p.y - 4 * p.s, 70 * p.s, 18 * p.s, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(p.x - 20 * p.s, p.y - 8 * p.s, 18 * p.s, 4 * p.s, 0, 0, 7); ctx.fill();
        continue;
      }
      const size = 96 * k.size * p.s;
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, size * 0.45, size * 0.1, 0, 0, 7); ctx.fill();
      const bob = k.pick ? Math.sin(t * 6 + o.d) * 6 * p.s : 0;
      ctx.fillStyle = "#000"; ctx.font = `${size}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(k.e, p.x, p.y - size * 0.08 + bob);
    }

    // player
    const pp = project(laneX, 0);
    const jh = jumpT > 0 ? Math.sin((jumpT / 0.62) * Math.PI) * H * 0.16 : 0;
    const ps = 84;
    ctx.fillStyle = `rgba(0,0,0,${0.18 - jh / H})`; ctx.beginPath(); ctx.ellipse(pp.x, pp.y + 4, ps * 0.35, ps * 0.09, 0, 0, 7); ctx.fill();
    ctx.save();
    ctx.translate(pp.x, pp.y - jh + (jh ? 0 : Math.abs(Math.sin(runPhase)) * -6));
    ctx.scale(-1, 1); // emoji runs left by default; face forward-right
    ctx.fillStyle = "#000"; ctx.font = `${ps}px serif`; ctx.textAlign = "center"; ctx.fillText(state === "dead" ? "😵" : "🏃", 0, -4);
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (cv.clientWidth !== W || cv.clientHeight !== H) resize(); // layout can settle after mount
    update(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  /* ---------- overlays ---------- */
  function showMenu() {
    state = "menu"; hud.innerHTML = "";
    overlay.className = "run-ov show";
    overlay.innerHTML = `
      <div class="run-card">
        ${chip("gamepad", "lg solid")}
        <h2>Chorsu Run</h2>
        <p>Chorsu bozorida yugur! Damasdan qoch, arava va ko'lmakdan sakra, non va samsa yig'.</p>
        <div class="run-help"><span>${ic("sides")}<small>yo'lak almashtir</small></span><span>${ic("up")}<small>sakra</small></span><span>${ic("offline")}<small>internetsiz</small></span></div>
        <div class="run-best">${ic("trophy")} Eng yaxshi natijang: <b>${best()}</b></div>
        <button class="btn-primary" onclick="Game.play()">${ic("play")} O'ynash</button>
      </div>`;
  }
  function play() { reset(); state = "play"; overlay.className = "run-ov"; overlay.innerHTML = ""; haptic("medium"); }

  function crash() {
    state = "dead";
    try { tg.HapticFeedback.notificationOccurred("error"); } catch {}
    setTimeout(revived ? gameOver : askRevive, 450);
  }
  function askRevive() {
    const q = REVIVE_QUIZ[Math.floor(Math.random() * REVIVE_QUIZ.length)];
    overlay.className = "run-ov show";
    overlay.innerHTML = `
      <div class="run-card">
        ${chip("alert", "lg solid")}
        <h2>Bilim bilan davom et!</h2>
        <p>To'g'ri javob ber va yugurishni davom ettir</p>
        <div class="run-q">${q.q}</div>
        ${q.a.map((a, i) => `<button class="run-opt" onclick="Game.answer(this, ${i === q.ok})">${a}</button>`).join("")}
        <button class="btn-ghost" onclick="Game.over()">Tugatish</button>
      </div>`;
  }
  function answer(btn, ok) {
    btn.classList.add(ok ? "ok" : "bad");
    overlay.querySelectorAll(".run-opt").forEach((b) => (b.disabled = true));
    try { tg.HapticFeedback.notificationOccurred(ok ? "success" : "error"); } catch {}
    setTimeout(() => {
      if (!ok) return gameOver();
      revived = true;
      objs = objs.filter((o) => o.d > 12);   // clear the road ahead
      state = "play"; overlay.className = "run-ov"; overlay.innerHTML = "";
    }, 700);
  }
  function gameOver() {
    state = "over";
    const s = score(), b = best(), isBest = s > b;
    if (isBest) store.set("run_best", s);
    const me = [store.get("school", "Sening maktabing"), user.first_name || "Sen", Math.max(s, b)];
    const board = [...SCHOOL_BOARD, me].sort((a, c) => c[2] - a[2]);
    overlay.className = "run-ov show";
    overlay.innerHTML = `
      <div class="run-card">
        ${chip(isBest ? "trophy" : "flag", "lg solid")}
        <h2>${isBest ? "Yangi rekord!" : "O'yin tugadi"}</h2>
        <div class="run-score">${s}</div>
        <p>${Math.floor(dist)} m yugurding · ${coins} ta non va samsa</p>
        <div class="run-board">
          <b>Haftalik maktablar reytingi</b>
          ${board.slice(0, 7).map((r, i) => `<div class="${r === me ? "me" : ""}"><span>${i + 1}</span><span>${r[1]}<small>${r[0]}</small></span><b>${r[2]}</b></div>`).join("")}
          <small class="run-prize">${ic("gift")} Hafta g'olibi maktabiga: Premium kurslar</small>
        </div>
        <button class="btn-primary" onclick="Game.play()">${ic("refresh")} Yana o'ynash</button>
        <button class="btn-ghost" onclick="Game.share(${s})">Do'stlarni chaqirish</button>
      </div>`;
  }
  function share(s) {
    const link = `https://t.me/${BOT}?start=run_${user.id}`;
    const text = `Chorsu Run'da ${s} ball to'pladim. Meni yenga olasanmi?`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
  }
  function exit() { location.hash = "#/"; }

  // test hook: fast-forward game time (the hidden preview pane throttles animation frames)
  function _sim(sec) { for (let i = 0; i < sec * 60 && state === "play"; i++) update(1 / 60); draw(); return { state, dist: Math.floor(dist), coins }; }

  return { mount, unmount, play, answer, over: gameOver, share, exit, _sim };
})();
