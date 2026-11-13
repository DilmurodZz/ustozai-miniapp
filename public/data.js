// Demo data. Course names and contest results are samples until Ustoz AI sends the real lists.

const QUIZ = [
  { e: "📊", q: "Jadval va raqamlar ichidan qonuniyat topish menga zavq beradi", t: { data: 2, ai: 1 } },
  { e: "💻", q: "Biror narsani o'zim dasturlab, ishlashini ko'rishni xohlayman", t: { code: 2, ai: 1 } },
  { e: "🎨", q: "Chiroyli dizayn va ranglar uyg'unligini darrov sezaman", t: { design: 2 } },
  { e: "📣", q: "Ijtimoiy tarmoqlarda nima \"trend\" bo'lishini oldindan sezaman", t: { mkt: 2 } },
  { e: "🤖", q: "ChatGPT kabi AI vositalarini har kuni sinab ko'raman", t: { ai: 2, code: 1 } },
  { e: "🧩", q: "Murakkab masalani bo'laklarga ajratib yechishni yoqtiraman", t: { code: 1, data: 1, ai: 1 } },
  { e: "🗣️", q: "Odamlarni biror g'oyaga ishontirish menga oson", t: { mkt: 2 } },
  { e: "📱", q: "Ilovalardagi noqulay tugma yoki ekran meni bezovta qiladi", t: { design: 2, code: 1 } },
  { e: "🔍", q: "Biror qaror qilishdan oldin faktlarni chuqur o'rganaman", t: { data: 2 } },
  { e: "🚀", q: "Kelajakda o'z startapimni ochishni orzu qilaman", t: { mkt: 1, ai: 1, code: 1 } },
  { e: "✏️", q: "Bo'sh vaqtimda chizish, montaj yoki video qilishni yoqtiraman", t: { design: 2, mkt: 1 } },
  { e: "⚙️", q: "Zerikarli ishni avtomatlashtirish yo'lini qidiraman", t: { ai: 2, code: 1, data: 1 } },
];

const PERSONAS = {
  data: {
    name: "Data Detektiv", emoji: "🕵️", hero: "🧑‍💻", chips: ["📊", "📈"],
    desc: "Sen ma'lumotlar ichidan muhim xulosalarni topishni yoqtiradigan, tahliliy fikrlaydigan va muammolarga yechim izlaydigan odamsan.",
    salary: "8–15 mln", jobs: ["Data analitik", "BI mutaxassisi", "Biznes tahlilchi"],
    courses: [["📊", "Ma'lumotlar tahlili va vizualizatsiya"], ["🐍", "Python bilan ma'lumotlar tahlili"], ["📈", "Biznes tahlilchilik asoslari"]],
  },
  code: {
    name: "Kod Sehrgari", emoji: "🧙", hero: "👨‍💻", chips: ["💻", "⚡"],
    desc: "Sen g'oyani kodga aylantirib, ishlaydigan mahsulot yaratishni yaxshi ko'rasan. Mantiq va sabr sening kuchli tomoning.",
    salary: "10–25 mln", jobs: ["Frontend dasturchi", "Backend dasturchi", "Mobil dasturchi"],
    courses: [["🌐", "Web dasturlash: HTML, CSS, JavaScript"], ["🐍", "Python dasturlash noldan"], ["📱", "Mobil ilovalar yaratish"]],
  },
  design: {
    name: "Raqamli Me'mor", emoji: "🎨", hero: "👩‍🎨", chips: ["🖌️", "✨"],
    desc: "Sen go'zallik va qulaylikni his qilasan. Odamlar foydalanadigan ekranlarni chiroyli va tushunarli qilish sening iste'doding.",
    salary: "7–18 mln", jobs: ["UI/UX dizayner", "Grafik dizayner", "Motion dizayner"],
    courses: [["🎨", "Figma: UI/UX dizayn asoslari"], ["🖼️", "Grafik dizayn va brending"], ["🎬", "Video montaj va motion dizayn"]],
  },
  mkt: {
    name: "Trend Ovchisi", emoji: "📣", hero: "🧑‍🎤", chips: ["📱", "🔥"],
    desc: "Sen odamlarni tushunasan va ularni nima qiziqtirishini oldindan sezasan. Brendlarni mashhur qilish sening ishing.",
    salary: "6–15 mln", jobs: ["SMM mutaxassisi", "Digital marketolog", "Kontent meyker"],
    courses: [["📣", "SMM va kontent marketing"], ["🎯", "Target reklama: Instagram va Telegram"], ["✍️", "Kopirayting va storytelling"]],
  },
  ai: {
    name: "AI Kashfiyotchisi", emoji: "🤖", hero: "🧑‍🚀", chips: ["🧠", "⚙️"],
    desc: "Sen yangi texnologiyalarni birinchilardan bo'lib sinab ko'rasan va AI yordamida ishni 10 barobar tez bajarish yo'lini topasan.",
    salary: "12–30 mln", jobs: ["AI muhandis", "Prompt muhandis", "Avtomatlashtirish mutaxassisi"],
    courses: [["🤖", "Sun'iy intellekt vositalari bilan ishlash"], ["🧠", "Machine Learning asoslari"], ["⚙️", "No-code avtomatlashtirish"]],
  },
};

const LEADERBOARD = {
  viloyat: [
    ["🕌", "Xorazm viloyati", 16780, 2], ["🗼", "Toshkent shahri", 15320, 1], ["🏛️", "Samarqand viloyati", 14905, -1],
    ["🕌", "Buxoro viloyati", 13610, 1], ["🏯", "Andijon viloyati", 12880, 0], ["🌄", "Farg'ona viloyati", 12410, -2],
    ["🏞️", "Namangan viloyati", 11960, 0], ["⛰️", "Qashqadaryo viloyati", 10870, 1], ["🌾", "Surxondaryo viloyati", 10120, -1],
    ["🏜️", "Navoiy viloyati", 9640, 0], ["🌻", "Jizzax viloyati", 9010, 2], ["🌊", "Qoraqalpog'iston R.", 8770, -1],
    ["🌿", "Sirdaryo viloyati", 8125, 0], ["🏙️", "Toshkent viloyati", 7980, -1],
  ],
  maktab: [
    ["🏫", "Xiva sh. 3-IDUM", 2140, 3], ["🏫", "Toshkent, Prezident maktabi", 2085, 0], ["🏫", "Samarqand sh. 12-maktab", 1990, -1],
    ["🏫", "Buxoro sh. 21-maktab", 1870, 1], ["🏫", "Andijon sh. 5-IDUM", 1755, -2], ["🏫", "Urganch sh. 7-maktab", 1690, 0],
    ["🏫", "Namangan sh. 34-maktab", 1610, 1], ["🏫", "Qarshi sh. 2-IDUM", 1540, -1],
  ],
  otm: [
    ["🎓", "Urganch davlat universiteti", 5420, 1], ["🎓", "TATU", 5310, -1], ["🎓", "Samarqand davlat universiteti", 4980, 0],
    ["🎓", "Inha universiteti", 4720, 2], ["🎓", "O'zMU", 4615, -1], ["🎓", "Buxoro davlat universiteti", 4400, 0],
    ["🎓", "Westminster (WIUT)", 4180, -1], ["🎓", "Andijon davlat universiteti", 3950, 1],
  ],
};

const SOON = {
  kurslar: { e: "🎓", t: "Kurslar", d: "Ustoz AI kurslari shu yerda bo'ladi, internetsiz ko'rish uchun yuklab olish bilan.", items: ["📥 Offline paketlar: bir marta yuklab ol, internetsiz ko'r", "🤖 Kursdan so'ra: AI faqat dars materialidan javob beradi", "📜 Sertifikat va CV'ga avtomatik qo'shish"] },
  oyin: { e: "🎮", t: "Chorsu Run", d: "Chorsu bozorida yuguradigan o'yin: Damas va aravalardan qoch, non va samsa yig'.", items: ["🏃 Internetsiz ishlaydi", "❓ Yiqilsang, bitta savolga javob berib davom et", "🏆 Maktablar o'rtasida haftalik reyting va sovg'a"] },
  mutolaa: { e: "📖", t: "5 daqiqalik mutolaa", d: "Har kuni bitta kitob qisqachasi, foydali maqola va talabalar uchun yangiliklar.", items: ["⭐ Mashhur insonlarning haqiqiy hikoyalari", "📰 Grant, olimpiada va DTM yangiliklari", "📴 Hammasi internetsiz o'qiladi"] },
  chegirma: { e: "🏷️", t: "Talabalar chegirmalari", d: "Talabalar uchun 50 dan ortiq chegirma bir joyda.", items: ["🍔 Kafe va fastfud", "💻 Noutbuk va texnika, muddatli to'lov", "✈️ Aviachiptalar va poyezd chiptalari", "📶 Talaba internet paketlari"] },
  vositalar: { e: "🧰", t: "Talaba vositalari", d: "Har kuni kerak bo'ladigan foydali vositalar.", items: ["🧮 DTM ball kalkulyatori va OTM kirish ballari", "🇬🇧 IELTS ball kalkulyatori va AI speaking sherigi", "⏳ Imtihonlarga qolgan vaqt", "📄 CV yaratish: PDF va Word formatida", "🎓 Grant va stipendiyalar qidiruvi"] },
  kashf: { e: "🧭", t: "Kashf et", d: "O'qish yo'lingdagi har bir qadam uchun xizmatlar.", items: ["📝 IELTS / CEFR imtihoniga yozilish", "🌍 Xorijda o'qish bo'yicha maslahat", "✈️ Aviachipta va poyezd chiptalari", "💳 Talaba bank kartasi", "💼 IT Park va ish beruvchilar vakansiyalari"] },
};
