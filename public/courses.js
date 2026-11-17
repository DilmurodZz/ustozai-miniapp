// "Kurslar": every Ustoz AI course with its mentor, students and rating, and for each course a plain-language
// explanation of what it teaches, how long it takes and how it can earn money, based on 11 088 hh.uz vacancies
// plus current OLX.uz job ads (data/kurslar.json, built from the job-market analysis).
const Kurslar = (() => {
  let data = null, loading = null, query = null, sort = null;

  function load() {
    if (data || loading) return loading;
    loading = fetch("data/kurslar.json").then((r) => r.json()).then((d) => { data = d; render(); }).catch(() => { loading = null; });
    return loading;
  }
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const n1 = (x) => String(x).replace(".", ",");
  const hrs = (s) => (s >= 3600 ? `${n1(Math.round(s / 360) / 10)} soat` : `${Math.max(1, Math.round(s / 60))} daqiqa`);
  const money = (lo, hi) => (lo && hi && hi !== lo ? `${n1(lo)}-${n1(hi)} mln so'm` : lo ? `${n1(lo)} mln so'mdan` : hi ? `${n1(hi)} mln so'mgacha` : "Maosh kelishiladi");
  const demandTone = (s) => (s >= 10 ? "hi" : s >= 5 ? "up" : s >= 2 ? "mid" : "lo");
  const demandWord = (s) => (s >= 10 ? "Talab juda yuqori" : s >= 5 ? "Talab yuqori" : s >= 2 ? "Talab o'rtacha" : "Talab past");
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
        <b class="km-big">${s ? fmt(s.analyzed) : "11 088"} ta vakansiya</b>
        <p>Kurslarimizni so'nggi 30 kunda e'lon qilingan ishlar bilan solishtirdik</p>
        <div class="km-stats">
          <span><b>84%</b><small>o'quvchilarimiz talab bor yo'nalishlarda o'qiydi</small></span>
          <span><b>${s ? s.courses : "…"}</b><small>kurs tahlil qilindi</small></span>
        </div>
        <div class="km-src"><small>Manbalar:</small><i>hh.uz</i><i>OLX.uz${s ? `, ${fmt(s.olxActive)} faol e'lon` : ""}</i></div>
      </div>
      <div class="km-tools">
        <label class="km-search">${ic("search")}<input id="km-q" placeholder="Kurs yoki ustoz nomi" value="${esc(query)}" autocomplete="off"></label>
      </div>`;
    if (!data) return head + skeleton;
    const ql = query.trim().toLowerCase();
    let list = data.courses.filter((c) => !ql || c.title.toLowerCase().includes(ql) || (c.teacher || "").toLowerCase().includes(ql));
    const G = data.groups;
    list = [...list].sort((a, b) => (G[a.g].schoolOrMed - G[b.g].schoolOrMed) || G[b.g].share - G[a.g].share || (b.students || 0) - (a.students || 0));
    return head + `<div class="kc-list">${list.map((c) => {
      const g = G[c.g];
      return `<a class="kc" href="#/kurs/${c.id}">
        <span class="kc-img">${c.image ? `<img src="${esc(img(c.image, 256))}" alt="" loading="lazy" decoding="async">` : ""}</span>
        <span class="kc-body">
          <b>${esc(c.title)}</b>
          <small>${esc(c.teacher || "Ustoz AI")}</small>
          <span class="kc-meta">${c.rating ? `<i class="star">${ic("star")}${n1(c.rating)}</i>` : ""}${c.students ? `<i>${ic("user")}${fmt(c.students)}</i>` : ""}${c.lessons ? `<i>${ic("play")}${c.lessons} dars</i>` : ""}</span>
          ${g.schoolOrMed ? `<span class="kc-tag info">Bilim uchun</span>` : `<span class="kc-tag ${demandTone(g.share)}">Talab: ${n1(g.share)}%, ${fmt(g.related)} ta ish</span>`}
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
    const strong = g.match != null && g.match >= 50;
    const months = g.months ? `${g.months[0]}-${g.months[1]} oy` : null;
    const mods = c.modules.filter((m) => m[0]);

    const about = `<section class="kd-card">
      <h3>${ic("book")} Bu kurs nima haqida?</h3>
      <p>${esc(c.about || "Bu kurs sizni ushbu sohaning asoslari bilan tanishtiradi.")}</p>
      ${mods.length ? `<div class="kd-mods">${mods.slice(0, 8).map((m, i) => `<span><i>${i + 1}</i>${esc(m[0])}<small>${m[1]} dars</small></span>`).join("")}${mods.length > 8 ? `<span class="more">va yana ${mods.length - 8} ta bo'lim</span>` : ""}</div>` : ""}
    </section>`;

    const time = `<section class="kd-card">
      <h3>${ic("clock")} Qancha vaqtda mutaxassis bo'lasiz?</h3>
      ${c.sec ? `<p>Kursdagi videolar jami <b>${hrs(c.sec)}</b>, <b>${c.lessons} ta dars</b>. Kuniga 1 soatdan shug'ullansangiz, videolar va amaliyot bilan kursni taxminan <b>${weeks} haftada</b> tugatasiz.</p>` : `<p>Kurs darslari hozir to'ldirilmoqda.</p>`}
      ${g.schoolOrMed ? `<p>Bu kurs bilimingizni mustahkamlash va o'qishga tayyorlanish uchun mo'ljallangan. Bu sohada ishlash uchun odatda oliy ma'lumot va diplom talab qilinadi.</p>`
        : months ? `<p>Amaliyot bilan birga birinchi ishga tayyor bo'lish uchun odatda <b>${months}</b> kerak bo'ladi: kursni tugating, kichik amaliy ishlar qiling va ularni rezyumengizga qo'shing.</p>` : ""}
    </section>`;

    const jobs = g.jobs.map((j) => `<button class="kd-job" ${ext(j.u)}>
        <span class="kd-job-t"><b>${esc(j.t)}</b><small>${esc(j.e)}${j.c ? ", " + esc(j.c) : ""}${j.r ? ", masofaviy" : ""}</small></span>
        <span class="kd-job-s">${money(j.lo, j.hi)}<i>hh.uz ${ic("chev")}</i></span></button>`).join("");
    const olx = (g.olx || []).filter((j) => !j.s || (j.cur === "UZS" ? j.s >= 250000 : j.s >= 20)).map((j) => `<button class="kd-job" ${ext(j.u)}>
        <span class="kd-job-t"><b>${esc(j.t)}</b><small>${esc(j.c || "O'zbekiston")}</small></span>
        <span class="kd-job-s">${j.s && j.cur === "UZS" ? `${n1(Math.round(j.s / 500000) / 2)} mln so'm` : j.s && j.cur === "USD" ? `${fmt(j.s)} $` : "Kelishiladi"}<i>OLX ${ic("chev")}</i></span></button>`).join("");
    const olxSearch = g.olxQuery ? `https://www.olx.uz/rabota/q-${encodeURIComponent(g.olxQuery)}/` : "https://www.olx.uz/rabota/";
    const hhSearch = `https://hh.uz/search/vacancy?text=${encodeURIComponent((g.jobs[0] && g.jobs[0].t) || c.title)}&area=97`;

    const earn = `<section class="kd-card earn">
      <h3>${ic("trend")} Bu orqali qanday pul topsa bo'ladi?</h3>
      ${g.schoolOrMed
        ? `<p>Biz so'nggi 30 kunda e'lon qilingan <b>${fmt(s.analyzed)} ta vakansiyani</b> tahlil qildik. Ulardan <b>${fmt(g.related)} tasi (${n1(g.share)}%)</b> ushbu soha bilan bog'liq, lekin ularning ko'pchiligi diplomli mutaxassislarni so'raydi. Bu kurs sizga bilim va kelajakdagi o'qish uchun kuchli poydevor beradi.</p>`
        : `<p>Biz so'nggi 30 kunda hh.uz va OLX.uz'da e'lon qilingan <b>${fmt(s.analyzed)} ta vakansiyani</b> tahlil qildik. Ulardan <b>${fmt(g.related)} tasi (${n1(g.share)}%)</b> ushbu kurs yo'nalishiga mos keladi.</p>
          <div class="kd-pay"><span><small>Maosh oyiga kamida</small><b>${g.minMln ? `${n1(g.minMln)} mln so'm` : "kelishiladi"}</b></span><span><small>O'rtacha maosh</small><b>${g.median ? `${fmt(Math.round(g.median))} $` : "-"}</b></span></div>
          <p>${strong ? `Bu kurs sizga kuchli bilim beradi va <b>${esc(g.job)}</b> lavozimlariga kuchli rezyume bilan ariza topshirishingizga yordam beradi.` : `Bu kurs sizga <b>${esc(g.job)}</b> ishiga kirish uchun kuchli asos beradi. Ishga tayyor bo'lish uchun kursdan keyin amaliyot va qo'shimcha ko'nikmalarni ham o'rganing.`}</p>`}
      ${jobs ? `<h4>Hozir ochiq vakansiyalar: hh.uz</h4><div class="kd-jobs">${jobs}</div>` : ""}
      ${olx ? `<h4>OLX.uz e'lonlari${g.olxCount ? `, jami ${fmt(g.olxCount)} ta faol` : ""}</h4><div class="kd-jobs">${olx}</div>` : ""}
      <div class="kd-more"><button ${ext(hhSearch)}>hh.uz'da ko'proq</button><button ${ext(olxSearch)}>OLX.uz'da ko'proq</button></div>
    </section>`;

    const tips = g.schoolOrMed ? "" : `<section class="kd-card">
      <h3>${ic("target")} Ishni qanday topasiz?</h3>
      <ul class="kd-tips">
        <li><b>Qayerdan qidirish:</b> hh.uz, OLX.uz ning "Ish" bo'limi, LinkedIn va Telegram'dagi ish kanallari.</li>
        <li><b>Qanday qidirish:</b> lavozim nomini rus va o'zbek tilida yozib qidiring${g.olxQuery ? `, masalan: "${esc(g.olxQuery)}"` : ""}.</li>
        <li><b>Rezyume:</b> kurs sertifikatini, kurs davomida qilgan amaliy ishlaringizni va natijalaringizni qo'shing.</li>
        ${g.noexp != null ? `<li><b>Tajribasiz:</b> bunday vakansiyalarning ${g.noexp}% qismi tajribasiz nomzodlarni ham qabul qiladi. Stajirovka va yordamchi lavozimlardan boshlang.</li>` : ""}
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
      <p class="note">Ma'lumotlar: hh.uz va OLX.uz, ${esc(s.period)}</p>`;
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
