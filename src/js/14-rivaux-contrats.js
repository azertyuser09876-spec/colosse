// Équipes rivales et contrats de raid.

// ================= ÉQUIPES RIVALES =================
let crews = [], raidContracts = [], radarLv = 0;
const CREW_NAMES = [TL('Les Charognards'), TL('Clan Boulon'), TL('Compagnie Rouille-Noire'), TL('Les Ferrovores'), TL('Brigade Écrou'), TL('Les Vautours de fer'), TL('Syndicat du Rivet')];
const RIVAL_CHASSIS = [['crawler', 'drone', 'sentry', 'ant', 'scout'], ['gunship', 'mantis', 'strider', 'mule'], ['rhino', 'spider', 'goliath', 'echassier', 'tortue'], ['reaper', 'airship', 'scolopendre', 'titan']];
function dirName(dx, dy) { const a = Math.atan2(dy, dx), k = Math.round(a / (Math.PI / 4)); return [TL('à l\'est'), TL('au sud-est'), TL('au sud'), TL('au sud-ouest'), TL('à l\'ouest'), TL('au nord-ouest'), TL('au nord'), TL('au nord-est')][(k + 8) % 8]; }
function rivalWeapons(ch) {
  // chaque affût reçoit une arme de sa taille ou d'une taille en dessous (jamais titanesque)
  return MOUNTS[ch].map((_, i) => { const s = slotSize(ch, i), pool = CRAFT_WEAPONS.filter(w => { const W_ = WEAPONS[w]; return W_.size <= s && W_.size < 4 && W_.size >= s - 1 && !['repair', 'shield', 'bay', 'nuke'].includes(w); }); return pick(pool.length ? pool : ['mg']); });
}
function spawnRivals() {
  crews = [];
  const R = REGIONS[regionCur], n = R.rivals + ((LIVE.game ? LIVE.game.diff : save.diff) >= 2 ? 1 : 0);
  const names = CREW_NAMES.slice().sort(() => Math.random() - .5);
  for (let i = 0; i < n; i++) {
    let p = null;
    for (let k = 0; k < 80 && !p; k++) { const q = findWalkableNear(WPX / 2, WPX / 2, 1500, WPX * .46, 10); if (q && d2(q.x, q.y, W.spawn.x, W.spawn.y) > 2600 * 2600 && !(LIVE.game && LIVE.nearSpawn(q.x, q.y, 2600)) && crews.every(c => d2(q.x, q.y, c.leader.x, c.leader.y) > 1800 * 1800)) p = q; }
    if (!p) continue;
    const crew = { id: i, name: names[i % names.length], pal: CREW_PALS[i % CREW_PALS.length], bots: [], bag: {}, state: 'loot', t: rnd(170, 320) + i * 45, goal: null, crate: null, openT: 0, beacon: null, charge: 0, pulseT: 8, dead: false, out: false };
    const L = baseUnit({ kind: 'rival', team: 2, role: 'leader', x: p.x, y: p.y, r: 12, maxhp: 240 * diff.hp, hp: 240 * diff.hp, spd: 185, human: true, crew, active: true, pw: { gun: 'ar' } });
    const def = Object.assign({}, WEAPONS.e_rifle); def.dmg = 12 * diff.dmg; def.range = 600;
    L.mounts = [makeMount('e_rifle', def, 7, 4)]; L.engRange = 480;
    units.push(L); crew.leader = L;
    const tier = R.tier, nb = 2 + tier + rndi(0, 1), pool = RIVAL_CHASSIS.slice(0, tier).flat();
    for (let j = 0; j < nb; j++) {
      const ch = pick(pool), sr = { chassis: ch, weapons: rivalWeapons(ch), modules: [], xp: rnd(0, 70 * tier), traits: [], hp: 1, name: CHASSIS[ch].n, brain: 'escort', id: -1 };
      const q = findWalkableNear(p.x, p.y, 40, 220, 20) || p;
      const u = makeRobot(sr, q.x, q.y);
      u.kind = 'rival'; u.team = 2; u.role = 'bot'; u.crew = crew; u.sid = -1;
      u.maxhp *= diff.hp; u.hp = u.maxhp; for (const m of u.mounts) { if (m.w.dmg) m.w.dmg *= diff.dmg; if (m.w.dps) m.w.dps *= diff.dmg; }
      units.push(u); crew.bots.push(u);
    }
    crews.push(crew);
  }
}
function rollInto(bag, tab) { for (const [res, a, b, ch] of tab) { if (Math.random() > ch) continue; bag[res] = (bag[res] || 0) + rndi(a, b) * diff.loot; } }
function crewsTick(dt) {
  for (const cr of crews) {
    if (cr.dead || cr.out) continue;
    const L = cr.leader; cr.t -= dt;
    if (cr.state === 'loot') {
      if (cr.crate && !cr.crate.open && d2(L.x, L.y, cr.crate.x, cr.crate.y) < 75 * 75) {
        cr.openT += dt;
        if (cr.openT > 1.2) { cr.crate.open = true; rollInto(cr.bag, CRATE_LOOT[cr.crate.type]); cr.crate = null; cr.goal = null; cr.openT = 0; }
      } else if (!cr.goal || d2(L.x, L.y, cr.goal.x, cr.goal.y) < 80 * 80 || (cr.crate && cr.crate.open)) {
        if (cr.crate) { cr.crate.claimed = null; cr.crate = null; }
        let best = null, bd = 2400 * 2400;
        for (const c of crates) { if (c.open || c.claimed) continue; const q = d2(c.x, c.y, L.x, L.y); if (q < bd) { bd = q; best = c; } }
        if (best) { cr.crate = best; best.claimed = cr; cr.goal = { x: best.x, y: best.y }; cr.openT = 0; }
        else cr.goal = findWalkableNear(L.x, L.y, 400, 1200, 20) || { x: L.x, y: L.y };
      }
      if (cr.t <= 0) {
        cr.state = 'extract'; if (cr.crate) { cr.crate.claimed = null; cr.crate = null; }
        let best = null, bd = 2600 * 2600; for (const p of W.pylons) { const q = d2(p.x, p.y, L.x, L.y); if (q < bd) { bd = q; best = p; } }
        cr.goal = best ? (findWalkableNear(best.x, best.y, 80, 180, 20) || { x: L.x, y: L.y }) : { x: L.x, y: L.y };
      }
    } else if (cr.state === 'extract') {
      if (d2(L.x, L.y, cr.goal.x, cr.goal.y) < 90 * 90 || cr.t < -60) plantRivalBeacon(cr);
    } else if (cr.state === 'anchor') {
      const b = cr.beacon; if (!b || b.dead) continue;
      cr.charge += dt / 80; cr.pulseT -= dt;
      if (cr.pulseT <= 0) {
        cr.pulseT = 12; parts.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: 1, max: 1, size: 900, col: cr.pal.acc, thin: true });
        for (const e of units) if (e.kind === 'enemy' && !e.dead && !e.static && !e.boss && d2(e.x, e.y, b.x, b.y) < 900 * 900) { e.forced = b; e.active = true; }
      }
      if (cr.charge >= 1) rivalExtract(cr);
    }
  }
}
function plantRivalBeacon(cr) {
  const L = cr.leader, p = findWalkableNear(L.x, L.y, 30, 80, 20) || { x: L.x + 30, y: L.y };
  const b = baseUnit({ kind: 'beacon2', team: 2, x: p.x, y: p.y, r: 18, maxhp: 900 * diff.hp, hp: 900 * diff.hp, static: true, crew: cr, active: true, name: TL('Balise rivale') });
  units.push(b); cr.beacon = b; cr.state = 'anchor'; cr.charge = 0; cr.pulseT = 5;
  const F = focus(); msg(TL('{crew} ancre une balise {dir} ({n} m).', { crew: cr.name, dir: dirName(b.x - F.x, b.y - F.y), n: Math.round(Math.hypot(b.x - F.x, b.y - F.y) / 10) }), COL.rival, 7);
  SFX.play('beacon', .5); reveal(b.x, b.y, 320);
}
function rivalExtract(cr) {
  cr.out = true; const b = cr.beacon;
  for (const u of [cr.leader].concat(cr.bots)) if (!u.dead) { u.dead = true; parts.push({ type: 'flash', x: u.x, y: u.y, vx: 0, vy: 0, life: .3, max: .3, size: u.r * 3, col: '#fff', a: 0 }); }
  if (b) { b.dead = true; parts.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: .9, max: .9, size: 300, col: cr.pal.acc }); }
  msg(TL('{crew} s\'est extrait avec son butin.', { crew: cr.name }), COL.rival, 6);
}
function rivalDown(u, src) {
  const cr = u.crew, byUs = src && src.team === 0 && !src.net;
  if (u.kind === 'beacon2') {
    boom(u.x, u.y, 60);
    if (cr && !cr.out) { cr.beacon = null; if (cr.state === 'anchor') { cr.state = 'loot'; cr.t = 75; cr.goal = null; } }
    if (cr) for (const k in cr.bag) { const n = Math.floor(cr.bag[k] * .4); if (n > 0) { spawnItem(k, n, u.x, u.y); cr.bag[k] -= n; } }
    if (raidStats && byUs) raidStats.sabotage++;
    msg(cr ? TL('Balise de {crew} détruite !', { crew: cr.name }) : TL('Balise de l\'équipe rivale détruite !'), COL.rival, 5); return;
  }
  if (u.role === 'leader') {
    cr.dead = true;
    for (const k in cr.bag) if (cr.bag[k] >= 1) spawnItem(k, Math.round(cr.bag[k]), u.x, u.y);
    spawnItem('data', rndi(3, 6), u.x, u.y); if (Math.random() < .35) spawnItem('cores', 1, u.x, u.y);
    if (raidStats && byUs) raidStats.rivalKills++;
    msg(TL('Le chef de {crew} est tombé. Son butin est au sol.', { crew: cr.name }), COL.rival, 6);
    if (cr.beacon && !cr.beacon.dead) { cr.beacon.dead = true; boom(cr.beacon.x, cr.beacon.y, 50); }
  } else dropTable([['scrap', 3, 8, 1], ['alloy', 1, 4, .6], ['circuits', 1, 3, .5]], u.x, u.y);
}
function rivalsHear(bx, by) {
  for (const cr of crews) {
    if (cr.dead || cr.out || cr.state !== 'loot' || cr.ambush) continue;
    if (d2(cr.leader.x, cr.leader.y, bx, by) < 2400 * 2400 && Math.random() < .45) {
      cr.ambush = true; if (cr.crate) { cr.crate.claimed = null; cr.crate = null; }
      cr.goal = findWalkableNear(bx, by, 260, 480, 20) || { x: bx, y: by };
      msg(TL('{crew} a capté votre signal et approche !', { crew: cr.name }), COL.rival, 6);
    }
  }
}

// ================= CONTRATS =================
function fleetCargo(res) { let n = player.cargo[res] || 0; for (const r of fleet) if (!r.dead) n += r.cargo[res] || 0; return n; }
function contractProgress(c) {
  const s = raidStats; if (!s) return [0, 1];
  if (isMission(c)) return misProgress(c);
  switch (c.kind) {
    case 'hunt': return [s.byType[c.target] || 0, c.count];
    case 'elite': return [s.byType.mastodonte || 0, c.count];
    case 'archives': return [s.archives, c.count];
    case 'pylons': return [s.pylons, c.count];
    case 'rival': return [s.rivalKills, 1];
    case 'sabotage': return [s.sabotage, 1];
    case 'boss': return [s.bossType === c.target ? 1 : 0, 1];
    case 'salvage': return [Math.floor(fleetCargo(c.res)), c.count];
    case 'speed': return [raidTime <= c.time ? 1 : 0, 1];
    case 'noloss': return [s.lost === 0 && s.deployed >= c.min ? 1 : 0, 1];
  }
  return [0, 1];
}
function contractDone(c, gained) {
  if (c.kind === 'salvage') return (gained[c.res] || 0) >= c.count;
  if (c.kind === 'speed') return raidTime <= c.time;
  const [a, b] = contractProgress(c); return a >= b;
}
function contractLine(c) {
  if (isMission(c)) return misLine(c);
  const [a, b] = contractProgress(c);
  if (c.kind === 'speed') return contractText(c) + ' · ' + (raidTime <= c.time ? TL('reste {t}', { t: mmss(c.time - raidTime) }) : TL('délai dépassé'));
  if (c.kind === 'noloss') return contractText(c) + (raidStats && raidStats.lost ? ' · ' + TL('échoué') : '');
  return contractText(c) + ' · ' + Math.min(a, b) + ' / ' + b;
}
function rewardHtml(r) { return Object.keys(r).map(k => TL('{n} {res}', { n: fmt(r[k]), res: RES[k].n })).join(', '); }
