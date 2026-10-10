// Monde : génération des régions, textures procédurales, monde de la base.

// ================= MONDE =================
const TILE = 40, WT = 300, WPX = WT * TILE;
// sols : 0 cendres, 1 humus, 2 bitume, 3 marais toxique, 4 sol cristallin, 5 verre de cratère, 6 béton, 7 roche-mère
const GROUND = [
  { n: TL('Cendres'), base: [64, 60, 54], v: 12, mm: '#5c574d' },
  { n: TL('Humus'), base: [40, 47, 34], v: 10, mm: '#3a4630' },
  { n: TL('Bitume'), base: [47, 50, 54], v: 8, mm: '#464b51' },
  { n: TL('Marais toxique'), base: [42, 58, 27], v: 7, mm: '#4f7a26' },
  { n: TL('Sol cristallin'), base: [52, 45, 70], v: 10, mm: '#4f4370' },
  { n: TL('Verre de cratère'), base: [38, 26, 28], v: 8, mm: '#4a2a2c' },
  { n: TL('Béton'), base: [76, 75, 70], v: 7, mm: '#706e66' },
  { n: TL('Roche-mère'), base: [22, 23, 25], v: 5, mm: '#18191b' },
];
// obstacles : 1 arbre, 2 rocher, 3 mur, 4 cristal, 5 épave, 6 rempart, 7 falaise
const OBS = [null,
  { n: TL('arbre'), hp: 30, lv: 1, mm: '#26331f' },
  { n: TL('rocher'), hp: 140, lv: 2, mm: '#6a6862' },
  { n: TL('mur'), hp: 170, lv: 3, mm: '#8a7c6a' },
  { n: TL('cristal'), hp: 60, lv: 1, mm: '#b07cff', drop: [['crystals', 2, 5, 1]] },
  { n: TL('épave'), hp: 90, lv: 2, mm: '#8a5a3a', drop: [['scrap', 3, 7, 1], ['alloy', 1, 2, .45], ['circuits', 1, 2, .35]] },
  { n: TL('rempart'), hp: 450, lv: 4, mm: '#a29a7c' },
  { n: TL('falaise'), hp: 1e12, lv: 99, mm: '#101112' },
  { n: TL('bâtiment'), hp: 1e12, lv: 99, mm: '#8a8478' },
];
let W = null; // monde courant
const GROUND_DEF = GROUND.map(g => ({ base: g.base.slice(), mm: g.mm, n: g.n }));
let iceMode = false, curPalette = null;
function setRegionPalette(id) {
  if (curPalette === id && groundAtlas) return;
  curPalette = id; iceMode = id === 'glacier';
  GROUND.forEach((g, i) => { g.base = GROUND_DEF[i].base.slice(); g.mm = GROUND_DEF[i].mm; g.n = GROUND_DEF[i].n; });
  const o = REGION_GROUND[id]; if (o) for (const i in o) { GROUND[i].base = o[i][0].slice(); GROUND[i].mm = o[i][1]; }
  if (iceMode) GROUND[3].n = TL('Eau glacée');
  buildAtlases(); if (typeof chunkCache !== 'undefined') chunkCache.clear();
}

function genWorld(seed, RG) {
  const R = mulberry32(seed);
  const nA = makeNoise(seed ^ 0x1234), nB = makeNoise(seed ^ 0x9876), nC = makeNoise(seed ^ 0x5555);
  const N = WT * WT;
  const g = new Uint8Array(N), o = new Uint8Array(N), hp = new Float32Array(N), b = new Uint8Array(N), sh = new Uint8Array(N);
  const nD = makeNoise(seed ^ 0x7777);
  const cx = WT / 2, cy = WT / 2;
  for (let y = 0; y < WT; y++) for (let x = 0; x < WT; x++) {
    const i = y * WT + x;
    const d = Math.hypot(x - cx, y - cy);
    const m = nA(x * .017, y * .017) + (RG ? RG.bias.m : 0), u = nB(x * .013 + 50, y * .013 + 50) + (RG ? RG.bias.u : 0), det = nC(x * .14, y * .14, 2);
    sh[i] = Math.round(clamp((nD(x * .06, y * .06, 3) - .28) * 3, 0, 1) * 255); // ombrage continu (0 sombre, 255 clair)
    const edge = Math.min(x, y, WT - 1 - x, WT - 1 - y);
    if (edge < 3 || (edge < 7 && det > .42 + edge * .03)) { g[i] = 7; o[i] = 7; b[i] = 0; continue; }
    let bio;
    if (d < 27) bio = 5;
    else if (u > .6) bio = 2;
    else if (m > .6) bio = 3;
    else if (m < .41 && u < .47) bio = 1;
    else if (u < .37) bio = 4;
    else bio = 0;
    b[i] = bio;
    switch (bio) {
      case 0: g[i] = 0; { const r = R(); if (r < .011) o[i] = 2; else if (r < .019) o[i] = 5; else if (r < .024 && det > .5) o[i] = 1; } break;
      case 1: g[i] = 1; if (det > .44 && R() < .34) o[i] = 1; else if (R() < .008) o[i] = 2; break;
      case 2: {
        const bs = 14, bx = Math.floor(x / bs), by = Math.floor(y / bs), lx = x - bx * bs, ly = y - by * bs;
        const h = hash2(bx, by, seed);
        if (h < .72) {
          const w = 6 + Math.floor(hash2(bx + 7, by, seed) * 6), hh = 6 + Math.floor(hash2(bx, by + 7, seed) * 6);
          const x0 = 2, y0 = 2, x1 = x0 + w, y1 = y0 + hh;
          if (lx >= x0 && lx <= x1 && ly >= y0 && ly <= y1) {
            g[i] = 6;
            const per = lx === x0 || lx === x1 || ly === y0 || ly === y1;
            if (per) {
              const doorS = ly === y1 && Math.abs(lx - (x0 + (w >> 1))) <= 1;
              const doorW = lx === x0 && Math.abs(ly - (y0 + (hh >> 1))) <= 1 && h < .45;
              const doorE = lx === x1 && Math.abs(ly - (y0 + (hh >> 1))) <= 1 && h > .3;
              if (!doorS && !doorW && !doorE && R() < .87) o[i] = 3;
            } else if (R() < .02) o[i] = 5;
          } else { g[i] = 2; if (R() < .013) o[i] = 5; }
        } else { g[i] = 2; const r = R(); if (r < .02) o[i] = 5; else if (r < .03) o[i] = 1; }
        break;
      }
      case 3: g[i] = (det * .7 + m * .6 > .78) ? 3 : 1; if (g[i] !== 3 && R() < .06) o[i] = 1; break;
      case 4: g[i] = 4; if (det > .53 && R() < .24) o[i] = 4; else if (R() < .01) o[i] = 2; break;
      case 5: g[i] = 5; if (d > 23 && R() < .3) o[i] = 2; else if (d < 23 && R() < .006) o[i] = 2; break;
    }
  }
  const world = { seed, ground: g, obs: o, ohp: hp, biome: b, shade: sh, bases: [], pylons: [], spawn: null };
  W = world;
  // bases militaires
  let tries = 0;
  while (world.bases.length < (RG ? RG.bases : 5) && tries++ < 600) {
    const sw = 16 + Math.floor(R() * 7), sh = 16 + Math.floor(R() * 7);
    const x0 = 12 + Math.floor(R() * (WT - 24 - sw)), y0 = 12 + Math.floor(R() * (WT - 24 - sh));
    const mx = x0 + sw / 2, my = y0 + sh / 2;
    if (Math.hypot(mx - cx, my - cy) < 55) continue;
    if (world.bases.some(B => Math.hypot(B.cx - mx, B.cy - my) < 60)) continue;
    for (let y = y0; y <= y0 + sh; y++) for (let x = x0; x <= x0 + sw; x++) {
      const i = y * WT + x; g[i] = 6; b[i] = 6; o[i] = 0;
      const per = x === x0 || x === x0 + sw || y === y0 || y === y0 + sh;
      const gateN = y === y0 && Math.abs(x - mx) < 2;
      const gateS = y === y0 + sh && Math.abs(x - mx) < 2;
      const gateW = x === x0 && Math.abs(y - my) < 2;
      if (per && !gateN && !gateS && !gateW) o[i] = 6;
    }
    // quelques blocs intérieurs
    for (let k = 0; k < 4; k++) {
      const bx = x0 + 3 + Math.floor(R() * (sw - 6)), by = y0 + 3 + Math.floor(R() * (sh - 6));
      for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 3; x++) o[y * WT + x] = 6;
    }
    world.bases.push({ x0, y0, sw, sh, cx: mx, cy: my });
  }
  // pylônes relais
  tries = 0;
  while (world.pylons.length < 7 && tries++ < 600) {
    const tx = 20 + Math.floor(R() * (WT - 40)), ty = 20 + Math.floor(R() * (WT - 40));
    if (Math.hypot(tx - cx, ty - cy) < 40) continue;
    if (world.pylons.some(p => Math.hypot(p.tx - tx, p.ty - ty) < 70)) continue;
    if (g[ty * WT + tx] === 3 || g[ty * WT + tx] === 7) continue;
    clearTiles(tx, ty, 3);
    world.pylons.push({ tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, active: false, prog: 0 });
  }
  // point d'insertion
  for (let k = 0; k < 2000; k++) {
    const tx = 15 + Math.floor(R() * (WT - 30)), ty = 15 + Math.floor(R() * (WT - 30));
    const dd = Math.hypot(tx - cx, ty - cy);
    if (dd < 95 || dd > 135) continue;
    const bi = b[ty * WT + tx]; if (bi === 3 || bi === 6 || g[ty * WT + tx] === 7) continue;
    if (world.bases.some(B => Math.hypot(B.cx - tx, B.cy - ty) < 44)) continue;
    clearTiles(tx, ty, 5);
    world.spawn = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
    break;
  }
  if (!world.spawn) { clearTiles(40, 40, 5); world.spawn = { x: 40 * TILE, y: 40 * TILE }; }
  for (let i = 0; i < N; i++) if (o[i]) hp[i] = OBS[o[i]].hp;
  return world;
}
function clearTiles(tx, ty, r) {
  for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
    if (x < 3 || y < 3 || x >= WT - 3 || y >= WT - 3) continue;
    if ((x - tx) ** 2 + (y - ty) ** 2 > r * r + 1) continue;
    const i = y * WT + x, had = W.obs[i] || W.ground[i] === 3 || W.ground[i] === 7; W.obs[i] = 0; if (W.ground[i] === 3 || W.ground[i] === 7) W.ground[i] = 1;
    if (had) miniSetTile(x, y); // minicarte et niveaux de détail suivent
  }
}
const tileAt = (x, y) => { const tx = (x / TILE) | 0, ty = (y / TILE) | 0; return (tx < 0 || ty < 0 || tx >= WT || ty >= WT) ? -1 : ty * WT + tx; };
function walkableTile(tx, ty, allowToxic) {
  if (tx < 1 || ty < 1 || tx >= WT - 1 || ty >= WT - 1) return false;
  const i = ty * WT + tx; if (W.obs[i]) return false;
  const gg = W.ground[i]; return gg !== 7 && (allowToxic || gg !== 3);
}
function findWalkableNear(x, y, minR, maxR, tries = 40) {
  for (let k = 0; k < tries; k++) {
    const a = Math.random() * TAU, r = rnd(minR, maxR);
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    const tx = (px / TILE) | 0, ty = (py / TILE) | 0;
    if (walkableTile(tx, ty) && walkableTile(tx + 1, ty) && walkableTile(tx, ty + 1)) return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  }
  return null;
}

// ================= TEXTURES PROCÉDURALES =================
let groundAtlas = null, obsAtlas = null;
const GV = 8, OV = 3, OC = 64;
function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rgb(c, k = 0) { return `rgb(${clamp(c[0] + k, 0, 255) | 0},${clamp(c[1] + k, 0, 255) | 0},${clamp(c[2] + k, 0, 255) | 0})`; }
function buildAtlases() {
  const R = mulberry32(777);
  groundAtlas = cvs(TILE * GV, TILE * GROUND.length);
  const c = groundAtlas.getContext('2d');
  for (let gi = 0; gi < GROUND.length; gi++) for (let v = 0; v < GV; v++) {
    const G = GROUND[gi], ox = v * TILE, oy = gi * TILE;
    c.save(); c.beginPath(); c.rect(ox, oy, TILE, TILE); c.clip();
    c.fillStyle = rgb(G.base, [-9, -3, 3, 9][v >> 1] + (R() - .5) * 3); c.fillRect(ox, oy, TILE, TILE);
    for (let k = 0; k < 70; k++) { c.fillStyle = rgb(G.base, (R() - .5) * G.v * 2); const s = R() < .8 ? 1 : 2; c.fillRect(ox + R() * TILE, oy + R() * TILE, s, s); }
    switch (gi) {
      case 0: for (let k = 0; k < 4; k++) { c.fillStyle = rgb(G.base, -18); c.beginPath(); c.arc(ox + R() * TILE, oy + R() * TILE, 1 + R() * 2, 0, TAU); c.fill(); }
        c.strokeStyle = rgb(G.base, 10); c.globalAlpha = .4; c.beginPath(); c.moveTo(ox + R() * 40, oy + R() * 40); c.lineTo(ox + R() * 40, oy + R() * 40); c.stroke(); c.globalAlpha = 1; break;
      case 1: c.strokeStyle = 'rgb(58,72,42)'; for (let k = 0; k < 9; k++) { const x = ox + R() * TILE, y = oy + R() * TILE; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - .5) * 3, y - 3); c.stroke(); }
        c.fillStyle = 'rgba(70,52,30,.6)'; for (let k = 0; k < 5; k++) c.fillRect(ox + R() * TILE, oy + R() * TILE, 2, 1); break;
      case 2: if (v & 1) { c.strokeStyle = 'rgba(20,22,24,.55)'; c.beginPath(); let x = ox + R() * TILE, y = oy + R() * 10; c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += (R() - .5) * 16; y += 9; c.lineTo(x, y); } c.stroke(); } break;
      case 3: {
        const grd = c.createRadialGradient(ox + 20, oy + 20, 2, ox + 20, oy + 20, 30); grd.addColorStop(0, 'rgba(150,210,60,.16)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = grd; c.fillRect(ox, oy, TILE, TILE);
        c.strokeStyle = 'rgba(180,230,90,.22)'; c.lineWidth = 1;
        for (let k = 0; k < 3; k++) { const px = ox + ((k * 13 + v * 9) % 40), py = oy + ((k * 17 + v * 11) % 40); c.beginPath(); c.arc(px, py, 3 + (v & 3) * 1.5, 0, Math.PI); c.stroke(); }
        c.fillStyle = 'rgba(200,250,120,.4)'; c.beginPath(); c.arc(ox + (v * 11 + 7) % 40, oy + (v * 7 + 23) % 40, 1.5, 0, TAU); c.fill(); break;
      }
      case 4: for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(200,140,255,.55)'; c.fillRect(ox + R() * TILE, oy + R() * TILE, 1.5, 1.5); } break;
      case 5: c.strokeStyle = 'rgba(140,60,60,.35)'; c.beginPath(); c.moveTo(ox + R() * 40, oy + R() * 40); c.lineTo(ox + R() * 40, oy + R() * 40); c.stroke(); break;
      case 6: c.strokeStyle = 'rgba(30,30,28,.35)'; c.strokeRect(ox + .5, oy + .5, TILE - 1, TILE - 1);
         break;
      case 7: c.strokeStyle = 'rgba(60,62,66,.5)'; c.beginPath(); c.moveTo(ox, oy + R() * 40); c.lineTo(ox + 40, oy + R() * 40); c.stroke(); break;
    }
    c.restore();
  }
  // obstacles
  obsAtlas = cvs(OC * OV, OC * OBS.length);
  const o = obsAtlas.getContext('2d');
  for (let t = 1; t < OBS.length; t++) for (let v = 0; v < OV; v++) {
    const cx = v * OC + OC / 2, cy = t * OC + OC / 2;
    o.save(); o.translate(cx, cy);
    paintObstacle(o, t, v, R);
    o.restore();
  }
}
function paintObstacle(o, t, v, R) {
  const h = TILE / 2;
  switch (t) {
    case 1: { // arbre mort / conifère sombre
      o.fillStyle = 'rgba(0,0,0,.35)'; o.beginPath(); o.ellipse(4, 6, 20, 16, 0, 0, TAU); o.fill();
      const cols = ['#24301d', '#2d3a22', '#354428'];
      for (let k = 0; k < 6; k++) { o.fillStyle = cols[k % 3]; o.beginPath(); o.arc((R() - .5) * 16, (R() - .5) * 16, 9 + R() * 7, 0, TAU); o.fill(); }
      o.fillStyle = 'rgba(120,140,80,.18)'; o.beginPath(); o.arc(-5, -6, 8, 0, TAU); o.fill();
      o.strokeStyle = '#3a2e22'; o.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = R() * TAU; o.beginPath(); o.moveTo(0, 0); o.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); o.stroke(); }
      o.fillStyle = '#2a2018'; o.beginPath(); o.arc(0, 0, 3, 0, TAU); o.fill();
      if (iceMode) { o.fillStyle = 'rgba(235,242,248,.75)'; for (let k = 0; k < 7; k++) { o.beginPath(); o.arc((R() - .5) * 22, (R() - .5) * 22, 3 + R() * 4, 0, TAU); o.fill(); } }
      break;
    }
    case 2: { // rocher
      o.fillStyle = 'rgba(0,0,0,.35)'; o.beginPath(); o.ellipse(4, 5, 21, 17, 0, 0, TAU); o.fill();
      o.beginPath(); const n = 8; for (let k = 0; k < n; k++) { const a = k / n * TAU, r = 15 + R() * 6; k ? o.lineTo(Math.cos(a) * r, Math.sin(a) * r) : o.moveTo(Math.cos(a) * r, Math.sin(a) * r); } o.closePath();
      o.fillStyle = '#5a5852'; o.fill(); o.strokeStyle = '#3c3b37'; o.lineWidth = 2; o.stroke();
      o.fillStyle = '#76736b'; o.beginPath(); o.ellipse(-4, -5, 8, 6, -.4, 0, TAU); o.fill();
      o.strokeStyle = '#3a3935'; o.lineWidth = 1; o.beginPath(); o.moveTo(-6, 4); o.lineTo(2, 0); o.lineTo(8, 6); o.stroke(); break;
    }
    case 3: { // mur de ruine
      o.fillStyle = '#6d6254'; o.fillRect(-h, -h, TILE, TILE);
      o.strokeStyle = 'rgba(40,34,28,.7)'; o.lineWidth = 1;
      for (let r = 0; r < 4; r++) { const y = -h + r * 10; o.beginPath(); o.moveTo(-h, y); o.lineTo(h, y); o.stroke(); for (let k = 0; k < 3; k++) { const x = -h + ((k * 14 + (r % 2) * 7) % 40); o.beginPath(); o.moveTo(x, y); o.lineTo(x, y + 10); o.stroke(); } }
      o.fillStyle = 'rgba(255,240,210,.12)'; o.fillRect(-h, -h, TILE, 4);
      o.fillStyle = 'rgba(0,0,0,.25)'; o.fillRect(-h, h - 5, TILE, 5);
      if (v > 0) { o.fillStyle = '#4c443a'; o.beginPath(); o.moveTo(h, -h); o.lineTo(h - 10 * v, -h); o.lineTo(h, -h + 9 * v); o.fill(); } break;
    }
    case 4: { // cristaux
      o.fillStyle = 'rgba(0,0,0,.3)'; o.beginPath(); o.ellipse(3, 6, 18, 12, 0, 0, TAU); o.fill();
      o.shadowColor = '#c381ff'; o.shadowBlur = 12;
      for (let k = 0; k < 4 + v; k++) {
        const a = -Math.PI / 2 + (R() - .5) * 2, len = 12 + R() * 12, w = 4 + R() * 3, bx = (R() - .5) * 14, by = (R() - .5) * 10 + 6;
        const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
        o.fillStyle = k % 2 ? '#8b55d9' : '#b07cff'; o.beginPath(); o.moveTo(bx + nx, by + ny); o.lineTo(tx, ty); o.lineTo(bx - nx, by - ny); o.closePath(); o.fill();
        o.strokeStyle = '#e6ccff'; o.lineWidth = 1; o.beginPath(); o.moveTo(bx, by); o.lineTo(tx, ty); o.stroke();
      }
      o.shadowBlur = 0; break;
    }
    case 5: { // épave de véhicule
      o.rotate((v - 1) * .5 + (R() - .5) * .4);
      o.fillStyle = 'rgba(0,0,0,.35)'; o.fillRect(-17, -9, 38, 22);
      o.fillStyle = '#1a1a1a'; [[-12, -11], [8, -11], [-12, 8], [8, 8]].forEach(([x, y]) => o.fillRect(x, y, 7, 4));
      o.fillStyle = ['#7a4a2e', '#5d5f4a', '#6a3a32'][v]; o.fillRect(-18, -10, 36, 20);
      o.fillStyle = '#2b2f33'; o.fillRect(-6, -8, 14, 16);
      o.fillStyle = 'rgba(160,90,40,.6)'; for (let k = 0; k < 6; k++) o.fillRect(-18 + R() * 34, -10 + R() * 18, 3, 2);
      o.strokeStyle = 'rgba(0,0,0,.4)'; o.strokeRect(-18, -10, 36, 20); break;
    }
    case 6: { // rempart militaire
      o.fillStyle = '#8e8873'; o.fillRect(-h, -h, TILE, TILE);
      o.fillStyle = '#a7a08a'; o.fillRect(-h + 2, -h + 2, TILE - 4, TILE - 4);
      o.save(); o.beginPath(); o.rect(-h, -h, TILE, 8); o.clip();
      for (let k = -2; k < 6; k++) { o.fillStyle = k % 2 ? '#e0b030' : '#26241f'; o.beginPath(); o.moveTo(-h + k * 10, -h); o.lineTo(-h + k * 10 + 10, -h); o.lineTo(-h + k * 10 + 2, -h + 8); o.lineTo(-h + k * 10 - 8, -h + 8); o.fill(); }
      o.restore();
      o.fillStyle = '#5c5748'; [[-14, 6], [14, 6], [-14, 15], [14, 15]].forEach(([x, y]) => { o.beginPath(); o.arc(x, y, 2, 0, TAU); o.fill(); });
      o.fillStyle = 'rgba(0,0,0,.3)'; o.fillRect(-h, h - 4, TILE, 4); break;
    }
    case 7: { // falaise
      o.fillStyle = '#121315'; o.fillRect(-h - 1, -h - 1, TILE + 2, TILE + 2);
      o.strokeStyle = '#26282c'; o.lineWidth = 2; o.beginPath(); o.moveTo(-h, (R() - .5) * 20); o.lineTo(0, (R() - .5) * 20); o.lineTo(h, (R() - .5) * 20); o.stroke(); break;
    }
  }
}

// mini-carte : 1 pixel par tuile
let miniCv = null, miniCtx = null, fogCv = null, fogCtx = null, explored = null;
const FG = 4, FW = WT / FG;
function buildMinimap() {
  miniCv = cvs(WT, WT); miniCtx = miniCv.getContext('2d');
  const img = miniCtx.createImageData(WT, WT);
  const pc = GROUND.map(G => hexToRgb(G.mm)), po = OBS.map(O => O ? hexToRgb(O.mm) : null);
  for (let i = 0; i < WT * WT; i++) {
    const c = W.obs[i] ? po[W.obs[i]] : pc[W.ground[i]];
    img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
  }
  miniCtx.putImageData(img, 0, 0);
  fogCv = cvs(FW, FW); fogCtx = fogCv.getContext('2d'); fogCtx.fillStyle = '#0c0f10'; fogCtx.fillRect(0, 0, FW, FW);
  explored = new Uint8Array(FW * FW);
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function miniSetTile(tx, ty) { lodMark(tx, ty); if (!miniCtx) return; const i = ty * WT + tx; miniCtx.fillStyle = W.obs[i] ? OBS[W.obs[i]].mm : GROUND[W.ground[i]].mm; miniCtx.fillRect(tx, ty, 1, 1); }
function reveal(x, y, r) {
  const cs = FG * TILE, c0x = Math.max(0, Math.floor((x - r) / cs)), c1x = Math.min(FW - 1, Math.floor((x + r) / cs));
  const c0y = Math.max(0, Math.floor((y - r) / cs)), c1y = Math.min(FW - 1, Math.floor((y + r) / cs));
  for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
    const i = cy * FW + cx; if (explored[i]) continue;
    if (d2(cx * cs + cs / 2, cy * cs + cs / 2, x, y) < r * r) { explored[i] = 1; fogCtx.clearRect(cx, cy, 1, 1); }
  }
}

// ================= BASE =================
function genBase(list) {
  const N = WT * WT;
  const g = new Uint8Array(N).fill(7), o = new Uint8Array(N).fill(7), hp = new Float32Array(N), b = new Uint8Array(N), sh = new Uint8Array(N);
  const nD = makeNoise(4242), nC = makeNoise(99);
  const world = { seed: 0, ground: g, obs: o, ohp: hp, biome: b, shade: sh, bases: [], pylons: [], spawn: null, isBase: true };
  W = world;
  const M = 7, nF = makeNoise(7171), nR = makeNoise(31);
  for (let y = 0; y < WT; y++) for (let x = 0; x < WT; x++) {
    const i = y * WT + x;
    sh[i] = Math.round(clamp((nD(x * .07, y * .07, 3) - .28) * 3, 0, 1) * 255);
    // bord du monde : roche-mère
    if (Math.min(x, y, WT - 1 - x, WT - 1 - y) < 3 + (nC(x * .2, y * .2, 2) > .55 ? 1 : 0)) continue;
    g[i] = 0; o[i] = 0;
    const dx = Math.max(BX0 - M - x, x - BX1 - M, 0), dy = Math.max(BY0 - M - y, y - BY1 - M, 0), d = Math.max(dx, dy);
    if (d === 0) {
      // abords immédiats et zone constructible
      const inZone = x >= BX0 && x <= BX1 && y >= BY0 && y <= BY1;
      if (!inZone) { const r = hash2(x, y, 7); g[i] = nC(x * .1, y * .1) > .52 ? 1 : 0; if (r < .2) o[i] = 1; else if (r < .26) o[i] = 2; else if (r < .27) o[i] = 5; }
      else { g[i] = 6; if ((x === BX0 || x === BX1 || y === BY0 || y === BY1) && Math.abs(x - 150) > 2 && Math.abs(y - 150) > 2) o[i] = 6; }
      continue;
    }
    // au-delà : la friche autour de la base (routes depuis les portes, bosquets, rochers, épaves, ruines et buttes rocheuses)
    const road = (Math.abs(x - 150) <= 1 && (y < BY0 || y > BY1)) || (Math.abs(y - 150) <= 1 && (x < BX0 || x > BX1));
    const n1 = nC(x * .1, y * .1), n2 = nF(x * .045, y * .045, 3), r = hash2(x, y, 7);
    g[i] = n1 > .52 ? 1 : 0;
    if (d > 16 && n2 > .66) g[i] = 5; // verre de cratère
    if (road) { g[i] = 2; continue; }
    // rien à récupérer ici (pas d'épaves ni de cristaux) : la friche n'est qu'un décor
    const far = clamp((d - 4) / 30, 0, 1); // plus on s'éloigne, plus le terrain est encombré
    if (d > 22 && n2 < .26 && nR(x * .09, y * .09, 2) > .45) { o[i] = 7; continue; } // buttes rocheuses
    if (d > 10 && hash2((x / 6) | 0, (y / 6) | 0, 21) < .07 && (x % 6 === 0 || y % 6 === 0) && r < .7) { o[i] = 3; g[i] = 6; continue; } // ruines
    if (r < (g[i] === 1 ? .08 + .14 * far : .015)) o[i] = 1;
    else if (hash2(x, y, 17) < .025 + .05 * far) o[i] = 2;
  }
  for (let i = 0; i < N; i++) if (o[i]) hp[i] = OBS[o[i]].hp;
  bTileMap.fill(0);
  for (const bd of (list || save.base.b)) markBuilding(bd, true);
  world.spawn = findWalkableNear(150 * TILE, 154 * TILE, 0, 200, 60) || { x: 150 * TILE, y: 154 * TILE };
  return world;
}
const bTileMap = new Int32Array(WT * WT);
function markBuilding(bd, on) {
  const D = BUILD[bd.type];
  for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) {
    const i = (bd.ty + y) * WT + bd.tx + x; bTileMap[i] = on ? bd.id : 0;
    if (D.mine) continue;
    W.obs[i] = on ? 8 : 0; W.ohp[i] = on ? 1e12 : 0; navInvalidate();
  }
}
function canPlace(type, tx, ty, ignoreId) {
  const D = BUILD[type];
  if (tx < BX0 + 1 || ty < BY0 + 1 || tx + D.w - 1 > BX1 - 1 || ty + D.h - 1 > BY1 - 1) return false;
  const small = D.w === 1;
  for (const b of save.base.b) {
    if (b.id === ignoreId) continue; const E = BUILD[b.type], g = (small || E.w === 1) ? 0 : 1;
    if (tx < b.tx + E.w + g && tx + D.w + g > b.tx && ty < b.ty + E.h + g && ty + D.h + g > b.ty) return false;
  }
  for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) { const o = W.obs[(ty + y) * WT + tx + x]; if (o === 6 || o === 7) return false; }
  return true;
}
