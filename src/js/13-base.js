// Base jouable : construction, production, robots stationnés, défense contre les pillards.

// ================= BASE JOUABLE =================
let baseSel = null, placing = null, drawerOpen = false, baseNearB = null, hoverB = null;
let baseTickT = 0, baseSaveT = 0, repairAcc = 0;
const busyCount = () => save.base.b.filter(b => b.busy).length;
const countType = type => save.base.b.filter(b => b.type === type).length;
const bLimit = type => (BLIMIT[type] || [1])[hqLevel() - 1] || 0;
function bRect(b) { const D = BUILD[b.type]; return { x: b.tx * TILE, y: b.ty * TILE, w: D.w * TILE, h: D.h * TILE }; }
function bAt(wx, wy, pad = 0) { for (const b of save.base.b) { const r = bRect(b); if (wx >= r.x - pad && wx <= r.x + r.w + pad && wy >= r.y - pad && wy <= r.y + r.h + pad) return b; } return null; }
let parked = [];
function parkPoint(r) {
  if (r > 150) return giantPark(r);
  const hg = save.base.b.find(b => b.type === 'hangar');
  const px = hg ? (hg.tx + BUILD.hangar.w / 2) * TILE : 150 * TILE, py = hg ? (hg.ty + BUILD.hangar.h) * TILE + 120 : 165 * TILE;
  for (let i = 0; i < 1500; i++) {
    const a = i * 2.39996, rad = Math.sqrt(i) * 20, x = px + Math.cos(a) * rad, y = py + Math.sin(a) * rad * .85;
    if (x - r < (BX0 + 2) * TILE || x + r > (BX1 - 1) * TILE || y - r < (BY0 + 2) * TILE || y + r > (BY1 - 1) * TILE) continue;
    if (parked.some(p => d2(p.x, p.y, x, y) < ((p.r + r) * 1.3 + 10) ** 2)) continue;
    let bad = false; for (const b of save.base.b) { const R = bRect(b); if (x + r > R.x - 14 && x - r < R.x + R.w + 14 && y + r > R.y - 14 && y - r < R.y + R.h + 14) { bad = true; break; } }
    if (bad) continue;
    parked.push({ x, y, r }); return { x, y };
  }
  return { x: px, y: py };
}
function reparkAll() { parked = []; for (const u of fleet.slice().sort((a, b) => b.r - a.r)) { u.home = parkPoint(u.r); u.wp = null; } }
function spawnBaseRobot(sr, x, y) {
  const home = parkPoint(CHASSIS[sr.chassis].r);
  const p = (x !== undefined) ? { x, y } : (findWalkableNear(home.x, home.y, 0, 60, 20) || home);
  const u = makeRobot(sr, p.x, p.y); u.home = home; units.push(u); fleet.push(u); return u;
}
function spawnDummies() {
  for (const u of units) if (u.etype === 'cible') u.dead = true;
  const rg = save.base.b.find(b => b.type === 'range' && b.lvl > 0); if (!rg) return;
  const n = 2 + rg.lvl, r = bRect(rg);
  for (let i = 0; i < n; i++) {
    const x = r.x + r.w / 2 + (i - (n - 1) / 2) * 56, y = r.y - 70;
    const d = makeEnemy('cible', x, y, { active: true }); d.maxhp = d.hp = 600 * rg.lvl;
  }
}
function enterBase() {
  if (EXPV.id) expViewClose(true);
  applyPendingSave();
  state = 'base'; paused = false; tactical = false; mapOpen = false; drawerOpen = false; placing = null; baseSel = null;
  showScreen(null); showOverlay('result', false); showOverlay('loading', false);
  units = []; bullets = []; parts = []; items = []; crates = []; beams = []; decals = []; msgs = []; fleet = []; pings = []; fires = [];
  nextUid = 1; time = 0; B = null; raidStats = null; endT = -1; eProg = 0; eTarget = null; flashT = 0; parked = [];
  diff = DIFFS[1]; crews = []; regionCur = null; raidContracts = []; fireLatch = false;
  setRegionPalette(null); refillOffers(); refreshKeyHints();
  genBase(); chunkCache.clear(); FX.clear(); ENV.startBase();
  player = makePlayer(W.spawn.x, W.spawn.y); units.push(player);
  save.robots.filter(sr => !sr.exp).sort((a, b) => CHASSIS[b.chassis].r - CHASSIS[a.chassis].r).forEach(sr => spawnBaseRobot(sr));
  spawnDummies(); attack = null; setupProxies();
  { const R = fleetMaxR(fleet); if (R > 160) cam.userZoom = Math.min(cam.userZoom, Math.max(minZoom(), .55 * Math.pow(160 / R, .55))); }
  cam.x = player.x; cam.y = player.y; cam.zoom = cam.userZoom;
  baseTimers(true);
  if ((save.base.threat || 0) >= 60) setTimeout(() => { if (state === 'base') scheduleAttack(55, 'Des pillards ont suivi votre signal jusqu\'à la base !'); }, 1500);
  showBaseBar(true); updateBPanel();
  if (TOUCH.on) msg('Touchez un bâtiment pour le sélectionner, retouchez-le pour l\'ouvrir. « Base » ouvre construction, forge et raids.', '#e8dcc4', 8);
  else msg('Bienvenue à la base. Approchez-vous d\'un bâtiment et appuyez sur ' + keyLabel('interact') + ' pour l\'utiliser.', '#e8dcc4', 7);
  if (!TOUCH.on) msg(keyLabel('defend') + ' : construire · clic sur un bâtiment : améliorer ou déplacer · ' + keyLabel('help') + ' : aide.', '#a59c88', 7);
  writeSave();
}
function leaveBase() { if (EXPV.id) expViewClose(true); showBaseBar(false); closeDrawer(true); placing = null; baseSel = null; updateBPanel(); }

// ---------- temps réel : constructions, production, réparation ----------
function baseTimers(force) {
  const now = Date.now();
  for (const b of save.base.b) {
    if (b.busy && now >= b.busy) {
      b.lvl = b.up || (b.lvl + 1); b.busy = 0; b.up = 0; b.lastT = now;
      if (state === 'base') {
        const r = bRect(b); for (let k = 0; k < 14; k++) sparks(r.x + Math.random() * r.w, r.y + Math.random() * r.h, 2, '#f2c14e');
        msg(BUILD[b.type].n + ' : niveau ' + b.lvl + ' terminé.', '#f2c14e', 5); SFX.play('build', 1);
        if (b.type === 'range') spawnDummies();
        syncProxy(b);
        if (b === baseSel) updateBPanel();
      }
      writeSave();
    }
    const D = BUILD[b.type];
    if (D.prod) {
      if (b.busy || b.lvl <= 0) { b.lastT = now; continue; }
      const el = Math.max(0, now - (b.lastT || now)) / 60000;
      b.stored = Math.min(prodCap(b), (b.stored || 0) + prodRate(b) * el); b.lastT = now;
    }
  }
}
function collect(b, silent) {
  const D = BUILD[b.type]; if (!D.prod) return 0;
  const n = Math.floor(b.stored || 0); if (n <= 0) return 0;
  b.stored -= n; save.res[D.prod] += n; if (TUT.on) TUT.collected += n;
  if (!silent) { const r = bRect(b); floatText(r.x + r.w / 2, r.y - 10, '+' + n + ' ' + RES[D.prod].n, RES[D.prod].c); SFX.play('collect', .8); }
  return n;
}
function baseRepair(dt) {
  const L = bLevel('repairbay'); if (!L) return;
  repairAcc += dt; if (repairAcc < 1) return; const k = repairAcc; repairAcc = 0;
  const rb = save.base.b.find(b => b.type === 'repairbay'), rr2 = rb ? bRect(rb) : null;
  for (const sr of save.robots) {
    if (sr.hp >= 1 || sr.exp) continue;
    sr.hp = Math.min(1, sr.hp + .05 * L / 60 * k);
    const u = fleet.find(f => f.sid === sr.id); if (u) { u.hp = u.maxhp * sr.hp; if (rr2 && Math.random() < .3) beams.push({ x1: rr2.x + rr2.w / 2, y1: rr2.y + rr2.h / 2, x2: u.x, y2: u.y, life: .4, max: .4, col: '#6fe3c8', w: 1.5, heal: true }); }
  }
}
function baseTick(dt) {
  baseTickT -= dt; if (baseTickT <= 0) { baseTickT = .5; baseTimers(); if (baseSel) updateBPanel(true); }
  baseRepair(dt);
  baseSaveT -= dt; if (baseSaveT <= 0) { baseSaveT = 6; writeSave(); netPublish(); }
  // collecte automatique en passant
  const F = focus(); const nb = bAt(F.x, F.y, 46 + (F.r || 0));
  baseNearB = nb;
  if (nb && BUILD[nb.type].prod && (nb.stored || 0) >= 1) collect(nb);
  // placement
  if (placing) {
    const D = BUILD[placing.type];
    placing.tx = Math.floor(mouse.wx / TILE - D.w / 2 + .5); placing.ty = Math.floor(mouse.wy / TILE - D.h / 2 + .5);
    placing.ok = canPlace(placing.type, placing.tx, placing.ty, placing.id);
  }
  if (placing && placing.drag && mouse.ldown && placing.ok && instantB(placing.type)) confirmPlace();
  hoverB = placing || TOUCH.on ? null : bAt(mouse.wx, mouse.wy);
  turretAI(dt); updateAttack(dt);
  // les cibles se régénèrent
  for (const u of units) if (u.etype === 'cible' && time - (u.lastHit || 0) > 3) u.hp = Math.min(u.maxhp, u.hp + u.maxhp * dt * .5);
}

// ---------- actions sur les bâtiments ----------
function startPlacing(type, moveId) {
  if (attack && attack.phase === 'fight') { toast('Impossible pendant l\'attaque.'); SFX.play('deny', 1); return; }
  if (!moveId) {
    if (countType(type) >= bLimit(type)) { toast('Limite atteinte pour ce bâtiment. Améliorez le QG.'); SFX.play('deny', 1); return; }
    if (!canAfford(bCost(type, 1))) { toast('Ressources insuffisantes.'); SFX.play('deny', 1); return; }
    if (!instantB(type) && busyCount() >= builderCap()) { toast('Tous les ouvriers sont occupés.'); SFX.play('deny', 1); return; }
  }
  closeDrawer(); placing = { type, id: moveId || null, tx: 0, ty: 0, ok: false, drag: !moveId && instantB(type) };
  msg(placing.drag ? 'Maintenez le clic et glissez pour poser une rangée · clic droit ou Échap pour terminer.' : 'Clic gauche pour poser · clic droit ou Échap pour annuler.', '#f2c14e', 4);
}
function confirmPlace() {
  const p = placing; if (!p || !p.ok) { SFX.play('deny', 1); return; }
  const now = Date.now();
  if (p.id) {
    const b = save.base.b.find(x => x.id === p.id); if (!b) { placing = null; return; }
    markBuilding(b, false); b.tx = p.tx; b.ty = p.ty; markBuilding(b, true);
    if (b.type === 'range') spawnDummies(); reparkAll(); syncProxy(b);
  } else {
    const cost = bCost(p.type, 1), inst = instantB(p.type);
    if (!canAfford(cost) || (!inst && busyCount() >= builderCap()) || countType(p.type) >= bLimit(p.type)) { SFX.play('deny', 1); if (!inst || countType(p.type) >= bLimit(p.type) || !canAfford(cost)) { placing = null; if (inst) toast(countType(p.type) >= bLimit(p.type) ? 'Limite atteinte. Améliorez le QG.' : 'Ressources insuffisantes.'); } return; }
    pay(cost);
    const b = inst ? { id: save.base.nextId++, type: p.type, tx: p.tx, ty: p.ty, lvl: 1, up: 0, busy: 0, stored: 0, lastT: now, armed: true }
      : { id: save.base.nextId++, type: p.type, tx: p.tx, ty: p.ty, lvl: 0, up: 1, start: now, busy: now + bTime(p.type, 1) * 1000, stored: 0, lastT: now };
    save.base.b.push(b); markBuilding(b, true); syncProxy(b);
    if (!inst) { baseSel = b; reparkAll(); }
    const r = bRect(b); if (!inst) boom(r.x + r.w / 2, r.y + r.h / 2, 18); else sparks(r.x + 20, r.y + 20, 4, '#c4a77a');
    SFX.play('place', inst ? .5 : 1); if (!inst) placing = null; else placing.ok = false;
    writeSave(); updateBPanel(); return;
  }
  const r = bRect({ type: p.type, tx: p.tx, ty: p.ty }); boom(r.x + r.w / 2, r.y + r.h / 2, 18);
  SFX.play('place', 1); placing = null; writeSave(); updateBPanel();
}
function upgradeCheck(b) {
  const D = BUILD[b.type], nl = b.lvl + 1;
  if (b.busy) return 'Travaux en cours';
  if (nl > D.max) return 'Niveau maximal';
  if (b.type !== 'hq' && nl > hqLevel()) return 'QG niveau ' + nl + ' requis';
  if (attack && attack.phase === 'fight') return 'Attaque en cours';
  if (!instantB(b.type) && busyCount() >= builderCap()) return 'Aucun ouvrier libre';
  if (!canAfford(bCost(b.type, nl))) return 'Ressources insuffisantes';
  return '';
}
function upgradeBuilding(b) {
  const why = upgradeCheck(b); if (why) { toast(why + '.'); SFX.play('deny', 1); return; }
  const nl = b.lvl + 1, now = Date.now(); pay(bCost(b.type, nl));
  if (instantB(b.type)) { b.lvl = nl; syncProxy(b); SFX.play('build', .7); writeSave(); updateBPanel(); return; }
  b.up = nl; b.start = now; b.busy = now + bTime(b.type, nl) * 1000;
  SFX.play('place', .8); writeSave(); updateBPanel();
}
function openBuilding(b) {
  if (!b) return; baseSel = b;
  const D = BUILD[b.type];
  if (D.prod) collect(b);
  if (b.lvl <= 0) { updateBPanel(); toast(D.n + ' en construction.'); return; }
  const ui = D.ui;
  if (ui === 'build') openDrawer('construire');
  else if (ui) openDrawer(ui);
  else updateBPanel();
}
function bEffect(b, L) {
  L = L === undefined ? b.lvl : L; if (L <= 0) return 'Pas encore opérationnel.';
  switch (b.type) {
    case 'hq': return `Plafond des bâtiments : niveau ${L} · ${2 + (L >= 3 ? 1 : 0) + (L >= 5 ? 1 : 0)} ouvriers` + (L > 1 ? ` · +${2 * (L - 1)} commandement.` : '.');
    case 'forge': return `Châssis jusqu'au rang ${L + 1}` + (L > 1 ? ` · assemblage −${4 * (L - 1)} %.` : '.');
    case 'lab': return `Recherches jusqu'au niveau ${L}.`;
    case 'hangar': return `${[12, 24, 40, 64, 100][L - 1]} robots stockés.`;
    case 'pad': return L > 1 ? `Balise +${20 * (L - 1)} % · ancrage −${6 * (L - 1)} %.` : 'Lance les raids. Les niveaux suivants renforcent la balise.';
    case 'uplink': return `+${4 * L} points de commandement.`;
    case 'repairbay': return `Réparation gratuite : ${5 * L} % par minute.`;
    case 'shipyard': return 'Géants jusqu\'au rang ' + (6 + Math.min(3, L)) + '.';
    case 'warehouse': return `Stock des producteurs +${40 * L} % · ${Math.round(Math.min(.7, .15 + .1 * L) * 100)} % de vos stocks à l'abri des pillages de joueurs · pertes face aux pillards −${12 * L} %.`;
    case 'expedition': return `${Math.min(3, L)} expédition${L > 1 ? 's' : ''} en même temps.`;
    case 'range': return `${2 + L} cibles d'entraînement de ${600 * L} PV.`;
    case 'wall': return `${bHP({ type: 'wall', lvl: L })} points de structure.`;
    case 'mine': return `${Math.round(170 * (1 + .45 * (L - 1)))} dégâts dans un rayon de 105 px.` + (b.armed === false ? ' Désarmée.' : '');
    case 'shieldgen': return `Bouclier de ${150 * L} sur les bâtiments à moins de 320 px pendant les attaques.`;
    case 'turret_mg': case 'turret_cannon': case 'turret_tesla': case 'turret_missile': case 'mortar_pit': {
      const d = turretDef({ type: b.type, lvl: L }), dps = (d.dmg || 0) * (d.salvo || 1) * (d.pellets || 1) * d.rate;
      return `${Math.round(dps)} dps · portée ${Math.round(d.range)} px · ${bHP({ type: b.type, lvl: L })} PV.`;
    }
    default: { const D = BUILD[b.type]; if (D.prod) { const r = prodRate({ type: b.type, lvl: L }); return `${r < 1 ? r.toFixed(2).replace('.', ',') : fmt(r)} ${RES[D.prod].n} par minute · stock ${fmt(prodCap({ type: b.type, lvl: L }))}.`; } return ''; }
  }
}
function prodPerMin(res) { return save.base.b.reduce((s, b) => s + (BUILD[b.type].prod === res && b.lvl > 0 && !b.busy ? prodRate(b) : 0), 0); }

// ================= DÉFENSE DE LA BASE =================
const bProxies = new Map();
let attack = null;
function bHP(b) { const D = BUILD[b.type], base = D.hp || (b.type === 'hq' ? 3200 : D.w * D.h * 220); return Math.round(base * (1 + (b.type === 'wall' ? .6 : .4) * (Math.max(1, b.lvl) - 1))); }
function turretDef(b) {
  const D = BUILD[b.type]; if (!D.weapon || b.lvl <= 0) return null;
  const def = Object.assign({}, WEAPONS[D.weapon]), m = (D.wmul || 1) * (1 + .35 * (b.lvl - 1));
  if (def.dmg) def.dmg *= m; if (def.dps) def.dps *= m; def.range *= 1.1; def.turnMul = 1.3; return def;
}
function syncProxy(b, team = 0) {
  const D = BUILD[b.type]; if (D.mine) { if (b.armed === undefined) b.armed = true; return; }
  const r = bRect(b), mh = bHP(b); let u = bProxies.get(b.id);
  if (!u || u.dead) {
    u = baseUnit({ kind: 'building', team, x: 0, y: 0, r: 10, maxhp: mh, hp: mh, static: true, bref: b, active: true, mscale: D.w >= 3 ? 2 : 1.55 });
    units.push(u); bProxies.set(b.id, u);
  }
  const f = u.hp / u.maxhp; u.maxhp = mh; u.hp = mh * f;
  u.x = r.x + r.w / 2; u.y = r.y + r.h / 2; u.r = Math.min(r.w, r.h) / 2 * .95;
  const def = turretDef(b);
  if (def) { if (u.mounts.length && u.mounts[0].wid === D.weapon) u.mounts[0].w = def; else u.mounts = [makeMount(D.weapon, def, 0, 0)]; u.engRange = def.range; }
  else u.mounts = [];
}
function setupProxies() {
  for (const u of bProxies.values()) u.dead = true; bProxies.clear();
  for (const b of save.base.b) { if (b.type === 'wall') markBuilding(b, true); if (BUILD[b.type].mine) b.armed = true; syncProxy(b); }
}
function hitBuildingTile(tx, ty, dmg, team, src) {
  if (state !== 'base' && state !== 'assault') return;
  const id = bTileMap[ty * WT + tx]; if (!id) return; const u = bProxies.get(id); if (u && !u.dead && u.team !== team) damage(u, dmg, src);
}
function buildingDestroyed(u) {
  const b = u.bref, D = BUILD[b.type];
  boom(u.x, u.y, Math.max(40, u.r * 1.8)); addShakeNear(u.x, u.y, 4);
  if (b.type === 'wall') markBuilding(b, false);
  if (state === 'assault') { assaultBuildingDown(b); return; }
  if (b.type !== 'wall') msg(D.n + ' détruit !', '#ec6b74', 3);
  if (b.type === 'hq' && attack) deferred.push(() => endAttack(false));
}
function hqProxy() { for (const u of bProxies.values()) if (u.bref.type === 'hq' && !u.dead) return u; return null; }
function turretAI(dt) {
  for (const u of bProxies.values()) {
    if (u.dead || !u.mounts.length) continue;
    u.tt -= dt; if (u.tt <= 0) { u.tt = .3; u.target = findTarget(u, u.engRange + 40); }
  }
}
function shieldGens(dt) {
  for (const g of bProxies.values()) {
    if (g.dead || g.bref.type !== 'shieldgen' || g.bref.lvl <= 0) continue;
    const L = g.bref.lvl, cap = 150 * L, reg = 25 * L;
    for (const v of bProxies.values()) { if (v.dead || d2(v.x, v.y, g.x, g.y) > 320 * 320) continue; v.shieldMax = cap; v.shield = Math.min(cap, (v.shield || 0) + reg * dt); v.shieldT = time; }
  }
}
function minesTick() {
  for (const b of save.base.b) {
    if (!BUILD[b.type].mine || !b.armed || b.lvl <= 0) continue;
    const x = (b.tx + .5) * TILE, y = (b.ty + .5) * TILE; let hit = false;
    query(x - 40, y - 40, x + 40, y + 40, v => { if (v.team === 1 && !v.dead && !v.fly && v.etype !== 'cible' && d2(v.x, v.y, x, y) < (v.r + 22) ** 2) { hit = true; return true; } });
    if (hit) { b.armed = false; explode(x, y, 105, 170 * (1 + .45 * (b.lvl - 1)), 0, null); }
  }
}
const ATK_COST = { rodeur: 1, pillard: 1.5, essaim: .7, traqueur: 2, belier: 3, faucon: 2.5, char: 4, artilleur: 3, mastodonte: 12 };
function buildWaves() {
  const hq = hqLevel(), th = save.base.threat || 0, D = DIFFS[save.diff];
  const budget = (10 + 9 * hq + th * .25) * D.spawn;
  const pool = ['rodeur', 'pillard', 'essaim', 'traqueur', 'belier']; if (hq >= 2) pool.push('faucon', 'char'); if (hq >= 3) pool.push('artilleur');
  return [.25, .35, .4].map((part, w) => {
    let b = budget * part; const list = [];
    if (w === 2 && hq >= 3 && b >= 16) { list.push('mastodonte'); b -= 12; }
    if (b >= 4) { list.push('belier'); b -= 3; }
    let guard = 0;
    while (b > .6 && guard++ < 300) { const t = pick(pool), c = ATK_COST[t] * (t === 'essaim' ? 4 : 1); if (c > b) continue; list.push(t); if (t === 'essaim') list.push('essaim', 'essaim', 'essaim'); b -= c; }
    return list;
  });
}
function scheduleAttack(delay, why) {
  if (attack || state !== 'base') return;
  diff = DIFFS[save.diff];
  attack = { phase: 'warn', t: delay, wave: 0, waves: buildWaves(), next: 0, loot: {}, kills: 0, alive: 0, total: 0 };
  if (TUT.on) { attack.t = Math.min(delay, 15); attack.waves = TUT.waves(); } // attaque d'entraînement, courte et sans surprise
  attack.total = attack.waves.reduce((s, w) => s + w.length, 0);
  msg(why || 'Des pillards approchent de la base !', '#ff6b74', 8);
  msg('Préparez la défense : tourelles, murs, mines. Vos robots stationnés défendront.', '#f2c14e', 8);
  SFX.play('wave', 1); SFX.play('alarm', .7); buzz([80, 80, 80]); closeDrawer(true); updateBPanel();
}
function spawnWave(list) {
  const side = pick(['n', 's', 'e', 'w']), nm = { n: 'nord', s: 'sud', e: 'est', w: 'ouest' }[side];
  for (const type of list) {
    let x = 150 * TILE + rnd(-160, 160), y = 150 * TILE + rnd(-160, 160);
    if (side === 'n') y = (BY0 - 3) * TILE; else if (side === 's') y = (BY1 + 3) * TILE; else if (side === 'w') x = (BX0 - 3) * TILE; else x = (BX1 + 3) * TILE;
    const p = findWalkableNear(x, y, 0, 120, 30) || { x, y };
    makeEnemy(type, p.x, p.y, { active: true, baseRaid: true, alerted: true });
  }
  msg('Vague ' + attack.wave + ' / ' + attack.waves.length + ' : ' + list.length + ' assaillants par le ' + nm + '.', '#ff6b74', 5); SFX.play('wave', .9);
}
function updateAttack(dt) {
  if (!attack) return;
  if (attack.phase === 'warn') { attack.t -= dt; if (attack.t <= 0) { attack.phase = 'fight'; attack.next = 0; msg('L\'attaque commence !', '#ff6b74', 4); placing = null; closeDrawer(true); } return; }
  let alive = 0; for (const u of units) if (u.baseRaid && !u.dead) alive++; attack.alive = alive;
  attack.next -= dt;
  if (attack.wave < attack.waves.length && (attack.next <= 0 || alive === 0)) { attack.wave++; spawnWave(attack.waves[attack.wave - 1]); attack.next = 30; }
  else if (attack.wave >= attack.waves.length && alive === 0) endAttack(true);
  if (attack) { shieldGens(dt); minesTick(); }
}
function attackLoot(e) {
  if (!attack) return; attack.kills++;
  for (const [res, a, b, ch] of ENEMIES[e.etype].loot) { if (res === 'heart' || Math.random() > ch) continue; attack.loot[res] = (attack.loot[res] || 0) + rndi(a, b) * diff.loot * .8; }
}
function endAttack(win) {
  if (!attack) return; const a = attack; attack = null; SFX.play(win ? 'success' : 'fail', 1);
  for (const u of units) if (u.baseRaid && !u.dead) { u.dead = true; boom(u.x, u.y, 25); }
  const rows = {};
  if (win) {
    const hq = hqLevel(); a.loot.scrap = (a.loot.scrap || 0) + 30 * hq; a.loot.data = (a.loot.data || 0) + 3 * hq;
    for (const k in a.loot) { const n = Math.round(a.loot[k]); if (n > 0) { save.res[k] += n; rows[k] = n; } }
    save.base.threat = 0; save.stats.defenses = (save.stats.defenses || 0) + 1;
  } else {
    const keep = 1 - .12 * bLevel('warehouse');
    for (const k of ['scrap', 'alloy', 'circuits', 'crystals', 'data']) { const n = Math.floor(save.res[k] * .15 * keep); if (n > 0) { save.res[k] -= n; rows[k] = n; } }
    for (const b of save.base.b) if (BUILD[b.type].prod) b.stored = (b.stored || 0) * .5;
    save.base.threat = 10;
  }
  for (const u of fleet) if (!u.dead) syncRobotSave(u, true);
  const ko = [];
  for (const sr of save.robots) if (!sr.exp && !fleet.some(f => f.sid === sr.id && !f.dead)) { sr.hp = .15; ko.push(sr.name); spawnBaseRobot(sr); }
  setupProxies();
  if (player.hp <= 0 || player.dead) { player.dead = false; player.hp = player.maxhp; }
  writeSave();
  const list = RES_KEYS.filter(k => rows[k]).map(k => `<div><span>${RES[k].n}</span><b class="${win ? 'good' : 'lost'}">${win ? '+' : '−'}${fmt(rows[k])}</b></div>`).join('');
  $('#resultBox').innerHTML = `<h3>${win ? 'Attaque repoussée' : 'Base pillée'}</h3>
    <p>${win ? 'Les pillards ont été anéantis : vos ouvriers récupèrent leurs carcasses.' : 'Le QG est tombé. Les pillards repartent avec une partie de vos stocks. Les bâtiments sont remis en état.'} ${a.kills} assaillants abattus.</p>
    <div class="slot-h">${win ? 'Butin récupéré' : 'Ressources volées'}</div><div class="res-list">${list || '<div><span>Rien</span><b>—</b></div>'}</div>
    ${ko.length ? `<p class="lost">Robots hors service, réparés en urgence : ${ko.map(esc).join(', ')}</p>` : ''}
    <div class="btns"><button class="btn hot" data-act="closeattack">Continuer</button></div>`;
  paused = true; showOverlay('result', true);
}
function pickBaseTarget(e) {
  let best = null, bs = Infinity;
  for (const v of units) {
    if (v.team !== 0 || v.dead || v.hidden || v.kind === 'minion') continue;
    let d = Math.hypot(v.x - e.x, v.y - e.y);
    if (v.kind === 'building') {
      const t = v.bref.type;
      if (t === 'wall') { if (e.fly) continue; d *= e.siege ? .6 : 2.4; }
      else if (e.etype === 'char' && v.mounts.length) d *= .5;
      else if (e.siege) d *= .9;
    } else { if (e.siege) d *= 4; else if (v.cloak && time - v.lastFire > 1.5 && d > 250) continue; }
    if (d < bs) { bs = d; best = v; }
  }
  return best;
}
function baseEnemyAI(e, dt) {
  e.tt -= dt;
  if (e.tt <= 0 || !e.target || e.target.dead) { e.tt = .7 + Math.random() * .4; e.target = pickBaseTarget(e); }
  if ((e.stuckN || 0) >= 2) {
    e.stuckN = 0; let b = null, bd = 170 * 170;
    for (const v of bProxies.values()) { if (v.dead) continue; const q = d2(v.x, v.y, e.x, e.y) - v.r * v.r; if (q < bd) { bd = q; b = v; } }
    if (b) { e.target = b; e.tt = 4; }
  }
  const t = e.target;
  if (!t) { const hq = hqProxy(); if (hq) steer(e, hq.x, hq.y, dt, 1, 60); return; }
  if (e.human) e.ang = turnTo(e.ang, Math.atan2(t.y - e.y, t.x - e.x), dt * 8);
  const melee = e.mounts.some(m => m.w.kind === 'melee');
  engage(e, t, dt, (melee ? 0 : e.engRange * .75) + (t.kind === 'building' ? t.r : 0), false);
}
