// "Kasb Kompasi": a 5 minute course finder (Ustoz AI Course Finder spec).
// 24 first-person interest statements on a 0-4 scale, grouped in six RIASEC themes (four each, shown in a mixed order),
// plus 5 practical questions (goal, level, weekly time, device, budget). "Hali sinab ko'rmaganman" is never scored.
// Each active course of data/kurslar.json is tagged by its course type (g) with themes 0-3, the statements that best
// separate it from similar courses, the goals it serves and what it needs (a computer or materials).
// Course score = 65% interest fit + 25% goal fit + 10% readiness (level, device, time); the budget is a filter.
// The result is a recommendation, not a test of personality or a promise of a job.
const Compass = (() => {
  const THEMES = {
    R: { name: "Amaliy ishlar", icon: "tool", c: "#F2600C" },
    I: { name: "Tahlil va izlanish", icon: "chart", c: "#2748F5" },
    A: { name: "Ijod va dizayn", icon: "palette", c: "#7C3AED" },
    S: { name: "Odamlarga yordam va muloqot", icon: "users", c: "#0FB07F" },
    E: { name: "Tashabbus va biznes", icon: "rocket", c: "#E08A00" },
    C: { name: "Tartib va tashkilotchilik", icon: "layers", c: "#0891B2" },
  };
  // the 24 statements, numbered as in the spec (1-4 R, 5-8 I, 9-12 A, 13-16 S, 17-20 E, 21-24 C)
  const ITEMS = [
    "Men biror qurilma yoki buyumni yig'ish, sozlash yoki tuzatishni yoqtiraman.",
    "Men asboblar va texnika bilan ishlashni yoqtiraman.",
    "Men turli materiallardan foydalanib, o'z qo'lim bilan biror narsa yasashni yoqtiraman.",
    "Men faqat o'qib o'tirishdan ko'ra, ishni o'zim bajarib ko'rishni yoqtiraman.",
    "Men jadvaldagi raqamlarni solishtirib, ular orasidagi o'xshashliklarni topishni yoqtiraman.",
    "Men dastur yoki qurilmada xato chiqsa, uning sababini topishni yoqtiraman.",
    "Men biror mavzuni chuqur o'rganib, fikrimni dalillar bilan tushuntirishni yoqtiraman.",
    "Men mantiqiy, matematik yoki dasturlash masalalarini yechishni yoqtiraman.",
    "Men g'oyamni rasm, video yoki boshqa ko'rinishda yaratishni yoqtiraman.",
    "Men hikoya, reklama yoki brend uchun ta'sirli so'zlar topishni yoqtiraman.",
    "Men ranglar va yozuv ko'rinishini o'zgartirib, chiroyli sahifa tayyorlashni yoqtiraman.",
    "Men yangi loyiha yoki reklama uchun o'ziga xos g'oyalar topishni yoqtiraman.",
    "Men qiyin mavzuni boshqalarga oddiy qilib tushuntirishni yoqtiraman.",
    "Men boshqalarga yangi narsani bosqichma-bosqich o'rgatishni yoqtiraman.",
    "Men odamlar bilan gaplashish, mehmonlarni kutib olish yoki joylarni tanishtirishni yoqtiraman.",
    "Men odamlarni tinglab, ularga kerakli yechim yoki xizmatni tavsiya qilishni yoqtiraman.",
    "Men o'z g'oyamni boshqalarga aytib, ularni qo'llab-quvvatlashga undashni yoqtiraman.",
    "Men yangi loyiha yoki kichik biznes boshlashni va keyingi ishlarni rejalashni yoqtiraman.",
    "Men mahsulot yoki xizmatni odamlarga tanitish va xaridorlarga yetkazish rejasini tuzishni yoqtiraman.",
    "Men jamoani umumiy maqsad sari boshlab borish, ishlarni tartibga solish va qaror qabul qilishni yoqtiraman.",
    "Men ma'lumotlarni jadvalga yozib, tartibli saqlashni yoqtiraman.",
    "Men ko'rsatmalar yoki tekshirish ro'yxati asosida aniq ishlashni yoqtiraman.",
    "Men vaqtimni, vazifalarimni va kerakli narsalarni oldindan rejalashtirishni yoqtiraman.",
    "Men raqamlarni solishtirib, hisobot yoki oddiy xarajatlar rejasini tayyorlashni yoqtiraman.",
  ];
  const themeOf = (i) => "RIASEC"[Math.floor(i / 4)];
  const SCALE = ["Umuman yoqtirmayman", "Unchalik yoqtirmayman", "Betarafman", "Yoqtiraman", "Juda yoqtiraman"];
  // the practical questions (the spec's language question is left out: all courses here are taught in Uzbek)
  const FIT = [
    { k: "goal", q: "Men hozir nimani o'rganmoqchiman yoki nimaga erishmoqchiman?", icon: "target", o: [
      ["skill", "Kasb uchun kerakli ko'nikmani o'rganish", "zap"], ["job", "Ish topish yoki suhbatga tayyorlanish", "briefcase"],
      ["biz", "O'z biznesimni boshlash yoki rivojlantirish", "rocket"], ["grow", "Hozirgi ishimda o'sish", "trend"],
      ["exam", "Imtihon yoki til o'rganishga tayyorlanish", "cap"], ["hobby", "Ijodiy loyiha boshlash yoki sevimli mashg'ulotim bilan shug'ullanish", "palette"], ["unsure", "Hali aniq bilmayman", "compass"]] },
    { k: "level", q: "Men o'rganmoqchi bo'lgan soha bo'yicha bilimim qanday?", icon: "up", o: [
      ["none", "Hali o'rganishni boshlamaganman", "play"], ["basic", "Bu haqda ozgina bilaman", "book"], ["did", "O'zim bajarib ko'rganman", "check"],
      ["deep", "Tajribam bor, yanada ko'proq o'rganmoqchiman", "star"], ["unsure", "Hozircha aniq bilmayman", "compass"]] },
    { k: "time", q: "Men haftasiga o'qishga qancha vaqt ajrata olaman?", icon: "clock", o: [
      ["1", "2 soatdan kam", "clock"], ["3", "2-4 soat", "clock"], ["6", "5-7 soat", "clock"], ["9", "8 soatdan ko'p", "clock"], ["unsure", "Hali aniq bilmayman", "compass"]] },
    { k: "device", q: "Men o'qish uchun qaysi qurilmadan foydalana olaman?", icon: "laptop", o: [
      ["phone", "Faqat telefon", "phone"], ["pc", "Kompyuter yoki noutbuk", "laptop"], ["both", "Telefon va kompyuter", "layers"],
      ["kit", "Maxsus jihozlar yoki materiallar", "tool"], ["unsure", "Hali aniq bilmayman", "compass"]] },
    { k: "budget", q: "Men kurs uchun qancha pul ajrata olaman?", icon: "coin", o: [
      ["0", "Bepul kurs", "gift"], ["100000", "100 000 so'mgacha", "coin"], ["500000", "100 000 - 500 000 so'm", "coin"],
      ["any", "500 000 so'mdan ko'p", "coin"], ["nolimit", "Hozircha narx muhim emas", "check"], ["unsure", "Hali aniq bilmayman", "compass"]] },
  ];
  const N = ITEMS.length + FIT.length;

  // course type -> themes (0-3), the statements that separate it (1-based, as in the spec), goals, device need
  // dev: "any" works on a phone, "pc" needs a computer, "kit" needs tools or materials
  const TAGS = {
    data: { t: { I: 3, C: 3 }, q: [5, 21, 24], goals: ["skill", "job", "grow"], dev: "pc" },
    aiagent: { t: { I: 3, C: 2, E: 1 }, q: [6, 8, 22], goals: ["skill", "grow", "biz"], dev: "pc" },
    aidev: { t: { I: 3, C: 2 }, q: [6, 8, 22], goals: ["skill", "job"], dev: "pc" },
    python: { t: { I: 3, C: 2 }, q: [6, 8, 22], goals: ["skill", "job", "exam"], dev: "pc" },
    cpp: { t: { I: 3, C: 2 }, q: [6, 8, 22], goals: ["skill", "job", "exam"], dev: "pc" },
    sql: { t: { I: 3, C: 3 }, q: [5, 8, 21], goals: ["skill", "job", "grow"], dev: "pc" },
    web: { t: { I: 3, C: 1, A: 1 }, q: [6, 8, 11], goals: ["skill", "job", "biz"], dev: "pc" },
    mobile: { t: { I: 3, C: 1, A: 1 }, q: [6, 8, 12], goals: ["skill", "job", "biz"], dev: "pc" },
    game: { t: { I: 2, A: 2, R: 1 }, q: [8, 9, 12], goals: ["skill", "hobby"], dev: "pc" },
    robot: { t: { R: 3, I: 2 }, q: [1, 2, 6, 8], goals: ["skill", "hobby", "exam"], dev: "kit" },
    p3d: { t: { R: 3, I: 1, A: 1 }, q: [1, 2, 3], goals: ["skill", "hobby", "biz"], dev: "kit" },
    ux: { t: { A: 3, I: 2 }, q: [9, 11, 12], goals: ["skill", "job"], dev: "pc" },
    design: { t: { A: 3, C: 1 }, q: [9, 11, 12], goals: ["skill", "job", "hobby"], dev: "any" },
    illus: { t: { A: 3, R: 1 }, q: [9, 3, 11], goals: ["hobby", "skill"], dev: "any" },
    arch: { t: { A: 2, R: 2, I: 1 }, q: [11, 3, 7], goals: ["skill", "exam"], dev: "pc" },
    video: { t: { A: 3, E: 1, S: 1 }, q: [9, 10, 19], goals: ["skill", "job", "hobby"], dev: "pc" },
    mobilo: { t: { A: 3, E: 1, R: 1 }, q: [9, 12, 19], goals: ["hobby", "skill", "biz"], dev: "any" },
    ai: { t: { A: 2, I: 2, E: 1 }, q: [9, 12, 8], goals: ["skill", "unsure", "hobby"], dev: "any" },
    smm: { t: { E: 3, A: 2, S: 1 }, q: [10, 17, 19], goals: ["skill", "biz", "job"], dev: "any" },
    copy: { t: { A: 3, E: 2 }, q: [10, 12, 17], goals: ["skill", "job"], dev: "any" },
    target: { t: { E: 3, C: 1, A: 1 }, q: [19, 17, 24], goals: ["biz", "job", "skill"], dev: "any" },
    pr: { t: { E: 3, A: 2, S: 1 }, q: [17, 10, 19], goals: ["biz", "grow", "job"], dev: "any" },
    biz: { t: { E: 3, C: 1, S: 1 }, q: [18, 20, 17], goals: ["biz", "grow"], dev: "any" },
    mp: { t: { E: 3, C: 2 }, q: [19, 18, 24], goals: ["biz", "job"], dev: "any" },
    remote: { t: { E: 2, C: 1, A: 1 }, q: [18, 22, 23], goals: ["job", "biz"], dev: "any" },
    acc: { t: { C: 3, I: 1 }, q: [24, 21, 22], goals: ["job", "grow", "skill"], dev: "pc" },
    log: { t: { C: 2, E: 2, I: 1 }, q: [23, 20, 21], goals: ["job", "grow"], dev: "any" },
    pc: { t: { C: 2, R: 1, I: 1 }, q: [22, 4, 21], goals: ["skill", "unsure"], dev: "pc" },
    speech: { t: { S: 3, E: 2 }, q: [13, 17, 16], goals: ["grow", "job"], dev: "any" },
    career: { t: { S: 3, E: 1 }, q: [16, 14, 13], goals: ["job", "grow", "unsure"], dev: "any" },
    guide: { t: { S: 3, E: 1 }, q: [15, 13, 16], goals: ["job", "skill"], dev: "any" },
    tour: { t: { S: 2, E: 2, C: 1 }, q: [15, 19, 16], goals: ["job", "biz"], dev: "any" },
    hotel: { t: { S: 3, C: 1 }, q: [15, 16, 22], goals: ["job", "skill"], dev: "any" },
    hr: { t: { S: 2, E: 2, C: 2 }, q: [20, 16, 23], goals: ["job", "grow"], dev: "any" },
    school: { t: { S: 2, I: 2, C: 1 }, q: [7, 13, 8], goals: ["exam"], dev: "any" },
    en: { t: { S: 2, I: 2, C: 1 }, q: [7, 13, 22], goals: ["exam", "job"], dev: "any" },
    ru: { t: { S: 3, I: 1 }, q: [15, 13, 7], goals: ["exam", "job"], dev: "any" },
    ar: { t: { S: 2, I: 2 }, q: [7, 15, 13], goals: ["exam", "hobby"], dev: "any" },
    tr: { t: { S: 3, I: 1 }, q: [15, 13, 7], goals: ["exam", "job"], dev: "any" },
    media: { t: { I: 2, S: 1, A: 1 }, q: [7, 5, 10], goals: ["unsure", "skill"], dev: "any" },
    craft: { t: { R: 3, A: 2 }, q: [3, 4, 9], goals: ["hobby", "biz"], dev: "kit" },
    cook: { t: { R: 3, A: 1, S: 1 }, q: [3, 4, 15], goals: ["hobby", "biz"], dev: "kit" },
    stylist: { t: { A: 3, S: 2, R: 1 }, q: [11, 16, 3], goals: ["job", "skill", "hobby"], dev: "kit" },
    agro: { t: { R: 3, E: 1 }, q: [2, 3, 4], goals: ["hobby", "biz"], dev: "kit" },
    drive: { t: { R: 3, C: 1 }, q: [2, 4, 22], goals: ["skill", "job"], dev: "kit" },
  };
  // prices come as numbers or as text ("0" for free courses)
  const cost = (c) => Number(c.price) || 0;
  // courses meant for a first start
  const BEGIN = /bepul|boshlang|0 ?dan|noldan|express|tezroq boshlang|asos/i;
  let courses = null;
  function catalog() {
    if (courses) return courses;
    const d = typeof Kurslar !== "undefined" && Kurslar.data();
    if (!d) return null;
    // only courses with real content: at least 3 lessons and 10 minutes of video
    courses = d.courses.filter((c) => TAGS[c.g] && (c.lessons || 0) >= 3 && (c.sec || 0) >= 600).map((c) => ({ ...c, tag: TAGS[c.g], begin: BEGIN.test(c.title) || cost(c) === 0 }));
    return courses;
  }

  /* ---------- scoring ---------- */
  // per theme: mean of the answered statements, 0-100; a theme with no answers stays neutral (50)
  function profile(a) {
    const p = {}, cnt = {};
    for (const t of "RIASEC") {
      const v = [0, 1, 2, 3].map((k) => a["RIASEC".indexOf(t) * 4 + k]).filter((x) => typeof x === "number");
      cnt[t] = v.length; p[t] = v.length ? (v.reduce((s, x) => s + x, 0) / v.length) * 25 : 50;
    }
    return { p, cnt, answered: Object.values(cnt).reduce((s, x) => s + x, 0) };
  }
  function scoreCourse(c, a, f, prof) {
    const tg = c.tag, ws = Object.entries(tg.t), wsum = ws.reduce((s, [, w]) => s + w, 0);
    const tagFit = ws.reduce((s, [t, w]) => s + w * prof.p[t], 0) / wsum;
    const avg = Object.values(prof.p).reduce((s, x) => s + x, 0) / 6;
    const rel = ws.reduce((s, [t, w]) => s + w * (prof.p[t] - avg), 0) / wsum;   // leaning toward these themes vs the rest
    const it = tg.q.map((n) => a[n - 1]).filter((x) => typeof x === "number");
    const itemFit = it.length ? (it.reduce((s, x) => s + x, 0) / it.length) * 25 : tagFit;
    const interest = 0.55 * tagFit + 0.45 * itemFit;
    const goal = f.goal === "unsure" || !f.goal ? 70 : tg.goals.includes(f.goal) ? 100 : tg.goals.includes("skill") && f.goal === "grow" ? 70 : 35;
    const lvl = ["none", "basic", "unsure"].includes(f.level) ? (c.begin ? 100 : 75) : f.level === "deep" ? (c.begin ? 70 : 100) : 90;
    const dev = tg.dev === "any" ? 100 : tg.dev === "pc" ? (f.device === "phone" ? 30 : f.device === "unsure" ? 75 : 100) : f.device === "kit" ? 100 : f.device === "unsure" ? 70 : 50;
    const hours = (c.sec || 0) / 3600, weekly = Number(f.time) || 3, weeks = Math.max(1, Math.ceil(hours / weekly));
    const time = weeks > 12 ? 70 : 100;
    const ready = (lvl + dev + time) / 3;
    const score = 0.65 * interest + 0.25 * goal + 0.10 * ready;
    return { c, score, rank: score + 0.35 * rel, interest, goal, ready, dev, weeks, hours, tagFit };
  }
  const budgetOk = (c, b) => b === "0" ? cost(c) === 0 : b === "100000" ? cost(c) <= 100000 : b === "500000" ? cost(c) <= 500000 : true;
  const primary = (c) => Object.entries(c.tag.t).sort((x, y) => y[1] - x[1])[0][0];
  // three picks: best match, an alternative led by another theme, and a free or beginner start
  function recommend(st, skip = 0) {
    const raw = catalog(); if (!raw) return null;
    // most students look for online, office-based work: courses that need tools or materials (farming, crafts, driving...)
    // are suggested only to those who said they have such equipment
    const list = raw.filter((c) => c.tag.dev !== "kit" || st.f.device === "kit");
    const prof = profile(st.a);
    const all = list.map((c) => scoreCourse(c, st.a, st.f, prof)).sort((x, y) => y.rank - x.rank);
    const ok = all.filter((r) => budgetOk(r.c, st.f.budget));
    const base = ok.length >= 3 ? ok : all, seen = new Set();
    let picks = [];
    // "Boshqa yo'nalish ko'rsat": every further page leaves out the course types already shown
    for (let page = 0; page <= skip; page++) {
      const pool = base.filter((r) => !seen.has(r.c.g)), usedG = new Set(); picks = [];
      const take = (r) => { if (r) { picks.push(r); usedG.add(r.c.g); seen.add(r.c.g); } };
      take(pool[0]);
      if (picks[0]) take(pool.find((r) => !usedG.has(r.c.g) && primary(r.c) !== primary(picks[0].c)) || pool.find((r) => !usedG.has(r.c.g)));
      take(pool.find((r) => !usedG.has(r.c.g) && cost(r.c) === 0) || pool.find((r) => !usedG.has(r.c.g) && r.c.begin) || pool.find((r) => !usedG.has(r.c.g)));
    }
    const best = all[0], hidden = !skip && picks.length && ok.length && best && !budgetOk(best.c, st.f.budget) && best.score - picks[0].score > 6 ? best : null;
    const top = Object.entries(prof.p).sort((x, y) => y[1] - x[1]);
    return { picks, prof, top, hidden, weak: prof.answered < 12 || top[0][1] < 40 || top[0][1] - top[5][1] < 12 };
  }
  const pct = (r) => Math.max(35, Math.min(97, Math.round(r.score)));

  /* ---------- state ---------- */
  const fresh = () => {
    // statements in a mixed order (no two of the same theme in a row where possible), practical questions at the end
    const ids = [...Array(ITEMS.length).keys()].sort(() => Math.random() - .5);
    for (let i = 1; i < ids.length; i++) if (themeOf(ids[i]) === themeOf(ids[i - 1])) { const j = ids.findIndex((x, k) => k > i && themeOf(x) !== themeOf(ids[i - 1])); if (j > 0) [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return { order: ids, a: {}, f: {}, step: -1 };
  };
  let st = store.get("kp_state", null);
  if (!st || !Array.isArray(st.order) || st.order.length !== ITEMS.length) st = fresh();
  const save = () => store.set("kp_state", st);

  /* ---------- screens ---------- */
  const theme = (t) => THEMES[t];
  function Intro() {
    const going = st.step >= 0 && st.step < N;
    return `${navbar(T("Kasb Kompasi"))}
    <div class="kp-intro">
      <img class="kp-art" src="img/hero-compass.webp" alt="" decoding="async">
      <h2>${T("Sizga qaysi kurs mos?")}</h2>
      <p>${T("Bu qisqa so'rovnoma sizga qiziqishingiz va maqsadingizga mos kurslarni topishga yordam beradi. To'g'ri yoki noto'g'ri javob yo'q. Biror ishni hali sinab ko'rmagan bo'lsangiz, \"Hali sinab ko'rmaganman\" variantini tanlang. Natija sizga tavsiya beradi, yakuniy tanlov esa o'zingizniki.")}</p>
      <div class="kp-meta">
        <span>${ic("clock")}<b>${T("5 daqiqa")}</b><small>${T("taxminiy vaqt")}</small></span>
        <span>${ic("check")}<b>${N}</b><small>${T("oddiy savol")}</small></span>
        <span>${ic("target")}<b>${T("97% gacha")}</b><small>${T("kurs bilan moslik")}</small></span>
      </div>
      <div class="kp-themes">${Object.values(THEMES).map((t) => `<i style="--tc:${t.c}">${ic(t.icon)}</i>`).join("")}</div>
    </div>
    <button class="btn-primary" onclick="kpStart(${going ? 0 : 1})">${ic("play")} ${going ? T("Davom etish ({a} / {b})", { a: st.step + 1, b: N }) : T("Boshlash")}</button>
    ${going ? `<button class="btn-ghost" onclick="kpStart(1)">${ic("refresh")} ${T("Boshidan boshlash")}</button>` : ""}
    ${store.get("kp_done", null) ? `<button class="btn-ghost" onclick="location.hash='#/natija'">${ic("star")} ${T("Oxirgi natijam")}</button>` : ""}`;
  }
  // the answer is only kept on screen (green) until the student presses the green "next" button
  const nextBtn = (ready, i) => `<button class="btn-primary kp-next" ${ready ? "" : "disabled"} onclick="kpNext()">${i + 1 >= N ? T("Natijani ko'rish") : T("Keyingi savol")} ${ic("chev")}</button>`;
  function Question() {
    const i = st.step, head = `${navbar(T("Kasb Kompasi"))}
      <div class="kp-top"><span>${i < ITEMS.length ? T("Qiziqishlar") : T("Kurs tanlash shartlari")}</span><em>${i + 1} / ${N}</em></div>
      <div class="progress kp-prog"><span style="width:${(i / N) * 100}%"></span></div>`;
    if (i < ITEMS.length) {
      const id = st.order[i], t = theme(themeOf(id)), cur = st.a[id];
      return `${head}
      <div class="kp-card" style="--tc:${t.c}">
        <div class="kp-th">${chip(t.icon, "sm")}<small>${T(t.name)}</small></div>
        <h3>${T(ITEMS[id])}</h3>
      </div>
      <div class="kp-scale">${SCALE.map((s, v) => `<button class="kp-opt ${cur === v ? "on" : ""}" style="--tc:${t.c}" onclick="kpAns(${v})">
          <span class="kp-bars">${[0, 1, 2, 3, 4].map((k) => `<i class="${k <= v ? "f" : ""}"></i>`).join("")}</span><b>${T(s)}</b></button>`).join("")}</div>
      <button class="kp-skip ${cur === "n" ? "on" : ""}" onclick="kpAns('n')">${ic("compass")} ${T("Buni hali sinab ko'rmaganman")}</button>
      ${nextBtn(cur !== undefined, i)}
      ${i > 0 ? `<button class="kp-back" onclick="kpPrev()">${ic("back")} ${T("Oldingi savol")}</button>` : ""}`;
    }
    const q = FIT[i - ITEMS.length], cur = st.f[q.k];
    return `${head}
    <div class="kp-card fit"><div class="kp-th">${chip(q.icon, "sm")}<small>${T("Amaliy savol")}</small></div><h3>${T(q.q)}</h3></div>
    <div class="kp-fit">${q.o.map(([v, label, icn]) => `<button class="kp-opt ${cur === v ? "on" : ""}" onclick="kpFit('${q.k}','${v}')"><i>${ic(icn)}</i><b>${T(label)}</b></button>`).join("")}</div>
    ${nextBtn(cur !== undefined, i)}
    <button class="kp-back" onclick="kpPrev()">${ic("back")} ${T("Oldingi savol")}</button>`;
  }
  function Screen() {
    if (st.step < 0 || st.step >= N) return Intro();
    return Question();
  }
  const next = () => {
    st.step++; save();
    if (st.step >= N) { store.set("kp_done", { a: st.a, f: st.f, at: Date.now() }); st = fresh(); save(); try { tg.HapticFeedback.notificationOccurred("success"); } catch {} location.replace("#/natija"); return; }
    render(); window.scrollTo(0, 0);
  };
  window.kpStart = (reset) => { if (reset || st.step < 0 || st.step >= N) st = fresh(); if (st.step < 0) st.step = 0; save(); haptic("light"); render(); };
  // after a choice the green "next" button glides into view
  const toNext = () => requestAnimationFrame(() => { const b = document.querySelector(".kp-next"); if (b) b.scrollIntoView({ behavior: "smooth", block: "center" }); });
  window.kpAns = (v) => { st.a[st.order[st.step]] = v; save(); haptic("light"); render(); toNext(); };
  window.kpFit = (k, v) => { st.f[k] = v; save(); haptic("light"); render(); toNext(); };
  window.kpNext = () => {
    const i = st.step, ok = i < ITEMS.length ? st.a[st.order[i]] !== undefined : st.f[FIT[i - ITEMS.length].k] !== undefined;
    if (!ok) { toast(T("Avval javobni tanlang")); return; }
    haptic("medium"); next();
  };
  window.kpPrev = () => { if (st.step > 0) { st.step--; save(); haptic("light"); render(); } };

  /* ---------- result ---------- */
  const price = (c) => cost(c) === 0 ? T("Bepul") : `${fmtN(cost(c))} ${T("so'm")}`;
  const dur = (h) => h >= 1 ? T("{n} soat", { n: String(Math.round(h * 10) / 10).replace(".", ",") }) : T("{n} daqiqa", { n: Math.max(1, Math.round(h * 60)) });
  const GOALS = Object.fromEntries(FIT[0].o.map(([k, l]) => [k, l]));
  let more = 0;
  function card(r, kind, prof) {
    const c = r.c, ts = Object.entries(c.tag.t).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([t]) => T(THEMES[t].name).toLowerCase());
    const m = pct(r), ring = 2 * Math.PI * 22;
    const devTxt = c.tag.dev === "pc" ? T("Kompyuter kerak") : c.tag.dev === "kit" ? T("Jihoz va materiallar kerak") : T("Smartfonda ham o'qish mumkin");
    const why = T("Javoblaringiz {a} va {b} yo'nalishiga qiziqishingiz yuqoriligini ko'rsatdi.", { a: ts[0], b: ts[1] || ts[0] });
    return `<div class="kp-res">
      <div class="kp-res-h">
        <span class="kp-kind">${kind}</span>
        <svg class="kp-ring" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="27" cy="27" r="22" fill="none" stroke="var(--p1)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - m / 100)}" transform="rotate(-90 27 27)"/><text x="27" y="31.5" text-anchor="middle" font-size="13" font-weight="800" fill="var(--text)">${m}%</text></svg>
      </div>
      <a class="kp-res-c" href="#/kurs/${c.id}">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : ""}<span><b class="notr">${esc(c.title)}</b><small class="notr">${esc(c.teacher || "Ustoz AI")}</small></span></a>
      <p class="kp-why">${why}</p>
      <div class="kp-facts">
        <span>${ic("play")}${T("{n} dars", { n: c.lessons })}</span><span>${ic("clock")}${dur(r.hours)}</span>
        <span>${ic("coin")}${price(c)}</span><span>${ic("calc")}${T("taxminan {n} haftada", { n: r.weeks })}</span>
        <span>${ic(c.tag.dev === "pc" ? "laptop" : c.tag.dev === "kit" ? "tool" : "phone")}${devTxt}</span><span>${ic("globe")}${T("O'zbekcha")}</span>
      </div>
      <details class="kp-more"><summary>${T("Nega bu kurs?")}</summary>
        <ul>
          <li><b>${Math.round(r.interest)}%</b> ${T("qiziqishlar mosligi")}: ${Object.keys(c.tag.t).map((t) => `${T(THEMES[t].name)} ${Math.round(prof.p[t])}%`).join(", ")}</li>
          <li><b>${Math.round(r.goal)}%</b> ${T("maqsad mosligi")}</li>
          <li><b>${Math.round(r.ready)}%</b> ${T("tayyorgarlik: daraja, qurilma va vaqt")}</li>
        </ul>
      </details>
      <div class="kp-btns"><a class="btn-ghost" href="#/kurs/${c.id}">${T("Batafsil")}</a><button class="btn-primary" onclick="openApp('${esc(c.url)}')">${ic("play")} ${T("Ilovada ochish")}</button></div>
    </div>`;
  }
  function Result() {
    const done = store.get("kp_done", null);
    if (!done) { location.replace("#/kompas"); return ""; }
    if (!catalog()) { const p = Kurslar.load(); if (p) p.then(() => { if (location.hash === "#/natija") render(); }); return `${navbar(T("Kasb Kompasi"))}${spinner()}`; }
    const r = recommend({ a: done.a, f: done.f }, more);
    if (!r.picks.length && more) { more = 0; return Result(); }
    const [t1, t2, t3] = r.top, gap = (t1[1] - t2[1]) / 25 * 4;   // in the spec's 0-16 raw points
    const head = r.weak ? T("Hozircha aniq yo'nalish ko'rinmadi")
      : gap <= 2 ? T("Sizda bir nechta mos yo'nalish bor") : T("Yetakchi yo'nalishingiz: {t}", { t: T(THEMES[t1[0]].name) });
    const kinds = [T("Eng mos kurs"), T("Muqobil yo'nalish"), T("Bepul yoki oson boshlash")];
    const goalTxt = done.f.goal && GOALS[done.f.goal] ? T(GOALS[done.f.goal]) : "";
    return `${navbar(T("Kasb Kompasi"))}
    <div class="kp-head">
      <span class="kp-head-i">${ic(THEMES[t1[0]].icon)}</span>
      <small>${T("Sizning natijangiz")}</small>
      <h2>${head}</h2>
      <p>${r.weak ? T("Ko'p savolga \"Hali sinab ko'rmaganman\" deb javob berdingiz. Quyidagi kurslar bilan tanishib chiqing yoki so'rovnomani qayta topshiring.") : T("Bu natija siz bildirgan qiziqish va maqsadga asoslangan tavsiya. Tanlov sizniki.")}</p>
      <div class="kp-bars3">${[t1, t2, t3].map(([t, v]) => `<div style="--tc:${THEMES[t].c}"><span>${ic(THEMES[t].icon)}<b>${T(THEMES[t].name)}</b><em>${Math.round(v)}%</em></span><i><s style="width:${Math.round(v)}%"></s></i></div>`).join("")}</div>
      ${goalTxt ? `<p class="kp-goal">${ic("target")} ${T("Maqsadingiz")}: <b>${goalTxt}</b></p>` : ""}
    </div>
    <div class="section-title">${T("Sizga tavsiya etilgan kurslar")}</div>
    ${r.picks.map((p, i) => card(p, kinds[i] || "", r.prof)).join("")}
    ${r.hidden ? `<p class="kp-note">${ic("coin")} ${T("Narx chegarangiz tufayli eng mos kurs ko'rsatilmadi: {c} ({m}%).", { c: `<b class="notr">${esc(r.hidden.c.title)}</b>`, m: pct(r.hidden) })} <a href="#/kurs/${r.hidden.c.id}">${T("Ko'rish")}</a></p>` : ""}
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
    const done = store.get("kp_done", null); if (!done) return;
    const t = profile(done.a), lead = Object.entries(t.p).sort((x, y) => y[1] - x[1])[0][0];
    const link = `https://t.me/${BOT}?start=ref_${user.id}`;
    const text = T("Mening yetakchi yo'nalishim: {p}. Sizga qaysi kurs mos? Kasb Kompasida 5 daqiqada bilib oling.", { p: T(THEMES[lead].name) });
    haptic(); openTg(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };
  return { Screen, Result, _test: { ITEMS, FIT, TAGS, recommend, profile, setCatalog: (list) => { courses = list.filter((c) => TAGS[c.g] && (c.lessons || 0) >= 3 && (c.sec || 0) >= 600).map((c) => ({ ...c, tag: TAGS[c.g], begin: BEGIN.test(c.title) || cost(c) === 0 })); } } };
})();
window.Compass = Compass;
