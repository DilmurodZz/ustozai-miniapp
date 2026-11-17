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
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", body });
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
