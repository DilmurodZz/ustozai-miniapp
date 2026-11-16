// Everything you can see in Chorsu Run: sky, street, bazaar stalls, trees, people, vehicles and the runner.
// build() returns one object (S) with the scene and the parts the game loop animates.

const RunWorld = (() => {
  let T = null, S = null, G = null, scene = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

  const SKIN = ["#E8B48C", "#D9A074", "#C68B5E", "#EBC2A0"];
  const CLOTH = ["#3A6EA5", "#C0392B", "#2E8B57", "#8E44AD", "#D68910", "#34495E", "#1ABC9C", "#B5546E"];
  const SHIRT = ["#F3EEE4", "#DCE7F2", "#EED9C4"];
  const AWN = ["#D7263D", "#1B998B", "#F4A300", "#2E6FD8", "#8E44AD", "#E76F51"];
  const FRUIT = ["#F4902C", "#D7372F", "#F2C230", "#7BB342", "#8E3B8C", "#F2E5C4"];
  const CALLS = ["Keling, keling!", "Oling, arzon!", "Shirin olma!", "Issiq non!", "Tatib ko'ring!", "Qovun asal!"];

  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  function tex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    return t;
  }
  const NI = new Map(), CAPS = new Map();
  const cap = (r, l) => { const key = r + "|" + l; let g = CAPS.get(key); if (!g) { g = new T.CapsuleGeometry(r, l, 4, 10); CAPS.set(key, g); } return g; };
  const mesh = (geo, mat, cast = true) => { const m = new T.Mesh(geo, mat); m.castShadow = cast; return m; };

  // Bakes many coloured parts into one geometry, so a whole prop costs a single draw call.
  function baker() {
    const ps = [], ns = [], cs = [];
    const m = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), w = new T.Vector3();
    const sc = new T.Vector3(), q = new T.Quaternion(), eu = new T.Euler(), col = new T.Color(), c2 = new T.Color();
    let top = 0;
    const flat = (geo) => { let g = NI.get(geo); if (!g) { g = geo.index ? geo.toNonIndexed() : geo; NI.set(geo, g); } return g; };
    const api = {
      add(geo, color, s, p, r, order) {
        const g = flat(geo), pa = g.attributes.position, na = g.attributes.normal;
        eu.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0, order || "XYZ"); q.setFromEuler(eu);
        m.compose(v.set(p[0], p[1], p[2]), q, sc.set(s[0], s[1], s[2])); nm.getNormalMatrix(m);
        col.set(color);
        for (let i = 0; i < pa.count; i++) {
          v.fromBufferAttribute(pa, i).applyMatrix4(m); ps.push(v.x, v.y, v.z); if (v.y > top) top = v.y;
          v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); ns.push(v.x, v.y, v.z);
          cs.push(col.r, col.g, col.b);
        }
        return api;
      },
      // organic lump (leaves, clouds, rock): vertices pushed in and out, faceted, each face a slightly different tone
      blob(geo, color, s, p, amt = 0.2, tone = 0.1) {
        const g = flat(geo), pa = g.attributes.position, seed = Math.random() * 50, pts = [a, b, c];
        col.set(color);
        for (let i = 0; i < pa.count; i += 3) {
          for (let j = 0; j < 3; j++) {
            const pt = pts[j].fromBufferAttribute(pa, i + j);
            pt.multiplyScalar(1 + amt * (hash(Math.round(pt.x * 50) + seed, Math.round(pt.y * 50), Math.round(pt.z * 50)) - 0.5) * 2);
            pt.set(pt.x * s[0] + p[0], pt.y * s[1] + p[1], pt.z * s[2] + p[2]);
          }
          v.subVectors(b, a).cross(w.subVectors(c, a)).normalize();
          c2.copy(col).offsetHSL((hash(i, seed, 3) - 0.5) * 0.02, 0, (hash(i + seed, 1, 2) - 0.5) * tone + v.y * 0.06);
          for (const pt of pts) { ps.push(pt.x, pt.y, pt.z); ns.push(v.x, v.y, v.z); cs.push(c2.r, c2.g, c2.b); if (pt.y > top) top = pt.y; }
        }
        return api;
      },
      geo() {
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(ps, 3));
        g.setAttribute("normal", new T.Float32BufferAttribute(ns, 3));
        g.setAttribute("color", new T.Float32BufferAttribute(cs, 3));
        g.userData.top = top;
        return g;
      },
    };
    return api;
  }

  /* ---------- sky, ground, light ---------- */
  function sky() {
    S.skyMat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color() }, bot: { value: new T.Color() } },
      vertexShader: "varying vec3 vP;\nvoid main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 bot; varying vec3 vP;\nvoid main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bot, top, smoothstep(-0.02, 0.55, h)), 1.0);\n#include <colorspace_fragment>\n}",
    });
    const m = new T.Mesh(new T.SphereGeometry(1200, 24, 12), S.skyMat); m.renderOrder = -10; m.frustumCulled = false; scene.add(m); S.skyMesh = m;
    scene.fog = new T.Fog(0xffffff, 50, 150);
  }
  function ground() {
    const LEN = 640, Z0 = -170;
    const roadT = tex(512, 512, (g, w, h) => {
      g.fillStyle = "#d6d0c6"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = -64; x < w; x += 64) {
        const v = 198 + Math.floor(Math.random() * 34);
        g.fillStyle = `rgb(${v + 8},${v + 2},${v - 8})`; g.fillRect(x + ((y / 32) % 2 ? 32 : 0) + 1, y + 1, 62, 30);
      }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(80,70,60,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = "rgba(255,255,255,.9)";
      for (const lx of [0.365, 0.635]) for (let y = 0; y < h; y += 256) g.fillRect(lx * w - 4, y, 8, 128);
    }, 1, LEN / 7.4);
    const walkT = tex(256, 256, (g, w, h) => {
      g.fillStyle = "#efebe4"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const v = 226 + Math.floor(Math.random() * 20); g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(x + 1, y + 1, 62, 62); }
    }, 2, LEN / 2.7);
    const grassT = tex(256, 256, (g, w, h) => {
      g.fillStyle = "#f1f1f1"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${0.03 + Math.random() * 0.1})` : `rgba(255,255,255,${Math.random() * 0.5})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, 70, 96);
    S.roadMat = new T.MeshStandardMaterial({ map: roadT, roughness: 0.95 });
    S.walkMat = new T.MeshStandardMaterial({ map: walkT, roughness: 0.95 });
    S.grassMat = new T.MeshStandardMaterial({ map: grassT, roughness: 1 });
    S.scroll.push([roadT, 7.4], [walkT, 2.7], [grassT, LEN / 96]);
    const plane = (w, mat, x, y) => { const p = new T.Mesh(new T.PlaneGeometry(w, LEN), mat); p.rotation.x = -Math.PI / 2; p.position.set(x, y, Z0); p.receiveShadow = true; scene.add(p); return p; };
    plane(7.4, S.roadMat, 0, 0); plane(5.4, S.walkMat, -6.7, 0.07); plane(5.4, S.walkMat, 6.7, 0.07); S.grassMesh = plane(520, S.grassMat, 0, -0.03);
    const kerb = new T.MeshStandardMaterial({ color: 0xbfb9ae, roughness: 0.9 });
    for (const s of [-1, 1]) { const k = new T.Mesh(G.box, kerb); k.scale.set(0.3, 0.2, LEN); k.position.set(s * 3.85, 0.05, Z0); k.receiveShadow = true; scene.add(k); }
  }
  function lights() {
    S.hemi = new T.HemisphereLight(0xffffff, 0xbba57e, 2); scene.add(S.hemi);
    S.sun = new T.DirectionalLight(0xffffff, 3); S.sun.castShadow = true;
    const sh = S.sun.shadow; sh.mapSize.set(1024, 1024); sh.bias = -0.0005; sh.normalBias = 0.03;
    Object.assign(sh.camera, { left: -22, right: 22, top: 30, bottom: -30, near: 1, far: 170 });
    S.sun.target.position.set(0, 0, -12); scene.add(S.sun, S.sun.target);
    S.lamp = new T.PointLight(0xffd9a0, 0, 24, 1.5); S.lamp.position.set(0, 3.4, -3); scene.add(S.lamp);
  }

  /* ---------- far backdrop ---------- */
  function backdrop() {
    const dot = (soft) => tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(soft ? 0.25 : 0.82, soft ? "rgba(255,255,255,.35)" : "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
    S.disc = new T.Sprite(new T.SpriteMaterial({ map: dot(false), transparent: true, depthWrite: false, fog: false })); S.disc.scale.set(74, 74, 1);
    S.glow = new T.Sprite(new T.SpriteMaterial({ map: dot(true), transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending })); S.glow.scale.set(460, 460, 1);
    scene.add(S.glow, S.disc);
    const sp = [];
    for (let i = 0; i < 520; i++) { const a = rnd(0, Math.PI * 2), e = rnd(0.06, 1.45); sp.push(Math.cos(a) * Math.cos(e) * 1000, Math.sin(e) * 1000, Math.sin(a) * Math.cos(e) * 1000); }
    const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.Float32BufferAttribute(sp, 3));
    S.stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    S.stars.frustumCulled = false; scene.add(S.stars);
    S.cloudMat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, fog: false, depthWrite: false });
    S.clouds = [];
    for (let i = 0; i < 7; i++) {
      const k = baker();
      for (let j = 0; j < 5; j++) k.blob(G.ico1, "#FFFFFF", [rnd(22, 40), rnd(8, 13), rnd(14, 22)], [(j - 2) * 24 + rnd(-6, 6), rnd(-3, 5), rnd(-8, 8)], 0.16, 0.03);
      const c = mesh(k.geo(), S.cloudMat, false); c.position.set(rnd(-360, 360), rnd(95, 175), rnd(-540, -340)); scene.add(c); S.clouds.push(c);
    }
    const k = baker(), cone = new T.ConeGeometry(1, 1, 9, 3);
    for (let i = 0; i < 11; i++) {
      const h = rnd(70, 140), r = rnd(95, 160), x = -520 + i * 104 + rnd(-30, 30), z = -480 - rnd(0, 90);
      k.blob(cone, pick(["#6F84A6", "#7C8FAE", "#647A9C"]), [r, h, r], [x, h / 2 - 6, z], 0.1, 0.06);
      k.blob(cone, "#FFFFFF", [r * 0.38, h * 0.36, r * 0.38], [x, h * 0.82 - 5.2, z], 0.1, 0.03);
    }
    const mt = new T.MeshBasicMaterial({ vertexColors: true, fog: false });
    S.mtMesh = mesh(k.geo(), mt, false); scene.add(S.mtMesh); S.tints.push({ m: mt, k: 0.55 });
    // birds: one geometry per flock, wings are moved by the game loop
    S.flocks = [];
    for (const [n, color, kind] of [[7, 0x2f3440, "sky"], [5, 0x2f3440, "sky"], [7, 0x77839a, "ground"]]) {
      const pos = new Float32Array(n * 18), g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3));
      const m = new T.Mesh(g, new T.MeshBasicMaterial({ color, side: T.DoubleSide })); m.frustumCulled = false; scene.add(m);
      S.flocks.push({ mesh: m, pos, kind, birds: [...Array(n)].map((_, i) => ({ i, x: 0, y: -50, z: 0, vx: 0, vy: 0, vz: 0, ph: rnd(0, 6), fly: false, side: 1 })) });
    }
  }

  // The bazaar at the end of the road, modelled on Chorsu: a great turquoise dome on a round arcaded hall, ringed by smaller domes. No sign: players should recognise it.
  function landmark() {
    const g = new T.Group(); g.position.set(0, 0, -222); S.landmark = g;
    const lit = (o) => { const m = new T.MeshStandardMaterial({ fog: false, roughness: 0.6, ...o }); S.tints.push({ m, k: 0.25 }); return m; };
    const arch = (c, x, y, w, h) => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.45); c.quadraticCurveTo(x, y + h * 0.1, x + w / 2, y); c.quadraticCurveTo(x + w, y + h * 0.1, x + w, y + h * 0.45); c.lineTo(x + w, y + h); c.closePath(); };
    const tile = tex(128, 128, (c) => {
      c.fillStyle = "#18A9C6"; c.fillRect(0, 0, 128, 128);
      c.strokeStyle = "#0C7FA8"; c.lineWidth = 5;
      for (let i = -1; i < 3; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 64, 64); c.lineTo(i * 64, 128); c.lineTo(i * 64 - 64, 64); c.closePath(); c.stroke(); }
      c.fillStyle = "#F2D279"; for (const [x, y] of [[0, 64], [64, 0], [64, 128], [128, 64]]) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }
    }, 14, 5);
    const arcade = (n, win) => tex(128, 256, (c) => {
      c.fillStyle = "#DCC7A1"; c.fillRect(0, 0, 128, 256);
      c.fillStyle = "#0E5F9A"; c.fillRect(0, 0, 128, 26); c.fillStyle = "#F2D279"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(16 + i * 32, 13, 6, 0, 7); c.fill(); }
      c.fillStyle = "#C9B48C"; c.fillRect(0, 240, 128, 16);
      arch(c, 22, win ? 70 : 50, 84, win ? 130 : 190); c.fillStyle = win ? "#2B4A63" : "#4A3B2C"; c.fill(); c.lineWidth = 7; c.strokeStyle = "#18A9C6"; c.stroke();
    }, n, 1);
    const tileM = lit({ map: tile, roughness: 0.3, metalness: 0.15 }), hallM = lit({ map: arcade(22, false) }), drumM = lit({ map: arcade(18, true) });
    const plain = lit({ color: 0xdcc7a1 }), gold = lit({ color: 0xe6b84c, metalness: 0.4, roughness: 0.35 });
    const ribbed = (seg, ribs) => {
      const d = new T.SphereGeometry(1, seg, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), p = d.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), f = 1 + 0.035 * Math.cos(Math.atan2(z, x) * ribs); p.setXYZ(i, x * f, p.getY(i), z * f); }
      d.computeVertexNormals(); return d;
    };
    const big = ribbed(72, 28), small = ribbed(32, 12), tube = new T.CylinderGeometry(1, 1, 1, 40);
    const put = (geo, m, s, p) => { const me = new T.Mesh(geo, m); me.scale.set(...s); me.position.set(...p); g.add(me); return me; };
    put(tube, hallM, [44, 11, 44], [0, 5.5, 0]); put(tube, plain, [44.6, 0.9, 44.6], [0, 11.3, 0]);
    put(tube, drumM, [31, 8, 31], [0, 15.6, 0]); put(big, tileM, [30.5, 25, 30.5], [0, 19.4, 0]);
    put(G.sph, gold, [1.6, 1.6, 1.6], [0, 45.4, 0]); put(G.cone, gold, [0.7, 5, 0.7], [0, 49, 0]);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.39, x = Math.cos(a) * 37.5, z = Math.sin(a) * 37.5; put(tube, plain, [5.2, 2.4, 5.2], [x, 12.6, z]); put(small, tileM, [5.4, 4.6, 5.4], [x, 13.7, z]); }
    // outer ring of low domed halls
    const lowHall = lit({ map: arcade(4, false) });
    for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14 + 0.11, x = Math.cos(a) * 54, z = Math.sin(a) * 54; put(tube, lowHall, [7, 6, 7], [x, 3, z]); put(small, tileM, [6.6, 5, 6.6], [x, 6, z]); }
    scene.add(g);
  }

  /* ---------- people ---------- */
  // A standing townsperson baked into k, facing +Z. opt: { cloth, woman, noRight, noLimbs }
  function person(k, ox, oz, opt = {}) {
    const cloth = opt.cloth || pick(CLOTH), skin = pick(SKIN), woman = opt.woman == null ? Math.random() < 0.45 : opt.woman, dark = "#2B2F3A";
    if (woman) {
      k.add(G.taper, cloth, [0.27, 1.26, 0.22], [ox, 0.71, oz]).add(G.lo, cloth, [0.2, 0.1, 0.14], [ox, 1.36, oz]);
    } else {
      if (!opt.noLimbs) for (const x of [-0.09, 0.09]) k.add(cap(0.075, 0.62), dark, [1, 1, 1], [ox + x, 0.42, oz]).add(G.lo, "#1E1E24", [0.075, 0.045, 0.13], [ox + x, 0.045, oz + 0.04]);
      k.add(G.lo, dark, [0.18, 0.12, 0.13], [ox, 0.86, oz]).add(G.cyl, cloth, [0.185, 0.5, 0.125], [ox, 1.13, oz]).add(G.lo, cloth, [0.225, 0.1, 0.14], [ox, 1.37, oz]);
    }
    if (!opt.noLimbs) for (const x of [-1, 1]) {
      if (x < 0 && opt.noRight) continue;
      k.add(cap(0.045, 0.46), cloth, [1, 1, 1], [ox + x * 0.255, 1.1, oz]).add(G.lo, skin, [0.042, 0.055, 0.035], [ox + x * 0.255, 0.8, oz]);
    }
    k.add(G.cyl, skin, [0.05, 0.1, 0.05], [ox, 1.46, oz]).add(G.lo, skin, [0.112, 0.138, 0.122], [ox, 1.62, oz]).add(G.lo, skin, [0.018, 0.024, 0.02], [ox, 1.6, oz + 0.122]);
    if (woman) { const sc = pick(["#F4D35E", "#E63946", "#FFFFFF", "#2A9D8F", "#F28C28"]); k.add(G.lo, sc, [0.128, 0.15, 0.135], [ox, 1.645, oz - 0.03]).add(G.lo, sc, [0.1, 0.16, 0.07], [ox, 1.5, oz - 0.09]); }
    else if (Math.random() < 0.6) k.add(G.cyl, "#1D1D22", [0.118, 0.06, 0.118], [ox, 1.76, oz]);
    else k.add(G.half, pick(["#1F1A17", "#3A2A1E", "#8C8C8C"]), [0.12, 0.14, 0.13], [ox, 1.63, oz - 0.012], [-0.35, 0, 0]);
    return { cloth, skin, woman };
  }

  // Articulated human (the runner, the guard): every bone is one baked mesh. Faces -Z.
  function human(o) {
    const g = new T.Group(), pivot = new T.Group(), body = new T.Group(), head = new T.Group();
    g.add(pivot); pivot.add(body); pivot.position.y = 0.83;
    const bone = (k, parent) => { const m = mesh(k.geo(), S.rigMat); parent.add(m); return m; };
    let k = baker();
    k.add(G.lo, o.legs, [0.178, 0.125, 0.128], [0, 0, 0]).add(cap(0.165, 0.27), o.top, [1.12, 1, 0.76], [0, 0.31, 0]).add(G.lo, o.top, [0.238, 0.12, 0.15], [0, 0.5, 0]).add(G.cyl, o.skin, [0.052, 0.12, 0.052], [0, 0.66, 0]);
    if (o.bag) {
      k.add(G.box, o.bag, [0.3, 0.4, 0.15], [0, 0.34, 0.2]).add(G.box, "#C98A12", [0.2, 0.15, 0.03], [0, 0.26, 0.29]).add(G.lo, o.top, [0.16, 0.085, 0.1], [0, 0.61, 0.08]);
      for (const x of [-0.13, 0.13]) k.add(G.box, o.bag, [0.045, 0.46, 0.03], [x, 0.37, -0.128]);
    }
    if (o.vest) k.add(G.box, o.vest, [0.39, 0.06, 0.27], [0, 0.42, 0]).add(G.box, o.vest, [0.39, 0.06, 0.27], [0, 0.2, 0]);
    bone(k, body);
    head.position.set(0, 0.72, 0); body.add(head);
    k = baker();
    k.add(G.sph, o.skin, [0.122, 0.148, 0.132], [0, 0.11, 0]).add(G.lo, o.skin, [0.098, 0.09, 0.105], [0, 0.035, -0.022]).add(G.lo, o.skin, [0.02, 0.026, 0.024], [0, 0.085, -0.134]);
    for (const x of [-1, 1]) {
      k.add(G.lo, o.skin, [0.022, 0.035, 0.02], [x * 0.122, 0.1, 0.005]).add(G.lo, "#FFFFFF", [0.026, 0.02, 0.012], [x * 0.047, 0.125, -0.118]);
      k.add(G.lo, "#1B1B22", [0.013, 0.014, 0.008], [x * 0.047, 0.124, -0.128]).add(G.box, o.hair, [0.045, 0.008, 0.01], [x * 0.047, 0.158, -0.122]);
    }
    k.add(G.box, "#8A3B3B", [0.05, 0.008, 0.008], [0, 0.045, -0.118]);
    k.add(G.half, o.hair, [0.13, 0.15, 0.14], [0, 0.125, 0.012], [0.38, 0, 0]).add(G.lo, o.hair, [0.11, 0.035, 0.05], [0.01, 0.235, -0.085]);
    if (o.cap) k.add(G.cyl, o.cap, [0.132, 0.075, 0.132], [0, 0.27, 0]).add(G.box, "#15171B", [0.2, 0.014, 0.12], [0, 0.238, -0.15]).add(G.box, "#E6B84C", [0.06, 0.04, 0.01], [0, 0.275, -0.132]);
    bone(k, head);
    const limb = (x, y, r1, l1, c1, r2, l2, c2, end) => {
      const a = new T.Group(), b = new T.Group(); a.position.set(x, y, 0); body.add(a);
      let k = baker(); k.add(cap(r1, l1), c1, [1, 1, 1], [0, -(l1 / 2 + r1), 0]); bone(k, a);
      b.position.y = -(l1 + r1 * 2) + 0.025; a.add(b);
      k = baker(); k.add(cap(r2, l2), c2, [1, 1, 1], [0, -(l2 / 2 + r2), 0]); end(k, -(l2 + r2 * 2)); bone(k, b);
      return [a, b];
    };
    const hand = (k, y) => k.add(G.lo, o.skin, [0.043, 0.058, 0.032], [0, y + 0.012, 0]).add(G.lo, o.skin, [0.015, 0.028, 0.015], [0, y + 0.03, -0.034]);
    const foot = (k, y) => k.add(G.lo, o.shoe, [0.064, 0.052, 0.135], [0, y + 0.04, -0.055]).add(G.box, "#DADCE2", [0.112, 0.024, 0.255], [0, y + 0.006, -0.055]).add(G.box, o.accent || o.shoe, [0.118, 0.022, 0.06], [0, y + 0.05, -0.08]);
    const [sL, eL] = limb(-0.255, 0.5, 0.052, 0.19, o.top, 0.044, 0.18, o.top, hand), [sR, eR] = limb(0.255, 0.5, 0.052, 0.19, o.top, 0.044, 0.18, o.top, hand);
    const [hL, kL] = limb(-0.095, -0.03, 0.082, 0.25, o.legs, 0.064, 0.27, o.legs, foot), [hR, kR] = limb(0.095, -0.03, 0.082, 0.25, o.legs, 0.064, 0.27, o.legs, foot);
    g.scale.setScalar(0.96);
    return { g, pivot, body, head, sL, eL, sR, eR, hL, kL, hR, kR, phase: 0, yaw: 0, tilt: 0 };
  }

  // The first runner of the 3D game, kept as it was: a hooded kid with a big round head and a yellow backpack.
  // Same joints as human(), so every animation drives him.
  function firstRunner(theme) {
    const g = new T.Group(), pivot = new T.Group(), body = new T.Group(), head = new T.Group();
    const HIP0 = 0.93;
    g.add(pivot); pivot.add(body); pivot.position.y = HIP0;
    const bone = (k, parent) => { const m = mesh(k.geo(), S.rigMat); parent.add(m); return m; };
    const pants = "#232B40", skin = "#E7B08A", hair = "#1F1A17", shoe = "#F5F6F8", dark = "#14161C";
    let k = baker();
    k.add(cap(0.25, 0.42), theme, [1.14, 1, 0.84], [0, 0.44, 0]).add(G.box, "#FFB020", [0.42, 0.5, 0.2], [0, 0.5, 0.27]).add(G.box, dark, [0.26, 0.2, 0.02], [0, 0.5, 0.375]);
    bone(k, body);
    head.position.set(0, 1.0, 0); body.add(head);
    k = baker();
    k.add(G.sph, skin, [0.2, 0.215, 0.2], [0, 0, 0]).add(G.half, hair, [0.213, 0.225, 0.213], [0, 0.015, 0.012], [0.42, 0, 0]);
    for (const x of [-0.075, 0.075]) k.add(G.sph, dark, [0.027, 0.034, 0.02], [x, 0.02, -0.185]);
    bone(k, head);
    const limb = (x, y, r1, l1, r2, l2, c, end) => {
      const a = new T.Group(), b = new T.Group(); a.position.set(x, y, 0); body.add(a);
      let k = baker(); k.add(cap(r1, l1), c, [1, 1, 1], [0, -(l1 / 2 + r1), 0]); bone(k, a);
      b.position.y = -(l1 + r1 * 2) + 0.03; a.add(b);
      k = baker(); k.add(cap(r2, l2), c, [1, 1, 1], [0, -(l2 / 2 + r2), 0]); end(k, -(l2 + r2 * 2)); bone(k, b);
      return [a, b];
    };
    const hand = (k, y) => k.add(G.sph, skin, [0.075, 0.085, 0.075], [0, y + 0.02, 0]);
    const foot = (k, y) => k.add(G.box, shoe, [0.17, 0.12, 0.34], [0, y + 0.03, -0.06]);
    const [sL, eL] = limb(-0.37, 0.78, 0.075, 0.2, 0.068, 0.2, theme, hand), [sR, eR] = limb(0.37, 0.78, 0.075, 0.2, 0.068, 0.2, theme, hand);
    const [hL, kL] = limb(-0.14, 0.02, 0.105, 0.24, 0.088, 0.24, pants, foot), [hR, kR] = limb(0.14, 0.02, 0.105, 0.24, 0.088, 0.24, pants, foot);
    g.scale.setScalar(0.92);
    return { g, pivot, body, head, sL, eL, sR, eR, hL, kL, hR, kR, phase: 0, yaw: 0, tilt: 0, hip: HIP0, reach: 1.1 };
  }

  /* ---------- bazaar props ---------- */
  const GOODS = [
    (k) => { for (let j = 0; j < 4; j++) k.add(G.lo, FRUIT[j], [0.34, 0.24, 0.42], [-1.08 + j * 0.72, 1.02, 0.02]); for (const x of [-0.9, 0.9]) k.add(G.box, "#B98A52", [0.8, 0.42, 0.55], [x, 0.21, 1.0]).add(G.lo, FRUIT[x > 0 ? 1 : 3], [0.34, 0.18, 0.22], [x, 0.46, 1.0]); },
    (k) => { for (let j = 0; j < 5; j++) for (let n = 0; n < 3 + (j % 2); n++) k.add(G.cyl, n % 2 ? "#E2A85C" : "#D9964A", [0.2, 0.05, 0.2], [-1.1 + j * 0.55, 0.985 + n * 0.055, rnd(-0.1, 0.15)]); },
    (k) => { const c = ["#D62828", "#F4A300", "#F2D03B", "#7CB342", "#8D5524", "#E76F51"]; for (let j = 0; j < 6; j++) k.add(G.cyl, "#B08D57", [0.2, 0.08, 0.2], [-1.15 + j * 0.46, 0.99, 0.1]).add(G.cone, c[j], [0.17, 0.3, 0.17], [-1.15 + j * 0.46, 1.17, 0.1]); },
    (k) => { const c = ["#C81D25", "#F2C14E", "#0B7A75", "#7B2D8E", "#F28C28", "#2E6FD8"]; for (let j = 0; j < 6; j++) k.add(G.cyl, c[j], [0.11, 1.1, 0.11], [-1.15 + j * 0.46, 1.07, 0.05 + (j % 2) * 0.22], [Math.PI / 2, 0, 0]); for (let j = 0; j < 5; j++) k.add(G.box, c[(j + 2) % 6], [0.36, 1.1, 0.03], [-0.9 + j * 0.45, 1.75, -0.7]); },
    (k) => { for (let j = 0; j < 5; j++) k.add(G.cyl, j % 2 ? "#1F6FB5" : "#F4F1E6", [0.24, 0.03, 0.24], [-1.05 + j * 0.52, 1.2, -0.25], [1.25, 0, 0]).add(G.lo, j % 2 ? "#F4F1E6" : "#2A8BC9", [0.15, 0.11, 0.15], [-1.05 + j * 0.52, 1.02, 0.3]); },
    (k) => { for (let j = 0; j < 7; j++) k.add(G.lo, j % 3 ? "#E9C440" : "#2F7D32", [0.3, 0.22, 0.22], [-1.1 + (j % 4) * 0.72 + (j > 3 ? 0.35 : 0), j > 3 ? 1.3 : 1.08, rnd(-0.1, 0.1)], [0, rnd(0, 3), 0]); },
    (k) => { const c = ["#7B4B2A", "#E08E2B", "#2B2B2B", "#C9A66B", "#8E1F2F"]; for (let j = 0; j < 5; j++) k.add(G.box, "#C9B38A", [0.5, 0.06, 0.9], [-1.1 + j * 0.55, 0.985, 0.05]).add(G.lo, c[j], [0.22, 0.1, 0.4], [-1.1 + j * 0.55, 1.03, 0.05]); },
    (k) => { k.add(G.box, "#8A5E36", [2.8, 0.05, 0.4], [0, 1.18, -0.3]); for (let j = 0; j < 10; j++) k.add(G.cyl, j % 3 ? "#1D1D22" : "#F2F2F2", [0.12, 0.07, 0.12], [-1.15 + (j % 5) * 0.57, 1.0 + (j > 4 ? 0.22 : 0), j > 4 ? -0.3 : 0.2]); },
  ];
  function stallGeo(i) {
    const k = baker(), aw = pick(AWN), aw2 = Math.random() < 0.7 ? "#FFFFFF" : pick(AWN), umb = i % 4 === 3, sx = rnd(-0.6, 0.6);
    k.add(G.box, pick(["#9A6B3F", "#8A5E36", "#A77B4B"]), [2.9, 0.9, 1.25], [0, 0.45, 0]).add(G.box, pick(["#F7F3E8", "#EBD9B4", "#DDE8F0"]), [3.0, 0.05, 1.35], [0, 0.93, 0]);
    GOODS[i % 8](k);
    if (umb) k.add(G.cyl, "#5E4630", [0.045, 3.1, 0.045], [0, 1.55, -0.2]).add(G.cone, aw, [2.3, 0.7, 2.3], [0, 3.2, -0.2]).add(G.lo, "#FFFFFF", [0.09, 0.09, 0.09], [0, 3.58, -0.2]);
    else {
      for (const x of [-1.45, 1.45]) for (const z of [-0.75, 1.0]) k.add(G.box, "#5E4630", [0.07, 2.55, 0.07], [x, 1.275, z]);
      for (let j = 0; j < 8; j++) k.add(G.box, j % 2 ? aw2 : aw, [0.42, 0.07, 2.4], [-1.47 + j * 0.42, 2.58, 0.15], [0.17, 0, 0]);
      k.add(G.box, aw, [3.36, 0.3, 0.05], [0, 2.25, 1.33]);
    }
    person(k, sx, -1.1, { cloth: SHIRT[i % 3], noRight: true });
    const g = k.geo(); Object.assign(g.userData, { sx, shirt: i % 3, umb }); return g;
  }
  function treeGeo(kind) {
    const k = baker(), bark = pick(["#6B4A2E", "#5C4030", "#7A5A3C", "#8A6B4A"]);
    const greens = pick([["#4E9A3C", "#5BAA46", "#3F8A33"], ["#5E9E3A", "#73B04A", "#4A8A30"], ["#3F8F4A", "#56A55C", "#2F7A3C"], ["#6FA343", "#86B755", "#57902F"]]);
    const branch = (h, n) => { for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), l = rnd(1.1, 1.8); k.add(G.taper, bark, [0.12, l, 0.12], [Math.cos(a) * 0.42, h + l * 0.3, Math.sin(a) * 0.42], [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6]); } };
    if (kind === "chinor") {            // big plane tree: thick trunk, wide irregular crown
      const h = rnd(2.6, 3.6); k.add(G.taper, bark, [0.36, h, 0.36], [0, h / 2, 0]); branch(h, 3);
      for (let i = 0, n = 6 + Math.floor(rnd(0, 4)); i < n; i++) { const a = rnd(0, 6.28), d = rnd(0, 1.6), r = rnd(1.0, 1.75); k.blob(G.ico, pick(greens), [r, r * rnd(0.7, 0.9), r], [Math.cos(a) * d, h + rnd(0.7, 2.5), Math.sin(a) * d]); }
    } else if (kind === "tut" || kind === "gilos" || kind === "olma") {   // small round fruit trees
      const h = rnd(1.6, 2.2), cols = kind === "gilos" ? ["#F8C8DC", "#FBE3EC", "#F2A7C3"] : greens;
      k.add(G.taper, bark, [0.2, h, 0.2], [0, h / 2, 0]); branch(h - 0.3, 2);
      for (let i = 0; i < 5; i++) { const a = rnd(0, 6.28), d = rnd(0, 0.8), r = rnd(0.85, 1.25); k.blob(G.ico, pick(cols), [r, r * 0.85, r], [Math.cos(a) * d, h + rnd(0.5, 1.4), Math.sin(a) * d]); }
      if (kind === "olma") for (let i = 0; i < 12; i++) { const a = rnd(0, 6.28), e = rnd(-0.2, 0.9); k.add(G.lo, pick(["#D7372F", "#E85D3A"]), [0.09, 0.09, 0.09], [Math.cos(a) * Math.cos(e) * 1.5, h + 0.9 + Math.sin(e) * 1.1, Math.sin(a) * Math.cos(e) * 1.5]); }
    } else if (kind === "terak") {      // tall narrow poplar
      const h = rnd(1.8, 2.6), n = 5; k.add(G.cyl, bark, [0.17, h + 1, 0.17], [0, (h + 1) / 2, 0]);
      for (let i = 0; i < n; i++) { const r = 1.0 - i * 0.15; k.blob(G.ico, pick(greens), [r * 0.85, 1.25, r * 0.85], [rnd(-0.12, 0.12), h + 0.6 + i * 1.35, rnd(-0.12, 0.12)], 0.16); }
    } else if (kind === "archa") {      // conifer in stacked tiers
      const h = rnd(0.7, 1.1), cols = ["#2F6B45", "#3A7D50", "#285C3B"]; k.add(G.cyl, bark, [0.16, h + 0.6, 0.16], [0, (h + 0.6) / 2, 0]);
      for (let i = 0; i < 4; i++) { const r = 1.5 - i * 0.32; k.blob(G.cone, pick(cols), [r, 1.9, r], [0, h + 1.0 + i * 1.15, 0], 0.09, 0.08); }
    } else {                            // willow: round crown with hanging strands
      const h = rnd(2.4, 3.0), cols = ["#8FBF4A", "#A3CC5E", "#7DAE3E"]; k.add(G.taper, bark, [0.3, h, 0.3], [0, h / 2, 0]); branch(h, 2);
      k.blob(G.ico, cols[0], [2.0, 1.25, 2.0], [0, h + 1.1, 0]); k.blob(G.ico, cols[1], [1.4, 1.0, 1.4], [0.4, h + 1.7, -0.3]);
      for (let i = 0; i < 18; i++) { const a = i * 0.35 + rnd(0, 0.2), l = rnd(1.5, 2.6), d = rnd(1.4, 1.9); k.add(G.box, pick(cols), [0.1, l, 0.1], [Math.cos(a) * d, h + 1.0 - l / 2, Math.sin(a) * d]); }
    }
    return k.geo();
  }

  function props() {
    S.stallGeos = [...Array(8)].map((_, i) => stallGeo(i));
    S.armGeos = SHIRT.map((c) => baker().add(cap(0.045, 0.46), c, [1, 1, 1], [0, -0.275, 0]).add(G.lo, "#E0AB80", [0.045, 0.06, 0.036], [0, -0.58, 0]).geo());
    S.bubbleMats = CALLS.map((t) => new T.SpriteMaterial({
      map: tex(256, 96, (c) => {
        c.fillStyle = "#FFFFFF"; rr(c, 6, 6, 244, 66, 22); c.fill(); c.beginPath(); c.moveTo(110, 70); c.lineTo(128, 92); c.lineTo(146, 70); c.fill();
        c.fillStyle = "#121829"; c.font = "700 30px Inter, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, 128, 40);
      }), transparent: true, depthWrite: false,
    }));
    S.frontTrees = ["chinor", "chinor", "tut", "gilos", "olma", "majnuntol", "tut"].map(treeGeo);
    S.backTrees = ["terak", "terak", "archa", "archa", "chinor", "terak"].map(treeGeo);
    S.groups = [...Array(4)].map((_, i) => { const k = baker(); person(k, -0.35, 0); person(k, 0.35, 0.15); if (i % 2) person(k, 0, -0.6); return k.geo(); });
    S.lampGeo = (() => {
      const k = baker(); k.add(G.cyl, "#2F3542", [0.07, 4.4, 0.07], [0, 2.2, 0]).add(G.box, "#2F3542", [0.95, 0.07, 0.07], [0.42, 4.36, 0]).add(G.box, "#2F3542", [0.36, 0.1, 0.22], [0.82, 4.4, 0]);
      k.add(G.box, "#7A5A3A", [0.7, 0.24, 1.7], [0.15, 0.12, 1.6]);
      for (let i = 0; i < 6; i++) k.add(G.lo, pick(["#E63946", "#F4D35E", "#FF8FAB", "#FFFFFF"]), [0.13, 0.13, 0.13], [rnd(-0.05, 0.35), 0.34, 0.95 + i * 0.26]);
      for (let i = 0; i < 4; i++) k.blob(G.ico1, "#4E9A3C", [0.22, 0.16, 0.26], [rnd(0, 0.3), 0.27, 1.0 + i * 0.4]);
      return k.geo();
    })();
    S.lampMat = new T.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd28a, emissiveIntensity: 0 });
    S.headMat = new T.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xffe9b0, emissiveIntensity: 0 });
    S.glowMat = new T.SpriteMaterial({ map: tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,225,160,1)"); r.addColorStop(1, "rgba(255,225,160,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    // house fronts: windows, a door and a shop sign painted on a texture; windows light up at night
    const SHOPS = [["NON", "#B5542B"], ["CHOYXONA", "#1B7A5A"], ["DORIXONA", "#2E6FD8"], ["KITOBLAR", "#7B2D8E"], ["ATLAS", "#C81D25"], ["SOVG'ALAR", "#D68910"], ["", ""], ["", ""]];
    ["#E9D9BC", "#F1E7D6", "#D9B99A", "#CFE0EA", "#E6CFC0", "#DDE5D2", "#F0E0B8", "#D8D2E6"].forEach((wall, n) => {
      const lit = [...Array(6)].map(() => Math.random() < 0.7), [shop, sc] = SHOPS[n];
      const paint = (night) => (g, w, h) => {
        g.fillStyle = night ? "#000" : wall; g.fillRect(0, 0, w, h);
        if (!night) { g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, h - 24, w, 24); }
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
          const x = 24 + c * 78, y = 30 + r * 100, door = r === 1 && c === 1;
          if (night) { if (!door && lit[r * 3 + c]) { g.fillStyle = "#FFD98A"; g.fillRect(x, y, 52, 68); } continue; }
          g.fillStyle = "#F7F3EA"; g.fillRect(x - 5, y - 5, 62, door ? 136 : 78);
          g.fillStyle = door ? "#7A4F2E" : "#3D5A7A"; g.fillRect(x, y, 52, door ? 126 : 68);
          if (!door) { g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x, y, 52, 20); g.fillStyle = "#F7F3EA"; g.fillRect(x + 24, y, 4, 68); }
        }
        if (shop) {
          g.fillStyle = night ? "#55401a" : sc; g.fillRect(14, 106, 228, 22);
          g.fillStyle = night ? "#FFE9B0" : "#FFFFFF"; g.font = "800 17px Inter, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
          g.save(); g.translate(128, 118); g.scale(0.62, 1); g.fillText(shop, 0, 0); g.restore();
        }
      };
      const mat = new T.MeshStandardMaterial({ map: tex(256, 256, paint(false)), emissiveMap: tex(256, 256, paint(true)), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 });
      S.facades.push({ mat, wall, roof: pick(["#8C6A52", "#7A5B48", "#9B7B63", "#6F6259"]) });
    });
    // street gate with a sign; the text changes each time it comes round
    const gk = baker();
    for (const x of [-4.75, 4.75]) gk.add(G.box, "#E7D8B8", [0.9, 6.6, 0.9], [x, 3.3, 0]).add(G.box, "#18A9C6", [0.96, 0.5, 0.96], [x, 5.2, 0]).add(G.box, "#C9B48C", [1.1, 0.4, 1.1], [x, 0.2, 0]).add(G.half, "#18A9C6", [0.62, 0.8, 0.62], [x, 7.55, 0]);
    gk.add(G.box, "#E7D8B8", [10.6, 1.9, 0.8], [0, 6.55, 0]).add(G.box, "#18A9C6", [10.7, 0.16, 0.86], [0, 5.6, 0]).add(G.box, "#18A9C6", [10.7, 0.16, 0.86], [0, 7.5, 0]);
    S.gateGeo = gk.geo();
    S.gateMats = ["USTOZ AI", "XUSH KELIBSIZ"].map((t) => {
      const map = tex(512, 96, (c) => {
        const gr = c.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, "#0E5F9A"); gr.addColorStop(1, "#0A3F70"); c.fillStyle = gr; c.fillRect(0, 0, 512, 96);
        c.strokeStyle = "#F2D279"; c.lineWidth = 5; c.strokeRect(6, 6, 500, 84);
        c.fillStyle = "#FFE9A8"; c.font = "800 52px Inter, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, 256, 51);
      });
      const m = new T.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.6 }); S.signMats.push(m); return m;
    });
  }

  // The wall the runner is painting before the run starts. S.paint(p) reveals the picture from left to right.
  function introWall() {
    const theme = getComputedStyle(document.body).getPropertyValue("--p1").trim() || "#2748F5";
    const wall = new T.Group(), wk = baker();
    wk.add(G.box, "#EFE6D6", [0.3, 2.7, 5.2], [0, 1.35, 0]).add(G.box, "#C9B48C", [0.4, 0.14, 5.3], [0, 2.77, 0]).add(G.box, "#C9B48C", [0.36, 0.3, 5.3], [0, 0.15, 0]);
    wall.add(mesh(wk.geo(), S.prop));
    const cv = document.createElement("canvas"), art = document.createElement("canvas"); cv.width = art.width = 512; cv.height = art.height = 256;
    const pt = new T.CanvasTexture(cv); pt.colorSpace = T.SRGBColorSpace;
    const pm = new T.Mesh(G.plane, new T.MeshStandardMaterial({ map: pt, transparent: true, roughness: 0.9 }));
    pm.scale.set(4.4, 2.2, 1); pm.position.set(0.16, 1.45, 0); pm.rotation.y = Math.PI / 2; wall.add(pm);
    const draw = (img) => {
      const c = art.getContext("2d"); c.clearRect(0, 0, 512, 256);
      c.save(); rr(c, 30, 56, 144, 144, 34); c.clip();
      if (img) c.drawImage(img, 30, 56, 144, 144); else { c.fillStyle = "#171B26"; c.fillRect(30, 56, 144, 144); }
      c.restore();
      c.fillStyle = theme; c.font = "800 78px Inter, Arial, sans-serif"; c.textBaseline = "middle"; c.fillText("Ustoz AI", 190, 124);
      c.lineCap = "round"; c.strokeStyle = theme; c.lineWidth = 9; c.beginPath(); c.moveTo(194, 176); c.quadraticCurveTo(330, 196, 486, 170); c.stroke();
      c.lineWidth = 6; for (const [x, l] of [[214, 26], [298, 40], [372, 22], [452, 34]]) { c.beginPath(); c.moveTo(x, 182); c.lineTo(x, 182 + l); c.stroke(); }
    };
    S.paint = (p) => {
      const c = cv.getContext("2d"), w = Math.round(512 * p); c.clearRect(0, 0, 512, 256);
      if (w > 0) { c.save(); c.beginPath(); c.rect(0, 0, w, 256); c.clip(); c.drawImage(art, 0, 0); c.restore(); }
      pt.needsUpdate = true; S.paintP = p;
    };
    draw(null); S.paint(0);
    const img = new Image(); img.onload = () => { draw(img); S.paint(S.paintP || 0); }; img.src = "logo.png";
    wall.position.set(-3.55, 0, 0.2); scene.add(wall); S.wall = wall; S.theme = theme;
  }

  /* ---------- obstacles, vehicles, pickups ---------- */
  function vehicles() {
    const { box, lo, cyl, cone, frustum } = G, V = {};
    const wheels = (k, x, z, r) => { for (const sx of [-x, x]) for (const sz of [-z, z]) k.add(cyl, "#15171B", [r, 0.2, r], [sx, r, sz], [0, 0, Math.PI / 2]).add(cyl, "#B9BEC8", [r * 0.5, 0.21, r * 0.5], [sx, r, sz], [0, 0, Math.PI / 2]); };
    V.barrier = (() => {
      const k = baker();
      for (const x of [-0.82, 0.82]) k.add(box, "#3A3F4B", [0.09, 0.95, 0.09], [x, 0.475, 0]).add(box, "#3A3F4B", [0.5, 0.07, 0.5], [x, 0.035, 0]).add(lo, "#FFB703", [0.09, 0.09, 0.09], [x, 1.02, 0]);
      for (const [r, y] of [[0, 0.79], [1, 0.55], [2, 0.31]]) for (let i = 0; i < 6; i++) k.add(box, (i + r) % 2 ? "#FFFFFF" : "#E5383B", [0.31, 0.24, 0.07], [-0.775 + i * 0.31, y, 0]);
      return k.geo();
    })();
    V.crates = (() => {
      const k = baker();
      for (const x of [-0.47, 0.47]) k.add(box, "#B98A52", [0.86, 0.5, 0.62], [x, 0.25, 0]).add(box, "#8F6436", [0.88, 0.06, 0.64], [x, 0.5, 0]).add(lo, x < 0 ? "#F4902C" : "#D7372F", [0.38, 0.22, 0.27], [x, 0.56, 0]);
      return k.add(lo, "#F4902C", [0.11, 0.11, 0.11], [0.05, 0.11, 0.5]).add(lo, "#D7372F", [0.11, 0.11, 0.11], [-0.5, 0.11, 0.48]).geo();
    })();
    V.melons = (() => {
      const k = baker();
      for (const [x, y, z, c] of [[-0.48, 0.34, 0, "#2F7D32"], [0.5, 0.34, 0.05, "#3E9142"], [0, 0.34, 0.3, "#256B2A"], [0.02, 0.84, 0.1, "#3E9142"]]) k.add(lo, c, [0.36, 0.34, 0.36], [x, y, z]);
      return k.add(lo, "#E5484D", [0.26, 0.05, 0.26], [0.85, 0.06, 0.4]).add(lo, "#256B2A", [0.28, 0.14, 0.28], [0.85, 0.02, 0.4]).geo();
    })();
    V.teleshka = (() => {          // hand trolley loaded with sacks
      const k = baker(); k.add(box, "#3F6FB0", [1.3, 0.1, 1.0], [0, 0.32, 0]); wheels(k, 0.55, 0.38, 0.13);
      for (const x of [-0.58, 0.58]) k.add(box, "#2B4F86", [0.05, 0.8, 0.05], [x, 0.74, -0.46]);
      k.add(box, "#2B4F86", [1.2, 0.05, 0.05], [0, 1.12, -0.46]);
      for (const [x, y, z] of [[-0.25, 0.5, 0.05], [0.3, 0.5, 0.1], [0.02, 0.8, 0.05]]) k.add(lo, pick(["#D9C7A3", "#CDB98F"]), [0.46, 0.2, 0.36], [x, y, z]);
      return k.geo();
    })();
    V.banner = [["#C81D25", "#F2C14E", "#0B7A75", "#F7F3E3", "#7B2D8E", "#F28C28"], ["#1F6FB5", "#F4F1E6", "#C81D25", "#F2C14E", "#1F6FB5", "#F4F1E6"]].map((ik) => {
      const k = baker();
      for (const x of [-0.92, 0.92]) k.add(cyl, "#6B4A2B", [0.06, 2.85, 0.06], [x, 1.425, 0]);
      k.add(box, "#6B4A2B", [1.95, 0.08, 0.08], [0, 2.8, 0]).add(box, "#E9B949", [1.8, 0.07, 0.04], [0, 1.31, 0]);
      for (let i = 0; i < 9; i++) k.add(box, ik[i % 6], [0.2, 1.42, 0.03], [-0.8 + i * 0.2, 2.05, 0]);
      return k.geo();
    });
    V.damas = [["#F4F5F7", "#FFC400"], ["#DCE9F5", "#2E6FD8"]].map(([wh, st]) => {
      const k = baker(), gl = "#22303F", dk = "#2B2F36";
      k.add(box, wh, [1.6, 0.9, 3.1], [0, 0.8, 0]).add(box, wh, [1.5, 0.62, 2.5], [0, 1.56, -0.15]);
      k.add(box, gl, [1.34, 0.46, 0.05], [0, 1.56, 1.11]).add(box, gl, [1.52, 0.36, 2.0], [0, 1.6, -0.2]).add(box, gl, [1.3, 0.4, 0.05], [0, 1.58, -1.41]);
      k.add(box, st, [1.62, 0.1, 3.12], [0, 0.62, 0]).add(box, dk, [1.62, 0.2, 0.12], [0, 0.42, 1.55]).add(box, dk, [1.62, 0.2, 0.12], [0, 0.42, -1.55]).add(box, dk, [0.8, 0.16, 0.05], [0, 0.86, 1.56]).add(box, "#FFFFFF", [0.4, 0.1, 0.02], [0, 0.5, 1.62]);
      wheels(k, 0.8, 1.0, 0.3);
      return k.add(box, "#FFC400", [0.46, 0.14, 0.2], [0, 1.94, 0.4]).geo();
    });
    V.sedan = ["#F2F3F5", "#B9C0C9", "#23262C", "#2E5FA8", "#A8322E"].map((c) => {
      const k = baker(), gl = "#1E2A38", dk = "#23262C";
      k.add(box, c, [1.62, 0.55, 4.1], [0, 0.62, 0]).add(frustum, gl, [1.08, 0.48, 1.75], [0, 1.13, -0.15]).add(box, c, [1.14, 0.06, 1.38], [0, 1.385, -0.15]);
      k.add(box, dk, [1.66, 0.2, 0.14], [0, 0.42, 2.03]).add(box, dk, [1.66, 0.2, 0.14], [0, 0.42, -2.03]).add(box, dk, [0.9, 0.14, 0.05], [0, 0.66, 2.06]).add(box, "#FFFFFF", [0.42, 0.11, 0.02], [0, 0.46, 2.11]);
      for (const x of [-0.86, 0.86]) k.add(box, c, [0.1, 0.07, 0.07], [x, 0.98, 0.8]);
      for (const x of [-0.6, 0.6]) k.add(box, "#C62828", [0.3, 0.1, 0.04], [x, 0.74, -2.06]);
      wheels(k, 0.8, 1.3, 0.31);
      return k.geo();
    });
    V.lightsDamas = baker().add(box, "#FFFFFF", [0.3, 0.14, 0.05], [-0.55, 0.86, 1.57]).add(box, "#FFFFFF", [0.3, 0.14, 0.05], [0.55, 0.86, 1.57]).geo();
    S.lightsDamas = V.lightsDamas;
    V.lightsSedan = baker().add(box, "#FFFFFF", [0.34, 0.12, 0.05], [-0.58, 0.72, 2.06]).add(box, "#FFFFFF", [0.34, 0.12, 0.05], [0.58, 0.72, 2.06]).geo();
    V.cart = (() => {
      const k = baker(), wd = "#A9773F", dk = "#4A3423";
      k.add(box, wd, [1.5, 0.14, 2.2], [0, 0.74, 0]);
      for (const x of [-0.72, 0.72]) k.add(box, wd, [0.08, 0.3, 2.2], [x, 0.95, 0]).add(cyl, dk, [0.52, 0.1, 0.52], [x * 1.17, 0.52, -0.1], [0, 0, Math.PI / 2]).add(box, wd, [0.07, 0.07, 1.1], [x * 0.76, 0.8, 1.55]).add(box, dk, [0.08, 0.62, 0.08], [x * 0.76, 0.31, 1.0]);
      for (const [x, y, z] of [[-0.3, 1.12, 0.5], [0.32, 1.12, -0.4], [-0.2, 1.12, -0.75], [0.05, 1.55, 0]]) k.add(lo, "#D9C7A3", [0.62, 0.34, 0.5], [x, y, z]);
      for (const [x, z] of [[0.45, 0.6], [-0.5, -0.1], [0.1, 0.95]]) k.add(lo, "#2F7D32", [0.27, 0.27, 0.27], [x, 1.1, z]);
      return k.add(cyl, "#6B4A2B", [0.04, 1.5, 0.04], [0, 2.1, -0.2]).add(cone, "#E5383B", [1.25, 0.5, 1.25], [0, 2.95, -0.2]).add(lo, "#FFFFFF", [0.09, 0.09, 0.09], [0, 3.22, -0.2]).geo();
    })();
    V.meat = (() => {              // butcher's counter with meat hanging from a beam
      const k = baker();
      k.add(box, "#F4F4F0", [1.75, 0.95, 0.9], [0, 0.475, 0.15]).add(box, "#B5433A", [1.77, 0.12, 0.92], [0, 0.3, 0.15]).add(box, "#CFE3EE", [1.6, 0.34, 0.8], [0, 1.12, 0.15]);
      for (const x of [-0.5, 0, 0.5]) k.add(lo, pick(["#B5433A", "#C0564B"]), [0.2, 0.08, 0.22], [x, 1.02, 0.15]);
      for (const x of [-0.86, 0.86]) k.add(box, "#4A3423", [0.08, 2.7, 0.08], [x, 1.35, -0.35]);
      k.add(box, "#4A3423", [1.9, 0.08, 0.08], [0, 2.38, -0.35]);
      for (const x of [-0.5, 0, 0.5]) k.add(box, "#8C8C8C", [0.02, 0.22, 0.02], [x, 2.24, -0.35]).add(lo, pick(["#A63A32", "#B84A40", "#9C3029"]), [0.17, 0.42, 0.13], [x, 1.78, -0.35]).add(lo, "#F1D9C9", [0.08, 0.1, 0.06], [x, 2.08, -0.35]);
      for (let j = 0; j < 6; j++) k.add(box, j % 2 ? "#FFFFFF" : "#C62828", [0.33, 0.06, 1.7], [-0.82 + j * 0.33, 2.78, 0.1], [0.14, 0, 0]);
      return k.add(box, "#B5433A", [1.2, 0.3, 0.05], [0, 2.5, 0.92]).geo();
    })();
    V.ramp = (() => {              // plank ramp that leads up onto a car
      const k = baker(), a = Math.atan2(0.9, 3.4);
      k.add(box, "#B98A52", [1.7, 0.08, 3.52], [0, 0.45, 0], [a, 0, 0]);
      for (const z of [-1.2, -0.4, 0.4, 1.2]) k.add(box, "#8F6436", [1.72, 0.04, 0.1], [0, 0.5 - z * 0.265, z], [a, 0, 0]);
      for (const x of [-0.75, 0.75]) k.add(box, "#6B4A2B", [0.1, 0.86, 0.1], [x, 0.43, -1.6]).add(box, "#6B4A2B", [0.1, 0.44, 0.1], [x, 0.22, 0]);
      return k.geo();
    })();
    V.coin = new T.CylinderGeometry(0.3, 0.3, 0.07, 20).rotateX(Math.PI / 2);
    V.non = baker().add(cyl, "#E2A85C", [0.38, 0.1, 0.38], [0, 0, 0], [Math.PI / 2, 0, 0]).add(cyl, "#B77A35", [0.18, 0.13, 0.18], [0, 0, 0], [Math.PI / 2, 0, 0]).geo();
    V.samsa = baker().add(new T.ConeGeometry(1, 1, 3), "#D6913C", [0.42, 0.2, 0.42], [0, 0, 0], [Math.PI / 2, 0, 0]).add(lo, "#F3E3B8", [0.07, 0.07, 0.07], [0, 0.02, 0.1]).geo();
    S.coinMat = new T.MeshStandardMaterial({ color: 0xffc233, metalness: 0.3, roughness: 0.35, emissive: 0x7a4a00, emissiveIntensity: 0.55 });
    S.pickMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: 0x5a3300, emissiveIntensity: 0.4 });
    const ob = (geo, lights) => () => { const m = mesh(Array.isArray(geo) ? pick(geo) : geo, S.prop); if (lights) m.add(new T.Mesh(lights, S.headMat)); return m; };
    S.make = {
      barrier: ob(V.barrier), crates: ob(V.crates), melons: ob(V.melons), teleshka: ob(V.teleshka), banner: ob(V.banner), cart: ob(V.cart), meat: ob(V.meat), ramp: ob(V.ramp),
      damas: ob(V.damas, V.lightsDamas), sedan: ob(V.sedan, V.lightsSedan),
      coin: () => new T.Mesh(V.coin, S.coinMat), non: () => new T.Mesh(V.non, S.pickMat), samsa: () => new T.Mesh(V.samsa, S.pickMat),
    };
    // low = jump over, high = roll under, full = change lane, plat = can be run across (h gives the surface height along its length)
    S.defs = {
      barrier: { kind: "low", hd: 0.3 }, crates: { kind: "low", hd: 0.45 }, melons: { kind: "low", hd: 0.5 }, teleshka: { kind: "low", hd: 0.55 },
      banner: { kind: "high", hd: 0.3 }, damas: { kind: "plat", hd: 1.6, front: 1.95, clear: 1.2, h: () => 1.95 }, cart: { kind: "full", hd: 1.3, top: 2.3 }, meat: { kind: "full", hd: 0.8, top: 2.6 },
      sedan: { kind: "plat", hd: 2.1, front: 0.9, h: (u) => (u > 0.5 || u < -0.66 ? 0.9 : 1.41) },
      ramp: { kind: "ramp", hd: 1.7, front: 0, h: (u) => 0.9 * (1 - u) / 2 },
      wagon: { kind: "tube", hd: 6.8 }, wagonWall: { kind: "full", hd: 6.8, top: 99, wall: true },
      coin: { kind: "pick", hd: 0.3, val: 1 }, non: { kind: "pick", hd: 0.3, val: 5 }, samsa: { kind: "pick", hd: 0.3, val: 10 },
    };
  }

  /* ---------- placing the street ---------- */
  function populate() {
    const { SLOT, SLOTS, BACK } = S.C;
    const add = (o, x, z) => { o.position.x = x; o.position.z = z; scene.add(o); S.scn.push(o); return o; };
    const snowOn = (parent, g, s, p, r) => { const m = new T.Mesh(g, S.snowMat); m.scale.set(...s); m.position.set(...p); if (r) m.rotation.set(...r); m.visible = false; parent.add(m); S.snow.push(m); };
    const tree = (geo, x, z) => { const m = mesh(geo, S.prop), s = rnd(0.82, 1.25); m.scale.setScalar(s); m.rotation.y = rnd(0, 6.28); snowOn(m, G.ico1, [1.5, 0.45, 1.5], [0, geo.userData.top - 0.5, 0]); return add(m, x, z); };
    for (let i = 0; i < SLOTS; i++) for (const side of [-1, 1]) {
      const z = BACK - i * SLOT - (side > 0 ? SLOT * 0.5 : 0), r = Math.random();
      if (r < 0.62) {
        const geo = pick(S.stallGeos), u = geo.userData, m = mesh(geo, S.prop); m.rotation.y = -side * Math.PI / 2;
        if (u.umb) snowOn(m, G.cone, [2.34, 0.72, 2.34], [0, 3.23, -0.2]); else snowOn(m, G.box, [3.4, 0.1, 2.44], [0, 2.67, 0.15], [0.17, 0, 0]);
        const arm = mesh(S.armGeos[u.shirt], S.prop, false); arm.position.set(u.sx - 0.255, 1.36, -1.1); arm.rotation.z = -0.12; m.add(arm);
        const bub = new T.Sprite(pick(S.bubbleMats)); bub.scale.set(2.5, 0.94, 1); bub.position.set(u.sx, 3.75, 0.9); bub.visible = false; m.add(bub);
        m.userData = { arm, bub, side, calls: Math.random() < 0.15, k: 0, ph: rnd(0, 6), hi: false };
        add(m, side * 6.75, z); S.stalls.push(m);
      } else if (r < 0.88) S.frontTreeMeshes.push(tree(pick(S.frontTrees), side * rnd(6.3, 7.0), z));
      else { const m = mesh(pick(S.groups), S.prop); m.rotation.y = -side * rnd(0.6, 2.4); add(m, side * 5.9, z); }
      tree(pick(S.backTrees), side * rnd(10.1, 11), z - SLOT * 0.5);
      const f = pick(S.facades), w = rnd(8.2, 9.6), h = rnd(4.4, 7.6), hs = new T.Group(), hk = baker();
      hk.add(G.box, f.wall, [6, h, w], [0, h / 2, 0]).add(G.box, f.roof, [6.3, 0.25, w + 0.3], [0, h + 0.12, 0]);
      if (Math.random() < 0.4) hk.add(G.box, f.roof, [1.1, 0.9, 1.1], [side * 1.2, h + 0.65, rnd(-2.5, 2.5)]);
      hs.add(mesh(hk.geo(), S.prop, false));
      const fa = new T.Mesh(G.plane, f.mat); fa.scale.set(w, h, 1); fa.position.set(-side * 3.02, h / 2, 0); fa.rotation.y = -side * Math.PI / 2; hs.add(fa);
      snowOn(hs, G.box, [6.34, 0.22, w + 0.34], [0, h + 0.33, 0]);
      add(hs, side * 14.3, z);
      if (i % 3 === 0) {
        const l = mesh(S.lampGeo, S.prop); if (side > 0) l.rotation.y = Math.PI;
        const b = new T.Mesh(G.lo, S.lampMat); b.scale.setScalar(0.16); b.position.set(0.82, 4.3, 0); l.add(b);
        const gl = new T.Sprite(S.glowMat); gl.scale.set(3.4, 3.4, 1); gl.position.set(0.82, 4.25, 0); l.add(gl);
        add(l, side * 4.55, z - 3);
      }
    }
    const gate = new T.Group(); gate.add(mesh(S.gateGeo, S.prop));
    const sp = new T.Mesh(G.plane, S.gateMats[0]); sp.scale.set(8.6, 1.55, 1); sp.position.set(0, 6.55, 0.42); gate.add(sp);
    gate.userData = { gate: sp, n: 0 }; add(gate, 0, -75);
  }

  function actors() {
    S.P = firstRunner(S.theme);
    S.guard = human({ top: "#27364F", legs: "#1F2A3D", skin: "#D9A074", hair: "#1B1B1B", shoe: "#15171B", cap: "#27364F", vest: "#E6F03C" });
    S.guard.g.visible = false; scene.add(S.P.g, S.guard.g);
    // things the runner can hold in the right hand
    const held = (k) => { const m = mesh(k.geo(), S.rigMat); m.position.set(0, -0.37, -0.04); m.visible = false; S.P.eR.add(m); return m; };
    S.can = held(baker().add(G.cyl, "#D0D4DC", [0.035, 0.15, 0.035], [0, 0, 0]).add(G.cyl, S.theme, [0.02, 0.04, 0.02], [0, 0.09, 0]));
    S.bottle = held(baker().add(G.cyl, "#7FD3F7", [0.032, 0.18, 0.032], [0, 0, 0]).add(G.cyl, "#FFFFFF", [0.018, 0.04, 0.018], [0, 0.1, 0]));
    S.apple = held(baker().add(G.lo, "#D7372F", [0.05, 0.048, 0.05], [0, -0.01, -0.02]).add(G.lo, "#4E9A3C", [0.02, 0.008, 0.012], [0.01, 0.04, -0.02]));
    const bk = baker().add(G.box, "#C9A66B", [0.24, 0.28, 0.16], [0, 0, 0]);
    for (const [x, z] of [[-0.06, -0.03], [0.06, 0.03], [0, 0.05], [0.03, -0.05]]) bk.add(G.lo, "#D7372F", [0.055, 0.055, 0.055], [x, 0.16, z]);
    S.bag = mesh(bk.geo(), S.prop); S.bag.visible = false; scene.add(S.bag);
    // people walking along the sidewalks, with swinging arms and legs
    const limbs = new Map(), part = (color, len, foot) => { const key = color + len + foot; let g = limbs.get(key); if (!g) { const k = baker().add(cap(foot ? 0.075 : 0.045, len), color, [1, 1, 1], [0, -(len / 2 + 0.05), 0]); if (foot) k.add(G.lo, "#1E1E24", [0.075, 0.045, 0.13], [0, -len - 0.11, 0.04]); else k.add(G.lo, "#E0AB80", [0.042, 0.055, 0.035], [0, -len - 0.1, 0]); g = k.geo(); limbs.set(key, g); } return g; };
    for (let i = 0; i < 8; i++) {
      const k = baker(), look = person(k, 0, 0, { noLimbs: true }), g = new T.Group(), kid = i >= 6, side = i % 2 ? 1 : -1, d = Math.random() < 0.5 ? 1 : -1;
      if (kid) k.add(G.box, "#FFFFFF", [0.012, 1.1, 0.012], [0.3, 1.75, 0]).add(G.lo, pick(["#E63946", "#F4D35E", "#2E6FD8", "#8E44AD"]), [0.21, 0.25, 0.21], [0.3, 2.5, 0]);
      else if (Math.random() < 0.5) k.add(G.box, pick(["#C9A66B", "#3A6EA5", "#F2F2F2"]), [0.2, 0.26, 0.1], [0.3, 0.62, 0.02]);
      g.add(mesh(k.geo(), S.prop));
      const hang = (geo, x, y) => { const m = mesh(geo, S.prop); m.position.set(x, y, 0); g.add(m); return m; };
      const legs = look.woman ? [] : [hang(part("#2B2F3A", 0.62, true), -0.09, 0.84), hang(part("#2B2F3A", 0.62, true), 0.09, 0.84)];
      const arms = [hang(part(look.cloth, 0.46, false), -0.255, 1.36), hang(part(look.cloth, 0.46, false), 0.255, 1.36)];
      if (kid) g.scale.setScalar(0.68);
      g.position.set(side * rnd(4.4, 5.0), 0.07, S.C.BACK - rnd(0, S.C.LOOP)); g.rotation.y = d > 0 ? 0 : Math.PI;
      scene.add(g); S.walkers.push({ g, legs, arms, v: d * rnd(1.0, 1.6) * (kid ? 1.5 : 1), ph: rnd(0, 6) });
    }
    S.blob = new T.Mesh(new T.CircleGeometry(0.42, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    S.blob.rotation.x = -Math.PI / 2; scene.add(S.blob);
    S.dizzy = new T.Group();
    const og = new T.OctahedronGeometry(0.08), ym = new T.MeshBasicMaterial({ color: 0xffd23f });
    for (let i = 0; i < 5; i++) { const s = new T.Mesh(og, ym); s.position.set(Math.cos(i * 1.257) * 0.36, 0, Math.sin(i * 1.257) * 0.36); S.dizzy.add(s); }
    S.dizzy.visible = false; scene.add(S.dizzy);
  }

  function weather() {
    const dotT = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
    const rp = new Float32Array(420 * 6), fp = new Float32Array(520 * 3);
    for (let i = 0; i < rp.length; i += 6) { rp[i] = rnd(-13, 13); rp[i + 1] = rnd(0, 18); rp[i + 2] = rnd(-36, 9); }
    for (let i = 0; i < fp.length; i += 3) { fp[i] = rnd(-13, 13); fp[i + 1] = rnd(0, 18); fp[i + 2] = rnd(-36, 9); }
    const rg = new T.BufferGeometry(); rg.setAttribute("position", new T.BufferAttribute(rp, 3));
    S.rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0xd6e6ff, transparent: true, opacity: 0, depthWrite: false }));
    const fg = new T.BufferGeometry(); fg.setAttribute("position", new T.BufferAttribute(fp, 3));
    S.flakes = new T.Points(fg, new T.PointsMaterial({ color: 0xffffff, size: 0.17, map: dotT, transparent: true, opacity: 0, depthWrite: false }));
    const n = 220, pos = new Float32Array(n * 3).fill(-99), col = new Float32Array(n * 3);
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pos, 3)); pg.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({ size: 0.24, map: dotT, vertexColors: true, transparent: true, depthWrite: false }));
    S.parts = { n, pos, col, vel: new Float32Array(n * 3), life: new Float32Array(n), next: 0, geo: pg };
    for (const o of [S.rain, S.flakes, pts]) { o.frustumCulled = false; scene.add(o); }
    S.partsMesh = pts;
  }

  function build(three, C) {
    T = three; NI.clear(); CAPS.clear();
    scene = new T.Scene();
    S = { scene, camera: new T.PerspectiveCamera(70, 1, 0.1, 1500), C, frontTreeMeshes: [], leafMats: [], inScn: [], snow: [], scroll: [], scn: [], walkers: [], stalls: [], facades: [], tints: [], signMats: [], snowOn: false, tmpC: new T.Color(), white: new T.Color("#FFFFFF") };
    G = {
      box: new T.BoxGeometry(1, 1, 1), sph: new T.SphereGeometry(1, 18, 14), lo: new T.SphereGeometry(1, 10, 8), cyl: new T.CylinderGeometry(1, 1, 1, 14),
      cone: new T.ConeGeometry(1, 1, 8), taper: new T.CylinderGeometry(0.55, 1, 1, 10), ico: new T.IcosahedronGeometry(1, 2), ico1: new T.IcosahedronGeometry(1, 1),
      plane: new T.PlaneGeometry(1, 1), half: new T.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), frustum: new T.CylinderGeometry(0.72, 1, 1, 4).rotateY(Math.PI / 4),
    };
    S.prop = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });
    S.rigMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    S.snowMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0 });
    sky(); ground(); lights(); backdrop(); landmark(); props(); introWall(); vehicles(); populate(); actors(); weather();
    // everything that belongs to the open street goes into one group, so level 2 can hide it in one step
    const keep = new Set([S.hemi, S.sun, S.sun.target, S.lamp, S.P.g, S.guard.g, S.bag, S.blob, S.dizzy, S.partsMesh]);
    S.out = new T.Group();
    for (const c of [...scene.children]) if (!keep.has(c)) S.out.add(c);
    scene.add(S.out);
    inside(); entrance(); seaside();
    return S;
  }

  /* ---------- level 4: the seaside promenade ---------- */
  // The runner keeps to the promenade (the old street's paving); on the left a sea wall with a white railing drops to
  // the water, on the right a park with palms. Across the bay and behind the park stands the city (the downloaded model).
  // The sea is one flat mesh with its own light shader: rolling waves, sky reflection, sun glitter, a foam line.
  const WATER_FS = `
    uniform float uTime, uOff, uSun, uLight; uniform vec3 uSky, uHor, uDeep, uShal, uSunDir, uSunCol;
    varying vec3 vW;
    vec2 wave(vec2 p, vec2 d, float f, float a, float s) { return d * f * a * cos(dot(p, d) * f + uTime * s); }
    void main() {
      vec2 p = vec2(vW.x, vW.z - uOff);
      vec2 g = wave(p, vec2(0.287, 0.958), 0.55, 0.06, 1.5) + wave(p, vec2(-0.759, 0.651), 0.93, 0.035, 2.0)
             + wave(p, vec2(0.976, 0.217), 1.7, 0.018, 2.8) + wave(p, vec2(-0.196, -0.981), 3.1, 0.009, 3.6) + wave(p, vec2(0.6, -0.8), 5.3, 0.005, 4.5);
      vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 v = toCam / dist;
      vec3 n = normalize(mix(normalize(vec3(-g.x, 1.0, -g.y)), vec3(0.0, 1.0, 0.0), smoothstep(80.0, 600.0, dist)));   // calm and glassy far away
      float fres = 0.03 + 0.97 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
      vec3 r = reflect(-v, n);
      vec3 sky = mix(uHor, uSky, pow(clamp(r.y, 0.0, 1.0), 0.55));
      float near = 1.0 - smoothstep(0.0, 16.0, -9.4 - vW.x);
      vec3 body = mix(uDeep, uShal, near * 0.75 + 0.25 * clamp(0.5 + 3.0 * n.x, 0.0, 1.0)) * uLight;
      vec3 col = mix(body, sky, fres);
      col += uSunCol * pow(max(dot(r, normalize(uSunDir)), 0.0), 260.0) * 4.0 * uSun;                          // the sun's glitter path
      col += uSunCol * pow(max(dot(r, normalize(uSunDir)), 0.0), 18.0) * 0.18 * uSun;
      float foam = (1.0 - smoothstep(0.0, 0.9, -9.4 - vW.x)) * (0.6 + 0.4 * sin(p.y * 0.9 + uTime * 2.2));
      col = mix(col, vec3(0.93, 0.96, 0.97) * (0.4 + 0.6 * uLight), foam * 0.65);
      col = mix(col, uHor, smoothstep(300.0, 1350.0, dist));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  function palmGeo(k, x, z) {
    const h = rnd(4.4, 6.0), lean = rnd(0.1, 0.25) * (Math.random() < 0.5 ? -1 : 1), n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / n, t2 = (i + 1) / n, w = 0.2 - t * 0.07;
      k.add(G.cyl, i % 2 ? "#8C6D4A" : "#7A5D3E", [w, h / n + 0.06, w], [x + lean * h * (t + t2) * (t + t2) * 0.25, h * (t + 0.5 / n), z], [0, 0, -lean * (t + t2)]);
    }
    const tx = x + lean * h, ty = h + 0.05;
    k.add(G.lo, "#6B4E2E", [0.3, 0.26, 0.3], [tx, ty, z]);
    for (let i = 0; i < 3; i++) k.add(G.lo, "#5A4326", [0.12, 0.12, 0.12], [tx + Math.cos(i * 2.1) * 0.22, ty - 0.22, z + Math.sin(i * 2.1) * 0.22]);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + rnd(-0.15, 0.15), d = rnd(0.25, 0.75), L = rnd(1.5, 1.95);
      k.add(G.lo, pick(["#3F9440", "#4FA84A", "#2F7F37", "#5DB552"]), [0.34, 0.05, L], [tx + Math.sin(a) * L * 0.78, ty + 0.1 - Math.sin(d) * L * 0.75, z + Math.cos(a) * L * 0.78], [d, a, 0], "YXZ");
    }
  }
  function bayGeo(L) {               // one 20 m stretch of promenade: sea wall, railing, a bench, a palm row and flower beds
    const k = baker();
    k.add(G.box, "#CBBBA0", [0.8, 1.15, L], [-9.8, -0.5, 0]).add(G.box, "#EFE6D3", [0.9, 0.16, L], [-9.65, 0.1, 0]);
    for (let i = 0; i < L / 2.5; i++) k.add(G.cyl, "#F4F5F7", [0.055, 1.05, 0.055], [-9.5, 0.66, -L / 2 + 1.25 + i * 2.5]).add(G.lo, "#F4F5F7", [0.08, 0.08, 0.08], [-9.5, 1.2, -L / 2 + 1.25 + i * 2.5]);
    k.add(G.cyl, "#F4F5F7", [0.05, L, 0.05], [-9.5, 1.16, 0], [Math.PI / 2, 0, 0]).add(G.cyl, "#E4E7EC", [0.03, L, 0.03], [-9.5, 0.72, 0], [Math.PI / 2, 0, 0]);
    // bench facing the sea
    const bz = rnd(-6, -2);
    k.add(G.box, "#A8743F", [0.5, 0.07, 1.8], [-8.55, 0.5, bz]).add(G.box, "#A8743F", [0.07, 0.42, 1.8], [-8.28, 0.8, bz], [0, 0, 0.18]);
    for (const dz of [-0.75, 0.75]) k.add(G.box, "#34424F", [0.5, 0.45, 0.06], [-8.5, 0.27, bz + dz]);
    // park side: kerb, flower beds, palms
    k.add(G.box, "#DDD2BC", [0.35, 0.24, L], [9.55, 0.12, 0]);
    for (let i = 0; i < 2; i++) {
      const z = -L / 2 + 5 + i * 10;
      k.add(G.cyl, "#D9CDB6", [1.25, 0.32, 1.25], [11.3, 0.16, z]).add(G.cyl, "#5B3F2A", [1.12, 0.06, 1.12], [11.3, 0.32, z]);
      for (let j = 0; j < 7; j++) { const a = j * 0.9; k.add(G.lo, pick(["#F25F8B", "#FFD166", "#FF8FAB", "#F9844A", "#C77DFF"]), [0.2, 0.16, 0.2], [11.3 + Math.cos(a) * 0.75, 0.42, z + Math.sin(a) * 0.75]); }
      palmGeo(k, 11.3, z);
      k.add(G.ico1, pick(["#4E9A3C", "#5BAA46", "#3F8A33"]), [rnd(0.7, 1.0), rnd(0.55, 0.75), rnd(0.8, 1.1)], [rnd(14, 16), 0.45, z + 4]);
      palmGeo(k, rnd(17, 24), z + rnd(-3, 3));
    }
    return k.geo();
  }
  function boatGeo(c) {
    const k = baker();
    k.add(G.lo, "#FFFFFF", [0.75, 0.4, 2.3], [0, 0.05, 0]).add(G.box, c, [1.3, 0.12, 3.6], [0, 0.32, 0]).add(G.box, "#F2E6D0", [1.0, 0.08, 2.6], [0, 0.4, 0]);
    k.add(G.cyl, "#C9CDD3", [0.05, 3.6, 0.05], [0, 2.2, 0.2]).add(G.box, "#FFFFFF", [0.03, 2.9, 1.5], [0, 2.1, -0.6], [0.06, 0, 0]).add(G.box, c, [0.035, 0.5, 1.45], [0, 0.9, -0.62], [0.06, 0, 0]);
    return k.geo();
  }
  function seaside() {
    const L = 20, N = Math.round(S.C.LOOP / L);
    const g = new T.Group(); g.visible = false; scene.add(g); S.sea = g; S.seaScn = []; S.boats = []; S.cities = [];
    S.waterU = {
      uTime: { value: 0 }, uOff: { value: 0 }, uSun: { value: 1 }, uLight: { value: 1 },
      uSky: { value: new T.Color("#2E86E8") }, uHor: { value: new T.Color("#CFE9FF") }, uDeep: { value: new T.Color("#0A4A66") }, uShal: { value: new T.Color("#1FA2A8") },
      uSunDir: { value: new T.Vector3(0.2, 0.33, -1) }, uSunCol: { value: new T.Color("#FFF0D2") },
    };
    const wm = new T.ShaderMaterial({ uniforms: S.waterU, fragmentShader: WATER_FS,
      vertexShader: "varying vec3 vW;\nvoid main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }" });
    const water = new T.Mesh(new T.PlaneGeometry(1500, 2600), wm);
    water.rotation.x = -Math.PI / 2; water.position.set(-9.4 - 750, -0.8, -1000); water.frustumCulled = false; g.add(water); S.water = water;
    // the park lawn on the right (shares the street grass, which follows the weather)
    const lawn = new T.Mesh(new T.PlaneGeometry(420, 640), S.grassMat); lawn.rotation.x = -Math.PI / 2; lawn.position.set(9.6 + 210, -0.01, -170); lawn.receiveShadow = true; g.add(lawn);
    const bays = [bayGeo(L), bayGeo(L), bayGeo(L)];
    for (let i = 0; i < N; i++) {
      const z = S.C.BACK - i * L - L / 2, bay = new T.Group();
      const m = mesh(bays[i % 3], S.prop); m.receiveShadow = true; bay.add(m);
      for (const x of [-8.9, 8.9]) {        // a lamp on each side
        const lz = x < 0 ? -L / 4 : L / 4, lp = mesh(S.seaLampGeo || (S.seaLampGeo = baker().add(G.cyl, "#2D4A52", [0.07, 4.2, 0.07], [0, 2.1, 0]).add(G.box, "#2D4A52", [0.32, 0.3, 0.32], [0, 0.15, 0]).add(G.cyl, "#2D4A52", [0.18, 0.08, 0.18], [0, 4.25, 0]).geo()), S.prop);
        const b = new T.Mesh(G.lo, S.lampMat); b.scale.set(0.2, 0.26, 0.2); b.position.y = 4.48; lp.add(b);
        const gl = new T.Sprite(S.glowMat); gl.scale.set(3.4, 3.4, 1); gl.position.y = 4.45; lp.add(gl);
        lp.position.set(x, 0, lz); bay.add(lp);
      }
      bay.position.z = z; g.add(bay); S.seaScn.push(bay);
    }
    // sailboats drifting on the bay
    const bg = ["#2E6FD8", "#E5383B", "#F4A300", "#0FA3A3"].map(boatGeo);
    for (let i = 0; i < 7; i++) {
      const b = mesh(bg[i % 4], S.prop, false), sc = rnd(1.0, 1.6); b.scale.setScalar(sc);
      b.position.set(-rnd(28, 140), -0.75, -rnd(0, 900)); b.rotation.y = rnd(-0.6, 0.6);
      b.userData = { ph: rnd(0, 6), v: rnd(0.4, 1.4) }; g.add(b); S.boats.push(b);
    }
  }
  // The city model: one mesh, one atlas texture. Its shader picks each face's tile in the atlas and repeats it
  // (the _rect attribute), and lights some windows at night.
  function cityMat(src) {
    const map = src.map; map.anisotropy = 4;
    const mat = new T.MeshStandardMaterial({ map, roughness: 0.78, metalness: 0, fog: false });
    mat.userData.glow = { value: 0 };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGlow = mat.userData.glow;
      sh.vertexShader = "attribute vec4 _rect;\nvarying vec4 vRect;\nvarying vec2 vUv0;\n" + sh.vertexShader.replace("#include <uv_vertex>", "#include <uv_vertex>\n  vRect = _rect; vUv0 = uv;");
      sh.fragmentShader = "uniform float uGlow;\nvarying vec4 vRect;\nvarying vec2 vUv0;\n" + sh.fragmentShader
        .replace("#include <map_fragment>", "vec4 tc = textureGrad(map, vRect.xy + fract(vUv0) * vRect.zw, dFdx(vUv0) * vRect.zw, dFdy(vUv0) * vRect.zw);\n  diffuseColor *= tc;")
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  float glass = smoothstep(0.08, 0.16, tc.b - tc.r) * (1.0 - smoothstep(0.3, 0.5, dot(tc.rgb, vec3(0.3, 0.59, 0.11))));
  float lit = step(0.6, fract(sin(dot(floor(vUv0 * vec2(23.0, 37.0)), vec2(12.9898, 78.233))) * 43758.5453));
  totalEmissiveRadiance += vec3(1.0, 0.78, 0.48) * uGlow * glass * (0.25 + 0.75 * lit) * 0.9;`);
    };
    return mat;
  }
  function cityIn(src) {
    let geo = null, m0 = null, mw = null;
    src.updateMatrixWorld(true);
    src.traverse((c) => { if (c.isMesh && !geo) { geo = c.geometry; m0 = c.material; mw = c.matrixWorld; } });
    if (!geo || !geo.attributes._rect) return;
    geo = geo.clone();
    for (const n of ["position", "normal"]) {        // compressed as small integers: back to plain floats
      const a = geo.attributes[n], f = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
      geo.setAttribute(n, new T.BufferAttribute(f, 3));
    }
    geo.applyMatrix4(mw); geo.computeBoundingBox();     // the compression keeps the real size in the node's transform
    const b = geo.boundingBox, sc = 3.2;
    geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); geo.scale(sc, sc, sc); geo.computeBoundingSphere();
    const mat = cityMat(m0); S.cityMat = mat; S.tints.push({ m: mat, k: 0.3 });
    // a phone held upright sees only a narrow slice to the sides, so the city stands ahead, across the bay
    for (const [x, rots, z0] of [[-178, [0, Math.PI, Math.PI / 2], -330], [195, [Math.PI, 0, -Math.PI / 2], -560]]) {
      rots.forEach((r, i) => { const c = new T.Mesh(geo, mat); c.rotation.y = r; c.position.set(x, -0.55, z0 - i * 400); S.sea.add(c); S.cities.push(c); });
    }
  }

  // The Starlight Carriage: a wagon standing on the road that the runner can run straight through.
  // Its corridor (model x = -1.85) is lined up with a lane; the doors at both ends are hinged so they swing open.
  // Parts sharing a material are merged so the whole wagon costs few draw calls.
  const WAG = { s: 0.58, cx: -1.85, floor: -3.41, cz: -0.7, hinge: -2.97, front: 5.6, back: -11.89 };
  function mergeByMat(list) {         // [{geo, matrix, mat}] -> meshes, one per material
    const by = new Map();
    for (const it of list) { if (!by.has(it.mat)) by.set(it.mat, []); by.get(it.mat).push(it); }
    const out = [], v = new T.Vector3(), nm = new T.Matrix3();
    for (const [mat, items] of by) {
      let n = 0, ni = 0; for (const it of items) { n += it.geo.attributes.position.count; ni += it.geo.index ? it.geo.index.count : it.geo.attributes.position.count; }
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), I = new Uint32Array(ni);
      let o = 0, oi = 0;
      for (const it of items) {
        const g = it.geo, p = g.attributes.position, q = g.attributes.normal, t = g.attributes.uv; nm.getNormalMatrix(it.matrix);
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(it.matrix); P.set([v.x, v.y, v.z], (o + i) * 3);
          if (q) { v.fromBufferAttribute(q, i).applyMatrix3(nm).normalize(); N.set([v.x, v.y, v.z], (o + i) * 3); }
          if (t) U.set([t.getX(i), t.getY(i)], (o + i) * 2);
        }
        if (g.index) for (let i = 0; i < g.index.count; i++) I[oi++] = o + g.index.getX(i); else for (let i = 0; i < p.count; i++) I[oi++] = o + i;
        o += p.count;
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(P, 3)); geo.setAttribute("normal", new T.BufferAttribute(N, 3)); geo.setAttribute("uv", new T.BufferAttribute(U, 2));
      geo.setIndex(new T.BufferAttribute(I, 1)); geo.computeBoundingSphere();
      out.push(new T.Mesh(geo, mat));
    }
    return out;
  }
  function wagonIn(src) {
    src.updateMatrixWorld(true);
    const body = [], doorF = [], doorB = [];
    src.traverse((c) => {
      if (!c.isMesh) return;
      const mat = c.material, n = c.name;
      if (/kover/.test(n)) { mat.color.set("#A0283A"); if (mat.map) mat.map = null; mat.needsUpdate = true; }        // a red runner carpet down the corridor
      if (/light_0|inside_svetilnik|light_blue/.test(n)) { mat.emissive = new T.Color("#FFC870"); mat.emissiveIntensity = 1.6; }
      const it = { geo: c.geometry, matrix: c.matrixWorld.clone(), mat };
      if (/door/.test(n)) { const b = new T.Box3().setFromObject(c); ((b.min.z + b.max.z) / 2 > 0 ? doorF : doorB).push(it); } else body.push(it);
    });
    const inner = new T.Group();
    for (const m of mergeByMat(body)) { m.castShadow = true; inner.add(m); }
    // the doors turn around their hinge on the outer wall
    for (const [list, z, name] of [[doorF, WAG.front, "doorF"], [doorB, WAG.back, "doorB"]]) {
      const pivot = new T.Group(); pivot.name = name; pivot.position.set(WAG.hinge, 0, z);
      for (const m of mergeByMat(list)) { m.position.set(-WAG.hinge, 0, -z); pivot.add(m); }
      inner.add(pivot);
    }
    // warm glows along the corridor ceiling and in both doorways (they grow when the doors open)
    const gm = new T.SpriteMaterial({ map: S.glowMat.map, color: 0xFFC870, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    S.wagonGlow = gm;
    for (const z of [WAG.front - 0.6, 1.8, -3.5, -8.5, WAG.back + 0.6]) { const g = new T.Sprite(gm); g.scale.set(3.4, 3.4, 1); g.position.set(WAG.cx, 1.6, z); inner.add(g); }
    inner.scale.setScalar(WAG.s);
    inner.position.set(-WAG.cx * WAG.s, -WAG.floor * WAG.s + 0.02, -WAG.cz * WAG.s);
    S.make.wagon = () => { const g = new T.Group(); g.add(inner.clone()); return g; };
    S.make.wagonWall = () => new T.Object3D();
    S.wagonReady = true;
  }

  /* ---------- level 2: inside the covered bazaar ---------- */
  const archPath = (c, x, y, w, h) => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.45); c.quadraticCurveTo(x, y + h * 0.1, x + w / 2, y); c.quadraticCurveTo(x + w, y + h * 0.1, x + w, y + h * 0.45); c.lineTo(x + w, y + h); c.closePath(); };
  function inside() {
    const { SLOT, SLOTS, BACK } = S.C, LEN = 640, Z0 = -170, W = 8.6, H = 6.4;   // W: distance to the side walls, H: height of the arches
    const g = new T.Group(); g.visible = false; scene.add(g); S.in = g;
    // floor: cream stone tiles with small, soft stars (kept quiet so the eye stays on the run)
    const floorT = tex(512, 512, (c, w, h) => {
      c.fillStyle = "#E6D8BE"; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const cx = x * 128 + 64, cy = y * 128 + 64;
        c.fillStyle = (x + y) % 2 ? "rgba(176,110,78,.45)" : "rgba(78,138,138,.4)";
        c.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 11 : 22; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); c.fill();
      }
      c.strokeStyle = "rgba(120,90,60,.18)"; c.lineWidth = 2;
      for (let i = 0; i <= 512; i += 128) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
    }, 5, LEN / 3.44);
    const fl = new T.Mesh(G.plane, new T.MeshStandardMaterial({ map: floorT, roughness: 0.45, metalness: 0.05 }));
    fl.scale.set(W * 2, LEN, 1); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.01, Z0); fl.receiveShadow = true; g.add(fl);
    S.scroll.push([floorT, 3.44]);
    // side walls: an arcade of little shops with goods on the shelves
    const wallM = new T.MeshStandardMaterial({ roughness: 0.85, map: tex(512, 256, (c, w, h) => {
      c.fillStyle = "#E7D3AE"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#18A9C6"; c.fillRect(0, 0, w, 22); c.fillStyle = "#F2D279"; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(16 + i * 32, 11, 5, 0, 7); c.fill(); }
      for (let k = 0; k < 2; k++) {
        const x = 30 + k * 256;
        archPath(c, x, 46, 196, 210); const gr = c.createLinearGradient(0, 60, 0, 256); gr.addColorStop(0, "#5A3A22"); gr.addColorStop(1, "#2E1F14"); c.fillStyle = gr; c.fill();
        for (let sh = 0; sh < 3; sh++) {
          c.fillStyle = "#7A5534"; c.fillRect(x + 22, 120 + sh * 42, 152, 6);
          for (let i = 0; i < 9; i++) { c.fillStyle = ["#D7372F", "#F4A300", "#7BB342", "#F2C230", "#8D5524", "#E76F51"][(i + sh + k) % 6]; c.fillRect(x + 26 + i * 16, 100 + sh * 42, 12, 20); }
        }
        c.lineWidth = 10; c.strokeStyle = "#1B86A8"; archPath(c, x, 46, 196, 210); c.stroke();
      }
    }) });
    // ceiling domes painted with a star pattern
    const domeT = tex(512, 256, (c, w, h) => {
      c.fillStyle = "#F1E6CF"; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) {
        const cx = x * 32 + 16, cy = y * 64 + 32;
        c.fillStyle = y % 2 ? "#1B86A8" : "#2F5DA8"; c.beginPath();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 6 : 13; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); c.fill();
      }
      c.fillStyle = "#C9A24E"; for (let y = 0; y < 5; y++) c.fillRect(0, y * 64 - 2, w, 4);
    });
    const domeM = new T.MeshStandardMaterial({ map: domeT, side: T.DoubleSide, roughness: 0.7 });
    const domeG = new T.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI * 0.42);
    S.inGlow = new T.SpriteMaterial({ map: S.glowMat.map, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending });
    // one bay of the hall: columns, the arch across, a lantern on each side, the wall behind the stalls
    const bayK = baker();
    for (const x of [-4.6, 4.6]) {
      bayK.add(G.box, "#C9B48C", [0.9, 0.4, 0.9], [x, 0.2, 0]).add(G.cyl, "#E7D8B8", [0.32, H - 0.6, 0.32], [x, (H - 0.6) / 2 + 0.3, 0]).add(G.box, "#18A9C6", [0.84, 0.36, 0.84], [x, H - 0.25, 0]);
      bayK.add(G.box, "#4A3423", [0.04, 1.4, 0.04], [x * 0.78, H - 0.9, 0]).add(G.box, "#B8892E", [0.36, 0.5, 0.36], [x * 0.78, H - 1.85, 0]);
    }
    bayK.add(G.box, "#E7D8B8", [W * 2, 0.6, 0.7], [0, H, 0]).add(G.box, "#1B86A8", [W * 2, 0.14, 0.74], [0, H - 0.3, 0]).add(G.box, "#C9A24E", [W * 2, 0.06, 0.76], [0, H + 0.18, 0]);
    for (const x of [-1, 1]) bayK.add(G.box, "#E7D8B8", [0.5, 1.2, 0.6], [x * 4.1, H - 0.8, 0], [0, 0, x * 0.7]);
    const bayG = bayK.geo();
    const add = (o, z) => { o.position.z = z; g.add(o); S.inScn.push(o); return o; };
    for (let i = 0; i < SLOTS; i++) {
      const z = BACK - i * SLOT, bay = new T.Group();
      bay.add(mesh(bayG, S.prop));
      for (const x of [-1, 1]) {
        const w = new T.Mesh(G.plane, wallM); w.scale.set(SLOT, H + 1.6, 1); w.position.set(x * W, (H + 1.6) / 2, 0); w.rotation.y = -x * Math.PI / 2; bay.add(w);
        const gl = new T.Sprite(S.inGlow); gl.scale.set(2.2, 2.2, 1); gl.position.set(x * 4.6 * 0.78, H - 1.85, 0); bay.add(gl);
      }
      const d = new T.Mesh(domeG, domeM); d.scale.set(W, 3.2, SLOT / 2 * 1.04); d.position.set(0, H + 0.2, -SLOT / 2); bay.add(d);
      add(bay, z);
      for (const side of [-1, 1]) {           // a stall with its seller between each pair of columns
        const geo = pick(S.stallGeos), u = geo.userData, m = mesh(geo, S.prop);
        m.rotation.y = -side * Math.PI / 2;
        const arm = mesh(S.armGeos[u.shirt], S.prop, false); arm.position.set(u.sx - 0.255, 1.36, -1.1); arm.rotation.z = -0.12; m.add(arm);
        add(m, z - SLOT / 2).position.x = side * 6.5;
        if (Math.random() < 0.35) { const p = mesh(pick(S.groups), S.prop); p.rotation.y = side * rnd(0.6, 2.4); add(p, z - SLOT * 0.25).position.x = side * 5.1; }
      }
    }
  }
  // The great tiled gate the runner goes through to get inside; the doorway is see-through.
  function entrance() {
    const t = tex(1024, 640, (c, w, h) => {
      c.fillStyle = "#DCC7A1"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#0E5F9A"; c.fillRect(70, 30, w - 140, h - 30); c.fillStyle = "#DCC7A1"; c.fillRect(110, 70, w - 220, h - 70);
      c.fillStyle = "#F2D279";
      for (let i = 0; i < 26; i++) for (const [x, y] of [[90, 80 + i * 22], [w - 90, 80 + i * 22], [130 + i * 30, 50]]) { if (x > w - 120 && y === 50) continue; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 8, y); c.lineTo(x, y + 8); c.lineTo(x - 8, y); c.fill(); }
      c.lineWidth = 26; c.strokeStyle = "#18A9C6"; archPath(c, 300, 150, 424, 490); c.stroke();
      c.lineWidth = 8; c.strokeStyle = "#F2D279"; archPath(c, 330, 185, 364, 455); c.stroke();
      c.save(); c.globalCompositeOperation = "destination-out"; archPath(c, 312, 162, 400, 478); c.fill(); c.restore();   // the doorway itself
    });
    const g = new T.Group(); g.visible = false;
    const face = new T.Mesh(G.plane, new T.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.6 }));
    face.scale.set(24, 15, 1); face.position.y = 7.5; g.add(face);
    const k = baker();
    for (const x of [-1, 1]) {
      k.add(G.box, "#DCC7A1", [3.4, 15, 3], [x * 13.2, 7.5, -1.4]).add(G.cyl, "#18A9C6", [1.1, 18, 1.1], [x * 13.2, 9, -1.4]);
      k.add(G.half, "#18A9C6", [1.6, 2.2, 1.6], [x * 13.2, 18, -1.4]).add(G.cone, "#E6B84C", [0.3, 2, 0.3], [x * 13.2, 20.6, -1.4]);
    }
    k.add(G.box, "#DCC7A1", [24, 1.4, 3], [0, 15.6, -1.4]).add(G.box, "#18A9C6", [24.4, 0.4, 3.2], [0, 16.4, -1.4]);
    g.add(mesh(k.geo(), S.prop));
    scene.add(g); S.portal = g;
  }

  // Scales a downloaded model to a target length or height, stands it on the ground and centres it.
  function fit(src, { len, height, rotY = 0 }) {
    const inner = src.clone(); inner.rotation.y = rotY; inner.updateMatrixWorld(true);
    const size = new T.Box3().setFromObject(inner).getSize(new T.Vector3());
    inner.scale.multiplyScalar(len ? len / Math.max(size.x, size.z) : height / size.y); inner.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(inner), c = b.getCenter(new T.Vector3());
    inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= b.min.y;
    const g = new T.Group(); g.add(inner); return g;
  }
  // Swaps the downloaded 3D models in once they have loaded; until then (or without them) the hand-made shapes are used.
  function useModels(m) {
    const meshes = (o, fn) => o.traverse((c) => { if (c.isMesh) fn(c); });
    if (m.damas) {
      const proto = fit(m.damas, { len: 3.15, rotY: Math.PI / 2 });      // the model's front faces -X; turn it towards the runner
      // its dark inner shell lies right under the white roof and showed through in black patches: make it white and keep it behind
      meshes(proto, (c) => { const mt = c.material; if (mt.name === "material_4") { mt.color.set("#F4F5F7"); mt.polygonOffset = true; mt.polygonOffsetFactor = 2; mt.polygonOffsetUnits = 4; } });
      meshes(proto, (c) => { c.castShadow = true; });
      S.make.damas = () => { const o = proto.clone(); o.add(new T.Mesh(S.lightsDamas, S.headMat)); return o; };
    }
    const trees = [[m.tree1, 7.6], [m.tree2, 6.4]].filter((t) => t[0]).map(([t, h]) => {
      const p = fit(t, { height: h });
      meshes(p, (c) => { c.castShadow = true; if (c.material.alphaTest > 0 && !S.leafMats.includes(c.material)) S.leafMats.push(c.material); });
      return p;
    });
    if (trees.length) for (const old of S.frontTreeMeshes) {      // about three in four street trees become the real models
      if (Math.random() < 0.25) continue;
      const g = pick(trees).clone(), i = S.scn.indexOf(old);
      g.position.copy(old.position); g.rotation.y = rnd(0, 6.28); g.scale.setScalar(rnd(0.85, 1.15));
      const p = old.parent || scene; p.remove(old); p.add(g); if (i >= 0) S.scn[i] = g;
    }
    if (trees.length) S.frontTreeMeshes = [];
    if (m.city && !S.cities.length) cityIn(m.city);
    if (m.wagon && !S.wagonReady) wagonIn(m.wagon);
    if (m.mosque && !S.mosque) {          // level 3: the Blue Mosque takes the Chorsu dome's place at the end of the road
      const e = fit(m.mosque, { len: 150, rotY: Math.PI / 2 }); e.position.set(0, -4, -250); e.visible = false;
      S.mosqueMats = [];
      meshes(e, (c) => { c.material.fog = false; if (!S.mosqueMats.includes(c.material)) { S.mosqueMats.push(c.material); S.tints.push({ m: c.material, k: 0.22 }); } });
      S.out.add(e); S.mosque = e;
    }
  }

  return { build, useModels };
})();
