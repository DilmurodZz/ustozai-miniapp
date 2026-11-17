// Builds the Word (.docx) CV for every type and language with the example data, outside the browser,
// and writes the files to the folder given as the first argument. Check them with tools/test_cv.py.
//   node tools/test_cv.js <out folder>
const fs = require("fs"), path = require("path"), vm = require("vm");
const out = process.argv[2] || ".";
const ctx = {
  console, Blob, TextEncoder, atob, Uint8Array, Uint32Array, DataView, ArrayBuffer, Math, JSON, String, Promise, setTimeout, clearTimeout,
  window: {}, document: { addEventListener() {}, documentElement: {}, querySelectorAll: () => [] },
  MutationObserver: class { observe() {} },
  store: { get: (k, d) => d, set() {} }, LANG: "uz", LANGS: { uz: 1, ru: 1, en: 1 }, T: (s) => s, esc: (s) => String(s), tg: null,
};
ctx.window.addEventListener = () => {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/tools.js"), "utf8") + "\nthis.Tools = Tools;", ctx);
const t = ctx.Tools._test;
// a tiny red JPEG as the photo
const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
(async () => {
  for (const lang of ["uz", "ru", "en"]) for (const kind of ["cv", "rez", "photo"]) {
    const d = JSON.parse(JSON.stringify(t.SAMPLE[lang]));
    if (kind === "photo") d.photo = photo;
    t.use(d, kind, lang);
    const blob = await t.makeDOCX();
    const f = path.join(out, `cv_${kind}_${lang}.docx`);
    fs.writeFileSync(f, Buffer.from(await blob.arrayBuffer()));
    console.log(f, blob.size);
  }
})();
