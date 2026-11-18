// "Top 20 chegirmalar": discounts students and young people can use online or in Tashkent.
// Ordered by deadline (the ones ending soonest first), then the ones that are always on, then the expected seasonal ones.
// Each card opens the full terms: deadline, regular and discounted price, where it works, how to get it, official link.
const Deals = (() => {
  // until: last day (YYYY-MM-DD) | "always" | "season" (announced every winter)
  const LIST = () => [
    { id: "korzinka", logo: "korzinka", brand: "Korzinka × Uzum Bank", until: "2026-11-30",
      t: T("Korzinka'da 7% keshbek"), d: T("Uzum kartasi bilan har bir xariddan 7% pul qaytadi"),
      old: T("Oddiy narx"), now: T("Xarid summasining 7% i qaytariladi"),
      where: T("Korzinka supermarketlari (Toshkent va viloyatlar), Korzinka va Korzinka Go ilovalari"),
      how: T("Uzum kartasi bilan to'lang yoki kartani Korzinka ilovasiga ulang: keshbek avtomatik tushadi."), u: "korzinka.uz" },
    { id: "higgsfield", logo: "higgsfield", brand: "Higgsfield AI", until: "2026-11-30",
      t: T("Higgsfield AI: yillik tariflarga 65% gacha chegirma"), d: T("Rasm va video yaratuvchi AI xizmatining Black Friday chegirmasi"),
      old: T("Plus: oyiga taxminan 59 $"), now: T("Plus: oyiga 33 $, Ultra: oyiga 50 $ (yillik to'lovda)"),
      where: T("Onlayn, higgsfield.ai"), how: T("higgsfield.ai/pricing sahifasida yillik tarifni tanlang: chegirma narxda ko'rsatilgan."), u: "higgsfield.ai/pricing" },
    { id: "udemy", logo: "udemy", brand: "Udemy", until: "2026-11-29",
      t: T("Udemy: Black Friday kurslar chegirmasi"), d: T("Dasturlash, dizayn, ingliz tili va boshqa kurslar arzonlashadi"),
      old: T("Kurs narxi odatda 50-120 $"), now: T("Sotuv kunlarida kurslar odatda 10-15 $"),
      where: T("Onlayn, udemy.com"), how: T("19-29-noyabr kunlari udemy.com saytidan kursni tanlang, chegirma savatda avtomatik qo'llanadi."), u: "udemy.com" },
    { id: "coursera", logo: "coursera", brand: "Coursera", until: "2026-11-30",
      t: T("Coursera Plus: birinchi yilga 40% chegirma"), d: T("Google, IBM, Meta va universitetlarning 10 000 dan ortiq kursi va sertifikati"),
      old: "399 $ / " + T("yil"), now: "239 $ / " + T("yil"),
      where: T("Onlayn, coursera.org (faqat yangi obunachilar uchun)"), how: T("coursera.org saytida Coursera Plus yillik obunasini tanlang: chegirma to'lov sahifasida qo'llanadi."), u: "coursera.org/courseraplus" },
    { id: "yandexeats", logo: "yandexeats", brand: "Yandex Eats", until: "2026-12-31",
      t: T("Yandex Eats: birinchi buyurtmaga 45 000 so'm chegirma"), d: T("Yandex Go ilovasidagi Eats bo'limida birinchi buyurtma uchun"),
      old: T("Buyurtma narxi"), now: T("45 000 so'm arzonroq"),
      where: T("Toshkent, Yandex Go ilovasi"), how: T("Yandex Go ilovasining Eats bo'limida birinchi buyurtmangizni bering: promokod buyurtma sahifasida kiritiladi."), u: "eda.yandex.uz", check: 1 },
    { id: "safia", logo: "safiabakery", brand: "Safia", until: "always",
      t: T("Safia: ilovada ro'yxatdan o'ting va bepul qahva oling"), d: T("Birinchi xariddan keyin qahva sovg'a; kechqurun 21:00 dan keyin pishiriqlar 2+1"),
      old: T("Qahva odatda 25 000-35 000 so'm"), now: T("Bepul"),
      where: T("Safia cafe & bakery filiallari, Toshkent"), how: T("Safia ilovasini yuklab oling, ro'yxatdan o'ting va birinchi xaridni qiling: qahva sovg'a sifatida beriladi. Do'stingizni ilovaga taklif qilsangiz, taklif kodi bilan u ham bepul qahva oladi."), u: "safiabakery.uz/uz/news" },
    { id: "bellissimo", logo: "bellissimo", brand: "Bellissimo Pizza", until: "always",
      t: T("Bellissimo: ilovadagi birinchi buyurtmaga 30 000 so'm chegirma"), d: T("70 000 so'mdan ortiq birinchi buyurtma uchun, kombo va aksiya taomlaridan tashqari"),
      old: T("Buyurtma narxi"), now: T("30 000 so'm arzonroq"),
      where: T("Toshkent, Bellissimo ilovasi"), how: T("Bellissimo ilovasida birinchi buyurtmangizni bering va promokodni kiriting."), u: "bellissimo.uz", check: 1 },
    { id: "atto", logo: "atto", brand: "ATTO", until: "always",
      t: T("ATTO talaba kartasi: jamoat transportida 50%"), d: T("Avtobus va metroda yo'l haqining yarmi"),
      old: T("To'liq yo'l haqi"), now: T("Yo'l haqining 50 foizi"),
      where: T("Toshkent jamoat transporti"), how: T("ATTO imtiyozli talaba kartasini o'qish joyingizdan ma'lumotnoma bilan rasmiylashtiring."), u: "atto.uz/uz/passengers" },
    { id: "github", logo: "github", brand: "GitHub Education", until: "always",
      t: T("GitHub Student Developer Pack: bepul"), d: T("GitHub Pro, Copilot Student, bulut kreditlari va dasturchi vositalari"),
      old: T("Yuzlab dollarlik vositalar"), now: T("Talabalar uchun bepul"),
      where: T("Onlayn, education.github.com"), how: T("education.github.com/pack sahifasida talabalik guvohnomangiz bilan tasdiqlang: 2 yil amal qiladi."), u: "education.github.com/pack" },
    { id: "perplexity", logo: "perplexity", brand: "Perplexity", until: "always",
      t: T("Perplexity Education Pro: 50% arzon"), d: T("Manbalari bilan javob beradigan AI qidiruv, talabalar uchun"),
      old: T("Oyiga 20 $"), now: T("Oyiga taxminan 10 $"),
      where: T("Onlayn, perplexity.ai"), how: T("perplexity.ai saytida talaba ekaningizni SheerID orqali tasdiqlang."), u: "perplexity.ai" },
    { id: "figma", logo: "figma", brand: "Figma", until: "always",
      t: T("Figma Education: talabalar uchun bepul"), d: T("Dizayn va prototiplash uchun professional vosita"),
      old: T("Professional tarif pullik"), now: T("Bepul"),
      where: T("Onlayn, figma.com"), how: T("figma.com/education sahifasida talaba sifatida tasdiqdan o'ting."), u: "figma.com/education" },
    { id: "microsoft", logo: "microsoft", brand: "Microsoft 365", until: "always",
      t: T("Microsoft 365 A1: Word, Excel, PowerPoint bepul"), d: T("Universitet elektron pochtasi bilan onlayn Office va OneDrive"),
      old: T("Oddiy obuna pullik"), now: T("Talabalar uchun bepul"),
      where: T("Onlayn, universitet pochtasi orqali"), how: T("microsoft.com/education sahifasiga universitet elektron pochtangiz bilan kiring."), u: "www.microsoft.com/en-us/education/products/office" },
    { id: "canva", logo: "canva", brand: "Canva", until: "always",
      t: T("Canva for Education: bepul Pro imkoniyatlar"), d: T("Maktab o'qituvchilari va ularning o'quvchilari uchun"),
      old: T("Canva Pro pullik"), now: T("Bepul"),
      where: T("Onlayn, canva.com"), how: T("canva.com/education sahifasida o'qituvchi tasdiqlanadi va o'quvchilarni sinfga taklif qiladi."), u: "canva.com/education" },
    { id: "railway", logo: "railway", brand: "O'zbekiston temir yo'llari", until: "season",
      t: T("Poyezd chiptalariga 50% chegirma"), d: T("Har yili qishki ta'tilda talabalar uchun"),
      old: T("To'liq chipta narxi"), now: T("50 foiz arzon"),
      where: T("Mahalliy poyezdlar (SV/VIP vagonlar va Afrosiyob bundan mustasno)"),
      how: T("O'tgan mavsumda 2025-yil 18-dekabrdan 2026-yil 12-yanvargacha amal qilgan. Chipta olishda talabalik ma'lumotnomasini ko'rsating."), u: "railway.uz" },
    { id: "uzairways", logo: "uzairways", brand: "Uzbekistan Airways", until: "season",
      t: T("Ichki reyslarga 50% chegirma"), d: T("Har yili qishki ta'tilda talabalar uchun"),
      old: T("To'liq ekonom narx"), now: T("50 foizgacha arzon (soliq va yig'imlardan tashqari)"),
      where: T("O'zbekiston ichidagi barcha reyslar"),
      how: T("O'tgan mavsumda 2025-yil 26-dekabrdan 2026-yil 11-yanvargacha amal qilgan. Chipta olishda talabalik hujjatini ko'rsating."), u: "uzairways.com" },
    { id: "poyezd", logo: "poyezd", brand: "Poyezd Bilet 24", until: "always", bottom: 1,
      t: T("Poyezd Bilet 24: bo'sh joyni 2 soniyada bepul bron qiladi"), d: T("Chipta qolmagan bo'lsa ham bot yo'nalishni 24/7 kuzatadi va joy chiqishi bilan uni band qiladi"),
      old: T("Bo'sh joyni o'zingiz soatlab kuzatasiz"), now: T("Bot bepul kuzatadi va 2 soniyada bron qiladi"),
      where: T("Telegram, @poyezdbilet24_bot (O'zbekiston bo'ylab poyezdlar)"), how: T("Botni oching, yo'nalish va sanani tanlang: joy paydo bo'lishi bilan bot uni siz uchun bron qiladi."), u: "t.me/poyezdbilet24_bot" },
  ];
  const day = 86400000;
  const left = (x) => x.until === "always" || x.until === "season" ? null : Math.ceil((Date.parse(x.until + "T23:59:59+05:00") - Date.now()) / day);
  const fmtDate = (s) => { const [y, m, d] = s.split("-"); return `${+d}.${m}.${y}`; };
  const chipOf = (x) => {
    const n = left(x);
    if (x.until === "always") return `<em class="dl-when on">${T("Doimiy")}</em>`;
    if (x.until === "season") return `<em class="dl-when wait">${T("Qishki ta'tilda")}</em>`;
    return `<em class="dl-when ${n <= 3 ? "hot" : n <= 10 ? "soon" : ""}">${n <= 0 ? T("Bugun tugaydi") : T("{n} kun qoldi", { n })}</em>`;
  };
  const active = () => LIST().filter((x) => { const n = left(x); return n === null || n >= 0; });
  // ending soonest first; always-on next (similar ones stay side by side as listed); the seasonal ones last
  const ordered = () => { const a = active(); return [...a.filter((x) => left(x) !== null).sort((x, y) => left(x) - left(y)), ...a.filter((x) => x.until === "always" && !x.bottom), ...a.filter((x) => x.until === "season"), ...a.filter((x) => x.bottom)]; };

  function Screen() {
    const list = ordered();
    return `${navbar(T("Top 20 chegirmalar"))}
    <p class="dl-lead">${T("Talabalar va yoshlar uchun onlayn va Toshkentdagi chegirmalar: tugash muddati yaqinlari birinchi.")}</p>
    <div class="dl-list">${list.map((x) => `<button class="card dl-card" id="d-${x.id}" onclick="dealOpen('${x.id}')">
      <img class="dl-logo" src="img/deals/${x.logo}.webp" alt="" width="52" height="52" loading="lazy">
      <span class="dl-txt"><small class="notr">${esc(x.brand)}</small><b>${x.t}</b><span>${x.d}</span></span>${chipOf(x)}</button>`).join("")}</div>
    <p class="note">${T("Chegirma shartlari kompaniyalar tomonidan o'zgartirilishi mumkin. Xariddan oldin rasmiy sahifada tekshiring.")}</p>`;
  }
  window.dealOpen = (id) => {
    const x = LIST().find((d) => d.id === id); if (!x) return; haptic("light");
    const n = left(x);
    const until = x.until === "always" ? T("Doimiy amal qiladi") : x.until === "season" ? T("Qishki ta'tilda, e'lon qilinishi kutilmoqda") : `${fmtDate(x.until)} ${T("gacha")} (${n <= 0 ? T("bugun tugaydi") : T("{n} kun qoldi", { n })})`;
    sheet(`<div class="dl-sheet">
      <div class="dl-sh-head"><img src="img/deals/${x.logo}.webp" alt="" width="56" height="56"><span><small class="notr">${esc(x.brand)}</small><h3>${x.t}</h3></span></div>
      <p class="dl-sh-d">${x.d}</p>
      <div class="dl-rows">
        <div><span>${ic("clock")} ${T("Muddati")}</span><b>${until}</b></div>
        <div><span>${ic("tag")} ${T("Odatiy narx")}</span><b class="old">${x.old}</b></div>
        <div><span>${ic("gift")} ${T("Chegirma bilan")}</span><b class="new">${x.now}</b></div>
        <div><span>${ic("pin")} ${T("Qayerda")}</span><b>${x.where}</b></div>
      </div>
      <div class="dl-how"><b>${T("Qanday olish mumkin")}</b><p>${x.how}</p></div>
      ${x.check ? `<p class="dl-check">${ic("alert")} ${T("Bu taklif promokod saytlaridan olingan: ishlatishdan oldin ilovada tekshiring.")}</p>` : ""}
      ${x.u.startsWith("t.me/") ? `<button class="btn-primary dl-go" onclick="openTg('https://${x.u}')">${ic("send")} ${T("Botni ochish")}</button>`
        : `<button class="btn-primary dl-go" onclick="openExt('${encodeURIComponent("https://" + x.u)}')">${ic("globe")} ${T("Rasmiy sahifani ochish")}</button>`}
      <button class="btn-ghost sd-share wide" onclick="shareSec('d_${x.id}', this.closest('.dl-sheet').querySelector('h3').textContent)">${ic("send")} ${T("Do'stga ulashish")}</button></div>`);
  };
  return { Screen };
})();
window.Deals = Deals;
