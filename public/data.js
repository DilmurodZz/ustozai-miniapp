// Demo data. Course names and contest results are samples until Ustoz AI sends the real lists.
// "i" / icon fields are names from the ICONS set in app.js.

// [name, points, change in rank]
const LEADERBOARD = {
  viloyat: [
    ["Xorazm viloyati", 16780, 2], ["Toshkent shahri", 15320, 1], ["Samarqand viloyati", 14905, -1],
    ["Buxoro viloyati", 13610, 1], ["Andijon viloyati", 12880, 0], ["Farg'ona viloyati", 12410, -2],
    ["Namangan viloyati", 11960, 0], ["Qashqadaryo viloyati", 10870, 1], ["Surxondaryo viloyati", 10120, -1],
    ["Navoiy viloyati", 9640, 0], ["Jizzax viloyati", 9010, 2], ["Qoraqalpog'iston R.", 8770, -1],
    ["Sirdaryo viloyati", 8125, 0], ["Toshkent viloyati", 7980, -1],
  ],
  maktab: [
    ["Xiva sh. 3-IDUM", 2140, 3], ["Toshkent, Prezident maktabi", 2085, 0], ["Samarqand sh. 12-maktab", 1990, -1],
    ["Buxoro sh. 21-maktab", 1870, 1], ["Andijon sh. 5-IDUM", 1755, -2], ["Urganch sh. 7-maktab", 1690, 0],
    ["Namangan sh. 34-maktab", 1610, 1], ["Qarshi sh. 2-IDUM", 1540, -1],
  ],
  otm: [
    ["Urganch davlat universiteti", 5420, 1], ["TATU", 5310, -1], ["Samarqand davlat universiteti", 4980, 0],
    ["Inha universiteti", 4720, 2], ["O'zMU", 4615, -1], ["Buxoro davlat universiteti", 4400, 0],
    ["Westminster (WIUT)", 4180, -1], ["Andijon davlat universiteti", 3950, 1],
  ],
};

const SOON = {
  kurslar: { i: "cap", t: "Kurslar", d: "Ustoz AI kurslari shu yerda bo'ladi, internetsiz ko'rish uchun yuklab olish bilan.", items: [["download", "Offline paketlar: bir marta yuklab oling, internetsiz ko'ring"], ["bot", "Kursdan so'rang: AI faqat dars materialidan javob beradi"], ["file", "Sertifikat va CV'ga avtomatik qo'shish"]] },
  mutolaa: { i: "book", t: "5 daqiqalik mutolaa", d: "Har kuni bitta kitob qisqachasi, foydali maqola va talabalar uchun yangiliklar.", items: [["star", "Mashhur insonlarning haqiqiy hikoyalari"], ["news", "Grant, olimpiada va DTM yangiliklari"], ["offline", "Hammasi internetsiz o'qiladi"]] },
  chegirma: { i: "tag", t: "Talabalar chegirmalari", d: "Talabalar uchun 50 dan ortiq chegirma bir joyda.", items: [["cup", "Kafe va fastfud"], ["laptop", "Noutbuk va texnika, muddatli to'lov"], ["plane", "Aviachiptalar va poyezd chiptalari"], ["wifi", "Talaba internet paketlari"]] },
  vositalar: { i: "grid", t: "Talaba vositalari", d: "Har kuni kerak bo'ladigan foydali vositalar.", items: [["calc", "DTM ball kalkulyatori va OTM kirish ballari"], ["mic", "IELTS ball kalkulyatori va AI speaking sherigi"], ["clock", "Imtihonlarga qolgan vaqt"], ["file", "CV yaratish: PDF va Word formatida"], ["cap", "Grant va stipendiyalar qidiruvi"]] },
  kashf: { i: "compass", t: "Kashf eting", d: "O'qish yo'lingizdagi har bir qadam uchun xizmatlar.", items: [["pen", "IELTS / CEFR imtihoniga yozilish"], ["globe", "Xorijda o'qish bo'yicha maslahat"], ["plane", "Aviachipta va poyezd chiptalari"], ["card", "Talaba bank kartasi"], ["briefcase", "IT Park va ish beruvchilar vakansiyalari"]] },
};
