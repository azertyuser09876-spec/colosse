// Équipement de la 3.1 : 14 modules (passifs et capacités actives), 2 cerveaux, 13 améliorations du pilote, 7 protocoles,
// et les aptitudes (perks) des nouveaux châssis. Les effets se branchent sur les registres d'extension (MOD_FX, MOD_TICK, ABIL,
// BRAIN_AI, PERK_TICK, PILOT_TICK, HURT_IN, HURT_OUT, DEATH_SAVE, ZONE_K) ; quelques fonctions du moteur sont enveloppées
// depuis LATE (dégâts, statistiques, balise, butin, expérience, fabrique, dessin des unités).

// état partagé et transitoire de ce fichier
const EQ = { thornLock: false, salv: false };

// ================= RECHERCHES : FAMILLE « LOGISTIQUE » =================
(() => { const B = RT_BRANCHES.find(b => b.id === 'pi'); if (B && !B.fam.some(f => f.id === 'log')) B.fam.push({ id: 'log', n: TL('Logistique'), ids: [] }); })();

// ================= A. MODULES =================
Object.assign(MODULES, {
  ablative: { n: TL('Coque ablative'), cost: { alloy: 40, crystals: 10 }, d: TL('−30 % de dégâts reçus tant que le robot a plus de 70 % de ses PV.') },
  servo: { n: TL('Servomoteurs'), cost: { circuits: 20, alloy: 12 }, d: TL('+15 % de vitesse, tourelles deux fois plus vives.') },
  targeting: { n: TL('Ordinateur de tir'), cost: { circuits: 30, crystals: 10 }, d: TL('+20 % de dégâts contre les blindés (20 % de blindage ou plus), les géants et les boss.') },
  reactor: { n: TL('Réacteur auxiliaire'), cost: { circuits: 35, crystals: 20, cores: 1 }, d: TL('+20 % de cadence de tir, −10 % de PV.') },
  leech: { n: TL('Siphon de nanites'), cost: { crystals: 30, circuits: 20 }, d: TL('Rend au robot 8 % des dégâts qu\'il inflige.') },
  thorns: { n: TL('Carapace électrifiée'), cost: { circuits: 22, alloy: 18 }, d: TL('Renvoie à l\'attaquant 25 % des dégâts reçus au contact et 10 % des dégâts à distance (jusqu\'à 500 px).') },
  collector: { n: TL('Collecteur magnétique'), cost: { scrap: 30, circuits: 10 }, d: TL('Attire le butin à moins de 280 px et le range dans sa soute.') },
  scanner: { n: TL('Radar de bord'), cost: { circuits: 25, crystals: 12 }, d: TL('Toutes les 0,5 s, révèle les ennemis camouflés à moins de 600 px et les marque : +10 % de dégâts subis.') },
  coolant: { n: TL('Refroidissement cryo'), cost: { crystals: 25, circuits: 25 }, d: TL('Armes continues +20 % de dégâts, armes à charge 40 % plus rapides, tourelles 20 % plus vives.') },
  decoy: { n: TL('Leurre holographique'), active: 1, cd: 30, dur: 8, cost: { circuits: 30, crystals: 20 }, d: TL('Capacité : un double holographique attire les tirs ennemis à moins de 900 px pendant 8 s. Recharge 30 s.') },
  smoke: { n: TL('Écran de fumée'), active: 1, cd: 25, dur: 7, cost: { scrap: 20, crystals: 10 }, d: TL('Capacité : nuage de fumée de 7 s ; les alliés dedans sont camouflés et esquivent 40 % des tirs. Recharge 25 s.') },
  repairdrone: { n: TL('Drone de réparation'), active: 1, cd: 32, dur: 15, cost: { circuits: 30, crystals: 20 }, d: TL('Capacité : un drone suit le robot et répare les alliés proches pendant 15 s. Recharge 32 s.') },
  shockwave: { n: TL('Onde de choc'), active: 1, cd: 20, cost: { alloy: 30, circuits: 20 }, d: TL('Capacité : onde autour du robot qui blesse, étourdit 1,2 s et repousse les ennemis. Recharge 20 s.') },
  minefield: { n: TL('Poseur de mines'), active: 1, cd: 24, cost: { scrap: 30, alloy: 12 }, d: TL('Capacité : sème 5 mines autour du robot, actives 40 s. Recharge 24 s.') },
});
[
  ['ablative', 3, { data: 20, alloy: 30 }, 'prot', 'm_plating', TL('Encaisse mieux tant que la coque est intacte.')],
  ['servo', 2, { data: 10, circuits: 14 }, 'mob', 'm_thrusters', TL('Plus rapide, tourelles plus vives.')],
  ['targeting', 3, { data: 22, circuits: 25 }, 'cbt', 'm_sensors', TL('Plus de dégâts contre les cibles lourdes.')],
  ['reactor', 4, { data: 40, crystals: 30 }, 'cbt', 'm_overcharge', TL('Cadence de tir accrue, coque plus fragile.')],
  ['leech', 4, { data: 36, crystals: 30 }, 'prot', 'm_regen', TL('Les dégâts infligés réparent le robot.')],
  ['thorns', 2, { data: 12, circuits: 16 }, 'prot', 'm_armor', TL('Renvoie une partie des coups à l\'attaquant.')],
  ['collector', 1, { data: 4, scrap: 30 }, 'mob', 'm_cargo', TL('Le robot aspire le butin autour de lui.')],
  ['scanner', 2, { data: 14, circuits: 18 }, 'cbt', 'm_sensors', TL('Révèle et marque les ennemis proches.')],
  ['coolant', 3, { data: 24, crystals: 24 }, 'cbt', 'm_stabil', TL('Rayons plus puissants, charges plus rapides.')],
  ['decoy', 3, { data: 26, circuits: 30 }, 'mob', 'm_cloak', TL('Capacité active : un leurre attire les tirs.')],
  ['smoke', 2, { data: 12, crystals: 10 }, 'mob', 'm_thrusters', TL('Capacité active : nuage qui cache les alliés.')],
  ['repairdrone', 3, { data: 24, crystals: 24 }, 'prot', 'm_regen', TL('Capacité active : drone qui répare les alliés.')],
  ['shockwave', 3, { data: 22, alloy: 26 }, 'cbt', 'm_selfdestruct', TL('Capacité active : onde qui étourdit et repousse.')],
  ['minefield', 2, { data: 10, alloy: 14 }, 'cbt', 'm_selfdestruct', TL('Capacité active : champ de mines autour du robot.')],
].forEach(([id, lab, cost, fam, req, d]) => addResearch({ id: 'm_' + id, cat: TL('Modules'), lab, n: MODULES[id].n, cost, d, req, fam }));

// ---------- statistiques (robotStats) ----------
// les drapeaux de s.ext comptent les exemplaires du module (deux coques ablatives : 0,7 × 0,7)
const eqFlag = (s, k) => { s.ext[k] = (s.ext[k] || 0) + 1; };
MOD_FX.ablative = s => eqFlag(s, 'ablative');
MOD_FX.servo = s => { s.spd *= 1.15; s.turn *= 2; };
MOD_FX.targeting = s => eqFlag(s, 'targeting');
MOD_FX.reactor = s => { s.ext.rate = (s.ext.rate || 1) * 1.2; s.hp *= .9; };
MOD_FX.leech = s => eqFlag(s, 'leech');
MOD_FX.thorns = s => eqFlag(s, 'thorns');
MOD_FX.coolant = s => { s.turn *= 1.2; s.wfx.push(d => { if (d.dps && !d.rate) d.dps *= 1.2; if (d.charge) d.charge /= 1.4; }); };

// ---------- dégâts infligés et reçus ----------
const eqHeavy = v => (v.armor || 0) >= .2 || v.giant || v.boss || v.r > 150;
HURT_OUT.push((src, v, amt) => {
  const e = src.ext;
  if (e.targeting && eqHeavy(v)) amt *= Math.pow(1.2, e.targeting);
  if (e.pack && src.packN) amt *= 1 + .1 * src.packN;
  if (e.siege && src.sieged) amt *= 1.2;
  return amt;
});
HURT_IN.push((u, amt, src) => {
  const e = u.ext;
  if (e.ablative && u.hp > u.maxhp * .7) {
    amt *= Math.pow(.7, e.ablative);
    if (Math.random() < .12 && parts.length < 850) parts.push({ type: 'shard', x: u.x + rnd(-u.r, u.r) * .6, y: u.y + rnd(-u.r, u.r) * .6, vx: rnd(-90, 90), vy: rnd(-90, 90), life: .5, max: .5, size: 1.5 + u.r * .06, rot: rnd(0, 6), col: '#8a9a9c' });
  }
  if (e.shieldwall && src && src !== u) {
    const a = Math.atan2(src.y - u.y, src.x - u.x);
    if (Math.abs(angDiff(u.ang, a)) < Math.PI / 3) { amt *= .6; u.swHit = time; u.swA = a; }
  }
  return amt;
});

// ---------- butin : collecteur (module) et aimant (perk) ----------
// attire le butin dans le rayon R et le range dans la soute de u
function eqVacuum(u, R, dt) {
  if (u.cargoMax <= 0 || u.dead || !items.length) return;
  const free = u.cargoMax - u.cargoW; if (free < .02) return;
  const R2 = R * R, pr = u.r + 18, pr2 = pr * pr, guest = LIVE.guest();
  for (const it of items) {
    if (it.dead || it.t < .35) continue;
    const q = d2(it.x, it.y, u.x, u.y); if (q > R2) continue;
    if (RES[it.res].w > free) continue;
    if (q < pr2) {
      if (guest) { LIVE.pick(it, u); continue; }
      const g = addCargo(u, it.res, it.amt);
      if (g > 0) { it.amt -= g; floatText(u.x, u.y - u.r - 8, TL('+{n} {res}', { n: g, res: RES[it.res].n }), '#6fe3c8'); if (isMine(u) || d2(u.x, u.y, focus().x, focus().y) < 500 * 500) SFX.play('pickup', .4, u.x, u.y, { note: 660 }); }
      if (it.amt <= 0) it.dead = true;
    } else {
      const d = Math.sqrt(q), sp = Math.min(d - pr * .5, (260 + 260 * (1 - d / R)) * dt);
      it.x += (u.x - it.x) / d * sp; it.y += (u.y - it.y) / d * sp;
      if (Math.random() < dt * 6) beams.push({ x1: it.x, y1: it.y, x2: u.x, y2: u.y, life: .12, max: .12, col: 'rgba(111,227,200,.45)', w: 1, heal: true });
    }
  }
}
MOD_TICK.collector = (u, dt) => eqVacuum(u, 280, dt);

// ---------- radar de bord (module) et radar (perk) ----------
// révèle les camouflés du rayon et les marque (+10 % de dégâts subis pendant 1 s) ; renvoie le nombre d'ennemis vus
function eqReveal(u, R) {
  let n = 0;
  foesIn(u.x, u.y, R, u.team, v => {
    if (v.kind === 'building') return;
    if (v.cloak) v.lastFire = Math.max(v.lastFire || -9, time - 1);
    if (!(v.vulnT > time)) v.vuln = .1; else v.vuln = Math.max(v.vuln || 0, .1);
    v.vulnT = Math.max(v.vulnT || 0, time + 1); n++;
  });
  return n;
}
function eqRadarTick(u, dt, R, col) {
  u.radT = (u.radT || 0) - dt; if (u.radT > 0) return; u.radT = .5;
  const n = eqReveal(u, R);
  u.radP = (u.radP || 0) - .5;
  if (n && u.radP <= 0 && fxQ() !== 'low' && parts.length < 850) { u.radP = 2; parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .9, max: .9, size: R, col, thin: true }); }
}
MOD_TICK.scanner = (u, dt) => eqRadarTick(u, dt, 600, 'rgba(127,220,255,.5)');

// ================= CAPACITÉS ACTIVES =================
// unité alliée temporaire (leurre, drone) : comme deployUnit, mais elle s'éteint sans exploser à la fin de sa zone
function eqSpawn(owner, x, y, o) {
  if (NETVIS) return null;
  const hp = Math.max(1, o.hp || 100);
  const u = baseUnit({ kind: 'minion', team: owner.team, x, y, r: o.r || 12, maxhp: hp, hp, spd: o.spd || 0, fly: !!o.fly, static: !!o.static, owner, mscale: o.sc || 1, active: true, mpaint: o.paint || null, sight: o.sight || 1, leash: o.leash || 1, eng: 160, temp: true, ang: owner.ang, tier: owner.tier || 1 });
  u.engRange = 300; units.push(u);
  addZone('eq_temp', x, y, 0, o.life || 10, owner.team, owner, { unit: u, beam: !!o.beam });
  return u;
}
// petit grésillement d'extinction (hologramme, drone en fin de mission)
function eqFizzle(x, y, r, col) {
  if (parts.length > 850) return;
  for (let k = 0; k < 10; k++) { const a = Math.random() * TAU, s = rnd(30, 120); parts.push({ type: 'spark', x: x + Math.cos(a) * r * .5, y: y + Math.sin(a) * r * .5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.2, .45), max: .45, size: 1.6, col }); }
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .35, max: .35, size: r * 1.6 + 10, col, thin: true });
}
ZONE_K.eq_temp = {
  tick(f) { const u = f.unit; if (!u || u.dead) { f.t = 0; return; } f.x = u.x; f.y = u.y; if (u.holo) { u.t += frameDt * .5; } },
  draw(c, f) {
    const u = f.unit, o = f.src; if (!f.beam || !u || u.dead || !o || o.dead) return;
    // fin rayon du projecteur, du robot vers son double
    const fl = .18 + .12 * Math.sin(time * 37 + u.id);
    c.strokeStyle = `rgba(120,230,255,${fl})`; c.lineWidth = Math.max(1, 1.5 / cam.zoom); c.setLineDash([4, 6]); c.lineDashOffset = -time * 40;
    c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(u.x, u.y); c.stroke(); c.setLineDash([]);
  },
  end(f) { const u = f.unit; if (u && !u.dead) { u.dead = true; eqFizzle(u.x, u.y, u.r, u.holo ? '#8fe8ff' : '#6fe3c8'); } },
};
// un hologramme ne laisse ni épave ni explosion
DEATH_SAVE.push(u => { if (!u.holo || u.dead) return false; u.dead = true; u.hp = 0; eqFizzle(u.x, u.y, u.r, '#8fe8ff'); SFX.play('emp', .35, u.x, u.y); return true; });
// les affûts du leurre suivent l'ennemi sans tirer
W_TICK.holo = (u, m, dt, mx, my) => {
  m.tt2 = (m.tt2 || 0) - dt;
  if (m.tt2 <= 0) { m.tt2 = .35; m.tgt2 = nearestFoe(mx, my, 700, u.team); }
  const t = m.tgt2 && !m.tgt2.dead ? m.tgt2 : null;
  m.aim = turnTo(m.aim, t ? Math.atan2(t.y - my, t.x - mx) : u.ang, 4 * dt);
  return true;
};
W_FIRE.holo = () => false;
// ennemis voisins forcés sur le leurre (après leur choix de cible, avant leurs tirs)
ZONE_K.eq_lure = {
  tick(f) {
    const d = f.unit; if (!d || d.dead) { f.t = 0; return; }
    f.x = d.x; f.y = d.y; if (f.tick > 0 || NETVIS) return; f.tick = .25; // f.tick décroît déjà dans updateFires
    foesIn(d.x, d.y, 900, d.team, v => { if ((v.kind === 'enemy' || v.kind === 'rival') && !v.net) { v.target = d; v.tt = Math.max(v.tt || 0, .45); } });
  },
  draw(c, f) { const d = f.unit; if (!d || d.dead) return; const p = (time * .8) % 1; c.strokeStyle = `rgba(120,230,255,${.35 * (1 - p)})`; c.lineWidth = Math.max(1, 2 / cam.zoom); circ(c, d.x, d.y, d.r * (1.2 + p * 1.6) + 8); c.stroke(); },
};
ABIL.decoy = {
  use(u, a, ax, ay) {
    let x, y;
    if (ax !== undefined) { const dd = Math.hypot(ax - u.x, ay - u.y), L = Math.min(dd, 450 + u.r), an = Math.atan2(ay - u.y, ax - u.x); x = u.x + Math.cos(an) * L; y = u.y + Math.sin(an) * L; }
    else {
      const t = u.target && !u.target.dead ? u.target : null, an = t ? Math.atan2(t.y - u.y, t.x - u.x) : u.ang, side = (u.id & 1 ? 1 : -1) * Math.PI / 2;
      x = u.x + Math.cos(an + side) * (u.r * 2 + 70) + Math.cos(an) * 50; y = u.y + Math.sin(an + side) * (u.r * 2 + 70) + Math.sin(an) * 50;
    }
    if (!u.fly) { const p = findWalkableNear(x, y, 0, 8, 6) || findWalkableNear(x, y, 0, 60 + u.r, 16); if (p) { x = p.x; y = p.y; } }
    const d = eqSpawn(u, x, y, { r: u.r, hp: u.maxhp * .4, fly: u.fly, static: true, sc: u.mscale, life: MODULES.decoy.dur, beam: true });
    if (!d) return false;
    d.holo = true; d.holoCh = u.chassis; d.eqv = 1; d.ang = u.ang; d.t = u.t || 0; d.mpaint = 'eq_holo';
    d.mounts = u.mounts.map(m => { const mm = makeMount(m.wid, Object.assign({}, m.w, { kind: 'holo' }), m.ox, m.oy); mm.ds = m.ds; mm.slot = m.slot; mm.main = m.main; mm.aim = m.aim; return mm; });
    addZone('eq_lure', x, y, 0, MODULES.decoy.dur + .5, u.team, u, { unit: d });
    eqFizzle(x, y, u.r, '#8fe8ff'); SFX.play('uplink', .45, x, y);
    return true;
  },
  auto(u, tgt, a) {
    if (!tgt || time - u.lastHurt > 1 || time < (a.chk || 0)) return false; a.chk = time + .4;
    if (u.hp < u.maxhp * .7) return true;
    let n = 0; foesIn(u.x, u.y, 650, u.team, () => n++); return n >= 3;
  },
};

// ---------- écran de fumée ----------
// les alliés dans le nuage sont camouflés et esquivent 40 % des tirs ; chaque nuage rend leurs valeurs à ceux qu'il a couverts
function eqSmokeOn(v, f) { if (!v.smk0) { v.smk0 = { cloak: v.cloak, dodge: v.dodge || 0 }; v.cloak = true; v.dodge = 1 - (1 - v.smk0.dodge) * .6; } v.smkZ = f; }
function eqSmokeOff(v) { if (!v.smk0) return; v.cloak = v.smk0.cloak; v.dodge = v.smk0.dodge; v.smk0 = null; v.smkZ = null; }
ZONE_K.eq_smoke = {
  tick(f, dt) {
    const age = f.max - f.t, k = Math.min(1, age / .6) * Math.min(1, f.t / 1.5);
    // fumée dense (particules dessinées au-dessus des unités)
    const lim = fxQ() === 'low' ? 380 : 800, rate = (fxQ() === 'low' ? 8 : 24) * Math.min(2.5, f.r / 240) * k;
    f.pacc = (f.pacc || 0) + rate * dt;
    while (f.pacc >= 1) { f.pacc--; if (parts.length >= lim) break; const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * f.r * .85; parts.push({ type: 'smoke', x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vx: rnd(-14, 14), vy: rnd(-14, 6), life: rnd(2.2, 3.2), max: 3.2, size: f.r * rnd(.24, .34), col: '' }); }
    if (f.tick > 0) return; f.tick = .1;
    if (!f.in) f.in = new Set();
    const now = new Set();
    if (k > .2) alliesIn(f.x, f.y, f.r * .92, f.team, v => { if (v.kind === 'beacon' || v.kind === 'building' || v.kind === 'npc' || v.holo) return; now.add(v); f.in.add(v); eqSmokeOn(v, f); });
    for (const v of f.in) if (!now.has(v)) { if (v.smkZ === f) eqSmokeOff(v); f.in.delete(v); }
  },
  draw(c, f) {
    const age = f.max - f.t, k = Math.min(1, age / .6) * Math.min(1, f.t / 1.5);
    const sp = glowSpr('eqSmoke', [[0, 'rgba(150,146,138,.85)'], [.55, 'rgba(120,116,110,.55)'], [1, 'rgba(100,96,90,0)']]);
    c.globalAlpha = .7 * k; const R = f.r * 1.15; c.drawImage(sp, f.x - R, f.y - R, R * 2, R * 2);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + time * .07 + f.x * .01, d = f.r * (.45 + .1 * Math.sin(time * .5 + i)), s = f.r * .55; c.globalAlpha = .45 * k; c.drawImage(sp, f.x + Math.cos(a) * d - s, f.y + Math.sin(a) * d - s, s * 2, s * 2); }
    c.globalAlpha = 1;
  },
  end(f) { if (f.in) for (const v of f.in) if (v.smkZ === f) eqSmokeOff(v); },
};
ABIL.smoke = {
  use(u) {
    const R = 220 + u.r; addZone('eq_smoke', u.x, u.y, R, MODULES.smoke.dur, u.team, u, { tick: 0 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; if (parts.length < 880) parts.push({ type: 'smoke', x: u.x, y: u.y, vx: Math.cos(a) * R * .9, vy: Math.sin(a) * R * .9, life: 1.4, max: 1.4, size: R * .3, col: '' }); }
    SFX.play('lob', .6, u.x, u.y); SFX.play('acid', .4, u.x, u.y);
    return true;
  },
  auto(u, tgt, a) {
    if (!tgt || time - u.lastHurt > 1 || time < (a.chk || 0)) return false; a.chk = time + .4;
    if (u.hp < u.maxhp * .5) return true;
    let n = 0; foesIn(u.x, u.y, 600, u.team, () => n++); return n >= 4 && u.hp < u.maxhp * .8;
  },
};

// ---------- drone de réparation ----------
ABIL.repairdrone = {
  use(u) {
    const r = clamp(u.r * .45 + 4, 14, 48), a = u.ang + Math.PI;
    const d = eqSpawn(u, u.x + Math.cos(a) * (u.r + 20), u.y + Math.sin(a) * (u.r + 20), { r, hp: Math.max(60, u.maxhp * .15), fly: true, spd: Math.max(240, u.spd * 1.3), sc: r / 16, paint: 'eq_drone', life: MODULES.repairdrone.dur });
    if (!d) return false;
    const w = scaledWeapon('repair', { dmg: 1 + (u.tier || 1) * .15, range: 1 + Math.min(1.5, u.r / 200), spread: 1, turn: 1 });
    d.mounts = [makeMount('repair', w, r * .62, 0)]; d.mounts[0].ds = r / 22; // buse discrète à l'avant : la croix reste visible
    SFX.play('drone', .7, u.x, u.y); eqFizzle(d.x, d.y, r, '#6fe3c8');
    return true;
  },
  auto(u, tgt, a) {
    if (time < (a.chk || 0)) return false; a.chk = time + .5;
    if (u.hp < u.maxhp * .65) return true;
    const R2 = (450 + u.r) ** 2;
    for (const v of fleet) if (v !== u && !v.dead && v.hp < v.maxhp * .6 && d2(v.x, v.y, u.x, u.y) < R2) return true;
    return !player.hidden && player.hp < player.maxhp * .5 && d2(player.x, player.y, u.x, u.y) < R2;
  },
};
// quadricoptère médical : quatre rotors, croix verte, voyant
CH_PAINT.eq_drone = (c, r, P, t) => {
  c.lineCap = 'round'; c.strokeStyle = P.body2; c.lineWidth = r * .18;
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .9, Math.sin(a) * r * .9); c.stroke(); }
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2, x = Math.cos(a) * r * .9, y = Math.sin(a) * r * .9;
    c.fillStyle = 'rgba(210,235,228,.16)'; circ(c, x, y, r * .5); c.fill();
    c.strokeStyle = P.plate; c.lineWidth = Math.max(1, r * .1); const sa = t * 47 + k * 1.3;
    c.beginPath(); c.moveTo(x + Math.cos(sa) * r * .46, y + Math.sin(sa) * r * .46); c.lineTo(x - Math.cos(sa) * r * .46, y - Math.sin(sa) * r * .46); c.stroke();
    c.fillStyle = P.dark; circ(c, x, y, r * .1); c.fill();
  }
  c.fillStyle = P.body; circ(c, 0, 0, r * .5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = Math.max(1, r * .06); c.stroke();
  c.fillStyle = '#e8f4ee'; circ(c, 0, 0, r * .34); c.fill();
  c.fillStyle = '#3fcf8e'; c.fillRect(-r * .22, -r * .07, r * .44, r * .14); c.fillRect(-r * .07, -r * .22, r * .14, r * .44);
  const bl = (Math.sin(t * 3) > .6) ? 1 : .35; c.fillStyle = `rgba(111,227,200,${bl})`; circ(c, -r * .42, 0, r * .08); c.fill();
};

// ---------- onde de choc ----------
ABIL.shockwave = {
  use(u) {
    const R = u.r * 2 + 160, dmg = 40 * (1 + (u.tier || 1)), x = u.x, y = u.y;
    foesIn(x, y, R, u.team, v => {
      if (v.kind === 'building') return;
      const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.r), f = 1 - clamp(d / R, 0, 1) * .5;
      hurt(v, dmg * f, u, { stun: 1.2, push: 900 * f, px: x, py: y });
    });
    parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .14, max: .14, size: R * .7, col: '#dff0ff', a: 0 });
    parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .55, max: .55, size: R, col: '#bfe4ff' });
    parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .4, max: .4, size: R * 1.05, col: '#ffffff', thin: true });
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; FX.dust(x + Math.cos(a) * R * .55, y + Math.sin(a) * R * .55, 2, 10 + u.r * .15, R * .5); }
    if (!NETVIS) scarSprite('crack', x, y, Math.min(260, R * .5), Math.random() * TAU);
    addShakeNear(x, y, 6 + u.r / 25); SFX.play('emp', .9, x, y, { size: 1 + u.r / 60 }); SFX.play('explo', .6, x, y, { size: 1 + u.r / 80 });
    return true;
  },
  auto(u, tgt, a) {
    if (!tgt || time < (a.chk || 0)) return false; a.chk = time + .3;
    let n = 0; foesIn(u.x, u.y, u.r * 2 + 160, u.team, v => { if (v.kind !== 'building') n++; }); return n >= 3;
  },
};

// ---------- poseur de mines ----------
// mine : lancée en cloche (0,45 s), armée 1 s plus tard, saute au passage d'un ennemi au sol
ZONE_K.eq_mine = {
  tick(f, dt) {
    if (f.toss < 1) { f.toss = Math.min(1, f.toss + dt / .45); if (f.toss >= 1 && !NETVIS) { FX.dust(f.x, f.y, 2, 6, 20); SFX.play('place', .25, f.x, f.y); } return; }
    if (f.arm > 0) { f.arm -= dt; return; }
    if (f.tick > 0 || NETVIS) return; f.tick = .1;
    let hit = false; foesIn(f.x, f.y, 26, f.team, v => { if (v.kind !== 'building') hit = true; }, { air: false });
    if (hit) { f.boomed = true; f.t = 0; blast(f.x, f.y, 70, f.dmg, f.team, f.src && !f.src.dead ? f.src : null); }
  },
  draw(c, f) {
    let x = f.x, y = f.y, h = 0;
    if (f.toss < 1) { x = lerp(f.x0, f.x, f.toss); y = lerp(f.y0, f.y, f.toss); h = Math.sin(f.toss * Math.PI) * 40; }
    const s = Math.max(7, 2.2 / cam.zoom), armed = f.toss >= 1 && f.arm <= 0, fade = Math.min(1, f.t / 2);
    c.globalAlpha = fade;
    if (h > 0) { c.fillStyle = 'rgba(0,0,0,.3)'; circ(c, x, y, s * .9); c.fill(); }
    c.translate(x, y - h);
    c.fillStyle = '#23292a'; circ(c, 0, 0, s); c.fill(); c.strokeStyle = '#4f6669'; c.lineWidth = s * .2; c.stroke();
    c.strokeStyle = '#141c1d'; c.lineWidth = s * .16; c.beginPath(); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + f.x; c.moveTo(Math.cos(a) * s * .45, Math.sin(a) * s * .45); c.lineTo(Math.cos(a) * s * 1.25, Math.sin(a) * s * 1.25); } c.stroke();
    const bl = armed ? (Math.sin(time * 6 + f.x) > .2 ? 1 : .25) : .5 + .5 * Math.sin(time * 18);
    c.fillStyle = armed ? `rgba(255,70,60,${bl})` : `rgba(242,193,78,${bl})`; circ(c, 0, 0, s * .32); c.fill();
    if (armed && bl > .5) { c.fillStyle = 'rgba(255,70,60,.18)'; circ(c, 0, 0, s * 2.2); c.fill(); }
    c.globalAlpha = 1;
  },
  end(f) { if (!f.boomed && f.toss >= 1) eqFizzle(f.x, f.y, 8, '#f2c14e'); },
};
ABIL.minefield = {
  use(u) {
    const dmg = 60 * (1 + (u.tier || 1) / 2), n = 5, a0 = Math.random() * TAU;
    // pas plus de 15 mines par robot : les plus anciennes s'éteignent
    const mine = fires.filter(f => f.zk === 'eq_mine' && f.src === u); for (let i = 0; i < mine.length + n - 15; i++) mine[i].t = 0;
    for (let k = 0; k < n; k++) {
      const a = a0 + k / n * TAU + rnd(-.25, .25), d = u.r + rnd(60, 150);
      let x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
      const p = findWalkableNear(x, y, 0, 40, 8); if (p) { x = p.x; y = p.y; }
      addZone('eq_mine', x, y, 70, 40, u.team, u, { dmg, toss: 0, arm: 1 + k * .05, x0: u.x, y0: u.y, tick: 0 });
    }
    SFX.play('mine', .7, u.x, u.y); SFX.play('lob', .4, u.x, u.y);
    return true;
  },
  auto(u, tgt, a) {
    if (!tgt || time < (a.chk || 0)) return false; a.chk = time + .4;
    return !!nearestFoe(u.x, u.y, 400, u.team, null, { air: false });
  },
};
// le double holographique reprend le dessin du châssis de son robot (la transparence est posée par drawUnit, voir LATE)
CH_PAINT.eq_holo = (c, r, P, t, mv, u) => { if (u && u.holoCh) paintChassis(c, u.holoCh, r, P, u.t || 0, 0, u); };

// ================= B. CERVEAUX =================
Object.assign(BRAINS, {
  medic: { n: TL('Infirmier'), ic: 'I', d: TL('Suit l\'allié le plus abîmé (ou le pilote), se place derrière lui à l\'abri de l\'ennemi et recule si on l\'approche. Idéal avec des armes de soin.') },
  artillery: { n: TL('Artilleur'), ic: 'A', d: TL('Tire à 90 % de la portée de sa plus longue arme, derrière le pilote, et recule quand un ennemi approche.') },
});
addResearch({ id: 'b_medic', cat: TL('Cerveaux'), lab: 2, n: TL('Cerveau Infirmier'), cost: { data: 10, crystals: 8 }, d: TL('Un robot de soutien qui reste près des blessés.'), req: 'b_gatherer', fam: 'brain' });
addResearch({ id: 'b_artillery', cat: TL('Cerveaux'), lab: 3, n: TL('Cerveau Artilleur'), cost: { data: 26, circuits: 30 }, d: TL('Un robot qui tient l\'ennemi à distance maximale.'), req: 'b_tactical', fam: 'brain' });
// portée de la plus longue arme de combat (recalculée de temps en temps : rang, siège)
function eqMaxRange(u) {
  if (u.artR && time < u.artRT) return u.artR;
  let R = 0; for (const m of u.mounts) { const w = m.w; if (SUPPORT_W[w.kind] || w.support || w.kind === 'melee') continue; R = Math.max(R, w.range || 0); }
  u.artRT = time + 2; return (u.artR = Math.min(R || 300, 2400));
}
// ennemi visible le plus proche (les camouflés ne sont vus que de près, comme pour pickTarget)
function eqSeeFoe(x, y, R, u) {
  let best = null, bd = R * R;
  foesIn(x, y, R, u.team, v => {
    const q = d2(v.x, v.y, x, y);
    if (v.cloak && time - (v.lastFire || -9) > 1.5 && q > R * R * .16) return;
    if (q < bd) { bd = q; best = v; }
  });
  return best;
}
// soutien d'aide : portée de soin des affûts (nano-réparateur, bouclier…)
const eqHealR = u => u.healR !== undefined ? u.healR : (u.healR = u.mounts.reduce((m, mt) => SUPPORT_W[mt.w.kind] && mt.w.kind !== 'bay' ? Math.max(m, mt.w.range || 0) : m, 0));
BRAIN_AI.medic = (u, L, dt, tgt) => {
  u.mdT = (u.mdT || 0) - dt;
  if (u.mdT <= 0) {
    u.mdT = .5 + Math.random() * .1;
    let best = null, bf = .97; const R2 = 900 * 900;
    for (const v of fleet) { if (v === u || v.dead || v.hidden) continue; const f = v.hp / v.maxhp; if (f < bf && d2(v.x, v.y, u.x, u.y) < R2) { bf = f; best = v; } }
    if (!player.hidden && !player.dead && player.hp / player.maxhp < bf && d2(player.x, player.y, u.x, u.y) < R2) best = player;
    if (best && d2(best.x, best.y, L.x, L.y) > 1300 * 1300) best = null; // jamais loin du meneur
    u.ward = best || L;
    u.mdFoe = eqSeeFoe(u.ward.x, u.ward.y, 700, u);
    u.mdThreat = eqSeeFoe(u.x, u.y, 250 + u.r, u);
  }
  const Wd = u.ward && !u.ward.dead && !u.ward.hidden ? u.ward : L, far = d2(u.x, u.y, L.x, L.y) > 1000 * 1000;
  const th = u.mdThreat && !u.mdThreat.dead ? u.mdThreat : null;
  if (th && !far && Math.hypot(th.x - u.x, th.y - u.y) - th.r < 250 + u.r) {
    // menace au contact : recul, en gardant le protégé en vue
    const a = Math.atan2(u.y - th.y, u.x - th.x), bx = u.x + Math.cos(a) * 170, by = u.y + Math.sin(a) * 170;
    goTo(u, lerp(bx, Wd.x, .25), lerp(by, Wd.y, .25), dt, 1.15, 0); return;
  }
  const hr = eqHealR(u), back = hr ? Math.max(u.r + 30, Math.min(Wd.r + u.r + 40, hr * .7)) : Wd.r + u.r + 40;
  const f = u.mdFoe && !u.mdFoe.dead ? u.mdFoe : tgt, lat = (((u.fi || 0) % 3) - 1) * .55;
  let a;
  if (f) a = Math.atan2(Wd.y - f.y, Wd.x - f.x) + lat; // derrière le protégé, côté opposé à l'ennemi
  else { const sp = Math.hypot(Wd.vx || 0, Wd.vy || 0); a = (sp > 30 ? Math.atan2(Wd.vy, Wd.vx) + Math.PI : (u.fi || 0) * 2.39996 + time * .05) + lat; }
  goTo(u, Wd.x + Math.cos(a) * back, Wd.y + Math.sin(a) * back, dt, far ? 1.25 : 1.05, 12 + u.r * .2);
  if (!tgt && f && d2(f.x, f.y, u.x, u.y) < (u.engRange + f.r) ** 2) u.target = f; // ses armes défendent le protégé
};
BRAIN_AI.artillery = (u, L, dt, tgt) => {
  const R = eqMaxRange(u);
  u.arT = (u.arT || 0) - dt;
  if (u.arT <= 0) { u.arT = .4 + Math.random() * .1; u.arThreat = eqSeeFoe(u.x, u.y, R * .4 + u.r, u); u.arFoe = tgt ? null : eqSeeFoe(L.x, L.y, Math.min(R + 500, 1900), u) || eqSeeFoe(u.x, u.y, Math.min(R * 1.05, 1500), u); }
  const th = u.arThreat && !u.arThreat.dead ? u.arThreat : null;
  const f = tgt || (u.arFoe && !u.arFoe.dead ? u.arFoe : null);
  if (f && !tgt) u.target = f; // tir à longue portée : la cible au-delà de la vue normale est gardée
  const lat = (((u.fi || 0) % 5) - 2) * (u.r * 2 + 26);
  if (th && Math.hypot(th.x - u.x, th.y - u.y) - th.r < R * .4 + u.r && d2(u.x, u.y, L.x, L.y) < 900 * 900) {
    // trop près : recul vers l'arrière du meneur
    const a = Math.atan2(u.y - th.y, u.x - th.x), bx = u.x + Math.cos(a) * Math.max(160, R * .3), by = u.y + Math.sin(a) * Math.max(160, R * .3);
    goTo(u, lerp(bx, L.x, .3), lerp(by, L.y, .3), dt, 1.15, 0); return;
  }
  if (!f) {
    const ha = L.headAng || 0, d = L.r + u.r + 110, gx = L.x - Math.cos(ha) * d - Math.sin(ha) * lat, gy = L.y - Math.sin(ha) * d + Math.cos(ha) * lat;
    goTo(u, gx, gy, dt, d2(u.x, u.y, L.x, L.y) > 800 * 800 ? 1.25 : 1, 20 + u.r * .3); escortHarvest(u, L, dt, null); return;
  }
  // pas de ligne de tir directe : le moteur cherche l'angle
  if (time - (u.lofBad || -9) < .8) { engage(u, f, dt, R * .85, true); return; }
  const a = Math.atan2(L.y - f.y, L.x - f.x), want = R * .9 + f.r * .5;
  let gx = f.x + Math.cos(a) * want - Math.sin(a) * lat, gy = f.y + Math.sin(a) * want + Math.cos(a) * lat;
  const dl = Math.hypot(gx - L.x, gy - L.y), cap = 600 + u.r; if (dl > cap) { gx = L.x + (gx - L.x) / dl * cap; gy = L.y + (gy - L.y) / dl * cap; }
  goTo(u, gx, gy, dt, 1, 18 + u.r * .25);
};

// ================= C. PILOTE =================
// ---------- armes ----------
Object.assign(PWEAPONS, {
  smg: { n: TL('Pistolet-mitrailleur'), dmg: 9, rate: 14, spd: 1000, range: 520, spread: .1, mag: 40, reload: 1.4, kind: 'bullet', col: '#ffe6a8', snd: 'mgmini', gun: 'pistol' },
  pflamer: { n: TL('Lance-flammes portatif'), dmg: 4, rate: 20, spd: 400, range: 260, spread: .25, pierce: 99, mag: 80, reload: 2, kind: 'flame', col: '#ff9a3a', snd: 'flame', gun: 'shotgun',
    pfire(p, w, a, sx, sy) {
      shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread, w.spd * rnd(.85, 1.1), w.dmg, 0, w.range, 'flame', w.col, 99, p, 0, 1);
      p.vx += Math.cos(a) * 16; p.vy += Math.sin(a) * 16; // un jet continu ne repousse presque pas
      SFX.hold('pflame', 'flame', .7, sx, sy);
      // langues de feu lumineuses qui accompagnent le jet
      if (parts.length < 860) for (let k = 0; k < (fxQ() === 'low' ? 1 : 2); k++) { const aa = a + (Math.random() - .5) * w.spread * 1.6, sp = w.spd * rnd(.7, 1.15); parts.push({ type: 'fire', x: sx + Math.cos(a) * 6, y: sy + Math.sin(a) * 6, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: rnd(.3, .5), max: .5, size: rnd(5, 9) }); }
    } },
  pcryo: { n: TL('Fusil cryogénique'), dmg: 18, rate: 3, spd: 1100, range: 640, spread: .02, mag: 14, reload: 1.6, kind: 'bullet', col: '#9fe8ff', snd: 'frost', gun: 'rifle', fx: { slow: 1.5, vuln: .1, vulnT: 3 },
    pfire(p, w, a, sx, sy) {
      const b = shoot(sx, sy, a + (Math.random() - .5) * 2 * w.spread, w.spd, w.dmg, 0, w.range, 'bullet', w.col, 0, p, 0, 1); b.fx = w.fx;
      muzzle(sx, sy, a, '#cff4ff', 1.3);
      for (let k = 0; k < 3; k++) if (parts.length < 880) parts.push({ type: 'spark', x: sx, y: sy, vx: Math.cos(a + rnd(-.6, .6)) * rnd(60, 160), vy: Math.sin(a + rnd(-.6, .6)) * rnd(60, 160), life: .25, max: .25, size: 1.5, col: '#bff0ff' });
    } },
  prail: { n: TL('Fusil électromagnétique'), dmg: 140, rate: .8, spd: 2600, range: 1300, spread: 0, mag: 4, reload: 2.2, kind: 'bullet', col: '#8fe8ff', snd: 'rail', gun: 'rifle',
    pfire(p, w, a, sx, sy) {
      rail(p, sx, sy, a, w.range, w.dmg, w.col);
      muzzle(sx, sy, a, '#dffaff', 2.2); parts.push({ type: 'ring', x: sx, y: sy, vx: 0, vy: 0, life: .25, max: .25, size: 22, col: '#8fe8ff', thin: true });
      p.vx -= Math.cos(a) * 110; p.vy -= Math.sin(a) * 110; camKick(a, 5); addShake(2.5); buzz(30);
    } },
  pgrenade: { n: TL('Lance-grenades du pilote'), dmg: 70, splash: 85, rate: 1.2, spd: 600, range: 560, spread: .02, mag: 6, reload: 2.4, kind: 'shell', col: '#ffcf6a', snd: 'lob', gun: 'shotgun',
    pfire(p, w, a, sx, sy) {
      const d = clamp(Math.hypot(mouse.wx - sx, mouse.wy - sy), 70, w.range), tx = sx + Math.cos(a) * d, ty = sy + Math.sin(a) * d;
      bullets.push({ kind: 'mortar', x: sx, y: sy, x0: sx, y0: sy, tx, ty, t: 0, T: .32 + d / 950, arc: 50 + d * .22, dmg: w.dmg, team: 0, splash: w.splash, col: w.col, src: p, h: 0, sc: .75, vis: NETVIS });
      muzzle(sx, sy, a, '#ffe0a0', 1.4); p.vx -= Math.cos(a) * 40; p.vy -= Math.sin(a) * 40; camKick(a, 2.5);
      if (parts.length < 880) parts.push({ type: 'smoke', x: sx, y: sy, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: .6, max: .6, size: 5, col: '' });
    } },
});
[
  ['smg', 1, { data: 6, scrap: 30 }, null, TL('Rafales rapides, chargeur de 40.')],
  ['pflamer', 2, { data: 14, crystals: 10 }, 'p_shotgun', TL('Jet de flammes continu qui traverse les groupes.')],
  ['pcryo', 3, { data: 30, crystals: 25 }, 'p_ar', TL('Chaque balle ralentit et marque la cible.')],
  ['prail', 4, { data: 50, circuits: 40, cores: 1 }, 'p_sniper', TL('Un trait qui traverse tout, obstacles légers compris.')],
  ['pgrenade', 3, { data: 36, alloy: 35 }, 'p_launcher', TL('Grenades en cloche, tirées vers le curseur.')],
].forEach(([id, lab, cost, req, d]) => addResearch(Object.assign({ id: 'p_' + id, cat: TL('Pilote'), lab, n: PWEAPONS[id].n, cost, d, fam: 'parm' }, req ? { req } : { root: 'x_pistol' })));

// ---------- équipement ----------
[
  ['u_armor4', 4, TL('Exosquelette IV'), { data: 70, alloy: 100, cores: 2 }, 'u_armor3', TL('+60 points de vie.')],
  ['u_armor5', 5, TL('Exosquelette V'), { data: 140, alloy: 180, cores: 4 }, 'u_armor4', TL('+60 points de vie.')],
  ['u_bag4', 4, TL('Sac renforcé IV'), { data: 50, alloy: 60 }, 'u_bag3', TL('+30 kg de capacité.')],
  ['u_bag5', 5, TL('Sac renforcé V'), { data: 100, alloy: 120 }, 'u_bag4', TL('+30 kg de capacité.')],
  ['u_dash', 2, TL('Propulseurs dorsaux'), { data: 14, circuits: 16 }, null, TL('L\'esquive se recharge 70 % plus vite et porte 30 % plus loin.')],
  ['u_medkit', 3, TL('Nanomédecine'), { data: 30, crystals: 25 }, null, TL('Le pilote se soigne de 16 PV/s après 2 s sans blessure.')],
  ['u_aegis', 4, TL('Bouclier personnel'), { data: 50, crystals: 40, cores: 1 }, null, TL('Bouclier de 25 % des PV du pilote, rechargé après 3 s sans dégâts.')],
  ['u_magnet', 1, TL('Aimant à butin'), { data: 5, scrap: 30 }, null, TL('Le pilote attire le butin à 260 px.')],
].forEach(([id, lab, n, cost, req, d]) => addResearch(Object.assign({ id, cat: TL('Pilote'), lab, n, cost, d, fam: 'pequ' }, req ? { req } : {})));
PILOT_TICK.u_dash = (p, dt) => {
  // une esquive vient de partir (dash() a remis la recharge à 1,1 s) : plus loin, et recharge plus courte
  if (p.dashCd > (p.eqDcd !== undefined ? p.eqDcd : -9) + .3 && p.dashT > 0) {
    p.dashCd /= 1.7; p.vx *= 1.3; p.vy *= 1.3;
    for (let k = 0; k < 6; k++) if (parts.length < 880) parts.push({ type: 'fire', x: p.x - p.vx * .02, y: p.y - p.vy * .02, vx: -p.vx * rnd(.1, .3) + rnd(-30, 30), vy: -p.vy * rnd(.1, .3) + rnd(-30, 30), life: .22, max: .22, size: 4 });
  }
  p.eqDcd = p.dashCd;
};
PILOT_TICK.u_medkit = (p, dt) => {
  const q = time - p.lastHurt; if (q <= 2 || p.hp >= p.maxhp || p.dead) return;
  p.hp = Math.min(p.maxhp, p.hp + (16 - (q > 4 ? 7 : 0)) * dt); // 16 PV/s en tout (le moteur rend déjà 7 PV/s après 4 s)
  if (Math.random() < dt * 4 && parts.length < 880) parts.push({ type: 'spark', x: p.x + rnd(-8, 8), y: p.y + rnd(-6, 6), vx: 0, vy: -45, life: .45, max: .45, size: 2, col: '#6fe3c8' });
};
PILOT_TICK.u_aegis = (p, dt) => {
  const cap = p.maxhp * .25;
  if (!p.eqAeg) { p.eqAeg = true; p.shield = Math.max(p.shield || 0, cap); }
  p.shieldMax = Math.max(cap, p.shield || 0); if ((p.shield || 0) <= cap + .5) p.shieldT = time; // le moteur ne le laisse pas fondre (l'excédent d'un projecteur fond normalement)
  if (time - p.lastHurt > 3 && (p.shield || 0) < cap) { const s0 = p.shield || 0; p.shield = Math.min(cap, s0 + 12 * dt); if (s0 <= 0 && parts.length < 880) parts.push({ type: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: .4, max: .4, size: p.r * 2 + 8, col: '#7fc8ff', thin: true }); }
};
PILOT_TICK.u_magnet = (p, dt) => {
  if (!items.length || p.hidden) return;
  const free = p.cargoMax - p.cargoW, R2 = 260 * 260, near = (p.r + 26 + 70) ** 2;
  for (const it of items) {
    if (it.dead || it.t < .35 || RES[it.res].w > free) continue;
    const q = d2(it.x, it.y, p.x, p.y); if (q > R2 || q < near) continue; // au plus près, le moteur prend le relais
    const d = Math.sqrt(q); it.x += (p.x - it.x) / d * 300 * dt; it.y += (p.y - it.y) / d * 300 * dt;
    if (Math.random() < dt * 5) beams.push({ x1: it.x, y1: it.y, x2: p.x, y2: p.y, life: .1, max: .1, col: 'rgba(255,190,110,.45)', w: 1, heal: true });
  }
};

// ================= D. PROTOCOLES =================
[
  ['u_cmd5', 5, TL('Liaison de commandement V'), { data: 140, circuits: 200, cores: 4 }, 'cmd', 'u_cmd4', TL('+12 points de commandement.'), null],
  ['u_cmd6', 5, TL('Liaison de commandement VI'), { data: 600, circuits: 1200, cores: 20 }, 'cmd', 'u_cmd5', TL('+20 points de commandement.'), 4],
  ['u_beacon2', 3, TL('Balise de soutien'), { data: 30, crystals: 30 }, 'bal', 'u_beacon', TL('Pendant l\'ancrage, la balise répare les robots à moins de 400 px (2 % des PV par seconde).'), null],
  ['u_evac', 4, TL('Extraction d\'urgence'), { data: 60, crystals: 40, cores: 1 }, 'bal', 'u_anchor', TL('L\'ancrage se charge 15 % plus vite (cumulable avec l\'Ancrage rapide).'), null],
  ['u_salvage', 3, TL('Récupération avancée'), { data: 30, scrap: 120 }, 'log', null, TL('+15 % de butin sur les ennemis abattus.'), null],
  ['u_veteran', 3, TL('Formation accélérée'), { data: 26, circuits: 30 }, 'log', null, TL('Les robots gagnent 30 % d\'expérience en plus.'), null],
  ['u_fabrush', 5, TL('Chaînes accélérées'), { data: 300, circuits: 500, cores: 8 }, 'log', 'u_veteran', TL('Les géants fabriquent leurs renforts 25 % plus vite.'), 1],
].forEach(([id, lab, n, cost, fam, req, d, sh]) => addResearch(Object.assign({ id, cat: TL('Protocoles'), lab, n, cost, d, fam }, req ? { req } : {}, sh ? SHIP(sh) : {})));
// balise de soutien : halo qui répare (la zone suit la balise posée et s'éteint avec elle)
ZONE_K.eq_bhalo = {
  tick(f, dt) {
    const u = f.unit; if (!u || u.dead || !B || B.unit !== u) { f.t = 0; return; }
    f.t = 1e6; f.on = B.state === 'charging' || B.state === 'window'; if (!f.on) return;
    if (f.tick > 0) return; f.tick = .25;
    const el = Math.min(.5, time - (f.lt || time - .25)); f.lt = time;
    for (const r of fleet) {
      if (r.dead || r.hp >= r.maxhp || d2(r.x, r.y, u.x, u.y) > (400 + r.r) ** 2) continue;
      r.hp = Math.min(r.maxhp, r.hp + r.maxhp * .02 * el);
      if (Math.random() < .35 && parts.length < 860) parts.push({ type: 'spark', x: r.x + rnd(-r.r, r.r) * .6, y: r.y + rnd(-r.r, r.r) * .6, vx: 0, vy: -50, life: .5, max: .5, size: 2.2, col: '#7dff9a' });
    }
  },
  draw(c, f) {
    if (!f.on) return; const u = f.unit, R = 400, p = .5 + .5 * Math.sin(time * 2.4);
    const g = c.createRadialGradient(u.x, u.y, R * .25, u.x, u.y, R); g.addColorStop(0, 'rgba(110,255,150,0)'); g.addColorStop(.82, `rgba(110,255,150,${.09 + .05 * p})`); g.addColorStop(1, 'rgba(110,255,150,0)');
    c.fillStyle = g; circ(c, u.x, u.y, R); c.fill();
    c.strokeStyle = `rgba(110,255,140,${.55 + .25 * p})`; c.lineWidth = Math.max(2.5, 3 / cam.zoom); c.setLineDash([10, 12]); c.lineDashOffset = time * 18; circ(c, u.x, u.y, R); c.stroke(); c.setLineDash([]);
    // croix de soin qui tournent lentement sur le cercle
    if (u.r * cam.zoom > 4 || cam.zoom > .3) { c.fillStyle = `rgba(125,255,154,${.5 + .3 * p})`; const s = Math.max(6, 7 / cam.zoom); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + time * .15, x = u.x + Math.cos(a) * R, y = u.y + Math.sin(a) * R; c.fillRect(x - s, y - s * .32, s * 2, s * .64); c.fillRect(x - s * .32, y - s, s * .64, s * 2); } }
  },
};

// ================= E. APTITUDES DES CHÂSSIS (PERKS) =================
Object.assign(PERK_TXT, {
  cloak: TL('<b>Camouflage</b> : repéré à 40 % de la distance de vue ennemie, sauf quand il tire.'),
  regen: TL('<b>Régénération</b> : répare 1 % de ses PV par seconde hors combat.'),
  aura: TL('<b>Aura de réparation</b> : répare en continu les alliés proches.'),
  shield: TL('<b>Bouclier</b> : bouclier de 30 % de ses PV, rechargé hors combat.'),
  slowaura: TL('<b>Champ englué</b> : ralentit les ennemis proches.'),
  ram: TL('<b>Charge</b> : fonce sur les ennemis plus petits, les percute (40 dégâts + 2 % de ses PV) et les repousse.'),
  pack: TL('<b>Meute</b> : +10 % de dégâts par congénère à moins de 500 px (+40 % au plus).'),
  magnet: TL('<b>Aimant</b> : attire et ramasse le butin autour de lui (300 px).'),
  shieldwall: TL('<b>Bouclier frontal</b> : −40 % de dégâts venant de l\'avant.'),
  radar: TL('<b>Radar</b> : révèle les ennemis camouflés à 700 px et les marque (+10 % de dégâts subis).'),
  dodge: TL('<b>Voltige</b> : esquive 22 % des tirs.'),
  flak: TL('<b>Antimissile</b> : abat 4 fois par seconde une roquette, un obus ou un missile ennemi à l\'approche.'),
  rage: TL('<b>Rage</b> : +50 % de cadence sous 40 % de PV.'),
  siege: TL('<b>Siège</b> : à l\'arrêt depuis 1,5 s, +25 % de portée et +20 % de dégâts.'),
  stomp: TL('<b>Pas sismiques</b> : en marchant, étourdit les petits ennemis autour de lui.'),
  rebirth: TL('<b>Renaissance</b> : une fois par raid, renaît de ses cendres avec 40 % de PV.'),
});
// perks dont l'effet passe par les crochets de dégâts (u.ext doit exister) ; posés par l'enveloppe de robotStats (LATE)
const PERK_EXT = { pack: 1, shieldwall: 1, siege: 1 };
const eqLeader = u => !u.piloted && !(u.order && (u.order.type === 'move' || u.order.type === 'hold')) && !(B && B.unit && (B.state === 'window' || B.state === 'lift'));

// ---------- Charge ----------
PERK_TICK.ram = (u, dt) => {
  u.ramCd = (u.ramCd || 0) - dt;
  // robot autonome : il fonce sur une cible plus petite à bonne distance
  if (u.ramChg > 0) {
    u.ramChg -= dt; const t = u.ramTg;
    if (!t || t.dead || t.hidden || u.stunT > time || u.piloted) u.ramChg = 0;
    else {
      const a = Math.atan2(t.y - u.y, t.x - u.x), v = u.spd * 1.4 * (u.slowT > 0 ? .55 : 1) * terrainMul(u), k = Math.min(1, dt * 12);
      u.vx += (Math.cos(a) * v - u.vx) * k; u.vy += (Math.sin(a) * v - u.vy) * k; u.wantMove = true;
      if (!u.fly && Math.random() < dt * 14) FX.dust(u.x - Math.cos(a) * u.r, u.y - Math.sin(a) * u.r, 1, 6 + u.r * .2, 30);
    }
  } else if (u.ramCd <= 0 && eqLeader(u) && u.brain !== 'guard' && u.brain !== 'gatherer' && u.brain !== 'medic' && u.brain !== 'artillery') {
    const t = u.target && !u.target.dead && !u.target.hidden ? u.target : null;
    if (t && t.r < u.r && (!t.fly || u.fly) && t.kind !== 'building' && !t.static) {
      const d = Math.hypot(t.x - u.x, t.y - u.y) - u.r - t.r;
      if (d > 40 && d < 420) { u.ramChg = .5 + d / (u.spd * 1.4); u.ramTg = t; u.ramCd = 4; SFX.play('servo', .5, u.x, u.y); }
    }
  }
  if (Math.hypot(u.vx, u.vy) < u.spd * .6) return;
  u.ramChk = (u.ramChk || 0) - dt; if (u.ramChk > 0) return; u.ramChk = .05;
  const H = u.ramHits || (u.ramHits = new Map()); if (H.size > 40) for (const [id, t] of H) if (t < time) H.delete(id);
  foesIn(u.x, u.y, u.r + 6, u.team, v => {
    if (v.r >= u.r || v.kind === 'building' || (v.fly && !u.fly) || (H.get(v.id) || 0) > time) return;
    H.set(v.id, time + .6);
    hurt(v, 40 + u.maxhp * .02, u, { push: 420 + u.r * 4, px: u.x, py: u.y });
    sparks(lerp(u.x, v.x, .6), lerp(u.y, v.y, .6), 8, '#ffd27a'); SFX.play('crush', .6, v.x, v.y); SFX.play('clank', .4, v.x, v.y); addShakeNear(v.x, v.y, 2 + u.r / 40);
    if (u.ramChg > 0) u.ramChg = Math.min(u.ramChg, .12);
  });
};
// ---------- Meute ----------
PERK_TICK.pack = (u, dt) => {
  u.eqv = 1; u.packT = (u.packT || 0) - dt; if (u.packT > 0) return; u.packT = .5;
  let n = 0; for (const v of fleet) if (v !== u && !v.dead && v.chassis === u.chassis && d2(v.x, v.y, u.x, u.y) < 500 * 500) n++;
  u.packN = Math.min(4, n);
};
// ---------- Aimant ----------
PERK_TICK.magnet = (u, dt) => eqVacuum(u, u.r + 300, dt);
// ---------- Bouclier frontal (l'effet est dans HURT_IN ; ici, seulement le dessin) ----------
PERK_TICK.shieldwall = u => { u.eqv = 1; };
// ---------- Radar ----------
PERK_TICK.radar = (u, dt) => eqRadarTick(u, dt, u.r + 700, 'rgba(127,255,200,.45)');
// ---------- Antimissile ----------
const eqFlakable = b => b.kind === 'rocket' || b.kind === 'shell' || (b.kind === 'mortar' && !b.sing) || b.flak || (B_KIND[b.kind] && B_KIND[b.kind].flak);
PERK_TICK.flak = (u, dt) => {
  u.flakT = (u.flakT || 0) - dt; if (u.flakT > 0 || u.stunT > time) return; u.flakT = .25;
  const R = u.r * 1.5 + 250; let best = -1, bd = R * R;
  for (let i = 0; i < bullets.length; i++) { const b = bullets[i]; if (b.team === u.team || b.vis || !eqFlakable(b)) continue; const q = d2(b.x, b.y, u.x, u.y); if (q < bd) { bd = q; best = i; } }
  if (best < 0) return;
  const b = bullets[best], bx = b.x, by = b.y - (b.h || 0);
  bullets[best] = bullets[bullets.length - 1]; bullets.pop();
  const a = Math.atan2(by - u.y, bx - u.x), sx = u.x + Math.cos(a) * u.r * .7, sy = u.y + Math.sin(a) * u.r * .7;
  beams.push({ x1: sx, y1: sy, x2: bx, y2: by, life: .16, max: .16, col: '#ffef9a', w: 2 + u.r * .012 });
  parts.push({ type: 'flash', x: bx, y: by, vx: 0, vy: 0, life: .1, max: .1, size: 16 + (b.big ? 18 : 0), col: '#fff2c8', a: 0 });
  parts.push({ type: 'ring', x: bx, y: by, vx: 0, vy: 0, life: .25, max: .25, size: 18, col: '#ffd9a0' });
  sparks(bx, by, 7, '#ffcf7a'); SFX.play('flak', .35, bx, by);
};
// ---------- Rage ----------
PERK_TICK.rage = (u, dt) => {
  u.eqv = 1; const on = u.hp < u.maxhp * .4;
  // la cadence part de la base du robot et de la Surcharge en cours : rien n'est cassé quand la rage retombe
  if (on || u.rageOn) u.rateMul = (u.overT > 0 ? 1.8 : 1) * (u.rateBase || 1) * (on ? 1.5 : 1);
  if (on && !u.rageOn) { parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .5, max: .5, size: u.r * 2 + 12, col: '#ff4a3a' }); SFX.play('bossroar', .35, u.x, u.y, { pitch: clamp(40 / u.r, .5, 1.6) }); }
  u.rageOn = on;
  if (on && Math.random() < dt * (6 + u.r * .02) && parts.length < 860) parts.push({ type: 'ember', x: u.x + rnd(-u.r, u.r) * .6, y: u.y + rnd(-u.r, u.r) * .6, vx: rnd(-20, 20), vy: -rnd(30, 70), life: .8, max: .8, size: 1.6 + u.r * .02 });
};
// ---------- Siège ----------
function eqSiegeSet(u, on) {
  u.sieged = on;
  for (const m of u.mounts) {
    if (on) { if (m.sgW !== m.w) { m.sgW = m.w; m.sgR = m.w.range; if (m.w.range && m.w.kind !== 'melee') m.w.range = m.sgR * 1.25; } }
    else if (m.sgW) { if (m.sgW === m.w) m.w.range = m.sgR; m.sgW = null; }
  }
  u.engRange = calcEngRange(u); u.artRT = 0;
  if (on) { SFX.play('clank', .6, u.x, u.y, { pitch: clamp(50 / u.r, .5, 1.2) }); if (!u.fly) FX.dust(u.x, u.y, 4, u.r * .3, u.r); }
}
PERK_TICK.siege = (u, dt) => {
  u.eqv = 1;
  // robot autonome au combat : il cesse de louvoyer et se cale dès que sa cible est à portée
  const t = u.target && !u.target.dead && !u.target.hidden ? u.target : null;
  if (t && eqLeader(u) && time - (u.lofBad || -9) > 1 && d2(u.x, u.y, focus().x, focus().y) < 900 * 900 && Math.hypot(t.x - u.x, t.y - u.y) <= u.engRange / .85 * .95 + t.r && !(u.hp < u.maxhp * .25 && t.target === u)) { u.wantMove = false; u.vx *= .7; u.vy *= .7; }
  const still = !u.wantMove && Math.hypot(u.vx, u.vy) < 14;
  u.stillT = still ? (u.stillT || 0) + dt : 0;
  if (!u.sieged && u.stillT >= 1.5) eqSiegeSet(u, true);
  else if (u.sieged && !still) eqSiegeSet(u, false);
  else if (u.sieged && u.mounts.some(m => m.sgW !== m.w)) eqSiegeSet(u, true); // armes recalculées (rang) : on réapplique
  u.siegeK = clamp((u.siegeK || 0) + (u.sieged ? dt * 2.5 : -dt * 5), 0, 1);
};
// ---------- Pas sismiques ----------
PERK_TICK.stomp = (u, dt) => {
  if (u.fly || u.jumping) return;
  if (Math.hypot(u.vx, u.vy) < Math.max(20, u.spd * .15)) { u.stompT = Math.min(u.stompT || .5, .5); return; }
  u.stompT = (u.stompT || .5) - dt; if (u.stompT > 0) return; u.stompT = 1;
  const R = u.r * 1.3 + 60, x = u.x, y = u.y, dmg = 10 + u.r * .5; let n = 0;
  foesIn(x, y, R, u.team, v => { if (v.r < u.r * .4 && v.kind !== 'building') { hurt(v, dmg, u, { stun: .5, push: 160, px: x, py: y }); n++; } }, { air: false });
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .5, max: .5, size: R, col: '#c9ae80' });
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .35, max: .35, size: R * .7, col: 'rgba(230,210,170,.8)', thin: true });
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + Math.random() * .4; FX.dust(x + Math.cos(a) * R * .75, y + Math.sin(a) * R * .75, 1, 10 + u.r * .14, 50); }
  if (u.r > 45 && !NETVIS) scarSprite('crack', x, y, Math.min(220, u.r * .7), Math.random() * TAU);
  addShakeNear(x, y, 1.5 + u.r / 60); if (n || u.r <= 50) SFX.play('crush', .45, x, y, { pitch: clamp(60 / u.r, .4, 1) });
};
// ---------- Renaissance ----------
ZONE_K.eq_rebirth = {
  tick(f, dt) {
    const u = f.unit; if (!u || u.dead) { f.t = 0; return; }
    f.x = u.x; f.y = u.y; u.invul = true;
    const R = u.r * 1.5 + 30, rate = fxQ() === 'low' ? 20 : 50;
    for (let k = 0; k < rate * dt && parts.length < 880; k++) { const a = Math.random() * TAU; parts.push({ type: 'fire', x: u.x + Math.cos(a) * R, y: u.y + Math.sin(a) * R, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 40, life: rnd(.3, .6), max: .6, size: rnd(6, 10) + u.r * .06 }); }
  },
  draw(c, f) {
    const u = f.unit; if (!u || u.dead) return; const R = u.r * 1.5 + 30, k = f.t / f.max, p = .6 + .4 * Math.sin(time * 14);
    const g = c.createRadialGradient(u.x, u.y, R * .6, u.x, u.y, R * 1.25); g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(.6, `rgba(255,150,50,${.45 * p * (.4 + .6 * k)})`); g.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = g; circ(c, u.x, u.y, R * 1.25); c.fill();
    c.strokeStyle = `rgba(255,214,120,${.7 * k})`; c.lineWidth = Math.max(2, 3 / cam.zoom); circ(c, u.x, u.y, R); c.stroke();
  },
  end(f) { const u = f.unit; if (u) { u.invul = false; if (!u.dead) parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .4, max: .4, size: u.r * 1.8 + 30, col: '#ffd27a', thin: true }); } },
};
DEATH_SAVE.push(u => {
  if (u.perk !== 'rebirth' || u.reborn || u.net || (u.kind !== 'robot' && u.kind !== 'rival') || NETVIS) return false;
  u.reborn = true; u.hp = u.maxhp * .4; u.invul = true; u.hitFlash = 0; u.stunT = 0; u.slowT = 0; u.corrT = 0; u.vulnT = 0;
  addZone('eq_rebirth', u.x, u.y, u.r * 2, 2, u.team, u, { unit: u });
  const x = u.x, y = u.y, R = u.r * 1.5 + 30;
  parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .25, max: .25, size: R * 1.4, col: '#ffe7b0', a: 0 });
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .7, max: .7, size: R * 2, col: '#ff9a3a' });
  for (let k = 0; k < 26 && parts.length < 880; k++) { const a = Math.random() * TAU, s = rnd(60, 220) + u.r; parts.push({ type: 'ember', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rnd(.8, 1.6), max: 1.6, size: rnd(1.5, 3) }); }
  foesIn(x, y, R * 1.6, u.team, v => hurt(v, 0, u, { push: 500, px: x, py: y }));
  addShakeNear(x, y, 6); SFX.play('napalm', .9, x, y, { size: 2 }); SFX.play('rankup', .6, x, y);
  msg(TL('{name} renaît de ses cendres !', { name: u.name || CHASSIS[u.chassis].n }), '#ffb35c', 5);
  return true;
});

// ================= ENVELOPPES DU MOTEUR (une fois tout chargé) =================
LATE.push(() => {
  // statistiques : esquive de la Voltige, drapeaux des perks qui passent par les crochets de dégâts
  const rs0 = robotStats;
  robotStats = function (sr) {
    const s = rs0(sr), ch = CHASSIS[sr.chassis], pk = ch && ch.perk;
    if (pk === 'dodge') s.dodge = 1 - (1 - (s.dodge || 0)) * .78;
    if (PERK_EXT[pk]) s.ext[pk] = 1;
    return s;
  };
  // dégâts réellement infligés : Siphon de nanites (soin du tireur) et Carapace électrifiée (renvoi à l'attaquant)
  const dm0 = damage;
  damage = function (u, amt, src, ap) {
    const lv = src && src.ext && src.ext.leech, th = u.ext && u.ext.thorns && src && !EQ.thornLock;
    if (!lv && !th) return dm0(u, amt, src, ap);
    const h0 = u.hp; dm0(u, amt, src, ap);
    if (NETVIS || u.net || u.etype === 'cible') return;
    const lost = h0 - Math.max(0, u.hp); if (!(lost > 0)) return;
    if (lv && !src.dead && src.hp > 0 && src.hp < src.maxhp) {
      src.hp = Math.min(src.maxhp, src.hp + lost * .08 * src.ext.leech);
      if (time - (src.leechFx || -9) > .3 && parts.length < 860) { src.leechFx = time; beams.push({ x1: u.x, y1: u.y, x2: src.x, y2: src.y, life: .18, max: .18, col: 'rgba(111,227,160,.5)', w: 1.2, heal: true }); parts.push({ type: 'spark', x: src.x + rnd(-src.r, src.r) * .5, y: src.y + rnd(-src.r, src.r) * .5, vx: 0, vy: -40, life: .4, max: .4, size: 2, col: '#7dffb0' }); }
    }
    if (th && !src.dead && src.team !== u.team && src.hp > 0) {
      const d = Math.hypot(src.x - u.x, src.y - u.y) - src.r - u.r;
      if (d < 500) {
        EQ.thornLock = true; try { dm0(src, lost * (d < 40 ? .25 : .1) * u.ext.thorns, u); } finally { EQ.thornLock = false; }
        if (time - (u.thornFx || -9) > .15) { u.thornFx = time; beams.push({ pts: zig(u.x, u.y, src.x, src.y, Math.max(3, Math.min(9, (d + 60) / 50 | 0)), 7), life: .14, max: .14, col: '#9fd8ff', w: 1.5 }); sparks(src.x, src.y, 3, '#9fd8ff'); }
      }
    }
  };
  // Extraction d'urgence : ancrage 15 % plus rapide
  const ct0 = chargeTime;
  chargeTime = function () { return ct0() * (has('u_evac') ? .85 : 1); };
  // Balise de soutien : un halo réparateur accompagne chaque balise posée
  const ub0 = updateBeacon;
  updateBeacon = function (dt) { ub0(dt); if (B && B.unit && !B.unit.dead && !B.unit.eqHalo && has('u_beacon2')) { B.unit.eqHalo = true; addZone('eq_bhalo', B.unit.x, B.unit.y, 420, 1e6, 0, B.unit, { unit: B.unit }); } };
  // Récupération avancée : +15 % de butin des ennemis abattus (arrondi au hasard, juste en moyenne)
  const kl0 = kill;
  kill = function (u, src) {
    if (u.kind !== 'enemy' || u.dead || !has('u_salvage')) return kl0(u, src);
    const prev = EQ.salv; EQ.salv = true; try { return kl0(u, src); } finally { EQ.salv = prev; }
  };
  const si0 = spawnItem;
  spawnItem = function (res, amt, x, y) {
    if (EQ.salv && res !== 'heart') { const v = amt * 1.15, n = Math.floor(v); amt = n + (Math.random() < v - n ? 1 : 0); }
    return si0(res, amt, x, y);
  };
  // Formation accélérée : +30 % d'expérience pour les robots
  const gx0 = giveXP;
  giveXP = function (r, x) { return gx0(r, x * (r && r.team === 0 && has('u_veteran') ? 1.3 : 1)); };
  // Chaînes accélérées : les géants fabriquent 25 % plus vite
  const fb0 = fabTick;
  fabTick = function (u, dt) { return fb0(u, dt * (u && u.team === 0 && has('u_fabrush') ? 1.25 : 1)); };
  // dessin : leurre holographique, lueur de rage, vérins de siège, bouclier frontal, meute
  const du0 = drawUnit;
  drawUnit = function (c, u) {
    if (!u.eqv || u.r * cam.zoom < 2.2) return du0(c, u);
    if (u.holo) { eqDrawHolo(c, u, du0); return; }
    if (u.rageOn) { const p = .5 + .5 * Math.sin(time * 9 + u.id), R = u.r * (1.55 + .15 * p), g = glowSpr('eqRage', [[0, 'rgba(255,60,40,.7)'], [.5, 'rgba(255,40,30,.3)'], [1, 'rgba(255,30,20,0)']]); c.globalAlpha = .55 + .35 * p; c.drawImage(g, u.x - R, u.y - R, R * 2, R * 2); c.globalAlpha = 1; }
    if (u.siegeK > 0 && !u.fly) eqDrawStruts(c, u);
    du0(c, u);
    if (u.ext && u.ext.shieldwall && u.r * cam.zoom > 4) {
      const hit = time - (u.swHit || -9) < .22, R = u.r * 1.25 + 5;
      c.strokeStyle = hit ? 'rgba(170,225,255,.85)' : 'rgba(127,200,255,.2)'; c.lineWidth = Math.max(1.5, (hit ? 3.5 : 2) / Math.max(.5, cam.zoom));
      c.beginPath(); c.arc(u.x, u.y, R, u.ang - Math.PI / 3, u.ang + Math.PI / 3); c.stroke();
      if (hit) { c.fillStyle = 'rgba(127,200,255,.12)'; c.beginPath(); c.moveTo(u.x, u.y); c.arc(u.x, u.y, R, u.ang - Math.PI / 3, u.ang + Math.PI / 3); c.closePath(); c.fill(); }
    }
    if (u.packN > 0 && u.r * cam.zoom > 5) { const s = Math.max(1.6, 2.4 / Math.max(.6, cam.zoom)); c.fillStyle = '#ffb35c'; for (let k = 0; k < u.packN; k++) { circ(c, u.x - u.r * .8 + k * s * 2.6, u.y - u.r - s * 2.5, s); c.fill(); } }
  };
});
// double holographique : translucide, scintillant, balayé de lignes cyan
function eqDrawHolo(c, u, du0) {
  const fl = .6 + .12 * Math.sin(time * 31 + u.id) + .08 * Math.sin(time * 7.3) - (Math.random() < .05 ? .3 : 0);
  c.save(); c.globalAlpha = clamp(fl, .15, .8); if (Math.random() < .07) c.translate(rnd(-3, 3), 0);
  try { du0(c, u); } finally { c.restore(); }
  if (u.r * cam.zoom < 5) return;
  c.save(); circ(c, u.x, u.y, u.r * 1.05); c.clip();
  c.fillStyle = 'rgba(110,220,255,.12)'; c.fillRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2);
  c.strokeStyle = 'rgba(150,235,255,.3)'; c.lineWidth = Math.max(.8, u.r * .03); c.beginPath();
  const st = Math.max(3, u.r * .18), off = (time * u.r * .8) % st;
  for (let y = u.y - u.r + off; y < u.y + u.r; y += st) { c.moveTo(u.x - u.r, y); c.lineTo(u.x + u.r, y); }
  c.stroke(); c.restore();
}
// vérins de calage du Siège (dessinés sous la caisse, ils dépassent en se déployant)
function eqDrawStruts(c, u) {
  const P = palOf(u), k = u.siegeK, r = u.r;
  c.save(); c.translate(u.x, u.y); c.rotate(u.ang); c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, x0 = Math.cos(a) * r * .5, y0 = Math.sin(a) * r * .5, L = r * (.5 + .75 * k), x1 = Math.cos(a) * L, y1 = Math.sin(a) * L;
    c.strokeStyle = P.dark; c.lineWidth = r * .17; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = r * .07; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    // patin de calage cerclé de jaune de danger
    const pr = r * .17 * k + 1; c.fillStyle = P.body2; c.beginPath(); c.ellipse(x1, y1, pr * 1.25, pr, a, 0, TAU); c.fill();
    c.strokeStyle = '#e8b830'; c.lineWidth = Math.max(1, r * .045); c.stroke(); c.fillStyle = P.dark; circ(c, x1, y1, pr * .4); c.fill();
  }
  c.restore();
}
