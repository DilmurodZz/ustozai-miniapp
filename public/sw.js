// Offline cache. Install keeps only what Home and the main screens need, so the first visit is light;
// the 3D game, its models, music and the PDF libraries are cached the first time they are used.
const CACHE = "ustozai-v63";
const FILES = ["./", "index.html", "styles.css", "features.css", "i18n.js", "data.js", "duo.js", "courses.js", "app.js", "profile.js", "news.js",
  "logo.png", "img/hero-compass.webp", "img/ic-courses.webp", "img/ic-game.webp", "img/ic-trophy.webp", "img/ic-zkt.webp", "img/ic-sale.webp", "img/ic-tools.webp",
  "img/zkt-logo.png", "img/turonbank.png", "img/poyezdbilet24.webp", "img/changan.webp", "img/zk-logo-w.png", "img/tool-cv.webp", "img/tool-dtm.webp", "img/tool-ielts.webp", "img/tool-uni.webp", "img/tool-train.webp"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
const keep = (req, r) => { if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); } return r; };
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  // models, music and libraries change only with a new version: from the cache, else downloaded once and kept
  if (/\/(models|music|lib)\//.test(new URL(e.request.url).pathname)) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((m) => m || fetch(e.request).then((r) => keep(e.request, r))));
    return;
  }
  // the app's own files: always ask the server whether they changed (a quick check), so updates show at once
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }).then((r) => keep(e.request, r))
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match("index.html")))
  );
});
