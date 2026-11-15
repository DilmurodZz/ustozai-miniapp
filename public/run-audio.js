// Sound for Chorsu Run: short synthesised effects and background music from three tracks.

const RunAudio = (() => {
  let ctx = null, sfxBus = null, muted = false;
  let on = false, song = 0;

  // [wave, from Hz, to Hz, seconds, volume]
  const SFX = {
    coin: ["sine", 990, 1480, 0.09, 0.06], jump: ["sine", 320, 640, 0.16, 0.06], roll: ["triangle", 420, 160, 0.2, 0.06],
    swish: ["sine", 520, 380, 0.07, 0.03], near: ["square", 660, 1320, 0.12, 0.03], bump: ["sawtooth", 200, 90, 0.16, 0.07],
    crash: ["sawtooth", 170, 38, 0.45, 0.12], ok: ["sine", 660, 1320, 0.25, 0.07], bad: ["square", 220, 110, 0.3, 0.05],
    trick: ["sine", 420, 1500, 0.34, 0.06], whistle: ["square", 2350, 2650, 0.4, 0.035], bite: ["square", 190, 120, 0.05, 0.035], gulp: ["sine", 330, 170, 0.13, 0.06],
  };
  const SCALE = [0, 2, 4, 5, 7, 9, 11];
  const hz = (root, deg) => 440 * Math.pow(2, (root + 12 * Math.floor(deg / 7) + SCALE[((deg % 7) + 7) % 7] - 69) / 12);

  function ready() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(ctx.destination);
      return true;
    } catch { return false; }
  }
  function tone(bus, type, f0, f1, t0, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sfx(name, pitch = 1) {
    if (muted || !ready()) return;
    const [type, f0, f1, dur, vol] = SFX[name];
    try { tone(sfxBus, type, f0 * pitch, f1 * pitch, ctx.currentTime, dur, vol); } catch {}
  }
  function jingle() {                    // short rising reward chime
    if (muted || !ready()) return;
    [0, 2, 4, 7].forEach((d, i) => tone(sfxBus, "triangle", hz(72, d), hz(72, d), ctx.currentTime + i * 0.085, 0.22, 0.06));
  }

  // Background music: three tracks played one after another. Each file is fetched once (from the offline cache when
  // there is one) and played from memory, so it also works without internet.
  const TRACKS = ["music/track1.m4a", "music/track2.m4a", "music/track3.m4a"];
  const urls = {};
  let player = null;
  async function load(i) {
    if (!urls[i]) urls[i] = fetch(TRACKS[i]).then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => URL.createObjectURL(b)).catch(() => { urls[i] = null; return null; });
    return urls[i];
  }
  async function cue(i) {
    song = i % TRACKS.length;
    const url = await load(song);
    if (!player || !url) return;
    player.src = url; player.currentTime = 0;
    if (on) player.play().catch(() => {});
    load((song + 1) % TRACKS.length);           // fetch the next one in good time
  }
  function music(play) {
    if (play && !muted) {
      if (on) return;
      on = true;
      if (!player) {
        player = new Audio(); player.preload = "auto"; player.volume = 0.42;
        player.onended = () => cue(song + 1);
        cue(0);
      } else if (player.src) player.play().catch(() => {});
    } else if (on) { on = false; if (player) player.pause(); }
  }
  let wanted = false;
  return {
    sfx, jingle,
    wake() { if (!muted) ready(); if (on && player && player.paused && player.src) player.play().catch(() => {}); },   // a tap unlocks music the phone blocked
    music(play) { wanted = play; music(play); },
    mute(m) { muted = m; music(!m && wanted); },
  };
})();
