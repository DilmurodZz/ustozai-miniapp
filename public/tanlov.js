// "Tanlov": winners of Zamonaviy kasblar tanlovi 2026, live from the competition site's database
// (zamonaviykasblar2026.uz publishes them from its admin panel; the share server passes on only public fields).
// Three directions (grafik dizayn, mobilografiya, veb-sayt), three stages (tuman, viloyat, respublika),
// a road map of the stages toward the Changan prize, filters by region, a search by name or district,
// and a congratulation picture for every winner that they can save or share.
const Contest = (() => {
  const SITE = "https://zamonaviykasblar2026.uz", BOT = "@ustozaiminibot";
  const DIRS = () => [
    { k: "design", name: T("Grafik dizayn"), long: T("Eng yaxshi grafik dizayn"), icon: "palette", c: "#7C3AED", uz: "Grafik dizayn" },
    { k: "mobile", name: T("Mobilografiya"), long: T("Eng yaxshi mobilografiya ishi"), icon: "camera", c: "#F2600C", uz: "Mobilografiya" },
    { k: "web", name: T("Veb-sayt"), long: T("Eng yaxshi veb-sayt"), icon: "code", c: "#2748F5", uz: "Veb-sayt" },
  ];
  const STAGES = () => [
    { k: "tuman", name: T("Tuman"), long: T("Tuman (shahar) bosqichi"), icon: "pin", uz: "TUMAN" },
    { k: "hududiy", name: T("Viloyat"), long: T("Viloyat bosqichi"), icon: "map", uz: "VILOYAT" },
    { k: "respublika", name: T("Respublika"), long: T("Respublika bosqichi"), icon: "trophy", uz: "RESPUBLIKA" },
  ];
  // all regions, so a region without winners yet still shows in the filter
  const REGIONS = ["Andijon viloyati", "Buxoro viloyati", "Farg'ona viloyati", "Jizzax viloyati", "Namangan viloyati", "Navoiy viloyati", "Qashqadaryo viloyati",
    "Qoraqalpog'iston Respublikasi", "Samarqand viloyati", "Sirdaryo viloyati", "Surxondaryo viloyati", "Toshkent shahri", "Toshkent viloyati", "Xorazm viloyati"];
  const norm = (s) => String(s || "").replace(/[‘’ʻʼ`]/g, "'").trim();
  const fold = (s) => norm(s).toLowerCase().replace(/'/g, "");

  let data = store.get("zk_winners", null), loadingNow = false, failed = false;
  let dir = store.get("zk_dir", "design"), stage = store.get("zk_stage", "tuman"), region = store.get("zk_region", ""), query = "";
  function load() {
    if (loadingNow) return; loadingNow = true;
    fetch(SHARE_API + "/winners").then((r) => r.json()).then((d) => {
      if (!Array.isArray(d.winners)) throw new Error("bad");
      d.winners.forEach((w) => { w.r = norm(w.r); w.t = norm(w.t); w.n = norm(w.n); });
      const changed = !data || JSON.stringify(d.winners) !== JSON.stringify(data.winners);
      data = d; failed = false; store.set("zk_winners", d);
      if (changed && location.hash === "#/tanlov") render();
    }).catch(() => { failed = true; if (!data && location.hash === "#/tanlov") render(); }).finally(() => { loadingNow = false; });
  }
  const all = () => (data && data.winners) || [];

  /* ---------- Toshkent shahri, hududiy bosqich: scores of every participant (data/zk-toshkent.json) ---------- */
  let tsh = store.get("zk_tsh", null), tshOpen = -1;
  function loadTsh() {
    fetch("data/zk-toshkent.json?t=" + Math.floor(Date.now() / 6e5)).then((r) => r.json()).then((d) => {
      const changed = JSON.stringify(d) !== JSON.stringify(tsh); tsh = d; store.set("zk_tsh", d);
      if (changed && location.hash === "#/tanlov") { const el = document.getElementById("zk-tsh"); if (el) el.outerHTML = tshHTML(); }
    }).catch(() => {});
  }
  // order: final score, then criterion 1, then criterion 5 (the competition's own rule); equal on all three share a place
  function tshRanked() {
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const done = tsh.rows.filter((r) => r.s).map((r) => ({ ...r, total: sum(r.s), fin: sum(r.s) + (r.bonus || 0) }))
      .sort((a, b) => b.fin - a.fin || b.s[0] - a.s[0] || b.s[4] - a.s[4]);
    done.forEach((r, i) => { const p = done[i - 1]; r.place = p && p.fin === r.fin && p.s[0] === r.s[0] && p.s[4] === r.s[4] ? p.place : i + 1; });
    return { done, wait: tsh.rows.filter((r) => !r.s) };
  }
  function tshHTML() {
    if (!tsh) return `<section class="zk-tsh" id="zk-tsh"><div class="busy-in"><div class="run-spin"></div></div></section>`;
    const { done, wait } = tshRanked(), top = done.filter((r) => r.place <= 3);
    const podium = [2, 1, 3].map((pl) => top.find((r) => r.place === pl)).filter(Boolean);
    return `<section class="zk-tsh" id="zk-tsh">
      <div class="zk-tsh-head">${chip("trophy", "sm")}<span><b>${T("Toshkent shahri: hududiy bosqich natijalari")}</b><small>${T(tsh.dir)} · ${T("{n} ishtirokchi", { n: tsh.rows.length })}</small></span></div>
      <div class="zk-pod">${podium.map((r) => `<div class="zk-pod-c p${r.place}"><span class="zk-medal p${r.place}">${r.place}</span><b class="notr">${esc(r.n.split(" ").slice(0, 2).join(" "))}</b><small>${esc(r.t || "")}</small><em>${r.fin}</em><i>${r.place}</i></div>`).join("")}</div>
      <div class="zk-tsh-list">${done.map((r, k) => `<button class="zk-trow ${tshOpen === k ? "on" : ""}" onclick="zkTsh(${k})">
          <span class="zk-medal p${Math.min(r.place, 4)}">${r.place}</span>
          <span class="notr"><b>${esc(r.n)}</b><small>${esc([r.t, r.b].filter(Boolean).join(" · "))}</small></span>
          <em>${r.fin}<small>/100</small></em></button>
          ${tshOpen === k ? `<div class="zk-crit">${tsh.criteria.map(([name, max], i) => `<div><span>${i + 1}. ${T(name)}</span><b>${r.s[i]}<small>/${max}</small></b><i style="--w:${(r.s[i] / max) * 100}%"></i></div>`).join("")}
            ${r.bonus ? `<p>${T("Instagram bonusi")}: +${r.bonus}</p>` : ""}</div>` : ""}`).join("")}
        ${wait.map((r) => `<div class="zk-trow wait"><span class="zk-medal p4">${ic("clock")}</span><span class="notr"><b>${esc(r.n)}</b><small>${esc(r.t || "")}</small></span><em class="w">${T("Ish topshirmagan")}</em></div>`).join("")}
      </div>
      <p class="zk-tsh-note">${T("Ballar jonli yangilanadi. 6 mezon, jami 100 ball va Instagram bonusi (+3).")} ${T("Oxirgi yangilanish")}: ${esc(tsh.updated)}</p>
      <button class="btn-ghost zk-site" onclick="openExt('${encodeURIComponent(tsh.site)}')">${ic("globe")} ${T("Batafsil: zamonaviykasblar.uz")}</button>
    </section>`;
  }
  window.zkTsh = (k) => { tshOpen = tshOpen === k ? -1 : k; haptic("light"); const el = document.getElementById("zk-tsh"); if (el) el.outerHTML = tshHTML(); };
  const count = (f) => all().filter(f).length;

  /* ---------- the road map: Tuman -> Viloyat -> Respublika -> Changan ---------- */
  // one drawing (viewBox 360 x 220) holds the road; the stops and the car sit on it at the same points
  // a winding road past the three stages up to the car
  const VB = [360, 260], PTS = [[70, 230], [150, 172], [204, 130]], END = [292, 70], LAB = ["up", "right", "left"];
  const SEG = ["M8 252 C 30 246, 50 236, 70 230",
    "M70 230 C 140 216, 230 226, 236 204 C 242 184, 180 186, 150 172",
    "M150 172 C 112 160, 116 140, 156 138 C 188 136, 200 136, 204 130",
    "M204 130 C 218 100, 256 80, 292 72"];
  // one road through all stages (the segments joined), used by the sparks that run to the car
  const FULL = SEG[0] + " " + SEG.slice(1).map((d) => d.replace(/^M[\d.]+ [\d.]+ /, "")).join(" ");
  const laurelSvg = (flip) => `<svg class="zk-laurel ${flip ? "r" : ""}" viewBox="0 0 24 40" aria-hidden="true"><path d="M18 38 C 8 30, 6 18, 12 4" fill="none" stroke="#F5C451" stroke-width="1.6"/>${[8, 14, 20, 26, 32].map((y, k) => `<ellipse cx="${13 - k * .8 - 3}" cy="${y}" rx="2.4" ry="4.6" transform="rotate(-35 ${13 - k * .8 - 3} ${y})" fill="#F5C451"/><ellipse cx="${13 - k * .8 + 3.4}" cy="${y + 2}" rx="2.2" ry="4.2" transform="rotate(35 ${13 - k * .8 + 3.4} ${y + 2})" fill="#E9A92A"/>`).join("")}</svg>`;
  function roadMap() {
    const st = STAGES(), n = st.map((s) => count((w) => w.s === s.k));
    // the furthest stage that already has winners is "now"; the ones before it are done
    let cur = 0; n.forEach((v, i) => { if (v > 0) cur = i; });
    const status = st.map((s, i) => i < cur ? "done" : i === cur ? "now" : "next");
    const pos = (p) => `left:${(p[0] / VB[0]) * 100}%;top:${(p[1] / VB[1]) * 100}%`;
    const [cx, cy] = [END[0], END[1] - 22];
    const sparks = [0, .55, 1.1, 1.65, 2.2, 2.75, 3.3].map((d, k) => `<circle r="${k % 2 ? 1.6 : 2.3}" fill="${k % 3 ? "#FFE7A3" : "#fff"}" filter="url(#zkspark)" opacity="0">
        <animateMotion dur="3.85s" begin="${d}s" repeatCount="indefinite" path="${FULL}" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".45 0 .55 1"/>
        <animate attributeName="opacity" dur="3.85s" begin="${d}s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;.08;.85;1"/></circle>`).join("");
    const orbit = `M${cx - 56} ${cy} a56 24 0 1 0 112 0 a56 24 0 1 0 -112 0`;
    const ring = [0, 1, 2, 3].map((k) => `<circle r="${k % 2 ? 1.5 : 2.2}" fill="#FFE7A3" filter="url(#zkspark)">
        <animateMotion dur="4s" begin="${-k}s" repeatCount="indefinite" path="${orbit}"/>
        <animate attributeName="opacity" dur="4s" begin="${-k}s" repeatCount="indefinite" values=".95;.35;.95"/></circle>`).join("");
    return `<div class="zk-map">
      <svg class="zk-road" viewBox="0 0 360 260" aria-hidden="true">
        <defs>
          <linearGradient id="zkg" x1="0" x2="1"><stop offset="0" stop-color="#FFE7A3"/><stop offset=".6" stop-color="#FFC24A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>
          <radialGradient id="zkglow"><stop offset="0" stop-color="#FFC861" stop-opacity=".85"/><stop offset=".55" stop-color="#FF9F1C" stop-opacity=".25"/><stop offset="1" stop-color="#FF9F1C" stop-opacity="0"/></radialGradient>
          <linearGradient id="zkhalo" x1="0" x2="1"><stop offset="0" stop-color="#FFD27A" stop-opacity="0"/><stop offset=".5" stop-color="#FFD27A"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></linearGradient>
          <linearGradient id="zkwave" x1="0" x2="1"><stop offset="0" stop-color="#8B5CF6" stop-opacity="0"/><stop offset=".6" stop-color="#A78BFA" stop-opacity=".55"/><stop offset="1" stop-color="#C4B5FD" stop-opacity=".9"/></linearGradient>
          <filter id="zkblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
          <filter id="zkspark" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d="M120 262 C 200 236, 280 236, 362 196" fill="none" stroke="url(#zkwave)" stroke-width="1.4"/>
        <path d="M150 262 C 230 242, 300 238, 362 214" fill="none" stroke="url(#zkwave)" stroke-width="7" opacity=".35" filter="url(#zkblur)"/>
        <path d="M190 262 C 260 250, 320 244, 362 230" fill="none" stroke="url(#zkwave)" stroke-width="1" opacity=".7"/>
        <ellipse cx="${cx}" cy="${cy + 8}" rx="86" ry="62" fill="url(#zkglow)"/>
        <path d="M${cx - 62} ${cy + 24} A 64 64 0 0 1 ${cx + 62} ${cy + 24}" fill="none" stroke="url(#zkhalo)" stroke-width="2.2"/>
        <path d="M${cx - 62} ${cy + 24} A 64 64 0 0 1 ${cx + 62} ${cy + 24}" fill="none" stroke="#FFC861" stroke-width="7" opacity=".35" filter="url(#zkblur)"/>
        ${SEG.map((d) => `<path d="${d}" fill="none" stroke="rgba(6,6,30,.6)" stroke-width="13" stroke-linecap="round"/>`).join("")}
        ${SEG.map((d, i) => i <= cur ? `<path d="${d}" fill="none" stroke="#FFB627" stroke-width="10" stroke-linecap="round" filter="url(#zkblur)" opacity=".9"/><path d="${d}" fill="none" stroke="url(#zkg)" stroke-width="4.2" stroke-linecap="round"/>`
          : `<path d="${d}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"/>`).join("")}
        <ellipse cx="${END[0]}" cy="${END[1] + 1}" rx="32" ry="4" fill="rgba(0,0,0,.45)"/>
        <g class="zk-sparks">${sparks}${ring}</g>
      </svg>
      <div class="zk-car" style="${pos(END)}"><img src="img/changan.webp" alt="Changan UNI-E" decoding="async"></div>
      <span class="zk-lab car" style="${pos(END)}">${laurelSvg(0)}<span><b>Changan UNI-E</b><small>${T("Bosh sovrin")}</small></span>${laurelSvg(1)}</span>
      ${st.map((s, i) => `<button class="zk-stop ${status[i]} ${stage === s.k ? "on" : ""}" style="${pos(PTS[i])}" onclick="zkStage('${s.k}')" aria-label="${s.long}">
          <i>${status[i] === "done" ? ic("check") : ic(s.icon)}</i>
          <span class="zk-lab ${LAB[i]}"><b>${i + 1}. ${s.name}</b><small>${n[i] ? T("{n} g'olib", { n: fmtN(n[i]) }) : T("kutilmoqda")}</small></span></button>`).join("")}
    </div>`;
  }


  /* ---------- the list ---------- */
  function listHTML() {
    const q = fold(query);
    const rows = all().map((w, i) => [w, i]).filter(([w]) => w.d === dir && w.s === stage && (!region || w.r === region) && (!q || fold(w.n).includes(q) || fold(w.t).includes(q) || fold(w.r).includes(q)));
    if (!data) return failed ? `<p class="note">${T("Ma'lumotni yuklab bo'lmadi. Internetni tekshirib, qayta oching.")}</p>` : `<div class="busy-in"><div class="run-spin"></div></div>`;
    if (!rows.length) {
      const none = !count((w) => w.s === stage);
      return `<div class="zk-empty">${chip(none ? "clock" : "search", "lg")}<p>${none ? T("Bu bosqich g'oliblari hali e'lon qilinmagan. Natijalar e'lon qilinishi bilan shu yerda paydo bo'ladi.") : T("Hech narsa topilmadi")}</p></div>`;
    }
    rows.sort(([a], [b]) => a.r.localeCompare(b.r) || a.p - b.p || a.t.localeCompare(b.t) || a.n.localeCompare(b.n));
    const groups = {}; rows.forEach((x) => (groups[x[0].r] = groups[x[0].r] || []).push(x));
    const medal = (p) => `<span class="zk-medal p${p}">${p}</span>`;
    return `<p class="zk-found">${T("{n} ta g'olib", { n: fmtN(rows.length) })}</p>` + Object.entries(groups).map(([r, ws]) => `<section class="zk-group">
      <h4><span>${esc(r)}</span><em>${ws.length}</em></h4>
      ${ws.map(([w, i]) => `<button class="zk-row" onclick="zkCongrats(${i})">${medal(w.p)}<span class="notr"><b>${esc(w.n)}</b><small>${esc(w.t || r)}</small></span><i class="zk-share">${ic("share")}</i></button>`).join("")}
    </section>`).join("");
  }
  const refreshList = () => { const el = document.getElementById("zk-list"); if (el) el.innerHTML = listHTML(); };

  function Screen() {
    load(); loadTsh();
    const d = DIRS(), cur = d.find((x) => x.k === dir) || d[0];
    const regions = [...new Set([...REGIONS, ...all().map((w) => w.r)])].sort((a, b) => a.localeCompare(b));
    return `${navbar(T("Tanlov"))}
    <div class="zk-hero">
      <img class="zk-logo" src="img/zk-logo-w.png" alt="Zamonaviy kasblar tanlovi 2026">
      ${roadMap()}
    </div>
    ${tshHTML()}
    <div class="zk-dirs">${d.map((x) => `<button class="zk-dir ${x.k === dir ? "on" : ""}" style="--dc:${x.c}" onclick="zkDir('${x.k}')">
        <i>${ic(x.icon)}</i><b>${x.name}</b><small>${T("{n} g'olib", { n: fmtN(count((w) => w.d === x.k && w.s === stage)) })}</small></button>`).join("")}</div>
    <div class="seg zk-stages">${STAGES().map((s) => `<button class="${s.k === stage ? "on" : ""}" onclick="zkStage('${s.k}')">${s.name} <small>${count((w) => w.s === s.k && w.d === dir)}</small></button>`).join("")}</div>
    <div class="zk-tools">
      <label class="km-search">${ic("search")}<input id="zk-q" placeholder="${T("G'olib ismi yoki tuman")}" value="${esc(query)}" autocomplete="off"></label>
      <select id="zk-region" class="zk-region" onchange="zkRegion(this.value)"><option value="">${T("Barcha hududlar")}</option>${regions.map((r) => `<option value="${esc(r)}" ${r === region ? "selected" : ""}>${esc(r)}</option>`).join("")}</select>
    </div>
    <div class="zk-title" style="--dc:${cur.c}">${chip(cur.icon, "sm")}<span><b>${cur.long}</b><small>${(STAGES().find((s) => s.k === stage) || {}).long}</small></span></div>
    <div id="zk-list">${listHTML()}</div>
    <button class="btn-ghost zk-site" onclick="openExt('${encodeURIComponent(SITE)}')">${ic("globe")} ${T("Tanlov sayti: zamonaviykasblar2026.uz")}</button>`;
  }
  window.zkDir = (k) => { dir = k; store.set("zk_dir", k); haptic("light"); render(); };
  window.zkStage = (k) => { stage = k; store.set("zk_stage", k); haptic("light"); render(); };
  window.zkRegion = (r) => { region = r; store.set("zk_region", r); haptic("light"); refreshList(); };
  // the search keeps focus while typing: only the list below is redrawn
  document.addEventListener("input", (e) => { if (e.target && e.target.id === "zk-q") { query = e.target.value; clearTimeout(refreshList.t); refreshList.t = setTimeout(refreshList, 150); } });

  /* ---------- the congratulation picture (1080 x 1350, red and gold) ---------- */
  const imgCache = {};
  const loadImg = (src) => imgCache[src] || (imgCache[src] = new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; }));
  // letter-spaced text drawn one letter at a time (canvas letterSpacing is missing on older phones)
  function spaced(ctx, text, x, y, gap) {
    const ws = [...text].map((ch) => ctx.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    let cx = x - total / 2; const al = ctx.textAlign; ctx.textAlign = "left";
    [...text].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i] + gap; }); ctx.textAlign = al;
  }
  const fit = (ctx, text, max, size, weight, style = "") => { let s = size; do { ctx.font = `${style} ${weight} ${s}px Inter, sans-serif`; s -= 2; } while (ctx.measureText(text).width > max && s > 24); };
  function round(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function gold(ctx, y0, y1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "#FFF1C1"); g.addColorStop(.45, "#FFD06A"); g.addColorStop(1, "#D98E1C"); return g; }
  // a laurel branch: leaves along an arc, mirrored for the right side
  function laurel(ctx, cx, cy, side) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(side, 1); ctx.fillStyle = gold(ctx, -130, 130); ctx.strokeStyle = "#E9B54A"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(70, 0, 120, Math.PI * .62, Math.PI * 1.32); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (.66 + i * .095), x = 70 + 120 * Math.cos(a), y = 120 * Math.sin(a);
      [-1, 1].forEach((s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2 + s * .55); ctx.beginPath(); ctx.ellipse(0, -16, 8, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    }
    ctx.restore();
  }
  function trophy(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = gold(ctx, -40, 40); ctx.strokeStyle = gold(ctx, -40, 40); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-26, -36); ctx.lineTo(26, -36); ctx.quadraticCurveTo(26, 6, 0, 12); ctx.quadraticCurveTo(-26, 6, -26, -36); ctx.fill();
    ctx.beginPath(); ctx.arc(-26, -22, 12, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(26, -22, 12, -Math.PI * .5, Math.PI * .5); ctx.stroke();
    ctx.fillRect(-5, 10, 10, 16); round(ctx, -20, 26, 40, 10, 3); ctx.fill(); ctx.restore();
  }
  // tuman and viloyat winners: the designed picture (the viloyat copy says VILOYAT BOSQICHI, next: RESPUBLIKA), with the winner's name and district written onto its plate
  const pretty = (s) => String(s || "").replace(/'/g, "‘");
  function pin(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = gold(ctx, -14, 14);
    ctx.beginPath(); ctx.arc(0, -4, 10, Math.PI * .85, Math.PI * 2.15); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0B1A33"; ctx.beginPath(); ctx.arc(0, -4, 4, 0, 7); ctx.fill(); ctx.restore();
  }
  async function posterTuman(w) {
    try { await Promise.all(["500", "800"].map((wt) => document.fonts.load(`italic ${wt} 40px Inter`))); } catch {}
    const bg = await loadImg(w.s === "hududiy" ? "img/zk-poster-viloyat.webp" : "img/zk-poster-tuman.webp"), W = bg.width, H = bg.height;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d");
    ctx.drawImage(bg, 0, 0); ctx.textAlign = "center";
    const cx = 603, name = pretty(w.n);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    fit(ctx, name, 600, 66, 800, "italic");
    const g = ctx.createLinearGradient(0, 520, 0, 572); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#D9DEE8"); ctx.fillStyle = g;
    ctx.fillText(name, cx, 568); ctx.restore();
    const place = pretty([w.t, w.r].filter(Boolean).join(", "));
    fit(ctx, place, 520, 27, 500, "italic"); const tw = ctx.measureText(place).width;
    pin(ctx, cx - tw / 2 - 6, 604, 1.05);
    ctx.fillStyle = "#F4F6FB"; ctx.fillText(place, cx + 12, 614);
    // footer
    ctx.font = "600 22px Inter, sans-serif"; const ft = "Ustoz AI  ·  " + BOT, fw = ctx.measureText(ft).width + 40;
    ctx.fillStyle = "rgba(6,12,30,.55)"; round(ctx, W - fw - 28, H - 70, fw, 44, 22); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillText(ft, W - 28 - fw / 2, H - 40);
    return c;
  }
  async function poster(w) {
    if (w.s === "tuman" || w.s === "hududiy") return posterTuman(w);
    const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d");
    try { await Promise.all(["400", "600", "800"].map((wt) => document.fonts.load(`${wt} 40px Inter`))); } catch {}
    const [logo, car] = await Promise.all([loadImg("img/zk-logo-w.png"), loadImg("img/changan.webp")]);
    const st = STAGES(), si = Math.max(0, st.findIndex((s) => s.k === w.s)), dirx = DIRS().find((x) => x.k === w.d) || DIRS()[0];
    // sky: deep red with a gold sunrise behind the next stage
    let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#22040B"); g.addColorStop(.5, "#6E0D1C"); g.addColorStop(1, "#B0172A"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(800, 930, 10, 800, 930, 560); g.addColorStop(0, "rgba(255,196,92,.85)"); g.addColorStop(.35, "rgba(255,120,60,.35)"); g.addColorStop(1, "rgba(255,90,60,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,236,210,${.15 + rnd() * .5})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * 560, rnd() * 2.2 + .4, 0, 7); ctx.fill(); }
    // mountains
    const ridge = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); };
    ridge([[0, 1000], [140, 930], [260, 980], [420, 900], [560, 960], [700, 880], [820, 930], [960, 870], [1080, 920]], "rgba(70,8,20,.75)");
    ridge([[0, 1120], [180, 1050], [330, 1100], [520, 1010], [700, 1080], [860, 1000], [1080, 1060]], "rgba(40,4,12,.92)");
    // the glowing road up to the next stage
    const road = () => { ctx.beginPath(); ctx.moveTo(150, H + 20); ctx.bezierCurveTo(260, 1180, 620, 1200, 560, 1090); ctx.bezierCurveTo(500, 990, 760, 1010, 820, 950); };
    ctx.lineCap = "round"; road(); ctx.strokeStyle = "rgba(20,2,6,.55)"; ctx.lineWidth = 46; ctx.stroke();
    ctx.save(); ctx.shadowColor = "#FFB347"; ctx.shadowBlur = 30; road(); ctx.strokeStyle = gold(ctx, 950, 1350); ctx.lineWidth = 12; ctx.stroke(); ctx.restore();
    road(); ctx.setLineDash([16, 18]); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
    // the next stage: a glowing stand with a cup, or the car for a national winner
    const last = si >= 2, sy = last ? 1000 : 900;
    if (last) { const cw = 300, ch = cw * car.height / car.width; ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 24; ctx.drawImage(car, 825 - cw / 2, sy - ch + 14, cw, ch); ctx.restore(); }
    ctx.save(); ctx.shadowColor = "rgba(255,170,60,.9)"; ctx.shadowBlur = 40;
    g = ctx.createLinearGradient(0, sy, 0, sy + 80); g.addColorStop(0, "#FF9A3D"); g.addColorStop(1, "#D9480F"); ctx.fillStyle = g; round(ctx, 680, sy, 290, 92, 22); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "rgba(255,230,170,.9)"; ctx.lineWidth = 3; round(ctx, 680, sy, 290, 92, 22); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "600 22px Inter, sans-serif"; spaced(ctx, last ? "BOSH SOVRIN" : "KEYINGI BOSQICH", 825, sy + 36, 3);
    ctx.font = "800 34px Inter, sans-serif"; ctx.fillText(last ? "CHANGAN UNI-E" : st[si + 1].uz, 825, sy + 76);
    if (!last) trophy(ctx, 825, 845, 1.5);
    // header: logo, title, laurels
    const lw = 330; ctx.drawImage(logo, (W - lw) / 2, 58, lw, lw * logo.height / logo.width);
    ctx.fillStyle = "rgba(255,240,220,.9)"; ctx.font = "500 26px Inter, sans-serif"; spaced(ctx, "ZAMONAVIY KASBLAR TANLOVINING", W / 2, 248, 6);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; ctx.fillStyle = gold(ctx, 270, 470);
    fit(ctx, st[si].uz + " BOSQICHI", 700, 84, 800); ctx.fillText(st[si].uz + " BOSQICHI", W / 2, 340);
    ctx.font = "800 128px Inter, sans-serif"; ctx.fillText("G‘OLIBI", W / 2, 466); ctx.restore();
    laurel(ctx, 175, 370, 1); laurel(ctx, W - 175, 370, -1);
    // divider with a small cup
    g = ctx.createLinearGradient(240, 0, 840, 0); g.addColorStop(0, "rgba(255,208,106,0)"); g.addColorStop(.5, "#FFD06A"); g.addColorStop(1, "rgba(255,208,106,0)");
    ctx.fillStyle = g; ctx.fillRect(240, 512, 600, 3); trophy(ctx, W / 2, 516, .55);
    // name plate
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 30; ctx.fillStyle = "rgba(34,4,11,.78)"; round(ctx, 110, 580, 860, 250, 30); ctx.fill(); ctx.restore();
    ctx.strokeStyle = gold(ctx, 580, 830); ctx.lineWidth = 3; round(ctx, 110, 580, 860, 250, 30); ctx.stroke();
    // the place medal on top of the plate
    ctx.save(); ctx.shadowColor = "rgba(255,180,60,.8)"; ctx.shadowBlur = 24; ctx.fillStyle = gold(ctx, 540, 620); ctx.beginPath(); ctx.arc(W / 2, 580, 40, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = "#6E0D1C"; ctx.font = "800 40px Inter, sans-serif"; ctx.fillText(String(w.p || 1), W / 2, 594);
    ctx.fillStyle = "#fff"; fit(ctx, w.n, 780, 66, 800, "italic"); ctx.fillText(w.n, W / 2, 690);
    ctx.fillStyle = "#FFD98A"; const place = [w.t, w.r].filter(Boolean).join(", "); fit(ctx, place, 780, 32, 500); ctx.fillText(place, W / 2, 742);
    ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = "600 27px Inter, sans-serif"; ctx.fillText(`${dirx.uz} yo‘nalishi  ·  ${w.p || 1}-o‘rin`, W / 2, 792);
    // footer: where the picture comes from
    ctx.fillStyle = "rgba(0,0,0,.35)"; round(ctx, W / 2 - 170, H - 82, 340, 50, 25); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.font = "600 24px Inter, sans-serif"; ctx.fillText("Ustoz AI  ·  " + BOT, W / 2, H - 48);
    return c;
  }

  let shown = null;
  window.zkCongrats = async (i) => {
    const w = all()[i]; if (!w) return; haptic("light"); shown = null;
    sheet(`<div class="zk-cg"><div class="zk-cg-img"><div class="run-spin"></div></div>
      <b class="notr">${esc(w.n)}</b><small>${T("Tabrik rasmi tayyorlanmoqda…")}</small></div>`);
    try {
      const c = await poster(w); shown = { c, w };
      const box = document.querySelector(".zk-cg"); if (!box) return;
      box.innerHTML = `<img class="zk-cg-img" src="${c.toDataURL("image/jpeg", .82)}" alt="">
        <button class="btn-primary zk-red" onclick="zkSend('chat')">${ic("share")} ${T("Do'stlarga ulashish")}</button>
        <button class="btn-ghost" onclick="zkSend('dl')">${ic("download")} ${T("Rasmni yuklab olish")}</button>
        ${tg && tg.shareToStory ? `<button class="btn-ghost" onclick="zkSend('story')">${ic("sparkles")} ${T("Storiga joylash")}</button>` : ""}`;
    } catch (e) { closeSheet(); toast(T("Rasm tayyorlanmadi")); }
  };
  window.zkSend = async (mode) => {
    if (!shown) return; const { c, w } = shown;
    const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
    const name = "Tabrik " + w.n.replace(/[^\p{L}\p{N} ]/gu, "").trim();
    if (!tg || !tg.initData) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name + ".png"; a.click(); return; }
    const caption = `${w.n}: Zamonaviy kasblar tanlovi, ${(STAGES().find((s) => s.k === w.s) || {}).uz.toLowerCase()} bosqichi g'olibi. Tabriklaymiz!\n${BOT}`;
    const q = `t=png&as=photo&n=${encodeURIComponent(name)}&c=${encodeURIComponent(caption)}`;
    const busy = document.createElement("div"); busy.className = "busy"; busy.innerHTML = `<div class="run-spin"></div><p>${T("Fayl tayyorlanmoqda…")}</p>`; document.body.appendChild(busy);
    try {
      if (mode === "dl" || mode === "story") {
        const r = await (await fetch(SHARE_API + "/file?m=dl&" + q, { method: "POST", headers: { "X-Init-Data": tg.initData }, body: blob })).json();
        if (!r.url) throw new Error(r.error || "server");
        if (mode === "story") tg.shareToStory(r.url, { text: caption.slice(0, 200) });
        else if (tg.downloadFile) tg.downloadFile({ url: r.url, file_name: r.name });
      } else {
        const r = await (await fetch(SHARE_API + "/file?" + q, { method: "POST", headers: { "X-Init-Data": tg.initData }, body: blob })).json();
        if (!r.ok) throw new Error(r.error || "server");
        try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
        if (r.id && tg.shareMessage) tg.shareMessage(r.id); else toast(T("Rasm bot bilan chatingizga yuborildi"));
      }
      track("#/tanlov");
    } catch (e) { toast(T("Fayl tayyorlanmadi: {e}", { e: e.message || e })); }
    finally { busy.remove(); }
  };
  return { Screen, load, _poster: poster };
})();
window.Contest = Contest;
