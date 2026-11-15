// Sound for Chorsu Run: short effects and quiet background music.
// Everything is synthesised in the browser, so there are no audio files to download and it works offline.

const RunAudio = (() => {
  let ctx = null, sfxBus = null, musBus = null, noise = null, muted = false;
  let on = false, timer = 0, song = 0, step = 0, nextT = 0;

  // [wave, from Hz, to Hz, seconds, volume]
  const SFX = {
    coin: ["sine", 990, 1480, 0.09, 0.06], jump: ["sine", 320, 640, 0.16, 0.06], roll: ["triangle", 420, 160, 0.2, 0.06],
    swish: ["sine", 520, 380, 0.07, 0.03], near: ["square", 660, 1320, 0.12, 0.03], bump: ["sawtooth", 200, 90, 0.16, 0.07],
    crash: ["sawtooth", 170, 38, 0.45, 0.12], ok: ["sine", 660, 1320, 0.25, 0.07], bad: ["square", 220, 110, 0.3, 0.05],
    trick: ["sine", 420, 1500, 0.34, 0.06], whistle: ["square", 2350, 2650, 0.4, 0.035], bite: ["square", 190, 120, 0.05, 0.035], gulp: ["sine", 330, 170, 0.13, 0.06],
  };
  // Five upbeat loops in major keys. prog = chord roots as scale steps, mel = melody as steps above the chord root.
  const SCALE = [0, 2, 4, 5, 7, 9, 11];
  const SONGS = [
    { bpm: 118, root: 60, prog: [0, 4, 5, 3], mel: [0, 2, 4, 2, 7, 4, 2, 4], wave: "triangle" },
    { bpm: 124, root: 62, prog: [5, 3, 0, 4], mel: [4, 2, 0, 2, 4, 7, 4, 2], wave: "square" },
    { bpm: 112, root: 65, prog: [0, 3, 4, 3], mel: [0, 4, 2, 4, 7, 4, 9, 7], wave: "triangle" },
    { bpm: 128, root: 57, prog: [0, 5, 3, 4], mel: [7, 4, 2, 0, 2, 4, 7, 9], wave: "square" },
    { bpm: 120, root: 67, prog: [3, 0, 4, 5], mel: [2, 4, 7, 4, 2, 0, 2, 4], wave: "triangle" },
  ];
  const hz = (root, deg) => 440 * Math.pow(2, (root + 12 * Math.floor(deg / 7) + SCALE[((deg % 7) + 7) % 7] - 69) / 12);

  function ready() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(ctx.destination);
      musBus = ctx.createGain(); musBus.gain.value = 0.5; musBus.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noise = buf;
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
  function hit(t0, dur, vol, freq) {     // filtered noise burst: hi-hat or clap
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = freq > 4000 ? "highpass" : "bandpass"; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(musBus); s.start(t0); s.stop(t0 + dur + 0.02);
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

  function schedule(t) {
    const sg = SONGS[song], bar = Math.floor(step / 8), s = step % 8, chord = sg.prog[bar % sg.prog.length];
    const mel = bar % 4 === 3 ? [...sg.mel].reverse() : sg.mel, beat = 60 / sg.bpm / 2;
    if (s === 0) for (const d of [0, 2, 4]) tone(musBus, "triangle", hz(sg.root - 12, chord + d), hz(sg.root - 12, chord + d), t, beat * 7.6, 0.022);   // soft chord
    if (s === 0 || s === 3 || s === 4 || s === 6) tone(musBus, "sine", hz(sg.root - 24, chord), hz(sg.root - 24, chord), t, beat * 0.9, 0.09);          // bass
    if (bar % 8 !== 7 || s < 4) tone(musBus, sg.wave, hz(sg.root, chord + mel[s]), hz(sg.root, chord + mel[s]), t, beat * 0.95, sg.wave === "square" ? 0.022 : 0.045);
    if (s % 4 === 0) tone(musBus, "sine", 130, 45, t, 0.16, 0.16);    // kick
    if (s % 2 === 1) hit(t, 0.04, 0.02, 7000);
    if (s === 2 || s === 6) hit(t, 0.09, 0.035, 1800);
    step++;
    if (step >= 8 * 16) { step = 0; song = (song + 1) % SONGS.length; }   // next tune after 16 bars
    return beat;
  }
  function tick() {
    if (!on || !ctx) return;
    try { while (nextT < ctx.currentTime + 0.25) nextT += schedule(nextT); } catch {}
  }
  function music(play) {
    if (play && !muted) {
      if (on || !ready()) return;
      on = true; nextT = ctx.currentTime + 0.08;
      timer = setInterval(tick, 70);
    } else if (on) { on = false; clearInterval(timer); }
  }
  let wanted = false;
  return {
    sfx, jingle,
    music(play) { wanted = play; music(play); },
    mute(m) { muted = m; music(!m && wanted); },
  };
})();
