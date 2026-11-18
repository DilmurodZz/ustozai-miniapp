// "Kurslar": every Ustoz AI course with its mentor, students and rating, and for each course a plain-language
// explanation of what it teaches, how long it takes and how it can earn money, based on 11 088 hh.uz vacancies
// plus OLX.uz job ads (data/kurslar.json, built by tools/build_kurslar.py: each course type counts only the vacancies that ask for that job or skill).
const Kurslar = (() => {
  let data = null, loading = null, query = null, sort = null;

  function load() {
    if (data || loading) return loading;
    loading = fetch("data/kurslar.json").then((r) => r.json()).then((d) => { data = d; if (location.hash.startsWith("#/kurs")) render(); }).catch(() => { loading = null; });
    return loading;
  }
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const n1 = (x) => String(x).replace(".", ",");
  const hrs = (s) => (s >= 3600 ? `${n1(Math.round(s / 360) / 10)} soat` : `${Math.max(1, Math.round(s / 60))} daqiqa`);
  const money = (lo, hi) => (lo && hi && hi !== lo ? `${n1(lo)}-${n1(hi)} mln so'm` : lo ? `${n1(lo)} mln so'mdan` : hi ? `${n1(hi)} mln so'mgacha` : "Maosh kelishiladi");
  // demand by the number of matching vacancies in 30 days (see tools/build_kurslar.py)
  const demandTone = (n) => (n >= 300 ? "hi" : n >= 100 ? "up" : n >= 30 ? "mid" : "lo");
  // "Bugun", "Kecha", "3 kun oldin" from a YYYY-MM-DD date; published in the last 3 days counts as new
  const daysAgo = (d) => { const t = new Date(); t.setHours(0, 0, 0, 0); return Math.max(0, Math.round((t - new Date(d + "T00:00:00")) / 864e5)); };
  const ago = (d) => { const n = daysAgo(d); return n === 0 ? T("Bugun") : n === 1 ? T("Kecha") : T("{n} kun oldin", { n }); };
  const recent = (d) => daysAgo(d) <= 3;
  let jobFilter = "all", jobLists = { all: [], rem: [] };
  const jobRows = (list) => list.map((j) => `<button class="kd-job" ${ext(j.u)}>
        <span class="kd-job-t"><b class="notr">${esc(j.t)}</b><small><span class="notr">${esc(j.e)}${j.c ? ", " + esc(j.c) : ""}</span>${j.r ? ", " + T("masofaviy") : ""}<em class="${recent(j.d) ? "new" : ""}">${ago(j.d)}</em></small></span>
        <span class="kd-job-s">${money(j.lo, j.hi)}<i>hh.uz ${ic("chev")}</i></span></button>`).join("");
  window.kJobs = (f) => {
    if (f === jobFilter || !jobLists[f].length) return;
    jobFilter = f; haptic("light");
    const box = document.getElementById("kd-jobs");
    if (box) box.innerHTML = jobRows(jobLists[f]);
    document.querySelectorAll(".kd-filter button").forEach((b) => b.classList.toggle("on", b.dataset.f === f));
  };
  const KIND_ORDER = { job: 0, general: 1, hobby: 2, study: 3 };
  const kindTag = { general: "Har qanday ish uchun", hobby: "Hobbi va ijod", study: "Bilim uchun" };
  const open = (url) => { try { if (tg && tg.openLink) return tg.openLink(url); } catch {} window.open(url, "_blank", "noopener"); };
  window.openExt = (u) => { haptic("light"); open(decodeURIComponent(u)); };
  const ext = (u) => `onclick="openExt('${encodeURIComponent(u)}')"`;
  // small images through the ustoz.ai image resizer (the originals are 1920px PNGs)
  const img = (u, w) => (u && /^https:\/\/upload\.ustozai-app\.uz\//.test(u) ? `https://ustoz.ai/_next/image?url=${encodeURIComponent(u)}&w=${w}&q=75` : u);
  const skeleton = `<div class="kc-skel"></div><div class="kc-skel"></div><div class="kc-skel"></div>`;

  // courses with under 30 minutes of video, and the computer literacy courses, go to the end of the list
  const low = (c) => ((c.sec || 0) < 1800 || c.g === "pc") ? 1 : 0;
  // students in the courses whose jobs are in high demand (100+ vacancies a month): a real count, not a share
  const topStudents = () => data.courses.reduce((n, c) => { const g = data.groups[c.g]; return n + (g.kind === "job" && g.related >= 100 ? c.students || 0 : 0); }, 0);

  /* ---------- a student who made a CV: the jobs that fit it best ---------- */
  function cvJobsCard() {
    if (!store.get("cv_data", null)) return "";
    if (typeof Tools === "undefined") { loadTools().then(() => { if (location.hash === "#/kurslar") render(); }).catch(() => {}); return ""; }
    const r = Tools.cvJobs(); if (!r || !r.top.length) return "";
    return `<div class="card cvj">
      <div class="cvj-head"><img class="cvj-logo" src="img/cv-logo.webp" alt="CV" width="44" height="44"><span><b>${T("Sizda ajoyib CV bor!")}</b>
        <small>${T("CV'dagi ko'nikmalaringiz asosida sizga eng mos ishlar")}</small></span></div>
      ${r.top.map((j, n) => `<button class="cvj-job c${n}" onclick="cvJobOpen('${esc(j.u)}')"><span class="jm-sc ${j.sc >= 80 ? "hi" : "mid"}">${j.sc}%</span>
        <span class="cvj-t"><b class="notr">${esc(j.t)}</b><small class="notr">${esc(j.e)}${j.c ? ", " + esc(j.c) : ""}</small>${Tools.money(j) ? `<em>${Tools.money(j)}</em>` : ""}</span>${ic("chev")}</button>`).join("")}
      <button class="btn-ghost cvj-all" onclick="location.hash='#/cv';setTimeout(()=>document.getElementById('cv-jobs')?.scrollIntoView({behavior:'smooth'}),700)">${ic("briefcase")} ${r.n80 > 3 ? T("Yana {n} ta mos ish", { n: r.n80 - 3 }) : T("Barcha mos ishlar")}</button>
    </div>`;
  }

  /* ---------- the list ---------- */
  function List() {
    if (query === null) { query = store.get("k_query", ""); sort = store.get("k_sort", "popular"); }   // remembered search and sorting
    load();
    const s = data && data.summary;
    const head = `${navbar(T("Kurslar"))}
      <div class="km-panel">
        <div class="km-top"><span class="km-ic">${ic("chart")}</span><span>Mehnat bozori tahlili</span></div>
        <b class="km-big">${T("{n} ta vakansiya tahlil qilindi", { n: s ? fmt(s.analyzed) : "11,088" })}</b>
        <div class="km-stats">
          <span><i class="km-si">${ic("users")}</i><em><b>${data ? fmt(topStudents()) : "…"}</b><small>${T("o'quvchi hozirda eng talabgir kurslarimizda o'qiydi")}</small></em></span>
          <span><i class="km-si">${ic("briefcase")}</i><em><b>${s ? s.courses : "119"}</b><small>kurs tahlil qilindi</small></em></span>
        </div>
        <div class="km-src"><small>Manbalar:</small><i>${ic("globe")}hh.uz</i><i>${ic("globe")}OLX.uz</i></div>
      </div>
      <div class="km-tools">
        <label class="km-search">${ic("search")}<input id="km-q" placeholder="${T("Kurs yoki ustoz nomi")}" value="${esc(query)}" autocomplete="off"></label>
      </div>`;
    if (!data) return head + skeleton;
    const ql = query.trim().toLowerCase();
    const cvCard = ql ? "" : cvJobsCard();
    let list = data.courses.filter((c) => !ql || c.title.toLowerCase().includes(ql) || (c.teacher || "").toLowerCase().includes(ql));
    const G = data.groups;
    list = [...list].sort((a, b) => (low(a) - low(b)) || (KIND_ORDER[G[a.g].kind] - KIND_ORDER[G[b.g].kind]) || (G[b.g].related || 0) - (G[a.g].related || 0) || (b.students || 0) - (a.students || 0));
    return head + cvCard + `<div class="kc-list">${list.map((c, i) => {
      const g = G[c.g];
      return `<a class="kc" href="#/kurs/${c.id}">
        <em class="kc-n">${i + 1}</em><span class="kc-img">${c.image ? `<img src="${esc(img(c.image, 256))}" alt="" loading="lazy" decoding="async">` : ""}</span>
        <span class="kc-body">
          <b class="notr">${esc(c.title)}</b>
          <small class="notr">${esc(c.teacher || "Ustoz AI")}</small>
          <span class="kc-meta">${c.rating ? `<i class="star">${ic("star")}${n1(c.rating)}</i>` : ""}${c.students ? `<i>${ic("user")}${fmt(c.students)}</i>` : ""}${c.lessons ? `<i>${ic("play")}${T("{n} dars", { n: c.lessons })}</i>` : ""}</span>
          ${g.kind === "job" ? `<span class="kc-tag ${demandTone(g.related)}">${T("Talab " + g.level.toLowerCase() + ": {n} ta ish", { n: fmt(g.related) })}</span>` : `<span class="kc-tag info">${T(kindTag[g.kind])}</span>`}
        </span></a>`;
    }).join("") || `<p class="note">${T("Hech narsa topilmadi")}</p>`}</div>`;
  }
  window.kSort = (k) => { sort = k; store.set("k_sort", k); haptic("light"); render(); };

  /* ---------- one course ---------- */
  function Detail(id) {
    load();
    if (!data) return `${navbar("Kurs")}${skeleton}`;
    const c = data.courses.find((x) => x.id === id);
    if (!c) return `${navbar("Kurs")}<p class="note">Kurs topilmadi</p>`;
    const g = data.groups[c.g], s = data.summary;
    const weeks = c.sec ? Math.max(1, Math.ceil((c.sec / 3600) * 2 / 7)) : null;          // a video hour plus as much practice, an hour a day
    const isJob = g.kind === "job", hasJobs = isJob || (g.jobs && g.jobs.length);
    const months = isJob && g.months ? T("{a}-{b} oy", { a: g.months[0], b: g.months[1] }) : null;
    const mods = c.modules.filter((m) => m[0]);

    const about = `<section class="kd-card">
      <h3>${ic("book")} Bu kurs nima haqida?</h3>
      <p class="notr">${esc(c.about || T("Bu kurs sizni ushbu sohaning asoslari bilan tanishtiradi."))}</p>
      ${mods.length ? `<div class="kd-mods notr">${mods.slice(0, 8).map((m, i) => `<span><i>${i + 1}</i>${esc(m[0])}<small>${T("{n} dars", { n: m[1] })}</small></span>`).join("")}${mods.length > 8 ? `<span class="more">${T("va yana {n} ta bo'lim", { n: mods.length - 8 })}</span>` : ""}</div>` : ""}
    </section>`;

    const time = `<section class="kd-card">
      <h3>${ic("clock")} Qancha vaqtda mutaxassis bo'lasiz?</h3>
      ${c.sec ? `<p>${T("Kursdagi videolar jami <b>{h}</b>, <b>{n} ta dars</b>. Kuniga 1 soatdan shug'ullansangiz, videolar va amaliyot bilan kursni taxminan <b>{w} haftada</b> tugatasiz.", { h: hrs(c.sec), n: c.lessons, w: weeks })}</p>` : `<p>Kurs darslari hozir to'ldirilmoqda.</p>`}
      ${months ? `<p>${T("Birinchi ishga tayyor bo'lish uchun taxminan <b>{m}</b> kerak bo'ladi (kuniga 1-2 soat shug'ullanganda{x}). Kursni tugating, kichik amaliy ishlar qiling va ularni rezyumengizga qo'shing.", { m: months, x: g.mnote ? ", " + esc(T(g.mnote)) : "" })}</p>` : ""}
      ${isJob && g.noexp != null && g.noexp < 10 ? `<p>${T("Bu sohada vakansiyalarning atigi {n}% qismi tajribasiz nomzodlarni qabul qiladi, shuning uchun birinchi ish ko'pincha stajirovka yoki yordamchi lavozim bo'ladi.", { n: g.noexp })}</p>` : ""}
    </section>`;

    // hh.uz vacancies (only 3.5 mln so'm a month and more, newest first) with an "all / remote" filter
    const all = g.jobs || [], shown = all.slice(0, g.jobsShown != null ? g.jobsShown : all.length), remote = all.filter((j) => j.r);
    jobLists = { all: shown, rem: remote };
    if (!remote.length) jobFilter = "all";
    const jobs = all.length ? `<div class="kd-filter" role="tablist">
        <button class="${jobFilter === "all" ? "on" : ""}" data-f="all" onclick="kJobs('all')">Barchasi <i>${shown.length}</i></button>
        <button class="${jobFilter === "rem" ? "on" : ""}" data-f="rem" onclick="kJobs('rem')" ${remote.length ? "" : "disabled"}>${ic("globe")} Masofaviy (onlayn) <i>${remote.length}</i></button>
      </div><div class="kd-jobs" id="kd-jobs">${jobRows(jobLists[jobFilter])}</div>` : "";
    const olx = (g.olx || []).map((j) => `<button class="kd-job" ${ext(j.u)}>
        <span class="kd-job-t"><b class="notr">${esc(j.t)}</b><small><span class="notr">${esc(j.c || "O'zbekiston")}</span>${j.d ? `<em class="${recent(j.d) ? "new" : ""}">${ago(j.d)}</em>` : ""}</small></span>
        <span class="kd-job-s">${T("{n} mln so'm", { n: n1(j.m) })}<i>OLX ${ic("chev")}</i></span></button>`).join("");
    const olxSearch = g.q ? `https://www.olx.uz/rabota/q-${encodeURIComponent(g.q)}/` : "https://www.olx.uz/rabota/";
    const hhSearch = g.kind === "general" && g.q ? `https://hh.uz/search/vacancy?experience=noExperience&area=97` : `https://hh.uz/search/vacancy?text=${encodeURIComponent(g.q || c.title)}&area=97`;
    const pay = g.medianMln
      ? `<div class="kd-pay"><span><small>Boshlang'ich maosh</small><b>${T("{n} mln so'm", { n: n1(g.lowMln) })}</b></span><span><small>O'rtacha maosh</small><b>${T("{n} mln so'm", { n: n1(g.medianMln) })}</b></span></div>
         <p class="kd-src">${T("Oylik maoshi ko'rsatilgan {n} ta vakansiya asosida", { n: fmt(g.salaried) })}</p>`
      : `<p class="kd-src">Maosh haqida ma'lumot yetarli emas: maoshi ko'rsatilgan vakansiyalar juda kam.</p>`;
    const note = g.note ? `<p>${esc(T(g.note))}</p>` : "";

    let body;
    if (isJob) body = `<p>${T("Biz so'nggi 30 kunda hh.uz'da e'lon qilingan <b>{a} ta vakansiyani</b> tahlil qildik. Ulardan <b>{b} tasi</b> aynan shu kurs o'rgatadigan kasb yoki ko'nikmani so'raydi.", { a: fmt(s.analyzed), b: fmt(g.related) })} ${T("Talab:")} <b>${T(g.level).toLowerCase()}</b>.</p>
        ${pay}${note}
        ${g.related < 10 ? `<p>${T("Bu yo'nalishda hozir vakansiyalar juda kam. Daromad ko'proq frilans buyurtmalar yoki o'z ishingiz orqali keladi.")}</p>` : ""}
        <p>${g.strong && c.sec >= 3 * 3600 ? T("Bu kurs sizga <b>{j}</b> lavozimlariga kuchli rezyume bilan ariza topshirishingizga yordam beradi.", { j: esc(T(g.job)) }) : T("Bu kurs <b>{j}</b> ishiga kirish uchun asos beradi. Ishga tayyor bo'lish uchun kursdan keyin amaliyot va qo'shimcha ko'nikmalarni ham o'rganing.", { j: esc(T(g.job)) })}</p>`;
    else if (hasJobs) body = `${note}<p>${T("Biz so'nggi 30 kunda hh.uz'da e'lon qilingan <b>{a} ta vakansiyani</b> tahlil qildik. Ulardan <b>{b} tasi</b> tajribasiz nomzodlarni ham qabul qiladi.", { a: fmt(s.analyzed), b: fmt(g.related) })}</p>${pay}`;
    else body = note;

    const earn = `<section class="kd-card earn">
      <h3>${ic("trend")} ${hasJobs ? "Bu orqali qanday pul topsa bo'ladi?" : "Bu kurs sizga nima beradi?"}</h3>
      ${body}
      ${hasJobs ? `<h4>${isJob ? "Hozir ochiq vakansiyalar: hh.uz" : "Tajribasiz qabul qiladigan vakansiyalar: hh.uz"}</h4>
        ${jobs || `<p class="kd-src">${T("Hozir maoshi oyiga 3,5 mln so'm va undan yuqori ko'rsatilgan vakansiya topilmadi. Barcha e'lonlarni hh.uz'da ko'ring.")}</p>`}` : ""}
      ${olx ? `<h4>OLX.uz e'lonlari</h4><div class="kd-jobs">${olx}</div>` : ""}
      ${hasJobs ? `<div class="kd-more"><button ${ext(hhSearch)}>hh.uz'da ko'proq</button><button ${ext(olxSearch)}>OLX.uz'da ko'proq</button></div>` : ""}
    </section>`;

    const tips = !hasJobs ? "" : `<section class="kd-card">
      <h3>${ic("target")} Ishni qanday topasiz?</h3>
      <ul class="kd-tips">
        <li>${T("<b>Qayerdan qidirish:</b> hh.uz, OLX.uz ning \"Ish\" bo'limi, LinkedIn va Telegram'dagi ish kanallari.")}</li>
        <li>${T("<b>Qanday qidirish:</b> lavozim nomini o'zbek va rus tilida yozib qidiring")}${isJob ? T(", masalan: \"{h}\"", { h: esc(g.hint) }) : ""}.</li>
        <li>${T("<b>Rezyume:</b> kurs sertifikatini, kurs davomida qilgan amaliy ishlaringizni va natijalaringizni qo'shing.")}</li>
        ${isJob && g.noexp != null ? `<li>${T("<b>Tajribasiz:</b> bunday vakansiyalarning {n}% qismi tajribasiz nomzodlarni ham qabul qiladi. Stajirovka va yordamchi lavozimlardan boshlang.", { n: g.noexp })}</li>` : ""}
        ${g.remote != null ? `<li>${T("<b>Joylashuv:</b> vakansiyalarning {a}% Toshkentda, {b}% masofaviy.", { a: g.tashkent, b: g.remote })}</li>` : ""}
        <li>${T("<b>Faollik:</b> har kuni 5-10 ta arizani yuboring va har bir vakansiyaga qisqa xat yozing.")}</li>
      </ul>
    </section>`;

    return `${navbar("Kurs")}
      <div class="kd-hero">${c.image ? `<img src="${esc(img(c.image, 828))}" alt="" decoding="async">` : ""}</div>
      <h2 class="kd-title notr">${esc(c.title)}</h2>
      <div class="kd-mentor">
        <span class="kd-ph">${c.photo ? `<img src="${esc(img(c.photo, 128))}" alt="" loading="lazy">` : esc((c.teacher || "U")[0])}</span>
        <span><small>${T("Ustoz")}</small><b class="notr">${esc(c.teacher || "Ustoz AI")}</b></span>
        <button class="kd-app" onclick="openApp('${esc(c.url)}')" aria-label="${T("Ilovada ochish")}"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5v13l10.5-6.5z" fill="currentColor"/></svg></i><small>${T("Ilovada")}</small></button>
      </div>
      <div class="kd-stats">
        <span><b>${c.students ? fmt(c.students) : "-"}</b><small>o'quvchi</small></span>
        <span><b>${c.rating ? `${n1(c.rating)} ${ic("star")}` : "-"}</b><small>${c.ratingCount ? T("{n} ta sharh", { n: fmt(c.ratingCount) }) : T("reyting")}</small></span>
        <span><b>${c.lessons || "-"}</b><small>dars</small></span>
        <span><b>${c.sec ? hrs(c.sec) : "-"}</b><small>video</small></span>
      </div>
      ${about}${time}${earn}${tips}
      <button class="btn-primary kd-go" onclick="openApp('${esc(c.url)}')">${ic("play")} ${T("Ustoz AI ilovasida boshlash")}</button>
      <p class="kd-store">${T("Ilova yo'qmi?")} <button onclick="openStore()">${T("Bepul yuklab oling")}</button></p>
      ${hasJobs ? `<p class="note">${T("Ma'lumotlar: hh.uz, {p}; OLX.uz e'lonlari", { p: esc(s.period) })}</p>` : ""}`;
  }

  // search keeps focus while typing
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "km-q") {
      query = e.target.value; store.set("k_query", query); const pos = e.target.selectionStart; render();
      const i = document.getElementById("km-q"); if (i) { i.focus(); i.setSelectionRange(pos, pos); }
    }
  });
  return { List, Detail, load, data: () => data, low };
})();
