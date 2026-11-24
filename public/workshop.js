// "Application Workshop": the HGSE Tashkent workshop as a book. Read only inside the mini app (no download or share),
// pages turn like paper (swipe, or tap the right or left edge), English or Uzbek text under each slide.
// Slides: img/hgse/NN.webp; text: workshop-data.js (window.WB_PAGES).
window.Workshop = (() => {
  let i = Math.max(0, store.get("wb_page", 0)), lang = store.get("wb_lang", LANG === "uz" ? "uz" : "en"), turning = false;
  const N = () => WB_PAGES.length + 1;   // page 0 is the cover
  const L = (en, uz) => (lang === "uz" ? uz : en);
  // the slide text: "~ " a blurred line (not shown in this app), "# " heading, "- " bullet, "> " example, "* " small note, "! " highlight, anything else a paragraph
  const line = (s) => s.startsWith("# ") ? `<h4>${esc(s.slice(2))}</h4>` : s.startsWith("- ") ? `<li>${esc(s.slice(2))}</li>` : s.startsWith("~ ") ? `<li class="wb-blur" aria-hidden="true">${esc(s.slice(2)).replace(/[^\s%]/g, "x")}</li>` : s.startsWith("> ") ? `<blockquote>${esc(s.slice(2))}</blockquote>`
    : s.startsWith("* ") ? `<p class="wb-note">${esc(s.slice(2))}</p>` : s.startsWith("! ") ? `<p class="wb-hi">${esc(s.slice(2))}</p>` : `<p>${esc(s)}</p>`;
  const body = (b) => b.map(line).join("").replace(/(<li[^>]*>.*?<\/li>)+/g, (m) => `<ul>${m}</ul>`);
  function cover() {
    return `<div class="wb-cover"><img class="wb-shield" src="img/hgse/harvard.webp" alt="Harvard" draggable="false">
      <span class="wb-kicker">The Road to Harvard · ${L("Tashkent", "Toshkent")}</span>
      <h2>Application Workshop</h2>
      <p class="wb-sub">${L("How to apply to the Harvard Graduate School of Education: programs, statement of purpose, recommendations, tests and financial aid.", "Garvard Ta'lim oliy maktabiga qanday topshiriladi: dasturlar, maqsad bayonoti, tavsiyanomalar, testlar va moliyaviy yordam.")}</p>
      <div class="wb-author"><img src="img/hgse/rivkin.webp" alt="" draggable="false"><span><b>Stanislav Rivkin</b><small>Senior Associate Director of Admissions</small><small>Harvard Graduate School of Education (HGSE)</small></span></div>
      <p class="wb-date">${L("September 30, 2026 · 40 pages", "2026 yil 30 sentabr · 40 sahifa")}</p>
      <p class="wb-start">${L("Swipe or tap the right edge to turn the page", "Sahifani varaqlash uchun suring yoki o'ng chetiga bosing")} ${ic("chev")}</p></div>`;
  }
  function pageHTML(n) {
    if (n <= 0) return `<div class="wb-page cover" data-n="0"><div class="wb-in">${cover()}</div></div>`;
    const p = WB_PAGES[n - 1], t = p[lang] || p.en;
    return `<div class="wb-page" data-n="${n}"><div class="wb-in">
      <img class="wb-slide" src="img/hgse/${String(n).padStart(2, "0")}.webp" alt="" draggable="false" ${Math.abs(n - i) > 1 ? 'loading="lazy"' : ""} onclick="wbZoom(${n})">
      <h3>${esc(t.h)}</h3><div class="wb-txt">${body(t.b)}</div>
      <span class="wb-folio">${n} / ${N() - 1}</span></div></div>`;
  }
  function Screen() {
    if (!window.WB_PAGES) { loadScripts(["workshop-data.js"]).then(() => { if (location.hash === "#/workshop") render(); }); return `${navbar("Admission tips from Harvard")}${spinner()}`; }
    i = Math.min(i, N() - 1);
    return `${navbar("Admission tips from Harvard")}
    <div class="wb" oncontextmenu="return false">
      <div class="seg wb-lang"><button class="${lang === "uz" ? "on" : ""}" onclick="wbLang('uz')">O'zbekcha</button><button class="${lang === "en" ? "on" : ""}" onclick="wbLang('en')">English</button></div>
      <div class="wb-book" id="wb-book">${pageHTML(i)}</div>
      <div class="wb-nav"><button onclick="wbGo(-1)" aria-label="${T("Orqaga")}" ${i === 0 ? "disabled" : ""}>${ic("back")}</button>
        <span id="wb-pos">${i === 0 ? L("Cover", "Muqova") : `${i} / ${N() - 1}`}</span>
        <button onclick="wbGo(1)" aria-label="${T("Keyingi")}" ${i >= N() - 1 ? "disabled" : ""}>${ic("chev")}</button></div>
      <i class="wb-bar"><s style="width:${(i / (N() - 1)) * 100}%"></s></i>
    </div>`;
  }
  // the page turn: the top page swings round its left edge like paper, showing the next one under it (or comes back for "back")
  function go(d) {
    const to = i + d; if (turning || to < 0 || to >= N()) return;
    const book = document.getElementById("wb-book"); if (!book) return;
    turning = true; haptic("light");
    const cur = book.firstElementChild;
    book.style.height = cur.offsetHeight + "px"; book.classList.add("turning");   // both pages share the current page's size while it turns
    if (d > 0) {
      book.insertAdjacentHTML("afterbegin", pageHTML(to));          // the next page waits underneath
      cur.classList.add("turn-out");
    } else {
      book.insertAdjacentHTML("beforeend", pageHTML(to));            // the previous page comes back over the top
      book.lastElementChild.classList.add("turn-in");
    }
    setTimeout(() => {
      i = to; store.set("wb_page", i); turning = false;
      const y = scrollY; render(); scrollTo(0, y);
      [i + 1, i + 2].forEach((n) => { if (n > 0 && n < N()) new Image().src = `img/hgse/${String(n).padStart(2, "0")}.webp`; });
    }, 620);
  }
  window.wbGo = go;
  window.wbLang = (l) => { lang = l; store.set("wb_lang", l); haptic("light"); render(); };
  // a slide full screen, turned sideways so it fills the phone
  window.wbZoom = (n) => {
    const el = document.createElement("div"); el.className = "wb-zoom"; el.setAttribute("oncontextmenu", "return false");
    el.innerHTML = `<img src="img/hgse/${String(n).padStart(2, "0")}.webp" alt="" draggable="false"><button aria-label="${T("Yopish")}">${ic("x")}</button>`;
    el.onclick = () => el.remove(); document.body.appendChild(el);
  };
  function mount() {
    const book = document.getElementById("wb-book"); if (!book) return;
    let x0 = null, y0 = 0, t0 = 0;
    book.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); }, { passive: true });
    book.addEventListener("pointerup", (e) => {
      if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) return go(dx < 0 ? 1 : -1);
      // a quick tap on the outer edges turns the page too (not on the slide picture, which opens full screen)
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && Date.now() - t0 < 350 && !e.target.closest(".wb-slide")) {
        const r = book.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width;
        if (fx > 0.78) go(1); else if (fx < 0.22) go(-1);
      }
    });
    i > 0 && [i + 1].forEach((n) => { if (n < N()) new Image().src = `img/hgse/${String(n).padStart(2, "0")}.webp`; });
  }
  return { Screen, mount };
})();
