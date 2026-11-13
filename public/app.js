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
const THEMES = { blue: ["Ko'k", "#1E40FF", "#38BDF8"], orange: ["To'q sariq", "#FF6A00", "#FFB547"], green: ["Yashil", "#059669", "#5EEAD4"] };
function applyTheme(name) {
  document.body.dataset.theme = name;
  store.set("theme", name);
  try { tg.setHeaderColor("#F3F6FD"); tg.setBackgroundColor("#F3F6FD"); } catch {}
}
applyTheme(store.get("theme", "blue"));

/* ---------- icons ---------- */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 3 10v10a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z" fill="currentColor"/></svg>',
  cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
  send: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 3.5 2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.6.1 1.8-.7L23 4.8c.2-.9-.7-1.6-1.5-1.3z"/></svg>',
};
const compassSVG = `<svg class="compass" viewBox="0 0 200 200">
  <defs><radialGradient id="cg" cx="40%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dbe6ff"/></radialGradient></defs>
  <circle cx="100" cy="22" r="12" fill="none" stroke="#fff" stroke-width="7" opacity=".9"/>
  <circle cx="100" cy="105" r="80" fill="rgba(255,255,255,.35)"/>
  <circle cx="100" cy="105" r="68" fill="url(#cg)" stroke="#fff" stroke-width="6"/>
  <g font-family="Inter" font-weight="800" font-size="18" fill="var(--p-text)" text-anchor="middle">
    <text x="100" y="58">N</text><text x="100" y="166">S</text><text x="152" y="111">E</text><text x="48" y="111">W</text></g>
  <path d="M100 105 128 72 108 113z" fill="var(--p1)"/><path d="M100 105 72 138 92 97z" fill="#93C5FD"/>
  <circle cx="100" cy="105" r="7" fill="#fff" stroke="var(--p1)" stroke-width="3"/></svg>`;

/* ---------- tab bar ---------- */
const TABS = [["#/", "Asosiy", I.home], ["#/kurslar", "Kurslar", I.play], ["#/tanlov", "Tanlov", I.cup], ["#/kashf", "Kashf et", I.compass], ["#/profil", "Profil", I.user]];
function renderTabs(route) {
  const hidden = ["#/kompas", "#/natija", "#/oyin"].includes(route);
  tabbar.classList.toggle("hide", hidden);
  tabbar.innerHTML = TABS.map(([h, l, ic]) => `<a href="${h}" class="${h === route ? "on" : ""}">${ic}<span>${l}</span></a>`).join("");
}

const navbar = (title) => `<div class="navbar"><button class="icon-btn" onclick="goBack()">${I.back}</button><h1>${title}</h1><span></span></div>`;
window.goBack = () => { history.length > 1 ? history.back() : (location.hash = "#/"); };

/* ---------- screens ---------- */
function Home() {
  const streak = store.get("streak", 12);
  const tiles = [["🎓", "Kurslar", "#/kurslar"], ["🎮", "O'yin", "#/oyin"], ["📖", "Mutolaa", "#/mutolaa"], ["🏆", "Tanlov", "#/tanlov"], ["🏷️", "Chegirmalar", "#/chegirma"], ["🧰", "Vositalar", "#/vositalar"]];
  return `
  <div class="topbar">
    <div class="brand"><div class="logo">U</div>Ustoz AI</div>
    <div class="row-gap">
      <button class="icon-btn" onclick="toast('Yangi bildirishnomalar yo\\'q')">${I.bell}<span class="dot"></span></button>
      <a class="icon-btn" href="#/profil">${I.user}</a>
    </div>
  </div>
  <div class="greet"><h2>Salom, ${esc(user.first_name)} 👋</h2><span class="streak">🔥 ${streak} kun</span></div>
  <p class="sub">Bugun o'zing uchun yangi imkoniyatlar och!</p>
  <a class="hero" href="#/kompas" style="display:block">
    <h3>Kasb Kompasi:</h3>
    <p>kasbingni 90 soniyada top</p>
    ${compassSVG}
    <span class="btn-white">Boshlash <b>›</b></span>
  </a>
  <div class="grid">${tiles.map(([e, l, h]) => `<a class="tile" href="${h}"><span class="ic">${e}</span>${l}</a>`).join("")}</div>
  ${store.get("result") ? `<div class="section-title">Sening natijang</div>
    <a class="list-item" href="#/natija"><span style="font-size:26px">${PERSONAS[store.get("result")].emoji}</span>Sen: ${PERSONAS[store.get("result")].name}<span class="chev">›</span></a>` : ""}
  <div class="section-title">Do'stlaringni taklif qil 🎁</div>
  <a class="list-item" href="#/profil"><span style="font-size:26px">👥</span>3 ta do'st = 1 hafta Premium bepul<span class="chev">›</span></a>`;
}

let quiz = { i: 0, scores: {} };
function Kompas() {
  if (quiz.i >= QUIZ.length) quiz = { i: 0, scores: {} };
  const q = QUIZ[quiz.i], next = QUIZ[quiz.i + 1];
  return `${navbar("Kasb Kompasi")}
  <div class="progress"><span style="width:${(quiz.i / QUIZ.length) * 100}%"></span></div>
  <div class="q-count">${quiz.i + 1} / ${QUIZ.length}</div>
  <div class="stack">
    ${next ? `<div class="qcard back"><div class="emoji">${next.e}</div><h3>${next.q}</h3></div>` : ""}
    <div class="qcard" id="qcard">
      <span class="stamp yes">HA</span><span class="stamp no">YO'Q</span>
      <div class="emoji">${q.e}</div><h3>${q.q}</h3>
      <div class="hint">← chapga: yo'q · o'ngga: ha →</div>
    </div>
  </div>
  <div class="swipe-btns"><button class="no" onclick="answer(false)">✕</button><button class="yes" onclick="answer(true)">✓</button></div>`;
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
    <span class="chip" style="left:18px;top:30px">${p.chips[0]}</span><span class="chip" style="right:18px;top:60px">${p.chips[1]}</span>
    <div class="big">${p.hero}</div>
  </div>
  <div class="res-body">
    <div class="pre">Sen:</div>
    <h2>${p.name} ${p.emoji}</h2>
    <p>${p.desc}</p>
    <div class="stats">
      <div class="stat">
        <svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke="var(--line)" stroke-width="7"/>
        <circle cx="29" cy="29" r="24" fill="none" stroke="var(--p1)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - m / 100)}" transform="rotate(-90 29 29)"/>
        <text x="29" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="var(--text)">${m}%</text></svg>
        <div><small>Moslik darajasi</small><b>${m}%</b></div>
      </div>
      <div class="stat"><div><small>💰 Kutiladigan maosh</small><b>${p.salary}</b><small>so'm / oyiga</small></div></div>
    </div>
    <p style="margin-top:10px"><b style="color:var(--text)">Kasblar:</b> ${p.jobs.join(", ")}</p>
  </div>
  <div class="section-title">Senga tavsiya etilgan kurslar</div>
  ${p.courses.map(([e, n]) => `<a class="list-item" href="#/kurslar"><span style="font-size:22px">${e}</span>${n}<span class="chev">›</span></a>`).join("")}
  <div style="margin-top:16px"><button class="btn-primary" onclick="shareResult()">${I.send} Do'stlarga ulashish</button></div>
  <button class="btn-ghost" onclick="quiz={i:0,scores:{}};location.hash='#/kompas'">Qaytadan topshirish</button>`;
}
window.shareResult = () => {
  const p = PERSONAS[store.get("result")];
  const link = `https://t.me/${BOT}?start=ref_${user.id}`;
  const text = `Men ${p.name} ${p.emoji} ekanman! Sen kimsan? Kasb Kompasini 90 soniyada top 👇`;
  const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  haptic();
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
};

let lbTab = "viloyat";
function Tanlov() {
  const rows = LEADERBOARD[lbTab], top = rows.slice(0, 3);
  const me = lbTab === "viloyat" ? "Samarqand viloyati" : null;
  const short = (n) => n.replace(" viloyati", "").replace(" shahri", "");
  const pod = (r, i, cls) => `<div class="pod ${cls}"><div class="av">${["👧", "🧑", "👦"][i]}</div><div class="stand">${i + 1}</div><b>${esc(short(r[1]))}</b><small>${fmt(r[2])} ball</small></div>`;
  return `${navbar("Zamonaviy kasblar tanlovi")}
  <div class="lb-head">
    <div class="trophy">🏆</div><h2>Zamonaviy kasblar tanlovi</h2><p>Maktab va OTMlar o'rtasida hududiy reyting</p>
    <div class="podium">${pod(top[1], 1, "second")}${pod(top[0], 0, "first")}${pod(top[2], 2, "third")}</div>
  </div>
  <div class="seg">${[["viloyat", "Viloyat"], ["maktab", "Maktab"], ["otm", "OTM"]].map(([k, l]) => `<button class="${k === lbTab ? "on" : ""}" onclick="setLb('${k}')">${l}</button>`).join("")}</div>
  ${rows.map((r, i) => `<div class="list-item ${r[1] === me ? "me" : ""}">
    <span class="rank ${i < 3 ? "r" + (i + 1) : ""}">${i + 1}</span><span class="lb-av">${r[0]}</span>
    <span class="lb-name"><b>${esc(r[1])}</b><small>${fmt(r[2])} ball</small></span>
    <span class="delta ${r[3] > 0 ? "up" : r[3] < 0 ? "down" : "same"}">${r[3] > 0 ? "▲ +" + r[3] : r[3] < 0 ? "▼ " + r[3] : "– 0"}</span></div>`).join("")}
  <p class="note">Namuna ma'lumotlar: haqiqiy natijalar tanlov yakunida qo'shiladi</p>
  <a class="btn-primary" href="#/kompas">🚀 Men ham qatnashaman</a>`;
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
    <h4>🎨 Ilova rangi</h4><p>O'zingga yoqqan rangni tanla</p>
    <div class="swatches">${Object.entries(THEMES).map(([k, [l, a, b]]) => `<button class="sw ${k === theme ? "on" : ""}" onclick="pickTheme('${k}')"><i style="background:linear-gradient(135deg,${a},${b})"></i>${l}</button>`).join("")}</div>
  </div>
  <div class="card box">
    <h4>🎁 Do'stlaringni taklif qil</h4><p>3 ta do'st qo'shilsa: 1 hafta Premium bepul. Hozir: ${invited} / 3</p>
    <div class="ref-bar">${[0, 1, 2].map((i) => `<span class="${i < invited ? "on" : ""}"></span>`).join("")}</div>
    <button class="btn-primary" onclick="invite('${link}')">${I.send} Taklif havolasini yuborish</button>
  </div>
  ${startParam ? `<p class="note">Kirish manbasi: ${esc(startParam)}</p>` : ""}`;
}
window.pickTheme = (k) => { applyTheme(k); haptic("medium"); render(); };
window.invite = (link) => {
  const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Ustoz AI: kasbingni top, bepul o'rgan va sovg'alar yut 🎁")}`;
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
};

function Soon(key) {
  const s = SOON[key];
  return `${navbar(s.t)}
  <div class="card soon">
    <div class="big">${s.e}</div><h2>${s.t}</h2><p>${s.d}</p>
    <ul>${s.items.map((i) => `<li>${i}</li>`).join("")}</ul>
    <button class="btn-primary" onclick="toast('Tayyor bo\\'lganda xabar beramiz 🔔')">🔔 Tayyor bo'lganda xabar ber</button>
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
function fmt(n) { return n.toLocaleString("ru-RU").replace(/ /g, " "); }

if (tg) {
  tg.ready(); tg.expand();
  try { tg.disableVerticalSwipes(); } catch {}
  try { tg.BackButton.onClick(goBack); } catch {}
  try { const top = tg.contentSafeAreaInset?.top + tg.safeAreaInset?.top; if (top) document.documentElement.style.setProperty("--tg-safe-top", top + "px"); } catch {}
}
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
if (!location.hash) location.replace("#/");
render();
