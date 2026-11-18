// Lists every T("...") / tr("...") interface text in the app that has no Russian or English translation yet.
//   node tools/i18n_missing.js
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "public");
const I18N = { ru: {}, en: {} };
for (const l of ["ru", "en"]) eval(fs.readFileSync(path.join(dir, `i18n-${l}.js`), "utf8"));
const keys = new Set();
for (const f of ["app.js", "tools.js", "profile.js", "courses.js", "game.js", "tanlov.js", "study.js", "kompas.js", "news.js", "deals.js"]) {
  const s = fs.readFileSync(path.join(dir, f), "utf8");
  for (const m of s.matchAll(/\b(?:T|tr)\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(JSON.parse('"' + m[1] + '"'));
}
const miss = [...keys].filter((k) => !(k in I18N.ru) || !(k in I18N.en));
console.log(miss.length + " missing");
for (const k of miss) console.log(k);
