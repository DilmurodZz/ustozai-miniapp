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
  const ago = (d) => { const n = daysAgo(d); return n === 0 ? "Bugun" : n === 1 ? "Kecha" : `${n} kun oldin`; };
  const recent = (d) => daysAgo(d) <= 3;
  let jobFilter = "all", jobLists = { all: [], rem: [] };
  const jobRows = (list) => list.map((j) => `<button class="kd-job" ${ext(j.u)}>
        <span class="kd-job-t"><b>${esc(j.t)}</b><small>${esc(j.e)}${j.c ? ", " + esc(j.c) : ""}${j.r ? ", masofaviy" : ""}<em class="${recent(j.d) ? "new" : ""}">${ago(j.d)}</em></small></span>
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

  /* ---------- the list ---------- */
  function List() {
    if (query === null) { query = store.get("k_query", ""); sort = store.get("k_sort", "popular"); }   // remembered search and sorting
    load();
    const s = data && data.summary;
    const head = `${navbar("Kurslar")}
      <div class="km-panel">
        <div class="km-top"><span class="km-ic">${ic("chart")}</span><span>Mehnat bozori tahlili</span></div>
        <b class="km-big">${s ? fmt(s.analyzed) : "11,088"} ta vakansiya tahlil qilindi</b>
        <div class="km-stats">
          <span><i class="km-si">${ic("users")}</i><em><b>${s ? s.studentsHighDemand : "33"}%</b><small>o'quvchilarimiz eng talabgir kurslarimizda o'qiydi</small></em></span>
          <span><i class="km-si">${ic("briefcase")}</i><em><b>${s ? s.courses : "119"}</b><small>kurs tahlil qilindi</small></em></span>
        </div>
        <div class="km-src"><small>Manbalar:</small><i>${ic("globe")}hh.uz</i><i>${ic("globe")}OLX.uz</i></div>
      </div>
      <div class="km-tools">
        <label class="km-search">${ic("search")}<input id="km-q" placeholder="Kurs yoki ustoz nomi" value="${esc(query)}" autocomplete="off"></label>
      </div>`;
    if (!data) return head + skeleton;
    const ql = query.trim().toLowerCase();
    let list = data.courses.filter((c) => !ql || c.title.toLowerCase().includes(ql) || (c.teacher || "").toLowerCase().includes(ql));
    const G = data.groups;
    list = [...list].sort((a, b) => (KIND_ORDER[G[a.g].kind] - KIND_ORDER[G[b.g].kind]) || (G[b.g].related || 0) - (G[a.g].related || 0) || (b.students || 0) - (a.students || 0));
    return head + `<div class="kc-list">${list.map((c) => {
      const g = G[c.g];
      return `<a class="kc" href="#/kurs/${c.id}">
        <span class="kc-img">${c.image ? `<img src="${esc(img(c.image, 256))}" alt="" loading="lazy" decoding="async">` : ""}</span>
        <span class="kc-body">
          <b>${esc(c.title)}</b>
          <small>${esc(c.teacher || "Ustoz AI")}</small>
          <span class="kc-meta">${c.rating ? `<i class="star">${ic("star")}${n1(c.rating)}</i>` : ""}${c.students ? `<i>${ic("user")}${fmt(c.students)}</i>` : ""}${c.lessons ? `<i>${ic("play")}${c.lessons} dars</i>` : ""}</span>
          ${g.kind === "job" ? `<span class="kc-tag ${demandTone(g.related)}">Talab ${g.level.toLowerCase()}: ${fmt(g.related)} ta ish</span>` : `<span class="kc-tag info">${kindTag[g.kind]}</span>`}
        </span></a>`;
    }).join("") || `<p class="note">Hech narsa topilmadi</p>`}</div>`;
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
    const months = isJob && g.months ? `${g.months[0]}-${g.months[1]} oy` : null;
    const mods = c.modules.filter((m) => m[0]);

    const about = `<section class="kd-card">
      <h3>${ic("book")} Bu kurs nima haqida?</h3>
      <p>${esc(c.about || "Bu kurs sizni ushbu sohaning asoslari bilan tanishtiradi.")}</p>
      ${mods.length ? `<div class="kd-mods">${mods.slice(0, 8).map((m, i) => `<span><i>${i + 1}</i>${esc(m[0])}<small>${m[1]} dars</small></span>`).join("")}${mods.length > 8 ? `<span class="more">va yana ${mods.length - 8} ta bo'lim</span>` : ""}</div>` : ""}
    </section>`;

    const time = `<section class="kd-card">
      <h3>${ic("clock")} Qancha vaqtda mutaxassis bo'lasiz?</h3>
      ${c.sec ? `<p>Kursdagi videolar jami <b>${hrs(c.sec)}</b>, <b>${c.lessons} ta dars</b>. Kuniga 1 soatdan shug'ullansangiz, videolar va amaliyot bilan kursni taxminan <b>${weeks} haftada</b> tugatasiz.</p>` : `<p>Kurs darslari hozir to'ldirilmoqda.</p>`}
      ${months ? `<p>Birinchi ishga tayyor bo'lish uchun taxminan <b>${months}</b> kerak bo'ladi (kuniga 1-2 soat shug'ullanganda${g.mnote ? `, ${esc(g.mnote)}` : ""}). Kursni tugating, kichik amaliy ishlar qiling va ularni rezyumengizga qo'shing.</p>` : ""}
      ${isJob && g.noexp != null && g.noexp < 10 ? `<p>Bu sohada vakansiyalarning atigi ${g.noexp}% qismi tajribasiz nomzodlarni qabul qiladi, shuning uchun birinchi ish ko'pincha stajirovka yoki yordamchi lavozim bo'ladi.</p>` : ""}
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
        <span class="kd-job-t"><b>${esc(j.t)}</b><small>${esc(j.c || "O'zbekiston")}${j.d ? `<em class="${recent(j.d) ? "new" : ""}">${ago(j.d)}</em>` : ""}</small></span>
        <span class="kd-job-s">${n1(j.m)} mln so'm<i>OLX ${ic("chev")}</i></span></button>`).join("");
    const olxSearch = g.q ? `https://www.olx.uz/rabota/q-${encodeURIComponent(g.q)}/` : "https://www.olx.uz/rabota/";
    const hhSearch = g.kind === "general" && g.q ? `https://hh.uz/search/vacancy?experience=noExperience&area=97` : `https://hh.uz/search/vacancy?text=${encodeURIComponent(g.q || c.title)}&area=97`;
    const pay = g.medianMln
      ? `<div class="kd-pay"><span><small>Boshlang'ich maosh</small><b>${n1(g.lowMln)} mln so'm</b></span><span><small>O'rtacha maosh</small><b>${n1(g.medianMln)} mln so'm</b></span></div>
         <p class="kd-src">Oylik maoshi ko'rsatilgan ${fmt(g.salaried)} ta vakansiya asosida</p>`
      : `<p class="kd-src">Maosh haqida ma'lumot yetarli emas: maoshi ko'rsatilgan vakansiyalar juda kam.</p>`;
    const note = g.note ? `<p>${esc(g.note)}</p>` : "";

    let body;
    if (isJob) body = `<p>Biz so'nggi 30 kunda hh.uz'da e'lon qilingan <b>${fmt(s.analyzed)} ta vakansiyani</b> tahlil qildik. Ulardan <b>${fmt(g.related)} tasi</b> aynan shu kurs o'rgatadigan kasb yoki ko'nikmani so'raydi. Talab: <b>${g.level.toLowerCase()}</b>.</p>
        ${pay}${note}
        ${g.related < 10 ? `<p>Bu yo'nalishda hozir vakansiyalar juda kam. Daromad ko'proq frilans buyurtmalar yoki o'z ishingiz orqali keladi.</p>` : ""}
        <p>${g.strong && c.sec >= 3 * 3600 ? `Bu kurs sizga <b>${esc(g.job)}</b> lavozimlariga kuchli rezyume bilan ariza topshirishingizga yordam beradi.` : `Bu kurs <b>${esc(g.job)}</b> ishiga kirish uchun asos beradi. Ishga tayyor bo'lish uchun kursdan keyin amaliyot va qo'shimcha ko'nikmalarni ham o'rganing.`}</p>`;
    else if (hasJobs) body = `${note}<p>Biz so'nggi 30 kunda hh.uz'da e'lon qilingan <b>${fmt(s.analyzed)} ta vakansiyani</b> tahlil qildik. Ulardan <b>${fmt(g.related)} tasi</b> tajribasiz nomzodlarni ham qabul qiladi.</p>${pay}`;
    else body = note;

    const earn = `<section class="kd-card earn">
      <h3>${ic("trend")} ${hasJobs ? "Bu orqali qanday pul topsa bo'ladi?" : "Bu kurs sizga nima beradi?"}</h3>
      ${body}
      ${hasJobs ? `<h4>${isJob ? "Hozir ochiq vakansiyalar: hh.uz" : "Tajribasiz qabul qiladigan vakansiyalar: hh.uz"}</h4>
        ${jobs || `<p class="kd-src">Hozir maoshi oyiga 3,5 mln so'm va undan yuqori ko'rsatilgan vakansiya topilmadi. Barcha e'lonlarni hh.uz'da ko'ring.</p>`}` : ""}
      ${olx ? `<h4>OLX.uz e'lonlari</h4><div class="kd-jobs">${olx}</div>` : ""}
      ${hasJobs ? `<div class="kd-more"><button ${ext(hhSearch)}>hh.uz'da ko'proq</button><button ${ext(olxSearch)}>OLX.uz'da ko'proq</button></div>` : ""}
    </section>`;

    const tips = !hasJobs ? "" : `<section class="kd-card">
      <h3>${ic("target")} Ishni qanday topasiz?</h3>
      <ul class="kd-tips">
        <li><b>Qayerdan qidirish:</b> hh.uz, OLX.uz ning "Ish" bo'limi, LinkedIn va Telegram'dagi ish kanallari.</li>
        <li><b>Qanday qidirish:</b> lavozim nomini o'zbek va rus tilida yozib qidiring${isJob ? `, masalan: "${esc(g.hint)}"` : ""}.</li>
        <li><b>Rezyume:</b> kurs sertifikatini, kurs davomida qilgan amaliy ishlaringizni va natijalaringizni qo'shing.</li>
        ${isJob && g.noexp != null ? `<li><b>Tajribasiz:</b> bunday vakansiyalarning ${g.noexp}% qismi tajribasiz nomzodlarni ham qabul qiladi. Stajirovka va yordamchi lavozimlardan boshlang.</li>` : ""}
        ${g.remote != null ? `<li><b>Joylashuv:</b> vakansiyalarning ${g.tashkent}% Toshkentda, ${g.remote}% masofaviy.</li>` : ""}
        <li><b>Faollik:</b> har kuni 5-10 ta arizani yuboring va har bir vakansiyaga qisqa xat yozing.</li>
      </ul>
    </section>`;

    return `${navbar("Kurs")}
      <div class="kd-hero">${c.image ? `<img src="${esc(img(c.image, 828))}" alt="" decoding="async">` : ""}</div>
      <h2 class="kd-title">${esc(c.title)}</h2>
      <div class="kd-mentor">
        <span class="kd-ph">${c.photo ? `<img src="${esc(img(c.photo, 128))}" alt="" loading="lazy">` : esc((c.teacher || "U")[0])}</span>
        <span><small>Ustoz</small><b>${esc(c.teacher || "Ustoz AI")}</b></span>
      </div>
      <div class="kd-stats">
        <span><b>${c.students ? fmt(c.students) : "-"}</b><small>o'quvchi</small></span>
        <span><b>${c.rating ? `${n1(c.rating)} ${ic("star")}` : "-"}</b><small>${c.ratingCount ? `${fmt(c.ratingCount)} ta sharh` : "reyting"}</small></span>
        <span><b>${c.lessons || "-"}</b><small>dars</small></span>
        <span><b>${c.sec ? hrs(c.sec) : "-"}</b><small>video</small></span>
      </div>
      ${about}${time}${earn}${tips}
      <button class="btn-primary kd-go" ${ext(c.url)}>${ic("play")} Kursni boshlash</button>
      ${hasJobs ? `<p class="note">Ma'lumotlar: hh.uz, ${esc(s.period)}; OLX.uz e'lonlari</p>` : ""}`;
  }

  // search keeps focus while typing
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "km-q") {
      query = e.target.value; store.set("k_query", query); const pos = e.target.selectionStart; render();
      const i = document.getElementById("km-q"); if (i) { i.focus(); i.setSelectionRange(pos, pos); }
    }
  });
  return { List, Detail, load };
})();
