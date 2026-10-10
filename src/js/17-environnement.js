// Environnement : heure, météo, lumières, traces et épaves.

// ================= ENVIRONNEMENT : HEURE, MÉTÉO, LUMIÈRES, TRACES, ÉPAVES =================
// Tout est visuel, sauf deux effets légers : de nuit et par mauvais temps, ennemis et pilote voient un peu moins loin.
// En raid partagé, l'heure et la météo découlent de la graine commune : tous les joueurs voient le même ciel.
const fxQ = () => settings.fx === 'low' || settings.fx === 'mid' || settings.fx === 'high' ? settings.fx : fxAuto || (TOUCH.on ? 'mid' : 'high');
// qualité automatique : si l'appareil peine, on baisse d'un cran ; quand il retrouve de l'aisance (moins de monde à l'écran,
// zoom plus proche), on remonte, sans dépasser le réglage d'origine. Une remontée qui ne tient pas deux fois de suite n'est plus retentée.
let fxAuto = null, fxAcc = 0, fxN = 0, fxGood = 0, fxUpT = -1e9, fxFails = 0;
function fxAutoTick(rdt) {
  if (settings.fx !== 'auto' || !inGame() || paused || drawerOpen) { fxAcc = 0; fxN = 0; return; }
  fxAcc += rdt; fxN++;
  if (fxAcc < 5) return;
  const fps = fxN / fxAcc * (settings.fps30 ? 2 : 1), now = performance.now(); fxAcc = 0; fxN = 0;
  const lv = ['low', 'mid', 'high'], i = lv.indexOf(fxQ()), top = TOUCH.on ? 1 : 2;
  if (fps < 38 && (i > 0 || (fps < 32 && resScale > .7))) {
    fxGood = 0; if (now - fxUpT < 20000) fxFails++;
    if (i > 0) fxAuto = lv[i - 1]; else { resScale = Math.max(.7, resScale - .15); resize(); }
    return;
  }
  if (fps > 54 && fxFails < 2 && ++fxGood >= 2) {
    fxGood = 0;
    if (resScale < 1) { resScale = Math.min(1, resScale + .15); resize(); fxUpT = now; }
    else if (fxAuto && i < top) { fxAuto = i + 1 >= top ? null : lv[i + 1]; fxUpT = now; }
  } else if (fps <= 54) fxGood = 0;
}
const fxK = () => ({ high: 1, mid: .55, low: .2 })[fxQ()];
const WX = { // temps possibles par région, avec leur poids
  cendres: [['clair', 4], ['cendres', 4], ['couvert', 2], ['tempête de cendres', 1.4]],
  acide: [['brume', 4], ['pluie acide', 3], ['couvert', 1.5], ['orage', 1.4]],
  megapole: [['smog', 3], ['pluie', 3], ['couvert', 2], ['orage', 1.4]],
  glacier: [['clair', 3], ['neige', 4], ['couvert', 1.5], ['blizzard', 1.4]],
  base: [['clair', 6], ['couvert', 2], ['pluie', 1]],
};
const WXK = {
  clair: { p: '', n: 0, fog: 0, cloud: .35, dark: 0, wind: .5, col: [200, 200, 200] },
  couvert: { p: '', n: 0, fog: .04, cloud: .85, dark: .1, wind: .8, col: [120, 122, 128] },
  cendres: { p: 'ash', n: 150, fog: .07, cloud: .55, dark: .05, wind: .8, col: [118, 108, 96] },
  'tempête de cendres': { p: 'ash', n: 340, dust: 1, fog: .2, cloud: .95, dark: .16, wind: 1.7, col: [126, 104, 82] },
  brume: { p: '', n: 0, fog: .15, cloud: .45, dark: .04, wind: .3, col: [118, 152, 92] },
  'pluie acide': { p: 'acid', n: 250, fog: .09, cloud: .9, dark: .12, wind: .9, col: [108, 150, 76] },
  orage: { p: 'rain', n: 400, fog: .12, cloud: 1, dark: .22, wind: 1.5, col: [92, 102, 118], storm: 1 },
  smog: { p: 'dust', n: 90, fog: .19, cloud: .65, dark: .08, wind: .4, col: [132, 116, 88] },
  pluie: { p: 'rain', n: 270, fog: .07, cloud: .9, dark: .1, wind: .9, col: [112, 122, 134] },
  neige: { p: 'snow', n: 230, fog: .07, cloud: .7, dark: .03, wind: .6, col: [205, 214, 228] },
  blizzard: { p: 'snow', n: 520, dust: 1, fog: .28, cloud: 1, dark: .1, wind: 2.1, col: [218, 226, 236] },
};
// noms affichés des temps (les clés de WXK restent en français : elles servent à la logique)
const WX_TXT = { clair: TL('clair'), couvert: TL('couvert'), cendres: TL('cendres'), 'tempête de cendres': TL('tempête de cendres'), brume: TL('brume'), 'pluie acide': TL('pluie acide'), orage: TL('orage'), smog: TL('smog'), pluie: TL('pluie'), neige: TL('neige'), blizzard: TL('blizzard') };
const ENV = {
  h0: 13, rate: 0, hour: 13, dark: 0, night: 0, dusk: 0, sun: 1, tint: [8, 14, 32], kind: 'clair', P: Object.assign({}, WXK.clair),
  sched: [], region: 'base', wind: { a0: 0, a: 0, s: 30, x: 20, y: 10 }, flash: 0, thunder: [], clouds: [], drops: [], fogs: [],
  sightMul: 1, revealMul: 1, camX: 0, camY: 0, lightT: 0, seedR: null,
  start(seed, rid) {
    const R = mulberry32((seed ^ 0x3c6ef372) >>> 0); this.seedR = R; this.region = rid;
    const r = R(), h = r < .28 ? 6.5 + R() * 3.5 : r < .6 ? 10 + R() * 6 : r < .84 ? 16 + R() * 3.8 : 20 + R() * 8;
    const fixed = settings.daynight === false || TUT.on;
    this.h0 = fixed ? 12.5 : h % 24; this.rate = fixed ? 0 : 1 / 75; // une heure de jeu toutes les 75 s
    const L = WX[rid] || WX.cendres, tot = L.reduce((s, x) => s + x[1], 0);
    const pk = () => { let x = R() * tot; for (const [k, w] of L) { x -= w; if (x <= 0) return k; } return L[0][0]; };
    this.sched = []; let t = 0, prev = '';
    while (t < 5400) { let k = TUT.on ? 'clair' : pk(); if (k === prev && R() < .5) k = pk(); this.sched.push({ t, k, d: 80 + R() * 140 }); prev = k; t += this.sched[this.sched.length - 1].d; }
    this.wind.a0 = R() * TAU;
    this.seedSalt = 1 + Math.floor(R() * 1000); this.cox = R() * 3000; this.coy = R() * 3000; this.fox = 0; this.foy = 0;
    this.drops = []; this.thunder = []; this.flash = 0; this.base = false; this.tick(0);
  },
  startBase() {
    this.start((Date.now() / 86400000 | 0) * 7919, 'base'); this.base = true;
    if (settings.daynight === false || TUT.on) this.h0 = 12.5; this.rate = 0; this.tick(0);
  },
  clock() { if (this.base && !(settings.daynight === false || TUT.on)) { const d = new Date(); return d.getHours() + d.getMinutes() / 60; } return (this.h0 + (state === 'raid' ? raidTime : 0) * this.rate) % 24; },
  hhmm() { const h = this.clock(); return String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); },
  isNight() { return this.night > .5; },
  label(long) { const n = WX_TXT[this.kind] || this.kind, k = { 'tempête de cendres': TL('tempête'), 'pluie acide': WX_TXT['pluie acide'] }[this.kind] || n; return (this.night > .5 ? '☾ ' : '') + this.hhmm() + ' · ' + (long ? n : k); },
  tick(dt) {
    const t = state === 'raid' ? raidTime : time;
    // météo : segment courant et fondu de 20 s avec le précédent
    let i = 0; while (i < this.sched.length - 1 && this.sched[i + 1].t <= t) i++;
    const S = this.sched[i] || { t: 0, k: 'clair' }, Pv = this.sched[i - 1], w = Pv ? clamp((t - S.t) / 20, 0, 1) : 1;
    const A = WXK[Pv ? Pv.k : S.k] || WXK.clair, Bk = WXK[S.k] || WXK.clair, P = this.P;
    for (const k of ['n', 'fog', 'cloud', 'dark', 'wind']) P[k] = lerp(A[k], Bk[k], w);
    P.col = [0, 1, 2].map(j => lerp(A.col[j], Bk.col[j], w));
    P.p = w < .5 ? A.p : Bk.p; P.n = w < .5 ? A.n * (1 - w * 2) : Bk.n * (w * 2 - 1); P.storm = (w < .5 ? A.storm : Bk.storm) || 0; P.dust = (w < .5 ? A.dust : Bk.dust) || 0;
    if (P.p === 'rain' && this.region === 'acide') P.p = 'acid';
    this.kind = w < .5 && Pv ? Pv.k : S.k;
    // vent : direction qui tourne lentement, force selon le temps
    const wd = this.wind; wd.a = wd.a0 + Math.sin(t / 95) * .7 + Math.sin(t / 31) * .15; wd.s = 26 + 70 * P.wind * (1 + .25 * Math.sin(t * .7) * Math.sin(t * .23));
    wd.x = Math.cos(wd.a) * wd.s; wd.y = Math.sin(wd.a) * wd.s;
    // heure, soleil, nuit, crépuscule
    const h = this.hour = this.clock(), sun = this.sun = Math.cos((h - 13) / 12 * Math.PI);
    this.night = clamp((-.02 - sun) / .42, 0, 1); this.dusk = clamp(1 - Math.abs(sun - .02) / .32, 0, 1);
    let dark = this.night * (this.region === 'glacier' ? .5 : .6) + P.dark * (1 - this.night * .5) + this.dusk * .06;
    this.dark = clamp(dark, 0, .72);
    const nt = [7, 13, 34], dk = [52, 26, 14], fc = P.col.map(v => v * .35);
    const kd = this.night > 0 ? 1 : 0, kw = this.dusk * (1 - this.night);
    this.tint = [0, 1, 2].map(j => Math.round(lerp(lerp(fc[j], dk[j], kw), nt[j], this.night)));
    this.sightMul = clamp(1 - .2 * this.night - .5 * Math.max(0, P.fog - .05), .68, 1);
    this.revealMul = clamp(1 - .14 * this.night - .4 * Math.max(0, P.fog - .05), .72, 1);
    if (!dt) return;
    // nuages et bancs de brume qui dérivent avec le vent
    this.cox = (this.cox || 0) + wd.x * dt * .7; this.coy = (this.coy || 0) + wd.y * dt * .7;
    this.fox = (this.fox || 0) + wd.x * dt * .4; this.foy = (this.foy || 0) + wd.y * dt * .4;
    // éclairs et tonnerre
    this.flash = Math.max(0, this.flash - dt * 3.2);
    if (P.storm && !paused && Math.random() < dt * .07 * P.storm) { this.flash = .8 + Math.random() * .2; this.thunder.push({ t: rnd(.35, 2.6), v: 1 }); }
    for (let k = this.thunder.length - 1; k >= 0; k--) { const th = this.thunder[k]; th.t -= dt; if (th.t <= 0) { SFX.play('thunder', clamp(1.1 - th.t * .1, .5, 1), undefined, undefined, { bus: 'amb', pan: Math.random() * 1.4 - .7 }); this.thunder.splice(k, 1); } }
    this.dropsTick(dt);
  },
  // précipitations en espace écran, ancrées au monde (elles glissent quand la caméra bouge)
  dropsTick(dt) {
    if ((EXPSIM && !EXPSIM.viewing)) return;
    const P = this.P, want = Math.round(P.n * fxK() * clamp(VW * VH / (1280 * 760), .45, 1.6));
    const D = this.drops;
    while (D.length < want) D.push({ x: Math.random() * VW, y: Math.random() * VH, z: rnd(.55, 1.25), s: Math.random() });
    if (D.length > want) D.length = want;
    const z = cam.zoom, mx = (cam.x - this.camX) * z, my = (cam.y - this.camY) * z; this.camX = cam.x; this.camY = cam.y;
    const jump = Math.abs(mx) > VW * .5 || Math.abs(my) > VH * .5;
    const wx = this.wind.x * z, wy = this.wind.y * z, ty = P.p;
    const fall = ty === 'rain' ? 780 : ty === 'acid' ? 620 : ty === 'snow' ? 60 : ty === 'ash' ? 34 : 0;
    const wk = ty === 'rain' || ty === 'acid' ? 2.2 : ty === 'dust' ? 5 : P.dust ? 5 : 2.6;
    for (const d of D) {
      d.vx = wx * wk * d.z + (ty === 'snow' || ty === 'ash' ? Math.sin(time * 1.3 + d.s * 9) * 14 : 0);
      d.vy = wy * wk * d.z + fall * d.z * z;
      d.x += d.vx * dt - (jump ? 0 : mx * d.z); d.y += d.vy * dt - (jump ? 0 : my * d.z);
      if (d.x < -30) d.x += VW + 60; else if (d.x > VW + 30) d.x -= VW + 60;
      if (d.y < -30) d.y += VH + 60; else if (d.y > VH + 30) d.y -= VH + 60;
    }
    // éclaboussures de pluie au sol
    if ((ty === 'rain' || ty === 'acid') && fxQ() !== 'low' && !paused && state !== 'title') {
      const n = Math.random() < P.n / 400 * 3 * dt * 60 ? 1 : 0;
      for (let k = 0; k < n; k++) { const p = screenToWorld(Math.random() * VW, Math.random() * VH); parts.push({ type: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: .28, max: .28, size: 5 + Math.random() * 3, col: ty === 'acid' ? 'rgba(170,230,110,.7)' : 'rgba(200,215,230,.6)', thin: true }); }
    }
  },
  drawDrops(c) {
    const P = this.P, ty = P.p; if (!ty || !this.drops.length) return;
    const k = clamp(P.n / 200, .3, 1), col = P.col, night = 1 - this.dark * .55;
    c.save();
    if (ty === 'rain' || ty === 'acid') {
      c.strokeStyle = ty === 'acid' ? `rgba(${170 * night | 0},${225 * night | 0},${120 * night | 0},.5)` : `rgba(${205 * night | 0},${215 * night | 0},${228 * night | 0},.42)`; c.lineCap = 'round';
      c.beginPath(); c.lineWidth = 1.1;
      for (const d of this.drops) { const l = .028 * d.z; c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * l, d.y - d.vy * l); }
      c.globalAlpha = .55 + k * .4; c.stroke();
    } else if (ty === 'snow') {
      c.fillStyle = `rgba(${240 * night | 0},${245 * night | 0},${255 * night | 0},.85)`;
      for (const d of this.drops) { const s = 1 + d.z * 1.8; c.globalAlpha = .45 + d.z * .4; c.fillRect(d.x - s / 2, d.y - s / 2, s, s); }
      if (P.dust) { c.strokeStyle = 'rgba(235,240,250,.25)'; c.beginPath(); for (let i = 0; i < this.drops.length; i += 3) { const d = this.drops[i]; c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * .05, d.y - d.vy * .05); } c.stroke(); }
    } else if (ty === 'ash') {
      for (const d of this.drops) { const s = .8 + d.z * 1.7; c.globalAlpha = .35 + d.z * .3; c.fillStyle = d.s > .7 ? `rgb(${col[0] * .5 | 0},${col[1] * .5 | 0},${col[2] * .5 | 0})` : `rgb(${col[0] * night | 0},${col[1] * night | 0},${col[2] * night | 0})`; c.fillRect(d.x, d.y, s, s * .7); }
      if (P.dust) { c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.22)`; c.beginPath(); for (let i = 0; i < this.drops.length; i += 2) { const d = this.drops[i]; c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * .06, d.y - d.vy * .06); } c.stroke(); }
    } else if (ty === 'dust') {
      c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.3)`; c.beginPath();
      for (const d of this.drops) { c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * .04, d.y - d.vy * .04); } c.stroke();
    }
    c.restore();
  },
  // ombres des nuages et nappes de brume : une grille infinie qui glisse avec le vent, autour de la caméra
  sky(c, vx0, vy0, vx1, vy1, cs, ox, oy, chance, fn) {
    const i0 = Math.floor((vx0 - ox) / cs) - 1, i1 = Math.floor((vx1 - ox) / cs) + 1, j0 = Math.floor((vy0 - oy) / cs) - 1, j1 = Math.floor((vy1 - oy) / cs) + 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const h = hash2(i, j, 31), seed = this.seedSalt || 7; if (h > chance) continue;
      const x = ox + (i + hash2(i, j, seed)) * cs, y = oy + (j + hash2(j, i, seed + 3)) * cs, sz = cs * (.55 + hash2(i, j, 57) * .6);
      if (x + sz < vx0 || x - sz > vx1 || y + sz < vy0 || y - sz > vy1) continue;
      fn(x, y, sz, hash2(i, j, 77));
    }
  },
  drawSky() { },
  // nuages et brume dessinés dans la couche d'atmosphère en basse résolution (L), en coordonnées écran réduites
  skyLow(L, s, ox, oy, z, vx0, vy0, vx1, vy1) {
    const P = this.P, q = fxQ(); if (q === 'low') return;
    // de très haut, nuages et bancs de brume deviennent des taches qui brouillent la carte : on les estompe
    const fz = clamp(.35 + (z - .08) * 2.2, .35, 1), sh = P.cloud * clamp(this.sun + .3, 0, 1) * .22 * fz;
    const tr = (x, y, sz, ky, spr, a) => { L.globalAlpha = a; const X = (x * z + ox) * s, Y = (y * z + oy) * s, S = sz * z * s; L.drawImage(spr, X - S, Y - S * ky, S * 2, S * 2 * ky); };
    if (sh > .01) { const spr = FX.cloudSpr(); this.sky(null, vx0, vy0, vx1, vy1, 1500, this.cox || 0, this.coy || 0, .25 + P.cloud * .5, (x, y, sz, r) => tr(x, y, sz, .7, spr, sh * (.6 + r * .4))); }
    if (P.fog > .03) { const spr = FX.fogSpr(), a = Math.min(.5, P.fog * 2.1) * (1 - this.dark * .6) * fz; this.sky(null, vx0, vy0, vx1, vy1, 760, this.fox || 0, this.foy || 0, clamp(P.fog * 3.2, .2, .85), (x, y, sz, r) => tr(x, y, sz, .6, spr, a * (.5 + r * .5))); }
    L.globalAlpha = 1;
  },
  // voile uniforme : obscurité, brume et lumière du crépuscule mêlées en une seule couleur
  veil() {
    const P = this.P, d = this.dark * (1 - this.flash * .75), f = P.fog * (1 - this.dark * .6), u = this.dusk > .05 && this.night < .9 ? .06 * this.dusk * (1 - this.night) : 0;
    const L = [[this.tint, d], [P.col, f], [[255, 128, 52], u]]; let A = 0; const col = [0, 0, 0];
    for (const [c, a] of L) { if (a <= 0) continue; for (let j = 0; j < 3; j++) col[j] = col[j] * (1 - a) + c[j] * a; A = A + a * (1 - A); }
    if (A <= 0) return null; for (let j = 0; j < 3; j++) col[j] = Math.round(col[j] / A);
    return [col, A];
  },
  // brume générale, éclair : par-dessus le monde, sous le HUD
  drawScreen(c) {
    if (this.flash > 0) { c.fillStyle = `rgba(225,232,255,${(this.flash * (settings.flash ? .42 : .12)).toFixed(3)})`; c.fillRect(0, 0, VW, VH); }
  },
};

// ---------- lumières : obscurité découpée par les sources, puis halos colorés ----------
const LIGHT = {
  list: [], cv: null, cx: null, gv: null, gx: null, spr: {},
  add(x, y, r, col, a, cone) { if (a > .06 && this.list.length < 180) this.list.push({ x, y, r, c: col, a, cone }); },
  sprite(col) {
    let s = this.spr[col]; if (s) return s;
    s = cvs(64, 64); const c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (col === 'w') { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
    else { g.addColorStop(0, col + 'ff'); g.addColorStop(.35, col + '80'); g.addColorStop(1, col + '00'); }
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return this.spr[col] = s;
  },
  coneSpr() {
    if (this.spr.cone) return this.spr.cone;
    const s = cvs(128, 128), c = s.getContext('2d'), g = c.createRadialGradient(0, 64, 0, 0, 64, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.6, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    for (const [w, a] of [[.5, .35], [.36, .5], [.24, .7]]) { c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.moveTo(0, 64); c.lineTo(128, 64 - 128 * Math.tan(w)); c.lineTo(128, 64 + 128 * Math.tan(w)); c.closePath(); c.fill(); }
    return this.spr.cone = s;
  },
  // sources de lumière de l'image en cours
  collect(vx0, vy0, vx1, vy1, vis) {
    const L = this.list; L.length = 0;
    const inV = (x, y, r) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1, night = ENV.dark > .18;
    let nf = 0;
    for (const p of parts) {
      if (p.type === 'flash') { if (inV(p.x, p.y, p.size * 3)) this.add(p.x, p.y, Math.max(70, Math.min(420, p.size * 2.4)), '#ffc27a', p.life / p.max * .9); }
      else if (p.type === 'fire' && (nf++ & 3) === 0 && inV(p.x, p.y, 80)) this.add(p.x, p.y, p.size * 4 + 30, '#ff8a3a', p.life / p.max * .7);
    }
    for (const f of fires) if (inV(f.x, f.y, f.r * 2)) { if (f.vortex) this.add(f.x, f.y, f.r * .9, '#9a7aff', .35); else this.add(f.x, f.y, f.r * 1.8 + 40, '#ff7a30', .75 * Math.min(1, f.t / 1.5)); }
    let nb = 0;
    for (const b of bullets) {
      if (!inV(b.x, b.y, 60)) continue;
      if (b.kind === 'plasma') this.add(b.x, b.y, 70 * (b.sc || 1), b.col, .8);
      else if (b.kind === 'rocket') this.add(b.x, b.y, b.big ? 120 : 60, '#ffb050', .7);
      else if (b.kind === 'flame') { if ((nb++ & 3) === 0) this.add(b.x, b.y, 60, '#ff9a40', .55); }
      else if (b.kind === 'laser' && night) { if ((nb++ & 1) === 0) this.add(b.x, b.y, 34, b.col, .45); }
      else if (b.kind === 'mortar') this.add(b.x, b.y - (b.h || 0), 34, '#ffd27a', .5);
    }
    for (const bm of beams) { if (bm.heal) continue; const x = bm.x2 !== undefined ? bm.x2 : bm.pts ? bm.pts[bm.pts.length - 1][0] : null, y = bm.y2 !== undefined ? bm.y2 : bm.pts ? bm.pts[bm.pts.length - 1][1] : null; if (x !== null && inV(x, y, 100)) this.add(x, y, bm.hot || bm.fusion ? 120 : 70, bm.col && bm.col[0] === '#' ? bm.col.slice(0, 7) : '#9fd8ff', .7 * bm.life / bm.max); }
    if (B && B.unit && !B.unit.dead) { const win = B.state === 'window' || B.state === 'lift'; this.add(B.unit.x, B.unit.y, win ? 360 : 130 + Math.sin(time * 6) * 10, '#f2c14e', win ? 1 : .75); }
    if (W && W.pylons) for (const p of W.pylons) if (inV(p.x, p.y, 150)) this.add(p.x, p.y, p.active ? 150 : 80, p.active ? '#6fe3c8' : '#f2c14e', p.active ? .75 : .45 + .2 * Math.sin(time * 5));
    for (const it of items) if (!it.dead && (it.res === 'heart' || it.res === 'cores' || night) && inV(it.x, it.y, 40)) this.add(it.x, it.y, it.res === 'heart' ? 90 : 34, RES[it.res].c, .55);
    for (const w of FX.wrecks) if (w.burn > 0 && inV(w.x, w.y, 120)) this.add(w.x, w.y, 70 + w.r * 1.5, '#ff8a3a', Math.min(1, w.burn / 3) * (.55 + .2 * Math.sin(time * 9 + w.x)));
    // de nuit : phares des robots, lampe du pilote, yeux des machines ennemies, lumières de la base
    if (night) {
      for (const u of vis) {
        if (u.dead || u.hidden) continue;
        if (u.kind === 'player') { this.add(u.x, u.y, 70, '#ffe2b8', .7); this.add(u.x, u.y, 330, '#fff0d0', .85, u.ang); }
        else if (u.kind === 'robot' || (u.kind === 'rival' && u.role === 'bot')) { const P = palOf(u); this.add(u.x, u.y, u.r * 2.6 + 30, P.acc, .45); if (!u.fly || u.r > 20) this.add(u.x + Math.cos(u.ang) * u.r * .7, u.y + Math.sin(u.ang) * u.r * .7, 230 + u.r * 2.2, '#e8f4ff', .7, u.ang); }
        else if (u.kind === 'enemy') { if (u.human) this.add(u.x, u.y, 190, '#ffd8a0', .5, u.ang); else this.add(u.x, u.y, 36 + u.r * 1.4, u.boss ? '#ff2a3a' : '#ff4d5e', .55); }
        else if (u.kind === 'rival') this.add(u.x, u.y, 180, '#e0c8ff', .55, u.ang);
        else if (u.kind === 'building' && u.mounts.length) this.add(u.x, u.y, 60, '#ff6b5e', .5);
      }
      if (W && W.isBase && state !== 'raid') for (const b of curBuildings()) { if (b.lvl <= 0 && !b.busy) continue; const r = bRect(b); if (!inV(r.x + r.w / 2, r.y + r.h / 2, r.w * 2)) continue; this.add(r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 1.05 + 30, b.type === 'hq' ? '#ffd9a0' : '#ffcf8a', b.busy ? .45 + .25 * Math.sin(time * 7 + b.id) : .62); }
    }
  },
  render(c, shx, shy, vx0, vy0, vx1, vy1) {
    const q = fxQ(), dark = ENV.dark * (1 - ENV.flash * .75), veil = ENV.veil();
    const sky = q !== 'low' && (ENV.P.cloud * clamp(ENV.sun + .3, 0, 1) > .05 || ENV.P.fog > .03);
    if (!veil && !sky) return;
    // résolution réduite : la lumière est douce, l'agrandissement la lisse et le coût reste faible
    const s = q === 'high' ? .3 : .22, w = Math.max(1, Math.ceil(VW * s)), h = Math.max(1, Math.ceil(VH * s)), z = cam.zoom;
    if (!this.cv || this.cv.width !== w || this.cv.height !== h) { this.cv = cvs(w, h); this.cx = this.cv.getContext('2d'); this.gv = cvs(w, h); this.gx = this.gv.getContext('2d'); }
    const ox = VW / 2 - cam.x * z + shx, oy = VH / 2 - cam.y * z + shy, ws = this.sprite('w'), cs = this.coneSpr();
    {
      // une seule couche : voile, ombres des nuages, brume, puis les lumières qui y découpent des trous
      const L = this.cx; L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, w, h);
      if (veil) { L.fillStyle = `rgba(${veil[0][0]},${veil[0][1]},${veil[0][2]},${veil[1].toFixed(3)})`; L.fillRect(0, 0, w, h); }
      ENV.skyLow(L, s, ox, oy, z, vx0, vy0, vx1, vy1);
      L.globalCompositeOperation = 'destination-out';
      if (dark > .02) for (const l of this.list) {
        const sx = (l.x * z + ox) * s, sy = (l.y * z + oy) * s, R = l.r * z * s; L.globalAlpha = clamp(l.a * Math.min(1, dark * 3), 0, 1);
        if (l.cone !== undefined) { L.save(); L.translate(sx, sy); L.rotate(l.cone); L.drawImage(cs, 0, -R * .5, R, R); L.restore(); }
        else L.drawImage(ws, sx - R, sy - R, R * 2, R * 2);
      }
      L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1;
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'low'; c.drawImage(this.cv, 0, 0, w, h, 0, 0, VW, VH); // « low » : agrandir n'a pas besoin de mieux, et une qualité plus haute coûterait cher à tout le reste de l'image
    }
    if (q === 'low' || dark < .12) return; // de jour, les éclairs de tir suffisent : pas de halos en plus
    const G = this.gx, ga = .1 + dark * .55; G.globalCompositeOperation = 'source-over'; G.globalAlpha = 1; G.clearRect(0, 0, w, h); G.globalCompositeOperation = 'lighter';
    for (const l of this.list) {
      if (l.cone !== undefined) continue;
      const sx = (l.x * z + ox) * s, sy = (l.y * z + oy) * s, R = l.r * z * s * .8; G.globalAlpha = clamp(l.a * ga, 0, 1);
      G.drawImage(this.sprite(l.c), sx - R, sy - R, R * 2, R * 2);
    }
    c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(this.gv, 0, 0, w, h, 0, 0, VW, VH); c.restore();
  },
};

// ---------- effets au sol : traces, douilles, épaves, poussière ----------
const TRACK = {
  sentry: 'tread', rhino: 'tread', goliath: 'tread', colossus: 'tread', tortue: 'tread', char: 'tread', belier: 'tread',
  scout: 'wheel', mule: 'wheel',
  strider: 'foot', spider: 'foot', titan: 'foot', behemoth: 'foot', reaper: 'foot', mantis: 'foot', echassier: 'foot', scolopendre: 'foot', mastodonte: 'foot', givre: 'foot', artilleur: 'foot', souverain: 'foot', rouilleux: 'tread', archonte: 'foot', scorpion: 'dots', traqueur: 'dots',
  crawler: 'dots', ant: 'dots',
};
const PAL_WRECK = { body: '#2c2a27', body2: '#1d1b19', plate: '#3a3632', acc: '#4c4540', glow: 'rgba(60,56,52,', dark: '#110f0e' };
const FX = {
  casings: [], wrecks: [], spr: {},
  cloudSpr() {
    if (this.spr.cloud) return this.spr.cloud;
    const s = cvs(256, 180), c = s.getContext('2d'), R = mulberry32(77);
    for (let i = 0; i < 9; i++) { const x = 50 + R() * 156, y = 40 + R() * 100, r = 40 + R() * 60; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(6,8,12,.5)'); g.addColorStop(1, 'rgba(6,8,12,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 180); }
    return this.spr.cloud = s;
  },
  fogSpr() {
    if (this.spr.fog) return this.spr.fog;
    const s = cvs(256, 160), c = s.getContext('2d'), R = mulberry32(91);
    for (let i = 0; i < 8; i++) { const x = 50 + R() * 156, y = 40 + R() * 80, r = 40 + R() * 55; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(225,230,225,.4)'); g.addColorStop(1, 'rgba(225,230,225,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 160); }
    return this.spr.fog = s;
  },
  dustSpr(rgb) {
    const k = 'd' + rgb; if (this.spr[k]) return this.spr[k];
    const s = cvs(48, 48), c = s.getContext('2d'), g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, `rgba(${rgb},.75)`); g.addColorStop(.6, `rgba(${rgb},.32)`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, 48, 48); return this.spr[k] = s;
  },
  groundRGB(x, y) { const i = tileAt(x, y); const g = i >= 0 ? GROUND[W.ground[i]] : GROUND[0]; const b = g.base; return [Math.min(255, b[0] + 46), Math.min(255, b[1] + 42), Math.min(255, b[2] + 38)]; },
  // poussière soulevée, à la couleur du sol
  dust(x, y, n, size = 10, spd = 40) {
    if (!W || (EXPSIM && !EXPSIM.viewing) || fxQ() === 'low' || parts.length > 820) return;
    const i = tileAt(x, y), g = i >= 0 ? W.ground[i] : 0;
    if (g === 3 && !iceMode) { for (let k = 0; k < n; k++) { const a = Math.random() * TAU; parts.push({ type: 'spark', x, y, vx: Math.cos(a) * rnd(40, 120), vy: Math.sin(a) * rnd(40, 120), life: .3, max: .3, size: 2, col: '#a8e060' }); } parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .4, max: .4, size: size * 1.4, col: 'rgba(170,230,110,.8)', thin: true }); return; }
    const rgb = this.groundRGB(x, y).join(',');
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, s = rnd(.3, 1) * spd; parts.push({ type: 'dust', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.6, 1.3), max: 1.3, size: size * rnd(.7, 1.3), rgb }); }
  },
  // douilles éjectées par les armes à balles
  casing(x, y, a, sc = 1, big) {
    if ((EXPSIM && !EXPSIM.viewing) || fxQ() === 'low' || this.casings.length > (fxQ() === 'high' ? 150 : 70) || Math.random() < (big ? 0 : .45)) return;
    const s = cam && Math.abs((x - cam.x) * cam.zoom) < VW * .7 && Math.abs((y - cam.y) * cam.zoom) < VH * .7; if (!s) return;
    const side = a + Math.PI / 2 + rnd(-.4, .4), sp = rnd(70, 140) * (big ? 1.3 : 1);
    this.casings.push({ x, y, vx: Math.cos(side) * sp, vy: Math.sin(side) * sp, z: 6, vz: rnd(60, 120), a: Math.random() * TAU, va: rnd(-18, 18), t: 0, L: rnd(4, 7), s: (big ? 2.2 : 1.3) * Math.min(1.8, sc) });
  },
  // épave d'un robot ou d'une machine détruite : brûle, fume, puis s'imprime dans le sol
  wreck(u) {
    if (!W || (EXPSIM && !EXPSIM.viewing) || u.r < 10 || u.human || u.kind === 'player' || u.kind === 'beacon' || u.kind === 'beacon2' || u.kind === 'minion' || u.kind === 'building') return;
    if (fxQ() === 'low' && u.r < 40) return;
    const R = Math.ceil(u.r * 1.6 + 8), q = Math.min(1, 300 / R), s = cvs(Math.ceil(R * 2 * q), Math.ceil(R * 2 * q)), c = s.getContext('2d'); c.scale(q, q); c.translate(R, R); c.rotate(u.ang + rnd(-.3, .3));
    const sv = parts.length, kick = u.kick; u.kick = 0;
    try {
      if (u.kind === 'enemy') paintEnemy(c, u.etype, u.r, PAL_WRECK, 0, 0, u);
      else if (u.kind === 'npc') paintNpc(c, u, PAL_WRECK, 0, 0);
      else paintChassis(c, u.chassis || 'crawler', u.r, PAL_WRECK, 0, 0, u);
    } catch (e) { } parts.length = sv; u.kick = kick;
    c.setTransform(q, 0, 0, q, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(14,12,10,.45)'; c.fillRect(0, 0, R * 2, R * 2);
    for (let k = 0; k < 6; k++) { c.fillStyle = `rgba(0,0,0,${rnd(.2, .45)})`; circ(c, R + rnd(-u.r, u.r) * .7, R + rnd(-u.r, u.r) * .7, rnd(3, u.r * .35)); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    this.wrecks.push({ x: u.x, y: u.y, r: u.r, R, img: s, burn: rnd(7, 13) * (u.r > 40 ? 1.4 : 1), t: 0 });
    // la machine vole en éclats : des morceaux de sa carcasse retombent autour, fumants, puis restent au sol
    if (fxQ() !== 'low' && this.frags.length < 90) {
      const S = s.width, nf = Math.min(9, 2 + (u.r / 14 | 0)), up = u.r > 120 ? .6 : 1;
      for (let k = 0; k < nf; k++) {
        const fw = S * rnd(.16, .28), fh = S * rnd(.16, .28), a = Math.random() * TAU, sp = rnd(50, 150) * up * (1 + Math.min(1, u.r / 200));
        const pn = 5 + (Math.random() * 3 | 0), poly = []; for (let j = 0; j < pn; j++) { const pa = j / pn * TAU + rnd(-.3, .3), pr = rnd(.28, .5); poly.push([Math.cos(pa) * pr, Math.sin(pa) * pr]); } // éclat déchiqueté
        this.frags.push({ img: s, sx: rnd(S * .15, S * .85 - fw), sy: rnd(S * .15, S * .85 - fh), sw: fw, sh: fh, w: fw / q, h: fh / q, poly, x: u.x + rnd(-u.r, u.r) * .3, y: u.y + rnd(-u.r, u.r) * .3,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, z: u.r * .3, vz: rnd(110, 240) * up, a: rnd(0, TAU), va: rnd(-9, 9), smoke: Math.random() < .55, bounce: 1 });
      }
    }
    if (this.wrecks.length > 40) this.stamp(this.wrecks.shift());
  },
  stamp(w) {
    // l'épave reste au sol, réduite (sa copie sert à redessiner le terrain s'il est préparé à nouveau)
    const n = Math.max(16, Math.min(160, Math.round(w.R * 2 * .6))), k = cvs(n, n); k.getContext('2d').drawImage(w.img, 0, 0, n, n);
    stampGround(w.x - w.R, w.y - w.R, w.R * 2, w.R * 2, c => { c.globalAlpha = .9; c.drawImage(k, w.x - w.R, w.y - w.R, w.R * 2, w.R * 2); c.globalAlpha = 1; }, 'wreck');
  },
  frags: [],
  fragTick(dt) {
    for (let i = this.frags.length - 1; i >= 0; i--) {
      const f = this.frags[i]; f.vz -= 620 * dt; f.z += f.vz * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.va * dt;
      if (f.smoke && f.z > 2 && Math.random() < dt * 16 && parts.length < 760) parts.push({ type: 'smoke', x: f.x, y: f.y - f.z * .6, vx: 0, vy: -8, life: .8, max: .8, size: 3 + f.w * .25, col: '' });
      if (f.z <= 0) {
        if (f.bounce-- > 0 && f.vz < -60) { f.z = 0; f.vz = -f.vz * .3; f.vx *= .45; f.vy *= .45; f.va *= .5; FX.dust(f.x, f.y, 1, 6, 25); continue; }
        const fr = f; this.frags.splice(i, 1);
        stampGround(fr.x - fr.w, fr.y - fr.w, fr.w * 2, fr.w * 2, c => { c.save(); c.translate(fr.x, fr.y); c.rotate(fr.a); c.globalAlpha = .9; fragDraw(c, fr, 1); c.restore(); }, 'wreck');
      }
    }
  },
  drawFrags(c, vx0, vy0, vx1, vy1) {
    for (const f of this.frags) {
      if (f.x < vx0 || f.x > vx1 || f.y < vy0 || f.y > vy1) continue;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(f.x + f.z * .3, f.y + f.z * .4, f.w * .45, f.h * .35, 0, 0, TAU); c.fill();
      c.save(); c.translate(f.x, f.y - f.z * .6); c.rotate(f.a); fragDraw(c, f, 1 + Math.min(.4, f.z / 300)); c.restore();
    }
  },
  tick(dt) {
    this.fragTick(dt);
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const k = this.casings[i]; k.t += dt;
      if (k.z > 0 || k.vz > 0) { k.vz -= 420 * dt; k.z += k.vz * dt; if (k.z <= 0) { k.z = 0; if (Math.abs(k.vz) > 40) { k.vz = -k.vz * .35; k.vx *= .55; k.vy *= .55; } else k.vz = 0; } }
      const f = Math.exp(-dt * (k.z > 0 ? .5 : 6)); k.vx *= f; k.vy *= f; k.x += k.vx * dt; k.y += k.vy * dt; k.a += k.va * dt; k.va *= f;
      if (k.t > k.L) this.casings.splice(i, 1);
    }
    const wd = ENV.wind;
    for (let i = this.wrecks.length - 1; i >= 0; i--) {
      const w = this.wrecks[i]; w.t += dt;
      if (w.burn > 0) {
        w.burn -= dt;
        if (Math.random() < dt * (2.2 + w.r * .04) * fxK() && parts.length < 700 && Math.abs(w.x - cam.x) * cam.zoom < VW && Math.abs(w.y - cam.y) * cam.zoom < VH) parts.push({ type: 'smoke', x: w.x + rnd(-w.r, w.r) * .5, y: w.y + rnd(-w.r, w.r) * .5, vx: wd.x * .5 + rnd(-8, 8), vy: wd.y * .5 - 14, life: rnd(1.6, 3), max: 3, size: 6 + w.r * .25, col: '' });
        if (Math.random() < dt * 4 * fxK() && parts.length < 700) parts.push({ type: 'fire', x: w.x + rnd(-w.r, w.r) * .4, y: w.y + rnd(-w.r, w.r) * .4, vx: wd.x * .3, vy: wd.y * .3 - 10, life: rnd(.25, .5), max: .5, size: rnd(4, 6 + w.r * .12) });
      } else if (w.t > 30) { this.stamp(w); this.wrecks.splice(i, 1); }
    }
  },
  drawGroundLayer(c, vx0, vy0, vx1, vy1) {
    for (const w of this.wrecks) { if (w.x + w.R < vx0 || w.x - w.R > vx1 || w.y + w.R < vy0 || w.y - w.R > vy1) continue; c.globalAlpha = .95; c.drawImage(w.img, w.x - w.R, w.y - w.R, w.R * 2, w.R * 2); }
    c.globalAlpha = 1;
    if (!this.casings.length) return;
    for (const k of this.casings) {
      if (k.x < vx0 || k.x > vx1 || k.y < vy0 || k.y > vy1) continue;
      const fade = clamp(k.L - k.t, 0, 1) * .85; c.globalAlpha = fade;
      const hz = Math.abs(Math.cos(k.a)) > .7, lw = k.s * (hz ? 2.4 : .9), lh = k.s * (hz ? .9 : 2.4); c.fillStyle = k.z > 0 ? '#d9b866' : '#8a7448'; c.fillRect(k.x - lw / 2, k.y - k.z * .6 - lh / 2, lw, lh);
    }
    c.globalAlpha = 1;
  },
  // fumée et étincelles des machines abîmées
  damageTick(dt) {
    if ((EXPSIM && !EXPSIM.viewing) || fxQ() === 'low' || parts.length > 760) return;
    const F = focus(), wd = ENV.wind, R2 = (Math.max(VW, VH) / cam.zoom) ** 2;
    for (const u of units) {
      if (u.dead || u.hidden || u.human || u.kind === 'player' || u.kind === 'beacon' || u.kind === 'minion' || u.etype === 'cible' || u.maxhp <= 0) continue;
      const f = u.hp / u.maxhp; if (f > .45) continue;
      if (d2(u.x, u.y, F.x, F.y) > R2) continue;
      const sev = (.45 - f) / .45;
      if (Math.random() < dt * (1.4 + sev * 4) * fxK()) parts.push({ type: 'smoke', x: u.x + rnd(-u.r, u.r) * .4, y: u.y + rnd(-u.r, u.r) * .4, vx: wd.x * .45 + u.vx * .2, vy: wd.y * .45 + u.vy * .2 - 10, life: rnd(1, 2), max: 2, size: 4 + u.r * .22, col: '' });
      if (f < .2 && Math.random() < dt * 3 * fxK()) parts.push({ type: 'fire', x: u.x + rnd(-u.r, u.r) * .35, y: u.y + rnd(-u.r, u.r) * .35, vx: wd.x * .2, vy: wd.y * .2, life: rnd(.2, .4), max: .4, size: rnd(3, 4 + u.r * .1) });
      if (f < .2 && Math.random() < dt * 1.5) sparks(u.x + rnd(-u.r, u.r) * .5, u.y + rnd(-u.r, u.r) * .5, 3, '#ffcf7a');
    }
  },
  // traces de chenilles, de roues et de pas, imprimées dans le sol
  track(u, dist) {
    if ((EXPSIM && !EXPSIM.viewing) || u.fly || u.static || u.jump || !W || fxQ() === 'low') return;
    const kind = u.kind === 'player' || u.human ? 'boot' : TRACK[u.chassis || u.etype] || (u.r > 30 ? 'foot' : u.r > 14 ? 'dots' : null);
    if (!kind) return;
    const step = kind === 'tread' ? 9 : kind === 'wheel' ? 10 : kind === 'foot' ? Math.max(18, u.r * 1.15) : kind === 'boot' ? 21 : 14;
    u.trk = (u.trk || 0) + dist; if (u.trk < step) return; u.trk = 0;
    if (Math.abs(u.x - cam.x) * cam.zoom > VW * 1.2 || Math.abs(u.y - cam.y) * cam.zoom > VH * 1.2) return;
    const i = tileAt(u.x, u.y), g = i >= 0 ? W.ground[i] : 0; if (g === 3 && !iceMode) return; // pas de traces dans le marais
    const snow = iceMode && (g === 0 || g === 1 || g === 6), al = snow ? .2 : g === 2 || g === 6 ? .06 : .1;
    const a = u.ang, ca = Math.cos(a), sa = Math.sin(a), r = u.r;
    const marks = [];
    if (kind === 'tread') { const w = r * .26, off = r * .55; for (const sd of [-1, 1]) marks.push([u.x - sa * off * sd, u.y + ca * off * sd, 8, w]); }
    else if (kind === 'wheel') { const off = r * .45; for (const sd of [-1, 1]) marks.push([u.x - sa * off * sd, u.y + ca * off * sd, 9, 2.4]); }
    else if (kind === 'foot') { u.foot = -(u.foot || 1); const off = r * .42 * u.foot; marks.push([u.x - sa * off, u.y + ca * off, r * .26, r * .18, 1]); }
    else if (kind === 'boot') { u.foot = -(u.foot || 1); const off = 3.5 * u.foot; marks.push([u.x - sa * off, u.y + ca * off, 4.4, 2.6, 1]); }
    else { for (const sd of [-1, 1]) marks.push([u.x - sa * r * .5 * sd + rnd(-2, 2), u.y + ca * r * .5 * sd + rnd(-2, 2), 2.2, 2.2, 1]); }
    const ext = r + 10;
    stampGround(u.x - ext, u.y - ext, ext * 2, ext * 2, c => {
      c.fillStyle = snow ? `rgba(70,84,104,${al})` : `rgba(10,8,6,${al})`;
      for (const [x, y, l, w, oval] of marks) { c.save(); c.translate(x, y); c.rotate(a); if (oval) { c.beginPath(); c.ellipse(0, 0, l, w, 0, 0, TAU); c.fill(); } else c.fillRect(-l / 2, -w / 2, l, w); c.restore(); }
    }, 'track');
  },
  clear() { this.casings = []; this.wrecks = []; this.frags = []; },
};
// un éclat de carcasse : un morceau de l'image de l'épave, découpé en polygone déchiqueté
function fragDraw(c, f, k) {
  const w = f.w * k, h = f.h * k; c.beginPath(); f.poly.forEach(([px, py], j) => j ? c.lineTo(px * w, py * h) : c.moveTo(px * w, py * h)); c.closePath();
  c.save(); c.clip(); c.fillStyle = '#1d1b19'; c.fill(); c.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, -w / 2, -h / 2, w, h); c.restore();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1; c.stroke();
}
// ---------- mémoire du sol ----------
// Tout ce qui marque le sol (traces, cratères, brûlures, gravats, épaves) est retenu morceau par morceau et redessiné quand
// un morceau de terrain est préparé à nouveau : le décor garde la trace des combats jusqu'à la fin du raid.
const SCAR_MAX = 360;
function stampGround(x, y, w, h, fn, kind) {
  if (typeof chunkCache === 'undefined' || !W) return;
  const cx0 = Math.max(0, Math.floor(x / CPX)), cx1 = Math.min(NCH - 1, Math.floor((x + w) / CPX)), cy0 = Math.max(0, Math.floor(y / CPX)), cy1 = Math.min(NCH - 1, Math.floor((y + h) / CPX));
  const S = W.scars || (W.scars = new Map());
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const idx = cy * NCH + cx; let L = S.get(idx); if (!L) S.set(idx, L = []);
    L.push({ fn, k: kind || 'm' });
    if (L.length > SCAR_MAX) { const i = L.findIndex(o => o.k === 'track'); L.splice(i >= 0 ? i : 0, 1); } // les traces s'effacent les premières
    for (let half = 0; half < LOD_N; half++) {
      const e = chunkCache.get(idx * LOD_N + half); if (!e) continue;
      const s = LOD_S[half], c = e.cv.getContext('2d'); c.save(); c.setTransform(s, 0, 0, s, -cx * CPX * s, -cy * CPX * s); try { fn(c); } catch (er) { } c.restore();
    }
  }
}
// redessine les marques retenues dans un morceau qu'on vient de préparer
function scarReplay(c, cx, cy, s) {
  const L = W && W.scars && W.scars.get(cy * NCH + cx); if (!L || !L.length) return;
  c.save(); c.setTransform(s, 0, 0, s, -cx * CPX * s, -cy * CPX * s); for (const o of L) { try { o.fn(c); } catch (er) { } } c.restore();
}
// ---------- marques de combat ----------
const SCAR_SPR = {};
function scarSpr(k) {
  if (SCAR_SPR[k]) return SCAR_SPR[k];
  const S = 128, s = cvs(S, S), c = s.getContext('2d'), R = mulberry32(k.length * 31 + 7), m = S / 2;
  if (k === 'scorch') {
    const g = c.createRadialGradient(m, m, 0, m, m, m); g.addColorStop(0, 'rgba(8,6,5,.62)'); g.addColorStop(.55, 'rgba(14,11,9,.38)'); g.addColorStop(1, 'rgba(20,16,12,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 10; i++) { const a = R() * TAU, l = m * (.55 + R() * .4); c.strokeStyle = 'rgba(6,5,4,.25)'; c.lineWidth = 2 + R() * 3; c.beginPath(); c.moveTo(m + Math.cos(a) * m * .25, m + Math.sin(a) * m * .25); c.lineTo(m + Math.cos(a) * l, m + Math.sin(a) * l); c.stroke(); }
  } else if (k === 'crater') {
    const g = c.createRadialGradient(m, m, 0, m, m, m); g.addColorStop(0, 'rgba(6,5,4,.6)'); g.addColorStop(.42, 'rgba(12,10,8,.5)'); g.addColorStop(.6, 'rgba(120,110,96,.22)'); g.addColorStop(.72, 'rgba(18,14,11,.35)'); g.addColorStop(1, 'rgba(20,16,12,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 16; i++) { const a = R() * TAU, l = m * (.7 + R() * .3); c.strokeStyle = 'rgba(8,6,5,.3)'; c.lineWidth = 1.5 + R() * 2.5; c.beginPath(); c.moveTo(m + Math.cos(a) * m * .5, m + Math.sin(a) * m * .5); c.lineTo(m + Math.cos(a) * l, m + Math.sin(a) * l); c.stroke(); }
    for (let i = 0; i < 26; i++) { const a = R() * TAU, d = m * (.5 + R() * .45); c.fillStyle = R() < .5 ? 'rgba(150,140,124,.35)' : 'rgba(10,8,7,.5)'; c.fillRect(m + Math.cos(a) * d, m + Math.sin(a) * d, 2 + R() * 4, 2 + R() * 3); }
    c.strokeStyle = 'rgba(160,150,132,.18)'; c.lineWidth = 3; circ(c, m - 2, m - 2, m * .5); c.stroke();
  } else if (k === 'burn') {
    for (let i = 0; i < 9; i++) { const x = m + (R() - .5) * m, y = m + (R() - .5) * m, r = m * (.3 + R() * .35), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(10,8,6,.4)'); g.addColorStop(1, 'rgba(10,8,6,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S); }
    for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(40,34,28,.4)'; circ(c, m + (R() - .5) * m * 1.3, m + (R() - .5) * m * 1.3, 1 + R() * 2.5); c.fill(); }
  } else if (k === 'crack') {
    c.strokeStyle = 'rgba(6,5,4,.42)'; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) { let x = m, y = m, a = R() * TAU; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { a += (R() - .5) * 1.1; const l = m * (.12 + R() * .1); x += Math.cos(a) * l; y += Math.sin(a) * l; c.lineTo(x, y); c.lineWidth = Math.max(.8, 3 - j * .5); } c.stroke(); }
    const g = c.createRadialGradient(m, m, 0, m, m, m * .4); g.addColorStop(0, 'rgba(8,6,5,.4)'); g.addColorStop(1, 'rgba(8,6,5,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S);
  }
  return SCAR_SPR[k] = s;
}
function scarSprite(k, x, y, R, a) {
  if (!W || (EXPSIM && !EXPSIM.viewing && k !== 'glass')) return;
  stampGround(x - R, y - R, R * 2, R * 2, c => { c.save(); c.translate(x, y); c.rotate(a); c.drawImage(scarSpr(k), -R, -R, R * 2, R * 2); c.restore(); }, k);
}
// gravats laissés par un obstacle détruit, selon sa nature
function scarRubble(tx, ty, o, burnt) {
  if (!W || (EXPSIM && !EXPSIM.viewing)) return;
  const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2, h = (k, j) => hash2(tx * 7 + k, ty * 13 + j, 41), mm = (OBS[o] && OBS[o].mm) || '#6a6862';
  stampGround(x - TILE, y - TILE, TILE * 2, TILE * 2, c => {
    if (o === 1) { // souche et feuilles (ou cendres si l'arbre a brûlé)
      if (!burnt) for (let k = 0; k < 9; k++) { c.fillStyle = k % 2 ? 'rgba(52,70,38,.55)' : 'rgba(70,88,46,.5)'; circ(c, x + (h(k, 1) - .5) * 34, y + (h(k, 2) - .5) * 34, 2 + h(k, 3) * 3); c.fill(); }
      else { c.fillStyle = 'rgba(12,10,8,.35)'; circ(c, x, y, 16); c.fill(); }
      c.fillStyle = burnt ? '#1c1814' : '#4a3a28'; circ(c, x, y, 6); c.fill(); c.strokeStyle = burnt ? '#0c0a08' : '#2e2418'; c.lineWidth = 1.5; circ(c, x, y, 3.5); c.stroke();
    } else if (o === 3 || o === 6) { // tas de gravats et blocs
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x + 3, y + 4, 22, 16, h(9, 9) * 3, 0, TAU); c.fill();
      for (let k = 0; k < (o === 6 ? 13 : 9); k++) { const bx = x + (h(k, 4) - .5) * 34, by = y + (h(k, 5) - .5) * 30, bw = 4 + h(k, 6) * 9, bh = 3 + h(k, 7) * 6; c.save(); c.translate(bx, by); c.rotate(h(k, 8) * 3); c.fillStyle = k % 3 ? mm : '#5f574b'; c.fillRect(-bw / 2, -bh / 2, bw, bh); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-bw / 2, bh / 2 - 1.5, bw, 1.5); c.restore(); }
    } else if (o === 2) { for (let k = 0; k < 14; k++) { c.fillStyle = k % 2 ? '#5a5853' : '#7a7770'; circ(c, x + (h(k, 4) - .5) * 30, y + (h(k, 5) - .5) * 30, 1.2 + h(k, 6) * 3); c.fill(); } }
    else if (o === 4) { for (let k = 0; k < 8; k++) { c.save(); c.translate(x + (h(k, 4) - .5) * 30, y + (h(k, 5) - .5) * 30); c.rotate(h(k, 6) * 6); c.fillStyle = k % 2 ? 'rgba(176,124,255,.55)' : 'rgba(120,80,190,.6)'; c.beginPath(); c.moveTo(0, -4); c.lineTo(2.5, 2); c.lineTo(-2.5, 2); c.closePath(); c.fill(); c.restore(); } }
    else if (o === 5) { for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? '#5a3a24' : '#3a3632'; c.fillRect(x + (h(k, 4) - .5) * 32, y + (h(k, 5) - .5) * 28, 2 + h(k, 6) * 6, 2 + h(k, 7) * 3); } }
  }, 'rubble');
}
// très grosses explosions : le sol fond et devient du verre de cratère
function glassify(x, y, R) {
  if (!W || W.isBase || NETVIS) return;
  const t0x = Math.max(1, Math.floor((x - R) / TILE)), t1x = Math.min(WT - 2, Math.floor((x + R) / TILE)), t0y = Math.max(1, Math.floor((y - R) / TILE)), t1y = Math.min(WT - 2, Math.floor((y + R) / TILE)), ch = new Set();
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
    const dx = tx * TILE + 20 - x, dy = ty * TILE + 20 - y, d = Math.hypot(dx, dy) / R; if (d > 1 - hash2(tx, ty, 5) * .25) continue;
    const i = ty * WT + tx; if (W.ground[i] === 5 || W.ground[i] === 7) continue; W.ground[i] = 5; miniSetTile(tx, ty); ch.add(((ty / CHT) | 0) * NCH + ((tx / CHT) | 0));
  }
  for (const k of ch) for (let lv = 0; lv < LOD_N; lv++) chunkCache.delete(k * LOD_N + lv);
}
