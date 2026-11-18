// "Yangiliklar": youth news (jobs, AI, LLM agents, innovation, education) in the reader's language,
// from the share server's /news (it reads public news feeds and keeps only these topics, refreshed every 15 minutes).
// A ribbon on top of Foydali vositalar slides every 5 seconds and can be swiped; a tap opens the story,
// the "Yangiliklar" title opens the list of the latest headlines, and unread news and app updates show as badges.
const News = (() => {
  // what changed in the app, shown as "Ilova yangiliklari" next to the news
  const UPDATES = () => [
    { at: "2026-11-18", t: T("Yangiliklar lentasi: ish, sun'iy intellekt va ta'lim yangiliklari endi Foydali vositalar bo'limida") },
    { at: "2026-11-18", t: T("Tanlov: yangi xarita, oltin yo'l va avtomobilgacha yuguruvchi uchqunlar") },
    { at: "2026-11-18", t: T("Top 300 universitet: qabul darajasi va rasmiy sayt qo'shildi") },
    { at: "2026-11-18", t: T("Kasb Kompasi: savollar soddalashtirildi, javob \"Keyingi savol\" tugmasi bilan yuboriladi") },
    { at: "2026-11-17", t: T("Yangi vositalar: DTM va IELTS ball kalkulyatorlari, grantlar va sertifikatlar") },
  ];
  const key = "news_" + LANG;
  let data = store.get(key, null), loading = false, timer = null, pausedTill = 0;
  if (store.get("news_seen", null) === null) store.set("news_seen", Date.now() - 2 * 86400000);
  const seen = () => store.get("news_seen", 0);
  const items = () => (data && data.items) || [];
  const unread = () => items().filter((x) => x.at > seen()).length + UPDATES().filter((u) => Date.parse(u.at) > seen()).length;

  function load() {
    if (loading) return; loading = true;
    fetch(SHARE_API + "/news?l=" + LANG).then((r) => r.json()).then((d) => {
      if (!Array.isArray(d.items)) return;
      const changed = !data || JSON.stringify(d.items.map((x) => x.u)) !== JSON.stringify(items().map((x) => x.u));
      data = d; store.set(key, d); paint();
      if (changed && location.hash === "#/vositalar") { const el = document.getElementById("nw"); if (el) { el.outerHTML = ribbon(); bind(); } }
    }).catch(() => {}).finally(() => { loading = false; });
  }
  const ago = (t) => {
    const m = Math.max(1, Math.round((Date.now() - t) / 60000));
    return m < 60 ? T("{n} daqiqa oldin", { n: m }) : m < 1440 ? T("{n} soat oldin", { n: Math.round(m / 60) }) : T("{n} kun oldin", { n: Math.round(m / 1440) });
  };
  const thumb = (x, cls) => x.i ? `<img class="${cls}" src="${esc(x.i)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=\\'${cls} nw-noimg\\'>${ic("news").replace(/"/g, "&quot;").replace(/'/g, "&#39;")}</span>'">` : `<span class="${cls} nw-noimg">${ic("news")}</span>`;

  /* ---------- the ribbon ---------- */
  function ribbon() {
    const list = items().slice(0, 12), n = unread();
    if (!list.length) return `<div id="nw" class="nw">${data ? "" : `<div class="nw-head"><b>${T("Yangiliklar")}</b></div><div class="nw-skel"></div>`}</div>`;
    return `<div id="nw" class="nw">
      <button class="nw-head" onclick="newsList()"><b>${T("Yangiliklar")}</b>${n ? `<em>${n}</em>` : ""}<span>${T("Barchasi")} ${ic("chev")}</span></button>
      <div class="nw-track" id="nw-track">${list.map((x, i) => `<button class="nw-card" onclick="newsOpen(${i})">
        ${thumb(x, "nw-img")}<span class="nw-txt"><b class="notr">${esc(x.t)}</b><small>${esc(x.s)} · ${ago(x.at)}</small></span></button>`).join("")}</div>
      <div class="nw-dots">${list.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    </div>`;
  }
  // slides every 5 seconds; a touch or a swipe pauses it for a while
  function bind() {
    clearInterval(timer);
    const tr = document.getElementById("nw-track"); if (!tr) return;
    const dots = [...document.querySelectorAll(".nw-dots i")];
    const idx = () => Math.round(tr.scrollLeft / tr.clientWidth);
    tr.addEventListener("scroll", () => { const k = idx(); dots.forEach((d, i) => d.classList.toggle("on", i === k)); }, { passive: true });
    ["touchstart", "pointerdown", "wheel"].forEach((ev) => tr.addEventListener(ev, () => { pausedTill = Date.now() + 8000; }, { passive: true }));
    timer = setInterval(() => {
      if (!document.body.contains(tr)) return clearInterval(timer);
      if (Date.now() < pausedTill || document.hidden) return;
      const n = tr.children.length, k = (idx() + 1) % n;
      tr.scrollTo({ left: k * tr.clientWidth, behavior: "smooth" });
    }, 5000);
  }

  /* ---------- a story, and the list of headlines ---------- */
  // the story opens at once with its summary; the whole article (translated if needed) follows from the server
  const artCache = {};
  window.newsOpen = (i, from) => {
    const x = items()[i]; if (!x) return; haptic("light");
    sheet(`<div class="nw-read">${x.i ? `<img class="nw-hero" src="${esc(x.i)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
      <small class="nw-meta">${esc(x.s)} · ${ago(x.at)}${x.tr ? ` · ${T("tarjima")}` : ""}</small>
      <h3 class="notr">${esc(x.t)}</h3>
      <div class="nw-body notr" id="nw-body">${x.d ? `<p>${esc(x.d)}</p>` : ""}<div class="nw-loading"><div class="run-spin"></div><small>${x.o && x.o !== LANG ? T("Maqola tarjima qilinmoqda…") : T("Maqola yuklanmoqda…")}</small></div></div>
      <button class="btn-primary nw-go" onclick="openExt('${encodeURIComponent(x.u)}')">${ic("globe")} ${T("Asl manbani ochish")}</button>
      <button class="nw-link" onclick="openExt('${encodeURIComponent(x.u)}')">${esc(x.u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60))}</button>
      <button class="btn-ghost sd-share wide" onclick="shareNews(${i})">${ic("send")} ${T("Do'stga ulashish")}</button>
      ${from === "list" ? `<button class="btn-ghost" onclick="newsList()">${ic("back")} ${T("Barcha yangiliklar")}</button>` : ""}</div>`);
    const key = x.u + "|" + LANG;
    const show = (r) => {
      const el = document.getElementById("nw-body"); if (!el) return;
      if (r && r.p && r.p.length) el.innerHTML = r.p.map((t) => `<p>${esc(t)}</p>`).join("") + (r.tr ? `<p class="nw-trnote">${T("Maqola sun'iy intellekt yordamida tarjima qilindi. Asl matn manbada.")}</p>` : "");
      else { const l = el.querySelector(".nw-loading"); if (l) l.remove(); }
    };
    if (artCache[key]) return show(artCache[key]);
    fetch(SHARE_API + "/news/read?" + new URLSearchParams({ u: x.u, l: LANG, o: x.o || LANG })).then((r) => r.json()).then((r) => { artCache[key] = r; show(r); }).catch(() => show(null));
  };
  window.shareNews = (i) => { const x = items()[i]; if (!x) return; haptic("light"); openTg(`https://t.me/share/url?url=${encodeURIComponent(x.u)}&text=${encodeURIComponent(x.t + "\n\n" + T("Ustoz AI mini ilovasida o'qing") + ": https://t.me/" + BOT)}`); };
  let tab = "news";
  window.newsList = (t) => {
    if (t) tab = t; haptic("light");
    const s0 = seen();
    const rows = tab === "news"
      ? items().map((x, i) => `<button class="nw-row ${x.at > s0 ? "new" : ""}" onclick="newsOpen(${i},'list')"><b class="notr">${esc(x.t)}</b><small>${esc(x.s)} · ${ago(x.at)}</small></button>`).join("") || `<p class="note">${T("Hozircha yangilik yo'q")}</p>`
      : UPDATES().map((u) => `<div class="nw-row ${Date.parse(u.at) > s0 ? "new" : ""}"><b>${u.t}</b><small>${u.at.split("-").reverse().join(".")}</small></div>`).join("");
    sheet(`<h3>${T("Yangiliklar")}</h3>
      <div class="seg nw-tabs"><button class="${tab === "news" ? "on" : ""}" onclick="newsList('news')">${T("Yangiliklar")}</button><button class="${tab === "app" ? "on" : ""}" onclick="newsList('app')">${T("Ilova yangiliklari")}</button></div>
      <div class="nw-list">${rows}</div>`);
    store.set("news_seen", Date.now()); paint();
  };

  // the unread count on the Foydali vositalar tile and on the ribbon title
  function paint() {
    const n = unread();
    document.querySelectorAll("[data-nb]").forEach((el) => { el.textContent = n > 9 ? "9+" : n || ""; el.classList.toggle("on", n > 0); });
    const em = document.querySelector(".nw-head em"); if (em && !n) em.remove();
  }
  const app = document.getElementById("app");
  if (app) new MutationObserver(() => { paint(); if (location.hash === "#/vositalar") bind(); }).observe(app, { childList: true });
  setTimeout(load, 1200);
  setInterval(() => { if (!document.hidden) load(); }, 15 * 60000);
  return { ribbon, load, paint };
})();
window.News = News;
