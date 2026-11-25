// Share server for Chorsu game's "best moment" picture (Cloudflare Worker).
// The Mini App posts the PNG together with Telegram's signed initData. The worker checks the signature with the bot
// token, sends the PNG file to the player's own chat with the bot, and prepares it as a message the player can send
// to any chat from Telegram's own share window (Bot API: savePreparedInlineMessage + WebApp.shareMessage).
// The bot token is a secret of the worker (BOT_TOKEN); it never reaches the Mini App.

const ALLOWED_ORIGIN = "https://dilmurodzz.github.io";
const MAX_BYTES = 9 * 1024 * 1024;

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN || /^http:\/\/localhost(:\d+)?$/.test(origin || "") ? origin : ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Init-Data",
  "Access-Control-Max-Age": "86400",
});
const json = (body, status, origin) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });

const enc = new TextEncoder();
async function hmac(key, data) {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

// Telegram Mini App initData check: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export async function verifyInitData(initData, botToken, maxAgeSec = 86400) {
  if (!initData) return null;
  const p = new URLSearchParams(initData), hash = p.get("hash");
  if (!hash) return null;
  p.delete("hash");
  const check = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = await hmac("WebAppData", botToken);
  if (hex(await hmac(secret, check)) !== hash) return null;
  const age = Date.now() / 1000 - Number(p.get("auth_date") || 0);
  if (!(age >= 0 && age < maxAgeSec)) return null;
  try { return JSON.parse(p.get("user")); } catch { return null; }
}

async function tg(token, method, body) {
  const headers = typeof body === "string" ? { "Content-Type": "application/json" } : undefined;
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", body, headers });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(`${method}: ${j.description || r.status}`);
  return j.result;
}

export default {
  // every 5 minutes one language's list is rebuilt, so new stories get translated before anyone opens the app
  async scheduled(event, env) {
    const l = ["uz", "ru", "en"][Math.floor(Date.now() / 300000) % 3];
    try {
      const res = await news(new URL("https://local/news?fresh=1&l=" + l), env, "*");
      const list = ((await res.json()).items || []).filter((x) => x.o !== l).slice(0, 12);
      let n = 0;
      for (const x of list) {
        if (n >= 2) break;
        const key = "art:v4:" + l + ":" + (await sha(x.u));
        if (await env.COLORS.get(key)) continue;
        n++; await newsRead(new URL("https://local/news/read?" + new URLSearchParams({ u: x.u, l, o: x.o })), env, "*");
      }
    } catch {}
  },
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(req.url);
    // colour choice counts: each Telegram user is counted once, with their latest colour
    if (url.pathname === "/colors" && req.method === "GET") {
      const c = (await env.COLORS.get("counts", "json")) || {};
      return json({ blue: c.blue || 0, orange: c.orange || 0, green: c.green || 0, bordo: c.bordo || 0 }, 200, origin);
    }
    if (url.pathname === "/color" && req.method === "POST") {
      const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN, 30 * 86400);
      if (!user || !user.id) return json({ error: "unauthorised" }, 401, origin);
      const pick = url.searchParams.get("c");
      if (!["blue", "orange", "green", "bordo"].includes(pick)) return json({ error: "bad colour" }, 400, origin);
      const key = "u:" + user.id, old = await env.COLORS.get(key);
      const c = (await env.COLORS.get("counts", "json")) || {};
      if (old !== pick) {
        if (old && c[old] > 0) c[old]--;
        c[pick] = (c[pick] || 0) + 1;
        await env.COLORS.put(key, pick);
        await env.COLORS.put("counts", JSON.stringify(c));
      }
      return json({ blue: c.blue || 0, orange: c.orange || 0, green: c.green || 0, bordo: c.bordo || 0 }, 200, origin);
    }
    if (url.pathname === "/track" && req.method === "POST") return track(req, env, url, origin);
    if (url.pathname === "/stats" && req.method === "GET") return json(await stats(env), 200, origin);
    if (url.pathname === "/winners" && req.method === "GET") return winners(origin);
    if (url.pathname.startsWith("/tg/") && req.method === "POST") return botHook(req, env, url);
    if (url.pathname === "/news" && req.method === "GET") return news(url, env, origin);
    if (url.pathname === "/news/read" && req.method === "GET") return newsRead(url, env, origin);
    if (url.pathname === "/file" && req.method === "POST") return sendFile(req, env, url, origin);
    if (url.pathname.startsWith("/dl/") && req.method === "GET") {
      const [, , id, name] = url.pathname.split("/");
      const f = await env.COLORS.getWithMetadata("dl:" + id, "arrayBuffer");
      if (!f.value) return new Response("expired", { status: 404 });
      return new Response(f.value, { headers: { "Content-Type": f.metadata.type, "Content-Disposition": `attachment; filename*=UTF-8''${name}`, ...cors(origin) } });
    }
    if (url.pathname.startsWith("/p/") && req.method === "GET") {
      const f = await env.COLORS.getWithMetadata("pimg:" + url.pathname.slice(3).split(".")[0], "arrayBuffer");
      if (!f.value) return new Response("not found", { status: 404 });
      return new Response(f.value, { headers: { "Content-Type": (f.metadata && f.metadata.type) || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
    }
    if (url.pathname.startsWith("/admin/")) return admin(req, env, url, origin);
    if (req.method !== "POST" || url.pathname !== "/share") return json({ error: "not found" }, 404, origin);

    const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN);
    if (!user || !user.id) return json({ error: "unauthorised" }, 401, origin);

    const png = await req.arrayBuffer();
    const head = new Uint8Array(png.slice(0, 8));
    if (png.byteLength > MAX_BYTES || head[0] !== 0x89 || head[1] !== 0x50 || head[2] !== 0x4e || head[3] !== 0x47) return json({ error: "bad image" }, 400, origin);

    const caption = (url.searchParams.get("c") || "Chorsu game").slice(0, 200);
    try {
      // 1) the PNG file itself, into the player's chat with the bot
      const form = new FormData();
      form.append("chat_id", String(user.id));
      form.append("caption", caption);
      form.append("disable_content_type_detection", "true");
      form.append("document", new Blob([png], { type: "image/png" }), "chorsu-game.png");
      const msg = await tg(env.BOT_TOKEN, "sendDocument", form);
      const fileId = msg.document && msg.document.file_id;
      // 2) the same file, ready for Telegram's own "send to a chat" window
      const prep = new FormData();
      prep.append("user_id", String(user.id));
      prep.append("result", JSON.stringify({ type: "document", id: "m" + Date.now(), title: "Chorsu game", document_file_id: fileId, caption }));
      prep.append("allow_user_chats", "true"); prep.append("allow_group_chats", "true"); prep.append("allow_channel_chats", "true");
      const pm = await tg(env.BOT_TOKEN, "savePreparedInlineMessage", prep);
      return json({ id: pm.id }, 200, origin);
    } catch (e) {
      return json({ error: String(e.message || e) }, 502, origin);
    }
  },
};

/* ---------- usage statistics ---------- */
const SECTIONS = ["home", "kompas", "natija", "kurslar", "kurs", "tanlov", "profil", "oyin", "duo", "vositalar", "cv", "chegirma", "admin", "harvard", "ariza", "aisafety"];
const tashkentDay = (offsetDays = 0) => new Date(Date.now() + 5 * 3600e3 - offsetDays * 86400e3).toISOString().slice(0, 10);

// the Mini App reports each section a user opens, at most once a day per section
async function track(req, env, url, origin) {
  const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN, 7 * 86400);
  if (!user || !user.id) return json({ error: "unauthorised" }, 401, origin);
  const section = SECTIONS.includes(url.searchParams.get("s")) ? url.searchParams.get("s") : "home";
  const day = tashkentDay(), now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id, first_name, username, lang, can_write, first_seen, last_seen) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
      ON CONFLICT(id) DO UPDATE SET first_name = ?2, username = ?3, lang = ?4, can_write = MAX(can_write, ?5), blocked = 0, last_seen = ?6`)
      .bind(user.id, (user.first_name || "").slice(0, 64), (user.username || "").slice(0, 64), (user.language_code || "").slice(0, 8), user.allows_write_to_pm ? 1 : 0, now),
    env.DB.prepare("INSERT OR IGNORE INTO visits (day, user_id, section) VALUES (?1, ?2, ?3)").bind(day, user.id, section),
  ]);
  return json({ ok: true }, 200, origin);
}

// numbers everyone can see: total users, daily / weekly / monthly active users, most used sections
async function stats(env) {
  const d0 = tashkentDay(), d1 = tashkentDay(1), d6 = tashkentDay(6), d29 = tashkentDay(29);
  const one = (sql, ...b) => env.DB.prepare(sql).bind(...b).first("n");
  const [total, dau, dauY, wau, mau, newToday, top, days] = await Promise.all([
    one("SELECT COUNT(*) n FROM users"),
    one("SELECT COUNT(DISTINCT user_id) n FROM visits WHERE day = ?1", d0),
    one("SELECT COUNT(DISTINCT user_id) n FROM visits WHERE day = ?1", d1),
    one("SELECT COUNT(DISTINCT user_id) n FROM visits WHERE day >= ?1", d6),
    one("SELECT COUNT(DISTINCT user_id) n FROM visits WHERE day >= ?1", d29),
    one("SELECT COUNT(*) n FROM users WHERE first_seen >= ?1", new Date(Date.parse(d0 + "T00:00:00+05:00")).toISOString()),
    // each person counts once per section over the 7 days, however many days they opened it
    env.DB.prepare("SELECT section s, COUNT(DISTINCT user_id) n FROM visits WHERE day >= ?1 AND section NOT IN ('home', 'admin') GROUP BY section ORDER BY n DESC LIMIT 6").bind(d6).all(),
    env.DB.prepare("SELECT day d, COUNT(DISTINCT user_id) n FROM visits WHERE day >= ?1 GROUP BY day ORDER BY day").bind(d6).all(),
  ]);
  return { total, dau, dauYesterday: dauY, wau, mau, newToday, top: top.results, days: days.results, day: d0 };
}

/* ---------- a CV / resume file into the user's chat with the bot ---------- */
const FILE_TYPES = { pdf: ["application/pdf", [0x25, 0x50, 0x44, 0x46]], png: ["image/png", [0x89, 0x50, 0x4e, 0x47]], docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [0x50, 0x4b, 0x03, 0x04]] };
async function sendFile(req, env, url, origin) {
  const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN);
  if (!user || !user.id) return json({ error: "unauthorised" }, 401, origin);
  const ext = url.searchParams.get("t"), type = FILE_TYPES[ext];
  const body = await req.arrayBuffer(), head = new Uint8Array(body.slice(0, 4));
  if (!type || body.byteLength > MAX_BYTES || !type[1].every((b, i) => head[i] === b)) return json({ error: "bad file" }, 400, origin);
  const name = ((url.searchParams.get("n") || "cv").replace(/[^\p{L}\p{N}_ -]/gu, "").trim().slice(0, 60) || "cv") + "." + ext;
  // "download": keep the file for 10 minutes behind a random link, for Telegram's own download window (WebApp.downloadFile)
  if (url.searchParams.get("m") === "dl") {
    const id = crypto.randomUUID().replace(/-/g, "");
    await env.COLORS.put("dl:" + id, body, { expirationTtl: 600, metadata: { type: type[0] } });
    return json({ url: `${url.origin}/dl/${id}/${encodeURIComponent(name)}`, name }, 200, origin);
  }
  try {
    const form = new FormData();
    form.append("chat_id", String(user.id));
    form.append("caption", (url.searchParams.get("c") || "").slice(0, 300));
    // a picture (the contest congratulation) goes as a photo, so it shows as an image in the chat
    const photo = ext === "png" && url.searchParams.get("as") === "photo";
    if (photo) form.append("photo", new Blob([body], { type: type[0] }), name);
    else { form.append("disable_content_type_detection", "true"); form.append("document", new Blob([body], { type: type[0] }), name); }
    const msg = await tg(env.BOT_TOKEN, photo ? "sendPhoto" : "sendDocument", form);
    // the same file, ready for Telegram's own "send to a chat" window
    const prep = new FormData();
    prep.append("user_id", String(user.id));
    const cap = (url.searchParams.get("c") || "").slice(0, 300);
    prep.append("result", JSON.stringify(photo
      ? { type: "photo", id: "p" + Date.now(), photo_file_id: msg.photo[msg.photo.length - 1].file_id, caption: cap }
      : { type: "document", id: "f" + Date.now(), title: name, document_file_id: msg.document.file_id }));
    prep.append("allow_user_chats", "true"); prep.append("allow_group_chats", "true"); prep.append("allow_channel_chats", "true");
    const pm = await tg(env.BOT_TOKEN, "savePreparedInlineMessage", prep).catch(() => null);
    return json({ ok: true, id: pm && pm.id }, 200, origin);
  } catch (e) {
    return json({ error: String(e.message || e) }, 502, origin);
  }
}

/* ---------- admin: only the Telegram ids in ADMIN_IDS ---------- */
// with an image link, the picture shows large above the text (a link preview, so the text can be up to 4000 characters, unlike a photo caption)
const sendText = (env, chat, text, btn, image) => tg(env.BOT_TOKEN, "sendMessage", JSON.stringify({ chat_id: chat, text,
  link_preview_options: image ? { url: image, prefer_large_media: true, show_above_text: true } : { is_disabled: false },
  ...(btn ? { reply_markup: { inline_keyboard: [[btn]] } } : {}) }));
async function admin(req, env, url, origin) {
  const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN);
  const admins = String(env.ADMIN_IDS || "").split(",").map((s) => Number(s.trim()));
  if (!user || !admins.includes(Number(user.id))) return json({ error: "forbidden" }, 403, origin);
  const route = url.pathname.slice(7);
  if (route === "info" && req.method === "GET") {
    const n = (sql) => env.DB.prepare(sql).first("n");
    return json({ users: await n("SELECT COUNT(*) n FROM users"), reachable: await n("SELECT COUNT(*) n FROM users WHERE blocked = 0"),
      blocked: await n("SELECT COUNT(*) n FROM users WHERE blocked = 1"), channel: env.CHANNEL }, 200, origin);
  }
  // a post picture from the admin: kept in KV and served at /p/<id>.jpg, so Telegram can show it above the post text
  if (route === "upload" && req.method === "POST") {
    const type = (req.headers.get("Content-Type") || "").split(";")[0];
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: "image only" }, 400, origin);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > 8e6) return json({ error: "too large" }, 400, origin);
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16), ext = type === "image/jpeg" ? "jpg" : type.slice(6);
    await env.COLORS.put("pimg:" + id, buf, { metadata: { type } });
    return json({ url: `${url.origin}/p/${id}.${ext}` }, 200, origin);
  }
  if (req.method !== "POST") return json({ error: "not found" }, 404, origin);
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").trim().slice(0, 4000);
  if (!text) return json({ error: "empty text" }, 400, origin);
  let btn = null;
  if (b.btnText && /^https:\/\//.test(b.btnUrl || "")) btn = { text: String(b.btnText).slice(0, 60), url: String(b.btnUrl) };
  const image = /^https:\/\/\S+$/.test(b.image || "") ? String(b.image).slice(0, 500) : "";
  // a copy to the admin themself, to check how it looks
  if (route === "test") {
    try { await sendText(env, user.id, text, btn, image); return json({ ok: true }, 200, origin); } catch (e) { return json({ error: String(e.message || e) }, 502, origin); }
  }
  if (route === "channel") {
    try { await sendText(env, env.CHANNEL, text, btn, image); return json({ ok: true }, 200, origin); } catch (e) { return json({ error: String(e.message || e) }, 502, origin); }
  }
  // message to every user, 25 per request (the Mini App calls again with the next offset)
  if (route === "broadcast") {
    const after = Number(b.after) || 0, BATCH = 25;
    const rows = (await env.DB.prepare("SELECT id FROM users WHERE blocked = 0 AND id > ?1 ORDER BY id LIMIT ?2").bind(after, BATCH).all()).results;
    let sent = 0, failed = 0;
    for (const r of rows) {
      try { await sendText(env, r.id, text, btn, image); sent++; }
      catch (e) { failed++; if (/blocked|deactivated|chat not found|can't initiate/i.test(String(e.message))) await env.DB.prepare("UPDATE users SET blocked = 1 WHERE id = ?1").bind(r.id).run(); }
    }
    return json({ sent, failed, next: rows.length === BATCH ? rows[rows.length - 1].id : null }, 200, origin);
  }
  return json({ error: "not found" }, 404, origin);
}

/* ---------- Zamonaviy kasblar tanlovi winners ----------
   Read from the competition site's own database (zamonaviykasblar2026.uz publishes them there from its admin panel),
   so new winners appear in the Mini App by themselves. Only public fields are passed on: name, region, district,
   direction, stage and place. Kept for 5 minutes, so the database is read at most a few times an hour. */
const FS = "https://firestore.googleapis.com/v1/projects/ustoz-ai-zamonaviy-kasblar/databases/(default)/documents/winners";
const FS_KEY = "AIzaSyCP7Nt9wOBRGY5krAhgtIGTB1tn_HInmaE";   // the site's public web key (access is set by Firestore rules)
async function winners(origin) {
  const cache = caches.default, key = new Request("https://cache.local/winners-v2");
  let hit = await cache.match(key);
  if (!hit) {
    const rows = []; let tok = "";
    for (let i = 0; i < 30; i++) {
      const r = await fetch(`${FS}?pageSize=300&key=${FS_KEY}${tok ? "&pageToken=" + encodeURIComponent(tok) : ""}`);
      if (!r.ok) return json({ error: "source " + r.status }, 502, origin);
      const d = await r.json();
      for (const doc of d.documents || []) {
        const f = doc.fields || {}, s = (k) => (f[k] && (f[k].stringValue ?? f[k].integerValue ?? f[k].timestampValue)) || "";
        if (!s("name")) continue;
        rows.push({ n: s("name"), r: s("region"), t: s("district"), d: s("direction"), s: s("stage"), p: Number(s("place")) || 1, at: s("publishedAt").slice(0, 10) });
      }
      tok = d.nextPageToken; if (!tok) break;
    }
    hit = new Response(JSON.stringify({ updated: new Date().toISOString(), winners: rows }), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
    await cache.put(key, hit.clone());
  }
  const body = await hit.text();
  return new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=120", ...cors(origin) } });
}

/* ---------- /news?l=uz|ru|en: youth news (jobs, AI, innovation, education) from public news feeds ---------- */
// Feeds in the reader's own language; only items about jobs, AI, tech, innovation and education are kept.
// [source, feed, topical]: a topical feed is all about AI or tech, so every item is kept
const NEWS_FEEDS = {
  uz: [["Gazeta.uz", "https://www.gazeta.uz/oz/rss/"], ["Spot", "https://www.spot.uz/oz/rss"], ["Daryo", "https://daryo.uz/feed"], ["Kun.uz", "https://kun.uz/news/rss"], ["UzDaily", "https://uzdaily.uz/uz/rss"], ["Xabar.uz", "https://xabar.uz/uz/rss"]],
  ru: [["Habr", "https://habr.com/ru/rss/hub/artificial_intelligence/all/?fl=ru", 1], ["Hightech.fm", "https://hightech.fm/feed.rss", 1], ["Gazeta.uz", "https://www.gazeta.uz/ru/rss/"], ["Spot", "https://www.spot.uz/rss"], ["Kun.uz", "https://kun.uz/ru/news/rss"], ["UzDaily", "https://www.uzdaily.uz/ru/rss"]],
  en: [["The Verge", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", 1], ["VentureBeat", "https://venturebeat.com/category/ai/feed/", 1], ["Gazeta.uz", "https://www.gazeta.uz/en/rss/"], ["Kun.uz", "https://kun.uz/en/news/rss"]],
};
// matched at the start of a word in the headline; the strongest AI terms also count in the text
const NEWS_KW = ["sun'iy intellekt", "suniy intellekt", "neyrotarmoq", "openai", "chatgpt", "gpt", "gemini", "claude", "anthropic", "llm", "ai-agent", "ai agent", "ии-агент", "робот", "robot",
  "startap", "стартап", "startup", "innovats", "инновац", "innovation", "texnolog", "технолог", "technolog", "it park", "it-park", "dasturchi", "dasturlash", "программист", "программирован", "raqamli", "цифров", "digital",
  "нейросет", "искусственн", "kasb", "ish o'rin", "vakansiya", "maosh", "ish haqi", "профессi", "професси", "ваканс", "зарплат", "rezyume", "резюме", "career", "salar", "jobs", "hiring", "skill", "ko'nikma",
  "ta'lim", "образован", "education", "universitet", "университет", "universit", "oliygoh", "вуз", "talaba", "студент", "student", "grant", "грант", "stipendiya", "стипенди", "scholarship",
  "abituriyent", "абитуриент", "ielts", "sat", "dtm", "milliy sertifikat", "национальн сертификат", "yoshlar", "молодеж", "молодёж", "youth", "o'qituvchi", "учител", "teacher", "ai", "ии"];
const NEWS_STRONG = ["sun'iy intellekt", "openai", "chatgpt", "нейросет", "искусственный интеллект", "artificial intelligence", "llm"];
const kwRe = new RegExp("(?:^|[^\\p{L}\\p{N}])(?:" + NEWS_KW.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "iu");
const shortRe = /(?:^|[^\p{L}])(?:ai|ии|sat|dtm|вуз|gpt)(?:$|[^\p{L}])/iu;
const unent = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/&(rsquo|lsquo);/g, "'").replace(/&(ldquo|rdquo|laquo|raquo|bdquo);/g, '"').replace(/&(mdash|ndash);/g, "-").replace(/&hellip;/g, "...")
  .replace(/&([oOuUaAeE])uml;/g, (_, c) => ({ o: "ö", O: "Ö", u: "ü", U: "Ü", a: "ä", A: "Ä", e: "ë", E: "Ë" })[c]).replace(/&([cCsS])cedil;/g, (_, c) => ({ c: "ç", C: "Ç", s: "ş", S: "Ş" })[c])
  .replace(/&([gG])breve;/g, (_, c) => c === "g" ? "ğ" : "Ğ").replace(/&([aeiouAEIOU])(acute|grave);/g, "$1").replace(/&amp;/g, "&");
const tagOf = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i")); return m ? unent(m[1]).trim() : ""; };
const plain = (s) => unent(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
// kun.uz writes Uzbek in the newer alphabet (ç, ş, ö, ğ); the app uses ch, sh, o', g'
const oldLatin = (s) => s.replace(/Ç/g, "Ch").replace(/ç/g, "ch").replace(/Ş/g, "Sh").replace(/ş/g, "sh").replace(/Ö/g, "O'").replace(/ö/g, "o'").replace(/Ğ/g, "G'").replace(/ğ/g, "g'").replace(/Ñ/g, "Ng").replace(/ñ/g, "ng");
function parseFeed(xml, src, lang) {
  const out = [], blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    let title = plain(tagOf(b, "title")), link = tagOf(b, "link");
    if (!link) { const m = b.match(/<link[^>]+href="([^"]+)"/i); link = m ? m[1] : ""; }
    const date = tagOf(b, "pubDate") || tagOf(b, "published") || tagOf(b, "updated");
    const body = tagOf(b, "description") || tagOf(b, "summary") || tagOf(b, "content");
    let img = (b.match(/<enclosure[^>]+url="([^"]+)"/i) || b.match(/<media:content[^>]+url="([^"]+)"/i) || b.match(/<media:thumbnail[^>]+url="([^"]+)"/i) || unent(b).match(/<img[^>]+src="([^"]+)"/i) || [])[1] || "";
    let text = plain(body).replace(/\s*\[(…|&#8230;|\.\.\.)\]\s*$/, "…");
    if (lang === "uz") { title = oldLatin(title); text = oldLatin(text); }
    // the app writes plain dashes
    title = title.replace(/\s*[—–]\s*/g, " - "); text = text.replace(/\s*[—–]\s*/g, " - ");
    if (!title || !/^https?:\/\//.test(link)) continue;
    const t = Date.parse(date) || 0;
    out.push({ t: title.slice(0, 220), u: link.trim(), i: unent(img).replace(/^http:/, "https:"), d: text.slice(0, 600), s: src, at: t });
  }
  return out;
}
// stories picked by hand: shown at the top in every language for two weeks after they were added (lang = the story's own language)
const NEWS_PINNED = [
  { t: "OpenAI представила две «жутко умные» модели ИИ: GPT-6.2 Astra для профи и GPT-6.2 Sol для повседневных дел", u: "https://3dnews.ru/1151437/openai-predstavila-dve-gutko-umniemodeli-ii-gpt62-astra-dlya-profi-i-gpt62-sol-dlya-povsednevnih-del",
    i: "https://cdn.3dnews.ru/assets/external/illustrations/2026/11/17/1151437/gpt.png", d: "OpenAI представила две новые модели искусственного интеллекта, GPT-6.2 Astra и GPT-6.2 Sol, ориентированные на выполнение сложных профессиональных задач и повседневных дел.", s: "3DNews", at: Date.parse("2026-11-17T23:38:00+03:00"), lang: "ru", until: Date.parse("2026-12-02"),
    trs: { uz: { t: "OpenAI ikkita juda aqlli AI modelini taqdim etdi: professionallar uchun GPT-6.2 Astra va kundalik ishlar uchun GPT-6.2 Sol", d: "OpenAI murakkab professional vazifalar va kundalik ishlar uchun mo'ljallangan ikkita yangi sun'iy intellekt modeli, GPT-6.2 Astra va GPT-6.2 Sol'ni taqdim etdi." },
      en: { t: "OpenAI unveils two very smart AI models: GPT-6.2 Astra for professionals and GPT-6.2 Sol for everyday tasks", d: "OpenAI introduced two new AI models, GPT-6.2 Astra and GPT-6.2 Sol, built for complex professional work and everyday tasks." } } },
  { t: "See what 5 builders are making with Gemini 4 Carbon", u: "https://blog.google/products-and-platforms/products/gemini/gemini-4-carbon-builders/",
    i: "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/5_buildersGemini_4_Carbon_hero.width-1300.png", d: "See how five developers use Google Gemini 4 Carbon to build complex physics simulations, 3D designs, and data tools.", s: "Google", at: Date.parse("2026-11-17T12:00:00Z"), lang: "en", until: Date.parse("2026-12-02") },
  { t: "Перечислены самые высокооплачиваемые профессии в Узбекистане", u: "https://repost.uz/pozdno-vkativatsya-v-banking",
    i: "https://repost.uz/storage/watermarks/31241-1793106778-Oleg-post-material.jpg", d: "По итогам сентября 2026 года среднемесячная номинальная зарплата в Узбекистане составила свыше 7,2 млн сумов. Какие профессии оплачиваются выше всего.", s: "Repost.uz", at: Date.parse("2026-10-27T18:08:00+05:00"), lang: "ru", until: Date.parse("2026-12-02"),
    trs: { uz: { t: "O'zbekistondagi eng yuqori maoshli kasblar ma'lum bo'ldi", d: "2026-yil sentyabr yakunlariga ko'ra O'zbekistonda o'rtacha oylik ish haqi 7,2 mln so'mdan oshdi. Qaysi kasblar eng yuqori maosh oladi." },
      en: { t: "The highest-paid professions in Uzbekistan", d: "By the end of September 2026 the average monthly salary in Uzbekistan passed 7.2 million soum. Which jobs pay the most." } } },
];
// never shown: religious news and sad or crime news (matched at the start of a word, in the headline or the summary)
const NEWS_BAN = ["diniy", "dindor", "islom", "masjid", "namoz", "ramazon", "hajj", "haj ziyorat", "umra", "imom", "qur'on", "muftiy", "hijob", "ro'za", "xristian", "cherkov",
  "halok", "o'ldi", "o'ldir", "o'lim", "vafot", "jasad", "yth", "avtohalokat", "avariya", "jinoyat", "o'g'ir", "firib", "qamoq", "hibs", "pora", "zo'rla", "o'z joniga", "terror", "urush", "portla", "yong'in", "qotil", "jarohat", "mahkum", "sudlan", "narko", "giyohvand", "mahbus",
  "религи", "мечет", "ислам", "намаз", "рамадан", "хадж", "имам", "коран", "муфти", "хиджаб", "церк", "христиан", "погиб", "гибел", "смерт", "умер", "дтп", "авари", "убий", "убит", "мошенн", "арест", "задерж", "тюрьм", "колони", "заключ", "взрыв", "войн", "теракт", "пожар", "наркот", "насили", "суицид", "самоубий", "ранен", "преступ", "краж",
  "religio", "mosque", "church", "islam", "killed", "death", "dies ", "died", "crash", "murder", "arrest", "prison", "jail", "terror", "explosion", "suicide", "crime", "shooting", "lawsuit", "sues ", "inmate"];
const banRe = new RegExp("(?:^|[^\\p{L}\\p{N}])(?:" + NEWS_BAN.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "iu");
const isBanned = (it) => banRe.test((it.t + " " + it.d).toLowerCase().replace(/[‘’ʻʼ`]/g, "'"));
const dash = (v) => String(v || "").replace(/\s*[—–]\s*/g, " - ");
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s)))].slice(0, 10).map((b) => b.toString(16).padStart(2, "0")).join("");

// one language's stories: fetched, filtered, merged with what was kept (2 weeks), refreshed every 15 minutes
async function rawNews(env, lang) {
  let store = null; try { store = await env.COLORS.get("news:raw:" + lang, "json"); } catch {}
  const kept = Array.isArray(store) ? store : (store && store.items) || [];
  if (store && !Array.isArray(store) && Date.now() - store.at < 15 * 60000) return kept;
  const lists = await Promise.all(NEWS_FEEDS[lang].map(async ([src, feed, topical]) => {
    try { const r = await fetch(feed, { headers: { "User-Agent": "Mozilla/5.0 (news reader)" }, cf: { cacheTtl: 600 } }); return r.ok ? parseFeed(await r.text(), src, lang).map((x) => (x.k = !!topical, x)) : []; } catch { return []; }
  }));
  const fresh = [];
  for (const it of lists.flat()) {
    const topical = it.k; delete it.k; it.o = lang;
    if (isBanned(it)) continue;
    if (topical) { fresh.push(it); continue; }
    const head = it.t.toLowerCase().replace(/[‘’ʻʼ`]/g, "'"), body = it.d.toLowerCase().replace(/[‘’ʻʼ`]/g, "'");
    const ok = (kwRe.test(head) && (!/^(?:ai|ии|sat|dtm|вуз|gpt)$/i.test((head.match(kwRe) || [""])[0].replace(/^[^\p{L}]+/u, "")) || shortRe.test(head))) || NEWS_STRONG.some((k) => body.includes(k));
    if (ok) fresh.push(it);
  }
  const limit = Date.now() - 14 * 86400000, seen = new Set(), perSrc = {}, items = [];
  for (const it of [...fresh, ...kept].sort((a, b) => b.at - a.at)) {
    if ((it.at && it.at < limit) || isBanned(it)) continue;
    const k = it.t.toLowerCase().slice(0, 60); if (seen.has(k)) continue; seen.add(k);
    if ((perSrc[it.s] = (perSrc[it.s] || 0) + 1) > 10) continue;
    it.t = dash(it.t); it.d = dash(it.d); it.o = it.o || lang;
    items.push(it); if (items.length >= 30) break;
  }
  try { await env.COLORS.put("news:raw:" + lang, JSON.stringify({ at: Date.now(), items })); } catch {}
  return items;
}

/* ---------- translation (Workers AI, Llama 4 Scout); each story is translated once per language and kept in KV ---------- */
const LNAME = { uz: "Uzbek in Latin script with modern orthography (use o' and g', no Cyrillic)", ru: "Russian", en: "English" };
const AI_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
async function aiTranslate(env, text, to, max = 800) {
  const r = await env.AI.run(AI_MODEL, { max_tokens: max, temperature: 0.2, messages: [
    { role: "system", content: `You are a professional news translator. Translate the user's text into ${LNAME[to]}. Keep names, numbers and product names. Keep the line breaks. Output only the translation.` },
    { role: "user", content: text }] });
  return dash(String((r && r.response) || "").trim());
}
// all translations for one language live in one KV entry (url hash -> title and summary), read once per request
async function translateAll(env, list, to) {
  let map = {}; try { map = (await env.COLORS.get("trmap:" + to, "json")) || {}; } catch {}
  const keys = await Promise.all(list.map((x) => sha(x.u)));
  const todo = list.map((x, i) => [x, keys[i]]).filter(([x, k]) => x.o && x.o !== to && !map[k] && !(x.trs && x.trs[to])).slice(0, 8);
  let added = 0;
  if (env.AI) await Promise.all(todo.map(async ([x, k]) => {
    try {
      const out = await aiTranslate(env, x.t + "\n" + x.d, to, 500);
      const [t, ...rest] = out.split("\n").map((v) => v.trim()).filter(Boolean);
      if (t) { map[k] = { t, d: rest.join(" "), at: Date.now() }; added++; }
    } catch {}
  }));
  if (added) {
    const old = Date.now() - 20 * 86400000;
    for (const k of Object.keys(map)) if ((map[k].at || 0) < old) delete map[k];
    try { await env.COLORS.put("trmap:" + to, JSON.stringify(map)); } catch {}
  }
  // stories in another language that are not translated yet wait for a later refresh
  return list.map((x, i) => x.o === to ? x : x.trs && x.trs[to] ? { ...x, ...x.trs[to], tr: 1 } : map[keys[i]] ? { ...x, t: map[keys[i]].t, d: map[keys[i]].d, tr: 1 } : null).filter(Boolean);
}

async function news(url, env, origin) {
  const lang = ["uz", "ru", "en"].includes(url.searchParams.get("l")) ? url.searchParams.get("l") : "uz";
  if (!url.searchParams.get("fresh")) {
    let built = null; try { built = await env.COLORS.get("newslist:" + lang, "json"); } catch {}
    if (built && Date.now() - built.at < 3 * 3600000) return json(built, 200, origin);
  }
  // stories from all three languages, every one shown in the reader's language
  const raws = await Promise.all(["uz", "ru", "en"].map((l) => rawNews(env, l).catch(() => [])));
  const pins = NEWS_PINNED.filter((x) => Date.now() < x.until).map(({ lang: l, until, ...x }) => ({ ...x, t: dash(x.t), d: dash(x.d), o: l, pin: 1 }));
  const seen = new Set(pins.map((x) => x.u)), perSrc = {}, rest = [];
  for (const it of raws.flat().sort((a, b) => b.at - a.at)) {
    if (seen.has(it.u)) continue; seen.add(it.u);
    if ((perSrc[it.s] = (perSrc[it.s] || 0) + 1) > 6) continue;
    // own-language stories are preferred a little: a translated one must be newer by 6 hours to come first
    rest.push({ ...it, rank: it.at + (it.o === lang ? 6 * 3600000 : 0) });
    if (rest.length >= 40) break;
  }
  rest.sort((a, b) => b.rank - a.rank);
  const chosen = [...pins, ...rest.slice(0, 30 - pins.length)].map(({ rank, ...x }) => x);
  const items = (await translateAll(env, chosen, lang)).map(({ trs, ...x }) => x);
  const body = { lang, at: Date.now(), items };
  try { await env.COLORS.put("newslist:" + lang, JSON.stringify(body)); } catch {}
  return json(body, 200, origin);
}

/* ---------- /news/read?u=&l=&o=: the whole article, in the reader's language ---------- */
const NEWS_HOSTS = ["gazeta.uz", "spot.uz", "daryo.uz", "kun.uz", "uzdaily.uz", "xabar.uz", "habr.com", "hightech.fm", "theverge.com", "venturebeat.com", "3dnews.ru", "blog.google", "repost.uz"];
const ART_JUNK = /©|cookie|подпис|obuna bo|telegram|instagram|facebook|reklama|реклама|read more|sign up|newsletter|all rights|barcha huquq|все права|ko.rishlar|ko.rish|daqiqa o.qish|izoh|просмотр|комментар|мин чтения|min read|browser does not support|brauzer|audio element|listen to (this|the) article|maqolani tinglang|generated by google ai|generativ ai|источник изображения|image source|manba tasviri|фото:|photo:|rasm:/i;
function extractArticle(html) {
  let h = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<aside[\s\S]*?<\/aside>|<footer[\s\S]*?<\/footer>|<nav[\s\S]*?<\/nav>|<figcaption[\s\S]*?<\/figcaption>|<header[\s\S]*?<\/header>/gi, "");
  // the marked article body first (schema.org, common class names), else the largest <article>
  const mark = h.search(/itemprop=["']articleBody["']|class=["'][^"']*(article-formatted-body|article__text|article-body|articleBody|post-content|entry-content|news-text|js-mediator-article)[^"']*["']/i);
  if (mark > 0) h = h.slice(mark, mark + 80000);
  else { const arts = h.match(/<article[\s\S]*?<\/article>/gi); if (arts) { const big = arts.sort((x, y) => y.length - x.length)[0]; if (big.length > 1500) h = big; } }
  const out = [], seen = new Set();
  for (const m of h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = dash(plain(m[1]));
    if (t.length < 40 || seen.has(t) || ART_JUNK.test(t)) continue;
    seen.add(t); out.push(t); if (out.length >= 30) break;
  }
  return out;
}
async function newsRead(url, env, origin) {
  const u = url.searchParams.get("u") || "", to = ["uz", "ru", "en"].includes(url.searchParams.get("l")) ? url.searchParams.get("l") : "uz";
  const from = ["uz", "ru", "en"].includes(url.searchParams.get("o")) ? url.searchParams.get("o") : to;
  let host = ""; try { host = new URL(u).hostname.replace(/^www\./, ""); } catch {}
  if (!NEWS_HOSTS.some((d) => host === d || host.endsWith("." + d))) return json({ error: "source" }, 400, origin);
  const key = "art:v4:" + to + ":" + (await sha(u));
  try { const c = await env.COLORS.get(key, "json"); if (c) return json(c, 200, origin); } catch {}
  let p = [];
  try {
    const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (news reader)", "Accept-Language": from }, cf: { cacheTtl: 3600 } });
    if (r.ok) p = extractArticle(await r.text());
  } catch {}
  if (from === "uz") p = p.map(oldLatin);
  // at most 200 words: whole paragraphs while they fit, the last one cut at a sentence end
  { const out = []; let words = 0;
    for (const t of p) {
      const w = t.split(/\s+/).length;
      if (words + w <= 200) { out.push(t); words += w; continue; }
      const room = 200 - words; if (room < 25) break;
      const part = t.split(/\s+/).slice(0, room).join(" "), end = Math.max(part.lastIndexOf(". "), part.lastIndexOf("! "), part.lastIndexOf("? "));
      out.push(end > 40 ? part.slice(0, end + 1) : part + "..."); break;
    }
    p = out; }
  if (!p.length) return json({ p: [] }, 200, origin);
  let tr = 0;
  if (from !== to && env.AI) {
    // in parts of about 1 200 characters, all at once, so a long story still opens quickly
    const parts = []; let cur = [];
    for (const s of p) { cur.push(s); if (cur.join("\n").length > 1200) { parts.push(cur); cur = []; } }
    if (cur.length) parts.push(cur);
    try {
      const done = await Promise.all(parts.map((ps) => aiTranslate(env, ps.join("\n"), to, 1600)));
      const all = done.join("\n").split("\n").map((s) => s.trim()).filter(Boolean);
      if (all.length) { p = all; tr = 1; }
    } catch {}
  }
  const body = { p, tr };
  try { await env.COLORS.put(key, JSON.stringify(body), { expirationTtl: 14 * 86400 }); } catch {}
  return json(body, 200, origin);
}


/* ---------- the bot answers /start: a shared section link (t.me/<bot>?start=g_cefr) gets a button that opens the app right there ---------- */
const APP_URL = "https://dilmurodzz.github.io/ustozai-miniapp/";
const hookKey = async (token) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hook:" + token)))].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
const BOT_TEXT = {
  uz: { shared: "Do'stingiz siz bilan Ustoz AI'dagi foydali bo'limni ulashdi. Ochish uchun tugmani bosing.", open: "Bo'limni ochish", hello: "Ustoz AI mini ilovasiga xush kelibsiz! Kasbingizni toping, bepul kurslar, CV yaratish va foydali vositalar bir joyda.", app: "Ustoz AI'ni ochish" },
  ru: { shared: "Друг поделился с вами полезным разделом в Ustoz AI. Нажмите кнопку, чтобы открыть.", open: "Открыть раздел", hello: "Добро пожаловать в мини-приложение Ustoz AI! Профессия, бесплатные курсы, создание CV и полезные инструменты в одном месте.", app: "Открыть Ustoz AI" },
  en: { shared: "A friend shared a useful section of Ustoz AI with you. Tap the button to open it.", open: "Open the section", hello: "Welcome to the Ustoz AI mini app! Find your career, free courses, a CV maker and useful tools in one place.", app: "Open Ustoz AI" },
};
// The channel post, shareable anywhere through the bot's inline mode: typing @ustozaiminibot in any chat (a friend's chat,
// or the channel itself) offers this post with its picture and the "Ilovani ochish" button, which stays on the sent message.
// The picture is kept in KV as pimg:post1 (served at /p/post1.jpg).
const POST1 = { caption: `⚡ <b>Endi Ustoz AI mini ilovasi bor!</b>
Telegramning o‘zida kasb tanlang, o‘zingizga mos kursni toping va işga ariza topşiriş uçun CV tayyorlang.
✅ <b>Barçasi bepul. Ro‘yxatdan o‘tiş ham şart emas!</b>

📊 <b>Qaysi kasbga talab yuqori?</b>
Biz hh.uz saytidagi qariyb 12 ming vakansiyani tahlil qildik. Har bir kurs sizni qaysi kasbga tayyorlaşi, neçta iş e’loni bor, va boşqa savollaringizga javob tayyorladik. Ilovada ko‘ring 😉

🧭 <b>Qaysi kasb sizga mos?</b>
«Kasb kompasi»dan boşlang. <b>5 daqiqa içida</b> qiziqişlaringiz va ko‘nikmalaringizga mos <b>3 ta kursni</b> tavsiya qilamiz.

🎓 <b>Biz sizga Top 10 oliygohlarga hujjat topşirişda yordam beramiz.</b>
Garvard qabul bo‘limi vakili Stanislav Rivkinning maslahatlari sizga dastur tanlaş, maqsadingizni aniq ifodalaş, va moliyaviy yordam masalalarida yo‘l ko‘rsatadi. «<b>Application Studio</b>»da esa hujjatlaringizni mukammal tayyorlang.

🏆 <b>Zamonaviy kasblar tanlovi natijalari</b>
Grafik dizayn, mobilografiya va veb-sayt yaratiş bo‘yiça tanlov g‘oliblari bilan tanişib boring.

👇 <b>Boşlaş uçun quyidagi tugmani bosing!</b>`, button: { text: "Ilovani ochish", url: "https://t.me/ustozaiminibot?startapp", style: "primary" } };
async function inlineAnswer(env, url, q) {
  const r = { type: "photo", id: "post1", photo_url: url.origin + "/p/post1.jpg", thumbnail_url: url.origin + "/p/post1.jpg", photo_width: 2560, photo_height: 1440,
    title: "Ustoz AI mini ilovasi", description: "Post: rasm, matn va tugma", caption: POST1.caption, parse_mode: "HTML", reply_markup: { inline_keyboard: [[POST1.button]] } };
  await tg(env.BOT_TOKEN, "answerInlineQuery", JSON.stringify({ inline_query_id: q.id, results: [r], cache_time: 300, is_personal: false }));
}
// /kanal: a channel admin opens the bot and sends /kanal; the bot shows the post with a "Kanalga joylash" button.
// One tap: the bot itself posts it in the channel (no "forwarded" line, the button stays) and pins it.
// Only admins of the channel can use it; the bot must be a channel admin with the right to post and pin.
const isChanAdmin = async (env, uid) => {
  if (String(env.ADMIN_IDS || "").split(",").map((s) => Number(s.trim())).includes(Number(uid))) return true;
  try { const r = await tg(env.BOT_TOKEN, "getChatMember", JSON.stringify({ chat_id: env.CHANNEL, user_id: uid })); return ["creator", "administrator"].includes(r.status); } catch { return null; }   // null: the bot is not in the channel yet
};
const postPhoto = (env, url, chat, extra) => tg(env.BOT_TOKEN, "sendPhoto", JSON.stringify({ chat_id: chat, photo: url.origin + "/p/post1.jpg", caption: POST1.caption, parse_mode: "HTML",
  reply_markup: { inline_keyboard: [[POST1.button], ...(extra || [])] } }));
async function kanalCmd(env, url, m) {
  const ok = await isChanAdmin(env, m.from.id);
  if (!ok) return tg(env.BOT_TOKEN, "sendMessage", JSON.stringify({ chat_id: m.chat.id, text: ok === null
    ? `Avval botni ${env.CHANNEL} kanaliga admin qiling: kanal sozlamalari, Administratorlar, Admin qo'shish, @ustozaiminibot. "Post messages" va "Pin messages" huquqlarini yoqing. Keyin /kanal ni yana yuboring.`
    : `Bu buyruq faqat ${env.CHANNEL} kanali adminlari uchun.` }));
  await postPhoto(env, url, m.chat.id, [[{ text: `${env.CHANNEL} kanaliga joylash va pin qilish`, callback_data: "post1" }]]);
}
async function kanalTap(env, url, q) {
  const say = (text, alert) => tg(env.BOT_TOKEN, "answerCallbackQuery", JSON.stringify({ callback_query_id: q.id, text, show_alert: !!alert })).catch(() => {});
  if (q.data !== "post1") return say("");
  const ok = await isChanAdmin(env, q.from.id);
  if (ok === null) return say(`Avval botni ${env.CHANNEL} kanaliga admin qiling: "Post messages" va "Pin messages" huquqlari bilan.`, true);
  if (!ok) return say(`Faqat ${env.CHANNEL} kanali adminlari joylay oladi.`, true);
  let msg;
  try { msg = await postPhoto(env, url, env.CHANNEL); }
  catch { return say(`Avval botni ${env.CHANNEL} kanaliga admin qiling: "Post messages" va "Pin messages" huquqlari bilan. Keyin tugmani yana bosing.`, true); }
  let pinned = true;
  try { await tg(env.BOT_TOKEN, "pinChatMessage", JSON.stringify({ chat_id: env.CHANNEL, message_id: msg.message_id, disable_notification: false })); } catch { pinned = false; }
  // the publish button goes away, so the post is not placed twice
  if (q.message) await tg(env.BOT_TOKEN, "editMessageReplyMarkup", JSON.stringify({ chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[POST1.button]] } })).catch(() => {});
  await say(pinned ? "Post kanalga joylandi va pin qilindi." : `Post kanalga joylandi, lekin pin qilinmadi: botga "Pin messages" huquqini bering.`, true);
}
async function botHook(req, env, url) {
  const key = await hookKey(env.BOT_TOKEN || "");
  if (url.pathname !== "/tg/" + key || req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== key) return new Response("no", { status: 403 });
  try {
    const up = await req.json(), m = up.message;
    if (up.inline_query) { await inlineAnswer(env, url, up.inline_query); return new Response("ok"); }
    if (up.callback_query) { await kanalTap(env, url, up.callback_query); return new Response("ok"); }
    if (m && m.chat && m.chat.type === "private" && /^\/kanal(@\w+)?$/.test(String(m.text || "").trim())) { await kanalCmd(env, url, m); return new Response("ok"); }
    if (m && m.chat && m.chat.type === "private" && typeof m.text === "string" && m.text.startsWith("/start")) {
      const payload = (m.text.split(" ")[1] || "").trim();
      const l = String((m.from && m.from.language_code) || "uz").slice(0, 2), tx = BOT_TEXT[l === "ru" ? "ru" : l === "en" ? "en" : "uz"];
      const shared = /^[gdup]_[A-Za-z0-9_-]{1,40}$/.test(payload);   // p_ = a whole page (p_kompas, p_ariza...)
      await tg(env.BOT_TOKEN, "sendMessage", JSON.stringify({ chat_id: m.chat.id, text: shared ? tx.shared : tx.hello,
        reply_markup: { inline_keyboard: [[{ text: shared ? tx.open : tx.app, web_app: { url: APP_URL + (shared ? "?shared=" + payload : "") } }]] } }));
    }
  } catch {}
  return new Response("ok");
}
