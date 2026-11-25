// "Kasb Kompasi": a 15-screen course finder, built to the developer handoff "Kasb-Kompasi-15.docx" (version kk15.1).
// The questions, the 56 course groups ("routes"), the 119 courses and the texts come from data/kompas15.json
// (made by tools/build_kompas15.py from the handoff); recommend() follows the handoff's reference scorer exactly and is
// checked against its 20 test cases by tools/test_kompas15.js.
//   Q01-Q12  everyday situations, 2 per theme (R I A S E C); A-E give 4-0 points, F ("not sure yet") is left out
//   Q13      the goal, with an optional topic on the same screen (one course or one course group)
//   Q14      the device; Q15 the budget (B asks for the highest amount in so'm)
// Course score = 100 x earned / possible of: interest 65 x (theme mean + anchor mean) / 8, goal 25, readiness 10.
const Compass = (() => {
  const VER = 4;
  const THEMES = {
    R: { name: "Qo'l bilan bajariladigan ishlar", icon: "tool", c: "#F2600C" },
    I: { name: "Tahlil va izlanish", icon: "chart", c: "#2748F5" },
    A: { name: "Ijod va dizayn", icon: "palette", c: "#7C3AED" },
    S: { name: "Odamlar bilan ishlash", icon: "users", c: "#0FB07F" },
    E: { name: "Tashabbus va biznes", icon: "rocket", c: "#E08A00" },
    C: { name: "Hisob va rejalashtirish", icon: "layers", c: "#0891B2" },
  };
  const ICONS = { Q13: ["coin", "star", "briefcase", "rocket", "chart", "globe", "heart", "compass"], Q14: ["laptop", "phone", "laptop", "x", "compass"], Q15: ["gift", "coin", "check", "compass"] };

  /* ---------- the data ---------- */
  const APP_V = ((document.querySelector('script[src*="kompas.js"]') || {}).src || "").split("v=")[1] || "0";
  let B = null, loading = null, QM = {}, RM = {}, CM = {};
  function load() {
    if (B || loading) return loading;
    loading = fetch("data/kompas15.json?v=" + APP_V).then((r) => r.json()).then((d) => { setData(d); render(); }).catch(() => { loading = null; });
    return loading;
  }
  function setData(d) {
    B = d; QM = {}; RM = {}; CM = {};
    d.questions.forEach((q) => { QM[q.id] = q; }); d.routes.forEach((r) => { RM[r.id] = r; }); d.courses.forEach((c) => { CM[c.id] = c; });
  }

  /* ---------- scoring: the handoff's reference scorer, step by step ---------- */
  const POINTS = { A: 4, B: 3, C: 2, D: 1, E: 0, F: null };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const round1 = (v) => v === null ? null : Math.round((v + Number.EPSILON) * 10) / 10;
  function recommend(bundle, answers, budget_uzs = null, topic = null) {
    const questions = bundle.questions, routes = Object.fromEntries(bundle.routes.map((r) => [r.id, r])), catalog = bundle.courses;
    const result = { status: "ok", mode: null, items: [], profile: {}, weak: null };
    const finish = (s) => { result.status = s; return result; };
    for (const q of questions) {
      if (!(q.id in answers)) return finish("incomplete");
      if (!q.o.some((o) => o.c === answers[q.id])) return finish("invalid_answer");
    }
    const budget = answers.Q15;
    if (budget === "B" && !(Number.isInteger(budget_uzs) && budget_uzs > 0)) return finish("invalid_budget");
    if (topic !== null) {
      const ok = topic && Object.keys(topic).length === 1 && ((topic.course_id && catalog.some((c) => c.id === topic.course_id)) || (topic.route_id && routes[topic.route_id]));
      if (!ok) return finish("invalid_topic");
    }
    const values = {};
    questions.filter((q) => q.type === "interest").forEach((q) => { values[q.id] = POINTS[answers[q.id]]; });
    const themeAvg = {};
    for (const t of "RIASEC") {
      const s = questions.filter((q) => q.theme === t && values[q.id] !== null && values[q.id] !== undefined).map((q) => values[q.id]);
      themeAvg[t] = s.length === 2 ? mean(s) : null;
      result.profile[t] = { rated: s.length, mean: themeAvg[t] };
    }
    result.weak = Object.values(values).filter((v) => v !== null).length < 8;
    const device = answers.Q14, goal = answers.Q13;
    const goalForScore = goal === "H" ? null : goal === "A" ? "B" : goal;
    if (device === "D") return finish("save_for_later");
    let mode;
    if (topic !== null) mode = "topic";
    else if (goal === "C") mode = "job_search";
    else if (goal === "F") return finish("choose_topic");
    else mode = "interest";
    result.mode = mode;
    const cand = []; let positive = false;
    for (const c of catalog) {
      const route = routes[c.route];
      const anchors = route.anchors.filter((k) => values[k] !== null);
      const anchorAvg = anchors.length ? mean(anchors.map((k) => values[k])) : null;
      const theme = route.theme in themeAvg ? themeAvg[route.theme] : null;
      const interest = theme === null || anchorAvg === null ? null : 65 * (theme + anchorAvg) / 8;
      const goalPts = goalForScore === null ? null : route.goals.includes(goalForScore) ? 25 : 0;
      const ready = device === "E" || route.device === "kit" ? null : 10;
      const parts = [[interest, 65], [goalPts, 25], [ready, 10]].filter(([v]) => v !== null);
      const score = interest === null ? null : 100 * parts.reduce((s, [v]) => s + v, 0) / parts.reduce((s, [, w]) => s + w, 0);
      if (mode === "interest") {
        if (score === null || anchorAvg < 3) continue;
        positive = true;
        if (c.lessons < 3 || (c.sec || 0) < 600) continue;
      } else if (mode === "job_search" && route.id !== "career") continue;
      else if (mode === "topic") {
        if (topic.course_id && c.id !== topic.course_id) continue;
        if (topic.route_id && route.id !== topic.route_id) continue;
      }
      if (c.lessons < 1 || (device === "B" && route.device === "pc")) continue;
      const price = c.price;
      if ((budget === "A" || budget === "B") && (price === null || price > (budget === "A" ? 0 : budget_uzs))) continue;
      const notes = [];
      if (price === null) notes.push("confirm_price");
      if (device === "E") notes.push("confirm_device");
      if (route.device === "kit") notes.push("confirm_equipment");
      if (!c.sec) notes.push("confirm_materials");
      if (interest !== null && anchors.length === 1) notes.push("single_anchor");
      cand.push({ key: [score === null ? 1 : 0, -(score || 0), price === null ? 1 : 0, price || 0, c.id],
        item: { course_id: c.id, guide_no: c.no, title: c.title, url: c.url, route_id: c.route, price_uzs: price, score: score, score_100: round1(score),
          parts: { interest: round1(interest), goal: goalPts, readiness: ready }, positive_anchors: anchors.filter((k) => values[k] >= 3), notes } });
    }
    const cmp = (x, y) => { for (let i = 0; i < 5; i++) { if (x[i] < y[i]) return -1; if (x[i] > y[i]) return 1; } return 0; };
    const ranked = cand.sort((x, y) => cmp(x.key, y.key)).map((x) => x.item);
    if (!ranked.length) return finish(mode === "interest" && !positive ? "explore" : "no_match");
    if (mode !== "interest") { result.items = ranked.slice(0, 3); return result; }
    // the best course, then the best one from another theme, then the next course groups not used yet
    const picks = [ranked[0]], bestTheme = routes[ranked[0].route_id].theme;
    const other = ranked.find((it) => routes[it.route_id].theme !== bestTheme);
    if (other) picks.push(other);
    const used = new Set(picks.map((it) => it.route_id));
    for (const it of ranked) {
      if (picks.length >= 3) break;
      if (!used.has(it.route_id)) { used.add(it.route_id); picks.push(it); }
    }
    result.items = picks;
    return result;
  }

  /* ---------- state: answers keyed Q01-Q15, saved at once so a student who leaves comes back to the same screen ---------- */
  const fresh = () => ({ v: VER, a: {}, sum: null, topic: null, step: -1 });
  let st = store.get("kp_state", null);
  if (!st || st.v !== VER) st = fresh();
  const save = () => { st.num = st.step + 1; store.set("kp_state", st); };
  const NQ = 15;

  /* ---------- screens ---------- */
  const U = (k) => T(B.ui[k]);
  function Intro() {
    const going = st.step >= 0 && st.step < NQ;
    return `${navbar(T("Kasb Kompasi"))}
    <div class="kp-intro">
      <img class="kp-art" src="img/kompas-start.webp" alt="" decoding="async">
      <h2>${T("Sizga qaysi kurs mos?")}</h2>
      <p>${U("intro")}</p>
      <div class="kp-meta">
        <span>${ic("clock")}<b>${T("5 daqiqa")}</b><small>${T("taxminiy vaqt")}</small></span>
        <span>${ic("check")}<b>${NQ}</b><small>${T("rasmli savol")}</small></span>
        <span>${ic("target")}<b>3</b><small>${T("mos kurs")}</small></span>
      </div>
      <div class="kp-themes">${Object.values(THEMES).map((t) => `<i style="--tc:${t.c}">${ic(t.icon)}</i>`).join("")}</div>
    </div>
    <button class="btn-primary" onclick="kpStart(${going ? 0 : 1})">${ic("play")} ${going ? T("Davom etish ({a} / {b})", { a: st.step + 1, b: NQ }) : T("Boshlash")}</button>
    ${going ? `<button class="btn-ghost" onclick="kpStart(1)">${ic("refresh")} ${T("Boshidan boshlash")}</button>` : ""}
    ${store.get("kp_done3", null) ? `<button class="btn-ghost" onclick="location.hash='#/natija'">${ic("star")} ${T("Oxirgi natijam")}</button>` : ""}`;
  }
  const pic = (q) => `<div class="kp-pic"><img src="${q.img}" alt="${esc(q.alt || "")}" decoding="async"></div>`;
  // the optional topic: one course group or one course from the catalog (stored as {route_id} or {course_id})
  function topicPicker(cur, fn) {
    const v = cur ? (cur.route_id ? "r:" + cur.route_id : "c:" + cur.course_id) : "";
    const routes = B.routes.slice().sort((x, y) => T(x.name).localeCompare(T(y.name)));
    const courses = B.courses.slice().sort((x, y) => x.title.localeCompare(y.title));
    return `<label class="kp-topic"><small>${U("topic_label")}</small>
      <select onchange="${fn}(this.value)">
        <option value="">${T("Tanlanmagan")}</option>
        <optgroup label="${T("Yo'nalishlar")}">${routes.map((r) => `<option value="r:${r.id}" ${v === "r:" + r.id ? "selected" : ""}>${esc(T(r.name))}</option>`).join("")}</optgroup>
        <optgroup label="${T("Kurslar")}">${courses.map((c) => `<option class="notr" value="c:${c.id}" ${v === "c:" + c.id ? "selected" : ""}>${esc(c.title.slice(0, 70))}</option>`).join("")}</optgroup>
      </select></label>`;
  }
  const parseTopic = (v) => !v ? null : v.startsWith("r:") ? { route_id: v.slice(2) } : { course_id: v.slice(2) };
  const ready = (q) => !!st.a[q.id] && !(q.id === "Q15" && st.a.Q15 === "B" && !(st.sum > 0));
  function Question() {
    const q = B.questions[st.step], last = st.step + 1 >= NQ, cur = st.a[q.id], num = st.step + 1;
    const t = q.theme ? THEMES[q.theme] : null;
    const head = `${navbar(T("Kasb Kompasi"))}
      <div class="kp-top"><span>${t ? T(t.name) : T("Kurs tanlash shartlari")}</span><em>${num} / ${NQ}</em></div>
      <div class="progress kp-prog"><span style="width:${(st.step / NQ) * 100}%"></span></div>`;
    const back = st.step > 0 ? `<button class="kp-back" onclick="kpPrev()">${ic("back")} ${U("back")}</button>` : "";
    const again = st.step > 0 ? `<button class="kp-back kp-again" onclick="kpAgain()">${ic("refresh")} ${T("Boshidan boshlash")}</button>` : "";
    const nextBtn = `<button class="btn-primary kp-next" ${ready(q) ? "" : "disabled"} onclick="kpNext()">${last ? U("finish") : U("continue")} ${ic("chev")}</button>`;
    if (q.type === "interest") {
      return `${head}
      <div class="kp-card kp-pq" style="--tc:${t.c}">${pic(q)}
        <div class="kp-th">${chip(t.icon, "sm")}<small>${num}-${T("savol")}</small></div>
        <h3>${T(q.q)}</h3>
      </div>
      <div class="kp-scale">${q.o.slice(0, 5).map((o) => `<button class="kp-opt kp-l ${cur === o.c ? "on" : ""}" style="--tc:${t.c}" onclick="kpAns('${o.c}')"><span class="kp-letter">${o.c}</span><b>${T(o.t)}</b></button>`).join("")}</div>
      <button class="kp-skip kp-l ${cur === "F" ? "on" : ""}" onclick="kpAns('F')"><span class="kp-letter">F</span><span>${T(q.o[5].t)}</span></button>
      ${nextBtn}${back}${again}`;
    }
    const icons = ICONS[q.id] || [];
    return `${head}
    <div class="kp-card fit kp-pq">${pic(q)}<div class="kp-th">${chip(icons[0] || "search", "sm")}<small>${num}-${T("savol")}</small></div><h3>${T(q.q)}</h3>${q.hint ? `<p class="kp-hint">${T(q.hint)}</p>` : ""}</div>
    <div class="kp-fit">${q.o.map((o, k) => `<button class="kp-opt ${cur === o.c ? "on" : ""}" onclick="kpAns('${o.c}')"><i>${ic(icons[k] || "check")}</i><b>${T(o.t)}</b></button>`).join("")}</div>
    ${q.id === "Q13" ? topicPicker(st.topic, "kpTopic") : ""}
    ${q.id === "Q15" && cur === "B" ? `<label class="kp-input">${ic("coin")}<input id="kp-sum" inputmode="numeric" placeholder="${U("budget_amount_label")}" value="${st.sum ? fmtN(st.sum) : ""}" autocomplete="off" oninput="kpSum(this.value)"><span>${T("so'm")}</span></label>` : ""}
    ${nextBtn}${back}${again}`;
  }
  function Screen() {
    if (!B) { load(); return `${navbar(T("Kasb Kompasi"))}${spinner()}`; }
    const go = store.get("kp_go", 0);
    if (go) { store.set("kp_go", 0); if (go === 2 || st.step < 0 || st.step >= NQ) { st = fresh(); st.step = 0; save(); } }
    if (st.step < 0 || st.step >= NQ) return Intro();
    return Question();
  }
  const toNext = () => requestAnimationFrame(() => { const b = document.querySelector(".kp-next"); if (b) b.scrollIntoView({ behavior: "smooth", block: "center" }); });
  window.kpStart = (reset) => { if (reset || st.step < 0 || st.step >= NQ) st = fresh(); if (st.step < 0) st.step = 0; save(); haptic("light"); render(); window.scrollTo(0, 0); };
  window.kpAns = (c) => {
    const q = B.questions[st.step]; st.a[q.id] = c; save(); haptic("light"); render();
    if (q.id === "Q15" && c === "B") setTimeout(() => { const el = document.getElementById("kp-sum"); if (el) el.focus(); }, 50); else toNext();
  };
  window.kpTopic = (v) => { st.topic = parseTopic(v); save(); haptic("light"); };
  // typing keeps the focus: only the "next" button is switched on or off
  window.kpSum = (v) => { const n = Number(String(v).replace(/\D/g, "")); st.sum = n > 0 ? n : null; save(); const b = document.querySelector(".kp-next"); if (b) b.disabled = !(n > 0); };
  window.kpNext = () => {
    const q = B.questions[st.step];
    if (!ready(q)) { toast(T("Avval javobni tanlang")); return; }
    haptic("medium"); st.step++; save();
    if (st.step >= NQ) {
      store.set("kp_done3", { a: st.a, sum: st.a.Q15 === "B" ? st.sum : null, topic: st.topic, at: Date.now() });
      st = fresh(); save(); try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
      location.replace("#/natija"); return;
    }
    render(); window.scrollTo(0, 0);
  };
  window.kpAgain = () => confirmAsk(T("Javoblaringiz o'chadi va test boshidan boshlanadi. Davom etasizmi?"), T("Boshidan boshlash")).then((ok) => { if (ok) { st = fresh(); st.step = 0; save(); render(); window.scrollTo(0, 0); } });
  window.kpPrev = () => { if (st.step > 0) { st.step--; save(); haptic("light"); render(); } };
  // change answers: the last answers come back into the test, from the first screen
  window.kpEdit = () => { const d = store.get("kp_done3", null); if (!d) return; st = { ...fresh(), a: { ...d.a }, sum: d.sum, topic: d.topic, step: 0 }; save(); location.hash = "#/kompas"; };

  /* ---------- result ---------- */
  const price = (p) => p === null ? T("Narxi ko'rsatilmagan") : p === 0 ? T("Bepul") : `${fmtN(p)} ${T("so'm")}`;
  const dur = (s) => { const h = s / 3600; return h >= 1 ? T("{n} soat", { n: String(Math.round(h * 10) / 10).replace(".", ",") }) : T("{n} daqiqa", { n: Math.max(1, Math.round(h * 60)) }); };
  const low1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  function why(it, mode, done) {
    const c = CM[it.course_id];
    let w;
    if (mode === "topic") w = T("Siz tanlagan mavzu: {t}.", { t: `<b class="notr">${esc(done.topic.route_id ? T(RM[done.topic.route_id].name) : c.title)}</b>` });
    else if (mode === "job_search") w = T("Maqsadingiz: işga kiriş. Bu kurs rezyume va iş suhbatiga tayyorlaydi.");
    else {
      const liked = it.positive_anchors.map((k) => low1(T(QM[k].label)));
      w = liked.length ? T("Javoblaringizda {x} sizga yoqdi.", { x: liked.join(` ${T("va")} `) }) : "";
    }
    return `${w} ${c.about ? `<span class="notr">${esc(c.about)}</span>` : ""}`.trim();
  }
  function card(it, kind, mode, done) {
    const c = CM[it.course_id], route = RM[it.route_id], k = (Kurslar.data() && Kurslar.data().courses.find((x) => x.id === c.id)) || null;
    const m = it.score_100, ring = 2 * Math.PI * 22, url = (k && k.url) || c.url;
    const dev = route.device === "pc" ? ["laptop", T("Kompyuter kerak")] : route.device === "kit" ? ["tool", T("Jihoz va materiallar kerak")] : ["phone", T("Smartfonda ham o'qish mumkin")];
    return `<div class="kp-res">
      <div class="kp-res-h">
        <span class="kp-kind">${kind}</span>
        ${m === null ? `<span class="kp-tag">${T("Mavzu bo'yicha")}</span>` : `<svg class="kp-ring" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="27" cy="27" r="22" fill="none" stroke="var(--p1)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - m / 100)}" transform="rotate(-90 27 27)"/><text x="27" y="31.5" text-anchor="middle" font-size="${m >= 100 ? 11 : 12}" font-weight="800" fill="var(--text)">${String(m).replace(".", ",")}</text></svg>`}
      </div>
      <a class="kp-res-c" ${k ? `href="#/kurs/${c.id}"` : ""}>${k ? courseImg(k) : ""}<span><b class="notr">${esc(c.title)}</b><small class="notr">${esc(c.teacher || "Ustoz AI")}</small></span></a>
      <p class="kp-why">${why(it, mode, done)}</p>
      <div class="kp-facts">
        <span>${ic("play")}${T("{n} dars", { n: c.lessons })}</span>${c.sec ? `<span>${ic("clock")}${dur(c.sec)}</span>` : ""}
        <span>${ic("coin")}${price(c.price)}</span><span>${ic(dev[0])}${dev[1]}</span>
      </div>
      ${it.notes.map((n) => `<p class="kp-note">${ic("info")} ${U(n)}</p>`).join("")}
      ${m === null ? "" : `<details class="kp-more"><summary>${T("Nega bu kurs?")}</summary>
        <ul>
          <li><b>${String(it.parts.interest).replace(".", ",")} / 65</b> ${T("qiziqish")}: ${T(THEMES[route.theme].name)}</li>
          ${it.parts.goal === null ? "" : `<li><b>${it.parts.goal} / 25</b> ${T("maqsad mosligi")}</li>`}
          ${it.parts.readiness === null ? "" : `<li><b>${it.parts.readiness} / 10</b> ${T("qurilma mosligi")}</li>`}
        </ul>
      </details>`}
      <div class="kp-btns">${k ? `<a class="btn-ghost" href="#/kurs/${c.id}">${T("Batafsil")}</a>` : ""}<button class="btn-primary" onclick="openApp('${esc(url)}')">${ic("play")} ${U("open_course")}</button></div>
    </div>`;
  }
  function Result() {
    const done = store.get("kp_done3", null);
    if (!done) { location.replace("#/kompas"); return ""; }
    if (!B) { load(); return `${navbar(T("Kasb Kompasi"))}${spinner()}`; }
    if (!Kurslar.data()) { const p = Kurslar.load(); if (p) p.then(() => { if (location.hash === "#/natija") render(); }); }
    const r = recommend(B, done.a, done.sum, done.topic || null);
    const prof = Object.entries(r.profile).filter(([, p]) => p.mean !== null).sort((x, y) => y[1].mean - x[1].mean);
    const goal = QM.Q13.o.find((o) => o.c === done.a.Q13);
    const kinds = [T("Eng mos kurs"), T("Yana bir mos kurs"), T("Uchinchi tavsiya")];
    const msg = { explore: "explore", no_match: "no_match", choose_topic: "choose_topic", save_for_later: "save_for_later" }[r.status];
    return `${navbar(T("Kasb Kompasi"))}
    <div class="kp-head">
      <span class="kp-head-i">${ic(prof.length ? THEMES[prof[0][0]].icon : "compass")}</span>
      <small>${T("Sizning natijangiz")}</small>
      <h2>${U("results_title")}</h2>
      ${prof.length ? `<div class="kp-bars3">${prof.slice(0, 3).map(([t, p]) => `<div style="--tc:${THEMES[t].c}"><span>${ic(THEMES[t].icon)}<b>${T(THEMES[t].name)}</b><em>${Math.round(p.mean * 25)}%</em></span><i><s style="width:${Math.round(p.mean * 25)}%"></s></i></div>`).join("")}</div>` : ""}
      ${goal ? `<p class="kp-goal">${ic("target")} ${T("Maqsadingiz")}: <b>${T(goal.t)}</b></p>` : ""}
    </div>
    ${r.weak && r.status === "ok" ? `<p class="kp-note">${ic("info")} ${U("limited")}</p>` : ""}
    ${msg ? `<p class="kp-note">${ic("info")} ${U(msg)}</p>` : ""}
    ${r.status === "ok" ? `<div class="section-title">${T("Sizga tavsiya etilgan kurslar")}</div>${r.items.map((it, i) => card(it, kinds[i], r.mode, done)).join("")}` : ""}
    ${r.status !== "save_for_later" ? `<div class="kp-res kp-retopic">${topicPicker(done.topic, "kpReTopic")}</div>` : ""}
    ${r.status === "save_for_later" || r.status === "explore" ? `<button class="btn-primary" onclick="location.hash='#/kurslar'">${ic("play")} ${T("Barcha kurslar")}</button>` : ""}
    <button class="btn-primary" onclick="kpShare()">${ic("send")} ${T("Do'stlarga ulashish")}</button>
    <button class="btn-ghost" onclick="kpEdit()">${ic("edit")} ${T("Javoblarni o'zgartirish")}</button>
    <button class="btn-ghost" onclick="kpStart(1);location.hash='#/kompas'">${ic("refresh")} ${T("Qaytadan topshirish")}</button>
    <p class="note">${T("Tavsiya qiziqishlaringiz va tanlagan shartlaringizga asoslanadi. U ish yoki daromadni kafolatlamaydi.")}</p>`;
  }
  // a topic chosen on the result screen: the same rules run again with it
  window.kpReTopic = (v) => { const d = store.get("kp_done3", null); if (!d) return; d.topic = parseTopic(v); store.set("kp_done3", d); haptic("light"); render(); };
  window.kpShare = () => {
    const d = store.get("kp_done3", null); if (!d || !B) return;
    const r = recommend(B, d.a, d.sum, d.topic || null);
    const lead = Object.entries(r.profile).filter(([, p]) => p.mean !== null).sort((x, y) => y[1].mean - x[1].mean)[0];
    const link = `https://t.me/${BOT}?start=ref_${user.id}`;
    const text = lead ? T("Mening yetakchi yo'nalishim: {p}. Sizga qaysi kurs mos? Kasb Kompasida 5 daqiqada bilib oling.", { p: T(THEMES[lead[0]].name) }) : T("Sizga qaysi kurs mos? Kasb Kompasida 5 daqiqada bilib oling.");
    haptic(); openTg(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };
  return { Screen, Result, _test: { recommend, setData } };
})();
window.Compass = Compass;
