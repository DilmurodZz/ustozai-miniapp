// Builds the Word (.docx) file for every document type, language and design with the example data, outside the
// browser, and writes them to the folder given as the first argument. Open them with python-docx to check.
//   node tools/test_cv.js <out folder>
const fs = require("fs"), path = require("path"), vm = require("vm");
const out = process.argv[2] || ".";
const ctx = {
  console, Blob, TextEncoder, atob, Uint8Array, Uint32Array, DataView, ArrayBuffer, Math, JSON, String, Promise, setTimeout, clearTimeout, Object,
  window: {}, document: { addEventListener() {}, documentElement: {}, querySelectorAll: () => [] },
  MutationObserver: class { observe() {} },
  store: { get: (k, d) => d, set() {} }, LANG: "uz", LANGS: { uz: 1, ru: 1, en: 1 }, T: (s) => s, esc: (s) => String(s), tg: null,
};
ctx.window.addEventListener = () => {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/tools.js"), "utf8") + "\nthis.Tools = Tools;", ctx);
const t = ctx.Tools._test;
// a tiny JPEG as the photo
const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
(async () => {
  const jobs = [];
  for (const lang of ["uz", "ru", "en"]) for (const kind of ["cv", "rez", "photo"]) for (const des of ["classic", "elegant", "modern"]) jobs.push([kind, lang, des]);
  for (const lang of ["uz", "uzc", "ru"]) jobs.push(["obj", lang, "classic"]);
  for (const [kind, lang, des] of jobs) {
    const d = JSON.parse(JSON.stringify(kind === "obj" ? t.OSAMPLE[lang] : t.SAMPLE[lang]));
    if (kind === "photo" || kind === "obj") d.photo = photo;
    if (kind !== "obj") Object.assign(d, { exp: d.exp, edu: d.edu });
    t.use(d, kind, lang, des);
    const blob = await t.makeDOCX();
    const f = path.join(out, `${kind}_${lang}_${des}.docx`);
    fs.writeFileSync(f, Buffer.from(await blob.arrayBuffer()));
  }
  console.log(jobs.length, "files written to", out);
})();
