// Two-player link for Chorsu game. Each phone gets a 4-digit code; one player types the other's code and the two
// phones talk directly (WebRTC data channel). A public PeerJS server is used only to introduce the phones.
// The phone that receives the call is the "host": it decides the road (obstacles, coins, speed).
// runner colours a player can choose
const RUN_COLORS = ["#2748F5", "#F97316", "#16A34A", "#DC2626", "#9333EA", "#0EA5E9", "#DB2777", "#334155"];
const runnerName = () => { try { const v = JSON.parse(localStorage.getItem("uz_run_name")); if (v) return v; } catch {} const u = window.Telegram && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user; return (u && u.first_name) || "O'yinchi"; };
const runnerColor = () => { try { return JSON.parse(localStorage.getItem("uz_run_color")) || null; } catch { return null; } };
const Duo = (() => {
  const PREFIX = "chorsu-game-v1-";
  const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }] };
  let peer = null, conn = null, code = null, host = false, friend = null, libP = null, hb = 0, seen = 0, redial = 0, wantFriend = null;
  const ls = { get: (k, d) => { try { const v = localStorage.getItem("uz_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem("uz_" + k, JSON.stringify(v)); } catch {} } };
  const subs = {};
  const emit = (k, v) => (subs[k] || []).slice().forEach((f) => { try { f(v); } catch (e) { console.error(e); } });
  const S = { status: "idle", error: "", playing: false, resume: null };

  function lib() {
    if (window.Peer) return Promise.resolve();
    return libP || (libP = new Promise((ok, no) => { const s = document.createElement("script"); s.src = "lib/peerjs.min.js"; s.onload = ok; s.onerror = () => { libP = null; no(); }; document.head.appendChild(s); }));
  }
  const newCode = () => String(1000 + Math.floor(Math.random() * 9000));
  const set = (st, err = "") => { S.status = st; S.error = err; emit("status", S); };

  async function open(fresh) {
    try { await lib(); } catch { return set("error", "Internet yo'q"); }
    if (peer && !fresh && !peer.destroyed && S.status !== "error") return;
    if (peer) { try { peer.destroy(); } catch {} }
    code = fresh ? newCode() : ls.get("duo_code", null) || newCode();
    ls.set("duo_code", code);
    set("opening");
    const p = peer = new Peer(PREFIX + code, { config: ICE, debug: 0 });
    p.on("open", () => { if (p === peer) { set(conn && conn.open ? "linked" : "ready"); if (wantFriend) dial(wantFriend); } });
    p.on("connection", (c) => { if (p !== peer) return; if (conn && conn.open && conn.peer !== c.peer) { c.on("open", () => c.close()); return; } attach(c, true); });
    p.on("disconnected", () => { if (p === peer && !p.destroyed) setTimeout(() => { try { p.reconnect(); } catch {} }, 1500); });
    p.on("error", (e) => {
      if (p !== peer) return;
      if (e.type === "unavailable-id") { ls.set("duo_code", null); return open(true); }
      if (e.type === "peer-unavailable") return set(conn && conn.open ? "linked" : "ready", "Bu kod topilmadi yoki do'stingiz oflayn");
      if (e.type === "network" || e.type === "server-error" || e.type === "socket-error") return set("error", "Serverga ulanib bo'lmadi");
      set(S.status, e.type);
    });
  }
  function dial(friendCode) {
    wantFriend = friendCode;
    if (!peer || peer.disconnected || peer.destroyed) return open();
    set("dialing");
    attach(peer.connect(PREFIX + friendCode, { reliable: true, serialization: "json" }), false);
  }
  function attach(c, asHost) {
    if (conn && conn !== c) { try { conn.close(); } catch {} }
    conn = c;
    c.on("open", () => {
      if (c !== conn) return;
      host = asHost; seen = Date.now(); redial = 0;
      c.send({ t: "hello", name: runnerName(), color: runnerColor(), code });
      set("linked");
      clearInterval(hb); hb = setInterval(beat, 1000);
    });
    c.on("data", (m) => {
      if (c !== conn || !m || !m.t) return;
      seen = Date.now();
      if (m.t === "hello") { friend = { name: String(m.name || "Do'st").slice(0, 16), code: String(m.code || ""), color: RUN_COLORS.includes(m.color) ? m.color : null }; ls.set("duo_friend", friend); if (!host) ls.set("duo_dial", friend.code); emit("friend", friend); return; }
      if (m.t === "hb") return;
      emit("msg", m);
    });
    c.on("close", () => { if (c === conn) lost(); });
    c.on("error", () => { if (c === conn) lost(); });
  }
  function beat() {
    if (conn && conn.open) { try { conn.send({ t: "hb" }); } catch {} }
    if (S.status === "linked" && Date.now() - seen > 4500) lost();
    if (S.status === "lost" && !host && wantFriend && ++redial % 3 === 0) dial(wantFriend);     // the guest keeps calling back
  }
  function lost() { if (S.status === "linked") { set("lost"); emit("lost"); } }
  function send(m) { if (conn && conn.open) { try { conn.send(m); } catch {} } }
  function leave() { S.playing = false; wantFriend = null; clearInterval(hb); if (conn) { try { conn.close(); } catch {} } conn = null; friend = null; set(peer && peer.open ? "ready" : S.status); }

  return {
    S, open, dial, send, leave,
    refresh: () => { leave(); open(true); },
    on: (k, f) => { (subs[k] || (subs[k] = [])).push(f); return () => { subs[k] = subs[k].filter((g) => g !== f); }; },
    get code() { return code; }, get host() { return host; }, get friend() { return friend; },
    get linked() { return S.status === "linked"; },
    hello: () => send({ t: "hello", name: runnerName(), color: runnerColor(), code }),
    savedDial: () => ls.get("duo_dial", null),
  };
})();
