// Profil extras: usage statistics (for everyone), language choice, and the admin section (two Telegram ids only).
// The numbers come from the share server (share-worker/, Cloudflare D1): every section a user opens is counted once a day.
const ADMIN_IDS = [5199387523, 2094753316];   // Dilmurod, @sakumter; the server checks this list again
const isAdmin = () => ADMIN_IDS.includes(Number(user.id));
const APP_LINK = `https://t.me/${BOT}`;

/* ---------- tracking ---------- */
const SECTION_OF = { "#/": "home", "#/kompas": "kompas", "#/natija": "natija", "#/kurslar": "kurslar", "#/kurs": "kurs", "#/tanlov": "tanlov", "#/profil": "profil",
  "#/oyin": "oyin", "#/duo": "duo", "#/vositalar": "vositalar", "#/cv": "cv", "#/chegirma": "chegirma", "#/admin": "admin" };
const tkDay = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);   // Tashkent date
function track(route) {
  const s = SECTION_OF[route]; if (!s || !tg || !tg.initData) return;
  const key = "tr_" + tkDay() + "_" + s; if (store.get(key, false)) return;
  fetch(SHARE_API + "/track?s=" + s, { method: "POST", headers: { "X-Init-Data": tg.initData } })
    .then((r) => { if (r.ok) store.set(key, true); }).catch(() => {});
}

/* ---------- statistics card ---------- */
const SECTION_NAME = () => ({ kompas: T("Kasb Kompasi"), natija: T("Kompas natijasi"), kurslar: T("Kurslar"), kurs: T("Kurs sahifalari"), tanlov: T("Tanlov"), profil: T("Profil"),
  oyin: T("O'yin"), duo: T("Do'st bilan o'yin"), vositalar: T("Foydali vositalar"), cv: T("CV va rezyume"), chegirma: T("Chegirmalar") });
let appStats = store.get("app_stats", null), statsAt = 0;
function loadStats(force) {
  if (!force && Date.now() - statsAt < 60e3) return;
  statsAt = Date.now();
  fetch(SHARE_API + "/stats").then((r) => r.json()).then((s) => {
    if (typeof s.total !== "number") return;
    const changed = JSON.stringify(s) !== JSON.stringify(appStats);
    appStats = s; store.set("app_stats", s);
    if (changed && (location.hash === "#/profil" || location.hash === "#/admin")) render();
  }).catch(() => {});
}
function statsCard() {
  setTimeout(loadStats, 0);
  const s = appStats;
  if (!s) return `<div class="card box"><h4>${ic("chart")} ${T("Ilova statistikasi")}</h4><p>${T("Yuklanmoqda…")}</p></div>`;
  const tile = (n, l, sub) => `<span class="st-tile"><b>${fmtN(n)}</b><small>${l}</small>${sub ? `<em>${sub}</em>` : ""}</span>`;
  const days = s.days || [], max = Math.max(1, ...days.map((d) => d.n));
  const top = s.top || [], tmax = Math.max(1, ...top.map((t) => t.n)), names = SECTION_NAME();
  const wd = (d) => new Date(d + "T12:00:00").toLocaleDateString(LANG === "uz" ? "uz-Latn-UZ" : LANG, { weekday: "short" }).replace(".", "");
  return `<div class="card box stats-card">
    <h4>${ic("chart")} ${T("Ilova statistikasi")}</h4>
    <div class="st-grid">
      ${tile(s.total, T("Jami foydalanuvchilar"), s.newToday ? T("bugun +{n}", { n: fmtN(s.newToday) }) : "")}
      ${tile(s.dau, T("Bugun faol (DAU)"), T("kecha: {n}", { n: fmtN(s.dauYesterday) }))}
      ${tile(s.wau, T("7 kunda faol (WAU)"))}
      ${tile(s.mau, T("30 kunda faol (MAU)"))}
    </div>
    ${days.length ? `<div class="st-sub">${T("Kunlik faol foydalanuvchilar")}</div>
    <div class="st-bars">${days.map((d) => `<span><i style="height:${Math.max(6, (d.n / max) * 100)}%"><b>${d.n}</b></i><small>${wd(d.d)}</small></span>`).join("")}</div>` : ""}
    ${top.length ? `<div class="st-sub">${T("Eng ko'p ochilgan bo'limlar (7 kun)")}</div>
    <div class="st-top">${top.map((t) => `<div><span>${esc(names[t.s] || t.s)}</span><i><em style="width:${(t.n / tmax) * 100}%"></em></i><b>${fmtN(t.n)}</b></div>`).join("")}</div>` : ""}
    <p class="st-note">${T("Har bir foydalanuvchi kuniga bir marta sanaladi. Hisob 17.11.2026 dan boshlangan.")}</p>
  </div>`;
}

/* ---------- language ---------- */
function langCard() {
  return `<div class="card box">
    <h4>${ic("globe")} ${T("Ilova tili")}</h4><p>${T("Interfeys tilini tanlang")}</p>
    <div class="seg">${Object.entries(LANGS).map(([k, l]) => `<button class="${k === LANG ? "on" : ""}" onclick="setLang('${k}')">${l}</button>`).join("")}</div>
  </div>`;
}

const adminCard = () => isAdmin() ? `<a class="card list-item admin-entry" href="#/admin">${chip("zap", "sm")}<span><b>${T("Admin bo'limi")}</b><small>${T("Xabar yuborish, kanalga post, havolalar")}</small></span>${ic("chev", "chev")}</a>` : "";

/* ---------- admin screen ---------- */
let adminInfo = null, adminInfo_busy = false;
const adminFetch = (path, body) => fetch(SHARE_API + "/admin/" + path, body ? { method: "POST", headers: { "X-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify(body) } : { headers: { "X-Init-Data": (tg && tg.initData) || "" } })
  .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; });
const confirmAsk = (text) => new Promise((res) => { try { tg.showConfirm(text, res); } catch { res(window.confirm(text)); } });

function AdminScreen() {
  if (!isAdmin()) { location.replace("#/profil"); return ""; }
  if (!adminInfo && !adminInfo_busy) {
    adminInfo_busy = true;
    adminFetch("info").then((j) => { adminInfo = j; if (location.hash === "#/admin") render(); }).catch((e) => toast(T("Xatolik: {e}", { e: e.message }))).finally(() => { setTimeout(() => { adminInfo_busy = false; }, 5000); });
  }
  loadStats();
  const courses = (Kurslar.data() && Kurslar.data().courses) || [];
  const box = (id, title, sub, extra) => `<div class="card box adm">
    <h4>${ic(id === "bc" ? "users" : "megaphone")} ${title}</h4><p>${sub}</p>
    ${extra || ""}
    <textarea id="${id}-text" rows="5" maxlength="4000" placeholder="${T("Xabar matni")}"></textarea>
    <div class="adm-row"><input id="${id}-bt" maxlength="60" placeholder="${T("Tugma matni (ixtiyoriy)")}"><input id="${id}-bu" placeholder="https://… ${T("havola")}"></div>
    <div class="adm-row"><button class="btn-ghost" onclick="admSend('${id}', 'test')">${T("Avval o'zimga sinash")}</button>
    <button class="btn-primary" onclick="admSend('${id}', '${id === "bc" ? "broadcast" : "channel"}')">${ic("send")} ${id === "bc" ? T("Hammaga yuborish") : T("Kanalga yuborish")}</button></div>
    <div class="adm-st" id="${id}-st"></div>
  </div>`;
  return `${navbar(T("Admin bo'limi"))}
  <div class="card box">
    <h4>${ic("users")} ${T("Foydalanuvchilar")}</h4>
    ${adminInfo ? `<div class="st-grid">
      <span class="st-tile"><b>${fmtN(adminInfo.users)}</b><small>${T("Mini ilovani ochgan")}</small></span>
      <span class="st-tile"><b>${fmtN(adminInfo.reachable)}</b><small>${T("Xabar yetib boradi")}</small></span>
    </div>` : `<p>${T("Yuklanmoqda…")}</p>`}
    <p class="st-note">${T("Bot faqat u bilan suhbatni boshlagan va botni bloklamagan foydalanuvchilarga xabar yubora oladi.")}</p>
  </div>
  ${box("bc", T("Barcha foydalanuvchilarga xabar"), T("Xabar bot orqali har bir foydalanuvchining shaxsiy chatiga boradi."))}
  ${box("ch", T("Kanalga post: {c}", { c: (adminInfo && adminInfo.channel) || "@ustozai" }), T("Bot kanalda admin bo'lishi kerak (Post messages huquqi bilan)."),
    `<div class="adm-tpl"><small>${T("Tayyor matnlar:")}</small>
      <button onclick="admTpl('app')">${T("Mini ilova")}</button><button onclick="admTpl('cv')">${T("CV yaratish")}</button><button onclick="admTpl('kompas')">${T("Kasb Kompasi")}</button>
      <select class="notr" onchange="admTpl('course', this.value)"><option value="">${T("Kursni ulashish…")}</option>${courses.slice().sort((a, b) => (b.students || 0) - (a.students || 0)).map((c) => `<option value="${c.id}">${esc(c.title.slice(0, 60))}</option>`).join("")}</select>
    </div>`)}
  <div class="card box">
    <h4>${ic("send")} ${T("Havolalar")}</h4><p>${T("Nusxa olish yoki do'stlarga ulashish")}</p>
    ${[[T("Mini ilova"), APP_LINK], [T("Ustoz AI ilovasi (Android)"), PLAY_URL], [T("Ustoz AI ilovasi (iPhone)"), STORE_URL], [T("Ustoz AI kanali"), "https://t.me/ustozai"]]
      .map(([l, u]) => `<div class="adm-link"><span><b>${l}</b><small>${u}</small></span><button class="icon-btn" onclick="admCopy('${u}')" aria-label="copy">${ic("file")}</button><button class="icon-btn" onclick="admShare('${u}')" aria-label="share">${ic("send")}</button></div>`).join("")}
  </div>`;
}
window.admCopy = (u) => { try { navigator.clipboard.writeText(u); toast(T("Nusxa olindi")); } catch { toast(u); } };
window.admShare = (u) => { const url = `https://t.me/share/url?url=${encodeURIComponent(u)}`; if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank"); };
window.admTpl = (k, id) => {
  const $ = (x) => document.getElementById(x);
  let text = "", bt = T("Ochish"), bu = APP_LINK;
  if (k === "app") text = T("Ustoz AI mini ilovasi: Kasb Kompasi, 119 ta kurs va mehnat bozori tahlili, bepul CV yaratish va qiziqarli o'yin. Hammasi Telegram ichida, bepul.");
  if (k === "cv") { text = T("Professional CV va rezyumeni 5 daqiqada bepul tayyorlang: tayyor namunalar, rasmli CV, PDF, Word yoki PNG formatida. Ustoz AI mini ilovasida."); bt = T("CV yaratish"); }
  if (k === "kompas") { text = T("90 soniyada o'zingizga mos kasbni toping: Ustoz AI Kasb Kompasi sizga mos kasb va kurslarni tavsiya qiladi."); bt = T("Kompasni boshlash"); }
  if (k === "course") {
    const c = ((Kurslar.data() || {}).courses || []).find((x) => x.id === id); if (!c) return;
    const g = Kurslar.data().groups[c.g];
    text = `${c.title}\n${T("Ustoz: {t}", { t: c.teacher || "Ustoz AI" })}${c.rating ? `\n${T("Reyting: {r}", { r: String(c.rating).replace(".", ",") })}` : ""}${c.students ? `, ${T("{n} o'quvchi", { n: fmtN(c.students) })}` : ""}${g && g.kind === "job" ? `\n${T("hh.uz'da bu yo'nalishda {n} ta ish o'rni", { n: fmtN(g.related) })}` : ""}\n\n${(c.about || "").slice(0, 400)}`;
    bt = T("Kursni ochish"); bu = c.url;
  }
  $("ch-text").value = text; $("ch-bt").value = bt; $("ch-bu").value = bu;
  haptic("light");
};
window.admSend = async (id, route) => {
  const $ = (x) => document.getElementById(x), st = $(id + "-st");
  const body = { text: $(id + "-text").value.trim(), btnText: $(id + "-bt").value.trim(), btnUrl: $(id + "-bu").value.trim() };
  if (!body.text) return toast(T("Xabar matnini yozing"));
  if (body.btnText && !/^https:\/\//.test(body.btnUrl)) return toast(T("Tugma uchun https:// bilan boshlanadigan havola kiriting"));
  if (route === "broadcast" && !(await confirmAsk(T("Xabar {n} ta foydalanuvchiga yuboriladi. Davom etasizmi?", { n: fmtN((adminInfo && adminInfo.reachable) || 0) })))) return;
  if (route === "channel" && !(await confirmAsk(T("Post {c} kanaliga joylanadi. Davom etasizmi?", { c: (adminInfo && adminInfo.channel) || "@ustozai" })))) return;
  haptic("medium");
  try {
    if (route !== "broadcast") { st.textContent = T("Yuborilmoqda…"); await adminFetch(route, body); st.textContent = route === "test" ? T("Sinov xabari sizga yuborildi") : T("Kanalga joylandi"); return; }
    let after = 0, sent = 0, failed = 0;
    do {
      const r = await adminFetch("broadcast", { ...body, after });
      sent += r.sent; failed += r.failed; after = r.next;
      st.textContent = T("Yuborildi: {s}, yetib bormadi: {f}", { s: fmtN(sent), f: fmtN(failed) }) + (after ? "…" : "");
    } while (after);
    try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
    adminInfo = null;
  } catch (e) { st.textContent = T("Xatolik: {e}", { e: e.message }); }
};
