// COLOSSE 3.1 — lot B : quinze armes titanesques (taille 4) et colossales (taille 5).
// Tornade, nanites, faille, phalange, stase, lance-essaims, prisme ; railguns en batterie, onde sismique, bombardiers,
// mur de plasma, missile à têtes multiples, distordeur temporel, torpille fouisseuse, cage de foudre.
// Tout passe par les registres de la 3.1 (W_FIRE, W_TICK, B_KIND, ZONE_K, W_PAINT) ; les outils partagés vivent dans AB31.
const AB31 = {};

// ================= OUTILS COMMUNS (appelés seulement pendant le jeu) =================
(() => {
  const H = AB31;
  // effets visuels : inutiles quand personne ne regarde une expédition simulée
  H.vfx = () => !(EXPSIM && !EXPSIM.viewing);
  H.pOK = n => H.vfx() && parts.length < (n || 820);
  H.low = () => fxQ() === 'low';
  H.DARK = '#181c1e';
  // point visé ramené dans la portée, le long de l'axe affût → cible
  H.aimAt = (F, w, minR) => {
    const dx = F.tx - F.mx, dy = F.ty - F.my, d = Math.hypot(dx, dy), a = d > 1 ? Math.atan2(dy, dx) : F.a, rr = clamp(d, minR !== undefined ? minR : (w.minRange || 0), w.range);
    return [F.mx + Math.cos(a) * rr, F.my + Math.sin(a) * rr, a, rr];
  };
  // dernière correction de visée d'un tir instantané : l'affût est déjà presque aligné (moins de 0,35 rad)
  H.fineA = F => { const a = Math.atan2(F.ty - F.my, F.tx - F.mx); return Math.abs(angDiff(F.a, a)) < .35 ? a : F.a; };
  // vitesse de rotation d'un affût de cette taille (comme updateMounts)
  H.tRate = (u, w) => (w.size >= 5 ? 1.05 : 1.4) * (u.piloted ? 1.6 : 1) * (w.turnMul || 1);
  // visée d'un affût géré par W_TICK : pilotage manuel (curseur), automatique en pilotage, ou IA (cible du robot / tir fractionné)
  const A = { man: false, want: false, tgt: null, tx: 0, ty: 0 };
  H.tAim = (u, m, dt, mx, my) => {
    const w = m.w, mi = u.mounts.indexOf(m);
    if (u.piloted && !(u.wm && u.wm[mi] === 'a')) {
      A.man = true; A.want = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire);
      A.tgt = cursorTarget(u.team); A.tx = mouse.wx; A.ty = mouse.wy; return A;
    }
    A.man = false;
    const mine = u.kind === 'robot' && u.team === 0 && !u.net, base = !u.piloted && u.target && !u.target.dead && !u.target.hidden ? u.target : null;
    let tgt;
    if (u.piloted) tgt = mountTarget(u, m, dt, null, Math.max(950, (w.range || 0) + 60));
    else if (mine && (u.split || !base || !mountReach(u, m, base))) tgt = mountTarget(u, m, dt, base, (w.range || 0) + 60) || base;
    else { tgt = base; if (mine) m.tgt2 = null; }
    A.tgt = tgt;
    if (!tgt) { A.want = false; A.tx = mx + Math.cos(u.ang) * 100; A.ty = my + Math.sin(u.ang) * 100; return A; }
    const d = Math.hypot(tgt.x - mx, tgt.y - my);
    A.tx = tgt.x; A.ty = tgt.y; A.want = d <= w.range + tgt.r && d >= (w.minRange || 0); return A;
  };
  // ennemis d'un cercle, du plus proche au plus lointain (au plus max)
  H.foesSorted = (x, y, R, team, max, o) => {
    const L = [];
    foesIn(x, y, R, team, v => { if (v.cloak && time - (v.lastFire || -9) > 1.5) return; L.push([v, d2(v.x, v.y, x, y)]); }, o);
    L.sort((a, b) => a[1] - b[1]); if (L.length > max) L.length = max;
    return L.map(e => e[0]);
  };
  // distance d'un point à un segment
  H.segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, k = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return Math.hypot(px - ax - dx * k, py - ay - dy * k); };
  // une unité qu'on peut déplacer (aspirer, repousser) : ni bâtiment, ni balise, ni unité d'un autre joueur
  H.movable = v => !v.static && !v.net && !v.jumping && v.kind !== 'building' && v.kind !== 'beacon' && v.kind !== 'beacon2' && v.kind !== 'npc';
  // les géants et les boss ne se laissent pas emporter
  H.massK = v => v.giant || v.boss ? .08 : v.r > 150 ? .1 : v.r > 60 ? .35 : v.r > 30 ? .7 : 1;
  // projectile qu'on peut abattre, freiner ou arrêter (pas les traceurs de zone, pas les engins souterrains)
  H.solid = b => !b.ovl && !b.under && !b.vfx && !(B_KIND[b.kind] && B_KIND[b.kind].pd === false);
  H.rmBullet = b => { const i = bullets.indexOf(b); if (i < 0) return false; bullets[i] = bullets[bullets.length - 1]; bullets.pop(); return true; };
  // petits sprites en cache (dégradés coûteux à recalculer à chaque image)
  const SPR = {};
  H.spr = (key, S, fn) => { if (SPR[key]) return SPR[key]; const s = cvs(S, S), c = s.getContext('2d'); fn(c, S); return SPR[key] = s; };
  H.radial = (key, stops) => H.spr(key, 64, (c, S) => { const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(0, 0, S, S); });
  H.dustRGB = (x, y) => { try { return FX.groundRGB(x, y).join(','); } catch (e) { return '170,160,140'; } };
  H.dust = (x, y, vx, vy, size, life, rgb) => { if (!H.pOK()) return; parts.push({ type: 'dust', x, y, vx, vy, life, max: life, size, rgb: rgb || H.dustRGB(x, y) }); };
  // décor : le jeu ne rase pas la base du joueur
  H.decorOK = () => !NETVIS && W && !W.isBase;
  // zone dessinée par-dessus les unités : un traceur sans masse dans bullets suit la zone (B_KIND.xb_ovl) et appelle ZONE_K[zk].over
  H.ovl = (f, ext) => { f.oe = ext || f.r; bullets.push({ kind: 'xb_ovl', f, x: f.x, y: f.y, px: f.x, py: f.y, vx: 0, vy: 0, team: f.team, dmg: 0, range: 1, dist: 0, life: 0, ovl: 1, vis: f.vis, sc: 1 }); return f; };
  B_KIND.xb_ovl = {
    high: true, pd: false,
    update(b) { const f = b.f; if (f.done || f.t <= 0) return true; const e = f.oe; b.x = b.px = clamp(cam.x, f.x - e, f.x + e); b.y = b.py = clamp(cam.y, f.y - e, f.y + e); return false; },
    draw(c, b) { const f = b.f, Z = ZONE_K[f.zk]; if (Z && Z.over && !f.done && f.t > 0) Z.over(c, f); },
  };
  // capsule lancée vers un point (en cloche si arc) : à l'arrivée, POD[pk](b) ouvre l'effet
  H.POD = {}; H.PODDRAW = {}; H.PODTICK = {};
  H.pod = (pk, x, y, tx, ty, spd, team, src, o) => {
    const d = Math.max(20, Math.hypot(tx - x, ty - y)), a = Math.atan2(ty - y, tx - x);
    return projectile('xb_pod', x, y, a, spd, Object.assign({ pk, team, src, tx, ty, range: d, air: true, x0: x, y0: y, h: 0, arc: 0 }, o));
  };
  B_KIND.xb_pod = {
    high: true,
    update(b, dt) {
      b.life += dt; b.px = b.x; b.py = b.y;
      const sp = Math.hypot(b.vx, b.vy); b.x += b.vx * dt; b.y += b.vy * dt; b.dist += sp * dt;
      const k = Math.min(1, b.dist / b.range); b.h = Math.sin(k * Math.PI) * (b.arc || 0);
      if (H.PODTICK[b.pk] && H.vfx()) H.PODTICK[b.pk](b, dt);
      if (b.dist >= b.range || b.x < 0 || b.y < 0 || b.x >= WPX || b.y >= WPX) { b.x = clamp(b.tx, 1, WPX - 1); b.y = clamp(b.ty, 1, WPX - 1); if (H.POD[b.pk]) H.POD[b.pk](b); return true; }
      return false;
    },
    draw(c, b) { const D = H.PODDRAW[b.pk]; if (D) D(c, b); },
  };
  // éclair de bouche
  H.flash = (x, y, a, col, s) => { if (!H.vfx()) return; muzzle(x, y, a, col, s); parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .1, max: .1, size: 14 * s, col, a: 0 }); };
  H.ring = (x, y, size, col, life, thin) => { if (!H.pOK(880)) return; parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life, max: life, size, col, thin }); };
  H.sparks = (x, y, n, col) => { if (!H.pOK()) return; sparks(x, y, H.low() ? Math.ceil(n / 2) : n, col); };
  // courbe à travers des points (lissée), pour les rubans et les sillons
  H.smooth = (c, P) => { c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; c.quadraticCurveTo(P[i][0], P[i][1], mx, my); } const L = P[P.length - 1]; c.lineTo(L[0], L[1]); };
})();

// ================= DONNÉES : ARMES =================
(() => {
  const n0 = v => tlNum(v);
  Object.assign(WEAPONS, {
    // ---- titanesques (taille 4)
    tornado: { n: TL('Générateur de tornade'), size: 4, kind: 'tornado', dmg: 140, dps: 260, rate: .09, spd: 1100, range: 1500, tr: 260, tt: 7, tspd: 120, col: '#d8cdb4', snd: 'gravity', cost: { crystals: 260, circuits: 220, cores: 6 }, d: TL('Lâche une tornade qui erre parmi les ennemis, les aspire et arrache le décor.'),
      stat: w => TL('{n} dps', { n: Math.round(w.dmg) }) + ' · ' + TL('tornade {n} s', { n: w.tt }) + ' · ' + TL('aspire') },
    nanites: { n: TL('Nuée de nanites'), size: 4, kind: 'nanites', dmg: 180, dps: 300, rate: .1, spd: 800, range: 1300, nr: 220, nt: 9, nspd: 70, corr: .4, col: '#a8c8a0', snd: 'acid', cost: { crystals: 240, circuits: 240, cores: 6 }, d: TL('Un nuage de nanites qui poursuit l\'ennemi et dévore son blindage.'),
      stat: w => TL('{n} dps', { n: Math.round(w.dmg) }) + ' · ' + TL('nuage {n} s', { n: w.nt }) + ' · ' + TL('ronge le blindage') },
    fault: { n: TL('Faille tectonique'), size: 4, kind: 'fault', dmg: 650, dps: 420, rate: .09, range: 1300, splash: 120, strikes: 9, ft: 1.1, stun: .5, col: '#ff8a3a', snd: 'mortar', cost: { scrap: 600, alloy: 300, cores: 6 }, d: TL('Ouvre une faille jusqu\'à la cible : le sol explose tout du long.'),
      stat: w => TLn(w.strikes, '{n} éruption de {dmg}', '{n} éruptions de {dmg}', { dmg: fmt(w.dmg) }) + ' · ' + TL('{n} px', { n: Math.round(w.range) }) + ' · ' + TL('au sol') },
    phalanx: { n: TL('Phalange antimissile'), size: 4, kind: 'pd', dmg: 120, dps: 120, range: 520, pdT: .12, aa: 1, support: 1, col: '#ffc04a', snd: 'laser', cost: { circuits: 300, crystals: 160, cores: 5 }, d: TL('Abat les roquettes, obus et missiles ennemis qui passent à portée, et grille les drones.'),
      stat: w => TL('abat les projectiles') + ' · ' + TL('{n} dps antiaérien', { n: Math.round(w.dmg) }) + ' · ' + TL('{n} px', { n: Math.round(w.range) }) },
    stasis: { n: TL('Projecteur de stase'), size: 4, kind: 'stasis', dmg: 250, dps: 150, rate: .12, spd: 1000, range: 1150, splash: 220, stun: 2.5, vuln: .3, vulnT: 4, col: '#bfefff', snd: 'frost', cost: { crystals: 300, circuits: 220, cores: 7 }, d: TL('Fige tout dans une bulle de stase ; les cibles prisonnières encaissent 30 % de plus.'),
      stat: w => TL('{n} dégâts', { n: Math.round(w.dmg) }) + ' · ' + TL('fige {n} s', { n: n0(w.stun) }) + ' · ' + TL('+{n} % de dégâts subis', { n: Math.round(w.vuln * 100) }) },
    hive: { n: TL('Lance-essaims'), size: 4, kind: 'hive', dmg: 32, dps: 320, rate: 10, spd: 560, range: 1100, splash: 30, targets: 8, col: '#ffb020', snd: 'swarm', cost: { alloy: 280, circuits: 260, cores: 6 }, d: TL('Un flot continu de micro-missiles répartis sur huit cibles.'),
      stat: w => TL('{n} dps', { n: Math.round(w.dmg * w.rate) }) + ' · ' + TLn(w.targets, '{n} cible', '{n} cibles') + ' · ' + TL('{n} px', { n: Math.round(w.range) }) },
    prism: { n: TL('Prisme réfracteur'), size: 4, kind: 'prism', dps: 300, split: 4, sdps: .3, sR: 380, range: 1000, bw: 1.3, col: '#e6c8ff', snd: 'beam', cost: { crystals: 300, circuits: 200, cores: 6 }, d: TL('Rayon continu qui se diffracte sur sa cible et frappe quatre ennemis voisins.'),
      stat: w => TL('{n} dps continu', { n: Math.round(w.dps) }) + ' · ' + TLn(w.split, '+{n} rayon de {dps} dps', '+{n} rayons de {dps} dps', { dps: Math.round(w.dps * w.sdps) }) },
    // ---- colossales (taille 5)
    railvolley: { n: TL('Batterie de railguns'), size: 5, kind: 'railvolley', dmg: 950, dps: 700, rails: 5, fan: .08, rate: .16, range: 2600, col: '#9ef0ff', snd: 'rail', cost: { alloy: 900, circuits: 600, cores: 12 }, d: TL('Cinq rails parallèles qui traversent tout.'),
      stat: w => TLn(w.rails, '{n} rail de {dmg}', '{n} rails de {dmg}', { dmg: fmt(w.dmg) }) + ' · ' + TL('traverse tout') + ' · ' + TL('{n} px', { n: Math.round(w.range) }) },
    seism: { n: TL('Générateur sismique'), size: 5, kind: 'seism', dmg: 1800, dps: 600, rate: .09, range: 1000, st: 1.2, stun: .8, col: '#e0b070', snd: 'siege', cost: { scrap: 1500, alloy: 700, cores: 12 }, d: TL('Le géant frappe le sol : une onde sismique balaie tout ce qui marche autour de lui.'),
      stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('onde de {n} px', { n: Math.round(w.range) }) + ' · ' + TL('au sol') },
    bombers: { n: TL('Escadrille de bombardiers'), size: 5, kind: 'bombers', dmg: 320, dps: 350, splash: 110, planes: 3, bombs: 6, band: 900, rate: .06, range: 2800, minRange: 400, noRival: 1, col: '#ffcf7a', snd: 'drone', cost: { alloy: 800, circuits: 900, cores: 12 }, d: TL('Trois bombardiers survolent la cible et la couvrent de bombes.'),
      stat: w => TLn(w.planes * w.bombs, '{n} bombe de {dmg}', '{n} bombes de {dmg}', { dmg: Math.round(w.dmg) }) + ' · ' + TL('{n} px', { n: Math.round(w.range) }) },
    plasmawall: { n: TL('Mur de plasma'), size: 5, kind: 'wall', dmg: 900, dps: 700, len: 900, wt: 7, rate: .1, range: 1600, minRange: 200, col: '#d070ff', snd: 'plasma', cost: { crystals: 900, circuits: 700, cores: 14 }, d: TL('Dresse un mur de plasma qui brûle les ennemis et arrête leurs tirs.'),
      stat: w => TL('{n} dps', { n: Math.round(w.dmg) }) + ' · ' + TL('mur de {n} px', { n: w.len }) + ' · ' + TL('arrête les tirs') },
    mirv: { n: TL('Missile à têtes multiples'), size: 5, kind: 'mirv', dmg: 1100, dps: 700, heads: 8, splash: 150, spd: 450, rate: .1, range: 2800, minRange: 500, col: '#ff9a40', snd: 'launch', cost: { alloy: 700, circuits: 800, cores: 14 }, d: TL('Un missile qui se divise en huit ogives guidées sur huit cibles.'),
      stat: w => TLn(w.heads, '{n} ogive de {dmg}', '{n} ogives de {dmg}', { dmg: fmt(w.dmg) }) + ' · ' + TL('{n} px', { n: Math.round(w.range) }) },
    chrono: { n: TL('Distordeur temporel'), size: 5, kind: 'chrono', dmg: 200, dps: 350, cr: 520, ct: 7, haste: .3, slowF: 2.5, rate: .08, range: 1800, col: '#f2d48a', snd: 'charge', cost: { crystals: 1000, circuits: 800, cores: 16 }, d: TL('Une bulle où le temps se fige pour l\'ennemi et s\'accélère pour vos robots.'),
      stat: w => TL('{n} dps', { n: Math.round(w.dmg) }) + ' · ' + TL('tirs ennemis ÷{n}', { n: n0(w.slowF) }) + ' · ' + TL('cadence alliée +{n} %', { n: Math.round(w.haste * 100) }) },
    burrower: { n: TL('Torpille fouisseuse'), size: 5, kind: 'burrow', dmg: 2200, dps: 600, splash: 300, stun: .6, spd: 500, rate: .1, range: 2400, minRange: 300, col: '#c49a5a', snd: 'cruise', cost: { alloy: 900, circuits: 600, cores: 12 }, d: TL('Une torpille qui file sous terre et jaillit sous la cible.'),
      stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('rayon {n}', { n: w.splash }) + ' · ' + TL('passe sous le décor') },
    cage: { n: TL('Cage de foudre'), size: 5, kind: 'cage', dmg: 1500, dps: 700, idps: .2, cr: 380, ct: 6, rate: .09, range: 1800, minRange: 250, col: '#a8e4ff', snd: 'storm', cost: { circuits: 1000, crystals: 800, cores: 14 }, d: TL('Plante six pylônes reliés par la foudre : ce qui est dedans n\'en sort pas.'),
      stat: w => TL('{n} par arc', { n: fmt(w.dmg) }) + ' · ' + TL('{n} dps dedans', { n: Math.round(w.dmg * w.idps) }) + ' · ' + TL('{n} s', { n: w.ct }) },
  });
  // ligne de tir : les tirs directs ne partent pas dans un mur (le rail ne craint que les remparts et falaises)
  LATE.push(() => { LOF_KIND.stasis = 1; LOF_KIND.prism = 1; LOF_KIND.railvolley = 2; });

  // ================= RECHERCHES =================
  const T4 = TL('Armes titanesques'), T5 = TL('Armes colossales');
  const col = id => TL('{d} Arme colossale : se monte sur les géants des rangs 7 et 8.', { d: WEAPONS[id].d });
  const R = [
    { id: 'w_tornado', cat: T4, lab: 5, n: WEAPONS.tornado.n, cost: { data: 160, cores: 5 }, d: WEAPONS.tornado.d, req: 'w_gravwell', fam: 'ctrl' },
    { id: 'w_nanites', cat: T4, lab: 5, n: WEAPONS.nanites.n, cost: { data: 150, cores: 5 }, d: WEAPONS.nanites.d, req: 'w_corroder', fam: 'feu' },
    { id: 'w_fault', cat: T4, lab: 5, n: WEAPONS.fault.n, cost: { data: 160, cores: 5 }, d: WEAPONS.fault.d, req: 'w_carpet', fam: 'obus' },
    { id: 'w_phalanx', cat: T4, lab: 5, n: WEAPONS.phalanx.n, cost: { data: 140, cores: 4 }, d: WEAPONS.phalanx.d, req: 'w_shield', fam: 'sout' },
    { id: 'w_stasis', cat: T4, lab: 5, n: WEAPONS.stasis.n, cost: { data: 170, cores: 6 }, d: WEAPONS.stasis.d, req: 'w_cryobomb', fam: 'ctrl' },
    { id: 'w_hive', cat: T4, lab: 5, n: WEAPONS.hive.n, cost: { data: 160, cores: 5 }, d: WEAPONS.hive.d, req: 'w_swarm', fam: 'mis' },
    { id: 'w_prism', cat: T4, lab: 5, n: WEAPONS.prism.n, cost: { data: 180, cores: 6 }, d: WEAPONS.prism.d, req: 'w_beam', fam: 'nrj' },
    Object.assign({ id: 'w_railvolley', cat: T5, lab: 5, n: WEAPONS.railvolley.n, cost: { data: 360, cores: 8 }, d: col('railvolley'), req: 'w_gauss', req2: ['c_rempart'], fam: 'cin' }, SHIP(1)),
    Object.assign({ id: 'w_seism', cat: T5, lab: 5, n: WEAPONS.seism.n, cost: { data: 380, cores: 8 }, d: col('seism'), req: 'w_fault', req2: ['c_rempart'], fam: 'obus' }, SHIP(1)),
    Object.assign({ id: 'w_bombers', cat: T5, lab: 5, n: WEAPONS.bombers.n, cost: { data: 400, cores: 9 }, d: col('bombers'), req: 'w_deployer', req2: ['c_portenef'], fam: 'dep' }, SHIP(2)),
    Object.assign({ id: 'w_plasmawall', cat: T5, lab: 5, n: WEAPONS.plasmawall.n, cost: { data: 400, cores: 9 }, d: col('plasmawall'), req: 'w_prism', req2: ['c_arachne'], fam: 'nrj' }, SHIP(2)),
    Object.assign({ id: 'w_mirv', cat: T5, lab: 5, n: WEAPONS.mirv.n, cost: { data: 380, cores: 9 }, d: col('mirv'), req: 'w_hive', req2: ['c_rempart'], fam: 'mis' }, SHIP(1)),
    Object.assign({ id: 'w_chrono', cat: T5, lab: 5, n: WEAPONS.chrono.n, cost: { data: 420, cores: 9 }, d: col('chrono'), req: 'w_stasis', req2: ['c_portenef'], fam: 'ctrl' }, SHIP(2)),
    Object.assign({ id: 'w_burrower', cat: T5, lab: 5, n: WEAPONS.burrower.n, cost: { data: 360, cores: 8 }, d: col('burrower'), req: 'w_cruise', req2: ['c_rempart'], fam: 'mis' }, SHIP(1)),
    Object.assign({ id: 'w_cage', cat: T5, lab: 5, n: WEAPONS.cage.n, cost: { data: 400, cores: 9 }, d: col('cage'), req: 'w_lance', req2: ['c_portenef'], fam: 'elec' }, SHIP(1)),
  ];
  for (const r of R) addResearch(r);
  // prérequis venus du lot A : s'il manque (page d'essai isolée), la recherche se rattache à l'arme voisine du jeu de base
  const ALT = { w_gravwell: 'w_gravity', w_corroder: 'w_acidgun', w_carpet: 'w_mortar', w_cryobomb: 'w_emp', w_deployer: 'w_bay' };
  LATE.push(() => { for (const r of R) { const o = RESEARCH_BY_ID[r.id]; if (o && o.req && !RESEARCH_BY_ID[o.req] && ALT[o.req]) o.req = ALT[o.req]; } });
})();

// ================= MÉCANIQUES : ARMES TITANESQUES =================
(() => {
  const H = AB31;

  // ---------- 19. Générateur de tornade : une capsule d'air comprimé, puis une tornade qui erre parmi les ennemis ----------
  W_FIRE.tornado = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w);
    H.pod('tor', F.sx, F.sy, tx, ty, w.spd || 1100, u.team, u, { dmg: F.dmg * diffDmg(u.team), R: w.tr, T: w.tt, V: w.tspd, sc: F.sc });
    H.flash(F.sx, F.sy, F.a, '#efe6d0', F.sc * 1.2);
    if (H.pOK()) for (let k = 0; k < 6; k++) { const a = F.a + rnd(-.7, .7), s = rnd(60, 220); parts.push({ type: 'smoke', x: F.sx, y: F.sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.4, .8), max: .8, size: 4 * F.sc, col: '' }); }
    addShakeNear(F.sx, F.sy, 3);
  };
  H.PODTICK.tor = b => { if (parts.length < 760 && Math.random() < .7) parts.push({ type: 'dust', x: b.x, y: b.y, vx: -b.vy * .12, vy: b.vx * .12, life: .5, max: .5, size: 9, rgb: '236,228,210' }); };
  H.PODDRAW.tor = (c, b) => {
    const s = 9 + 4 * Math.min(4, b.sc || 1); c.translate(b.x, b.y); c.rotate(b.life * 20); c.lineCap = 'round';
    c.strokeStyle = 'rgba(240,232,214,.9)'; c.lineWidth = s * .2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, s * (.35 + k * .3), k * 2.1, k * 2.1 + 2.3); c.stroke(); }
    c.fillStyle = 'rgba(255,252,240,.95)'; circ(c, 0, 0, s * .18); c.fill();
  };
  H.POD.tor = b => {
    const f = addZone('xb_tornado', b.x, b.y, b.R, b.T, b.team, b.src, { dps: b.dmg, V: b.V, age: 0, h: b.a || 0, seed: Math.random() * 9, gT: 0, gx: b.x, gy: b.y, has: 0, list: [] });
    H.ovl(f, b.R * 2.4);
    H.ring(b.x, b.y, b.R, 'rgba(235,226,205,.9)', .6, true);
    SFX.play('gravity', .8, b.x, b.y, { size: 3 }); addShakeNear(b.x, b.y, 4);
  };
  ZONE_K.xb_tornado = {
    tick(f, dt) {
      f.age += dt; const R = f.r, k0 = Math.min(1, f.age / .6), fade = Math.min(1, f.t / .8);
      // cap : le groupe d'ennemis le plus proche, en serpentant
      f.gT -= dt;
      if (f.gT <= 0) {
        f.gT = .5; const v = nearestFoe(f.x, f.y, 1100, f.team);
        if (v) { let sx = 0, sy = 0, n = 0; foesIn(v.x, v.y, 280, f.team, e => { sx += e.x; sy += e.y; n++; }); f.gx = n ? sx / n : v.x; f.gy = n ? sy / n : v.y; f.has = 1; }
        else { f.has = 0; f.gx = f.x + Math.cos(f.h) * 400; f.gy = f.y + Math.sin(f.h) * 400; }
      }
      const dx = f.gx - f.x, dy = f.gy - f.y, dd = Math.hypot(dx, dy);
      f.h = turnTo(f.h, Math.atan2(dy, dx) + Math.sin(f.age * 1.7 + f.seed) * .75, 1.8 * dt);
      const sp = f.V * k0 * (f.has && dd < 60 ? .45 : 1);
      f.x = clamp(f.x + Math.cos(f.h) * sp * dt, 200, WPX - 200); f.y = clamp(f.y + Math.sin(f.h) * sp * dt, 200, WPX - 200);
      // aspiration continue vers l'œil, et rotation autour (les géants résistent)
      if (!NETVIS) for (const v of f.list) {
        if (v.dead || v.hidden || !H.movable(v)) continue;
        const ex = f.x - v.x, ey = f.y - v.y, d = Math.hypot(ex, ey) || 1; if (d > R + v.r) continue;
        const q = (1 - d / (R + v.r)) * H.massK(v) * fade * k0, dp = Math.min(d * .5, (80 + 240 * q) * q * dt), sw = 230 * q * dt;
        v.x += ex / d * dp - ey / d * sw; v.y += ey / d * dp + ex / d * sw;
      }
      if (f.tick > 0) return; f.tick = .2;
      f.list.length = 0;
      foesIn(f.x, f.y, R, f.team, v => {
        f.list.push(v); if (NETVIS) return;
        const d = Math.hypot(v.x - f.x, v.y - f.y), small = v.r < 30 && !v.giant && !v.boss;
        hurt(v, f.dps * .2 * fade * k0 * (d < R * .5 ? 1.25 : .8), f.src, small && d < R * .8 ? { stun: .3 } : null);
        if (small && H.movable(v)) { v.x += rnd(-5, 5); v.y += rnd(-5, 5); } // soulevés et secoués
      });
      // le décor s'arrache : arbres et cristaux près de l'œil
      if (H.decorOK() && fade > .4 && k0 >= 1) {
        const rr = R * .55, t0x = Math.max(0, ((f.x - rr) / TILE) | 0), t1x = Math.min(WT - 1, ((f.x + rr) / TILE) | 0), t0y = Math.max(0, ((f.y - rr) / TILE) | 0), t1y = Math.min(WT - 1, ((f.y + rr) / TILE) | 0);
        for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
          const o = W.obs[ty * WT + tx]; if ((o !== 1 && o !== 4) || Math.random() > .35) continue;
          const x = tx * TILE + 20, y = ty * TILE + 20; if (d2(x, y, f.x, f.y) > rr * rr) continue;
          destroyTile(tx, ty, o, null);
          if (H.pOK()) for (let k = 0; k < 4; k++) { const a = Math.atan2(y - f.y, x - f.x); parts.push({ type: 'debris', x, y, vx: -Math.sin(a) * rnd(180, 300), vy: Math.cos(a) * rnd(180, 300) - 60, life: rnd(.6, 1.1), max: 1.1, size: rnd(3, 6), col: o === 1 ? '#3a4c2a' : '#a07ad8', rot: rnd(0, 6) }); }
        }
      }
      // poussière qui tourne
      if (H.pOK(760)) { const rgb = H.dustRGB(f.x, f.y); for (let k = 0; k < (H.low() ? 2 : 5); k++) { const a = Math.random() * TAU, rr = R * rnd(.35, 1); H.dust(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr, -Math.sin(a) * 220 - Math.cos(a) * 50, Math.cos(a) * 220 - Math.sin(a) * 50, rnd(18, 34), rnd(.7, 1.1), rgb); } }
    },
    end(f) { f.done = true; },
    draw(c, f) {
      const R = f.r, A = Math.min(1, f.age / .6) * Math.min(1, f.t / .8);
      c.globalAlpha = .7 * A;
      c.drawImage(H.radial('torG', [[0, 'rgba(90,80,66,.55)'], [.2, 'rgba(150,138,116,.5)'], [.65, 'rgba(170,158,136,.28)'], [1, 'rgba(170,158,136,0)']]), f.x - R * 1.15, f.y - R * 1.15, R * 2.3, R * 2.3);
      c.translate(f.x, f.y); c.rotate(f.age * 2.8); c.lineCap = 'round';
      c.strokeStyle = 'rgba(214,204,182,.42)'; c.lineWidth = Math.max(3, R * .06);
      c.beginPath();
      for (let k = 0; k < 4; k++) for (let i = 0; i <= 9; i++) { const s = i / 9, a = k * TAU / 4 - s * 2.5, rr = R * (.12 + .88 * s); i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.stroke(); c.globalAlpha = 1;
    },
    // l'entonnoir s'élève au-dessus des unités : anneaux qui s'évasent, débris en orbite
    over(c, f) {
      const R = f.r, k0 = Math.min(1, f.age / .6), A = Math.min(1, f.t / .8), Hh = R * 1.65 * (.25 + .75 * k0), N = 8, lw = Math.max(2.5, R * .03);
      const L = [], Rt = [];
      for (let i = 0; i < N; i++) { const h = i / (N - 1); Rt.push(R * (.09 + .58 * Math.pow(h, 1.3)) * (.6 + .4 * k0)); L.push([f.x + Math.sin(f.age * 1.4 + h * 2.6 + f.seed) * R * .2 * h, f.y - h * Hh]); }
      // silhouette du tourbillon
      c.fillStyle = `rgba(178,166,144,${.2 * A})`; c.beginPath();
      for (let i = 0; i < N; i++) c[i ? 'lineTo' : 'moveTo'](L[i][0] - Rt[i], L[i][1]);
      for (let i = N - 1; i >= 0; i--) c.lineTo(L[i][0] + Rt[i], L[i][1]);
      c.closePath(); c.fill();
      for (let i = 0; i < N; i++) {
        const h = i / (N - 1), rr = Rt[i];
        c.strokeStyle = `rgba(${206 + i * 5},${196 + i * 5},${176 + i * 5},${(.5 - h * .25) * A})`; c.lineWidth = lw * (1.5 - h * .5);
        c.beginPath(); c.ellipse(L[i][0], L[i][1], rr, rr * .3, 0, f.age * 3 + i, f.age * 3 + i + 4.6); c.stroke();
      }
      // débris arrachés
      c.fillStyle = `rgba(52,46,38,${.85 * A})`;
      const nd = H.low() ? 10 : 22, s = Math.max(3, R * .022);
      for (let j = 0; j < nd; j++) {
        const h = (j * .137 + f.age * .2) % 1, i = h * (N - 1), i0 = i | 0, fr = i - i0, i1 = Math.min(N - 1, i0 + 1);
        const cx = L[i0][0] + (L[i1][0] - L[i0][0]) * fr, cy = L[i0][1] + (L[i1][1] - L[i0][1]) * fr, rr = (Rt[i0] + (Rt[i1] - Rt[i0]) * fr) * 1.05;
        const a = f.age * (3.5 + (j % 3)) + j * 2.4;
        c.fillRect(cx + Math.cos(a) * rr - s / 2, cy + Math.sin(a) * rr * .3 - s / 2, s * (1 + (j % 2)), s);
      }
    },
  };

  // ---------- 20. Nuée de nanites : une capsule qui crève en un nuage chasseur ----------
  W_FIRE.nanites = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w);
    H.pod('nan', F.sx, F.sy, tx, ty, w.spd || 800, u.team, u, { dmg: F.dmg * diffDmg(u.team), R: w.nr, T: w.nt, V: w.nspd, corr: w.corr, sc: F.sc, arc: 140 + Math.hypot(tx - F.sx, ty - F.sy) * .12 });
    H.flash(F.sx, F.sy, F.a, '#cfe8c8', F.sc);
  };
  H.PODTICK.nan = b => { if (parts.length < 760 && Math.random() < .5) parts.push({ type: 'spark', x: b.x, y: b.y - b.h, vx: rnd(-30, 30), vy: rnd(-30, 30), life: .4, max: .4, size: 1.6, col: '#b8d8b0' }); };
  H.PODDRAW.nan = (c, b) => {
    const s = 7 + 2.5 * Math.min(4, b.sc || 1);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(b.x, b.y, s, s * .55, 0, 0, TAU); c.fill();
    c.translate(b.x, b.y - b.h); c.rotate(b.life * 6);
    c.fillStyle = '#3e4a40'; rr(c, -s, -s * .55, s * 2, s * 1.1, s * .5); c.fill();
    c.fillStyle = '#8fae8a'; c.fillRect(-s * .55, -s * .55, s * .3, s * 1.1); c.fillRect(s * .25, -s * .55, s * .3, s * 1.1);
    c.fillStyle = Math.sin(b.life * 20) > 0 ? '#e8ffe0' : '#6f8a6a'; circ(c, 0, 0, s * .22); c.fill();
  };
  H.POD.nan = b => {
    const f = addZone('xb_nanites', b.x, b.y, b.R, b.T, b.team, b.src, { dps: b.dmg, V: b.V, corr: b.corr, age: 0, vx: 0, vy: 0, gT: 0, tg: null });
    H.ovl(f, b.R * 1.2);
    H.ring(b.x, b.y, b.R * .8, '#b8d8b0', .5, true); H.sparks(b.x, b.y, 12, '#cfe8c8');
    SFX.play('acid', .8, b.x, b.y, { size: 3 });
  };
  ZONE_K.xb_nanites = {
    tick(f, dt) {
      f.age += dt; f.gT -= dt;
      if (f.gT <= 0) { f.gT = .4; f.tg = nearestFoe(f.x, f.y, 1000, f.team); }
      const t = f.tg && !f.tg.dead && !f.tg.hidden ? f.tg : null; let ax = 0, ay = 0;
      if (t) { const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1; if (d > 25) { ax = dx / d * f.V; ay = dy / d * f.V; } }
      const k = Math.min(1, dt * 2); f.vx += (ax - f.vx) * k; f.vy += (ay - f.vy) * k;
      f.x = clamp(f.x + f.vx * dt, 100, WPX - 100); f.y = clamp(f.y + f.vy * dt, 100, WPX - 100);
      if (f.tick > 0) return; f.tick = .25;
      const fx = H.pOK(780);
      foesIn(f.x, f.y, f.r, f.team, v => {
        if (fx && Math.random() < .6) parts.push({ type: 'spark', x: v.x + rnd(-v.r, v.r) * .7, y: v.y + rnd(-v.r, v.r) * .7, vx: rnd(-50, 50), vy: rnd(-50, 50), life: .3, max: .3, size: 2, col: Math.random() < .5 ? '#d8f0d0' : '#8fae8a' });
        if (!NETVIS) hurt(v, f.dps * .25, f.src, { corr: f.corr, corrT: 1.5 });
      });
    },
    end(f) { f.done = true; },
    draw(c, f) {
      const R = f.r * Math.min(1, .35 + f.age / .6), A = Math.min(1, f.t / 1);
      c.globalAlpha = .35 * A; c.drawImage(H.radial('nanS', [[0, 'rgba(40,52,40,.6)'], [.7, 'rgba(40,52,40,.25)'], [1, 'rgba(40,52,40,0)']]), f.x - R, f.y - R, R * 2, R * 2); c.globalAlpha = 1;
    },
    // la nuée : des points qui scintillent et tourbillonnent, par-dessus les cibles
    over(c, f) {
      const R = f.r * Math.min(1, .35 + f.age / .6), A = Math.min(1, f.t / 1), N = H.low() ? 60 : 120, t = f.age, s = Math.max(4, R * .028);
      c.globalAlpha = .5 * A; c.drawImage(H.radial('nanH', [[0, 'rgba(170,200,160,.6)'], [.55, 'rgba(150,178,140,.3)'], [1, 'rgba(140,165,135,0)']]), f.x - R * 1.15, f.y - R * 1.15, R * 2.3, R * 2.3);
      // contour flou de la nuée : une bande de points qui tourne
      const cols = ['#c4e0bc', '#8aa684', '#5e7460'];
      for (let ci = 0; ci < 3; ci++) {
        c.fillStyle = cols[ci];
        for (let j = ci; j < N; j += 3) {
          const u1 = (j * .6180339) % 1, u2 = (j * .7548777) % 1, dir = j & 1 ? 1 : -1, a = u2 * TAU + t * (.5 + u1 * .9) * dir;
          const rr2 = R * Math.pow(u1, .4) * (.82 + .18 * Math.sin(t * 2.3 + j)), x = f.x + Math.cos(a) * rr2 + Math.sin(t * 3.1 + j * 1.3) * R * .05, y = f.y + Math.sin(a) * rr2 * .92 + Math.cos(t * 2.7 + j) * R * .05;
          c.globalAlpha = A * (.35 + .65 * Math.abs(Math.sin(t * 6 + j * 1.7))); c.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      c.globalAlpha = A; c.fillStyle = '#f4fff0';
      for (let j = 0; j < 14; j++) { const a = j * 2.3 + t * 1.3, rr2 = R * ((j * .37 + t * .3) % 1) * .9; if (Math.sin(t * 9 + j * 3) > .4) c.fillRect(f.x + Math.cos(a) * rr2 - s, f.y + Math.sin(a) * rr2 - s * .3, s * 2, s * .6); }
      c.globalAlpha = .35 * A; c.strokeStyle = '#b8d8b0'; c.lineWidth = Math.max(2, R * .012); c.setLineDash([R * .05, R * .09]); c.lineDashOffset = -t * R * .3; circ(c, f.x, f.y, R * .93); c.stroke(); c.setLineDash([]);
      c.globalAlpha = 1;
    },
  };

  // ---------- 21. Faille tectonique : neuf éruptions en ligne, depuis l'avant du robot ----------
  W_FIRE.fault = (u, m, w, F) => {
    const a = Math.atan2(F.ty - u.y, F.tx - u.x), ca = Math.cos(a), sa = Math.sin(a), x0 = u.x + ca * u.r * .85, y0 = u.y + sa * u.r * .85, L = w.range;
    const f = addZone('xb_fault', x0 + ca * L / 2, y0 + sa * L / 2, L / 2 + 160, w.ft + 3.4, u.team, u, { x0, y0, a, L, n: 0, age: 0, dmg: F.dmg * diffDmg(u.team), R: w.splash, N: w.strikes, ft: w.ft, stun: w.stun, jit: [] });
    for (let k = 0; k <= f.N * 2 + 1; k++) f.jit.push(rnd(-1, 1));
    H.flash(F.sx, F.sy, F.a, '#ffa060', F.sc * 1.4); addShakeNear(u.x, u.y, 6);
  };
  const SHARD = ['#4a3f33', '#5e5244', '#2e2822', '#7a6a55'];
  function erupt(f, k) {
    const ca = Math.cos(f.a), sa = Math.sin(f.a), d = (k + .5) / f.N * f.L, j = f.jit[k] * 18, x = f.x0 + ca * d - sa * j, y = f.y0 + sa * d + ca * j, R = f.R;
    if (x < 40 || y < 40 || x >= WPX - 40 || y >= WPX - 40) return;
    if (!NETVIS) foesIn(x, y, R, f.team, v => { const dd = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.r); hurt(v, f.dmg * (1 - clamp(dd / R, 0, 1) * .5), f.src, { stun: f.stun, push: 320, px: x, py: y }); }, { air: false });
    if (H.decorOK()) {
      const rr2 = 72, t0x = Math.max(0, ((x - rr2) / TILE) | 0), t1x = Math.min(WT - 1, ((x + rr2) / TILE) | 0), t0y = Math.max(0, ((y - rr2) / TILE) | 0), t1y = Math.min(WT - 1, ((y + rr2) / TILE) | 0);
      for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) { const o = W.obs[ty * WT + tx]; if (o && o < 7 && d2(tx * TILE + 20, ty * TILE + 20, x, y) < (rr2 + 14) ** 2) destroyTile(tx, ty, o, null); }
    }
    if (!NETVIS) { scarSprite('crack', x, y, R * 1.05, f.a + rnd(-.4, .4)); scarSprite('crater', x, y, R * .32, rnd(0, TAU)); }
    if (H.vfx()) {
      parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .14, max: .14, size: R * .9, col: '#ffb070', a: 0 });
      parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .45, max: .45, size: R * 1.1, col: '#d8a060' });
      const n = H.low() ? 5 : 11;
      for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = rnd(90, 420); parts.push({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: rnd(.6, 1.2), max: 1.2, size: rnd(3, 8), rot: rnd(0, 6), col: SHARD[i % 4] }); }
      for (let i = 0; i < 4; i++) parts.push({ type: 'fire', x: x + rnd(-20, 20), y: y + rnd(-20, 20), vx: rnd(-40, 40), vy: rnd(-120, -40), life: rnd(.3, .6), max: .6, size: rnd(R * .15, R * .3) });
      FX.dust(x, y, H.low() ? 3 : 6, R * .45, R * 1.3);
      parts.push({ type: 'smoke', x, y, vx: rnd(-15, 15), vy: -25, life: 1.8, max: 1.8, size: R * .5, col: '' });
    }
    addShakeNear(x, y, 5); SFX.play('explo', .75, x, y, { size: 2.5 });
  }
  ZONE_K.xb_fault = {
    tick(f, dt) { f.age += dt; while (f.n < f.N && f.age >= f.n * f.ft / (f.N - 1)) erupt(f, f.n++); },
    end(f) { f.done = true; },
    // la fissure rougeoie le long de la ligne, puis refroidit
    draw(c, f) {
      const ca = Math.cos(f.a), sa = Math.sin(f.a), M = f.N * 2, head = clamp(f.age / f.ft, 0, 1) * f.L * (1 + .5 / f.N), A = Math.min(1, f.t / 2.2);
      const P = [];
      for (let i = 0; i <= M + 1; i++) { const d = Math.min(head, i / M * f.L); const j = (f.jit[i] || 0) * 16; P.push([f.x0 + ca * d - sa * j, f.y0 + sa * d + ca * j]); if (d >= head) break; }
      if (P.length < 2) return;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.globalAlpha = .75 * A; c.strokeStyle = '#1c120c'; c.lineWidth = 22; c.beginPath(); H.smooth(c, P); c.stroke();
      c.globalCompositeOperation = 'lighter';
      const p = .7 + .3 * Math.sin(time * 9);
      c.globalAlpha = A * p; c.strokeStyle = '#ff6a1a'; c.lineWidth = 9; c.stroke();
      c.globalAlpha = A * Math.min(1, A * 1.5); c.strokeStyle = '#ffd890'; c.lineWidth = 3; c.stroke();
      if (f.age < f.ft + .1) { const L = P[P.length - 1]; c.globalAlpha = 1; c.drawImage(H.radial('fltH', [[0, 'rgba(255,240,200,1)'], [.3, 'rgba(255,150,60,.7)'], [1, 'rgba(255,90,20,0)']]), L[0] - 60, L[1] - 60, 120, 120); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
  };

  // ---------- 22. Phalange antimissile : abat les projectiles ennemis, sinon grille les volants et les petits ----------
  const PD_KIND = { rocket: 1, shell: 1, mortar: 1, plasma: 1 };
  function pdShot(u, m, x2, y2, sc, mx, my) {
    const a = Math.atan2(y2 - my, x2 - mx); m.pdTo = a; m.pdS = !m.pdS;
    const ca = Math.cos(m.aim), sa = Math.sin(m.aim), off = (m.pdS ? 4.2 : -4.2) * sc, sx = mx + ca * 34 * sc - sa * off, sy = my + sa * 34 * sc + ca * off;
    beams.push({ x1: sx, y1: sy, x2, y2, life: .11, max: .11, col: '#ffc04a', w: Math.max(2, .9 * sc) });
    m.fc = ((m.fc || 0) + 1) & 255; m.td = Math.round(Math.hypot(x2 - u.x, y2 - u.y)); m.recoil = .35; m.fcT2 = time; u.lastFire = time;
  }
  W_TICK.pd = (u, m, dt, mx, my) => {
    const w = m.w, sc = m.ds || u.mscale || 1;
    if (m.pdTo !== undefined) m.aim = turnTo(m.aim, m.pdTo, 14 * dt);
    if (u.stunT > time) return true;
    m.pdC = (m.pdC || 0) - dt * (u.slowT > 0 ? .6 : 1);
    if (m.pdC > 0) return true;
    m.pdC = w.pdT || .12;
    const R = w.range, R2 = R * R; let best = null, bs = 0;
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.team === u.team || b.team === undefined || b.vis || !(PD_KIND[b.kind] || B_KIND[b.kind]) || !H.solid(b)) continue;
      const dx = b.x - mx, dy = b.y - my; if (dx * dx + dy * dy > R2) continue;
      const mo = b.kind === 'mortar', di = Math.hypot((mo ? b.tx : b.x) - u.x, (mo ? b.ty : b.y) - u.y);
      const s = (b.dmg || 20) * (1 + (b.splash || 0) / 80) * (b.nuke ? 8 : 1) * (b.homing && b.homing.team === u.team ? 2 : 1) / (120 + di);
      if (s > bs) { bs = s; best = b; }
    }
    if (best) {
      const bx = best.x, by = best.y - (best.kind === 'mortar' ? best.h || 0 : best.h || 0), big = best.big || best.nuke || (best.splash || 0) > 150;
      H.rmBullet(best); pdShot(u, m, bx, by, sc, mx, my); m.pdN = (m.pdN || 0) + 1;
      if (H.vfx()) {
        parts.push({ type: 'flash', x: bx, y: by, vx: 0, vy: 0, life: .14, max: .14, size: big ? 50 : 24, col: '#ffd890', a: 0 });
        H.sparks(bx, by, 7, '#ffd27a'); H.ring(bx, by, big ? 50 : 24, '#ffc04a', .25, true);
        if (parts.length < 800) parts.push({ type: 'smoke', x: bx, y: by, vx: rnd(-10, 10), vy: -12, life: .9, max: .9, size: big ? 14 : 7, col: '' });
      }
      SFX.play('laser', .35, mx, my, { size: 2 });
      return true;
    }
    // aucun projectile : laser court sur un volant ou un petit ennemi (ou, en pilotage manuel, sur ce qui est sous le curseur)
    const man = u.piloted && !(u.wm && u.wm[u.mounts.indexOf(m)] === 'a');
    let v = null;
    if (man) { if ((mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire)) { const t = cursorTarget(u.team); if (t && Math.hypot(t.x - mx, t.y - my) <= R + t.r) v = t; else m.pdTo = Math.atan2(mouse.wy - my, mouse.wx - mx); } }
    else { let bd = Infinity; foesIn(mx, my, R, u.team, e => { if (!e.fly && e.r > 18 && !e.human) return; const q = d2(e.x, e.y, mx, my) * (e.fly ? .4 : 1); if (q < bd) { bd = q; v = e; } }); }
    if (v) { damage(v, w.dmg * (w.pdT || .12) * diffDmg(u.team), u); pdShot(u, m, v.x + rnd(-v.r, v.r) * .3, v.y + rnd(-v.r, v.r) * .3, sc, mx, my); H.sparks(v.x, v.y, 2, '#ffd27a'); SFX.play('laser', .22, mx, my, { size: 2 }); }
    return true;
  };
  // reproduction chez les autres joueurs : un trait laser vers le point visé
  W_FIRE.pd = (u, m, w, F) => { if (!NETVIS) return false; beams.push({ x1: F.sx, y1: F.sy, x2: F.tx, y2: F.ty, life: .11, max: .11, col: w.col, w: Math.max(2, .9 * F.sc) }); H.sparks(F.tx, F.ty, 4, '#ffd27a'); m.recoil = .35; SFX.play('laser', .3, F.sx, F.sy); return false; };

  // ---------- 23. Projecteur de stase : un éclat de cristal qui fige une bulle ----------
  W_FIRE.stasis = (u, m, w, F) => {
    const d = Math.hypot(F.tx - F.sx, F.ty - F.sy), rg = clamp(d + 10, 80, w.range * 1.05);
    projectile('xb_stasis', F.sx, F.sy, H.fineA(F), w.spd, { team: u.team, src: u, dmg: F.dmg * diffDmg(u.team), range: rg, R: w.splash, stun: w.stun, vuln: w.vuln, vulnT: w.vulnT, sc: F.sc, col: w.col, air: !!(u.fly || (F.tgt && F.tgt.fly)) });
    H.flash(F.sx, F.sy, F.a, '#dff8ff', F.sc * 1.3);
  };
  function stasisBurst(b) {
    const x = b.x, y = b.y, R = b.R, list = [];
    foesIn(x, y, R, b.team, v => { list.push(v); hurt(v, b.dmg, b.src, { stun: b.stun, vuln: b.vuln, vulnT: b.vulnT }); });
    const f = addZone('xb_stasis', x, y, R, b.stun + .4, b.team, b.src, { list, age: 0 });
    H.ovl(f, R + 80);
    if (H.vfx()) {
      parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .18, max: .18, size: R * .8, col: '#e8fbff', a: 0 });
      H.ring(x, y, R, '#ffffff', .4); H.ring(x, y, R * 1.2, '#bfefff', .7, true);
      for (let i = 0; i < (H.low() ? 6 : 14); i++) { const a = Math.random() * TAU, s = rnd(80, 360); parts.push({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.5, .9), max: .9, size: rnd(3, 6), rot: rnd(0, 6), col: i % 2 ? '#d8f6ff' : '#8fd8f0' }); }
    }
    SFX.play('icecrack', .9, x, y); SFX.play('frost', .8, x, y, { size: 3 }); addShakeNear(x, y, 4);
  }
  B_KIND.xb_stasis = {
    update(b, dt) {
      b.life += dt; const h = stepProjectile(b, dt, 8);
      if (H.pOK(760) && Math.random() < .6) parts.push({ type: 'spark', x: b.x, y: b.y, vx: rnd(-40, 40), vy: rnd(-40, 40), life: .35, max: .35, size: 2, col: '#d8f6ff' });
      if (h === 'out') return true;
      if (h || b.dist >= b.range) { stasisBurst(b); return true; }
      return false;
    },
    draw(c, b) {
      const s = 5 + 2.6 * Math.min(4, b.sc || 1);
      c.translate(b.x, b.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6;
      c.drawImage(H.radial('stG', [[0, 'rgba(220,250,255,.9)'], [.4, 'rgba(140,220,255,.4)'], [1, 'rgba(140,220,255,0)']]), -s * 3, -s * 3, s * 6, s * 6);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.rotate(Math.atan2(b.vy, b.vx));
      c.fillStyle = '#eafcff'; c.beginPath(); c.moveTo(s * 1.9, 0); c.lineTo(0, -s * .62); c.lineTo(-s * 1.2, 0); c.lineTo(0, s * .62); c.closePath(); c.fill();
      c.strokeStyle = '#6fcff0'; c.lineWidth = Math.max(1, s * .12); c.stroke(); c.beginPath(); c.moveTo(s * 1.9, 0); c.lineTo(-s * 1.2, 0); c.moveTo(0, -s * .62); c.lineTo(s * .5, 0); c.lineTo(0, s * .62); c.stroke();
    },
  };
  // bulle cristalline : un hexagone à facettes autour de chaque cible figée
  function bubble(c, x, y, r, A, seed) {
    const rot = seed * .7 + time * .15;
    c.globalAlpha = A; c.fillStyle = 'rgba(190,240,255,.24)'; ngon(c, 6, r, rot, x, y); c.fill();
    c.strokeStyle = 'rgba(232,252,255,.9)'; c.lineWidth = Math.max(2, r * .06); c.stroke();
    c.strokeStyle = 'rgba(190,236,255,.4)'; c.lineWidth = Math.max(1, r * .022); c.beginPath();
    for (let k = 0; k < 6; k++) { const a = rot + k / 6 * TAU, a2 = rot + Math.PI / 6 + k / 3 * Math.PI; c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(a2) * r * .5, y + Math.sin(a2) * r * .5); }
    c.stroke();
    const g = (time * .8 + seed * .13) % 1; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(1.5, r * .04);
    c.beginPath(); c.moveTo(x - r * .6 + g * r * .8, y - r * .55); c.lineTo(x - r * .35 + g * r * .8, y - r * .25); c.stroke();
  }
  ZONE_K.xb_stasis = {
    tick(f, dt) { f.age += dt; },
    end(f) { f.done = true; },
    draw(c, f) { if (f.age < .7) { c.strokeStyle = `rgba(200,245,255,${(.7 - f.age) * .8})`; c.lineWidth = 5; circ(c, f.x, f.y, f.r * (.4 + f.age * 1.1)); c.stroke(); } },
    over(c, f) {
      const A = Math.min(1, f.t / .4) * Math.min(1, f.age / .12);
      for (const v of f.list) { if (v.dead || v.hidden || (!f.vis && !(v.stunT > time))) continue; bubble(c, v.x, v.y, v.r * 1.25 + 8, A, v.id); }
      c.globalAlpha = 1;
    },
  };

  // ---------- 24. Lance-essaims : un flot continu de micro-missiles, répartis sur huit cibles ----------
  const CELLS = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) CELLS.push([(-6 + i * 4.2) * 1.25, (j - 1) * 4.6 * 1.25]);
  function hiveTrail(m, dt) {
    const L = m.hb; if (!L || !L.length) return; const fx = H.vfx();
    for (let i = L.length - 1; i >= 0; i--) {
      const e = L[i], b = e.b;
      if (b.life === e.l) { L[i] = L[L.length - 1]; L.pop(); continue; }
      e.l = b.life; if (!fx) continue;
      e.acc += Math.hypot(b.vx, b.vy) * dt;
      if (e.acc > 44 && parts.length < 760) { e.acc = 0; parts.push({ type: 'smoke', x: b.x, y: b.y, vx: rnd(-5, 5), vy: rnd(-5, 5), life: .55, max: .55, size: 2.8, col: '' }); }
    }
  }
  function hiveLaunch(u, m, w, mx, my, sc, t) {
    const ci = (m.hci = ((m.hci || 0) + 5) % 12), cx = CELLS[ci][0], cy = CELLS[ci][1], ca = Math.cos(m.aim), sa = Math.sin(m.aim);
    const sx = mx + (cx * ca - cy * sa) * sc, sy = my + (cx * sa + cy * ca) * sc;
    const b = shoot(sx, sy, m.aim + rnd(-1, 1), w.spd * .3, w.dmg, u.team, w.range * 1.35, 'rocket', w.col, 0, u, w.splash, sc * .45);
    b.homing = t && !t.dead ? t : null; b.maxSpd = w.spd; b.wob = Math.random() * 6; b.trail = -1e9; b.air = true;
    (m.hb || (m.hb = [])).push({ b, l: -1, acc: 0 });
    m.hFl = ci; m.hFt = time; m.fc = ((m.fc || 0) + 1) & 255; m.td = Math.round(t ? Math.hypot(t.x - u.x, t.y - u.y) : w.range); m.recoil = .2; u.lastFire = time;
    if (H.pOK(760)) parts.push({ type: 'smoke', x: sx, y: sy, vx: rnd(-30, 30), vy: rnd(-30, 30), life: .5, max: .5, size: 2.5 * Math.min(4, sc), col: '' });
    SFX.play('rocket', .22, sx, sy, { size: 1 });
  }
  W_TICK.hive = (u, m, dt, mx, my) => {
    const w = m.w, sc = m.ds || u.mscale || 1;
    hiveTrail(m, dt);
    m.hOpen = Math.max(0, (m.hOpen || 0) - dt * 1.5);
    if (u.stunT > time) return true;
    const A = H.tAim(u, m, dt, mx, my), L = m.hL || (m.hL = []);
    m.hT = (m.hT || 0) - dt;
    if (m.hT <= 0) {
      m.hT = A.man ? .3 : .5; L.length = 0;
      if (A.man) { if (A.tgt) L.push(A.tgt); for (const v of H.foesSorted(mouse.wx, mouse.wy, 340, u.team, w.targets + 1)) if (L.length < w.targets && !L.includes(v) && d2(v.x, v.y, mx, my) < (w.range * 1.25) ** 2) L.push(v); }
      else { if (A.tgt && A.want) L.push(A.tgt); for (const v of H.foesSorted(mx, my, w.range, u.team, w.targets + 2)) if (L.length < w.targets && !L.includes(v)) L.push(v); }
    }
    for (let i = L.length - 1; i >= 0; i--) if (L[i].dead || L[i].hidden) L.splice(i, 1);
    const want = A.man ? A.want : L.length > 0, t0 = L[0];
    const da = t0 && !A.man ? Math.atan2(t0.y - my, t0.x - mx) : Math.atan2(A.ty - my, A.tx - mx);
    m.aim = turnTo(m.aim, da, H.tRate(u, w) * dt);
    if (!want) { m.hc = 0; return true; }
    m.hOpen = Math.min(1, m.hOpen + dt * 5);
    m.hc = (m.hc || 0) - dt * (u.slowT > 0 ? .6 : 1) * (u.rateMul || 1);
    let n = 0;
    while (m.hc <= 0 && n < 3) { m.hc += 1 / w.rate; n++; m.hi = ((m.hi || 0) + 1) % Math.max(1, L.length); hiveLaunch(u, m, w, mx, my, sc, L.length ? L[m.hi] : null); }
    return true;
  };
  W_FIRE.hive = (u, m, w, F) => {
    if (!NETVIS) return false;
    const b = shoot(F.sx, F.sy, F.a + rnd(-.9, .9), w.spd * .3, w.dmg, u.team, Math.max(300, Math.hypot(F.tx - F.sx, F.ty - F.sy)) * 1.2, 'rocket', w.col, 0, u, w.splash, F.sc * .45);
    b.maxSpd = w.spd; b.wob = Math.random() * 6; b.air = true; b.trail = -1e9; m.hOpen = 1; m.hFt = time; m.recoil = .2; return false;
  };

  // ---------- 25. Prisme réfracteur : rayon irisé qui se diffracte sur sa cible ----------
  function pBeam(x1, y1, x2, y2, hue, w, life) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, px = -dy / l * w * .55, py = dx / l * w * .55;
    beams.push({ x1, y1, x2, y2, life, max: life, col: `hsl(${hue | 0},100%,74%)`, w, hot: true });
    beams.push({ x1: x1 + px, y1: y1 + py, x2: x2 + px, y2: y2 + py, life, max: life, col: `hsl(${(hue + 120) % 360 | 0},100%,66%)`, w: w * .32, hot: true });
    beams.push({ x1: x1 - px, y1: y1 - py, x2: x2 - px, y2: y2 - py, life, max: life, col: `hsl(${(hue + 240) % 360 | 0},100%,66%)`, w: w * .32, hot: true });
  }
  function pSplit(x1, y1, x2, y2, hue, w, life) { beams.push({ x1, y1, x2, y2, life, max: life, col: `hsl(${hue % 360 | 0},100%,70%)`, w, hot: true }); }
  function prismBeam(u, m, dt, mx, my, w) {
    if (time - (m.fcT || 0) > .1) { m.fcT = time; m.fc = ((m.fc || 0) + 1) & 255; }
    const a = m.aim, ca = Math.cos(a), sa = Math.sin(a), sc = m.ds || u.mscale || 1, sx = mx + ca * 16 * sc, sy = my + sa * 16 * sc;
    let len = w.range, hu = null;
    for (let s = 0; s < w.range; s += 14) {
      const x = sx + ca * s, y = sy + sa * s, tx = (x / TILE) | 0, ty = (y / TILE) | 0;
      if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) { len = s; break; }
      const o = W.obs[ty * WT + tx];
      if (o && !u.fly) { if (o === 8) hitBuildingTile(tx, ty, w.dps * dt, u.team, u); hitTile(tx, ty, w.dps * dt * 1.5); len = s; break; }
      const cell = cellAt(x, y);
      if (cell) for (let k = 0; k < cell.length; k++) { const v = cell[k]; if (v.team === u.team || v.dead || v.hidden || (u.team === 0 && v.team === 0)) continue; if (d2(v.x, v.y, x, y) < (v.r + 6) ** 2) { hu = v; break; } }
      if (hu) { len = s; break; }
    }
    const ex = sx + ca * len, ey = sy + sa * len, k = diffDmg(u.team), hue = (time * 140) % 360, W0 = 4 * sc * .7 * (w.bw || 1), life = dt * 1.6;
    if (hu) damage(hu, w.dps * dt * k, u);
    m.td = Math.round(Math.hypot(ex - u.x, ey - u.y));
    pBeam(sx, sy, ex, ey, hue, W0, life);
    if (hu) {
      m.sT = (m.sT || 0) - dt;
      if (m.sT <= 0 || m.sHu !== hu || !m.sL) { m.sT = .25; m.sHu = hu; m.sL = H.foesSorted(hu.x, hu.y, w.sR, u.team, w.split + 1).filter(v => v !== hu).slice(0, w.split); }
      const sd = w.dps * w.sdps * dt * k;
      for (let i = 0; i < m.sL.length; i++) { const v = m.sL[i]; if (v.dead || v.hidden) continue; damage(v, sd, u); pSplit(ex, ey, v.x, v.y, hue + 72 * (i + 1), W0 * .42, life); }
      if (H.pOK(780) && Math.random() < dt * 25) parts.push({ type: 'spark', x: ex, y: ey, vx: rnd(-120, 120), vy: rnd(-120, 120), life: .25, max: .25, size: 2.5, col: `hsl(${(hue + rnd(0, 360)) | 0},100%,75%)` });
    } else m.sL = null;
    SFX.hold('p' + u.id + '_' + u.mounts.indexOf(m), 'beam', u.piloted ? .55 : .4, sx, sy); m.recoil = .3; u.lastFire = time;
  }
  W_TICK.prism = (u, m, dt, mx, my) => {
    const w = m.w;
    if (u.stunT > time) { m.pOn = 0; return true; }
    const A = H.tAim(u, m, dt, mx, my), da = Math.atan2(A.ty - my, A.tx - mx);
    m.aim = turnTo(m.aim, da, H.tRate(u, w) * .55 * dt);
    let want = A.want && Math.abs(angDiff(m.aim, da)) < .3;
    // pas de rayon dans un mur : le robot se replace (comme pour le rayon thermique)
    if (want && !A.man && A.tgt && !u.fly && !A.tgt.fly && A.tgt.kind !== 'building') {
      if (time > (m.lofT || 0) || m.lofTg !== A.tgt) { m.lofTg = A.tgt; m.lofT = time + .15; m.lofI = lofBlock(mx, my, A.tx, A.ty, A.tgt.r * .6, false, 0); }
      if (m.lofI >= 0) { const o = W.obs[m.lofI]; if (o && !lofCheap(o)) { want = false; u.lofBad = time; } }
    }
    m.pOn = want ? Math.min(1, (m.pOn || 0) + dt * 6) : Math.max(0, (m.pOn || 0) - dt * 4);
    if (want) prismBeam(u, m, dt, mx, my, w);
    return true;
  };
  W_FIRE.prism = (u, m, w, F) => {
    if (!NETVIS) return false;
    const hue = (time * 140) % 360, W0 = 4 * F.sc * .7 * (w.bw || 1);
    pBeam(F.sx, F.sy, F.tx, F.ty, hue, W0, .16);
    let i = 0; for (const v of H.foesSorted(F.tx, F.ty, w.sR, u.team, w.split + 1)) { if (d2(v.x, v.y, F.tx, F.ty) < (v.r + 30) ** 2) continue; pSplit(F.tx, F.ty, v.x, v.y, hue + 72 * (i + 1), W0 * .42, .16); if (++i >= w.split) break; }
    m.pOn = 1; m.recoil = .3; SFX.hold('p' + u.id + '_' + u.mounts.indexOf(m), 'beam', .4, F.sx, F.sy); return false;
  };
})();

// ================= MÉCANIQUES : ARMES COLOSSALES =================
(() => {
  const H = AB31;

  // ---------- 26. Batterie de railguns : cinq rails en éventail serré ----------
  W_FIRE.railvolley = (u, m, w, F) => {
    const n = w.rails || 5, h = (n - 1) / 2, A = H.fineA(F), ca = Math.cos(A), sa = Math.sin(A), L = 44 * F.sc, dmg = F.dmg * diffDmg(u.team);
    for (let k = 0; k < n; k++) {
      const o = k - h, off = o * 3.4 * F.sc, sx = F.mx + ca * L - sa * off, sy = F.my + sa * L + ca * off;
      rail(u, sx, sy, A + o / h * (w.fan || .08), w.range, dmg, w.col);
      if (H.vfx()) muzzle(sx, sy, A, '#d8fbff', F.sc * .8);
    }
    const mx = F.mx + ca * L, my = F.my + sa * L;
    if (H.vfx()) { parts.push({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: .15, max: .15, size: 30 * F.sc, col: '#c8f8ff', a: 0 }); H.ring(mx, my, 22 * F.sc, '#9ef0ff', .35, true); for (let k = 0; k < 4; k++) parts.push({ type: 'smoke', x: mx, y: my, vx: ca * rnd(40, 120) + rnd(-30, 30), vy: sa * rnd(40, 120) + rnd(-30, 30), life: rnd(.6, 1.1), max: 1.1, size: 5 * F.sc, col: '' }); }
    addShakeNear(F.sx, F.sy, 8);
  };

  // ---------- 27. Générateur sismique : une onde au sol qui part du géant ----------
  function seismStart(u, w, dmg) {
    const f = addZone('xb_seism', u.x, u.y, w.range + 80, w.st + 1.3, u.team, u, { R0: u.r * .6, Rm: w.range, st: w.st, age: 0, dmg, stun: w.stun, hit: new Set(), cr: [], Rp: 0, Rc: u.r * .6, dT: 0, nS: 0 });
    for (let k = 0; k < 12; k++) { const P = [[0, 0]]; let x = 0, y = 0, aa = k / 12 * TAU + rnd(-.2, .2); const L = w.range * rnd(.4, .95), n = 7; for (let i = 1; i <= n; i++) { aa += rnd(-.4, .4); x += Math.cos(aa) * L / n; y += Math.sin(aa) * L / n; P.push([x, y]); } f.cr.push(P); }
    if (!NETVIS) scarSprite('crack', u.x, u.y, u.r * 1.7, rnd(0, TAU));
    if (H.vfx()) { parts.push({ type: 'flash', x: u.x, y: u.y, vx: 0, vy: 0, life: .2, max: .2, size: u.r * 1.4, col: '#ffe0a8', a: 0 }); FX.dust(u.x, u.y, H.low() ? 5 : 12, u.r * .5, u.r * 2.4); }
    addShakeNear(u.x, u.y, 16); SFX.play('explo', 1, u.x, u.y, { size: 5 });
    return f;
  }
  ZONE_K.xb_seism = {
    tick(f, dt) {
      f.age += dt; const k = clamp(f.age / f.st, 0, 1), R = f.R0 + (f.Rm - f.R0) * k, Rp = f.Rp; f.Rp = R; f.Rc = R;
      if (k >= 1 && Rp >= f.Rm) return;
      if (!NETVIS) foesIn(f.x, f.y, R, f.team, v => {
        if (f.hit.has(v.id)) return; if (Math.hypot(v.x - f.x, v.y - f.y) + v.r < Rp - 60) return;
        f.hit.add(v.id); hurt(v, f.dmg * (1 - .35 * k), f.src, { stun: f.stun, push: 520, px: f.x, py: f.y });
      }, { air: false });
      f.dT -= dt; if (f.dT > 0) return; f.dT = .05;
      // poussière et fissures sur le front de l'onde, décor ébranlé
      const rgb = H.dustRGB(f.x + R, f.y);
      for (let i = 0; i < (H.low() ? 2 : 5); i++) { const a = Math.random() * TAU; H.dust(f.x + Math.cos(a) * R, f.y + Math.sin(a) * R, Math.cos(a) * 90, Math.sin(a) * 90, rnd(16, 30), rnd(.6, 1), rgb); }
      if (H.decorOK()) for (let i = 0; i < 8; i++) { const a = Math.random() * TAU, tx = ((f.x + Math.cos(a) * R) / TILE) | 0, ty = ((f.y + Math.sin(a) * R) / TILE) | 0; if (tx >= 0 && ty >= 0 && tx < WT && ty < WT && W.obs[ty * WT + tx] && W.obs[ty * WT + tx] < 6) hitTile(tx, ty, 70); }
      if (!NETVIS && f.nS < 3 && R > (f.nS + 1) * f.Rm * .3) { f.nS++; for (let i = 0; i < 4; i++) { const a = Math.random() * TAU; scarSprite('crack', f.x + Math.cos(a) * R, f.y + Math.sin(a) * R, 60, a); } }
      addShakeNear(f.x + R, f.y, 1.2);
    },
    end(f) { f.done = true; },
    draw(c, f) {
      const k = clamp(f.age / f.st, 0, 1), R = f.Rc, A = Math.min(1, f.t / 1.1);
      c.translate(f.x, f.y); c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      for (const P of f.cr) { c.moveTo(0, 0); for (let i = 1; i < P.length; i++) { const x = P[i][0], y = P[i][1]; if (x * x + y * y > R * R) break; c.lineTo(x, y); } }
      c.strokeStyle = `rgba(24,16,10,${.65 * A})`; c.lineWidth = 14; c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,150,60,${.5 * A * (1 - k * .4)})`; c.lineWidth = 4.5; c.stroke(); c.globalCompositeOperation = 'source-over';
      if (k < 1) {
        const a = 1 - k * .55, wB = Math.max(80, R * .28), g = c.createRadialGradient(0, 0, Math.max(0, R - wB), 0, 0, R + 10);
        g.addColorStop(0, 'rgba(150,120,84,0)'); g.addColorStop(.7, `rgba(186,154,108,${.38 * a})`); g.addColorStop(.92, `rgba(214,184,136,${.55 * a})`); g.addColorStop(1, 'rgba(214,184,136,0)');
        c.fillStyle = g; circ(c, 0, 0, R + 10); c.fill();
        c.strokeStyle = `rgba(214,176,118,${.5 * a})`; c.lineWidth = 34 * (1 - k * .5); circ(c, 0, 0, R); c.stroke();
        c.strokeStyle = `rgba(255,236,200,${.75 * a})`; c.lineWidth = 7; circ(c, 0, 0, R); c.stroke();
        c.strokeStyle = `rgba(190,150,100,${.3 * a})`; c.lineWidth = 14; circ(c, 0, 0, R * .82); c.stroke();
      }
    },
  };
  W_TICK.seism = (u, m, dt, mx, my) => {
    const w = m.w;
    m.sP = Math.max(0, (m.sP || 0) - dt * 1.6);
    if (u.stunT > time) return true;
    const man = u.piloted && !(u.wm && u.wm[u.mounts.indexOf(m)] === 'a');
    let want;
    if (man) { want = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire); m.aim = turnTo(m.aim, Math.atan2(mouse.wy - my, mouse.wx - mx), dt); }
    else {
      m.sT2 = (m.sT2 || 0) - dt; if (m.sT2 <= 0) { m.sT2 = .25; m.sV = nearestFoe(u.x, u.y, w.range * .92, u.team, null, { air: false }); }
      want = !!(m.sV && !m.sV.dead && !m.sV.hidden); if (want) m.aim = turnTo(m.aim, Math.atan2(m.sV.y - my, m.sV.x - mx), dt);
    }
    if (!want || m.cd > 0) return true;
    seismStart(u, w, w.dmg * diffDmg(u.team));
    m.cd = 1 / (w.rate * (u.rateMul || 1)) * rnd(.95, 1.05); m.fc = ((m.fc || 0) + 1) & 255; m.td = 0; m.recoil = 1; m.sP = 1; u.lastFire = time;
    if (u.kind !== 'building') { u.kick = Math.min(u.r * .14, (u.kick || 0) + u.r * .05); u.kickA = u.ang; }
    SFX.play(w.snd, u.piloted ? .9 : .5, u.x, u.y, { size: 5, self: u.piloted && !u.net }); if (u.piloted && !u.net) buzz([40, 30, 80]);
    return true;
  };
  W_FIRE.seism = (u, m, w, F) => { if (!NETVIS) return false; seismStart(u, w, 0); m.sP = 1; return true; };

  // ---------- 28. Escadrille de bombardiers : trois avions survolent la cible en ligne ----------
  const PLANE = [[0, 0], [-140, -120], [140, -120]]; // [écart latéral, retard] de chaque appareil
  W_FIRE.bombers = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w), a = Math.atan2(ty - u.y, tx - u.x), D = Math.hypot(tx - u.x, ty - u.y);
    const f = addZone('xb_bombers', u.x, u.y, 520, 40, u.team, u, { ox: u.x, oy: u.y, a, D, s: 0, v: 150, age: 0, dmg: F.dmg * diffDmg(u.team), R: w.splash, nb: w.bombs, band: w.band, np: w.planes, drop: [0, 0, 0], bombs: [], P: typeof palOf === 'function' ? palOf(u) : PAL.ally, sc: 1.5 + Math.min(1, u.r / 400) * .6 });
    H.ovl(f, 700);
  };
  ZONE_K.xb_bombers = {
    tick(f, dt) {
      f.age += dt; f.v = Math.min(780, f.v + 520 * dt); f.s += f.v * dt;
      const ca = Math.cos(f.a), sa = Math.sin(f.a), sB = f.D - f.band / 2, step = f.band / (f.nb - 1), T = .45, lead = 780 * .27 * T;
      for (let i = 0; i < f.np; i++) {
        const P = PLANE[i], si = f.s + P[1];
        while (f.drop[i] < f.nb && si >= sB + f.drop[i] * step - lead) {
          f.bombs.push({ x: f.ox + ca * si - sa * P[0], y: f.oy + sa * si + ca * P[0], vx: ca * f.v * .27, vy: sa * f.v * .27, t: 0, T: T + Math.random() * .06 });
          f.drop[i]++; if (f.drop[i] === 1) SFX.play('whistle', .5, f.ox + ca * f.D, f.oy + sa * f.D, { dur: .5, pitch: 1.2 });
        }
      }
      for (let j = f.bombs.length - 1; j >= 0; j--) {
        const b = f.bombs[j]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.t >= b.T) { blast(b.x, b.y, f.R, f.dmg, f.team, f.src); f.bombs[j] = f.bombs[f.bombs.length - 1]; f.bombs.pop(); }
      }
      f.x = f.ox + ca * f.s; f.y = f.oy + sa * f.s;
      if ((f.s > f.D + f.band / 2 + 1500 && !f.bombs.length) || f.x < -800 || f.y < -800 || f.x > WPX + 800 || f.y > WPX + 800) f.t = 0;
      if (f.tick <= 0 && H.vfx()) { f.tick = .25; SFX.play('drone', .35, f.x, f.y, { size: 4 }); }
    },
    end(f) { f.done = true; },
    // ombres au sol (sous les unités)
    draw(c, f) {
      const ca = Math.cos(f.a), sa = Math.sin(f.a);
      for (let i = 0; i < f.np; i++) {
        const P = PLANE[i], si = f.s + P[1], alt = planeAlt(f, si); if (alt <= 0) continue;
        const x = f.ox + ca * si - sa * P[0] + alt * 55 * .6, y = f.oy + sa * si + ca * P[0] + alt * 55;
        c.save(); c.translate(x, y); c.rotate(f.a); c.scale(f.sc * (.7 + .3 * alt), f.sc * (.7 + .3 * alt)); c.globalAlpha = .3 * Math.min(1, alt * 1.5) * planeFade(f, si);
        c.fillStyle = '#000'; c.beginPath(); planePath(c); c.fill(); c.restore();
      }
      c.fillStyle = 'rgba(0,0,0,.3)';
      for (const b of f.bombs) { const k = b.t / b.T; c.beginPath(); c.ellipse(b.x + (1 - k) * 33, b.y + (1 - k) * 55, 6 + 4 * k, 4 + 3 * k, 0, 0, TAU); c.fill(); }
    },
    over(c, f) {
      const ca = Math.cos(f.a), sa = Math.sin(f.a), sB = f.D - f.band / 2 - 200, sE = f.D + f.band / 2;
      // bombes qui tombent
      for (const b of f.bombs) { const k = b.t / b.T, s = 1.6 * (1 - k * .45); c.save(); c.translate(b.x, b.y); c.rotate(f.a + k * .6); c.scale(s, s); c.fillStyle = '#2a2a26'; rr(c, -5, -2.2, 10, 4.4, 2.2); c.fill(); c.fillStyle = '#ffcf7a'; c.fillRect(-5.5, -2.6, 1.6, 5.2); c.restore(); }
      for (let i = 0; i < f.np; i++) {
        const P = PLANE[i], si = f.s + P[1], alt = planeAlt(f, si); if (alt <= 0) continue;
        const x = f.ox + ca * si - sa * P[0], y = f.oy + sa * si + ca * P[0];
        drawBomber(c, x, y, f.a, f.sc * (.7 + .3 * alt), f.P, planeFade(f, si), si > sB && si < sE + 100, i);
      }
    },
  };
  // décollage (altitude 0 → 1), puis montée et fondu après le passage
  const planeAlt = (f, si) => si < 0 ? 0 : Math.min(1, .25 + si / 500) + Math.max(0, si - (f.D + f.band / 2 + 300)) / 1400;
  const planeFade = (f, si) => clamp(1 - (si - (f.D + f.band / 2 + 600)) / 900, 0, 1);
  function planePath(c) { c.moveTo(32, 0); c.lineTo(8, -7); c.lineTo(-8, -38); c.lineTo(-19, -36); c.lineTo(-13, -9); c.lineTo(-26, -6); c.lineTo(-22, 0); c.lineTo(-26, 6); c.lineTo(-13, 9); c.lineTo(-19, 36); c.lineTo(-8, 38); c.lineTo(8, 7); c.closePath(); }
  function drawBomber(c, x, y, a, s, P, A, bay, i) {
    if (A <= 0) return;
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); c.globalAlpha = A;
    c.lineJoin = 'round';
    // réacteurs : traînées de chaleur
    c.globalCompositeOperation = 'lighter';
    const fl = H.radial('bmbF', [[0, 'rgba(255,240,200,1)'], [.35, 'rgba(255,160,60,.7)'], [1, 'rgba(255,100,30,0)']]);
    for (const ey of [-21, -11, 11, 21]) { const k = 7 + Math.sin(time * 40 + ey) * 1.5; c.drawImage(fl, -27 - k, ey - k * .55, k * 2, k * 1.1); }
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = P.body; c.beginPath(); planePath(c); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(24, 0); c.lineTo(5, -5); c.lineTo(-10, -24); c.lineTo(-12, -6); c.lineTo(-18, 0); c.lineTo(-12, 6); c.lineTo(-10, 24); c.lineTo(5, 5); c.closePath(); c.fill();
    c.fillStyle = P.dark; for (const ey of [-21, -11, 11, 21]) rr(c, -24, ey - 2.4, 12, 4.8, 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(18, 0); c.lineTo(-20, 0); c.stroke();
    if (bay) { c.fillStyle = '#0e1112'; c.fillRect(-9, -4, 14, 8); c.strokeStyle = '#ffcf7a'; c.lineWidth = .8; c.strokeRect(-9, -4, 14, 8); }
    c.fillStyle = P.acc; c.beginPath(); c.ellipse(17, 0, 6, 2.6, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(18.5, -.8, 2.6, 1, 0, 0, TAU); c.fill();
    const bl = Math.sin(time * 7 + i) > .3;
    c.fillStyle = bl ? '#ff4a3a' : '#5a1a14'; circ(c, -12, -37, 1.8); c.fill();
    c.fillStyle = bl ? '#5aff8a' : '#14502a'; circ(c, -12, 37, 1.8); c.fill();
    c.restore();
  }

  // ---------- 29. Mur de plasma : un rideau perpendiculaire au tir, qui brûle et arrête les projectiles ----------
  W_FIRE.wall = (u, m, w, F) => {
    const [tx, ty, a] = H.aimAt(F, w), wa = a + Math.PI / 2, hl = w.len / 2, cw = Math.cos(wa), sw = Math.sin(wa);
    const f = addZone('xb_pwall', tx, ty, hl + 80, w.wt, u.team, u, { hl, ax: tx - cw * hl, ay: ty - sw * hl, bx: tx + cw * hl, by: ty + sw * hl, dps: F.dmg * diffDmg(u.team), age: 0, nB: 0, seed: Math.random() * 9 });
    H.ovl(f, hl + 140);
    beams.push({ x1: F.sx, y1: F.sy, x2: tx, y2: ty, life: .3, max: .3, col: '#e070ff', w: 2.5 * F.sc });
    H.flash(F.sx, F.sy, F.a, '#f0a0ff', F.sc * 1.3);
    if (H.pOK(700)) for (let k = 0; k < 16; k++) { const q = Math.random(), x = lerp(f.ax, f.bx, q), y = lerp(f.ay, f.by, q); parts.push({ type: 'spark', x, y, vx: rnd(-60, 60), vy: rnd(-160, -40), life: .5, max: .5, size: 2.5, col: '#ff90f0' }); }
  };
  function crossesWall(f, x0, y0, x1, y1) {
    const ex = f.bx - f.ax, ey = f.by - f.ay, s0 = ex * (y0 - f.ay) - ey * (x0 - f.ax), s1 = ex * (y1 - f.ay) - ey * (x1 - f.ax);
    if (s0 * s1 > 0) return H.segD(x1, y1, f.ax, f.ay, f.bx, f.by) < 10;
    const dx = x1 - x0, dy = y1 - y0, den = ex * dy - ey * dx; if (Math.abs(den) < 1e-6) return H.segD(x1, y1, f.ax, f.ay, f.bx, f.by) < 10;
    const t = ((x0 - f.ax) * dy - (y0 - f.ay) * dx) / den; return t >= -.02 && t <= 1.02;
  }
  ZONE_K.xb_pwall = {
    tick(f, dt) {
      f.age += dt; if (f.age < .25) return;
      // les projectiles adverses qui franchissent le rideau s'y consument
      const E = f.hl + 70, fx = H.vfx();
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; if (b.team === f.team || b.team === undefined || !!b.vis !== !!f.vis || !H.solid(b)) continue;
        if (Math.abs(b.x - f.x) > E || Math.abs(b.y - f.y) > E) continue;
        let x0, y0;
        if (b.kind === 'mortar') { const k = Math.max(0, (b.t - dt) / b.T); x0 = lerp(b.x0, b.tx, k); y0 = lerp(b.y0, b.ty, k); }
        else if (b.px !== undefined) { x0 = b.px; y0 = b.py; } else { x0 = b.x - (b.vx || 0) * dt; y0 = b.y - (b.vy || 0) * dt; }
        if (!crossesWall(f, x0, y0, b.x, b.y)) continue;
        bullets[i] = bullets[bullets.length - 1]; bullets.pop(); f.nB++;
        if (fx && parts.length < 860) { const hy = b.kind === 'mortar' ? b.h || 0 : 0; parts.push({ type: 'flash', x: b.x, y: b.y - hy, vx: 0, vy: 0, life: .12, max: .12, size: 22, col: '#ffb0ff', a: 0 }); sparks(b.x, b.y - hy, 4, '#ff90f0'); }
      }
      if (f.tick > 0) return; f.tick = .2;
      foesIn(f.x, f.y, f.hl + 30, f.team, v => {
        if (H.segD(v.x, v.y, f.ax, f.ay, f.bx, f.by) > v.r + 28) return;
        if (!NETVIS) hurt(v, f.dps * .2, f.src);
        if (fx && parts.length < 800) parts.push({ type: 'spark', x: v.x + rnd(-v.r, v.r) * .6, y: v.y + rnd(-v.r, v.r) * .6, vx: rnd(-80, 80), vy: rnd(-120, -20), life: .4, max: .4, size: 2.5, col: '#ff90f0' });
      });
      if (H.decorOK() && Math.random() < .5) { const q = Math.random(), tx = (lerp(f.ax, f.bx, q) / TILE) | 0, ty = (lerp(f.ay, f.by, q) / TILE) | 0; if (tx >= 0 && ty >= 0 && tx < WT && ty < WT && W.obs[ty * WT + tx] === 1) hitTile(tx, ty, 40); }
      SFX.play('plasma', .18, f.x, f.y);
    },
    end(f) { f.done = true; },
    draw(c, f) {
      const A = Math.min(1, f.age / .25) * Math.min(1, f.t / .5);
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.globalAlpha = .22 * A; c.strokeStyle = '#b040ff'; c.lineWidth = 70; c.beginPath(); c.moveTo(f.ax, f.ay); c.lineTo(f.bx, f.by); c.stroke();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    // le rideau ondule et s'élève au-dessus des unités ; deux émetteurs aux extrémités
    over(c, f) {
      const A = Math.min(1, f.age / .25) * Math.min(1, f.t / .5), N = 28, ex = f.bx - f.ax, ey = f.by - f.ay, L = f.hl * 2, nx = -ey / L, ny = ex / L, Hh = 120 * Math.min(1, f.age / .4), t = time;
      const Bp = [], Tp = [];
      for (let i = 0; i <= N; i++) {
        const k = i / N, w1 = Math.sin(k * 9 + t * 5 + f.seed) * 7 + Math.sin(k * 23 - t * 8) * 3, x = f.ax + ex * k + nx * w1, y = f.ay + ey * k + ny * w1, e = Math.min(1, Math.min(k, 1 - k) * 8);
        Bp.push([x, y]); Tp.push([x + Math.sin(k * 7 - t * 3) * 7, y - Hh * e * (.75 + .25 * Math.sin(k * 13 + t * 6 + f.seed))]);
      }
      c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
      const yb = Math.max(f.ay, f.by) + 10, g = c.createLinearGradient(0, yb, 0, Math.min(f.ay, f.by) - Hh);
      g.addColorStop(0, `rgba(210,90,255,${.5 * A})`); g.addColorStop(1, 'rgba(210,90,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(Bp[0][0], Bp[0][1]); for (const p of Bp) c.lineTo(p[0], p[1]); for (let i = N; i >= 0; i--) c.lineTo(Tp[i][0], Tp[i][1]); c.closePath(); c.fill();
      c.strokeStyle = `rgba(255,170,250,${.3 * A})`; c.lineWidth = 2.5; c.beginPath();
      for (let i = 1; i < N; i++) { if ((i + ((t * 8) | 0)) % 3) continue; c.moveTo(Bp[i][0], Bp[i][1]); c.lineTo(Tp[i][0], Tp[i][1]); }
      c.stroke();
      c.beginPath(); H.smooth(c, Bp);
      c.globalAlpha = .35 * A; c.strokeStyle = '#c050ff'; c.lineWidth = 26; c.stroke();
      c.globalAlpha = .75 * A; c.strokeStyle = '#ff70e8'; c.lineWidth = 9; c.stroke();
      c.globalAlpha = A; c.strokeStyle = '#ffeaff'; c.lineWidth = 3; c.stroke();
      c.beginPath(); H.smooth(c, Tp); c.globalAlpha = .5 * A; c.strokeStyle = '#ff9af0'; c.lineWidth = 4; c.stroke();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      for (const [x, y] of [[f.ax, f.ay], [f.bx, f.by]]) {
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + 6, y + 8, 16, 10, 0, 0, TAU); c.fill();
        c.fillStyle = '#2a2234'; ngon(c, 6, 14, 0, x, y); c.fill(); c.strokeStyle = '#120c18'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#3a3048'; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 3, y - 54); c.lineTo(x + 3, y - 54); c.lineTo(x + 6, y); c.closePath(); c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = A; c.drawImage(H.radial('pwO', [[0, 'rgba(255,240,255,1)'], [.3, 'rgba(230,110,255,.7)'], [1, 'rgba(200,80,255,0)']]), x - 22, y - 76, 44, 44); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    },
  };

  // ---------- 30. Missile à têtes multiples : monte, file, puis se sépare en huit ogives ----------
  W_FIRE.mirv = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w), tg = F.tgt && !F.tgt.dead ? F.tgt : null;
    projectile('xb_mirv', F.sx, F.sy, F.a, 120, { team: u.team, src: u, dmg: F.dmg, R: w.splash, heads: w.heads, vmax: w.spd, tx, ty, tg, alt: 0, range: w.range * 1.5, sc: Math.min(5, F.sc), col: w.col, air: true, tr: 0 });
    H.flash(F.sx, F.sy, F.a, '#ffe0a0', F.sc * 1.4);
    if (H.pOK(700)) for (let k = 0; k < 8; k++) { const a = Math.random() * TAU, s = rnd(40, 160); parts.push({ type: 'smoke', x: F.mx, y: F.my, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.8, 1.5), max: 1.5, size: 6 * Math.min(4, F.sc), col: '' }); }
    addShakeNear(F.sx, F.sy, 7);
    if (u.team === 0 && !NETVIS && (u.piloted || isMine(u))) SFX.play('lockon', .6);
  };
  function mirvSplit(b) {
    const T = []; if (b.tg && !b.tg.dead && !b.tg.hidden) T.push(b.tg);
    for (const v of H.foesSorted(b.tx, b.ty, 700, b.team, b.heads * 2)) if (T.length < b.heads && !T.includes(v)) T.push(v);
    const a0 = Math.atan2(b.vy, b.vx);
    for (let k = 0; k < b.heads; k++) {
      const t = T.length ? T[k % T.length] : null; let a = a0 + (k - (b.heads - 1) / 2) * .3, rg = 1600;
      if (!t) { const px = b.tx + Math.cos(k / b.heads * TAU) * 240, py = b.ty + Math.sin(k / b.heads * TAU) * 240; a = Math.atan2(py - b.y, px - b.x); rg = Math.hypot(px - b.x, py - b.y) + 1; }
      const r = shoot(b.x, b.y, a, 260, b.dmg, b.team, rg, 'rocket', b.col, 0, b.src, b.R, 1.6);
      r.homing = t; r.maxSpd = 820; r.wob = k * 1.3; r.air = true; if (!t) r.blind = true;
    }
    if (H.vfx()) { parts.push({ type: 'flash', x: b.x, y: b.y, vx: 0, vy: 0, life: .15, max: .15, size: 60, col: '#ffe8b0', a: 0 }); H.ring(b.x, b.y, 70, '#ffcf8a', .35, true); H.sparks(b.x, b.y, 10, '#ffd27a'); }
    SFX.play('swarm', .9, b.x, b.y, { size: 4 });
  }
  B_KIND.xb_mirv = {
    high: true,
    update(b, dt) {
      b.life += dt; b.px = b.x; b.py = b.y;
      if (b.tg && (b.tg.dead || b.tg.hidden)) b.tg = null;
      if (b.tg) { b.tx = b.tg.x; b.ty = b.tg.y; }
      const sp = Math.min(b.vmax, Math.hypot(b.vx, b.vy) + 300 * dt); let a = Math.atan2(b.vy, b.vx);
      if (b.life > .45) a = turnTo(a, Math.atan2(b.ty - b.y, b.tx - b.x), 1.3 * dt);
      b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.x += b.vx * dt; b.y += b.vy * dt; b.dist += sp * dt; b.alt = Math.min(1, b.alt + dt * 1.2);
      b.tr += sp * dt;
      if (H.vfx()) while (b.tr > 16 && parts.length < 840) { b.tr -= 16; const k = b.tr / sp; parts.push({ type: 'dust', x: b.x - b.vx * k + rnd(-3, 3), y: b.y - b.vy * k - b.alt * 40 + rnd(-3, 3), vx: rnd(-8, 8), vy: rnd(-8, 8), life: 1.6, max: 1.6, size: 12, rgb: '232,226,214' }); }
      else b.tr = 0;
      const d = Math.hypot(b.tx - b.x, b.ty - b.y);
      if ((b.life > .6 && d <= 520) || b.dist > b.range || b.x < 0 || b.y < 0 || b.x >= WPX || b.y >= WPX) { mirvSplit(b); return true; }
      return false;
    },
    draw(c, b) {
      const A = 40 * b.alt, s = 1.5 + b.sc * .3;
      if (b.team === 0 && !b.vis) { c.save(); c.translate(b.tx, b.ty); c.rotate(time * 1.5); c.strokeStyle = 'rgba(255,154,64,.55)'; c.lineWidth = 4; c.setLineDash([24, 18]); circ(c, 0, 0, 240); c.stroke(); c.setLineDash([]); c.restore(); }
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(b.x + A * .6, b.y + A, 14 * s, 5 * s, Math.atan2(b.vy, b.vx), 0, TAU); c.fill();
      c.translate(b.x, b.y - A); c.rotate(Math.atan2(b.vy, b.vx)); c.scale(s, s);
      c.globalCompositeOperation = 'lighter'; const fk = 9 + Math.random() * 4;
      c.drawImage(H.radial('mvF', [[0, 'rgba(255,245,210,1)'], [.35, 'rgba(255,170,70,.8)'], [1, 'rgba(255,110,30,0)']]), -20 - fk, -fk * .6, fk * 2, fk * 1.2);
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#3a3630'; for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(-10, sy * 3); c.lineTo(-17, sy * 8); c.lineTo(-18, sy * 3); c.closePath(); c.fill(); }
      c.fillStyle = '#e2ddd0'; rr(c, -17, -3.6, 30, 7.2, 3.4); c.fill(); c.strokeStyle = '#4a463e'; c.lineWidth = .8; c.stroke();
      c.fillStyle = '#ff9a40'; c.fillRect(-6, -3.6, 2.4, 7.2);
      c.fillStyle = '#c8c2b4'; c.beginPath(); c.moveTo(20, 0); c.lineTo(12, -4.2); c.lineTo(9, -4.2); c.lineTo(9, 4.2); c.lineTo(12, 4.2); c.closePath(); c.fill();
      c.fillStyle = '#2a2622'; for (let k = 0; k < 4; k++) { const x = 1 + k * 2.4; c.beginPath(); c.moveTo(x + 2, -3.6); c.lineTo(x, -5.2); c.lineTo(x - .6, -3.6); c.fill(); c.beginPath(); c.moveTo(x + 2, 3.6); c.lineTo(x, 5.2); c.lineTo(x - .6, 3.6); c.fill(); }
    },
  };

  // ---------- 31. Distordeur temporel : le temps ralentit pour l'ennemi, accélère pour vos robots ----------
  W_FIRE.chrono = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w);
    const f = addZone('xb_chrono', tx, ty, w.cr, w.ct, u.team, u, { dps: F.dmg * diffDmg(u.team), haste: w.haste, slowF: w.slowF, age: 0, boost: new Set(), nS: 0 });
    H.ovl(f, w.cr);
    beams.push({ x1: F.sx, y1: F.sy, x2: tx, y2: ty, life: .35, max: .35, col: w.col, w: 2.5 * F.sc });
    H.ring(tx, ty, w.cr, '#fff2c8', .5); H.ring(tx, ty, w.cr * .6, '#f2d48a', .7, true);
  };
  const chronoRelease = v => { v.rateMul = (v.rateBase || 1) * (v.overT > 0 ? 1.8 : 1); };
  ZONE_K.xb_chrono = {
    tick(f, dt) {
      f.age += dt; const R = f.r * Math.min(1, f.age / .35), sf = f.slowF;
      // projectiles adverses qui entrent dans la bulle : 2,5 fois plus lents, une seule fois chacun
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i]; if (b.chrono || b.team === f.team || b.team === undefined || !!b.vis !== !!f.vis || !H.solid(b)) continue;
        const dx = b.x - f.x, dy = b.y - f.y; if (dx * dx + dy * dy > R * R) continue;
        b.chrono = 1; f.nS++;
        if (b.kind === 'mortar' || (b.T && b.t !== undefined && b.vx === undefined)) { b.t *= sf; b.T *= sf; }
        else { if (b.vx !== undefined) { b.vx /= sf; b.vy /= sf; } if (b.maxSpd) b.maxSpd /= sf; if (b.spd) b.spd /= sf; if (b.vmax) b.vmax /= sf; }
        if (H.pOK(820)) parts.push({ type: 'ring', x: b.x, y: b.y - (b.h || 0), vx: 0, vy: 0, life: .4, max: .4, size: 18, col: '#f2d48a', thin: true });
      }
      if (f.tick > 0) return; f.tick = .2;
      if (!NETVIS) {
        foesIn(f.x, f.y, R, f.team, v => hurt(v, f.dps * .2, f.src, { slow: .5 }));
        alliesIn(f.x, f.y, R, f.team, v => { if (v.kind !== 'robot' || v.dead) return; v.chronoT = time + .35; f.boost.add(v); v.rateMul = (v.rateBase || 1) * (v.overT > 0 ? 1.8 : 1) * (1 + f.haste); });
      }
      for (const v of f.boost) if (v.dead || !(v.chronoT > time)) { chronoRelease(v); f.boost.delete(v); }
    },
    end(f) { f.done = true; for (const v of f.boost) { v.chronoT = 0; chronoRelease(v); } f.boost.clear(); },
    // cadran au sol : graduations, aiguilles fantômes, ondes qui se resserrent
    draw(c, f) {
      const R = f.r * Math.min(1, f.age / .35), A = Math.min(1, f.t / .6), t = f.age;
      c.globalAlpha = .6 * A;
      c.drawImage(H.radial('chrD', [[0, 'rgba(255,236,170,.05)'], [.55, 'rgba(255,226,150,.1)'], [.9, 'rgba(255,220,140,.3)'], [1, 'rgba(255,220,140,0)']]), f.x - R, f.y - R, R * 2, R * 2);
      c.translate(f.x, f.y); c.lineCap = 'round';
      c.strokeStyle = '#f2d48a'; c.globalAlpha = .75 * A; c.lineWidth = 6; circ(c, 0, 0, R * .96); c.stroke();
      c.lineWidth = 2.5; circ(c, 0, 0, R * .9); c.stroke();
      c.beginPath(); for (let i = 0; i < 60; i++) { const a = i / 60 * TAU + t * .05, l = i % 5 ? .035 : .085, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(ca * R * .9, sa * R * .9); c.lineTo(ca * R * (.9 - l), sa * R * (.9 - l)); } c.lineWidth = 3; c.stroke();
      c.globalAlpha = .45 * A; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU - t * .6, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(ca * R * .54, sa * R * .54); c.lineTo(ca * R * .6, sa * R * .6); } c.stroke(); circ(c, 0, 0, R * .57); c.stroke();
      const hand = (a, l, wd, al) => { c.globalAlpha = al * A; c.lineWidth = wd; c.beginPath(); c.moveTo(-Math.cos(a) * l * .12, -Math.sin(a) * l * .12); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke(); };
      c.strokeStyle = '#fff0c8'; hand(-t * .45 - 1, R * .45, 10, .35); hand(t * 2.1, R * .72, 6, .4); c.strokeStyle = '#ffffff'; hand(-t * 7, R * .82, 2.5, .5);
      c.fillStyle = '#fff6dc'; c.globalAlpha = .6 * A; circ(c, 0, 0, 10); c.fill();
      c.strokeStyle = '#fff2c8'; for (let i = 0; i < 3; i++) { const q = 1 - ((t * .45 + i / 3) % 1); c.globalAlpha = .35 * A * (1 - q) * q * 4; c.lineWidth = 3; circ(c, 0, 0, R * q); c.stroke(); }
      c.globalAlpha = 1;
    },
    // robots alliés accélérés : un arc doré qui tourne vite autour d'eux
    over(c, f) {
      const A = Math.min(1, f.t / .6); c.strokeStyle = '#f2d48a'; c.lineCap = 'round';
      for (const v of f.boost) { if (v.dead || v.hidden) continue; const R = v.r + 12, a = time * 6; c.globalAlpha = .7 * A; c.lineWidth = Math.max(3, v.r * .05); c.beginPath(); c.arc(v.x, v.y, R, a, a + 1.6); c.stroke(); c.beginPath(); c.arc(v.x, v.y, R, a + Math.PI, a + Math.PI + 1.6); c.stroke(); }
      c.globalAlpha = 1;
    },
  };

  // ---------- 32. Torpille fouisseuse : file sous terre et jaillit sous la cible ----------
  W_FIRE.burrow = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w), tg = F.tgt && !F.tgt.dead && !F.tgt.fly ? F.tgt : null;
    projectile('xb_burrow', F.sx, F.sy, F.a, 140, { team: u.team, src: u, dmg: F.dmg * diffDmg(u.team), R: w.splash, stun: w.stun, vmax: w.spd, tx, ty, tg, range: w.range * 1.4, under: true, air: true, tr: [[F.sx, F.sy]], trD: 0, scD: 0, pd0: 1e9, sc: F.sc, col: w.col });
    if (H.vfx()) { FX.dust(F.sx, F.sy, H.low() ? 3 : 7, 22, 140); for (let k = 0; k < 8; k++) { const a = Math.random() * TAU, s = rnd(60, 200); parts.push({ type: 'debris', x: F.sx, y: F.sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.4, .8), max: .8, size: rnd(3, 6), col: '#5a4430', rot: rnd(0, 6) }); } }
    if (!NETVIS) scarSprite('crater', F.sx, F.sy, 30, rnd(0, TAU));
    addShakeNear(F.sx, F.sy, 5);
  };
  function burrowErupt(b) {
    const x = clamp(b.x, 60, WPX - 60), y = clamp(b.y, 60, WPX - 60), R = b.R;
    blast(x, y, R, b.dmg, b.team, b.src, { stun: b.stun });
    if (!NETVIS) scarSprite('crack', x, y, R * 1.2, rnd(0, TAU));
    if (H.vfx()) {
      const n = H.low() ? 10 : 24;
      for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = rnd(150, 620); parts.push({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: rnd(.7, 1.4), max: 1.4, size: rnd(4, 10), rot: rnd(0, 6), col: SHARD2[i % 4] }); }
      parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .7, max: .7, size: R * 1.3, col: '#c49a5a' });
      for (let i = 0; i < 3; i++) parts.push({ type: 'smoke', x: x + rnd(-40, 40), y: y + rnd(-40, 40), vx: rnd(-20, 20), vy: -rnd(20, 50), life: 2.6, max: 2.6, size: R * .5, col: '' });
      FX.dust(x, y, H.low() ? 5 : 12, R * .3, R * 1.4);
    }
    addShakeNear(x, y, 18); SFX.play('crush', .9, x, y);
  }
  const SHARD2 = ['#5a4430', '#7a5e40', '#3a2c20', '#8e7a60'];
  B_KIND.xb_burrow = {
    pd: false,
    update(b, dt) {
      b.life += dt;
      if (b.tg && (b.tg.dead || b.tg.hidden || b.tg.fly)) b.tg = null;
      if (b.tg) { b.tx = b.tg.x; b.ty = b.tg.y; }
      const sp = Math.min(b.vmax, Math.hypot(b.vx, b.vy) + 500 * dt); let a = Math.atan2(b.vy, b.vx);
      a = turnTo(a, Math.atan2(b.ty - b.y, b.tx - b.x), 1.8 * dt);
      b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.px = b.x; b.py = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.dist += sp * dt;
      b.trD += sp * dt; if (b.trD > 34) { b.trD = 0; b.tr.push([b.x, b.y]); if (b.tr.length > 32) b.tr.shift(); }
      b.scD += sp * dt; if (b.scD > 95) { b.scD = 0; if (!NETVIS) scarSprite('crack', b.x, b.y, 30, a); if (Math.random() < .3) SFX.play('crush', .25, b.x, b.y); }
      if (H.pOK(780)) {
        if (Math.random() < .55) { const s = rnd(40, 140), aa = a + Math.PI + rnd(-1.2, 1.2); parts.push({ type: 'debris', x: b.x, y: b.y, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: rnd(.3, .6), max: .6, size: rnd(2.5, 5), col: SHARD2[(Math.random() * 4) | 0], rot: rnd(0, 6) }); }
        if (Math.random() < .25) H.dust(b.x, b.y, rnd(-20, 20), rnd(-20, 20), rnd(12, 20), rnd(.6, 1));
      }
      const d = Math.hypot(b.tx - b.x, b.ty - b.y), close = d < 130 && d > b.pd0 + 1; b.pd0 = d;
      if (d < 26 || close || b.dist > b.range || b.x < 40 || b.y < 40 || b.x >= WPX - 40 || b.y >= WPX - 40) { burrowErupt(b); return true; }
      return false;
    },
    // le sillon de terre retournée, la bosse qui avance, la mire au-dessus de la cible
    draw(c, b) {
      const P = b.tr.concat([[b.x, b.y]]); c.lineCap = 'round'; c.lineJoin = 'round';
      if (P.length > 1) {
        c.beginPath(); H.smooth(c, P); c.strokeStyle = 'rgba(38,28,18,.45)'; c.lineWidth = 36; c.stroke(); c.strokeStyle = 'rgba(120,94,62,.55)'; c.lineWidth = 16; c.stroke(); c.strokeStyle = 'rgba(170,138,96,.55)'; c.lineWidth = 6; c.setLineDash([9, 12]); c.stroke(); c.setLineDash([]);
        c.fillStyle = 'rgba(92,70,46,.8)';
        for (let i = 1; i < P.length; i++) { const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], l = Math.hypot(dx, dy) || 1, s = i & 1 ? 1 : -1, o = 19 + (i * 7 % 5); c.fillRect(P[i][0] - dy / l * o * s - 3, P[i][1] + dx / l * o * s - 2.5, 6, 5); }
      }
      if (b.team === 0 && !b.vis) { c.save(); c.translate(b.tx, b.ty); c.rotate(-time); c.strokeStyle = 'rgba(196,154,90,.6)'; c.lineWidth = 4; c.setLineDash([20, 16]); circ(c, 0, 0, b.R * .8); c.stroke(); c.setLineDash([]); c.restore(); }
      c.translate(b.x, b.y); c.rotate(Math.atan2(b.vy, b.vx)); c.scale(1.45, 1.45);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(4, 7, 34, 18, 0, 0, TAU); c.fill();
      c.fillStyle = '#5e4630'; c.beginPath(); c.ellipse(0, 0, 32, 17, 0, 0, TAU); c.fill();
      c.fillStyle = '#86684a'; c.beginPath(); c.ellipse(5, -3, 20, 10, 0, 0, TAU); c.fill();
      c.strokeStyle = '#2e2216'; c.lineWidth = 2; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(18, k * 4); c.lineTo(32, k * 7); } c.stroke();
      c.save(); c.translate(28, 0); c.rotate(b.life * 24); c.strokeStyle = '#c8c0b0'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 6, 0, 2.2); c.stroke(); c.restore();
    },
  };

  // ---------- 33. Cage de foudre : six pylônes en cercle, reliés par des arcs ----------
  const PH = 82; // hauteur apparente des pylônes
  W_FIRE.cage = (u, m, w, F) => {
    const [tx, ty] = H.aimAt(F, w);
    const f = addZone('xb_cage', tx, ty, w.cr + 140, w.ct + .7, u.team, u, { R: w.cr, ox: F.sx, oy: F.sy, rot: Math.random() * TAU, age: 0, dmg: F.dmg * diffDmg(u.team), idps: F.dmg * w.idps * diffDmg(u.team), zap: new Map(), arcs: null, aT: 0, P: [], planted: 0 });
    for (let k = 0; k < 6; k++) { const a = f.rot + k / 6 * TAU; f.P.push([tx + Math.cos(a) * w.cr, ty + Math.sin(a) * w.cr]); }
    H.ovl(f, w.cr + 260);
    H.flash(F.sx, F.sy, F.a, '#d8f2ff', F.sc * 1.3);
  };
  ZONE_K.xb_cage = {
    tick(f, dt) {
      f.age += dt; if (f.age < .7) return;
      if (!f.planted) {
        f.planted = 1;
        for (const [x, y] of f.P) { if (H.vfx()) { H.sparks(x, y, 8, '#c8eeff'); H.ring(x, y, 50, '#a8e4ff', .4, true); FX.dust(x, y, 3, 14, 90); } if (!NETVIS) scarSprite('scorch', x, y, 34, rnd(0, TAU)); }
        SFX.play('storm', 1, f.x, f.y, { size: 4 }); addShakeNear(f.x, f.y, 6);
      }
      f.aT -= dt;
      if (f.aT <= 0 && H.vfx()) { f.aT = .07; f.arcs = []; for (let k = 0; k < 6; k++) { const a = f.P[k], b = f.P[(k + 1) % 6]; f.arcs.push(zig(a[0], a[1] - PH * .86, b[0], b[1] - PH * .86, 10, 16)); } }
      if (f.tick > 0) return; f.tick = .1;
      if (Math.random() < .3) SFX.play('tesla', .3, f.x, f.y);
      if (NETVIS) return;
      const R = f.R, Ri = R * .866;
      foesIn(f.x, f.y, R + 60, f.team, v => {
        const dx = v.x - f.x, dy = v.y - f.y, d = Math.hypot(dx, dy) || 1;
        for (let k = 0; k < 6; k++) {
          const a = f.P[k], b = f.P[(k + 1) % 6]; if (H.segD(v.x, v.y, a[0], a[1], b[0], b[1]) > v.r + 14) continue;
          if ((f.zap.get(v.id) || 0) <= time) { f.zap.set(v.id, time + .5); hurt(v, f.dmg, f.src); beams.push({ pts: zig(a[0], a[1] - PH * .86, v.x, v.y, 7, 14), life: .22, max: .22, col: '#c8eeff', w: 4 }); H.sparks(v.x, v.y, 8, '#c8eeff'); SFX.play('tesla', .6, v.x, v.y); }
          break;
        }
        if (d < Ri) {
          hurt(v, f.idps * .1, f.src);
          if (d > Ri * .7 && H.movable(v)) {
            const q = (d - Ri * .7) / (Ri * .3) * H.massK(v); v.vx -= dx / d * 340 * q; v.vy -= dy / d * 340 * q;
            const lim = Ri - Math.min(v.r, 40) - 8; if (d > lim && !v.giant && !v.boss && lim > 20) { v.x = f.x + dx / d * lim; v.y = f.y + dy / d * lim; }
          }
        }
      });
    },
    end(f) { f.done = true; },
    draw(c, f) {
      if (f.age < .7) return; const A = Math.min(1, f.t / .5), P = f.P;
      c.globalAlpha = .16 * A; c.fillStyle = '#7fc8ff'; c.beginPath(); for (let k = 0; k < 6; k++) c[k ? 'lineTo' : 'moveTo'](P[k][0], P[k][1]); c.closePath(); c.fill();
      c.globalAlpha = .55 * A; c.strokeStyle = '#a8e4ff'; c.lineWidth = 3; c.setLineDash([14, 10]); c.lineDashOffset = -time * 60; c.stroke(); c.setLineDash([]);
      c.globalAlpha = 1;
    },
    over(c, f) {
      const P = f.P, A = Math.min(1, f.t / .5);
      if (f.age < .7) { // les pylônes volent depuis l'affût
        const k = f.age / .7, e = k * k * (3 - 2 * k);
        for (let i = 0; i < 6; i++) { const x = lerp(f.ox, P[i][0], e), y = lerp(f.oy, P[i][1], e) - Math.sin(k * Math.PI) * 260; c.save(); c.translate(x, y); c.rotate(f.age * 12 + i); c.fillStyle = '#3a4a52'; c.beginPath(); c.moveTo(16, 0); c.lineTo(-8, -6); c.lineTo(-8, 6); c.closePath(); c.fill(); c.fillStyle = '#c8eeff'; circ(c, -6, 0, 3); c.fill(); c.restore(); }
        return;
      }
      const glow = H.radial('cgO', [[0, 'rgba(255,255,255,1)'], [.3, 'rgba(160,220,255,.75)'], [1, 'rgba(110,180,255,0)']]);
      for (const [x, y] of P) {
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + 8, y + 10, 18, 11, 0, 0, TAU); c.fill();
        c.fillStyle = '#26323a'; ngon(c, 6, 15, 0, x, y); c.fill(); c.strokeStyle = '#10181c'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#3c4c56'; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 2.5, y - PH); c.lineTo(x + 2.5, y - PH); c.lineTo(x + 6, y); c.closePath(); c.fill();
        c.strokeStyle = '#a8e4ff'; c.lineWidth = 2; for (const h of [.35, .6]) { c.beginPath(); c.ellipse(x, y - PH * h, 8 - h * 4, 3, 0, 0, TAU); c.stroke(); }
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = A * (.8 + .2 * Math.sin(time * 20 + x)); c.drawImage(glow, x - 20, y - PH * .86 - 20, 40, 40); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      if (f.arcs) {
        c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
        c.beginPath(); for (const pts of f.arcs) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
        c.globalAlpha = .35 * A; c.strokeStyle = '#5fb0ff'; c.lineWidth = 11; c.stroke();
        c.globalAlpha = .85 * A; c.strokeStyle = '#c8eeff'; c.lineWidth = 3.5; c.stroke();
        c.globalAlpha = A; c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    },
  };
})();

// ================= DESSINS DES AFFÛTS =================
// Repère déjà mis à l'échelle, pivot sur le socle, canon vers +x. Titanesques ≈ 10 × 32, colossales ≈ 14 × 45.
(() => {
  const H = AB31, D = '#181c1e';
  const ready = m => !m || m.cd <= 0;
  const reload = m => !m || !m.w || !m.w.rate ? 1 : clamp(1 - m.cd * m.w.rate, 0, 1); // 0 juste après le tir, 1 prêt
  const glow = (c, key, rgb, x, y, r, a) => { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(H.radial(key, [[0, 'rgba(255,255,255,1)'], [.3, `rgba(${rgb},.75)`], [1, `rgba(${rgb},0)`]]), x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; };
  const bolt = (c, P, x, y, s) => { c.fillStyle = P.plate; circ(c, x, y, s); c.fill(); };

  // 19. tornade : turbine carénée, rotor visible, tuyère évasée
  W_PAINT.tornado = (c, P, rec, t, m) => {
    c.fillStyle = P.body; c.beginPath(); c.moveTo(5, -7); c.lineTo(25, -10.5); c.lineTo(25, 10.5); c.lineTo(5, 7); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = 1.1; c.beginPath(); for (const x of [10, 15, 20]) { const h = 7 + (x - 5) * .175; c.moveTo(x, -h); c.lineTo(x, h); } c.stroke();
    c.fillStyle = D; c.beginPath(); c.ellipse(25, 0, 2.6, 9.4, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(235,226,205,.55)'; c.lineWidth = .9; for (let k = 0; k < 3; k++) { const a = t * 9 + k * 2.1; c.beginPath(); c.ellipse(25, 0, 1.6, 7, 0, a, a + 2); c.stroke(); }
    c.fillStyle = P.body2; circ(c, -2, 0, 11); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = D; circ(c, -2, 0, 8.4); c.fill();
    c.save(); c.translate(-2, 0); c.rotate(t * 14); c.fillStyle = P.plate;
    for (let k = 0; k < 7; k++) { c.rotate(TAU / 7); c.beginPath(); c.moveTo(1.6, -.8); c.quadraticCurveTo(5, -3.2, 7.8, -1.2); c.lineTo(7.8, .6); c.quadraticCurveTo(4.6, -.6, 1.6, .9); c.closePath(); c.fill(); }
    c.restore();
    c.fillStyle = P.body; circ(c, -2, 0, 2.6); c.fill(); c.fillStyle = P.acc; circ(c, -2, 0, 1.1); c.fill();
    c.fillStyle = D; c.fillRect(-14.5, -6, 2.4, 4.4); c.fillRect(-14.5, 1.6, 2.4, 4.4);
    if (ready(m)) { c.fillStyle = '#efe6d0'; c.globalAlpha = .5 + .3 * Math.sin(t * 6); c.fillRect(22, -1, 3, 2); c.globalAlpha = 1; }
  };

  // 20. nanites : trois cuves de nuée, buse à grille
  W_PAINT.nanites = (c, P, rec, t, m) => {
    c.fillStyle = P.body2; rr(c, -12, -11, 21, 22, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.3; c.stroke();
    const q = reload(m);
    for (let i = 0; i < 3; i++) {
      const y = -6.4 + i * 6.4; c.fillStyle = '#1e2a24'; rr(c, -10, y - 2.6, 16, 5.2, 2.6); c.fill(); c.strokeStyle = P.plate; c.lineWidth = .8; c.stroke();
      c.fillStyle = '#a8c8a0'; const n = 3 + Math.round(q * 6);
      for (let j = 0; j < n; j++) { const x = -8.5 + ((j * 2.37 + t * (1.5 + i * .4)) % 13), yy = y + Math.sin(t * 5 + j * 1.9 + i) * 1.4; c.globalAlpha = .45 + .55 * Math.abs(Math.sin(t * 7 + j)); c.fillRect(x, yy - .45, .9, .9); }
      c.globalAlpha = 1;
    }
    c.fillStyle = P.body; rr(c, 7, -5.5, 8, 11, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke();
    c.fillStyle = D; rr(c, 13, -4, 12, 8, 2); c.fill();
    c.strokeStyle = P.plate; c.lineWidth = .7; c.beginPath(); for (let x = 15; x < 24; x += 2.2) { c.moveTo(x, -3.4); c.lineTo(x, 3.4); } c.stroke();
    c.strokeStyle = '#a8c8a0'; c.lineWidth = 1.2; c.globalAlpha = .5 + .5 * q; c.beginPath(); c.ellipse(25, 0, 1.2, 4, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
    for (const [x, y] of [[-10, -9], [-10, 9], [7, -9], [7, 9]]) bolt(c, P, x, y, .8);
  };

  // 21. faille : coin massif, pieu de forage, vérins latéraux, joint de magma
  W_PAINT.fault = (c, P, rec, t, m) => {
    for (const s of [-1, 1]) { c.fillStyle = P.plate; rr(c, -9, s * 11.5 - 2, 14, 4, 2); c.fill(); c.fillStyle = D; c.fillRect(4, s * 11.5 - .9, 9, 1.8); }
    c.fillStyle = P.body; c.beginPath(); c.moveTo(-12, -10); c.lineTo(7, -10.5); c.lineTo(13, -6); c.lineTo(13, 6); c.lineTo(7, 10.5); c.lineTo(-12, 10); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = P.body2; rr(c, -9, -6.5, 14, 13, 2.5); c.fill();
    c.fillStyle = '#e0b030'; for (let k = 0; k < 4; k++) c.fillRect(-11, -8 + k * 4.6, 2, 2.4);
    const p = .55 + .45 * Math.sin(t * 5), q = reload(m);
    c.fillStyle = `rgba(255,${(120 + 60 * p) | 0},40,${(.45 + .55 * q).toFixed(2)})`; c.fillRect(12, -6.5, 2.4, 13);
    c.fillStyle = '#5a5246'; c.beginPath(); c.moveTo(14, -6.2); c.lineTo(33, -.8); c.lineTo(33, .8); c.lineTo(14, 6.2); c.closePath(); c.fill(); c.strokeStyle = '#2a2622'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#7a6e5c'; c.beginPath(); c.moveTo(14, -6.2); c.lineTo(33, -.8); c.lineTo(14, 0); c.closePath(); c.fill();
    c.strokeStyle = '#2a2622'; c.lineWidth = .8; c.beginPath(); for (let k = 0; k < 4; k++) { const x = 17 + k * 4; c.moveTo(x, -5.4 + k * 1.2); c.lineTo(x + 2, 5.4 - k * 1.2); } c.stroke();
    bolt(c, P, -6, -3, 1); bolt(c, P, -6, 3, 1);
  };

  // 22. phalange : tourelle compacte à deux fins canons laser et radar tournant
  W_PAINT.phalanx = (c, P, rec, t, m) => {
    c.scale(1.3, 1.3);
    c.fillStyle = P.body2; circ(c, 0, 0, 9.5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.3; c.stroke();
    for (const s of [-1, 1]) { c.fillStyle = D; c.fillRect(2, s * 3.2 - .9, 24, 1.8); c.fillStyle = P.plate; for (let k = 0; k < 3; k++) c.fillRect(6 + k * 3.2, s * 3.2 - 1.6, 1.2, 3.2); c.fillStyle = '#ffc04a'; c.fillRect(25, s * 3.2 - .9, 2, 1.8); }
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(0, 0, 7, 6.4, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-1.5, -2, 3.5, 2.2, -.4, 0, TAU); c.fill();
    c.save(); c.translate(-6.5, 0); c.rotate(t * 5); c.fillStyle = P.dark; c.fillRect(-.7, -5.5, 1.4, 11); c.fillStyle = P.acc; c.fillRect(-.9, -5.5, 1.8, 2); c.restore();
    c.fillStyle = D; circ(c, -6.5, 0, 1.4); c.fill();
    const hot = m && time - (m.fcT2 || 0) < .15; c.fillStyle = hot ? '#ffe08a' : '#ffc04a'; circ(c, 4, 0, 1.6); c.fill();
  };

  // 23. stase : socle hexagonal, trois griffes qui tiennent un cristal givré
  W_PAINT.stasis = (c, P, rec, t, m) => {
    c.fillStyle = P.body2; ngon(c, 6, 10.5, Math.PI / 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.3; c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = 1; ngon(c, 6, 7, Math.PI / 6); c.stroke();
    c.lineCap = 'round';
    for (const s of [-1, 1]) { c.strokeStyle = P.dark; c.lineWidth = 4; c.beginPath(); c.moveTo(3, s * 8); c.quadraticCurveTo(15, s * 9, 22, s * 3.6); c.stroke(); c.strokeStyle = P.plate; c.lineWidth = 2.2; c.stroke(); }
    c.fillStyle = D; c.fillRect(4, -1.6, 16, 3.2);
    c.strokeStyle = '#7fd8ff'; c.lineWidth = 1; for (const x of [7, 10]) { c.beginPath(); c.ellipse(x, 0, 1, 3.4, 0, 0, TAU); c.stroke(); }
    const q = reload(m), p = .6 + .4 * Math.sin(t * 4);
    glow(c, 'stP', '140,220,255', 24, 0, 9 * (.5 + .5 * q), .5 * q * p + .15);
    c.save(); c.translate(24, 0); c.rotate(t * .8); c.globalAlpha = .45 + .55 * q;
    c.fillStyle = '#e8fbff'; c.beginPath(); c.moveTo(4.4, 0); c.lineTo(0, -3.2); c.lineTo(-3.4, 0); c.lineTo(0, 3.2); c.closePath(); c.fill(); c.strokeStyle = '#6fcff0'; c.lineWidth = .7; c.stroke(); c.beginPath(); c.moveTo(4.4, 0); c.lineTo(-3.4, 0); c.stroke();
    c.restore(); c.globalAlpha = 1;
  };

  // 24. lance-essaims : caisson à alvéoles hexagonales dont les opercules s'ouvrent
  const CELLS = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) CELLS.push([-6 + i * 4.2, (j - 1) * 4.6]);
  W_PAINT.hive = (c, P, rec, t, m) => {
    c.scale(1.25, 1.25);
    c.fillStyle = P.body2; rr(c, -11.5, -10.5, 23, 21, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.3; c.stroke();
    c.fillStyle = P.plate; c.fillRect(-11.5, -10.5, 23, 1.6); c.fillRect(-11.5, 8.9, 23, 1.6);
    const op = m ? m.hOpen || 0 : .6, fl = m && time - (m.hFt || -9) < .09 ? m.hFl : -1;
    for (let k = 0; k < CELLS.length; k++) {
      const [x, y] = CELLS[k]; c.fillStyle = D; ngon(c, 6, 2.15, 0, x, y); c.fill();
      if (op > .1) { c.fillStyle = k === fl ? '#fff2c8' : '#ffb020'; circ(c, x, y, .9); c.fill(); }
      c.fillStyle = P.plate; c.save(); c.translate(x - op * 1.4, y); ngon(c, 6, 1.9 * (1 - op * .55), 0); c.fill(); c.restore();
    }
    c.fillStyle = P.body; rr(c, 11, -4, 5, 8, 1.5); c.fill(); c.fillStyle = '#ffb020'; circ(c, 15, 0, 1.2); c.fill();
  };

  // 25. prisme : cristal triangulaire sur cardan, reflets irisés
  W_PAINT.prism = (c, P, rec, t, m) => {
    c.fillStyle = P.body2; circ(c, 0, 0, 10.5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.3; c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = 1.8; c.beginPath(); c.ellipse(1, 0, 9, 9 * Math.abs(Math.cos(t * .7)) + 1.5, 0, 0, TAU); c.stroke();
    c.fillStyle = D; c.fillRect(10, -2.4, 13, 4.8); c.fillStyle = P.plate; c.fillRect(12, -3.2, 1.6, 6.4); c.fillRect(17, -3.2, 1.6, 6.4);
    const on = m ? m.pOn || 0 : 0, hue = (t * 140) % 360;
    c.fillStyle = `hsla(${hue | 0},100%,72%,${(.45 + .55 * on).toFixed(2)})`; circ(c, 23.5, 0, 2.4 + on); c.fill();
    c.save(); c.translate(2, 0); c.rotate(Math.sin(t * .9) * .2);
    c.fillStyle = 'rgba(214,228,255,.85)'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-4.5, -7.4); c.lineTo(-4.5, 7.4); c.closePath(); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = .9; c.stroke();
    c.lineWidth = 1.1; for (let k = 0; k < 4; k++) { c.strokeStyle = `hsl(${(hue + k * 70) % 360 | 0},100%,62%)`; c.beginPath(); c.moveTo(-4.5, -2.4 + k * 1.6); c.lineTo(4 - k * .4, -1.2 + k * .8); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(-3.5, -5.2); c.lineTo(0, -3); c.lineTo(-3.5, -1.8); c.closePath(); c.fill();
    c.restore();
  };

  // 26. batterie de railguns : bloc lourd, cinq rails côte à côte, bobines, condensateurs
  W_PAINT.railvolley = (c, P, rec, t, m) => {
    for (const s of [-1, 1]) { c.fillStyle = P.dark; rr(c, -13, s * 10 - 3.6, 12, 7.2, 3.6); c.fill(); glow(c, 'rvC', '158,240,255', -7, s * 10, 4.5, .35 + .25 * Math.sin(t * 6 + s)); }
    c.fillStyle = P.body; rr(c, -14, -13.5, 25, 27, 5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = P.plate; rr(c, -10, -9, 15, 18, 3); c.fill();
    c.fillStyle = D; rr(c, 6, -10, 36, 20, 2); c.fill();
    const q = reload(m), p = .4 + .6 * q;
    for (let k = -2; k <= 2; k++) { const y = k * 3.4; c.fillStyle = `rgba(158,240,255,${(p * (.55 + .25 * Math.sin(t * 9 + k))).toFixed(2)})`; c.fillRect(8, y - .7, 33 * (.3 + .7 * q), 1.4); }
    c.fillStyle = P.plate; for (const x of [11, 19, 27, 35]) c.fillRect(x, -11, 2.2, 22);
    c.fillStyle = '#2a3032'; c.fillRect(41, -9.4, 4.5, 18.8); c.fillStyle = D; for (let k = -2; k <= 2; k++) c.fillRect(42, k * 3.4 - .8, 4, 1.6);
    c.fillStyle = P.acc; c.fillRect(-12, -1.2, 3, 2.4);
    for (const [x, y] of [[-12, -11.5], [-12, 11.5], [9, -11.5], [9, 11.5]]) bolt(c, P, x, y, 1);
  };

  // 27. générateur sismique : un piston-marteau rond sur quatre vérins
  W_PAINT.seism = (c, P, rec, t, m) => {
    c.scale(1.12, 1.12);
    const sp = m ? m.sP || 0 : 0;
    c.lineCap = 'round';
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); c.strokeStyle = P.dark; c.lineWidth = 4.4; c.beginPath(); c.moveTo(ca * 9, sa * 9); c.lineTo(ca * 19, sa * 19); c.stroke(); c.strokeStyle = P.plate; c.lineWidth = 2; c.stroke(); c.fillStyle = P.body2; circ(c, ca * 19.5, sa * 19.5, 3.4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); }
    c.fillStyle = P.body2; circ(c, 0, 0, 15); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.8; c.stroke();
    c.fillStyle = P.plate; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; circ(c, Math.cos(a) * 13, Math.sin(a) * 13, .9); c.fill(); }
    const s = 1 - sp * .15; c.fillStyle = P.body; circ(c, 0, 0, 10 * s); c.fill();
    c.strokeStyle = P.dark; c.lineWidth = 1; for (const r of [7.5, 5]) { circ(c, 0, 0, r * s); c.stroke(); }
    if (sp > 0) glow(c, 'smP', '255,200,130', 0, 0, 16, sp * .8);
    c.fillStyle = sp > 0 ? '#ffe0a8' : P.acc; circ(c, 0, 0, 2.4 * s); c.fill();
    c.fillStyle = P.acc; c.beginPath(); c.moveTo(17, 0); c.lineTo(14, -2.2); c.lineTo(14, 2.2); c.closePath(); c.fill();
  };

  // 28. bombardiers : pont d'envol, piste balisée, trois appareils qui reviennent un à un
  function miniPlane(c, P, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = P.body; c.beginPath(); c.moveTo(32, 0); c.lineTo(8, -7); c.lineTo(-8, -38); c.lineTo(-19, -36); c.lineTo(-13, -9); c.lineTo(-26, -6); c.lineTo(-22, 0); c.lineTo(-26, 6); c.lineTo(-13, 9); c.lineTo(-19, 36); c.lineTo(-8, 38); c.lineTo(8, 7); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke(); c.fillStyle = P.acc; c.beginPath(); c.ellipse(17, 0, 6, 2.6, 0, 0, TAU); c.fill(); c.restore(); }
  W_PAINT.bombers = (c, P, rec, t, m) => {
    c.fillStyle = P.body2; rr(c, -17, -14, 36, 28, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = D; rr(c, -15, -4.4, 33, 8.8, 2); c.fill();
    c.strokeStyle = '#e0b030'; c.lineWidth = .9; c.setLineDash([2.4, 2.4]); c.beginPath(); c.moveTo(-13, 0); c.lineTo(17, 0); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e0b030'; for (const x of [10, 14]) { c.beginPath(); c.moveTo(x + 2, 0); c.lineTo(x, -2.6); c.lineTo(x, 2.6); c.closePath(); c.fill(); }
    for (const y of [-9.5, 9.5]) { c.strokeStyle = P.plate; c.lineWidth = .8; rr(c, -14, y - 3.4, 13, 6.8, 1.5); c.stroke(); }
    const q = reload(m), n = q >= 1 ? 3 : Math.floor(q * 3);
    const spots = [[2, 0], [-8, -9.5], [-8, 9.5]];
    for (let i = 0; i < n; i++) miniPlane(c, P, spots[i][0], spots[i][1], .2);
    const bl = Math.sin(t * 6) > 0; c.fillStyle = bl ? '#ff4a3a' : '#5a1a14'; circ(c, 18, -12, 1.2); c.fill(); c.fillStyle = bl ? '#5aff8a' : '#14502a'; circ(c, 18, 12, 1.2); c.fill();
  };

  // 29. mur de plasma : réacteur et fourche à deux branches, ruban de plasma entre elles
  W_PAINT.plasmawall = (c, P, rec, t, m) => {
    c.lineCap = 'round';
    for (const s of [-1, 1]) { c.strokeStyle = P.dark; c.lineWidth = 6; c.beginPath(); c.moveTo(0, s * 7.5); c.lineTo(40, s * 9.5); c.stroke(); c.strokeStyle = P.body; c.lineWidth = 4; c.stroke(); c.fillStyle = P.plate; for (let x = 10; x < 38; x += 7) { circ(c, x, s * (7.5 + x * .05), 1.3); c.fill(); } }
    c.fillStyle = P.body2; rr(c, -14, -11, 20, 22, 5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    const q = reload(m), p = .6 + .4 * Math.sin(t * 5);
    glow(c, 'pwR', '210,100,255', -4, 0, 10, .45 + .35 * p);
    c.fillStyle = '#ffe0ff'; circ(c, -4, 0, 2.6); c.fill();
    c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
    for (let j = 0; j < 4; j++) {
      const x0 = 14 + j * 7.5, a = (.25 + .75 * q) * (j === 3 ? 1 : .5);
      c.strokeStyle = `rgba(255,120,240,${(a * (.6 + .4 * Math.sin(t * 13 + j * 2))).toFixed(2)})`; c.lineWidth = j === 3 ? 2.2 : 1.2; c.beginPath();
      for (let i = 0; i <= 8; i++) { const yy = -8 - x0 * .05 + i / 8 * (16 + x0 * .1), xx = x0 + Math.sin(i * 1.7 + t * 18 + j) * 1.4; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    for (const s of [-1, 1]) glow(c, 'pwT', '230,110,255', 40, s * 9.5, 4.5, .5 + .5 * q);
  };

  // 30. missile à têtes multiples : berceau de lancement et gros missile, ogives visibles au nez
  W_PAINT.mirv = (c, P, rec, t, m) => {
    c.fillStyle = P.body2; rr(c, -19, -11, 42, 22, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = P.plate; c.fillRect(-17, -9.5, 38, 2); c.fillRect(-17, 7.5, 38, 2);
    c.fillStyle = '#e0b030'; for (let k = 0; k < 4; k++) c.fillRect(-18.5, -8 + k * 4.4, 2.2, 2.2);
    const q = reload(m); if (q < .75) return;
    const off = (1 - Math.min(1, (q - .75) / .2)) * -14;
    c.save(); c.translate(off, 0);
    c.fillStyle = '#3a3630'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-10, s * 3.4); c.lineTo(-16, s * 8); c.lineTo(-17, s * 3.4); c.closePath(); c.fill(); }
    c.fillStyle = '#e2ddd0'; rr(c, -16, -4, 32, 8, 4); c.fill(); c.strokeStyle = '#4a463e'; c.lineWidth = .8; c.stroke();
    c.fillStyle = '#ff9a40'; c.fillRect(-5, -4, 2.6, 8);
    c.fillStyle = '#c8c2b4'; c.beginPath(); c.moveTo(26, 0); c.lineTo(16, -4.6); c.lineTo(13, -4.6); c.lineTo(13, 4.6); c.lineTo(16, 4.6); c.closePath(); c.fill();
    c.fillStyle = '#2a2622'; for (let k = 0; k < 4; k++) { const x = 3 + k * 2.6; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + 2.2, s * 4); c.lineTo(x, s * 5.9); c.lineTo(x - .7, s * 4); c.fill(); } }
    c.restore();
  };

  // 31. distordeur temporel : cadran de laiton, aiguilles qui tournent en sens contraires, engrenages
  function gear(c, x, y, r, n, a, col) { c.fillStyle = col; c.beginPath(); for (let k = 0; k < n * 2; k++) { const aa = a + k / (n * 2) * TAU, rr2 = k % 2 ? r : r * .78; c.lineTo(x + Math.cos(aa) * rr2, y + Math.sin(aa) * rr2); } c.closePath(); c.fill(); }
  W_PAINT.chrono = (c, P, rec, t, m) => {
    c.scale(1.2, 1.2);
    gear(c, -12, -9, 5, 8, t * 1.5, '#8a6a3a'); gear(c, -12, 9, 4, 7, -t * 1.9, '#a8844a');
    c.fillStyle = P.dark; circ(c, -12, -9, 1.4); c.fill(); circ(c, -12, 9, 1.2); c.fill();
    c.fillStyle = D; rr(c, 12, -3.4, 9, 6.8, 2); c.fill();
    const q = reload(m); glow(c, 'chL', '242,212,138', 22, 0, 7, .3 + .5 * q); c.fillStyle = '#fff2c8'; circ(c, 21, 0, 2); c.fill();
    c.fillStyle = P.body2; circ(c, 0, 0, 15); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = '#c8a050'; c.lineWidth = 2; circ(c, 0, 0, 12.5); c.stroke();
    c.fillStyle = '#221e16'; circ(c, 0, 0, 11.4); c.fill();
    c.strokeStyle = '#f2d48a'; c.lineWidth = .9; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, l = k % 3 ? 1.6 : 3; c.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a) * (11 - l), Math.sin(a) * (11 - l)); } c.stroke();
    c.lineCap = 'round'; c.strokeStyle = '#fff0c8'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 1.3) * 8.5, Math.sin(t * 1.3) * 8.5); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(-t * 4) * 10, Math.sin(-t * 4) * 10); c.stroke();
    c.fillStyle = '#f2d48a'; circ(c, 0, 0, 1.8); c.fill();
    c.strokeStyle = `rgba(242,212,138,${(.2 + .25 * Math.sin(t * 3)).toFixed(2)})`; c.lineWidth = 1; circ(c, 0, 0, 15 + 2 * ((t * .8) % 1)); c.stroke();
  };

  // 32. torpille fouisseuse : berceau à chenilles, torpille et tête de forage qui tourne
  W_PAINT.burrower = (c, P, rec, t, m) => {
    for (const s of [-1, 1]) { c.fillStyle = P.dark; rr(c, -19, s * 10 - 2.8, 34, 5.6, 2.8); c.fill(); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = .8; c.beginPath(); const off = (t * 6) % 3; for (let x = -18 + off; x < 14; x += 3) { c.moveTo(x, s * 10 - 2.2); c.lineTo(x, s * 10 + 2.2); } c.stroke(); }
    c.fillStyle = P.body2; rr(c, -15, -8, 26, 16, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.4; c.stroke();
    const q = reload(m); if (q < .6) { c.fillStyle = D; rr(c, -12, -5, 20, 10, 5); c.fill(); return; }
    c.fillStyle = P.body; rr(c, -14, -6, 30, 12, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#c49a5a'; c.fillRect(13, -6, 2.4, 12);
    c.fillStyle = '#8a847a'; c.beginPath(); c.moveTo(15, -6); c.lineTo(33, 0); c.lineTo(15, 6); c.closePath(); c.fill();
    c.strokeStyle = '#3a3630'; c.lineWidth = 1; c.beginPath(); const sp = q >= 1 ? t * 10 : 0;
    for (let k = 0; k < 5; k++) { const ph = ((k / 5 + sp * .1) % 1), x = 15 + ph * 16, h = 6 * (1 - ph * .9); c.moveTo(x, -h); c.lineTo(x + 2.6, h); } c.stroke();
    c.fillStyle = P.acc; c.fillRect(-10, -1, 4, 2);
  };

  // 33. cage de foudre : râtelier hexagonal de six pylônes autour d'une bobine
  W_PAINT.cage = (c, P, rec, t, m) => {
    c.scale(1.3, 1.3);
    c.fillStyle = P.body2; ngon(c, 6, 15, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = D; c.fillRect(12, -2.2, 10, 4.4); c.fillStyle = '#a8e4ff'; circ(c, 22, 0, 1.8 + Math.sin(t * 11) * .4); c.fill();
    for (let k = 0; k < 3; k++) { c.strokeStyle = k % 2 ? '#7d5733' : '#c18a52'; c.lineWidth = 1.2; circ(c, 0, 0, 2.2 + k * 1.6); c.stroke(); }
    const q = reload(m), n = q >= 1 ? 6 : Math.floor(q * 6), pts = [];
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + k / 6 * TAU, x = Math.cos(a) * 10.5, y = Math.sin(a) * 10.5;
      c.fillStyle = D; circ(c, x, y, 2.4); c.fill();
      if (k >= n) continue; pts.push([x, y]);
      c.fillStyle = '#3c4c56'; c.beginPath(); c.moveTo(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4); c.lineTo(x - Math.sin(a) * 1.6, y + Math.cos(a) * 1.6); c.lineTo(x + Math.sin(a) * 1.6, y - Math.cos(a) * 1.6); c.closePath(); c.fill();
      c.fillStyle = '#c8eeff'; circ(c, x, y, 1.1); c.fill();
    }
    if (n === 6 && Math.sin(t * 7) > -.2) {
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(168,228,255,.8)'; c.lineWidth = .8; c.beginPath();
      for (let k = 0; k < 6; k++) { const a = pts[k], b = pts[(k + 1) % 6], j = Math.sin(t * 37 + k * 5) * 1.6; c.moveTo(a[0], a[1]); c.lineTo((a[0] + b[0]) / 2 + j, (a[1] + b[1]) / 2 - j); c.lineTo(b[0], b[1]); }
      c.stroke(); c.globalCompositeOperation = 'source-over';
    }
  };
})();
