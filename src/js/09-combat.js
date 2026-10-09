// Combat : butin, dégâts, projectiles, montures, armes spéciales, tir fractionné et indicateurs de cible.

// ================= BUTIN =================
function spawnItem(res, amt, x, y) {
  if (amt <= 0) return;
  if (LIVE.guest()) { LIVE.drop(res, amt, x, y); return; }
  const a = Math.random() * TAU, s = rnd(30, 120);
  items.push({ res, amt, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, dead: false });
}
function dropTable(tab, x, y, mul = 1) {
  for (const [res, a, b, ch] of tab) {
    if (Math.random() > ch) continue;
    let n;
    if (res === 'heart') n = 1;
    else if (res === 'cores') n = Math.max(1, Math.round(rndi(a, b) * Math.min(diff.loot, 1.6) * mul));
    else n = Math.round(rndi(a, b) * diff.loot * mul * (regionCur !== null ? (REGIONS[regionCur].lootBias[res] || 1) : 1));
    spawnItem(res, n, x, y);
  }
}
function addCargo(u, res, amt) {
  const w = RES[res].w; const free = u.cargoMax - u.cargoW;
  const n = Math.min(amt, Math.floor(free / w + 1e-6)); if (n <= 0) return 0;
  u.cargo[res] = (u.cargo[res] || 0) + n; u.cargoW += n * w; return n;
}
function floatText(x, y, text, col) { parts.push({ type: 'text', x, y, vx: 0, vy: -38, life: 1.3, max: 1.3, text, col }); }
let fullWarnT = 0;
function updateItems(dt) {
  const F = focus(); const pl = player.hidden ? null : player;
  for (const it of items) {
    if (it.dead) continue;
    it.t += dt; it.x += it.vx * dt; it.y += it.vy * dt; it.vx *= Math.max(0, 1 - dt * 4); it.vy *= Math.max(0, 1 - dt * 4);
    // ramassage par le pilote (ou le robot piloté)
    const P = F; const reach = P.r + 26;
    const dd = d2(it.x, it.y, P.x, P.y);
    const w = RES[it.res].w; const free = P.cargoMax - P.cargoW;
    if (it.t > .35 && dd < (reach + 70) ** 2 && free >= w) { const d = Math.sqrt(dd) || 1; it.x += (P.x - it.x) / d * 300 * dt; it.y += (P.y - it.y) / d * 300 * dt; }
    if (it.t > .35 && dd < reach * reach) {
      if (LIVE.guest()) { // en raid partagé, l'hôte attribue le butin
        let who = free >= w ? P : null;
        if (!who) { let bd = 420 * 420; for (const r of fleet) { if (r.dead || r === P || r.cargoMax - r.cargoW < w) continue; const q = d2(r.x, r.y, P.x, P.y); if (q < bd) { bd = q; who = r; } } }
        if (who) LIVE.pick(it, who); else if (fullWarnT <= 0) { msg('Soute pleine : aucun robot de transport à portée.', '#f2c14e', 3); fullWarnT = 4; }
        continue;
      }
      let got = addCargo(P, it.res, it.amt);
      if (got > 0) { it.amt -= got; floatText(it.x, it.y - 10, '+' + got + ' ' + RES[it.res].n, RES[it.res].c); SFX.play('pickup', .7, undefined, undefined, { note: PICK_NOTE[it.res] || 880, chord: it.res === 'heart' || it.res === 'cores' }); if (it.res === 'heart') msg('Cœur de Colosse récupéré. Ramenez-le vivant.', '#ff8a5c', 8); }
      if (it.amt > 0) { // transfert vers le robot de soute le plus proche
        let best = null, bd = 420 * 420;
        for (const r of fleet) { if (r.dead || r === P || r.cargoMax - r.cargoW < w) continue; const q = d2(r.x, r.y, P.x, P.y); if (q < bd) { bd = q; best = r; } }
        if (best) { const g2 = addCargo(best, it.res, it.amt); if (g2 > 0) { it.amt -= g2; beams.push({ x1: it.x, y1: it.y, x2: best.x, y2: best.y, life: .3, max: .3, col: '#6fe3c8', w: 2 }); floatText(best.x, best.y - best.r - 8, '+' + g2 + ' ' + RES[it.res].n, '#6fe3c8'); } }
        else if (fullWarnT <= 0) { msg('Soute pleine : aucun robot de transport à portée.', '#f2c14e', 3); fullWarnT = 4; }
      }
      if (it.amt <= 0) it.dead = true;
    }
  }
  // récolteurs
  for (const r of fleet) {
    if (r.dead || r.brain !== 'gatherer' || r.piloted || r.cargoMax <= 0) continue;
    for (const it of items) {
      if (it.dead || it.t < .35) continue;
      if (d2(it.x, it.y, r.x, r.y) < (r.r + 18) ** 2 && LIVE.guest()) { if (r.cargoMax - r.cargoW >= RES[it.res].w) LIVE.pick(it, r); continue; }
      if (d2(it.x, it.y, r.x, r.y) < (r.r + 18) ** 2) { const g = addCargo(r, it.res, it.amt); if (g > 0) { it.amt -= g; floatText(r.x, r.y - r.r - 8, '+' + g + ' ' + RES[it.res].n, '#6fe3c8'); } if (it.amt <= 0) it.dead = true; }
    }
  }
  if (fullWarnT > 0) fullWarnT -= dt;
  if (!LIVE.game && items.length > 50 && Math.random() < .05) items = items.filter(i => !i.dead);
}

// ================= COMBAT =================
function shoot(x, y, a, spd, dmg, team, range, kind, col, pierce, src, splash, sc) {
  const b = { kind, x, y, px: x, py: y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, team, range, dist: 0, col, pierce: pierce || 0, hits: null, src, splash: splash || 0, sc: sc || 1, life: 0, homing: null, maxSpd: spd, vis: NETVIS };
  bullets.push(b); return b;
}
function muzzle(x, y, a, col, sc) { parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .06, max: .06, size: 7 * sc, col, a }); }
function fireMount(u, m, tx, ty, tgt) {
  const r = fireMount0(u, m, tx, ty, tgt);
  return r;
}
function fireMount0(u, m, tx, ty, tgt) {
  const w = m.w; u.lastFire = time; const nb0 = bullets.length;
  const res = fireMountCore(u, m, tx, ty, tgt, w);
  if (res !== false) { m.fc = ((m.fc || 0) + 1) & 255; m.td = Math.round(Math.hypot(tx - u.x, ty - u.y)); }
  if (w.slow || w.aa || w.pull || w.cluster) for (let i = nb0; i < bullets.length; i++) { const b = bullets[i]; b.slow = w.slow; b.aa = w.aa; b.pull = w.pull; b.cluster = w.cluster; }
  return res;
}
function fireMountCore(u, m, tx, ty, tgt, w) { const [mx, my] = mountWorldPos(u, m); const a = m.aim; const sc = u.mscale || 1;
  const spr = (u.kind === 'robot' && u.brain === 'tactical' && !u.piloted) ? .4 : 1;
  const mz = 13 * sc; const sx = mx + Math.cos(a) * mz, sy = my + Math.sin(a) * mz;
  const dmg = w.dmg;
  const vol = u.piloted ? .9 : u.team === 0 ? .4 : .5;
  switch (w.kind) {
    case 'bullet': case 'laser': { const n = w.pellets || 1; for (let i = 0; i < n; i++) shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread * spr, w.spd, dmg, u.team, w.range, w.kind, w.col, w.pierce || (w.kind === 'laser' ? 2 : 0), u, 0, sc); muzzle(sx, sy, a, w.col, sc); if (w.kind === 'bullet' && !u.human) FX.casing(mx, my, a, sc, (w.size || 1) >= 2); break; }
    case 'flame': for (let i = 0; i < 2; i++) shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread, w.spd * rnd(.8, 1.1), dmg, u.team, w.range, 'flame', w.col, 99, u, 0, sc); break;
    case 'shell': { const b = shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread * spr, w.spd, dmg, u.team, w.range, 'shell', w.col, 0, u, w.splash, sc); b.burn = w.burn; muzzle(sx, sy, a, '#ffe0a0', sc * 1.6); if (fxQ() !== 'low') for (let k = 0; k < 3; k++) parts.push({ type: 'smoke', x: sx + Math.cos(a) * 6, y: sy + Math.sin(a) * 6, vx: Math.cos(a) * rnd(30, 70) + ENV.wind.x * .3, vy: Math.sin(a) * rnd(30, 70) + ENV.wind.y * .3, life: rnd(.6, 1.1), max: 1.1, size: 4 * sc, col: '' }); FX.casing(mx, my, a, sc * 1.6, true); addShakeNear(sx, sy, 1.5 * sc * (w.splash > 120 ? 2 : 1)); break; }
    case 'plasma': { const b = shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread * spr, w.spd, dmg, u.team, w.range, 'plasma', w.col, w.pierce || 3, u, w.splash, sc); muzzle(sx, sy, a, w.col, sc * 1.4); break; }
    case 'rocket': {
      const n = w.salvo || 1;
      const ht = tgt && !tgt.dead ? tgt : null; // sans cible, l'autodirecteur en cherche une en vol
      for (let i = 0; i < n; i++) { const off = n > 1 ? (i - (n - 1) / 2) * .22 : 0; const b = shoot(sx, sy, a + off + (Math.random() - .5) * 2 * w.spread * spr, w.spd * .35, dmg, u.team, w.range, 'rocket', w.col, 0, u, w.splash, w.big ? sc * 1.8 : n > 1 ? sc * .6 : sc); b.homing = ht; b.maxSpd = w.spd; b.big = w.big; if (n > 1) b.wob = Math.random() * 6; }
      if (ht && u.team === 0 && (u.piloted || isMine(u)) && !NETVIS) SFX.play('lockon', .7);
      if (w.big) addShakeNear(sx, sy, 3); break;
    }
    case 'lob': case 'nuke': {
      const dx = tx - mx, dy = ty - my, dd = Math.hypot(dx, dy), rr2 = clamp(dd, w.minRange || 0, w.range), ang = Math.atan2(dy, dx), err = rr2 * (w.kind === 'nuke' ? .02 : .07) * spr;
      const fx = mx + Math.cos(ang) * rr2 + rnd(-err, err), fy = my + Math.sin(ang) * rr2 + rnd(-err, err);
      const nuke = w.kind === 'nuke';
      bullets.push({ kind: 'mortar', nuke, x: sx, y: sy, x0: sx, y0: sy, tx: fx, ty: fy, t: 0, T: nuke ? 2.6 + rr2 / 900 : .35 + rr2 / 900, arc: nuke ? 420 : w.arc, dmg, team: u.team, splash: w.splash, col: w.col, src: u, h: 0, sc: nuke ? sc * 1.6 : sc * .7, vis: NETVIS });
      muzzle(sx, sy, a, '#ffe0a0', sc); if (nuke && !NETVIS) { addShakeNear(sx, sy, 6); msg((w.n || 'Missile Aube') + ' lancé. Impact dans ' + Math.ceil(2.6 + rr2 / 900) + ' s.', '#fff1b0', 4); }
      break;
    }
    case 'singularity': {
      const dx = tx - mx, dy = ty - my, dd = Math.hypot(dx, dy), rr2 = clamp(dd, w.minRange || 0, w.range), ang = Math.atan2(dy, dx), fx = mx + Math.cos(ang) * rr2, fy = my + Math.sin(ang) * rr2;
      bullets.push({ kind: 'mortar', sing: { pullR: w.pullR, vt: w.vt }, x: sx, y: sy, x0: sx, y0: sy, tx: fx, ty: fy, t: 0, T: 1.4 + rr2 / 1400, arc: 520, dmg, team: u.team, splash: w.splash, col: w.col, src: u, h: 0, sc: sc * 1.2, vis: NETVIS });
      muzzle(sx, sy, a, w.col, sc * 1.5); addShakeNear(sx, sy, 5); break;
    }
    case 'chain': chainShot(u, sx, sy, tgt, w, dmg); break;
    case 'orbital': {
      const dx = tx - mx, dy = ty - my, dd = Math.hypot(dx, dy), rr2 = clamp(dd, w.minRange || 0, w.range), ang = Math.atan2(dy, dx), cx = mx + Math.cos(ang) * rr2, cy = my + Math.sin(ang) * rr2;
      for (let i = 0; i < w.strikes; i++) { const a2 = Math.random() * TAU, d3 = Math.sqrt(Math.random()) * (w.area || 280), px = cx + Math.cos(a2) * d3, py = cy + Math.sin(a2) * d3; bullets.push({ kind: 'mortar', drop: true, x: px, y: py, x0: px, y0: py, tx: px, ty: py, t: 0, T: 1 + i * (w.strikes > 12 ? .1 : .22), arc: 1000, dmg, team: u.team, splash: w.splash, col: w.col, src: u, h: 0, sc: w.splash > 200 ? 2.8 : 1.3, vis: NETVIS }); }
      muzzle(sx, sy, a, '#ffe6a8', sc); addShakeNear(sx, sy, 3); break;
    }
    case 'mortar': {
      const dx = tx - mx, dy = ty - my, dd = Math.hypot(dx, dy), rr2 = clamp(dd, w.minRange || 0, w.range), ang = Math.atan2(dy, dx), err = rr2 * .06 * spr;
      const fx = mx + Math.cos(ang) * rr2 + rnd(-err, err), fy = my + Math.sin(ang) * rr2 + rnd(-err, err);
      bullets.push({ kind: 'mortar', x: sx, y: sy, x0: sx, y0: sy, tx: fx, ty: fy, t: 0, T: .8 + rr2 / 650, dmg, team: u.team, splash: w.splash, col: w.col, src: u, h: 0, sc, burn: w.burn, vis: NETVIS });
      muzzle(sx, sy, a, '#ffe0a0', sc * 1.5); addShakeNear(sx, sy, 2.5); break;
    }
    case 'rail': rail(u, sx, sy, a, w.range, dmg, w.col); addShakeNear(sx, sy, 3); break;
    case 'melee': {
      if (!tgt || tgt.dead || tgt.hidden) return false;
      const reach = u.r + tgt.r + 18 * sc; if (d2(u.x, u.y, tgt.x, tgt.y) > reach * reach) return false;
      damage(tgt, dmg, u); sparks(lerp(u.x, tgt.x, .6), lerp(u.y, tgt.y, .6), 6, '#e8f0ff'); m.recoil = 1; SFX.play(w.snd || 'melee', vol, u.x, u.y, { size: w.size || 1, self: u.piloted && !u.net }); if (u.piloted && !u.net) buzz(12); return true;
    }
    default: return false;
  }
  m.recoil = 1;
  if (w.snd === 'flame') SFX.hold('f' + u.id + '_' + u.mounts.indexOf(m), 'flame', vol * .7, sx, sy);
  else if (w.snd) { SFX.play(w.snd, vol, sx, sy, { size: w.size || (u.mscale > 1.6 ? 2 : 1), self: u.piloted && !u.net }); if (u.piloted && !u.net && (w.size || 1) >= 2) buzz((w.size || 1) >= 3 ? 30 : 14); }
  return true;
}
function addShakeNear(x, y, v) { const F = focus(); const d = Math.hypot(x - F.x, y - F.y); if (d < 900) addShake(v * (1 - d / 900)); }
function sparks(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = rnd(80, 260); parts.push({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.12, .3), max: .3, size: 2, col }); } }
function rail(u, sx, sy, a, range, dmg, col) {
  const ca = Math.cos(a), sa = Math.sin(a); let len = range;
  for (let s = 0; s < range; s += 16) {
    const x = sx + ca * s, y = sy + sa * s, tx = (x / TILE) | 0, ty = (y / TILE) | 0;
    if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) { len = s; break; }
    const o = W.obs[ty * WT + tx]; if (o) { if (o >= 6) { hitTile(tx, ty, dmg); len = s; break; } hitTile(tx, ty, dmg * .5); }
  }
  const ex = sx + ca * len, ey = sy + sa * len, hits = [];
  query(Math.min(sx, ex) - 20, Math.min(sy, ey) - 20, Math.max(sx, ex) + 20, Math.max(sy, ey) + 20, v => {
    if (v.team === u.team || v.dead || v.hidden) return;
    const px = v.x - sx, py = v.y - sy, pr = clamp(px * ca + py * sa, 0, len), qx = sx + ca * pr - v.x, qy = sy + sa * pr - v.y;
    if (qx * qx + qy * qy < (v.r + 6) ** 2) hits.push(v);
  });
  for (const v of hits) damage(v, dmg, u);
  beams.push({ x1: sx, y1: sy, x2: ex, y2: ey, life: .4, max: .4, col, w: 2.5 * (u.mscale || 1) });
  sparks(ex, ey, 10, col);
}
function explode(x, y, rad, dmg, team, src, burn, pull) {
  if (burn) fires.push({ x, y, r: burn.r, t: burn.t, max: burn.t, dps: burn.dps * diffDmg(team), team, tick: 0, vis: NETVIS });
  const hits = [];
  query(x - rad, y - rad, x + rad, y + rad, v => { if (v.team === team || v.dead || v.hidden) return; const d = Math.hypot(v.x - x, v.y - y) - v.r; if (d < rad) hits.push([v, d]); });
  if (pull) { for (const [v] of hits) { if (v.static || v.boss || v.dead) continue; const dx = x - v.x, dy = y - v.y, dd = Math.hypot(dx, dy) || 1, pd = Math.min(dd * .6, 150); v.x += dx / dd * pd; v.y += dy / dd * pd; } parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .45, max: .45, size: rad * 1.4, col: '#b9a0ff', thin: true }); }
  for (const [v, d] of hits) {
    damage(v, dmg * (1 - clamp(d / rad, 0, 1) * .6), src);
    // souffle : repousse les unités légères
    if (!NETVIS && !v.dead && !v.static && !v.net && v.kind !== 'building' && v.kind !== 'beacon' && v.kind !== 'beacon2') { const dx = v.x - x, dy = v.y - y, dd = Math.hypot(dx, dy) || 1, push = clamp(dmg * (1 - clamp(d / rad, 0, 1)) * 2.2 / (v.r + 12), 0, 280) * (v.crush >= 3 ? .2 : 1); v.vx += dx / dd * push; v.vy += dy / dd * push; }
  }
  const tr = rad * .55, t0x = Math.floor((x - tr) / TILE), t1x = Math.floor((x + tr) / TILE), t0y = Math.floor((y - tr) / TILE), t1y = Math.floor((y + tr) / TILE);
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) if (d2(tx * TILE + 20, ty * TILE + 20, x, y) < (tr + 20) ** 2) hitTile(tx, ty, dmg * .7);
  boom(x, y, rad);
}
function boom(x, y, rad) {
  const big = rad > 90;
  parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .12, max: .12, size: rad * 1.1, col: '#fff2c8', a: 0 });
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .35, max: .35, size: rad, col: '#ffd9a0' });
  const lite = parts.length > 700 ? .4 : 1, nf = Math.min(26, 6 + rad / 6) * lite;
  for (let i = 0; i < nf; i++) { const a = Math.random() * TAU, s = rnd(20, rad * 2.2); parts.push({ type: 'fire', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.25, .55), max: .55, size: rnd(rad * .12, rad * .3) }); }
  for (let i = 0; i < Math.min(14, 4 + rad / 12) * lite; i++) { const a = Math.random() * TAU, s = rnd(10, rad * .8); parts.push({ type: 'smoke', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 15, life: rnd(1, 2.2), max: 2.2, size: rnd(rad * .2, rad * .45), col: 'rgba(60,56,52,' }); }
  sparks(x, y, 8, '#ffcf7a');
  decals.push({ x, y, r: rad * .55, a: rnd(0, 6) }); if (decals.length > 160) decals.shift();
  if (rad > 24) FX.dust(x, y, Math.min(9, 2 + rad / 18 | 0), rad * .3, rad * 1.1);
  addShakeNear(x, y, rad / 9);
  SFX.play('explo', clamp(rad / 90, .45, 1), x, y, { size: rad / 60 });
  if (player && (big || rad > 55)) { const F = focus(); if (d2(x, y, F.x, F.y) < 500 * 500) buzz(big ? 60 : 25); }
}
function damage(u, amt, src) {
  if (u.dead || u.hidden) return;
  if (NETVIS) return; // tir reproduit d'un autre joueur : c'est lui qui compte les dégâts
  if (u.net) { LIVE.hit(u, amt, src); u.hitFlash = .1; return; } // unité d'un autre joueur ou du monde de l'hôte

  if (u.kind === 'player' && u.inv > 0) return;
  if (u.jumping) return;
  if (u.dodge && Math.random() < u.dodge) { if (Math.random() < .3) floatText(u.x, u.y - u.r - 6, 'esquive', '#e8dcc4'); return; }
  if (u.kind === 'building' && src && src.siege) amt *= 3;
  if (u.fortifyOn) amt *= .75;
  amt *= 1 - (u.armor || 0); u.lastHurt = time;
  if (u.shield > 0) { const a = Math.min(u.shield, amt); u.shield -= a; amt -= a; u.shieldHit = .15; if (amt <= 0) { if (isMine(u)) SFX.play('shield', .6); return; } }
  if (u.etype === 'cible') { if (TUT.on && isMine(src)) { TUT.hits++; if (player.inside) TUT.pilotHits++; } u.hp -= amt; u.hitFlash = .1; u.lastHit = time; if (Math.random() < .3) floatText(u.x, u.y - 20, Math.round(amt) + '', '#e8dcc4'); if (u.hp <= 0) { u.hp = u.maxhp; boom(u.x, u.y, 30); } return; }
  u.hp -= amt; u.hitFlash = .1;
  if (TUT.on && u.kind === 'player' && u.hp <= 0 && state === 'raid') { u.hp = u.maxhp * .5; u.inv = 2.5; msg('Tutoriel : votre pilote aurait dû tomber ici. En vrai, tout ce qu\'il transporte serait perdu.', '#ec6b74', 7); return; }
  if (u.kind === 'player') { u.lastHurt = time; addShake(Math.min(7, amt * .25)); }
  if (isMine(u) && amt > .5) playerHurt(u, amt, src);
  if (u.kind === 'enemy' && src && src.team !== 1 && src.team !== undefined && !src.dead && !src.hidden && (!u.target || u.target.dead)) u.target = src;
  if (u.hp <= 0) kill(u, src);
}
function kill(u, src) {
  if (u.dead) return;
  if (state === 'base' && u.kind === 'player') { u.hp = u.maxhp; const sp = W.spawn; boom(u.x, u.y, 40); u.x = sp.x; u.y = sp.y; u.vx = u.vy = 0; u.inv = 3; msg('Pilote évacué vers le QG.', '#ec6b74', 4); return; }
  u.dead = true; u.hp = 0; u.sel = false;
  if (u.kind === 'building') { buildingDestroyed(u); return; }
  FX.wreck(u);
  const remote = !!(src && src.net); // abattu par un autre joueur : c'est lui qui est crédité
  if (remote && LIVE.game) LIVE.killNote(u, src);
  if ((u.kind === 'enemy' || u.kind === 'rival') && src && !remote) { creditKill(u, src); if (isMine(src)) { killMarkT = .4; SFX.play('kill', .7); } }
  if (u.kind === 'robot' && u.selfBoom) { const x = u.x, y = u.y, r = u.r, mh = u.maxhp; deferred.push(() => explode(x, y, r * 3 + 60, 150 + mh * .25, 0, null)); }
  const rad = Math.max(30, u.r * 2.2);
  if (u.kind !== 'player') boom(u.x, u.y, rad);
  if (u.r > 40) { const wt = EXPSIM, nb = Math.min(14, 4 + Math.floor(u.r / 90)); for (let k = 0; k < nb; k++) setTimeout(() => { if (state === 'raid' && EXPSIM === wt && !wt) boom(u.x + rnd(-u.r, u.r) * .8, u.y + rnd(-u.r, u.r) * .8, Math.min(u.r * .9, 260)); }, 180 + k * (u.r > 200 ? 170 : 220)); }
  if (u.kind === 'minion') return;
  if (u.kind === 'rival' || u.kind === 'beacon2') { rivalDown(u, src); return; }
  if (u.kind === 'enemy') {
    if (raidStats && !remote) { raidStats.kills++; raidStats.byType[u.etype] = (raidStats.byType[u.etype] || 0) + 1; }
    if (u.baseRaid) attackLoot(u); else dropTable(ENEMIES[u.etype].loot, u.x, u.y);
    if (u.elite && !remote) msg('Mastodonte abattu.', '#f2c14e');
    if (u.giant && !remote) { msg(ENEMIES[u.etype].n.toUpperCase() + ' EST ABATTU !', '#ff8a5c', 9); SFX.play('explo', 1, u.x, u.y, { size: 5, reach: 3 }); addShake(22); buzz([60, 40, 90]); }
    if (u.boss) {
      const coop = LIVE.game && LIVE.game.mode === 'coop', credit = !remote || coop, txt = ENEMIES[u.etype].n.toUpperCase() + ' EST TOMBÉ' + (u.etype === 'souverain' || u.etype === 'archonte' ? '. Son cœur gît dans le cratère.' : ' !');
      msg(txt, '#ff8a5c', 10); if (LIVE.game) LIVE.note(txt, '#ff8a5c', coop ? { boss: u.etype } : {});
      if (raidStats && credit && !raidStats.boss) { raidStats.boss = true; raidStats.bossType = u.etype; if (regionCur !== null) save.bossKills[regionCur] = (save.bossKills[regionCur] || 0) + 1; } SFX.play('explo', 1, u.x, u.y, { size: 5, reach: 3 }); SFX.play('success', .6); buzz([60, 40, 90]); addShake(25);
    }
  } else if (u.kind === 'robot') {
    for (const k in u.cargo) if (u.cargo[k] > 0) spawnItem(k, u.cargo[k], u.x, u.y);
    u.cargo = {}; u.cargoW = 0;
    msg(u.name + ' détruit. Son chargement est tombé au sol.', '#ec6b74'); if (raidStats) raidStats.lost++;
    if (player.inside === u) ejectPlayer(true);
    for (const m of u.mounts) for (const d of m.drones) if (!d.dead) { d.dead = true; boom(d.x, d.y, 20); }
  } else if (u.kind === 'beacon') {
    B.keep = (B.charge || 0) * .4; B.state = 'broken'; B.cd = 22; B.unit = null; msg('Balise détruite. Réimpression dans 22 s' + (B.keep >= .05 ? ' : elle gardera ' + Math.round(B.keep * 100) + ' % de la charge.' : '.'), '#ec6b74', 6); SFX.play('alarm', .8);
  } else if (u.kind === 'player') {
    boom(u.x, u.y, 50); SFX.play('death', 1); buzz([80, 60, 160]); endT = 2.4; endSuccess = false; msg('Signal du pilote perdu.', '#ec6b74', 6);
  }
}
function ejectPlayer(forced) {
  const u = player.inside; if (!u) return;
  player.inside = null; u.piloted = false; player.hidden = false;
  const a = u.ang + Math.PI; let px = u.x + Math.cos(a) * (u.r + 20), py = u.y + Math.sin(a) * (u.r + 20);
  const sp = findWalkableNear(u.x, u.y, u.r + 16, u.r + 60, 30); if (sp) { px = sp.x; py = sp.y; }
  player.x = px; player.y = py; player.vx = player.vy = 0; player.inv = .6;
  if (forced) { player.hp -= 15; msg('Éjection d\'urgence !', '#f2c14e'); if (player.hp <= 0) { player.hp = 1; } }
  else msg('Vous quittez ' + u.name + '.', '#a59c88', 3);
}

// ================= PROJECTILES =================
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; let dead = false;
    NETVIS = !!b.vis;
    if (b.kind === 'mortar') {
      b.t += dt;
      if (b.t >= b.T) {
        if (b.sing) singOpen(b); else if (b.nuke) nukeBoom(b.tx, b.ty, b.splash, b.dmg, b.team, b.src); else explode(b.tx, b.ty, b.splash, b.dmg, b.team, b.src, b.burn, b.pull);
        if (b.cluster) for (let i = 0; i < b.cluster; i++) bullets.push({ kind: 'mortar', x: b.tx, y: b.ty, x0: b.tx, y0: b.ty, tx: b.tx + rnd(-95, 95), ty: b.ty + rnd(-95, 95), t: 0, T: .3 + Math.random() * .3, arc: 40, dmg: b.dmg * .7, team: b.team, splash: b.splash * .75, col: b.col, src: b.src, h: 0, sc: .5, vis: b.vis });
        dead = true;
      }
      else {
        if (!b.wh && b.T - b.t < .9 && b.T > .7 && player && (b.drop || b.nuke || (b.team !== 0 && d2(b.tx, b.ty, focus().x, focus().y) < 520 * 520))) { b.wh = true; SFX.play('whistle', b.nuke ? 1 : .75, b.tx, b.ty, { dur: Math.max(.3, b.T - b.t), pitch: b.nuke ? .6 : 1 }); }
        const k = b.t / b.T; b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = b.drop ? (1 - k) * b.arc : Math.sin(k * Math.PI) * (b.arc || (90 + b.T * 120)); if (Math.random() < .4) parts.push({ type: 'smoke', x: b.x, y: b.y - b.h, vx: 0, vy: -5, life: .5, max: .5, size: 5, col: 'rgba(120,110,100,' }); }
    } else {
      b.life += dt;
      if (b.kind === 'rocket' && guideRocket(b, dt)) { bullets[i] = bullets[bullets.length - 1]; bullets.pop(); continue; }
      b.px = b.x; b.py = b.y;
      const sp = Math.hypot(b.vx, b.vy), steps = Math.max(1, Math.ceil(sp * dt / 14)), sdt = dt / steps;
      for (let s = 0; s < steps && !dead; s++) {
        b.x += b.vx * sdt; b.y += b.vy * sdt; b.dist += sp * sdt;
        const tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0;
        if (b.x < 0 || b.y < 0 || tx >= WT || ty >= WT) { dead = true; break; }
        const o = b.air ? 0 : W.obs[ty * WT + tx];
        if (o) {
          if (o === 8) hitBuildingTile(tx, ty, b.dmg * (b.kind === 'flame' ? .6 : 1), b.team, b.src);
          hitTile(tx, ty, b.dmg * (b.kind === 'flame' ? .6 : 1));
          if (b.splash) explode(b.x, b.y, b.splash, b.dmg, b.team, b.src, b.burn, b.pull); else if (b.kind !== 'flame') { sparks(b.x, b.y, 3, b.col); if (Math.random() < .35) FX.dust(b.x, b.y, 1, 6, 25); }
          dead = true; break;
        }
        const cell = cellAt(b.x, b.y);
        if (cell) for (let k = 0; k < cell.length; k++) {
          const v = cell[k]; if (v.team === b.team || v.dead || v.hidden) continue;
          const rr2 = v.r + (b.kind === 'flame' ? 6 : 3); if (d2(v.x, v.y, b.x, b.y) > rr2 * rr2) continue;
          if (b.hits && b.hits.has(v.id)) continue;
          if (b.splash && b.kind !== 'plasma') { explode(b.x, b.y, b.splash, b.dmg, b.team, b.src, b.burn, b.pull); dead = true; break; }
          damage(v, (b.kind === 'plasma' ? b.dmg * .6 : b.dmg) * (b.aa && v.fly ? b.aa : 1), b.src);
          if (b.slow && !v.dead) v.slowT = Math.max(v.slowT || 0, b.slow * (v.boss ? .4 : 1));
          if (b.kind === 'plasma') { parts.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: .25, max: .25, size: 30 * b.sc, col: b.col }); sparks(b.x, b.y, 6, b.col); }
          else if (b.kind !== 'flame') { sparks(b.x, b.y, 3, b.col); SFX.play(v.shield > 0 ? 'shield' : v.human || v.kind === 'player' ? 'hitsoft' : 'hit', .3, b.x, b.y); }
          if (!b.vis && isMine(b.src) && b.kind !== 'flame') { hitMarkT = .14; SFX.play('hitm', .45); }
          if (b.pierce > 0) { b.pierce--; if (!b.hits) b.hits = new Set(); b.hits.add(v.id); }
          else { dead = true; break; }
        }
      }
      if (!dead && b.dist >= b.range) { if (b.splash) explode(b.x, b.y, b.splash, b.dmg, b.team, b.src, b.burn, b.pull); else if ((b.kind === 'bullet' || b.kind === 'shell') && Math.random() < .5) FX.dust(b.x, b.y, 1 + (b.kind === 'shell' ? 2 : 0), 5 + (b.sc || 1) * 2, 30); dead = true; }
    }
    if (dead) { bullets[i] = bullets[bullets.length - 1]; bullets.pop(); }
  }
  NETVIS = false;
}

// ================= MONTURES =================
function camKick(a, k) { if (settings.shake <= 0) return; cam.kx = (cam.kx || 0) - Math.cos(a) * k; cam.ky = (cam.ky || 0) - Math.sin(a) * k; }
function repairTick(u, m, dt, mx, my) {
  m.rt -= dt;
  if (m.rt <= 0) {
    m.rt = .4; m.tgt = null; let best = .98; const R2 = m.w.range * m.w.range;
    const cands = fleet.concat(player.hidden ? [] : [player]);
    for (const v of cands) { if (v === u || v.dead || v.hidden) continue; const f = v.hp / v.maxhp; if (f < best && d2(v.x, v.y, u.x, u.y) < R2) { best = f; m.tgt = v; } }
  }
  const v = m.tgt;
  if (v && !v.dead && !v.hidden && v.hp < v.maxhp) {
    m.aim = turnTo(m.aim, Math.atan2(v.y - my, v.x - mx), 6 * dt);
    v.hp = Math.min(v.maxhp, v.hp + m.w.heal * dt * (v.kind === 'player' ? .8 : 1) * (1 + (u.tier || 1) * .35));
    beams.push({ x1: mx, y1: my, x2: v.x, y2: v.y, life: dt * 1.5, max: dt * 1.5, col: '#6fe3c8', w: 1.5, heal: true });
    SFX.play('heal', .3, mx, my);
  }
}

// ================= MÉCANIQUES D'ARMES SPÉCIALES =================
function diffDmg(team) { return team === 1 ? diff.dmg : 1; }
function zig(x1, y1, x2, y2, n, amp) { const pts = [[x1, y1]]; for (let i = 1; i < n; i++) { const k = i / n, nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1, o = rnd(-amp, amp); pts.push([lerp(x1, x2, k) + nx / l * o, lerp(y1, y2, k) + ny / l * o]); } pts.push([x2, y2]); return pts; }
function chainShot(u, sx, sy, tgt, w, dmg) {
  if (!tgt || tgt.dead) return;
  let cur = tgt, px = sx, py = sy; const hit = new Set();
  for (let k = 0; k <= (w.chain || 3) && cur; k++) {
    beams.push({ pts: zig(px, py, cur.x, cur.y, 7, 10), life: .18, max: .18, col: w.col, w: w.chain > 4 ? 3 : 2 });
    hit.add(cur.id); const cx = cur.x, cy = cur.y; damage(cur, dmg, u); sparks(cx, cy, 4, w.col);
    px = cx; py = cy; let next = null, bd = (w.chainR || 160) ** 2;
    const R = w.chainR || 160;
    query(px - R, py - R, px + R, py + R, v => { if (v.team === u.team || v.dead || v.hidden || hit.has(v.id)) return; const q = d2(px, py, v.x, v.y); if (q < bd) { bd = q; next = v; } });
    cur = next; dmg *= .85;
  }
}
function beamTick(u, m, dt, mx, my, w) {
  if (time - (m.fcT || 0) > .1) { m.fcT = time; m.fc = ((m.fc || 0) + 1) & 255; }
  const a = m.aim, ca = Math.cos(a), sa = Math.sin(a), sc = u.mscale || 1, mz = 14 * sc;
  const sx = mx + ca * mz, sy = my + sa * mz; let len = w.range, hitU = null;
  for (let s = 0; s < w.range; s += 14) {
    const x = sx + ca * s, y = sy + sa * s, tx = (x / TILE) | 0, ty = (y / TILE) | 0;
    if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) { len = s; break; }
    if (W.obs[ty * WT + tx] && !u.fly) { if (W.obs[ty * WT + tx] === 8) hitBuildingTile(tx, ty, w.dps * dt, u.team, u); hitTile(tx, ty, w.dps * dt * 1.5); len = s; break; }
    const cell = cellAt(x, y);
    if (cell) { for (const v of cell) { if (v.team === u.team || v.dead || v.hidden) continue; if (d2(v.x, v.y, x, y) < (v.r + 6) ** 2) { hitU = v; break; } } }
    if (hitU) { len = s; break; }
  }
  if (hitU) damage(hitU, w.dps * dt * diffDmg(u.team), u);
  const ex = sx + ca * len, ey = sy + sa * len;
  beams.push({ x1: sx, y1: sy, x2: ex, y2: ey, life: dt * 1.6, max: dt * 1.6, col: w.col, w: 4 * sc * .7 * (w.bw || 1), hot: true }); u.lastFire = time;
  if (Math.random() < dt * 30) parts.push({ type: 'fire', x: ex, y: ey, vx: rnd(-40, 40), vy: rnd(-40, 40), life: .25, max: .25, size: 6 * sc * .6 });
  SFX.hold('b' + u.id + '_' + u.mounts.indexOf(m), 'beam', u.piloted ? .55 : .4, sx, sy); m.recoil = .3;
}
function fusionShot(u, m, mx, my, w) {
  const a = m.aim, ca = Math.cos(a), sa = Math.sin(a), sc = u.mscale || 1, sx = mx + ca * 30 * sc, sy = my + sa * 30 * sc, R = w.width;
  let len = w.range;
  for (let s = 0; s < w.range; s += 20) {
    const x = sx + ca * s, y = sy + sa * s;
    if (x < 0 || y < 0 || x >= WPX || y >= WPX) { len = s; break; }
    for (let ox = -R; ox <= R; ox += 20) { const px = x - sa * ox, py = y + ca * ox, tx = (px / TILE) | 0, ty = (py / TILE) | 0; if (tx >= 0 && ty >= 0 && tx < WT && ty < WT) { const o = W.obs[ty * WT + tx]; if (o && o < 7) destroyTile(tx, ty, o, null); } }
  }
  const ex = sx + ca * len, ey = sy + sa * len, hits = [];
  query(Math.min(sx, ex) - R, Math.min(sy, ey) - R, Math.max(sx, ex) + R, Math.max(sy, ey) + R, v => {
    if (v.team === u.team || v.dead || v.hidden) return;
    const px = v.x - sx, py = v.y - sy, pr = clamp(px * ca + py * sa, 0, len), qx = sx + ca * pr - v.x, qy = sy + sa * pr - v.y;
    if (qx * qx + qy * qy < (v.r + R) ** 2) hits.push(v);
  });
  for (const v of hits) damage(v, w.dmg * diffDmg(u.team), u);
  beams.push({ x1: sx, y1: sy, x2: ex, y2: ey, life: .7, max: .7, col: w.col, w: R * 1.2, fusion: true });
  for (let k = 0; k < 14; k++) { const t2 = Math.random(); boomLite(lerp(sx, ex, t2), lerp(sy, ey, t2), R * 1.2); }
  if (NETVIS) addShakeNear(sx, sy, 16); else addShake(16); SFX.play('fusion', 1, sx, sy); SFX.play('explo', .8, ex, ey, { size: 3 }); if ((u.piloted && !u.net) || isMine(u)) buzz([40, 30, 80]); m.recoil = 1;
}
function boomLite(x, y, rad) {
  for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, s = rnd(20, rad * 1.5); parts.push({ type: 'fire', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.3, .6), max: .6, size: rnd(rad * .2, rad * .4) }); }
  parts.push({ type: 'smoke', x, y, vx: rnd(-20, 20), vy: -15, life: 1.6, max: 1.6, size: rad * .5, col: 'rgba(60,56,52,' });
  decals.push({ x, y, r: rad * .5, a: 0 }); if (decals.length > 220) decals.shift();
}
function nukeBoom(x, y, rad, dmg, team, src) {
  explode(x, y, rad, dmg, team, src);
  for (let k = 0; k < 4; k++) parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .6 + k * .35, max: .6 + k * .35, size: rad * (1.2 + k * .5), col: k ? '#ffd9a0' : '#ffffff' });
  for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, d = rnd(.2, .9) * rad; boomLite(x + Math.cos(a) * d, y + Math.sin(a) * d, rad * .25); }
  fires.push({ x, y, r: rad * .55, t: 8, max: 8, dps: 40, team, tick: 0 });
  flashT = 1; addShake(40); SFX.play('nuke', 1, x, y); buzz([120, 60, 220]);
}
let flashT = 0;
function shieldTick(u, m, dt) {
  if (state === 'base') return;
  const w = m.w, R2 = w.range * w.range;
  const list = u.team === 0 ? fleet.concat(player.hidden ? [] : [player]) : [u];
  for (const v of list) { if (v.dead || v.hidden) continue; if (d2(v.x, v.y, u.x, u.y) > R2) continue; v.shieldMax = Math.max(v.shieldMax || 0, w.cap); v.shield = Math.min(w.cap, (v.shield || 0) + w.regen * dt); v.shieldT = time; }
}
function bayTick(u, m, dt, mx, my) {
  const w = m.w; m.drones = m.drones.filter(d => !d.dead);
  if (m.drones.length < w.max && m.cd <= 0) {
    const D = w.drone ? DRONES[w.drone] : null, hp0 = (D ? D.hp : 45) * (u.team === 1 ? diff.hp : 1);
    const d = baseUnit({ kind: 'minion', team: u.team, x: mx, y: my, r: D ? D.r : 8, maxhp: hp0, hp: hp0, spd: D ? D.spd : 270, fly: true, owner: u, mscale: D ? D.sc : .7, active: true, mpaint: D ? D.paint : null, sight: D ? D.sight : 450, leash: D ? D.leash : 700, eng: D ? D.eng : 160 });
    d.mounts = [D ? makeMount(D.wid, scaledWeapon(D.wid, { dmg: 1, range: 1, spread: 1, turn: 1 }), D.r * .5, 0) : makeMount('mg_mini', WEAPONS.mg_mini, 3, 0)]; d.engRange = D ? 600 : 300;
    units.push(d); m.drones.push(d); m.cd = 1 / w.rate; SFX.play('drone', .5, mx, my);
  }
}
function minionAI(d, dt) {
  const o = d.owner; if (!o || o.dead) { kill(d); return; }
  d.tt -= dt; if (d.tt <= 0) { d.tt = .35; d.target = state === 'base' ? null : findTarget(d, d.sight || 450); if (d.target && d2(d.target.x, d.target.y, o.x, o.y) > (d.leash || 700) ** 2) d.target = null; }
  const t = d.target && !d.target.dead && !d.target.hidden ? d.target : null;
  if (t) engage(d, t, dt, d.eng || 160, false);
  else { const a = time * 1.6 + d.id; steer(d, o.x + Math.cos(a) * (o.r + 40), o.y + Math.sin(a) * (o.r + 40), dt, .9, 8); }
}
function updateFires(dt) {
  for (let i = fires.length - 1; i >= 0; i--) {
    const f = fires[i]; f.t -= dt; f.tick -= dt;
    if (f.t <= 0) { if (f.vortex) singCollapse(f); fires.splice(i, 1); continue; }
    if (f.vortex) { singTick(f, dt); continue; }
    if (Math.random() < dt * f.r * .25) parts.push({ type: 'fire', x: f.x + rnd(-f.r, f.r) * .8, y: f.y + rnd(-f.r, f.r) * .8, vx: rnd(-10, 10), vy: -rnd(20, 50), life: .5, max: .5, size: rnd(6, 14) });
    if (f.tick <= 0 && !f.vis) {
      f.tick = .25; const hits = [];
      query(f.x - f.r, f.y - f.r, f.x + f.r, f.y + f.r, v => { if (v.team !== f.team && !v.dead && !v.hidden && !v.fly && d2(v.x, v.y, f.x, f.y) < (f.r + v.r) ** 2) hits.push(v); });
      for (const v of hits) damage(v, f.dps * .25, null);
      if (Math.random() < .3) { const tx = ((f.x + rnd(-f.r, f.r)) / TILE) | 0, ty = ((f.y + rnd(-f.r, f.r)) / TILE) | 0; if (tx >= 0 && ty >= 0 && tx < WT && ty < WT && W.obs[ty * WT + tx] === 1) hitTile(tx, ty, 15); }
    }
  }
}

// ================= TIR SÉPARÉ, VERROUILLAGE, INDICATEURS DE CIBLE =================
// Chaque affût peut viser sa propre cible : en pilotage (affût réglé sur « auto ») et pour les robots en tir fractionné.
// Sans tir fractionné, un affût qui ne peut pas atteindre la cible du robot tire sur ce qui passe à sa portée.
const SUPPORT_W = { repair: 1, shield: 1, bay: 1 };
const isSupportW = id => !!(WEAPONS[id] && SUPPORT_W[WEAPONS[id].kind]);
function wRole(w) {
  if (w.aa) return 'aa';
  if ((w.size || 1) >= 5 && !SUPPORT_W[w.kind] && w.kind !== 'flame' && w.kind !== 'chain') return 'titan';
  if (ARTILLERY[w.kind] || w.kind === 'orbital' || w.kind === 'mortar') return 'art';
  if (w.kind === 'melee') return 'melee';
  if (w.big || (w.size || 1) >= 3 || w.kind === 'rail' || w.kind === 'shell' || w.kind === 'fusion' || w.kind === 'plasma' || w.kind === 'beam' || (w.kind === 'rocket' && (w.splash || 0) >= 70)) return 'heavy';
  return 'light';
}
const W_ROLE_TXT = { aa: 'antiaérien', art: 'artillerie', melee: 'contact', heavy: 'antiblindé', light: 'anti-infanterie', titan: 'anti-géant' };
function mountReach(u, m, t) {
  const w = m.w, p = mountWorldPos(u, m), d = Math.hypot(t.x - p[0], t.y - p[1]);
  if (w.kind === 'melee') return d <= u.r + t.r + 18 * u.mscale + 8;
  return d <= (w.range || 400) + t.r && d >= (w.minRange || 0);
}
function mountTarget(u, m, dt, base, cap) {
  m.tt2 = (m.tt2 || 0) - dt;
  const t = m.tgt2;
  if (t && (t.dead || t.hidden || !mountReach(u, m, t))) m.tgt2 = null;
  if (m.tt2 <= 0 || !m.tgt2) { m.tt2 = .28 + Math.random() * .14; m.tgt2 = pickMountTarget(u, m, base, cap); }
  return m.tgt2;
}
// cible sous le curseur (ou dans l'axe de visée) pour les tirs guidés manuels
function cursorTarget(team, rad = 95) {
  let t = null, bd = rad * rad;
  query(mouse.wx - rad - 60, mouse.wy - rad - 60, mouse.wx + rad + 60, mouse.wy + rad + 60, v => {
    if (v.team === team || v.dead || v.hidden || v.etype === 'cible' || (team === 0 && v.team === 0)) return;
    const q = d2(v.x, v.y, mouse.wx, mouse.wy) - v.r * v.r; if (q < bd) { bd = q; t = v; }
  });
  return t;
}
// autodirecteur : cherche une cible devant le missile quand la sienne disparaît
function seekTarget(b) {
  const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, R = 460, cx = b.x + ux * 220, cy = b.y + uy * 220;
  let best = null, bs = Infinity;
  query(cx - R, cy - R, cx + R, cy + R, v => {
    if (v.team === b.team || v.dead || v.hidden || v.etype === 'cible' || (b.team === 0 && v.team === 0) || v.kind === 'beacon' && b.team === 0) return;
    const dx = v.x - b.x, dy = v.y - b.y, d = Math.hypot(dx, dy); if (d < 1 || d > 620) return;
    const cos = (dx * ux + dy * uy) / d; if (cos < .45) return;
    const s = d * (2 - cos); if (s < bs) { bs = s; best = v; }
  });
  return best;
}
function detonate(b, T) {
  if (b.splash) explode(b.x, b.y, b.splash, b.dmg, b.team, b.src, b.burn, b.pull);
  else if (T && !T.dead) { damage(T, b.dmg, b.src); sparks(b.x, b.y, 6, b.col); }
}
// guidage : navigation proportionnelle vers le point d'interception, virage limité, fusée de proximité
function guideRocket(b, dt) {
  let sp = Math.hypot(b.vx, b.vy); sp = Math.min(b.maxSpd, sp + (b.big ? 320 : 950) * dt);
  let a = Math.atan2(b.vy, b.vx), T = b.homing;
  if (T && (T.dead || T.hidden)) { T = b.homing = null; b.rt = 0; }
  if (!T && b.life > .15 && !b.blind) { b.rt = (b.rt || 0) - dt; if (b.rt <= 0) { b.rt = .18; T = b.homing = seekTarget(b); } }
  let boom = false;
  if (T && b.life > (b.big ? .3 : .1)) {
    // les missiles ennemis tournent moins et n'anticipent presque pas : on peut encore les esquiver
    const foe = b.team !== 0, dx = T.x - b.x, dy = T.y - b.y, d = Math.hypot(dx, dy) || 1, tgo = d / Math.max(220, sp), lead = foe ? .3 : .9;
    const px = T.x + (T.vx || 0) * tgo * lead, py = T.y + (T.vy || 0) * tgo * lead, los = Math.atan2(py - b.y, px - b.x);
    // le virage se resserre quand le missile est lent ou tout près, sans jamais tourner en rond
    const turn = (b.big ? 1.7 : 4.6) * (foe ? .55 : 1) * clamp(560 / Math.max(240, sp), .65, 1.7) * (d < 160 ? 1.6 : 1);
    a = turnTo(a, los, turn * dt);
    if (b.wob) a += Math.sin(b.life * 11 + b.wob) * Math.max(0, .5 - b.life) * 2.2 * dt * 4;
    const reach = T.r + 8 + (b.splash ? Math.min(30, b.splash * .2) : 0);
    if (d < reach || (b.prevD !== undefined && d > b.prevD && b.prevD < T.r + 46)) boom = true; // explose au plus près
    b.prevD = d;
    if (!b.vis && b.team === 0) T.lockT = time; else if (!b.vis && T && (T === player || T === player.inside || (B && T === B.unit))) T.inbound = time;
  }
  b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
  // traînée régulière, quelle que soit la cadence d'images
  b.trail = (b.trail || 0) + sp * dt;
  const step = b.big ? 12 : 22, sc = Math.min(1.6, b.sc || 1);
  while (b.trail > step && parts.length < 880) {
    b.trail -= step; const k = b.trail / sp;
    parts.push({ type: 'smoke', x: b.x - b.vx * k + rnd(-1.5, 1.5), y: b.y - b.vy * k + rnd(-1.5, 1.5), vx: rnd(-6, 6) + ENV.wind.x * .2, vy: rnd(-6, 6) + ENV.wind.y * .2, life: b.big ? 1.4 : .75, max: b.big ? 1.4 : .75, size: (b.big ? 6 : 3.4) * sc, col: '' });
  }
  if (boom) { detonate(b, T); return true; }
  return false;
}

// ---------- affichage : qui vise qui ----------
const tgtMode = () => settings.tgt === 'off' || settings.tgt === 'basic' ? settings.tgt : 'full';
function bracket(c, x, y, r, col, a, lw) {
  const s = Math.max(6, r * .45); c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = lw; c.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.moveTo(x + sx * r, y + sy * (r - s)); c.lineTo(x + sx * r, y + sy * r); c.lineTo(x + sx * (r - s), y + sy * r); }
  c.stroke(); c.globalAlpha = 1;
}
function drawTargets(c, vis, vx0, vy0, vx1, vy1) {
  const mode = tgtMode(); if (mode === 'off' || state === 'title') return;
  const z = cam.zoom, lw = 1.8 / z, inV = v => v.x + v.r > vx0 && v.x - v.r < vx1 && v.y + v.r > vy0 && v.y - v.r < vy1;
  const tg = new Map(), sel = fleet.some(r => r.sel && !r.dead), pil = player && player.inside;
  const add = (t, k, mi) => { if (!t || t.dead || t.hidden || t.team === 0) return; let e = tg.get(t); if (!e) tg.set(t, e = { n: 0, mine: false, m: [] }); if (k === 'r') e.n++; if (k === 'p') e.mine = true; if (mi !== undefined) e.m.push(mi + 1); };
  for (const r of fleet) {
    if (r.dead || r.net) continue;
    if (r.piloted) { r.mounts.forEach((m, i) => { if (r.wm && r.wm[i] === 'a' && m.tgt2) add(m.tgt2, 'p', i); }); continue; }
    if (mode === 'basic' && !r.sel) continue;
    add(r.target, 'r'); if (r.split || mode === 'full') for (const m of r.mounts) if (m.tgt2 && m.tgt2 !== r.target && !SUPPORT_W[m.w.kind]) add(m.tgt2, 'r');
  }
  // cible désignée par le curseur en pilotage
  if (pil || (!player.hidden && player && (state === 'raid' || state === 'assault'))) { const ct = cursorTarget(0, 70); if (ct) { let e = tg.get(ct); if (!e) tg.set(ct, e = { n: 0, mine: false, m: [] }); e.cur = true; } }
  c.save(); c.font = `700 ${11 / z}px ${FONT}`; c.textAlign = 'left';
  for (const [t, e] of tg) {
    if (!inV(t)) continue;
    const r = t.r + 7 / z + 3, lock = time - (t.lockT || -9) < .25;
    bracket(c, t.x, t.y, r, e.cur ? '#ffffff' : COL.ally, e.cur ? .9 : .75, lw);
    let lbl = e.n > 1 ? '×' + e.n : ''; if (e.m.length) lbl = (lbl ? lbl + ' · ' : '') + 'affût ' + e.m.join(', ');
    if (lbl) { c.fillStyle = COL.ally; c.globalAlpha = .9; c.fillText(lbl, t.x + r + 3 / z, t.y - r + 9 / z); c.globalAlpha = 1; }
    if (e.cur) { c.fillStyle = '#ffffff'; c.globalAlpha = .9; c.textAlign = 'center'; const nm = t.kind === 'enemy' ? ENEMIES[t.etype].n : t.kind === 'rival' ? (t.crew ? t.crew.name : 'Rival') : t.kind === 'beacon2' ? 'Balise rivale' : t.name || ''; c.fillText(nm + ' · ' + Math.ceil(t.hp) + ' PV', t.x, t.y + r + 13 / z); c.textAlign = 'left'; c.globalAlpha = 1; }
    if (lock) { c.save(); c.translate(t.x, t.y); c.rotate(time * 3); c.strokeStyle = '#ff8a3d'; c.lineWidth = 2 / z; const q = r + 6 / z; c.beginPath(); c.moveTo(0, -q); c.lineTo(q, 0); c.lineTo(0, q); c.lineTo(-q, 0); c.closePath(); c.stroke(); c.restore(); }
  }
  // missiles amis verrouillés sur une cible que personne d'autre ne vise
  for (const b of bullets) { if (b.kind !== 'rocket' || b.vis || b.team !== 0 || !b.homing || tg.has(b.homing) || !inV(b.homing)) continue; const t = b.homing, q = t.r + 12 / z; c.save(); c.translate(t.x, t.y); c.rotate(time * 3); c.strokeStyle = '#ff8a3d'; c.lineWidth = 2 / z; c.beginPath(); c.moveTo(0, -q); c.lineTo(q, 0); c.lineTo(0, q); c.lineTo(-q, 0); c.closePath(); c.stroke(); c.restore(); tg.set(t, { n: 0, m: [] }); }
  // mode tactique : un trait de chaque robot vers sa cible
  if (tactical || (pil && mode === 'full')) {
    c.setLineDash([5 / z, 7 / z]); c.lineWidth = 1.2 / z;
    for (const r of fleet) {
      if (r.dead || r.net) continue;
      if (r.piloted) { r.mounts.forEach((m, i) => { if (r.wm && r.wm[i] === 'a' && m.tgt2 && !m.tgt2.dead) { const p = mountWorldPos(r, m); c.strokeStyle = '#ff8a3d'; c.globalAlpha = .55; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(m.tgt2.x, m.tgt2.y); c.stroke(); } }); continue; }
      if (!tactical || (sel && !r.sel)) continue;
      const t = r.target; if (!t || t.dead || t.hidden) continue;
      c.strokeStyle = COL.ally; c.globalAlpha = .35; c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(t.x, t.y); c.stroke();
    }
    c.setLineDash([]); c.globalAlpha = 1;
  }
  // ennemis qui visent le pilote, le robot piloté ou la balise
  const me = player.inside || player;
  for (const u of vis) {
    if (u.dead || u.team === 0 || !u.target || u.kind === 'building') continue;
    const t = u.target; if (t !== me && t !== player && !(B && t === B.unit) && !(EXPSIM && t.kind === 'robot' && t.team === 0)) continue;
    const y = u.y - u.r - 16 / z - (u.fly ? 6 : 0), s = 6 / z, p = .6 + .4 * Math.sin(time * 8);
    c.fillStyle = t === (B && B.unit) ? '#f2c14e' : COL.enemy; c.globalAlpha = p;
    c.beginPath(); c.moveTo(u.x - s, y - s); c.lineTo(u.x + s, y - s); c.lineTo(u.x, y + s * .4); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  // missiles ennemis guidés vers vous : cercle rouge autour du projectile
  for (const b of bullets) { if (b.kind !== 'rocket' || b.team === 0 || !b.homing || (b.homing !== me && b.homing !== player)) continue; if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue; c.strokeStyle = COL.enemy; c.lineWidth = 2 / z; c.globalAlpha = .6 + .4 * Math.sin(time * 14); circ(c, b.x, b.y, 12 / z + 4); c.stroke(); c.globalAlpha = 1; }
  c.restore();
}
// alerte missile : texte, flèches et bip quand un missile ennemi est guidé sur vous
let lockWarnT = 0, lockTone = 0;
function drawThreatHUD(c) {
  if (tgtMode() === 'off' || !player || (state !== 'raid' && state !== 'assault' && state !== 'base')) return;
  const me = player.inside || player; let n = 0; const dirs = [];
  for (const b of bullets) { if (b.kind !== 'rocket' || b.team === 0 || b.vis || (b.homing !== me && b.homing !== player)) continue; n++; if (dirs.length < 6) dirs.push(Math.atan2(b.y - me.y, b.x - me.x)); }
  if (!n) { lockWarnT = 0; return; }
  lockWarnT += frameDt; lockTone -= frameDt; if (lockTone <= 0) { lockTone = .55; SFX.play('lockwarn', .9); }
  const P = worldToScreen(me.x, me.y), ui = uiScale(), R = Math.max(80, me.r * cam.zoom + 60) / ui;
  const px = P.x / ui, py = P.y / ui, p = .55 + .45 * Math.sin(time * 16);
  c.save(); c.globalAlpha = p; c.fillStyle = COL.enemy; c.font = `800 14px ${FONT}`; c.textAlign = 'center';
  c.fillText(n > 1 ? n + ' MISSILES VERROUILLÉS' : 'MISSILE VERROUILLÉ', px, py - R - 10);
  for (const a of dirs) { c.save(); c.translate(px + Math.cos(a) * R, py + Math.sin(a) * R); c.rotate(a); c.beginPath(); c.moveTo(16, 0); c.lineTo(-4, -10); c.lineTo(-4, 10); c.closePath(); c.fill(); c.restore(); }
  c.restore();
}
// ---------- armes du robot piloté : mode manuel ou automatique, affût par affût ----------
let hudWRows = [];
function pilotWeaponRows(u) { return u.mounts.map((m, i) => ({ m, i, sup: !!SUPPORT_W[m.w.kind], auto: !!(u.wm && u.wm[i] === 'a') })); }
function drawPilotWeapons(c, x, yBottom, w) {
  hudWRows = []; const u = player && player.inside; if (!u || !u.mounts.length) return yBottom;
  const rows = pilotWeaponRows(u), compact = TOUCH.on, rh = compact ? 22 : 18;
  if (compact) {
    // tactile : une rangée de pastilles à toucher
    // beaucoup d'armes (géants) : plusieurs rangées de pastilles
    const per = Math.min(rows.length, 7), nr = Math.ceil(rows.length / per), bw = Math.min(64, (w - 8) / per - 4);
    panel(c, x, yBottom, w, nr * (rh + 4) + 4);
    rows.forEach((r, k) => {
      const xx = x + 4 + (k % per) * (bw + 4), y = yBottom + 4 + Math.floor(k / per) * (rh + 4);
      c.fillStyle = r.sup ? 'rgba(111,227,200,.15)' : r.auto ? 'rgba(111,227,200,.32)' : 'rgba(255,138,61,.3)'; c.fillRect(xx, y, bw, rh);
      c.fillStyle = '#e8dcc4'; c.font = `700 11px ${FONT}`; c.textAlign = 'center'; c.fillText(fitText(c, (r.i + 1) + ' · ' + (r.sup ? 'soutien' : r.auto ? 'auto' : 'manuel'), bw - 4), xx + bw / 2, y + 15);
      if (!r.sup) hudWRows.push({ x: xx, y, w: bw, h: rh, i: r.i });
    });
    c.textAlign = 'left'; return yBottom + nr * (rh + 4) + 4;
  }
  const h = rows.length * rh + 26, y0 = yBottom - h; panel(c, x, y0, w, h);
  c.font = `700 12px ${FONT}`; c.fillStyle = '#a59c88'; c.textAlign = 'left'; c.fillText('Armes · clic pour basculer · [' + keyLabel('wmode') + '] tout', x + 10, y0 + 16);
  rows.forEach((r, k) => {
    const y = y0 + 22 + k * rh, name = WEAPONS[r.m.wid].n, t = r.m.tgt2 && !r.m.tgt2.dead && r.auto ? r.m.tgt2 : null;
    c.fillStyle = r.sup ? 'rgba(111,227,200,.12)' : r.auto ? 'rgba(111,227,200,.22)' : 'rgba(255,138,61,.2)'; c.fillRect(x + 6, y, w - 12, rh - 2);
    c.fillStyle = '#e8dcc4'; c.font = `600 12px ${FONT}`; c.fillText(fitText(c, (r.i + 1) + '. ' + name, w * .45), x + 12, y + 12);
    c.textAlign = 'right'; c.font = `700 11.5px ${FONT}`; c.fillStyle = r.sup ? '#6fe3c8' : r.auto ? '#6fe3c8' : '#ff8a3d';
    c.fillText(r.sup ? 'soutien auto' : r.auto ? (t ? 'auto → ' + fitText(c, t.kind === 'enemy' ? ENEMIES[t.etype].n : t.name || 'cible', w * .3) : 'auto · cherche') : 'manuel · clic gauche', x + w - 12, y + 12);
    c.textAlign = 'left';
    if (!r.sup) hudWRows.push({ x: x + 6, y, w: w - 12, h: rh - 2, i: r.i });
  });
  return y0;
}
function hitWeaponRow(ux, uy) { const r = hudWRows.find(h => ux >= h.x && ux <= h.x + h.w && uy >= h.y && uy <= h.y + h.h); if (!r) return false; toggleWeaponMode(r.i); return true; }
function saveWeaponModes(u) { const sr = save.robots.find(s => s.id === u.sid); if (sr) { sr.wm = (u.wm || []).slice(); writeSave(); } }
function toggleWeaponMode(i) {
  const u = player && player.inside; if (!u || !u.mounts[i] || SUPPORT_W[u.mounts[i].w.kind]) return;
  u.wm = u.wm || u.mounts.map(() => 'm'); u.wm[i] = u.wm[i] === 'a' ? 'm' : 'a'; u.mounts[i].tgt2 = null;
  msg('Affût ' + (i + 1) + ' (' + WEAPONS[u.mounts[i].wid].n + ') : ' + (u.wm[i] === 'a' ? 'automatique, il choisit sa cible et tire seul.' : 'manuel, il tire au clic gauche.'), '#ff8a3d', 3);
  SFX.play('ui', 1); saveWeaponModes(u);
}
function cycleWeaponModes() {
  const u = player && player.inside;
  if (!u) { msg('Montez dans un robot pour régler ses armes. Au hangar, chaque robot a aussi son réglage de tir.', '#a59c88', 4); return; }
  const idx = u.mounts.map((m, i) => i).filter(i => !SUPPORT_W[u.mounts[i].w.kind]); if (!idx.length) return;
  u.wm = u.wm || u.mounts.map(() => 'm');
  const allM = idx.every(i => u.wm[i] !== 'a'), allA = idx.every(i => u.wm[i] === 'a');
  let txt;
  if (allM && idx.length > 1) { idx.forEach((i, k) => u.wm[i] = k === 0 ? 'm' : 'a'); txt = 'arme principale manuelle, les autres automatiques'; }
  else if (allM || (!allA && idx.length > 1)) { idx.forEach(i => u.wm[i] = 'a'); txt = 'toutes automatiques'; }
  else { idx.forEach(i => u.wm[i] = 'm'); txt = 'toutes manuelles (clic gauche)'; }
  for (const m of u.mounts) m.tgt2 = null;
  msg('Armes de ' + u.name + ' : ' + txt + '.', '#ff8a3d', 3); SFX.play('ui', 1); saveWeaponModes(u);
}
