// Raid : mise en place, balise d'ancrage, interactions, pilote, ordres, boucle de simulation, fin du raid.

// ================= MISE EN PLACE DU RAID =================
const CAMPS = {
  0: [['rodeur', 2, 4], ['pillard', 0, 2], ['char', 0, 1, .25]],
  1: [['essaim', 2, 5], ['traqueur', 0, 2], ['faucon', 0, 1, .3]],
  2: [['pillard', 1, 3], ['rodeur', 1, 3], ['traqueur', 0, 1], ['artilleur', 0, 1, .35], ['char', 0, 1, .3]],
  3: [['essaim', 2, 4], ['rodeur', 1, 2], ['faucon', 0, 1, .25]],
  4: [['traqueur', 1, 2], ['essaim', 1, 3], ['artilleur', 0, 1, .3]],
  5: [['traqueur', 1, 3], ['artilleur', 0, 1, .4]],
};
const CRATE_LOOT = {
  caisse: [['scrap', 5, 13, 1], ['circuits', 1, 4, .6], ['alloy', 1, 3, .35], ['data', 1, 2, .3], ['crystals', 1, 3, .2]],
  militaire: [['alloy', 4, 10, 1], ['circuits', 3, 8, 1], ['data', 2, 5, .8], ['cores', 1, 1, .45], ['scrap', 6, 14, 1]],
  donnees: [['data', 3, 7, 1], ['circuits', 2, 5, 1], ['cores', 1, 1, .08]],
};
function populate() {
  const sp = W.spawn;
  for (let k = 0; k < 88; k++) {
    const p = findWalkableNear(WPX / 2, WPX / 2, 1300, WPX * .48, 20); if (!p) continue;
    if (d2(p.x, p.y, sp.x, sp.y) < 1750 * 1750 || (LIVE.game && LIVE.nearSpawn(p.x, p.y, 1750))) continue;
    const bi = W.biome[tileAt(p.x, p.y)], RX = REGIONS[regionCur].extra; const comp = (CAMPS[bi] || CAMPS[0]).concat(RX[bi] || [], RX.all || []);
    for (const [type, a, b, ch] of comp) { if (ch && Math.random() > ch) continue; const n = Math.round(rndi(a, b) * armyScale(.3)); for (let i = 0; i < n; i++) { const q = findWalkableNear(p.x, p.y, 0, 110, 15) || p; makeEnemy(type, q.x, q.y); } }
    if ((bi === 2 || bi === 4) && Math.random() < .05 + (LIVE.game ? LIVE.game.diff : save.diff) * .03) makeEnemy('mastodonte', p.x, p.y);
  }
  for (const bs of W.bases) {
    const x0 = bs.x0 * TILE, y0 = bs.y0 * TILE, w = bs.sw * TILE, h = bs.sh * TILE;
    for (const [fx, fy] of [[.2, .2], [.8, .8], [.8, .2]]) { const q = findWalkableNear(x0 + w * fx, y0 + h * fy, 0, 60, 20); if (q) makeEnemy('bastion', q.x, q.y); }
    for (let i = 0; i < 4; i++) { const q = findWalkableNear(bs.cx * TILE, bs.cy * TILE, 30, 220, 20); if (q) makeEnemy('pillard', q.x, q.y); }
    if (Math.random() < (.35 + (LIVE.game ? LIVE.game.diff : save.diff) * .15) * (REGIONS[regionCur].tier <= 1 ? .4 : 1)) { const q = findWalkableNear(bs.cx * TILE, bs.cy * TILE, 0, 120, 30); if (q) makeEnemy('mastodonte', q.x, q.y); } // les Cendres ménagent les premières flottes
    for (let i = 0; i < 4; i++) { const q = findWalkableNear(bs.cx * TILE, bs.cy * TILE, 40, Math.min(w, h) * .42, 20); if (q) crates.push({ x: q.x, y: q.y, type: 'militaire', open: false }); }
  }
  makeEnemy(REGIONS[regionCur].boss, WPX / 2, WPX / 2);
  spawnGiants();
  for (let i = 0; i < 4; i++) { const q = findWalkableNear(WPX / 2, WPX / 2, 200, 500, 20); if (q) makeEnemy('traqueur', q.x, q.y); }
  // caisses
  for (let k = 0; k < 5000 && crates.length < 240; k++) {
    const tx = 4 + ((Math.random() * (WT - 8)) | 0), ty = 4 + ((Math.random() * (WT - 8)) | 0);
    if (!walkableTile(tx, ty)) continue;
    const i = ty * WT + tx, bi = W.biome[i], gi = W.ground[i];
    const ch = (bi === 2 && gi === 6) ? .3 : bi === 6 ? 0 : bi === 5 ? .06 : .025;
    if (Math.random() > ch) continue;
    const x = tx * TILE + 20, y = ty * TILE + 20;
    if (crates.some(c => d2(c.x, c.y, x, y) < 180 * 180)) continue;
    crates.push({ x, y, type: bi === 2 && Math.random() < .28 ? 'donnees' : bi === 5 ? 'militaire' : 'caisse', open: false });
  }
  // ferraille au sol
  for (let k = 0; k < 260; k++) { const p = findWalkableNear(WPX / 2, WPX / 2, 300, WPX * .48, 8); if (p) items.push({ res: Math.random() < .8 ? 'scrap' : 'circuits', amt: rndi(2, 6), x: p.x, y: p.y, vx: 0, vy: 0, t: 1, dead: false }); }
}

function startRaid(opt) {
  SFX.init(); if (EXPV.id) expViewClose(true);
  const NG = opt && opt.net; // raid partagé : graine, région et difficulté communes
  showOverlay('loading', true); $('#loadTxt').textContent = NG ? 'Le monde partagé se forme…' : 'Le monde se forme…';
  setTimeout(() => {
    const TU = TUT.on && !NG; // raid d'entraînement : les Cendres en Recrue, encore adoucies
    regionCur = NG ? NG.region : TU ? 0 : (save.region || 0); const RG = REGIONS[regionCur], tr = RG.tier - 1, D0 = DIFFS[NG ? NG.diff : TU ? 0 : save.diff];
    diff = Object.assign({}, D0, { hp: D0.hp * (1 + .22 * tr), dmg: D0.dmg * (1 + .15 * tr), loot: D0.loot * (1 + .3 * tr), spawn: D0.spawn * (1 + .08 * tr) });
    if (TU) { diff.hp *= .7; diff.dmg *= .55; }
    setRegionPalette(RG.id);
    units = []; bullets = []; parts = []; items = []; crates = []; beams = []; decals = []; msgs = []; fleet = []; pings = [];
    nextUid = 1; raidTime = 0; alertLv = 0; time = 0; spawnT = 50; actT = 0; fogT = 0; toxT = 0; endT = -1; endExtracted = null;
    tactical = false; mapOpen = false; paused = false; eProg = 0;
    raidStats = { kills: 0, boss: false, byType: {}, archives: 0, pylons: 0, rivalKills: 0, sabotage: 0, lost: 0, deployed: save.robots.filter(r => r.deploy).length }; fires = []; flashT = 0;
    refillOffers(); raidContracts = save.offers[regionCur].filter(c => save.active.includes(c.id));
    let dep = save.robots.filter(r => r.deploy);
    if (NG) { let c = 0; dep = dep.filter(r => (c += CHASSIS[r.chassis].cmd) <= cmdCap() + 1e-6); raidStats.deployed = dep.length; }
    armyPower = dep.reduce((s, r) => s + CHASSIS[r.chassis].cmd, 0);
    const wseed = NG ? NG.seed : (Math.random() * 1e9) | 0;
    genWorld(wseed, RG); chunkCache.clear(); FX.clear(); ENV.start(wseed, RG.id);
    if (NG) LIVE.prepWorld(); else clearTiles((W.spawn.x / TILE) | 0, (W.spawn.y / TILE) | 0, Math.min(14, 6 + Math.round(Math.sqrt(armyPower) * 1.3)));
    buildMinimap();
    const sp = NG ? LIVE.spawnPoint(NG.slot) : W.spawn;
    player = makePlayer(sp.x, sp.y); units.push(player);
    dep.sort((a, b) => CHASSIS[b.chassis].r - CHASSIS[a.chassis].r);
    dep.forEach((sr, i) => {
      const a = i * 2.39996, rad = 60 + CHASSIS[sr.chassis].r + Math.sqrt(i) * 46;
      const x = clamp(sp.x + Math.cos(a) * rad, 200, WPX - 200), y = clamp(sp.y + Math.sin(a) * rad, 200, WPX - 200);
      const u = makeRobot(sr, x, y); units.push(u); fleet.push(u);
      if (u.r > 40 && !NG) clearTiles((x / TILE) | 0, (y / TILE) | 0, Math.ceil(u.r / TILE) + 1);
    });
    B = { state: 'carried', unit: null, charge: 0, pulseT: 6, windowT: 0, cd: 0 };
    crews = [];
    if (TU) TUT.setupRaid(); // le tutoriel place lui-même butin, caisse, pylône et ennemis
    else if (!NG || NG.isHost) { populate(); spawnRivals(); } // les invités reçoivent le monde de l'hôte
    { const R = fleetMaxR(fleet); if (R > 160) cam.userZoom = Math.min(cam.userZoom, Math.max(minZoom(), .55 * Math.pow(160 / R, .55))); }
    cam.x = player.x; cam.y = player.y; cam.zoom = cam.userZoom;
    radarLv = bLevel('radar');
    reveal(player.x, player.y, 900 + 450 * radarLv);
    if (radarLv >= 2) for (const p of W.pylons) reveal(p.x, p.y, 220);
    state = 'raid';
    showScreen(null); showOverlay('loading', false);
    if (!TU) msg('Insertion : ' + RG.n + '. Fouillez, puis posez la balise [' + keyLabel('beacon') + '] pour lancer l\'extraction.', '#f2c14e', 9);
    if (crews.length) msg(crews.length + ' équipe' + (crews.length > 1 ? 's rivales fouillent' : ' rivale fouille') + ' aussi la zone.', COL.rival, 9);
    if (!TU) msg('Les pylônes relais [' + keyLabel('interact') + '] révèlent la carte et accélèrent l\'ancrage.', '#a59c88', 9);
    save.stats.raids++; writeSave();
    $('#cv').focus && $('#cv').focus();
    if (NG && LIVE.game === NG) LIVE.ready();
  }, 40);
}

// ================= BALISE D'ANCRAGE =================
const ZONE_R = 280, BEACON_FIELD = 280; // cercle d'extraction, qui est aussi le champ de réparation de la balise
function fleetWeight() { let w = player.cargoW; for (const r of fleet) if (!r.dead) w += r.cargoW; return w; }
function chargeTime() { return (55 + fleetWeight() * .3) * (has('u_anchor') ? .75 : 1) * (1 - .06 * Math.max(0, bLevel('pad') - 1)) * (TUT.on ? .5 : 1); }
let armyPower = 0;
function armyScale(k) { return 1 + Math.min(2.5, armyPower / 16) * k; }
function nearPylon(x, y) { return W.pylons.some(p => p.active && d2(p.x, p.y, x, y) < 340 * 340); }
function toggleBeacon() {
  const F = focus();
  if (B.state === 'carried') {
    if (F === player && player.hidden) return;
    const hp = 1300 * diff.beacon * (has('u_beacon') ? 2 : 1) * (1 + .2 * Math.max(0, bLevel('pad') - 1)) * (1 + armyPower / 60);
    const pos = F === player ? { x: player.x, y: player.y } : (findWalkableNear(F.x, F.y, F.r + 30, F.r + 80, 30) || { x: F.x, y: F.y });
    B.unit = baseUnit({ kind: 'beacon', team: 0, x: pos.x, y: pos.y, r: 18, maxhp: hp, hp, static: true, name: 'Balise' });
    units.push(B.unit); B.state = 'charging'; B.charge = B.keep || 0; B.keep = 0; B.pulseT = 7;
    msg('Balise posée. L\'ancrage émet un signal : les hostiles vont converger. Les robots dans son cercle se réparent lentement.', '#f2c14e', 6);
    if (nearPylon(pos.x, pos.y)) msg('Pylône relais à portée : ancrage ×2,5.', '#6fe3c8', 5);
    SFX.play('beacon', 1);
  } else if ((B.state === 'charging') && B.unit && d2(B.unit.x, B.unit.y, F.x, F.y) < (F.r + 90) ** 2) {
    B.unit.dead = true; B.unit = null; B.state = 'carried'; B.charge = 0; B.keep = 0; msg('Balise reprise. La charge est perdue.', '#a59c88', 4); SFX.play('ui', 1);
  } else if (B.state === 'broken') msg('Balise en réimpression : ' + Math.ceil(B.cd) + ' s.', '#ec6b74', 3);
  else if (B.state === 'charging') msg('Rejoignez la balise pour la reprendre.', '#a59c88', 3);
}
function updateBeacon(dt) {
  if (B.state === 'broken') { B.cd -= dt; if (B.cd <= 0) { B.state = 'carried'; msg('Nouvelle balise prête. [V] pour la poser.', '#f2c14e', 5); SFX.play('beacon', .6); } return; }
  if (!B.unit) return;
  const u = B.unit;
  // champ de l'ancrage : les robots qui défendent la balise se réparent lentement
  if (B.state === 'charging' || B.state === 'window') {
    B.fieldT = (B.fieldT || 0) - dt;
    for (const r of fleet) if (!r.dead && r.hp < r.maxhp && d2(r.x, r.y, u.x, u.y) < (BEACON_FIELD + r.r) ** 2) { r.hp = Math.min(r.maxhp, r.hp + r.maxhp * .012 * dt); if (B.fieldT <= 0 && Math.random() < .3) parts.push({ type: 'spark', x: r.x + rnd(-r.r, r.r) * .6, y: r.y + rnd(-r.r, r.r) * .6, vx: 0, vy: -40, life: .5, max: .5, size: 2, col: '#6fe3c8' }); }
    if (B.fieldT <= 0) B.fieldT = .25;
  }
  if (B.state === 'charging') {
    const mult = nearPylon(u.x, u.y) ? 2.5 : 1;
    B.charge += dt / chargeTime() * mult;
    B.pulseT -= dt;
    if (B.pulseT <= 0) { B.pulseT = 14; signalPulse(); }
    if (B.charge >= 1) { B.charge = 1; B.state = 'window'; B.windowT = 16; msg('FENÊTRE D\'EXTRACTION OUVERTE : 16 s. Entrez dans le cercle.', '#f2c14e', 8); msg('La flotte rejoint le cercle d\'elle-même, sauf les robots qui tiennent une position.', COL.ally, 8); SFX.play('alarm', 1); SFX.play('uplink', .8); buzz([60, 60, 60]); }
  } else if (B.state === 'window') {
    B.windowT -= dt;
    if (Math.random() < dt * 20) parts.push({ type: 'spark', x: u.x + rnd(-ZONE_R, ZONE_R) * .7, y: u.y + rnd(-ZONE_R, ZONE_R) * .7, vx: 0, vy: -rnd(80, 200), life: .6, max: .6, size: 2, col: '#f2c14e' });
    if (B.windowT <= 0) {
      const F = focus();
      if (Math.hypot(F.x - u.x, F.y - u.y) < (F.r > 150 ? zoneReach(F) : ZONE_R)) {
        endExtracted = fleet.filter(r => !r.dead && Math.hypot(r.x - u.x, r.y - u.y) < zoneReach(r));
        endSuccess = true; endT = 1.6; B.state = 'lift'; SFX.play('extract', 1); buzz([40, 40, 120]); addShake(10);
        msg('Extraction en cours…', '#f2c14e', 4);
      } else { B.state = 'charging'; B.charge = .55; msg('Fenêtre manquée : le pilote n\'était pas dans le cercle. Recharge partielle.', '#ec6b74', 6); }
    }
  }
}
function signalPulse() {
  const u = B.unit; if (!u) return;
  const rad = (800 + B.charge * 1000) * (EXPSIM ? .75 : 1);
  SFX.play('pulse', .9); parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: 1.2, max: 1.2, size: rad, col: '#f2c14e', thin: true });
  if (LIVE.guest()) { LIVE.pulse(u, B.charge); return; } // c'est l'hôte qui fait converger les hostiles
  let n = 0;
  for (const e of units) { if (e.kind !== 'enemy' || e.dead || e.static || e.boss) continue; if (d2(e.x, e.y, u.x, u.y) < rad * rad) { e.forced = u; e.active = true; n++; } }
  const count = Math.round((1 + alertLv * .6 + B.charge * 2.6) * diff.spawn * armyScale(.45) * (EXPSIM ? .5 : 1));
  spawnGroup(u.x, u.y, 1000, 1350, count, { forced: u });
  rivalsHear(u.x, u.y);
}
function spawnGroup(cx, cy, minR, maxR, count, opts) {
  const p = findWalkableNear(cx, cy, minR, maxR, 40); if (!p) return;
  const pool = alertLv >= 3 ? ['pillard', 'traqueur', 'essaim', 'pillard', 'traqueur', 'faucon', 'char', 'artilleur'] : alertLv >= 1 ? ['rodeur', 'pillard', 'essaim', 'traqueur', 'faucon'] : ['rodeur', 'rodeur', 'essaim', 'pillard'];
  const activeE = units.reduce((s, e) => s + (e.kind === 'enemy' && e.active && !e.dead ? 1 : 0), 0);
  count = Math.min(count, Math.max(0, 240 - activeE));
  for (let i = 0; i < count; i++) { const q = findWalkableNear(p.x, p.y, 0, 120, 10) || p; makeEnemy(pick(pool), q.x, q.y, Object.assign({ active: true }, opts)); }
  const nm = (alertLv >= 3 && Math.random() < .25 * diff.spawn ? 1 : 0) + (armyPower > 20 && Math.random() < armyPower / 80 ? 1 : 0);
  for (let i = 0; i < nm; i++) makeEnemy('mastodonte', p.x + rnd(-60, 60), p.y + rnd(-60, 60), Object.assign({ active: true }, opts));
  giantWave(p, opts);
}
function updateAlert(dt) {
  const step = 210 / diff.alert;
  const lv = Math.min(5, Math.floor(raidTime / step));
  if (lv > alertLv) {
    alertLv = lv; SFX.play('alarm', .8);
    msg(lv >= 5 ? 'ALERTE MAXIMALE : purge en cours, des traqueurs vous cherchent.' : 'Niveau d\'alerte ' + lv + ' : les patrouilles se renforcent.', '#ec6b74', 6);
  }
  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = Math.max(12, (62 - alertLv * 8) / diff.spawn) * (alertLv >= 5 ? .6 : 1);
    const F = LIVE.game ? LIVE.spawnFocus() : focus();
    const hunt = alertLv >= 2 && Math.random() < .25 + alertLv * .12;
    spawnGroup(F.x, F.y, 1200, 1500, Math.round((1.5 + alertLv * .7) * diff.spawn * armyScale(.45)), hunt ? { hunter: true } : { alerted: true });
  }
}

// ================= INTERACTION =================
function nearestInteract() {
  const F = focus(); const reach = F === player ? 52 : F.r + 50; let best = null, bd = Infinity;
  for (const c of crates) { if (c.open) continue; const q = d2(c.x, c.y, F.x, F.y); if (q < (reach + 14) ** 2 && q < bd) { bd = q; best = { kind: 'crate', o: c, dur: .9 }; } }
  for (const p of W.pylons) { if (p.active) continue; const q = d2(p.x, p.y, F.x, F.y); if (q < (reach + 40) ** 2 && q < bd) { bd = q; best = { kind: 'pylon', o: p, dur: 2.5 }; } }
  return best;
}
let eLatch = false; // réglage « appui simple » : un appui lance l'action, qui continue tant qu'on reste à portée
function updateInteract(dt) {
  const it = nearestInteract();
  if (!it || (eTarget && eTarget.o !== it.o)) { eProg = 0; eLatch = false; }
  eTarget = it;
  if (!it) return;
  if (keys.INTERACT && settings.tapAct) eLatch = true;
  if (keys.INTERACT || eLatch) {
    eProg += dt;
    if (eProg >= it.dur) {
      eProg = 0; eLatch = false;
      if (it.kind === 'crate' && LIVE.guest()) LIVE.openCrate(it.o); // l'hôte ouvre la caisse et répartit le butin
      else if (it.kind === 'crate') {
        it.o.open = true; dropTable(CRATE_LOOT[it.o.type], it.o.x, it.o.y); SFX.play('open', 1);
        if (it.o.type === 'donnees') { floatText(it.o.x, it.o.y - 20, 'Archive de données', '#7fa9ff'); raidStats.archives++; }
        if (it.o.claimed) it.o.claimed = null;
      } else {
        it.o.active = true; reveal(it.o.x, it.o.y, 1900); raidStats.pylons++; spawnItem('data', Math.round(4 * diff.loot), it.o.x, it.o.y); if (LIVE.guest()) LIVE.pylon(it.o);
        msg('Pylône relais activé : carte révélée, ancrage ×2,5 dans son rayon.', '#6fe3c8', 6); SFX.play('beacon', 1);
      }
    }
  } else eProg = Math.max(0, eProg - dt * 2);
}

// ================= PILOTE =================
function updatePlayer(dt) {
  let ix = 0, iy = 0;
  if (keys.KeyW || keys.ArrowUp) iy -= 1; if (keys.KeyS || keys.ArrowDown) iy += 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
  const il = Math.hypot(ix, iy) || 1; ix /= il; iy /= il;
  if (TOUCH.mx || TOUCH.my) { ix = TOUCH.mx; iy = TOUCH.my; }
  const firing = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire);
  if (player.inside) {
    const u = player.inside; const sp = u.spd * terrainMul(u) * (u.r > 50 ? 1.1 : 1.15);
    const k = 1 - Math.exp(-dt * (ix || iy ? 1 : .8) * (u.r > 50 ? 2.6 : 6.5));
    u.vx += (ix * sp - u.vx) * k; u.vy += (iy * sp - u.vy) * k; u.wantMove = ix !== 0 || iy !== 0;
    if (u.wantMove) { const dA = angDiff(u.ang, Math.atan2(iy, ix)), mx = dt * (6 / (1 + u.r / 30)); u.ang += clamp(dA * Math.min(1, dt * 8), -mx, mx); }
    player.x = u.x; player.y = u.y; player.vx = player.vy = 0;
    return;
  }
  const p = player;
  p.dashCd -= dt; p.inv -= dt; p.cd -= dt;
  if (p.dashT > 0) { p.dashT -= dt; p.wantMove = true; }
  else {
    const slow = 1 - Math.min(.35, p.cargoW / p.cargoMax * .3);
    const sp = p.spd * terrainMul(p) * slow * (firing ? .85 : 1);
    const k = 1 - Math.exp(-dt * (ix || iy ? 13 : 10)); p.vx += (ix * sp - p.vx) * k; p.vy += (iy * sp - p.vy) * k; p.wantMove = ix !== 0 || iy !== 0;
  }
  p.ang = Math.atan2(mouse.wy - p.y, mouse.wx - p.x); if (firing && (settings.aim || TOUCH.on)) aimAssist(p);
  // tir
  const w = p.pw;
  if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT > 0 && p.reloadT < .22 && !p.relSnd) { p.relSnd = true; SFX.play('reloaded', .8); } if (p.reloadT <= 0) p.ammo = w.mag; }
  else if (firing && p.cd <= 0) {
    if (p.ammo <= 0) { startReload(p); }
    else {
      const a = p.ang, sx = p.x + Math.cos(a) * 18 + Math.cos(a + Math.PI / 2) * 3, sy = p.y + Math.sin(a) * 18 + Math.sin(a + Math.PI / 2) * 3;
      playerFire(p, w, a, sx, sy); p.fc = ((p.fc || 0) + 1) & 255; if (w.kind === 'bullet') FX.casing(p.x, p.y, a, .8, false); camKick(a, w.kind === 'rocket' ? 3 : w.rate < 1.5 ? 2.2 : .8);
      SFX.play(w.snd, .8, undefined, undefined, { self: true }); if (w.rate < 2) buzz(14);
      p.ammo--; p.cd = 1 / w.rate; if (p.ammo <= 0) { SFX.play('empty', .7); startReload(p, .15); }
      p.vx -= Math.cos(a) * 20; p.vy -= Math.sin(a) * 20;
    }
  }
  if (time - p.lastHurt > 4 && p.hp < p.maxhp) p.hp = Math.min(p.maxhp, p.hp + 7 * dt);
}
function playerFire(p, w, a, sx, sy) {
  if (w.kind === 'chain') {
    let t = null, bd = w.range * w.range;
    query(mouse.wx - 120, mouse.wy - 120, mouse.wx + 120, mouse.wy + 120, v => { if (v.team !== 0 && !v.dead && !v.hidden && v.etype !== 'cible' && d2(v.x, v.y, mouse.wx, mouse.wy) < (v.r + 60) ** 2 && d2(v.x, v.y, p.x, p.y) < bd) t = v; });
    if (!t) t = findTarget({ x: sx + Math.cos(a) * w.range * .5, y: sy + Math.sin(a) * w.range * .5, team: 0 }, w.range * .55);
    if (t) chainShot(p, sx, sy, t, w, w.dmg); else beams.push({ pts: zig(sx, sy, sx + Math.cos(a) * 120, sy + Math.sin(a) * 120, 6, 8), life: .12, max: .12, col: w.col, w: 2 });
    return;
  }
  const n = w.pellets || 1;
  for (let i = 0; i < n; i++) {
    const b = shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread, (w.kind === 'rocket' ? w.spd * .4 : w.spd) * rnd(.95, 1.05), w.dmg, 0, w.range, w.kind, w.col, w.pierce || 0, p, w.splash || 0, 1);
    if (w.kind === 'rocket') { b.maxSpd = w.spd; let t = null; query(mouse.wx - 80, mouse.wy - 80, mouse.wx + 80, mouse.wy + 80, v => { if (v.team !== 0 && !v.dead && !v.hidden) t = v; }); b.homing = t; }
  }
  muzzle(sx, sy, a, '#ffe6a8', 1.2);
}
function startReload(p, delay = 0) { p.reloadT = p.pw.reload + delay; p.relSnd = false; setTimeout(() => { if (p.reloadT > 0) SFX.play('reload', .8); }, delay * 1000); }
function dash() {
  const p = player; if (p.inside || p.dashCd > 0) return;
  let ix = 0, iy = 0;
  if (keys.KeyW || keys.ArrowUp) iy -= 1; if (keys.KeyS || keys.ArrowDown) iy += 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (!ix && !iy) { ix = Math.cos(p.ang); iy = Math.sin(p.ang); }
  const l = Math.hypot(ix, iy); p.vx = ix / l * 620; p.vy = iy / l * 620; p.dashT = .18; p.inv = .3; p.dashCd = 1.1; SFX.play('dodge', .9); if (TUT.on) TUT.dashes++;
  for (let i = 0; i < 6; i++) parts.push({ type: 'smoke', x: p.x, y: p.y, vx: rnd(-30, 30), vy: rnd(-30, 30), life: .5, max: .5, size: 7, col: 'rgba(150,140,120,' });
}
function togglePilot() {
  if (player.inside) { ejectPlayer(false); SFX.play('board', .8); return; }
  let cand = fleet.find(r => r.sel && !r.dead && d2(r.x, r.y, player.x, player.y) < (r.r + 260) ** 2);
  if (!cand) { let bd = Infinity; for (const r of fleet) { if (r.dead) continue; const q = Math.max(0, Math.hypot(r.x - player.x, r.y - player.y) - r.r) ** 2; if (q < bd && q < 220 * 220) { bd = q; cand = r; } } }
  if (!cand) { msg('Aucun robot assez proche pour monter à bord.', '#a59c88', 3); SFX.play('deny', .8); return; }
  player.inside = cand; cand.piloted = true; cand.order = null; cand.sel = false; player.hidden = true; player.vx = player.vy = 0;
  msg('Aux commandes de ' + cand.name + '. [' + keyLabel('pilot') + '] pour ressortir' + (cand.mounts.filter(m => !SUPPORT_W[m.w.kind]).length > 1 ? ', [' + keyLabel('wmode') + '] armes manuelles ou auto.' : '.'), '#6fe3c8', 5); SFX.play('board', 1);
}

// ================= ORDRES DE FLOTTE =================
function selection() { const s = fleet.filter(r => r.sel && !r.dead && !r.piloted); return s.length ? s : fleet.filter(r => !r.dead && !r.piloted); }
function orderAll(type) {
  const sel = selection(); if (!sel.length) return;
  if (type === 'beacon' && !B.unit) { msg('Aucune balise posée.', '#a59c88', 3); return; }
  for (const r of sel) { r.order = type === 'hold' ? { type: 'hold', x: r.x, y: r.y } : type === 'auto' ? null : { type }; r.queue = []; r.patrol = false; }
  const L = { follow: 'Flotte : suivez-moi.', hold: 'Flotte : tenez la position.', beacon: 'Flotte : défendez la balise.', auto: 'Flotte : autonomie rendue.' };
  msg(L[type] + (fleet.some(r => r.sel) ? ' (sélection)' : ''), '#6fe3c8', 3); SFX.play('ui', 1);
}
function cycleBrain() {
  const sel = fleet.filter(r => r.sel && !r.dead); if (!sel.length) { msg('Sélectionnez des robots pour changer leur cerveau (Tab).', '#a59c88', 3); return; }
  const avail = BRAIN_KEYS.filter(k => brainUnlocked(k) && k !== 'tactical');
  for (const r of sel) { if (r.brain === 'tactical') continue; const i = avail.indexOf(r.brain); r.brain = avail[(i + 1) % avail.length]; r.order = null; }
  msg('Cerveau : ' + BRAINS[sel[0].brain].n + (sel.some(r => r.brain === 'tactical') ? ' (les cortex tactiques restent inchangés)' : ''), '#6fe3c8', 3); SFX.play('ui', 1);
}

// ================= BOUCLE DE MISE À JOUR =================
function update(dt) {
  time += dt; raidTime += dt; frameDt = dt;
  const F = focus(), inBase = state === 'base';
  mouse.wx = (mouse.x - VW / 2) / cam.zoom + cam.x; mouse.wy = (mouse.y - VH / 2) / cam.zoom + cam.y;
  actT -= dt;
  if (!inBase && actT <= 0) {
    actT = .4; const A2 = 1900 * 1900;
    for (const e of units) { if (e.kind !== 'enemy' || e.dead || e.net) continue; e.active = !!(e.forced || e.hunter || d2(e.x, e.y, F.x, F.y) < actReach(F, e, 1900) ** 2 || (B.unit && d2(e.x, e.y, B.unit.x, B.unit.y) < A2) || fleet.some(r => !r.dead && d2(e.x, e.y, r.x, r.y) < actReach(r, e, 900) ** 2) || (LIVE.game && LIVE.nearPeers(e.x, e.y, A2))); }
  }
  hashBuild(); NAVB.left = NAV_BUDGET;
  for (const u of units) u.wantMove = false;
  indexFleet();
  if (EXPSIM) expDirect(dt); else updatePlayer(dt);
  for (const u of fleet) if (!u.dead) { robotAI(u, dt); if (u.fabC) fabTick(u, dt); }
  fabHouse(dt);
  for (const u of units) if (u.kind === 'minion' && !u.dead && !u.net) minionAI(u, dt);
  if (state === 'raid') { crewsTick(dt); for (const u of units) if (u.kind === 'rival' && !u.dead && !u.net) rivalAI(u, dt); }
  abilitiesTick(dt);
  for (const u of units) if (u.kind === 'enemy' && u.active && !u.dead && !u.net) enemyAI(u, dt);
  for (const u of units) { if (u.dead || !u.active || u.net || (u.hidden && u !== player)) continue; if (u === player && player.inside) continue; physics(u, dt); }
  separate(dt);
  for (const u of units) { if (u.dead || !u.active || u.hidden || u.net || !u.mounts.length) continue; updateMounts(u, dt); }
  updateBullets(dt); updateFires(dt);
  for (const u of units) { if (u.shield > 0 && time - (u.shieldT || 0) > 1.5) u.shield = Math.max(0, u.shield - 40 * dt); if (u.shieldHit > 0) u.shieldHit -= dt; }
  if (flashT > 0) flashT -= dt * 1.2;
  // toxique
  toxT -= dt;
  if (toxT <= 0) {
    toxT = .5;
    for (const u of units) {
      if (u.dead || u.fly || u.hidden || u.net || u.crush >= 3 || !u.active || u.kind === 'beacon') continue;
      const i = tileAt(u.x, u.y); if (i >= 0 && W.ground[i] === 3) { damage(u, u.kind === 'player' ? 2 : u.kind === 'robot' ? 1.5 : 1.5, null); if (u.kind === 'player' && Math.random() < .3) floatText(u.x, u.y - 16, 'toxique', '#b5e86a'); }
    }
  }
  ENV.tick(dt); FX.tick(dt); FX.damageTick(dt);
  if (inBase) baseTick(dt); else if (state === 'assault') assaultTick(dt); else { updateItems(dt); if (!EXPSIM) updateInteract(dt); updateBeacon(dt); if (!LIVE.guest() && !TUT.on) updateAlert(dt); }
  fogT -= dt;
  if (!inBase && fogT <= 0) { fogT = .25; const rm = state === 'raid' ? ENV.revealMul : 1; reveal(F.x, F.y, (750 + F.r) * rm); for (const r of fleet) if (!r.dead) reveal(r.x, r.y, (380 + r.r) * (r.sightMul || 1) * rm); }
  // particules
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt;
    if (p.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.type === 'debris' || p.type === 'spark' || p.type === 'fire') { p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; }
    else if (p.type === 'smoke' || p.type === 'dust') { const kw = dt * (p.type === 'dust' ? 1.6 : .7); p.vx += (ENV.wind.x * .55 - p.vx) * kw; p.vy += (ENV.wind.y * .55 - p.vy) * kw; }
  }
  if (parts.length > 900) parts.splice(0, parts.length - 900);
  for (let i = beams.length - 1; i >= 0; i--) { beams[i].life -= dt; if (beams[i].life <= 0) beams.splice(i, 1); }
  for (let i = pings.length - 1; i >= 0; i--) { pings[i].t -= dt; if (pings[i].t <= 0) pings.splice(i, 1); }
  for (const m of msgs) m.t -= dt; msgs = msgs.filter(m => m.t > 0);
  // nettoyage
  runDeferred();
  if (units.some(u => u.dead)) units = units.filter(u => !u.dead || u === player);
  if (inBase && fleet.some(u => u.dead)) fleet = fleet.filter(u => !u.dead);
  if (!inBase && endT > 0) { endT -= dt; if (endT <= 0) { if (EXPSIM) expEnd(endSuccess); else if (state === 'assault') endAssault(); else endRaid(endSuccess); } }
}

// ================= FIN DU RAID =================
function endRaid(success) {
  const wasLive = LIVE.game ? LIVE.game.mode : null;
  if (LIVE.game) { if (!success) LIVE.dropAll(); LIVE.finish(success); } // raid partagé : le butin d'un pilote tombé reste au sol
  state = 'result'; tactical = false; mapOpen = false; SFX.play(success ? 'success' : 'fail', 1); if (TUT.on) TUT.raidOk = success;
  const gained = {}; const lostRes = {};
  const add = (o, c) => { for (const k in c) if (c[k] > 0) o[k] = (o[k] || 0) + c[k]; };
  const back = [], lost = [], recovered = [];
  if (success) {
    add(gained, player.cargo);
    for (const r of fleet) if (r.temp) add(!r.dead && endExtracted && endExtracted.includes(r) ? gained : lostRes, r.cargo);
    for (const r of fleet) {
      const sr = save.robots.find(s => s.id === r.sid); if (!sr) continue;
      if (!r.dead && endExtracted && endExtracted.includes(r)) { add(gained, r.cargo); syncRobotSave(r, true); back.push(sr.name); }
      else { add(lostRes, r.cargo); lost.push(sr.name); save.robots = save.robots.filter(s => s !== sr); }
    }
    for (const k in gained) save.res[k] += gained[k];
    save.stats.extract++;
    const val = (gained.scrap || 0) + 3 * (gained.alloy || 0) + 2 * (gained.circuits || 0) + 3 * (gained.crystals || 0) + 30 * (gained.cores || 0) + 4 * (gained.data || 0);
    save.base.threat = Math.min(100, (save.base.threat || 0) + 9 + alertLv * 4 + Math.min(20, val / 150));
  } else {
    add(lostRes, player.cargo);
    for (const r of fleet) if (r.temp) add(lostRes, r.cargo);
    for (const r of fleet) {
      const sr = save.robots.find(s => s.id === r.sid); if (!sr) continue;
      add(lostRes, r.cargo);
      if (!r.dead && has('u_recall') && Math.random() < .35) { syncRobotSave(r, false); sr.hp = .15; recovered.push(sr.name); }
      else { lost.push(sr.name); save.robots = save.robots.filter(s => s !== sr); }
    }
    save.stats.deaths++; save.base.threat = Math.min(100, (save.base.threat || 0) + 6);
  }
  save.stats.kills += raidStats.kills; if (raidStats.boss) save.stats.boss++;
  const doneC = [], failC = [], unlockedBefore = REGIONS.map((_, i) => regionUnlocked(i));
  if (success) {
    const mul = 1 + .15 * Math.max(0, bLevel('contracts') - 1);
    for (const c of raidContracts) {
      if (contractDone(c, gained)) { for (const k in c.reward) save.res[k] += Math.round(c.reward[k] * mul); save.cdone[c.region] = (save.cdone[c.region] || 0) + c.rep; doneC.push(c); save.offers[c.region] = save.offers[c.region].filter(x => x.id !== c.id); }
      else failC.push(c);
    }
  } else failC.push(...raidContracts);
  save.active = save.active.filter(id => !doneC.some(c => c.id === id));
  refillOffers();
  const newRegions = REGIONS.filter((R, i) => !unlockedBefore[i] && regionUnlocked(i));
  if (save.robots.length === 0 && save.res.scrap < 25) { save.res.scrap += 40; save.res.circuits += 4; }
  fleet = []; fires = [];
  writeSave();
  const resRows = (o, cls, sign) => RES_KEYS.filter(k => o[k]).map(k => `<div><span>${RES[k].n}</span><b class="${cls}">${sign}${fmt(o[k])}</b></div>`).join('') || '<div><span>Rien</span><b>—</b></div>';
  $('#resultBox').innerHTML = `
    <h3>${success ? 'Extraction réussie' : 'Signal perdu'}</h3>${wasLive ? `<p class="sub">Raid partagé · ${wasLive === 'pvp' ? 'PvP' : 'coopération'}</p>` : ''}
    <p>${success ? 'Le lift orbital a remonté le pilote et tout ce qui se trouvait dans le cercle.' : 'Votre pilote est tombé. Tout ce qui était transporté reste dans la zone.'} Durée ${mmss(raidTime)} · ${raidStats.kills} hostiles abattus${raidStats.boss ? ' · Souverain vaincu' : ''}.</p>
    ${success ? `<div class="slot-h">Butin rapatrié</div><div class="res-list">${resRows(gained, 'good', '+')}</div>` : ''}
    ${Object.keys(lostRes).length ? `<div class="slot-h">Butin perdu</div><div class="res-list">${resRows(lostRes, 'lost', '−')}</div>` : ''}
    ${back.length ? `<p class="good">Robots rentrés : ${back.map(esc).join(', ')}</p>` : ''}
    ${recovered.length ? `<p class="good">Rappel automatique réussi : ${recovered.map(esc).join(', ')}</p>` : ''}
    ${lost.length ? `<p class="lost">Robots perdus : ${lost.map(esc).join(', ')}</p>` : ''}
    ${raidStats.fab ? `<p>Renforts fabriqués pendant le raid : ${raidStats.fab}. Ils ont été démontés au retour ; le chargement de ceux qui étaient dans le cercle est compté.</p>` : ''}
    ${doneC.length ? `<div class="slot-h">Contrats remplis</div><div class="res-list">${doneC.map(c => `<div><span>${esc(contractText(c))}</span><b class="good">${rewardHtml(c.reward)}</b></div>`).join('')}</div>` : ''}
    ${failC.length ? `<p>Contrats non remplis, toujours disponibles : ${failC.map(c => esc(contractText(c))).join(' · ')}</p>` : ''}
    ${newRegions.length ? `<p class="good"><b>Nouvelle région débloquée : ${newRegions.map(R => R.n).join(', ')}.</b></p>` : ''}
    <div class="btns"><button class="btn hot" data-act="tohub">Retour à la base</button></div>`;
  showOverlay('result', true);
}
