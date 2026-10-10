// Déplacement et intelligence : physique, flotte, ennemis, navigation, ligne de tir, récolte.

// ================= DÉPLACEMENT =================
function steer(u, gx, gy, dt, mul = 1, stop = 0) {
  const dx = gx - u.x, dy = gy - u.y, d = Math.hypot(dx, dy);
  // arrivée avec hystérésis : une unité arrivée ne repart pas pour quelques pixels (fini les petits à-coups sur place)
  if (d <= stop || (u.arr && d <= stop + 10 + u.r * .15)) { u.arr = true; return true; }
  u.arr = false;
  let a = Math.atan2(dy, dx);
  // contournement d'obstacle : déviation progressive plutôt qu'un coup de volant
  u.sideA = (u.sideA || 0) + ((u.sideT > 0 ? u.sideDir * 1.3 : 0) - (u.sideA || 0)) * Math.min(1, dt * 6); a += u.sideA;
  const slow = 34 + u.r * 1.3, kd = (d - stop) / slow;
  const sp = u.spd * mul * terrainMul(u) * (u.slowT > 0 ? .55 : 1) * (kd < 1 ? Math.max(.15, kd) : 1);
  // inertie : les grosses machines accélèrent et freinent plus lentement
  const k = 1 - Math.exp(-dt * 6.5 * (26 / (26 + u.r * .55)));
  u.vx += (Math.cos(a) * sp - u.vx) * k; u.vy += (Math.sin(a) * sp - u.vy) * k; u.wantMove = true;
  return false;
}
function physics(u, dt) {
  if (u.static) { u.vx = u.vy = 0; return; }
  if (u.jump) { jumpTick(u, dt); return; }
  if (u.slowT > 0) u.slowT -= dt;
  if (u.fortify) u.fortifyOn = Math.hypot(u.vx, u.vy) < 15;
  if (!u.wantMove) { const f = Math.exp(-dt * 7 * (26 / (26 + u.r * .4))); u.vx *= f; u.vy *= f; }
  const ox = u.x, oy = u.y;
  u.x += u.vx * dt; u.y += u.vy * dt; collideTiles(u);
  if (!u.net) { const md = Math.abs(u.x - ox) + Math.abs(u.y - oy); if (md > .3) FX.track(u, md); }
  u.sideT -= dt; u.chkT += dt;
  if (u.chkT > .5) {
    const moved = Math.hypot(u.x - u.lx, u.y - u.ly);
    if (u.wantMove && moved < u.spd * .5 * .22 && u.kind !== 'player') { u.sideT = .8; u.sideDir = Math.random() < .5 ? 1 : -1; u.stuckN = (u.stuckN || 0) + 1; } else if (moved > 10) u.stuckN = 0;
    if (u.r > 50 && moved > 4 && (u.kind === 'robot' || u.boss)) { FX.dust(u.x, u.y, 3, u.r * .22, 45); SFX.play('step', clamp(u.r / 140, .3, .9), u.x, u.y, { pitch: clamp(60 / u.r, .45, 1.1), self: u.piloted }); if (u.piloted && u.r > 70) buzz(10); giantStep(u); }
    u.lx = u.x; u.ly = u.y; u.chkT = 0;
  }
  const sp = Math.hypot(u.vx, u.vy); u.mv = clamp(sp / (u.spd * .6 + 1), 0, 1);
  // rotation amortie : rapide pour un grand écart, douce à l'approche du cap (plus de tremblement du châssis)
  if (sp > 12 + u.r * .1 && !(u.human && u.target) && !u.piloted) { const dA = angDiff(u.ang, Math.atan2(u.vy, u.vx)), mx = dt * (7 / (1 + u.r / 25)); u.ang += clamp(dA * Math.min(1, dt * 9), -mx, mx); }
  u.t += dt * (.25 + u.mv * .95);
  if (u.hitFlash > 0) u.hitFlash -= dt;
  if (u.kick > 0) u.kick = Math.max(0, u.kick - dt * (u.kick * 9 + 4));
}
function separate(dt) {
  for (const u of units) {
    if (u.dead || !u.active || u.hidden) continue;
    query(u.x - u.r, u.y - u.r, u.x + u.r, u.y + u.r, v => {
      if (v.id <= u.id || v.dead || v.hidden || u.fly !== v.fly) return;
      if ((u.kind === 'beacon' || v.kind === 'beacon' || u.kind === 'beacon2' || v.kind === 'beacon2') && Math.max(u.r, v.r) > 150) return; // un géant enjambe la balise
      if (u.team === v.team && Math.max(u.r, v.r) > 150 && Math.min(u.r, v.r) < Math.max(u.r, v.r) * .25) return; // et laisse passer les petits alliés entre ses chenilles
      const dx = v.x - u.x, dy = v.y - u.y, rr2 = u.r + v.r, dd = dx * dx + dy * dy;
      if (dd >= rr2 * rr2 || dd < .01) return;
      const d = Math.sqrt(dd), ov = rr2 - d, nx = dx / d, ny = dy / d;
      if (u.team !== v.team) {
        if (u.crush >= 2 && !u.net && v.r < u.r * .55 && v.kind !== 'beacon') crushUnit(v, u, dt);
        else if (v.crush >= 2 && !v.net && u.r < v.r * .55 && u.kind !== 'beacon') crushUnit(u, v, dt);
        if (u.spikes && !u.net) damage(v, 70 * dt, u); if (v.spikes && !v.net) damage(u, 70 * dt, v);
      }
      const mu = (u.static || u.kind === 'beacon') ? 1e9 : u.r * u.r * (u.crush >= 3 ? 20 : 1), mv = (v.static || v.kind === 'beacon') ? 1e9 : v.r * v.r * (v.crush >= 3 ? 20 : 1), tot = mu + mv;
      const soft = u.team === v.team ? .5 : 1, pu = ov * mv / tot * soft, pv = ov * mu / tot * soft; // entre alliés, on se pousse en douceur
      if (!(u.static || u.kind === 'beacon')) { u.x -= nx * pu; u.y -= ny * pu; }
      if (!(v.static || v.kind === 'beacon')) { v.x += nx * pv; v.y += ny * pv; }
    });
  }
}
function crushUnit(v, by, dt) {
  damage(v, (120 + by.r * 3) * dt * (by.crush >= 3 ? 2.5 : 1), by);
  if (Math.random() < dt * 8) sparks(v.x, v.y, 3, '#ffcf7a');
  SFX.play('crush', .4, v.x, v.y);
}

// ================= IA DES ROBOTS =================
function fleetIndex(u) { return [u.fi || 0, fleetAliveN || 1]; }
let fleetAliveN = 0;
let followSlots = [];
function indexFleet() {
  let i = 0, rs = 0; for (const r of fleet) { if (r.dead || r.piloted) continue; r.fi = i++; rs += r.r; } fleetAliveN = i;
  const sp = Math.max(46, (rs / Math.max(1, i)) * 2.4);
  followSlots = formation === 'free' ? [] : formationSlots(i, formation, sp, true);
  const L = focus(); const sp2 = Math.hypot(L.vx || 0, L.vy || 0);
  if (sp2 > 25) L.headAng = turnTo(L.headAng || 0, Math.atan2(L.vy, L.vx), frameDt * 4);
}

// ================= IA ENNEMIE =================
function bossExtra(e, dt, t) {
  if (e.hive) { e.sumT = (e.sumT || 4) - dt; if (t && e.sumT <= 0) { e.sumT = 9; for (let k = 0; k < 4 + Math.round(diff.spawn * 2); k++) { const a = Math.random() * TAU; makeEnemy('essaim', e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, { active: true, target: t }); } } return; }
  e.sumT = (e.sumT || 8) - dt;
  if (t && e.hp < e.maxhp * .6 && e.sumT <= 0) {
    e.sumT = 13; msg(TL('{foe} lâche un essaim.', { foe: ENEMIES[e.etype].n }), '#ff6b74', 3);
    for (let k = 0; k < 5 + Math.round(diff.spawn * 2); k++) { const a = Math.random() * TAU; makeEnemy('essaim', e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, { active: true, target: t }); }
  }
  if (e.hp < e.maxhp * .3 && !e.enraged) { e.enraged = true; e.spd *= 1.4; for (const m of e.mounts) m.w.rate *= 1.4; msg(TL('{foe} entre en surchauffe !', { foe: ENEMIES[e.etype].n }), '#ff6b74', 5); SFX.play('alarm', .8); }
}

// ================= IA : NAVIGATION, LIGNE DE TIR, RÉCOLTE =================
// Chaque monde garde ses grilles de dégagement (une par classe d'écrasement) : distance au premier obstacle infranchissable,
// en unités de chanfrein (3 par tuile droite, 4 en diagonale). Une unité passe là où le dégagement couvre son rayon.
// Déplacement : ligne droite quand elle est libre, sinon chemin A* lissé ; blocage détecté : nouveau chemin, recul,
// percée de l'obstacle destructible, et décoincement hors de la vue en dernier recours.
const NAV_CAP = 45, NAV_BUDGET = 14000;
const NAVB = { left: NAV_BUDGET };
const navClassOf = u => Math.min(4, u.crush || 0);
const navNeed = u => Math.min(NAV_CAP, Math.ceil((u.r / TILE * .8 + .5) * 3));
function navBlocked(i, x, y, cls) { if (x < 3 || y < 3 || x >= WT - 3 || y >= WT - 3) return true; const o = W.obs[i]; return !!o && OBS[o].lv > cls; }
function navChamfer(d, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * WT + x; let v = d[i]; if (!v) continue; let q;
    q = d[i - 1] + 3; if (q < v) v = q; q = d[i - WT] + 3; if (q < v) v = q; q = d[i - WT - 1] + 4; if (q < v) v = q; q = d[i - WT + 1] + 4; if (q < v) v = q; d[i] = v;
  }
  for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) {
    const i = y * WT + x; let v = d[i]; if (!v) continue; let q;
    q = d[i + 1] + 3; if (q < v) v = q; q = d[i + WT] + 3; if (q < v) v = q; q = d[i + WT + 1] + 4; if (q < v) v = q; q = d[i + WT - 1] + 4; if (q < v) v = q; d[i] = v;
  }
}
function navBuildGrid(cls) {
  const d = new Uint8Array(WT * WT);
  for (let y = 0; y < WT; y++) for (let x = 0; x < WT; x++) { const i = y * WT + x; d[i] = navBlocked(i, x, y, cls) ? 0 : NAV_CAP; }
  navChamfer(d, 1, 1, WT - 2, WT - 2);
  return d;
}
// un obstacle a disparu : on recalcule seulement le voisinage (au-delà de 16 tuiles, rien ne change)
function navLocal(d, cls, tx, ty) {
  const R = 16, x0 = Math.max(1, tx - R), x1 = Math.min(WT - 2, tx + R), y0 = Math.max(1, ty - R), y1 = Math.min(WT - 2, ty + R);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * WT + x; d[i] = navBlocked(i, x, y, cls) ? 0 : NAV_CAP; }
  navChamfer(d, x0, y0, x1, y1);
}
function navState() { if (!W) return null; return W.nav || (W.nav = { g: [], dirty: new Set(), full: false }); }
function navTouch(tx, ty) { const N = W && W.nav; if (N) N.dirty.add(ty * WT + tx); }
function navInvalidate() { const N = W && W.nav; if (N) N.full = true; }
function navGrid(cls) {
  const N = navState();
  if (N.full) { N.g = []; N.full = false; N.dirty.clear(); }
  if (N.dirty.size) {
    if (N.dirty.size > 80) N.g = [];
    else for (const i of N.dirty) { const tx = i % WT, ty = (i / WT) | 0; for (let c = 0; c < N.g.length; c++) if (N.g[c]) navLocal(N.g[c], c, tx, ty); }
    N.dirty.clear();
  }
  return N.g[cls] || (N.g[cls] = navBuildGrid(cls));
}
// case libre la plus proche (spirale), pour un départ ou une arrivée coincée contre un obstacle
function navNear(g, need, tx, ty, R) {
  tx = clamp(tx, 0, WT - 1); ty = clamp(ty, 0, WT - 1);
  if (g[ty * WT + tx] >= need) return ty * WT + tx;
  for (let r = 1; r <= R; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = tx + dx, y = ty + dy; if (x < 0 || y < 0 || x >= WT || y >= WT) continue;
    if (g[y * WT + x] >= need) return y * WT + x;
  }
  return -1;
}
// la ligne droite est-elle praticable pour cette unité ?
function navClear(g, need, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), n = Math.ceil(L / (TILE / 3));
  for (let k = 1; k < n; k++) { const x = ax + dx * k / n, y = ay + dy * k / n, tx = (x / TILE) | 0, ty = (y / TILE) | 0; if (tx < 0 || ty < 0 || tx >= WT || ty >= WT || g[ty * WT + tx] < need) return false; }
  return true;
}
// A* sur la grille de dégagement : marais et frôlement des obstacles coûtent plus cher
function navFind(u, gx, gy) {
  if (NAVB.left < 1500) return undefined; // plus de budget pour cette image : on réessaiera
  const cls = navClassOf(u), need = navNeed(u), g = navGrid(cls);
  const si = navNear(g, need, (u.x / TILE) | 0, (u.y / TILE) | 0, 4), gi = navNear(g, need, (gx / TILE) | 0, (gy / TILE) | 0, 7);
  if (si < 0 || gi < 0) return null;
  if (si === gi) return [];
  navInit();
  const sx = si % WT, sy = (si / WT) | 0, ex = gi % WT, ey = (gi / WT) | 0, M = 26;
  const wx0 = Math.max(1, Math.min(sx, ex) - M), wx1 = Math.min(WT - 2, Math.max(sx, ex) + M), wy0 = Math.max(1, Math.min(sy, ey) - M), wy1 = Math.min(WT - 2, Math.max(sy, ey) + M);
  const st = ++NAV.stamp, G = NAV.g, F = NAV.from, SEEN = NAV.seen, DONE = NAV.done, HI = NAV.hi, HF = NAV.hf, cap = HI.length, GR = W.ground, marsh = cls < 3 && !u.fly;
  const H = i => { const dx = Math.abs(i % WT - ex), dy = Math.abs(((i / WT) | 0) - ey); return 3 * (dx + dy) - 2 * Math.min(dx, dy); };
  let hn = 0;
  const push = (i, f) => { if (hn >= cap) return; let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (HF[p] <= f) break; HI[k] = HI[p]; HF[k] = HF[p]; k = p; } HI[k] = i; HF[k] = f; };
  const pop = () => { const top = HI[0]; hn--; const li = HI[hn], lf = HF[hn]; let k = 0; for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && HF[c + 1] < HF[c]) c++; if (HF[c] >= lf) break; HI[k] = HI[c]; HF[k] = HF[c]; k = c; } HI[k] = li; HF[k] = lf; return top; };
  G[si] = 0; SEEN[si] = st; F[si] = -1; push(si, H(si));
  const maxIt = Math.min(NAVB.left, 9000); let it = 0, found = false;
  while (hn > 0 && it < maxIt) {
    const i = pop(); if (DONE[i] === st) continue; DONE[i] = st; it++;
    if (i === gi) { found = true; break; }
    const x = i % WT, y = (i / WT) | 0, g0 = G[i];
    for (let d = 0; d < 8; d++) {
      const dx = NDX[d], dy = NDY[d], nx = x + dx, ny = y + dy; if (nx < wx0 || ny < wy0 || nx > wx1 || ny > wy1) continue;
      const ni = ny * WT + nx, c = g[ni]; if (c < need || DONE[ni] === st) continue;
      if (dx && dy && (g[i + dx] < need || g[i + dy * WT] < need)) continue; // pas de coin coupé
      let step = dx && dy ? 4 : 3; if (marsh && GR[ni] === 3) step *= 3; if (c < need + 3) step += 2;
      const ng = g0 + step;
      if (SEEN[ni] !== st || ng < G[ni]) { SEEN[ni] = st; G[ni] = ng; F[ni] = i; push(ni, ng + H(ni)); }
    }
  }
  NAVB.left -= it;
  if (!found) return null;
  const cells = []; for (let k = gi; k >= 0; k = F[k]) cells.push(k); cells.reverse();
  // lissage : on file droit tant que la ligne est praticable
  const out = []; let i0 = 0; const cx = k => (cells[k] % WT) * TILE + TILE / 2, cy = k => ((cells[k] / WT) | 0) * TILE + TILE / 2;
  while (i0 < cells.length - 1) { let j = Math.min(cells.length - 1, i0 + 28); while (j > i0 + 1 && !navClear(g, need, cx(i0), cy(i0), cx(j), cy(j))) j--; out.push({ x: cx(j), y: cy(j) }); i0 = j; }
  return out;
}
const onScreen = u => Math.abs(u.x - cam.x) < VW / 2 / cam.zoom + u.r + 40 && Math.abs(u.y - cam.y) < VH / 2 / cam.zoom + u.r + 40;
// obstacle destructible juste devant : la machine coincée le perce
function navBreachAhead(u, ax, ay) {
  const a = Math.atan2(ay - u.y, ax - u.x);
  for (let s = u.r + 8; s <= u.r + 56; s += 12) for (const off of [0, -.45, .45]) {
    const x = u.x + Math.cos(a + off) * s, y = u.y + Math.sin(a + off) * s, tx = (x / TILE) | 0, ty = (y / TILE) | 0;
    if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) continue; const o = W.obs[ty * WT + tx];
    if (o && o < 7 && (OBS[o].lv <= 3 || u.r >= 30)) return { tx, ty, until: time + 5 };
  }
  return null;
}
// se rendre quelque part : ligne droite si elle est libre, sinon chemin ; renvoie vrai à l'arrivée
function goTo(u, gx, gy, dt, mul = 1, stop = 0) {
  if (u.fly || !W || u.static || u.kind === 'player' || u.net || (u.r > 220 && (u.crush || 0) >= 4)) return steer(u, gx, gy, dt, mul, stop);
  const N = u.nv || (u.nv = { gx: NaN, gy: NaN, ax: 0, ay: 0, path: null, pi: 0, chk: 0, failT: 0, back: 0, bx: 0, by: 0, force: false });
  const jump = !(Math.abs(gx - N.gx) + Math.abs(gy - N.gy) < 200);
  if (jump) { N.path = null; N.chk = 0; N.failT = 0; }
  N.gx = gx; N.gy = gy;
  const d = Math.hypot(gx - u.x, gy - u.y);
  // recul de décoincement en cours
  if (N.back > 0) { N.back -= dt; steer(u, u.x + N.bx, u.y + N.by, dt, .8, 0); return false; }
  const stk = u.stuckN || 0;
  if (stk >= 2 && d < stop + u.r * 2 + 70) { u.stuckN = 0; return true; } // assez près, bloqué par la foule : c'est arrivé
  N.chk -= dt;
  const cls = navClassOf(u), need = navNeed(u);
  const wantForce = stk >= 2 && time - (N.forceT || -9) > 1.2;
  if (wantForce) { N.forceT = time; N.force = true; N.chk = 0; }
  if (N.chk <= 0) {
    N.chk = .3 + Math.random() * .25;
    const g = navGrid(cls);
    // destination dans un obstacle : on vise la case libre la plus proche
    const gtx = (gx / TILE) | 0, gty = (gy / TILE) | 0; N.ax = gx; N.ay = gy;
    if (gtx >= 0 && gty >= 0 && gtx < WT && gty < WT && g[gty * WT + gtx] < need) { const q = navNear(g, need, gtx, gty, 5); if (q >= 0) { N.ax = (q % WT) * TILE + TILE / 2; N.ay = ((q / WT) | 0) * TILE + TILE / 2; } }
    if (N.force) N.path = null;
    if (!N.force && (d < 70 + u.r || navClear(g, need, u.x, u.y, N.ax, N.ay))) N.path = null;
    else if (N.path && N.pi < N.path.length) { const e = N.path[N.path.length - 1]; if (Math.hypot(e.x - N.ax, e.y - N.ay) > 160) N.path = null; }
    if (!N.path && (N.force || !navClear(g, need, u.x, u.y, N.ax, N.ay)) && time >= N.failT && d >= 70 + u.r) {
      const p = navFind(u, N.ax, N.ay);
      if (p === undefined) N.chk = .05; // budget épuisé : on retente à l'image suivante
      else if (p === null) { N.failT = time + 1.6; N.force = false; }
      else { N.path = p; N.pi = 0; N.force = false; }
    }
    // raccourci : on saute les points de passage déjà visibles
    if (N.path) while (N.pi < N.path.length - 1 && navClear(g, need, u.x, u.y, N.path[N.pi + 1].x, N.path[N.pi + 1].y)) N.pi++;
  }
  // blocage prolongé : percée de l'obstacle devant, recul, et décoincement hors de la vue
  if (stk >= 3) { const nx = N.path && N.path[N.pi] ? N.path[N.pi] : { x: N.ax, y: N.ay }; const br = navBreachAhead(u, nx.x, nx.y); if (br) u.breach = br; }
  if (stk >= 5 && stk % 3 === 2 && N.back <= 0) { const a = Math.atan2(u.y - (N.path && N.path[N.pi] ? N.path[N.pi].y : gy), u.x - (N.path && N.path[N.pi] ? N.path[N.pi].x : gx)) + rnd(-1.2, 1.2); N.back = .55; N.bx = Math.cos(a) * 80; N.by = Math.sin(a) * 80; N.chk = 0; u.stuckN++; }
  if (stk >= 16 && !onScreen(u)) { const g = navGrid(cls), q = navNear(g, need, (u.x / TILE) | 0, (u.y / TILE) | 0, 8); if (q >= 0) { u.x = (q % WT) * TILE + TILE / 2; u.y = ((q / WT) | 0) * TILE + TILE / 2; u.vx = u.vy = 0; } u.stuckN = 0; N.path = null; N.chk = 0; }
  if (N.path && N.pi < N.path.length) {
    const w = N.path[N.pi], last = N.pi === N.path.length - 1;
    u.sideT = 0;
    if (Math.hypot(w.x - u.x, w.y - u.y) < (last ? 26 : Math.max(30, u.r * .7))) { N.pi++; u.arr = false; }
    else { steer(u, w.x, w.y, dt, mul, 0); return false; }
  }
  return steer(u, N.ax, N.ay, dt, mul, stop);
}

// ---------- ligne de tir ----------
const LOF_KIND = { bullet: 1, shell: 1, plasma: 1, laser: 1, flame: 1, rocket: 1, beam: 1, rail: 2 };
const lofCheap = o => o === 1 || o === 4 || o === 5; // arbre, cristal, épave : on tire au travers, et on récolte au passage
// premier obstacle sur la trajectoire ; spread : dispersion de l'arme (le rayon s'élargit avec la distance)
function lofBlock(sx, sy, tx, ty, tr, railOnly, spread) {
  const dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy), L = d - (tr || 0) * .8 - 6; if (L <= 18) return -1;
  const n = Math.ceil(L / 16), ux = dx / d, uy = dy / d, px = -uy, py = ux;
  for (let k = 1; k <= n; k++) {
    const s = Math.min(L, k * 16), pad = spread ? Math.min(16, 3 + spread * s * .55) : 0;
    for (let j = pad ? -1 : 0; j <= (pad ? 1 : 0); j++) {
      const x = sx + ux * s + px * pad * j, y = sy + uy * s + py * pad * j, cx = (x / TILE) | 0, cy = (y / TILE) | 0;
      if (cx < 0 || cy < 0 || cx >= WT || cy >= WT) continue;
      const i = cy * WT + cx, o = W.obs[i]; if (o && (!railOnly || o >= 6)) return i;
    }
  }
  return -1;
}
const hasDirect = u => u.hasDir !== undefined ? u.hasDir : (u.hasDir = u.mounts.some(m => LOF_KIND[m.w.kind] && m.w.kind !== 'rail'));
// choix de cible : proche, menaçante, et qu'on peut réellement toucher
function pickTarget(u, range, weakest) {
  const cand = [], r2 = range * range;
  query(u.x - range, u.y - range, u.x + range, u.y + range, v => {
    if (v.team === u.team || v.dead || v.hidden || v.etype === 'cible' || v.invul) return;
    const dd = d2(u.x, u.y, v.x, v.y); if (dd > r2 + v.r * v.r * 2) return;
    if (v.cloak && time - v.lastFire > 1.5 && dd > r2 * .16) return;
    cand.push([v, weakest ? (v.hp / v.maxhp) * 4e6 + dd : dd]);
  });
  if (!cand.length) return null;
  cand.sort((a, b) => a[1] - b[1]);
  const dir = !u.fly && hasDirect(u) && W; let best = null, bs = Infinity;
  for (let k = 0; k < Math.min(5, cand.length); k++) {
    const v = cand[k][0]; let s = cand[k][1] + 2500;
    if (v === u.target) s *= .8;
    const vt = v.target; if (vt && !vt.dead && (vt === u || vt.team === u.team || (u.team === 0 && (vt === player || vt === player.inside || (B && vt === B.unit))))) s *= .75;
    if (v.hp < v.maxhp * .3) s *= .9;
    if (dir && !v.fly) { const i = lofBlock(u.x, u.y, v.x, v.y, v.r); if (i >= 0 && !lofCheap(W.obs[i])) s = s * 2.4 + 120000; }
    if (s < bs) { bs = s; best = v; }
  }
  return best;
}
function pickMountTarget(u, m, base, cap) {
  const w = m.w, role = m.role || (m.role = wRole(w)), p = mountWorldPos(u, m), mx = p[0], my = p[1], rg = w.range || 400;
  const R = Math.min(rg + 60, cap || 2000); const cand = [];
  query(mx - R, my - R, mx + R, my + R, v => {
    if (v.team === u.team || v.dead || v.hidden || v.etype === 'cible' || (u.team === 0 && v.team === 0)) return;
    const d = Math.hypot(v.x - mx, v.y - my); if (d > Math.min(rg, R) + v.r || d < (w.minRange || 0)) return;
    if (v.cloak && time - (v.lastFire || -9) > 1.5 && d > R * .4) return;
    if (role === 'melee' && d > u.r + v.r + 18 * u.mscale + 8) return;
    let s = .25 + d / rg;
    const big = v.r >= 20 || (v.armor || 0) >= .15 || v.boss || v.elite || v.kind === 'building';
    if (role === 'aa') s *= v.fly ? .25 : 1.6;
    else if (role === 'art') s *= v.fly ? 6 : v.static || (v.spd || 0) < 90 ? .5 : big ? .7 : 1.25;
    else if (role === 'heavy') s *= big ? .45 : v.fly ? 1.3 : 1.5;
    else if (role === 'light') s *= v.human || v.r < 16 || v.fly ? .6 : big ? 1.45 : 1;
    else if (role === 'titan') s *= v.giant || v.boss || v.r >= 90 ? .3 : big ? .75 : 2.4;
    if (v === base) s *= .75;
    if (v === m.tgt2) s *= .8; // garde sa cible tant qu'elle convient
    if (v.target && (v.target === player || v.target === player.inside || (B && v.target === B.unit))) s *= .8;
    if (v.hp < v.maxhp * .3) s *= .85;
    cand.push([v, s]);
  });
  if (!cand.length) return null;
  cand.sort((a, b) => a[1] - b[1]);
  if (!LOF_KIND[w.kind] || u.fly) return cand[0][0];
  // parmi les meilleures, la première qu'on peut toucher sans tirer dans un mur
  for (let k = 0; k < Math.min(3, cand.length); k++) { const v = cand[k][0]; if (v.fly) return v; const i = lofBlock(mx, my, v.x, v.y, v.r, w.kind === 'rail'); if (i < 0 || lofCheap(W.obs[i])) return v; }
  return cand[0][0];
}

// ---------- montures : ligne de tir, tirs aériens, récolte et percée ----------
function updateMounts(u, dt) {
  const pil = u.piloted, mine = u.kind === 'robot' && u.team === 0 && !u.net;
  const curT = pil ? cursorTarget(u.team) : null; // en pilotage, les tirs guidés manuels visent ce qui est sous le curseur
  const tile = !pil && u.team !== 1 ? (u.harvest || (u.breach && u.breach.until > time && W.obs[u.breach.ty * WT + u.breach.tx] ? u.breach : null)) : u.breach && u.breach.until > time && W.obs[u.breach.ty * WT + u.breach.tx] ? u.breach : null;
  if (u.breach && !tile) u.breach = null;
  for (let mi = 0; mi < u.mounts.length; mi++) { const m = u.mounts[mi];
    m.cd -= dt * (u.slowT > 0 ? .6 : 1); m.recoil = Math.max(0, m.recoil - dt * 5);
    const w = m.w; const [mx, my] = mountWorldPos(u, m);
    if (w.kind === 'repair') { repairTick(u, m, dt, mx, my); continue; }
    if (w.kind === 'shield') { shieldTick(u, m, dt); continue; }
    if (w.kind === 'bay') { bayTick(u, m, dt, mx, my); continue; }
    let tx, ty, tgt = null, want = false, manual = false;
    if (pil && !(u.wm && u.wm[mi] === 'a')) {
      manual = true;
      tx = mouse.wx; ty = mouse.wy; tgt = w.kind === 'melee' ? (u.target && !u.target.dead ? u.target : null) : (curT || (u.target && !u.target.dead ? u.target : null));
      want = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire);
      if (w.kind === 'melee') { want = want && !!tgt; if (tgt) { tx = tgt.x; ty = tgt.y; } }
    } else {
      const base = !pil && u.target && !u.target.dead && !u.target.hidden ? u.target : null;
      if (pil) tgt = mountTarget(u, m, dt, null, Math.max(950, (w.range || 0) + 60));
      else if (mine && (u.split || !base || !mountReach(u, m, base))) tgt = mountTarget(u, m, dt, base, Math.max(u.split ? 900 : 700, (w.size || 1) >= 4 ? (w.range || 0) + 60 : 0)) || base;
      else { tgt = base; if (mine) m.tgt2 = null; }
      if (tgt) {
        tx = tgt.x; ty = tgt.y; const dd = Math.hypot(tx - mx, ty - my);
        if (w.spd && w.kind !== 'rocket') { const tt = dd / w.spd; tx += tgt.vx * tt * .8; ty += tgt.vy * tt * .8; }
        if (w.kind === 'melee') want = dd <= u.r + tgt.r + 18 * u.mscale + 8;
        else want = dd <= w.range + tgt.r && dd >= (w.minRange || 0);
        // pas de tir dans un mur : obstacle léger tout proche, éclaboussure qui atteint la cible, ou tir aérien, sinon on se replace
        if (want && LOF_KIND[w.kind] && !u.fly && !tgt.fly && tgt.kind !== 'building') {
          if (time > (m.lofT || 0) || m.lofTg !== tgt) { m.lofTg = tgt; m.lofT = time + .12 + Math.random() * .08; m.lofI = lofBlock(mx, my, tx, ty, tgt.r * .6, w.kind === 'rail', w.kind === 'beam' || w.kind === 'rail' ? 0 : (w.spread || .02) + .015); }
          const bi = m.lofI;
          if (bi >= 0) {
            const o = W.obs[bi], bx = (bi % WT) * TILE + TILE / 2, by = ((bi / WT) | 0) * TILE + TILE / 2;
            const ok = !o || (lofCheap(o) && d2(bx, by, mx, my) < (o === 1 ? 75 : 170) ** 2) || (w.splash && Math.hypot(bx - tgt.x, by - tgt.y) < w.splash * .8 + tgt.r);
            if (!ok) { want = false; u.lofBad = time; }
          }
        }
      } else if (tile && w.kind !== 'chain' && !ARTILLERY[w.kind] && w.kind !== 'orbital' && w.kind !== 'mortar' && w.kind !== 'fusion' && w.kind !== 'singularity') {
        // récolte ou percée : on tire sur l'obstacle visé
        tx = tile.tx * TILE + TILE / 2; ty = tile.ty * TILE + TILE / 2; const dd = Math.hypot(tx - mx, ty - my);
        want = w.kind === 'melee' ? dd <= u.r + 34 : dd <= (w.range || 300) * .95 && dd >= (w.minRange || 0);
      } else { tx = mx + Math.cos(u.ang) * 100; ty = my + Math.sin(u.ang) * 100; }
    }
    const da = Math.atan2(ty - my, tx - mx);
    const trate = (w.size >= 6 ? .8 : w.size === 5 ? 1.05 : w.size >= 4 ? 1.4 : w.size === 3 ? 2.8 : w.size === 2 ? 4.8 : 9) * (pil ? 1.6 : 1) * (w.kind === 'beam' ? .55 : 1) * (w.turnMul || 1);
    m.aim = turnTo(m.aim, da, trate * dt);
    const aimed = Math.abs(angDiff(m.aim, da)) < .3 || w.kind === 'melee' || ARTILLERY[w.kind] || w.kind === 'chain';
    if (w.spin) { m.spin = want ? Math.min(1, m.spin + dt / w.spin) : Math.max(0, m.spin - dt * .8); m.spinA += m.spin * dt * 40; }
    if (w.kind === 'beam') { if (want && aimed) beamTick(u, m, dt, mx, my, w); continue; }
    if (w.kind === 'fusion') {
      if (m.chg > 0) { m.chg -= dt; if (m.chg <= 0) { fusionShot(u, m, mx, my, w); m.cd = 1 / w.rate; m.fc = ((m.fc || 0) + 1) & 255; } continue; }
      if (want && aimed && m.cd <= 0) { m.chg = w.charge; SFX.play('charge', 1, mx, my); }
      continue;
    }
    if (want && m.cd <= 0 && aimed) {
      if (w.kind === 'melee' && !tgt && tile) { hitTile(tile.tx, tile.ty, (w.dmg || 20) * 1.5); sparks(tx, ty, 3, '#ffd27a'); m.cd = 1 / (w.rate || 1); m.recoil = 1; continue; }
      const rate = (w.spin ? w.rate * (.12 + .88 * m.spin) : w.rate) * (u.rateMul || 1), nb = bullets.length;
      if (fireMount(u, m, tx, ty, tgt) !== false) {
        m.cd = 1 / rate * rnd(.9, 1.1);
        // en vol, ou contre une cible en vol, le tir passe au-dessus des obstacles
        if (!manual && (u.fly || (tgt && tgt.fly))) for (let k = nb; k < bullets.length; k++) bullets[k].air = true;
        if (pil && !u.net) camKick(m.aim, Math.min(9, Math.pow(w.size || 1, 1.4) * (w.kind === 'shell' || w.kind === 'rail' || w.big ? 2.4 : 1.1)));
      } else m.cd = .1;
    }
  }
}

// ---------- déplacement au combat ----------
function engage(u, t, dt, desired, kite) {
  const d = Math.hypot(t.x - u.x, t.y - u.y);
  // pas de ligne de tir : on va chercher l'angle, par le chemin praticable
  if (!u.fly && time - (u.lofBad || -9) < .8 && d > u.r + t.r + 30) { goTo(u, t.x, t.y, dt, 1, Math.max(u.r + t.r + 24, desired * .4)); return; }
  // un bâtiment : chemin praticable jusqu'à ses abords, puis droit dessus (ses murs arrêtent l'unité au contact)
  if (t.kind === 'building') {
    if (d > desired + u.r + 140) goTo(u, t.x, t.y, dt, 1, desired * .9);
    else if (d > desired) steer(u, t.x, t.y, dt, 1, desired * .9);
    else { const a = Math.atan2(t.y - u.y, t.x - u.x) + u.strafe * Math.PI / 2; steer(u, u.x + Math.cos(a) * 60, u.y + Math.sin(a) * 60, dt, .35, 0); if (Math.random() < dt * .4) u.strafe *= -1; }
    return;
  }
  if (d > desired) {
    // les ennemis s'écartent les uns des autres pour encercler au lieu d'arriver en file
    if (u.team === 1 && d > desired * 1.2 && !u.boss) { const a = Math.atan2(u.y - t.y, u.x - t.x) + ((u.id * 7) % 5 - 2) * .22, R = desired * .85; goTo(u, t.x + Math.cos(a) * R, t.y + Math.sin(a) * R, dt, 1, 20); return; }
    goTo(u, t.x, t.y, dt, 1, desired * .9);
  }
  else if (kite && d < desired * .55) { steer(u, u.x - (t.x - u.x), u.y - (t.y - u.y), dt, .9, 0); }
  else { const a = Math.atan2(t.y - u.y, t.x - u.x) + u.strafe * Math.PI / 2; steer(u, u.x + Math.cos(a) * 60, u.y + Math.sin(a) * 60, dt, .35, 0); if (Math.random() < dt * .4) u.strafe *= -1; }
}
function escortMove(u, L, dt, tgt) {
  if (tgt && d2(tgt.x, tgt.y, L.x, L.y) < 520 * 520) { engage(u, tgt, dt, u.engRange * .8, false); return; }
  const [i, n] = fleetIndex(u);
  const far = d2(u.x, u.y, L.x, L.y) > 800 * 800;
  if (formation !== 'free' && followSlots[i]) {
    const [f, sd] = followSlots[i], a = L.headAng || 0, ca = Math.cos(a), sa = Math.sin(a);
    const back = formation === 'circle' ? 0 : L.r + 60, ax = L.x - ca * back, ay = L.y - sa * back;
    goTo(u, ax + ca * f - sa * sd, ay + sa * f + ca * sd, dt, far ? 1.25 : 1.05, 12 + u.r * .2); escortHarvest(u, L, dt, tgt); return;
  }
  const a = i * 2.39996 + time * .03, rad = L.r + u.r + 45 + Math.sqrt(i) * (n > 12 ? 38 : 30);
  goTo(u, L.x + Math.cos(a) * rad, L.y + Math.sin(a) * rad, dt, far ? 1.25 : 1, 18 + u.r * .3);
  escortHarvest(u, L, dt, tgt);
}
// récolte opportuniste : flotte au repos et rien à combattre, l'escorte abat les cristaux et épaves à portée (sans bouger)
function escortHarvest(u, L, dt, tgt) {
  u.lsp = lerp(u.lsp || 0, Math.hypot(L.vx || 0, L.vy || 0), Math.min(1, dt * 2));
  if (tgt || u.lsp > 30 || u.r > 220) { u.oTile = null; return; }
  u.ot = (u.ot || 0) - dt;
  if (u.ot <= 0) {
    u.ot = .9 + Math.random() * .3; u.oTile = null;
    const rg = Math.min(300, gatherRanged(u) * .9); if (rg < 120) return;
    const ctx_ = (u.x / TILE) | 0, cty = (u.y / TILE) | 0, gr = Math.ceil(rg / TILE); let bt = rg * rg;
    for (let y = cty - gr; y <= cty + gr; y++) for (let x = ctx_ - gr; x <= ctx_ + gr; x++) {
      if (x < 0 || y < 0 || x >= WT || y >= WT || !RES_TILES[W.obs[y * WT + x]]) continue;
      const cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2, q = d2(cx, cy, u.x, u.y);
      if (q >= bt || d2(cx, cy, L.x, L.y) > 460 * 460) continue;
      const bi = lofBlock(u.x, u.y, cx, cy, 20); if (bi >= 0 && bi !== y * WT + x && !lofCheap(W.obs[bi])) continue;
      bt = q; u.oTile = { tx: x, ty: y };
    }
  }
  if (u.oTile && RES_TILES[W.obs[u.oTile.ty * WT + u.oTile.tx]]) u.harvest = u.oTile; else u.oTile = null;
}
// robot très abîmé et pris pour cible : il se met à l'abri derrière le pilote, sans cesser de tirer
function robotCover(u, L, tgt, dt) {
  if (!tgt || u.hp > u.maxhp * .25 || u.brain === 'guard' || (u.order && u.order.type === 'hold') || tgt.target !== u) return false;
  const a = Math.atan2(L.y - tgt.y, L.x - tgt.x); goTo(u, L.x + Math.cos(a) * (L.r + u.r + 50), L.y + Math.sin(a) * (L.r + u.r + 50), dt, 1.1, 16); return true;
}

// ---------- IA des robots ----------
function robotAI(u, dt) {
  const L = focus();
  if (state === 'base') { baseRobotAI(u, dt); return; }
  u.tt -= dt;
  if (u.tt <= 0) {
    u.tt = .3 + Math.random() * .15;
    const sight = ((u.brain === 'hunter' || u.brain === 'tactical') ? 680 : 540) * Math.min(1.4, u.sightMul || 1);
    u.target = pickTarget(u, u.piloted ? Math.max(260, u.r + 160) : Math.max(sight, u.r > 120 ? u.engRange * 1.1 + u.r : 0), u.brain === 'tactical' && !u.piloted);
    if (u.order && u.order.type === 'attack' && u.order.t && !u.order.t.dead) u.target = u.order.t;
  }
  if (u.piloted) return;
  u.harvest = null;
  const tgt = u.target && !u.target.dead && !u.target.hidden ? u.target : null;
  const rng = u.engRange, o = u.order;
  autoAbilities(u, tgt);
  // fenêtre d'extraction : la flotte rejoint d'elle-même le cercle en tirant (sauf les robots qui tiennent une position)
  if (B && B.unit && (B.state === 'window' || B.state === 'lift') && !(o && o.type === 'hold')) {
    const [i, n] = fleetIndex(u), a = i / Math.max(1, n) * TAU + .4;
    const R = u.r > 150 ? Math.min(zoneReach(u) * .6, 90 + u.r) : Math.min(ZONE_R * .68, 60 + u.r + Math.sqrt(i) * 24);
    goTo(u, B.unit.x + Math.cos(a) * R, B.unit.y + Math.sin(a) * R, dt, 1.25, 16); return;
  }
  if (o) {
    if (o.type === 'move') { if (goTo(u, o.x, o.y, dt, 1, 14 + u.r * .3)) nextWaypoint(u); return; }
    if (o.type === 'hold') {
      if (tgt && d2(tgt.x, tgt.y, o.x, o.y) < (rng + 140) ** 2 && d2(u.x, u.y, o.x, o.y) < 170 * 170) engage(u, tgt, dt, rng * .85, false);
      else goTo(u, o.x, o.y, dt, 1, 12);
      return;
    }
    if (o.type === 'attack') { if (!o.t || o.t.dead) u.order = null; else { u.target = o.t; engage(u, o.t, dt, rng * .8, false); return; } }
    if (o.type === 'follow') { if (!robotCover(u, L, tgt, dt)) escortMove(u, L, dt, tgt); return; }
    if (o.type === 'beacon') {
      if (!B.unit) { u.order = null; }
      else { const [i, n] = fleetIndex(u); const a = i / Math.max(1, n) * TAU; const gx = B.unit.x + Math.cos(a) * (90 + u.r), gy = B.unit.y + Math.sin(a) * (90 + u.r); if (tgt && d2(tgt.x, tgt.y, B.unit.x, B.unit.y) < (rng + 200) ** 2 && d2(u.x, u.y, gx, gy) < 200 * 200) engage(u, tgt, dt, rng * .85, false); else goTo(u, gx, gy, dt, 1, 14); return; }
    }
  }
  if (robotCover(u, L, tgt, dt)) return;
  switch (u.brain) {
    case 'escort': escortMove(u, L, dt, tgt); break;
    case 'hunter':
      if (tgt && d2(tgt.x, tgt.y, L.x, L.y) < 1050 * 1050) engage(u, tgt, dt, rng * .65, false);
      else if (d2(u.x, u.y, L.x, L.y) > 380 * 380) goTo(u, L.x, L.y, dt, 1.15, 200);
      else { if (!u.wp || u.wt <= 0 || d2(u.x, u.y, u.wp.x, u.wp.y) < 900) { u.wp = findWalkableNear(L.x, L.y, 80, 320, 10) || { x: L.x + rnd(-200, 200), y: L.y + rnd(-200, 200) }; u.wt = rnd(2, 4); } u.wt -= dt; goTo(u, u.wp.x, u.wp.y, dt, .7, 20); }
      break;
    case 'guard': {
      const gp = B.unit ? B.unit : L; const [i, n] = fleetIndex(u); const a = i / Math.max(1, n) * TAU;
      const gx = gp.x + Math.cos(a) * (gp.r + u.r + 70), gy = gp.y + Math.sin(a) * (gp.r + u.r + 70);
      if (tgt && d2(tgt.x, tgt.y, gp.x, gp.y) < (rng + 160) ** 2 && d2(u.x, u.y, gx, gy) < 180 * 180) engage(u, tgt, dt, rng * .9, false);
      else goTo(u, gx, gy, dt, 1, 14);
      break;
    }
    case 'gatherer': gatherAI(u, L, dt, tgt); break;
    case 'tactical':
      if (u.hp < u.maxhp * .35) { const gp = B.unit || L; goTo(u, gp.x, gp.y, dt, 1.1, gp.r + u.r + 40); }
      else if (tgt && d2(tgt.x, tgt.y, L.x, L.y) < 1000 * 1000) engage(u, tgt, dt, rng * .9, true);
      else escortMove(u, L, dt, null);
      break;
    default: escortMove(u, L, dt, tgt);
  }
}

// ---------- récolteurs : butin au sol, caisses, puis cristaux et épaves abattus à distance ----------
const RES_TILES = { 4: 1, 5: 1 };
const gatherRanged = u => u.gRng !== undefined ? u.gRng : (u.gRng = u.mounts.reduce((m, mt) => { const w = mt.w, k = w.kind; return !SUPPORT_W[k] && k !== 'melee' && k !== 'chain' && !ARTILLERY[k] && k !== 'orbital' && k !== 'mortar' && k !== 'fusion' && k !== 'singularity' ? Math.max(m, w.range || 0) : m; }, 0));
function gatherAI(u, L, dt, tgt) {
  if (u.cargoMax <= 0 || u.cargoW >= u.cargoMax - .3) { if (u.gCrate) { u.gCrate.gBy = null; u.gCrate = null; } escortMove(u, L, dt, tgt); return; }
  if (tgt && d2(tgt.x, tgt.y, u.x, u.y) < 300 * 300) { engage(u, tgt, dt, u.engRange * .8, false); return; }
  // le pilote avance : le récolteur reste dans son sillage et ne ramasse que ce qui est sur le chemin
  u.lsp = lerp(u.lsp || 0, Math.hypot(L.vx || 0, L.vy || 0), Math.min(1, dt * 2)); const moving = u.lsp > 45;
  const leash = EXPSIM ? 420 : moving ? 520 : 950; if (d2(u.x, u.y, L.x, L.y) > leash * leash) { if (u.gCrate) { u.gCrate.gBy = null; u.gCrate = null; } goTo(u, L.x, L.y, dt, 1.2, EXPSIM ? 120 : 160); return; }
  if (moving && u.gCrate) { u.gCrate.gBy = null; u.gCrate = null; }
  u.gt = (u.gt || 0) - dt;
  if (u.gt <= 0) {
    u.gt = .7; u.gItem = null; u.gTile = null; let bd = (EXPSIM ? 380 : 620) ** 2;
    const free = u.cargoMax - u.cargoW;
    for (const it of items) { if (it.dead || it.t < .3) continue; const q = d2(it.x, it.y, u.x, u.y); if (q < bd && RES[it.res].w <= free && (!moving || d2(it.x, it.y, L.x, L.y) < 380 * 380)) { bd = q; u.gItem = it; } }
    // caisse proche, sans ennemi autour : le récolteur l'ouvre lui-même
    if (!u.gItem && !EXPSIM && !moving && state === 'raid' && (!u.gCrate || u.gCrate.open)) {
      if (u.gCrate) u.gCrate.gBy = null; u.gCrate = null; let cb = 560 * 560;
      for (const c of crates) { if (c.open || c.claimed || (c.gBy && c.gBy !== u && !c.gBy.dead)) continue; const q = d2(c.x, c.y, u.x, u.y); if (q < cb && d2(c.x, c.y, L.x, L.y) < 700 * 700) { let hot = false; query(c.x - 450, c.y - 450, c.x + 450, c.y + 450, v => { if (v.team !== 0 && !v.dead && !v.hidden && v.kind !== 'beacon2' && v.etype !== 'cible') hot = true; }); if (!hot) { cb = q; u.gCrate = c; } } }
      if (u.gCrate) { u.gCrate.gBy = u; u.gOpen = 0; }
    }
    if (!u.gItem && !u.gCrate) {
      const ctx_ = (u.x / TILE) | 0, cty = (u.y / TILE) | 0; let bt = 1e9;
      const gr = EXPSIM ? 6 : 9; for (let y = cty - gr; y <= cty + gr; y++) for (let x = ctx_ - gr; x <= ctx_ + gr; x++) {
        if (x < 0 || y < 0 || x >= WT || y >= WT) continue; const o = W.obs[y * WT + x];
        if (RES_TILES[o] && (!moving || d2(x * TILE, y * TILE, L.x, L.y) < 300 * 300)) { const q = (x - ctx_) ** 2 + (y - cty) ** 2; if (q < bt) { bt = q; u.gTile = [x, y]; } }
      }
    }
  }
  if (u.gItem && !u.gItem.dead) { goTo(u, u.gItem.x, u.gItem.y, dt, 1, 0); return; }
  if (u.gCrate && !u.gCrate.open) {
    const c = u.gCrate, dd = Math.hypot(c.x - u.x, c.y - u.y);
    if (dd > u.r + 46) { goTo(u, c.x, c.y, dt, 1, u.r + 30); u.gOpen = 0; return; }
    u.gOpen = (u.gOpen || 0) + dt; if (Math.random() < dt * 6) sparks(c.x, c.y, 2, '#f2c14e');
    if (u.gOpen >= 2.2) {
      if (LIVE.guest()) LIVE.openCrate(c);
      else { c.open = true; dropTable(CRATE_LOOT[c.type], c.x, c.y); SFX.play('open', .8, c.x, c.y); if (c.type === 'donnees' && raidStats) { raidStats.archives++; floatText(c.x, c.y - 20, TL('Archive de données'), '#7fa9ff'); } }
      c.gBy = null; u.gCrate = null; u.gt = 0;
    }
    return;
  }
  if (u.gTile) {
    const [x, y] = u.gTile; if (!W.obs[y * WT + x]) { u.gTile = null; u.gt = 0; return; }
    const cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2, dd = Math.hypot(cx - u.x, cy - u.y), rg = gatherRanged(u);
    // à distance de tir et sans mur entre les deux : on abat l'obstacle avec ses armes
    if (rg >= 120) {
      const want = Math.min(rg * .8, 320), bi = dd < want + 10 ? lofBlock(u.x, u.y, cx, cy, 20) : -2;
      if (dd > want + 10 || (bi >= 0 && bi !== y * WT + x && !lofCheap(W.obs[bi]))) goTo(u, cx, cy, dt, 1, Math.max(u.r + 30, Math.min(want, dd - 40)));
      else u.harvest = { tx: x, ty: y };
      return;
    }
    if (dd > u.r + 34) goTo(u, cx, cy, dt, 1, u.r + 26);
    else { u.harvest = { tx: x, ty: y }; hitTile(x, y, (30 + u.r) * dt); if (Math.random() < dt * 10) sparks(cx, cy, 2, '#ffd27a'); }
    return;
  }
  escortMove(u, L, dt, tgt);
}

// ---------- ennemis ----------
function enemyAI(e, dt) {
  if (e.baseRaid) { baseEnemyAI(e, dt); return; }
  e.tt -= dt;
  if (e.tt <= 0) {
    e.tt = .35 + Math.random() * .25;
    let t = pickTarget(e, e.sight * (1 + alertLv * .06) * (e.alerted ? 1.2 : 1) * (e.boss ? 1 : ENV.sightMul), false); // la nuit et la brume réduisent leur vue
    if (!t && e.target && !e.target.dead && !e.target.hidden && d2(e.x, e.y, e.target.x, e.target.y) < 1100 * 1100) t = e.target;
    if (!t && e.forced && !e.forced.dead && e.forced.team !== e.team) t = e.forced; // un objectif allié (générateur) est un point de ralliement, pas une cible
    e.target = t;
  }
  const t = e.target && !e.target.dead && !e.target.hidden ? e.target : null;
  if ((e.suicide || e.support) && foeSpecial(e, t, dt)) return;
  if (e.static) { if (t) e.ang = turnTo(e.ang, Math.atan2(t.y - e.y, t.x - e.x), dt); if (e.boss) bossExtra(e, dt, t); return; }
  if (e.human && t) e.ang = turnTo(e.ang, Math.atan2(t.y - e.y, t.x - e.x), dt * 8);
  if (e.boss) bossExtra(e, dt, t);
  if (e.giant) giantExtra(e, dt, t);
  if (t) {
    engage(e, t, dt, e.engRange * (e.etype === 'traqueur' || e.etype === 'essaim' ? .5 : .75), false);
    if (!e.hunter && !e.forced && !e.boss && d2(e.x, e.y, e.home.x, e.home.y) > 1900 * 1900) { e.target = null; e.alerted = false; }
  } else if (e.forced && !e.forced.dead) goTo(e, e.forced.x, e.forced.y, dt, 1, 120);
  else if (e.hunter) { const F = LIVE.game ? LIVE.nearestFocus(e.x, e.y) : focus(); goTo(e, F.x, F.y, dt, .95, 100); }
  else {
    e.wt = (e.wt || 0) - dt;
    if (!e.wp || e.wt <= 0) { e.wp = findWalkableNear(e.home.x, e.home.y, 40, 230, 8) || { x: e.home.x + rnd(-230, 230), y: e.home.y + rnd(-230, 230) }; e.wt = rnd(3, 6); }
    goTo(e, e.wp.x, e.wp.y, dt, e.roam && d2(e.x, e.y, e.home.x, e.home.y) > 400 * 400 ? .8 : .45, 12); // une cible traquée change de terrain d'un bon pas
  }
}

// ---------- équipes rivales ----------
function rivalAI(u, dt) {
  const cr = u.crew; if (!cr || cr.out) return;
  u.tt -= dt;
  if (u.tt <= 0) { u.tt = .4 + Math.random() * .2; u.target = pickTarget(u, (u.role === 'leader' ? 520 : 560) * Math.min(1.4, u.sightMul || 1), false); }
  const t = u.target && !u.target.dead && !u.target.hidden ? u.target : null;
  if (u.human && t) u.ang = turnTo(u.ang, Math.atan2(t.y - u.y, t.x - u.x), dt * 8);
  if (u.role === 'leader') {
    if (cr.state === 'anchor' && cr.beacon) { const b = cr.beacon; if (t && d2(t.x, t.y, b.x, b.y) < 700 * 700) engage(u, t, dt, u.engRange * .8, false); else goTo(u, b.x + 40, b.y + 40, dt, 1, 30); return; }
    if (t && d2(t.x, t.y, u.x, u.y) < 450 * 450) { engage(u, t, dt, u.engRange * .8, false); return; }
    if (cr.goal) goTo(u, cr.goal.x, cr.goal.y, dt, .85, 20);
    return;
  }
  if (u.abil && u.abil.length) autoAbilities(u, t);
  const anchor = cr.state === 'anchor' && cr.beacon && !cr.beacon.dead ? cr.beacon : cr.leader.dead ? null : cr.leader;
  if (!anchor) { if (t) engage(u, t, dt, u.engRange * .8, false); return; }
  if (t && d2(t.x, t.y, anchor.x, anchor.y) < 650 * 650) { engage(u, t, dt, u.engRange * .8, false); return; }
  const i = cr.bots.indexOf(u), a = i * 2.39996 + time * .05, rad = anchor.r + u.r + 50 + Math.sqrt(i) * 34;
  goTo(u, anchor.x + Math.cos(a) * rad, anchor.y + Math.sin(a) * rad, dt, d2(u.x, u.y, anchor.x, anchor.y) > 600 * 600 ? 1.2 : .9, 18);
}

// ---------- robots à la base ----------
function baseRobotAI(u, dt) {
  if (u.piloted) return;
  const o = u.order, fight = attack && attack.phase === 'fight';
  let tgt = null;
  if (fight) { u.tt -= dt; if (u.tt <= 0) { u.tt = .35; u.target = pickTarget(u, Math.max(650 * Math.min(1.4, u.sightMul || 1), u.r > 120 ? u.engRange + u.r : 0), false); } tgt = u.target && !u.target.dead ? u.target : null; autoAbilities(u, tgt); }
  if (o) {
    if (o.type === 'move') { if (goTo(u, o.x, o.y, dt, 1, 14 + u.r * .3)) nextWaypoint(u); return; }
    if (o.type === 'hold') { if (tgt && d2(tgt.x, tgt.y, o.x, o.y) < (u.engRange + 140) ** 2 && d2(u.x, u.y, o.x, o.y) < 170 * 170) engage(u, tgt, dt, u.engRange * .85, false); else goTo(u, o.x, o.y, dt, 1, 12); return; }
    if (o.type === 'attack') { if (!o.t || o.t.dead) u.order = null; else { u.target = o.t; engage(u, o.t, dt, u.engRange * .8, false); return; } }
    if (o.type === 'follow') { if (!fight) u.target = null; escortMove(u, focus(), dt, tgt); return; }
    u.order = null;
  }
  if (fight) {
    if (tgt && d2(tgt.x, tgt.y, u.home.x, u.home.y) < 1100 * 1100) { engage(u, tgt, dt, u.engRange * .8, u.brain === 'tactical'); return; }
    goTo(u, u.home.x, u.home.y, dt, 1, 30); return;
  }
  u.target = null;
  // de retour d'une course : il rentre à sa place par le chemin praticable
  if (d2(u.x, u.y, u.home.x, u.home.y) > 260 * 260) { goTo(u, u.home.x, u.home.y, dt, 1, 30); return; }
  u.wt = (u.wt || 0) - dt;
  if (!u.wp || u.wt <= 0) { u.wp = { x: u.home.x + rnd(-70, 70), y: u.home.y + rnd(-50, 50) }; u.wt = rnd(3, 9); }
  steer(u, u.wp.x, u.wp.y, dt, .3, 10);
}
