// Offline cache, tuned for a fast start:
// - versioned app files (?v=NN) never change, so they come straight from the phone (no network wait);
// - the start page is asked from the network but opens from the cache if the network is slower than 1.5 s;
// - pictures and course data open from the cache at once and refresh quietly in the background;
// - Telegram's script and the font are kept too; models, music and libraries are kept once downloaded.
const CACHE = "ustozai-v66";
const V = CACHE.split("-v")[1];
const SHELL = ["styles.css", "features.css", "i18n.js", "data.js", "duo.js", "courses.js", "app.js", "profile.js", "news.js"].map((f) => f + "?v=" + V);
const FILES = ["./", "index.html", ...SHELL,
  "logo.png", "img/hero-compass.webp", "img/ic-courses.webp", "img/ic-game.webp", "img/ic-trophy.webp", "img/ic-zkt.webp", "img/ic-sale.webp", "img/ic-tools.webp",
  "img/zkt-logo.png", "img/turonbank.png", "img/changan.webp", "img/zk-logo-w.png", "img/tool-cv.webp", "img/tool-dtm.webp", "img/tool-ielts.webp", "img/tool-uni.webp", "img/tool-train.webp", "img/cv-logo.webp"];
const OUTSIDE = /^https:\/\/(telegram\.org\/js\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const keep = (req, r) => { if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); } return r; };
// from the cache first; the network only when it is not there yet
const cacheFirst = (req, loose) => caches.match(req, { ignoreSearch: !!loose }).then((m) => m || fetch(req).then((r) => keep(req, r)));
// from the cache at once, and a fresh copy is fetched for next time
const staleWhileRevalidate = (req, e) => caches.match(req, { ignoreSearch: true }).then((m) => {
  const net = fetch(req).then((r) => keep(req, r)).catch(() => m || Response.error());
  if (m) { e.waitUntil(net.catch(() => {})); return m; }
  return net;
});
// the start page: the network if it answers within 1.5 s, else the saved copy (and the network one is kept for next time)
const networkFast = (req, e) => new Promise((resolve) => {
  let done = false;
  const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
  const saved = () => caches.match(req, { ignoreSearch: true }).then((m) => m || caches.match("index.html"));
  const net = fetch(req, { cache: "no-cache" }).then((r) => keep(req, r));
  e.waitUntil(net.catch(() => {}));
  const t = setTimeout(() => saved().then(finish), 1500);
  net.then((r) => { clearTimeout(t); finish(r); }).catch(() => saved().then((m) => finish(m || Response.error())));
});

self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (OUTSIDE.test(req.url)) e.respondWith(url.hostname === "fonts.gstatic.com" ? cacheFirst(req) : staleWhileRevalidate(req, e));
    return;
  }
  const path = url.pathname;
  if (/\/(models|music|lib)\//.test(path)) return e.respondWith(cacheFirst(req, true));
  if (url.searchParams.has("v")) return e.respondWith(cacheFirst(req));
  if (req.mode === "navigate" || path.endsWith("/") || path.endsWith(".html")) return e.respondWith(networkFast(req, e));
  if (/\/img\/|\.json$|\.webp$|\.png$|\.jpg$/.test(path)) return e.respondWith(staleWhileRevalidate(req, e));
  e.respondWith(staleWhileRevalidate(req, e));
});
