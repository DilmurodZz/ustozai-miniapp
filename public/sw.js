// Offline cache: the app shell, the 3D library and the models work without internet after the first visit.
const CACHE = "ustozai-v45";
const FILES = ["./", "index.html", "styles.css", "data.js", "app.js", "game.js", "courses.js", "data/kurslar.json", "duo.js", "run-world.js", "run-audio.js", "logo.png", "img/loading.webp", "img/hero-compass.webp", "img/ic-courses.webp", "img/ic-game.webp", "img/ic-trophy.webp", "img/ic-zkt.webp", "img/ic-sale.webp", "img/ic-tools.webp", "img/zkt-logo.png", "img/turonbank.png",
  "lib/three.module.min.js", "lib/GLTFLoader.js", "lib/BufferGeometryUtils.js", "lib/meshopt_decoder.module.js", "lib/peerjs.min.js",
  "music/track1.m4a", "music/track2.m4a", "music/track3.m4a", "models/damas.glb", "models/tree1.glb", "models/tree2.glb", "models/mosque.glb", "models/city.glb", "models/wagon.glb"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// models, music and the 3D library change only with a new version: served straight from the cache (fast start).
// Everything else: network first (fresh when online), cache as fallback (offline).
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (/\/(models|music|lib)\//.test(new URL(e.request.url).pathname)) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((m) => m || fetch(e.request)));
    return;
  }
  // the app's own files: always ask the server whether they changed (a quick check), so updates show at once
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match("index.html")))
  );
});
