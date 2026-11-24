// "Harvard free courses on AI security": Harvard CS 2881R "AI Safety" by Boaz Barak (Harvard and OpenAI), Fall 2026.
// Facts and links come from the course site (boazbk.github.io/mltheoryseminar) and its YouTube playlist.
// Lectures, notes and slides are free online; the in-person class itself is only for registered Harvard students.
const AiSafety = (() => {
  const SITE = "https://boazbk.github.io/mltheoryseminar/";
  const LINKS = () => [
    { u: "https://www.youtube.com/playlist?list=PL_b4B2IWlal3j01Rbj5ebT663E7x4bl_W", i: "play", t: T("Barcha ma'ruzalar"), s: "YouTube", main: 1 },
    { u: SITE, i: "book", t: T("Konspekt va taqdimotlar"), s: T("Kursning rasmiy sayti") },
    { u: "https://youtu.be/j4WSktB5Ni0", i: "play", t: T("1-ma'ruza: kursga kirish"), s: "YouTube · 3.09.2026" },
    { u: "https://youtu.be/0L-DGRn52Q0", i: "users", t: T("Sam Altman bilan savol-javob"), s: "YouTube · 22.10.2026" },
    { u: SITE + "fall2025/", i: "file", t: T("2025-yilgi kurs arxivi"), s: T("Video, konspekt va tajribalar") },
  ];
  const GUESTS = () => [
    ["Sam Altman", T("OpenAI bosh direktori")], ["Jakub Pachocki", T("OpenAI bosh olimi")],
    ["Nicholas Carlini", T("Anthropic tadqiqotchisi")], ["Jack Lindsey", T("Anthropic tadqiqotchisi")],
  ];
  const TOPICS = () => [T("Sun'iy intellekt va kiberxavfsizlik"), T("Zamonaviy til modellari qanday o'qitiladi"), T("Mukofot tizimini aldash (reward hacking) va baholash"),
    T("Modelning ichini tushunish (interpretability)"), T("AI bo'yicha qonun va siyosat"), T("Biologik xavflar va ularning oldini olish")];
  const open = (u) => `openExt('${encodeURIComponent(u)}')`;
  const block = (icon, title, body) => `<section class="ais-pt"><h3>${ic(icon)}${title}</h3>${body}</section>`;
  function Screen() {
    const L = LINKS();
    return `${navbar(T("AI xavfsizligi · Garvard"))}
    <button class="ais-cover" onclick="${open(L[0].u)}" aria-label="${T("Barcha ma'ruzalar")}">
      <img src="https://i.ytimg.com/vi/j4WSktB5Ni0/maxresdefault.jpg" alt="" decoding="async">
      <span class="ais-play">${ic("play")}</span>
      <span class="ais-badge">${T("Bepul")}</span>
    </button>
    <div class="ais-head">
      <small>Harvard CS 2881R · Fall 2026</small>
      <h2>${T("Garvardning sun'iy intellekt xavfsizligi bo'yicha bepul kursi")}</h2>
      <p>${T("Garvardning sun'iy intellekt xavfsizligi bo'yicha kursi. Ma'ruzalar YouTube'da, konspekt va taqdimotlar kurs saytida bepul.")}</p>
      <div class="ais-teacher">${ic("cap")}<span><b>Boaz Barak</b><small>${T("Garvard professori va OpenAI tadqiqotchisi")}</small></span></div>
    </div>
    <button class="btn-primary ais-go" onclick="${open(L[0].u)}">${ic("play")} ${T("Kursni boshlash")}</button>
    ${block("info", T("Bu qanday kurs?"), `<p>${T("Sun'iy intellekt (masalan, ChatGPT kabi katta til modellari) qanday o'rganishi, qayerda xato qilishi va qanday xavf tug'dirishi real misollar bilan ko'rsatiladi: tekshiruvlarni chetlab o'tish, mukofot tizimini aldash, modelning yashirin maqsadlari va boshqalar.")}</p>`)}
    ${block("target", T("Nega kerak?"), `<p>${T("Sun'iy intellekt hayotimizga juda tez kirib kelmoqda. Uni xavfsiz va ishonchli qila oladigan mutaxassislar dunyoda kam va qadrli. AI bilan ishlaydigan har bir kishi uning qayerda xato qilishi mumkinligini bilishi kerak.")}</p>`)}
    ${block("book", T("Kursda nima bor?"), `<ul class="ais-list">${TOPICS().map((t) => `<li>${t}</li>`).join("")}</ul>
      <p class="ais-small">${T("13 ta ma'ruza, har birida talabalarning kod bilan qilingan tajribasi. Konspekt, taqdimot va o'qish uchun materiallar kurs saytida.")}</p>`)}
    ${block("users", T("Mehmon ma'ruzachilar"), `<div class="ais-guests">${GUESTS().map(([n, r]) => `<span><b>${n}</b><small>${r}</small></span>`).join("")}</div>`)}
    ${block("star", T("Natijada nima olasiz?"), `<ul class="ais-list">
      <li>${T("Sun'iy intellekt ichida nima bo'layotganini va uning xavflarini chuqur tushunasiz")}</li>
      <li>${T("AI xavfsizligi sohasida o'qish yoki ishlash uchun birinchi qadamni qo'yasiz")}</li>
      <li>${T("Dunyoning eng kuchli mutaxassislari ma'ruzalarini ingliz tilida tinglab, til va bilimni birga oshirasiz")}</li></ul>`)}
    <div class="ais-note">${ic("info")}<p>${T("Kurs ingliz tilida va murakkab: Python, matematika va mashinali o'qitish asoslarini biladiganlar uchun. Yangi boshlayotgan bo'lsangiz, avval Ustoz AI'dagi Python va sun'iy intellekt kurslaridan boshlang.")}</p></div>
    <button class="btn-ghost ais-py" onclick="location.hash='#/kurs/d0a41b0f-cff9-4706-ae65-60587c3dacb5'">${ic("play")} ${T("Ustoz AI: Python kursi (bepul)")}</button>
    <div class="section-title">${T("Havolalar")}</div>
    <div class="ais-links">${L.map((x) => `<button class="ais-link ${x.main ? "main" : ""}" onclick="${open(x.u)}"><i>${ic(x.i)}</i><span><b>${x.t}</b><small>${x.s}</small></span>${ic("ext", "ext")}</button>`).join("")}</div>
    <p class="note">${T("Manba: Garvard universiteti, CS 2881R AI Safety kursi sayti. Auditoriyadagi darslar faqat ro'yxatdan o'tgan Garvard talabalari uchun, video va materiallar esa hamma uchun ochiq.")}</p>`;
  }
  return { Screen };
})();
window.AiSafety = AiSafety;
