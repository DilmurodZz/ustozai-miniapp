// Interface language: Uzbek (the source text), Russian, English.
// T("Uzbek text", { n: 5 }) returns the text in the chosen language; {n} placeholders are filled in.
// Missing translations fall back to Uzbek, so nothing ever shows empty.
const LANGS = { uz: "O'zbekcha", ru: "Русский", en: "English" };
const LANG = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("uz_lang"));
    if (LANGS[saved]) return saved;
    const tgl = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user && Telegram.WebApp.initDataUnsafe.user.language_code;
    return tgl === "ru" ? "ru" : "uz";
  } catch { return "uz"; }
})();
document.documentElement.lang = LANG;
const I18N = { ru: {}, en: {} };   // filled by i18n-ru.js and i18n-en.js
// only the chosen language's file is downloaded (written in place, so it runs before the screens are built)
if (LANG !== "uz") document.write(`<script src="i18n-${LANG}.js?v=${(document.currentScript && document.currentScript.src.split("?v=")[1]) || ""}"><\/script>`);
function T(s, vars) {
  let out = (LANG !== "uz" && I18N[LANG][s]) || s;
  if (vars) for (const k in vars) out = out.split("{" + k + "}").join(vars[k]);
  return out;
}
// Short fixed texts that the screens write directly (buttons, titles, game menus) are translated where they appear:
// every text node and placeholder / aria-label whose whole text is a known Uzbek key gets the translation.
// Keys with {n} match any number or word there. Course titles, descriptions, job titles and the user's CV are skipped
// (elements inside .notr or .cvdoc), so data from ustoz.ai and hh.uz is never changed by accident.
const I18N_MISS = new Set();   // Uzbek texts seen without a translation (localStorage uz_i18n_debug = true)
(function domTranslate() {
  if (LANG === "uz") return;
  const debug = (() => { try { return JSON.parse(localStorage.getItem("uz_i18n_debug")); } catch { return false; } })();
  let dict = null, pats = null;
  const prep = () => {
    dict = I18N[LANG]; pats = [];
    for (const k in dict) if (k.includes("{")) {
      const names = [], rx = k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\w+)\}/g, (m, n) => { names.push(n); return "(.+?)"; });
      pats.push([new RegExp("^" + rx + "$"), names, dict[k]]);
    }
    // the most specific pattern first: "Rekordingiz: {n} ball" before "{n} ball"
    pats.sort((x, y) => y[0].source.replace(/\(\.\+\?\)/g, "").length - x[0].source.replace(/\(\.\+\?\)/g, "").length);
  };
  const tr = (s) => {
    const t = s.trim(); if (!t || !/[A-Za-z]/.test(t)) return null;
    let out = dict[t];
    if (!out) for (const [rx, names, val] of pats) { const m = t.match(rx); if (m) { out = val; names.forEach((n, i) => { out = out.split("{" + n + "}").join(m[i + 1]); }); break; } }
    if (!out) { if (debug && /[a-z]{3}/.test(t) && !/^[\d\s.,:%+-]+$/.test(t)) I18N_MISS.add(t); return null; }
    return s.replace(t, out);
  };
  const skip = (el) => el && el.closest && el.closest(".notr, .cvdoc, script, style, textarea");
  const node = (n) => {
    if (n.nodeType === 3) { if (!skip(n.parentElement)) { const v = tr(n.nodeValue); if (v != null && v !== n.nodeValue) n.nodeValue = v; } return; }
    if (n.nodeType !== 1 || skip(n)) return;
    for (const a of ["placeholder", "aria-label", "title"]) if (n.hasAttribute(a)) { const v = tr(n.getAttribute(a)); if (v != null) n.setAttribute(a, v); }
    for (const c of n.childNodes) node(c);
  };
  const start = () => {
    prep(); node(document.body);
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") node(m.target); else m.addedNodes.forEach(node); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  // after every script has loaded (the dictionaries come in i18n-ru.js / i18n-en.js), before the first screen is drawn
  document.addEventListener("DOMContentLoaded", start);
})();

function setLang(l) {
  if (!LANGS[l] || l === LANG) return;
  try { localStorage.setItem("uz_lang", JSON.stringify(l)); } catch {}
  location.reload();
}
