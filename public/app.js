const tg = window.Telegram && window.Telegram.WebApp;
const BOT = "ustozaiminibot";
const app = document.getElementById("app");
const tabbar = document.getElementById("tabbar");

const store = {
  get(k, d) { try { const v = localStorage.getItem("uz_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("uz_" + k, JSON.stringify(v)); } catch {} },
};

const user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 0, first_name: "Aziz" };
const startParam = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;

const haptic = (type = "light") => { try { tg.HapticFeedback.impactOccurred(type); } catch {} };

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ---------- theme ---------- */
const THEMES = { blue: ["Ko'k", "#2748F5", "#6C95FF"], orange: ["To'q sariq", "#F2600C", "#FFB066"], green: ["Yashil", "#0B8F6A", "#5FD3AE"] };
function applyTheme(name) {
  document.body.dataset.theme = name;
  store.set("theme", name);
  try { tg.setHeaderColor("#F5F6FA"); tg.setBackgroundColor("#F5F6FA"); } catch {}
}
applyTheme(store.get("theme", "blue"));

/* ---------- icons: one consistent outline set, 24x24, drawn with currentColor ---------- */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  cap: '<path d="M2 9.5 12 5l10 4.5-10 4.5zM6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5M22 9.5V15"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 11v3M5.5 12.5h3M15.5 11.5h.01M18 13.5h.01"/>',
  book: '<path d="M12 6.5C10.5 5 8 4.5 3 4.5v14c5 0 7.5.5 9 2 1.5-1.5 4-2 9-2v-14c-5 0-7.5.5-9 2zM12 6.5v14"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><path d="M7.5 7.5h.01"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  chart: '<path d="M5 20V11M11 20V4M17 20v-7M21 20H3"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.7-1.5-.7-2.5S14 15 15.5 15H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><path d="M7.5 12h.01M9 8h.01M13 6.5h.01M16.5 9.5h.01"/>',
  megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h2l8 4V5L6 9H4a1 1 0 0 0-1 1zM18 9a4 4 0 0 1 0 6M7 15v4a1 1 0 0 0 1 1h1.5"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4.5M9 13v2M15 13v2M2 13v3M22 13v3"/><circle cx="12" cy="3.5" r="1"/>',
  layers: '<path d="m12 3 9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
  chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18h2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  rocket: '<path d="M12 15c-1.5-1-3-2.5-3-3 0-4 3-8 9-9 1 6-3 9-6 12zM9 12l-4 1-2 3 4-.5M12 15l-1 4 3-2 .5-4M15.5 8.5h.01"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14 7l3 3"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
  file: '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 13h6M9 17h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  plane: '<path d="M10 14 3 11l18-8-6 18-3-7zM10 14l4-4"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h6M7 12h10M7 16h10"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
  offline: '<path d="M3 3l18 18M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4-2.5M19 12.5a10 10 0 0 0-5.5-2.9M2 9a15 15 0 0 1 4.5-3M22 9a15 15 0 0 0-11-4M12 20h.01"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  school: '<path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M3 21h18M12 9.5h.01"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8S10.5 3.5 8 3.5a2.2 2.2 0 0 0 0 4.5zM12 8s1.5-4.5 4-4.5a2.2 2.2 0 0 1 0 4.5z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 4L20 15M20 20v-5h-5"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  sides: '<path d="M8 7 3 12l5 5M16 7l5 5-5 5M3 12h18"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  cup: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  sparkles: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.5-1-1.7-1.5-3-1.5-1.7 0-3 .8-3 2s1 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.5-.5-3-1.5"/>',
  run: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  alert: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  sunset: '<path d="M5 17a7 7 0 0 1 14 0M2 17h20M12 3v4M4.6 8.6l2 2M19.4 8.6l-2 2M7 21h10"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  rain: '<path d="M7 15a4.5 4.5 0 1 1 1.2-8.8A5.5 5.5 0 0 1 18.8 8 3.5 3.5 0 0 1 18 15zM8 18.5l-1 2.5M12.5 18.5l-1 2.5M17 18.5l-1 2.5"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.3a8 8 0 0 1 0 11.4"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  tap: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/>',
  ar: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M12 7l4.5 2.5v5L12 17l-4.5-2.5v-5zM12 12v5M12 12l4.5-2.5M12 12 7.5 9.5"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7c-2.5 0-4-1.3-5.4-3.4L3 14.5a1.5 1.5 0 0 1 2.5-1.6L8 16"/>',
};
const ic = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
// icon inside a soft tinted rounded square
const chip = (name, cls = "") => `<span class="chip ${cls}">${ic(name)}</span>`;

const compassSVG = `<svg class="compass" viewBox="0 0 200 200" aria-hidden="true">
  <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="74" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="56" fill="#fff"/>
  <g stroke="var(--p1)" stroke-width="2.5" stroke-linecap="round" opacity=".35">
    <path d="M100 50v8M100 142v8M50 100h8M142 100h8"/></g>
  <path d="M100 100 124 76 108 108z" fill="var(--p1)"/><path d="M100 100 76 124 92 92z" fill="var(--p2)"/>
  <circle cx="100" cy="100" r="5" fill="#fff" stroke="var(--p1)" stroke-width="2.5"/></svg>`;

/* ---------- tab bar ---------- */
const TABS = [["#/", "Asosiy", "home"], ["#/kurslar", "Kurslar", "play"], ["#/tanlov", "Tanlov", "trophy"], ["#/kashf", "Kashf et", "compass"], ["#/profil", "Profil", "user"]];
function renderTabs(route) {
  const hidden = ["#/kompas", "#/natija", "#/oyin"].includes(route);
  tabbar.classList.toggle("hide", hidden);
  tabbar.innerHTML = TABS.map(([h, l, i]) => `<a href="${h}" class="${h === route ? "on" : ""}">${ic(i)}<span>${l}</span></a>`).join("");
}

const navbar = (title) => `<div class="navbar"><button class="icon-btn" onclick="goBack()">${ic("back")}</button><h1>${title}</h1><span></span></div>`;
window.goBack = () => { if (typeof Game !== "undefined" && gameOn && Game.onBack()) return; history.length > 1 ? history.back() : (location.hash = "#/"); };

/* ---------- screens ---------- */
function Home() {
  const tiles = [["cap", "Kurslar", "#/kurslar"], ["gamepad", "O'yin", "#/oyin"], ["book", "Mutolaa", "#/mutolaa"], ["trophy", "Tanlov", "#/tanlov"], ["tag", "Chegirmalar", "#/chegirma"], ["grid", "Vositalar", "#/vositalar"]];
  const res = store.get("result");
  return `
  <div class="topbar"><div class="brand"><img class="logo" src="logo.png" alt="">Ustoz AI</div></div>
  <a class="hero" href="#/kompas">
    <span class="hero-tag">90 soniya</span>
    <h3>Kasb Kompasi</h3>
    <p>O'zingga mos kasb va kurslarni top</p>
    ${compassSVG}
    <span class="btn-white">Boshlash ${ic("chev")}</span>
  </a>
  <div class="grid">${tiles.map(([i, l, h], n) => `<a class="tile t${n + 1}" href="${h}">${chip(i, "c" + (n + 1))}${l}</a>`).join("")}</div>
  ${res ? `<div class="section-title">Sening natijang</div>
    <a class="list-item" href="#/natija">${chip(PERSONAS[res].icon, "sm")}${PERSONAS[res].name}${ic("chev", "chev")}</a>` : ""}`;
}

let quiz = { i: 0, scores: {} };
function Kompas() {
  if (quiz.i >= QUIZ.length) quiz = { i: 0, scores: {} };
  const q = QUIZ[quiz.i], next = QUIZ[quiz.i + 1];
  return `${navbar("Kasb Kompasi")}
  <div class="progress"><span style="width:${(quiz.i / QUIZ.length) * 100}%"></span></div>
  <div class="q-count">${quiz.i + 1} / ${QUIZ.length}</div>
  <div class="stack">
    ${next ? `<div class="qcard back">${chip(next.i, "xl")}<h3>${next.q}</h3></div>` : ""}
    <div class="qcard" id="qcard">
      <span class="stamp yes">HA</span><span class="stamp no">YO'Q</span>
      ${chip(q.i, "xl")}<h3>${q.q}</h3>
      <div class="hint">chapga: yo'q · o'ngga: ha</div>
    </div>
  </div>
  <div class="swipe-btns"><button class="no" onclick="answer(false)" aria-label="Yo'q">${ic("x")}</button><button class="yes" onclick="answer(true)" aria-label="Ha">${ic("check")}</button></div>`;
}
function bindSwipe() {
  const card = document.getElementById("qcard");
  if (!card) return;
  const yes = card.querySelector(".stamp.yes"), no = card.querySelector(".stamp.no");
  let x0 = null, dx = 0;
  card.addEventListener("pointerdown", (e) => { x0 = e.clientX; card.style.transition = "none"; card.setPointerCapture(e.pointerId); });
  card.addEventListener("pointermove", (e) => {
    if (x0 == null) return;
    dx = e.clientX - x0;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    yes.style.opacity = Math.max(0, dx / 100); no.style.opacity = Math.max(0, -dx / 100);
  });
  card.addEventListener("pointerup", () => {
    card.style.transition = "";
    if (Math.abs(dx) > 90) answer(dx > 0);
    else { card.style.transform = ""; yes.style.opacity = 0; no.style.opacity = 0; }
    x0 = null; dx = 0;
  });
}
window.answer = (yes) => {
  const card = document.getElementById("qcard");
  haptic(yes ? "medium" : "light");
  if (yes) for (const [k, v] of Object.entries(QUIZ[quiz.i].t)) quiz.scores[k] = (quiz.scores[k] || 0) + v;
  if (card) { card.style.transform = `translateX(${yes ? 500 : -500}px) rotate(${yes ? 25 : -25}deg)`; card.style.opacity = 0; }
  setTimeout(() => {
    quiz.i++;
    if (quiz.i >= QUIZ.length) {
      const order = ["data", "code", "design", "mkt", "ai"];
      const best = order.reduce((a, b) => ((quiz.scores[b] || 0) > (quiz.scores[a] || 0) ? b : a), "data");
      const total = Object.values(quiz.scores).reduce((a, b) => a + b, 0) || 1;
      store.set("result", best);
      store.set("match", Math.min(97, Math.round(60 + ((quiz.scores[best] || 0) / total) * 90)));
      quiz = { i: 0, scores: {} };
      try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
      location.replace("#/natija");
    } else render();
  }, 220);
};

function Natija() {
  const key = store.get("result");
  if (!key) { location.replace("#/kompas"); return ""; }
  const p = PERSONAS[key], m = store.get("match", 92), c = 2 * Math.PI * 24;
  return `${navbar("Kasb Kompasi")}
  <div class="res-hero">
    <span class="glass g1">${ic(p.chips[0])}</span><span class="glass g2">${ic(p.chips[1])}</span>
    <span class="res-icon">${ic(p.icon)}</span>
  </div>
  <div class="res-body">
    <div class="pre">Sening tiping</div>
    <h2>${p.name}</h2>
    <p>${p.desc}</p>
    <div class="stats">
      <div class="stat">
        <svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke="var(--line)" stroke-width="6"/>
        <circle cx="29" cy="29" r="24" fill="none" stroke="var(--p1)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - m / 100)}" transform="rotate(-90 29 29)"/>
        <text x="29" y="34" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text)">${m}%</text></svg>
        <div><small>Moslik darajasi</small><b>${m}%</b></div>
      </div>
      <div class="stat"><div><small>Kutiladigan maosh</small><b>${p.salary}</b><small>so'm / oyiga</small></div></div>
    </div>
    <p class="jobs"><b>Kasblar:</b> ${p.jobs.join(", ")}</p>
  </div>
  <div class="section-title">Senga tavsiya etilgan kurslar</div>
  ${p.courses.map(([i, n]) => `<a class="list-item" href="#/kurslar">${chip(i, "sm")}${n}${ic("chev", "chev")}</a>`).join("")}
  <div style="margin-top:16px"><button class="btn-primary" onclick="shareResult()">${ic("send")} Do'stlarga ulashish</button></div>
  <button class="btn-ghost" onclick="quiz={i:0,scores:{}};location.hash='#/kompas'">Qaytadan topshirish</button>`;
}
window.shareResult = () => {
  const p = PERSONAS[store.get("result")];
  const link = `https://t.me/${BOT}?start=ref_${user.id}`;
  const text = `Men ${p.name} ekanman! Sen kimsan? Kasb Kompasini 90 soniyada top`;
  const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  haptic();
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
};

let lbTab = "viloyat";
const LB_ICON = { viloyat: "pin", maktab: "school", otm: "cap" };
function Tanlov() {
  const rows = LEADERBOARD[lbTab], top = rows.slice(0, 3);
  const me = lbTab === "viloyat" ? "Samarqand viloyati" : null;
  const short = (n) => n.replace(" viloyati", "").replace(" shahri", "");
  const pod = (r, i, cls) => `<div class="pod ${cls}"><div class="av">${ic(LB_ICON[lbTab])}</div><b>${esc(short(r[0]))}</b><small>${fmt(r[1])} ball</small><div class="stand">${i + 1}</div></div>`;
  return `${navbar("Tanlov")}
  <div class="lb-head">
    ${chip("trophy", "lg solid")}<h2>Zamonaviy kasblar tanlovi</h2><p>Maktab va OTMlar o'rtasida hududiy reyting</p>
    <div class="podium">${pod(top[1], 1, "second")}${pod(top[0], 0, "first")}${pod(top[2], 2, "third")}</div>
  </div>
  <div class="seg">${[["viloyat", "Viloyat"], ["maktab", "Maktab"], ["otm", "OTM"]].map(([k, l]) => `<button class="${k === lbTab ? "on" : ""}" onclick="setLb('${k}')">${l}</button>`).join("")}</div>
  <div class="card lb-list">${rows.map((r, i) => `<div class="lb-row ${r[0] === me ? "me" : ""}">
    <span class="rank ${i < 3 ? "r" + (i + 1) : ""}">${i + 1}</span>
    <span class="lb-name"><b>${esc(r[0])}</b><small>${fmt(r[1])} ball</small></span>
    <span class="delta ${r[2] > 0 ? "up" : r[2] < 0 ? "down" : "same"}">${r[2] > 0 ? "▲ " + r[2] : r[2] < 0 ? "▼ " + -r[2] : "–"}</span></div>`).join("")}</div>
  <p class="note">Namuna ma'lumotlar: haqiqiy natijalar tanlov yakunida qo'shiladi</p>
  <a class="btn-primary" href="#/kompas">Men ham qatnashaman</a>`;
}
window.setLb = (k) => { lbTab = k; haptic(); render(); };

function Profil() {
  const theme = store.get("theme", "blue");
  const invited = store.get("invited", 1);
  const link = `https://t.me/${BOT}?start=ref_${user.id}`;
  return `${navbar("Profil")}
  <div class="card prof">
    <div class="pav">${user.photo_url ? `<img src="${esc(user.photo_url)}" alt="">` : esc((user.first_name || "U")[0])}</div>
    <h2>${esc(user.first_name)} ${esc(user.last_name || "")}</h2>
    <small>${user.username ? "@" + esc(user.username) : "Ustoz AI o'quvchisi"}</small>
  </div>
  <div class="card box">
    <h4>${ic("palette")} Ilova rangi</h4><p>O'zingga yoqqan rangni tanla</p>
    <div class="swatches">${Object.entries(THEMES).map(([k, [l, a, b]]) => `<button class="sw ${k === theme ? "on" : ""}" onclick="pickTheme('${k}')"><i style="background:linear-gradient(135deg,${a},${b})"></i>${l}</button>`).join("")}</div>
  </div>
  <div class="card box">
    <h4>${ic("gift")} Do'stlarni taklif qilish</h4><p>3 ta do'st qo'shilsa: 1 hafta Premium bepul. Hozir: ${invited} / 3</p>
    <div class="ref-bar">${[0, 1, 2].map((i) => `<span class="${i < invited ? "on" : ""}"></span>`).join("")}</div>
    <button class="btn-primary" onclick="invite('${link}')">${ic("send")} Taklif havolasini yuborish</button>
  </div>
  ${startParam ? `<p class="note">Kirish manbasi: ${esc(startParam)}</p>` : ""}
  <p class="credit">O'yin 3D modellari (CC BY 4.0): own.guest, Nicholas-3D, Dimiter</p>`;
}
window.pickTheme = (k) => { applyTheme(k); haptic("medium"); render(); };
window.invite = (link) => {
  const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Ustoz AI: kasbingni top va bepul o'rgan")}`;
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
};

function Soon(key) {
  const s = SOON[key];
  return `${navbar(s.t)}
  <div class="card soon">
    ${chip(s.i, "lg solid")}<h2>${s.t}</h2><p>${s.d}</p>
    <ul>${s.items.map(([i, t]) => `<li>${chip(i, "sm")}<span>${t}</span></li>`).join("")}</ul>
    <button class="btn-primary" onclick="toast('Tayyor bo\\'lganda xabar beramiz')">${ic("bell")} Tayyor bo'lganda xabar ber</button>
  </div>`;
}

/* ---------- router ---------- */
const ROUTES = {
  "#/": Home, "#/kompas": Kompas, "#/natija": Natija, "#/tanlov": Tanlov, "#/profil": Profil,
  "#/kurslar": () => Soon("kurslar"), "#/oyin": () => "", "#/mutolaa": () => Soon("mutolaa"),
  "#/chegirma": () => Soon("chegirma"), "#/vositalar": () => Soon("vositalar"), "#/kashf": () => Soon("kashf"),
};
let gameOn = false;
function render() {
  const route = ROUTES[location.hash] ? location.hash : "#/";
  if (gameOn && route !== "#/oyin") { Game.unmount(); gameOn = false; }
  app.innerHTML = ROUTES[route]();
  if (route === "#/oyin") { Game.mount(); gameOn = true; }
  app.style.animation = "none"; void app.offsetWidth; app.style.animation = "";
  renderTabs(route);
  if (route === "#/kompas") bindSwipe();
  try { route === "#/" ? tg.BackButton.hide() : tg.BackButton.show(); } catch {}
}
window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

if (tg) {
  tg.ready(); tg.expand();
  try { tg.disableVerticalSwipes(); } catch {}
  try { tg.BackButton.onClick(goBack); } catch {}
  try { const top = tg.contentSafeAreaInset?.top + tg.safeAreaInset?.top; if (top) document.documentElement.style.setProperty("--tg-safe-top", top + "px"); } catch {}
}
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
if (!location.hash) location.replace("#/");
render();
