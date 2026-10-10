// Rendu : monde, unités, effets, HUD, cartes de flotte, base.

// ================= RENDU =================
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
let VW = 800, VH = 600, DPR = 1, vignette = null, hudCards = [];
const FONT = '"Bahnschrift", "Segoe UI", Roboto, "Nirmala UI", "Noto Sans Devanagari", "Noto Sans Bengali", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans Arabic", Tahoma, system-ui, sans-serif'; // les écritures non latines ont leurs polices de repli
let resScale = 1; // résolution dynamique : baisse quand les images manquent même en effets réduits (téléphones modestes)
function resize() {
  DPR = Math.max(.6, Math.min(TOUCH.on ? 1.25 : 1.5, window.devicePixelRatio || 1) * resScale);
  try { document.documentElement.style.setProperty('--ui', uiScale()); } catch (e) { }
  const r = cv.getBoundingClientRect(); VW = Math.max(320, r.width); VH = Math.max(240, r.height);
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); vignette = null;
}
function worldToScreen(x, y) { return { x: (x - cam.x) * cam.zoom + VW / 2, y: (y - cam.y) * cam.zoom + VH / 2 }; }
function screenToWorld(x, y) { return { x: (x - VW / 2) / cam.zoom + cam.x, y: (y - VH / 2) / cam.zoom + cam.y }; }

function render() {
  const c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.fillStyle = '#0e1112'; c.fillRect(0, 0, VW, VH);
  if (!W || !player) return;
  // secousse lissée (bruit continu plutôt qu'un saut aléatoire par image) et recul des tirs lourds
  const shk = cam.shake * settings.shake, tt = performance.now() / 1000;
  const shx = shk * .55 * (Math.sin(tt * 61) * .6 + Math.sin(tt * 37.3 + 1.7) * .4) + (cam.kx || 0) * settings.shake, shy = shk * .55 * (Math.sin(tt * 53.7 + .5) * .6 + Math.sin(tt * 29.1 + 2.9) * .4) + (cam.ky || 0) * settings.shake;
  c.save(); c.translate(VW / 2 + shx, VH / 2 + shy); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x, -cam.y);
  const hw = VW / 2 / cam.zoom, hh = VH / 2 / cam.zoom;
  const vx0 = cam.x - hw - 80, vx1 = cam.x + hw + 80, vy0 = cam.y - hh - 80, vy1 = cam.y + hh + 80;
  drawGround(c, vx0, vy0, vx1, vy1);
  const ds = decalSprite(); for (const d of decals) { if (d.x < vx0 - d.r || d.x > vx1 + d.r || d.y < vy0 - d.r || d.y > vy1 + d.r) continue; c.drawImage(ds, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2); }
  FX.drawGroundLayer(c, vx0, vy0, vx1, vy1);
  drawZone(c); if (LIVE.game) LIVE.drawZones(c);
  for (const p of W.pylons) if (p.x > vx0 - 100 && p.x < vx1 + 100 && p.y > vy0 - 100 && p.y < vy1 + 100) drawPylon(c, p);
  for (const cr of crates) if (cr.x > vx0 && cr.x < vx1 && cr.y > vy0 && cr.y < vy1) drawCrate(c, cr);
  { const li = cam.zoom < .25; for (const it of items) if (!it.dead && (!li || it.res === 'heart' || it.res === 'cores') && it.x > vx0 && it.x < vx1 && it.y > vy0 && it.y < vy1) drawItem(c, it); }
  for (const f of fires) { if (f.x < vx0 - f.r || f.x > vx1 + f.r || f.y < vy0 - f.r || f.y > vy1 + f.r) continue; if (f.vortex) { drawVortex(c, f); continue; } const k = Math.min(1, f.t / 1.5); const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, `rgba(255,120,40,${.35 * k})`); g.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = g; circ(c, f.x, f.y, f.r); c.fill(); }
  drawObstacles(c, vx0, vy0, vx1, vy1);
  if (state === 'base' || state === 'assault' || (state === 'result' && W && W.isBase)) drawBuildings(c, vx0, vy0, vx1, vy1);
  const vis = [];
  for (const u of units) { if (u.dead || u.hidden) continue; const m = u.r * 1.8; if (u.x + m < vx0 || u.x - m > vx1 || u.y + m < vy0 || u.y - m > vy1) continue; vis.push(u); }
  vis.sort((a, b) => (a.fly - b.fly) || ((a.kind === 'player' ? 1e5 : a.r) - (b.kind === 'player' ? 1e5 : b.r)));
  for (const u of vis) if (!u.fly) drawUnit(c, u);
  drawBullets(c, vx0, vy0, vx1, vy1, false);
  for (const u of vis) if (u.fly) drawUnit(c, u);
  drawBullets(c, vx0, vy0, vx1, vy1, true);
  drawParts(c, vx0, vy0, vx1, vy1);
  FX.drawFrags(c, vx0, vy0, vx1, vy1);
  for (const b of beams) {
    const k = b.life / b.max; c.strokeStyle = b.col; c.globalAlpha = b.heal ? .6 : b.hot ? .9 : k;
    c.beginPath(); if (b.pts) { c.moveTo(b.pts[0][0], b.pts[0][1]); for (let i = 1; i < b.pts.length; i++) c.lineTo(b.pts[i][0], b.pts[i][1]); } else { c.moveTo(b.x1, b.y1); c.lineTo(b.x2, b.y2); }
    if (b.fusion) { c.lineWidth = b.w * k; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = b.w * .45 * k; c.stroke(); c.globalAlpha = 1; continue; }
    c.lineWidth = b.w * (b.heal || b.hot ? 1 : (.5 + k)); c.stroke();
    if (!b.heal) { c.strokeStyle = '#ffffff'; c.lineWidth = b.w * (b.hot ? .35 : .3 * k); c.stroke(); }
  }
  c.globalAlpha = 1;
  drawBeaconLight(c);
  ENV.drawSky(c, vx0, vy0, vx1, vy1);
  LIGHT.collect(vx0, vy0, vx1, vy1, vis);
  c.restore();
  // météo et lumière, en espace écran
  ENV.drawDrops(c);
  LIGHT.render(c, shx, shy, vx0, vy0, vx1, vy1);
  ENV.drawScreen(c);
  // repères par-dessus la nuit et la brume : barres de vie, cibles, consignes
  c.save(); c.translate(VW / 2 + shx, VH / 2 + shy); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x, -cam.y);
  if (state === 'base') drawBaseWorldOverlay(c);
  drawOverlays(c, vis); if (LIVE.game) LIVE.drawTags(c);
  drawTargets(c, vis, vx0, vy0, vx1, vy1);
  if (TUT.on) TUT.drawWorld(c);
  c.restore();
  drawLabels(c);
  if (!vignette) { vignette = c.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .35, VW / 2, VH / 2, Math.max(VW, VH) * .75); vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.55)'); }
  c.fillStyle = vignette; c.fillRect(0, 0, VW, VH);
  if (player.hp < player.maxhp * .3 && !player.hidden) { c.fillStyle = settings.flash ? `rgba(160,20,30,${.12 + .08 * Math.sin(time * 6)})` : 'rgba(160,20,30,.12)'; c.fillRect(0, 0, VW, VH); }
  if (B && B.state === 'lift') { c.fillStyle = `rgba(255,248,220,${clamp(1 - endT / 1.6, 0, 1) * (settings.flash ? .9 : .4)})`; c.fillRect(0, 0, VW, VH); }
  if (flashT > 0 && settings.flash) { c.fillStyle = `rgba(255,250,235,${clamp(flashT, 0, 1) * .85})`; c.fillRect(0, 0, VW, VH); }
  if (!EXPSIM) drawCombatFeedback(c);
  if (TUT.on) TUT.drawEdge(c);
  const ui = uiScale(), sVW = VW, sVH = VH; VW = VW / ui; VH = VH / ui; c.save(); c.scale(ui, ui);
  try {
    if (EXPSIM) expViewHUD(c);
    else { if (tactical) drawTacticalFrame(c); if (state === 'base') drawBaseHUD(c); else drawHUD(c); drawThreatHUD(c); }
  } finally { c.restore(); VW = sVW; VH = sVH; }
  if (!EXPSIM) drawTouch(c);
  if (mapOpen && !EXPSIM) { const sV = VW, sH = VH; VW /= ui; VH /= ui; c.save(); c.scale(ui, ui); try { drawBigMap(c); } finally { c.restore(); VW = sV; VH = sH; } }
}

const CHT = 16, CPX = CHT * TILE, NCH = Math.ceil(WT / CHT);
let chunkCache = new Map(), chunkTick = 0, chunkFrameT = 0, chunkBytes = 0, chunkN = 0, chunkSpent = 0, chunkRef = null; // chunkSpent : temps passé à préparer des morceaux pendant l'image en cours (ms)
// mémoire réservée aux morceaux de sol ; la carte de fond (niveau le plus grossier, 9 Mo pour tout le monde) n'y est pas comptée
const chunkMem = () => (TOUCH.on ? 72 : 128) * 1048576;
function chunkPut(key, cv, lv) {
  const o = chunkCache.get(key); if (o) chunkBytes -= o.b;
  const e = { cv, t: ++chunkTick, lv, b: lv === LOD_N - 1 ? 0 : cv.width * cv.height * 4 }; chunkCache.set(key, e); chunkBytes += e.b;
  if (chunkBytes > chunkMem()) chunkTrim();
  return cv;
}
// au-delà du budget, on oublie les morceaux vus le moins récemment (jamais ceux de l'image en cours)
function chunkTrim() {
  let tot = 0; for (const e of chunkCache.values()) tot += e.b;
  const lim = chunkMem();
  if (tot > lim) for (const [k, e] of [...chunkCache].filter(([, e]) => e.b && e.t <= chunkFrameT).sort((a, b) => a[1].t - b[1].t)) { if (tot <= lim * .75) break; chunkCache.delete(k); tot -= e.b; }
  chunkBytes = tot;
}
// un morceau est bon marché quand le niveau juste plus fin est prêt : il suffit de le réduire
const chunkCheap = (idx, lv) => lv >= 2 && chunkCache.has(idx * LOD_N + lv - 1);
function getChunk(cx, cy, lv) {
  const idx = cy * NCH + cx, key = idx * LOD_N + lv; let e = chunkCache.get(key);
  if (e) { e.t = ++chunkTick; return e.cv; }
  const T0 = performance.now(); try { return chunkMake(cx, cy, lv, idx, key); } finally { chunkSpent += performance.now() - T0; }
}
function chunkMake(cx, cy, lv, idx, key) {
  const s = LOD_S[lv], n = Math.ceil(CPX * s);
  const f = lv >= 2 ? chunkCache.get(idx * LOD_N + lv - 1) : null;
  if (f) { const cv2 = cvs(n, n), c = cv2.getContext('2d'); c.drawImage(f.cv, 0, 0, n, n); if (lv === 2) { c.scale(s, s); bakeObstacles(c, cx, cy); } return chunkPut(key, cv2, lv); }
  const cv2 = cvs(n, n), c = cv2.getContext('2d'); c.scale(s, s);
  const G = W.ground;
  for (let ty = cy * CHT; ty < Math.min(WT, cy * CHT + CHT); ty++) for (let tx = cx * CHT; tx < Math.min(WT, cx * CHT + CHT); tx++) {
    const i = ty * WT + tx, g = G[i], v = 6 | ((tx * 7 + ty * 13) & 1);
    c.drawImage(groundAtlas, v * TILE, g * TILE, TILE, TILE, (tx - cx * CHT) * TILE, (ty - cy * CHT) * TILE, TILE + .6, TILE + .6);
  }
  groundSoften(c, cx, cy, lv); // transitions naturelles et ombrage continu (bords et détails seulement de près)
  scarReplay(c, cx, cy, s); // cratères, gravats, traces et épaves déjà laissés dans ce morceau
  if (lv >= 2) bakeObstacles(c, cx, cy); // de loin, les obstacles sont intégrés au sol
  return chunkPut(key, cv2, lv);
}
// en attendant qu'un morceau soit prêt : le même à un autre niveau de détail (de préférence avec les obstacles intégrés s'il le faut)
const CHUNK_ALT = [[1, 2, 3, 4], [0, 2, 3, 4], [3, 4, 1, 0], [2, 4, 1, 0], [3, 2, 1, 0]];
function chunkAlt(idx, lv) { for (const l of CHUNK_ALT[lv]) { const e = chunkCache.get(idx * LOD_N + l); if (e) return e; } return null; }
// le temps qui reste après l'affichage prépare la suite : la couronne autour de la vue (dans le sens du déplacement),
// le niveau plus grossier des morceaux visibles (on dézoome sans attendre), puis la carte de fond de tout le monde
function chunkAhead(lv, cx0, cx1, cy0, cy1, ms) {
  // l'appareil peine déjà (l'image précédente a demandé beaucoup de travail) : on anticipe moins pour ne pas l'allonger
  if (frameWork > 20) ms *= .35;
  const late = () => chunkSpent > ms;
  if (late()) return;
  if (chunkBytes < chunkMem() * .9) {
    const F = focus(), dx = Math.sign(F.vx || 0), dy = Math.sign(F.vy || 0); let best = -1, bs = -1e9;
    for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
      if (cx < 0 || cy < 0 || cx >= NCH || cy >= NCH || (cx >= cx0 && cx <= cx1 && cy >= cy0 && cy <= cy1) || chunkCache.has((cy * NCH + cx) * LOD_N + lv)) continue;
      const sc = (cx < cx0 ? -1 : cx > cx1 ? 1 : 0) * dx + (cy < cy0 ? -1 : cy > cy1 ? 1 : 0) * dy; if (sc > bs) { bs = sc; best = cy * NCH + cx; }
    }
    if (best >= 0) getChunk(best % NCH, (best / NCH) | 0, lv);
  }
  if (lv < LOD_N - 1) { let k = 0; for (let cy = cy0; cy <= cy1 && k < 12 && !late(); cy++) for (let cx = cx0; cx <= cx1 && k < 12 && !late(); cx++) { const idx = cy * NCH + cx; if (!chunkCache.has(idx * LOD_N + lv + 1) && chunkCheap(idx, lv + 1)) { getChunk(cx, cy, lv + 1); k++; } } }
  if (late() || (W.farOK && ++chunkN % 30)) return;
  // carte de fond : anneau par anneau autour de la vue (seulement le pourtour de chaque anneau)
  const L = LOD_N - 1, ccx = (cx0 + cx1) >> 1, ccy = (cy0 + cy1) >> 1; let miss = false;
  const at = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= NCH || cy >= NCH || chunkCache.has((cy * NCH + cx) * LOD_N + L)) return; miss = true; if (!late()) getChunk(cx, cy, L); };
  for (let r = 0; r < NCH && !late(); r++) {
    if (!r) { at(ccx, ccy); continue; }
    for (let k = -r; k < r; k++) { at(ccx + k, ccy - r); at(ccx + r, ccy + k); at(ccx - k, ccy + r); at(ccx - r, ccy - k); }
  }
  if (!late()) W.farOK = !miss;
}
// ---------- sol : bords irréguliers entre les terrains naturels, coins arrondis, ombrage sans paliers ----------
// Le terrain le plus « couvrant » (marais, verre, cristaux, humus, cendres) déborde un peu sur son voisin ;
// le bitume et le béton gardent leurs bords nets, la roche-mère ne bouge pas.
const G_PRIO = [3, 4, 1, 7, 5, 6, 1, 0];
const gNat = t => t !== 2 && t !== 6 && t !== 7;
let gTiles = null, gTilesAt = null, gLow = null;
function groundTile(t) {
  if (gTilesAt !== groundAtlas) { gTiles = []; gTilesAt = groundAtlas; }
  if (!gTiles[t]) { const k = cvs(TILE, TILE); k.getContext('2d').drawImage(groundAtlas, 6 * TILE, t * TILE, TILE, TILE, 0, 0, TILE, TILE); gTiles[t] = k; }
  return gTiles[t];
}
const fringe = (a, b) => 7 + 4 * Math.sin(a * .21 + b * 1.7) + 3 * Math.sin(a * .53 + b * .9 + 1.3);
const DECAL_P = [.34, .42, .3, .22, .26, .3, .2, 0];
function groundDecal(c, a, x, y, r, q) {
  const B = GROUND[a].base, dk = rgb(B, -16), lt = rgb(B, 14);
  if ((a === 0 || a === 4 || a === 5) && r < .55) { // cailloux et éclats
    for (let k = 0; k < 3; k++) { const px = x + (hash2(k, x | 0, 3) - .5) * 14, py = y + (hash2(y | 0, k, 4) - .5) * 10, s = 1.2 + hash2(k, y | 0, 5) * 2.4;
      c.fillStyle = 'rgba(0,0,0,.22)'; circ(c, px + 1, py + 1, s); c.fill(); c.fillStyle = a === 4 && k === 0 ? 'rgba(200,150,255,.55)' : k ? dk : lt; circ(c, px, py, s); c.fill(); }
  } else if (a === 1 && r < .7) { // touffes d'herbe rase
    c.strokeStyle = lt; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < 5; k++) { const bx = x + (k - 2) * 2.2, h = 4 + hash2(k, x | 0, 6) * 4; c.moveTo(bx, y); c.lineTo(bx + (hash2(y | 0, k, 7) - .5) * 4, y - h); }
    c.stroke();
  } else if (a === 3) { // écume et algues
    c.fillStyle = r < .5 ? 'rgba(180,230,120,.12)' : 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(x, y, 7 + q * 9, 4 + q * 5, q * 3, 0, TAU); c.fill();
  } else if (r < .6) { // fissure
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1; c.beginPath(); let px = x, py = y; c.moveTo(px, py);
    for (let k = 0; k < 4; k++) { const ang = q * TAU + (hash2(k, x | 0, 8) - .5) * 1.6; px += Math.cos(ang) * 6; py += Math.sin(ang) * 6; c.lineTo(px, py); }
    c.stroke();
  } else { // tache sombre
    c.fillStyle = 'rgba(0,0,0,.1)'; c.beginPath(); c.ellipse(x, y, 6 + q * 10, 4 + q * 6, r * 4, 0, TAU); c.fill();
  }
}
function groundSoften(c, cx, cy, lv) {
  const G = W.ground, SH = W.shade, x0 = cx * CHT, y0 = cy * CHT, pats = [];
  if (lv <= 2) {
  const pat = t => pats[t] || (pats[t] = c.createPattern(groundTile(t), 'repeat'));
  const gAt = (x, y) => x < 0 || y < 0 || x >= WT || y >= WT ? 7 : G[y * WT + x];
  c.save(); c.lineWidth = 1.4; c.strokeStyle = 'rgba(0,0,0,.16)';
  for (let ty = y0; ty < Math.min(WT, y0 + CHT); ty++) for (let tx = x0; tx < Math.min(WT, x0 + CHT); tx++) {
    const a = G[ty * WT + tx], pa = G_PRIO[a], lx = (tx - x0) * TILE, ly = (ty - y0) * TILE, wx = tx * TILE, wy = ty * TILE;
    const N = [gAt(tx - 1, ty), gAt(tx + 1, ty), gAt(tx, ty - 1), gAt(tx, ty + 1)];
    for (let k = 0; k < 4; k++) {
      const b = N[k]; if (b === a || !gNat(b) || G_PRIO[b] <= pa) continue;
      // bande ondulée du voisin qui mord sur cette case, le long du bord commun
      c.beginPath();
      if (k < 2) { const ex = k === 0 ? lx : lx + TILE, sg = k === 0 ? 1 : -1, wex = k === 0 ? wx : wx + TILE; c.moveTo(ex, ly); for (let q = 0; q <= TILE; q += 5) c.lineTo(ex + sg * fringe(wy + q, wex * .07), ly + q); c.lineTo(ex, ly + TILE); }
      else { const ey = k === 2 ? ly : ly + TILE, sg = k === 2 ? 1 : -1, wey = k === 2 ? wy : wy + TILE; c.moveTo(lx, ey); for (let q = 0; q <= TILE; q += 5) c.lineTo(lx + q, ey + sg * fringe(wx + q, wey * .07)); c.lineTo(lx + TILE, ey); }
      c.closePath(); c.fillStyle = pat(b); c.fill();
    }
    // coins rentrants : deux voisins du même terrain couvrant arrondissent l'escalier
    for (const [h, v, ox, oy] of [[0, 2, 0, 0], [1, 2, TILE, 0], [0, 3, 0, TILE], [1, 3, TILE, TILE]]) {
      const b = N[h]; if (b !== N[v] || b === a || !gNat(b) || G_PRIO[b] <= pa) continue;
      c.beginPath(); c.moveTo(lx + ox, ly + oy); c.arc(lx + ox, ly + oy, TILE * .62, 0, TAU); c.fillStyle = pat(b); c.fill();
    }
  }
  // détails semés au hasard (cailloux, touffes, fissures, taches) : le motif des tuiles ne se répète plus
  for (let ty = y0; ty < Math.min(WT, y0 + CHT); ty++) for (let tx = x0; tx < Math.min(WT, x0 + CHT); tx++) {
    const a = G[ty * WT + tx], h = hash2(tx, ty, 11); if (h > DECAL_P[a]) continue;
    groundDecal(c, a, (tx - x0) * TILE + 6 + hash2(tx, ty, 12) * 28, (ty - y0) * TILE + 6 + hash2(tx, ty, 13) * 28, hash2(tx, ty, 14), hash2(ty, tx, 15));
  }
  c.restore();
  } else {
    // de très loin : seulement les coins arrondis, en couleur unie (le grain du sol ne se voit plus)
    for (let ty = y0; ty < Math.min(WT, y0 + CHT); ty++) for (let tx = x0; tx < Math.min(WT, x0 + CHT); tx++) {
      const a = G[ty * WT + tx], pa = G_PRIO[a], lx = (tx - x0) * TILE, ly = (ty - y0) * TILE;
      const N = [tx > 0 ? G[ty * WT + tx - 1] : 7, tx < WT - 1 ? G[ty * WT + tx + 1] : 7, ty > 0 ? G[(ty - 1) * WT + tx] : 7, ty < WT - 1 ? G[(ty + 1) * WT + tx] : 7];
      for (const [h, v, ox, oy] of [[0, 2, 0, 0], [1, 2, TILE, 0], [0, 3, 0, TILE], [1, 3, TILE, TILE]]) {
        const b = N[h]; if (b !== N[v] || b === a || !gNat(b) || G_PRIO[b] <= pa) continue;
        c.beginPath(); c.moveTo(lx + ox, ly + oy); c.arc(lx + ox, ly + oy, TILE * .62, 0, TAU); c.fillStyle = rgb(GROUND[b].base, 9); c.fill();
      }
    }
  }
  // ombrage : la carte des ombres (une valeur par case) agrandie en douceur au lieu de paliers carrés
  if (!gLow) gLow = cvs(CHT + 2, CHT + 2);
  const g = gLow.getContext('2d'); g.clearRect(0, 0, CHT + 2, CHT + 2);
  for (let k = 0; k < CHT + 2; k++) for (let j = 0; j < CHT + 2; j++) {
    const x = clamp(x0 - 1 + j, 0, WT - 1), y = clamp(y0 - 1 + k, 0, WT - 1), sh = SH[y * WT + x];
    g.fillStyle = 'rgba(0,0,0,' + ((1 - sh / 255) * .26).toFixed(3) + ')'; g.fillRect(j, k, 1, 1);
  }
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(gLow, -TILE, -TILE, (CHT + 2) * TILE, (CHT + 2) * TILE);
}
function drawGround(c, vx0, vy0, vx1, vy1) {
  const cx0 = Math.max(0, Math.floor(vx0 / CPX)), cx1 = Math.min(NCH - 1, Math.floor(vx1 / CPX));
  const cy0 = Math.max(0, Math.floor(vy0 / CPX)), cy1 = Math.min(NCH - 1, Math.floor(vy1 / CPX));
  const lv = lodLevel(cam.zoom), dirty = lv >= 2 && W.lodDirty && W.lodDirty.size ? W.lodDirty : null; let budget = 3, made = 0, cheap = 0;
  const ms = TOUCH.on ? 4 : 5; chunkFrameT = chunkTick; chunkSpent = 0;
  // le compte de mémoire est refait régulièrement : vidages du cache et caches des expéditions (échangés le temps de leur vue)
  if (chunkCache !== chunkRef || !chunkCache.size || ++chunkN % 20 === 0) { chunkRef = chunkCache; let t = 0; for (const e of chunkCache.values()) t += e.b || 0; chunkBytes = t; }
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const idx = cy * NCH + cx, X = cx * CPX, Y = cy * CPX;
    if (dirty && dirty.has(idx) && budget > 0) { budget--; dirty.delete(idx); for (let k = 2; k < LOD_N; k++) chunkCache.delete(idx * LOD_N + k); }
    const e = chunkCache.get(idx * LOD_N + lv);
    if (e) { e.t = ++chunkTick; c.drawImage(e.cv, X, Y, CPX + 1, CPX + 1); continue; }
    // à préparer : les morceaux bon marché tout de suite, les autres dans la limite du temps de l'image (au moins un)
    const ch = lv >= 3 && chunkCheap(idx, lv) && cheap < 48; // simple réduction ; au niveau 2, il faut aussi dessiner les obstacles : compté dans le temps
    if (ch || !made || chunkSpent < ms) { if (ch) cheap++; else made++; c.drawImage(getChunk(cx, cy, lv), X, Y, CPX + 1, CPX + 1); continue; }
    // en attendant : le même morceau à un autre niveau de détail, sinon la minicarte (adoucie)
    const a = chunkAlt(idx, lv); if (a) { a.t = ++chunkTick; c.drawImage(a.cv, X, Y, CPX + 1, CPX + 1); continue; }
    if (miniCv) c.drawImage(miniCv, cx * CHT, cy * CHT, CHT, CHT, X, Y, CPX + 1, CPX + 1);
  }
  chunkAhead(lv, cx0, cx1, cy0, cy1, ms);
  // marais animé : reflets légers sur les tuiles toxiques visibles
  const tx0 = Math.max(0, Math.floor(vx0 / TILE)), tx1 = Math.min(WT - 1, Math.floor(vx1 / TILE));
  const ty0 = Math.max(0, Math.floor(vy0 / TILE)), ty1 = Math.min(WT - 1, Math.floor(vy1 / TILE));
  if ((tx1 - tx0) * (ty1 - ty0) < 4000) {
    const G = W.ground; c.fillStyle = 'rgba(200,250,120,.35)';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (G[ty * WT + tx] !== 3) continue;
      const ph = (time * 1.3 + hash2(tx, ty, 5) * 6) % 3; if (ph > 1) continue;
      c.globalAlpha = Math.sin(ph * Math.PI) * .5; circ(c, tx * TILE + 8 + hash2(ty, tx, 2) * 24, ty * TILE + 8 + hash2(tx, ty, 9) * 24, 1.5 + ph * 5); c.fill();
    }
    c.globalAlpha = 1;
  }
}
function drawObstacles(c, vx0, vy0, vx1, vy1) {
  if (lodLevel(cam.zoom) >= 2) return; // intégrés aux morceaux de sol en basse résolution
  const tx0 = Math.max(0, Math.floor(vx0 / TILE) - 1), tx1 = Math.min(WT - 1, Math.floor(vx1 / TILE) + 1);
  const ty0 = Math.max(0, Math.floor(vy0 / TILE) - 1), ty1 = Math.min(WT - 1, Math.floor(vy1 / TILE) + 1);
  const O = W.obs, H = W.ohp;
  // relief : murs, remparts et falaises projettent une ombre vers le bas et la droite (lumière en haut à gauche).
  // Toutes les ombres d'un même sens forment un seul tracé rempli d'un motif aligné sur les cases : trois remplissages par image au lieu d'un dessin par case.
  const sh = obsShadows(), ph = new Path2D(), pv = new Path2D(), pc = new Path2D(); let nh = 0, nv = 0, nc = 0;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const o = O[ty * WT + tx]; if (!TALL[o]) continue;
    const below = ty + 1 < WT ? O[(ty + 1) * WT + tx] : 7, right = tx + 1 < WT ? O[ty * WT + tx + 1] : 7, diag = tx + 1 < WT && ty + 1 < WT ? O[(ty + 1) * WT + tx + 1] : 7;
    if (!TALL[below]) { ph.rect(tx * TILE + 5, (ty + 1) * TILE, TILE, 13); nh++; }
    if (!TALL[right]) { pv.rect((tx + 1) * TILE, ty * TILE + 5, 9, TILE); nv++; }
    if (!TALL[diag] && (TALL[below] || TALL[right])) { pc.rect((tx + 1) * TILE, (ty + 1) * TILE, 9, 13); nc++; }
  }
  if (nh) { c.fillStyle = sh.h; c.fill(ph); }
  if (nv) { c.fillStyle = sh.v; c.fill(pv); }
  if (nc) { c.fillStyle = sh.c; c.fill(pc); }
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const i = ty * WT + tx, o = O[i]; if (!o || o === 8) continue;
    const v = (tx * 5 + ty * 3) % 3;
    c.drawImage(obsAtlas, v * OC, o * OC, OC, OC, tx * TILE + 20 - OC / 2, ty * TILE + 20 - OC / 2, OC, OC);
    if (o !== 7 && H[i] < OBS[o].hp * .55) { c.fillStyle = 'rgba(10,8,6,.35)'; c.fillRect(tx * TILE + 6, ty * TILE + 6, 28, 28); }
    // arête éclairée en haut des falaises, là où elles bordent le sol
    if (o === 7 && ty > 0 && O[i - WT] !== 7) { c.fillStyle = 'rgba(150,150,140,.16)'; c.fillRect(tx * TILE, ty * TILE, TILE, 3); }
    if (o === 7 && tx > 0 && O[i - 1] !== 7) { c.fillStyle = 'rgba(150,150,140,.09)'; c.fillRect(tx * TILE, ty * TILE, 2, TILE); }
  }
}
const TALL = [0, 0, 0, 1, 0, 0, 1, 1, 0];
let obsSh = null;
function obsShadows() {
  if (obsSh) return obsSh;
  // chaque motif fait une case : le dégradé occupe le bord où tombe l'ombre, le reste est transparent
  const mk = f => { const k = cvs(TILE, TILE), g = k.getContext('2d'); f(g); return k.getContext('2d').createPattern(k, 'repeat'); };
  const lin = (g, x0, y0, x1, y1, w, h) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  obsSh = {
    h: mk(g => lin(g, 0, 0, 0, 13, TILE, 13)),
    v: mk(g => lin(g, 0, 0, 9, 0, 9, TILE)),
    c: mk(g => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 13); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 9, 13); }),
  };
  return obsSh;
}
function palOf(u) { if (u.npal) return u.npal; if (u.team === 2) return u.crew ? u.crew.pal : CREW_PALS[0]; return u.team === 1 ? (u.etype === 'archonte' ? PAL.archon : u.boss || u.giant ? PAL.boss : u.human ? PAL.human : PAL.enemy) : u.kind === 'player' ? PAL.player : PAL.ally; }
// usure de combat : brûlures et entailles sur la carcasse, puis fentes rougeoyantes quand la machine est près de céder
function paintWear(c, u) {
  const f = u.hp / u.maxhp, r = u.r, sev = (.7 - f) / .7, n = 2 + Math.floor(sev * 5); let s = (u.id * 7919) % 233280;
  const R = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let k = 0; k < n; k++) {
    const x = (R() - .5) * r * 1.1, y = (R() - .5) * r * 1.1, rad = r * (.1 + R() * .14);
    c.fillStyle = `rgba(14,11,9,${.28 + .22 * sev})`; circ(c, x, y, rad); c.fill();
    c.fillStyle = `rgba(6,5,4,${.3 + .25 * sev})`; circ(c, x + rad * .15, y - rad * .1, rad * .45); c.fill();
  }
  if (f < .35) {
    const fl = .55 + .45 * Math.sin(time * 9 + u.id);
    c.strokeStyle = `rgba(255,${(120 + 70 * fl) | 0},40,${.35 + .45 * fl})`; c.lineWidth = Math.max(1, r * .045); c.lineCap = 'round';
    for (let k = 0; k < (f < .18 ? 4 : 2); k++) { let x = (R() - .5) * r * .9, y = (R() - .5) * r * .9, a = R() * TAU; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 3; j++) { a += (R() - .5) * 1.4; x += Math.cos(a) * r * .14; y += Math.sin(a) * r * .14; c.lineTo(x, y); } c.stroke(); }
    c.lineCap = 'butt';
  }
}
function drawUnit(c, u) {
  const P = palOf(u), zr = u.r * cam.zoom;
  // de très loin : un point de couleur suffit
  if (zr < 2.2 && u.kind !== 'building' && u.kind !== 'beacon' && u.kind !== 'beacon2') { c.fillStyle = u.kind === 'player' ? '#ff8a3d' : u.kind === 'npc' ? MISCOL : u.team === 0 ? COL.ally : u.team === 2 ? COL.rival : COL.enemy; const s = Math.max(u.r * 2, (u.kind === 'player' ? 4.5 : 2.6) / cam.zoom); c.fillRect(u.x - s / 2, u.y - s / 2, s, s); return; }
  if (u.kind === 'building') {
    for (const m of u.mounts) { c.save(); c.translate(u.x, u.y); c.rotate(m.aim); paintMount(c, m.wid, u.mscale, P, m.recoil, time, m); c.restore(); }
    if (u.shield > 1) { c.strokeStyle = `rgba(127,200,255,${.25 + (u.shieldHit > 0 ? .45 : 0)})`; c.lineWidth = 2; circ(c, u.x, u.y, u.r * 1.25 + 6); c.stroke(); }
    if (u.hitFlash > 0) { c.globalAlpha = Math.min(.35, u.hitFlash * 4); c.fillStyle = '#fff'; c.fillRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2); c.globalAlpha = 1; }
    return;
  }
  const ghost = u.cloak && time - (u.lastFire || -9) > 1.5, jz = u.jz || 0;
  if (ghost) c.globalAlpha = u.team === 1 ? (d2(u.x, u.y, focus().x, focus().y) < 280 * 280 ? .32 : .08) : .42; // un spectre ennemi ne se devine que de près
  // recul d'une grosse arme : tout le robot part en arrière un instant
  const kx = u.kick ? -Math.cos(u.kickA) * u.kick : 0, ky = u.kick ? -Math.sin(u.kickA) * u.kick : 0;
  c.save(); c.translate(u.x + kx, u.y + ky);
  const so = (u.fly ? 14 + u.r * .3 : Math.max(3, u.r * .16)) + jz * (20 + u.r * .4);
  c.fillStyle = 'rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(so * .6, so, u.r * 1.02, u.r * .88, 0, 0, TAU); c.fill();
  if (u.kind === 'beacon' || u.kind === 'beacon2') { drawBeaconBody(c, u); c.restore(); return; }
  if (jz) c.scale(1 + jz * .25, 1 + jz * .25);
  if (u.overT > 0) { c.fillStyle = `rgba(255,138,61,${.15 + .1 * Math.sin(time * 12)})`; circ(c, 0, 0, u.r * 1.3); c.fill(); }
  c.rotate(u.ang);
  if (u.kind === 'robot' || (u.kind === 'rival' && u.role === 'bot')) paintChassis(c, u.chassis, u.r, P, u.t, u.mv, u);
  else if (u.kind === 'enemy') paintEnemy(c, u.etype, u.r, P, u.t, u.mv, u);
  else if (u.kind === 'minion') paintChassis(c, u.mpaint || 'minion', u.r, P, time * 3, 1, u);
  else if (u.kind === 'npc') paintNpc(c, u, P, u.t, u.mv);
  else paintHuman(c, u.r, P, u.t, u.mv, (u.pw && u.pw.gun) || 'pistol', u.cargoW / u.cargoMax);
  if (u.hp < u.maxhp * .7 && zr > 7 && !u.human && u.kind !== 'player') paintWear(c, u);
  c.restore();
  if (!u.human && u.kind !== 'player' && zr > 5) for (const m of u.mounts) {
    if (m.wid === 'e_sting' || m.wid === 'e_claw' || m.wid === 'mg_mini') continue; const [mx, my] = mountWorldPos(u, m), s = m.ds || u.mscale;
    c.save(); c.translate(mx + kx, my + ky);
    if (m.slot && zr > 9) { c.save(); c.rotate(u.ang); paintHardpoint(c, m, P, s); c.restore(); }
    c.rotate(m.aim); paintMount(c, m.wid, s, P, m.recoil, time, m); c.restore();
  }
  if (u.shield > 1) { const k = clamp(u.shield / (u.shieldMax || 100), 0, 1); c.strokeStyle = `rgba(127,200,255,${.2 + .3 * k + (u.shieldHit > 0 ? .4 : 0)})`; c.lineWidth = 1.5 + (u.shieldHit > 0 ? 2 : 0); circ(c, u.x, u.y, u.r * 1.15 + 4); c.stroke(); if (u.shieldHit > 0) { c.fillStyle = 'rgba(127,200,255,.08)'; c.fill(); } }
  if (u.hitFlash > 0) { c.globalAlpha = Math.min(.5, u.hitFlash * 5) * Math.min(1, 16 / u.r); c.fillStyle = '#fff'; circ(c, u.x, u.y, u.r * .8); c.fill(); c.globalAlpha = 1; }
  if (u.piloted) { c.strokeStyle = 'rgba(255,138,61,.8)'; c.lineWidth = 2; c.setLineDash([6, 6]); circ(c, u.x, u.y, u.r + 8); c.stroke(); c.setLineDash([]); }
  c.globalAlpha = 1;
  if (u.slowT > 0) { c.strokeStyle = 'rgba(143,208,255,.7)'; c.lineWidth = 2; c.setLineDash([3, 4]); circ(c, u.x, u.y, u.r + 5); c.stroke(); c.setLineDash([]); }
  if (settings.contrast && u.kind !== 'player') { c.strokeStyle = u.team === 0 ? COL.ally : u.team === 2 ? COL.rival : COL.enemy; c.lineWidth = 2.5 / Math.max(.6, cam.zoom); circ(c, u.x, u.y, u.r + 3); c.stroke(); }
  if (u.rank > 0) { const z = cam.zoom, s = 5 / Math.max(.6, z), bx = u.x + u.r * .8, by = u.y + u.r * .8; c.fillStyle = u.rank >= 4 ? '#f2c14e' : u.rank >= 3 ? '#e8dcc4' : '#c4a77a'; for (let k = 0; k < u.rank; k++) { c.beginPath(); c.moveTo(bx - s, by - k * s * .9); c.lineTo(bx, by - k * s * .9 - s * .7); c.lineTo(bx + s, by - k * s * .9); c.lineTo(bx + s, by - k * s * .9 + s * .35); c.lineTo(bx, by - k * s * .9 - s * .35); c.lineTo(bx - s, by - k * s * .9 + s * .35); c.closePath(); c.fill(); } }
}
function drawBeaconBody(c, u) {
  c.fillStyle = '#2b2f2c'; ngon(c, 6, 20, 0); c.fill(); c.strokeStyle = '#141615'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#4d534c'; ngon(c, 6, 13, Math.PI / 6); c.fill();
  c.save(); c.rotate(time * 2); c.fillStyle = '#c9c2b4'; c.fillRect(-2, -16, 4, 32); c.restore();
  const p = .5 + .5 * Math.sin(time * 6);
  if (u.kind === 'beacon2') { const cr = u.crew; c.fillStyle = cr ? cr.pal.acc : COL.rival; c.globalAlpha = .5 + p * .5; circ(c, 0, 0, 6); c.fill(); c.globalAlpha = 1; if (cr) { c.strokeStyle = cr.pal.acc; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 28, -Math.PI / 2, -Math.PI / 2 + TAU * cr.charge); c.stroke(); } return; }
  c.fillStyle = `rgba(242,193,78,${.5 + p * .5})`; circ(c, 0, 0, 5); c.fill();
  const chg = u.net ? u.netCharge : B.charge;
  if (u.net ? chg > 0 : (B.state === 'charging' || B.state === 'window')) { c.strokeStyle = u.npal ? u.npal.acc : '#f2c14e'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 28, -Math.PI / 2, -Math.PI / 2 + TAU * chg); c.stroke(); }
}
function drawZone(c) {
  if (!B || !B.unit) return; const u = B.unit;
  const win = B.state === 'window' || B.state === 'lift';
  c.save(); c.translate(u.x, u.y);
  c.fillStyle = win ? 'rgba(242,193,78,.1)' : 'rgba(242,193,78,.04)'; circ(c, 0, 0, ZONE_R); c.fill();
  c.strokeStyle = win ? '#f2c14e' : 'rgba(242,193,78,.45)'; c.lineWidth = win ? 4 : 2; c.setLineDash([18, 12]); c.lineDashOffset = -time * 30;
  circ(c, 0, 0, ZONE_R); c.stroke(); c.setLineDash([]);
  c.restore();
}
function drawBeaconLight(c) {
  if (!B || !B.unit) return; const u = B.unit;
  if (B.state === 'window' || B.state === 'lift') {
    const k = B.state === 'lift' ? 2 : 1, r = 120 * k + Math.sin(time * 8) * 10;
    const g = c.createRadialGradient(u.x, u.y, 0, u.x, u.y, r); g.addColorStop(0, 'rgba(255,250,230,.95)'); g.addColorStop(.4, 'rgba(242,193,78,.45)'); g.addColorStop(1, 'rgba(242,193,78,0)');
    c.fillStyle = g; circ(c, u.x, u.y, r); c.fill();
    c.save(); c.translate(u.x, u.y); c.rotate(time * .8); c.fillStyle = 'rgba(255,240,200,.12)';
    for (let k2 = 0; k2 < 6; k2++) { c.rotate(TAU / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(ZONE_R * 1.2, -18); c.lineTo(ZONE_R * 1.2, 18); c.closePath(); c.fill(); }
    c.restore();
  }
}
function drawPylon(c, p) {
  c.save(); c.translate(p.x, p.y);
  if (p.active) { c.strokeStyle = 'rgba(111,227,200,.18)'; c.lineWidth = 2; c.setLineDash([10, 14]); circ(c, 0, 0, 340); c.stroke(); c.setLineDash([]); }
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-16, -12, 38, 38);
  c.fillStyle = '#3a3f3b'; c.fillRect(-18, -18, 36, 36); c.strokeStyle = '#1b1e1c'; c.lineWidth = 2; c.strokeRect(-18, -18, 36, 36);
  c.strokeStyle = '#6a706a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-18, -18); c.lineTo(18, 18); c.moveTo(18, -18); c.lineTo(-18, 18); c.stroke();
  const col = p.active ? '111,227,200' : '242,193,78'; const pu = .5 + .5 * Math.sin(time * (p.active ? 3 : 5));
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, `rgba(${col},${.8 * pu + .2})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; circ(c, 0, 0, 40); c.fill();
  c.fillStyle = `rgb(${col})`; circ(c, 0, 0, 5); c.fill();
  c.restore();
}
function drawCrate(c, cr) {
  c.save(); c.translate(cr.x, cr.y);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-12, -9, 28, 24);
  const col = cr.type === 'militaire' ? '#4f5a3a' : cr.type === 'donnees' ? '#26313d' : '#6e5636';
  c.fillStyle = cr.open ? '#2a2724' : col; c.fillRect(-14, -12, 28, 24);
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.strokeRect(-14, -12, 28, 24);
  if (!cr.open) {
    if (cr.type === 'caisse') { c.strokeStyle = '#3d2f1e'; c.beginPath(); c.moveTo(-14, -12); c.lineTo(14, 12); c.stroke(); c.fillStyle = '#9a8058'; c.fillRect(-14, -2, 28, 4); }
    else if (cr.type === 'militaire') { c.fillStyle = '#d8b43a'; c.fillRect(-14, -12, 6, 24); c.fillRect(8, -12, 6, 24); c.fillStyle = '#1c1f16'; c.fillRect(-4, -4, 8, 8); }
    else { const p = .5 + .5 * Math.sin(time * 4 + cr.x); c.fillStyle = `rgba(127,169,255,${.5 + p * .5})`; c.fillRect(-9, -6, 18, 4); c.fillRect(-9, 2, 10, 3); }
  } else { c.fillStyle = '#16140f'; c.fillRect(-11, -9, 22, 18); }
  c.restore();
}
const SPR = {};
function decalSprite() { if (SPR.decal) return SPR.decal; const s = cvs(64, 64), c = s.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(12,10,8,.55)'); g.addColorStop(1, 'rgba(12,10,8,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return SPR.decal = s; }
function glowSprite(col) { const k = 'g' + col; if (SPR[k]) return SPR[k]; const s = cvs(48, 48), c = s.getContext('2d'); const g = c.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(0, 0, 48, 48); return SPR[k] = s; }
function drawItem(c, it) {
  const R = RES[it.res], b = Math.sin(time * 4 + it.x * .1) * 2, s = it.res === 'heart' ? 12 : 5 + Math.min(4, Math.sqrt(it.amt));
  c.save(); c.translate(it.x, it.y + b);
  c.drawImage(glowSprite(R.c), -s * 2.6, -s * 2.6, s * 5.2, s * 5.2);
  c.rotate(Math.PI / 4 + (it.res === 'heart' ? time : 0)); c.fillStyle = R.c; c.fillRect(-s / 2, -s / 2, s, s); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.strokeRect(-s / 2, -s / 2, s, s);
  c.restore();
}
function drawBullets(c, vx0, vy0, vx1, vy1, mortarPass) {
  c.lineCap = 'round';
  for (const b of bullets) {
    if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
    if (b.kind === 'mortar') {
      if (!mortarPass) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(b.x, b.y, 7, 4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,90,60,.35)'; c.lineWidth = 1.5; circ(c, b.tx, b.ty, b.splash * (1 - b.t / b.T * .5)); c.stroke(); }
      else { c.fillStyle = '#2a2420'; circ(c, b.x, b.y - b.h, 5 * b.sc * .6); c.fill(); c.fillStyle = b.col; circ(c, b.x, b.y - b.h, 2.5); c.fill(); }
      continue;
    }
    if (mortarPass) continue;
    if (b.kind === 'flame') { const k = b.dist / b.range; c.fillStyle = k < .4 ? `rgba(255,220,120,${.75 - k})` : `rgba(255,${(140 - k * 100) | 0},40,${.6 * (1 - k)})`; circ(c, b.x, b.y, 4 + k * 14 * b.sc * .6); c.fill(); continue; }
    if (b.kind === 'rocket') { c.save(); c.translate(b.x, b.y); c.rotate(Math.atan2(b.vy, b.vx)); c.fillStyle = '#d8d0c0'; c.fillRect(-6, -2, 10, 4); c.fillStyle = '#ffb020'; circ(c, -7, 0, 2.5 + Math.random() * 2); c.fill(); c.restore(); continue; }
    const sp = Math.hypot(b.vx, b.vy) || 1, len = Math.min(b.kind === 'laser' ? 34 : b.kind === 'shell' ? 12 : 18, b.dist);
    c.strokeStyle = b.col; c.lineWidth = b.kind === 'shell' ? 4 + b.sc : b.kind === 'laser' ? 2.5 : 2;
    c.beginPath(); c.moveTo(b.x - b.vx / sp * len, b.y - b.vy / sp * len); c.lineTo(b.x, b.y); c.stroke();
  }
}
function glowSpr(key, stops) { if (SPR[key]) return SPR[key]; const s = cvs(64, 64), c = s.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return SPR[key] = s; }
function drawParts(c, vx0, vy0, vx1, vy1) {
  const sm = glowSpr('smoke', [[0, 'rgba(80,76,70,.9)'], [.6, 'rgba(70,66,60,.45)'], [1, 'rgba(60,56,52,0)']]);
  const fh = glowSpr('fireh', [[0, 'rgba(255,245,200,1)'], [.35, 'rgba(255,190,80,.8)'], [1, 'rgba(255,120,30,0)']]);
  const fc = glowSpr('firec', [[0, 'rgba(255,170,60,.9)'], [.5, 'rgba(220,80,30,.5)'], [1, 'rgba(160,40,20,0)']]);
  const fl = glowSpr('flash', [[0, 'rgba(255,250,230,1)'], [.4, 'rgba(255,220,150,.6)'], [1, 'rgba(255,180,80,0)']]);
  const big = parts.length > 800, zz = cam.zoom, lowZ = zz < .4;
  for (const p of parts) {
    if (p.type !== 'ring' && (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1)) continue;
    if (lowZ && p.type !== 'ring' && p.type !== 'text' && (p.size || 2) * zz < .55) continue;
    const k = p.life / p.max;
    switch (p.type) {
      case 'spark': c.strokeStyle = p.col; c.globalAlpha = k; c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); c.stroke(); break;
      case 'smoke': { const s = Math.min(p.size > 60 ? 320 : 70, p.size * (1.5 - k * .5)); c.globalAlpha = .5 * k; c.drawImage(sm, p.x - s, p.y - s, s * 2, s * 2); break; }
      case 'debris': c.fillStyle = p.col; c.globalAlpha = Math.min(1, k * 2); c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); break;
      case 'shard': { c.save(); c.translate(p.x, p.y); c.rotate(p.rot + (1 - k) * 9); c.globalAlpha = Math.min(1, k * 3); c.fillStyle = p.col; const s = p.size; c.beginPath(); c.moveTo(-s, -s * .4); c.lineTo(s * .8, -s * .7); c.lineTo(s, s * .5); c.lineTo(-s * .5, s * .7); c.closePath(); c.fill(); c.restore(); break; }
      case 'dust': { const s = Math.min(80, p.size * (1.7 - k * .7)); c.globalAlpha = .5 * k; c.drawImage(FX.dustSpr(p.rgb), p.x - s, p.y - s, s * 2, s * 2); break; }
      case 'ring': c.strokeStyle = p.col; c.globalAlpha = k * (p.thin ? .7 : 1); c.lineWidth = p.thin ? 3 : 3 * k + 1; circ(c, p.x, p.y, p.size * (1 - k * (p.thin ? 1 : .7))); c.stroke(); break;
      case 'text': if (big) break; c.globalAlpha = Math.min(1, k * 2); c.fillStyle = p.col; c.font = `600 ${12 / Math.max(.6, cam.zoom) | 0}px ${FONT}`; c.textAlign = 'center'; c.fillText(p.text, p.x, p.y); break;
    }
  }
  c.globalCompositeOperation = 'lighter';
  for (const p of parts) {
    if (p.type !== 'fire' && p.type !== 'flash' && p.type !== 'ember') continue;
    if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
    const k = p.life / p.max;
    if (p.type === 'ember') { c.globalAlpha = k * (.6 + .4 * Math.sin(p.life * 30)); c.fillStyle = k > .5 ? '#ffd27a' : '#ff7a30'; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); continue; }
    if (p.type === 'fire') { const s = p.size * (.5 + k * .6) * 1.5; c.globalAlpha = k; c.drawImage(k > .55 ? fh : fc, p.x - s, p.y - s, s * 2, s * 2); }
    else { const s = p.size; c.globalAlpha = k; c.drawImage(fl, p.x - s, p.y - s, s * 2, s * 2); }
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// ---------- étiquettes du monde : posées en espace écran sans se chevaucher ----------
// noms, invites et compteurs s'empilent au lieu de se recouvrir ; faute de place, les moins importants s'effacent
const LABELS = [], LBL_BLOCK = [];
// zone déjà occupée par un repère dessiné directement (coordonnées du monde) : les étiquettes la contournent
function lblBlock(x, y, w, h) { const p = worldToScreen(x, y); LBL_BLOCK.push({ x: p.x, y: p.y, w: w * cam.zoom, h: h * cam.zoom }); }
function wLabel(x, y, txt, o) { LABELS.push({ x, y, txt, pri: o.pri || 0, size: o.size || 11, w8: o.w8 || 600, col: o.col || '#e8dcc4', bg: o.bg || null, al: o.al || 'center', a: o.a === undefined ? 1 : o.a }); }
// sur écran tactile, les étiquettes évitent aussi les boutons posés par-dessus le jeu (relevés deux fois par seconde)
let LBL_AVOID = [], LBL_AVOID_T = -1e9;
function lblAvoid() {
  const now = performance.now(); if (now - LBL_AVOID_T < 500) return LBL_AVOID;
  LBL_AVOID_T = now; LBL_AVOID = [];
  if (TOUCH.on) { const cr = cv.getBoundingClientRect(); for (const el of document.querySelectorAll('#touchUI button')) { const r = el.getBoundingClientRect(); if (r.width && r.height) LBL_AVOID.push({ x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height }); } }
  return LBL_AVOID;
}
function drawLabels(c) {
  if (!LABELS.length) { LBL_BLOCK.length = 0; return; }
  const ui = uiScale(), L = LABELS.slice().sort((a, b) => b.pri - a.pri), placed = lblAvoid().concat(LBL_BLOCK, hudCards.map(h => ({ x: h.x * ui, y: h.y * ui, w: h.w * ui, h: h.h * ui }))); LABELS.length = 0; LBL_BLOCK.length = 0;
  c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.textBaseline = 'alphabetic';
  for (const l of L) {
    const p = worldToScreen(l.x, l.y); if (p.x < -200 || p.x > VW + 200 || p.y < -60 || p.y > VH + 60) continue;
    c.font = `${l.w8} ${l.size}px ${FONT}`;
    const pad = l.bg ? 7 : 2, w = c.measureText(l.txt).width + pad * 2, h = l.size + (l.bg ? 9 : 3), x0 = l.al === 'left' ? p.x - pad : p.x - w / 2;
    let y = p.y, ok = false;
    for (const k of [0, -1, 1, -2, 2, -3]) {
      const yy = p.y + k * (h + 2), r = { x: x0, y: yy - l.size - (l.bg ? 4 : 1), w, h };
      if (!placed.some(q => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h)) { placed.push(r); ok = true; y = yy; break; }
    }
    if (!ok) { if (l.pri < 4) continue; y = p.y; }
    c.globalAlpha = l.a;
    if (l.bg) { c.fillStyle = l.bg; c.fillRect(x0, y - l.size - 4, w, h); }
    c.fillStyle = l.col; c.textAlign = l.al; c.fillText(l.txt, l.al === 'left' ? p.x : p.x, y);
  }
  c.restore();
}
function drawOverlays(c, vis) {
  const z = cam.zoom, fs = 11 / z;
  for (const u of vis) {
    if (u.kind === 'player') continue;
    if (u.kind === 'building' && (!attack || u.hp >= u.maxhp)) continue;
    const show = (u.hp < u.maxhp || u.sel || (u.kind === 'robot' && tactical) || u.boss || u.elite || u.giant || (u.kind === 'npc' && !u.invul)) && (u.r * z > 2.5 || u.sel || u.boss || u.giant || u.kind === 'npc');
    if (u.fabC) drawFabOverlay(c, u, z);
    if (u.kind === 'robot' && (tactical || u.sel) && u.queue && u.queue.length && u.order && u.order.type === 'move') { c.strokeStyle = u.patrol ? 'rgba(242,193,78,.45)' : 'rgba(111,227,200,.25)'; c.lineWidth = 1.5 / z; c.setLineDash([4 / z, 8 / z]); c.beginPath(); c.moveTo(u.order.x, u.order.y); for (const p of u.queue) c.lineTo(p.x, p.y); c.stroke(); c.setLineDash([]); for (const p of u.queue) { c.fillStyle = u.patrol ? '#f2c14e' : '#6fe3c8'; circ(c, p.x, p.y, 3 / z); c.fill(); } }
    if (u.sel) { c.strokeStyle = '#6fe3c8'; c.lineWidth = 2 / z; circ(c, u.x, u.y, u.r + 6); c.stroke(); }
    if (u.kind === 'robot' && (tactical || u.sel) && u.order && (u.order.type === 'move' || u.order.type === 'hold')) { c.strokeStyle = 'rgba(111,227,200,.35)'; c.lineWidth = 1.5 / z; c.setLineDash([6 / z, 6 / z]); c.beginPath(); c.moveTo(u.x, u.y); c.lineTo(u.order.x, u.order.y); c.stroke(); c.setLineDash([]); }
    if (show && !u.boss) {
      const w = Math.max(26, u.r * 1.6), y = u.y - u.r - 10 - (u.fly ? 6 : 0);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(u.x - w / 2 - 1, y - 1, w + 2, 5 / Math.min(1, z) + 1);
      c.fillStyle = u.team === 0 ? '#6fe3c8' : '#ff4d5e'; c.fillRect(u.x - w / 2, y, w * clamp(u.hp / u.maxhp, 0, 1), 4 / Math.min(1, z));
      if (u.kind === 'robot' && (tactical || u.sel)) wLabel(u.x, y - 4 / z, u.name + ' · ' + BRAINS[u.brain].ic + (u.group ? ' · ' + u.group : '') + (u.abil && u.abil.length ? ' · ' + u.abil.map(a => a.cd > 0 ? Math.ceil(a.cd) : '✓').join(' ') : ''), { pri: u.sel ? 2 : 1 });
    }
  }
  for (const p of pings) { const k = p.t / .7; c.strokeStyle = p.col; c.globalAlpha = k; c.lineWidth = 2 / z; circ(c, p.x, p.y, p.r + (1 - k) * 30); c.stroke(); c.globalAlpha = 1; }
  if (MIS.length && state === 'raid') misWorld(c, z);
  // invite d'interaction
  if (eTarget && !mapOpen) {
    const o = eTarget.o, K = '[' + keyLabel('interact') + '] ', txt = K + (eTarget.kind === 'mis' ? eTarget.label : eTarget.kind === 'crate' ? (o.type === 'militaire' ? TL('Forcer le coffre militaire') : o.type === 'donnees' ? TL('Extraire l\'archive') : TL('Ouvrir la caisse')) : TL('Activer le pylône relais'));
    wLabel(o.x, o.y - 36 / z, txt, { pri: 6, size: 13, bg: 'rgba(20,24,26,.85)' });
    if (eProg > 0) { c.strokeStyle = '#f2c14e'; c.lineWidth = 4 / z; c.beginPath(); c.arc(o.x, o.y, 26, -Math.PI / 2, -Math.PI / 2 + TAU * eProg / eTarget.dur); c.stroke(); }
  }
  if (!player.inside && !player.hidden) {
    let near = null; for (const r of fleet) if (!r.dead && d2(r.x, r.y, player.x, player.y) < (r.r + 70) ** 2) { near = r; break; }
    if (near && !eTarget) wLabel(near.x, near.y + near.r + 22 / z, TL('[{k}] Monter à bord de {name}', { k: keyLabel('pilot'), name: near.name }), { pri: 5, size: 12, col: 'rgba(232,220,196,.85)' });
  }
  if (tactical && mouse.drag) {
    const a = screenToWorld(mouse.drag.x0, mouse.drag.y0), b = screenToWorld(mouse.drag.x1, mouse.drag.y1);
    c.strokeStyle = '#6fe3c8'; c.fillStyle = 'rgba(111,227,200,.08)'; c.lineWidth = 1.5 / z;
    c.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x), Math.abs(a.y - b.y)); c.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }
}
const TACF = { t0: 0, last: -1e9 };
function drawTacticalFrame(c) {
  c.strokeStyle = 'rgba(111,227,200,.55)'; c.lineWidth = 3; c.strokeRect(6, 6, VW - 12, VH - 12);
  c.fillStyle = 'rgba(111,227,200,.06)'; c.fillRect(0, 0, VW, VH);
  // le mode d'emploi s'affiche à l'entrée en mode tactique, puis s'efface pour ne pas couvrir les étiquettes
  const now = performance.now(); if (now - TACF.last > 400) TACF.t0 = now; TACF.last = now;
  const a = clamp(1 - (now - TACF.t0 - (TOUCH.on ? 2500 : 4000)) / 700, 0, 1); if (a <= 0) return;
  c.globalAlpha = a; c.fillStyle = COL.ally; c.font = `700 15px ${FONT}`; c.textAlign = 'center';
  c.fillText(TOUCH.on ? TL('Mode tactique') + ' · ' + TL('temps ralenti') + ' · ' + TL('touchez ou encadrez des robots, puis l\'endroit où les envoyer') : TL('Mode tactique') + ' · ' + TL('temps ralenti') + ' · ' + TL('cliquer-glisser pour sélectionner') + ' · ' + TL('clic droit pour ordonner'), VW / 2, VH - 150);
  c.globalAlpha = 1;
}

// ================= HUD =================
function fitText(c, t, w) { if (c.measureText(t).width <= w) return t; while (t.length > 1 && c.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
function panel(c, x, y, w, h) { c.fillStyle = 'rgba(20,24,26,.78)'; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(232,220,196,.12)'; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1); }
function bar(c, x, y, w, h, f, col, bg = 'rgba(255,255,255,.08)') { c.fillStyle = bg; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, w * clamp(f, 0, 1), h); }
// marqueurs de touche / d'élimination et flèches indiquant d'où viennent les dégâts
function drawCombatFeedback(c) {
  if (state !== 'raid' && state !== 'assault' && state !== 'base') return;
  if (hitMarkT > 0 || killMarkT > 0) {
    const h = TOUCH.on ? worldToScreen(mouse.wx, mouse.wy) : { x: mouse.x, y: mouse.y };
    const kill = killMarkT > 0, k = kill ? killMarkT / .4 : hitMarkT / .14, r0 = kill ? 7 + (1 - k) * 4 : 6, r1 = r0 + (kill ? 8 : 6);
    c.save(); c.globalAlpha = clamp(k * 1.4, 0, 1); c.lineCap = 'round';
    for (const [lw, col] of [[4.5, 'rgba(0,0,0,.6)'], [2, kill ? '#ff5e6a' : '#ffffff']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; c.moveTo(h.x + Math.cos(a) * r0, h.y + Math.sin(a) * r0); c.lineTo(h.x + Math.cos(a) * r1, h.y + Math.sin(a) * r1); } c.stroke(); }
    c.restore();
  }
  if (dmgDirs.length && player && !(paused && inGame())) {
    const F = player.inside || player, P = worldToScreen(F.x, F.y), R = Math.max(70, F.r * cam.zoom + 52);
    c.save();
    for (const d of dmgDirs) {
      c.globalAlpha = clamp(d.t, 0, 1) * .85; c.fillStyle = '#ff4d5e'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.5;
      c.save(); c.translate(P.x + Math.cos(d.a) * R, P.y + Math.sin(d.a) * R); c.rotate(d.a);
      c.beginPath(); c.moveTo(14, 0); c.lineTo(-4, -13); c.lineTo(0, 0); c.lineTo(-4, 13); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    c.restore();
  }
}
function drawHUD(c) {
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const small = VW < 700;
  // --- haut gauche : alerte & objectif
  if (state === 'assault' || (state === 'result' && AS && AS.over && W && W.isBase)) drawAssaultPanel(c); else {
  panel(c, 14, 14, 270, 62);
  c.fillStyle = '#a59c88'; c.font = `500 12px ${FONT}`; c.fillText(TL('Alerte'), 24, 32);
  for (let i = 0; i < 5; i++) { c.fillStyle = i < alertLv ? (alertLv >= 4 ? '#ff4d5e' : '#f2c14e') : 'rgba(255,255,255,.1)'; c.fillRect(70 + i * 22, 23, 18, 10); }
  c.fillStyle = '#e8dcc4'; c.font = `600 13px ${FONT}`; c.textAlign = 'right'; c.fillText(mmss(raidTime) + ' · ' + diff.n, 274, 32); c.textAlign = 'left';
  c.font = `500 12.5px ${FONT}`; c.fillStyle = '#e8dcc4';
  let obj = '';
  if (B.state === 'carried') obj = TL('Fouillez la zone puis posez la balise [{k}]', { k: keyLabel('beacon') });
  else if (B.state === 'charging') obj = TL('Défendez la balise pendant l\'ancrage');
  else if (B.state === 'window') obj = TL('Entrez dans le cercle d\'extraction !');
  else if (B.state === 'broken') obj = TL('Balise détruite') + ' · ' + TL('réimpression {t} s', { t: Math.ceil(B.cd) });
  else obj = TL('Extraction…');
  c.fillText(obj, 24, 56); c.fillStyle = '#a59c88'; c.font = `500 11.5px ${FONT}`;
  c.fillText(TL('Charge : {w} kg', { w: fleetWeight().toFixed(1) }), 24, 70);
  c.textAlign = 'right'; c.fillStyle = ENV.night > .5 ? '#9fb4e0' : ENV.dusk > .4 ? '#f2b06e' : '#a59c88'; c.fillText(ENV.label(), 274, 70); c.textAlign = 'left';
  }
  // --- contrats
  const TY = TOUCH.on ? 52 : 0;
  let my = 98 + TY;
  if (raidContracts.length) {
    c.font = `600 13px ${FONT}`; const lines = raidContracts.map(cn => ({ t: contractLine(cn), ok: cn.kind !== 'speed' && cn.kind !== 'noloss' && contractProgress(cn)[0] >= contractProgress(cn)[1], bad: isMission(cn) && misFailed(cn) }));
    const w = Math.max(270, ...lines.map(l => c.measureText(l.t).width + 40)); panel(c, 14, 82 + TY, Math.min(w, VW * .45), 12 + lines.length * 20);
    lines.forEach((l, i) => { c.fillStyle = l.bad ? '#ec6b74' : l.ok ? COL.ally : '#e8dcc4'; c.fillText((l.bad ? '✗ ' : l.ok ? '✓ ' : '• ') + l.t, 24, 99 + TY + i * 20); });
    my = 98 + TY + 18 + lines.length * 20;
  }
  // --- messages
  if (TOUCH.on) { const S2 = Math.round(clamp(VW * .15, 100, 160)), x0 = 300, mw = VW - x0 - S2 - 40; let yy = Math.max(30, TUT.on ? TUT.msgY : 0); for (const m of msgs.slice(-3)) { const a = Math.min(1, m.t / .6); c.globalAlpha = a; c.font = `500 13px ${FONT}`; const t = fitText(c, m.text, mw - 16); const tw = c.measureText(t).width; c.fillStyle = 'rgba(14,17,18,.7)'; c.fillRect(x0, yy - 14, tw + 16, 20); c.fillStyle = m.col; c.textAlign = 'left'; c.fillText(t, x0 + 8, yy); yy += 23; c.globalAlpha = 1; } }
  else
  for (const m of msgs) {
    const a = Math.min(1, m.t / .6); c.globalAlpha = a; c.font = `500 13px ${FONT}`;
    const tw = c.measureText(m.text).width; c.fillStyle = 'rgba(14,17,18,.7)'; c.fillRect(14, my - 14, tw + 16, 20);
    c.fillStyle = m.col; c.fillText(m.text, 22, my); my += 23; c.globalAlpha = 1;
  }
  // --- balise
  if (B.state === 'charging' || B.state === 'window') {
    const w = Math.min(420, VW - 620 > 200 ? 420 : VW * .4), x = VW / 2 - w / 2, y = 16;
    panel(c, x, y, w, 44);
    const win = B.state === 'window';
    c.fillStyle = win ? '#f2c14e' : '#e8dcc4'; c.font = `700 13px ${FONT}`; c.textAlign = 'left';
    const mult = B.unit && nearPylon(B.unit.x, B.unit.y);
    c.fillText(win ? TL('Fenêtre d\'extraction : {t} s', { t: Math.ceil(B.windowT) }) : TL('Ancrage {p} %', { p: Math.floor(B.charge * 100) }) + (mult ? '  ·  ' + TL('relais ×2,5') : ''), x + 10, y + 17);
    c.textAlign = 'right'; c.fillStyle = '#a59c88'; c.font = `500 12px ${FONT}`;
    if (B.unit) c.fillText(TL('Balise {hp} / {max}', { hp: Math.ceil(B.unit.hp), max: Math.ceil(B.unit.maxhp) }), x + w - 10, y + 17);
    c.textAlign = 'left';
    bar(c, x + 10, y + 26, w - 20, 8, win ? B.windowT / 16 : B.charge, win ? '#f2c14e' : '#c99a2e');
    if (B.unit) bar(c, x + 10, y + 36, w - 20, 3, B.unit.hp / B.unit.maxhp, '#6fe3c8');
  }
  // --- boss
  const boss = units.find(u => (u.boss || u.giant) && !u.dead && u.active && d2(u.x, u.y, focus().x, focus().y) < (1500 + u.r) ** 2);
  if (boss) {
    const w = Math.min(520, VW * .45), x = VW / 2 - w / 2, y = (B.state === 'charging' || B.state === 'window') ? 68 : 16;
    panel(c, x, y, w, 34); c.fillStyle = '#ff6b74'; c.font = `700 13px ${FONT}`; c.textAlign = 'left';
    c.fillText(ENEMIES[boss.etype].n + (boss.enraged ? ' · ' + TL('surchauffe') : ''), x + 10, y + 15);
    c.textAlign = 'right'; c.fillStyle = '#a59c88'; c.font = `500 12px ${FONT}`; c.fillText(Math.ceil(boss.hp) + ' / ' + Math.ceil(boss.maxhp), x + w - 10, y + 15); c.textAlign = 'left';
    bar(c, x + 10, y + 21, w - 20, 7, boss.hp / boss.maxhp, '#d4495a');
  }
  // --- minicarte
  const S = Math.round(TOUCH.on ? clamp(VW * .15, 100, 160) : clamp(VW * .17, 130, 210));
  drawMinimap(c, VW - S - 14, 14, S, 150);
  if (LIVE.game) LIVE.drawParty(c, VW - S - 14, 14 + S + 8, S);
  else { const tw = Math.max(S, 220); expTracker(c, VW - tw - 14, 14 + S + 8, tw, false); }
  // --- bas gauche : pilote (en haut à gauche, compact, sur écran tactile)
  const px = 14, py = VH - 96, F = focus();
  if (TOUCH.on) {
    const u = player.inside || player; panel(c, 14, 82, 270, 44);
    c.fillStyle = player.inside ? '#ff8a3d' : '#e8dcc4'; c.font = `700 12px ${FONT}`; c.textAlign = 'left';
    c.fillText(player.inside ? player.inside.name : TL('Pilote'), 22, 98);
    bar(c, 90, 90, 186, 8, u.hp / u.maxhp, u.hp < u.maxhp * .3 ? COL.enemy : player.inside ? COL.ally : '#ff8a3d');
    c.font = `500 11.5px ${FONT}`; c.fillStyle = '#a59c88';
    c.fillText(player.inside ? TL('Soute {w} / {max} kg', { w: u.cargoW.toFixed(1), max: u.cargoMax }) : (player.reloadT > 0 ? TL('Rechargement…') : player.pw.n + ' ' + player.ammo + '/' + player.pw.mag) + ' · ' + TL('sac {w}/{max} kg', { w: player.cargoW.toFixed(0), max: player.cargoMax }), 22, 117);
    if (player.inside) drawPilotWeapons(c, 14, 130, 270);
  } else {
  if (player.inside) drawPilotWeapons(c, px, py - 6, 280); else hudWRows = [];
  panel(c, px, py, 280, 82);
  if (player.inside) {
    const u = player.inside; c.fillStyle = '#ff8a3d'; c.font = `700 14px ${FONT}`; c.fillText(TL('Aux commandes : {name}', { name: u.name }), px + 10, py + 20);
    bar(c, px + 10, py + 28, 260, 9, u.hp / u.maxhp, '#6fe3c8');
    c.fillStyle = '#e8dcc4'; c.font = `500 12px ${FONT}`; c.fillText(TL('{hp} / {max} PV', { hp: Math.ceil(u.hp), max: u.maxhp }) + ' · ' + CHASSIS[u.chassis].n, px + 10, py + 53);
    c.fillStyle = '#a59c88'; c.fillText(TL('Soute {w} / {max} kg', { w: u.cargoW.toFixed(1), max: u.cargoMax }) + ' · ' + TL('[{k}] sortir', { k: keyLabel('pilot') }), px + 10, py + 70);
  } else {
    c.fillStyle = '#e8dcc4'; c.font = `700 14px ${FONT}`; c.fillText(TL('Pilote'), px + 10, py + 20);
    c.textAlign = 'right'; c.font = `500 12px ${FONT}`; c.fillStyle = '#a59c88'; c.fillText(TL('{hp} / {max} PV', { hp: Math.ceil(player.hp), max: player.maxhp }), px + 270, py + 20); c.textAlign = 'left';
    bar(c, px + 10, py + 27, 260, 9, player.hp / player.maxhp, player.hp < player.maxhp * .3 ? '#ff4d5e' : '#ff8a3d');
    const w = player.pw; c.fillStyle = '#e8dcc4'; c.font = `600 12.5px ${FONT}`;
    c.fillText(w.n + ' · ' + (player.reloadT > 0 ? TL('rechargement…') : player.ammo + ' / ' + w.mag), px + 10, py + 54);
    c.textAlign = 'right'; c.fillStyle = player.dashCd > 0 ? '#6f7a76' : '#6fe3c8'; c.fillText(TL('Esquive'), px + 270, py + 54); c.textAlign = 'left';
    c.fillStyle = '#a59c88'; c.font = `500 12px ${FONT}`; c.fillText(TL('Sac'), px + 10, py + 71);
    bar(c, px + 40, py + 63, 160, 8, player.cargoW / player.cargoMax, player.cargoW >= player.cargoMax - .1 ? '#f2c14e' : '#c4a77a');
    c.fillText(TL('{w} / {max} kg', { w: player.cargoW.toFixed(1), max: player.cargoMax }), px + 208, py + 71);
  }
  }
  // --- bas centre : flotte
  if (TOUCH.on) drawFleetCards(c, VW * .3, VH - 58, VW * .4, true); else { drawFleetCards(c, 304, VH - 62, VW - 318, true); drawFormationTag(c); }
  // --- bas droite : rappels de commandes
  const lastCard = hudCards[hudCards.length - 1];
  if (!TOUCH.on && !small && VW > 1000 && (!lastCard || lastCard.x + lastCard.w < VW - 330)) {
    const K = keyLabel, lines = [TL('{k} tactique', { k: K('tactical') }) + ' · ' + TL('{k} piloter', { k: K('pilot') }) + ' · ' + TL('{k} balise', { k: K('beacon') }), TL('{k} suivre', { k: K('follow') }) + ' · ' + TL('{k} tenir', { k: K('hold') }) + ' · ' + TL('{k} défendre la balise', { k: K('defend') }) + ' · ' + TL('{k} autonomie', { k: K('auto') }), TL('{k} carte', { k: K('map') }) + ' · ' + TL('{k} aide', { k: K('help') }) + ' · ' + TL('Échap pause')];
    c.font = `500 11.5px ${FONT}`; c.textAlign = 'right'; c.fillStyle = 'rgba(232,220,196,.55)';
    lines.forEach((l, i) => c.fillText(l, VW - 16, VH - 52 + i * 16)); c.textAlign = 'left';
  }
  // indicateurs hors écran
  const edge = (wx, wy, col, label) => {
    const s = worldToScreen(wx, wy); if (s.x > 0 && s.x < VW && s.y > 0 && s.y < VH) return;
    const cx = VW / 2, cy = VH / 2, a = Math.atan2(s.y - cy, s.x - cx);
    const m = 40, ex = clamp(cx + Math.cos(a) * VW, m, VW - m), ey = clamp(cy + Math.sin(a) * VH, m + 70, VH - m - 70);
    c.save(); c.translate(ex, ey); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(12, 0); c.lineTo(-6, -8); c.lineTo(-6, 8); c.closePath(); c.fill(); c.restore();
    if (label) { c.fillStyle = col; c.font = `600 11px ${FONT}`; c.textAlign = 'center'; c.fillText(label, ex - Math.cos(a) * 22, ey - Math.sin(a) * 22 + 4); c.textAlign = 'left'; }
  };
  if (B.unit) edge(B.unit.x, B.unit.y, '#f2c14e', TL('{d} m', { d: Math.round(Math.hypot(B.unit.x - F.x, B.unit.y - F.y) / 10) }));
  for (const cr of crews) if (cr.beacon && !cr.beacon.dead && !cr.out) edge(cr.beacon.x, cr.beacon.y, COL.rival, TL('rival {d} m', { d: Math.round(Math.hypot(cr.beacon.x - F.x, cr.beacon.y - F.y) / 10) }));
  if (MIS.length) for (const g of misGoals()) edge(g.x, g.y, MISCOL, g.l + ' ' + TL('{d} m', { d: Math.round(Math.hypot(g.x - F.x, g.y - F.y) / 10) }));
  for (const r of fleet) if (!r.dead && !r.piloted) edge(r.x, r.y, 'rgba(111,227,200,.7)');
}
function blit(c, img, sx, sy, sw, sh, dx, dy, dw, dh, iw, ih) {
  const kx = dw / sw, ky = dh / sh;
  let x0 = sx, y0 = sy, x1 = sx + sw, y1 = sy + sh;
  if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0; if (x1 > iw) x1 = iw; if (y1 > ih) y1 = ih;
  if (x1 <= x0 || y1 <= y0) return;
  c.drawImage(img, x0, y0, x1 - x0, y1 - y0, dx + (x0 - sx) * kx, dy + (y0 - sy) * ky, (x1 - x0) * kx, (y1 - y0) * ky);
}
function drawMinimap(c, x, y, S, tw) {
  const F = focus();
  tw = Math.min(WT, tw * Math.max(1, Math.pow(.55 / Math.max(.05, cam.zoom), .8))); // de loin, la minicarte couvre plus large
  c.save(); c.fillStyle = '#0c0f10'; c.fillRect(x, y, S, S); c.beginPath(); c.rect(x, y, S, S); c.clip();
  const sx0 = F.x / TILE - tw / 2, sy0 = F.y / TILE - tw / 2, k = S / tw;
  c.imageSmoothingEnabled = false; blit(c, miniCv, sx0, sy0, tw, tw, x, y, S, S, WT, WT);
  c.imageSmoothingEnabled = true; blit(c, fogCv, sx0 / FG, sy0 / FG, tw / FG, tw / FG, x, y, S, S, FW, FW);
  const M = (wx, wy) => [x + (wx / TILE - sx0) * k, y + (wy / TILE - sy0) * k];
  for (const p of W.pylons) { const [mx, my] = M(p.x, p.y); if (!explored[((p.y / TILE / FG) | 0) * FW + ((p.x / TILE / FG) | 0)] && !p.active) continue; c.fillStyle = p.active ? '#6fe3c8' : '#f2c14e'; c.fillRect(mx - 3, my - 3, 6, 6); }
  for (const e of units) { if (e.kind !== 'enemy' || e.dead || !e.active) continue; if (!e.giant && d2(e.x, e.y, F.x, F.y) > (1100 * tw / 150) ** 2) continue; const [mx, my] = M(e.x, e.y); c.fillStyle = e.boss || e.giant ? '#ff2a3a' : COL.enemy2; const s = e.giant ? Math.max(6, e.r * k / TILE * 2) : e.boss ? 6 : e.elite ? 4 : 2; c.fillRect(mx - s / 2, my - s / 2, s, s); }
  for (const e of units) { if (e.dead) continue; if (e.kind === 'rival' && (d2(e.x, e.y, F.x, F.y) < 1100 * 1100 || (radarLv >= 3 && e.role === 'leader'))) { const [mx, my] = M(e.x, e.y); c.fillStyle = COL.rival; const s = e.role === 'leader' ? 5 : 3; c.fillRect(mx - s / 2, my - s / 2, s, s); } if (e.kind === 'beacon2') { const [mx, my] = M(e.x, e.y); c.strokeStyle = COL.rival; c.lineWidth = 2; circ(c, mx, my, 6); c.stroke(); } }
  for (const r of fleet) { if (r.dead) continue; const [mx, my] = M(r.x, r.y); c.fillStyle = '#6fe3c8'; const s = Math.max(3, r.r * k / TILE * 2); c.fillRect(mx - s / 2, my - s / 2, s, s); }
  if (LIVE.game) LIVE.drawMini(c, M);
  if (MIS.length) misMap(c, M, k / TILE, false);
  if (B.unit) { const [mx, my] = M(B.unit.x, B.unit.y); c.strokeStyle = '#f2c14e'; c.lineWidth = 1.5; circ(c, mx, my, ZONE_R / TILE * k); c.stroke(); c.fillStyle = '#f2c14e'; circ(c, mx, my, 3); c.fill(); }
  if (!W.isBase) { const [cx, cy] = M(WPX / 2, WPX / 2); c.strokeStyle = 'rgba(255,42,58,.6)'; c.lineWidth = 1; circ(c, cx, cy, 27 * k); c.stroke(); }
  const [px, py] = M(F.x, F.y); c.save(); c.translate(px, py); c.rotate(player.inside ? player.inside.ang : player.ang); c.fillStyle = '#ff8a3d'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-4, 4); c.closePath(); c.fill(); c.restore();
  c.restore();
  c.strokeStyle = 'rgba(232,220,196,.25)'; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, S - 1, S - 1);
}
let bigMapRect = null;
function drawBigMap(c) {
  const S = Math.min(VW, VH) * .86, x = (VW - S) / 2, y = (VH - S) / 2;
  bigMapRect = { x, y, S };
  c.fillStyle = 'rgba(8,10,11,.82)'; c.fillRect(0, 0, VW, VH);
  c.imageSmoothingEnabled = false; c.drawImage(miniCv, x, y, S, S);
  c.imageSmoothingEnabled = true; c.drawImage(fogCv, x, y, S, S);
  const k = S / WPX, M = (wx, wy) => [x + wx * k, y + wy * k];
  c.strokeStyle = 'rgba(232,220,196,.3)'; c.strokeRect(x, y, S, S);
  for (const p of W.pylons) { if (!explored[((p.y / TILE / FG) | 0) * FW + ((p.x / TILE / FG) | 0)] && !p.active) continue; const [mx, my] = M(p.x, p.y); c.fillStyle = p.active ? '#6fe3c8' : '#f2c14e'; c.fillRect(mx - 4, my - 4, 8, 8); if (p.active) { c.strokeStyle = 'rgba(111,227,200,.4)'; circ(c, mx, my, 340 * k); c.stroke(); } }
  for (const b of W.bases) { const i = ((b.cy / FG) | 0) * FW + ((b.cx / FG) | 0); if (!explored[i]) continue; const [mx, my] = M(b.cx * TILE, b.cy * TILE); c.strokeStyle = '#d8b43a'; c.lineWidth = 1.5; c.strokeRect(mx - 7, my - 7, 14, 14); }
  const [cx, cy] = M(WPX / 2, WPX / 2); c.strokeStyle = 'rgba(255,42,58,.75)'; c.lineWidth = 2; circ(c, cx, cy, 27 * TILE * k); c.stroke();
  c.fillStyle = '#ff6b74'; c.font = `600 12px ${FONT}`; c.textAlign = 'center'; c.fillText(TL('Cratère du Souverain'), cx, cy - 27 * TILE * k - 6);
  for (const r of fleet) { if (r.dead) continue; const [mx, my] = M(r.x, r.y); c.fillStyle = '#6fe3c8'; c.fillRect(mx - 2.5, my - 2.5, 5, 5); }
  if (LIVE.game) LIVE.drawMini(c, M);
  if (MIS.length) misMap(c, M, k, true);
  if (B.unit) { const [mx, my] = M(B.unit.x, B.unit.y); c.fillStyle = '#f2c14e'; circ(c, mx, my, 5); c.fill(); }
  for (const cr of crews) { if (cr.beacon && !cr.beacon.dead && !cr.out) { const [mx, my] = M(cr.beacon.x, cr.beacon.y); c.strokeStyle = COL.rival; c.lineWidth = 2; circ(c, mx, my, 7); c.stroke(); c.fillStyle = COL.rival; c.font = `600 11px ${FONT}`; c.textAlign = 'center'; c.fillText(cr.name, mx, my - 10); } if (radarLv >= 3 && !cr.dead && !cr.out) { const [mx, my] = M(cr.leader.x, cr.leader.y); c.fillStyle = COL.rival; c.fillRect(mx - 3, my - 3, 6, 6); } }
  const F = focus(); const [px, py] = M(F.x, F.y); c.fillStyle = '#ff8a3d'; circ(c, px, py, 5); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#e8dcc4'; c.font = `600 13px ${FONT}`; c.textAlign = 'left';
  c.fillText(TL('Carte') + ' · ' + TL('clic droit pour envoyer la flotte') + ' · ' + TL('M pour fermer'), x, y - 10);
  const leg = [['#ff8a3d', TL('Vous')], ['#6fe3c8', TL('Flotte / relais actif')], ['#f2c14e', TL('Pylône relais / balise')], ['#d8b43a', TL('Base militaire')], ['#c381ff', TL('Cristaux')], ['#5f8a2a', TL('Marais toxique')]]; if (MIS.length) leg.push([MISCOL, TL('Opération')]);
  c.font = `500 11.5px ${FONT}`; let lx = x, ly = y + S + 10;
  for (const [col, t] of leg) { const tw = c.measureText(t).width + 30; if (lx + tw > x + S) { lx = x; ly += 16; } c.fillStyle = col; c.fillRect(lx, ly, 10, 10); c.fillStyle = '#e8dcc4'; c.fillText(t, lx + 14, ly + 9); lx += tw; }
}

// ================= CARTES DE FLOTTE (regroupées pour les grandes armées) =================
function drawFleetCards(c, x0, y, maxW, center) {
  hudCards = []; if (!fleet.length) return;
  const small = VW < 700, ch = 48, gap = 4;
  let cards; const fitN = Math.floor((maxW + gap) / ((small ? 52 : 74) + gap));
  const realF = fleet.filter(u => !u.temp), tmp = fleet.filter(u => u.temp), nC = realF.length + (tmp.length ? 1 : 0);
  if (nC <= 12 && nC <= fitN) cards = realF.map(u => ({ units: [u], u }));
  else {
    const g = {}; for (const u of realF) { const k = u.chassis; (g[k] = g[k] || []).push(u); }
    cards = CHASSIS_KEYS.filter(k => g[k]).map(k => ({ units: g[k], type: k }));
  }
  // trop de modèles différents pour la place : une carte par rang
  if (cards.length + (tmp.length ? 1 : 0) > Math.floor((maxW + gap) / (40 + gap))) { const g = {}; for (const u of realF) { const k = CHASSIS[u.chassis].tier; (g[k] = g[k] || []).push(u); } cards = Object.keys(g).sort((a, b) => a - b).map(k => ({ units: g[k], tierK: +k })); }
  if (tmp.length) cards.push({ units: tmp, type: '__fab' });
  const cw = Math.max(40, Math.min(small ? 52 : 74, Math.floor((maxW + gap) / cards.length) - gap)), tot = cards.length * (cw + gap) - gap;
  let x = center ? Math.max(x0, VW / 2 - tot / 2) : x0; if (x + tot > x0 + maxW) x = Math.max(x0, x0 + maxW - tot);
  for (const cd of cards) {
    const alive = cd.units.filter(u => !u.dead), anySel = alive.some(u => u.sel), pil = alive.some(u => u.piloted);
    const hp = alive.reduce((s, u) => s + u.hp / u.maxhp, 0) / Math.max(1, alive.length);
    const dead = !alive.length;
    c.fillStyle = dead ? 'rgba(40,20,22,.75)' : anySel ? 'rgba(111,227,200,.22)' : 'rgba(20,24,26,.8)'; c.fillRect(x, y, cw, ch);
    c.strokeStyle = pil ? '#ff8a3d' : anySel ? '#6fe3c8' : 'rgba(232,220,196,.12)'; c.lineWidth = anySel || pil ? 2 : 1; c.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
    c.textAlign = 'left'; c.font = `700 12px ${FONT}`; c.fillStyle = dead ? '#ec6b74' : '#e8dcc4';
    if (cd.u) {
      const u = cd.u;
      c.fillText(fitText(c, u.name, cw - (u.group ? 18 : 10)), x + 5, y + 15);
      c.font = `600 11px ${FONT}`; c.fillStyle = '#a59c88';
      c.fillText(fitText(c, u.dead ? TL('détruit') : u.piloted ? TL('piloté') : (u.order ? ({ move: TL('en route'), hold: TL('en poste'), attack: TL('attaque'), follow: TL('suit'), beacon: TL('balise') }[u.order.type] || '') : state === 'base' ? (attack && attack.phase === 'fight' ? TL('défend') : TL('au repos')) : BRAINS[u.brain].n), cw - 10), x + 5, y + 29);
      if (u.group) { c.textAlign = 'right'; c.fillStyle = '#f2c14e'; c.fillText(u.group, x + cw - 5, y + 15); c.textAlign = 'left'; }
      if (!u.dead && u.cargoMax) bar(c, x + 5, y + 42, cw - 10, 2, u.cargoW / u.cargoMax, '#c4a77a');
    } else {
      c.fillText(fitText(c, cd.type === '__fab' ? TL('Renforts') : cd.tierK ? (cw > 64 ? TL('Rang {n}', { n: cd.tierK }) : TL('T{n}', { n: cd.tierK })) : CHASSIS[cd.type].n, cw - 10), x + 5, y + 15);
      c.font = `600 11px ${FONT}`; c.fillStyle = '#a59c88'; c.fillText('× ' + alive.length + (alive.length < cd.units.length ? ' / ' + cd.units.length : ''), x + 5, y + 29);
    }
    if (!dead) bar(c, x + 5, y + 36, cw - 10, 4, hp, '#6fe3c8');
    hudCards.push({ x, y, w: cw, h: ch, units: cd.units });
    x += cw + gap;
  }
}

function drawFormationTag(c) {
  if (!fleet.length || !hudCards.length) return;
  const x = hudCards[0].x, y = hudCards[0].y - 8;
  c.font = `600 12px ${FONT}`; c.textAlign = 'left'; c.fillStyle = 'rgba(232,220,196,.75)';
  c.fillText(TL('Formation : {name} [{k}]', { name: FORMATIONS[formation], k: keyLabel('formation') }) + '  ·  ' + TL('capacités [{k}]', { k: keyLabel('ability') }) + '  ·  ' + TL('patrouille [{k}]', { k: keyLabel('patrol') }) + (fireLatch ? '  ·  ' + TL('TIR CONTINU') : ''), x, y);
}

// ================= RENDU DE LA BASE =================
function drawBuildings(c, vx0, vy0, vx1, vy1) {
  for (const b of curBuildings()) {
    if (placing && placing.id === b.id) continue;
    const r = bRect(b); if (r.x > vx1 || r.x + r.w < vx0 || r.y > vy1 || r.y + r.h < vy0) continue;
    paintBuilding(c, b, time, false);
    const px = bProxies.get(b.id);
    if (px && px.dead && b.type !== 'wall') { c.fillStyle = 'rgba(20,18,15,.72)'; c.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); c.fillStyle = '#4a443a'; for (let k = 0; k < 6; k++) c.fillRect(r.x + ((k * 37 + b.id * 13) % (r.w - 12)) + 4, r.y + ((k * 23 + b.id * 7) % (r.h - 12)) + 4, 8, 6); }
    if (b === baseSel || b === hoverB) { c.strokeStyle = b === baseSel ? '#f2c14e' : 'rgba(232,220,196,.5)'; c.lineWidth = 2 / cam.zoom * 1.5; c.setLineDash([8, 6]); c.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8); c.setLineDash([]); }
  }
}
function drawBaseWorldOverlay(c) {
  const z = cam.zoom;
  for (const b of save.base.b) {
    const D = BUILD[b.type], r = bRect(b);
    if (D.prod && (b.stored || 0) >= 1 && !b.busy) {
      const bx = r.x + r.w / 2, by = r.y - 18 - Math.sin(time * 3 + b.id) * 3, txt = fmt(b.stored);
      c.font = `700 ${12 / z}px ${FONT}`; const tw = c.measureText(txt).width + 26 / z;
      c.fillStyle = 'rgba(20,24,26,.88)'; rr(c, bx - tw / 2, by - 11 / z, tw, 20 / z, 9 / z); c.fill();
      c.fillStyle = RES[D.prod].c; c.save(); c.translate(bx - tw / 2 + 10 / z, by - 1 / z); c.rotate(Math.PI / 4); c.fillRect(-4 / z, -4 / z, 8 / z, 8 / z); c.restore();
      c.fillStyle = '#e8dcc4'; c.textAlign = 'left'; c.fillText(txt, bx - tw / 2 + 18 / z, by + 4 / z);
      lblBlock(bx - tw / 2, by - 11 / z, tw, 20 / z);
    }
    if (b.type === 'wall' && b !== baseSel && b !== hoverB) continue;
    if (b === hoverB || b === baseSel || b === baseNearB) {
      const lbl = D.n + (b.lvl ? ' · ' + TL('niv. {n}', { n: b.lvl }) : '') + (b.busy ? ' · ' + mmss((b.busy - Date.now()) / 1000) : '');
      wLabel(r.x + r.w / 2, r.y + r.h + 18 / z, lbl, { pri: b === baseSel ? 5 : 4, size: 13, w8: 700, col: 'rgba(232,220,196,.95)' });
    }
  }
  if (baseNearB && !placing && !drawerOpen) {
    const b = baseNearB, r = bRect(b), D = BUILD[b.type];
    const txt = b.lvl <= 0 ? TL('En construction') : D.ui ? TL('[{k}] Ouvrir', { k: keyLabel('interact') }) : D.prod ? TL('Récolte automatique') : TL('[{k}] Détails', { k: keyLabel('interact') });
    wLabel(r.x + r.w / 2, r.y + r.h + 34 / z, txt, { pri: 5, size: 12, col: '#f2c14e' });
  }
  if (placing) {
    const D = BUILD[placing.type], fake = { type: placing.type, tx: placing.tx, ty: placing.ty, lvl: 1, busy: 0, id: -1 };
    if (placing.id) { const b = save.base.b.find(x => x.id === placing.id); if (b) fake.lvl = b.lvl; }
    c.globalAlpha = .7; paintBuilding(c, fake, time, true); c.globalAlpha = 1;
    const x = placing.tx * TILE, y = placing.ty * TILE;
    c.fillStyle = placing.ok ? 'rgba(111,227,200,.22)' : 'rgba(236,107,116,.32)'; c.fillRect(x, y, D.w * TILE, D.h * TILE);
    c.strokeStyle = placing.ok ? '#6fe3c8' : '#ec6b74'; c.lineWidth = 2 / z; c.strokeRect(x, y, D.w * TILE, D.h * TILE);
    c.strokeStyle = 'rgba(232,220,196,.12)'; c.lineWidth = 1 / z;
    for (let tx = BX0 + 1; tx <= BX1; tx++) { c.beginPath(); c.moveTo(tx * TILE, (BY0 + 1) * TILE); c.lineTo(tx * TILE, BY1 * TILE); c.stroke(); }
    for (let ty = BY0 + 1; ty <= BY1; ty++) { c.beginPath(); c.moveTo((BX0 + 1) * TILE, ty * TILE); c.lineTo(BX1 * TILE, ty * TILE); c.stroke(); }
  }
}
function drawBaseHUD(c) {
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  // ressources
  panel(c, 14, 14, 380, 92);
  RES_KEYS.forEach((k, i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 24 + col * 186, y = 34 + row * 19;
    if (!resVis(k)) { c.fillStyle = '#3a4950'; c.save(); c.translate(x + 4, y - 4); c.rotate(Math.PI / 4); c.fillRect(-4, -4, 8, 8); c.restore(); c.fillStyle = '#6c7773'; c.font = `600 12px ${FONT}`; c.fillText('? ? ?', x + 14, y); return; }
    c.fillStyle = RES[k].c; c.save(); c.translate(x + 4, y - 4); c.rotate(Math.PI / 4); c.fillRect(-4, -4, 8, 8); c.restore();
    c.fillStyle = '#e8dcc4'; c.font = `700 13px ${FONT}`; c.fillText(fmt(save.res[k]), x + 14, y);
    const pm = prodPerMin(k); c.font = `500 11px ${FONT}`; c.fillStyle = '#a59c88';
    c.font = `700 13px ${FONT}`; const nw = c.measureText(fmt(save.res[k])).width; c.font = `500 11px ${FONT}`; c.fillText(RES[k].s + (pm > 0 ? ' ' + TL('+{n}/min', { n: pm < 1 ? pm.toFixed(2).replace('.', TL_DEC) : fmt(pm) }) : ''), x + 20 + nw, y);
  });
  // infos
  const w = 270, x = VW - w - 14;
  const busy = save.base.b.filter(b => b.busy);
  panel(c, x, 14, w, 91 + busy.length * 17);
  c.font = `600 13px ${FONT}`; c.fillStyle = '#e8dcc4';
  c.fillText(TL('Ouvriers {n} / {max}', { n: busyCount(), max: builderCap() }), x + 10, 33);
  c.fillText(TL('Commandement {n} / {max}', { n: fmtCmd(cmdUsed()), max: cmdCap() }), x + 10, 51);
  c.fillText(TL('Hangar {n} / {max} robots', { n: save.robots.length, max: hangarCap() }), x + 10, 69);
  const th = Math.round(save.base.threat || 0); c.textAlign = 'right'; c.fillStyle = th >= 60 ? '#ff6b74' : th >= 35 ? '#f2c14e' : '#a59c88'; c.fillText(TL('Menace {n} %', { n: th }), x + w - 10, 33); c.textAlign = 'left'; c.fillStyle = '#e8dcc4';
  c.font = `500 12px ${FONT}`; c.fillStyle = ENV.night > .5 ? '#9fb4e0' : '#a59c88'; c.fillText(ENV.label(true), x + 10, 87);
  busy.forEach((b, i) => { c.fillStyle = '#f2c14e'; c.fillText(fitText(c, BUILD[b.type].n + ' → ' + b.up, w - 70), x + 10, 105 + i * 17); c.textAlign = 'right'; c.fillText(mmss((b.busy - Date.now()) / 1000 + .99), x + w - 10, 105 + i * 17); c.textAlign = 'left'; });
  expTracker(c, x, 14 + 91 + busy.length * 17 + 8, w, true);
  // attaque
  if (attack) {
    const bw = Math.min(460, VW * .42), bx = VW / 2 - bw / 2;
    panel(c, bx, 14, bw, 46); c.textAlign = 'left'; c.font = `700 14px ${FONT}`;
    if (attack.phase === 'warn') { c.fillStyle = '#f2c14e'; c.fillText(TL('Attaque imminente : {t}', { t: mmss(attack.t + .99) }), bx + 12, 34); c.font = `500 12px ${FONT}`; c.fillStyle = '#a59c88'; c.fillText(TLn(attack.total, '{n} assaillants en {w} vagues', '{n} assaillants en {w} vagues', { w: attack.waves.length }) + ' · ' + TL('posez murs, mines et tourelles'), bx + 12, 51); }
    else {
      const hq = hqProxy(); c.fillStyle = '#ff6b74'; c.fillText(TL('Attaque') + ' · ' + TL('vague {n} / {max}', { n: attack.wave, max: attack.waves.length }) + ' · ' + TLn(attack.alive, '{n} assaillants', '{n} assaillants'), bx + 12, 32);
      c.font = `500 12px ${FONT}`; c.fillStyle = '#a59c88'; c.fillText(TL('QG'), bx + 12, 51); bar(c, bx + 36, 43, bw - 50, 7, hq ? hq.hp / hq.maxhp : 0, '#6fe3c8');
    }
  }
  // premiers pas
  let my = 128;
  if (TUT.on && TUT.leftY) my = Math.max(my, TUT.leftY);
  else if (!save.guideDone) {
    const steps = [[TL('Assembler un deuxième robot à la forge'), save.robots.length >= 2 || save.stats.raids > 0], [TL('Accepter un contrat (Partir en raid)'), save.active.length > 0 || save.cdone.some(x => x > 0)], [TL('Réussir une extraction'), save.stats.extract >= 1], [TL('Lancer une recherche au laboratoire'), Object.keys(save.research).length > 0], [TL('Construire une défense de plus'), save.base.b.filter(b => BUILD[b.type].def).length > 1]];
    if (steps.every(s2 => s2[1])) { save.guideDone = true; writeSave(); }
    else if (TOUCH.on) { const nx = steps.find(s2 => !s2[1]); c.font = `600 12.5px ${FONT}`; const t = TL('Étape suivante : {step}', { step: nx[0] }); const tw = c.measureText(t).width; panel(c, 14, 112, tw + 20, 24); c.fillStyle = '#f2c14e'; c.textAlign = 'left'; c.fillText(t, 24, 128); my = 160; }
    else { panel(c, 14, 112, 330, 26 + steps.length * 19); c.font = `700 13px ${FONT}`; c.fillStyle = '#f2c14e'; c.textAlign = 'left'; c.fillText(TL('Premiers pas'), 24, 130); c.font = `500 12.5px ${FONT}`; steps.forEach(([t, ok], i) => { c.fillStyle = ok ? COL.ally : '#e8dcc4'; c.fillText((ok ? '✓ ' : '• ') + t, 24, 150 + i * 19); }); my = 112 + 26 + steps.length * 19 + 24; }
  }
  // messages
  if (TOUCH.on) { const x0 = 404, mw = VW - x0 - 300; let yy = Math.max(30, TUT.on ? TUT.msgY : 0); if (mw > 160) for (const m of msgs.slice(-3)) { const a = Math.min(1, m.t / .6); c.globalAlpha = a; c.font = `500 13px ${FONT}`; const t = fitText(c, m.text, mw - 16), tw = c.measureText(t).width; c.fillStyle = 'rgba(14,17,18,.7)'; c.fillRect(x0, yy - 14, tw + 16, 20); c.fillStyle = m.col; c.textAlign = 'left'; c.fillText(t, x0 + 8, yy); yy += 23; c.globalAlpha = 1; } }
  else for (const m of msgs) { const a = Math.min(1, m.t / .6); c.globalAlpha = a; c.font = `500 13px ${FONT}`; const tw = c.measureText(m.text).width; c.fillStyle = 'rgba(14,17,18,.7)'; c.fillRect(14, my - 14, tw + 16, 20); c.fillStyle = m.col; c.fillText(m.text, 22, my); my += 23; c.globalAlpha = 1; }
  // pilote embarqué
  if (player.inside) { if (TOUCH.on) drawPilotWeapons(c, 14, VH - 100, 280); else drawPilotWeapons(c, 14, VH - 156, 280); } else hudWRows = [];
  if (player.inside) { const u = player.inside; panel(c, 14, VH - 150, 280, 44); c.fillStyle = '#ff8a3d'; c.font = `700 13px ${FONT}`; c.fillText(TL('Aux commandes : {name}', { name: u.name }) + ' · ' + TL('[{k}] sortir', { k: keyLabel('pilot') }), 24, VH - 132); bar(c, 24, VH - 122, 260, 7, u.hp / u.maxhp, '#6fe3c8'); }
  // flotte
  const tb = document.getElementById('baseBar'); const tbw = tb && tb.offsetWidth ? tb.offsetWidth + 28 : 560;
  if (TOUCH.on) drawFleetCards(c, VW * .3, VH - 58, VW * .4, true);
  else { if (VW - tbw > 300) drawFleetCards(c, 14, VH - 62, VW - tbw - 14, false); else drawFleetCards(c, 14, VH - 124, VW - 28, false); drawFormationTag(c); }
}
