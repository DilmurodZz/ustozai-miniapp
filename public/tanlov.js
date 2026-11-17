// "Tanlov": winners of Zamonaviy kasblar tanlovi 2026, live from the competition site's database
// (zamonaviykasblar2026.uz publishes them from its admin panel; the share server passes on only public fields).
// Three directions (grafik dizayn, mobilografiya, veb-sayt), three stages (tuman, viloyat, respublika),
// a road map of the stages toward the Changan prize, filters by region and a search by name or district.
const Contest = (() => {
  const SITE = "https://zamonaviykasblar2026.uz";
  const DIRS = () => [
    { k: "design", name: T("Grafik dizayn"), long: T("Eng yaxshi grafik dizayn"), icon: "palette", c: "#7C3AED" },
    { k: "mobile", name: T("Mobilografiya"), long: T("Eng yaxshi mobilografiya ishi"), icon: "camera", c: "#F2600C" },
    { k: "web", name: T("Veb-sayt"), long: T("Eng yaxshi veb-sayt"), icon: "code", c: "#2748F5" },
  ];
  const STAGES = () => [
    { k: "tuman", name: T("Tuman"), long: T("Tuman (shahar) bosqichi"), icon: "pin" },
    { k: "hududiy", name: T("Viloyat"), long: T("Viloyat bosqichi"), icon: "map" },
    { k: "respublika", name: T("Respublika"), long: T("Respublika bosqichi"), icon: "trophy" },
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
  const count = (f) => all().filter(f).length;

  /* ---------- the road map: Tuman -> Viloyat -> Respublika -> Changan ---------- */
  function roadMap() {
    const st = STAGES(), n = st.map((s) => count((w) => w.s === s.k));
    // a stage is done when the next one has winners, "now" when it has its own winners or is the first
    const status = st.map((s, i) => n[i + 1] > 0 ? "done" : n[i] > 0 || i === 0 ? "now" : "next");
    const xs = [40, 128, 216];
    return `<div class="zk-map">
      <svg class="zk-road" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M6 74 C 18 74, 22 40, 40 40 S 104 76, 128 76 S 194 40, 216 40 S 268 70, 296 66 L 334 60" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="16" stroke-linecap="round"/>
        <path d="M6 74 C 18 74, 22 40, 40 40 S 104 76, 128 76 S 194 40, 216 40 S 268 70, 296 66 L 334 60" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="7 7" stroke-linecap="round" opacity=".9"/>
      </svg>
      ${st.map((s, i) => `<button class="zk-stop ${status[i]} ${stage === s.k ? "on" : ""}" style="left:${(xs[i] / 360) * 100}%" onclick="zkStage('${s.k}')">
          <i>${status[i] === "done" ? ic("check") : ic(s.icon)}</i><b>${i + 1}. ${s.name}</b><small>${n[i] ? T("{n} g'olib", { n: fmtN(n[i]) }) : T("kutilmoqda")}</small></button>`).join("")}
      <div class="zk-car"><img src="img/changan.webp" alt="Changan UNI-E" decoding="async"><small>Changan UNI-E</small></div>
    </div>
    <p class="zk-prize">${ic("trophy")} ${T("Respublika bosqichida har bir yo'nalish g'olibi Changan UNI-E avtomobilini yutadi.")}</p>`;
  }

  /* ---------- the list ---------- */
  function listHTML() {
    const q = fold(query);
    let rows = all().filter((w) => w.d === dir && w.s === stage && (!region || w.r === region) && (!q || fold(w.n).includes(q) || fold(w.t).includes(q) || fold(w.r).includes(q)));
    if (!data) return failed ? `<p class="note">${T("Ma'lumotni yuklab bo'lmadi. Internetni tekshirib, qayta oching.")}</p>` : `<div class="busy-in"><div class="run-spin"></div></div>`;
    if (!rows.length) {
      const none = !count((w) => w.s === stage);
      return `<div class="zk-empty">${chip(none ? "clock" : "search", "lg")}<p>${none ? T("Bu bosqich g'oliblari hali e'lon qilinmagan. Natijalar e'lon qilinishi bilan shu yerda paydo bo'ladi.") : T("Hech narsa topilmadi")}</p></div>`;
    }
    rows.sort((a, b) => a.r.localeCompare(b.r) || a.p - b.p || a.t.localeCompare(b.t) || a.n.localeCompare(b.n));
    const groups = {}; rows.forEach((w) => (groups[w.r] = groups[w.r] || []).push(w));
    const medal = (p) => `<span class="zk-medal p${p}">${p}</span>`;
    return `<p class="zk-found">${T("{n} ta g'olib", { n: fmtN(rows.length) })}</p>` + Object.entries(groups).map(([r, ws]) => `<section class="zk-group">
      <h4><span>${esc(r)}</span><em>${ws.length}</em></h4>
      ${ws.map((w) => `<div class="zk-row">${medal(w.p)}<span class="notr"><b>${esc(w.n)}</b><small>${esc(w.t || r)}</small></span></div>`).join("")}
    </section>`).join("");
  }
  const refreshList = () => { const el = document.getElementById("zk-list"); if (el) el.innerHTML = listHTML(); };

  function Screen() {
    load();
    const d = DIRS(), cur = d.find((x) => x.k === dir) || d[0];
    const regions = [...new Set([...REGIONS, ...all().map((w) => w.r)])].sort((a, b) => a.localeCompare(b));
    return `${navbar(T("Tanlov"))}
    <div class="zk-hero">
      <img class="zk-logo" src="img/zkt-logo.png" alt="Zamonaviy kasblar tanlovi 2026">
      ${roadMap()}
    </div>
    <div class="zk-dirs">${d.map((x) => `<button class="zk-dir ${x.k === dir ? "on" : ""}" style="--dc:${x.c}" onclick="zkDir('${x.k}')">
        <i>${ic(x.icon)}</i><b>${x.name}</b><small>${T("{n} g'olib", { n: fmtN(count((w) => w.d === x.k && w.s === stage)) })}</small></button>`).join("")}</div>
    <div class="seg zk-stages">${STAGES().map((s) => `<button class="${s.k === stage ? "on" : ""}" onclick="zkStage('${s.k}')">${s.name} <small>${count((w) => w.s === s.k && w.d === dir)}</small></button>`).join("")}</div>
    <div class="zk-tools">
      <label class="km-search">${ic("search")}<input id="zk-q" placeholder="${T("G'olib ismi yoki tuman")}" value="${esc(query)}" autocomplete="off"></label>
      <select id="zk-region" class="zk-region" onchange="zkRegion(this.value)"><option value="">${T("Barcha hududlar")}</option>${regions.map((r) => `<option value="${esc(r)}" ${r === region ? "selected" : ""}>${esc(r)}</option>`).join("")}</select>
    </div>
    <div class="zk-title" style="--dc:${cur.c}">${chip(cur.icon, "sm")}<span><b>${cur.long}</b><small>${(STAGES().find((s) => s.k === stage) || {}).long}</small></span></div>
    <div id="zk-list">${listHTML()}</div>
    <button class="btn-ghost zk-site" onclick="openExt('${encodeURIComponent(SITE)}')">${ic("globe")} ${T("Tanlov sayti: zamonaviykasblar2026.uz")}</button>
    <p class="note">${T("G'oliblar ro'yxati tanlov saytidan avtomatik olinadi: yangi g'oliblar e'lon qilinishi bilan shu yerda ham chiqadi.")}</p>`;
  }
  window.zkDir = (k) => { dir = k; store.set("zk_dir", k); haptic("light"); render(); };
  window.zkStage = (k) => { stage = k; store.set("zk_stage", k); haptic("light"); render(); };
  window.zkRegion = (r) => { region = r; store.set("zk_region", r); haptic("light"); refreshList(); };
  // the search keeps focus while typing: only the list below is redrawn
  document.addEventListener("input", (e) => { if (e.target && e.target.id === "zk-q") { query = e.target.value; clearTimeout(refreshList.t); refreshList.t = setTimeout(refreshList, 150); } });
  return { Screen, load };
})();
