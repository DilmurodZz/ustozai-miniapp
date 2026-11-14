// Offline cache: the app shell and the game work without internet after the first visit.
const CACHE = "ustozai-v4", LIB_CACHE = "ustozai-lib";
const FILES = ["./", "index.html", "styles.css", "data.js", "app.js", "game.js", "logo.png"];
const LIB = /three(\.js\/|@)0\.160\.0/;     // the game's 3D library on a CDN
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== LIB_CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (LIB.test(e.request.url)) {          // never changes: cache first
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(LIB_CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); }
      return r;
    })));
    return;
  }
  // network first (fresh when online), cache as fallback (offline)
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match("index.html")))
  );
});
