// "Foydali vositalar": the free CV / resume maker and other useful tools.
// The CV is filled in inside the Mini App, shown as a live A4 preview and exported as PDF, PNG (exact picture of the
// preview, html2canvas + jsPDF in lib/) or Word (editable .docx, written here without any library). The file reaches the
// user through the share server: Telegram's own download window (WebApp.downloadFile) or a message in the bot chat.
const Tools = (() => {
  /* ---------- texts inside the document, in the document's own language ---------- */
  const H = {
    uz: { summary: "Men haqimda", exp: "Ish tajribasi", edu: "Ta'lim", certs: "Sertifikatlar", skills: "Ko'nikmalar", interests: "Qiziqishlar", contact: "Aloqa", now: "hozirgacha" },
    ru: { summary: "О себе", exp: "Опыт работы", edu: "Образование", certs: "Сертификаты", skills: "Навыки", interests: "Интересы", contact: "Контакты", now: "по настоящее время" },
    en: { summary: "Summary", exp: "Work experience", edu: "Education", certs: "Certifications", skills: "Skills", interests: "Interests", contact: "Contact", now: "present" },
  };
  // example data ("namuna"): a made-up person and made-up companies
  const SAMPLE = {
    uz: { name: "Aziz Namunov", title: "O'qitish va rivojlantirish mutaxassisi", phone: "+998 90 000 00 00", email: "namuna@example.com", city: "Toshkent, O'zbekiston", link: "linkedin.com/in/namuna",
      summary: "Xodimlarni o'qitish va HR loyihalarida 3 yillik tajribaga ega mutaxassis. 3 000 dan ortiq xodim uchun o'quv dasturlarini tayyorlagan va o'quv boshqaruv tizimini (LMS) joriy qilgan.",
      exp: [
        { role: "O'qitish va rivojlantirish mutaxassisi", org: "Namuna Group", city: "Toshkent", from: "08/2023", to: "", now: true, items: "3 000 dan ortiq xodim, 50 menejer va 10 rahbar uchun o'quv dasturlarini ishlab chiqdi\nKompaniya bo'ylab so'rovnomani boshqarib, 97% ishtirokka erishdi\nO'quv boshqaruv tizimini (LMS) joriy qilib, o'qitish hisobini avtomatlashtirdi" },
        { role: "HR loyiha menejeri (yarim stavka)", org: "Example Academy", city: "Toshkent", from: "10/2023", to: "05/2025", now: false, items: "5 nafar koordinatordan iborat jamoani boshqardi: muddatlar, byudjet va natijalar\nHR menejment kursi uchun dastur, uy vazifalari va imtihonlarni tayyorladi\nIkki mavsumda 30 dan ortiq yosh mutaxassisni o'qitdi" },
        { role: "HR o'qitish mutaxassisi", org: "Misol Savdo MChJ", city: "Toshkent", from: "05/2023", to: "08/2023", now: false, items: "6 ta filial uchun o'quv ehtiyojlarini tahlil qildi\nYangi xodimlar uchun moslashuv jarayoni va qo'llanmasini tayyorladi" },
      ],
      edu: [{ org: "Namuna davlat universiteti", degree: "Ingliz filologiyasi, bakalavr", city: "Toshkent", from: "09/2019", to: "07/2023", items: "Imtiyozli diplom, GPA 4,74 / 5\nKitob klubi va notiqlik tanlovi tashkilotchisi" }],
      certs: "\"Trenerlar uchun trening\", Namuna markazi\n\"Loyiha boshqaruvi\", Example Business School\n\"Generativ AI\", Namuna Group",
      skills: "Tillar: ingliz (C1), rus (B2), o'zbek (ona tili)\nDasturlar: Google Workspace, Microsoft Office, Jira, Trello, Canva",
      interests: "Voleybol\nKitob o'qish\nVideomontaj" },
    ru: { name: "Aziz Namunov", title: "Специалист по обучению и развитию", phone: "+998 90 000 00 00", email: "namuna@example.com", city: "Ташкент, Узбекистан", link: "linkedin.com/in/namuna",
      summary: "Специалист с 3-летним опытом в обучении персонала и HR-проектах. Разработал программы обучения для более чем 3 000 сотрудников и внедрил систему управления обучением (LMS).",
      exp: [
        { role: "Специалист по обучению и развитию", org: "Namuna Group", city: "Ташкент", from: "08/2023", to: "", now: true, items: "Разработал программы обучения для 3 000+ сотрудников, 50 менеджеров и 10 руководителей\nПровёл опрос по всей компании с участием 97% сотрудников\nВнедрил LMS и автоматизировал учёт обучения" },
        { role: "Менеджер HR-проектов (частичная занятость)", org: "Example Academy", city: "Ташкент", from: "10/2023", to: "05/2025", now: false, items: "Руководил командой из 5 координаторов: сроки, бюджет, результаты\nПодготовил программу курса HR-менеджмента, задания и экзамены\nОбучил более 30 молодых специалистов за два сезона" },
        { role: "Специалист по обучению персонала", org: "Misol Savdo", city: "Ташкент", from: "05/2023", to: "08/2023", now: false, items: "Проанализировал потребности в обучении для 6 филиалов\nВыстроил процесс адаптации новых сотрудников и подготовил руководство" },
      ],
      edu: [{ org: "Namuna State University", degree: "Английская филология, бакалавр", city: "Ташкент", from: "09/2019", to: "07/2023", items: "Диплом с отличием, GPA 4,74 / 5\nОрганизатор книжного клуба и конкурса ораторов" }],
      certs: "\"Тренинг для тренеров\", Namuna Center\n\"Управление проектами\", Example Business School\n\"Генеративный ИИ\", Namuna Group",
      skills: "Языки: английский (C1), русский (B2), узбекский (родной)\nПрограммы: Google Workspace, Microsoft Office, Jira, Trello, Canva",
      interests: "Волейбол\nЧтение книг\nВидеомонтаж" },
    en: { name: "Aziz Namunov", title: "Learning and Development Specialist", phone: "+998 90 000 00 00", email: "namuna@example.com", city: "Tashkent, Uzbekistan", link: "linkedin.com/in/namuna",
      summary: "Specialist with 3 years of experience in staff training and HR projects. Built training programmes for more than 3,000 employees and introduced a learning management system (LMS).",
      exp: [
        { role: "Learning and Development Specialist", org: "Namuna Group", city: "Tashkent", from: "08/2023", to: "", now: true, items: "Designed training programmes for 3,000+ employees, 50 managers and 10 executives\nRan a company-wide survey with a 97% completion rate\nIntroduced an LMS and automated training records" },
        { role: "HR Project Manager (part-time)", org: "Example Academy", city: "Tashkent", from: "10/2023", to: "05/2025", now: false, items: "Led a team of 5 coordinators: timelines, budget and deliverables\nCreated the HR management course content, homework and final exams\nTrained 30+ young professionals over two seasons" },
        { role: "HR Training Specialist", org: "Misol Savdo LLC", city: "Tashkent", from: "05/2023", to: "08/2023", now: false, items: "Analysed training needs for 6 branches\nBuilt the onboarding process and the new-hire handbook" },
      ],
      edu: [{ org: "Namuna State University", degree: "Bachelor of English Philology", city: "Tashkent", from: "09/2019", to: "07/2023", items: "First-class honours, GPA 4.74 / 5\nOrganiser of the book club and public speaking contest" }],
      certs: "\"Train the Trainers\", Namuna Center\n\"Project Management\", Example Business School\n\"Generative AI\", Namuna Group",
      skills: "Languages: English (C1), Russian (B2), Uzbek (native)\nSoftware: Google Workspace, Microsoft Office, Jira, Trello, Canva",
      interests: "Volleyball\nReading\nVideo editing" },
  };
  // a neutral silhouette for the example photo
  const SAMPLE_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#DCE3F0"/><circle cx="60" cy="46" r="22" fill="#9AA8C2"/><path d="M18 120c4-26 21-40 42-40s38 14 42 40z" fill="#9AA8C2"/></svg>`);

  const TYPES = () => [
    { k: "cv", name: T("CV"), d: T("To'liq ta'lim, barcha ish joylari, sertifikat va yutuqlar. 1-2 sahifa. Grant, magistratura, xalqaro va yirik kompaniyalar uchun.") },
    { k: "rez", name: T("Rezyume"), d: T("Faqat 1 sahifa: shu ishga kerakli tajriba va natijalar, boshida qisqacha o'zingiz haqingizda. Ko'pchilik kompaniyalarga ishga kirish uchun.") },
    { k: "photo", name: T("Rasmli CV"), d: T("Chap tomonda rasm, aloqa va ko'nikmalar, o'ngda tajriba. O'zbekiston va MDH kompaniyalarida, savdo, xizmat ko'rsatish va ofis ishlari uchun keng tarqalgan.") },
  ];

  /* ---------- saved draft ---------- */
  const blank = () => ({ name: "", title: "", phone: "", email: "", city: "", link: "", photo: "", summary: "", exp: [{ role: "", org: "", city: "", from: "", to: "", now: false, items: "" }], edu: [{ org: "", degree: "", city: "", from: "", to: "", items: "" }], certs: "", skills: "", interests: "" });
  let cv = store.get("cv_data", null) || blank();
  let kind = store.get("cv_kind", "cv"), docLang = store.get("cv_lang", LANG), preview = null;
  const save = () => { store.set("cv_data", cv); store.set("cv_kind", kind); store.set("cv_lang", docLang); };

  /* ---------- the document (A4, 794 px wide) ---------- */
  const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const li = (s) => { const m = s.match(/^([^:]{2,24}):\s*(.+)$/); return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(s); };
  const dates = (e, h) => [e.from, e.now ? h.now : e.to].filter(Boolean).join(" - ");
  function docHTML(d, k, lang) {
    const h = H[lang] || H.uz;
    const contact = [d.phone, d.city, d.email, d.link].filter(Boolean);
    const sec = (title, body) => body ? `<section><h3>${title}</h3>${body}</section>` : "";
    const entry = (a, b, sub, when, items) => `<div class="cd-e"><div class="cd-er"><span><b>${esc(a)}</b>${b ? `, ${esc(b)}` : ""}</span><span class="cd-d">${esc(when)}</span></div>${sub ? `<i>${esc(sub)}</i>` : ""}${lines(items).length ? `<ul>${lines(items).map((x) => `<li>${li(x)}</li>`).join("")}</ul>` : ""}</div>`;
    const exp = (d.exp || []).filter((e) => e.role || e.org).map((e) => entry(e.org, e.city, e.role, dates(e, h), e.items)).join("");
    const edu = (d.edu || []).filter((e) => e.org || e.degree).map((e) => entry(e.org, e.city, e.degree, dates(e, h), e.items)).join("");
    const list = (s) => lines(s).length ? `<ul>${lines(s).map((x) => `<li>${li(x)}</li>`).join("")}</ul>` : "";
    if (k === "photo") {
      return `<div class="cvdoc cd-photo"><aside>
        ${d.photo || d.sample ? `<img class="cd-ph" src="${esc(d.photo || SAMPLE_PHOTO)}" alt="">` : ""}
        ${sec(h.contact, contact.length ? `<ul class="cd-plain">${contact.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "")}
        ${sec(h.skills, list(d.skills))}${sec(h.interests, list(d.interests))}
      </aside><main>
        <h1>${esc(d.name)}</h1>${d.title ? `<h2>${esc(d.title)}</h2>` : ""}
        ${sec(h.summary, d.summary ? `<p>${esc(d.summary)}</p>` : "")}${sec(h.exp, exp)}${sec(h.edu, edu)}${sec(h.certs, list(d.certs))}
      </main></div>`;
    }
    const head = `<header><h1>${esc(d.name)}</h1>${k === "rez" && d.title ? `<h2>${esc(d.title)}</h2>` : ""}<p>${contact.map(esc).join("  |  ")}</p></header>`;
    if (k === "rez") return `<div class="cvdoc cd-rez">${head}${sec(h.summary, d.summary ? `<p>${esc(d.summary)}</p>` : "")}${sec(h.exp, exp)}${sec(h.skills, list(d.skills))}${sec(h.edu, edu)}${sec(h.certs, list(d.certs))}</div>`;
    return `<div class="cvdoc cd-cv">${head}${sec(h.edu, edu)}${sec(h.exp, exp)}${sec(h.certs, list(d.certs))}${sec(h.skills, list(d.skills))}${sec(h.interests, list(d.interests))}</div>`;
  }
  // the example as a small picture (scaled real document, so it looks exactly like the result)
  const thumb = (k, lang = LANG, big) => `<div class="cv-thumb ${big ? "big" : ""}"><div class="cv-scale">${docHTML({ ...(SAMPLE[lang] || SAMPLE.uz), sample: true }, k, lang)}</div></div>`;

  /* ---------- screens ---------- */
  function Screen() {
    const soon = [["calc", T("DTM ball kalkulyatori va OTM kirish ballari")], ["mic", T("IELTS ball kalkulyatori va AI speaking sherigi")], ["clock", T("Imtihonlarga qolgan vaqt")], ["cap", T("Grant va stipendiyalar qidiruvi")]];
    return `${navbar(T("Foydali vositalar"))}
    <a class="card tool-cv" href="#/cv">
      <div class="tool-top">${chip("file", "solid")}<span><b>${T("CV va rezyume yaratish")}</b><small>${T("Bepul, 5 daqiqada, tayyor namunalar bilan")}</small></span><em class="tool-free">${T("Bepul")}</em></div>
      <div class="tool-thumbs">${TYPES().map((t) => `<span>${thumb(t.k)}<small>${t.name}</small></span>`).join("")}</div>
      <span class="btn-primary">${ic("pen")} ${T("CV tayyorlash")}</span>
    </a>
    <div class="card tool-bot">
      <img src="img/poyezdbilet24.webp" alt="" width="56" height="56">
      <span><b>Poyezd Bilet 24</b><small>@poyezdbilet24_bot · ${T("Bepul bot")}</small>
      <p>${T("Poyezd chiptasini oson oling: bo'sh joy bo'lmasa ham bot yo'nalishni 24/7 kuzatadi va joy paydo bo'lishi bilan uni 2 soniyada bron qiladi.")}</p></span>
      <button class="btn-primary" onclick="openTg('https://t.me/poyezdbilet24_bot')">${ic("send")} ${T("Botni ochish")}</button>
    </div>
    <div class="section-title">${T("Tez kunda")}</div>
    <div class="card soon-list">${soon.map(([i, t]) => `<div>${chip(i, "sm")}<span>${t}</span></div>`).join("")}</div>`;
  }

  const field = (path, label, val, opt = {}) => `<label class="cvf ${opt.cls || ""}"><small>${label}</small>${opt.area
    ? `<textarea data-p="${path}" rows="${opt.rows || 3}" placeholder="${esc(opt.ph || "")}">${esc(val)}</textarea>`
    : `<input data-p="${path}" value="${esc(val)}" placeholder="${esc(opt.ph || "")}" ${opt.type ? `type="${opt.type}" inputmode="${opt.type === "tel" ? "tel" : opt.type === "email" ? "email" : "text"}"` : ""}>`}</label>`;
  const exItems = () => T("Har bir vazifa yoki natijani yangi qatordan yozing. Raqamlar bilan yozing: \"30 dan ortiq mijoz\", \"sotuvni 20% oshirdi\".");

  function CV() {
    const tp = TYPES(), cur = tp.find((t) => t.k === kind) || tp[0];
    return `${navbar(T("CV va rezyume"))}
    <div class="card box cv-diff">
      <h4>${ic("sparkles")} ${T("CV va rezyume farqi")}</h4>
      <div class="cv-two"><span><b>CV</b>${T("To'liq hikoya: barcha ta'lim, ish, sertifikat va yutuqlar. Odatda 1-2 sahifa.")}</span>
      <span><b>${T("Rezyume")}</b>${T("Qisqa reklama: faqat shu ishga kerakli eng muhim tajriba. Har doim 1 sahifa.")}</span></div>
      <p class="st-note">${T("O'zbekistonda ikkalasini ham ko'pincha \"rezyume\" deyishadi. Ish e'lonida qaysi biri so'ralganini tanlang.")}</p>
    </div>
    <div class="section-title">${T("1. Turini tanlang")}</div>
    <div class="cv-types">${tp.map((t) => `<button class="card cv-type ${t.k === kind ? "on" : ""}" onclick="cvKind('${t.k}')">
      ${thumb(t.k)}<b>${t.name}</b><small>${t.d}</small><em onclick="event.stopPropagation();cvSample('${t.k}')">${ic("search")} ${T("Namunani ko'rish")}</em></button>`).join("")}</div>

    <div class="section-title">${T("2. Ma'lumotlaringizni yozing")}</div>
    <div class="card box cv-form" id="cv-form">
      <div class="cv-tools"><button class="btn-ghost" onclick="cvFill()">${ic("sparkles")} ${T("Namuna bilan to'ldirish")}</button><button class="btn-ghost" onclick="cvClear()">${ic("x")} ${T("Tozalash")}</button></div>
      <div class="cvf-lang"><small>${T("Hujjat tili")}</small><div class="seg">${Object.entries(LANGS).map(([k, l]) => `<button class="${k === docLang ? "on" : ""}" onclick="cvLang('${k}')">${l}</button>`).join("")}</div></div>
      <h5>${T("Shaxsiy ma'lumotlar")}</h5>
      ${kind === "photo" ? `<div class="cv-photo"><img src="${esc(cv.photo || SAMPLE_PHOTO)}" alt=""><label class="btn-ghost">${ic("image")} ${cv.photo ? T("Rasmni almashtirish") : T("Rasm qo'shish")}<input type="file" accept="image/*" onchange="cvPhoto(this)" hidden></label>${cv.photo ? `<button class="icon-btn" onclick="cvPhotoDel()" aria-label="x">${ic("x")}</button>` : ""}</div>
      <p class="st-note">${T("Rasm: oq yoki och fonda, yuz aniq ko'rinadigan, rasmiy kiyimda.")}</p>` : ""}
      ${field("name", T("Ism va familiya"), cv.name, { ph: "Aziz Namunov" })}
      ${field("title", T("Lavozim yoki kasb"), cv.title, { ph: T("Masalan: Sotuv menejeri") })}
      <div class="cvf-row">${field("phone", T("Telefon"), cv.phone, { ph: "+998 90 000 00 00", type: "tel" })}${field("email", T("Email"), cv.email, { ph: "namuna@example.com", type: "email" })}</div>
      <div class="cvf-row">${field("city", T("Shahar"), cv.city, { ph: T("Toshkent, O'zbekiston") })}${field("link", T("LinkedIn yoki Telegram"), cv.link, { ph: "linkedin.com/in/..." })}</div>
      ${field("summary", T("O'zingiz haqingizda qisqacha (2-3 gap)"), cv.summary, { area: 1, rows: 3, ph: T("Masalan: 2 yillik tajribaga ega sotuv menejeri, oyiga 50 dan ortiq mijoz bilan ishlaganman.") })}
      ${kind === "cv" ? `<p class="st-note">${T("CV turida bu qism ko'rsatilmaydi, lekin rezyume va rasmli CV uchun kerak bo'ladi.")}</p>` : ""}

      <h5>${T("Ish tajribasi")}</h5><p class="st-note">${T("Eng oxirgi ish joyidan boshlang.")}</p>
      ${cv.exp.map((e, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${cv.exp.length > 1 ? `<button class="icon-btn" onclick="cvDel('exp',${i})" aria-label="x">${ic("x")}</button>` : ""}</div>
        ${field(`exp.${i}.role`, T("Lavozim"), e.role, { ph: T("Masalan: Sotuv menejeri") })}
        <div class="cvf-row">${field(`exp.${i}.org`, T("Kompaniya"), e.org, { ph: "Namuna Group" })}${field(`exp.${i}.city`, T("Shahar"), e.city, { ph: T("Toshkent") })}</div>
        <div class="cvf-row">${field(`exp.${i}.from`, T("Boshlangan"), e.from, { ph: "08/2023" })}${e.now ? `<label class="cvf"><small>${T("Tugagan")}</small><input value="${H[docLang].now}" disabled></label>` : field(`exp.${i}.to`, T("Tugagan"), e.to, { ph: "05/2025" })}</div>
        <label class="cv-check"><input type="checkbox" data-p="exp.${i}.now" ${e.now ? "checked" : ""}> ${T("Hozir shu yerda ishlayman")}</label>
        ${field(`exp.${i}.items`, T("Vazifalar va natijalar"), e.items, { area: 1, rows: 4, ph: exItems() })}</div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('exp')">${ic("up")} ${T("Yana ish joyi qo'shish")}</button>

      <h5>${T("Ta'lim")}</h5>
      ${cv.edu.map((e, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${cv.edu.length > 1 ? `<button class="icon-btn" onclick="cvDel('edu',${i})" aria-label="x">${ic("x")}</button>` : ""}</div>
        ${field(`edu.${i}.org`, T("O'quv muassasasi"), e.org, { ph: T("Masalan: Toshkent davlat iqtisodiyot universiteti") })}
        <div class="cvf-row">${field(`edu.${i}.degree`, T("Yo'nalish va daraja"), e.degree, { ph: T("Iqtisodiyot, bakalavr") })}${field(`edu.${i}.city`, T("Shahar"), e.city, { ph: T("Toshkent") })}</div>
        <div class="cvf-row">${field(`edu.${i}.from`, T("Boshlangan"), e.from, { ph: "09/2019" })}${field(`edu.${i}.to`, T("Tugagan"), e.to, { ph: "07/2023" })}</div>
        ${field(`edu.${i}.items`, T("Yutuqlar (ixtiyoriy)"), e.items, { area: 1, rows: 2, ph: T("Masalan: GPA 4,5 / 5, imtiyozli diplom") })}</div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('edu')">${ic("up")} ${T("Yana ta'lim qo'shish")}</button>

      <h5>${T("Qo'shimcha")}</h5>
      ${field("skills", T("Ko'nikmalar (har biri yangi qatorda)"), cv.skills, { area: 1, rows: 3, ph: T("Tillar: ingliz (B2), rus (B1)\nDasturlar: Excel, Canva") })}
      ${field("certs", T("Sertifikatlar (har biri yangi qatorda)"), cv.certs, { area: 1, rows: 3, ph: T("Masalan: IELTS 7.0, 2025") })}
      ${kind !== "rez" ? field("interests", T("Qiziqishlar (har biri yangi qatorda)"), cv.interests, { area: 1, rows: 2, ph: T("Masalan: Kitob o'qish") }) : ""}
    </div>

    <div class="section-title">${T("3. Natija")}: ${cur.name}</div>
    <div class="cv-live" id="cv-live">${thumb2()}</div>
    <div class="cv-export">
      <button class="btn-primary" onclick="cvExport('pdf')">${ic("download")} PDF</button>
      <button class="btn-primary" onclick="cvExport('docx')">${ic("file")} Word</button>
      <button class="btn-primary" onclick="cvExport('png')">${ic("image")} PNG</button>
    </div>
    <p class="note">${T("Fayl Telegram orqali yuklab olinadi yoki bot bilan chatingizga yuboriladi. Ma'lumotlaringiz faqat shu telefonda saqlanadi.")}</p>`;
  }
  const thumb2 = () => `<div class="cv-thumb big"><div class="cv-scale">${docHTML(cv, kind, docLang)}</div></div>`;
  const refresh = () => { const el = document.getElementById("cv-live"); if (el) el.innerHTML = thumb2(); };

  // the form keeps focus while typing: only the preview below is redrawn
  document.addEventListener("input", (e) => {
    const p = e.target && e.target.dataset && e.target.dataset.p; if (!p || !e.target.closest("#cv-form")) return;
    const keys = p.split("."); let o = cv; while (keys.length > 1) o = o[keys.shift()];
    o[keys[0]] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    save(); clearTimeout(refresh.t); refresh.t = setTimeout(refresh, 250);
    if (e.target.type === "checkbox") render();
  });
  window.cvKind = (k) => { kind = k; save(); haptic("light"); render(); };
  window.cvLang = (l) => { docLang = l; save(); haptic("light"); render(); };
  window.cvAdd = (w) => { cv[w].push(w === "exp" ? { role: "", org: "", city: "", from: "", to: "", now: false, items: "" } : { org: "", degree: "", city: "", from: "", to: "", items: "" }); save(); render(); };
  window.cvDel = (w, i) => { cv[w].splice(i, 1); save(); render(); };
  window.cvFill = () => { const keep = cv.photo; cv = JSON.parse(JSON.stringify(SAMPLE[docLang] || SAMPLE.uz)); cv.photo = keep; save(); haptic("medium"); render(); };
  window.cvClear = async () => { if (!(await confirmAsk(T("Barcha yozganlaringiz o'chiriladi. Davom etasizmi?")))) return; cv = blank(); save(); render(); };
  window.cvPhotoDel = () => { cv.photo = ""; save(); render(); };
  // photo: centre square, 360 px, JPEG (small enough to keep on the phone)
  window.cvPhoto = (input) => {
    const f = input.files && input.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = c.height = 360;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 360, 360);
      cv.photo = c.toDataURL("image/jpeg", 0.85); save(); URL.revokeObjectURL(img.src); render();
    };
    img.src = URL.createObjectURL(f);
  };
  // full-size example in a sheet
  window.cvSample = (k) => {
    haptic("light");
    const t = TYPES().find((x) => x.k === k);
    sheet(`<h3>${T("Namuna")}: ${t.name}</h3><p>${t.d}</p>${thumb(k, docLang, true)}<button class="btn-primary" onclick="closeSheet();cvKind('${k}')">${T("Shu turni tanlash")}</button>`);
  };

  /* ---------- export ---------- */
  const lib = (src, name) => window[name] ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  async function canvasOf() {
    await lib("lib/html2canvas.min.js", "html2canvas");
    const host = document.createElement("div");
    host.className = "cv-render"; host.innerHTML = docHTML(cv, kind, docLang);
    document.body.appendChild(host);
    try { await document.fonts.ready; return await html2canvas(host.firstElementChild, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false }); }
    finally { host.remove(); }
  }
  // A4 pages: cut where a whole pixel row is white, so no line of text is split between pages
  function pages(canvas) {
    const pageH = Math.round(canvas.width * 297 / 210), ctx = canvas.getContext("2d"), out = [];
    let y = 0;
    while (y < canvas.height) {
      let end = Math.min(y + pageH, canvas.height);
      if (end < canvas.height) {
        for (let r = end; r > end - pageH * 0.25; r--) {
          const row = ctx.getImageData(0, r, canvas.width, 1).data; let white = true;
          for (let i = 0; i < row.length; i += 16) if (row[i] < 245 || row[i + 1] < 245 || row[i + 2] < 245) { white = false; break; }
          if (white) { end = r; break; }
        }
      }
      out.push([y, end]); y = end;
    }
    return out;
  }
  async function makePDF() {
    const canvas = await canvasOf();
    await lib("lib/jspdf.umd.min.js", "jspdf");
    const pdf = new jspdf.jsPDF({ unit: "mm", format: "a4" });
    pages(canvas).forEach(([a, b], i) => {
      const part = document.createElement("canvas"); part.width = canvas.width; part.height = b - a;
      part.getContext("2d").drawImage(canvas, 0, a, canvas.width, b - a, 0, 0, canvas.width, b - a);
      if (i) pdf.addPage();
      pdf.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, (b - a) * 210 / canvas.width);
    });
    return pdf.output("blob");
  }
  const makePNG = async () => { const c = await canvasOf(); return new Promise((ok) => c.toBlob(ok, "image/png")); };

  // Word: a real .docx (Office Open XML), built and zipped here
  const xe = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}<w:sz w:val="${o.sz || 21}"/>${o.c ? `<w:color w:val="${o.c}"/>` : ""}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
  const para = (runs, o = {}) => `<w:p><w:pPr>${o.center ? '<w:jc w:val="center"/>' : ""}${o.rule ? '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="111111"/></w:pBdr>' : ""}${o.tab ? '<w:tabs><w:tab w:val="right" w:pos="10200"/></w:tabs>' : ""}${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="220"/>` : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after || 40}"/></w:pPr>${runs}</w:p>`;
  function docxBody(d) {
    const h = H[docLang] || H.uz, out = [];
    if (kind === "photo" && d.photo) out.push(`<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1080000" cy="1080000"/><wp:docPr id="1" name="photo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1080000" cy="1080000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
    out.push(para(run(d.name, { b: 1, sz: 34 }), { center: kind !== "photo", after: 20 }));
    if (d.title && kind !== "cv") out.push(para(run(d.title, { sz: 24, c: "444444" }), { center: kind !== "photo", after: 20 }));
    out.push(para(run([d.phone, d.city, d.email, d.link].filter(Boolean).join("  |  "), { sz: 19 }), { center: kind !== "photo", after: 160 }));
    const heading = (t) => out.push(para(run(t.toUpperCase(), { b: 1, sz: 21 }), { rule: 1, before: 200, after: 80 }));
    const bullets = (s) => lines(s).forEach((x) => out.push(para(run("•  " + x, { sz: 20 }), { ind: 360, after: 30 })));
    const entries = (list, a, b, sub) => list.filter((e) => e[a] || e[sub]).forEach((e) => {
      out.push(para(run(e[a], { b: 1 }) + (e[b] ? run(", " + e[b]) : "") + `<w:r><w:tab/></w:r>` + run(dates(e, h), { sz: 19 }), { tab: 1, before: 100, after: 10 }));
      if (e[sub]) out.push(para(run(e[sub], { i: 1 }), { after: 30 }));
      bullets(e.items);
    });
    const summary = () => { if (d.summary && kind !== "cv") { heading(h.summary); out.push(para(run(d.summary, { sz: 20 }), { after: 40 })); } };
    const order = kind === "rez" ? ["summary", "exp", "skills", "edu", "certs"] : kind === "photo" ? ["summary", "exp", "edu", "certs", "skills", "interests"] : ["edu", "exp", "certs", "skills", "interests"];
    for (const k of order) {
      if (k === "summary") summary();
      if (k === "exp" && d.exp.some((e) => e.role || e.org)) { heading(h.exp); entries(d.exp, "org", "city", "role"); }
      if (k === "edu" && d.edu.some((e) => e.org || e.degree)) { heading(h.edu); entries(d.edu, "org", "city", "degree"); }
      if (["certs", "skills", "interests"].includes(k) && lines(d[k]).length) { heading(h[k]); bullets(d[k]); }
    }
    return out.join("");
  }
  async function makeDOCX() {
    const photo = kind === "photo" && cv.photo ? Uint8Array.from(atob(cv.photo.split(",")[1]), (c) => c.charCodeAt(0)) : null;
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${docxBody(cv)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const files = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`],
      ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${photo ? '<Relationship Id="rPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.jpg"/>' : ""}</Relationships>`],
      ["word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="21"/><w:lang w:val="${docLang}"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`],
      ["word/document.xml", doc],
    ];
    if (photo) files.push(["word/media/photo.jpg", photo]);
    return new Blob([zip(files)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  // a minimal ZIP writer (stored, no compression) with CRC-32
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const [name, data] of files) {
      const nb = enc.encode(name), db = typeof data === "string" ? enc.encode(data) : data, crc = crc32(db);
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, db.length, 4], [22, db.length, 4], [26, nb.length, 2], [28, 0, 2]].forEach(([o, v, s]) => s === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true));
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4], [20, db.length, 4], [24, db.length, 4], [28, nb.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]].forEach(([o, v, s]) => s === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true));
      parts.push(new Uint8Array(lh.buffer), nb, db); central.push(new Uint8Array(ch.buffer), nb);
      off += 30 + nb.length + db.length;
    }
    const size = central.reduce((a, b) => a + b.length, 0), end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, off, 4], [20, 0, 2]].forEach(([o, v, s]) => s === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true));
    const all = [...parts, ...central, new Uint8Array(end.buffer)], out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
    let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  const fileName = () => (cv.name || "CV").trim().replace(/\s+/g, "_") + "_" + { cv: "CV", rez: T("Rezyume"), photo: "CV" }[kind];
  window.cvExport = (ext) => {
    if (!cv.name.trim()) { toast(T("Avval ismingizni yozing")); document.querySelector('[data-p="name"]')?.focus(); return; }
    haptic("light");
    sheet(`<h3>${ext === "docx" ? "Word" : ext.toUpperCase()}</h3><p>${T("Faylni qanday olmoqchisiz?")}</p>
      <button class="btn-primary" onclick="cvDeliver('${ext}','dl')">${ic("download")} ${T("Telefonga yuklab olish")}</button>
      <button class="btn-ghost" onclick="cvDeliver('${ext}','chat')">${ic("send")} ${T("Telegram chatga yuborish va ulashish")}</button>`);
  };
  window.cvDeliver = async (ext, mode) => {
    closeSheet();
    const busy = document.createElement("div"); busy.className = "busy"; busy.innerHTML = `<div class="run-spin"></div><p>${T("Fayl tayyorlanmoqda…")}</p>`; document.body.appendChild(busy);
    try {
      const blob = ext === "pdf" ? await makePDF() : ext === "png" ? await makePNG() : await makeDOCX();
      const name = fileName();
      // outside Telegram (browser preview): a normal download
      if (!tg || !tg.initData) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name + "." + ext; a.click(); return; }
      const q = `t=${ext}&n=${encodeURIComponent(name)}&c=${encodeURIComponent(T("Ustoz AI mini ilovasida tayyorlandi"))}`;
      if (mode === "dl" && tg.downloadFile) {
        const r = await (await fetch(SHARE_API + "/file?m=dl&" + q, { method: "POST", headers: { "X-Init-Data": tg.initData }, body: blob })).json();
        if (!r.url) throw new Error(r.error || "server");
        tg.downloadFile({ url: r.url, file_name: r.name });
      } else {
        const r = await (await fetch(SHARE_API + "/file?" + q, { method: "POST", headers: { "X-Init-Data": tg.initData }, body: blob })).json();
        if (!r.ok) throw new Error(r.error || "server");
        try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
        if (r.id && tg.shareMessage) tg.shareMessage(r.id); else toast(T("Fayl bot bilan chatingizga yuborildi"));
      }
      track("#/cv");
    } catch (e) { toast(T("Fayl tayyorlanmadi: {e}", { e: e.message || e })); }
    finally { busy.remove(); }
  };
  // _test: used by tools/test_cv.js to check the Word file outside the browser
  return { Screen, CV, _test: { makeDOCX, use: (d, k, l) => { cv = d; kind = k; docLang = l; }, SAMPLE } };
})();

/* ---------- example pictures: the real A4 document scaled to the card width ---------- */
function fitThumbs() {
  document.querySelectorAll(".cv-thumb").forEach((t) => {
    const w = t.clientWidth; if (!w) return;
    const s = w / 794; t.style.setProperty("--s", s);
    if (t.classList.contains("big")) { const d = t.firstElementChild && t.firstElementChild.firstElementChild; if (d) t.style.height = Math.ceil(d.offsetHeight * s) + "px"; }
  });
}
new MutationObserver(() => { clearTimeout(fitThumbs.t); fitThumbs.t = setTimeout(fitThumbs, 20); }).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("resize", fitThumbs);

/* ---------- a bottom sheet for small choices ---------- */
function sheet(html) {
  closeSheet();
  const el = document.createElement("div"); el.className = "sheet-wrap"; el.id = "sheet";
  el.innerHTML = `<div class="sheet" onclick="event.stopPropagation()"><i class="sheet-grip"></i>${html}</div>`;
  el.onclick = closeSheet; document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("on"));
}
window.closeSheet = () => { const el = document.getElementById("sheet"); if (el) { el.classList.remove("on"); setTimeout(() => el.remove(), 250); } };
window.openTg = (u) => { haptic("light"); if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank"); };
