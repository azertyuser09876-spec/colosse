// Son : moteur spatialisé, recettes sonores, musique générative, ambiances, vibrations.

// ================= AUDIO : MOTEUR SPATIALISÉ, MUSIQUE ET AMBIANCES (100 % synthétisé) =================
let muted = false;
// Intervalle minimal entre deux déclenchements d'un même son (ms) : évite la saturation quand 40 robots tirent.
const SND_GAP = { mg: 34, mgmini: 45, gatling: 30, ar: 30, pistol: 40, rifle: 45, sniper: 80, shotgun: 60, scatter: 55, melee: 55, claw: 55, needle: 40, laser: 35, sting: 45, plasma: 55, tesla: 55, storm: 80, emp: 70, frost: 50, acid: 60, lob: 55, rocket: 45, swarm: 70, cannon: 45, flak: 40, napalm: 55, siege: 70, mortar: 70, gravity: 90, rail: 70, beam: 100, cruise: 100, fusion: 150, launch: 200, uplink: 300, whistle: 70, explo: 22, hit: 28, hitsoft: 28, shield: 70, crush: 70, step: 110, hurt: 110, pickup: 45, collect: 70, heal: 220, drone: 160, ui: 20, deny: 80, hitm: 28, kill: 50, mine: 100, heart: 250, open: 80, place: 70, build: 100, research: 100, board: 120, dodge: 100, reload: 100, reloaded: 100, empty: 120, bloop: 50, clank: 150, servo: 200, farboom: 350, farsiren: 1500, icecrack: 250, creak: 300, thunder: 600, lockwarn: 400, lockon: 160 };
// Sons toujours joués, même quand beaucoup de voix sont actives.
const SND_PRIO = new Set(['explo', 'nuke', 'fusion', 'alarm', 'wave', 'extract', 'death', 'success', 'fail', 'rankup', 'bossroar', 'pulse', 'beacon', 'ui', 'uiopen', 'uiclose', 'deny', 'hitm', 'kill', 'hurt', 'heart', 'reload', 'reloaded', 'empty', 'board', 'dodge', 'launch', 'charge']);
// Sons d'interface : jamais étouffés par la pause ou les blessures.
const SND_UI = new Set(['ui', 'uiopen', 'uiclose', 'deny', 'hitm', 'kill', 'rankup', 'success', 'fail', 'research', 'heart', 'lockwarn', 'lockon']);
const SND_AMB = new Set(['bloop', 'clank', 'servo', 'farboom', 'farsiren', 'icecrack', 'creak', 'thunder']);

const SFX = {
  ctx: null, ready: false, offline: false, last: {}, lastK: {}, voices: [], holds: new Map(), buf: {}, hbT: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume().catch(() => { }); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      this.build(new C({ latencyHint: 'interactive' }));
      Mus.start();
    } catch (e) { this.ctx = null; this.ready = false; }
  },
  build(ctx, offline) {
    const c = this.ctx = ctx; this.offline = !!offline; this.last = {}; this.lastK = {}; this.voices = []; this.holds = new Map();
    const G = (v, to) => { const g = c.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
    // chaîne maître : monde → filtre (pause, blessure) → sortie → limiteur → haut-parleurs
    const L = this.limit = c.createDynamicsCompressor();
    L.threshold.value = -10; L.knee.value = 8; L.ratio.value = 14; L.attack.value = .002; L.release.value = .2;
    this.out = G(1); this.out.connect(L); L.connect(c.destination);
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000; this.lp.Q.value = .4; this.lp.connect(this.out);
    this.world = G(1, this.lp);
    this.sfx = G(1, this.world); this.mus = G(.4, this.world); this.amb = G(.6, this.world);
    this.ui = G(.8, this.out);
    // réverbération (réponse impulsionnelle générée)
    this.verbIn = G(1); this.verb = c.createConvolver(); this.verb.buffer = this.ir(2.4, 2.8); this.verbIn.connect(this.verb); this.verb.connect(G(.7, this.world));
    // bruits pré-calculés
    const sr = c.sampleRate, mk = fn => { const b = c.createBuffer(1, sr * 2, sr), d = b.getChannelData(0); fn(d); return b; };
    this.buf.white = mk(d => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    this.buf.pink = mk(d => { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } });
    this.buf.brown = mk(d => { let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } });
    this.buf.crackle = mk(d => { let i = 0; while (i < d.length) { i += Math.floor(sr * (.003 + Math.random() * .025)); const a = (.25 + Math.random() * .75), n = Math.floor(sr * (.0006 + Math.random() * .0025)); for (let k = 0; k < n && i + k < d.length; k++) d[i + k] += a * (1 - k / n) * (Math.random() * 2 - 1); } });
    this.curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; this.curve[i] = Math.tanh(x * 3.2) / Math.tanh(3.2); }
    this.applyVolumes();
    Mus.init(this); Amb.init(this);
    this.ready = true;
  },
  ir(dur, decay) {
    const c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * dur), b = c.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < n; i++) { const t = i / n, w = (Math.random() * 2 - 1) * Math.pow(1 - t, decay); lp += (w - lp) * (.42 - .3 * t); d[i] = lp * Math.min(1, i / (sr * .012)); }
      for (const [tt, a] of [[.009, .45], [.017, .3], [.026, .25], [.039, .18], [.057, .12]]) { const k = Math.floor(tt * sr * (ch ? 1.09 : 1)); if (k < n) d[k] += a * (ch ? -1 : 1); }
    }
    return b;
  },
  applyVolumes() {
    if (!this.ctx) return; const t = this.ctx.currentTime, s = settings, fx = s.vSfx ?? 1;
    this.out.gain.setTargetAtTime(muted ? 0 : (s.vol ?? .8), t, .05);
    this.sfx.gain.setTargetAtTime(fx, t, .05); this.ui.gain.setTargetAtTime(fx * .8, t, .05);
    this.mus.gain.setTargetAtTime((s.vMus ?? .7) * .55, t, .15); this.amb.gain.setTargetAtTime((s.vAmb ?? .7) * .85, t, .15);
  },
  // position → atténuation, panoramique et étouffement (null = trop loin)
  spatial(x, y, reach) {
    if (x === undefined || typeof cam === 'undefined' || !player) return { att: 1, pan: 0, k: 0 };
    const z = Math.max(.45, cam.zoom), dx = (x - cam.x) * z, dy = (y - cam.y) * z;
    const d = Math.hypot(dx, dy) / Math.max(400, Math.hypot(VW, VH) * .5), k = d / (1.9 * (reach || 1));
    if (k >= 1) return null;
    return { att: Math.pow(1 - k, 1.4), pan: clamp(dx / (VW * .6), -1, 1) * .8, k };
  },
  voice(vol, sp, o) {
    const c = this.ctx, t = c.currentTime + (this.offline ? 0 : .004);
    const g = c.createGain(); g.gain.value = vol;
    let tail = g;
    if (sp.k > .1) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 16000 * Math.pow(.06, sp.k); f.Q.value = .3; g.connect(f); tail = f; }
    const pan = o.pan !== undefined ? o.pan : sp.pan;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; tail.connect(p); tail = p; }
    tail.connect(o.bus);
    const wet = (o.wet ?? .14) + sp.k * .45;
    if (wet > .02) { const s = c.createGain(); s.gain.value = wet; tail.connect(s); s.connect(this.verbIn); }
    return { in: g, t, end: t };
  },
  env(g, t, vol, atk, dur, hold = 0) {
    const p = g.gain; p.setValueAtTime(0, t); p.linearRampToValueAtTime(vol, t + atk);
    if (hold) p.setValueAtTime(vol, t + atk + hold);
    p.exponentialRampToValueAtTime(.0004, t + Math.max(atk + hold + .008, dur));
  },
  osc(v, type, f0, f1, dur, vol, o = {}) {
    const c = this.ctx, t = v.t + (o.at || 0), s = c.createOscillator(), g = c.createGain();
    s.type = type; s.frequency.setValueAtTime(Math.max(1, f0), t);
    if (f1 && f1 !== f0) s.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + (o.glide || dur));
    if (o.det) s.detune.value = o.det;
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(s.frequency); l.start(t); l.stop(t + dur + .05); }
    let n = s;
    if (o.f) { const f = c.createBiquadFilter(); f.type = o.f[0]; f.frequency.setValueAtTime(o.f[1], t); if (o.f[3]) f.frequency.exponentialRampToValueAtTime(o.f[3], t + dur); f.Q.value = o.f[2] || .7; s.connect(f); n = f; }
    this.env(g, t, vol, o.atk || .002, dur, o.hold); n.connect(g); g.connect(o.to || v.in);
    s.start(t); s.stop(t + dur + .05); v.end = Math.max(v.end, t + dur);
  },
  noise(v, col, dur, vol, ft, f0, f1, o = {}) {
    const c = this.ctx, t = v.t + (o.at || 0), s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.buf[col]; s.loop = true; if (o.rate) s.playbackRate.value = o.rate;
    let n = s;
    if (ft) { const f = c.createBiquadFilter(); f.type = ft; f.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + (o.glide || dur)); f.Q.value = o.q || .7; s.connect(f); n = f; }
    this.env(g, t, vol, o.atk || .002, dur, o.hold); n.connect(g); g.connect(o.to || v.in);
    s.start(t, Math.random() * 1.8); s.stop(t + dur + .05); v.end = Math.max(v.end, t + dur);
  },
  fm(v, fc, fmod, idx, dur, vol, o = {}) {
    const c = this.ctx, t = v.t + (o.at || 0), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = fc; mod.frequency.value = fmod;
    mg.gain.setValueAtTime(idx * fmod, t); mg.gain.exponentialRampToValueAtTime(Math.max(1, idx * fmod * .05), t + dur);
    mod.connect(mg); mg.connect(car.frequency); this.env(g, t, vol, o.atk || .001, dur); car.connect(g); g.connect(o.to || v.in);
    car.start(t); mod.start(t); car.stop(t + dur + .05); mod.stop(t + dur + .05); v.end = Math.max(v.end, t + dur);
  },
  crackle(v, dur, vol, hp = 1500, o = {}) { this.noise(v, 'crackle', dur, vol, 'highpass', hp, hp, Object.assign({ atk: .004 }, o)); },
  dist(v) { const w = this.ctx.createWaveShaper(); w.curve = this.curve; w.oversample = '2x'; const g = this.ctx.createGain(); g.gain.value = .6; w.connect(g); g.connect(v.in); return w; },
  play(name, vol = 1, x, y, o = {}) {
    if (!this.ready || muted) return null;
    const R = SND[name]; if (!R) return null;
    if (EXPSIM ? !EXPSIM.viewing : (EXPV.id && !SND_UI.has(name))) return null;
    const sp = this.spatial(x, y, (o.reach || 1) * (R.reach || 1)); if (!sp) return null;
    const now = this.offline ? this.ctx.currentTime * 1000 + Math.random() * 1e6 : performance.now(), lt = this.last[name];
    if (lt && now - lt < (SND_GAP[name] || 30) && !(sp.k < (this.lastK[name] ?? 1) - .25)) return null;
    const ct = this.ctx.currentTime;
    if (this.voices.length > 36) this.voices = this.voices.filter(e => e > ct);
    if (this.voices.length >= 56 && !SND_PRIO.has(name)) return null;
    const s = o.size || 1;
    let p = (o.pitch || 1) * (R.nov ? 1 : 1 + (Math.random() - .5) * (R.var ?? .08));
    if (R.wpn) { p *= clamp(Math.pow(s, -.35), .62, 1.15); vol *= clamp(.75 + s * .25, .85, 1.6); }
    if (o.self) vol *= 1.1;
    vol *= (R.g || 1) * sp.att;
    if (vol < .01) return null;
    this.last[name] = now; this.lastK[name] = sp.k;
    const bus = o.bus === 'amb' || SND_AMB.has(name) ? this.amb : SND_UI.has(name) ? this.ui : this.sfx;
    const v = this.voice(vol, sp, { bus, wet: o.self ? (R.wet ?? .14) * .6 : R.wet, pan: o.pan });
    try { R.f(this, v, p, s, o); } catch (e) { }
    this.voices.push(v.end);
    return v;
  },
  // sons continus (rayon thermique, lance-flammes) : tant qu'on rappelle hold(), le son tient
  hold(key, kind, vol, x, y) {
    if (!this.ready || muted || this.offline) return;
    if (EXPSIM ? !EXPSIM.viewing : EXPV.id) return;
    let h = this.holds.get(key);
    if (!h) { if (this.holds.size >= 8) return; h = this.makeHold(kind); if (!h) return; this.holds.set(key, h); }
    h.until = this.ctx.currentTime + .14; h.x = x; h.y = y; h.vol = vol;
  },
  makeHold(kind) {
    const c = this.ctx, t = c.currentTime, g = c.createGain(); g.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = .3;
    const pan = c.createStereoPanner(); g.connect(lp); lp.connect(pan); pan.connect(this.sfx);
    const send = c.createGain(); send.gain.value = .18; pan.connect(send); send.connect(this.verbIn);
    const srcs = [];
    const src = (node, to, gain) => { const gg = c.createGain(); gg.gain.value = gain; node.connect(gg); gg.connect(to); return gg; };
    if (kind === 'beam') {
      for (const [f, ty, vv] of [[92, 'sawtooth', .2], [93.8, 'sawtooth', .2], [184.5, 'square', .05]]) { const o = c.createOscillator(); o.type = ty; o.frequency.value = f; const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1100; o.connect(fl); src(fl, g, vv); o.start(t); srcs.push(o); }
      const n = c.createBufferSource(); n.buffer = this.buf.pink; n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .9; n.connect(bp); const ng = src(bp, g, .3); n.start(t, Math.random()); srcs.push(n);
      const l = c.createOscillator(); l.frequency.value = 13; const lg = c.createGain(); lg.gain.value = .12; l.connect(lg); lg.connect(ng.gain); l.start(t); srcs.push(l);
    } else if (kind === 'flame') {
      const n = c.createBufferSource(); n.buffer = this.buf.brown; n.loop = true; const f1 = c.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 900; n.connect(f1); src(f1, g, .9); n.start(t, Math.random()); srcs.push(n);
      const m = c.createBufferSource(); m.buffer = this.buf.pink; m.loop = true; const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1500; f2.Q.value = .6; m.connect(f2); src(f2, g, .3); m.start(t, Math.random()); srcs.push(m);
      const k = c.createBufferSource(); k.buffer = this.buf.crackle; k.loop = true; const f3 = c.createBiquadFilter(); f3.type = 'highpass'; f3.frequency.value = 2400; k.connect(f3); src(f3, g, .35); k.start(t, Math.random()); srcs.push(k);
      const l = c.createOscillator(); l.frequency.value = 7; const lg = c.createGain(); lg.gain.value = .22; l.connect(lg); lg.connect(g.gain); l.start(t); srcs.push(l);
    } else return null;
    return { g, lp, pan, srcs, until: t + .14, x: 0, y: 0, vol: 0 };
  },
  tick(dt) {
    if (!this.ready || this.offline) return;
    const now = this.ctx.currentTime;
    for (const [key, h] of this.holds) {
      if (now > h.until || paused) { h.g.gain.setTargetAtTime(0, now, .04); for (const s of h.srcs) { try { s.stop(now + .25); } catch (e) { } } this.holds.delete(key); continue; }
      const sp = this.spatial(h.x, h.y, 1), tv = sp ? h.vol * sp.att : 0;
      h.g.gain.setTargetAtTime(tv, now, .04);
      if (sp) { h.pan.pan.setTargetAtTime(sp.pan, now, .05); h.lp.frequency.setTargetAtTime(16000 * Math.pow(.06, sp.k), now, .05); }
    }
    Mus.tick(dt); Amb.tick(dt); this.fxTick(dt);
  },
  // filtre général : pause, menus, blessure grave (avec battements de cœur)
  fxTick(dt) {
    const t = this.ctx.currentTime; let cut = 20000, duck = 1, low = 0;
    if (paused && inGame()) { cut = 650; duck = .6; }
    else if (drawerOpen) cut = 3200;
    else if (state === 'result') cut = 2000;
    const P = player && (player.inside || player);
    if ((state === 'raid' || state === 'assault') && P && P.maxhp && !paused && !P.dead) { const f = P.hp / P.maxhp; if (f < .3) low = 1 - f / .3; }
    if (low > 0) cut = Math.min(cut, 2800 - low * 1900);
    this.lp.frequency.setTargetAtTime(cut, t, .12);
    this.world.gain.setTargetAtTime(duck, t, .15);
    if (low > 0) { this.hbT -= dt; if (this.hbT <= 0) { this.hbT = 1.15 - low * .5; this.play('heart', .45 + low * .55); } } else this.hbT = 0;
  },
  suspend(on) { if (!this.ctx || this.offline) return; try { if (on) this.ctx.suspend(); else this.ctx.resume(); } catch (e) { } },
};

// ================= RECETTES SONORES =================
// f(A, v, p, s, o) : A = moteur, v = voix, p = hauteur, s = taille (monture ou explosion)
const SND = {
  thunder: { g: .95, reach: 9, wet: .45, f(A, v, p) { A.noise(v, 'brown', 3.2, 1, 'lowpass', 700 * p, 90, { atk: .04, glide: 3 }); A.noise(v, 'pink', .5, .45, 'lowpass', 2400 * p, 300, { atk: .01 }); A.crackle(v, .7, .35, 600, { at: .02 }); A.osc(v, 'sine', 48 * p, 30, 2.4, .35, { atk: .1 }); } },
  lockwarn: { g: .42, nov: 1, f(A, v) { for (let i = 0; i < 2; i++) A.osc(v, 'square', 1480, 1480, .05, .16, { at: i * .1, f: ['lowpass', 3200] }); } },
  lockon: { g: .32, nov: 1, f(A, v) { A.osc(v, 'square', 1760, 1760, .04, .14, { f: ['lowpass', 4000] }); A.osc(v, 'square', 2350, 2350, .06, .14, { at: .06, f: ['lowpass', 4000] }); } },
  // ---------- armes légères ----------
  mg: { wpn: 1, g: .55, f(A, v, p) { A.noise(v, 'white', .012, .8, 'highpass', 3500 * p); A.noise(v, 'pink', .075, .9, 'bandpass', 1500 * p, 650 * p, { q: 1.3 }); A.osc(v, 'sine', 210 * p, 70 * p, .07, .55); A.crackle(v, .06, .25, 3000); } },
  mgmini: { wpn: 1, g: .45, f(A, v, p) { A.noise(v, 'white', .01, .7, 'highpass', 4500 * p); A.noise(v, 'pink', .05, .7, 'bandpass', 2200 * p, 1100 * p, { q: 1.4 }); } },
  gatling: { wpn: 1, g: .42, var: .05, f(A, v, p) { A.noise(v, 'white', .01, .8, 'highpass', 4200 * p); A.noise(v, 'pink', .05, .8, 'bandpass', 1900 * p, 900 * p, { q: 1.2 }); A.osc(v, 'sine', 240 * p, 90 * p, .045, .4); } },
  ar: { g: .45, wet: .1, f(A, v, p) { A.noise(v, 'white', .012, .9, 'highpass', 3800 * p); A.noise(v, 'pink', .09, 1, 'bandpass', 1700 * p, 700 * p, { q: 1.1 }); A.osc(v, 'sine', 160 * p, 55 * p, .09, .75); A.noise(v, 'brown', .22, .25, 'lowpass', 900, 300, { at: .02 }); } },
  pistol: { wpn: 1, g: .5, f(A, v, p) { A.noise(v, 'white', .01, .9, 'highpass', 4200 * p); A.noise(v, 'pink', .1, .9, 'bandpass', 2000 * p, 900 * p, { q: 1.2 }); A.osc(v, 'sine', 170 * p, 60 * p, .1, .6); A.noise(v, 'brown', .28, .2, 'lowpass', 1000, 300, { at: .015 }); } },
  rifle: { wpn: 1, g: .55, wet: .2, f(A, v, p) { A.noise(v, 'white', .008, 1, 'highpass', 6000 * p); A.noise(v, 'pink', .14, .9, 'bandpass', 2600 * p, 900 * p, { q: .9 }); A.osc(v, 'sine', 130 * p, 45 * p, .16, .7); A.noise(v, 'brown', .45, .3, 'lowpass', 1300, 250, { at: .02 }); } },
  sniper: { wpn: 1, g: .72, wet: .3, f(A, v, p) { A.noise(v, 'white', .006, 1, 'highpass', 7500 * p); A.noise(v, 'pink', .18, 1, 'bandpass', 3000 * p, 800 * p, { q: .8 }); A.osc(v, 'sine', 115 * p, 38 * p, .22, .9); A.noise(v, 'brown', .9, .35, 'lowpass', 1400, 180, { at: .03 }); A.fm(v, 900 * p, 1350 * p, 2, .05, .2, { at: .42 }); A.noise(v, 'white', .02, .3, 'bandpass', 2500, 2500, { at: .42, q: 2 }); } },
  shotgun: { g: .72, wet: .18, f(A, v, p) { A.noise(v, 'white', .012, 1, 'highpass', 3000 * p); A.noise(v, 'pink', .24, 1.1, 'lowpass', 3200 * p, 260, { q: .8 }); A.osc(v, 'sine', 120 * p, 38, .2, 1); A.noise(v, 'brown', .5, .35, 'lowpass', 700, 150, { at: .02 }); A.noise(v, 'white', .025, .45, 'bandpass', 2600, 2600, { at: .34, q: 2.5 }); A.osc(v, 'square', 320, 220, .04, .08, { at: .34, f: ['lowpass', 1500] }); A.noise(v, 'white', .03, .55, 'bandpass', 1800, 1800, { at: .47, q: 2 }); A.osc(v, 'sine', 190, 120, .05, .2, { at: .47 }); } },
  scatter: { wpn: 1, g: .62, f(A, v, p) { A.noise(v, 'white', .012, .9, 'highpass', 3000 * p); A.noise(v, 'pink', .2, 1, 'lowpass', 3000 * p, 260); A.osc(v, 'sine', 125 * p, 40, .17, .9); } },
  melee: { wpn: 1, g: .5, f(A, v, p) { A.noise(v, 'white', .11, .7, 'bandpass', 900 * p, 4200 * p, { q: 2 }); A.fm(v, 1900 * p, 2650 * p, 3, .2, .35, { at: .06 }); A.noise(v, 'white', .015, .5, 'highpass', 5000, 5000, { at: .06 }); } },
  claw: { wpn: 1, g: .5, f(A, v, p) { A.noise(v, 'white', .09, .6, 'bandpass', 700 * p, 3200 * p, { q: 1.8 }); A.noise(v, 'pink', .1, .6, 'lowpass', 1200, 300, { at: .05 }); A.osc(v, 'sine', 160 * p, 70, .08, .4, { at: .05 }); } },
  needle: { wpn: 1, g: .38, f(A, v, p) { A.noise(v, 'white', .006, .6, 'highpass', 6000); A.osc(v, 'sine', 3400 * p, 1500 * p, .055, .45); A.osc(v, 'triangle', 1700 * p, 800 * p, .05, .2); } },
  laser: { wpn: 1, g: .45, f(A, v, p) { A.osc(v, 'sawtooth', 1900 * p, 380 * p, .12, .28, { f: ['lowpass', 5000, .7, 1500] }); A.osc(v, 'sawtooth', 1940 * p, 390 * p, .12, .2, { f: ['lowpass', 5000, .7, 1500] }); A.osc(v, 'sine', 950 * p, 240 * p, .15, .45); A.noise(v, 'white', .04, .2, 'bandpass', 3500, 3500, { q: 2 }); } },
  sting: { wpn: 1, g: .45, f(A, v, p) { A.osc(v, 'sine', 2800 * p, 900 * p, .07, .4); A.osc(v, 'square', 1400 * p, 450 * p, .05, .08, { f: ['lowpass', 3000] }); } },
  plasma: { wpn: 1, g: .5, wet: .2, f(A, v, p) { A.osc(v, 'sine', 240 * p, 760 * p, .07, .5, { glide: .07 }); A.osc(v, 'sine', 760 * p, 170 * p, .26, .55, { at: .06, vib: [30, 40] }); A.osc(v, 'square', 95 * p, 60 * p, .22, .12, { f: ['lowpass', 900] }); A.noise(v, 'pink', .2, .35, 'bandpass', 1000 * p, 400, { q: 3 }); } },
  tesla: { wpn: 1, g: .7, f(A, v, p) { A.crackle(v, .16, 1, 2500); A.fm(v, 2300 * p, 170 * p, 9, .1, .25); A.osc(v, 'sawtooth', 120 * p, 110 * p, .13, .22, { f: ['bandpass', 1800, 1.5] }); A.noise(v, 'white', .03, .4, 'highpass', 5000); } },
  storm: { wpn: 1, g: .62, wet: .35, f(A, v, p) { A.crackle(v, .32, 1, 2000); A.fm(v, 1800 * p, 120 * p, 12, .2, .3); A.osc(v, 'sawtooth', 75 * p, 65 * p, .3, .3, { f: ['bandpass', 1400, 1.2] }); A.noise(v, 'brown', .9, .7, 'lowpass', 500, 120, { at: .05 }); A.noise(v, 'white', .04, .6, 'highpass', 4000); } },
  emp: { wpn: 1, g: .45, wet: .2, f(A, v, p) { A.osc(v, 'square', 950 * p, 70 * p, .24, .3, { f: ['bandpass', 1300, 3, 300] }); A.osc(v, 'sine', 70 * p, 40, .26, .5); A.noise(v, 'white', .18, .25, 'highpass', 6000, 1500); } },
  frost: { wpn: 1, g: .55, f(A, v, p) { A.osc(v, 'triangle', 2600 * p, 1700 * p, .13, .3); A.crackle(v, .12, .6, 6000); A.osc(v, 'sine', 1300 * p, 1250 * p, .22, .12, { atk: .02 }); } },
  acid: { wpn: 1, g: .45, f(A, v, p) { A.noise(v, 'pink', .16, .7, 'bandpass', 800 * p, 260, { q: 2.5 }); A.osc(v, 'sine', 320 * p, 90, .12, .4); A.osc(v, 'sine', 600 * p, 1200 * p, .05, .15, { at: .1 }); } },
  lob: { wpn: 1, g: .55, f(A, v, p) { A.noise(v, 'white', .01, .5, 'highpass', 3000); A.osc(v, 'sine', 260 * p, 85 * p, .17, .9); A.noise(v, 'pink', .2, .55, 'lowpass', 1000 * p, 180); A.noise(v, 'white', .12, .12, 'highpass', 2500, 2500, { at: .04, atk: .02 }); } },
  // ---------- armes moyennes ----------
  rocket: { wpn: 1, g: .55, wet: .2, f(A, v, p) { A.noise(v, 'white', .015, .7, 'highpass', 2500); A.noise(v, 'pink', .45, .8, 'bandpass', 500 * p, 2600 * p, { q: 1.4, atk: .03, glide: .25 }); A.noise(v, 'brown', .5, .5, 'lowpass', 350, 200, { atk: .02 }); A.osc(v, 'sine', 140 * p, 60, .12, .4); } },
  swarm: { wpn: 1, g: .5, wet: .2, f(A, v, p) { for (let i = 0; i < 4; i++) { A.noise(v, 'pink', .25, .45, 'bandpass', 700 * p, 2900 * p, { q: 1.6, at: i * .06, atk: .02 }); A.noise(v, 'white', .01, .4, 'highpass', 3000, 3000, { at: i * .06 }); } A.noise(v, 'brown', .6, .4, 'lowpass', 300, 160); } },
  cannon: { wpn: 1, g: .68, wet: .22, f(A, v, p) { A.noise(v, 'white', .015, 1, 'highpass', 3500 * p); A.noise(v, 'pink', .42, 1, 'lowpass', 1800 * p, 120); A.osc(v, 'sine', 115 * p, 36 * p, .36, 1.1); A.noise(v, 'brown', .8, .5, 'lowpass', 320, 90, { at: .02 }); } },
  flak: { wpn: 1, g: .5, f(A, v, p) { A.noise(v, 'white', .012, .9, 'highpass', 4000 * p); A.noise(v, 'pink', .2, .85, 'lowpass', 2600 * p, 300); A.osc(v, 'sine', 170 * p, 60, .16, .7); } },
  napalm: { wpn: 1, g: .62, wet: .22, f(A, v, p) { A.noise(v, 'white', .015, .9, 'highpass', 3000 * p); A.noise(v, 'pink', .38, .9, 'lowpass', 1500 * p, 150); A.osc(v, 'sine', 105 * p, 40, .32, .9); A.noise(v, 'brown', .5, .5, 'bandpass', 600, 300, { at: .05, atk: .05, q: .8 }); } },
  siege: { wpn: 1, g: .8, wet: .3, f(A, v, p) { const d = A.dist(v); A.noise(v, 'white', .02, 1, 'highpass', 3000 * p); A.noise(v, 'pink', .8, 1, 'lowpass', 1400 * p, 80, { to: d }); A.osc(v, 'sine', 90 * p, 26 * p, .7, 1.3); A.noise(v, 'brown', 1.6, .6, 'lowpass', 260, 60, { at: .03 }); } },
  mortar: { wpn: 1, g: .68, wet: .3, f(A, v, p) { A.noise(v, 'white', .012, .6, 'highpass', 2500); A.osc(v, 'sine', 165 * p, 52 * p, .32, 1.1); A.noise(v, 'pink', .35, .7, 'lowpass', 800 * p, 150); A.noise(v, 'white', .3, .18, 'highpass', 1800, 4000, { at: .04, atk: .03 }); A.noise(v, 'brown', .8, .4, 'lowpass', 250, 80, { at: .03 }); } },
  gravity: { wpn: 1, g: .42, wet: .35, f(A, v, p) { A.osc(v, 'sine', 50 * p, 190 * p, .18, .9, { glide: .18 }); A.osc(v, 'sine', 190 * p, 38 * p, .6, .9, { at: .16 }); A.osc(v, 'sawtooth', 110 * p, 55 * p, .5, .25, { f: ['lowpass', 600], det: 9 }); A.noise(v, 'pink', .3, .5, 'lowpass', 600, 200, { atk: .15 }); A.fm(v, 300 * p, 451 * p, 6, .7, .2, { at: .16 }); } },
  // ---------- armes lourdes et titanesques ----------
  rail: { wpn: 1, g: .68, wet: .35, f(A, v, p) { A.noise(v, 'white', .01, 1, 'highpass', 6000); A.osc(v, 'sawtooth', 3200 * p, 90 * p, .45, .3, { glide: .3, f: ['lowpass', 9000, .7, 1200] }); A.noise(v, 'white', .35, .55, 'highpass', 7000, 1400); A.fm(v, 1350 * p, 2030 * p, 4, .9, .22); A.osc(v, 'sine', 95 * p, 32 * p, .4, .8); } },
  beam: { wpn: 1, g: .4, f(A, v) { A.noise(v, 'pink', .15, .4, 'bandpass', 1500, 2500, { q: 1 }); A.osc(v, 'sawtooth', 220, 95, .2, .25, { f: ['lowpass', 1200] }); } },
  cruise: { wpn: 1, g: .78, wet: .3, f(A, v, p) { A.noise(v, 'white', .02, .8, 'highpass', 2000); A.osc(v, 'sine', 75 * p, 38, 1, .9); A.noise(v, 'pink', 1.3, .8, 'bandpass', 250 * p, 1600 * p, { q: 1.1, atk: .12, glide: .9 }); A.noise(v, 'brown', 1.6, .7, 'lowpass', 220, 120, { atk: .05 }); } },
  fusion: { g: .85, nov: 1, wet: .4, reach: 2, f(A, v) { const d = A.dist(v); A.noise(v, 'white', .02, 1, 'highpass', 5000); A.osc(v, 'sawtooth', 2200, 55, .9, .45, { glide: .7, f: ['lowpass', 8000, .7, 600] }); A.osc(v, 'sine', 62, 22, 1.5, 1.3); A.noise(v, 'white', .8, .7, 'highpass', 6500, 500); A.noise(v, 'brown', 2, .9, 'lowpass', 900, 80, { to: d, at: .02 }); A.fm(v, 640, 960, 5, 1.6, .25); } },
  charge: { g: .5, nov: 1, wet: .25, f(A, v) { A.osc(v, 'sawtooth', 110, 1500, 1.3, .3, { atk: 1.15, f: ['lowpass', 600, 2, 6000] }); A.osc(v, 'sine', 220, 3000, 1.3, .25, { atk: 1.2 }); A.noise(v, 'white', 1.3, .2, 'bandpass', 500, 9000, { atk: 1.2, q: 3 }); } },
  launch: { g: .85, nov: 1, wet: .35, reach: 2.5, f(A, v) { A.noise(v, 'pink', 2.4, .9, 'bandpass', 200, 1300, { q: 1, atk: .3, glide: 1.6 }); A.osc(v, 'sine', 52, 34, 2.2, .9, { atk: .1 }); A.noise(v, 'brown', 2.8, .8, 'lowpass', 300, 120, { atk: .2 }); } },
  uplink: { g: .45, nov: 1, wet: .3, f(A, v) { for (let i = 0; i < 3; i++) A.osc(v, 'sine', 1760, 1760, .07, .35, { at: i * .12 }); A.osc(v, 'sine', 1320, 660, .5, .35, { at: .38 }); A.osc(v, 'triangle', 880, 440, .5, .15, { at: .38 }); } },
  whistle: { g: .38, var: .1, reach: 1.3, f(A, v, p, s, o) { const d = o.dur || .8; A.osc(v, 'sine', 2300 * p, 520 * p, d, .4, { atk: d * .6, vib: [7, 25] }); A.noise(v, 'white', d, .1, 'bandpass', 3000, 900, { atk: d * .6, q: 4 }); } },
  // ---------- explosions et impacts ----------
  explo: { g: .78, reach: 1.4, f(A, v, p, s) {
    s = clamp(s, .4, 6); const big = s > 1.4, L = .3 + s * .22, d = big ? A.dist(v) : null;
    A.noise(v, 'white', .02, .9, 'highpass', 2500 * p);
    A.noise(v, 'pink', L, 1.1, 'lowpass', 2600 * p / (1 + s * .3), 110, d ? { to: d } : {});
    A.osc(v, 'sine', 105 * p / Math.sqrt(s), 28, L * 1.1, 1.1);
    A.noise(v, 'brown', L * 2.2, .6 + s * .05, 'lowpass', 340, 70, { at: .02, atk: .02 });
    A.crackle(v, L * 1.3, .3, 1800, { at: .04 });
    if (big) A.osc(v, 'sine', 55 * p, 20, L * 1.8, .8, { at: .01 });
  } },
  nuke: { g: 1, nov: 1, wet: .5, reach: 5, f(A, v) { const d = A.dist(v); A.noise(v, 'white', .05, 1, 'highpass', 2000); A.noise(v, 'pink', 2.6, 1.2, 'lowpass', 3000, 50, { to: d }); A.osc(v, 'sine', 48, 14, 3.4, 1.5); A.noise(v, 'brown', 6, 1.1, 'lowpass', 450, 40, { atk: .08, to: d }); A.crackle(v, 3, .45, 1500, { at: .1 }); A.noise(v, 'white', .8, .35, 'highpass', 5000, 1500, { at: .05 }); A.noise(v, 'brown', 4, .7, 'lowpass', 180, 60, { at: .9, atk: .4 }); } },
  hit: { g: .4, var: .25, f(A, v, p) { A.fm(v, 2300 * p, 3150 * p, 2.2, .07, .45); A.noise(v, 'white', .006, .5, 'highpass', 5000); } },
  hitsoft: { g: .5, var: .2, f(A, v, p) { A.noise(v, 'pink', .07, .6, 'bandpass', 500 * p, 300, { q: 1.4 }); A.osc(v, 'sine', 150 * p, 60, .07, .45); } },
  shield: { g: .4, var: .1, f(A, v, p) { A.fm(v, 1800 * p, 2700 * p, 1.4, .26, .3); A.osc(v, 'sine', 2600 * p, 2400 * p, .3, .12, { atk: .01 }); A.noise(v, 'white', .07, .2, 'highpass', 7000); } },
  crush: { g: .5, var: .2, f(A, v, p) { A.noise(v, 'pink', .26, .8, 'lowpass', 1000 * p, 150); A.crackle(v, .22, .5, 1500); A.osc(v, 'sine', 95 * p, 40, .16, .45); A.fm(v, 190 * p, 280 * p, 5, .22, .12, { at: .03 }); } },
  step: { g: .5, var: .15, reach: 1.3, f(A, v, p) { A.osc(v, 'sine', 72 * p, 26, .3, 1); A.noise(v, 'brown', .28, .6, 'lowpass', 260, 80); A.noise(v, 'white', .2, .12, 'highpass', 3200, 3200, { at: .03, atk: .03 }); A.fm(v, 310 * p, 448 * p, 3, .12, .18); } },
  // ---------- pilote ----------
  hurt: { g: .55, var: .15, wet: .05, f(A, v, p) { A.osc(v, 'sine', 190 * p, 60, .15, .8); A.noise(v, 'pink', .12, .5, 'lowpass', 800, 250); A.noise(v, 'white', .02, .3, 'bandpass', 2500, 2500, { q: 2 }); } },
  dodge: { g: .6, wet: .05, f(A, v, p) { A.noise(v, 'pink', .22, .7, 'bandpass', 1400 * p, 380, { q: 1.2, atk: .03 }); A.noise(v, 'white', .14, .2, 'highpass', 4000, 1200); } },
  reload: { g: .55, wet: .05, f(A, v, p) { A.noise(v, 'white', .02, .7, 'bandpass', 2600 * p, 2600, { q: 2 }); A.fm(v, 820 * p, 1230 * p, 2, .06, .3); A.noise(v, 'pink', .05, .4, 'lowpass', 900, 900, { at: .1 }); } },
  reloaded: { g: .45, wet: .05, f(A, v, p) { A.noise(v, 'white', .025, .7, 'bandpass', 1900 * p, 1900, { q: 2 }); A.osc(v, 'sine', 210 * p, 120, .05, .35); A.noise(v, 'white', .02, .6, 'bandpass', 3100 * p, 3100, { q: 2.5, at: .09 }); A.fm(v, 1050 * p, 1580 * p, 1.8, .07, .25, { at: .09 }); } },
  empty: { g: .55, wet: .05, f(A, v, p) { A.noise(v, 'white', .01, .5, 'highpass', 3000); A.fm(v, 1250 * p, 1720 * p, 1.6, .04, .25); } },
  board: { g: .3, f(A, v, p) { A.osc(v, 'sawtooth', 220 * p, 460 * p, .26, .14, { f: ['lowpass', 1200] }); A.osc(v, 'sine', 130 * p, 60, .12, .6, { at: .2 }); A.noise(v, 'pink', .1, .45, 'lowpass', 500, 500, { at: .2 }); A.fm(v, 700, 1010, 3, .1, .2, { at: .2 }); } },
  death: { g: .7, nov: 1, wet: .4, f(A, v) { A.osc(v, 'sawtooth', 420, 55, 1.6, .2, { f: ['lowpass', 1600] }); A.osc(v, 'sawtooth', 445, 52, 1.6, .2, { f: ['lowpass', 1600] }); A.osc(v, 'sine', 85, 28, 1.2, .8); A.noise(v, 'brown', 1.8, .5, 'lowpass', 400, 60, { atk: .05 }); } },
  heart: { g: .42, nov: 1, wet: 0, f(A, v) { A.osc(v, 'sine', 62, 40, .14, 1); A.osc(v, 'sine', 56, 36, .14, .75, { at: .19 }); A.noise(v, 'brown', .1, .25, 'lowpass', 150, 150); } },
  hitm: { g: .55, var: .06, wet: 0, f(A, v, p) { A.osc(v, 'sine', 2300 * p, 2100 * p, .035, .4); A.noise(v, 'white', .006, .3, 'highpass', 6000); } },
  kill: { g: .45, wet: 0, f(A, v, p) { A.osc(v, 'sine', 1700 * p, 1700 * p, .05, .35); A.osc(v, 'sine', 2550 * p, 2550 * p, .08, .35, { at: .055 }); } },
  // ---------- monde ----------
  pickup: { g: .3, nov: 1, wet: .15, f(A, v, p, s, o) { const f = o.note || 880; A.osc(v, 'sine', f, f, .1, .4); A.osc(v, 'triangle', f * 1.5, f * 1.5, .14, .25, { at: .05 }); A.noise(v, 'white', .03, .08, 'highpass', 8000); if (o.chord) { A.osc(v, 'triangle', f * 1.26, f * 1.26, .6, .2, { at: .1 }); A.osc(v, 'triangle', f * 2, f * 2, .8, .15, { at: .18 }); } } },
  collect: { g: .3, nov: 1, wet: .15, f(A, v) { [1320, 1568, 1760, 2093].forEach((f, i) => A.osc(v, 'triangle', f, f, .12, .3, { at: i * .045 })); A.noise(v, 'white', .05, .08, 'highpass', 7000); } },
  open: { g: .45, f(A, v, p) { A.fm(v, 175 * p, 262 * p, 6, .28, .15); A.noise(v, 'white', .01, .5, 'highpass', 4000, 4000, { at: .2 }); A.osc(v, 'sine', 150 * p, 70, .12, .5, { at: .22 }); A.noise(v, 'pink', .15, .35, 'lowpass', 900, 300, { at: .22 }); A.osc(v, 'sine', 990, 990, .12, .1, { at: .3 }); A.osc(v, 'sine', 1320, 1320, .16, .08, { at: .36 }); } },
  place: { g: .55, f(A, v, p) { A.osc(v, 'sine', 105 * p, 38, .26, 1); A.noise(v, 'brown', .32, .7, 'lowpass', 320, 100); A.noise(v, 'white', .22, .12, 'highpass', 2500, 1200, { at: .03, atk: .02 }); } },
  build: { g: .4, nov: 1, wet: .2, f(A, v) { for (let i = 0; i < 6; i++) A.noise(v, 'white', .015, .5, 'bandpass', 3200, 3200, { at: i * .05, q: 3 }); A.osc(v, 'sine', 880, 880, .4, .3, { at: .32 }); A.osc(v, 'triangle', 1320, 1320, .5, .2, { at: .38 }); } },
  research: { g: .35, nov: 1, wet: .25, f(A, v) { [1175, 1568, 1319, 1760, 2093].forEach((f, i) => A.osc(v, 'sine', f, f, .07, .25, { at: i * .055 })); A.osc(v, 'triangle', 660, 660, .7, .15, { at: .25, atk: .05 }); A.osc(v, 'triangle', 990, 990, .7, .1, { at: .25, atk: .05 }); } },
  beacon: { g: .5, wet: .3, f(A, v, p) { A.osc(v, 'sawtooth', 180 * p, 420 * p, .35, .12, { f: ['lowpass', 1400] }); A.osc(v, 'sine', 1046 * p, 1046 * p, .12, .35, { at: .36 }); A.osc(v, 'sine', 1568 * p, 1568 * p, .25, .3, { at: .5 }); A.osc(v, 'sine', 110, 50, .2, .5, { at: .34 }); } },
  pulse: { g: .45, nov: 1, wet: .7, reach: 3, f(A, v) { A.osc(v, 'sine', 330, 300, 1.6, .4); A.osc(v, 'sine', 165, 160, 1.6, .35); A.osc(v, 'sine', 62, 40, .9, .7); A.noise(v, 'pink', .7, .2, 'bandpass', 520, 120, { q: 2 }); } },
  alarm: { g: .42, nov: 1, wet: .35, f(A, v) { for (let i = 0; i < 3; i++) { A.osc(v, 'sawtooth', 660, 660, .2, .2, { at: i * .42, f: ['lowpass', 2200], hold: .12 }); A.osc(v, 'sawtooth', 495, 495, .2, .2, { at: i * .42 + .21, f: ['lowpass', 2200], hold: .12 }); } } },
  wave: { g: .55, nov: 1, wet: .45, f(A, v) { A.osc(v, 'sawtooth', 110, 104, 1.4, .25, { atk: .15, f: ['lowpass', 900], hold: .6 }); A.osc(v, 'sawtooth', 110.8, 104.5, 1.4, .25, { atk: .15, f: ['lowpass', 900], hold: .6 }); A.osc(v, 'sawtooth', 165, 156, 1.4, .12, { atk: .2, f: ['lowpass', 1100], hold: .6 }); A.noise(v, 'brown', 1.2, .3, 'lowpass', 200, 100, { atk: .2 }); } },
  extract: { g: .6, nov: 1, wet: .4, f(A, v) { A.noise(v, 'pink', 1.6, .5, 'bandpass', 300, 3500, { atk: 1.3, q: 1.5 }); A.osc(v, 'sine', 110, 220, 1.6, .35, { atk: 1.4 }); [440, 554, 659, 880, 1109].forEach((f, i) => { A.osc(v, 'triangle', f, f, 1.4, .18, { at: 1 + i * .09 }); A.osc(v, 'sine', f * 2, f * 2, .9, .06, { at: 1 + i * .09 }); }); } },
  success: { g: .42, nov: 1, wet: .35, f(A, v) { [523, 659, 784, 1047].forEach((f, i) => A.osc(v, 'triangle', f, f, .9 - i * .1, .22, { at: i * .1 })); A.osc(v, 'sine', 1568, 1568, 1, .08, { at: .3, atk: .05 }); } },
  fail: { g: .42, nov: 1, wet: .4, f(A, v) { [440, 415, 349, 330].forEach((f, i) => A.osc(v, 'triangle', f, f, .55, .22, { at: i * .18 })); A.osc(v, 'sine', 110, 82, 1.2, .3, { at: .5 }); } },
  rankup: { g: .4, nov: 1, wet: .3, f(A, v) { [392, 523, 659, 784].forEach((f, i) => { A.osc(v, 'square', f, f, .16, .07, { at: i * .08, f: ['lowpass', 2500] }); A.osc(v, 'triangle', f, f, .3, .18, { at: i * .08 }); }); A.osc(v, 'triangle', 1047, 1047, .7, .2, { at: .32 }); A.noise(v, 'white', .5, .06, 'highpass', 8000, 8000, { at: .32 }); } },
  bossroar: { g: .65, nov: 1, wet: .5, reach: 4, f(A, v) { const d = A.dist(v); A.osc(v, 'sawtooth', 58, 44, 2, .4, { atk: .25, vib: [6, 4], f: ['lowpass', 500], to: d, hold: .8 }); A.osc(v, 'sawtooth', 61, 46, 2, .35, { atk: .3, vib: [5, 5], f: ['lowpass', 450], to: d, hold: .8 }); A.noise(v, 'brown', 2.2, .7, 'lowpass', 300, 100, { atk: .3 }); A.osc(v, 'sine', 40, 30, 1.8, .7, { atk: .2 }); } },
  mine: { g: .35, nov: 1, f(A, v) { A.osc(v, 'square', 1500, 1500, .05, .2, { f: ['lowpass', 3000] }); A.osc(v, 'square', 1500, 1500, .05, .2, { at: .08, f: ['lowpass', 3000] }); } },
  heal: { g: .2, var: .1, f(A, v, p) { A.osc(v, 'sine', 1760 * p, 2200 * p, .09, .3); A.osc(v, 'sine', 2640 * p, 2640 * p, .07, .15, { at: .03 }); } },
  drone: { g: .3, f(A, v, p) { A.osc(v, 'sawtooth', 220 * p, 340 * p, .26, .15, { f: ['lowpass', 2000] }); A.osc(v, 'sawtooth', 224 * p, 345 * p, .26, .15, { f: ['lowpass', 2000] }); } },
  // ---------- interface ----------
  ui: { g: .5, var: .05, wet: 0, f(A, v, p) { A.osc(v, 'sine', 1900 * p, 1500 * p, .035, .5); A.noise(v, 'white', .006, .15, 'highpass', 6000); } },
  uiopen: { g: .42, wet: .05, f(A, v, p) { A.noise(v, 'pink', .18, .4, 'bandpass', 500, 2200, { q: .8, atk: .06 }); A.osc(v, 'sine', 660 * p, 990 * p, .12, .2, { at: .05 }); } },
  uiclose: { g: .55, wet: .05, f(A, v, p) { A.noise(v, 'pink', .16, .4, 'bandpass', 2000, 500, { q: .8, atk: .02 }); A.osc(v, 'sine', 990 * p, 660 * p, .1, .18); } },
  deny: { g: .3, nov: 1, wet: 0, f(A, v) { for (const at of [0, .1]) { A.osc(v, 'square', 196, 190, .08, .25, { at, f: ['lowpass', 1200] }); A.osc(v, 'square', 208, 200, .08, .2, { at, f: ['lowpass', 1200] }); } } },
  // ---------- ambiance ----------
  bloop: { g: .18, var: .4, wet: .3, f(A, v, p) { A.osc(v, 'sine', 260 * p, 820 * p, .09, .5, { atk: .01 }); A.osc(v, 'sine', 520 * p, 1300 * p, .06, .15, { at: .02 }); } },
  clank: { g: .2, var: .3, wet: .45, f(A, v, p) { A.fm(v, 520 * p, 733 * p, 4, .3, .4); A.noise(v, 'white', .02, .3, 'highpass', 4000); } },
  servo: { g: .12, var: .2, wet: .35, f(A, v, p) { A.osc(v, 'sawtooth', 160 * p, 300 * p, .5, .3, { f: ['lowpass', 900], atk: .1 }); } },
  farboom: { g: .35, var: .3, wet: .8, f(A, v, p) { A.noise(v, 'brown', 2, .8, 'lowpass', 260 * p, 60, { atk: .05 }); A.osc(v, 'sine', 55 * p, 28, 1.3, .6); } },
  farsiren: { g: .08, nov: 1, wet: .9, f(A, v) { for (let i = 0; i < 3; i++) A.osc(v, 'sawtooth', 560, 420, .9, .5, { at: i, atk: .3, f: ['lowpass', 900] }); } },
  icecrack: { g: .2, var: .3, wet: .5, f(A, v, p) { A.crackle(v, .35, .8, 3500); A.fm(v, 2900 * p, 4100 * p, 2, .18, .25); A.osc(v, 'sine', 90 * p, 50, .25, .3); } },
  creak: { g: .12, var: .3, wet: .5, f(A, v, p) { A.fm(v, 170 * p, 245 * p, 7, .7, .5, { atk: .2 }); } },
};
// anciens noms conservés
SND.shot = SND.rifle;
SND.bigexplo = { g: .95, reach: 2, nov: 1, f(A, v, p) { SND.explo.f(A, v, p, 3.2); } };
SND.flame = { wpn: 1, g: .3, f(A, v, p) { A.noise(v, 'brown', .22, .9, 'lowpass', 900 * p, 500); A.crackle(v, .2, .4, 2400); } };
// note jouée au ramassage de chaque ressource
const PICK_NOTE = { scrap: 660, alloy: 740, circuits: 880, crystals: 1046, cores: 1318, data: 988, heart: 523 };

// ================= MUSIQUE GÉNÉRATIVE ADAPTATIVE =================
// Chaque ambiance a sa tonalité, son mode, sa progression et son tempo ; l'intensité (0 à 1) ajoute des couches.
const MUSIC = {
  title: { root: 50, sc: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 6], bpm: 70, calm: 1 },
  base: { root: 57, sc: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 6, 4], bpm: 84, calm: 1 },
  cendres: { root: 50, sc: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4], bpm: 96 },
  acide: { root: 52, sc: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 5, 0], bpm: 92 },
  megapole: { root: 49, sc: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 2, 6], bpm: 104 },
  glacier: { root: 54, sc: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 5, 4], bpm: 88 },
  boss: { root: 45, sc: [0, 1, 3, 5, 7, 8, 11], prog: [0, 1, 0, 6], bpm: 100, boss: 1 },
  defense: { root: 55, sc: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], bpm: 112 },
  assault: { root: 55, sc: [0, 2, 3, 5, 7, 8, 10], prog: [0, 3, 5, 4], bpm: 118 },
};
let musCombat = 0, musBoss = false, musScanT = 0;
function musicTarget() {
  if (state === 'title') return ['title', .14];
  if (state === 'result') return ['title', .1];
  if (state === 'base') return attack ? ['defense', attack.phase === 'fight' ? .82 : .5] : ['base', .22];
  if (state === 'assault') return ['assault', .8];
  if (state === 'raid' && W) {
    let I = .28 + alertLv * .05 + musCombat;
    if (B) { if (B.state === 'charging') I = Math.max(I, .58 + B.charge * .22); if (B.state === 'window' || B.state === 'lift') I = 1; }
    if (musBoss) return ['boss', Math.max(.76, I)];
    const R = REGIONS[regionCur || 0]; return [R ? R.id : 'cendres', Math.min(1, I)];
  }
  return [Mus.cur, .06];
}
const Mus = {
  A: null, step: 0, next: 0, cur: 'title', want: 'title', cfg: MUSIC.title, I: .14, IT: .14, timer: null,
  init(A) {
    this.A = A; const c = A.ctx;
    this.out = c.createGain(); this.out.gain.value = 1; this.out.connect(A.mus);
    const s = c.createGain(); s.gain.value = .3; this.out.connect(s); s.connect(A.verbIn);
    this.step = 0; this.next = c.currentTime + .15; this.padG = null;
  },
  start() { if (this.timer || !this.A || this.A.offline) return; this.timer = setInterval(() => this.sched(.3), 60); },
  sched(ahead) {
    const c = this.A.ctx; if (!this.A.offline && c.state !== 'running') return;
    if (this.next < c.currentTime - .3) this.next = c.currentTime + .05;
    let guard = 0;
    while (this.next < c.currentTime + ahead && guard++ < 4000) { this.playStep(this.next); this.next += 15 / this.cfg.bpm; this.step++; }
  },
  tick(dt) {
    musScanT -= dt;
    if (musScanT <= 0 && state === 'raid' && player) {
      musScanT = .5; let n = 0, boss = false; const F = player.inside || player;
      for (const u of units) {
        if (u.team === 0 || u.dead || !u.active || u.kind === 'building' || u.etype === 'cible') continue;
        const q = d2(u.x, u.y, F.x, F.y), engaged = u.target || (u.net && time - (u.lastFire || -9) < 3);
        if (q < 1000 * 1000 && engaged) n += u.boss || u.giant ? 6 : u.elite ? 3 : 1;
        if ((u.boss || u.giant) && q < (1500 + u.r) ** 2 && engaged) { boss = true; if (!u.roared) { u.roared = true; SFX.play('bossroar', 1, u.x, u.y); buzz([100, 50, 100]); } }
      }
      musCombat = Math.min(.42, n * .045); musBoss = boss;
    }
    const [m, I] = musicTarget(); this.want = MUSIC[m] ? m : 'cendres'; this.IT = I;
    this.I += (this.IT - this.I) * Math.min(1, dt * (this.IT > this.I ? 1.1 : .3));
  },
  hz(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  deg(d, oct = 0) { const sc = this.cfg.sc, L = sc.length, o = Math.floor(d / L); return this.cfg.root + sc[((d % L) + L) % L] + 12 * (o + oct); },
  lay(I, th) { return clamp((I - th) / .14, 0, 1); },
  playStep(t) {
    // changement de morceau : à la mesure, ou au temps suivant quand la tension monte (boss, attaque, fenêtre d'extraction)
    if (this.want !== this.cur) {
      const urgent = MUSIC[this.want].boss || this.want === 'defense' || this.want === 'assault' || this.IT > .75;
      if (this.step % (urgent ? 4 : 16) === 0) {
        this.cur = this.want; this.cfg = MUSIC[this.cur]; this.step = 0;
        if (this.padG) this.padG.gain.setTargetAtTime(0, t, urgent ? .25 : .9);
      }
    }
    const A = this.A, I = this.I, cfg = this.cfg, b = this.step % 16, sp = 15 / cfg.bpm;
    const ch = cfg.prog[Math.floor(this.step / 32) % cfg.prog.length];
    const v = { in: this.out, t, end: t };
    // nappe : un accord toutes les deux mesures
    if (this.step % 32 === 0) {
      const pg = A.ctx.createGain(); pg.connect(this.out); const old = this.padG; this.padG = pg;
      if (old) setTimeout(() => { try { old.disconnect(); } catch (e) { } }, (34 * sp + 3) * 1000);
      const pv = { in: pg, t, end: t };
      const dur = 32 * sp + 1.4, cut = 500 + I * 1500, notes = [this.deg(ch, -1), this.deg(ch + 2, -1), this.deg(ch + 4, -1), this.deg(ch, -2)];
      for (const n of notes) for (const det of [-8, 8]) A.osc(pv, 'sawtooth', this.hz(n), 0, dur, .028, { atk: 1.4, hold: dur - 2.6, det, f: ['lowpass', cut, .6] });
      if (cfg.boss) A.osc(pv, 'sawtooth', this.hz(this.deg(0, -3)), 0, dur, .05, { atk: 1, hold: dur - 2, f: ['lowpass', 220, 1.5] });
    }
    // basse
    const lb = this.lay(I, .3);
    if (lb > 0) {
      const pat = I > .8 ? [0, 2, 3, 6, 8, 10, 11, 14] : I > .55 ? [0, 3, 6, 8, 11, 14] : [0, 8];
      if (pat.includes(b)) { const n = this.deg(ch, -2) + ((b === 6 || b === 14) && I > .55 ? 7 : 0); A.osc(v, 'sawtooth', this.hz(n), 0, sp * 1.8, .1 * lb, { f: ['lowpass', 260 + I * 500, 1.2] }); A.osc(v, 'sine', this.hz(n - 12), 0, sp * 1.8, .12 * lb); }
    }
    // batterie
    const ld = this.lay(I, .44);
    if (ld > 0) {
      const kick = I > .85 ? [0, 3, 6, 8, 11, 14] : I > .62 ? [0, 7, 8, 10] : [0, 8];
      if (kick.includes(b)) { A.osc(v, 'sine', 120, 42, .28, .32 * ld); A.noise(v, 'white', .005, .08 * ld, 'highpass', 3000); }
      if (I > .6 && (b === 4 || b === 12 || (I > .86 && b === 15))) { A.noise(v, 'white', .14, .14 * ld * (b === 15 ? .5 : 1), 'bandpass', 1900, 1900, { q: .8 }); A.osc(v, 'triangle', 190, 160, .08, .08 * ld); }
      const hstep = I > .88 ? 1 : I > .7 ? 2 : 4;
      if (I > .5 && b % hstep === (hstep === 4 ? 2 : 0)) A.noise(v, 'white', .035, (b % 4 === 2 ? .06 : .04) * ld, 'highpass', 7500);
    }
    if (cfg.boss && I > .5 && [0, 3, 6, 10].includes(b)) { A.osc(v, 'sine', 95, 52, .45, .17); A.noise(v, 'brown', .2, .09, 'lowpass', 400); }
    // arpège
    const chord = [this.deg(ch, 1), this.deg(ch + 2, 1), this.deg(ch + 4, 1), this.deg(ch + 7, 1)];
    if (cfg.calm) {
      if (b % 4 === 0 && Math.random() < .55) { const n = pick(chord) + 12; A.osc(v, 'sine', this.hz(n), 0, 1.1, .045); A.osc(v, 'triangle', this.hz(n) * 2, 0, .5, .012); }
    } else {
      const la = this.lay(I, .5), as = I > .82 ? 1 : 2;
      if (la > 0 && b % as === 0) { const n = chord[(this.step / as) % chord.length | 0]; A.osc(v, 'square', this.hz(n), 0, sp * 1.4, .028 * la, { f: ['lowpass', 1300 + I * 900, 1] }); }
    }
    // accords de cuivres au paroxysme
    const ls = this.lay(I, .86);
    if (ls > 0 && (b === 0 || b === 6 || b === 12)) for (const k of [0, 2, 4]) A.osc(v, 'sawtooth', this.hz(this.deg(ch + k)), 0, .32, .035 * ls, { atk: .02, f: ['lowpass', 2200] });
  },
};

// ================= AMBIANCES (vent, bourdonnements, événements lointains) =================
const AMB = {
  silent: { w: 0, wf: 400, gu: 0, gf: 1200, hum: 0, hf: 55, ev: {} },
  title: { w: .3, wf: 380, gu: .05, gf: 1300, hum: 0, hf: 55, ev: { farboom: .03 } },
  base: { w: .1, wf: 300, gu: 0, gf: 1000, hum: .045, hf: 55, ev: { clank: .22, servo: .07 } },
  assault: { w: .16, wf: 380, gu: .03, gf: 1200, hum: .05, hf: 55, ev: { farboom: .05, clank: .05 } },
  cendres: { w: .34, wf: 420, gu: .08, gf: 1300, hum: 0, hf: 55, ev: { farboom: .04, creak: .04 } },
  acide: { w: .14, wf: 260, gu: .02, gf: 900, hum: .04, hf: 38, ev: { bloop: 1.1, creak: .02 } },
  megapole: { w: .22, wf: 600, gu: .06, gf: 1700, hum: .03, hf: 49, ev: { farsiren: .02, farboom: .05, creak: .06 } },
  glacier: { w: .46, wf: 720, gu: .2, gf: 2000, hum: 0, hf: 55, ev: { icecrack: .09, farboom: .02 } },
};
function ambTarget() {
  if (state === 'title') return 'title';
  if (state === 'base') return 'base';
  if (state === 'assault') return 'assault';
  if (state === 'raid' && regionCur !== null && REGIONS[regionCur]) return REGIONS[regionCur].id;
  return 'silent';
}
const Amb = {
  A: null, ch: [], cur: 'silent', walk: 0,
  init(A) {
    this.A = A; const c = A.ctx; this.ch = [];
    for (const pan of [-.65, .65]) {
      const s = c.createBufferSource(); s.buffer = A.buf.pink; s.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = .8;
      const g = c.createGain(); g.gain.value = 0; const p = c.createStereoPanner(); p.pan.value = pan;
      s.connect(f); f.connect(g); g.connect(p); p.connect(A.amb); s.start(0, Math.random() * 1.5); this.ch.push({ f, g });
    }
    const gs = c.createBufferSource(); gs.buffer = A.buf.white; gs.loop = true;
    this.gf = c.createBiquadFilter(); this.gf.type = 'bandpass'; this.gf.frequency.value = 1300; this.gf.Q.value = 6;
    this.gg = c.createGain(); this.gg.gain.value = 0; gs.connect(this.gf); this.gf.connect(this.gg); this.gg.connect(A.amb); gs.start(0, Math.random());
    // pluie : bruit blanc filtré, réglé par la météo
    const rs = c.createBufferSource(); rs.buffer = A.buf.white; rs.loop = true; this.rf = c.createBiquadFilter(); this.rf.type = 'bandpass'; this.rf.frequency.value = 3200; this.rf.Q.value = .5;
    const rh = c.createBiquadFilter(); rh.type = 'highpass'; rh.frequency.value = 900; this.rg = c.createGain(); this.rg.gain.value = 0; rs.connect(rh); rh.connect(this.rf); this.rf.connect(this.rg); this.rg.connect(A.amb); rs.start(0, Math.random());
    this.hg = c.createGain(); this.hg.gain.value = 0; this.hg.connect(A.amb); this.hs = [];
    for (const [m, ty, vv] of [[1, 'sine', .6], [2, 'sine', .3], [3, 'triangle', .08]]) { const o = c.createOscillator(); o.type = ty; o.frequency.value = 55 * m; const g = c.createGain(); g.gain.value = vv; o.connect(g); g.connect(this.hg); o.start(0); this.hs.push([o, m]); }
  },
  tick(dt) {
    const k = ambTarget(), P = AMB[k] || AMB.silent, A = this.A, t = A.ctx.currentTime;
    this.walk -= dt;
    if (this.walk <= 0 || k !== this.cur) {
      this.walk = .7 + Math.random() * .9; this.cur = k;
      const wx = (state === 'raid' || state === 'base' || state === 'assault') && typeof ENV !== 'undefined' ? ENV.P : null, ww = wx ? clamp(.7 + wx.wind * .5, .7, 1.9) : 1;
      for (const c of this.ch) { c.f.frequency.setTargetAtTime(P.wf * (.7 + Math.random() * .6) * (wx && wx.dust ? 1.5 : 1), t, 1.1); c.g.gain.setTargetAtTime(P.w * (.55 + Math.random() * .6) * ww, t, .9); }
      const rain = wx && (wx.p === 'rain' || wx.p === 'acid') ? clamp(wx.n / 300, 0, 1.3) : 0;
      this.rg.gain.setTargetAtTime(rain * .22, t, 1.5); this.rf.frequency.setTargetAtTime(2600 + Math.random() * 1400, t, .8);
      this.gf.frequency.setTargetAtTime(P.gf * (.8 + Math.random() * .5), t, .6);
      this.gg.gain.setTargetAtTime(P.gu * Math.random() * Math.random() * 2, t, .8);
      this.hg.gain.setTargetAtTime(P.hum, t, 1.2);
      for (const [o, m] of this.hs) o.frequency.setTargetAtTime(P.hf * m, t, 1);
    }
    if (paused || drawerOpen) return;
    for (const e in P.ev) if (Math.random() < P.ev[e] * dt) A.play(e, .6 + Math.random() * .5, undefined, undefined, { bus: 'amb', pan: Math.random() * 1.6 - .8 });
    if (state === 'raid' && alertLv >= 3 && Math.random() < .05 * (alertLv - 2) * dt) A.play('farboom', .8, undefined, undefined, { bus: 'amb', pan: Math.random() * 1.6 - .8 });
  },
};

// ================= VIBRATIONS, MARQUEURS DE TIR, INDICATEURS DE DÉGÂTS =================
let buzzT = 0, hitMarkT = 0, killMarkT = 0, dmgDirs = [];
function buzz(pat) {
  if (EXPSIM) return;
  if (typeof TOUCH === 'undefined' || !TOUCH.on || settings.haptics === false || !navigator.vibrate) return;
  const n = performance.now(); if (n - buzzT < 90) return; buzzT = n;
  try { navigator.vibrate(pat); } catch (e) { }
}
const isMine = s => !!s && !!player && (s === player || s === player.inside);
function playerHurt(u, amt, src) {
  SFX.play('hurt', clamp(.4 + amt / 30, .4, 1));
  buzz(amt > 25 ? 45 : 22);
  if (src && src.x !== undefined && src !== u && !src.dead) {
    const a = Math.atan2(src.y - u.y, src.x - u.x), same = dmgDirs.find(d => Math.abs(Math.atan2(Math.sin(d.a - a), Math.cos(d.a - a))) < .3);
    if (same) { same.a = a; same.t = 1; } else { dmgDirs.push({ a, t: 1 }); if (dmgDirs.length > 6) dmgDirs.shift(); }
  }
}
