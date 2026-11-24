const tg = window.Telegram && window.Telegram.WebApp;
const BOT = "ustozaiminibot";
// share server for the best-moment picture (share-worker/); empty until it is deployed
const SHARE_API = "https://chorsu-share.chorsu-share.workers.dev";
const app = document.getElementById("app");
const tabbar = document.getElementById("tabbar");

const store = {
  get(k, d) { try { const v = localStorage.getItem("uz_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("uz_" + k, JSON.stringify(v)); } catch {} },
};

const user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 0, first_name: "Aziz" };
const startParam = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
// the Ustoz AI phone app. ustoz.ai links are registered app links (Android assetlinks, iOS apple-app-site-association),
// so a course link opened outside Telegram opens that course in the app when it is installed, otherwise the website.
const PLAY_URL = "https://play.google.com/store/apps/details?id=uz.uztozedu.ustozai";
const STORE_URL = "https://apps.apple.com/uz/app/ustoz-ai/id6504815934";
window.openApp = (url) => { haptic("medium"); if (tg && tg.openLink) tg.openLink(url); else window.open(url, "_blank"); };
window.openStore = () => { const u = tg && tg.platform === "ios" ? STORE_URL : PLAY_URL; if (tg && tg.openLink) tg.openLink(u); else window.open(u, "_blank"); };

const haptic = (type = "light") => { try { tg.HapticFeedback.impactOccurred(type); } catch {} };

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ---------- theme ---------- */
const THEMES = { blue: ["Ko'k", "#2748F5", "#6C95FF"], orange: ["To'q sariq", "#F2600C", "#FFB066"], green: ["Yashil", "#0B8F6A", "#5FD3AE"], bordo: ["Bordo", "#8B0920", "#D0475E"] };
function applyTheme(name) {
  // another app on the same site address (dilmurodzz.github.io) once wrote its own colour name here: only known colours are used
  if (!THEMES[name]) name = "blue";
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
  plus: '<path d="M12 5v14M5 12h14"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
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
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.6 3.3-5.5 6.5-5.5s5.8 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5"/>',
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
  map: '<path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0M16 4.6a3 3 0 0 1 0 6M17.6 13.6A5.6 5.6 0 0 1 21 19"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3z"/><path d="m8.8 12.2 2.2 2.2 4.4-4.6"/>',
  share: '<path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><path d="M12 3v12"/><path d="M7.5 7.5 12 3l4.5 4.5"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.6 17.1a1.9 1.9 0 0 0 2.7 2.7l5.7-5.7a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
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
// Tanlov opens from its Home tile; the bottom bar keeps three buttons
const TABS = [["#/", "Asosiy", "home"], ["#/kurslar", "Kurslar", "play"], ["#/profil", "Profil", "user"]];
function renderTabs(route) {
  const hidden = ["#/kompas", "#/natija", "#/oyin", "#/duo", "#/workshop"].includes(route);
  tabbar.classList.toggle("hide", hidden);
  tabbar.innerHTML = TABS.map(([h, l, i]) => `<a href="${h}" class="${h === route ? "on" : ""}">${ic(i)}<span>${l}</span></a>`).join("");
}

const navbar = (title) => `<div class="navbar"><button class="icon-btn" onclick="goBack()">${ic("back")}</button><h1>${title}</h1><span></span></div>`;
window.goBack = () => { if (document.getElementById("sheet")) return closeSheet(); if (typeof Game !== "undefined" && gameOn && Game.onBack()) return; history.length > 1 ? history.back() : (location.hash = "#/"); };

/* ---------- screens ---------- */
function Home() {
  const tiles = [["zkt", "Tanlov", "#/tanlov", "k2"], ["harvard", "Harvard Admission tips", "#/harvard", "k3"], ["game", "O'yin", "#/oyin", "k1"], ["tools", "Foydali vositalar", "#/vositalar", "k4"]];
  return `
  <div class="topbar"><div class="brand"><img class="logo" src="logo.png" alt="">USTOZ AI</div><img class="partner" src="img/turonbank.png" alt="Turon Bank"></div>
  <a class="hero2" href="#/kompas" onclick="return kpSheet(event)">
    <img class="hero2-art" src="img/hero-compass.webp" alt="" decoding="async">
    <span class="hero2-tag">${T("6-7 daqiqa")}</span>
    <h3>Kasb Kompasi</h3>
    <p>O'zingizga mos kasb va kurslarni toping</p>
    <span class="btn-orange">Boshlash ${ic("chev")}</span>
  </a>
  <a class="banner" href="#/kurslar">
    <span class="bwheel ${store.get("bw_used", false) ? "" : "hint"}" id="bwheel" role="button" aria-label="${T("Omad g'ildiragi")}"><i class="bw-pin"></i><svg class="bw-ring" id="bw-ring" viewBox="0 0 100 100" aria-hidden="true">${bannerRing()}</svg><img src="img/ic-courses.webp" alt="" decoding="async"></span><span class="banner-sep"></span><b>Kurslar</b><span class="banner-go">${ic("chev")}</span>
    <svg class="banner-wave" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 38 C70 18 130 52 210 34 S340 14 400 30 V60 H0Z" fill="rgba(255,255,255,.55)"/><path d="M0 48 C80 34 150 58 230 46 S350 32 400 42 V60 H0Z" fill="rgba(120,140,255,.18)"/></svg>
  </a>
  <div class="grid4">${tiles.map(([i, l, h, k]) => `<a class="tile4 ${k}" href="${h}"><img src="img/ic-${i}.webp" alt="" decoding="async"><span>${l}</span>${i === "tools" ? `<i class="tile-nb" data-nb></i>` : ""}</a>`).join("")}</div>
`;
}

// Kasb Kompasi lives in kompas.js (loaded when it opens)

// Tanlov lives in tanlov.js (loaded when the page opens)

// every Profil section is one row of the same size and shape: icon, title, one line, arrow; tapping opens its content
const pfRow = (icon, color, title, sub, go, lead) => `<button class="pf-sec pf-row" style="--sc:${color}" ${go ? `onclick="${go}"` : "disabled"}>${lead || `<i class="pf-ic">${ic(icon)}</i>`}<span><b>${title}</b><small>${sub || ""}</small></span>${go ? ic("chev", "chev") : ""}</button>`;
// (older card helper, kept for other pages): a coloured icon, a title with a short line under it, then its content
const pfSec = (icon, color, title, sub, body, cls = "") => `<section class="pf-sec ${cls}" style="--sc:${color}"><div class="pf-h"><i class="pf-ic">${ic(icon)}</i><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</span></div>${body ? `<div class="pf-b">${body}</div>` : ""}</section>`;
function Profil() {
  if (typeof loadColors === "function") setTimeout(loadColors, 0);
  const theme = THEMES[store.get("theme", "blue")] ? store.get("theme", "blue") : "blue";
  const invited = store.get("invited", 1);
  const link = `https://t.me/${BOT}?start=ref_${user.id}`;
  return `${navbar("Profil")}
  <div class="card prof">
    <div class="pav">${user.photo_url ? `<img src="${esc(user.photo_url)}" alt="">` : esc((user.first_name || "U")[0])}</div>
    <h2>${esc(user.first_name)} ${esc(user.last_name || "")}</h2>
    <small>${T("Ustoz AI ning qadrli o'quvchisi")}</small>
  </div>
  <div class="pf-list">
  ${statsCard()}
  ${adminCard()}
  ${pfRow("palette", "#7C3AED", T("Ilova rangi"), (THEMES[theme] || THEMES.blue)[0] + (colorCounts ? " · " + T("{n} kishi", { n: fmtN(colorCounts[theme] || 0) }) : ""), "pfColor()")}
  ${langCard()}
  </div>
  ${startParam ? `<p class="note">Kirish manbasi: ${esc(startParam)}</p>` : ""}
  <p class="credit">O'yin 3D modellari (CC BY 4.0): own.guest, Nicholas-3D, Dimiter, Tom (trbaker), te1ko</p>`;
}
window.pickTheme = (k) => { applyTheme(k); haptic("medium"); closeSheet(); render(); sendColor(); };
window.pfColor = () => {
  const theme = THEMES[store.get("theme", "blue")] ? store.get("theme", "blue") : "blue";
  haptic("light");
  sheet(`<h3>${T("Ilova rangi")}</h3><p>${T("O'zingizga yoqqan rangni tanlang")}</p>
    <div class="pf-pick">${Object.entries(THEMES).map(([k, [l, a, b]]) => `<button class="${k === theme ? "on" : ""}" onclick="pickTheme('${k}')"><i class="dd-sw" style="background:linear-gradient(135deg,${a},${b})"></i><b>${l}</b><small>${colorCounts ? T("{n} kishi", { n: fmtN(colorCounts[k] || 0) }) : ""}</small>${k === theme ? ic("check") : ""}</button>`).join("")}</div>`);
};
// how many people chose each colour: real counts kept by the share server, one vote per Telegram user
const fmtN = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
let colorCounts = store.get("color_counts", null);
function gotCounts(c) { if (c && typeof c.blue === "number") { const same = JSON.stringify(c) === JSON.stringify(colorCounts); colorCounts = c; store.set("color_counts", c); if (!same && location.hash === "#/profil") render(); } }
function sendColor() {
  const t = store.get("theme", "blue");
  if (!tg || !tg.initData) return loadColors();
  fetch(SHARE_API + "/color?c=" + t, { method: "POST", headers: { "X-Init-Data": tg.initData } })
    .then((r) => r.ok ? r.json() : null).then((c) => { if (c) { store.set("color_sent", t); gotCounts(c); } }).catch(() => {});
}
function loadColors() { fetch(SHARE_API + "/colors").then((r) => r.json()).then(gotCounts).catch(() => {}); }
setTimeout(() => { if (store.get("color_sent", "") !== store.get("theme", "blue")) sendColor(); else loadColors(); }, 1500);
window.invite = (link) => {
  const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(T("Ustoz AI: kasbingizni toping va bepul o'rganing"))}`;
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

/* ---------- two players: the lobby ---------- */
function DuoScreen() {
  const sv = Duo.S.resume;
  return `${navbar("Do'st bilan o'ynash")}
  <div class="card duo">
    <div class="duo-head">${chip("users", "lg")}<h2>Do'stingizni taklif qiling va birgalikda vaqt o'tkazing :)</h2></div>
    ${sv ? `<div class="duo-save">Saqlangan o'yin: ${sv.dist} m · ${sv.coins} tanga</div>` : ""}
    <div class="duo-me">
      <small class="duo-label">Ismingiz</small>
      <input id="duo-name" maxlength="16" placeholder="Ismingiz" value="${esc(runnerName())}" autocomplete="off">
      <small class="duo-label">O'yinchingiz rangini tanlang</small>
      <div class="run-colors">${RUN_COLORS.map((c) => `<button data-c="${c}" class="${c === (runnerColor() || RUN_COLORS[0]) ? "on" : ""}" style="background:${c}" aria-label="Rang"></button>`).join("")}</div>
    </div>
    <div class="duo-code"><small>Sizning kodingiz</small><b id="duo-me">· · · ·</b><button class="icon-btn" id="duo-new" aria-label="Yangi kod">${ic("refresh")}</button></div>
    <div class="duo-join"><input id="duo-in" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="Do'stingizning kodi" autocomplete="off"><button class="btn-primary btn-green" id="duo-go">Ulanish</button></div>
    <div class="duo-st" id="duo-st"></div>
    <button class="btn-primary duo-start" id="duo-start" hidden>${ic("play")} Boshlash</button>
    <p class="duo-note">Ikkalangiz ham onlayn bo'lishingiz kerak</p>
  </div>`;
}
let duoSubs = [];
function bindDuo() {
  const $ = (id) => document.getElementById(id);
  const launch = () => { Duo.S.playing = true; location.hash = "#/oyin"; };
  const paint = () => {
    if (!$("duo-me")) return;
    const st = Duo.S.status, f = Duo.friend;
    $("duo-me").textContent = Duo.code ? Duo.code.split("").join(" ") : "· · · ·";
    const txt = { idle: "", opening: "Kod tayyorlanmoqda…", ready: "Kod tayyor. Do'stingizni kuting yoki uning kodini kiriting.", dialing: "Ulanmoqda…", linked: f ? `Ulandi: ${esc(f.name)}` : "Ulandi", lost: "Aloqa uzildi, qayta ulanmoqda…", error: "Ulanib bo'lmadi" }[st] || "";
    $("duo-st").innerHTML = `<span class="net ${st}">${ic("wifi")}</span>${txt}${Duo.S.error && st !== "linked" ? `<small>${esc(Duo.S.error)}</small>` : ""}`;
    $("duo-start").hidden = st !== "linked";
  };
  duoSubs.forEach((u) => u()); duoSubs = [Duo.on("status", paint), Duo.on("friend", paint), Duo.on("msg", (m) => { if (m.t === "start" && location.hash === "#/duo") launch(); })];
  $("duo-name").onchange = (e) => { const n = e.target.value.trim().slice(0, 16); if (n) { store.set("run_name", n); if (Duo.linked) Duo.hello(); } };
  document.querySelectorAll(".duo-me [data-c]").forEach((b) => { b.onclick = () => { store.set("run_color", b.dataset.c); document.querySelectorAll(".duo-me [data-c]").forEach((x) => x.classList.toggle("on", x === b)); haptic("light"); if (Duo.linked) Duo.hello(); }; });
  $("duo-new").onclick = () => { haptic("light"); Duo.refresh(); };
  $("duo-in").oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); };
  $("duo-go").onclick = () => { const c = $("duo-in").value; if (c.length !== 4) return toast("4 xonali kodni kiriting"); if (c === Duo.code) return toast("Bu sizning kodingiz"); haptic("medium"); Duo.dial(c); };
  $("duo-start").onclick = () => { const n = $("duo-name").value.trim(); if (n) store.set("run_name", n.slice(0, 16)); haptic("medium"); Duo.send({ t: "start" }); launch(); };
  Duo.open().then(() => { paint(); const sv = Duo.S.resume, back = Duo.savedDial(); if (sv && !sv.host && back && !Duo.linked) Duo.dial(back); });
  paint();
}

/* ---------- router ---------- */
const ROUTES = {
  "#/": Home, "#/kompas": () => needScript("kompas.js", "Compass", "Screen", T("Kasb Kompasi")), "#/natija": () => needScript("kompas.js", "Compass", "Result", T("Kasb Kompasi")), "#/tanlov": () => needScript("tanlov.js", "Contest", "Screen", T("Tanlov")), "#/profil": Profil,
  "#/kurslar": () => Kurslar.List(), "#/kurs": () => Kurslar.Detail(location.hash.slice(7)), "#/oyin": () => "", "#/mutolaa": () => Soon("mutolaa"),
  "#/duo": DuoScreen, "#/chegirma": () => needScript("deals.js", "Deals", "Screen", T("Top 20 chegirmalar")), "#/vositalar": () => needTools("Screen"), "#/cv": () => needTools("CV"), "#/dtm": () => needScript("study.js", "Study", "DTM", T("DTM ball kalkulyatori")), "#/ielts": () => needScript("study.js", "Study", "IELTS", T("IELTS ball kalkulyatori")), "#/unis": () => needScript("study.js", "Study", "Unis", T("Top 300 universitet va grantlar")), "#/admin": () => AdminScreen(), "#/admin/users": () => AdminScreen("users"), "#/admin/bc": () => AdminScreen("bc"), "#/admin/ch": () => AdminScreen("ch"), "#/admin/links": () => AdminScreen("links"), "#/workshop": () => needScript("workshop.js", "Workshop", "Screen", "Admission tips from Harvard"), "#/harvard": () => needScript("harvard.js", "Harvard", "Screen", "Harvard Admission tips"), "#/ariza": () => needScript("ariza.js", "Ariza", "Screen", "Application Studio"), "#/aisafety": () => needScript("aisafety.js", "AiSafety", "Screen", T("AI xavfsizligi · Garvard")), "#/muddatlar": () => needScript("ariza.js", "Ariza", "Deadlines", T("Muddatlar")), "#/kashf": () => Soon("kashf"),
};
let gameOn = false;
// the 3D game is loaded on its own, after Home: it is not needed to open the app
// parts of the app that load only when they are first needed, so Home opens fast
const APP_V = (document.currentScript && document.currentScript.src.split("?v=")[1]) || "";
const loading = {};
function loadScripts(files) {
  const key = files.join();
  if (!loading[key]) loading[key] = files.reduce((p, f) => p.then(() => new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = f + "?v=" + APP_V; s.onload = ok; s.onerror = no; document.body.appendChild(s);
  })), Promise.resolve()).catch((e) => { delete loading[key]; throw e; });
  return loading[key];
}
const loadGame = () => typeof Game !== "undefined" ? Promise.resolve() : loadScripts(["run-audio.js", "run-world.js", "game.js"]);
const loadTools = () => typeof Tools !== "undefined" ? Promise.resolve() : loadScripts(["tools.js"]);
// a screen whose code is in its own file: show a spinner, load the file, then draw the screen
function needScript(file, name, fn, title) {
  if (window[name]) return window[name][fn]();
  const h = location.hash;
  loadScripts([file]).then(() => { if (location.hash === h) render(); }).catch(() => toast(T("Yuklab bo'lmadi")));
  return `${navbar(title)}${spinner()}`;
}
const spinner = () => `<div class="busy"><div class="run-spin"></div><p>${T("Yuklanmoqda…")}</p></div>`;
function needTools(screen) {
  if (typeof Tools !== "undefined") return Tools[screen]();
  const h = location.hash;
  loadTools().then(() => { if (location.hash === h) render(); }).catch(() => toast(T("Yuklab bo'lmadi")));
  return `${navbar(T(screen === "CV" ? "CV va rezyume" : "Foydali vositalar"))}${spinner()}`;
}
const pageState = store.get("page_state", {});
function savePage() {
  const h = location.hash || "#/", st = pageState[h] || {};
  st.y = window.scrollY;
  st.f = {}; document.querySelectorAll("#app input[id], #app textarea[id]").forEach((el) => { st.f[el.id] = el.value; });
  pageState[h] = st; store.set("page_state", pageState);
}
function restorePage() {
  const st = pageState[location.hash || "#/"]; if (!st) return;
  for (const id in st.f || {}) { const el = document.getElementById(id); if (el && !el.value) el.value = st.f[id]; }
  window.scrollTo(0, st.y || 0);   // before the first paint, so the page never jumps
}
window.addEventListener("input", () => savePage());
window.addEventListener("pagehide", savePage);
document.addEventListener("visibilitychange", () => { if (document.hidden) savePage(); });
let lastHash = location.hash;
let shownRoute = null;
function render() {
  const route = ROUTES[location.hash] ? location.hash : location.hash.startsWith("#/kurs/") ? "#/kurs" : "#/";
  if (gameOn && route !== "#/oyin" && typeof Game !== "undefined") { Game.unmount(); gameOn = false; }
  document.body.classList.toggle("fit", route === "#/");     // Home fills the screen exactly, no scrolling
  const newPage = route !== shownRoute; shownRoute = route;
  app.innerHTML = ROUTES[route]();
  if (route === "#/oyin") {
    if (typeof Game === "undefined") {
      app.innerHTML = spinner();
      loadGame().then(() => { if (location.hash === "#/oyin") render(); }).catch(() => toast(T("Yuklab bo'lmadi")));
    } else { Game.mount(); gameOn = true; }
  }
  // the soft fade plays only when a different page opens, never when the same page refreshes its data
  if (newPage) { app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter"); }
  renderTabs(route === "#/kurs" ? "#/kurslar" : route);
  if (route === "#/") { bindBannerWheel(); bannerOrbit(); }
  if (route === "#/workshop" && window.Workshop) Workshop.mount();
  if (route === "#/duo") bindDuo(); else if (duoSubs.length) { duoSubs.forEach((u) => u()); duoSubs = []; }
  try { route === "#/" ? tg.BackButton.hide() : tg.BackButton.show(); } catch {}
  track(route);
}
window.addEventListener("hashchange", () => { const nh = location.hash; const cur = nh; location.hash; pageState[lastHash] = Object.assign(pageState[lastHash] || {}, { y: window.scrollY }); store.set("page_state", pageState); lastHash = cur; window.scrollTo(0, 0); render(); restorePage(); });

function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

if (tg) {
  tg.expand();   // tg.ready() comes right after the first screen is drawn, so Telegram never shows a blank page
  try { tg.disableVerticalSwipes(); } catch {}
  try { tg.BackButton.onClick(goBack); } catch {}
  try { const top = tg.contentSafeAreaInset?.top + tg.safeAreaInset?.top; if (top) document.documentElement.style.setProperty("--tg-safe-top", top + "px"); } catch {}
}
// A short, calm intro the very first time someone opens the Mini App; never again after that.
(function intro() {
  if (store.get("intro_seen", false)) return;
  store.set("intro_seen", true);
  const el = document.createElement("div");
  el.className = "intro";
  el.innerHTML = `<div class="intro-in"><img src="logo.png" alt=""><b>USTOZ AI</b><span>Kelajak kasbingizni toping</span><i><em></em></i></div>`;
  document.body.appendChild(el);
  const done = () => { if (el.classList.contains("out")) return; el.classList.add("out"); setTimeout(() => el.remove(), 600); };
  el.onclick = done;
  setTimeout(done, 1100);
})();
if ("serviceWorker" in navigator) {
  // app files are always fetched fresh (network first), so a new version shows without any reload
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((r) => r.update()).catch(() => {});
}
// start once every script has loaded (profile.js and tools.js come after this file)
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.replace("#/");
  render();
  try { if (tg) { requestAnimationFrame(() => tg.ready()); setTimeout(() => tg.ready(), 400); } } catch {}
  // opened from a shared section link (t.me/<bot>?startapp=g_cefr): go there and glow it; "?shared=" works in a browser too
  const shared = startParam || new URLSearchParams(location.search).get("shared");
  if (shared && /^[gdup]_[A-Za-z0-9_-]{1,40}$/.test(shared)) setTimeout(() => openShared(shared), 500);
  // course data is fetched quietly in the background, so the Kurslar page opens complete in one go
  // course data and the CV maker come when the phone is idle (or at once when their page opens)
  const idle = (f, ms) => setTimeout(() => (window.requestIdleCallback || setTimeout)(f), ms);
  idle(() => { try { Kurslar.load(); } catch {} }, 1500);
  idle(() => loadTools().catch(() => {}), 7000);
  // the game files come last, when the phone is idle
  // the game engine is the heaviest file: it comes when the phone has been idle for a while, so the menu stays smooth
  setTimeout(() => (window.requestIdleCallback || setTimeout)(() => loadGame().catch(() => {}), { timeout: 4000 }), 10000);
});

/* ---------- the course wheel: tap the Kurslar icon on Home, or swipe the wheel up or down ---------- */
const WHEEL_COLORS = ["#2748F5", "#F2600C", "#0B8F6A", "#7A45FF", "#F0336C", "#0EA5E9", "#D48A00", "#16A34A", "#DB2777", "#4F46E5"];
let wheelRot = 0, wheelBusy = false, wheelList = [];
function wheelCourses() {
  const d = Kurslar.data(); if (!d) return [];
  // the 20 course types with the most vacancies, and in each the course with the most students
  const best = {};
  for (const c of d.courses) { const g = d.groups[c.g]; if (g.kind !== "job" || Kurslar.low(c)) continue; if (!best[c.g] || (c.students || 0) > (best[c.g].students || 0)) best[c.g] = c; }
  return Object.values(best).sort((a, b) => d.groups[b.g].related - d.groups[a.g].related).slice(0, 20);
}
window.openWheel = async (btn) => {
  haptic("medium");
  if (btn) { btn.classList.remove("spin"); void btn.offsetWidth; btn.classList.add("spin"); }
  if (!Kurslar.data()) await Kurslar.load();
  wheelList = wheelCourses(); if (!wheelList.length) return;
  const n = wheelList.length, R = 150, seg = 360 / n;
  const pt = (a, r) => [160 + r * Math.sin(a * Math.PI / 180), 160 - r * Math.cos(a * Math.PI / 180)];
  const slices = wheelList.map((c, i) => {
    const [x1, y1] = pt(i * seg, R), [x2, y2] = pt((i + 1) * seg, R), mid = i * seg + seg / 2;
    const name = c.title.replace(/^Ustoz AI:\s*/, "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").split(/[:|.!]/)[0].trim();
    return `<path d="M160 160 L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}Z" fill="${WHEEL_COLORS[i % WHEEL_COLORS.length]}" opacity="${i % 2 ? .82 : 1}"/>
      <text transform="rotate(${mid} 160 160) translate(160 ${160 - R + 12}) rotate(90)" font-size="8.6" font-weight="700" fill="#fff" dominant-baseline="middle">${esc(name.length > 19 ? name.slice(0, 18) + "\u2026" : name)}</text>`;
  }).join("");
  const el = document.createElement("div"); el.className = "wheel-wrap"; el.id = "wheel";
  el.innerHTML = `<div class="wheel-box" onclick="event.stopPropagation()">
    <button class="icon-btn wheel-x" onclick="closeWheel()" aria-label="x">${ic("x")}</button>
    <h3>${T("Omad g'ildiragi")}</h3><p>${T("Eng talabgir 20 ta kursdan biri sizni kutmoqda. Bosing yoki g'ildirakni yuqoriga, pastga suring.")}</p>
    <div class="wheel-stage"><i class="wheel-pin"></i><svg id="wheel-svg" viewBox="0 0 320 320" style="transform:rotate(${wheelRot}deg)">${slices}<circle cx="160" cy="160" r="${R}" fill="none" stroke="#fff" stroke-width="4"/></svg>
      <button class="wheel-hub" onclick="spinWheel()"><img src="img/ic-courses.webp" alt=""></button></div>
    <div class="wheel-res" id="wheel-res"></div>
  </div>`;
  el.onclick = closeWheel; document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("on"));
  // swipe the wheel up or down: the faster the swipe, the longer it spins
  const svg = el.querySelector("#wheel-svg"); let y0 = 0, t0 = 0;
  svg.addEventListener("pointerdown", (e) => { y0 = e.clientY; t0 = performance.now(); });
  svg.addEventListener("pointerup", (e) => { const dy = e.clientY - y0, v = Math.abs(dy) / Math.max(1, performance.now() - t0); if (Math.abs(dy) > 25) spinWheel(dy < 0 ? 1 : -1, Math.min(3, 0.6 + v)); });
  setTimeout(() => spinWheel(), 350);
};
window.closeWheel = () => { const el = document.getElementById("wheel"); if (el && !wheelBusy) { el.classList.remove("on"); setTimeout(() => el.remove(), 250); } };
window.spinWheel = (dir = 1, power = 1) => {
  if (wheelBusy) return; const svg = document.getElementById("wheel-svg"); if (!svg) return;
  wheelBusy = true; haptic("heavy");
  const n = wheelList.length, seg = 360 / n, pick = Math.floor(Math.random() * n);
  // the pin is at the top: turn so the middle of the picked slice stops under it
  const target = 360 - (pick * seg + seg / 2) + (Math.random() - 0.5) * seg * 0.6;
  const base = wheelRot - (((wheelRot % 360) + 360) % 360);
  const turns = Math.round(4 + 3 * power) * 360;
  wheelRot = dir > 0 ? base + turns + target : base - turns + target - 360;
  document.getElementById("wheel-res").innerHTML = "";
  svg.style.transition = `transform ${3.2 + power * 0.6}s cubic-bezier(.12,.7,.08,1)`;
  svg.style.transform = `rotate(${wheelRot}deg)`;
  // a light tick each time a slice passes the pin
  let last = null; const tick = () => {
    const m = getComputedStyle(svg).transform;
    if (m && m !== "none") { const [a, b] = m.slice(7, -1).split(",").map(Number); const ang = Math.atan2(b, a) * 180 / Math.PI; const s = Math.floor((((ang % 360) + 360) % 360) / seg); if (last !== null && s !== last) haptic("light"); last = s; }
    if (wheelBusy) requestAnimationFrame(tick);
  }; requestAnimationFrame(tick);
  svg.addEventListener("transitionend", () => {
    wheelBusy = false; try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
    const c = wheelList[pick], g = Kurslar.data().groups[c.g], res = document.getElementById("wheel-res"); if (!res) return;
    res.innerHTML = `<div class="wheel-card"><b>${esc(c.title)}</b><small>${esc(c.teacher || "Ustoz AI")}${c.students ? ` \u00b7 ${T("{n} o'quvchi", { n: fmtN(c.students) })}` : ""}</small>
      <span class="kc-tag up">${T("{n} ta ish o'rni", { n: fmtN(g.related) })}</span>
      <div class="wheel-btns"><a class="btn-ghost" href="#/kurs/${c.id}" onclick="closeWheel()">${T("Batafsil")}</a><button class="btn-primary" onclick="openApp('${esc(c.url)}')">${ic("play")} ${T("Ilovada ochish")}</button></div></div>`;
  }, { once: true });
};


/* ---------- the Kurslar icon on Home is itself a wheel of the 20 most in-demand courses ----------
   swipe it up or down and it turns with the finger and keeps spinning with the speed of the swipe;
   a tap spins it fast. Where it stops, under the small pin on top, is the course it picks. */
const BW_N = 20, BW_SEG = 360 / BW_N;
let bwRot = 0, bwBusy = false;
function bannerRing() {
  const pt = (a, r) => [50 + r * Math.sin(a * Math.PI / 180), 50 - r * Math.cos(a * Math.PI / 180)];
  let out = "";
  for (let i = 0; i < BW_N; i++) {
    const [x1, y1] = pt(i * BW_SEG, 49), [x2, y2] = pt((i + 1) * BW_SEG, 49), [x3, y3] = pt((i + 1) * BW_SEG, 33), [x4, y4] = pt(i * BW_SEG, 33);
    out += `<path d="M${x4} ${y4} L${x1} ${y1} A49 49 0 0 1 ${x2} ${y2} L${x3} ${y3} A33 33 0 0 0 ${x4} ${y4}Z" fill="${WHEEL_COLORS[i % WHEEL_COLORS.length]}" opacity="${i % 2 ? .78 : 1}"/>`;
  }
  return out + `<circle cx="50" cy="50" r="33" fill="#fff"/>`;
}
/* ---------- Kurslar card: two tiny dots run along its rounded border in opposite directions ---------- */
// Only this overlay moves. Each dot needs 6 s for a lap, so going opposite ways they meet every 3 s
// (top centre, then bottom centre) where a small white glow flashes. Drawn to the card's real size.
function bannerOrbit() {
  const card = document.querySelector(".banner"); if (!card) return;
  const old = card.querySelector(".bn-orbit"); if (old) old.remove();
  const w = card.clientWidth, h = card.clientHeight; if (!w || !h) return;
  const i = 1.2, r = 22, cx = w / 2;
  const d = `M${cx} ${i} H${w - i - r} A${r} ${r} 0 0 1 ${w - i} ${i + r} V${h - i - r} A${r} ${r} 0 0 1 ${w - i - r} ${h - i} H${i + r} A${r} ${r} 0 0 1 ${i} ${h - i - r} V${i + r} A${r} ${r} 0 0 1 ${i + r} ${i} Z`;
  const T = 6;
  // a dot with its glow; trail copies run a little behind (an earlier point of the same loop)
  const dot = (col, glow, rev) => [0, 0.07, 0.14, 0.21].map((lag, k) => {
    const size = k ? 2.1 - k * 0.45 : 2.4, op = k ? 0.55 - k * 0.15 : 1;
    return `<g opacity="${op}"><circle r="${k ? size * 2.2 : 7}" fill="url(#${glow})"/><circle r="${size}" fill="${col}"/>
      <animateMotion dur="${T}s" begin="${-(T - lag)}s" repeatCount="indefinite" path="${d}" keyPoints="${rev ? "1;0" : "0;1"}" keyTimes="0;1" calcMode="linear"/></g>`;
  }).join("");
  const flash = (y, begin) => `<circle cx="${cx}" cy="${y}" r="9" fill="url(#bnw)" opacity="0">
      <animate attributeName="opacity" dur="${T}s" begin="${begin}s" repeatCount="indefinite" values="1;0;0;1" keyTimes="0;0.05;0.95;1"/>
      <animate attributeName="r" dur="${T}s" begin="${begin}s" repeatCount="indefinite" values="11;4;4;11" keyTimes="0;0.05;0.95;1"/></circle>`;
  const svg = `<svg class="bn-orbit" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <defs>
      <radialGradient id="bnb"><stop offset="0" stop-color="#3D7BFF" stop-opacity=".75"/><stop offset="1" stop-color="#3D7BFF" stop-opacity="0"/></radialGradient>
      <radialGradient id="bno"><stop offset="0" stop-color="#FF8A2B" stop-opacity=".75"/><stop offset="1" stop-color="#FF8A2B" stop-opacity="0"/></radialGradient>
      <radialGradient id="bnw"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".45" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <path d="${d}" fill="none" stroke="rgba(110,145,255,.45)" stroke-width="1"/>
    ${dot("#2F6BFF", "bnb", false)}${dot("#FF8A2B", "bno", true)}
    ${flash(i, 0)}${flash(h - i, -T / 2)}
  </svg>`;
  card.insertAdjacentHTML("beforeend", svg);
}
let bnResize; window.addEventListener("resize", () => { clearTimeout(bnResize); bnResize = setTimeout(() => { if ((location.hash || "#/") === "#/") bannerOrbit(); }, 200); });

function bindBannerWheel() {
  const el = document.getElementById("bwheel"), ring = document.getElementById("bw-ring"); if (!el || !ring) return;
  ring.style.transform = `rotate(${bwRot}deg)`;
  let y0 = null, r0 = 0, t0 = 0, last = [], moved = 0, lastSeg = null;
  const setRot = (r) => { ring.style.transform = `rotate(${r}deg)`; const seg = Math.floor((((r % 360) + 360) % 360) / BW_SEG); if (lastSeg !== null && seg !== lastSeg) haptic("light"); lastSeg = seg; };
  el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
  el.addEventListener("pointerdown", (e) => {
    if (bwBusy) return; e.preventDefault(); e.stopPropagation();
    try { el.setPointerCapture(e.pointerId); } catch {} y0 = e.clientY; r0 = bwRot; t0 = performance.now(); last = [[t0, y0]]; moved = 0;
    ring.style.transition = "none"; Kurslar.load();
  });
  el.addEventListener("pointermove", (e) => {
    if (y0 === null) return;
    const dy = e.clientY - y0; moved = Math.max(moved, Math.abs(dy));
    bwRot = r0 + dy * 1.8; setRot(bwRot);
    last.push([performance.now(), e.clientY]); if (last.length > 6) last.shift();
  });
  const up = (e) => {
    if (y0 === null) return; y0 = null; e.stopPropagation();
    if (moved < 8) return bwSpin(1, 1.6);                              // tap: a fast spin
    const [ta, ya] = last[0], [tb, yb] = last[last.length - 1];
    const v = (yb - ya) / Math.max(16, tb - ta);                          // px per ms, + = downwards
    if (Math.abs(v) < 0.15) return bwSpin(v >= 0 ? 1 : -1, 0.35);        // a slow drag: settle on the nearest course
    bwSpin(v > 0 ? 1 : -1, Math.min(3, Math.abs(v) * 1.2));
  };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
}
async function bwSpin(dir, power) {
  const ring = document.getElementById("bw-ring"); if (!ring || bwBusy) return;
  bwBusy = true; haptic("medium");
  const box = document.getElementById("bwheel"); if (box) box.classList.remove("hint");
  if (!store.get("bw_used", false)) store.set("bw_used", true);
  if (!Kurslar.data()) { try { await Kurslar.load(); } catch {} }
  const list = wheelCourses(); if (!list.length) { bwBusy = false; return; }
  const pick = Math.floor(Math.random() * Math.min(BW_N, list.length));
  // the pin is on top: turn so the middle of the picked slice stops under it, in the swipe direction
  const target = 360 - (pick * BW_SEG + BW_SEG / 2);
  const now = ((bwRot % 360) + 360) % 360, turns = 360 * Math.max(1, Math.round(1 + power * 2.5));
  let delta = ((target - now) % 360 + 360) % 360;
  if (dir < 0) delta -= 360;
  bwRot += dir > 0 ? delta + turns : delta - turns;
  const dur = 1.4 + power * 0.7;
  ring.style.transition = `transform ${dur}s cubic-bezier(.15,.75,.12,1)`;
  ring.style.transform = `rotate(${bwRot}deg)`;
  let lastSeg = null; const t0 = performance.now();
  const tick = () => {
    const m = getComputedStyle(ring).transform;
    if (m && m !== "none") { const [a, b] = m.slice(7, -1).split(",").map(Number); const seg = Math.floor((((Math.atan2(b, a) * 180 / Math.PI) % 360 + 360) % 360) / BW_SEG); if (lastSeg !== null && seg !== lastSeg) haptic("light"); lastSeg = seg; }
    if (performance.now() - t0 < dur * 1000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(() => {
    bwBusy = false; try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
    const c = list[pick], g = Kurslar.data().groups[c.g];
    const pic = c.image && /^https:\/\/upload\.ustozai-app\.uz\//.test(c.image) ? `https://ustoz.ai/_next/image?url=${encodeURIComponent(c.image)}&w=640&q=75` : c.image;
    sheet(`${pic ? `<div class="bw-img"><img src="${esc(pic)}" alt="" decoding="async"></div>` : ""}<div class="bw-res"><small>${T("G'ildirak tanladi")}</small><b class="notr">${esc(c.title)}</b><span class="notr">${esc(c.teacher || "Ustoz AI")}${c.students ? ` · ${T("{n} o'quvchi", { n: fmtN(c.students) })}` : ""}</span>
      <em class="kc-tag up">${T("{n} ta ish o'rni", { n: fmtN(g.related) })}</em></div>
      <div class="wheel-btns"><button class="btn-ghost" onclick="closeSheet();location.hash='#/kurs/${c.id}'">${T("Batafsil")}</button><button class="btn-primary" onclick="openApp('${esc(c.url)}')">${ic("play")} ${T("Ilovada ochish")}</button></div>
      <button class="btn-ghost" onclick="closeSheet();setTimeout(()=>bwSpin(1,1.6),300)">${ic("refresh")} ${T("Yana aylantirish")}</button>`);
  }, dur * 1000 + 60);
}

/* ---------- <details class="smooth">: open and close with a gentle height animation ---------- */
document.addEventListener("click", (e) => {
  const sum = e.target.closest("details.smooth > summary"); if (!sum) return;
  const d = sum.parentElement; e.preventDefault();
  if (d._anim) d._anim.cancel();
  const start = d.offsetHeight, cs = getComputedStyle(d);
  const closed = sum.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
  const opening = !d.open; if (opening) d.open = true;
  const end = opening ? d.offsetHeight : closed;
  d.style.overflow = "hidden";
  const a = d.animate({ height: [start + "px", end + "px"] }, { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" }); d._anim = a;
  const finish = () => { if (!opening) d.open = false; d.style.overflow = ""; d._anim = null; };
  a.onfinish = finish; a.oncancel = () => { d.style.overflow = ""; d._anim = null; };
  if (!opening) d.classList.add("closing"); a.finished.then(() => d.classList.remove("closing")).catch(() => {});
});

/* ---------- sharing one section: the link opens the mini app right at that section ---------- */
// key: g_<grant card> | d_<deal> | u_<university index>; Telegram passes it back as start_param
window.shareSec = (key, title) => {
  haptic("light");
  const link = `https://t.me/${BOT}?start=${key}`;
  const text = `${title}\n${T("Ustoz AI mini ilovasida sizga foydali ma'lumot")}`;
  openTg(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
};
// waits for the section to appear (its page may still be loading), then glows it green twice
// pages a link can open directly (admin "Havolalar": t.me/<bot>?start=p_kompas)
const PAGE_LINKS = { aisafety: "#/aisafety", kompas: "#/kompas", kurslar: "#/kurslar", tanlov: "#/tanlov", harvard: "#/harvard", ariza: "#/ariza", cv: "#/cv", vositalar: "#/vositalar", chegirma: "#/chegirma", oyin: "#/oyin" };
function openShared(key) {
  const [kind, id] = [key.slice(0, 1), key.slice(2)];
  if (kind === "p") { if (PAGE_LINKS[id]) location.hash = PAGE_LINKS[id]; return; }
  const plan = kind === "g" ? { hash: "#/unis", prep: () => store.set("uni_tab", "grant"), find: () => { if (window.uniTab && !document.querySelector(".sd-g") && document.querySelector(".sd-tabs")) uniTab("grant"); return document.getElementById("g-" + id); } }
    : kind === "d" ? { hash: "#/chegirma", find: () => document.getElementById("d-" + id) }
    : kind === "u" ? { hash: "#/unis", prep: () => store.set("uni_tab", "top"), find: () => { if (window.uniOpen && !document.querySelector(".sd-uni") && document.querySelector(".sd-tabs")) uniTab("top"); return window.uniOpen && document.querySelector(".sd-uni") && document.getElementById("app"); } } : null;
  if (!plan) return;
  if (plan.prep) plan.prep();
  location.hash = plan.hash;
  let tries = 0;
  const look = () => {
    const el = plan.find();
    if (!el) { if (++tries < 40) setTimeout(look, 200); return; }
    if (kind === "u") { window.uniOpen(+id); setTimeout(() => glow(document.querySelector(".sd-usheet")), 350); return; }
    if (el.tagName === "DETAILS") el.open = true;
    // the page may still jump to the top as it appears, so the scroll is checked once more
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { const r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ block: "center" }); glow(el); }, 700);
    }, 400);
  };
  setTimeout(look, 300);
}
function glow(el) {
  if (!el) return;
  const tag = document.createElement("div"); tag.className = "shared-tag"; tag.innerHTML = `${ic("send")} ${T("Shu bo'lim sizga ulashildi")}`;
  el.parentNode.insertBefore(tag, el);
  el.classList.add("shared-glow");
  setTimeout(() => el.classList.remove("shared-glow"), 2600);
  setTimeout(() => { tag.classList.add("out"); setTimeout(() => tag.remove(), 400); }, 6000);
}

/* ---------- Kasb Kompasi: the start panel from Home ---------- */
window.kpSheet = (e) => {
  if (e) e.preventDefault(); haptic("light");
  // a test left half way: the panel offers to go on from the same question
  const st = store.get("kp_state", null), going = st && st.v === 2 && st.step >= 0 && st.num;
  sheet(`<div class="kp-sheet"><img src="img/kompas-start.webp" alt="" decoding="async">
    <h3>${T("Kasb Kompasi")}</h3>
    ${going ? `<p>${T("Siz {n}-savolda to'xtagan edingiz. Javoblaringiz saqlangan.", { n: st.num })}</p>` : `<p>${T("Test taxminan 6-7 daqiqa davom etadi.")}</p>
    <p>${T("Testni tugatishingiz bilan qiziqishlaringiz va ko'nikmalaringizga mos 3 ta kursni tavsiya qilamiz.")}</p>`}
    <button class="btn-primary" onclick="kpGo(1)">${going ? T("Davom etish ({a} / {b})", { a: st.num, b: 29 }) : T("Boshlash")}</button>
    ${going ? `<button class="kp-restart" onclick="kpGo(2)">${T("Boshidan boshlash")}</button>` : ""}</div>`);
  return false;
};
// 1: start, or go on where the student stopped; 2: start again from the first question
window.kpGo = (k) => { store.set("kp_go", k || 1); closeSheet(); location.hash = "#/kompas"; };

/* ---------- helpers for Application Studio (ariza.js) ---------- */
// copying: the button that was pressed shows a green tick for a moment, so the student sees it worked
window.evBtn = () => { const e = window.event; return (e && e.target && e.target.closest && e.target.closest("button")) || null; };
window.copyTick = (b) => {
  if (!b || b._ct) return; b._ct = 1; const old = b.innerHTML, icon = b.classList.contains("icon-btn");
  b.classList.add("copied"); b.innerHTML = icon ? ic("check") : `${ic("check")} ${T("Nusxa olindi")}`; haptic("medium");
  setTimeout(() => { b.innerHTML = old; b.classList.remove("copied"); b._ct = 0; }, 1600);
};
// "5-dekabr" style dates: browsers often have no Uzbek month names, so they are written here
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktabr", "noyabr", "dekabr"];
window.fmtDay = (d) => LANG === "uz" ? `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}` : d.toLocaleDateString(LANG, { day: "numeric", month: "long" });
// country names in Uzbek (the Top 300 table has them in English)
const COUNTRY_UZ = { "United States": "AQSh", "United Kingdom": "Buyuk Britaniya", Germany: "Germaniya", China: "Xitoy", Australia: "Avstraliya", Canada: "Kanada", Netherlands: "Niderlandiya", "South Korea": "Janubiy Koreya", "Hong Kong": "Gonkong", Sweden: "Shvetsiya", Italy: "Italiya", Switzerland: "Shveytsariya", Japan: "Yaponiya", Belgium: "Belgiya", France: "Fransiya", Denmark: "Daniya", Austria: "Avstriya", Spain: "Ispaniya", Ireland: "Irlandiya", Finland: "Finlandiya", Norway: "Norvegiya", Malaysia: "Malayziya", Singapore: "Singapur", Qatar: "Qatar", Macao: "Makao", "Saudi Arabia": "Saudiya Arabistoni", Israel: "Isroil", "United Arab Emirates": "BAA", Taiwan: "Tayvan", Brazil: "Braziliya", "South Africa": "Janubiy Afrika", "New Zealand": "Yangi Zelandiya", Hungary: "Vengriya", Luxembourg: "Lyuksemburg", India: "Hindiston", Bahrain: "Bahrayn" };
const cnUz = (c) => T(COUNTRY_UZ[c] || c);
// the platform a university is usually applied through, from its country
window.guessPlat = (country) => country === "United States" ? "commonapp" : country === "United Kingdom" ? "ucas" : country === "Germany" ? "daad" : "direct";
window.appsAdd = (a) => {
  const l = store.get("apps", []);
  if (l.some((x) => x.name === a.name)) { toast(T("Bu universitet arizalaringizda bor")); return false; }
  l.unshift(Object.assign({ id: Date.now(), status: "plan", docs: {}, deadline: "", country: "", site: "", plat: guessPlat(a.country) }, a));
  store.set("apps", l); haptic("medium"); toast(T("Arizalarimga qo'shildi")); return true;
};

/* ---------- a bottom sheet for small choices ---------- */
function sheet(html) {
  closeSheet();
  const el = document.createElement("div"); el.className = "sheet-wrap"; el.id = "sheet";
  el.innerHTML = `<div class="sheet" onclick="event.stopPropagation()"><i class="sheet-grip"></i>${html}</div>`;
  el.onclick = closeSheet; document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("on"));
  try { tg.BackButton.show(); } catch {}   // back closes this panel first
}
window.closeSheet = () => { if (window.askEnd) { const e = window.askEnd; window.askEnd = null; return e(false); } const el = document.getElementById("sheet"); if (el) { el.classList.remove("on"); el.id = ""; setTimeout(() => el.remove(), 250); } try { if ((location.hash || "#/") === "#/") tg.BackButton.hide(); } catch {} };
window.openTg = (u) => { haptic("light"); if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank"); };
