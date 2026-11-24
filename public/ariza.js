// "Ariza topshirish": the application hub.
// 1) The official application platforms (Common App, UCAS, EducationUSA, DAAD, Kaplan Pathways): what each is for,
//    the steps, and a button that opens the platform's own site, where the student signs up and applies.
//    Their sign-in pages are never copied or embedded here: the password is typed only on the official site.
// 2) "Mening arizalarim": the student's own application tracker. The Telegram account is the sign-in (no password);
//    each university has its platform, deadline, status and a document checklist. Kept on the phone (store "apps").
const Ariza = (() => {
  const PLAT = () => ({
    commonapp: { name: "Common App", sub: T("AQSh universitetlariga ariza topshirish"), url: "https://www.commonapp.org/", btn: T("Platformaga kirish"), logo: ["common", "app"], cls: "ca",
      d: [T("1 000 dan ortiq kollej va universitetga bitta umumiy ariza bilan topshirish platformasi. Asosan AQSh universitetlari, shuningdek boshqa davlatlardagi ayrim universitetlar ham qabul qiladi."),
        T("Hisob ochish bepul. Har bir universitet o'z ariza to'lovini belgilaydi, ayrimlarida ariza bepul; to'lovni to'lay olmaydigan talabalar to'lovdan ozod qilishni (fee waiver) so'rashi mumkin.")],
      steps: [T("commonapp.org saytida hisob oching"), T("Profil, ta'lim, baholar va test natijalarini to'ldiring"), T("Asosiy inshoni yozing (650 so'zgacha)"), T("Maktab maslahatchisi va o'qituvchilardan tavsiyanoma so'rang"), T("Universitetlarni tanlab, har biriga alohida topshiring")],
      when: T("Erta muddatlar (Early Decision, Early Action) ko'pincha 1-noyabr, asosiy muddat (Regular Decision) ko'pincha yanvar boshida. Har bir universitet muddatini saytidan tekshiring.") },
    ucas: { name: "UCAS", sub: T("Buyuk Britaniya universitetlari"), url: "https://www.ucas.com/", btn: T("Platformaga kirish"), logo: ["UCAS"], cls: "uc",
      d: [T("Buyuk Britaniya universitetlarining bakalavriatiga yagona ariza tizimi. Bitta arizada 5 tagacha kurs tanlanadi."),
        T("Shaxsiy bayonot (personal statement) uchta savolga javob shaklida yoziladi. Ariza uchun to'lov bor; miqdorini ucas.com saytidan tekshiring.")],
      steps: [T("ucas.com saytida ro'yxatdan o'ting"), T("5 tagacha kursni tanlang"), T("Shaxsiy bayonotni yozing"), T("O'qituvchingizdan tavsiyanoma (reference) oling"), T("To'lovni qilib, arizani yuboring")],
      when: T("Oksford, Kembrij, tibbiyot va stomatologiya: odatda 15-oktabr. Boshqa ko'p kurslar: yanvar oxiri.") },
    educationusa: { name: "EducationUSA", sub: T("AQShda o'qish va stipendiyalar bo'yicha rasmiy maslahatlar"), url: "https://educationusa.state.gov/", btn: T("Rasmiy sayt"), logo: ["Education", "USA"], cls: "eu",
      d: [T("AQSh Davlat departamentining xalqaro maslahat tarmog'i. Universitet tanlash, hujjatlar, testlar va moliyaviy yordam bo'yicha bepul maslahat va vebinarlar beradi."),
        T("Iqtidorli, ammo moliyaviy imkoniyati cheklangan talabalar uchun Opportunity Funds dasturi ham bor.")],
      steps: [T("Saytdan eng yaqin maslahat markazini toping"), T("Bepul vebinar va uchrashuvlarga yoziling"), T("Universitetlar ro'yxatingizni maslahatchi bilan tuzing")],
      when: T("Tayyorgarlikni topshirishdan 12-18 oy oldin boshlash tavsiya etiladi.") },
    daad: { name: "DAAD", sub: T("Germaniyada ta'lim imkoniyatlari"), url: "https://www.daad.de/en/", btn: T("Rasmiy sayt"), logo: ["DAAD"], cls: "da",
      d: [T("Germaniya akademik almashinuv xizmati: Germaniyadagi dasturlar va stipendiyalarning rasmiy bazasi."),
        T("Germaniyaning davlat universitetlarida o'qish asosan bepul yoki juda arzon (Baden-Vyurtemberg bundan mustasno). Ko'p universitetlarga ariza uni-assist.de orqali yoki to'g'ridan-to'g'ri universitetga topshiriladi.")],
      steps: [T("DAAD bazasidan dastur va stipendiyalarni qidiring"), T("Til talabini tekshiring: nemis yoki ingliz tili"), T("uni-assist yoki universitet sayti orqali topshiring")],
      when: T("Qishki semestr uchun ko'pincha 15-iyul, yozgi semestr uchun 15-yanvar. DAAD stipendiyalari muddati alohida.") },
    kaplan: { name: "Kaplan Pathways", sub: T("Hamkor universitetlarga hujjat topshirish"), url: "https://www.kaplanpathways.com/", btn: T("Rasmiy sayt"), logo: ["KAPLAN"], cls: "kp",
      d: [T("Tayyorlov (foundation) va o'tish (pathway) dasturlari: hamkor universitetlarga to'g'ridan-to'g'ri kirishga ballingiz yetmasa, avval tayyorlov yilini o'qib, keyin universitetga o'tasiz."),
        T("Buyuk Britaniya, AQSh, Avstraliya va boshqa davlatlardagi hamkor universitetlar bilan ishlaydi.")],
      steps: [T("Dastur va hamkor universitetni tanlang"), T("Onlayn ariza va hujjatlarni yuboring"), T("Qabul xatini olib, viza jarayonini boshlang")],
      when: T("Bir yilda bir necha marta qabul bo'ladi; muddatlarni saytdan tekshiring.") },
    direct: { name: T("Universitet sayti"), sub: T("To'g'ridan-to'g'ri universitetga"), url: "", btn: "", logo: ["UNI"], cls: "di", d: [], steps: [], when: "" },
  });
  const MAIN = ["commonapp", "ucas", "educationusa", "daad", "kaplan"];
  const STATUS = () => [["plan", T("Rejada")], ["prep", T("Tayyorlanmoqda")], ["sent", T("Topshirildi")], ["ok", T("Qabul qilindi")], ["wait", T("Kutish ro'yxati")], ["no", T("Rad etildi")]];
  const DOCS = () => ({
    commonapp: [["essay", T("Asosiy insho (Personal essay)")], ["supp", T("Qo'shimcha insholar")], ["rec", T("2 ta o'qituvchi tavsiyanomasi")], ["school", T("Maktab hisoboti va transkript")], ["eng", T("Ingliz tili natijasi")], ["sat", T("SAT natijasi (ixtiyoriy)")], ["fee", T("Ariza to'lovi yoki fee waiver")]],
    ucas: [["ps", T("Shaxsiy bayonot (Personal statement)")], ["ref", T("Tavsiyanoma (Reference)")], ["grades", T("Transkript va kutilayotgan baholar")], ["eng", T("Ingliz tili natijasi")], ["fee", T("UCAS to'lovi")]],
    other: [["mot", T("Motivatsion xat")], ["rec", T("Tavsiyanoma")], ["tr", T("Transkript yoki attestat")], ["eng", T("Ingliz tili natijasi")], ["pass", T("Pasport nusxasi")], ["cv", T("CV")]],
  });
  const docsOf = (a) => DOCS()[a.plat === "commonapp" || a.plat === "ucas" ? a.plat : "other"];
  const list = () => store.get("apps", []);
  const save = (l) => store.set("apps", l);
  const logo = (p) => `<span class="ap-logo ${p.cls}">${p.logo.map((t) => `<b>${t}</b>`).join("")}</span>`;
  const daysLeft = (d) => { if (!d) return null; const t = new Date(d + "T23:59:59"); return Math.ceil((t - Date.now()) / 864e5); };

  function AppsTab() {
    const P = PLAT(), apps = list();
    return `<div class="section-title">${T("Mening arizalarim")}<small>${apps.length}</small></div>
    ${apps.length ? apps.map(appCard).join("") : `<div class="card ap-empty">${chip("cap", "lg")}<p>${T("Hali ariza qo'shilmagan. Universitet qo'shing yoki Top 300 ro'yxatidan sizga mos universitetlarni toping.")}</p>
      <button class="btn-ghost" onclick="location.hash='#/unis'">${ic("target")} ${T("Top 300 universitet")}</button></div>`}
    <button class="btn-primary ap-add" onclick="apNew()">${ic("plus")} ${T("Universitet qo'shish")}</button>
    <div class="section-title">${T("Ariza platformalari")}</div>
    <div class="card ap-plats">${MAIN.map((k) => { const p = P[k]; return `<button class="ap-plat" onclick="apPlat('${k}')">${logo(p)}
      <span><b>${p.name}</b><small>${p.sub}</small><u>${p.btn} ${ic("ext", "ap-arrow")}</u></span></button>`; }).join("")}</div>
    <div class="card ap-safe">${ic("shield")}<p>${T("Ro'yxatdan o'tish va ariza topshirish platformaning rasmiy saytida bo'ladi. Parolingizni faqat rasmiy saytga kiriting: Ustoz AI parol so'ramaydi.")}</p></div>
    <div class="section-title">${T("Tayyorgarlik uchun")}</div>
    <div class="ap-more">
      <a href="#/cv">${chip("file", "sm")}<span>${T("CV va rezyume")}</span></a>
      <a href="#/ielts">${chip("globe", "sm")}<span>${T("IELTS ball kalkulyatori")}</span></a>
      <a href="#/unis">${chip("coin", "sm")}<span>${T("Grant va sertifikatlar")}</span></a>
    </div>`;
  }
  function appCard(a) {
    const P = PLAT(), p = P[a.plat] || P.direct, docs = docsOf(a), done = docs.filter(([k]) => a.docs && a.docs[k]).length;
    const left = daysLeft(a.deadline), st = STATUS().find(([k]) => k === a.status) || STATUS()[0];
    return `<details class="card ap-app st-${a.status}" id="ap-${a.id}"><summary>
      <span class="ap-top"><b class="notr">${esc(a.name)}</b><i class="ap-st">${st[1]}</i></span>
      <small>${esc(p.name)}${a.country ? " · " + esc(cnUz(a.country)) : ""}${left != null ? ` · <em class="${left < 0 ? "late" : left <= 14 ? "soon" : ""}">${left < 0 ? T("Muddat o'tgan") : left === 0 ? T("Bugun oxirgi kun") : T("{n} kun qoldi", { n: left })}</em>` : ""}</small>
      <span class="ap-prog"><i style="width:${Math.round(done / docs.length * 100)}%"></i></span><small class="ap-pn">${T("Hujjatlar: {a} / {b}", { a: done, b: docs.length })}</small></summary>
      <div class="ap-body">
        <label>${T("Holati")}<select onchange="apSet(${a.id},'status',this.value)">${STATUS().map(([k, t]) => `<option value="${k}" ${k === a.status ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>${T("Topshirish muddati")}<input type="date" value="${esc(a.deadline || "")}" onchange="apSet(${a.id},'deadline',this.value)"></label>
        <div class="ap-docs">${docs.map(([k, t]) => `<button class="${a.docs && a.docs[k] ? "on" : ""}" onclick="apDoc(${a.id},'${k}')">${ic("check")}<span>${t}</span></button>`).join("")}</div>
        <div class="ap-btns">${p.url ? `<button class="btn-primary" onclick="openExt('${encodeURIComponent(p.url)}')">${ic("globe")} ${p.name}</button>` : a.site ? `<button class="btn-primary" onclick="openExt('${encodeURIComponent(a.site)}')">${ic("ext")} ${T("Rasmiy sayt")}</button>` : ""}
          <button class="btn-ghost" onclick="apDel(${a.id})">${ic("x")} ${T("O'chirish")}</button></div>
      </div></details>`;
  }
  window.apPlat = (k) => {
    const p = PLAT()[k]; haptic("light");
    sheet(`<div class="ap-sheet">${logo(p)}<h3>${p.name}</h3><p class="ap-sub">${p.sub}</p>
      ${p.d.map((t) => `<p>${t}</p>`).join("")}
      <h4>${T("Qadamlar")}</h4><ol>${p.steps.map((t) => `<li>${t}</li>`).join("")}</ol>
      ${p.when ? `<div class="ap-when">${ic("clock")}<span>${p.when}</span></div>` : ""}
      <button class="btn-primary" onclick="openExt('${encodeURIComponent(p.url)}')">${ic("globe")} ${p.btn}</button>
      <p class="note">${T("Sayt Telegram ichidagi brauzerda ochiladi. Ro'yxatdan o'tganingizdan keyin bu yerga qaytib, arizangizni kuzatib boring.")}</p></div>`);
  };
  // a new application: a university from the Top 300 list (search) or any other one typed in
  let top = null;
  window.apNew = () => {
    haptic("light");
    if (!top) fetch("top300.json").then((r) => r.json()).then((d) => { top = d.rows; const q = document.getElementById("ap-q"); if (q) apFind(q.value); }).catch(() => {});
    sheet(`<div class="ap-sheet ap-new"><h3>${T("Universitet qo'shish")}</h3>
      <label class="km-search">${ic("search")}<input id="ap-q" placeholder="${T("Universitet nomi")}" autocomplete="off" oninput="apFind(this.value)"></label>
      <div id="ap-found"></div>
      <label>${T("Ariza platformasi")}<select id="ap-plat">${Object.entries(PLAT()).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join("")}</select></label>
      <label>${T("Topshirish muddati")}<input type="date" id="ap-dl"></label>
      <button class="btn-primary" onclick="apSaveNew()">${ic("check")} ${T("Saqlash")}</button></div>`);
    setTimeout(() => { const q = document.getElementById("ap-q"); if (q) q.focus(); }, 300);
  };
  let picked = null;
  window.apFind = (v) => {
    const box = document.getElementById("ap-found"); if (!box) return; picked = null;
    const q = v.trim().toLowerCase(); if (!q || !top) { box.innerHTML = ""; return; }
    const hits = top.map((r, i) => [r, i]).filter(([r]) => r[1].toLowerCase().includes(q)).slice(0, 5);
    box.innerHTML = hits.map(([r, i]) => `<button class="ap-hit" onclick="apPick(${i})"><span class="sd-rank">${esc(r[0])}</span><span class="notr">${esc(r[1])}</span></button>`).join("");
  };
  window.apPick = (i) => {
    const r = top[i]; picked = r; document.getElementById("ap-q").value = r[1]; document.getElementById("ap-found").innerHTML = "";
    document.getElementById("ap-plat").value = guessPlat(r[2]); haptic("light");
  };
  window.apSaveNew = () => {
    const name = document.getElementById("ap-q").value.trim(); if (!name) return toast(T("Universitet nomini kiriting"));
    const r = picked && picked[1] === name ? picked : null;
    appsAdd({ name, country: r ? r[2] : "", site: r ? r[14] : "", plat: document.getElementById("ap-plat").value, deadline: document.getElementById("ap-dl").value });
    closeSheet(); render();
  };
  const upd = (id, f) => { const l = list(), a = l.find((x) => x.id === id); if (a) { f(a); save(l); } };
  window.apSet = (id, k, v) => { upd(id, (a) => { a[k] = v; }); haptic("light"); keepOpen(id); };
  window.apDoc = (id, k) => { upd(id, (a) => { a.docs = a.docs || {}; a.docs[k] = !a.docs[k]; }); haptic("light"); keepOpen(id); };
  window.apDel = (id) => confirmAsk(T("Bu arizani o'chirasizmi?"), T("O'chirish")).then((ok) => { if (!ok) return; save(list().filter((x) => x.id !== id)); render(); });
  const keepOpen = (id) => { const y = scrollY; render(); const d = document.getElementById("ap-" + id); if (d) d.open = true; scrollTo(0, y); };
  /* ================= Application Studio =================
     Everything is prepared here, once, in the same fields and order as the official forms (Common App, UCAS);
     the last step, on the official site, is then "Copy & next": one tap copies a field and moves to the next.
     Kept on the phone in store "studio". Answers are written in English, as the forms need them. */
  const S = Object.assign({ p: {}, acts: [], hon: [], ca: { prompt: 0, text: "" }, uc: ["", "", ""], sup: [], recs: [] }, store.get("studio", {}));
  const saveS = () => store.set("studio", S);
  let tab = store.get("studio_tab", "prof");
  const setPath = (path, v) => { const k = path.split("."); let o = S; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = v; };
  const getPath = (path) => path.split(".").reduce((o, k) => (o == null ? "" : o[k]), S) ?? "";
  const words = (t) => (String(t || "").trim().match(/\S+/g) || []).length;

  const PERS = () => [["first", T("Ism"), "First / given name"], ["last", T("Familiya"), "Last / family name"], ["birth", T("Tug'ilgan sana"), "Date of birth", "date"],
    ["email", "Email", "Email address", "email"], ["phone", T("Telefon"), "Phone number", "tel"], ["city", T("Shahar"), "City"], ["citizen", T("Fuqarolik"), "Citizenship"]];
  const EDU = () => [["school", T("Maktab nomi"), "Current school"], ["scity", T("Maktab shahri"), "School city"], ["grad", T("Bitirish yili"), "Graduation year", "number"],
    ["gpa", T("O'rtacha baho (5 ballik)"), "GPA (5-point scale)"], ["courses", T("Hozirgi fanlar"), "Current year courses", "area"]];
  const TESTS = () => [["ielts", T("IELTS umumiy ball"), "IELTS overall band"], ["ieltsd", T("IELTS sanasi"), "IELTS test date", "date"], ["sat", T("SAT umumiy ball"), "SAT total score", "number"],
    ["satd", T("SAT sanasi"), "SAT test date", "date"], ["toefl", "TOEFL iBT", "TOEFL iBT total", "number"], ["det", "Duolingo", "Duolingo English Test score", "number"]];
  const ACT_TYPES = ["Academic", "Art", "Athletics: Club", "Athletics: JV/Varsity", "Career-Oriented", "Community Service (Volunteer)", "Computer/Technology", "Debate/Speech", "Foreign Language", "Journalism/Publication", "Music: Instrumental", "Music: Vocal", "Research", "Robotics", "Science/Math", "Student Government/Politics", "Work (Paid)", "Other Club/Activity"];
  const HON_LEVELS = ["School", "State/Regional", "National", "International"];
  const CA_PROMPTS = [
    "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
    "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
    "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
    "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design."];
  // short names for the 7 Common App prompts: an icon, a clear title, the official theme in English
  const CA_SHORT = () => [["user", T("Kimligingiz va hikoyangiz"), "Background, identity, interest or talent"],
    ["trend", T("Qiyinchilik va undan olingan saboq"), "Challenge, setback or failure"],
    ["chat", T("Bir g'oyaga qarshi chiqqan payt"), "Questioning a belief or idea"],
    ["heart", T("Kutilmagan minnatdorlik"), "Gratitude that surprised you"],
    ["star", T("O'sish va o'zingizni kashf etish"), "Personal growth and new understanding"],
    ["book", T("Vaqtni unuttiradigan mavzu"), "A topic that makes you lose track of time"],
    ["pen", T("Erkin mavzu"), "Any topic of your choice"]];
  window.stPrompt = (i) => { S.ca.prompt = String(i); saveS(); haptic("light"); keepY(); };
  const UC_Q = ["Why do you want to study this course or subject?", "How have your qualifications and studies helped you to prepare for this course or subject?", "What else have you done to prepare outside of education, and why are these experiences useful?"];

  const field = (path, label, en, type = "text", max) => {
    const v = esc(getPath(path)), lim = max ? ` maxlength="${max}"` : "";
    const cnt = max ? `<em data-cnt="${path}" data-max="${max}">${String(getPath(path)).length}/${max}</em>` : "";
    return `<label class="st-f"><span>${label}<small>${en}</small>${cnt}</span>${type === "area"
      ? `<textarea data-sk="${path}" rows="3"${lim}>${v}</textarea>` : `<input data-sk="${path}" type="${type}" value="${v}"${lim} autocomplete="off">`}</label>`;
  };
  const group = (title, list, base) => `<div class="card st-card"><h4>${title}</h4>${list.map(([k, l, en, t]) => field(base + "." + k, l, en, t)).join("")}</div>`;

  function ProfTab() {
    // a calm, friendly note: how to fill the form and what Application Studio is for
    return `<div class="sn-note"><b>${T("Application Studio sizga qanday yordam beradi")}</b>
      <ul><li>${T("Ma'lumotlarni ingliz tilida, pasportingizdagidek yozing.")}</li>
      <li>${T("Kiritganlaringiz avtomatik saqlanadi: ilovadan chiqib ketsangiz ham yo'qolmaydi.")}</li>
      <li>${T("Application Studio hujjatlarni topshirguningizcha yoningizda: ma'lumotlaringizni shu yerda jamlang, tekshiring va to'g'rilang, so'ng nusxa olib Common App yoki UCAS'ga joylashtiring.")}</li></ul></div>
    ${group(T("Shaxsiy ma'lumotlar"), PERS(), "p")}${group(T("Ta'lim"), EDU(), "p")}${group(T("Testlar"), TESTS(), "p")}
    <div class="card st-card"><h4>${T("Faoliyatlar")}<small>${S.acts.length} / 10</small></h4>
      ${S.acts.map((a, i) => `<div class="st-item"><div class="st-ih"><b>${T("Faoliyat {n}", { n: i + 1 })}</b><button class="icon-btn" onclick="stDel('acts',${i})" aria-label="x">${ic("x")}</button></div>
        <label class="st-f"><span>${T("Turi")}<small>Activity type</small></span><select data-sk="acts.${i}.type">${ACT_TYPES.map((t) => `<option ${a.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        ${field(`acts.${i}.pos`, T("Lavozim yoki rol"), "Position/Leadership description", "text", 50)}
        ${field(`acts.${i}.org`, T("Tashkilot nomi"), "Organization name", "text", 100)}
        ${field(`acts.${i}.desc`, T("Nima qildingiz va natijasi"), "Description (accomplishments, recognition)", "area", 150)}
        <div class="st-3">${field(`acts.${i}.grades`, T("Sinflar"), "Grade levels")}${field(`acts.${i}.hrs`, T("Soat/hafta"), "Hours per week", "number")}${field(`acts.${i}.wks`, T("Hafta/yil"), "Weeks per year", "number")}</div></div>`).join("")}
      ${S.acts.length < 10 ? `<button class="btn-ghost" onclick="stAdd('acts')">${ic("plus")} ${T("Faoliyat qo'shish")}</button>` : ""}</div>
    <div class="card st-card"><h4>${T("Mukofotlar")}<small>${S.hon.length} / 5</small></h4>
      ${S.hon.map((h, i) => `<div class="st-item"><div class="st-ih"><b>${T("Mukofot {n}", { n: i + 1 })}</b><button class="icon-btn" onclick="stDel('hon',${i})" aria-label="x">${ic("x")}</button></div>
        ${field(`hon.${i}.title`, T("Mukofot nomi"), "Honor title", "text", 100)}
        <label class="st-f"><span>${T("Darajasi")}<small>Level of recognition</small></span><select data-sk="hon.${i}.level">${HON_LEVELS.map((t) => `<option ${h.level === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        ${field(`hon.${i}.grades`, T("Sinflar"), "Grade levels")}</div>`).join("")}
      ${S.hon.length < 5 ? `<button class="btn-ghost" onclick="stAdd('hon')">${ic("plus")} ${T("Mukofot qo'shish")}</button>` : ""}</div>`;
  }

  const caCount = () => { const w = words(S.ca.text); return `<em class="${w > 650 ? "over" : w >= 250 ? "ok" : ""}">${T("{n} so'z", { n: w })} · 250-650</em>`; };
  const ucTotal = () => S.uc.reduce((n, t) => n + String(t || "").length, 0);
  const ucCount = () => { const n = ucTotal(); return `<em class="${n > 4000 ? "over" : S.uc.every((t) => String(t || "").length >= 350) ? "ok" : ""}">${T("{n} belgi", { n: fmtN(n) })} / 4 000</em>`; };
  function EssayTab() {
    return `<div class="card st-card"><h4>Common App · Personal essay</h4>
      <p class="st-pick-h">${T("Mavzuni tanlang")}<small>${T("7 ta rasmiy savoldan biri")}</small></p>
      <div class="st-prompts">${CA_PROMPTS.map((p, i) => { const on = (+S.ca.prompt || 0) === i, [ico, uz, en] = CA_SHORT()[i];
        return `<button class="st-pr ${on ? "on" : ""}" onclick="stPrompt(${i})"><i>${ic(ico)}</i><span><b>${uz}</b><small>${en}</small>${on ? `<em class="notr">${esc(p)}</em>` : ""}</span><s>${i + 1}</s></button>`; }).join("")}</div>
      <textarea class="st-essay" data-sk="ca.text" rows="12" placeholder="${T("Inshoingizni shu yerda yozing…")}">${esc(S.ca.text)}</textarea>
      <div class="st-count" id="st-ca">${caCount()}</div></div>
    <div class="card st-card"><h4>UCAS · Personal statement</h4>
      <p class="sn-note">${T("Uchta savol, har biriga kamida 350 belgi, jami 4 000 belgigacha.")}</p>
      ${UC_Q.map((q, i) => `<label class="st-f"><span class="notr">${i + 1}. ${esc(q)}<em data-cnt="uc.${i}">${String(S.uc[i] || "").length}</em></span><textarea data-sk="uc.${i}" rows="6">${esc(S.uc[i] || "")}</textarea></label>`).join("")}
      <div class="st-count" id="st-uc">${ucCount()}</div></div>
    <div class="card st-card"><h4>${T("Universitet insholari")}<small>Supplements</small></h4>
      ${S.sup.map((x, i) => `<div class="st-item"><div class="st-ih"><b>${T("Insho {n}", { n: i + 1 })}</b><button class="icon-btn" onclick="stDel('sup',${i})" aria-label="x">${ic("x")}</button></div>
        ${field(`sup.${i}.uni`, T("Universitet"), "University")}${field(`sup.${i}.q`, T("Savol"), "Question", "area")}
        <label class="st-f"><span>${T("Javob")}<small>Answer</small><em data-cnt="sup.${i}.text" data-words="1">${T("{n} so'z", { n: words(x.text) })}</em></span><textarea data-sk="sup.${i}.text" rows="6">${esc(x.text || "")}</textarea></label></div>`).join("")}
      <button class="btn-ghost" onclick="stAdd('sup')">${ic("plus")} ${T("Insho qo'shish")}</button></div>`;
  }

  const REC_ST = () => [["no", T("So'ralmagan")], ["asked", T("So'raldi")], ["yes", T("Rozi bo'ldi")], ["done", T("Yuklandi")]];
  function RecTab() {
    return `<p class="st-tip">${ic("users")}${T("Common App'da 1 ta maslahatchi (odatda direktor o'rinbosari yoki sinf rahbari) va 2 ta o'qituvchi tavsiyanomasi kerak. Ularning emailini Common App'ga kiritasiz, ular taklifnoma oladi va tavsiyanomani o'zlari yuklaydi.")}</p>
    ${S.recs.map((r, i) => `<div class="card st-card st-rec ${r.st || "no"}"><div class="st-ih"><b>${esc(r.name) || T("Tavsiyachi {n}", { n: i + 1 })}</b><button class="icon-btn" onclick="stDel('recs',${i})" aria-label="x">${ic("x")}</button></div>
      ${field(`recs.${i}.name`, T("Ismi"), "Name")}
      <div class="st-3 two">${(() => `<label class="st-f"><span>${T("Kim")}<small>Role</small></span><select data-sk="recs.${i}.role">${[["teacher", T("O'qituvchi")], ["counselor", T("Maslahatchi")], ["other", T("Boshqa")]].map(([k, t]) => `<option value="${k}" ${r.role === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>`)()}${field(`recs.${i}.subj`, T("Fan"), "Subject")}</div>
      ${field(`recs.${i}.email`, "Email", "Email for the invitation", "email")}
      <div class="st-steps">${REC_ST().map(([k, t]) => `<button class="${(r.st || "no") === k ? "on" : ""}" onclick="stRecSt(${i},'${k}')">${t}</button>`).join("")}</div>
      <button class="btn-primary" onclick="stAsk(${i})">${ic("send")} ${T("Telegramda so'rash")}</button></div>`).join("")}
    ${S.recs.length < 6 ? `<button class="btn-ghost" onclick="stAdd('recs')">${ic("plus")} ${T("Tavsiyachi qo'shish")}</button>` : ""}`;
  }

  /* ---------- the final step: Copy & next ---------- */
  const sub = { plat: store.get("studio_plat", "commonapp"), cur: 0, done: {} };
  function items(plat) {
    const p = S.p, L = [], add = (sec, label, v) => { if (String(v ?? "").trim()) L.push({ sec, label, v: String(v).trim() }); };
    const sec1 = "Profile", sec2 = "Education", sec3 = "Testing";
    PERS().forEach(([k, , en]) => add(sec1, en, p[k]));
    EDU().forEach(([k, , en]) => add(sec2, en, p[k]));
    TESTS().forEach(([k, , en]) => add(sec3, en, p[k]));
    if (plat === "commonapp") {
      S.acts.forEach((a, i) => { const s = "Activities"; add(s, `#${i + 1} Activity type`, a.type); add(s, `#${i + 1} Position`, a.pos); add(s, `#${i + 1} Organization`, a.org); add(s, `#${i + 1} Description`, a.desc); add(s, `#${i + 1} Grade levels`, a.grades); add(s, `#${i + 1} Hours per week`, a.hrs); add(s, `#${i + 1} Weeks per year`, a.wks); });
      S.hon.forEach((h, i) => { add("Honors", `#${i + 1} Honor title`, h.title); add("Honors", `#${i + 1} Level`, h.level); add("Honors", `#${i + 1} Grade levels`, h.grades); });
      add("Writing", "Personal essay", S.ca.text);
      S.sup.forEach((x) => add("Supplements", `${x.uni || "University"}: ${String(x.q || "").slice(0, 50)}`, x.text));
    } else {
      S.uc.forEach((t, i) => add("Personal statement", `Question ${i + 1}`, t));
    }
    return L;
  }
  function missing(plat) {
    const m = [], p = S.p;
    [["first", T("Ism")], ["last", T("Familiya")], ["birth", T("Tug'ilgan sana")], ["email", "Email"], ["school", T("Maktab nomi")], ["grad", T("Bitirish yili")]].forEach(([k, t]) => { if (!String(p[k] || "").trim()) m.push(t); });
    if (plat === "commonapp") {
      const w = words(S.ca.text); if (w < 250) m.push(T("Insho kamida 250 so'z")); if (w > 650) m.push(T("Insho 650 so'zdan oshmasin"));
      if (!S.acts.length) m.push(T("Kamida 1 ta faoliyat"));
      if (S.recs.filter((r) => r.role === "teacher").length < 2) m.push(T("2 ta o'qituvchi tavsiyachisi"));
    } else {
      S.uc.forEach((t, i) => { if (String(t || "").length < 350) m.push(T("UCAS {n}-savol: kamida 350 belgi", { n: i + 1 })); });
      if (ucTotal() > 4000) m.push(T("UCAS bayonoti 4 000 belgidan oshmasin"));
    }
    return m;
  }
  function SubmitTab() {
    const L = items(sub.plat), miss = missing(sub.plat), P = PLAT();
    if (sub.cur >= L.length) sub.cur = Math.max(0, L.length - 1);
    const c = L[sub.cur];
    let lastSec = "";
    return `<div class="seg st-plat">${[["commonapp", "Common App"], ["ucas", "UCAS"]].map(([k, t]) => `<button class="${sub.plat === k ? "on" : ""}" onclick="stPlat('${k}')">${t}</button>`).join("")}</div>
    <div class="card st-ready ${miss.length ? "" : "ok"}">${miss.length ? `<h4>${ic("alert")} ${T("Topshirishdan oldin to'ldiring")}</h4><ul>${miss.map((t) => `<li>${t}</li>`).join("")}</ul>`
      : `<h4>${ic("check")} ${T("Hammasi tayyor")}</h4><p>${T("Rasmiy saytni oching, kiring va maydonlarni ketma-ket joylashtiring.")}</p>`}</div>
    <div class="st-how"><span><i>1</i>${T("Rasmiy saytni oching")}</span><span><i>2</i>${T("Bu yerda bosing: nusxa olinadi")}</span><span><i>3</i>${T("Saytdagi maydonga joylashtiring")}</span></div>
    <button class="btn-ghost st-open" onclick="openExt('${encodeURIComponent(P[sub.plat].url)}')">${ic("globe")} ${T("{p} saytini ochish", { p: P[sub.plat].name })}</button>
    ${L.length ? `<div class="st-cur"><small>${esc(c.sec)} · ${sub.cur + 1} / ${L.length}</small><b class="notr">${esc(c.label)}</b><p class="notr">${esc(c.v.length > 160 ? c.v.slice(0, 160) + "…" : c.v)}</p>
      <button class="btn-primary" onclick="stCopyNext()">${ic("file")} ${T("Nusxa olish va keyingisi")}</button></div>
      <div class="st-list">${L.map((x, i) => { const h = x.sec !== lastSec ? `<div class="st-sec">${esc(x.sec)}</div>` : ""; lastSec = x.sec;
        return `${h}<button class="st-row ${i === sub.cur ? "cur" : ""} ${sub.done[sub.plat + i] ? "done" : ""}" onclick="stCopyAt(${i})"><span class="notr"><b>${esc(x.label)}</b><small>${esc(x.v.slice(0, 60))}${x.v.length > 60 ? "…" : ""}</small></span>${ic(sub.done[sub.plat + i] ? "check" : "file")}</button>`; }).join("")}</div>
      <button class="btn-ghost" onclick="stCopyAll()">${ic("download")} ${T("Hammasidan bitta hujjat qilib nusxa olish")}</button>
      <p class="note">${T("Bu hujjat o'qituvchi yoki mentorga ko'rsatish va zaxira uchun. Rasmiy formaga maydonlarni bittadan joylashtiring.")}</p>`
      : `<div class="card ap-empty">${chip("file", "lg")}<p>${T("Avval Profil va Insholar bo'limlarini to'ldiring.")}</p></div>`}`;
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch {}
    const ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;opacity:0;top:0"; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch {} ta.remove(); return ok;
  }
  const copied = async (i, next) => {
    const b = evBtn(), L = items(sub.plat), x = L[i]; if (!x) return;
    if (!(await copyText(x.v))) return toast(T("Nusxa olib bo'lmadi"));
    sub.done[sub.plat + i] = true; copyTick(b); toast(T("Nusxa olindi: {n}", { n: x.label }));
    sub.cur = next ? Math.min(L.length - 1, i + 1) : i; setTimeout(keepY, 650);   // the tick shows first, then the next field comes up
  };
  window.stCopyNext = () => copied(sub.cur, true);
  window.stCopyAt = (i) => copied(i, true);
  window.stCopyAll = async () => {
    const b = evBtn(), L = items(sub.plat); let out = `${PLAT()[sub.plat].name} · Ustoz AI\n`, sec = "";
    L.forEach((x) => { if (x.sec !== sec) { sec = x.sec; out += `\n== ${sec} ==\n`; } out += `${x.label}:\n${x.v}\n\n`; });
    if (await copyText(out)) { copyTick(b); toast(T("Butun hujjatdan nusxa olindi")); } else toast(T("Nusxa olib bo'lmadi"));
  };
  window.stPlat = (k) => { sub.plat = k; sub.cur = 0; store.set("studio_plat", k); haptic("light"); keepY(); };

  /* ---------- the studio page ---------- */
  function readiness() {
    const p = S.p, keys = ["first", "last", "birth", "email", "phone", "city", "citizen", "school", "scity", "grad", "gpa"];
    const prof = keys.filter((k) => String(p[k] || "").trim()).length / keys.length;
    const es = Math.min(1, words(S.ca.text) / 250), act = Math.min(1, S.acts.length / 3), rec = Math.min(1, S.recs.filter((r) => r.st === "yes" || r.st === "done").length / 3);
    return Math.round((prof * .35 + es * .3 + act * .2 + rec * .15) * 100);
  }
  const TABS = () => [["prof", T("Profil"), "user"], ["essay", T("Insholar"), "pen"], ["rec", T("Tavsiyalar"), "users"], ["top", "Top 300", "globe"], ["apps", T("Arizalar"), "cap"], ["submit", T("Topshirish"), "send"]];
  // the Top 300 list comes from study.js (loaded the first time this tab opens)
  function TopTab() {
    if (window.Study && Study.TopList) return Study.TopList();
    loadScripts(["study.js"]).then(() => { if (location.hash === "#/ariza") render(); }).catch(() => toast(T("Yuklab bo'lmadi")));
    return spinner();
  }
  function Screen() {
    tab = store.get("studio_tab", tab);
    const name = esc((user.first_name || "") + (user.last_name ? " " + user.last_name : "")), r = readiness();
    const body = { prof: ProfTab, essay: EssayTab, rec: RecTab, top: TopTab, apps: AppsTab, submit: SubmitTab }[tab] || ProfTab;
    return `${navbar("Application Studio")}
    <div class="ap-me st-head"><div class="um-ring st-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" style="stroke-dasharray:${(r / 100 * 326.7).toFixed(1)} 326.7"/></svg><div><b>${r}%</b></div></div>
      <div><small>${T("Tayyorlik darajasi")}</small><b class="notr">${name || "Ustoz AI"}</b><em>${ic("shield")} ${T("Telegram hisobingiz orqali kirdingiz, parol kerak emas")}</em></div></div>
    <div class="st-tabs">${TABS().map(([k, t, i]) => `<button class="${tab === k ? "on" : ""}" onclick="stTab('${k}')">${ic(i)}<span>${t}</span></button>`).join("")}</div>
    <div class="st-body">${body()}</div>`;
  }
  const keepY = () => { const y = scrollY; render(); scrollTo(0, y); };
  window.stTab = (k) => { tab = k; store.set("studio_tab", k); haptic("light"); render(); scrollTo(0, 0); };
  window.stAdd = (k) => { S[k].push(k === "acts" ? { type: ACT_TYPES[0] } : k === "hon" ? { level: HON_LEVELS[0] } : k === "recs" ? { role: "teacher", st: "no" } : {}); saveS(); haptic("light"); keepY(); };
  window.stDel = (k, i) => confirmAsk(T("O'chirasizmi?"), T("O'chirish")).then((ok) => { if (!ok) return; S[k].splice(i, 1); saveS(); keepY(); });
  window.stRecSt = (i, st) => { S.recs[i].st = st; saveS(); haptic("light"); keepY(); };
  window.stAsk = (i) => {
    const r = S.recs[i], me = [S.p.first, S.p.last].filter(Boolean).join(" ") || user.first_name || "";
    const text = T("Assalomu alaykum, {t}! Men {m}, xorijiy universitetlarga Common App orqali hujjat topshiryapman. Menga tavsiyanoma yozib bera olasizmi? Rozi bo'lsangiz, Common App sizning emailingizga taklifnoma yuboradi. Oldindan katta rahmat!", { t: r.name || T("ustoz"), m: me });
    if (r.st === "no" || !r.st) { r.st = "asked"; saveS(); }
    openTg(`https://t.me/share/url?url=${encodeURIComponent("https://t.me/" + BOT)}&text=${encodeURIComponent(text)}`); keepY();
  };
  // typing saves at once (no redraw, so the keyboard stays open); counters update in place
  document.addEventListener("input", (e) => {
    const el = e.target, path = el && el.dataset && el.dataset.sk; if (!path) return;
    setPath(path, el.value); clearTimeout(saveS.t); saveS.t = setTimeout(saveS, 300);
    const c = document.querySelector(`[data-cnt="${path}"]`);
    if (c) c.textContent = c.dataset.words ? T("{n} so'z", { n: words(el.value) }) : c.dataset.max ? `${el.value.length}/${c.dataset.max}` : el.value.length;
    if (path === "ca.text") { const b = document.getElementById("st-ca"); if (b) b.innerHTML = caCount(); }
    if (path.startsWith("uc.")) { const b = document.getElementById("st-uc"); if (b) b.innerHTML = ucCount(); }
  });
  document.addEventListener("change", (e) => {
    const el = e.target, path = el && el.dataset && el.dataset.sk; if (!path || el.tagName !== "SELECT") return;
    setPath(path, el.value); saveS(); if (el.dataset.rerender) keepY();
  });
  /* ---------- Muddatlar: the student's own deadlines and the main yearly ones ---------- */
  // fixed yearly dates get a countdown to their next occurrence; dates that move every year are shown as months only
  const KEY_DATES = () => [
    { m: 10, d: 15, t: T("UCAS: Oksford, Kembrij, tibbiyot va stomatologiya"), p: "ucas",
      i: T("Oksford va Kembrij, shuningdek tibbiyot, stomatologiya va veterinariya kurslariga UCAS orqali ariza shu kungacha yuboriladi. Ko'pincha qo'shimcha kirish testi va suhbat ham bo'ladi, shuning uchun tayyorgarlikni yozdan boshlang.") },
    { m: 11, d: 1, t: T("Common App: erta muddat (Early Decision, Early Action)"), p: "commonapp",
      i: T("Ko'p AQSh universitetlari erta topshirganlarga javobni dekabrda beradi. Early Decision majburiy: qabul qilinsangiz, o'sha universitetga borishingiz kerak. Early Action esa majburiy emas va boshqa universitetlarga ham topshiraverasiz.") },
    { m: 1, d: 1, t: T("Common App: asosiy muddat (Regular Decision), ko'p universitetlarda"), p: "commonapp",
      i: T("AQShning ko'p universitetlarida asosiy muddat. Insho, tavsiyanomalar, test natijalari va moliyaviy yordam hujjatlari shu kungacha tayyor bo'lishi kerak. Javoblar odatda mart oxirida keladi.") },
    { m: 1, d: 15, t: T("Germaniya: yozgi semestrga ariza"), p: "daad",
      i: T("Germaniyada yozgi semestr (aprel) uchun ko'p universitetlarga ariza 15-yanvargacha, ko'pincha uni-assist orqali topshiriladi. Aniq muddat va talablarni har bir universitet sahifasidan tekshiring.") },
    { m: 7, d: 15, t: T("Germaniya: qishki semestrga ariza"), p: "daad",
      i: T("Germaniyada qishki semestr (oktabr) uchun asosiy muddat 15-iyul. Xalqaro talabalar ko'pincha uni-assist orqali topshiradi. Tayyorlov kursi (Studienkolleg) kerak bo'lishi mumkin, buni oldindan bilib oling.") },
    { m: 1, d: 13, t: T("UCAS: boshqa kurslar uchun asosiy muddat"), p: "ucas",
      i: T("Oksford, Kembrij va tibbiyotdan tashqari ko'pchilik kurslar uchun UCAS asosiy muddati 2027-yilga qabul uchun 13-yanvar. Bitta arizada 5 tagacha kurs tanlanadi va bitta shaxsiy bayonot yoziladi.") },
    { when: T("Aprel va noyabr"), t: T("El-yurt umidi jamg'armasi tanlovlari"), lg: ["EL-YURT", "UMIDI"], lc: "ey",
      i: T("El-yurt umidi jamg'armasi xorijdagi nufuzli universitetlarda o'qish uchun grantlar beradi. Tanlovlar odatda bahor va kuzda e'lon qilinadi. Shartlar va hujjatlar ro'yxatini jamg'armaning rasmiy saytidan kuzatib boring.") },
    { when: T("Mart, may, iyun, avgust, oktabr, noyabr, dekabr"), t: T("SAT xalqaro sanalari"), img: "img/sat-logo.webp",
      i: T("SAT yiliga bir necha marta xalqaro sanalarda topshiriladi. Ro'yxatdan o'tish imtihondan taxminan bir oy oldin yopiladi. Natijani universitet muddatidan oldin yuborish uchun imtihonni erta rejalashtiring.") },
    { when: T("Iyun-iyul"), t: T("DTM: universitetlarga hujjat topshirish"), lg: ["DTM"], lc: "dt",
      i: T("O'zbekiston universitetlariga hujjatlar odatda iyun-iyul oylarida rasmiy portal orqali topshiriladi, test esa yozda o'tkaziladi. Aniq sanalar har yili alohida e'lon qilinadi.") },
  ];
  const nextDate = (m, d) => { const now = new Date(), y = now.getFullYear(); let x = new Date(y, m - 1, d, 23, 59); if (x < now) x = new Date(y + 1, m - 1, d, 23, 59); return x; };
  const fmtDate = (x) => fmtDay(x);
  const keyRows = () => KEY_DATES().map((k, n) => ({ ...k, n })).map((k) => k.m ? { ...k, date: nextDate(k.m, k.d) } : k).map((k) => k.date ? { ...k, left: Math.ceil((k.date - Date.now()) / 864e5) } : k);
  const host = (u) => { try { return new URL(/^https?:/.test(u) ? u : "https://" + u).hostname; } catch { return ""; } };
  // a logo for each row: the platform's mark, the SAT logo, or the university's own site icon (its initial if that fails)
  const keyLogo = (k) => k.img ? `<span class="ap-logo dl-img"><img src="${k.img}" alt=""></span>` : k.p ? logo(PLAT()[k.p]) : `<span class="ap-logo ${k.lc}">${k.lg.map((t) => `<b>${t}</b>`).join("")}</span>`;
  const uniLogo = (a) => { const h = host(a.site || ""), ini = esc((a.name || "?").trim()[0] || "?");
    return h ? `<span class="ap-logo dl-img"><img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=64" alt="" loading="lazy" onerror="this.parentNode.innerHTML='<b>${ini}</b>'"></span>` : `<span class="ap-logo di"><b>${ini}</b></span>`; };
  const daysTxt = (left) => left < 0 ? T("Muddat o'tgan") : left === 0 ? T("Bugun oxirgi kun") : T("{n} kun qoldi", { n: left });
  /* ---------- the student's own list of Top 300 universities and their deadlines ---------- */
  let T3 = null;
  let T3p = null;
  const loadT3 = () => T3 ? Promise.resolve(T3) : (T3p = T3p || fetch("top300.json").then((r) => r.json()).then((d) => (T3 = d.rows)).catch((e) => { T3p = null; throw e; }));
  const dlUnis = () => store.get("dl_unis", []);
  // a "MM-DD" date in this admission season (August to July), and the days left (negative once it has passed)
  const cyc = (md) => { const now = new Date(), [m, d] = md.split("-").map(Number), y0 = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const date = new Date(m >= 8 ? y0 : y0 + 1, m - 1, d, 23, 59); return { date, left: Math.ceil((date - now) / 864e5) }; };
  const uniPlans = (u) => { const r = (T3 || []).find((x) => x[1] === u); if (!r || !window.DL_DATA) return null;
    const d = DL_DATA.of(r[1], r[2]); return { r, ok: d.ok, plans: d.plans.map(([k, md]) => ({ k, ...cyc(md) })).sort((a, b) => a.date - b.date) }; };
  const siteLogo = (site, name) => uniLogo({ site, name });
  function uniCards() {
    const list = dlUnis(); if (!list.length) return "";
    if (!T3 || !window.DL_DATA) { Promise.all([loadT3(), loadScripts(["deadlines-data.js"])]).then(() => { if (location.hash === "#/muddatlar") keepY(); }).catch(() => {}); return spinner(); }
    const P = DL_DATA.PLAN;
    return list.map((u) => uniPlans(u)).filter(Boolean).map(({ r, ok, plans }) => `<div class="card dlu">
      <div class="dlu-h">${siteLogo(r[14], r[1])}<span class="notr"><b>${esc(r[1])}</b><small>${esc(r[2])} · #${esc(String(r[0]).replace("=", ""))}</small></span>
        <button class="icon-btn" onclick="dlUniDel('${encodeURIComponent(r[1])}')" aria-label="x">${ic("x")}</button></div>
      ${plans.length ? plans.map((x) => `<div class="dlu-p ${x.left < 0 ? "past" : x.left <= 14 ? "soon" : ""}"><span><b>${esc(P[x.k][0])}</b><small>${T(P[x.k][1])}</small></span>
        <span class="dlu-d"><b>${esc(fmtDate(x.date))}</b><em>${x.left < 0 ? T("O'tgan") : x.left === 0 ? T("Bugun") : T("{n} kun qoldi", { n: x.left })}</em></span></div>`).join("")
        : `<p class="dlu-note">${T("Bu universitet muddatlarini har yili o'zi e'lon qiladi. Rasmiy saytidan tekshiring.")}</p>`}
      ${plans.length && !ok ? `<p class="dlu-note">${T("Taxminiy muddat: mamlakatdagi odatiy sana. Aniq sanani rasmiy saytdan tekshiring.")}</p>` : ""}
      ${r[14] ? `<button class="btn-ghost dlu-site" onclick="openExt('${encodeURIComponent(r[14])}')">${ic("ext")} ${T("Rasmiy sayt")}</button>` : ""}</div>`).join("");
  }
  // "Universitet qo'shish": tick several of the Top 300, then "Tayyor" brings them back to Muddatlar
  let pick = new Set();
  window.dlPick = () => {
    haptic("light"); pick = new Set(dlUnis());
    sheet(`<div class="dlp"><h3>${T("Universitetlarni tanlang")}</h3><p class="mt-hint">${T("Top 300 ichidan bir nechtasini belgilang")}</p>
      <label class="km-search">${ic("search")}<input id="dlp-q" placeholder="${T("Universitet yoki davlat nomi")}" oninput="dlFilter(this.value)" autocomplete="off"></label>
      <div class="dlp-list" id="dlp-list">${spinner()}</div>
      <button class="btn-primary dlp-go" id="dlp-go" onclick="dlPickGo()">${ic("check")} ${T("Tayyor")} (<span id="dlp-n">${pick.size}</span>)</button></div>`);
    Promise.all([loadT3(), loadScripts(["deadlines-data.js"])]).then(() => {
      const el = document.getElementById("dlp-list"); if (!el) return;
      el.innerHTML = T3.map((r) => `<button class="dlp-row ${pick.has(r[1]) ? "on" : ""}" data-n="${esc(r[1])}" data-q="${esc((r[1] + " " + r[2]).toLowerCase())}" onclick="dlTick(this)">
        <i>${ic("check")}</i><span class="notr"><b>${esc(r[1])}</b><small>${esc(r[2])} · #${esc(String(r[0]).replace("=", ""))}</small></span></button>`).join("");
    }).catch(() => toast(T("Yuklab bo'lmadi")));
  };
  window.dlTick = (b) => { const n = b.dataset.n; if (pick.has(n)) pick.delete(n); else pick.add(n); b.classList.toggle("on", pick.has(n)); haptic("light");
    const c = document.getElementById("dlp-n"); if (c) c.textContent = pick.size; };
  window.dlFilter = (q) => { q = q.trim().toLowerCase(); document.querySelectorAll(".dlp-row").forEach((b) => { b.hidden = !!q && !b.dataset.q.includes(q); }); };
  window.dlPickGo = () => {
    const before = dlUnis().length; store.set("dl_unis", [...pick]); closeSheet(); haptic("medium");
    const added = pick.size - before; if (added > 0) toast(T("{n} ta universitet qo'shildi", { n: added }));
    if (location.hash !== "#/muddatlar") location.hash = "#/muddatlar"; else { render(); scrollTo(0, 0); }
  };
  window.dlUniDel = (u) => { u = decodeURIComponent(u); store.set("dl_unis", dlUnis().filter((x) => x !== u)); haptic("light"); keepY(); };
  function Deadlines() {
    if (dlUnis().length && (!T3 || !window.DL_DATA)) uniCards();
    const mine = list().filter((a) => a.deadline).map((a) => ({ a, left: daysLeft(a.deadline) })).sort((x, y) => x.left - y.left);
    const keys = keyRows().sort((x, y) => (x.left ?? 9999) - (y.left ?? 9999));
    const badge = (left) => `<span class="dl-left ${left < 0 ? "late" : left <= 14 ? "soon" : ""}"><b>${left < 0 ? "!" : left}</b><small>${left < 0 ? T("o'tgan") : T("kun")}</small></span>`;
    // ending soon: everything still open within 60 days (the nearest one at least), most urgent first
    const soon = mine.filter((x) => x.left >= 0).map((x) => ({ t: x.a.name, logo: uniLogo(x.a), left: x.left, go: `dlMine(${x.a.id})` }))
      .concat(keys.filter((k) => k.left != null).map((k) => ({ t: k.t, logo: keyLogo(k), left: k.left, go: `dlKey(${k.n})` })))
      .concat(T3 && window.DL_DATA ? dlUnis().map(uniPlans).filter(Boolean).map((x) => ({ x, p: x.plans.find((q) => q.left >= 0) })).filter((y) => y.p)
        .map(({ x, p }) => ({ t: `${x.r[1]} · ${DL_DATA.PLAN[p.k][0]}`, logo: siteLogo(x.r[14], x.r[1]), left: p.left, go: "document.querySelector('.dlu')&&document.querySelector('.dlu').scrollIntoView({behavior:'smooth',block:'start'})" })) : [])
      .sort((x, y) => x.left - y.left);
    const hot = soon.filter((x) => x.left <= 60); const top = (hot.length ? hot : soon.slice(0, 1)).slice(0, 4);
    return `${navbar(T("Muddatlar"))}
    ${top.length ? `<div class="section-title">${T("Muddati yakunlanayotganlar")}<small>${hot.length}</small></div>
    <div class="dl-hot">${top.map((x) => `<button class="dl-hc ${x.left <= 14 ? "red" : ""}" onclick="${x.go}">${x.logo}<span class="dl-hn"><b>${x.left}</b><small>${T("kun qoldi")}</small></span><span class="dl-ht notr">${esc(x.t)}</span></button>`).join("")}</div>` : ""}
    <div class="section-title">${T("Mening universitetlarim")}<small>${dlUnis().length}</small></div>
    <button class="btn-primary dl-add" onclick="dlPick()">${ic("plus")} ${T("Universitet qo'shish")}</button>
    ${dlUnis().length ? uniCards() : `<p class="note">${T("Top 300 ichidan universitetlarni tanlang: ularning Early Decision, Early Action va Regular Decision muddatlari shu yerda chiqadi.")}</p>`}
    ${mine.length ? `<div class="section-title">${T("Application Studio muddatlari")}<small>${mine.length}</small></div><div class="dls-list">${mine.map(({ a, left }) => `<button class="card dl-row" onclick="dlMine(${a.id})">${uniLogo(a)}
      <span class="notr"><b>${esc(a.name)}</b><small>${esc((PLAT()[a.plat] || PLAT().direct).name)} · ${esc(fmtDate(new Date(a.deadline + "T12:00:00")))}</small></span>${badge(left)}</button>`).join("")}</div>`
      : ""}
    <div class="section-title">${T("Asosiy muddatlar")}</div>
    <div class="dls-list">${keys.map((k) => `<button class="card dl-row ${k.left == null ? "nodate" : ""}" onclick="dlKey(${k.n})">${keyLogo(k)}
      <span><b>${k.t}</b><small>${k.date ? esc(fmtDate(k.date)) : k.when}</small></span>${k.left != null ? badge(k.left) : `<span class="dl-left mo">${ic("clock")}</span>`}</button>`).join("")}</div>
    <p class="note">${T("Har bir universitetning aniq muddatini uning rasmiy saytidan tekshiring.")}</p>`;
  }
  // tap a deadline: a short explanation (50 words at most) in a bottom panel
  window.dlKey = (n) => {
    const k = keyRows().find((x) => x.n === n); if (!k) return; haptic("light");
    const p = k.p && PLAT()[k.p];
    sheet(`<div class="dls-sheet">${keyLogo(k)}<h3>${k.t}</h3>
      <p class="dls-when">${k.date ? `<b>${esc(fmtDate(k.date))}</b> · ${daysTxt(k.left)}` : `<b>${k.when}</b>`}</p>
      <p>${k.i}</p>
      ${p && p.url ? `<button class="btn-primary" onclick="openExt('${encodeURIComponent(p.url)}')">${ic("ext")} ${esc(p.name)}</button>` : ""}</div>`);
  };
  window.dlMine = (id) => {
    const a = list().find((x) => x.id === id); if (!a) return; haptic("light");
    const left = daysLeft(a.deadline), pl = PLAT()[a.plat] || PLAT().direct;
    sheet(`<div class="dls-sheet">${uniLogo(a)}<h3 class="notr">${esc(a.name)}</h3>
      <p class="dls-when"><b>${esc(fmtDate(new Date(a.deadline + "T12:00:00")))}</b> · ${daysTxt(left)}</p>
      <p>${T("Arizani {p} orqali topshirasiz. Insho, tavsiyanomalar va hujjatlarni muddatdan kamida bir hafta oldin tayyorlab qo'ying: oxirgi kunlarda saytlar sekinlashadi.", { p: esc(pl.name) })}</p>
      <button class="btn-primary" onclick="closeSheet();store.set('studio_tab','apps');location.hash='#/ariza'">${ic("cap")} ${T("Application Studio'da ochish")}</button></div>`);
  };
  return { Screen, Deadlines };
})();
window.Ariza = Ariza;
