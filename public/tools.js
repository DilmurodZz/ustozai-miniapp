// "Foydali vositalar": the free CV, resume and obyektivka maker, and other useful tools.
// Documents are filled in inside the Mini App, shown as a live A4 preview and exported as PDF, PNG (exact picture of the
// preview, html2canvas + jsPDF in lib/) or Word (editable .docx, written here without any library). The file reaches the
// user through the share server: Telegram's own download window (WebApp.downloadFile) or a message in the bot chat.
// Types: CV, Rezyume, Rasmli CV (3 designs each; uz / ru / en) and Obyektivka (ma'lumotnoma; uz lotin / uz kirill / ru).
const Tools = (() => {
  /* ---------- texts inside the document, in the document's own language ---------- */
  const H = {
    uz: { summary: "Men haqimda", exp: "Ish tajribasi", edu: "Ta'lim", certs: "Sertifikatlar", skills: "Ko'nikmalar", interests: "Qiziqishlar", contact: "Aloqa", now: "hozirgacha",
      extra: "Qo'shimcha ma'lumot", traits: "Shaxsiy fazilatlar", refs: "Tavsiya beruvchilar", birth: "Tug'ilgan sana", salary: "Kutilayotgan maosh", schedule: "Ish grafigi", license: "Haydovchilik guvohnomasi", military: "Harbiy guvohnoma", yes: "bor", no: "yo'q",
      sched: { full: "To'liq kun", shift: "Smenali", flex: "Moslashuvchan", part: "Yarim kun", remote: "Masofaviy" } },
    ru: { summary: "О себе", exp: "Опыт работы", edu: "Образование", certs: "Сертификаты", skills: "Навыки", interests: "Интересы", contact: "Контакты", now: "по настоящее время",
      extra: "Дополнительно", traits: "Личные качества", refs: "Рекомендации", birth: "Дата рождения", salary: "Ожидаемая зарплата", schedule: "График работы", license: "Водительские права", military: "Военный билет", yes: "есть", no: "нет",
      sched: { full: "Полный день", shift: "Сменный", flex: "Гибкий", part: "Неполный день", remote: "Удалённо" } },
    en: { summary: "Summary", exp: "Work experience", edu: "Education", certs: "Certifications", skills: "Skills", interests: "Interests", contact: "Contact", now: "present",
      extra: "Additional information", traits: "Personal qualities", refs: "References", birth: "Date of birth", salary: "Expected salary", schedule: "Work schedule", license: "Driving licence", military: "Military ID", yes: "yes", no: "no",
      sched: { full: "Full-time", shift: "Shifts", flex: "Flexible", part: "Part-time", remote: "Remote" } },
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
  Object.assign(SAMPLE.uz, { birth: "15.03.2000", salary: "8-10 mln so'm", schedule: "full", license: "B", military: "", traits: "Mas'uliyatli\nJamoada ishlay oladi\nTez o'rganadi", refs: [{ name: "Dilnoza Namunova", role: "HR menejer, Namuna Group", phone: "+998 90 000 00 01" }] });
  Object.assign(SAMPLE.ru, { birth: "15.03.2000", salary: "8-10 млн сум", schedule: "full", license: "B", military: "", traits: "Ответственный\nУмею работать в команде\nБыстро учусь", refs: [{ name: "Dilnoza Namunova", role: "HR-менеджер, Namuna Group", phone: "+998 90 000 00 01" }] });
  Object.assign(SAMPLE.en, { birth: "15.03.2000", salary: "8-10 mln UZS", schedule: "full", license: "B", military: "", traits: "Responsible\nGood team player\nFast learner", refs: [{ name: "Dilnoza Namunova", role: "HR Manager, Namuna Group", phone: "+998 90 000 00 01" }] });

  /* ---------- obyektivka (ma'lumotnoma): the official form used by state bodies, banks and universities ---------- */
  const OH = {
    uz: { title: "MA'LUMOTNOMA", since: (d) => d + "dan:", birth: "Tug'ilgan yili:", place: "Tug'ilgan joyi:", nation: "Millati:", party: "Partiyaviyligi:", edu: "Ma'lumoti:", grad: "Tamomlagan:",
      spec: "Ma'lumoti bo'yicha mutaxassisligi:", degree: "Ilmiy darajasi:", rank: "Ilmiy unvoni:", langs: "Qaysi chet tillarini biladi:", awards: "Davlat mukofotlari bilan taqdirlanganmi (qanaqa):",
      deputy: "Xalq deputatlari, respublika, viloyat, shahar va tuman Kengashi deputatimi yoki boshqa saylanadigan organlarning a'zosimi (to'liq ko'rsatilishi lozim):",
      work: "MEHNAT FAOLIYATI", relTitle: (n) => `${n}ning yaqin qarindoshlari haqida`, relWord: "MA'LUMOT", cols: ["Qarindoshligi", "Familiyasi, ismi va otasining ismi", "Tug'ilgan yili va joyi", "Ish joyi va lavozimi", "Turar joyi"],
      dead: (y) => `${y} yilda vafot etgan`, now: "h.v.", none: "yo'q",
      kin: ["Otasi", "Onasi", "Akasi", "Ukasi", "Opasi", "Singlisi", "Turmush o'rtog'i", "O'g'li", "Qizi", "Qaynotasi", "Qaynonasi", "Bobosi", "Buvisi"] },
    uzc: { title: "МАЪЛУМОТНОМА", since: (d) => d + "дан:", birth: "Туғилган йили:", place: "Туғилган жойи:", nation: "Миллати:", party: "Партиявийлиги:", edu: "Маълумоти:", grad: "Тамомлаган:",
      spec: "Маълумоти бўйича мутахассислиги:", degree: "Илмий даражаси:", rank: "Илмий унвони:", langs: "Қайси чет тилларини билади:", awards: "Давлат мукофотлари билан тақдирланганми (қанақа):",
      deputy: "Халқ депутатлари, республика, вилоят, шаҳар ва туман Кенгаши депутатими ёки бошқа сайланадиган органларнинг аъзосими (тўлиқ кўрсатилиши лозим):",
      work: "МЕҲНАТ ФАОЛИЯТИ", relTitle: (n) => `${n}нинг яқин қариндошлари ҳақида`, relWord: "МАЪЛУМОТ", cols: ["Қариндошлиги", "Фамилияси, исми ва отасининг исми", "Туғилган йили ва жойи", "Иш жойи ва лавозими", "Турар жойи"],
      dead: (y) => `${y} йилда вафот этган`, now: "ҳ.в.", none: "йўқ",
      kin: ["Отаси", "Онаси", "Акаси", "Укаси", "Опаси", "Синглиси", "Турмуш ўртоғи", "Ўғли", "Қизи", "Қайнотаси", "Қайнонаси", "Бобоси", "Бувиси"] },
    ru: { title: "ОБЪЕКТИВКА", since: (d) => "С " + d + ":", birth: "Год рождения:", place: "Место рождения:", nation: "Национальность:", party: "Партийность:", edu: "Образование:", grad: "Окончил(а):",
      spec: "Специальность по образованию:", degree: "Учёная степень:", rank: "Учёное звание:", langs: "Какими иностранными языками владеет:", awards: "Награждён(а) ли государственными наградами (какими):",
      deputy: "Является ли депутатом народных депутатов, республиканского, областного, городского и районного Кенгаша или членом других выборных органов (указать полностью):",
      work: "ТРУДОВАЯ ДЕЯТЕЛЬНОСТЬ", relTitle: (n) => `Сведения о близких родственниках: ${n}`, relWord: "", cols: ["Степень родства", "Фамилия, имя, отчество", "Год и место рождения", "Место работы и должность", "Место жительства"],
      dead: (y) => `умер(ла) в ${y} году`, now: "н.в.", none: "нет",
      kin: ["Отец", "Мать", "Брат (старший)", "Брат (младший)", "Сестра (старшая)", "Сестра (младшая)", "Супруг(а)", "Сын", "Дочь", "Тесть / свёкор", "Тёща / свекровь", "Дедушка", "Бабушка"] },
  };
  const OSAMPLE = {
    uz: { photo: "", fio: "Namunov Aziz Akmal o'g'li", since: "2022 yil 1 sentyabr", pos: "Namuna Group MChJ moliya bo'limi bosh mutaxassisi", birth: "12.04.1998", place: "Toshkent shahri", nation: "o'zbek", party: "yo'q",
      edu: "Oliy", grad: "2020 yil, Namuna davlat universiteti (kunduzgi)", spec: "Iqtisodiyot", degree: "yo'q", rank: "yo'q", langs: "rus, ingliz", awards: "yo'q", deputy: "yo'q",
      work: [{ from: "2016", to: "2020", text: "Namuna davlat universiteti talabasi" }, { from: "2020", to: "2022", text: "Misol Savdo MChJ hisobchisi" }, { from: "2022", to: "", text: "Namuna Group MChJ moliya bo'limi bosh mutaxassisi" }],
      rel: [{ kin: "Otasi", fio: "Namunov Akmal Karimovich", birth: "1970 yil, Toshkent shahri", job: "Misol maktabi o'qituvchisi", home: "Toshkent shahri, Chilonzor tumani, Namuna ko'chasi, 1-uy", dead: "" },
        { kin: "Onasi", fio: "Namunova Dilbar Rahimovna", birth: "1974 yil, Toshkent viloyati", job: "Namuna klinikasi hamshirasi", home: "Toshkent shahri, Chilonzor tumani, Namuna ko'chasi, 1-uy", dead: "" },
        { kin: "Singlisi", fio: "Namunova Malika Akmal qizi", birth: "2005 yil, Toshkent shahri", job: "Namuna universiteti talabasi", home: "Toshkent shahri, Chilonzor tumani, Namuna ko'chasi, 1-uy", dead: "" },
        { kin: "Bobosi", fio: "Namunov Karim", birth: "1945 yil, Toshkent viloyati", job: "", home: "", dead: "2015" }] },
    uzc: { photo: "", fio: "Намунов Азиз Акмал ўғли", since: "2022 йил 1 сентябр", pos: "Namuna Group МЧЖ молия бўлими бош мутахассиси", birth: "12.04.1998", place: "Тошкент шаҳри", nation: "ўзбек", party: "йўқ",
      edu: "Олий", grad: "2020 йил, Намуна давлат университети (кундузги)", spec: "Иқтисодиёт", degree: "йўқ", rank: "йўқ", langs: "рус, инглиз", awards: "йўқ", deputy: "йўқ",
      work: [{ from: "2016", to: "2020", text: "Намуна давлат университети талабаси" }, { from: "2020", to: "2022", text: "Мисол Савдо МЧЖ ҳисобчиси" }, { from: "2022", to: "", text: "Namuna Group МЧЖ молия бўлими бош мутахассиси" }],
      rel: [{ kin: "Отаси", fio: "Намунов Акмал Каримович", birth: "1970 йил, Тошкент шаҳри", job: "Мисол мактаби ўқитувчиси", home: "Тошкент шаҳри, Чилонзор тумани, Намуна кўчаси, 1-уй", dead: "" },
        { kin: "Онаси", fio: "Намунова Дилбар Раҳимовна", birth: "1974 йил, Тошкент вилояти", job: "Намуна клиникаси ҳамшираси", home: "Тошкент шаҳри, Чилонзор тумани, Намуна кўчаси, 1-уй", dead: "" },
        { kin: "Синглиси", fio: "Намунова Малика Акмал қизи", birth: "2005 йил, Тошкент шаҳри", job: "Намуна университети талабаси", home: "Тошкент шаҳри, Чилонзор тумани, Намуна кўчаси, 1-уй", dead: "" },
        { kin: "Бобоси", fio: "Намунов Карим", birth: "1945 йил, Тошкент вилояти", job: "", home: "", dead: "2015" }] },
    ru: { photo: "", fio: "Намунов Азиз Акмалович", since: "1 сентября 2022 г.", pos: "главный специалист финансового отдела ООО «Namuna Group»", birth: "12.04.1998", place: "г. Ташкент", nation: "узбек", party: "беспартийный",
      edu: "Высшее", grad: "2020 г., Государственный университет «Намуна» (очно)", spec: "Экономика", degree: "нет", rank: "нет", langs: "русский, английский", awards: "нет", deputy: "нет",
      work: [{ from: "2016", to: "2020", text: "студент Государственного университета «Намуна»" }, { from: "2020", to: "2022", text: "бухгалтер ООО «Мисол Савдо»" }, { from: "2022", to: "", text: "главный специалист финансового отдела ООО «Namuna Group»" }],
      rel: [{ kin: "Отец", fio: "Намунов Акмал Каримович", birth: "1970 г., г. Ташкент", job: "учитель школы «Мисол»", home: "г. Ташкент, Чиланзарский район, ул. Намуна, дом 1", dead: "" },
        { kin: "Мать", fio: "Намунова Дилбар Рахимовна", birth: "1974 г., Ташкентская обл.", job: "медсестра клиники «Намуна»", home: "г. Ташкент, Чиланзарский район, ул. Намуна, дом 1", dead: "" },
        { kin: "Сестра (младшая)", fio: "Намунова Малика Акмаловна", birth: "2005 г., г. Ташкент", job: "студентка университета «Намуна»", home: "г. Ташкент, Чиланзарский район, ул. Намуна, дом 1", dead: "" },
        { kin: "Дедушка", fio: "Намунов Карим", birth: "1945 г., Ташкентская обл.", job: "", home: "", dead: "2015" }] },
  };
  // a neutral silhouette for the example photos
  const SAMPLE_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#DCE3F0"/><circle cx="60" cy="46" r="22" fill="#9AA8C2"/><path d="M18 120c4-26 21-40 42-40s38 14 42 40z" fill="#9AA8C2"/></svg>`);
  const SAMPLE_PHOTO_34 = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 120"><rect width="90" height="120" fill="#E3E8F1"/><circle cx="45" cy="46" r="20" fill="#9AA8C2"/><path d="M8 120c3-24 18-36 37-36s34 12 37 36z" fill="#9AA8C2"/></svg>`);

  const TYPES = () => [
    { k: "cv", name: T("CV"), d: T("To'liq ta'lim, barcha ish joylari, sertifikat va yutuqlar. 1-2 sahifa. Grant, magistratura, xalqaro va yirik kompaniyalar uchun.") },
    { k: "rez", name: T("Rezyume"), d: T("Faqat 1 sahifa: shu ishga kerakli tajriba va natijalar, boshida qisqacha o'zingiz haqingizda. Ko'pchilik kompaniyalarga ishga kirish uchun.") },
    { k: "photo", name: T("Rasmli CV"), d: T("Chap tomonda rasm, aloqa va ko'nikmalar, o'ngda tajriba. O'zbekiston va MDH kompaniyalarida, savdo, xizmat ko'rsatish va ofis ishlari uchun keng tarqalgan.") },
    { k: "obj", name: T("Obyektivka"), d: T("Rasmiy ma'lumotnoma: shaxsiy ma'lumotlar, mehnat faoliyati va yaqin qarindoshlar jadvali. Davlat tashkilotlari, bank va oliygohlar so'raydi.") },
  ];
  const DESIGNS = () => [["classic", T("Klassik")], ["elegant", T("Elegant")], ["modern", T("Zamonaviy")]];
  const DOC_LANGS = (k) => k === "obj" ? [["uz", "O'zbekcha (lotin)"], ["uzc", "Ўзбекча (кирилл)"], ["ru", "Русский"]] : [["uz", "O'zbekcha"], ["ru", "Русский"], ["en", "English"]];

  /* ---------- saved drafts ---------- */
  const blankExp = () => ({ role: "", org: "", city: "", from: "", to: "", now: false, items: "" });
  const blankEdu = () => ({ org: "", degree: "", city: "", from: "", to: "", items: "" });
  const blank = () => ({ name: "", title: "", phone: "", email: "", city: "", link: "", photo: "", summary: "", exp: [blankExp()], edu: [blankEdu()], certs: "", skills: "", interests: "",
    birth: "", salary: "", schedule: "", license: "", military: "", traits: "", refs: [] });
  const blankRel = () => ({ kin: "", fio: "", birth: "", job: "", home: "", dead: "" });
  const blankObj = () => ({ photo: "", fio: "", since: "", pos: "", birth: "", place: "", nation: "", party: "", edu: "", grad: "", spec: "", degree: "", rank: "", langs: "", awards: "", deputy: "",
    work: [{ from: "", to: "", text: "" }], rel: [blankRel()] });
  let cv = Object.assign(blank(), store.get("cv_data", null) || {});
  let obj = Object.assign(blankObj(), store.get("obj_data", null) || {});
  let kind = store.get("cv_kind", "cv"), design = store.get("cv_design", "classic");
  let langs = store.get("cv_langs", { cv: LANG, obj: LANG === "en" ? "uz" : LANG });
  const docLang = () => langs[kind === "obj" ? "obj" : "cv"];
  const save = () => { store.set("cv_data", cv); store.set("obj_data", obj); store.set("cv_kind", kind); store.set("cv_design", design); store.set("cv_langs", langs); };

  /* ---------- the documents (A4, 794 px wide) ---------- */
  const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const li = (s) => { const m = s.match(/^([^:]{2,24}):\s*(.+)$/); return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(s); };
  const dates = (e, h) => [e.from, e.now ? h.now : e.to].filter(Boolean).join(" - ");
  const extraLines = (d, h) => [[h.birth, d.birth], [h.salary, d.salary], [h.schedule, d.schedule && h.sched[d.schedule]], [h.license, d.license], [h.military, d.military === "yes" ? h.yes : d.military === "no" ? h.no : ""]]
    .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  function docHTML(d, k, lang, des) {
    if (k === "obj") return objHTML(d, lang);
    const h = H[lang] || H.uz;
    const contact = [d.phone, d.city, d.email, d.link].filter(Boolean);
    const sec = (title, body) => body ? `<section><h3>${title}</h3>${body}</section>` : "";
    const entry = (a, b, sub, when, items) => `<div class="cd-e"><div class="cd-er"><span><b>${esc(a)}</b>${b ? `, ${esc(b)}` : ""}</span><span class="cd-d">${esc(when)}</span></div>${sub ? `<i>${esc(sub)}</i>` : ""}${lines(items).length ? `<ul>${lines(items).map((x) => `<li>${li(x)}</li>`).join("")}</ul>` : ""}</div>`;
    const exp = (d.exp || []).filter((e) => e.role || e.org).map((e) => entry(e.org, e.city, e.role, dates(e, h), e.items)).join("");
    const edu = (d.edu || []).filter((e) => e.org || e.degree).map((e) => entry(e.org, e.city, e.degree, dates(e, h), e.items)).join("");
    const list = (s) => lines(s).length ? `<ul>${lines(s).map((x) => `<li>${li(x)}</li>`).join("")}</ul>` : "";
    const extra = list(extraLines(d, h).join("\n"));
    const refs = (d.refs || []).filter((r) => r.name).map((r) => `<div class="cd-e"><b>${esc(r.name)}</b>${r.role ? `, ${esc(r.role)}` : ""}${r.phone ? `<i>${esc(r.phone)}</i>` : ""}</div>`).join("");
    const cls = `cvdoc d-${des || "classic"}`;
    if (k === "photo") {
      return `<div class="${cls} cd-photo"><aside>
        ${d.photo || d.sample ? `<img class="cd-ph" src="${esc(d.photo || SAMPLE_PHOTO)}" alt="">` : ""}
        ${sec(h.contact, contact.length ? `<ul class="cd-plain">${contact.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "")}
        ${sec(h.extra, extra)}${sec(h.skills, list(d.skills))}${sec(h.traits, list(d.traits))}${sec(h.interests, list(d.interests))}
      </aside><main>
        <h1>${esc(d.name)}</h1>${d.title ? `<h2>${esc(d.title)}</h2>` : ""}
        ${sec(h.summary, d.summary ? `<p>${esc(d.summary)}</p>` : "")}${sec(h.exp, exp)}${sec(h.edu, edu)}${sec(h.certs, list(d.certs))}${sec(h.refs, refs)}
      </main></div>`;
    }
    const head = `<header><h1>${esc(d.name)}</h1>${k === "rez" && d.title ? `<h2>${esc(d.title)}</h2>` : ""}<p>${contact.map(esc).join("  |  ")}</p></header>`;
    if (k === "rez") return `<div class="${cls} cd-rez">${head}${sec(h.summary, d.summary ? `<p>${esc(d.summary)}</p>` : "")}${sec(h.exp, exp)}${sec(h.skills, list(d.skills))}${sec(h.edu, edu)}${sec(h.certs, list(d.certs))}${sec(h.traits, list(d.traits))}${sec(h.extra, extra)}${sec(h.refs, refs)}</div>`;
    return `<div class="${cls} cd-cv">${head}${sec(h.edu, edu)}${sec(h.exp, exp)}${sec(h.certs, list(d.certs))}${sec(h.skills, list(d.skills))}${sec(h.traits, list(d.traits))}${sec(h.extra, extra)}${sec(h.interests, list(d.interests))}${sec(h.refs, refs)}</div>`;
  }
  function objHTML(o, lang) {
    const h = OH[lang] || OH.uz, v = (x) => esc(x || h.none);
    const yrs = (w) => `${esc(w.from)}${w.from ? "-" : ""}${esc(w.to || h.now)}${!w.to ? "" : lang === "uz" ? " yy." : lang === "uzc" ? " йй." : " гг."}`;
    const page1 = `<div class="cvdoc cd-obj">
      <div class="ob-photo">${o.photo || o.sample ? `<img src="${esc(o.photo || SAMPLE_PHOTO_34)}" alt="">` : ""}</div>
      <h1>${h.title}</h1>
      <h2>${esc(o.fio)}</h2>
      ${o.pos ? `<p class="ob-since">${o.since ? esc(h.since(o.since)) : ""}</p><p class="ob-pos"><b>${esc(o.pos)}</b></p>` : ""}
      <div class="ob-grid">
        <div><b>${h.birth}</b><span>${esc(o.birth)}</span></div><div><b>${h.place}</b><span>${esc(o.place)}</span></div>
        <div><b>${h.nation}</b><span>${esc(o.nation)}</span></div><div><b>${h.party}</b><span>${v(o.party)}</span></div>
        <div><b>${h.edu}</b><span>${esc(o.edu)}</span></div><div><b>${h.grad}</b><span>${lines(o.grad).map(esc).join("<br>")}</span></div>
      </div>
      <p class="ob-row"><b>${h.spec}</b> ${esc(o.spec)}</p>
      <div class="ob-grid"><div><b>${h.degree}</b><span>${v(o.degree)}</span></div><div><b>${h.rank}</b><span>${v(o.rank)}</span></div></div>
      <p class="ob-row"><b>${h.langs}</b> ${v(o.langs)}</p>
      <p class="ob-row"><b>${h.awards}</b> ${v(o.awards)}</p>
      <p class="ob-row"><b>${h.deputy}</b> ${v(o.deputy)}</p>
      <h3>${h.work}</h3>
      ${(o.work || []).filter((w) => w.text).map((w) => `<p class="ob-work"><span>${yrs(w)}</span><span>- ${esc(w.text)}</span></p>`).join("") || `<p class="ob-work"><span></span><span>${h.none}</span></p>`}
    </div>`;
    const rows = (o.rel || []).filter((r) => r.kin || r.fio);
    const page2 = rows.length ? `<div class="cvdoc cd-obj ob-p2">
      <h4>${h.relTitle(esc(o.fio || ""))}${h.relWord ? `<br>${h.relWord}` : ""}</h4>
      <table><thead><tr>${h.cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.kin)}</td><td>${esc(r.fio)}</td><td>${esc(r.birth)}</td>${r.dead ? `<td colspan="2">${esc(h.dead(r.dead))}</td>` : `<td>${esc(r.job)}</td><td>${esc(r.home)}</td>`}</tr>`).join("")}
      </tbody></table></div>` : "";
    return `<div class="ob-doc">${page1}${page2}</div>`;
  }
  // the example as a small picture (scaled real document, so it looks exactly like the result)
  const sampleOf = (k, lang) => k === "obj" ? { ...(OSAMPLE[lang] || OSAMPLE.uz), sample: true } : { ...(SAMPLE[lang] || SAMPLE.uz), sample: true };
  const thumb = (k, lang, big, des) => `<div class="cv-thumb ${big ? "big" : ""}"><div class="cv-scale">${docHTML(sampleOf(k, lang), k, lang, des || design)}</div></div>`;
  const thumbLang = (k) => { const l = langs[k === "obj" ? "obj" : "cv"]; return DOC_LANGS(k).some(([x]) => x === l) ? l : DOC_LANGS(k)[0][0]; };

  /* ---------- screens ---------- */
  function Screen() {
    // every tool is the same card: picture, name, one line about it, order number
    const items = [
      { go: "location.hash='#/cv'", img: "img/tool-cv.webp", t: T("CV, rezyume va obyektivka"), d: T("Bepul, 3 tilda tayyorlang va sizga mos ishlarga ariza topshiring") },
      { go: "location.hash='#/dtm'", img: "img/tool-dtm.webp", t: T("DTM ball kalkulyatori"), d: T("Ballingizni hisoblang va qaysi OTMda grant yoki shartnomaga yetishini ko'ring") },
      { go: "location.hash='#/ielts'", img: "img/tool-ielts.webp", t: T("IELTS ball kalkulyatori"), d: T("To'g'ri javoblaringizdan har bir ko'nikma va umumiy bandni hisoblang") },
      { go: "location.hash='#/unis'", img: "img/tool-uni.webp", t: T("Top 300 universitet va grantlar"), d: T("THE reytingi, mahalliy grantlar, stipendiyalar va sertifikatlar") },
    ];
    return `${navbar(T("Foydali vositalar"))}
    ${window.News ? News.ribbon() : ""}
    <div class="tool-list">${items.map((x, n) => `<button class="card tool-link" onclick="${x.go}">
      <img class="tool-ic ${x.round ? "round" : ""}" src="${x.img}" alt="" width="56" height="56" decoding="async">
      <span><b>${x.t}</b><small>${x.d}</small></span>
      <em class="tool-n">${n + 1}</em></button>`).join("")}</div>`;
  }

  const field = (path, label, val, opt = {}) => `<label class="cvf ${opt.cls || ""}"><small>${label}</small>${opt.area
    ? `<textarea data-p="${path}" rows="${opt.rows || 3}" placeholder="${esc(opt.ph || "")}">${esc(val)}</textarea>`
    : opt.select ? `<select data-p="${path}">${opt.select.map(([k, l]) => `<option value="${esc(k)}" ${k === val ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    : `<input data-p="${path}" value="${esc(val)}" placeholder="${esc(opt.ph || "")}" ${opt.type ? `type="${opt.type}" inputmode="${opt.type === "tel" ? "tel" : opt.type === "email" ? "email" : "text"}"` : ""}>`}</label>`;
  const exItems = () => T("Har bir vazifa yoki natijani yangi qatordan yozing. Raqamlar bilan yozing: \"30 dan ortiq mijoz\", \"sotuvni 20% oshirdi\".");
  const del = (w, i, n) => n > 1 ? `<button class="icon-btn" onclick="cvDel('${w}',${i})" aria-label="x">${ic("x")}</button>` : "";

  function cvForm() {
    const h = H[docLang()] || H.uz;
    return `<h5>${T("Shaxsiy ma'lumotlar")}</h5>
      ${kind === "photo" ? photoField(cv.photo, SAMPLE_PHOTO, T("Rasm: oq yoki och fonda, yuz aniq ko'rinadigan, rasmiy kiyimda.")) : ""}
      ${field("name", T("Ism va familiya"), cv.name, { ph: "Aziz Namunov" })}
      ${field("title", T("Lavozim yoki kasb"), cv.title, { ph: T("Masalan: Sotuv menejeri") })}
      <div class="cvf-row">${field("phone", T("Telefon"), cv.phone, { ph: "+998 90 000 00 00", type: "tel" })}${field("email", T("Email"), cv.email, { ph: "namuna@example.com", type: "email" })}</div>
      <div class="cvf-row">${field("city", T("Shahar"), cv.city, { ph: T("Toshkent, O'zbekiston") })}${field("link", T("LinkedIn yoki Telegram"), cv.link, { ph: "linkedin.com/in/..." })}</div>
      ${field("summary", T("O'zingiz haqingizda qisqacha (2-3 gap)"), cv.summary, { area: 1, rows: 3, ph: T("Masalan: 2 yillik tajribaga ega sotuv menejeri, oyiga 50 dan ortiq mijoz bilan ishlaganman.") })}
      ${kind === "cv" ? `<p class="st-note">${T("CV turida bu qism ko'rsatilmaydi, lekin rezyume va rasmli CV uchun kerak bo'ladi.")}</p>` : ""}

      <h5>${T("Ish tajribasi")}</h5><p class="st-note">${T("Eng oxirgi ish joyidan boshlang.")}</p>
      ${cv.exp.map((e, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${del("exp", i, cv.exp.length)}</div>
        ${field(`exp.${i}.role`, T("Lavozim"), e.role, { ph: T("Masalan: Sotuv menejeri") })}
        <div class="cvf-row">${field(`exp.${i}.org`, T("Kompaniya"), e.org, { ph: "Namuna Group" })}${field(`exp.${i}.city`, T("Shahar"), e.city, { ph: T("Toshkent") })}</div>
        <div class="cvf-row">${field(`exp.${i}.from`, T("Boshlangan"), e.from, { ph: "08/2023" })}${e.now ? `<label class="cvf"><small>${T("Tugagan")}</small><input value="${h.now}" disabled></label>` : field(`exp.${i}.to`, T("Tugagan"), e.to, { ph: "05/2025" })}</div>
        <label class="cv-check"><input type="checkbox" data-p="exp.${i}.now" ${e.now ? "checked" : ""}> ${T("Hozir shu yerda ishlayman")}</label>
        ${field(`exp.${i}.items`, T("Vazifalar va natijalar"), e.items, { area: 1, rows: 4, ph: exItems() })}</div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('exp')">${ic("up")} ${T("Yana ish joyi qo'shish")}</button>

      <h5>${T("Ta'lim")}</h5>
      ${cv.edu.map((e, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${del("edu", i, cv.edu.length)}</div>
        ${field(`edu.${i}.org`, T("O'quv muassasasi"), e.org, { ph: T("Masalan: Toshkent davlat iqtisodiyot universiteti") })}
        <div class="cvf-row">${field(`edu.${i}.degree`, T("Yo'nalish va daraja"), e.degree, { ph: T("Iqtisodiyot, bakalavr") })}${field(`edu.${i}.city`, T("Shahar"), e.city, { ph: T("Toshkent") })}</div>
        <div class="cvf-row">${field(`edu.${i}.from`, T("Boshlangan"), e.from, { ph: "09/2019" })}${field(`edu.${i}.to`, T("Tugagan"), e.to, { ph: "07/2023" })}</div>
        ${field(`edu.${i}.items`, T("Yutuqlar (ixtiyoriy)"), e.items, { area: 1, rows: 2, ph: T("Masalan: GPA 4,5 / 5, imtiyozli diplom") })}</div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('edu')">${ic("up")} ${T("Yana ta'lim qo'shish")}</button>

      <h5>${T("Ko'nikmalar va fazilatlar")}</h5>
      ${field("skills", T("Ko'nikmalar (har biri yangi qatorda)"), cv.skills, { area: 1, rows: 3, ph: T("Tillar: ingliz (B2), rus (B1)\nDasturlar: Excel, Canva") })}
      ${field("traits", T("Shaxsiy fazilatlar (har biri yangi qatorda)"), cv.traits, { area: 1, rows: 3, ph: T("Masalan: Mas'uliyatli") })}
      ${field("certs", T("Sertifikatlar (har biri yangi qatorda)"), cv.certs, { area: 1, rows: 3, ph: T("Masalan: IELTS 7.0, 2025") })}
      ${kind !== "rez" ? field("interests", T("Qiziqishlar (har biri yangi qatorda)"), cv.interests, { area: 1, rows: 2, ph: T("Masalan: Kitob o'qish") }) : ""}

      <h5>${T("Qo'shimcha ma'lumot")}</h5><p class="st-note">${T("Ixtiyoriy: ish beruvchilar ko'pincha so'raydi.")}</p>
      <div class="cvf-row">${field("birth", T("Tug'ilgan sana"), cv.birth, { ph: "15.03.2000" })}${field("salary", T("Kutilayotgan maosh"), cv.salary, { ph: T("Masalan: 8-10 mln so'm") })}</div>
      <div class="cvf-row">${field("schedule", T("Ish grafigi"), cv.schedule, { select: [["", T("Tanlanmagan")], ...Object.entries(h.sched)] })}${field("license", T("Haydovchilik guvohnomasi"), cv.license, { ph: T("Masalan: B toifa") })}</div>
      ${field("military", T("Harbiy guvohnoma"), cv.military, { select: [["", T("Ko'rsatilmasin")], ["yes", h.yes], ["no", h.no]] })}

      <h5>${T("Tavsiya beruvchilar")}</h5><p class="st-note">${T("Sizni yaxshi biladigan rahbar yoki hamkasb. Ixtiyoriy.")}</p>
      ${(cv.refs || []).map((r, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${del("refs", i, 2)}</div>
        ${field(`refs.${i}.name`, T("Ism va familiya"), r.name, { ph: "Dilnoza Namunova" })}
        <div class="cvf-row">${field(`refs.${i}.role`, T("Lavozimi va kompaniya"), r.role, { ph: T("HR menejer, Namuna Group") })}${field(`refs.${i}.phone`, T("Telefon"), r.phone, { ph: "+998 90 000 00 01", type: "tel" })}</div></div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('refs')">${ic("up")} ${T("Tavsiya beruvchi qo'shish")}</button>`;
  }
  const photoField = (src, ph, note) => `<div class="cv-photo"><img src="${esc(src || ph)}" alt=""><label class="btn-ghost">${ic("image")} ${src ? T("Rasmni almashtirish") : T("Rasm qo'shish")}<input type="file" accept="image/*" onchange="cvPhoto(this)" hidden></label>${src ? `<button class="icon-btn" onclick="cvPhotoDel()" aria-label="x">${ic("x")}</button>` : ""}</div><p class="st-note">${note}</p>`;

  function objForm() {
    const h = OH[docLang()] || OH.uz, o = obj;
    const p = (k) => "o." + k;
    return `<h5>${T("Shaxsiy ma'lumotlar")}</h5>
      ${photoField(o.photo, SAMPLE_PHOTO_34, T("Rasm 3x4: oq fonda, rasmiy kiyimda, yuz to'g'ri qaragan."))}
      ${field(p("fio"), T("Familiya, ism va otasining ismi"), o.fio, { ph: "Namunov Aziz Akmal o'g'li" })}
      <div class="cvf-row">${field(p("since"), T("Hozirgi lavozimga tayinlangan sana"), o.since, { ph: "2022 yil 1 sentyabr" })}${field(p("birth"), T("Tug'ilgan sana"), o.birth, { ph: "12.04.1998" })}</div>
      ${field(p("pos"), T("Hozirgi ish joyi va lavozimi"), o.pos, { area: 1, rows: 2, ph: T("Masalan: Namuna Group MChJ moliya bo'limi bosh mutaxassisi") })}
      ${field(p("place"), T("Tug'ilgan joyi"), o.place, { ph: T("Masalan: Toshkent shahri") })}
      <div class="cvf-row">${field(p("nation"), T("Millati"), o.nation, { ph: T("o'zbek") })}${field(p("party"), T("Partiyaviyligi"), o.party, { ph: h.none })}</div>
      <h5>${T("Ma'lumoti")}</h5>
      <div class="cvf-row">${field(p("edu"), T("Ma'lumoti"), o.edu, { select: [["", T("Tanlang")], ...(docLang() === "ru" ? [["Высшее", "Высшее"], ["Среднее специальное", "Среднее специальное"], ["Среднее", "Среднее"]] : docLang() === "uzc" ? [["Олий", "Олий"], ["Ўрта махсус", "Ўрта махсус"], ["Ўрта", "Ўрта"]] : [["Oliy", "Oliy"], ["O'rta maxsus", "O'rta maxsus"], ["O'rta", "O'rta"]])] })}${field(p("spec"), T("Mutaxassisligi"), o.spec, { ph: T("Masalan: Iqtisodiyot") })}</div>
      ${field(p("grad"), T("Tamomlagan (yili va o'quv yurti, har biri yangi qatorda)"), o.grad, { area: 1, rows: 2, ph: T("2020 yil, Namuna davlat universiteti (kunduzgi)") })}
      <div class="cvf-row">${field(p("degree"), T("Ilmiy darajasi"), o.degree, { ph: h.none })}${field(p("rank"), T("Ilmiy unvoni"), o.rank, { ph: h.none })}</div>
      ${field(p("langs"), T("Qaysi chet tillarini biladi"), o.langs, { ph: T("Masalan: rus, ingliz") })}
      ${field(p("awards"), T("Davlat mukofotlari"), o.awards, { ph: h.none })}
      ${field(p("deputy"), T("Deputat yoki saylanadigan organ a'zosimi"), o.deputy, { ph: h.none })}
      <h5>${T("Mehnat faoliyati")}</h5><p class="st-note">${T("O'qish yillaridan boshlab, ketma-ket yozing. Hozirgi joy uchun \"gacha\" maydonini bo'sh qoldiring.")}</p>
      ${o.work.map((w, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${del("o.work", i, o.work.length)}</div>
        <div class="cvf-row">${field(`o.work.${i}.from`, T("Yildan"), w.from, { ph: "2016" })}${field(`o.work.${i}.to`, T("Yilgacha"), w.to, { ph: h.now })}</div>
        ${field(`o.work.${i}.text`, T("Lavozim va tashkilot"), w.text, { ph: T("Masalan: Misol Savdo MChJ hisobchisi") })}</div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('o.work')">${ic("up")} ${T("Yana qo'shish")}</button>
      <h5>${T("Yaqin qarindoshlar")}</h5><p class="st-note">${T("Ota-ona, aka-uka, opa-singil, turmush o'rtog'i va farzandlar. Vafot etganlar uchun vafot yilini yozing.")}</p>
      ${o.rel.map((r, i) => `<div class="cv-entry"><div class="cv-entry-h"><b>${i + 1}</b>${del("o.rel", i, o.rel.length)}</div>
        ${field(`o.rel.${i}.kin`, T("Qarindoshligi"), r.kin, { select: [["", T("Tanlang")], ...h.kin.map((k) => [k, k])] })}
        ${field(`o.rel.${i}.fio`, T("Familiyasi, ismi va otasining ismi"), r.fio, { ph: "Namunov Akmal Karimovich" })}
        ${field(`o.rel.${i}.birth`, T("Tug'ilgan yili va joyi"), r.birth, { ph: T("1970 yil, Toshkent shahri") })}
        ${field(`o.rel.${i}.job`, T("Ish joyi va lavozimi"), r.job, { ph: T("Masalan: Misol maktabi o'qituvchisi") })}
        ${field(`o.rel.${i}.home`, T("Turar joyi"), r.home, { ph: T("Masalan: Toshkent shahri, Chilonzor tumani, ...") })}
        ${field(`o.rel.${i}.dead`, T("Vafot etgan yili (bo'lsa)"), r.dead, { ph: "" })}</div>`).join("")}
      <button class="btn-ghost" onclick="cvAdd('o.rel')">${ic("up")} ${T("Qarindosh qo'shish")}</button>`;
  }

  function CV() {
    const tp = TYPES(), cur = tp.find((t) => t.k === kind) || tp[0], dl = thumbLang(kind);
    if (langs[kind === "obj" ? "obj" : "cv"] !== dl) { langs[kind === "obj" ? "obj" : "cv"] = dl; save(); }
    return `${navbar(T("CV va rezyume"))}
    <div class="card box cv-diff">
      <h4>${ic("sparkles")} ${T("Qaysi hujjat kerak?")}</h4>
      <div class="cv-two"><span><b>CV</b>${T("To'liq hikoya: barcha ta'lim, ish, sertifikat va yutuqlar. Odatda 1-2 sahifa.")}</span>
      <span><b>${T("Rezyume")}</b>${T("Qisqa reklama: faqat shu ishga kerakli eng muhim tajriba. Har doim 1 sahifa.")}</span>
      <span class="wide"><b>${T("Obyektivka")}</b>${T("Davlat idoralari, bank va oliygohlar so'raydigan rasmiy ma'lumotnoma, qarindoshlar haqida ma'lumot bilan.")}</span></div>
    </div>
    <div class="section-title">${T("1. Hujjat turini tanlang")}</div>
    <div class="cv-types">${tp.map((t) => `<button class="card cv-type ${t.k === kind ? "on" : ""}" onclick="cvKind('${t.k}')">
      ${thumb(t.k, thumbLang(t.k))}<b>${t.name}</b><small>${t.d}</small><em onclick="event.stopPropagation();cvSample('${t.k}')">${ic("search")} ${T("Namunani ko'rish")}</em></button>`).join("")}</div>

    <div class="section-title">${T("2. Hujjat tilini tanlang")}</div>
    <div class="card box cv-lang">
      <div class="seg">${DOC_LANGS(kind).map(([k, l]) => `<button class="${k === dl ? "on" : ""}" onclick="cvLang('${k}')">${l}</button>`).join("")}</div>
      <p class="st-note">${T("Sarlavhalar va namuna shu tilda bo'ladi. Ma'lumotlaringizni ham shu tilda yozing.")}</p>
    </div>
    ${kind !== "obj" ? `<div class="section-title">${T("3. Dizaynni tanlang")}</div>
    <div class="cv-designs">${DESIGNS().map(([k, l]) => `<button class="card ${k === design ? "on" : ""}" onclick="cvDesign('${k}')">${thumb(kind, dl, false, k)}<b>${l}</b></button>`).join("")}</div>` : ""}

    <div class="section-title">${kind === "obj" ? "3" : "4"}. ${T("Ma'lumotlaringizni yozing")}</div>
    <div class="card box cv-form" id="cv-form">
      <div class="cv-tools"><button class="btn-ghost" onclick="cvFill()">${ic("sparkles")} ${T("Namuna bilan to'ldirish")}</button><button class="btn-ghost" onclick="cvClear()">${ic("x")} ${T("Tozalash")}</button></div>
      ${stepper(kind === "obj" ? objForm() : cvForm())}
    </div>

    <div class="section-title">${kind === "obj" ? "4" : "5"}. ${T("Natija")}: ${cur.name}</div>
    <div class="cv-live" id="cv-live">${thumb2()}</div>
    <div class="cv-export">
      <button class="btn-primary x-pdf" onclick="cvExport('pdf')">${ic("download")} PDF</button>
      <button class="btn-primary x-word" onclick="cvExport('docx')">${ic("file")} Word</button>
      <button class="btn-primary x-png" onclick="cvExport('png')">${ic("image")} PNG</button>
    </div>
    <p class="note">${T("Fayl Telegram orqali yuklab olinadi yoki bot bilan chatingizga yuboriladi. Ma'lumotlaringiz faqat shu telefonda saqlanadi.")}</p>
    <div class="section-title">${kind === "obj" ? "5" : "6"}. ${T("Sizga mos ishlar")}</div>
    <div class="card box jm" id="cv-jobs">${jobsHTML()}</div>`;
  }
  const current = () => kind === "obj" ? obj : cv;
  // the form is shown one step at a time; each step says what to write there
  const STEP_HINTS = () => kind === "obj"
    ? [T("F.I.Sh., 3x4 rasm, hozirgi lavozim, tug'ilgan sana va joy."), T("Ma'lumotingiz, tamomlagan o'quv yurtlari va chet tillari."), T("Barcha o'qish va ish joylari, yillari bilan, ketma-ket."), T("Ota-ona, aka-uka, opa-singil, turmush o'rtog'i va farzandlar.")]
    : [T("Ism, lavozim va aloqa: ish beruvchi sizga shu orqali bog'lanadi."), T("Oxirgi ish joyidan boshlang, natijalarni raqamlar bilan yozing."), T("O'qigan joyingiz, yo'nalishingiz va yillar."), T("Tillar, dasturlar, sertifikatlar va fazilatlaringiz."), T("Ixtiyoriy: maosh, ish grafigi va tavsiya beruvchilar.")];
  let stepAt = store.get("cv_step", { cv: 0, obj: 0 });
  function stepper(html) {
    const parts = html.split("<h5>").filter((x) => x.trim()).map((x) => { const i = x.indexOf("</h5>"); return { title: x.slice(0, i), body: x.slice(i + 5) }; });
    // CV: the last two blocks (extra information and references) are one step
    const groups = kind === "obj" ? parts.map((p) => [p]) : [[parts[0]], [parts[1]], [parts[2]], [parts[3]], parts.slice(4)];
    const hints = STEP_HINTS(), n = groups.length, key = kind === "obj" ? "obj" : "cv", cur = Math.min(stepAt[key] || 0, n - 1);
    return `<div class="cv-prog"><span>${T("Qadam {a} / {b}", { a: cur + 1, b: n })}</span><i><em style="width:${((cur + 1) / n) * 100}%"></em></i></div>
      ${groups.map((g, i) => `<section class="cv-step ${i === cur ? "open" : ""} ${i < cur ? "done" : ""}" id="cv-step-${i}">
        <button class="cv-step-h" onclick="cvStep(${i})"><i>${i < cur ? ic("check") : i + 1}</i><span><b>${g[0].title}</b><small>${hints[i] || ""}</small></span>${ic("chev", "cv-step-chev")}</button>
        <div class="cv-step-b">${g.map((p, j) => (j ? `<h5>${p.title}</h5>` : "") + p.body).join("")}
          <div class="cv-step-nav">${i > 0 ? `<button class="btn-ghost" onclick="cvStep(${i - 1})">${ic("back")} ${T("Orqaga")}</button>` : ""}
          ${i < n - 1 ? `<button class="btn-primary" onclick="cvStep(${i + 1})">${T("Keyingi qadam")} ${ic("chev")}</button>` : `<button class="btn-primary" onclick="cvDone()">${ic("check")} ${T("Natijani ko'rish")}</button>`}</div>
        </div></section>`).join("")}`;
  }
  window.cvStep = (i) => { stepAt[kind === "obj" ? "obj" : "cv"] = i; store.set("cv_step", stepAt); haptic("light"); render(); setTimeout(() => { const el = document.getElementById("cv-step-" + i); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); };
  window.cvDone = () => { haptic("medium"); const el = document.getElementById("cv-live"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  /* ---------- jobs that fit the document: hh.uz vacancies from the course data, scored against the CV ---------- */
  const low = (x) => " " + String(x || "").toLowerCase().replace(/[‘’ʻʼ`]/g, "'").replace(/\s+/g, " ") + " ";
  const has = (text, kw) => kw.length <= 3 ? new RegExp(`(^|[^\\p{L}\\d+])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\d]|$)`, "u").test(text) : text.includes(kw);
  function matchJobs(doc = current(), k = kind) {
    const d = Kurslar.data(); if (!d) return null;
    const strong = k === "obj" ? low([doc.pos, doc.spec, ...(doc.work || []).slice(-2).map((w) => w.text)].join(" ")) : low([doc.title, ...(doc.exp || []).map((e) => e.role)].join(" "));
    const weak = k === "obj" ? low([doc.grad, doc.langs].join(" ")) : low([doc.summary, doc.skills, doc.certs, doc.traits, ...(doc.edu || []).map((e) => e.degree), ...(doc.exp || []).map((e) => e.items)].join(" "));
    if (strong.trim().length < 3 && weak.trim().length < 3) return null;
    const words = strong.split(/[^\p{L}\d'+]+/u).filter((w) => w.length >= 4).map((w) => w.slice(0, 5));
    const best = new Map(); let pool = 0;
    for (const [k, g] of Object.entries(d.groups)) {
      if (!g.jobs) continue; pool += g.jobs.length;
      if (!g.kw) continue;
      let st = 0, wk = 0; for (const kw of g.kw) { if (has(strong, kw)) st++; else if (has(weak, kw)) wk++; }
      const gs = st ? 0.8 + 0.04 * Math.min(3, st - 1) + 0.02 * Math.min(3, wk) : wk ? 0.44 + 0.08 * Math.min(4, wk) : 0;
      if (!gs) continue;
      for (const j of g.jobs) {
        const sc = Math.min(98, Math.round((gs + (words.some((x) => low(j.t).includes(x)) ? 0.08 : 0)) * 100));
        const prev = best.get(j.u); if (!prev || prev.sc < sc) best.set(j.u, { ...j, sc });
      }
    }
    const list = [...best.values()].sort((a, b) => b.sc - a.sc || String(b.d).localeCompare(String(a.d)));
    return { list, pool: new Set(Object.values(d.groups).flatMap((g) => (g.jobs || []).map((j) => j.u))).size };
  }
  let jmFilter = "all", jmMin = 80, jmShow = 15, jmCur = [];
  function jobsHTML() {
    const m = matchJobs();
    if (!Kurslar.data()) { Kurslar.load().then(refreshJobs); return `<p class="st-note">${T("Yuklanmoqda…")}</p>`; }
    if (!m) return `<div class="jm-empty">${chip("briefcase", "lg")}<p>${T("Lavozimingiz yoki ish tajribangizni yozing: sizga mos ishlarni hh.uz vakansiyalaridan topib beramiz.")}</p></div>`;
    const n80 = m.list.filter((j) => j.sc >= 80).length, n60 = m.list.filter((j) => j.sc >= 60 && j.sc < 80).length;
    const pass = (j) => j.sc >= jmMin && (jmFilter === "all" || (jmFilter === "rem" && j.r) || (jmFilter === "tash" && /toshkent/i.test(j.c || "")) || (jmFilter === "pay" && (j.lo || j.hi || 0) >= 8));
    const shown = m.list.filter(pass);
    const f = (k, l) => `<button class="${jmFilter === k ? "on" : ""}" onclick="jmSet('${k}')">${l}</button>`;
    return `<div class="jm-stats">
        <div class="jm-big"><b>${n80}</b><span>${T("ta ish sizga 80% va undan ko'p mos")}</span></div>
        <div class="jm-row"><span><i class="g"></i>80%+ <b>${n80}</b></span><span><i class="y"></i>60-79% <b>${n60}</b></span><span>${T("Jami tekshirildi")} <b>${m.pool}</b></span></div>
        <p class="st-note">${T("hh.uz, so'nggi 30 kun, maoshi oyiga 3,5 mln so'm va undan yuqori vakansiyalar. Moslik lavozimingiz, tajribangiz va ko'nikmalaringiz bo'yicha hisoblanadi.")}</p>
      </div>
      <div class="kd-filter">${f("all", T("Barchasi"))}${f("rem", T("Masofaviy"))}${f("tash", T("Toshkent"))}${f("pay", T("8 mln so'mdan"))}
        <button class="${jmMin === 60 ? "on" : ""}" onclick="jmMinSet()">${T("60%+ ham")}</button></div>
      <div class="jm-list">${(jmCur = shown.slice(0, jmShow)).map((j, i) => `<div class="jm-job">
          <span class="jm-sc ${j.sc >= 80 ? "hi" : "mid"}">${j.sc}%</span>
          <span class="jm-t"><b class="notr">${esc(j.t)}</b><small><span class="notr">${esc(j.e)}${j.c ? ", " + esc(j.c) : ""}</span>${j.r ? ", " + T("masofaviy") : ""}</small><em>${jmMoney(j)}</em></span>
          <span class="jm-act"><button class="btn-primary" onclick="jmApply(${i})">${T("Ariza topshirish")}</button>
          <button class="icon-btn" onclick="jmSave(${i})" aria-label="${T("Saqlanganlarga yuborish")}">${ic("send")}</button></span>
        </div>`).join("") || `<p class="st-note">${T("Bu filtr bo'yicha ish topilmadi. Boshqa filtrni tanlang yoki 60%+ ishlarni ham ko'ring.")}</p>`}</div>
      ${shown.length > jmShow ? `<button class="btn-ghost" onclick="jmMore()">${T("Yana ko'rsatish ({n})", { n: shown.length - jmShow })}</button>` : ""}`;
  }
  const jmMoney = (j) => j.lo && j.hi && j.hi !== j.lo ? T("{n} mln so'm", { n: `${String(j.lo).replace(".", ",")}-${String(j.hi).replace(".", ",")}` }) : j.lo ? T("{n} mln so'mdan", { n: String(j.lo).replace(".", ",") }) : j.hi ? T("{n} mln so'mgacha", { n: String(j.hi).replace(".", ",") }) : "";
  const refreshJobs = () => { const el = document.getElementById("cv-jobs"); if (el) el.innerHTML = jobsHTML(); };
  window.jmSet = (k) => { jmFilter = k; jmShow = 15; haptic("light"); refreshJobs(); };
  window.jmMinSet = () => { jmMin = jmMin === 80 ? 60 : 80; jmShow = 15; haptic("light"); refreshJobs(); };
  window.jmMore = () => { jmShow += 15; refreshJobs(); };
  // apply: the vacancy page on hh.uz itself
  window.jmApply = (i) => { const u = jmCur[i].u; haptic("medium"); try { track("#/cv"); } catch {} if (tg && tg.openLink) tg.openLink(u); else window.open(u, "_blank"); };
  // save: Telegram's own "send to" window, where Saved Messages is the first chat
  window.jmSave = (i) => { const u = jmCur[i].u, t = jmCur[i].t; haptic("light"); const url = `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t + " (" + T("hh.uz vakansiyasi") + ")")}`; if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank"); };
  // after a file is made: how many jobs fit
  function afterDoc() {
    const m = matchJobs(); if (!m) return;
    const n80 = m.list.filter((j) => j.sc >= 80).length;
    sheet(`<div class="jm-done">${chip("check", "lg solid")}<h3>${T("Hujjatingiz tayyor!")}</h3>
      <p>${n80 ? T("Sizga <b>{n} ta ish</b> 80% va undan ko'p mos keladi. Hozir ariza topshiring.", { n: n80 }) : T("Mos ishlarni ko'rish uchun lavozim va tajribangizni to'liqroq yozing.")}</p></div>
      <button class="btn-primary" onclick="closeSheet();setTimeout(()=>document.getElementById('cv-jobs')?.scrollIntoView({behavior:'smooth'}),250)">${ic("briefcase")} ${T("Mos ishlarni ko'rish")}</button>`);
  }
  // the saved CV (not the example): its best jobs, for the Kurslar page
  function cvJobs() {
    const doc = Object.assign(blank(), store.get("cv_data", null) || {});
    const filled = (doc.title || "").trim().length > 2 || (doc.exp || []).some((e) => (e.role || "").trim()) || (doc.skills || "").trim().length > 3;
    if (!filled || !Kurslar.data()) return null;
    const m = matchJobs(doc, "cv"); if (!m || !m.list.length) return null;
    return { name: (doc.name || "").trim().split(/\s+/)[0], title: doc.title, top: m.list.filter((j) => j.sc >= 60).slice(0, 3), n80: m.list.filter((j) => j.sc >= 80).length };
  }
  window.cvJobOpen = (u) => { haptic("medium"); try { track("#/kurslar"); } catch {} if (tg && tg.openLink) tg.openLink(u); else window.open(u, "_blank"); };
  const thumb2 = () => `<div class="cv-thumb big"><div class="cv-scale">${docHTML(current(), kind, docLang(), design)}</div></div>`;
  const refresh = () => { const el = document.getElementById("cv-live"); if (el) el.innerHTML = thumb2(); refreshJobs(); };

  // the form keeps focus while typing: only the preview below is redrawn
  const target = (path) => { const keys = path.split("."); let o = keys[0] === "o" ? (keys.shift(), obj) : cv; while (keys.length > 1) o = o[keys.shift()]; return [o, keys[0]]; };
  const onField = (e) => {
    const p = e.target && e.target.dataset && e.target.dataset.p; if (!p || !e.target.closest("#cv-form")) return;
    const [o, k] = target(p); o[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    save(); clearTimeout(refresh.t); refresh.t = setTimeout(refresh, 250);
    if (e.target.type === "checkbox") render();
  };
  document.addEventListener("input", onField);
  document.addEventListener("change", (e) => { if (e.target && e.target.tagName === "SELECT") onField(e); });
  window.cvKind = (k) => { kind = k; save(); haptic("light"); render(); };
  window.cvLang = (l) => { langs[kind === "obj" ? "obj" : "cv"] = l; save(); haptic("light"); render(); };
  window.cvDesign = (d) => { design = d; save(); haptic("light"); render(); };
  const blankOf = { exp: blankExp, edu: blankEdu, refs: () => ({ name: "", role: "", phone: "" }), "o.work": () => ({ from: "", to: "", text: "" }), "o.rel": blankRel };
  const listOf = (w) => w === "o.work" ? obj.work : w === "o.rel" ? obj.rel : cv[w];
  window.cvAdd = (w) => { listOf(w).push(blankOf[w]()); save(); render(); };
  window.cvDel = (w, i) => { listOf(w).splice(i, 1); save(); render(); };
  window.cvFill = () => {
    if (kind === "obj") { const keep = obj.photo; obj = Object.assign(blankObj(), JSON.parse(JSON.stringify(OSAMPLE[docLang()] || OSAMPLE.uz))); obj.photo = keep; }
    else { const keep = cv.photo; cv = Object.assign(blank(), JSON.parse(JSON.stringify(SAMPLE[docLang()] || SAMPLE.uz))); cv.photo = keep; }
    save(); haptic("medium"); render();
  };
  window.cvClear = async () => { if (!(await confirmAsk(T("Barcha yozganlaringiz o'chiriladi. Davom etasizmi?")))) return; if (kind === "obj") obj = blankObj(); else cv = blank(); save(); render(); };
  window.cvPhotoDel = () => { current().photo = ""; save(); render(); };
  // photo: CV round photo is a centre square; obyektivka photo is 3x4
  window.cvPhoto = (input) => {
    const f = input.files && input.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const [W, Hh] = kind === "obj" ? [300, 400] : [360, 360], r = W / Hh;
      let sw = img.width, sh = img.height; if (sw / sh > r) sw = sh * r; else sh = sw / r;
      const c = document.createElement("canvas"); c.width = W; c.height = Hh;
      c.getContext("2d").drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, Hh);
      current().photo = c.toDataURL("image/jpeg", 0.85); save(); URL.revokeObjectURL(img.src); render();
    };
    img.src = URL.createObjectURL(f);
  };
  // full-size example in a sheet
  window.cvSample = (k) => {
    haptic("light");
    const t = TYPES().find((x) => x.k === k);
    sheet(`<h3>${T("Namuna")}: ${t.name}</h3><p>${t.d}</p>${thumb(k, thumbLang(k), true)}<button class="btn-primary" onclick="closeSheet();cvKind('${k}')">${T("Shu turni tanlash")}</button>`);
  };

  /* ---------- export ---------- */
  const lib = (src, name) => window[name] ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  async function canvasOf() {
    await lib("lib/html2canvas.min.js", "html2canvas");
    const host = document.createElement("div");
    host.className = "cv-render"; host.innerHTML = docHTML(current(), kind, docLang(), design);
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
  const run = (t, o = {}) => `<w:r><w:rPr>${o.font ? `<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}"/>` : ""}${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}<w:sz w:val="${o.sz || 21}"/>${o.c ? `<w:color w:val="${o.c}"/>` : ""}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
  const para = (runs, o = {}) => `<w:p><w:pPr>${o.center ? '<w:jc w:val="center"/>' : o.right ? '<w:jc w:val="right"/>' : ""}${o.rule ? `<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="${o.rule === 1 ? "111111" : o.rule}"/></w:pBdr>` : ""}${o.tab ? `<w:tabs><w:tab w:val="${o.tabLeft ? "left" : "right"}" w:pos="${o.tab === 1 ? 10200 : o.tab}"/></w:tabs>` : ""}${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 220}"/>` : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after || 40}"/></w:pPr>${runs}</w:p>`;
  const picture = (cx, cy) => `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="photo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  const ACCENT = { classic: "111111", elegant: "8A6D3B", modern: "2748F5" };
  function docxBody(d) {
    const h = H[docLang()] || H.uz, out = [], acc = ACCENT[design] || "111111", font = design === "elegant" ? "Georgia" : null;
    if (kind === "photo" && d.photo) out.push(`<w:p>${picture(1080000, 1080000)}</w:p>`);
    out.push(para(run(d.name, { b: 1, sz: 34, font, c: design === "modern" ? acc : null }), { center: kind !== "photo", after: 20 }));
    if (d.title && kind !== "cv") out.push(para(run(d.title, { sz: 24, c: design === "classic" ? "444444" : acc, font }), { center: kind !== "photo", after: 20 }));
    out.push(para(run([d.phone, d.city, d.email, d.link].filter(Boolean).join("  |  "), { sz: 19 }), { center: kind !== "photo", after: 160 }));
    const heading = (t) => out.push(para(run(t.toUpperCase(), { b: 1, sz: 21, font, c: design === "classic" ? null : acc }), { rule: acc, before: 200, after: 80 }));
    const bullets = (s) => lines(s).forEach((x) => out.push(para(run("•  " + x, { sz: 20 }), { ind: 360, after: 30 })));
    const entries = (list, a, b, sub) => list.filter((e) => e[a] || e[sub]).forEach((e) => {
      out.push(para(run(e[a], { b: 1 }) + (e[b] ? run(", " + e[b]) : "") + `<w:r><w:tab/></w:r>` + run(dates(e, h), { sz: 19 }), { tab: 1, before: 100, after: 10 }));
      if (e[sub]) out.push(para(run(e[sub], { i: 1 }), { after: 30 }));
      bullets(e.items);
    });
    const order = kind === "rez" ? ["summary", "exp", "skills", "edu", "certs", "traits", "extra", "refs"]
      : kind === "photo" ? ["summary", "exp", "edu", "certs", "skills", "traits", "extra", "interests", "refs"] : ["edu", "exp", "certs", "skills", "traits", "extra", "interests", "refs"];
    for (const k of order) {
      if (k === "summary" && d.summary && kind !== "cv") { heading(h.summary); out.push(para(run(d.summary, { sz: 20 }), { after: 40 })); }
      if (k === "exp" && d.exp.some((e) => e.role || e.org)) { heading(h.exp); entries(d.exp, "org", "city", "role"); }
      if (k === "edu" && d.edu.some((e) => e.org || e.degree)) { heading(h.edu); entries(d.edu, "org", "city", "degree"); }
      if (["certs", "skills", "interests", "traits"].includes(k) && lines(d[k]).length) { heading(h[k]); bullets(d[k]); }
      if (k === "extra" && extraLines(d, h).length) { heading(h.extra); bullets(extraLines(d, h).join("\n")); }
      if (k === "refs" && (d.refs || []).some((r) => r.name)) { heading(h.refs); d.refs.filter((r) => r.name).forEach((r) => out.push(para(run(r.name, { b: 1 }) + (r.role ? run(", " + r.role) : "") + (r.phone ? run("  " + r.phone, { sz: 19 }) : ""), { after: 40 }))); }
    }
    return out.join("");
  }
  // obyektivka in Word: Times New Roman, photo top right, label + value lines, relatives table on page 2
  function objDocx(o) {
    const lang = docLang(), h = OH[lang] || OH.uz, f = "Times New Roman", out = [], none = (x) => x || h.none;
    const yrs = (w) => `${w.from}${w.from ? "-" : ""}${w.to || h.now}${!w.to ? "" : lang === "uz" ? " yy." : lang === "uzc" ? " йй." : " гг."}`;
    if (o.photo) out.push(`<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${picture(1080000, 1440000)}</w:p>`);
    out.push(para(run(h.title, { b: 1, sz: 28, font: f }), { center: 1, after: 120 }));
    out.push(para(run(o.fio, { b: 1, sz: 28, font: f }), { center: 1, after: 160 }));
    if (o.pos) { out.push(para(run(o.since ? h.since(o.since) : "", { sz: 24, font: f }), { after: 20 })); out.push(para(run(o.pos, { b: 1, sz: 24, font: f }), { after: 120 })); }
    const pair = (a, av, b, bv) => out.push(para(run(a + " ", { b: 1, sz: 24, font: f }) + run(av, { sz: 24, font: f }) + `<w:r><w:tab/></w:r>` + run(b + " ", { b: 1, sz: 24, font: f }) + run(bv, { sz: 24, font: f }), { tab: 5200, tabLeft: 1, after: 80 }));
    const one = (a, av) => out.push(para(run(a + " ", { b: 1, sz: 24, font: f }) + run(av, { sz: 24, font: f }), { after: 80 }));
    pair(h.birth, o.birth, h.place, o.place); pair(h.nation, o.nation, h.party, none(o.party));
    pair(h.edu, o.edu, h.grad, lines(o.grad).join("; "));
    one(h.spec, o.spec); pair(h.degree, none(o.degree), h.rank, none(o.rank)); one(h.langs, none(o.langs)); one(h.awards, none(o.awards)); one(h.deputy, none(o.deputy));
    out.push(para(run(h.work, { b: 1, sz: 26, font: f }), { center: 1, before: 240, after: 120 }));
    const work = (o.work || []).filter((w) => w.text);
    (work.length ? work : [{ from: "", to: "", text: h.none }]).forEach((w) => out.push(para(run(w.from || w.to ? yrs(w) : "", { sz: 24, font: f }) + `<w:r><w:tab/></w:r>` + run("- " + w.text, { sz: 24, font: f }), { tab: 2000, tabLeft: 1, ind: 2000, hang: 2000, after: 60 })));
    const rows = (o.rel || []).filter((r) => r.kin || r.fio);
    if (rows.length) {
      out.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
      out.push(para(run(h.relTitle(o.fio || ""), { b: 1, sz: 24, font: f }), { center: 1, after: 0 }));
      if (h.relWord) out.push(para(run(h.relWord, { b: 1, sz: 24, font: f }), { center: 1, after: 120 }));
      const W = [1500, 2300, 1800, 2400, 2300];
      const cell = (t, w, o2 = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o2.span ? `<w:gridSpan w:val="${o2.span}"/>` : ""}<w:vAlign w:val="center"/></w:tcPr>${para(run(t, { b: o2.b, sz: 20, font: f }), { center: 1, after: 0 })}</w:tc>`;
      const border = ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join("");
      out.push(`<w:tbl><w:tblPr><w:tblW w:w="10200" w:type="dxa"/><w:tblBorders>${border}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${W.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>
        <w:tr>${h.cols.map((c, i) => cell(c, W[i], { b: 1 })).join("")}</w:tr>
        ${rows.map((r) => `<w:tr>${cell(r.kin, W[0])}${cell(r.fio, W[1])}${cell(r.birth, W[2])}${r.dead ? cell(h.dead(r.dead), W[3] + W[4], { span: 2 }) : cell(r.job, W[3]) + cell(r.home, W[4])}</w:tr>`).join("")}</w:tbl>`);
      out.push(para("", {}));
    }
    return out.join("");
  }
  async function makeDOCX() {
    const d = current(), photoOK = (kind === "photo" || kind === "obj") && d.photo && /^data:image\/jpeg/.test(d.photo);
    const photo = photoOK ? Uint8Array.from(atob(d.photo.split(",")[1]), (c) => c.charCodeAt(0)) : null;
    const body = kind === "obj" ? objDocx(d) : docxBody(d);
    const lang = { uz: "uz-Latn-UZ", uzc: "uz-Cyrl-UZ", ru: "ru-RU", en: "en-GB" }[docLang()] || "uz-Latn-UZ";
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const files = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`],
      ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${photo ? '<Relationship Id="rPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.jpg"/>' : ""}</Relationships>`],
      ["word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="21"/><w:lang w:val="${lang}"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`],
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


  const fileName = () => kind === "obj" ? (obj.fio || "Obyektivka").trim().split(/\s+/).slice(0, 2).join("_") + "_" + T("Obyektivka")
    : (cv.name || "CV").trim().replace(/\s+/g, "_") + "_" + { cv: "CV", rez: T("Rezyume"), photo: "CV" }[kind];
  window.cvExport = (ext) => {
    const nm = kind === "obj" ? obj.fio : cv.name;
    if (!String(nm || "").trim()) { toast(T("Avval ismingizni yozing")); document.querySelector(`[data-p="${kind === "obj" ? "o.fio" : "name"}"]`)?.focus(); return; }
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
      setTimeout(afterDoc, 700);
    } catch (e) { toast(T("Fayl tayyorlanmadi: {e}", { e: e.message || e })); }
    finally { busy.remove(); }
  };
  // _test: used by tools/test_cv.js to check the Word files outside the browser
  return { Screen, CV, cvJobs, money: (j) => jmMoney(j), _test: { makeDOCX, use: (d, k, l, des) => { if (k === "obj") obj = d; else cv = d; kind = k; langs[k === "obj" ? "obj" : "cv"] = l; design = des || "classic"; }, SAMPLE, OSAMPLE } };
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

