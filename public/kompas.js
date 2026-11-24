// "Kasb Kompasi": a picture questionnaire that finds Ustoz AI courses ("Kasb Kompasi savolnomasi" and
// "Kasb Kompasi kurs tanlash qo'llanmasi", Nov 2026).
// 24 everyday situations with a photo (1-4 hands-on work, 5-8 analysis, 9-12 creative work, 13-16 people,
// 17-20 initiative and business, 21-24 records and planning). Answers A-E give 4-0 points; F ("not tried yet") is not scored.
// Then the goal (25, with the way of earning when it is "money" and the topic the student has in mind), the level (26),
// weekly time (27), device and equipment (28) and the budget (29).
// Course score = interest 65 + goal 25 + readiness 10, divided by the maximum of the parts that could be counted.
// Courses of a "Tanlov" row (languages, school subjects, sport...) get no number: they are shown when the topic fits.
const Compass = (() => {
  const VER = 2;
  const THEMES = {
    R: { name: "Qo'l bilan bajariladigan ishlar", icon: "tool", c: "#F2600C" },
    I: { name: "Tahlil va izlanish", icon: "chart", c: "#2748F5" },
    A: { name: "Ijod va dizayn", icon: "palette", c: "#7C3AED" },
    S: { name: "Odamlar bilan ishlash", icon: "users", c: "#0FB07F" },
    E: { name: "Tashabbus va biznes", icon: "rocket", c: "#E08A00" },
    C: { name: "Hisob va rejalashtirish", icon: "layers", c: "#0891B2" },
  };
  const QS = [
    {"q": "Oldingizda kichik robotning qismlari va tayyor rasmi bor. Rasmga qarab robotni yig'ib ko'rarmidingiz?", "o": ["Bajonidil. Bittasini yig'ib bo'lsam, boshqasini ham yig'gim kelardi.", "Ha, g'ildirak va boshqa qismlar qanday birikishini ko'rgim keladi.", "Betarafman. Yig'sam ham, tayyor robotni ko'rsam ham mayli.", "Unchalik emas. Mayda qismlarni biriktirishdan tez zerikaman.", "Yo'q, robot yig'ishga umuman qiziqmayman.", "Hali robot yig'ishni istaymanmi, bilmayman."]},
    {"q": "3D printer chizma asosida buyum yasaydi. Unda kichik o'yinchoq chiqarish sizga qanchalik qiziq?", "o": ["Juda qiziq. Bitta o'yinchoqdan keyin boshqa shakllarni ham sinab ko'rardim.", "Qiziq. Chizmadagi o'yinchoq qanday qilib haqiqiy buyumga aylanishini ko'rgim keladi.", "Betarafman. O'yinchoqni o'zim chiqarsam ham, tayyorini ko'rsam ham mayli.", "Unchalik qiziq emas. Printerni ishga tayyorlash meni zeriktiradi.", "3D printerda buyum yasashga umuman qiziqmayman.", "Hali aytishim qiyin. Avval 3D printer qanday ishlashini ko'rishim kerak."]},
    {"q": "Rangli ip va munchoqlardan o'zingizga bilaguzuk yasashga qanday qaraysiz?", "o": ["Jon deb yasardim. Bittasini tugatsam, keyingisiga yangi naqsh o'ylab topardim.", "Yoqtiraman. Rang tanlash va munchoqlarni terish maroqli.", "Betarafman. Bilaguzukni yasasam ham, tayyorini olsam ham mayli.", "Unchalik yoqtirmayman. Munchoqlarni bittalab terishdan zerikaman.", "Bilaguzuk yasashga umuman qiziqmayman.", "Hali munchoq terish menga yoqadimi, bilmayman."]},
    {"q": "Limon ko'chatini tuvakka qanday o'tqazishni ko'rdingiz. Keyingi ko'chatni o'zingiz o'tqazishni xohlaysizmi?", "o": ["Albatta. Tuvakni tayyorlashdan boshlab hammasini o'z qo'lim bilan qilgim keladi.", "Ha, ko'rganimni bitta ko'chatda sinab ko'rardim.", "Betarafman. Ko'chatni o'tqazsam ham, kuzatib tursam ham mayli.", "Unchalik emas. Tuproq bilan ishlash menga yoqmaydi.", "Yo'q, ko'chat o'tqazishga umuman qiziqmayman.", "Hali ayta olmayman. Ko'chat o'tqazib ko'rmaganman."]},
    {"q": "Do'konning bir oylik savdo jadvali qo'lingizda. Haftaning qaysi kunlari savdo ko'payganini o'zingiz topgingiz keladimi?", "o": ["Juda qiziq. Keyingi oyda ham shu hol takrorlanganmi, deb tekshirardim.", "Ha, kunlarni solishtirib, savdo qachon ko'payganini topardim.", "Betarafman. Jadvalni o'zim ko'rsam ham, natijasini eshitsam ham mayli.", "Unchalik emas. Har kungi raqamlarni solishtirishdan tez zerikaman.", "Yo'q, savdo raqamlarini o'rganishga umuman qiziqmayman.", "Hali aytishim qiyin. Savdo jadvali bilan ishlab ko'rmaganman."]},
    {"q": "Telefonda onlayn anketani to'ldirdingiz, lekin \"Yuborish\" tugmasi ishlamadi. Nega bunday bo'lganini o'zingiz tekshirib ko'rarmidingiz?", "o": ["Bajonidil. Sababini topguncha turli yo'llarni sinab ko'rardim.", "Ha, tugma nega ishlamaganini o'zim topgim keladi.", "Betarafman. Sababini o'zim topsam ham, birov aytib bersa ham mayli.", "Unchalik emas. Birma-bir tekshirib chiqish meni zeriktiradi.", "Yo'q, bunday xatoning sababini izlash menga umuman yoqmaydi.", "Hali bilmayman. Anketa yuborishda bunday xatoga duch kelmaganman."]},
    {"q": "Telegramda bitta eski surat haqida ikki xil gap yozilgan. Qaysi biri to'g'ri ekanini boshqa manbalardan surishtirish sizni qiziqtiradimi?", "o": ["Juda qiziqtiradi. Asl suratni topib, ikkala izohni ham tekshirardim.", "Ha, surat qachon va qayerda olinganini aniqlagim keladi.", "Betarafman. O'zim tekshirsam ham, javobini o'qisam ham mayli.", "Unchalik emas. Bir necha manbani solishtirish menga zerikarli.", "Yo'q, suratning tarixini surishtirishga umuman qiziqmayman.", "Hali ayta olmayman. Suratning tarixini izlab ko'rmaganman."]},
    {"q": "Telefon o'yinida yulduzchani bossangiz, bir ochko olasiz. Shunday o'yinni o'zingiz yasab ko'rarmidingiz?", "o": ["Juda xohlayman. O'yinni yasab, yulduzchani har bosganimda hisob oshishini sinardim.", "Ha, yulduzchani bosganda bitta ochko qo'shilishini sozlab ko'rardim.", "Betarafman. O'yinni yasab ko'rsam ham, tayyorini o'ynasam ham mayli.", "Unchalik emas. Menga o'yinni yasashdan ko'ra o'ynash qiziqroq.", "Yo'q, telefon o'yini yasashga umuman qiziqmayman.", "Hali o'yin yasashni xohlaymanmi, bilmayman."]},
    {"q": "Mahallangizdagi bir kun haqida qisqa video kerak. Qiziq lahzalarni telefoningizda o'zingiz tasvirga olarmidingiz?", "o": ["Bajonidil. Bir kunni bir nechta kadr bilan hikoya qilish menga juda yoqadi.", "Ha, mahallamdagi qiziq lahzalarni videoga olgim keladi.", "Betarafman. Tasvirga olsam ham, tomosha qilsam ham mayli.", "Unchalik emas. Nimalarni videoga olishni tanlash meni uncha qiziqtirmaydi.", "Yo'q, telefonda video olishga umuman qiziqmayman.", "Hali ayta olmayman. Mahallam haqida video olib ko'rmaganman."]},
    {"q": "Yangi kitob do'koni ochilyapti. Uning reklamasi uchun esda qoladigan bir jumla o'ylab topishga nima deysiz?", "o": ["Zo'r bo'lardi. Bir nechta jumla yozib, eng esda qoladiganini tanlardim.", "Ha, odamni kitobga qiziqtiradigan so'zlarni izlab ko'rardim.", "Betarafman. Jumlani o'zim yozsam ham, boshqa kishi yozsa ham mayli.", "Unchalik xohlamayman. Bitta jumla uchun so'z qidirish meni zeriktiradi.", "Reklama matnini yozishga umuman qiziqmayman.", "Hali bilmayman. Reklama uchun jumla o'ylab ko'rmaganman."]},
    {"q": "Onlayn do'konning telefon uchun sahifasini chizyapsiz. \"Buyurtma berish\" tugmasi qayerda osonroq topilishini sinab ko'rarmidingiz?", "o": ["Juda yoqadi. Ikki xil ko'rinish chizib, qaysi birida tugma oson topilishini sinardim.", "Ha, tugma darrov ko'zga tashlanadigan joyni topib ko'rardim.", "Betarafman. Joyini o'zim tanlasam ham, tayyor ko'rinishni olsam ham mayli.", "Unchalik emas. Tugmani turli joylarga qo'yib ko'rish meni zeriktiradi.", "Yo'q, ekrandagi tugma qayerda turishini tanlashga umuman qiziqmayman.", "Hali ayta olmayman. Bunday sahifani chizib ko'rmaganman."]},
    {"q": "Bolalar kitobiga yangi qahramon kerak. Uning qanday ko'rinishini o'ylab topishni xohlaysizmi?", "o": ["Juda xohlayman. Bir qahramonning o'zini bir nechta qiyofada tasavvur qilardim.", "Ha, uning kiyimi va yuz ifodasini o'ylab topardim.", "Betarafman. O'zim o'ylab topsam ham, tayyor qahramonni olsam ham mayli.", "Unchalik emas. Qahramonning qiyofasini tasavvur qilish meni uncha qiziqtirmaydi.", "Yo'q, yangi qahramon o'ylab topishga umuman qiziqmayman.", "Hali kitob qahramonini o'ylab topish menga qiziqmi, bilmayman."]},
    {"q": "Do'stingiz chegirma qanday hisoblanishini tushunmadi. Bitta buyum narxini misol qilib tushuntirish sizga qanday tuyuladi?", "o": ["Juda maroqli. Bir misol tushunarsiz bo'lsa, boshqasini topib berardim.", "Yoqimli ish. Do'stimga tushunarli misol topishga qiziqaman.", "Betarafman. So'rasa, bitta misol ko'rsatib berishim mumkin.", "Unchalik maroqli emas. Misol izlashdan ko'ra javobini ayta qolardim.", "Hisobni birovga tushuntirish menga umuman yoqmaydi.", "Hali ayta olmayman. Birovga chegirmani tushuntirib ko'rmaganman."]},
    {"q": "Yangi hamkasbingiz jadvalga birinchi buyurtmasini kirityapti. Unga birinchi qatorni qanday to'ldirishni ko'rsatish sizga yoqadimi?", "o": ["Juda yoqadi. Keyingi buyurtmani o'zi kirita olguncha birga mashq qilardim.", "Ha, birinchi buyurtmani birga kiritib ko'rsatish menga yoqadi.", "Betarafman. Kerak bo'lsa, qaysi katakka nima yozilishini ko'rsataman.", "Unchalik emas. Har bir qadamni tushuntirish meni zeriktiradi.", "Yo'q, jadval to'ldirishni birovga o'rgatishga umuman qiziqmayman.", "Hali bilmayman. Birovga jadval to'ldirishni o'rgatmaganman."]},
    {"q": "Mehmon bilan eski shaharni aylanyapsiz. Tarixiy bino oldida to'xtab, unga shu joy haqida aytib bergingiz keladimi?", "o": ["Juda xohlayman. Shu binoga bog'liq qiziq bir hikoyani ham aytib berardim.", "Ha, mehmonga bu joy haqida bilganlarimni aytib berardim.", "Betarafman. Binoni men tanishtirsam ham, boshqasi tanishtirsa ham mayli.", "Unchalik emas. Sayrda joylarni tanishtirib yurishni xush ko'rmayman.", "Yo'q, mehmonlarga joy tanishtirishga umuman qiziqmayman.", "Hali aytishim qiyin. Mehmonga tarixiy joyni tanishtirmaganman."]},
    {"q": "Bir oila qayerda dam olishni hal qilolmayapti. Ularning istagini tinglab, mos sayohat topib berishga qanday qaraysiz?", "o": ["Juda maroqli ish. Har biriga nima muhimligini bilib, shunga mos joy izlardim.", "Yaxshi fikr. Oila xohlagan sayohatni topib berish menga yoqadi.", "Betarafman. So'rashsa, bilgan joylarimdan birini aytishim mumkin.", "Unchalik xohlamayman. Turli istaklarga mos joy izlash meni zeriktiradi.", "Boshqalarga sayohat tanlab berishga umuman qiziqmayman.", "Hali ayta olmayman. Birovga sayohat tanlab bermaganman."]},
    {"q": "Mahallada kitob almashish burchagi ochilsa, qo'shnilarni qatnashishga o'zingiz taklif qilarmidingiz?", "o": ["Albatta. Odamlarni qiziqtirib, birinchi ishtirokchilarni o'zim topgim keladi.", "Ha, qo'shnilarga bu g'oya nima uchun foydali ekanini aytib berardim.", "Betarafman. Taklifni o'zim aytsam ham, boshqa kishi aytsa ham mayli.", "Unchalik emas. Odamlarni qatnashishga undash menga uncha yoqmaydi.", "Yo'q, odamlarni biror tashabbusga jalb qilishga umuman qiziqmayman.", "Hali bilmayman. Qo'shnilarni bunday ishga taklif qilmaganman."]},
    {"q": "Pishirgan shirinliklaringizni sotmoqchisiz. Birinchi xaridorni qayerdan topishni rejalashtirish sizga qanchalik qiziq?", "o": ["Juda qiziq. Birinchi buyurtmani olishning bir nechta yo'lini o'ylab ko'rardim.", "Qiziq. Shirinliklarimni avval kimga taklif qilishni rejalashtirardim.", "Betarafman. Rejani o'zim tuzsam ham, tayyorini olsam ham mayli.", "Unchalik qiziq emas. Xaridor izlash rejasini tuzish meni tez zeriktiradi.", "Savdoni qanday boshlashni o'ylashga umuman qiziqmayman.", "Hali xaridor izlashni istaymanmi, bilmayman."]},
    {"q": "Sport sumkasi uchun Instagram reklamasi tayyor. Uni kimlarga ko'rsatishni o'zingiz tanlashni istaysizmi?", "o": ["Juda istayman. Bir nechta xaridor guruhini solishtirib, mosini tanlardim.", "Ha, bu sumka kimga kerak bo'lishini o'ylab ko'rardim.", "Betarafman. Reklama kimga chiqishini men tanlasam ham, boshqasi tanlasa ham mayli.", "Unchalik emas. Sumkaga kim qiziqishini o'ylash meni uncha qiziqtirmaydi.", "Yo'q, reklama kimga ko'rsatilishini tanlashga umuman qiziqmayman.", "Hali ayta olmayman. Reklama kimlarga chiqishini tanlamaganman."]},
    {"q": "Uch kishi bo'lib yarmarka tayyorlayapsiz. \"Kim qaysi ishni oladi?\" deb suhbatni o'zingiz boshlab berarmidingiz?", "o": ["Bajonidil. Hamma o'ziga mos ish olishi uchun vazifalarni birga taqsimlardim.", "Ha, kim nima qilishini kelishib olish menga yoqadi.", "Betarafman. Ishni men taqsimlasam ham, boshqasi taqsimlasa ham mayli.", "Unchalik emas. O'zimga bitta vazifa olib ishlashni afzal ko'raman.", "Yo'q, jamoada ish taqsimlashga umuman qiziqmayman.", "Hali aytishim qiyin. Jamoada ish taqsimlab ko'rmaganman."]},
    {"q": "Onlayn do'konga buyurtmalar keldi. Har birini xaridor, mahsulot va sana bo'yicha jadvalga yozib borishga qanday qaraysiz?", "o": ["Juda yoqtiraman. Kerakli buyurtma osongina topiladigan jadval yuritish menga maroqli.", "Yoqtiraman. Har bir buyurtmani o'z qatoriga yozib borardim.", "Betarafman. Kerak bo'lsa, buyurtmalarni yozib chiqaman.", "Unchalik yoqtirmayman. Qatorlarni ketma-ket to'ldirishdan tez zerikaman.", "Buyurtmalarni jadvalga kiritishga umuman qiziqmayman.", "Hali buyurtmalarni yozib borish menga yoqadimi, bilmayman."]},
    {"q": "Mehmonxona xonasini tayyorlayapsiz. Sochiq, sovun va boshqa narsalarni ro'yxat bo'yicha tekshirish sizga qanday tuyuladi?", "o": ["Juda maroqli. Oxirgi bandgacha tekshirib, nima yetishmayotganini topishni yoqtiraman.", "Yoqimli ish. Hamma narsa joyidaligini birma-bir tekshirardim.", "Betarafman. Kerak bo'lsa, ro'yxatni ko'rib chiqaman.", "Unchalik maroqli emas. Har bir narsani alohida belgilash meni zeriktiradi.", "Ro'yxat bo'yicha tekshirishni umuman yoqtirmayman.", "Hali ayta olmayman. Xonani ro'yxat bo'yicha tekshirmaganman."]},
    {"q": "Bugun uchta manzilga buyurtma eltish kerak. Qaysi manzilga qachon borishni oldindan rejalashni istaysizmi?", "o": ["Juda istayman. Yo'lga ketadigan vaqtni ham hisoblab, jadval tuzardim.", "Ha, har bir manzilga qulay vaqt belgilash menga yoqadi.", "Betarafman. Jadvalni tuzsam ham, tayyor jadvalni olsam ham mayli.", "Unchalik emas. Vaqtlarni bir-biriga moslash meni zeriktiradi.", "Yo'q, yetkazib berish vaqtini rejalashga umuman qiziqmayman.", "Hali bilmayman. Bir nechta manzilga borishni rejalab ko'rmaganman."]},
    {"q": "Yarmarkadan keyin bir nechta chek qoldi. \"Jami qancha pul sarfladik?\" degan savolga cheklar orqali javob topish sizga yoqadimi?", "o": ["Juda yoqadi. Har bir chekni hisobga olib, jami to'g'ri chiqqanini tekshirardim.", "Ha, xarajatlarni qo'shib, aniq summani chiqarish menga yoqadi.", "Betarafman. Kerak bo'lsa, jami qancha ketganini hisoblayman.", "Unchalik emas. Chekdagi summalarni jamlashdan tez zerikaman.", "Yo'q, xarajatlar hisobini chiqarishni umuman yoqtirmayman.", "Hali ayta olmayman. Cheklarni yig'ib, xarajatni hisoblamaganman."]}
  ];
  // a few words for each situation, used to explain a recommendation
  const SHORT = ["robot yig'ish", "3D printerda buyum yasash", "bilaguzuk yasash", "ko'chat o'tqazish", "savdo jadvalini tahlil qilish",
    "xatoning sababini topish", "ma'lumotni manbalardan tekshirish", "telefon o'yini yasash", "video olish", "reklama jumlasini yozish",
    "sahifada tugmani qulay joylash", "kitob qahramonini o'ylab topish", "hisobni tushuntirish", "hamkasbga ish o'rgatish",
    "mehmonga joy tanishtirish", "sayohat tanlab berish", "odamlarni tashabbusga chorlash", "birinchi xaridorni topish",
    "reklama kimga chiqishini tanlash", "jamoada ish taqsimlash", "buyurtmalar jadvalini yuritish", "ro'yxat bo'yicha tekshirish",
    "yetkazib berishni rejalash", "xarajatlarni hisoblash"];
  const themeOf = (i) => "RIASEC"[Math.floor(i / 4)];
  const NQ = QS.length;   // 24

  // the practical steps; "sub" steps belong to the question number before them
  const FIT = [
    { k: "goal", n: 25, img: 25, q: "Kursdan keyin birinchi navbatda qanday natijaga erishmoqchisiz?", o: ["Biror kasb o'rganib, o'zim pul topishni boshlamoqchiman.", "Tanlagan kasbim uchun aniq bir ko'nikma o'rganmoqchiman.", "Ishga kirish uchun rezyume yozish va suhbatga tayyorlanishni mashq qilmoqchiman.", "O'z biznesimni boshlamoqchiman yoki uni rivojlantirmoqchiman.", "Hozirgi ishimda murakkabroq vazifalarni bajara olmoqchiman.", "Til o'rganmoqchiman yoki imtihonga tayyorlanmoqchiman.", "Bo'sh vaqtimda o'zimga yoqadigan mashg'ulot bilan shug'ullanmoqchiman.", "Hali aniq maqsad tanlamadim."], v: "ABCDEFGH", icons: ["coin", "zap", "briefcase", "rocket", "trend", "cap", "palette", "compass"] },
    { k: "earn", n: 25, sub: 1, when: (f) => f.goal === "A", q: "Qaysi yo'l bilan pul topishni xohlaysiz?",
      o: ["Buyurtma olib, mijozga xizmat ko'rsatish.", "Ishga kirib, maosh olish.", "Mahsulot sotish.", "Hali qaysi yo'lni tanlashni bilmayman."], v: "ABCD", icons: ["users", "briefcase", "coin", "compass"] },
    { k: "topic", n: 25, sub: 1, input: 1, q: "Qaysi mavzuni o'rganmoqchisiz?", hint: "Masalan, \"telefonda video olish\", \"IELTS Reading\" yoki \"7-sinf algebra\" deb yozishingiz mumkin." },
    { k: "cert", n: 25, sub: 1, q: "Kursni tugatganlik sertifikati sizga kerakmi?", o: ["Kerak", "Shart emas", "Hali bilmayman"], v: "ABC", icons: ["star", "check", "compass"] },
    { k: "level", n: 26, img: 26, q: "Siz tanlagan ishni hozir qay darajada mustaqil bajara olasiz?", hint: "Javobni o'rganmoqchi bo'lgan mavzu uchun bering. Mavzu hali aniq bo'lmasa, E ni belgilang.", o: ["Murakkab vazifani ham o'zim bajara olaman. Chuqurroq o'rganmoqchiman.", "Oddiy vazifani o'zim bajaraman. Murakkabida yordam kerak.", "Kimdir ko'rsatsa, oddiy mashqni takrorlay olaman.", "Endi boshlayman. Hali sinab ko'rmaganman.", "Darajamni hozircha ayta olmayman."], v: "ABCDE", icons: ["star", "check", "book", "play", "compass"] },
    { k: "time", n: 27, img: 27, q: "Bir haftada dars va mashqlarga qancha vaqt ajrata olasiz?", o: ["8 soat yoki undan ko'p.", "Kamida 5 soat, lekin 8 soatdan kam.", "Kamida 2 soat, lekin 5 soatdan kam.", "Ozgina vaqt topaman, lekin haftasiga 2 soatga yetmaydi.", "Hozircha o'qishga vaqt ajrata olmayman.", "Haftadan haftaga o'zgaradi. Hali aniq ayta olmayman."], v: "ABCDEF", icons: ["clock", "clock", "clock", "clock", "x", "compass"] },
    { k: "device", n: 28, img: 28, q: "Darsni ko'rish va mashq qilish uchun qaysi qurilmadan foydalana olasiz?", hint: "Maktabda, ishda yoki kutubxonada muntazam foydalana oladigan qurilmangizni ham hisobga oling.", o: ["Mobil qurilmadan ham, kompyuterdan ham.", "Faqat telefon yoki planshetdan.", "Faqat kompyuter yoki noutbukdan.", "Hozircha bu qurilmalarning hech biridan foydalana olmayman.", "Qaysi qurilmadan foydalana olishimni hali bilmayman."], v: "ABCDE", icons: ["layers", "phone", "laptop", "x", "compass"] },
    { k: "kit", n: 28, sub: 1, q: "Mashq uchun alohida jihoz kerak bo'lsa, undan foydalana olasizmi?", hint: "Masalan, limon ko'chati, robot qismlari yoki 3D printer.",
      o: ["Bor yoki olib tura olaman", "Hozircha yo'q", "Hali bilmayman"], v: "ABC", icons: ["tool", "x", "compass"] },
    { k: "budget", n: 29, img: 29, q: "Bitta kurs uchun eng ko'pi qancha to'lay olasiz?", o: ["Hozir faqat bepul kurs tanlayman.", "Eng ko'pi ma'lum summagacha to'lay olaman.", "Hozircha narx bo'yicha chegara qo'ymayman.", "Hali bilmayman. Avval kurslarning narxini ko'rmoqchiman."], v: "ABCD", icons: ["gift", "coin", "check", "compass"] },
  ];
  const NSHOW = 29;

  /* ---------- the courses: one row of the guide per course type ---------- */
  // th: the theme of the row and its two anchor questions (1-based); "T" = Tanlov (shown only for a matching topic)
  // g: the goals (25 B-G) the row serves; dev: "pc" needs a computer, "kit" needs equipment, "any" works on a phone
  // m: matched against the course title (lower case, without apostrophes)
  const ROWS = [
    { k: "video", name: "Videomontaj va animatsiya", kw: "video montaj animatsiya", th: "A", q: [9, 12], g: "BEG", dev: "pc", m: /videomontaj|video yasash|after effects/ },
    { k: "aicontent", name: "AI bilan kontent yaratish", th: "A", q: [9, 12], g: "BEG", dev: "any", m: /ai content/ },
    { k: "web", name: "Sayt yaratish", kw: "sayt veb dasturlash", th: "I", q: [6, 11], g: "BDEG", dev: "pc", m: /lovable|html express|sayt|yosh dasturchi/ },
    { k: "data", name: "Ma'lumotlar tahlili", kw: "tahlil analitika", th: "I", q: [5, 24], g: "BE", dev: "pc", m: /data analitika/ },
    { k: "agent", name: "AI agentlari va avtomatlashtirish", th: "I", q: [8, 21], g: "BDE", dev: "pc", m: /ai agent|avtomatiz|make\.c/ },
    { k: "pcl", name: "Kompyuter savodxonligi", th: "I", q: [6, 21], g: "BE", dev: "pc", m: /kompyuter/ },
    { k: "sql", name: "Ma'lumotlar bazasi", th: "I", q: [5, 21], g: "BE", dev: "pc", m: /postgres/ },
    { k: "py", name: "Python dasturlash", kw: "dasturlash kod", th: "I", q: [6, 8], g: "BE", dev: "pc", m: /python/ },
    { k: "cpp", name: "C++ dasturlash", kw: "dasturlash kod", th: "I", q: [6, 8], g: "BE", dev: "pc", m: /c\+\+/ },
    { k: "aidev", name: "AI yordamida kod yozish", kw: "dasturlash kod", th: "I", q: [6, 8], g: "BE", dev: "pc", m: /cursor/ },
    { k: "mob", name: "Mobil ilova yaratish", kw: "ilova dasturlash", th: "I", q: [6, 8], g: "BE", dev: "pc", m: /mobil ilova/ },
    { k: "bot", name: "Telegram bot yaratish", th: "I", q: [6, 8], g: "BE", dev: "pc", m: /telegram bot/ },
    { k: "game", name: "O'yin yaratish", kw: "oyin", th: "I", q: [8, 12], g: "BG", dev: "pc", m: /unity|game ?dev/ },
    { k: "aitools", name: "Sun'iy intellekt vositalari", kw: "suniy intellekt ai", th: "T", g: "BDEG", dev: "any", m: /telefondan daromad|suniy intellekt|neyrotarmoq/ },
    { k: "design", name: "Grafik dizayn", kw: "logotip dizayn", th: "A", q: [11, 12], g: "BEG", dev: "any", m: /grafik dizayn|boshlangich dizayn/ },
    { k: "ux", name: "UX/UI va veb dizayn", th: "A", q: [6, 11], g: "BE", dev: "pc", m: /veb dizayn|ux\/ui/ },
    { k: "mobilo", name: "Mobilografiya", kw: "telefon video olish suratga kadr", th: "A", q: [9, 12], g: "BEG", dev: "any", m: /mobilograf/ },
    { k: "illus", name: "Rasm va illyustratsiya", kw: "rasm chizish", th: "A", q: [3, 12], g: "BEG", dev: "any", m: /illyustrat|illustrat|rasm\.uz/ },
    { k: "copy", name: "Kopirayting va ssenariy", kw: "matn yozish reklama", th: "A", q: [10, 19], g: "BEG", dev: "any", m: /kopirayting/ },
    { k: "pr", name: "PR va brend", th: "E", q: [10, 17], g: "BDE", dev: "any", m: /pr strateg/ },
    { k: "target", name: "Targeting va onlayn reklama", kw: "reklama", th: "E", q: [5, 19], g: "BDE", dev: "any", m: /targeting|telegram reklama/ },
    { k: "smm", name: "SMM va kontent", kw: "instagram blog bloger youtube kontent", th: "A", q: [9, 19], g: "BDEG", dev: "any", m: /blogerlik|you ?tube/ },
    { k: "media", name: "Mediasavodxonlik", th: "I", q: [7, 13], g: "BEG", dev: "any", m: /mediasavod/ },
    { k: "arch", name: "Arxitektura va interyer", th: "T", g: "BEG", dev: "pc", m: /arxitektura/ },
    { k: "stylist", name: "Stilist", th: "T", g: "BEG", dev: "any", m: /stilist/ },
    { k: "creator", name: "Ustoz AI ijodkori", th: "S", q: [9, 14], g: "BDE", dev: "any", m: /ijodkorlar/ },
    { k: "acc", name: "Buxgalteriya va 1C", kw: "buxgalter hisob soliq", th: "C", q: [21, 24], g: "BDE", dev: "pc", m: /buxgalteriya/ },
    { k: "excel", name: "Excel va elektron jadvallar", kw: "jadval formula hisob", th: "C", q: [5, 24], g: "BE", dev: "pc", m: /excel/ },
    { k: "pitch", name: "Biznes taqdimoti", th: "E", q: [10, 17], g: "DE", dev: "any", m: /pitching|upakovka/ },
    { k: "bizopt", name: "Biznesni rivojlantirish", th: "E", q: [18, 24], g: "DE", dev: "any", m: /optimallashtir/ },
    { k: "biz", name: "Tadbirkorlik va biznes", kw: "biznes", th: "E", q: [17, 18], g: "BDE", dev: "any", m: /startap|tadbirkorlik|oquv markazi/ },
    { k: "free", name: "Frilans va masofaviy ish", kw: "frilans mijoz", th: "E", q: [16, 18], g: "BDE", dev: "any", m: /frilans/ },
    { k: "mp", name: "Marketpleyslarda savdo", kw: "savdo onlayn sotish marketpleys", th: "E", q: [18, 19], g: "BDE", dev: "any", m: /uzum|ebay|yandex market/ },
    { k: "hr", name: "HR va kadrlar", th: "S", q: [14, 20], g: "BE", dev: "any", m: /hr menejment/ },
    { k: "speech", name: "Nutq texnikasi", th: "S", q: [13, 17], g: "BEG", dev: "any", m: /nutq/ },
    { k: "hotel", name: "Mehmonxona va resepshn", kw: "mehmonxona", th: "S", q: [15, 22], g: "BE", dev: "any", m: /reception|mehmonxona/ },
    { k: "tour", name: "Turagent", kw: "sayohat turizm", th: "S", q: [16, 23], g: "BDE", dev: "any", m: /tur agent/ },
    { k: "guide", name: "Gidlik", kw: "gid sayohat turizm", th: "S", q: [13, 15], g: "BE", dev: "any", m: /\bgid\b/ },
    { k: "log", name: "Xalqaro logistika", th: "C", q: [21, 23], g: "BE", dev: "any", m: /logist/ },
    { k: "career", name: "Ish topish va karyera", kw: "rezyume ish suhbat", th: "T", g: "CE", dev: "any", m: /karyera|ish topish/ },
    { k: "talaba", name: "O'qishni rejalash", th: "T", g: "EG", dev: "any", m: /talaba 2/ },
    { k: "robot", name: "Robototexnika va elektronika", kw: "robot", th: "R", q: [1, 8], g: "BG", dev: "kit", m: /elektronika|lego/ },
    { k: "p3d", name: "3D printer", kw: "3d printer", th: "R", q: [1, 2], g: "BEG", dev: "kit", m: /3d printer/ },
    { k: "lemon", name: "Limonchilik va bog'dorchilik", kw: "limon bog", th: "R", q: [4, 22], g: "BDEG", dev: "kit", m: /limonchilik/ },
    { k: "craft", name: "Qo'l mehnati", kw: "qol mehnati gul", th: "R", q: [3, 12], g: "BDG", dev: "kit", m: /sinel|toquvchilik|bilaguzuk|origami|solimaydigan/ },
    { k: "drive", name: "Haydovchilik", kw: "mashina avtomobil haydash", th: "T", g: "BFG", dev: "kit", m: /haydovchilik/ },
    { k: "cook", name: "Oshpazlik", kw: "oshpaz taom ovqat", th: "T", g: "BDG", dev: "kit", m: /kitchen/ },
    { k: "sport", name: "Sport", kw: "sport", th: "T", g: "G", dev: "any", m: /futbol/ },
    { k: "fun", name: "Ijod va hobbi", th: "T", g: "G", dev: "any", m: /minicraft|sher yozish|qr-kod/ },
    { k: "en", name: "Ingliz tili va IELTS", kw: "ingliz english", th: "T", g: "F", dev: "any", m: /ielts/ },
    { k: "lang", name: "Rus, turk va arab tillari", kw: "rus turk arab til", th: "T", g: "F", dev: "any", m: /rus tili|turkce|türkçe|arab tili/ },
    { k: "uz", name: "O'zbek tili", kw: "ozbek til", th: "T", g: "F", dev: "any", m: /milliy sertifikat/ },
    { k: "school", name: "Maktab fanlari va imtihonlar", kw: "matematika sinf imtihon", th: "T", g: "F", dev: "any", m: /\bsat\b|geometriya|algebra|matematika|ona tili|adabiyot/ },
    { k: "sci", name: "Tabiiy fanlar va tarix", kw: "biologiya tarix geografiya", th: "T", g: "FG", dev: "any", m: /biologiya|tarix|history|amir temur|geografiya/ },
    { k: "med", name: "Tibbiyot bilimlari", th: "T", g: "BEG", dev: "any", m: /allergiya|anatomiya/ },
    { k: "trade", name: "Trading", th: "T", g: "BG", dev: "any", m: /trading/ },
  ];
  const fold = (s) => String(s || "").toLowerCase().replace(/[‘’ʻʼ`'"]/g, "");
  const cost = (c) => Number(c.price) || 0;
  const BEGIN = /bepul|boshlang|0 ?dan|noldan|express|tezroq boshlang|asos/i;
  let courses = null;
  function catalog() {
    if (courses) return courses;
    const d = typeof Kurslar !== "undefined" && Kurslar.data();
    if (!d) return null;
    courses = d.courses.map((c) => ({ ...c, row: ROWS.find((r) => r.m.test(fold(c.title))), begin: BEGIN.test(c.title) || cost(c) === 0 }))
      .filter((c) => c.row && (c.lessons || 0) >= 1);
    return courses;
  }
  // a course with real material: at least 3 lessons and 10 minutes of video
  const solid = (c) => (c.lessons || 0) >= 3 && (c.sec || 0) >= 600;

  /* ---------- scoring ---------- */
  const pts = (v) => typeof v === "number" ? v : null;   // A-E are stored as 4-0, F as "n"
  const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function profile(a) {
    const p = {}, cnt = {};
    for (const t of "RIASEC") {
      const v = [0, 1, 2, 3].map((k) => pts(a["RIASEC".indexOf(t) * 4 + k])).filter((x) => x !== null);
      cnt[t] = v.length; p[t] = v.length ? mean(v) * 25 : 0;
    }
    return { p, cnt, answered: Object.values(cnt).reduce((s, x) => s + x, 0) };
  }
  // the goal letter a course row must carry; null = this part is not counted
  function goalLetter(f) {
    if ("BCDEFG".includes(f.goal || "x")) return f.goal;
    if (f.goal === "A") return f.earn === "A" || f.earn === "B" ? "B" : f.earn === "C" ? "D" : null;
    return null;
  }
  const LV = { A: 2, B: 1, C: 0, D: 0 };
  function scoreCourse(c, a, f) {
    const row = c.row; let interest = null, themeAvg = null, anchorAvg = null;
    if (row.th !== "T") {
      const t = "RIASEC".indexOf(row.th);
      const th = [0, 1, 2, 3].map((k) => pts(a[t * 4 + k])).filter((x) => x !== null);
      const an = row.q.map((n) => pts(a[n - 1])).filter((x) => x !== null);
      themeAvg = th.length >= 2 ? mean(th) : null; anchorAvg = an.length ? mean(an) : null;
      if (themeAvg !== null && anchorAvg !== null) interest = (themeAvg + anchorAvg) / 8 * 65;
    }
    const gl = goalLetter(f);
    const goal = gl === null ? null : (row.g.includes(gl) || (f.goal === "A" && f.earn === "A" && row.k === "free")) ? 25 : 0;
    const fac = [];
    if (LV[f.level] !== undefined) { const d = Math.abs(LV[f.level] - (c.begin ? 0 : 1)); fac.push(d === 0 ? 1 : d === 1 ? .5 : 0); }
    if (row.dev === "kit") { if (f.kit === "A") fac.push(1); }
    else if (f.device && f.device !== "E") fac.push(f.device === "D" ? 0 : row.dev === "pc" ? (f.device === "B" ? 0 : 1) : 1);
    const ready = fac.length ? mean(fac) * 10 : null;
    const score = interest === null ? null : (interest + (goal || 0) + (ready || 0)) / (65 + (goal === null ? 0 : 25) + (ready === null ? 0 : 10)) * 100;
    return { c, score, interest, goal, ready, themeAvg, anchorAvg };
  }
  const budgetOk = (c, f) => f.budget === "A" ? cost(c) === 0 : f.budget === "B" && Number(f.sum) > 0 ? cost(c) <= Number(f.sum) : true;
  // courses the student can take part in: equipment they said they do not have, or a computer when they have only a phone, leave the list
  const usable = (c, f) => !(c.row.dev === "kit" && f.kit === "B") && !(c.row.dev === "pc" && f.device === "B");
  function topicHits(c, topic) {
    // words that every course title has ("tili", "kursi"...) say nothing about the topic
    const STOP = /^(tili|til|tilini|kurs|kursi|kurslar|uchun|bilan|organish|organmoq|darslari|dars|qilish|yangi|boshlab|yaratish|yasash|asoslari|boshlash|noldan)$/;
    const words = fold(topic).split(/[^a-z0-9+Ѐ-ӿ-]+/).filter((w) => w.length >= 3 && !STOP.test(w));
    if (!words.length) return 0;
    // a word in the course title counts fully, a word only in the course type's name or keywords counts 0.6
    const title = fold(c.title), more = fold(c.row.name) + " " + (c.row.kw || "");
    return words.reduce((s, w) => { const x = w.length > 5 ? w.slice(0, 5) : w; return s + (title.includes(x) ? 1 : more.includes(x) ? .6 : 0); }, 0) / words.length;
  }
  function recommend(st, skip = 0) {
    const raw = catalog(); if (!raw) return null;
    const f = st.f, all = raw.filter((c) => usable(c, f)).map((c) => scoreCourse(c, st.a, f));
    const ok = all.filter((r) => budgetOk(r.c, f));
    // 1) the topic the student wrote, 2) the direct goal (C: ish topish), 3) the highest score
    const topic = (f.topic || "").trim();
    let byTopic = topic ? ok.map((r) => ({ ...r, hit: topicHits(r.c, topic) })).filter((r) => r.hit >= .3).sort((x, y) => y.hit - x.hit || (y.score || 0) - (x.score || 0) || solid(y.c) - solid(x.c)) : [];
    const byGoal = f.goal === "C" ? ok.filter((r) => r.c.row.k === "career" && solid(r.c)) : [];
    const ranked = ok.filter((r) => r.score !== null && solid(r.c)).sort((x, y) => y.score - x.score || cost(x.c) - cost(y.c));
    const seen = new Set(); let picks = [];
    for (let page = 0; page <= skip; page++) {
      picks = []; const used = new Set();
      const take = (r, why) => { if (r && !used.has(r.c.row.k) && !seen.has(r.c.row.k) && picks.length < 3) { picks.push({ ...r, why }); used.add(r.c.row.k); } };
      byTopic.forEach((r) => take(r, "topic"));
      byGoal.forEach((r) => take(r, "goal"));
      // the best score, then one led by another theme where there is one, then the next best
      const free = () => ranked.filter((r) => !used.has(r.c.row.k) && !seen.has(r.c.row.k));
      take(free()[0], "score");
      take(free().find((r) => !picks.some((p) => p.c.row.th === r.c.row.th)), "score");
      free().forEach((r) => take(r, "score"));
      picks.forEach((p) => seen.add(p.c.row.k));
    }
    const best = all.filter((r) => r.score !== null && solid(r.c)).sort((x, y) => y.score - x.score)[0];
    const hidden = !skip && best && !budgetOk(best.c, f) && (!picks[0] || picks[0].score === null || best.score - picks[0].score > 6) ? best : null;
    const prof = profile(st.a), top = Object.entries(prof.p).sort((x, y) => y[1] - x[1]);
    return { picks, prof, top, hidden, weak: prof.answered < 12 || !ranked.length };
  }
  const pct = (r) => Math.round(r.score);

  /* ---------- state ---------- */
  const fresh = () => ({ v: VER, a: {}, f: {}, step: -1 });
  let st = store.get("kp_state", null);
  if (!st || st.v !== VER) st = fresh();
  const save = () => store.set("kp_state", st);
  // the steps: 24 situations, then the practical questions that apply to this student
  const steps = () => [...QS.map((_, i) => ({ t: "q", i })), ...FIT.filter((x) => !x.when || x.when(st.f)).map((x) => ({ t: "f", x }))];

  /* ---------- screens ---------- */
  function Intro() {
    const going = st.step >= 0 && st.step < steps().length;
    return `${navbar(T("Kasb Kompasi"))}
    <div class="kp-intro">
      <img class="kp-art" src="img/kompas-start.webp" alt="" decoding="async">
      <h2>${T("Sizga qaysi kurs mos?")}</h2>
      <p>${T("Har bir rasmda bir vaziyat tasvirlangan. Savolni o'qib, o'zingizga eng yaqin bitta javobni belgilang. Ishni hali qilmagan bo'lsangiz ham, uni sinab ko'rish istagingizga qarab javob bering.")}</p>
      <div class="kp-meta">
        <span>${ic("clock")}<b>${T("6-7 daqiqa")}</b><small>${T("taxminiy vaqt")}</small></span>
        <span>${ic("check")}<b>${NSHOW}</b><small>${T("rasmli savol")}</small></span>
        <span>${ic("target")}<b>3</b><small>${T("mos kurs")}</small></span>
      </div>
      <div class="kp-themes">${Object.values(THEMES).map((t) => `<i style="--tc:${t.c}">${ic(t.icon)}</i>`).join("")}</div>
    </div>
    <button class="btn-primary" onclick="kpStart(${going ? 0 : 1})">${ic("play")} ${going ? T("Davom etish ({a} / {b})", { a: Math.min(st.step + 1, NSHOW), b: NSHOW }) : T("Boshlash")}</button>
    ${going ? `<button class="btn-ghost" onclick="kpStart(1)">${ic("refresh")} ${T("Boshidan boshlash")}</button>` : ""}
    ${store.get("kp_done2", null) ? `<button class="btn-ghost" onclick="location.hash='#/natija'">${ic("star")} ${T("Oxirgi natijam")}</button>` : ""}`;
  }
  const L = "ABCDEFGH";
  const nextBtn = (ready, last) => `<button class="btn-primary kp-next" ${ready ? "" : "disabled"} onclick="kpNext()">${last ? T("Natijani ko'rish") : T("Keyingi savol")} ${ic("chev")}</button>`;
  const pic = (n) => `<div class="kp-pic"><img src="img/kp/${String(n).padStart(2, "0")}.webp" alt="" decoding="async"></div>`;
  function Question() {
    const list = steps(), s = list[st.step], last = st.step + 1 >= list.length;
    const num = s.t === "q" ? s.i + 1 : s.x.n;
    const head = `${navbar(T("Kasb Kompasi"))}
      <div class="kp-top"><span>${s.t === "q" ? T(THEMES[themeOf(s.i)].name) : T("Kurs tanlash shartlari")}</span><em>${num} / ${NSHOW}</em></div>
      <div class="progress kp-prog"><span style="width:${(st.step / list.length) * 100}%"></span></div>`;
    const back = st.step > 0 ? `<button class="kp-back" onclick="kpPrev()">${ic("back")} ${T("Oldingi savol")}</button>` : "";
    if (s.t === "q") {
      const t = THEMES[themeOf(s.i)], q = QS[s.i], cur = st.a[s.i];
      // A-E = 4-0 points, F = not tried yet
      const val = (k) => k === 5 ? "'n'" : 4 - k, isOn = (k) => k === 5 ? cur === "n" : cur === 4 - k;
      return `${head}
      <div class="kp-card kp-pq" style="--tc:${t.c}">${pic(s.i + 1)}
        <div class="kp-th">${chip(t.icon, "sm")}<small>${num}-${T("savol")}</small></div>
        <h3>${T(q.q)}</h3>
      </div>
      <div class="kp-scale">${q.o.slice(0, 5).map((o, k) => `<button class="kp-opt kp-l ${isOn(k) ? "on" : ""}" style="--tc:${t.c}" onclick="kpAns(${val(k)})"><span class="kp-letter">${L[k]}</span><b>${T(o)}</b></button>`).join("")}</div>
      <button class="kp-skip kp-l ${isOn(5) ? "on" : ""}" onclick="kpAns('n')"><span class="kp-letter">F</span><span>${T(q.o[5])}</span></button>
      ${nextBtn(cur !== undefined, last)}${back}`;
    }
    const x = s.x, cur = st.f[x.k];
    if (x.input) {
      return `${head}
      <div class="kp-card fit"><div class="kp-th">${chip("search", "sm")}<small>${x.n}-${T("savol")}</small></div><h3>${T(x.q)}</h3><p class="kp-hint">${T(x.hint)}</p></div>
      <label class="kp-input">${ic("edit")}<input id="kp-topic" maxlength="60" placeholder="${T("Men qiziqqan mavzu")}" value="${esc(cur && cur !== "-" ? cur : "")}" autocomplete="off" oninput="kpTopic(this.value)"></label>
      <button class="kp-skip ${cur === "-" ? "on" : ""}" onclick="kpFit('topic','-')">${ic("compass")} ${T("Hali tanlamadim. Qiziqishlarimga qarab taklif bering.")}</button>
      ${nextBtn(!!cur, last)}${back}`;
    }
    return `${head}
    <div class="kp-card fit ${x.img ? "kp-pq" : ""}">${x.img ? pic(x.img) : ""}<div class="kp-th">${chip(x.icons[0], "sm")}<small>${x.n}-${T("savol")}${x.sub ? ` · ${T("qo'shimcha")}` : ""}</small></div><h3>${T(x.q)}</h3>${x.hint ? `<p class="kp-hint">${T(x.hint)}</p>` : ""}</div>
    <div class="kp-fit">${x.o.map((label, k) => `<button class="kp-opt ${cur === x.v[k] ? "on" : ""}" onclick="kpFit('${x.k}','${x.v[k]}')"><i>${ic(x.icons[k] || "check")}</i><b>${T(label)}</b></button>`).join("")}</div>
    ${x.k === "budget" && cur === "B" ? `<label class="kp-input">${ic("coin")}<input id="kp-sum" inputmode="numeric" placeholder="${T("Masalan, 300 000")}" value="${st.f.sum ? fmtN(st.f.sum) : ""}" autocomplete="off" oninput="kpSum(this.value)"><span>${T("so'm")}</span></label>` : ""}
    ${nextBtn(cur !== undefined && !(x.k === "budget" && cur === "B" && !(Number(st.f.sum) > 0)), last)}${back}`;
  }
  function Screen() {
    if (store.get("kp_go", 0)) { store.set("kp_go", 0); if (st.step < 0 || st.step >= steps().length) { st = fresh(); st.step = 0; save(); } }
    if (st.step < 0 || st.step >= steps().length) return Intro();
    return Question();
  }
  const next = () => {
    st.step++; save();
    if (st.step >= steps().length) { store.set("kp_done2", { a: st.a, f: st.f, at: Date.now() }); st = fresh(); save(); try { tg.HapticFeedback.notificationOccurred("success"); } catch {} location.replace("#/natija"); return; }
    render(); window.scrollTo(0, 0);
  };
  window.kpStart = (reset) => { if (reset || st.step < 0 || st.step >= steps().length) st = fresh(); if (st.step < 0) st.step = 0; save(); haptic("light"); render(); window.scrollTo(0, 0); };
  const toNext = () => requestAnimationFrame(() => { const b = document.querySelector(".kp-next"); if (b) b.scrollIntoView({ behavior: "smooth", block: "center" }); });
  window.kpAns = (v) => { st.a[steps()[st.step].i] = v; save(); haptic("light"); render(); toNext(); };
  window.kpFit = (k, v) => { st.f[k] = v; save(); haptic("light"); render(); if (!(k === "budget" && v === "B")) toNext(); else setTimeout(() => { const el = document.getElementById("kp-sum"); if (el) el.focus(); }, 50); };
  // typing keeps the focus: only the "next" button is switched on or off
  const nextOn = (on) => { const b = document.querySelector(".kp-next"); if (b) b.disabled = !on; };
  window.kpTopic = (v) => { st.f.topic = v.trim() ? v : undefined; save(); nextOn(!!st.f.topic); document.querySelector(".kp-skip")?.classList.remove("on"); };
  window.kpSum = (v) => { const n = Number(String(v).replace(/\D/g, "")); st.f.sum = n || undefined; save(); nextOn(n > 0); };
  window.kpNext = () => {
    const s = steps()[st.step], ok = s.t === "q" ? st.a[s.i] !== undefined : !!st.f[s.x.k] && !(s.x.k === "budget" && st.f.budget === "B" && !(Number(st.f.sum) > 0));
    if (!ok) { toast(T("Avval javobni tanlang")); return; }
    haptic("medium"); next();
  };
  window.kpPrev = () => { if (st.step > 0) { st.step--; save(); haptic("light"); render(); } };

  /* ---------- result ---------- */
  const price = (c) => cost(c) === 0 ? T("Bepul") : `${fmtN(cost(c))} ${T("so'm")}`;
  const dur = (h) => h >= 1 ? T("{n} soat", { n: String(Math.round(h * 10) / 10).replace(".", ",") }) : T("{n} daqiqa", { n: Math.max(1, Math.round(h * 60)) });
  const GOALS = Object.fromEntries(FIT[0].v.split("").map((k, i) => [k, FIT[0].o[i]]));
  let more = 0;
  function why(r, a) {
    const row = r.c.row;
    if (r.why === "topic") return T("Siz yozgan mavzuga mos: \"{t}\".", { t: esc(store.get("kp_done2", {}).f.topic || "") });
    if (r.why === "goal") return T("Maqsadingiz: ishga kirishga tayyorlanish. Bu kurs rezyume va ish suhbatiga tayyorlaydi.");
    const liked = row.q.filter((n) => pts(a[n - 1]) >= 3).map((n) => T(SHORT[n - 1]));
    return liked.length ? T("Javoblaringizda {x} sizga yoqishi ko'rindi.", { x: liked.join(` ${T("va")} `) })
      : T("Javoblaringiz {t} yo'nalishiga qiziqishingizni ko'rsatdi.", { t: T(THEMES[row.th].name).toLowerCase() });
  }
  function card(r, kind, a) {
    const c = r.c, row = c.row, hours = (c.sec || 0) / 3600, ring = 2 * Math.PI * 22;
    const devTxt = row.dev === "pc" ? T("Kompyuter kerak") : row.dev === "kit" ? T("Jihoz va materiallar kerak") : T("Smartfonda ham o'qish mumkin");
    const m = r.score === null ? null : pct(r);
    return `<div class="kp-res">
      <div class="kp-res-h">
        <span class="kp-kind">${kind}</span>
        ${m === null ? `<span class="kp-tag">${T("Mavzu bo'yicha")}</span>` : `<svg class="kp-ring" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="27" cy="27" r="22" fill="none" stroke="var(--p1)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - m / 100)}" transform="rotate(-90 27 27)"/><text x="27" y="31.5" text-anchor="middle" font-size="13" font-weight="800" fill="var(--text)">${m}%</text></svg>`}
      </div>
      <a class="kp-res-c" href="#/kurs/${c.id}">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : ""}<span><b class="notr">${esc(c.title)}</b><small class="notr">${esc(c.teacher || "Ustoz AI")}</small></span></a>
      <p class="kp-why">${why(r, a)}</p>
      <div class="kp-facts">
        <span>${ic("play")}${T("{n} dars", { n: c.lessons })}</span>${hours > 0 ? `<span>${ic("clock")}${dur(hours)}</span>` : ""}
        <span>${ic("coin")}${price(c)}</span>
        <span>${ic(row.dev === "pc" ? "laptop" : row.dev === "kit" ? "tool" : "phone")}${devTxt}</span><span>${ic("globe")}${T("O'zbekcha")}</span>
      </div>
      ${m === null ? "" : `<details class="kp-more"><summary>${T("Nega bu kurs?")}</summary>
        <ul>
          <li><b>${Math.round(r.interest * 10) / 10} / 65</b> ${T("qiziqish")}: ${T(THEMES[row.th].name)}, ${T("tayanch savollar")} ${row.q.join(` ${T("va")} `)}</li>
          ${r.goal === null ? "" : `<li><b>${r.goal} / 25</b> ${T("maqsad mosligi")}</li>`}
          ${r.ready === null ? "" : `<li><b>${Math.round(r.ready * 10) / 10} / 10</b> ${T("tayyorgarlik: daraja va qurilma")}</li>`}
        </ul>
      </details>`}
      <div class="kp-btns"><a class="btn-ghost" href="#/kurs/${c.id}">${T("Batafsil")}</a><button class="btn-primary" onclick="openApp('${esc(c.url)}')">${ic("play")} ${T("Ilovada ochish")}</button></div>
    </div>`;
  }
  function Result() {
    const done = store.get("kp_done2", null);
    if (!done) { location.replace("#/kompas"); return ""; }
    if (!catalog()) { const p = Kurslar.load(); if (p) p.then(() => { if (location.hash === "#/natija") render(); }); return `${navbar(T("Kasb Kompasi"))}${spinner()}`; }
    const r = recommend({ a: done.a, f: done.f }, more);
    if (!r.picks.length && more) { more = 0; return Result(); }
    const [t1, t2, t3] = r.top, f = done.f;
    const head = r.weak ? T("Hozircha aniq yo'nalish ko'rinmadi") : t1[1] - t2[1] < 10 ? T("Sizda bir nechta mos yo'nalish bor") : T("Yetakchi yo'nalishingiz: {t}", { t: T(THEMES[t1[0]].name) });
    const kinds = [T("Eng mos kurs"), T("Yana bir mos kurs"), T("Uchinchi tavsiya")];
    const notes = [];
    if (f.time === "E") notes.push(T("Hozircha o'qishga vaqtingiz yo'qligini aytdingiz. Kurslarni saqlab qo'ying va vaqt topilganda boshlang."));
    if (f.device === "D") notes.push(T("Hozircha qurilmangiz yo'q. Maktab, kutubxona yoki ishdagi kompyuterdan foydalanish mumkin."));
    if (f.cert === "A") notes.push(T("Sertifikat berilishini kursning o'z sahifasida yoki muallifdan tekshiring."));
    if (f.goal === "F" && !(f.topic && f.topic !== "-")) notes.push(T("Til yoki imtihon uchun aniq mavzuni yozsangiz (masalan, \"IELTS Reading\"), mos kursni topamiz."));
    return `${navbar(T("Kasb Kompasi"))}
    <div class="kp-head">
      <span class="kp-head-i">${ic(THEMES[t1[0]].icon)}</span>
      <small>${T("Sizning natijangiz")}</small>
      <h2>${head}</h2>
      <p>${r.weak ? T("Ko'p savolga \"Hali bilmayman\" deb javob berdingiz. Quyidagi kurslar bilan tanishib chiqing yoki so'rovnomani qayta topshiring.") : T("Bu natija siz bildirgan qiziqish va maqsadga asoslangan tavsiya. Tanlov sizniki.")}</p>
      <div class="kp-bars3">${[t1, t2, t3].map(([t, v]) => `<div style="--tc:${THEMES[t].c}"><span>${ic(THEMES[t].icon)}<b>${T(THEMES[t].name)}</b><em>${Math.round(v)}%</em></span><i><s style="width:${Math.round(v)}%"></s></i></div>`).join("")}</div>
      ${f.goal && GOALS[f.goal] ? `<p class="kp-goal">${ic("target")} ${T("Maqsadingiz")}: <b>${T(GOALS[f.goal])}</b></p>` : ""}
    </div>
    <div class="section-title">${T("Sizga tavsiya etilgan kurslar")}</div>
    ${r.picks.length ? r.picks.map((p, i) => card(p, kinds[i] || "", done.a)).join("") : `<p class="note">${T("Tanlagan shartlaringizga mos kurs topilmadi. Narx chegarasi yoki mavzuni o'zgartirib ko'ring.")}</p>`}
    ${r.hidden ? `<p class="kp-note">${ic("coin")} ${T("Narx chegarangiz tufayli eng mos kurs ko'rsatilmadi: {c} ({m}%).", { c: `<b class="notr">${esc(r.hidden.c.title)}</b>`, m: pct(r.hidden) })} <a href="#/kurs/${r.hidden.c.id}">${T("Ko'rish")}</a></p>` : ""}
    ${notes.map((n) => `<p class="kp-note">${ic("info")} ${n}</p>`).join("")}
    <div class="kp-fb">
      <button class="btn-ghost" onclick="kpLike()">${ic("heart")} ${T("Bu tavsiya menga mos")}</button>
      <button class="btn-ghost" onclick="kpMore()">${ic("refresh")} ${T("Boshqa yo'nalish ko'rsat")}</button>
    </div>
    <button class="btn-primary" onclick="kpShare()">${ic("send")} ${T("Do'stlarga ulashish")}</button>
    <button class="btn-ghost" onclick="kpStart(1);location.hash='#/kompas'">${ic("refresh")} ${T("Qaytadan topshirish")}</button>
    <p class="note">${T("Tavsiya qiziqishlaringiz va tanlagan shartlaringizga asoslanadi. U ish yoki daromadni kafolatlamaydi.")}</p>`;
  }
  window.kpMore = () => { more++; haptic("light"); render(); window.scrollTo(0, 0); };
  window.kpLike = () => { haptic("medium"); toast(T("Rahmat! Fikringiz tavsiyalarni yaxshilashga yordam beradi.")); try { track("#/natija"); } catch {} };
  window.kpShare = () => {
    const done = store.get("kp_done2", null); if (!done) return;
    const lead = Object.entries(profile(done.a).p).sort((x, y) => y[1] - x[1])[0][0];
    const link = `https://t.me/${BOT}?start=ref_${user.id}`;
    const text = T("Mening yetakchi yo'nalishim: {p}. Sizga qaysi kurs mos? Kasb Kompasida 7 daqiqada bilib oling.", { p: T(THEMES[lead].name) });
    haptic(); openTg(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };
  return { Screen, Result, _test: { QS, FIT, ROWS, recommend, profile, scoreCourse, catalog } };
})();
window.Compass = Compass;
