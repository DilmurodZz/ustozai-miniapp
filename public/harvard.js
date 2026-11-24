// "Harvard Admission tips": the HGSE seminar book on top, then the Ustoz AI courses that help a student apply to top universities.
// Each course has a short note: why universities ask for it, what the course teaches and what the student gets.
// Facts about HGSE requirements come from the seminar slides (IELTS 7.5 total and per section, 120 second video response).
const Harvard = (() => {
  const COURSES = [
    { id: "76e1dfe5-f339-4416-96c7-d5825f35c3f5", tag: "SAT",
      why: "Garvard va AQShning boshqa yetakchi universitetlari ariza bilan birga SAT yoki ACT natijasini so'raydi. Yuqori SAT bali arizangizni kuchli qiladi.",
      what: "Matematika hamda o'qish va yozish bo'limlari real SAT formatida: strategiyalar, savollar tahlili va amaliy testlar.",
      get: "SAT imtihoniga tayyor bo'lasiz va maqsad qilgan ballingizga yaqinlashasiz." },
    { id: "3c9c2118-3717-4cb0-a85f-c3de7cc1f9c6", tag: "IELTS",
      why: "Ona tili ingliz tili bo'lmagan nomzodlardan til sertifikati so'raladi. Masalan, Garvard Ta'lim oliy maktabi IELTS'dan umumiy va har bir qismdan kamida 7,5 ball kutadi.",
      what: "Speaking, Writing, Reading va Listening bo'yicha strategiyalar, foydali materiallar va grant yutish bo'yicha maslahatlar.",
      get: "IELTS'dan 7 va undan yuqori ball olishga tayyorlanasiz." },
    { id: "a997dfe8-1a1e-4593-8915-05bdae7db482", tag: "IELTS",
      why: "Reading IELTS'ning to'rt qismidan biri. Top universitetlar har bir qism uchun ham alohida minimal ball qo'yadi.",
      what: "Reading savol turlari tahlili, vaqtni to'g'ri taqsimlash strategiyalari va amaliy mashqlar.",
      get: "Reading bo'limida yuqori ball olish uchun aniq usullarni o'rganasiz." },
  ];
  let open = false;
  // a plain smile, drawn in the text colour (no background)
  const SMILE = `<svg class="hv-smile" viewBox="0 0 100 52" aria-hidden="true"><ellipse cx="34" cy="14" rx="5.6" ry="10.5" fill="currentColor"/><ellipse cx="66" cy="14" rx="5.6" ry="10.5" fill="currentColor"/><path d="M9 31c3 1 6 0 8-3M91 31c-3 1-6 0-8-3M14 30c18 22 54 22 72 0" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>`;
  const list = () => {
    const d = Kurslar.data(); if (!d) return null;
    return COURSES.map((x) => ({ ...x, c: d.courses.find((c) => c.id === x.id) })).filter((x) => x.c);
  };
  const price = (c) => !Number(c.price) ? T("Bepul") : `${fmtN(Number(c.price))} ${T("so'm")}`;
  const hours = (c) => { const h = (c.sec || 0) / 3600; return h >= 1 ? T("{n} soat", { n: String(Math.round(h * 10) / 10).replace(".", ",") }) : h > 0 ? T("{n} daqiqa", { n: Math.max(1, Math.round(h * 60)) }) : ""; };

  function coursesHTML() {
    const items = list();
    if (!items) { const p = Kurslar.load(); if (p) p.then(() => { if (location.hash === "#/harvard") render(); }); return `<div class="busy-in"><div class="run-spin"></div></div>`; }
    return `<div class="hv-list">${items.map((x, i) => `<button class="hv-row" onclick="hvCourse(${i})" style="--i:${i}">
        ${x.c.image ? `<img src="${esc(x.c.image)}" alt="" loading="lazy">` : `<i class="hv-noimg">${ic("play")}</i>`}
        <span><em>${T(x.tag)}</em><b class="notr">${esc(x.c.title)}</b><small class="notr">${esc(x.c.teacher || "Ustoz AI")}</small></span>${ic("chev", "chev")}</button>`).join("")}
      <a class="hv-studio" href="#/ariza" style="--i:${items.length}"><img src="img/tool-studio.webp" alt="" decoding="async"><span><b>${T("Bizda top universitetlarga hujjat tayyorlash uchun Application Studio ham bor")}</b><small>${T("Profil, insholar, tavsiyanomalar va muddatlar bir joyda")}</small></span>${ic("chev", "chev")}</a></div>`;
  }
  function Screen() {
    return `${navbar("Harvard Admission tips")}
    <a class="hv-book" href="#/workshop">
      <img class="hv-shield" src="img/hgse/harvard.webp" alt="Harvard" decoding="async">
      <small class="hv-kick">The Road to Harvard · ${T("Toshkent")}</small>
      <h2>Application Workshop</h2>
      <p>${T("Dasturlar, maqsadni to'g'ri ko'rsatish, tavsiyanomalar, testlar va moliyaviy yordam haqida")}</p>
      <span class="hv-author"><img src="img/hgse/rivkin.webp" alt="" decoding="async"><span><b>Stanislav Rivkin</b><small>Senior Associate Director of Admissions</small><small>Harvard</small></span></span>
      <span class="hv-foot"><small>${T("40 sahifa · O'zbekcha va English")}</small><span class="hv-read">${T("O'qish")} ${ic("chev")}</span></span>
    </a>
    <section class="hv-help">
      <p class="hv-say">${(() => { const t = T("Bizda sizga Garvardga kirishda yordam beradigan darslarimiz bor"), k = t.lastIndexOf(" "); return `${esc(t.slice(0, k))} <span class="hv-nw">${esc(t.slice(k + 1))}${SMILE}</span>`; })()}</p>
      <button class="hv-go ${open ? "on" : ""}" onclick="hvToggle()">${open ? T("Yopish") : T("Ko'rish")} ${ic("chev", "hv-chev")}</button>
      ${open ? coursesHTML() : ""}
    </section>`;
  }
  window.hvToggle = () => { open = !open; haptic("light"); render(); if (open) requestAnimationFrame(() => document.querySelector(".hv-list")?.scrollIntoView({ behavior: "smooth", block: "nearest" })); };
  window.hvCourse = (i) => {
    const x = list()[i]; if (!x) return; const c = x.c, h = hours(c);
    haptic("light");
    sheet(`<div class="hv-info">
      ${c.image ? `<img class="hv-cover" src="${esc(c.image)}" alt="" decoding="async">` : ""}
      <em class="hv-tag">${T(x.tag)}</em>
      <h3 class="notr">${esc(c.title)}</h3>
      <small class="notr">${esc(c.teacher || "Ustoz AI")}</small>
      <div class="hv-facts"><span>${ic("play")}${T("{n} dars", { n: c.lessons })}</span>${h ? `<span>${ic("clock")}${h}</span>` : ""}<span>${ic("coin")}${price(c)}</span></div>
      <div class="hv-pt"><b>${T("Nega kerak")}</b><p>${T(x.why)}</p></div>
      <div class="hv-pt"><b>${T("Kursda nima bor")}</b><p>${T(x.what)}</p></div>
      <div class="hv-pt"><b>${T("Natija")}</b><p>${T(x.get)}</p></div>
      <div class="hv-btns"><button class="btn-ghost" onclick="closeSheet();location.hash='#/kurs/${c.id}'">${T("Batafsil")}</button><button class="btn-primary" onclick="openApp('${esc(c.url)}')">${ic("play")} ${T("Ilovada ochish")}</button></div>
    </div>`);
  };
  return { Screen };
})();
window.Harvard = Harvard;
