# Rebuilds public/data/kurslar.json from the hh.uz vacancy sheet.
#
#   python -X utf8 tools/build_kurslar.py "C:/Users/Dilmurod/Downloads/hh_uz_AI_vacancies_Nov2026.xlsx"
#   python -X utf8 tools/build_kurslar.py <xlsx> --review   # print each course type with its matching job titles
#   python -X utf8 tools/build_kurslar.py <xlsx> --titles   # list shown job titles that still need an Uzbek translation
#
# Rule: a vacancy counts for a course type only when its hh.uz profession category (role_id) or its own
# job title clearly names that job or skill. Each course type has its own rule, so a Turkish course only
# counts vacancies that ask for Turkish, a Russian course only those that ask for Russian, and so on.
# Course details (title, mentor, students, rating...) come from the existing kurslar.json (ustoz.ai pages).
# OLX ads come from tools/olx_pool.json and are kept only when the ad title matches the course type.
# Shown job titles, employers and cities are written in Uzbek Latin (tools/uz_titles.json + transliteration).
import json, re, sys, os, statistics, datetime, collections
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "kurslar.json")
TR = os.path.join(ROOT, "tools", "uz_titles.json")

# ---------------------------------------------------------------- course types
# kind: job (vacancies counted) | general (useful for any job) | hobby | study (school / medicine)
# roles: hh.uz role_id list, inc / exc: regex on the job title (case-insensitive)
# strong: the course alone teaches the core of the job
# months: estimate of the time to the first job at 1-2 hours of study a day = time to learn the skill to job level
#   + job search (longer where few vacancies take beginners: see the noexp share). None where a month figure would mislead.
G = [
  dict(k="tr", name="Turk tili", kind="job", inc=r"турецк|turk til|turkish|türkçe|turkcha", job="turk tilini biladigan tarjimon, o'qituvchi yoki menejer", hint="turk tili", months=[6, 12], mnote="agar tilni noldan o'rgansangiz", strong=True),
  dict(k="ar", name="Arab tili", kind="job", inc=r"арабск\w*\s+(язык|и\b)|арабскому|arab til|\barabic\b", exc=r"парфюм", job="arab tilini biladigan o'qituvchi, tarjimon yoki menejer", hint="arab tili", months=[6, 12], mnote="agar tilni noldan o'rgansangiz", strong=True),
  dict(k="ru", name="Rus tili", kind="job", inc=r"русск|russian|rus til", exc=r"белорус", job="rus tilini biladigan operator, o'qituvchi yoki menejer", hint="rus tili", months=[6, 12], mnote="agar tilni noldan o'rgansangiz", strong=True),
  dict(k="en", name="Ingliz tili va IELTS", kind="job", inc=r"английск|english|ielts|ingliz", exc=r"smm|школу английск", job="ingliz tilini biladigan o'qituvchi, menejer yoki assistent", hint="ingliz tili", months=[9, 18], mnote="agar tilni noldan o'rgansangiz", strong=True,
       note="Ingliz tili o'qituvchilaridan odatda IELTS 7 va undan yuqori ball so'raladi."),
  dict(k="uz", name="O'zbek tili", kind="job", inc=r"узбекск\w*\s+(и\s+\w+\s+)?язык|узбекского|узбекскому|o.zbek til|uzbek language|ona tili|родн\w+ язык|davlat tili|государственн\w* язык", job="o'zbek tilini mukammal biladigan xodim yoki o'qituvchi", hint="o'zbek tili", months=[2, 4], strong=True),
  dict(k="speech", name="Nutq texnikasi", kind="job", inc=r"call|колл|кол-центр|контакт\w* центр|оператор\w* (входящ|исходящ|линии|службы|поддержк|лид)|звонк|телемаркет|диктор|телеведущ|ведущ(ий|ая)\s+(мероприят|эфир|программ|тв|радио|праздник)|спикер|тамада|конферансье|ораторск", exc=r"коллектор|взыскан|задолжен", job="call-markaz operatori, boshlovchi, diktor", hint="call-markaz operatori", months=[1, 2], strong=True),
  dict(k="data", name="Data analitika va Excel", kind="job", inc=r"аналити|analyst|analytics|\bbi\b|power bi|excel|эксель|tableau", exc=r"химик|\bsoc\b|лаборат|security|безопасност|систем|system|1с|data engineer|scientist|снабжен", job="ma'lumotlar tahlilchisi, biznes-tahlilchi", hint="data analitik", months=[6, 12], strong=True),
  dict(k="sql", name="SQL va ma'lumotlar bazasi", kind="job", inc=r"sql|postgres|баз\w*\s+данных|database|\bdba\b|data engineer|\betl\b|\bdwh\b", exc=r"оператор", job="SQL bilan ishlaydigan tahlilchi yoki dasturchi", hint="SQL", months=[6, 12], strong=False),
  dict(k="acc", name="Buxgalteriya va 1C", kind="job", roles=[18], inc=r"бухгалт|buxgalter|accountant|\b1с|\b1c\b", exc=r"программист|разработчик|developer", job="buxgalter, buxgalter yordamchisi", hint="buxgalter", months=[4, 8], strong=True),
  dict(k="pc", name="Kompyuter savodxonligi", kind="job", roles=[84, 88, 110, 33], inc=r"оператор пк|оператор ввода|офис-менеджер|офис менеджер|office manager|секретар|делопроизвод", exc=r"кадров", job="ofis menejeri, kotib, kompyuter operatori", hint="ofis menejeri", months=[2, 4], strong=True),
  dict(k="biz", name="Tadbirkorlik va biznes boshqaruvi", kind="job", roles=[107, 87, 26, 161, 75], inc=r"менеджер проект|project manager|управляющ|бизнес-ассистент|операционн\w* менеджер", exc=r"бухгалт|строит|\bit\b|it-|scrum|разработ|kredit|кредит", job="loyiha menejeri, filial rahbari, biznes boshqaruvchi", hint="loyiha menejeri", months=None, strong=False,
       note="Bu kurslarning asosiy maqsadi: o'z biznesingizni ochish va boshqarish. Yollanib ishlash uchun esa rahbarlik va loyiha boshqaruvi lavozimlariga yo'l ochadi."),
  dict(k="log", name="Xalqaro logistika", kind="job", roles=[67, 172], inc=r"логист|logist|вэд|экспедитор|таможен|декларант|freight|supply chain", exc=r"водител|driver|\bhr\b|бухгалт|project manager|менеджер проект|\bit\b", job="logist, tashqi savdo (VED) menejeri", hint="logist", months=[3, 6], strong=True),
  dict(k="smm", name="SMM va kontent", kind="job", roles=[3], inc=r"\bsmm|смм|контент-мейкер|content maker|контент-менеджер|блогер|blogger", exc=r"маркетплейс", job="SMM mutaxassisi, kontent-meyker", hint="SMM", months=[3, 6], strong=True),
  dict(k="copy", name="Kopirayting va ssenariy", kind="job", inc=r"копирайт|copywrit|сценарист|scriptwriter|редактор|корректор", exc=r"видеоредактор|видеомонтаж|ux-|звукорежисс", job="kopirayter, ssenariynavis, muharrir", hint="kopirayter", months=[3, 6], strong=True),
  dict(k="pr", name="PR va brend", kind="job", inc=r"\bpr\b|пиар|бренд.?менедж|бренд-журналист|brand manager|маркетинговым коммуникац|связ\w* с общественност", exc=r"продаж|sales|ibm", job="PR-menejer, brend-menejer", hint="PR menejer", months=[6, 12], strong=True),
  dict(k="hotel", name="Mehmonxona va resepshn", kind="job", roles=[8], inc=r"ресепшн|ресепшен|reception|портье|консьерж|front desk|гостиниц|отел|hotel", exc=r"системн|сетев|баз\w* данных|database|system admin|1с|пвз|повар|oshpaz|официант|логист|кассир|управляющ|integrator|бизнес-процесс|хостес", job="resepshn xodimi, administrator", hint="resepshn", months=[1, 3], strong=True),
  dict(k="drive", name="Haydovchilik", kind="job", roles=[21], inc=r"\bводител|haydovchi|\bdriver|таксист|шофер", exc=r"recruit|рекрут|диспетчер|подключени|менеджер|экскаватор|ekskavator|машинист|safety|привлечен|активац|ричтрак|погрузчик|кран", job="haydovchi", hint="haydovchi", months=[3, 6], mnote="guvohnoma olish bilan birga", strong=True,
       note="Bu kurs haydovchilik guvohnomasini olishga tayyorlaydi. Haydovchi bo'lib ishlash uchun guvohnoma va odatda haydash tajribasi so'raladi."),
  dict(k="hr", name="HR va kadrlar", kind="job", roles=[118, 69, 117, 38, 171, 153], inc=r"\bhr\b|рекрут|recruit|кадр|talent", job="HR menejer, rekruter", hint="HR menejer", months=[4, 8], strong=True),
  dict(k="remote", name="Frilans va masofaviy ish", kind="job", remote=True, job="masofaviy (onlayn) ish", hint="masofaviy ish", months=[2, 4], strong=False),
  dict(k="arch", name="Arxitektura va interyer", kind="job", roles=[14], inc=r"архитект|интерьер|autocad|revit|archicad|archviz|экстерьер", exc=r"программ|software|solution|data|enterprise|систем|\bit\b|облач|сетев|сервер|бухгалтер|ассистент|офис-менеджер|1с|java|backend|cloud|security|sap|инфраструкт|мебел|модельер|замер", job="arxitektor, interyer dizayner", hint="arxitektor", months=None, strong=False,
       note="Arxitektor bo'lib ishlash uchun odatda oliy ma'lumot va diplom talab qilinadi. Interyer dizayni va 3D vizualizatsiya bilan tezroq boshlash mumkin."),
  dict(k="python", name="Python dasturlash", kind="job", inc=r"python|django|fastapi|flask", job="Python dasturchi", hint="Python dasturchi", months=[9, 15], strong=False),
  dict(k="cpp", name="C++ dasturlash", kind="job", inc=r"c\+\+|с\+\+|embedded|встраива", job="C++ dasturchi", hint="C++ dasturchi", months=[12, 18], strong=False),
  dict(k="bot", name="Telegram bot yaratish", kind="job", inc=r"python|node\.?js|чат-?бот|chat.?bot|bot develop|telegram.?bot", exc=r"bottle", job="backend dasturchi, bot yaratuvchi", hint="backend dasturchi", months=[6, 12], strong=False),
  dict(k="web", name="Sayt yaratish", kind="job", inc=r"frontend|front-end|фронтенд|верстальщ|html|веб-разработ|web-разработ|web develop|веб-программист|wordpress|tilda|\breact\b|javascript|вайбкод|vibe.?cod|сайт", exc=r"продаж|react native", job="sayt yaratuvchi, frontend dasturchi", hint="sayt yaratish", months=[6, 12], strong=False),
  dict(k="aidev", name="AI yordamida dasturlash", kind="job", inc=r"разработчик|developer|программист|dasturchi|вайбкод|fullstack|full-stack|backend|frontend|software engineer", exc=r"1с|1c\b|бизнес-разработ|business develop|рецептур|месторожд|технолог|полуфабрикат|игр|game|пекар|кондитер|продуктов\w* линей", job="dasturchi", hint="dasturchi", months=[9, 15], strong=False),
  dict(k="ai", name="Sun'iy intellekt vositalari", kind="job", inc=r"\bai\b|\bии\b|ai-|ии-|нейросет|нейрохудож|prompt|промпт|chatgpt|искусствен|генератив|midjourney|sun.iy intellekt", exc=r"(?<!prompt )engineer|инженер|developer|разработ|programmer|программист|\bqa\b|\bml\b|nlp|product designer|продаж|sales|архитектор|agent|агент|analyst|scientist|нейропс|нейрохир|нейропед", job="AI yordamida kontent yaratuvchi, AI mutaxassisi", hint="AI mutaxassis", months=None, strong=False,
       note="AI vositalari odatda asosiy kasbga qo'shimcha ko'nikma sifatida so'raladi: dizayner, SMM mutaxassisi, marketolog va boshqalar. Shuning uchun bu kurs boshqa kasb bilan birga eng ko'p foyda beradi."),
  dict(k="design", name="Grafik dizayn", kind="job", roles=[34], inc=r"графическ|graphic|дизайнер|designer|canva|photoshop", exc=r"интерьер|interior|ландшафт|одежд|fashion|ювелир|\bux\b|\bui\b|экстерьер|архитект|3d|3д|3 д|инженер|конструкт|художник|artist|флорист|полиграф|мебел|работе с дизайнер|video|видео", job="grafik dizayner", hint="grafik dizayner", months=[6, 9], strong=True),
  dict(k="ux", name="UX/UI va veb dizayn", kind="job", inc=r"\bux\b|\bui\b|продуктов\w* дизайн|product design|веб-дизайн|web.?design|figma", job="UX/UI dizayner, veb dizayner", hint="UX/UI dizayner", months=[6, 12], strong=True),
  dict(k="illus", name="Rasm va illyustratsiya", kind="job", inc=r"иллюстрат|illustrat|художник|artist|концепт-арт|concept art|\b2d\b", exc=r"3d|3д|ai artist|нейро|керами|макияж|грим", job="illyustrator, rassom", hint="illyustrator", months=[6, 12], strong=False),
  dict(k="mp", name="Marketpleyslar", kind="job", inc=r"маркетплейс|marketplace|wildberries|\bozon\b|e-commerce|ecommerce|интернет-магазин|\bebay\b|amazon", exc=r"курьер|водител|склад|пвз|выдач|комплектов|упаков|dispatcher|диспетчер|video|видео|proptech", job="marketpleys menejeri", hint="marketpleys menejeri", months=[1, 3], strong=True,
       note="Marketpleyslarda ko'pchilik o'z do'konini ochib savdo qiladi. Yollanib ishlash uchun esa marketpleys menejeri lavozimlari bor."),
  dict(k="video", name="Videomontaj va video yaratish", kind="job", roles=[20], inc=r"видеомонтаж|монтажер|монтажёр|видеограф|видеооператор|motion|моушн|youtube|ютуб|after effects|capcut|видеоредактор|видеопродакш", exc=r"электромонтаж|монтажник|сценарист", job="videomontajchi, videograf", hint="videomontaj", months=[3, 6], strong=True),
  dict(k="mobilo", name="Mobilografiya", kind="job", roles=[139], inc=r"мобилограф|reels|рилс|фотограф|photograph|контент-мейкер|content maker|ретуш", job="mobilograf, fotograf, kontent-meyker", hint="mobilograf", months=[2, 4], strong=True),
  dict(k="target", name="Targeting va onlayn reklama", kind="job", inc=r"таргет|target|\bppc\b|контекстн\w* реклам|performance|медиабай|трафик|google ads|meta ads|telegram ads|digital-маркет|digital маркет|интернет-маркет", job="targetolog, internet-marketolog", hint="targetolog", months=[3, 6], strong=True),
  dict(k="p3d", name="3D printer va 3D", kind="job", inc=r"\b3d|\b3д|аддитив", job="3D modellashtirish va 3D bosma bo'yicha mutaxassis", hint="3D", months=[6, 12], mnote="3D modellashtirishni ham o'rgansangiz", strong=False,
       note="Vakansiyalarning ko'pi 3D modellashtirishni so'raydi. Bu kurs esa 3D printerda chop etishni o'rgatadi, shuning uchun keyin 3D modellashtirishni ham o'rganing."),
  dict(k="cook", name="Oshpazlik", kind="job", roles=[94], inc=r"повар|oshpaz|кондитер|пекар|\bcook\b|\bchef\b|шеф-повар|сушист|пиццамейкер|пиццмейкер", exc=r"мойщ|официант|бармен|директор|кадр|инспектор|продав|уборщ", job="oshpaz, qandolatchi", hint="oshpaz", months=[2, 4], strong=True),
  dict(k="guide", name="Gid (ekskursiya)", kind="job", inc=r"\bгид\b|экскурсовод|tour guide|\bgid\b", exc=r"avo|аво", job="gid, ekskursovod", hint="gid", months=[2, 4], strong=True,
       note="Gidlar ko'pincha mavsumiy ishlaydi va buyurtmalarni turistik firmalar, mehmonxonalar va internet orqali o'zlari topadi."),
  dict(k="tour", name="Tur-agent", kind="job", roles=[72], inc=r"турагент|туроператор|travel|туризм|\btour", exc=r"гид-водител|avo|аво|бухгалт", job="tur-agent, turizm menejeri", hint="tur-agent", months=[2, 4], strong=True),
  dict(k="game", name="O'yin yaratish (GameDev)", kind="job", inc=r"unity|gamedev|game dev|game develop|разработчик игр|гейм-?диз|game design|game jam|unreal", exc=r"администратор гейм|геймер|игрок|community|комьюнити", job="o'yin yaratuvchi (Unity dasturchi)", hint="Unity", months=[9, 15], strong=False),
  dict(k="mobile", name="Mobil ilova yaratish", kind="job", inc=r"flutter|android|\bios\b|kotlin|swift|react native|мобильн\w* разработ|mobile develop|mobil dastur", job="mobil ilova dasturchisi", hint="mobil dasturchi", months=[9, 15], strong=False),
  dict(k="robot", name="Robototexnika va elektronika", kind="job", roles=[169], inc=r"робот|robot|arduino|электроник|lego|\bstem\b|мехатрон|микроконтрол", exc=r"system|систем|курьер|sistronik|продав|магазин|электромехан|электрощит|электрик", job="robototexnika o'qituvchisi, elektronika muhandisi", hint="robototexnika", months=[4, 8], strong=False),
  dict(k="trade", name="Trading", kind="job", inc=r"трейдер|\btrader\b|трейдинг|биржев\w* брокер|фондов\w* рынк", exc=r"бухгалтер|домработ|developer|продаж|sales", job="treyder, birja brokeri", hint="treyder", months=None, strong=False,
       note="Trading asosan o'z pulingiz bilan mustaqil faoliyat. Yollanib ishlash uchun vakansiyalar juda kam va moliya bo'yicha ma'lumot so'raladi."),
  dict(k="agro", name="Limonchilik va bog'dorchilik", kind="job", roles=[7], inc=r"агроном|садовод|садовник|теплиц|фермер|agronom|питомник|плодовод|\blimon\b|лимон\b", exc=r"дворник|limoncello|лимонад|официант|повар|продав|торгов", job="agronom, bog'bon, issiqxona xodimi", hint="agronom", months=None, strong=False,
       note="Limonchilik bilan ko'pchilik o'z issiqxonasida limon va ko'chat yetishtirib sotadi."),
  dict(k="aiagent", name="AI agentlar va avtomatlashtirish", kind="job", inc=r"n8n|make\.com|zapier|no-code|low-code|ai.?agent|ии.?агент|чат-?бот|chat.?bot|\brpa\b|automation specialist|automation engineer|ai automation|автоматизац\w* (бизнес|процесс)", exc=r"\bqa\b|тестиров|асутп|кип|промышлен|продаж", job="avtomatlashtirish mutaxassisi", hint="avtomatlashtirish", months=[4, 8], strong=False),
  dict(k="stylist", name="Stilist", kind="job", inc=r"стилист|имидж|stylist", exc=r"парикмахер|барбер|ногт|маникюр|hair", job="stilist-maslahatchi", hint="stilist", months=[2, 4], strong=True),
  # no vacancy share for these: they are not a single job
  dict(k="career", name="Karyera va ish topish", kind="general", noexp=True, job="tajribasiz nomzodlarni qabul qiladigan istalgan ish", hint="tajribasiz",
       note="Bu kurs bitta kasbga emas, ish topish ko'nikmasiga o'rgatadi: rezyume yozish, suhbatdan o'tish va o'zingizga mos ishni tanlash."),
  dict(k="media", name="Mediasavodxonlik", kind="general",
       note="Bu kurs internetdagi ma'lumotni tekshirish va tanqidiy fikrlashga o'rgatadi. Bu har qanday kasbda foydali ko'nikma, lekin alohida kasb emas."),
  dict(k="creator", name="Ustoz AI ijodkori", kind="general",
       note="Bu qo'llanma Ustoz AI platformasida o'z kursingizni yaratib joylashtirishni o'rgatadi. Daromad: kursingizni o'quvchilarga sotish orqali."),
  dict(k="craft", name="Qo'l mehnati", kind="hobby",
       note="Bu qo'l mehnati va ijod kursi. Bu ko'nikma bilan odatda ishga yollanmaydi, lekin tayyor buyumlarni Instagram, Telegram va OLX orqali sotib daromad qilish mumkin."),
  dict(k="fun", name="Ijod va hobbi", kind="hobby",
       note="Bu kurs ijod va qiziqish uchun. U alohida kasbga tayyorlamaydi, lekin yangi ko'nikma va ilhom beradi."),
  dict(k="sport", name="Sport", kind="hobby",
       note="Bu kurs sport mahoratingizni oshirish uchun. Murabbiy bo'lib ishlash uchun odatda sport ma'lumoti va tajriba so'raladi."),
  dict(k="med", name="Tibbiyot bilimlari", kind="study",
       note="Bu kurs bilimingizni oshiradi. Tibbiyot sohasida ishlash uchun tibbiy oliy yoki o'rta maxsus ma'lumot va diplom talab qilinadi."),
  dict(k="school", name="Maktab fanlari va imtihonlar", kind="study",
       note="Bu kurs maktab fanlarini mustahkamlash va imtihonlarga tayyorlanish uchun mo'ljallangan."),
]

# search words for the "see more" links on hh.uz and OLX (only used inside links, never shown)
Q = {"tr": "турецкий язык", "ar": "арабский язык", "ru": "русский язык", "en": "английский язык", "uz": "узбекский язык", "speech": "оператор call-центра",
     "data": "аналитик данных", "sql": "SQL", "acc": "бухгалтер", "pc": "офис-менеджер", "biz": "руководитель проектов", "log": "логист", "smm": "SMM",
     "copy": "копирайтер", "pr": "PR-менеджер", "hotel": "администратор гостиницы", "drive": "водитель", "hr": "HR менеджер", "remote": "удаленная работа",
     "arch": "архитектор", "python": "Python", "cpp": "C++", "bot": "Python разработчик", "web": "frontend", "aidev": "программист", "ai": "нейросети",
     "design": "графический дизайнер", "ux": "UX/UI дизайнер", "illus": "иллюстратор", "mp": "менеджер маркетплейсов", "video": "видеомонтажер",
     "mobilo": "мобилограф", "target": "таргетолог", "p3d": "3D", "cook": "повар", "guide": "гид", "tour": "менеджер по туризму", "game": "Unity",
     "mobile": "Flutter", "robot": "робототехника", "trade": "трейдер", "agro": "агроном", "aiagent": "автоматизация", "stylist": "стилист", "career": "без опыта"}


# words that link a CV to each course type, in Uzbek, Russian and English (used by the CV maker's job match)
KW = {"tr": ["turk", "турец", "turkish"], "ar": ["arab", "араб"], "ru": ["rus tili", "русск", "russian"], "en": ["ingliz", "english", "английск", "ielts"],
  "uz": ["o'zbek tili", "узбекск", "uzbek"], "speech": ["call", "колл", "операт", "operator", "nutq", "диктор", "boshlovchi", "telemarket", "телемаркет"],
  "data": ["tahlil", "analit", "аналит", "analyst", "data", "excel", "power bi"], "sql": ["sql", "postgres", "ma'lumotlar bazasi", "баз данных", "database"],
  "acc": ["buxgalter", "бухгалт", "accountant", "accounting", "1c", "1с", "hisobchi", "audit"], "pc": ["ofis", "офис", "office", "kotib", "секретар", "secretary", "assistant", "ассистент", "yordamchi"],
  "biz": ["loyiha", "проект", "project", "rahbar", "руковод", "boshqaruv", "управля", "biznes", "бизнес", "business", "tadbirkor", "operations"],
  "log": ["logist", "логист", "вэд", "ved", "ekspeditor", "экспедит", "dispetcher", "диспетчер", "dispatcher"], "smm": ["smm", "смм", "kontent", "контент", "content", "blog"],
  "copy": ["kopirayt", "копирайт", "copywrit", "muharrir", "редактор", "editor", "ssenariy", "сценар"], "pr": ["pr", "brend", "бренд", "brand", "kommunikats", "коммуникац", "communications"],
  "hotel": ["resepshn", "ресепшн", "ресепшен", "reception", "administrator", "администратор", "mehmonxona", "гостиниц", "hotel", "xostes", "хостес"],
  "drive": ["haydovchi", "водител", "driver", "kuryer", "курьер", "courier"], "hr": ["hr", "rekruter", "рекрут", "recruit", "kadr", "кадр", "personnel", "talent", "o'qitish", "обучени", "training"],
  "remote": ["masofaviy", "удален", "удалён", "remote", "onlayn", "frilans", "фриланс", "freelance"],
  "arch": ["arxitektor", "архитект", "architect", "interyer", "интерьер", "interior", "autocad", "revit"], "python": ["python", "django"], "cpp": ["c++"],
  "bot": ["bot", "бот", "backend", "node"], "web": ["frontend", "html", "sayt", "сайт", "website", "web", "веб", "javascript", "react"],
  "aidev": ["dasturchi", "разработ", "программист", "developer", "programmer", "software", "fullstack", "full-stack"], "ai": ["sun'iy intellekt", "нейросет", "chatgpt", "prompt", "промпт", " ai ", "ai-", "ии"],
  "design": ["dizayner", "дизайнер", "designer", "grafik", "графич", "graphic", "canva", "photoshop"], "ux": ["ux", "ui/", "figma", "product design"],
  "illus": ["illyustrator", "иллюстр", "illustrat", "rassom", "художник", "artist"], "mp": ["marketpleys", "маркетплейс", "marketplace", "uzum", "wildberries", "e-commerce", "ecommerce"],
  "video": ["video", "видео", "montaj", "монтаж", "videograf", "видеограф"], "mobilo": ["mobilograf", "мобилограф", "reels", "fotograf", "фотограф", "photograph"],
  "target": ["target", "таргет", "reklama", "реклам", "ads", "marketolog", "маркетолог", "marketer", "marketing", "маркетинг"], "p3d": ["3d", "3д"],
  "cook": ["oshpaz", "повар", "cook", "chef", "qandolat", "кондитер", "pastry"], "guide": ["gid", "гид", "guide", "ekskursovod", "экскурсовод"],
  "tour": ["turizm", "туризм", "tourism", "tour", "travel", "turagent", "турагент", "tur-agent"], "game": ["unity", "game", "геймдев", "o'yin"],
  "mobile": ["flutter", "android", "ios", "mobil", "мобильн", "mobile"], "robot": ["robot", "робот", "elektron", "электрон", "electronic"],
  "trade": ["treyder", "трейдер", "trader", "birja", "бирж", "trading"], "agro": ["agronom", "агроном", "agronomist", "bog'bon", "садовн"],
  "aiagent": ["avtomatlash", "автоматиз", "automation", "n8n", "make.com", "agent"], "stylist": ["stilist", "стилист", "stylist"]}

# every course, by its exact title on ustoz.ai
C = {
  "tr": ["Türkçe Akademi"],
  "ar": ["Arab tili A1 - 1 oyda"],
  "ru": ["Rus tili kursi", "Rus tili kursi: ravon gapirishni bosqichma-bosqich o‘rganing"],
  "en": ["IELTS Reading", "IELTS 7+ | Chet el universitetlariga tayyorlov"],
  "uz": ["Milliy sertifikat | Oʻzbek tili"],
  "speech": ["Nutq texnikasi"],
  "data": ["AI asosida Data analitika", "Excel va Google Sheets: Formulalar va funksiyalar", "Data analitikani Ustoz AI da o'rganing | Tezroq boshlang!", "Excel - formula ustasi (40+ funksiyani o'rganamiz)!"],
  "sql": ["Postgresql (0 dan amaliyotgacha)"],
  "acc": ["Buxgalteriya"],
  "pc": ["Kompyuter savodxonligi", "KOMPYUTER SAVODXONLIGI", "Kompyuterni 0 dan órganing va uning asoslarini o`rganish"],
  "biz": ["Startap yaratish va rivojlantirish", "Biznesni optimallashtirish va krizis vaziyatlar", "Tadbirkorlik", "O'quv markazi ochish", 'Biznes "upakovkasi" va pitching taqdimotlar'],
  "log": ["Xalqaro logistika kursi", "INTERNATIONAL LOGISTICS MANAGER", "Xalqaro logistika"],
  "smm": ["Blogerlikni Ustoz AI da o'rganing | Tezroq boshlang!", "American You Tube kursini Ustoz AIdan o'rganing! Hoziroq boshlang"],
  "copy": ["Kopirayting (TV, radio)", "Kopirayting (SMM, Marketing)"],
  "pr": ["Ustoz AI: PR Strategiyalari va Brendni Rivojlantirish Kursi"],
  "hotel": ["Mehmonxona Reception kursi", "Reception 2.0", "Mehmonxona hayoti ekspress kursini Ustoz AI dan o'rganing!"],
  "drive": ["Haydovchilik"],
  "hr": ["Ustoz AI: HR Menejment Kursi va Zamonaviy Kadrlar Boshqaruvi"],
  "remote": ["Frilanserlik kursi: Onlayn ishlash va daromad topishni o‘rganing"],
  "arch": ["Ustoz AI: Arxitektura Asoslari va Ilg‘or Dizayn Usullari"],
  "python": ["Python dasturlash tili", "Python dasturlash tili kursini oson va tushunarli tarzda organish"],
  "cpp": ["C++ dasturlaş tili", "Windows’da C++ dasturlash: VS Code va MSYS2 bilan ishlash"],
  "bot": ["Telegram bot"],
  "web": ["Lovable AI kursi", "HTML Express kursi", "AI bilan sayt yaratishni oʻrganing", "Ustoz AI: Saytlar Yasashni O‘rganing va Dasturlashni Boshlang", "Yosh Dasturchilar"],
  "aidev": ["Cursordan 0dan", "Cursor AI Dasturlash Kursi: Kodni AI Bilan Tez O‘rganing"],
  "ai": ["Sunʼiy intellekt hayotimizda oʻrni 💯", "Нейросети с нуля: От новичка до профи", "AI bilan telefondan daromad", "Ai Content tayyorlashni Ustoz AI da o'rganing | Tezroq boshlang!", "Bepul sun'iy intellektlar kursi", "sun’iy intellekt texnologiyalaridan foydalanib kontent yaratish"],
  "design": ["Grafik Dizayn Kursi: Noldan Professional Darajagacha", "Grafik dizayn kursi. Canva, Photoshop, Illustrator, Figma", "Boshlang‘ich dizayn kursi. Canva, Photoshop, Illustrator, Figma"],
  "ux": ["Veb dizayn", "Yangi! UX/UI Level Up"],
  "illus": ["Art illustratsiya", "Rasm.uz"],
  "mp": ["Yandex Marketda savdo qilishni o‘rganing: to‘liq kurs", "Uzum Marketda hech qanday pulsiz $1000 ishlash sirlari", "e'Bayda savdo yuritish kursi, ebay orqali pul ishlash"],
  "video": ["Videomontaj", "Sun'iy Intellektda Video Yasash", "After Effects kursi: Motion dizaynni 0 dan o‘rganing!"],
  "mobilo": ["Mobilograflik", "Ustoz AI: Mobilografiya Sirlarini O‘rganing va Rivojlaning"],
  "target": ["Targeting", "Telegram reklama qilish sirlari: Bosqichma-bosqich o‘rganing"],
  "p3d": ["3D printerdan foydalanish"],
  "cook": ["At the kitchen 🧑‍🍳"],
  "guide": ["Turizm GID"],
  "tour": ["TUR agent"],
  "game": ["Bepul Game Dev Kursi: Unity va C# orqali o‘yin yaratish", "GameDev \"0\" dan o'rganish|Unity darslari|Hoziroq boshlang"],
  "mobile": ["Bepul mobil ilova yaratish kursi"],
  "robot": ["Elektronika (Robototexnika)", "First LEGO Leagueda qatnashishni Ustoz AI dan o'rganing!"],
  "trade": ["Trading"],
  "agro": ["Limonchilik kursi: Boshlang‘ichdan professionalgacha", "Ustoz AI: Limonchilik Sirlarini O‘rganish va Amalda Qo‘llash"],
  "aiagent": ["100% lik kodsiz AI agentlar qurish", "Kodsiz avtomatizatsiya o‘rganing: Make.com bilan real loyihalar"],
  "stylist": ["Stilist kursi | Qoraqalpoq tilida"],
  "career": ["Karyeraviy konsultatsiya", "Karyera Qurish Kursi: Muvaffaqiyatli Kelajak Sari Qadam", "Ish topish sirlari: samarali va tezkor maslahatlar.", "Talaba 2.0 | loyiha"],
  "media": ["Mediasavodxonlikni Ustoz AI da o'rganing | Tezroq boshlang!"],
  "creator": ["Ijodkorlar uchun asosiy amaliy video qo’llanma"],
  "craft": ["Toʻquvchilikni oʻrganamiz", "Bilaguzuklar yasash", "Origami kursi", "soʻlimaydigan gullar", "Sinel simdan nafis gullar yasash san’ati"],
  "fun": ["minicraft", "Noldan she'r yozish san'atini o'rganish🖋️", "QR-kod orqali tabriklar yaratish."],
  "sport": ["Futbol"],
  "med": ["Allergiya Tibbiy kurs | Rakhmatovs", "ANATOMIYA KURSI | RMS"],
  "school": ["SAT kursi", "Biologiya", "History Lab⏳️", "AI orqali Amir Temur hayoti yanada jonli tarzda o'rganing!", "Geometriya Kursi 8-sinf Uchun", "8-sinf algebra darsligini 5 videoda o‘rganing", "Ustoz AI: Biologiya Fani Sirlarini O‘rganing va Rivojlaning", "5-sinf Matematika: Qiziqarli Misollar, Masalalarni O‘rganing", "Ustoz AI: 6-sinf Matematika Darslari va Mashqlar To‘plami", "Ustoz AI: 7-sinf Algebra Darslari va Misollar Yechimi", "Ustoz AI: 7-sinf Geometriya Darslari va Masalalar Yechimi", "Bepul ona tili kursi: 5: 11-sinflarni to‘liq o‘rganasiz", "Bepul adabiyot kursi: 5: 11-sinf darsliklarini to‘liq o‘rganasiz", "Ustoz AI: Tarix Fani Asoslari va Qiziqarli Saboq Darslari", "Geografiya kursi | Testlar va Onlayn darslar"],
}

# fixes to course texts that came from ustoz.ai in Russian or were damaged
COURSE_FIX = {
  "Нейросети с нуля: От новичка до профи": dict(
    title="Neyrotarmoqlar noldan: yangi boshlovchidan professionalgacha", teacher="Salohiddin Xudoyqulov",
    about="Kelajak texnologiyalarini o'zlashtirmoqchimisiz, lekin nimadan boshlashni bilmaysizmi? Bu kurs mutlaqo yangi boshlovchilar uchun. Murakkab atamalar va dasturlashsiz sun'iy intellektdan ish, o'qish va ijodda qanday foydalanishni o'rganasiz: ChatGPT yordamida post, maqola va ssenariy yozish; Midjourney, Stable Diffusion va Shedevrum'da rasm va grafika yaratish; suratlarni bir bosishda tahrirlash; kundalik ishlarni avtomatlashtirib, kuniga 5 soatgacha vaqt tejash. Kurs talabalar, frilanserlar, marketologlar va sun'iy intellekt yordamida daromad qilmoqchi bo'lgan barcha uchun. Dasturlash bilimi kerak emas: smartfon yoki kompyuter va internet yetarli.",
    modules=[["Sun'iy intellekt", 1]]),
  "Rus tili kursi": dict(
    about="Narsalarning nomlari va belgilari boshlang'ich ko'rinishda, ya'ni bosh kelishikda (rus tilida \"imenitelniy padej\") turadi. Bosh kelishik qolgan barcha kelishiklarning asosi: qolgan kelishiklar bosh kelishikning vaziyatga qarab o'zgargan ko'rinishidir.",
    modules=[["Kelishiklar (padejlar) bo'limi", 1]]),
  "Geografiya kursi | Testlar va Onlayn darslar": dict(about="Geografiya kursi: mavzular bo'yicha onlayn darslar va testlar."),
  "Bepul ona tili kursi: 5: 11-sinflarni to‘liq o‘rganasiz": dict(title="Bepul ona tili kursi: 5-11-sinflarni to‘liq o‘rganasiz"),
  "Bepul adabiyot kursi: 5: 11-sinf darsliklarini to‘liq o‘rganasiz": dict(title="Bepul adabiyot kursi: 5-11-sinf darsliklarini to‘liq o‘rganasiz"),
}

# ---------------------------------------------------------------- Uzbek Latin output
CYR = re.compile("[А-Яа-яЁё]")
# OLX "Ish" also holds people offering their own services: those are not job openings
OFFER = re.compile(r"создаю|делаю|услуг|xizmat|керакми|kerakmi|takliflar|фрилансер программист|резюме|ищу работу|ish izlayapman", re.I)
TL = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "'", "ы": "i", "ь": "", "э": "e", "ю": "yu", "я": "ya", "ў": "o'", "қ": "q", "ғ": "g'", "ҳ": "h"}
ORG = [(r"\bСП ООО\b", "QK MChJ"), (r"\bИП ООО\b", "XK MChJ"), (r"\bООО\b", "MChJ"), (r"\bOOO\b", "MChJ"), (r"\bЧП\b", "XK"), (r"\bАКБ\b", "ATB"), (r"\bАО\b", "AJ"), (r"\bАК\b", "AK"), (r"\bИП\b", "YaTT"), (r"\bГУП\b", "DUK"), (r"\bМЧЖ\b", "MChJ"), (r"\bТМ\b", "TM"), (r"\bФХ\b", "FX")]
CITY = {"Ташкент": "Toshkent", "Самарканд": "Samarqand", "Бухара": "Buxoro", "Наманган": "Namangan", "Андижан": "Andijon", "Фергана": "Farg'ona", "Нукус": "Nukus", "Карши": "Qarshi", "Навои": "Navoiy", "Ургенч": "Urganch", "Джизак": "Jizzax", "Термез": "Termiz", "Коканд": "Qo'qon", "Гулистан": "Guliston", "Чирчик": "Chirchiq", "Алмалык": "Olmaliq", "Ангрен": "Angren", "Хива": "Xiva", "Маргилан": "Marg'ilon", "Зарафшан": "Zarafshon", "Ахангаран": "Ohangaron", "Каттакурган": "Kattaqo'rg'on", "Шахрисабз": "Shahrisabz", "Бекабад": "Bekobod", "Янгиюль": "Yangiyo'l", "Газалкент": "G'azalkent", "Кибрай": "Qibray", "Нурафшон": "Nurafshon", "Денау": "Denov", "Касансай": "Kosonsoy", "Чуст": "Chust", "Асака": "Asaka", "Кувасай": "Quvasoy", "Риштан": "Rishton", "Ташкентская область": "Toshkent viloyati", "Москва": "Moskva", "Алматы": "Olmaota", "Дубай": "Dubay"}

def translit(s):
  if not s or not CYR.search(s): return s
  for a, b in ORG: s = re.sub(a, b, s)
  out = []
  for i, ch in enumerate(s):
    lo = ch.lower()
    if lo in TL:
      t = TL[lo]
      if lo == "е" and (i == 0 or not s[i - 1].isalpha()): t = "ye"
      out.append(t.capitalize() if ch.isupper() and t else t)
    else: out.append(ch)
  return "".join(out)

def city(c): return CITY.get(c, translit(c)) if c else c

# course texts from ustoz.ai: Turkish letters and "ó" used instead of Uzbek Latin, and "5: 11" left where a dash was removed
LATIN = {"ş": "sh", "Ş": "Sh", "ğ": "g'", "Ğ": "G'", "ó": "o'", "ò": "o'", "Ó": "O'", "Ò": "O'"}
def clean(s):
  if not s: return s
  s = re.sub(r"(\d): (\d)", r"\1-\2", s)
  return "".join(LATIN.get(ch, ch) for ch in s)

# ---------------------------------------------------------------- data
def load_vac(path):
  wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
  ws = wb["Vacancies"]
  rows = ws.iter_rows(values_only=True)
  h = next(rows)
  fx = {r[0]: r[1] for r in wb["FX_rates"].iter_rows(min_row=2, values_only=True) if r[0] and isinstance(r[1], (int, float))}
  V = [dict(zip(h, r)) for r in rows if r and r[0]]
  return V, fx

MIN_PAY = 3.5   # mln so'm a month: lower paid vacancies and ads are not shown

def mln(x): return None if x is None else round(x / 1e6 * 2) / 2 if x >= 1e6 else round(x / 1e6, 1)

def main():
  xlsx = sys.argv[1]
  want_titles = "--titles" in sys.argv
  review = "--review" in sys.argv
  V, fx = load_vac(xlsx)
  N = len(V)
  old = json.load(open(OUT, encoding="utf-8"))
  tr = json.load(open(TR, encoding="utf-8")) if os.path.exists(TR) else {}

  # OLX ads collected on 16-17.11.2026 (OLX blocks scripted downloads, so the pool is kept in a file)
  pool = json.load(open(os.path.join(ROOT, "tools", "olx_pool.json"), encoding="utf-8"))

  for v in V:
    v["_t"] = str(v["job_title"] or "")
    v["_role"] = int(v["role_id"]) if v["role_id"] not in (None, "") else None
    v["_rem"] = str(v["remote"]) == "1" or "REMOTE" in str(v["work_format"] or "")
    v["_sal"] = v["salary_mid_UZS"] if v["pay_mode"] == "MONTH" and isinstance(v["salary_mid_UZS"], (int, float)) and v["salary_mid_UZS"] > 0 else None

  def matcher(g):
    inc = re.compile(g["inc"], re.I) if g.get("inc") else None
    exc = re.compile(g["exc"], re.I) if g.get("exc") else None
    roles = set(g.get("roles", []))
    def m(v):
      t = v["_t"]
      if exc and exc.search(t): return False
      if g.get("remote"): return v["_rem"]
      if g.get("noexp"): return v["experience"] == "noExperience"
      if g.get("aiclass") and v["ai_class"] == g["aiclass"]: return True
      return (v["_role"] in roles) or bool(inc and inc.search(t))
    return m

  need = set()
  def uz_title(t):
    if t in tr: return tr[t]
    need.add(t); return t

  # "recent" = published in the last 3 days of the data (the newest date and the 2 days before it)
  last = max(str(v["published_at"])[:10] for v in V)
  RECENT = (datetime.date.fromisoformat(last) - datetime.timedelta(days=2)).isoformat()

  groups = {}
  for g in G:
    out = dict(name=g["name"], kind=g["kind"], note=g.get("note"), q=Q.get(g["k"]), kw=KW.get(g["k"]))
    if g["kind"] == "job" or g.get("noexp"):
      m = matcher(g)
      hit = [v for v in V if m(v)]
      if review:
        print(f"\n=== {g['k']} {g['name']}: {len(hit)}")
        for t, n in collections.Counter(v["_t"] for v in hit).most_common(int(os.environ.get("TOP", 12))): print(f"   {n:3} {t}")
      sal = sorted(v["_sal"] for v in hit if v["_sal"])
      out.update(related=len(hit), share=round(len(hit) / N * 100, 2 if len(hit) / N < 0.01 else 1),
                 job=g["job"], hint=g["hint"], months=g.get("months"), mnote=g.get("mnote"), strong=g.get("strong", False), salaried=len(sal))
      if len(sal) >= 5:
        out["medianMln"] = mln(statistics.median(sal))
        out["lowMln"] = mln(sal[len(sal) // 4])
      if len(hit) >= 10:
        out["noexp"] = round(sum(v["experience"] == "noExperience" for v in hit) / len(hit) * 100)
        out["tashkent"] = round(sum(str(v["tashkent"]) == "1" for v in hit) / len(hit) * 100)
        out["remote"] = round(sum(v["_rem"] for v in hit) / len(hit) * 100)
      # vacancies to show: newest first, ones with a monthly salary first, no repeats
      # vacancies to show: only a monthly salary of at least MIN_PAY mln so'm (the lower figure when both are given),
      # published in the last 3 days first, then ones whose own title names the job, newest first, no repeats.
      # Up to 10 for "all" plus up to 8 more remote ones for the "Masofaviy" filter.
      named = re.compile(g["inc"], re.I) if g.get("inc") else None
      seen, shown, remote = set(), [], []
      for v in sorted(hit, key=lambda v: (str(v["published_at"])[:10] >= RECENT, bool(named and named.search(v["_t"])), str(v["published_at"])), reverse=True):
        key = (v["_t"].lower(), str(v["employer_name"]).lower())
        if key in seen: continue
        rate = fx.get(v["currency"]) if v["pay_mode"] == "MONTH" else None
        lo = mln(v["salary_from"] * rate) if rate and v["salary_from"] else None
        hi = mln(v["salary_to"] * rate) if rate and v["salary_to"] else None
        if (lo or hi or 0) < MIN_PAY: continue
        seen.add(key)
        if len(shown) >= 10 and not (v["_rem"] and len(remote) < 8): continue
        j = dict(t=uz_title(v["_t"]), src=v["_t"], e=translit(str(v["employer_name"] or "")), c=city(v["city"]), u=v["url"], lo=lo, hi=hi, r=int(v["_rem"]), d=str(v["published_at"])[:10])
        (shown if len(shown) < 10 else remote).append(j)
        if len(shown) == 10 and (len(remote) == 8 or len([x for x in shown if x["r"]]) + len(remote) >= 8): break
      out["jobs"] = shown + remote
      out["jobsShown"] = len(shown)
      # OLX ads whose own title matches this course type
      if g.get("inc") and not g.get("noexp"):
        inc, exc = re.compile(g["inc"], re.I), re.compile(g["exc"], re.I) if g.get("exc") else None
        # salary in mln so'm ("UYE" on OLX means US dollars)
        pay = lambda o: o["s"] / 1e6 if o.get("cur") == "UZS" else o["s"] * fx["USD"] / 1e6 if o.get("s") else 0
        olx = [o for o in pool if inc.search(o["t"]) and not (exc and exc.search(o["t"])) and not OFFER.search(o["t"]) and pay(o) >= MIN_PAY]
        olx.sort(key=lambda o: o.get("d", ""), reverse=True)
        olx = list({o["t"].strip().lower(): o for o in reversed(olx)}.values())[::-1]   # one ad per title
        out["olx"] = [dict(t=uz_title(o["t"]), src=o["t"], u=o["u"], c=city(o.get("c")), m=round(pay(o) * 2) / 2, d=o.get("d")) for o in olx[:4]]
    groups[g["k"]] = out

  # demand level by the number of matching vacancies in 30 days
  for g in groups.values():
    if g["kind"] != "job": continue
    n = g["related"]
    g["level"] = "Juda yuqori" if n >= 300 else "Yuqori" if n >= 100 else "O'rtacha" if n >= 30 else "Past" if n >= 10 else "Juda past"

  # courses (titles are compared after the same text clean-up, so the build can run again on its own output)
  fixed_back = {clean(f["title"]): clean(s) for s, f in COURSE_FIX.items() if "title" in f}
  key = lambda t: fixed_back.get(clean(t), clean(t))
  by_title = {key(c["title"]): c for c in old["courses"]}
  assert len(by_title) == len(old["courses"]), "two courses with the same title"
  ctype, used = {}, set()
  for k, titles in C.items():
    assert k in groups, k
    for t in titles:
      assert key(t) in by_title, "course not found: " + t
      assert key(t) not in used, "course twice: " + t
      used.add(key(t)); ctype[key(t)] = k
  for t in by_title:
    assert t in used, "course without a type: " + t
  fixes = {key(s): f for s, f in COURSE_FIX.items()}
  courses = []
  for c in old["courses"]:
    t = key(c["title"])
    c = dict(c, g=ctype[t], **fixes.get(t, {}))
    for f in ("title", "teacher", "about"):
      if c.get(f) and not c[f].startswith("Türkçe"): c[f] = clean(c[f])
    c["modules"] = [[clean(m[0]), m[1]] for m in c["modules"]]
    courses.append(c)
  assert len(courses) == len(old["courses"])

  # summary
  jobc = [c for c in courses if groups[c["g"]]["kind"] == "job"]
  avg = round(sum(groups[c["g"]]["share"] for c in jobc) / len(jobc), 2)
  st = lambda cs: sum(c.get("students") or 0 for c in cs)
  good = [c for c in jobc if groups[c["g"]]["related"] >= 100]
  summary = dict(old["summary"], analyzed=N, courses=len(courses), groups=len(groups), jobCourses=len(jobc),
                 avgDemand=avg, highDemandCourses=len(good),
                 studentsHighDemand=round(st(good) / st(courses) * 100), uzsPerUsd=round(fx["USD"]))
  summary.pop("olxActive", None)

  if review:
    for k, g in groups.items():
      if g.get("olx"): print(k, "OLX:", [o["src"] for o in g["olx"]])
    return
  if want_titles:
    for t in sorted(need): print(t)
    print(len(need), "titles need a translation", file=sys.stderr)
    return
  assert not need, f"{len(need)} titles have no Uzbek translation, run with --titles"
  for g in groups.values():
    for j in g.get("jobs", []) + g.get("olx", []):
      j.pop("src", None)
      for f in ("t", "e", "c"):
        assert not CYR.search(str(j.get(f) or "")), ("Cyrillic left", j)
  for c in courses:
    for f in ("title", "teacher"):
      assert not CYR.search(c[f] or ""), ("Cyrillic left", c["title"])
  json.dump(dict(summary=summary, groups=groups, courses=courses), open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
  print("ok", N, "vacancies,", len(courses), "courses,", len(groups), "course types")

if __name__ == "__main__":
  main()
