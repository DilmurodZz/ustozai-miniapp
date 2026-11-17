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
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(req.url);
    // colour choice counts: each Telegram user is counted once, with their latest colour
    if (url.pathname === "/colors" && req.method === "GET") {
      const c = (await env.COLORS.get("counts", "json")) || {};
      return json({ blue: c.blue || 0, orange: c.orange || 0, green: c.green || 0 }, 200, origin);
    }
    if (url.pathname === "/color" && req.method === "POST") {
      const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN, 30 * 86400);
      if (!user || !user.id) return json({ error: "unauthorised" }, 401, origin);
      const pick = url.searchParams.get("c");
      if (!["blue", "orange", "green"].includes(pick)) return json({ error: "bad colour" }, 400, origin);
      const key = "u:" + user.id, old = await env.COLORS.get(key);
      const c = (await env.COLORS.get("counts", "json")) || {};
      if (old !== pick) {
        if (old && c[old] > 0) c[old]--;
        c[pick] = (c[pick] || 0) + 1;
        await env.COLORS.put(key, pick);
        await env.COLORS.put("counts", JSON.stringify(c));
      }
      return json({ blue: c.blue || 0, orange: c.orange || 0, green: c.green || 0 }, 200, origin);
    }
    if (url.pathname === "/track" && req.method === "POST") return track(req, env, url, origin);
    if (url.pathname === "/stats" && req.method === "GET") return json(await stats(env), 200, origin);
    if (url.pathname === "/winners" && req.method === "GET") return winners(origin);
    if (url.pathname === "/file" && req.method === "POST") return sendFile(req, env, url, origin);
    if (url.pathname.startsWith("/dl/") && req.method === "GET") {
      const [, , id, name] = url.pathname.split("/");
      const f = await env.COLORS.getWithMetadata("dl:" + id, "arrayBuffer");
      if (!f.value) return new Response("expired", { status: 404 });
      return new Response(f.value, { headers: { "Content-Type": f.metadata.type, "Content-Disposition": `attachment; filename*=UTF-8''${name}`, ...cors(origin) } });
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
const SECTIONS = ["home", "kompas", "natija", "kurslar", "kurs", "tanlov", "profil", "oyin", "duo", "vositalar", "cv", "chegirma", "admin"];
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
    env.DB.prepare("SELECT section s, COUNT(*) n FROM visits WHERE day >= ?1 AND section NOT IN ('home', 'admin') GROUP BY section ORDER BY n DESC LIMIT 6").bind(d6).all(),
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
const sendText = (env, chat, text, btn) => tg(env.BOT_TOKEN, "sendMessage", JSON.stringify({ chat_id: chat, text, disable_web_page_preview: false, ...(btn ? { reply_markup: { inline_keyboard: [[btn]] } } : {}) }));
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
  if (req.method !== "POST") return json({ error: "not found" }, 404, origin);
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").trim().slice(0, 4000);
  if (!text) return json({ error: "empty text" }, 400, origin);
  let btn = null;
  if (b.btnText && /^https:\/\//.test(b.btnUrl || "")) btn = { text: String(b.btnText).slice(0, 60), url: String(b.btnUrl) };
  // a copy to the admin themself, to check how it looks
  if (route === "test") {
    try { await sendText(env, user.id, text, btn); return json({ ok: true }, 200, origin); } catch (e) { return json({ error: String(e.message || e) }, 502, origin); }
  }
  if (route === "channel") {
    try { await sendText(env, env.CHANNEL, text, btn); return json({ ok: true }, 200, origin); } catch (e) { return json({ error: String(e.message || e) }, 502, origin); }
  }
  // message to every user, 25 per request (the Mini App calls again with the next offset)
  if (route === "broadcast") {
    const after = Number(b.after) || 0, BATCH = 25;
    const rows = (await env.DB.prepare("SELECT id FROM users WHERE blocked = 0 AND id > ?1 ORDER BY id LIMIT ?2").bind(after, BATCH).all()).results;
    let sent = 0, failed = 0;
    for (const r of rows) {
      try { await sendText(env, r.id, text, btn); sent++; }
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
