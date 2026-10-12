// Armes apocalyptiques, cataclysmiques et stellaires de la 3.1 (tailles 6, 7 et 8) : les dix-sept armes des plus grands géants.
// Données, recherches, mécaniques (W_FIRE, W_TICK, zones, projectiles) et dessins des affûts (W_PAINT). Tout ce qui touche au
// moteur (dégâts, particules, sons, décor) n'est appelé que pendant le jeu.
// Repères : les zones vivent dans fires (minuteurs dans l'objet, rien en setTimeout : les expéditions simulent en accéléré) ;
// les grands effets vus du ciel sont dessinés au-dessus des unités par un « projectile » immobile xc_sky lié à la zone.

// ================= OUTILS COMMUNS =================
let xcN = 0, xcErr = 0;
const xcGiant = v => !!(v.giant || v.boss || v.r > 150);
const xcBig = v => xcGiant(v) || v.kind === 'building';
// multiplicateur de dégâts du robot (rang, modules) : rapport entre l'arme montée et sa définition
const xcK = (m, w) => { const W0 = m && WEAPONS[m.wid]; return W0 && W0.dmg && w && w.dmg ? w.dmg / W0.dmg : 1; };
// affût piloté à la main (et non laissé en automatique)
const xcMan = (u, m) => !!(u && u.piloted && !u.net && !(u.wm && u.wm[u.mounts.indexOf(m)] === 'a'));
const xcLow = () => fxQ() === 'low' || !!(EXPSIM && !EXPSIM.viewing);
const xcNum = n => String(n).replace('.', TL_DEC);
const xcPart = p => { if (parts.length < 860) parts.push(p); };
const xcFlash = (x, y, size, life, col) => xcPart({ type: 'flash', x, y, vx: 0, vy: 0, life, max: life, size, col: col || '#fff2c8', a: 0 });
const xcRing = (x, y, size, life, col, thin) => parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life, max: life, size, col, thin: !!thin });
function xcTry(fn, c, o) { try { fn(c, o); } catch (e) { if (xcErr++ < 4) console.error('04-plus-armes-c', e); } }
// point visé ramené entre la portée minimale et la portée de l'arme, depuis l'affût
function xcPt(mx, my, x, y, w) { const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy) || 1, r = clamp(d, w.minRange || 0, w.range); return { x: mx + dx / d * r, y: my + dy / d * r, a: Math.atan2(dy, dx), d: r }; }
// valeur d'une cible pour les armes de zone : les gros comptent plus, sans écraser le nombre
const xcVal = v => xcGiant(v) ? 8 : 1 + Math.min(4, v.maxhp / 2500);
// IA : meilleur groupe d'ennemis (plus forte valeur à moins de R) autour de la cible proposée
function xcCluster(u, mx, my, w, seed, R, val) {
  const L = [], rg = w.range, mn = w.minRange || 0;
  foesIn(seed.x, seed.y, R * 2.2, u.team, v => { if (L.length >= 70) return; const d = Math.hypot(v.x - mx, v.y - my); if (d <= rg + v.r && d >= mn * .8) L.push(v); });
  if (!L.length) return null;
  let best = null, bs = -1;
  for (const c of L) {
    let s = 0, sx = 0, sy = 0;
    for (const v of L) { if (d2(v.x, v.y, c.x, c.y) > (R + v.r * .5) ** 2) continue; const q = val(v); s += q; sx += v.x * q; sy += v.y * q; }
    if (s > bs) { bs = s; best = { x: sx / s, y: sy / s, s }; }
  }
  return best;
}
// point d'impact d'une arme de zone : à la main ou en reproduction réseau, le point visé ; sinon le meilleur groupe autour de la cible.
// o = { R, val, min } : une salve coûteuse attend (6 s au plus) d'avoir au moins `min` de valeur à frapper. null : on attend.
function xcAim(u, m, w, F, o) {
  if (NETVIS || xcMan(u, m) || !F.tgt) return xcPt(F.mx, F.my, F.tx, F.ty, w);
  if (time < (m.xcHold || 0)) return null;
  const c = xcCluster(u, F.mx, F.my, w, F.tgt, o.R, o.val || xcVal);
  if (!c) return xcPt(F.mx, F.my, F.tx, F.ty, w);
  if (o.min && c.s < o.min) { if (!m.xcWait) m.xcWait = time; if (time - m.xcWait < 6) { m.xcHold = time + .8; return null; } }
  m.xcWait = 0;
  return xcPt(F.mx, F.my, c.x, c.y, w);
}
// valeur des ennemis autour d'un point (armes centrées sur le robot : faut-il déclencher ?)
function xcWorth(x, y, R, team) { let s = 0; foesIn(x, y, R, team, v => { s += xcVal(v); }); return s; }
// la reproduction réseau vise affût + direction × m.td : on corrige m.td et m.aim après le tir (fireMount0 les réécrit),
// dans la même image, par un projectile éphémère traité juste après les affûts
B_KIND.xc_fix = { update(b) { b.m.td = b.td; b.m.aim = b.aim; return true; }, draw() { } };
function xcNet(m, mx, my, x, y, team) { if (NETVIS || !m) return; bullets.push({ kind: 'xc_fix', x: mx, y: my, vx: 0, vy: 0, team, dmg: 0, m, td: Math.round(Math.hypot(x - mx, y - my)), aim: Math.atan2(y - my, x - mx), vis: false, sky: 1 }); }
// projectile ennemi absorbé ou supprimé sans exploser
B_KIND.xc_dead = { update() { return true; }, draw() { } };
const xcKill = b => { b.kind = 'xc_dead'; b.dmg = 0; b.splash = 0; };
// couche haute : dessin d'une zone (ou d'un tir continu) au-dessus des unités ; b.R : demi-encombrement pour le tri hors écran
const XSKY = {};
B_KIND.xc_sky = { high: true,
  update(b) { const o = b.o; if (!o || o.t <= 0) return true; const R = b.R; b.x = clamp(cam.x, o.x - R, o.x + R); b.y = clamp(cam.y, o.y - R, o.y + R); return false; },
  draw(c, b) { const fn = XSKY[b.o.zk]; if (fn) xcTry(fn, c, b.o); } };
function xcSky(o, R) { bullets.push({ kind: 'xc_sky', x: o.x, y: o.y, vx: 0, vy: 0, team: o.team, dmg: 0, o, R, vis: true, sky: 1 }); }
// zone : tick, dessin au sol (protégé), fin, et dessin du ciel
function xcZone(zk, tick, draw, end, sky) { ZONE_K[zk] = { tick, draw: draw ? (c, f) => xcTry(draw, c, f) : () => { }, end }; if (sky) XSKY[zk] = sky; }
// obstacles d'un disque : fn(tx, ty, o) ; false arrête
function xcTiles(x, y, R, fn) {
  if (!W) return; const t0x = Math.max(0, Math.floor((x - R) / TILE)), t1x = Math.min(WT - 1, Math.floor((x + R) / TILE)), t0y = Math.max(0, Math.floor((y - R) / TILE)), t1y = Math.min(WT - 1, Math.floor((y + R) / TILE)), R2 = (R + 20) * (R + 20);
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) { const o = W.obs[ty * WT + tx]; if (!o || d2(tx * TILE + 20, ty * TILE + 20, x, y) > R2) continue; if (fn(tx, ty, o) === false) return; }
}
// rase le décor d'un disque (jamais les falaises ; les bâtiments sont seulement touchés), au plus `cap` cases
function xcRaze(x, y, R, cap, bdmg, team, src) {
  if (NETVIS || !W || W.isBase) return 0; let n = 0;
  xcTiles(x, y, R, (tx, ty, o) => { if (o === 8) { if (bdmg) hitBuildingTile(tx, ty, bdmg, team, src); return; } if (o >= 7) return; destroyTile(tx, ty, o, null); if (++n >= cap) return false; });
  return n;
}
// trait d'au moins `p` pixels à l'écran
const xcLW = (w, p) => Math.max(w, (p || 1) / cam.zoom);
// échelle du dessin en pixels par unité (niveau de détail des affûts)
const xcPx = c => { const T = c.getTransform(); return Math.hypot(T.a, T.b); };

// ================= DONNÉES DES ARMES =================
Object.assign(WEAPONS, {
  // ---- apocalyptiques (rang 9)
  solar: { n: TL('Rayon solaire'), size: 6, kind: 'solar', dmg: 5200, dps: 1500, rate: .05, range: 4200, minRange: 400, sweep: 1600, width: 280, dur: 3, col: '#ffe9a0', snd: 'uplink', cost: { crystals: 2400, circuits: 2300, cores: 45 }, d: TL('Un rayon orbital balaie une ligne de 1 600 px qui passe par la cible : il vitrifie le sol et brûle la forêt.'), stat: w => TL('{n} dps', { n: fmt(w.dmg) }) + ' · ' + TL('balayage de {n} px', { n: w.sweep }) },
  antimatter: { n: TL('Canon à antimatière'), size: 6, kind: 'antimatter', dmg: 24000, rate: .045, ospd: 260, range: 3800, minRange: 500, r0: 30, r1: 120, col: '#ff7ae0', snd: 'plasma', cost: { crystals: 2600, alloy: 2200, cores: 50 }, d: TL('Orbe lent qui grossit en avançant et absorbe les tirs ennemis, puis s\'annihile dans une immense explosion.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('absorbe les tirs') },
  lift: { n: TL('Soulèvement gravitationnel'), size: 6, kind: 'lift', dmg: 6000, dps: 1600, rate: .05, range: 3600, minRange: 400, splash: 750, vt: 2.5, col: '#9fd0ff', snd: 'gravity', cost: { circuits: 2400, crystals: 2200, cores: 44 }, d: TL('Soulève les ennemis d\'une large zone pendant 2,5 s, puis les écrase au sol.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('soulève et écrase') },
  bladestorm: { n: TL('Tempête de lames'), size: 6, kind: 'bladestorm', dmg: 1400, dps: 2400, rate: .07, range: 1500, blades: 12, vt: 8, col: '#e8f0ff', snd: 'claw', cost: { alloy: 2600, scrap: 2400, cores: 42 }, d: TL('Douze lames géantes tournent autour du robot pendant 8 s et rasent tout ce qu\'elles touchent.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('{n} lames pendant {s} s', { n: w.blades, s: w.vt }) },
  volcano: { n: TL('Volcan artificiel'), size: 6, kind: 'volcano', dmg: 900, dps: 1500, rate: .05, range: 3600, minRange: 500, splash: 110, bombs: 4, vt: 10, spreadR: 650, burn: { r: 110, t: 4, dps: 90 }, col: '#ff6a20', snd: 'mortar', cost: { scrap: 2600, crystals: 2300, cores: 44 }, d: TL('Fait surgir un volcan qui crache des bombes de lave pendant 10 s.'), stat: w => TL('{n} par bombe', { n: fmt(w.dmg) }) + ' · ' + TL('{n} bombes/s', { n: w.bombs }) },
  anchor: { n: TL('Ancre orbitale'), size: 6, kind: 'anchor', dmg: 18000, rate: .06, range: 4000, minRange: 400, splash: 260, warn: 1.2, pin: 4, col: '#ffd27a', snd: 'uplink', cost: { alloy: 2500, circuits: 2200, cores: 48 }, d: TL('Une flèche orbitale cloue la cible au sol et creuse un cratère de verre.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('cloue {n} s', { n: w.pin }) },
  crystal: { n: TL('Cristalliseur'), size: 6, kind: 'crystal', dmg: 5000, dps: 1300, rate: .05, range: 3200, minRange: 400, splash: 600, vt: 3, tiles: 12, col: '#c381ff', snd: 'frost', cost: { crystals: 2600, circuits: 2200, cores: 46 }, d: TL('Change les ennemis en cristal pendant 3 s, puis les fait voler en éclats. Laisse des cristaux à récolter.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('cristallise {n} s', { n: w.vt }) },
  sentinels: { n: TL('Sentinelles orbitales'), size: 6, kind: 'sentinels', dmg: 1440, dps: 900, rate: .045, range: 3000, minRange: 300, life: 20, noRival: 1, col: '#6fe3c8', snd: 'launch', cost: { alloy: 2600, scrap: 2200, cores: 40 }, d: TL('Largue trois tourelles lourdes autour de la cible pendant 20 s.'), stat: w => TLn(3, '{n} tourelle lourde', '{n} tourelles lourdes') + ' · ' + TL('{s} s', { s: w.life }) },
  // ---- cataclysmiques (rangs 10 et 11)
  starbeam: { n: TL('Lance d\'étoile'), size: 7, kind: 'starbeam', dmg: 14000, dps: 4600, rate: .033, range: 5200, width: 260, charge: 2.5, dur: 8, reload: 20, col: '#fff2a8', snd: 'beam', cost: { crystals: 5800, circuits: 5200, cores: 110 }, d: TL('Se charge, puis un rayon d\'étoile de 260 px de large suit la cible pendant 8 s et creuse le paysage.'), stat: w => TL('{n} dps pendant {s} s', { n: fmt(w.dmg), s: w.dur }) + ' · ' + TL('charge {n} s', { n: xcNum(w.charge) }) },
  collapser: { n: TL('Effondreur'), size: 7, kind: 'collapse', dmg: 6000, dps: 5000, rate: .04, range: 5000, minRange: 800, splash: 900, warn: 2.5, vt: 8, col: '#ff8a3a', snd: 'charge', cost: { alloy: 5800, scrap: 5400, cores: 100 }, d: TL('Fissure le sol, puis ouvre un gouffre de 8 s qui engloutit les ennemis au sol.'), stat: w => TL('{n} dps pendant {s} s', { n: fmt(w.dmg), s: w.vt }) + ' · ' + TL('rayon {n}', { n: w.splash }) },
  hurricane: { n: TL('Ouragan'), size: 7, kind: 'hurricane', dmg: 2000, dps: 6000, rate: .035, range: 5200, minRange: 800, splash: 1100, vt: 12, move: 90, bolt: 5000, bolts: 3, col: '#bfe6ff', snd: 'storm', cost: { circuits: 5800, crystals: 5200, cores: 105 }, d: TL('Un ouragan avance vers les ennemis pendant 12 s : vents, aspiration et éclairs.'), stat: w => TL('{n} dps', { n: fmt(w.dmg) }) + ' · ' + TL('{n} éclairs/s', { n: w.bolts }) },
  moonshot: { n: TL('Lanceur de lune'), size: 7, kind: 'boulder', dmg: 30000, dps: 4400, rate: .04, range: 4600, minRange: 700, splash: 400, br: 200, roll: 1800, crush: 25000, col: '#c8bca8', snd: 'siege', cost: { scrap: 6000, alloy: 5600, cores: 95 }, d: TL('Un rocher colossal tiré en cloche, qui roule ensuite sur 1 800 px en écrasant tout.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('roule {n} px', { n: w.roll }) },
  phase: { n: TL('Faucheuse quantique'), size: 7, kind: 'phase', dmg: 16000, dps: 6500, rate: .06, range: 4200, reach: 4200, targets: 12, col: '#7af0ff', snd: 'emp', cost: { crystals: 5600, circuits: 5600, cores: 120 }, d: TL('Frappe d\'un coup les douze plus gros ennemis de la zone, à travers murs et blindage.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TLn(w.targets, '{n} cible', '{n} cibles') },
  // ---- stellaires (rang 11)
  supernova: { n: TL('Supernova'), size: 8, kind: 'supernova', dmg: 90000, dps: 12000, rate: .016, range: 3000, charge: 4, edge: .3, raze: 1200, col: '#fff6d8', snd: 'charge', cost: { crystals: 13000, alloy: 12000, cores: 260 }, d: TL('Se charge 4 s, puis une nova de 3 000 px souffle tous les ennemis autour du robot.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('rayon {n}', { n: w.range }) },
  starswarm: { n: TL('Essaim stellaire'), size: 8, kind: 'starswarm', dmg: 10000, salvo: 40, dps: 12000, rate: .03, range: 5600, splash: 260, col: '#ffe9a8', snd: 'swarm', cost: { circuits: 12500, crystals: 11500, cores: 230 }, d: TL('Quarante éclats d\'étoile tournent autour du robot, puis piquent chacun sur un ennemi.'), stat: w => TLn(w.salvo, '{n} frappe de {dmg}', '{n} frappes de {dmg}', { dmg: fmt(w.dmg) }) + ' · ' + TL('{n} px', { n: w.range }) },
  gravitron: { n: TL('Gravitron'), size: 8, kind: 'gravitron', dmg: 4000, dps: 10500, rate: .03, range: 3200, vt: 8, deflect: 1500, col: '#b9a0ff', snd: 'gravity', cost: { crystals: 12500, circuits: 11000, cores: 240 }, d: TL('Le robot devient un puits de gravité pendant 8 s : il attire, broie et dévie les tirs ennemis.'), stat: w => TL('{n} dps', { n: fmt(w.dmg) }) + ' · ' + TL('dévie les tirs') },
  eclipse: { n: TL('Éclipse'), size: 8, kind: 'eclipse', dmg: 40000, dps: 11000, rate: .03, range: 5200, minRange: 900, splash: 700, area: 2200, vt: 10, vuln: .3, col: '#ffcf7a', snd: 'launch', cost: { alloy: 12000, crystals: 12000, cores: 250 }, d: TL('Un pic de matière noire, puis une ombre de 10 s qui aveugle et marque les ennemis.'), stat: w => TL('{n} dégâts', { n: fmt(w.dmg) }) + ' · ' + TL('aveugle {n} s', { n: w.vt }) },
});
// tirs indirects (frappes orbitales, zones, effets centrés sur le robot) : pas besoin d'attendre que l'affût soit aligné
for (const k of ['solar', 'lift', 'volcano', 'anchor', 'crystal', 'sentinels', 'collapse', 'hurricane', 'boulder', 'phase', 'supernova', 'starswarm', 'gravitron', 'eclipse']) ARTILLERY[k] = 1;

// ================= RECHERCHES =================
// prérequis venus d'autres fichiers 3.1 (armes colossales nouvelles, géants des rangs 10 et 11) : posés à la fin du chargement,
// avec un repli sur une arme existante si le fichier qui les crée est absent (page d'essai isolée)
const XC_RES = [
  // id, catégorie, famille, prérequis, repli, req2, coût
  ['solar', 6, 'nrj', 'w_annihil', 'w_fission', null, { data: 1000, cores: 24 }],
  ['antimatter', 6, 'nrj', 'w_plasmawall', 'w_annihil', null, { data: 1080, cores: 28 }],
  ['lift', 6, 'ctrl', 'w_chrono', 'w_singul', null, { data: 1040, cores: 26 }],
  ['bladestorm', 6, 'feu', 'w_hammer', 'w_furnace', null, { data: 960, cores: 22 }],
  ['volcano', 6, 'feu', 'w_furnace', 'w_napalm', null, { data: 1000, cores: 24 }],
  ['anchor', 6, 'obus', 'w_seism', 'w_battle', null, { data: 1040, cores: 26 }],
  ['crystal', 6, 'ctrl', 'w_tornado', 'w_ion', null, { data: 1000, cores: 24 }],
  ['sentinels', 6, 'dep', 'w_bombers', 'w_fighters', null, { data: 1120, cores: 30 }],
  ['starbeam', 7, 'nrj', 'w_solar', null, 'c_ether', { data: 2400, cores: 55 }],
  ['collapser', 7, 'obus', 'w_anchor', null, 'c_pangee', { data: 2300, cores: 52 }],
  ['hurricane', 7, 'elec', 'w_cage', 'w_ion', 'c_ether', { data: 2500, cores: 56 }],
  ['moonshot', 7, 'cin', 'w_railvolley', 'w_gauss', 'c_pangee', { data: 2200, cores: 50 }],
  ['phase', 7, 'ctrl', 'w_lift', null, 'c_pangee', { data: 2600, cores: 60 }],
  ['supernova', 8, 'nrj', 'w_starbeam', null, 'c_gaia', { data: 5200, cores: 120 }],
  ['starswarm', 8, 'dep', 'w_sentinels', null, 'c_constellation', { data: 4600, cores: 105 }],
  ['gravitron', 8, 'ctrl', 'w_phase', null, 'c_constellation', { data: 4800, cores: 110 }],
  ['eclipse', 8, 'elec', 'w_hurricane', null, 'c_gaia', { data: 5000, cores: 115 }],
];
for (const [id, sz, fam, req, alt, , cost] of XC_RES) {
  const d = WEAPONS[id].d;
  addResearch({ id: 'w_' + id, cat: sz === 6 ? TL('Armes apocalyptiques') : sz === 7 ? TL('Armes cataclysmiques') : TL('Armes stellaires'), lab: 5, n: WEAPONS[id].n, cost, req: RESEARCH_BY_ID[req] || !alt ? req : alt, bld: SHIP(sz - 3).bld, fam,
    d: sz === 6 ? TL('{d} Arme apocalyptique : réservée aux géants de rang 9.', { d }) : sz === 7 ? TL('{d} Arme cataclysmique : réservée aux géants de rang 10 et plus.', { d }) : TL('{d} Arme stellaire : réservée aux géants de rang 11.', { d }) });
}
LATE.push(() => {
  for (const [id, , , req, alt, req2] of XC_RES) {
    const r = RESEARCH_BY_ID['w_' + id]; if (!r) continue;
    r.req = RESEARCH_BY_ID[req] ? req : alt && RESEARCH_BY_ID[alt] ? alt : r.req;
    if (req2 && RESEARCH_BY_ID[req2]) r.req2 = [req2]; else if (r.req2) r.req2 = r.req2.filter(k => RESEARCH_BY_ID[k]);
  }
});

// ================= EFFETS PARTAGÉS =================
// éclair plein écran, atténué avec la distance au joueur
function xcScreen(x, y, v) { if (!player) return; const F = focus(), d = Math.hypot(x - F.x, y - F.y); flashT = Math.max(flashT, v * (d < 3500 ? 1 : d < 9000 ? .35 : 0)); }
// obstacle effacé sans fracas (rayons, gouffres, souffles) : quelques gravats, butin facultatif, synchronisé en ligne
function xcGone(tx, ty, o, drop) {
  if (NETVIS || !W) return; const i = ty * WT + tx; W.obs[i] = 0; W.ohp[i] = 0; miniSetTile(tx, ty); if (LIVE.game) LIVE.tileGone(tx, ty);
  const x = tx * TILE + 20, y = ty * TILE + 20, D = OBS[o];
  if (Math.random() < .4) xcPart({ type: 'debris', x, y, vx: rnd(-90, 90), vy: rnd(-90, 90), life: .7, max: .7, size: rnd(3, 6), col: D.mm, rot: 0 });
  if (drop && D.drop) dropTable(D.drop, x, y, .7);
  if (Math.random() < .3) scarRubble(tx, ty, o, false);
}
// colonne de lumière qui descend du ciel jusqu'à (x, y) : la lumière du jeu vient d'en haut à gauche
function xcPillar(c, x, y, w0, w1, H, col0, col1) {
  const dx = -.3 * H, dy = -H, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, g = c.createLinearGradient(x, y, x + dx, y + dy);
  g.addColorStop(0, col0); g.addColorStop(.55, col1); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(x + nx * w0, y + ny * w0); c.lineTo(x + dx + nx * w1, y + dy + ny * w1); c.lineTo(x + dx - nx * w1, y + dy - ny * w1); c.lineTo(x - nx * w0, y - ny * w0); c.closePath(); c.fill();
}
function xcGlow(c, x, y, r, stops) { const g = c.createRadialGradient(x, y, 0, x, y, r); for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; circ(c, x, y, r); c.fill(); }
// réticule d'alerte au sol (frappes orbitales)
function xcReticle(c, x, y, R, a, col, k) {
  c.strokeStyle = col; c.lineWidth = xcLW(R * .02, 1.5); c.setLineDash([R * .12, R * .08]); c.lineDashOffset = -time * R * .3; circ(c, x, y, R); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
  c.lineWidth = xcLW(R * .035, 2); for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; c.beginPath(); c.arc(x, y, R * (.72 + .1 * k), b - .28, b + .28); c.stroke(); c.beginPath(); c.moveTo(x + Math.cos(b) * R * .35, y + Math.sin(b) * R * .35); c.lineTo(x + Math.cos(b) * R * .6, y + Math.sin(b) * R * .6); c.stroke(); }
}

// ================= RAYON SOLAIRE =================
// un rayon orbital (disque de 280 px) parcourt en 3 s une ligne de 1 600 px qui passe par la cible, perpendiculaire à l'axe de tir
W_FIRE.solar = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 520, min: 3 }); if (!P) return false;
  const L = w.sweep, f = addZone('xc_solar', P.x, P.y, L / 2 + w.width, .5 + w.dur + .6, u.team, u, { a: P.a + Math.PI / 2, L, bw: w.width / 2, dps: w.dmg, T: w.dur, id: ++xcN, gn: 0, bx: P.x, by: P.y, p: 0, on: false });
  xcSky(f, L / 2 + w.width); xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
xcZone('xc_solar', (f, dt) => {
  const e = f.max - f.t, p = clamp((e - .5) / f.T, 0, 1), ca = Math.cos(f.a), sa = Math.sin(f.a);
  f.bx = f.x + ca * (p - .5) * f.L; f.by = f.y + sa * (p - .5) * f.L; f.p = p; f.on = e >= .5 && e <= .5 + f.T;
  if (!f.on) return;
  SFX.hold('xs' + f.id, 'beam', .9, f.bx, f.by);
  f.tick -= dt; if (f.tick > 0) return; f.tick = .1;
  const bx = f.bx, by = f.by;
  if (!f.vis) {
    const k = f.dps * .1 * diffDmg(f.team), L = []; foesIn(bx, by, f.bw, f.team, v => L.push(v)); for (const v of L) hurt(v, k, f.src);
    if (W && !W.isBase) xcTiles(bx, by, f.bw * .85, (tx, ty, o) => { if (o === 1) destroyTile(tx, ty, 1, null); else if (o < 7) hitTile(tx, ty, 160); else if (o === 8) hitBuildingTile(tx, ty, k * .3, f.team, f.src); });
    if ((f.gn & 1) === 0) scarSprite('burn', bx, by, f.bw * 1.05, Math.random() * TAU);
    if (f.gn % 8 === 3) glassify(bx, by, f.bw * .6);
  }
  f.gn++;
  xcFlash(bx, by, f.bw * 1.7, .16, '#fff2c8');
  if (!xcLow()) { const a = Math.random() * TAU; xcPart({ type: 'ember', x: bx + Math.cos(a) * f.bw * .8, y: by + Math.sin(a) * f.bw * .8, vx: rnd(-30, 30), vy: -rnd(40, 90), life: rnd(.6, 1.2), max: 1.2, size: rnd(1.5, 3) }); xcPart({ type: 'smoke', x: bx + rnd(-1, 1) * f.bw * .6, y: by + rnd(-1, 1) * f.bw * .6, vx: 0, vy: -20, life: 1.8, max: 1.8, size: rnd(30, 60), col: '' }); }
}, (c, f) => {
  const ca = Math.cos(f.a), sa = Math.sin(f.a), hx = ca * f.L / 2, hy = sa * f.L / 2, e = f.max - f.t;
  c.lineCap = 'round';
  if (e < .5 + f.T) { c.strokeStyle = `rgba(255,210,120,${(.25 + .2 * Math.sin(time * 14)).toFixed(2)})`; c.lineWidth = xcLW(6, 2); c.setLineDash([xcLW(34, 7), xcLW(24, 5)]); c.beginPath(); c.moveTo(f.x - hx, f.y - hy); c.lineTo(f.x + hx, f.y + hy); c.stroke(); c.setLineDash([]); }
  if (f.p > 0) { const fade = clamp(f.t / .6, 0, 1); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,100,30,${(.2 * fade).toFixed(2)})`; c.lineWidth = f.bw * 1.3; c.beginPath(); c.moveTo(f.x - hx, f.y - hy); c.lineTo(f.bx, f.by); c.stroke(); c.strokeStyle = `rgba(255,200,90,${(.22 * fade).toFixed(2)})`; c.lineWidth = f.bw * .45; c.stroke(); c.globalCompositeOperation = 'source-over'; }
}, null, (c, f) => {
  const e = f.max - f.t, R = f.bw, I = e < .5 ? e / .5 * .45 : f.on ? 1 : clamp(f.t / .6, 0, 1), x = f.bx, y = f.by, fl = .9 + .1 * Math.sin(time * 37);
  c.globalCompositeOperation = 'lighter';
  if (e < .5) { xcPillar(c, x, y, R * .25, R * .5, 2600, `rgba(255,240,200,${(.6 * I).toFixed(2)})`, `rgba(255,220,140,${(.2 * I).toFixed(2)})`); xcGlow(c, x, y, R * .9, [[0, `rgba(255,250,230,${I.toFixed(2)})`], [1, 'rgba(255,200,90,0)']]); c.globalCompositeOperation = 'source-over'; return; }
  xcPillar(c, x, y, R * .9, R * 1.2, 2800, `rgba(255,250,225,${(.7 * I * fl).toFixed(2)})`, `rgba(255,214,130,${(.22 * I).toFixed(2)})`);
  xcGlow(c, x, y, R * 2.3, [[0, `rgba(255,255,245,${I.toFixed(2)})`], [.22, `rgba(255,244,200,${(.9 * I).toFixed(2)})`], [.5, `rgba(255,170,60,${(.35 * I).toFixed(2)})`], [1, 'rgba(255,120,30,0)']]);
  c.strokeStyle = `rgba(255,236,180,${(.5 * I).toFixed(2)})`; c.lineWidth = xcLW(R * .05, 1.5);
  for (let k = 0; k < 3; k++) { const q = (time * 1.6 + k / 3) % 1; c.globalAlpha = 1 - q; circ(c, x, y, R * (.6 + q * 1.3)); c.stroke(); }
  c.globalAlpha = 1; c.lineWidth = xcLW(R * .04, 1.2); c.beginPath();
  for (let k = 0; k < 6; k++) { const a = time * .4 + k * Math.PI / 3, l = R * (2.4 + .5 * Math.sin(time * 5 + k)); c.moveTo(x + Math.cos(a) * R * .3, y + Math.sin(a) * R * .3); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); }
  c.stroke(); c.globalCompositeOperation = 'source-over';
});

// ================= CANON À ANTIMATIÈRE =================
// orbe lent qui grossit (r 30 → 120), absorbe les tirs adverses, pousse les petites unités, efface le décor ;
// explose au contact d'un géant, d'un boss, d'un bâtiment, d'un obstacle infranchissable, ou en bout de course
W_FIRE.antimatter = (u, m, w, F) => {
  const man = xcMan(u, m); if (!NETVIS && !F.tgt && !man) return false; // jamais pour abattre un arbre
  // l'orbe ne se guide que sur un gros (il explosera à son contact) ; sinon il va au point visé (pour l'IA, le meilleur groupe)
  const big = F.tgt && xcBig(F.tgt) ? F.tgt : null, P = big || NETVIS || man ? xcPt(F.mx, F.my, F.tx, F.ty, w) : xcAim(u, m, w, F, { R: 450 }); if (!P) return false;
  const L = 56 * F.sc, sx = F.mx + Math.cos(F.a) * L, sy = F.my + Math.sin(F.a) * L, a = Math.atan2(P.y - sy, P.x - sx);
  const tg = NETVIS || !big ? null : man ? (d2(big.x, big.y, F.tx, F.ty) < (big.r + 220) ** 2 ? big : null) : big;
  projectile('antimatter', sx, sy, a, w.ospd, { team: u.team, src: u, dmg: w.dmg * diffDmg(u.team), range: Math.max(250, Math.hypot(P.x - sx, P.y - sy)), max: w.range, r: w.r0, r0: w.r0, r1: w.r1, tgt: tg, eat: 0, ck: 0 });
  for (let i = 0; i < 3; i++) xcRing(sx, sy, 50 * (i + 1) * F.sc * .3, .3 + i * .1, '#ff9ae8', true);
  xcFlash(sx, sy, 40 * F.sc, .2, '#ffb0f0'); addShakeNear(sx, sy, 6);
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
function amBoom(b) {
  const rad = Math.min(550, 300 + .25 * b.dist) + b.eat * .5;
  blast(b.x, b.y, rad, b.dmg, b.team, b.src);
  for (let k = 0; k < 4; k++) xcRing(b.x, b.y, rad * (.6 + k * .35), .45 + k * .2, k ? '#ff7ae0' : '#ffffff', k > 1);
  xcFlash(b.x, b.y, rad * 1.3, .4, '#ffd8f8'); if (!b.vis) xcScreen(b.x, b.y, .3);
  addShakeNear(b.x, b.y, 18); SFX.play('nuke', .7, b.x, b.y, { size: 4 });
}
B_KIND.antimatter = { high: true,
  update(b, dt) {
    b.life += dt;
    const t = b.tgt;
    if (t && !t.dead && !t.hidden) { b.a = turnTo(b.a, Math.atan2(t.y - b.y, t.x - b.x), .3 * dt); b.range = Math.min(b.max, b.dist + Math.hypot(t.x - b.x, t.y - b.y)); } else b.tgt = null;
    b.vx = Math.cos(b.a) * b.spd; b.vy = Math.sin(b.a) * b.spd; b.x += b.vx * dt; b.y += b.vy * dt; b.dist += b.spd * dt;
    b.r = b.r0 + (b.r1 - b.r0) * clamp(b.dist / b.max, 0, 1) + b.eat;
    if (b.x < 0 || b.y < 0 || b.x >= WPX || b.y >= WPX) { amBoom(b); return true; }
    if (!b.vis) { // absorbe les projectiles adverses qu'il touche
      const R2 = (b.r + 16) ** 2;
      for (let i = 0; i < bullets.length; i++) { const o = bullets[i]; if (o.team === b.team || o.sky || !(o.dmg > 0) || o.kind === 'antimatter' || d2(o.x, o.y, b.x, b.y) > R2) continue; xcKill(o); b.eat = Math.min(50, b.eat + 1.2); xcPart({ type: 'spark', x: o.x, y: o.y, vx: (b.x - o.x) * 3, vy: (b.y - o.y) * 3, life: .25, max: .25, size: 2.5, col: '#ffc8f4' }); }
    }
    b.ck -= dt; if (b.ck <= 0) {
      b.ck = .1; let hit = false;
      xcTiles(b.x, b.y, b.r * .75, (tx, ty, o) => { if (o >= 6) { hit = true; return false; } if (!b.vis && !W.isBase) xcGone(tx, ty, o, false); });
      if (!hit) foesIn(b.x, b.y, b.r * .8, b.team, v => { if (xcBig(v)) hit = true; else if (!b.vis && !(b.hits && b.hits.has(v.id))) { (b.hits || (b.hits = new Set())).add(v.id); hurt(v, 0, b.src, { push: 420, px: b.x, py: b.y }); } });
      if (hit) { amBoom(b); return true; }
      xcFlash(b.x, b.y, b.r * 2, .16, '#ff9ae8');
      SFX.hold('am' + b.id, 'beam', .35, b.x, b.y);
    }
    if (b.dist >= b.range) { amBoom(b); return true; }
    return false;
  },
  draw(c, b) {
    const R = b.r, x = b.x, y = b.y, t = time;
    c.globalCompositeOperation = 'lighter';
    xcGlow(c, x, y, R * 2.5, [[.25, 'rgba(255,120,230,.5)'], [.55, 'rgba(160,60,255,.16)'], [1, 'rgba(120,40,255,0)']]);
    for (let k = 1; k <= 3; k++) { c.fillStyle = `rgba(255,110,220,${(.12 / k).toFixed(3)})`; circ(c, x - b.vx * .14 * k, y - b.vy * .14 * k, R * (1 - k * .15)); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    const g = c.createRadialGradient(x - R * .2, y - R * .2, 0, x, y, R); g.addColorStop(0, '#12041c'); g.addColorStop(.7, '#2c0a3e'); g.addColorStop(.9, '#ff8ae8'); g.addColorStop(1, 'rgba(255,225,255,.95)'); c.fillStyle = g; circ(c, x, y, R); c.fill();
    c.strokeStyle = 'rgba(255,190,245,.85)'; c.lineWidth = xcLW(R * .05, 1.2);
    for (let k = 0; k < 3; k++) { const s = t * (2 + k) * (k % 2 ? -1 : 1); c.beginPath(); c.arc(x, y, R * (.42 + k * .17), s, s + 2.2); c.stroke(); }
    c.fillStyle = '#ffe0fa'; for (let k = 0; k < 6; k++) { const a = t * 3 + k * 1.05, q = R * (1.15 + .12 * Math.sin(t * 5 + k)); circ(c, x + Math.cos(a) * q, y + Math.sin(a) * q, xcLW(R * .05, 1.5)); c.fill(); }
  } };

// ================= SOULÈVEMENT GRAVITATIONNEL =================
// zone r 750 : les ennemis non géants montent 2,5 s (étourdis, dessinés en hauteur, ombre qui s'éloigne), puis sont écrasés au sol
W_FIRE.lift = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 600, val: v => xcGiant(v) ? .5 : 1 + Math.min(3, v.maxhp / 3000), min: 4 }); if (!P) return false;
  const f = addZone('xc_lift', P.x, P.y, w.splash, w.vt + .9, u.team, u, { dmg: w.dmg * diffDmg(u.team), k: xcK(m, w) * diffDmg(u.team), L: [], vt: w.vt, slam: false, cap: 0, seed: Math.random() * 99 });
  xcSky(f, w.splash + 300); xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  xcRing(P.x, P.y, w.splash, .5, '#9fd0ff', true);
  return true;
};
function liftDrop(v) { if (!v.xcLift) return; v.jz = 0; v.kick = 0; v.xcLift = null; }
function liftSlam(f) {
  f.slam = true; f.t = Math.min(f.t, .9);
  const S = new Set();
  for (const v of f.L) { S.add(v.id); if (v.dead) continue; liftDrop(v); if (!f.vis) hurt(v, f.dmg + 30 * v.r * f.k, f.src); if (!xcLow()) FX.dust(v.x, v.y, 3, 10 + v.r * .6, 40 + v.r * 2); }
  if (!f.vis) { const B = []; foesIn(f.x, f.y, f.r, f.team, v => { if (!S.has(v.id)) B.push(v); }); for (const v of B) hurt(v, f.dmg, f.src, { stun: 1.5 }); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + Math.random(), d = f.r * rnd(.1, .7); scarSprite('crack', f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, f.r * .3, Math.random() * TAU); } }
  xcRing(f.x, f.y, f.r * 1.05, .6, '#cfe4ff'); xcRing(f.x, f.y, f.r * .7, .45, '#ffffff', true); FX.dust(f.x, f.y, 9, f.r * .4, f.r * 1.3);
  addShakeNear(f.x, f.y, 16); SFX.play('crush', 1, f.x, f.y, { size: 4 }); SFX.play('explo', .8, f.x, f.y, { size: 4 });
}
xcZone('xc_lift', (f, dt) => {
  const e = f.max - f.t;
  if (f.slam) return;
  if (e < .5) { f.cap -= dt; if (f.cap <= 0) { f.cap = .1; foesIn(f.x, f.y, f.r, f.team, v => { if (v.xcLift || v.static || v.kind === 'building' || v.kind === 'beacon' || xcGiant(v)) return; v.xcLift = f; v.xcT0 = e; f.L.push(v); }); } }
  for (const v of f.L) {
    if (v.dead || v.xcLift !== f) continue; const h = clamp((e - v.xcT0) / .7, 0, 1), hh = h * h * (3 - 2 * h);
    v.jz = hh * 1.25 + Math.sin(time * 3 + v.id) * .06 * hh; v.kick = v.jz * (24 + v.r * .6); v.kickA = Math.PI / 2;
    if (!f.vis) { v.vx *= .5; v.vy *= .5; v.ang += dt * .8 * Math.sin(v.id); v.stunT = Math.max(v.stunT || 0, time + .25); }
  }
  if (!xcLow() && Math.random() < dt * 14) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * f.r; xcPart({ type: 'debris', x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vx: rnd(-8, 8), vy: -rnd(30, 70), life: 1.4, max: 1.4, size: rnd(3, 7), col: '#5c574d', rot: 0 }); }
  if (e >= f.vt) liftSlam(f);
}, (c, f) => {
  const e = f.max - f.t, I = f.slam ? clamp(f.t / .9, 0, 1) : clamp(e / .3, 0, 1);
  xcGlow(c, f.x, f.y, f.r, [[0, `rgba(140,190,255,${(.16 * I).toFixed(3)})`], [.8, `rgba(120,170,255,${(.1 * I).toFixed(3)})`], [1, 'rgba(120,170,255,0)']]);
  c.strokeStyle = `rgba(180,215,255,${(.55 * I).toFixed(2)})`; c.lineWidth = xcLW(5, 1.5); c.setLineDash([xcLW(26, 6), xcLW(18, 4)]); c.lineDashOffset = time * 60; circ(c, f.x, f.y, f.r); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
  if (!f.slam) { c.lineWidth = xcLW(3, 1); for (let k = 0; k < 3; k++) { const q = (time * .5 + k / 3) % 1; c.strokeStyle = `rgba(190,220,255,${(.4 * (1 - q) * I).toFixed(2)})`; circ(c, f.x, f.y, f.r * (.15 + q * .85)); c.stroke(); } }
}, f => { for (const v of f.L) if (v.xcLift === f) liftDrop(v); }, (c, f) => {
  // colonnes de lévitation sous les unités soulevées, débris en suspension
  const e = f.max - f.t, I = f.slam ? 0 : clamp(e / .4, 0, 1);
  if (I > 0) {
    c.globalCompositeOperation = 'lighter';
    for (const v of f.L) { if (v.dead || v.xcLift !== f) continue; const h = v.kick || 0, w = v.r * .9; c.fillStyle = `rgba(150,200,255,${(.18 * I).toFixed(3)})`; c.beginPath(); c.moveTo(v.x - w, v.y); c.lineTo(v.x - w * .7, v.y - h); c.lineTo(v.x + w * .7, v.y - h); c.lineTo(v.x + w, v.y); c.closePath(); c.fill(); }
    c.globalCompositeOperation = 'source-over';
  }
  const lift = f.slam ? clamp(f.t / .9, 0, 1) ** 3 : clamp(e / f.vt, 0, 1);
  for (let k = 0; k < 16; k++) {
    const a = hash2(k, 3, f.seed) * TAU, d = Math.sqrt(hash2(k, 5, f.seed)) * f.r * .92, x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d, s = 9 + hash2(k, 7, f.seed) * 22, h = lift * (60 + hash2(k, 9, f.seed) * 260);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + h * .2, y + h * .1, s * .8, s * .5, 0, 0, TAU); c.fill();
    c.save(); c.translate(x, y - h); c.rotate(time * (.6 + k * .05) + k); c.fillStyle = k % 3 ? '#5f574b' : '#7a7262'; c.fillRect(-s / 2, -s * .35, s, s * .7); c.fillStyle = 'rgba(150,200,255,.35)'; c.fillRect(-s / 2, -s * .35, s, s * .18); c.restore();
  }
});

// ================= TEMPÊTE DE LAMES =================
// douze lames géantes tournent autour du robot (à u.r + 300) pendant 8 s ; l'affût la déclenche seul dès qu'un ennemi
// approche à moins de u.r + 600, ou au clic en pilotage
W_TICK.bladestorm = (u, m, dt, mx, my) => {
  const w = m.w;
  if (m.xcOn > time) { m.aim += dt * 2.6; return true; } // lames déployées : le moyeu tourne
  if (u.stunT > time || m.cd > 0) return true;
  let go = false;
  if (xcMan(u, m)) { m.aim = turnTo(m.aim, Math.atan2(mouse.wy - my, mouse.wx - mx), 1.2 * dt); go = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire); }
  else { m.xcScan = (m.xcScan || 0) - dt; if (m.xcScan <= 0) { m.xcScan = .3; go = !!nearestFoe(u.x, u.y, u.r + 600, u.team); } }
  if (!go) return true;
  W_FIRE.bladestorm(u, m, w, null);
  m.cd = 1 / (w.rate * (u.rateMul || 1)); m.fc = ((m.fc || 0) + 1) & 255; m.td = 0; m.recoil = 1; u.lastFire = time;
  SFX.play(w.snd, u.piloted ? .9 : .5, mx, my, { size: 6 }); if (u.piloted && !u.net) buzz(30);
  return true;
};
W_FIRE.bladestorm = (u, m, w) => {
  const f = addZone('xc_blades', u.x, u.y, 40, w.vt, u.team, u, { u, R: u.r + 300, th: Math.random() * TAU, om: 0, n: w.blades || 12, dmg: w.dmg * diffDmg(u.team), hit: new Map(), ck: 0, st: 0, ramp: 0 });
  xcSky(f, u.r + 600); m.xcOn = time + w.vt;
  return true;
};
xcZone('xc_blades', (f, dt) => {
  const u = f.u; if (!u || u.dead) { f.t = 0; return; }
  f.x = u.x; f.y = u.y; f.R = u.r + 300;
  const e = f.max - f.t; f.ramp = clamp(e / .6, 0, 1) * clamp(f.t / .6, 0, 1);
  f.om = 1.25 * (.25 + .75 * f.ramp); f.th += f.om * dt;
  f.st -= dt; if (f.st <= 0) { f.st = .32; SFX.play('claw', .45, f.x + Math.cos(f.th) * f.R, f.y + Math.sin(f.th) * f.R, { size: 4 }); }
  f.ck -= dt; if (f.ck > 0) return; f.ck = .1;
  if (f.vis || f.ramp < .3) return;
  const s = TAU / f.n, sw = f.om * .1, R = f.R * (.55 + .45 * f.ramp), r0 = R - 220, r1 = R + 200, L = [];
  foesIn(f.x, f.y, r1, f.team, v => L.push(v));
  for (const v of L) {
    const d = Math.hypot(v.x - f.x, v.y - f.y); if (d < r0 - v.r || d > r1 + v.r) continue;
    const wa = (60 + v.r) / Math.max(1, d), del = (((f.th - Math.atan2(v.y - f.y, v.x - f.x)) % s) + s) % s;
    if (del > sw + wa && del < s - wa) continue;
    if (time - (f.hit.get(v.id) || -9) < .4) continue; f.hit.set(v.id, time);
    hurt(v, f.dmg, f.src, { push: 320, px: f.x, py: f.y }); sparks(v.x, v.y, 4, '#e8f0ff');
  }
  // le décor que balaient les lames est rasé
  if (W && !W.isBase) {
    let n = 0;
    for (let k = 0; k < f.n && n < 24; k++) for (const da of [0, -sw * .5]) {
      const a = f.th + k * s + da, ca = Math.cos(a), sa = Math.sin(a);
      for (let q = r0; q <= r1; q += 40) { const tx = ((f.x + ca * q) / TILE) | 0, ty = ((f.y + sa * q) / TILE) | 0; if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) continue; const o = W.obs[ty * WT + tx]; if (!o || o === 7) continue; if (o === 8) { hitBuildingTile(tx, ty, f.dmg * .3, f.team, f.src); continue; } xcGone(tx, ty, o, true); n++; }
    }
  }
}, null, null, (c, f) => {
  const u = f.u; if (!u) return;
  const R = f.R * (.55 + .45 * f.ramp), s = TAU / f.n, r0 = R - 220, r1 = R + 200, I = clamp(f.ramp * 1.6, 0, 1), det = 220 * cam.zoom > 14;
  c.globalAlpha = I;
  // flou de mouvement : un voile clair derrière chaque lame
  c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(200,225,255,.06)';
  for (let k = 0; k < f.n; k++) { const a = f.th + k * s; c.beginPath(); c.arc(f.x, f.y, r1, a - .22, a); c.arc(f.x, f.y, r0 + 60, a, a - .22, true); c.closePath(); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // attaches d'énergie
  c.strokeStyle = 'rgba(160,210,255,.35)'; c.lineWidth = xcLW(6, 1); c.beginPath();
  for (let k = 0; k < f.n; k++) { const a = f.th + k * s; c.moveTo(f.x + Math.cos(a) * u.r * .9, f.y + Math.sin(a) * u.r * .9); c.lineTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0); }
  c.stroke();
  for (let k = 0; k < f.n; k++) {
    const a = f.th + k * s;
    c.save(); c.translate(f.x, f.y); c.rotate(a);
    // lame en croissant : tranchant à l'avant (sens de rotation), dos recourbé
    const mid = (r0 + r1) / 2;
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.moveTo(r0 + 30, 10); c.quadraticCurveTo(mid + 30, 120, r1 + 30, 36); c.quadraticCurveTo(mid + 50, 10, r0 + 70, -10); c.closePath(); c.fill();
    c.fillStyle = '#b8bfc6'; c.beginPath(); c.moveTo(r0, -16); c.quadraticCurveTo(mid, 96, r1, 10); c.quadraticCurveTo(mid + 20, -30, r0 + 40, -48); c.closePath(); c.fill();
    c.fillStyle = '#6d757c'; c.beginPath(); c.moveTo(r0, -16); c.quadraticCurveTo(mid, 44, r1, 10); c.quadraticCurveTo(mid + 10, -22, r0 + 40, -48); c.closePath(); c.fill();
    c.strokeStyle = '#f4fcff'; c.lineWidth = xcLW(9, 1.5); c.beginPath(); c.moveTo(r0 + 10, 2); c.quadraticCurveTo(mid, 98, r1, 10); c.stroke();
    if (det) { c.strokeStyle = 'rgba(159,216,255,.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(r0 + 30, -14); c.quadraticCurveTo(mid, 30, r1 - 40, 6); c.stroke(); c.fillStyle = '#3a4246'; rr(c, r0 - 40, -34, 56, 50, 10); c.fill(); c.fillStyle = '#9fd8ff'; circ(c, r0 - 12, -9, 9); c.fill(); }
    c.restore();
  }
  c.globalAlpha = 1;
});

// ================= VOLCAN ARTIFICIEL =================
// un cône surgit au point visé et crache pendant 10 s quatre bombes de lave par seconde, à moins de 650 px, sur les ennemis au sol de préférence
W_FIRE.volcano = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 650, min: 4 }); if (!P) return false;
  const f = addZone('xc_volcano', P.x, P.y, 420, w.vt + 1.6, u.team, u, { dmg: w.dmg * diffDmg(u.team), splash: w.splash, burn: w.burn, sr: w.spreadR, nb: w.bombs, bt: .9, L: [], lt: 0, seed: Math.random() * 99, rise: 0, cold: 0 });
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  if (!NETVIS) { scarSprite('crack', P.x, P.y, 300, Math.random() * TAU); FX.dust(P.x, P.y, 8, 60, 260); }
  addShakeNear(P.x, P.y, 8); SFX.play('crush', .9, P.x, P.y, { size: 4 });
  return true;
};
xcZone('xc_volcano', (f, dt) => {
  const e = f.max - f.t; f.rise = clamp(e / .8, 0, 1); f.cold = clamp(1 - f.t / 1.6, 0, 1);
  if (e < .8 && !f.vis) { f.lt -= dt; if (f.lt <= 0) { f.lt = .2; xcRaze(f.x, f.y, 150 * f.rise + 40, 8, 0); } return; }
  if (!xcLow() && Math.random() < dt * 5) xcPart({ type: 'smoke', x: f.x + rnd(-30, 30), y: f.y + rnd(-30, 30), vx: rnd(-10, 10), vy: -rnd(30, 60), life: 3, max: 3, size: rnd(60, 110), col: '' });
  if (f.t < 1.6) return; // il s'éteint
  if (Math.random() < dt * 10) xcPart({ type: 'ember', x: f.x + rnd(-40, 40), y: f.y + rnd(-40, 40), vx: rnd(-60, 60), vy: -rnd(80, 200), life: rnd(.8, 1.6), max: 1.6, size: rnd(2, 4) });
  f.lt -= dt; if (f.lt <= 0) { f.lt = .5; f.L.length = 0; foesIn(f.x, f.y, f.sr, f.team, v => { if (f.L.length < 30) f.L.push(v); }, { air: false }); }
  f.bt -= dt; if (f.bt > 0) return; f.bt = rnd(.7, 1.3) / f.nb;
  let tx, ty; const v = f.L.length && Math.random() < .65 ? pick(f.L) : null;
  if (v && !v.dead) { tx = v.x + rnd(-50, 50) + v.vx * .6; ty = v.y + rnd(-50, 50) + v.vy * .6; } else { const a = Math.random() * TAU, d = (.25 + .75 * Math.sqrt(Math.random())) * f.sr; tx = f.x + Math.cos(a) * d; ty = f.y + Math.sin(a) * d; }
  const dd = Math.hypot(tx - f.x, ty - f.y); if (dd > f.sr) { tx = f.x + (tx - f.x) / dd * f.sr; ty = f.y + (ty - f.y) / dd * f.sr; }
  bullets.push({ kind: 'mortar', x: f.x, y: f.y - 30, x0: f.x, y0: f.y - 30, tx, ty, t: 0, T: .9 + dd / 800, arc: 280 + Math.random() * 200, dmg: f.dmg, team: f.team, splash: f.splash, col: '#ff7a20', src: f.src, h: 0, sc: 5, burn: f.burn, vis: f.vis });
  for (let k = 0; k < 4; k++) xcPart({ type: 'fire', x: f.x + rnd(-25, 25), y: f.y + rnd(-25, 25), vx: rnd(-80, 80), vy: -rnd(120, 260), life: rnd(.4, .8), max: .8, size: rnd(18, 34) });
  xcFlash(f.x, f.y, 160, .2, '#ffb060');
  SFX.play('mortar', .5, f.x, f.y, { size: 3 });
}, (c, f) => {
  const S = f.rise, R = 140 * (.4 + .6 * S), hot = 1 - f.cold, sd = f.seed, fl = .8 + .2 * Math.sin(time * 9 + sd);
  c.globalCompositeOperation = 'lighter';
  xcGlow(c, f.x, f.y, 420, [[0, `rgba(255,120,40,${(.32 * hot * S).toFixed(3)})`], [.5, `rgba(255,70,20,${(.1 * hot * S).toFixed(3)})`], [1, 'rgba(255,60,20,0)']]);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(f.x + R * .25, f.y + R * .3, R * 1.7, R * 1.5, 0, 0, TAU); c.fill();
  // cône de basalte : contour irrégulier, ombré (lumière en haut à gauche), arêtes qui descendent du cratère
  c.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, q = R * 1.65 * (.86 + hash2(k, 1, sd) * .22); k ? c.lineTo(f.x + Math.cos(a) * q, f.y + Math.sin(a) * q) : c.moveTo(f.x + Math.cos(a) * q, f.y + Math.sin(a) * q); } c.closePath();
  const gc = c.createRadialGradient(f.x - R * .35, f.y - R * .4, R * .2, f.x, f.y, R * 1.75); gc.addColorStop(0, '#6a5444'); gc.addColorStop(.45, '#3e3128'); gc.addColorStop(1, '#1e1916'); c.fillStyle = gc; c.fill();
  c.strokeStyle = 'rgba(20,14,10,.55)'; c.lineWidth = xcLW(R * .05, 1); c.beginPath();
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + hash2(k, 3, sd) * .3, q = R * 1.5 * (.8 + hash2(k, 5, sd) * .25); c.moveTo(f.x + Math.cos(a) * R * .5, f.y + Math.sin(a) * R * .5); c.quadraticCurveTo(f.x + Math.cos(a + .12) * q * .6, f.y + Math.sin(a + .12) * q * .6, f.x + Math.cos(a) * q, f.y + Math.sin(a) * q); }
  c.stroke();
  c.fillStyle = '#2a201a'; circ(c, f.x, f.y, R * .62); c.fill();
  // coulées de lave : une large lueur et un filet brillant
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let k = 0; k < 5; k++) {
    const a = hash2(k, 11, sd) * TAU, L = R * (1.35 + hash2(k, 13, sd) * .8) * S;
    c.beginPath(); c.moveTo(f.x + Math.cos(a) * R * .55, f.y + Math.sin(a) * R * .55);
    let px = f.x + Math.cos(a) * R * .55, py = f.y + Math.sin(a) * R * .55;
    for (let j = 1; j <= 4; j++) { const q = R * .55 + (L - R * .55) * j / 4, b = a + Math.sin(j * 1.3 + k * 2) * .09, nx = f.x + Math.cos(b) * q, ny = f.y + Math.sin(b) * q; c.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2); px = nx; py = ny; }
    c.lineTo(px, py);
    c.strokeStyle = `rgba(255,80,20,${(.35 * hot).toFixed(2)})`; c.lineWidth = xcLW(R * .13, 2); c.stroke();
    c.strokeStyle = `rgba(255,${(150 + 80 * hot) | 0},70,${(.8 * hot * fl).toFixed(2)})`; c.lineWidth = xcLW(R * .045, 1); c.stroke();
  }
  // cratère bouillonnant
  xcGlow(c, f.x, f.y, R * .5, [[0, `rgba(255,250,200,${hot.toFixed(2)})`], [.45, `rgba(255,170,50,${(.9 * hot).toFixed(2)})`], [1, `rgba(200,50,10,${(.6 * hot).toFixed(2)})`]]);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = 'rgba(40,20,14,.7)'; for (let k = 0; k < 4; k++) { const a = time * .4 + k * 1.6 + sd, q = R * .22; circ(c, f.x + Math.cos(a) * q, f.y + Math.sin(a) * q, R * (.06 + .03 * Math.sin(time * 2 + k))); c.fill(); }
  if (f.cold > 0) { c.fillStyle = `rgba(40,34,30,${(f.cold * .8).toFixed(2)})`; circ(c, f.x, f.y, R * .5); c.fill(); }
}, f => { if (!f.vis) { scarSprite('crater', f.x, f.y, 230, Math.random() * TAU); scarSprite('burn', f.x, f.y, 300, Math.random() * TAU); } });

// ================= ANCRE ORBITALE =================
// la cible est marquée 1,2 s (le marqueur la suit), puis une flèche orbitale s'y plante : explosion, cible clouée, cratère de verre
W_FIRE.anchor = (u, m, w, F) => {
  const P = xcPt(F.mx, F.my, F.tx, F.ty, w);
  const tg = !NETVIS && F.tgt && !F.tgt.dead && d2(F.tgt.x, F.tgt.y, P.x, P.y) < (F.tgt.r + 300) ** 2 ? F.tgt : null;
  const f = addZone('xc_anchor', P.x, P.y, 300, w.warn + w.pin + 1, u.team, u, { tgt: tg, warn: w.warn, pin: w.pin, dmg: w.dmg * diffDmg(u.team), splash: w.splash, hit: false, he: 0, a: Math.random() * TAU });
  xcSky(f, 2000); xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  if (!NETVIS && isMine(u)) SFX.play('lockon', .7);
  return true;
};
function anchorHit(f) {
  f.hit = true; f.he = f.max - f.t; f.t = Math.min(f.t, f.pin + .8);
  blast(f.x, f.y, f.splash, f.dmg, f.team, f.src);
  const t = f.tgt; if (t && !t.dead && !f.vis) t.stunT = Math.max(t.stunT || 0, time + (xcGiant(t) ? 1.5 : f.pin));
  if (!f.vis) { glassify(f.x, f.y, f.splash * .55); scarSprite('crater', f.x, f.y, f.splash * .9, Math.random() * TAU); }
  for (let k = 0; k < 3; k++) xcRing(f.x, f.y, f.splash * (1 + k * .5), .4 + k * .2, k ? '#ffd27a' : '#ffffff', k > 0);
  xcFlash(f.x, f.y, f.splash * 1.6, .3, '#fff0c0'); addShakeNear(f.x, f.y, 20); SFX.play('explo', 1, f.x, f.y, { size: 4 }); SFX.play('crush', .8, f.x, f.y, { size: 4 });
}
xcZone('xc_anchor', (f, dt) => {
  const e = f.max - f.t, t = f.tgt;
  if (!f.hit) { if (t && !t.dead && !t.hidden) { f.x = t.x; f.y = t.y; } if (e >= f.warn) anchorHit(f); return; }
  if (t && !t.dead && !f.vis && t.stunT > time && !t.static) { t.vx = 0; t.vy = 0; }
}, null, null, (c, f) => {
  const e = f.max - f.t, R = f.splash, x = f.x, y = f.y;
  if (!f.hit) {
    const k = clamp(e / f.warn, 0, 1), blink = .55 + .45 * Math.sin(time * (10 + k * 20));
    xcReticle(c, x, y, R * (1.25 - .35 * k), f.a + time * .8, `rgba(255,${(200 - 120 * k) | 0},80,${(.5 + .4 * blink).toFixed(2)})`, k);
    c.globalCompositeOperation = 'lighter';
    // trait de visée depuis l'orbite, puis la flèche qui descend
    const H = 2600, sx = x - .3 * H, sy = y - H; c.strokeStyle = `rgba(255,220,140,${(.15 + .45 * k).toFixed(2)})`; c.lineWidth = xcLW(4 + 10 * k, 1); c.beginPath(); c.moveTo(sx, sy); c.lineTo(x, y); c.stroke();
    c.globalCompositeOperation = 'source-over';
    const q = clamp((e - f.warn + .35) / .35, 0, 1);
    if (q > 0) { const ax = lerp(sx, x, q * q), ay = lerp(sy, y, q * q); c.save(); c.translate(ax, ay); c.rotate(Math.atan2(y - sy, x - sx)); c.fillStyle = '#fff4d0'; c.beginPath(); c.moveTo(70, 0); c.lineTo(-40, -22); c.lineTo(-170, -6); c.lineTo(-170, 6); c.lineTo(-40, 22); c.closePath(); c.fill(); c.globalCompositeOperation = 'lighter'; xcGlow(c, -120, 0, 120, [[0, 'rgba(255,220,140,.7)'], [1, 'rgba(255,160,60,0)']]); c.restore(); }
    return;
  }
  // flèche plantée : le fût dépasse du sol, ailettes en croix, runes qui pulsent ; liens d'énergie vers la cible clouée
  const he = e - f.he, I = clamp(f.t / .8, 0, 1), sh = 260, tx2 = x - .25 * sh, ty2 = y - .8 * sh, p = .6 + .4 * Math.sin(time * 6);
  c.globalAlpha = I;
  c.globalCompositeOperation = 'lighter'; xcGlow(c, x, y, R * 1.1, [[0, `rgba(255,220,130,${(.5 * p).toFixed(2)})`], [.5, 'rgba(255,170,60,.15)'], [1, 'rgba(255,140,40,0)']]); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = '#3a3226'; c.lineWidth = 58; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x, y); c.lineTo(tx2, ty2); c.stroke();
  c.strokeStyle = '#c9b48a'; c.lineWidth = 40; c.stroke(); c.strokeStyle = '#f2e2b8'; c.lineWidth = 12; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(tx2 - 8, ty2); c.stroke();
  c.save(); c.translate(tx2, ty2); c.rotate(.6);
  for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillStyle = k % 2 ? '#a8925f' : '#d8c48e'; c.beginPath(); c.moveTo(18, -16); c.lineTo(66, -9); c.lineTo(70, 0); c.lineTo(18, 9); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(22, 1, 44, 5); }
  c.fillStyle = '#5a4c34'; circ(c, 0, 0, 30); c.fill(); c.strokeStyle = '#f2e2b8'; c.lineWidth = 5; circ(c, 0, 0, 24); c.stroke(); c.fillStyle = `rgba(255,220,130,${p.toFixed(2)})`; circ(c, 0, 0, 12); c.fill(); c.restore();
  c.strokeStyle = `rgba(255,210,120,${(.6 * p).toFixed(2)})`; c.lineWidth = xcLW(8, 1.5); circ(c, x, y, 80 + (he * 140) % 120); c.stroke();
  const t = f.tgt; if (t && !t.dead && t.stunT > time) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,220,140,${(.7 * p).toFixed(2)})`; c.lineWidth = xcLW(6, 1.5); c.beginPath(); for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + time; c.moveTo(tx2, ty2); c.quadraticCurveTo(t.x + Math.cos(a) * t.r * 1.4, t.y + Math.sin(a) * t.r * 1.4 - 80, t.x + Math.cos(a) * t.r * .8, t.y + Math.sin(a) * t.r * .8); } c.stroke(); c.globalCompositeOperation = 'source-over'; }
  c.globalAlpha = 1; c.lineCap = 'round';
});

// ================= CRISTALLISEUR =================
// zone r 600 : les ennemis deviennent cristal 3 s (étourdis, palette violette), puis volent en éclats ; jusqu'à 12 cases
// de sol libre deviennent des cristaux à récolter
const XC_CRYPAL = { body: '#7a52b8', body2: '#4e3480', plate: '#c0a0ff', acc: '#f4e8ff', glow: 'rgba(214,180,255,', dark: '#2a1a48' };
W_FIRE.crystal = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 520, min: 5 }); if (!P) return false;
  addZone('xc_crystal', P.x, P.y, w.splash, w.vt + 1.2, u.team, u, { L: [], dmg: w.dmg * diffDmg(u.team), vt: w.vt, nt: w.tiles || 12, cap: 0, done: false, seed: Math.random() * 99 });
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
function xcUncry(v) { if (!v.xcCry) return; v.npal = v.xcPal; v.xcPal = undefined; v.xcCry = null; }
function crystalTiles(f) {
  if (!W || W.isBase || LIVE.game) return; // en ligne, les autres joueurs ne verraient pas ces obstacles
  let n = 0;
  for (let k = 0; k < 60 && n < f.nt; k++) {
    const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * f.r * .9, tx = ((f.x + Math.cos(a) * d) / TILE) | 0, ty = ((f.y + Math.sin(a) * d) / TILE) | 0;
    if (tx < 3 || ty < 3 || tx >= WT - 3 || ty >= WT - 3) continue; const i = ty * WT + tx;
    if (W.obs[i] || W.ground[i] === 7 || W.ground[i] === 3) continue;
    let busy = false; query(tx * TILE - 120, ty * TILE - 120, tx * TILE + 160, ty * TILE + 160, v => { if (!v.dead && d2(v.x, v.y, tx * TILE + 20, ty * TILE + 20) < (v.r + 34) ** 2) busy = true; });
    if (busy) continue;
    W.obs[i] = 4; W.ohp[i] = OBS[4].hp; miniSetTile(tx, ty); n++;
    for (let j = 0; j < 3; j++) xcPart({ type: 'shard', x: tx * TILE + 20, y: ty * TILE + 20, vx: rnd(-60, 60), vy: rnd(-60, 60), life: .6, max: .6, size: rnd(3, 6), rot: rnd(0, 6), col: '#d8b8ff' });
  }
}
function crystalShatter(f) {
  f.done = true; f.t = Math.min(f.t, 1.2);
  for (const v of f.L) {
    xcUncry(v); if (v.dead) continue;
    if (!f.vis) hurt(v, f.dmg + (xcGiant(v) ? 0 : v.maxhp * .2), f.src);
    const n = xcLow() ? 2 : Math.min(9, 3 + v.r / 20 | 0); for (let k = 0; k < n; k++) { const a = Math.random() * TAU, s = rnd(80, 260) + v.r; xcPart({ type: 'shard', x: v.x, y: v.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.5, 1), max: 1, size: rnd(3, 5 + v.r * .08), rot: rnd(0, 6), col: k % 2 ? '#c8a8ff' : '#f0e4ff' }); }
  }
  if (!f.vis) crystalTiles(f);
  xcRing(f.x, f.y, f.r, .5, '#e0c8ff'); xcRing(f.x, f.y, f.r * .6, .35, '#ffffff', true); xcFlash(f.x, f.y, f.r * .9, .25, '#e8d8ff');
  addShakeNear(f.x, f.y, 10); SFX.play('icecrack', 1, f.x, f.y, { size: 4 }); SFX.play('explo', .5, f.x, f.y, { size: 3 });
}
xcZone('xc_crystal', (f, dt) => {
  const e = f.max - f.t;
  if (f.done) return;
  if (e < .45) { f.cap -= dt; if (f.cap <= 0) { f.cap = .1; foesIn(f.x, f.y, f.r * clamp(e / .35 + .2, 0, 1), f.team, v => { if (v.xcCry || v.kind === 'building' || v.kind === 'beacon') return; v.xcCry = f; v.xcPal = v.npal; v.npal = XC_CRYPAL; f.L.push(v); if (!f.vis && xcGiant(v)) hurt(v, 0, f.src, { stun: f.vt }); }); } }
  if (!f.vis) for (const v of f.L) if (!v.dead && !xcGiant(v)) { v.stunT = Math.max(v.stunT || 0, time + .2); v.vx *= .3; v.vy *= .3; }
  if (e >= f.vt) crystalShatter(f);
}, (c, f) => {
  const e = f.max - f.t, G = clamp(e / .4, 0, 1), I = f.done ? clamp(f.t / 1.2, 0, 1) : 1, R = f.r * G, sd = f.seed;
  xcGlow(c, f.x, f.y, R, [[0, `rgba(200,150,255,${(.32 * I).toFixed(3)})`], [.85, `rgba(170,120,255,${(.18 * I).toFixed(3)})`], [1, 'rgba(170,120,255,0)']]);
  c.strokeStyle = `rgba(220,190,255,${(.5 * I).toFixed(2)})`; c.lineWidth = xcLW(4, 1.2); circ(c, f.x, f.y, R); c.stroke();
  if (f.done) return;
  for (let k = 0; k < 26; k++) {
    const a = hash2(k, 2, sd) * TAU, d = Math.sqrt(hash2(k, 4, sd)) * f.r * .95; if (d > R) continue;
    const x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d, s = (14 + hash2(k, 6, sd) * 30) * clamp((R - d) / 80, .2, 1), b = hash2(k, 8, sd) * TAU;
    c.fillStyle = k % 2 ? 'rgba(150,100,230,.8)' : 'rgba(200,160,255,.85)'; c.beginPath(); c.moveTo(x + Math.cos(b) * s, y + Math.sin(b) * s); c.lineTo(x + Math.cos(b + 2.4) * s * .45, y + Math.sin(b + 2.4) * s * .45); c.lineTo(x + Math.cos(b - 2.4) * s * .45, y + Math.sin(b - 2.4) * s * .45); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,245,255,.7)'; c.beginPath(); c.moveTo(x + Math.cos(b) * s, y + Math.sin(b) * s); c.lineTo(x + Math.cos(b + 2.4) * s * .2, y + Math.sin(b + 2.4) * s * .2); c.lineTo(x, y); c.closePath(); c.fill();
  }
  // gangue de cristal sur les unités prises
  for (const v of f.L) {
    if (v.dead || v.xcCry !== f) continue; const r = v.r * 1.18;
    c.fillStyle = 'rgba(190,150,255,.28)'; ngon(c, 6, r, v.id, v.x, v.y); c.fill(); c.strokeStyle = 'rgba(245,235,255,.75)'; c.lineWidth = xcLW(r * .05, 1); c.stroke();
    if ((time * 3 + v.id) % 1 < .25) { c.fillStyle = '#ffffff'; circ(c, v.x + Math.cos(v.id) * r * .5, v.y + Math.sin(v.id) * r * .5, xcLW(r * .06, 1.5)); c.fill(); }
  }
}, f => { for (const v of f.L) xcUncry(v); });

// ================= SENTINELLES ORBITALES =================
// trois capsules descendent autour de la cible (rétrofusées), puis deviennent des tourelles lourdes pour 20 s
W_FIRE.sentinels = (u, m, w, F) => {
  const P = xcPt(F.mx, F.my, F.tx, F.ty, w), k = xcK(m, w), a0 = Math.random() * TAU;
  for (let i = 0; i < 3; i++) {
    const a = a0 + i * TAU / 3; let x = P.x + Math.cos(a) * 300, y = P.y + Math.sin(a) * 300;
    const s = !NETVIS && findWalkableNear(x, y, 0, 180, 20); if (s) { x = s.x; y = s.y; }
    bullets.push({ kind: 'xc_pod', x, y, vx: 0, vy: 0, team: u.team, dmg: 0, src: u, t: 0, T: 1.3 + i * .25, k, life: w.life, vis: NETVIS, sky: 1, seed: i });
  }
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
B_KIND.xc_pod = { high: true,
  update(b, dt) {
    b.t += dt; const q = b.t / b.T;
    if (q > .55 && !xcLow() && Math.random() < dt * 30) xcPart({ type: 'smoke', x: b.x + rnd(-40, 40), y: b.y + rnd(-30, 30), vx: rnd(-80, 80), vy: rnd(-20, 40), life: 1, max: 1, size: rnd(30, 50), col: '' });
    if (q < 1) return false;
    const u = b.src;
    blast(b.x, b.y, 150, 1500 * b.k * diffDmg(b.team), b.team, u);
    xcRing(b.x, b.y, 220, .4, '#6fe3c8', true); FX.dust(b.x, b.y, 7, 50, 220); addShakeNear(b.x, b.y, 7); SFX.play('crush', .8, b.x, b.y, { size: 3 });
    if (!b.vis && u && !u.dead) { const t = deployUnit(u, b.x, b.y, { r: 40, hp: 30000, mounts: [['battle', .2, 0]], life: b.life, paint: '_sentinelle', static: true, sc: 1.6, dmgMul: .6 * b.k, sight: 3000, eng: 2700 }); if (t) { t.xcT0 = time; t.xcLife = b.life; t.ang = Math.random() * TAU; } }
    return true;
  },
  draw(c, b) {
    const q = clamp(b.t / b.T, 0, 1), h = (1 - q) * (1 - q) * 2600, x = b.x + h * .08, y = b.y - h;
    c.fillStyle = `rgba(0,0,0,${(.15 + .3 * q).toFixed(2)})`; c.beginPath(); c.ellipse(b.x, b.y, 30 + 40 * q, 20 + 26 * q, 0, 0, TAU); c.fill();
    xcReticle(c, b.x, b.y, 90, time * 2 + b.seed, 'rgba(111,227,200,.6)', q);
    const s = 1 + h / 2600 * .4;
    c.save(); c.translate(x, y); c.scale(s, s);
    if (q > .45) { c.globalCompositeOperation = 'lighter'; const L = 60 + 140 * (q - .45) * 2; const g = c.createLinearGradient(0, 30, 0, 30 + L); g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(.4, 'rgba(255,160,60,.6)'); g.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-22, 30); c.lineTo(22, 30); c.lineTo(10, 30 + L); c.lineTo(-10, 30 + L); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over'; }
    c.fillStyle = '#2f3a3c'; c.beginPath(); c.moveTo(0, -46); c.quadraticCurveTo(34, -30, 30, 26); c.lineTo(-30, 26); c.quadraticCurveTo(-34, -30, 0, -46); c.fill();
    c.fillStyle = '#4f6669'; c.beginPath(); c.moveTo(0, -40); c.quadraticCurveTo(22, -26, 18, 22); c.lineTo(-6, 22); c.quadraticCurveTo(-8, -26, 0, -40); c.fill();
    c.fillStyle = '#e0b030'; c.fillRect(-30, 8, 60, 6); c.fillStyle = '#1e1c18'; for (let k = -2; k <= 2; k++) c.fillRect(k * 12 - 3, 8, 5, 6);
    c.fillStyle = '#6fe3c8'; circ(c, 0, -14, 6); c.fill();
    c.restore();
  } };
// tourelle sentinelle : socle hexagonal blindé sur trois béquilles d'atterrissage, cœur lumineux et anneau de vie restante
CH_PAINT._sentinelle = (c, r, P, t, mv, u) => {
  c.fillStyle = 'rgba(10,8,6,.35)'; circ(c, 0, 0, r * 1.55); c.fill();
  c.strokeStyle = P.dark; c.lineWidth = r * .16; c.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .5, ca = Math.cos(a), sa = Math.sin(a); c.beginPath(); c.moveTo(ca * r * .6, sa * r * .6); c.lineTo(ca * r * 1.32, sa * r * 1.32); c.stroke(); }
  c.fillStyle = P.body2; for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .5; circ(c, Math.cos(a) * r * 1.34, Math.sin(a) * r * 1.34, r * .17); c.fill(); }
  c.fillStyle = P.dark; ngon(c, 6, r * 1.02, Math.PI / 6); c.fill();
  c.fillStyle = P.body; ngon(c, 6, r * .9, Math.PI / 6); c.fill();
  c.strokeStyle = P.plate; c.lineWidth = r * .07; ngon(c, 6, r * .72, Math.PI / 6); c.stroke();
  if (r * cam.zoom > 10) { c.fillStyle = '#e0b030'; for (let k = 0; k < 6; k++) { const a = k * TAU / 6; c.save(); c.rotate(a); c.fillRect(r * .76, -r * .1, r * .1, r * .2); c.restore(); } }
  const p = .6 + .4 * Math.sin(t * 2); c.fillStyle = P.glow + (.5 + .4 * p).toFixed(2) + ')'; circ(c, -r * .35, 0, r * .2); c.fill();
  if (u && u.xcLife) { const k = clamp(1 - (time - u.xcT0) / u.xcLife, 0, 1); c.strokeStyle = P.acc; c.lineWidth = r * .08; c.beginPath(); c.arc(0, 0, r * 1.14, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); }
};

// ================= LANCE D'ÉTOILE =================
// affût continu : charge 2,5 s, puis rayon de 260 px de large pendant 8 s qui suit lentement la cible (0,25 rad/s), creuse le
// décor (sauf les falaises) ; recharge 20 s. État sur la monture : m.xcS (0 prête, 1 charge, 2 tir), m.xcT, m.xcO (dessin)
const sbMuzzle = (m, u) => 64 * (m.ds || u.mscale || 1);
function sbEnd(u, m, w) { m.xcS = 0; m.chg = 0; m.cd = (w.reload || 20) / (u.rateMul || 1); if (m.xcO) m.xcO.t = 0; m.xcO = null; }
function sbGeom(o, mx, my, a, L0, range, half) {
  const ca = Math.cos(a), sa = Math.sin(a), sx = mx + ca * L0, sy = my + sa * L0; let len = range;
  if (ca > 1e-6) len = Math.min(len, (WPX - sx) / ca); else if (ca < -1e-6) len = Math.min(len, -sx / ca);
  if (sa > 1e-6) len = Math.min(len, (WPX - sy) / sa); else if (sa < -1e-6) len = Math.min(len, -sy / sa);
  len = Math.max(0, len); o.sx = sx; o.sy = sy; o.ex = sx + ca * len; o.ey = sy + sa * len; o.x = (sx + o.ex) / 2; o.y = (sy + o.ey) / 2; o.len = len; o.hw = half;
  return o;
}
W_TICK.starbeam = (u, m, dt, mx, my) => {
  const w = m.w, man = xcMan(u, m);
  if (u.stunT > time) { if (m.xcS === 1) { m.xcS = 0; m.chg = 0; } else if (m.xcS === 2) sbEnd(u, m, w); return true; }
  let ta = null, want = false;
  if (man) { ta = Math.atan2(mouse.wy - my, mouse.wx - mx); want = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire); }
  else {
    m.xcTT = (m.xcTT || 0) - dt; let t = m.xcTg;
    if (t && (t.dead || t.hidden || d2(t.x, t.y, mx, my) > (w.range + t.r) ** 2)) t = m.xcTg = null;
    if (!t || m.xcTT <= 0) { m.xcTT = .5; const base = !u.piloted && u.target && !u.target.dead && !u.target.hidden && d2(u.target.x, u.target.y, mx, my) < w.range * w.range ? u.target : null; t = m.xcTg = pickMountTarget(u, m, base, w.range + 60) || t; }
    if (t) { ta = Math.atan2(t.y - my, t.x - mx); want = true; }
  }
  if (m.xcS === 2) {
    if (ta !== null) m.aim = turnTo(m.aim, ta, (man ? .4 : .25) * dt);
    m.xcT -= dt; sbTick(u, m, w, dt, mx, my); if (m.xcT <= 0) sbEnd(u, m, w);
    return true;
  }
  if (ta !== null) m.aim = turnTo(m.aim, ta, .65 * (u.piloted ? 1.6 : 1) * (w.turnMul || 1) * dt);
  if (m.xcS === 1) {
    m.xcT -= dt; m.chg = Math.max(.001, m.xcT);
    const L0 = sbMuzzle(m, u), sx = mx + Math.cos(m.aim) * L0, sy = my + Math.sin(m.aim) * L0, k = 1 - m.xcT / w.charge;
    if (!xcLow() && Math.random() < dt * 30) { const a = Math.random() * TAU, d = L0 * rnd(.5, 1.1); xcPart({ type: 'spark', x: sx + Math.cos(a) * d, y: sy + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.5, vy: -Math.sin(a) * d * 2.5, life: .35, max: .35, size: 2 + k * 3, col: '#fff2a8' }); }
    if ((m.xcF = (m.xcF || 0) - dt) <= 0) { m.xcF = .1; xcFlash(sx, sy, L0 * (.4 + k * 1.2), .14, '#fff2c0'); }
    if (m.xcT <= 0) {
      m.xcS = 2; m.xcT = w.dur; m.chg = 0; m.xcK = 0;
      m.xcO = sbGeom({ zk: 'xc_star', t: w.dur, max: w.dur, team: u.team }, mx, my, m.aim, L0, w.range, w.width / 2); xcSky(m.xcO, w.range / 2 + w.width);
      SFX.play('fusion', 1, sx, sy, { size: 7 }); addShakeNear(sx, sy, 14); if (u.piloted && !u.net) buzz([40, 30, 80]);
    }
    return true;
  }
  if (want && m.cd <= 0 && ta !== null && Math.abs(angDiff(m.aim, ta)) < .2) { m.xcS = 1; m.xcT = w.charge; m.chg = w.charge; SFX.play('charge', 1, mx, my, { size: 7 }); }
  return true;
};
function sbTick(u, m, w, dt, mx, my) {
  const o = sbGeom(m.xcO, mx, my, m.aim, sbMuzzle(m, u), w.range, w.width / 2); o.t = Math.max(.01, m.xcT);
  SFX.hold('sb' + u.id + '_' + u.mounts.indexOf(m), 'beam', u.piloted ? 1 : .7, o.sx, o.sy);
  m.recoil = .5; u.lastFire = time;
  m.xcK -= dt; if (m.xcK > 0) return; m.xcK = .1;
  m.fc = ((m.fc || 0) + 1) & 255; m.td = Math.round(o.len + sbMuzzle(m, u));
  const R = o.hw, ca = Math.cos(m.aim), sa = Math.sin(m.aim), dmg = w.dmg * .1 * diffDmg(u.team), sx = o.sx, sy = o.sy, ex = o.ex, ey = o.ey, len = o.len, H = [];
  query(Math.min(sx, ex) - R - 200, Math.min(sy, ey) - R - 200, Math.max(sx, ex) + R + 200, Math.max(sy, ey) + R + 200, v => {
    if (v.team === u.team || v.dead || v.hidden || v.etype === 'cible' || (u.team === 0 && v.team === 0)) return;
    const px = v.x - sx, py = v.y - sy, pr = clamp(px * ca + py * sa, 0, len), qx = sx + ca * pr - v.x, qy = sy + sa * pr - v.y;
    if (qx * qx + qy * qy < (v.r + R) ** 2) H.push(v);
  });
  for (const v of H) hurt(v, dmg, u);
  if (W && !W.isBase) {
    let n = 0; const nx = -sa, ny = ca;
    outer: for (let s = 0; s < len; s += 40) for (let q = -R; q <= R; q += 40) {
      const tx = ((sx + ca * s + nx * q) / TILE) | 0, ty = ((sy + sa * s + ny * q) / TILE) | 0; if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) continue;
      const ob = W.obs[ty * WT + tx]; if (!ob || ob === 7) continue;
      if (ob === 8) { hitBuildingTile(tx, ty, dmg * .5, u.team, u); continue; }
      xcGone(tx, ty, ob, false); if (++n >= 16) break outer;
    }
    const s = Math.random() * len; scarSprite('burn', sx + ca * s, sy + sa * s, R * 1.1, Math.random() * TAU);
    if ((m.xcG = (m.xcG || 0) + 1) % 10 === 0) glassify(ex, ey, R * .7);
  }
  xcFlash(ex, ey, R * 2, .15, '#fff2c0'); xcFlash(lerp(sx, ex, .5), lerp(sy, ey, .5), R * 1.6, .15, '#fff2c0');
  if (!xcLow()) for (let k = 0; k < 3; k++) xcPart({ type: 'fire', x: ex + rnd(-R, R), y: ey + rnd(-R, R), vx: rnd(-90, 90), vy: rnd(-90, 90), life: .5, max: .5, size: rnd(R * .2, R * .45) });
}
// reproduction réseau : un trait bref à chaque signal (toutes les 0,1 s)
W_FIRE.starbeam = (u, m, w, F) => {
  if (!NETVIS) return false;
  const o = sbGeom({ zk: 'xc_star', t: .17, max: w.dur, team: u.team, self: 1 }, F.mx, F.my, F.a, sbMuzzle(m, u), Math.max(200, Math.hypot(F.tx - F.mx, F.ty - F.my) - sbMuzzle(m, u)), w.width / 2);
  xcSky(o, w.range / 2 + w.width); xcFlash(o.ex, o.ey, o.hw * 2, .15, '#fff2c0'); SFX.hold('sb' + u.id + '_' + u.mounts.indexOf(m), 'beam', .6, o.sx, o.sy);
  return true;
};
XSKY.xc_star = (c, o) => {
  const I = o.self ? 1 : clamp((o.max - o.t) / .25, 0, 1) * clamp(o.t / .35, 0, 1), R = o.hw, fl = .92 + .08 * Math.sin(time * 41);
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  c.beginPath(); c.moveTo(o.sx, o.sy); c.lineTo(o.ex, o.ey);
  c.strokeStyle = `rgba(255,190,80,${(.16 * I).toFixed(3)})`; c.lineWidth = R * 2.8; c.stroke();
  c.strokeStyle = `rgba(255,232,150,${(.42 * I * fl).toFixed(3)})`; c.lineWidth = R * 2; c.stroke();
  c.strokeStyle = `rgba(255,255,236,${(.9 * I).toFixed(2)})`; c.lineWidth = R * .85; c.stroke();
  c.setLineDash([R * 1.6, R * 2.6]); c.lineDashOffset = -time * 2600; c.strokeStyle = `rgba(255,255,255,${(.5 * I).toFixed(2)})`; c.lineWidth = R * .5; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
  xcGlow(c, o.sx, o.sy, R * 1.8, [[0, `rgba(255,255,240,${I.toFixed(2)})`], [.4, `rgba(255,230,140,${(.6 * I).toFixed(2)})`], [1, 'rgba(255,190,80,0)']]);
  xcGlow(c, o.ex, o.ey, R * 2.4, [[0, `rgba(255,255,240,${I.toFixed(2)})`], [.35, `rgba(255,200,90,${(.6 * I).toFixed(2)})`], [1, 'rgba(255,120,40,0)']]);
  c.globalCompositeOperation = 'source-over';
};

// ================= EFFONDREUR =================
// zone r 900 : 2,5 s d'alerte (le sol se fissure), puis un gouffre de 8 s : 6 000 dps et ralentissement aux ennemis au sol
// (moins pour les géants), le décor s'effondre de proche en proche, immense cratère
W_FIRE.collapse = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 800, val: v => v.fly ? 0 : xcVal(v), min: 6 }); if (!P) return false;
  addZone('xc_collapse', P.x, P.y, w.splash, w.warn + w.vt + 1.5, u.team, u, { warn: w.warn, vt: w.vt, dps: w.dmg * diffDmg(u.team), ck: 0, open: false, RL: null, seed: Math.random() * 99, n: 0 });
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
xcZone('xc_collapse', (f, dt) => {
  const e = f.max - f.t;
  if (e < f.warn) {
    f.ck -= dt; if (f.ck > 0) return; f.ck = .3; addShakeNear(f.x, f.y, 2 + e * 2);
    if (!f.vis && Math.random() < .7) scarSprite('crack', f.x + rnd(-1, 1) * f.r * .6, f.y + rnd(-1, 1) * f.r * .6, f.r * .3, Math.random() * TAU);
    if (!xcLow()) FX.dust(f.x + rnd(-1, 1) * f.r * .5, f.y + rnd(-1, 1) * f.r * .5, 3, 40, 160);
    if (e > f.warn - .35) SFX.play('creak', .8, f.x, f.y, { size: 4 });
    return;
  }
  if (!f.open) {
    f.open = true; f.ck = 0; addShakeNear(f.x, f.y, 24); SFX.play('farboom', 1, f.x, f.y, { size: 5 }); SFX.play('crush', 1, f.x, f.y, { size: 5 }); FX.dust(f.x, f.y, 9, f.r * .3, f.r);
    xcRing(f.x, f.y, f.r * 1.1, .7, '#ffb070');
    if (!f.vis && W && !W.isBase) { scarSprite('crater', f.x, f.y, f.r * 1.05, Math.random() * TAU); const RL = []; xcTiles(f.x, f.y, f.r, (tx, ty, o) => { if (o < 7) RL.push([d2(tx * TILE + 20, ty * TILE + 20, f.x, f.y), ty * WT + tx]); }); RL.sort((a, b) => b[0] - a[0]); f.RL = RL; }
  }
  // le décor s'effondre du centre vers le bord
  if (f.RL && f.RL.length) for (let n = 0; n < 24 && f.RL.length; n++) { const i = f.RL.pop()[1], o = W.obs[i]; if (o && o < 7) xcGone(i % WT, (i / WT) | 0, o, false); }
  if (e > f.warn + f.vt) return; // il se referme
  f.ck -= dt; if (f.ck > 0) return; f.ck = .25;
  if (!xcLow()) for (let k = 0; k < 3; k++) { const a = Math.random() * TAU, d = f.r * rnd(.6, .95); xcPart({ type: 'debris', x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vx: -Math.cos(a) * 160, vy: -Math.sin(a) * 160, life: 1, max: 1, size: rnd(5, 12), col: '#4a443c', rot: 0 }); }
  if (f.vis) return;
  const L = []; foesIn(f.x, f.y, f.r, f.team, v => L.push(v), { air: false });
  for (const v of L) {
    const big = xcGiant(v); hurt(v, f.dps * .25, f.src, { slow: big ? .35 : .7 });
    if (!big && !v.static && !v.dead && v.kind !== 'building') { const dx = f.x - v.x, dy = f.y - v.y, d = Math.hypot(dx, dy) || 1; v.vx += dx / d * 70; v.vy += dy / d * 70; }
  }
}, (c, f) => {
  const e = f.max - f.t, sd = f.seed, R = f.r;
  if (e < f.warn) {
    const k = clamp(e / f.warn, 0, 1), bl = .5 + .5 * Math.sin(time * (8 + k * 14));
    c.strokeStyle = `rgba(255,90,40,${(.3 + .4 * bl).toFixed(2)})`; c.lineWidth = xcLW(8, 2); c.setLineDash([xcLW(40, 8), xcLW(30, 6)]); c.lineDashOffset = time * 90; circ(c, f.x, f.y, R); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    c.lineCap = 'round';
    for (let j = 0; j < 9; j++) {
      let a = hash2(j, 1, sd) * TAU, x = f.x, y = f.y; const L = R * (.35 + .6 * hash2(j, 2, sd)) * k, st = L / 6;
      c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 6; s++) { a += (hash2(j, s + 3, sd) - .5) * .9; x += Math.cos(a) * st; y += Math.sin(a) * st; c.lineTo(x, y); }
      c.strokeStyle = 'rgba(12,8,6,.85)'; c.lineWidth = xcLW(18 * (1 - k * .3), 2); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,120,40,${(.35 + .5 * k).toFixed(2)})`; c.lineWidth = xcLW(6, 1); c.stroke(); c.globalCompositeOperation = 'source-over';
    }
    return;
  }
  // le gouffre (il s'ouvre en 0,5 s, se referme à la fin)
  const op = clamp((e - f.warn) / .5, 0, 1) * clamp(f.t / 1.5, 0, 1), RR = R * (.15 + .85 * op);
  c.fillStyle = 'rgba(0,0,0,.3)'; circ(c, f.x, f.y, RR * 1.1); c.fill();
  const edge = (k0, sc) => { c.beginPath(); for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, q = RR * sc * (.9 + hash2(k, k0, sd) * .1); k ? c.lineTo(f.x + Math.cos(a) * q, f.y + Math.sin(a) * q) : c.moveTo(f.x + Math.cos(a) * q, f.y + Math.sin(a) * q); } c.closePath(); };
  // lèvre de gravats, puis la paroi qui plonge dans le noir
  edge(7, 1); c.fillStyle = '#3e352c'; c.fill(); c.strokeStyle = '#1a1410'; c.lineWidth = xcLW(RR * .015, 1); c.stroke();
  edge(8, .86); const g = c.createRadialGradient(f.x - RR * .08, f.y - RR * .1, 0, f.x, f.y, RR * .86); g.addColorStop(0, '#000000'); g.addColorStop(.6, '#0a0605'); g.addColorStop(.88, '#241a14'); g.addColorStop(1, '#4a3e32'); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(210,190,160,.3)'; c.lineWidth = xcLW(RR * .02, 1.5); c.beginPath(); c.arc(f.x, f.y, RR * .9, Math.PI * .95, Math.PI * 1.55); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(f.x, f.y, RR * .88, -.1, Math.PI * .5); c.stroke();
  c.globalCompositeOperation = 'lighter'; xcGlow(c, f.x, f.y, RR * .55, [[0, `rgba(255,110,30,${(.45 * op).toFixed(2)})`], [1, 'rgba(255,60,10,0)']]); c.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 16; k++) { const q = (time * .25 + k / 16) % 1, a = hash2(k, 9, sd) * TAU + time * .5 + q * 2, d = RR * .9 * (1 - q), s = (6 + hash2(k, 11, sd) * 18) * (1 - q * .7); c.fillStyle = `rgba(90,80,68,${(1 - q).toFixed(2)})`; c.fillRect(f.x + Math.cos(a) * d - s / 2, f.y + Math.sin(a) * d - s / 2, s, s); }
});

// ================= OURAGAN =================
// tempête (r 1100, 12 s) qui avance à 90 px/s vers les ennemis : 2 000 dps (volants ×2), aspiration vers l'œil, 3 éclairs par seconde
W_FIRE.hurricane = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 900, min: 6, val: v => xcVal(v) * (v.fly ? 2 : 1) }); if (!P) return false;
  const f = addZone('xc_storm', P.x, P.y, 40, w.vt, u.team, u, { R: w.splash, dps: w.dmg * diffDmg(u.team), bolt: w.bolt * diffDmg(u.team), nb: w.bolts, mv: w.move, gx: P.x, gy: P.y, ck: 0, bt: .3, gt: 0, L: [], rot: Math.random() * TAU, ramp: 0, seed: Math.random() * 99, id: ++xcN });
  xcSky(f, w.splash * 1.25); xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
function stormBolt(f) {
  let x, y; const v = f.L.length && Math.random() < .85 ? pick(f.L) : null;
  if (v && !v.dead && d2(v.x, v.y, f.x, f.y) < (f.R + v.r) ** 2) { x = v.x + rnd(-.3, .3) * v.r; y = v.y + rnd(-.3, .3) * v.r; if (!f.vis) hurt(v, f.bolt, f.src, { stun: .25 }); }
  else { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * f.R * .9; x = f.x + Math.cos(a) * d; y = f.y + Math.sin(a) * d; }
  const w = xcLW(9, 2.2); beams.push({ pts: zig(x - 280, y - 1500, x, y, 10, 90), life: .24, max: .24, col: '#e4f4ff', w });
  if (Math.random() < .6) { const a = Math.random() * TAU; beams.push({ pts: zig(x - 140, y - 750, x + Math.cos(a) * 260, y + Math.sin(a) * 260, 6, 50), life: .16, max: .16, col: '#bfe6ff', w: w * .6 }); }
  xcFlash(x, y, 300, .22, '#eaf6ff'); xcRing(x, y, 120, .25, '#dff2ff', true); sparks(x, y, 5, '#dff2ff');
  if (!f.vis) { scarSprite('scorch', x, y, 60, Math.random() * TAU); const tx = (x / TILE) | 0, ty = (y / TILE) | 0; if (W && tx >= 0 && ty >= 0 && tx < WT && ty < WT && W.obs[ty * WT + tx] && W.obs[ty * WT + tx] < 7) hitTile(tx, ty, 400); }
  SFX.play('thunder', .8, x, y, { size: 3 });
}
xcZone('xc_storm', (f, dt) => {
  const e = f.max - f.t; f.ramp = clamp(e / 1.2, 0, 1) * clamp(f.t / 1.5, 0, 1); f.rot += dt * (.5 + .5 * f.ramp);
  f.gt -= dt; if (f.gt <= 0) { f.gt = 1; const t = nearestFoe(f.x, f.y, f.R * 2.2, f.team); if (t) { f.gx = t.x; f.gy = t.y; } }
  const dx = f.gx - f.x, dy = f.gy - f.y, d = Math.hypot(dx, dy); if (d > 40) { f.x = clamp(f.x + dx / d * f.mv * dt, 0, WPX); f.y = clamp(f.y + dy / d * f.mv * dt, 0, WPX); }
  if (!xcLow() && Math.random() < dt * 6) { const a = Math.random() * TAU, q = f.R * rnd(.3, .95); xcPart({ type: 'dust', x: f.x + Math.cos(a) * q, y: f.y + Math.sin(a) * q, vx: -Math.sin(a) * 260, vy: Math.cos(a) * 260, life: 1.2, max: 1.2, size: rnd(30, 60), rgb: '120,128,136' }); }
  if (f.ramp > .4) { f.bt -= dt; while (f.bt <= 0) { f.bt += 1 / f.nb * rnd(.6, 1.4); stormBolt(f); } }
  f.ck -= dt; if (f.ck > 0) return; f.ck = .25;
  f.L.length = 0; foesIn(f.x, f.y, f.R, f.team, v => { if (v.kind !== 'beacon') f.L.push(v); });
  if (f.vis) return;
  for (const v of f.L) {
    const ox = f.x - v.x, oy = f.y - v.y, dd = Math.hypot(ox, oy) || 1; hurt(v, f.dps * .25 * (v.fly ? 2 : 1) * f.ramp, f.src);
    if (v.dead || v.static || v.kind === 'building' || xcGiant(v)) continue;
    const k = (v.fly ? 300 : 180) * clamp(28 / (v.r + 14), .05, 1) * f.ramp, nx = ox / dd, ny = oy / dd; v.vx += (nx * .8 - ny * .6) * k; v.vy += (ny * .8 + nx * .6) * k;
  }
}, null, null, (c, f) => {
  const R = f.R, I = f.ramp, x = f.x, y = f.y, sd = f.seed, det = !xcLow();
  xcGlow(c, x, y, R * 1.08, [[0, `rgba(8,12,20,${(.15 * I).toFixed(3)})`], [.6, `rgba(10,14,22,${(.34 * I).toFixed(3)})`], [1, 'rgba(10,14,22,0)']]);
  c.lineCap = 'round';
  // bras de nuages en spirale : rubans effilés aux deux bouts, ombre portée en bas à droite, puis le nuage clair
  const XS = [], YS = [];
  for (let pass = 0; pass < 3; pass++) for (let k = 0; k < 4; k++) {
    const ox = pass === 0 ? R * .05 : 0, oy = pass === 0 ? R * .07 : 0, rot = f.rot * (pass === 2 ? 1.1 : 1) + k * Math.PI / 2 + (pass === 2 ? .25 : 0), W0 = R * (pass === 2 ? .1 : .2);
    XS.length = YS.length = 0;
    for (let j = 0; j <= 16; j++) { const q = j / 16, rr2 = R * (.12 + .9 * q), an = rot + q * 2.4; XS.push(x + ox + Math.cos(an) * rr2); YS.push(y + oy + Math.sin(an) * rr2); }
    c.beginPath();
    for (let side = 1; side >= -1; side -= 2) for (let jj = 0; jj <= 16; jj++) {
      const j = side > 0 ? jj : 16 - jj, j0 = Math.max(0, j - 1), j1 = Math.min(16, j + 1), tx = XS[j1] - XS[j0], ty = YS[j1] - YS[j0], tl = Math.hypot(tx, ty) || 1, q = j / 16, w = W0 * Math.sin(Math.PI * Math.min(1, .04 + q * 1.1)) * (.4 + .8 * q) * side;
      const px = XS[j] - ty / tl * w, py = YS[j] + tx / tl * w;
      if (side > 0 && jj === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fillStyle = pass === 0 ? `rgba(0,0,0,${(.15 * I).toFixed(3)})` : pass === 1 ? `rgba(150,160,176,${(.32 * I).toFixed(3)})` : `rgba(232,238,246,${(.3 * I).toFixed(3)})`; c.fill();
  }
  // nuages bourgeonnants le long des bras
  const cs = glowSprite('#e4e9f0');
  for (let k = 0; k < 22; k++) { const q = hash2(k, 1, sd), a = f.rot + (k % 4) * Math.PI / 2 + q * 2.4 + .15, d = R * (.13 + .9 * q), r2 = R * (.12 + .12 * hash2(k, 2, sd)) * (.5 + q); c.globalAlpha = .55 * I * Math.sin(Math.PI * Math.min(1, q * 1.15)); c.drawImage(cs, x + Math.cos(a) * d - r2, y + Math.sin(a) * d - r2, r2 * 2, r2 * 2); }
  c.globalAlpha = 1; c.lineCap = 'round';
  // œil et mur de l'œil
  c.strokeStyle = `rgba(225,232,242,${(.3 * I).toFixed(2)})`; c.lineWidth = R * .06; circ(c, x, y, R * .14); c.stroke(); c.strokeStyle = `rgba(255,255,255,${(.25 * I).toFixed(2)})`; c.lineWidth = R * .015; circ(c, x, y, R * .11); c.stroke();
  if (det) { // pluie et débris
    c.strokeStyle = `rgba(180,210,240,${(.35 * I).toFixed(2)})`; c.lineWidth = xcLW(2.5, 1); c.beginPath();
    for (let k = 0; k < 60; k++) { const a = hash2(k, 3, sd) * TAU, d = Math.sqrt(hash2(k, 4, sd)) * R, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + ((time * 900 + k * 97) % 160) - 80; c.moveTo(px, py); c.lineTo(px - 14, py + 40); }
    c.stroke(); c.fillStyle = `rgba(40,36,32,${(.7 * I).toFixed(2)})`;
    for (let k = 0; k < 10; k++) { const a = f.rot * 2.2 + k * .63, d = R * (.25 + .07 * k); c.fillRect(x + Math.cos(a) * d - 6, y + Math.sin(a) * d - 6, 12, 12); }
  }
});

// ================= LANCEUR DE LUNE =================
// un rocher sphérique colossal (r 200) tiré en cloche : impact 30 000 (rayon 400), puis il roule 1 800 px dans l'axe du tir en
// ralentissant, écrase chaque unité une fois (25 000) et rase le décor ; il s'arrête contre une falaise ou un bâtiment
W_FIRE.boulder = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 400 }); if (!P) return false;
  const L = 62 * F.sc, sx = F.mx + Math.cos(P.a) * L, sy = F.my + Math.sin(P.a) * L, k = xcK(m, w);
  bullets.push({ kind: 'boulder', x: sx, y: sy, x0: sx, y0: sy, tx: P.x, ty: P.y, t: 0, T: 1.4 + P.d / 1600, h: 0, arc: 900 + P.d * .15, ph: 0, a: P.a, vx: 0, vy: 0, team: u.team, src: u, dmg: w.dmg * diffDmg(u.team), crush: w.crush * k * diffDmg(u.team), splash: w.splash, br: w.br, roll: w.roll, sp: 0, dec: 0, rot: 0, hits: null, gk: 0, sk: 0, wh: false, vis: NETVIS, seed: Math.random() * 99 });
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  xcFlash(sx, sy, 60 * F.sc, .2, '#ffe0a0'); for (let i = 0; i < 6; i++) xcPart({ type: 'smoke', x: sx, y: sy, vx: Math.cos(P.a + rnd(-.6, .6)) * rnd(60, 160), vy: Math.sin(P.a + rnd(-.6, .6)) * rnd(60, 160), life: 1.6, max: 1.6, size: rnd(40, 80), col: '' });
  addShakeNear(sx, sy, 10);
  return true;
};
function boulderStop(b) {
  for (let k = 0; k < (xcLow() ? 6 : 18); k++) { const a = Math.random() * TAU, s = rnd(60, 320); xcPart({ type: 'shard', x: b.x + Math.cos(a) * b.br * .5, y: b.y + Math.sin(a) * b.br * .5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.6, 1.2), max: 1.2, size: rnd(6, 16), rot: rnd(0, 6), col: k % 2 ? '#8a8270' : '#5f574b' }); }
  FX.dust(b.x, b.y, 9, b.br * .5, b.br * 1.6); if (!b.vis) scarSprite('crater', b.x, b.y, b.br * .9, Math.random() * TAU);
  addShakeNear(b.x, b.y, 10); SFX.play('crush', 1, b.x, b.y, { size: 5 });
}
B_KIND.boulder = { high: true,
  update(b, dt) {
    if (b.ph === 0) {
      b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc; b.rot += dt * 1.2;
      if (!b.wh && b.T - b.t < 1.1) { b.wh = true; SFX.play('whistle', 1, b.tx, b.ty, { dur: Math.max(.3, b.T - b.t), pitch: .5 }); }
      if (k < 1) return false;
      blast(b.x, b.y, b.splash, b.dmg, b.team, b.src);
      for (let i = 0; i < 3; i++) xcRing(b.x, b.y, b.splash * (1 + i * .5), .45 + i * .2, i ? '#e8dcc4' : '#ffffff', i > 0);
      FX.dust(b.x, b.y, 9, b.br * .6, b.splash * 1.5); addShakeNear(b.x, b.y, 26); SFX.play('farboom', 1, b.x, b.y, { size: 5 });
      if (!b.vis) { scarSprite('crater', b.x, b.y, b.splash, Math.random() * TAU); xcRaze(b.x, b.y, b.br * 1.1, 80, 4000, b.team, b.src); }
      b.ph = 1; b.h = 0; b.sp = 2 * b.roll / 4; b.dec = b.sp * b.sp / (2 * b.roll); b.hits = new Set();
      return false;
    }
    b.sp -= b.dec * dt; if (b.sp <= 25) { boulderStop(b); return true; }
    const ca = Math.cos(b.a), sa = Math.sin(b.a), ds = b.sp * dt; b.x += ca * ds; b.y += sa * ds; b.rot += ds / b.br;
    if (b.x < b.br || b.y < b.br || b.x > WPX - b.br || b.y > WPX - b.br) { boulderStop(b); return true; }
    if (!xcLow() && Math.random() < dt * 14) xcPart({ type: 'dust', x: b.x - ca * b.br + rnd(-60, 60), y: b.y - sa * b.br + rnd(-60, 60), vx: rnd(-30, 30), vy: rnd(-30, 30), life: 1.4, max: 1.4, size: rnd(50, 90), rgb: '110,102,92' });
    b.gk -= ds; if (b.gk > 0) return false; b.gk = 40;
    let stop = false;
    if (W) xcTiles(b.x + ca * b.br * .5, b.y + sa * b.br * .5, b.br * .85, (tx, ty, o) => { if (o === 7) { stop = true; return false; } if (o === 8) { if (!b.vis) hitBuildingTile(tx, ty, b.crush * .3, b.team, b.src); stop = true; return false; } if (!b.vis && !W.isBase) xcGone(tx, ty, o, true); });
    if (!b.vis) { const L = []; foesIn(b.x, b.y, b.br, b.team, v => { if (!b.hits.has(v.id)) L.push(v); }); for (const v of L) { b.hits.add(v.id); hurt(v, b.crush, b.src, { push: 500, px: b.x - ca * b.br, py: b.y - sa * b.br }); if (xcGiant(v)) b.sp *= .6; sparks(v.x, v.y, 6, '#e8dcc4'); } }
    b.sk -= 40; if (b.sk <= 0) { b.sk = 120; if (!b.vis) scarSprite('crack', b.x, b.y, b.br * .8, b.a); addShakeNear(b.x, b.y, 3); SFX.play('crush', .6, b.x, b.y, { size: 4 }); }
    if (stop) { boulderStop(b); return true; }
    return false;
  },
  draw(c, b) {
    const R = b.br, x = b.x, y = b.y - b.h, hk = b.arc ? b.h / b.arc : 0, s = 1 + hk * .3, sd = b.seed;
    c.fillStyle = `rgba(0,0,0,${(.4 - hk * .2).toFixed(2)})`; c.beginPath(); c.ellipse(b.x + R * .25 + b.h * .15, b.y + R * .3 + b.h * .05, R * (1 - hk * .4), R * (.85 - hk * .35), 0, 0, TAU); c.fill();
    if (b.ph === 0 && b.t / b.T > .5) { c.globalCompositeOperation = 'lighter'; xcGlow(c, x, y, R * s * 1.5, [[.6, 'rgba(255,150,60,.25)'], [1, 'rgba(255,120,40,0)']]); c.globalCompositeOperation = 'source-over'; }
    c.save(); c.translate(x, y); c.scale(s, s);
    const g = c.createRadialGradient(-R * .35, -R * .35, R * .1, 0, 0, R); g.addColorStop(0, '#cfc6b4'); g.addColorStop(.6, '#8a8270'); g.addColorStop(1, '#4a443a'); c.fillStyle = g; circ(c, 0, 0, R); c.fill();
    // cratères qui défilent avec le roulement
    c.save(); circ(c, 0, 0, R * .98); c.clip(); c.rotate(b.a);
    for (let k = 0; k < 9; k++) { const u2 = ((hash2(k, 1, sd) * 2 + b.rot / Math.PI) % 2 + 2) % 2 - 1, v2 = (hash2(k, 2, sd) - .5) * 1.6, cr = R * (.1 + .14 * hash2(k, 3, sd)), sq = Math.sqrt(Math.max(0, 1 - u2 * u2)); c.fillStyle = 'rgba(60,54,46,.55)'; c.beginPath(); c.ellipse(u2 * R, v2 * R * sq, cr * sq + 1, cr, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(220,210,190,.25)'; c.beginPath(); c.ellipse(u2 * R - cr * .2, v2 * R * sq - cr * .2, (cr * sq + 1) * .6, cr * .6, 0, 0, TAU); c.fill(); }
    c.restore();
    c.strokeStyle = '#2e2a24'; c.lineWidth = xcLW(R * .03, 1.5); circ(c, 0, 0, R); c.stroke();
    c.restore();
  } };

// ================= FAUCHEUSE QUANTIQUE =================
// frappe instantanée sur les 12 plus gros ennemis à moins de 4 200 px du point visé : 16 000 chacun, à travers murs et blindage
W_FIRE.phase = (u, m, w, F) => {
  const P = xcPt(F.mx, F.my, F.tx, F.ty, w), L = [];
  foesIn(P.x, P.y, w.reach, u.team, v => { if (v.kind !== 'beacon' && v.etype !== 'cible') L.push(v); });
  if (!L.length && !NETVIS && !xcMan(u, m)) return false;
  L.sort((a, b) => b.maxhp - a.maxhp); if (L.length > w.targets) L.length = w.targets;
  bullets.push({ kind: 'xc_phase', x: P.x, y: P.y, px0: P.x, py0: P.y, vx: 0, vy: 0, team: u.team, dmg: 0, t: 0, T: 1.4, R: w.reach, sx: F.mx, sy: F.my, L: L.map(v => ({ v, s: Math.random() * TAU })), vis: true, sky: 1 });
  if (!NETVIS) { const d = w.dmg * diffDmg(u.team); for (const v of L) hurt(v, d, u, { ap: 1 }); }
  for (const v of L) xcFlash(v.x, v.y, v.r * 2 + 60, .25, '#c8f8ff');
  xcRing(F.mx, F.my, 160 * F.sc * .3, .35, '#7af0ff', true);
  xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
const XC_GL = [{ body: '#20d8ff', body2: '#0898c8', plate: '#90f4ff', acc: '#ffffff', glow: 'rgba(120,240,255,', dark: '#044a66' }, { body: '#ff3ad8', body2: '#b01898', plate: '#ff9af0', acc: '#ffffff', glow: 'rgba(255,120,240,', dark: '#5a0848' }];
function xcPaintUnit(c, v, P) {
  if (v.kind === 'enemy') paintEnemy(c, v.etype, v.r, P, v.t || time, 0, v);
  else if (v.kind === 'robot' || v.kind === 'rival' && v.role === 'bot') paintChassis(c, v.chassis, v.r, P, v.t || time, 0, v);
  else { c.fillStyle = P.body; circ(c, 0, 0, v.r * .8); c.fill(); }
}
B_KIND.xc_phase = { high: true,
  update(b, dt) { b.t += dt; if (b.t >= b.T) return true; const R = b.R; b.x = clamp(cam.x, b.px0 - R, b.px0 + R); b.y = clamp(cam.y, b.py0 - R, b.py0 + R); return false; },
  draw(c, b) {
    const k = b.t / b.T, I = 1 - k, z = cam.zoom;
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(122,240,255,${(.7 * I * I).toFixed(2)})`; c.lineWidth = xcLW(6, 2); c.setLineDash([xcLW(30, 8), xcLW(20, 6)]); c.lineDashOffset = -time * 900; c.beginPath();
    for (const it of b.L) { c.moveTo(b.sx, b.sy); c.lineTo(it.v.x, it.v.y); } c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    // anneaux décalés (lisibles même de très loin)
    for (const it of b.L) { const v = it.v, R = v.r * 1.3 + 4 / z, j = (hash2(Math.floor(time * 18), v.id, 5) - .5) * R * .3; c.lineWidth = Math.max(R * .08, 2 / z); c.strokeStyle = `rgba(32,216,255,${(.8 * I).toFixed(2)})`; circ(c, v.x - j - R * .08, v.y, R); c.stroke(); c.strokeStyle = `rgba(255,58,216,${(.7 * I).toFixed(2)})`; circ(c, v.x + j + R * .08, v.y, R); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    for (const it of b.L) {
      const v = it.v, r = v.r, j = (hash2(Math.floor(time * 24), v.id, 7) - .5) * 2;
      // silhouettes décalées
      if (k < .65 && r * z > 6) {
        c.globalAlpha = .45 * I; c.globalCompositeOperation = 'lighter';
        for (let q = 0; q < 2; q++) { const off = (q ? 1 : -1) * (6 + r * .16) * (1 + j * .5); c.save(); c.translate(v.x + off, v.y + j * r * .05); c.rotate(v.ang || 0); try { xcPaintUnit(c, v, XC_GL[q]); } catch (e) { } c.restore(); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      // tranches d'image qui glissent
      c.fillStyle = `rgba(120,240,255,${(.35 * I).toFixed(2)})`; for (let q = 0; q < 3; q++) { const h = hash2(q, Math.floor(time * 20) + v.id, 3); c.fillRect(v.x - r * 1.2 + j * r * .3, v.y - r + h * r * 2, r * 2.4, Math.max(r * .08, 1.5 / z)); }
      // lame spectrale qui fauche
      if (k < .45) { const q = k / .45, a0 = it.s - 1.2 + q * 2.6, R = r * 1.45 + 10 / z; c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(220,255,255,${(.95 * (1 - q)).toFixed(2)})`; c.lineWidth = Math.max(r * .22, 4 / z) * (1 - q * .6); c.beginPath(); c.arc(v.x, v.y, R, a0 - 1, a0); c.stroke(); c.strokeStyle = `rgba(122,240,255,${(.5 * (1 - q)).toFixed(2)})`; c.lineWidth = Math.max(r * .5, 8 / z); c.beginPath(); c.arc(v.x, v.y, R * .95, a0 - .8, a0 - .05); c.stroke(); c.globalCompositeOperation = 'source-over'; }
    }
  } };

// ================= ARMES CENTRÉES SUR LE ROBOT : L'IA ATTEND QUE ÇA EN VAILLE LA PEINE =================
// renvoie false (et patiente 0,8 s) tant qu'il y a trop peu à frapper autour du robot ; au bout de 6 s d'attente, elle tire quand même
function xcSelfReady(u, m, R, min) {
  if (NETVIS || xcMan(u, m)) return true;
  if (time < (m.xcHold || 0)) return false;
  if (xcWorth(u.x, u.y, R, u.team) >= min) { m.xcWait = 0; return true; }
  if (!m.xcWait) m.xcWait = time; if (time - m.xcWait >= 6) { m.xcWait = 0; return true; }
  m.xcHold = time + .8; return false;
}

// ================= SUPERNOVA =================
// charge 4 s (le robot rayonne de plus en plus fort), puis une nova de 3 000 px : 90 000 au centre, 30 % au bord, volants compris ;
// l'onde de choc frappe en passant et souffle le décor dans un rayon de 1 200 ; éclair plein écran
W_FIRE.supernova = (u, m, w, F) => {
  if (!xcSelfReady(u, m, w.range, 14)) return false;
  const f = addZone('xc_nova', u.x, u.y, 40, w.charge + 1.6, u.team, u, { u, R: w.range, ch: w.charge, dmg: w.dmg * diffDmg(u.team), edge: w.edge, raze: w.raze, boom: false, L: null, RL: null, front: 0, p: 0 });
  xcSky(f, w.range + 400); m.xcOn = time + w.charge;
  return true;
};
function novaBoom(f) {
  f.boom = true; f.t = Math.min(f.t, 1.6);
  if (!f.vis) {
    const L = []; foesIn(f.x, f.y, f.R, f.team, v => L.push({ v, d: Math.max(0, Math.hypot(v.x - f.x, v.y - f.y) - v.r) })); L.sort((a, b) => b.d - a.d); f.L = L;
    if (W && !W.isBase) { const RL = []; xcTiles(f.x, f.y, f.raze, (tx, ty, o) => { if (o < 7) RL.push([Math.hypot(tx * TILE + 20 - f.x, ty * TILE + 20 - f.y), ty * WT + tx]); }); RL.sort((a, b) => b[0] - a[0]); f.RL = RL; }
    glassify(f.x, f.y, (f.u ? f.u.r : 400) + 350); scarSprite('crater', f.x, f.y, f.raze, Math.random() * TAU); scarSprite('burn', f.x, f.y, f.raze * 1.6, Math.random() * TAU);
  }
  xcScreen(f.x, f.y, 1); for (let k = 0; k < 4; k++) xcFlash(f.x + rnd(-1, 1) * f.R * .2, f.y + rnd(-1, 1) * f.R * .2, 420, .6, '#fff6d8');
  addShakeNear(f.x, f.y, 28); addShake(10); SFX.play('nuke', 1, f.x, f.y, { size: 7, reach: 3 }); SFX.play('farboom', 1, f.x, f.y, { size: 6 }); if (f.u && isMine(f.u)) buzz([120, 60, 220]);
}
xcZone('xc_nova', (f, dt) => {
  const u = f.u, e = f.max - f.t;
  if (!f.boom) {
    if (!u || u.dead) { f.t = 0; return; }
    f.x = u.x; f.y = u.y; f.p = clamp(e / f.ch, 0, 1);
    if (!xcLow() && Math.random() < dt * (20 + 60 * f.p)) { const a = Math.random() * TAU, d = u.r * (1.6 + 2 * Math.random()); xcPart({ type: 'spark', x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vx: -Math.cos(a) * d * 1.6, vy: -Math.sin(a) * d * 1.6, life: .5, max: .5, size: 3 + 4 * f.p, col: '#fff2c0' }); }
    f.ck = (f.ck || 0) - dt; if (f.ck <= 0) { f.ck = .1; xcFlash(f.x, f.y, Math.min(420, u.r * (.6 + f.p)), .14, '#fff6d8'); addShakeNear(f.x, f.y, f.p * 3); }
    if (e >= f.ch) novaBoom(f);
    return;
  }
  const fe = e - f.ch; f.front = Math.min(f.R, f.R * fe / .8);
  if (f.L) while (f.L.length && f.L[f.L.length - 1].d <= f.front) { const it = f.L.pop(), v = it.v; if (!v.dead) hurt(v, f.dmg * (1 - (1 - f.edge) * clamp(it.d / f.R, 0, 1)), f.src, { push: 900, px: f.x, py: f.y }); }
  if (f.RL) for (let n = 0; n < 60 && f.RL.length && f.RL[f.RL.length - 1][0] <= f.front + 100; n++) { const i = f.RL.pop()[1], o = W.obs[i]; if (o && o < 7) xcGone(i % WT, (i / WT) | 0, o, false); }
}, null, null, (c, f) => {
  const u = f.u, ur = u ? u.r : 400;
  c.globalCompositeOperation = 'lighter';
  if (!f.boom) {
    const p = f.p, fl = .85 + .15 * Math.sin(time * (8 + p * 30));
    xcGlow(c, f.x, f.y, ur * (1.3 + 1.8 * p), [[0, `rgba(255,255,240,${(.25 + .6 * p).toFixed(2)})`], [.35, `rgba(255,236,170,${(.25 + .4 * p * fl).toFixed(2)})`], [1, 'rgba(255,190,90,0)']]);
    c.strokeStyle = `rgba(255,244,210,${(.2 + .5 * p).toFixed(2)})`; c.lineWidth = xcLW(ur * .03, 1.5); c.beginPath();
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + time * .3, l = ur * (1.1 + (2.2 + Math.sin(time * 7 + k * 2)) * p); c.moveTo(f.x + Math.cos(a) * ur * .9, f.y + Math.sin(a) * ur * .9); c.lineTo(f.x + Math.cos(a) * l, f.y + Math.sin(a) * l); }
    c.stroke();
    c.strokeStyle = `rgba(255,236,190,${(.3 + .5 * p).toFixed(2)})`; c.lineWidth = xcLW(ur * .05, 2); circ(c, f.x, f.y, ur * (3.6 - 2.4 * p)); c.stroke();
  } else {
    const fe = f.max - f.t - f.ch, R = f.front, I = clamp(f.t / .8, 0, 1);
    if (fe < .35) xcGlow(c, f.x, f.y, f.R * .5 * (1 - fe / .35) + ur, [[0, 'rgba(255,255,255,1)'], [.4, 'rgba(255,246,210,.8)'], [1, 'rgba(255,200,120,0)']]);
    xcGlow(c, f.x, f.y, Math.max(1, R), [[0, `rgba(255,240,200,${(.25 * I).toFixed(3)})`], [.85, `rgba(255,200,120,${(.18 * I).toFixed(3)})`], [1, `rgba(255,170,80,${(.05 * I).toFixed(3)})`]]);
    c.strokeStyle = `rgba(255,250,230,${(.85 * I).toFixed(2)})`; c.lineWidth = Math.max(R * .035, 3 / cam.zoom); circ(c, f.x, f.y, R); c.stroke();
    c.strokeStyle = `rgba(255,190,90,${(.45 * I).toFixed(2)})`; c.lineWidth = Math.max(R * .09, 6 / cam.zoom); circ(c, f.x, f.y, R * .94); c.stroke();
  }
  c.globalCompositeOperation = 'source-over';
});

// ================= ESSAIM STELLAIRE =================
// quarante éclats d'étoile tournent 1 s autour du robot, puis piquent chacun sur un ennemi différent à moins de 5 600 px
W_FIRE.starswarm = (u, m, w, F) => {
  if (!xcSelfReady(u, m, w.range, 10)) return false;
  const L = []; foesIn(u.x, u.y, w.range, u.team, v => { if (v.kind !== 'beacon' && v.etype !== 'cible' && L.length < 300) L.push(v); });
  L.sort((a, b) => (xcGiant(b) - xcGiant(a)) || d2(a.x, a.y, u.x, u.y) - d2(b.x, b.y, u.x, u.y));
  const n = w.salvo || 40, dmg = w.dmg * diffDmg(u.team);
  for (let i = 0; i < n; i++) {
    const tg = L.length ? L[i % L.length] : null, ra = rnd(0, TAU), rd = rnd(100, 700);
    bullets.push({ kind: 'starswarm', x: u.x, y: u.y, vx: 0, vy: 0, team: u.team, src: u, u, dmg, splash: w.splash, tg, tx: tg ? tg.x : F.tx + Math.cos(ra) * rd, ty: tg ? tg.y : F.ty + Math.sin(ra) * rd, ph: 0, t: 0, oa: i / n * TAU, orb: u.r + 160 + (i % 4) * 80, os: 1.5 + (i % 3) * .35, tr: [], spd: 0, delay: 1 + (i % 10) * .045, vis: NETVIS, sky: 0 });
  }
  return true;
};
function starHit(b) {
  const x = b.tx, y = b.ty, R = b.splash;
  if (!b.vis) {
    const L = []; foesIn(x, y, R, b.team, v => L.push(v));
    for (const v of L) { const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.r); hurt(v, b.dmg * (1 - .6 * clamp(d / R, 0, 1)), b.src); }
    xcTiles(x, y, R * .5, (tx, ty, o) => { if (o < 7) hitTile(tx, ty, b.dmg * .3); });
    scarSprite('scorch', x, y, R * .6, Math.random() * TAU);
  }
  xcFlash(x, y, R * 1.3, .28, '#fff4c8'); xcRing(x, y, R, .35, '#ffe9a8'); if (!xcLow()) sparks(x, y, 5, '#fff2c0');
  addShakeNear(x, y, 3); SFX.play('explo', .5, x, y, { size: 2 });
}
B_KIND.starswarm = { high: true,
  update(b, dt) {
    b.t += dt; const u = b.u;
    if (b.ph === 0) {
      const cx = u && !u.dead ? u.x : b.x, cy = u && !u.dead ? u.y : b.y; b.oa += dt * b.os * (1 + b.t);
      const R = b.orb * clamp(b.t / .35, .15, 1), nx = cx + Math.cos(b.oa) * R, ny = cy + Math.sin(b.oa) * R;
      b.vx = (nx - b.x) / Math.max(dt, 1e-3); b.vy = (ny - b.y) / Math.max(dt, 1e-3); b.x = nx; b.y = ny;
      if (b.t >= b.delay) { b.ph = 1; b.spd = Math.min(1600, Math.hypot(b.vx, b.vy)) * .5 + 400; b.t1 = b.t; }
    } else {
      const t = b.tg;
      if (t && !t.dead && !t.hidden) { b.tx = t.x; b.ty = t.y; } else if (t) { b.tg = b.vis ? null : nearestFoe(b.tx, b.ty, 900, b.team); }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy) || 1, tt = b.t - b.t1;
      b.spd = Math.min(3400, b.spd + 4400 * dt);
      const na = turnTo(Math.atan2(b.vy, b.vx), Math.atan2(dy, dx), (5 + tt * 8) * dt); b.vx = Math.cos(na) * b.spd; b.vy = Math.sin(na) * b.spd;
      if (d <= b.spd * dt + (b.tg ? b.tg.r * .6 : 12) || tt > 5) { if (tt > 5) { b.tx = b.x; b.ty = b.y; } starHit(b); return true; }
      b.x += b.vx * dt; b.y += b.vy * dt;
    }
    if (b.t > .08) { b.tr.push(b.x, b.y); if (b.tr.length > 20) b.tr.splice(0, 2); }
    return false;
  },
  draw(c, b) {
    const T = b.tr, n = T.length / 2, z = cam.zoom, sz = Math.max(16, 5 / z);
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 1; i < n; i++) { const k = i / n; c.strokeStyle = `rgba(255,${(200 + 40 * k) | 0},140,${(.55 * k).toFixed(2)})`; c.lineWidth = sz * (.25 + .75 * k); c.beginPath(); c.moveTo(T[i * 2 - 2], T[i * 2 - 1]); c.lineTo(T[i * 2], T[i * 2 + 1]); c.stroke(); }
    c.drawImage(glowSprite('#ffe9a8'), b.x - sz * 3, b.y - sz * 3, sz * 6, sz * 6);
    c.fillStyle = '#fffbe8'; c.beginPath(); const a = time * 6 + b.oa; for (let k = 0; k < 8; k++) { const q = k % 2 ? sz * .3 : sz * 1.3, aa = a + k * Math.PI / 4; k ? c.lineTo(b.x + Math.cos(aa) * q, b.y + Math.sin(aa) * q) : c.moveTo(b.x + Math.cos(aa) * q, b.y + Math.sin(aa) * q); } c.closePath(); c.fill();
    c.globalCompositeOperation = 'source-over';
  } };

// ================= GRAVITRON =================
// 8 s : le robot devient un puits de gravité ; les ennemis à moins de 3 200 px sont attirés (plus fort près de lui) et prennent
// 4 000 dps × proximité (1 au contact, 0,2 au bord) ; les projectiles adverses à moins de 1 500 px sont déviés vers l'extérieur
W_FIRE.gravitron = (u, m, w, F) => {
  if (!xcSelfReady(u, m, w.range, 10)) return false;
  const f = addZone('xc_grav', u.x, u.y, 40, w.vt, u.team, u, { u, R: w.range, dps: w.dmg * diffDmg(u.team), defl: w.deflect, ck: 0, ramp: 0 });
  xcSky(f, w.range + 200); m.xcOn = time + w.vt;
  return true;
};
xcZone('xc_grav', (f, dt) => {
  const u = f.u; if (!u || u.dead) { f.t = 0; return; }
  f.x = u.x; f.y = u.y; const e = f.max - f.t; f.ramp = clamp(e / .8, 0, 1) * clamp(f.t / .6, 0, 1);
  if (!f.vis) { // déviation des tirs adverses
    const R2 = f.defl * f.defl, tr = 5 * dt * f.ramp;
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i]; if (b.team === f.team || b.sky || !(b.dmg > 0) || b.kind === 'xc_dead') continue;
      const dx = b.x - f.x, dy = b.y - f.y, q = dx * dx + dy * dy; if (q > R2) continue;
      if (b.kind === 'mortar') { const ex = b.tx - f.x, ey = b.ty - f.y, td = Math.hypot(ex, ey) || 1; if (td < f.defl + 60) { const k = Math.min(1, dt * 3) * (f.defl + 90 - td); b.tx += ex / td * k; b.ty += ey / td * k; } continue; }
      const sp = Math.hypot(b.vx || 0, b.vy || 0); if (sp < 1) continue;
      const na = turnTo(Math.atan2(b.vy, b.vx), Math.atan2(dy, dx), tr); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; b.homing = null;
    }
  }
  if (!xcLow() && Math.random() < dt * 25) { const a = Math.random() * TAU, d = f.R * rnd(.25, .8); xcPart({ type: 'debris', x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vx: -Math.cos(a) * 220 - Math.sin(a) * 260, vy: -Math.sin(a) * 220 + Math.cos(a) * 260, life: 1.2, max: 1.2, size: rnd(4, 10), col: '#5a4a7a', rot: 0 }); }
  SFX.hold('gv' + u.id, 'beam', .45, f.x, f.y);
  f.ck -= dt; if (f.ck > 0 || f.vis) return; f.ck = .1;
  const L = [], span = Math.max(1, f.R - u.r); foesIn(f.x, f.y, f.R, f.team, v => L.push(v));
  for (const v of L) {
    const dx = f.x - v.x, dy = f.y - v.y, d = Math.hypot(dx, dy) || 1, prox = 1 - .8 * clamp((d - u.r - v.r) / span, 0, 1);
    hurt(v, f.dps * prox * .1 * f.ramp, f.src);
    if (!v.dead && !v.static && v.kind !== 'building' && d > u.r + v.r + 40) { const k = (50 + 240 * prox) * (xcGiant(v) ? .12 : 1) * f.ramp; v.vx += dx / d * k; v.vy += dy / d * k; }
  }
}, null, null, (c, f) => {
  const u = f.u, ur = u ? u.r : 400, I = f.ramp, R = f.R, z = cam.zoom;
  // lentille : un anneau sombre autour du robot, des anneaux qui se resserrent, un anneau de photons
  const g = c.createRadialGradient(f.x, f.y, ur * .95, f.x, f.y, R * .75); g.addColorStop(0, `rgba(10,4,24,${(.5 * I).toFixed(2)})`); g.addColorStop(.3, `rgba(30,14,60,${(.25 * I).toFixed(2)})`); g.addColorStop(1, 'rgba(30,14,60,0)');
  c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, R * .75, 0, TAU); c.arc(f.x, f.y, ur * .95, 0, TAU, true); c.fill();
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 5; k++) { const q = (time * .32 + k / 5) % 1, rr2 = ur * 1.1 + (R - ur * 1.1) * Math.pow(1 - q, 1.6); c.strokeStyle = `rgba(185,160,255,${(.45 * q * I).toFixed(2)})`; c.lineWidth = Math.max(R * .006, 1.5 / z) * (1 + q * 2); circ(c, f.x, f.y, rr2); c.stroke(); }
  c.lineWidth = Math.max(ur * .05, 2 / z);
  for (let k = 0; k < 6; k++) { const a = time * (1.2 + k * .25) * (k % 2 ? -1 : 1) + k, rr2 = ur * (1.35 + k * .18); c.strokeStyle = `rgba(210,190,255,${((.5 - k * .06) * I).toFixed(2)})`; c.beginPath(); c.arc(f.x, f.y, rr2, a, a + 1.3 + k * .2); c.stroke(); }
  c.strokeStyle = `rgba(255,255,255,${(.7 * I).toFixed(2)})`; c.lineWidth = Math.max(ur * .02, 1.5 / z); circ(c, f.x, f.y, ur * 1.22); c.stroke();
  c.strokeStyle = `rgba(185,160,255,${(.18 * I).toFixed(2)})`; c.lineWidth = Math.max(8, 2 / z); c.setLineDash([Math.max(40, 8 / z), Math.max(40, 8 / z)]); c.lineDashOffset = -time * 200; circ(c, f.x, f.y, f.defl); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
  c.globalCompositeOperation = 'source-over';
});

// ================= ÉCLIPSE =================
// un pic de matière noire tombe au point visé (40 000, rayon 700), puis une ombre r 2 200 pendant 10 s : les ennemis dedans
// ne voient plus au-delà de 300 px (cible perdue, vue réduite) et sont marqués (+30 % de dégâts subis)
W_FIRE.eclipse = (u, m, w, F) => {
  const P = xcAim(u, m, w, F, { R: 1500, min: 10 }); if (!P) return false;
  const f = addZone('xc_eclipse', P.x, P.y, 1, .7 + w.vt, u.team, u, { R: w.area, dmg: w.dmg * diffDmg(u.team), splash: w.splash, vuln: w.vuln, hit: false, ck: 0, S: new Set(), seed: Math.random() * 99 });
  xcSky(f, w.area + 300); xcNet(m, F.mx, F.my, P.x, P.y, u.team);
  return true;
};
function xcBlind(v) {
  v.blindT = time + .6;
  if (v.kind === 'enemy' && v.xcSight === undefined) { v.xcSight = v.sight; v.sight = Math.min(v.sight || 300, 300); }
  if (v.target && !v.target.dead && d2(v.target.x, v.target.y, v.x, v.y) > (300 + v.r + (v.target.r || 0)) ** 2) { v.target = null; v.tt = Math.max(v.tt || 0, .3); }
}
function xcUnblind(v, f) {
  if (v.xcSight === undefined) return;
  if (!v.dead && fires.some(g => g !== f && g.zk === 'xc_eclipse' && g.hit && g.t > 0 && d2(g.x, g.y, v.x, v.y) < (g.R + v.r) ** 2)) return;
  v.sight = v.xcSight; v.xcSight = undefined;
}
xcZone('xc_eclipse', (f, dt) => {
  const e = f.max - f.t;
  if (!f.hit) {
    if (e < .7) return;
    f.hit = true; blast(f.x, f.y, f.splash, f.dmg, f.team, f.src);
    for (let k = 0; k < 4; k++) xcRing(f.x, f.y, f.splash * (1 + k * .6), .5 + k * .25, k ? '#a080ff' : '#ffcf7a', k > 1);
    if (!f.vis) scarSprite('crater', f.x, f.y, f.splash * .9, Math.random() * TAU);
    addShakeNear(f.x, f.y, 22); SFX.play('nuke', 1, f.x, f.y, { size: 6 }); SFX.play('gravity', 1, f.x, f.y, { size: 5 });
    return;
  }
  f.ck -= dt; if (f.ck > 0 || f.vis) return; f.ck = .25;
  const seen = new Set(); foesIn(f.x, f.y, f.R, f.team, v => { if (v.kind !== 'beacon') seen.add(v); });
  for (const v of seen) { hurt(v, 0, f.src, { vuln: f.vuln, vulnT: .6 }); xcBlind(v); f.S.add(v); }
  for (const v of f.S) if (!seen.has(v)) { xcUnblind(v, f); f.S.delete(v); }
}, null, f => { f.t = 0; for (const v of f.S) xcUnblind(v, f); }, (c, f) => {
  const e = f.max - f.t, x = f.x, y = f.y, z = cam.zoom;
  if (!f.hit) {
    const q = clamp(e / .7, 0, 1), h = (1 - q) * (1 - q) * 2400, ax = x - .3 * h, ay = y - h;
    xcReticle(c, x, y, f.splash, time, `rgba(255,207,122,${(.4 + .4 * q).toFixed(2)})`, q);
    c.save(); c.translate(ax, ay); c.rotate(Math.atan2(h, .3 * h) || Math.PI / 2);
    c.globalCompositeOperation = 'lighter'; xcGlow(c, -60, 0, 220, [[0, 'rgba(160,120,255,.6)'], [1, 'rgba(100,60,220,0)']]); c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#0a0612'; c.beginPath(); c.moveTo(120, 0); c.lineTo(-30, -46); c.lineTo(-260, -14); c.lineTo(-260, 14); c.lineTo(-30, 46); c.closePath(); c.fill();
    c.strokeStyle = '#b9a0ff'; c.lineWidth = 6; c.stroke(); c.restore();
    return;
  }
  const I = clamp((e - .7) / .5, 0, 1) * clamp(f.t / 1, 0, 1), R = f.R;
  const g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(4,2,12,${(.62 * I).toFixed(2)})`); g.addColorStop(.75, `rgba(6,4,16,${(.5 * I).toFixed(2)})`); g.addColorStop(.95, `rgba(10,6,24,${(.25 * I).toFixed(2)})`); g.addColorStop(1, 'rgba(10,6,24,0)');
  c.fillStyle = g; circ(c, x, y, R); c.fill();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(255,207,122,${(.6 * I).toFixed(2)})`; c.lineWidth = Math.max(R * .012, 3 / z); circ(c, x, y, R * .97); c.stroke();
  c.strokeStyle = `rgba(255,170,80,${(.25 * I).toFixed(2)})`; c.lineWidth = Math.max(R * .04, 8 / z); circ(c, x, y, R * .985); c.stroke();
  c.lineWidth = Math.max(R * .008, 2 / z); c.strokeStyle = `rgba(255,220,150,${(.55 * I).toFixed(2)})`; c.beginPath();
  for (let k = 0; k < 18; k++) { const a = hash2(k, 1, f.seed) * TAU + time * .05, l = R * (.06 + .08 * (.5 + .5 * Math.sin(time * 2 + k * 3))); c.moveTo(x + Math.cos(a) * R * .97, y + Math.sin(a) * R * .97); c.lineTo(x + Math.cos(a) * (R * .97 + l), y + Math.sin(a) * (R * .97 + l)); }
  c.stroke();
  c.strokeStyle = `rgba(160,128,255,${(.35 * I).toFixed(2)})`; c.lineWidth = Math.max(R * .006, 1.5 / z); circ(c, x, y, R * .9 - (time * 60) % (R * .1)); c.stroke();
  // le pic planté au centre
  xcGlow(c, x, y, 260, [[0, `rgba(160,120,255,${(.5 * I).toFixed(2)})`], [1, 'rgba(100,60,220,0)']]);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#0a0612'; for (let k = 0; k < 5; k++) { const a = hash2(k, 2, f.seed) * TAU, l = 60 + hash2(k, 3, f.seed) * 90; c.beginPath(); c.moveTo(x + Math.cos(a + 1.4) * 22, y + Math.sin(a + 1.4) * 22); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l - 40); c.lineTo(x + Math.cos(a - 1.4) * 22, y + Math.sin(a - 1.4) * 22); c.closePath(); c.fill(); }
  c.strokeStyle = 'rgba(185,160,255,.7)'; c.lineWidth = xcLW(4, 1); c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x, y - 140); c.lineTo(x + 20, y); c.stroke();
});

// ================= DESSINS DES AFFÛTS =================
// échelle (unités) : apocalyptique ≈ 18 × 56, cataclysmique ≈ 22 × 66, stellaire ≈ 26 × 76 ; pivot sur le socle, canon vers +x.
// L'identité de chaque arme est lisible près du pivot (icônes de l'armurerie) ; les détails fins disparaissent de loin.
const XD = '#181c1e';
// recharge : 0 juste après le tir, 1 prête
const xcRd = (m, id) => m && m.w ? clamp(1 - Math.max(0, m.cd) * (m.w.rate || WEAPONS[id].rate), 0, 1) : 1;
function xcBase(c, P, r, n, px) {
  c.fillStyle = P.dark; ngon(c, n, r, Math.PI / n); c.fill();
  c.fillStyle = P.body; circ(c, 0, 0, r * .86); c.fill();
  c.strokeStyle = P.plate; c.lineWidth = r * .08; circ(c, 0, 0, r * .74); c.stroke();
  if (px > 1.4) { c.fillStyle = P.plate; for (let k = 0; k < n; k++) { const a = (k + .5) / n * TAU; circ(c, Math.cos(a) * r * .93, Math.sin(a) * r * .93, r * .045); c.fill(); } }
}
const xcA = v => clamp(v, 0, 1).toFixed(2);

W_PAINT.solar = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'solar'), on = m && m.cd > 16 ? 1 : 0, p = .55 + .45 * Math.sin(t * 3);
  xcBase(c, P, 18, 8, px);
  c.save(); c.rotate(t * .25);
  for (let k = 0; k < 6; k++) { c.rotate(TAU / 6); c.fillStyle = '#2c3a5a'; c.beginPath(); c.moveTo(7, -3); c.lineTo(17, -7); c.lineTo(17, 7); c.lineTo(7, 3); c.closePath(); c.fill(); if (px > .8) { c.strokeStyle = '#e0b84a'; c.lineWidth = .8; c.stroke(); c.fillStyle = `rgba(255,220,120,${xcA(.15 + .4 * rd * p + on * .4)})`; c.fillRect(9, -2, 6, 4); } }
  c.restore();
  const g = c.createRadialGradient(-1, -1, 0, 0, 0, 7.5); g.addColorStop(0, '#fffbe8'); g.addColorStop(.4, `rgba(255,214,110,${xcA(.6 + .4 * rd)})`); g.addColorStop(1, '#6a5020'); c.fillStyle = g; circ(c, 0, 0, 7.5); c.fill();
  c.strokeStyle = P.plate; c.lineWidth = 1.6; c.beginPath(); c.moveTo(5, -6); c.lineTo(32, -1.2); c.moveTo(5, 6); c.lineTo(32, 1.2); c.moveTo(7, 0); c.lineTo(32, 0); c.stroke();
  c.fillStyle = XD; c.fillRect(33, -2.2, 21, 4.4); c.fillStyle = '#e0b84a'; for (const x of [39, 45, 51]) c.fillRect(x, -3, 1.6, 6);
  c.fillStyle = `rgba(210,240,255,${xcA(.5 + .3 * p)})`; c.beginPath(); c.ellipse(32, 0, 2.4, 6.5, 0, 0, TAU); c.fill(); c.strokeStyle = '#e0b84a'; c.lineWidth = .8; c.stroke();
  if (on || rd >= 1) { c.globalCompositeOperation = 'lighter'; xcGlow(c, 55, 0, 6 + on * 6, [[0, 'rgba(255,250,220,.9)'], [1, 'rgba(255,200,90,0)']]); if (on) xcGlow(c, 0, 0, 14, [[0, 'rgba(255,250,220,.8)'], [1, 'rgba(255,200,90,0)']]); c.globalCompositeOperation = 'source-over'; }
};
W_PAINT.antimatter = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'antimatter'), p = .5 + .5 * Math.sin(t * 4);
  c.fillStyle = P.body; rr(c, -18, -17, 26, 8, 3); c.fill(); rr(c, -18, 9, 26, 8, 3); c.fill();
  c.fillStyle = XD; c.fillRect(8, -6, 44, 12);
  for (let k = 0; k < 3; k++) { const x = 18 + k * 12, q = .3 + .7 * clamp(rd * 3 - k, 0, 1); c.fillStyle = P.plate; rr(c, x - 3, -9.5, 6, 19, 2); c.fill(); c.fillStyle = `rgba(255,122,224,${xcA(q * (.5 + .5 * Math.sin(t * 6 - k)))})`; c.fillRect(x - 1, -8, 2, 16); }
  c.fillStyle = P.body2; c.beginPath(); c.moveTo(50, -7); c.lineTo(58, -10); c.lineTo(58, 10); c.lineTo(50, 7); c.closePath(); c.fill(); c.fillStyle = `rgba(255,150,235,${xcA(.3 + .6 * rd)})`; c.fillRect(55, -6, 2.5, 12);
  c.fillStyle = P.dark; circ(c, -4, 0, 14.5); c.fill(); c.fillStyle = P.body2; circ(c, -4, 0, 13); c.fill();
  const g = c.createRadialGradient(-4, 0, 1, -4, 0, 10.5); g.addColorStop(0, '#0a0210'); g.addColorStop(.75, '#3a0c52'); g.addColorStop(1, `rgba(255,122,224,${xcA(.6 + .4 * rd * p)})`); c.fillStyle = g; circ(c, -4, 0, 10.5); c.fill();
  if (px > .6) { c.strokeStyle = `rgba(255,200,245,${xcA(.5 + .4 * rd)})`; c.lineWidth = 1.2; for (let k = 0; k < 2; k++) { const s = t * (2.5 + k) * (k ? -1 : 1); c.beginPath(); c.arc(-4, 0, 4 + k * 3, s, s + 2.4); c.stroke(); } }
};
W_PAINT.lift = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'lift'), bob = Math.sin(t * 2.2) * 1.4;
  xcBase(c, P, 17, 8, px);
  c.lineCap = 'round';
  for (const s of [-1, 1]) { c.strokeStyle = P.body2; c.lineWidth = 6.5; c.beginPath(); c.moveTo(0, s * 9); c.quadraticCurveTo(26, s * 22, 50, s * 9); c.stroke(); c.strokeStyle = P.plate; c.lineWidth = 2.4; c.stroke(); c.fillStyle = '#9fd0ff'; circ(c, 50, s * 9, 2.4); c.fill(); }
  c.strokeStyle = `rgba(159,208,255,${xcA(.25 + .5 * rd)})`; c.lineWidth = 1; c.setLineDash([2, 2]); c.lineDashOffset = -t * 8; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(48, s * 8); c.quadraticCurveTo(42, s * 3, 38, s * 1.5); c.stroke(); } c.setLineDash([]); c.lineDashOffset = 0;
  c.save(); c.translate(0, 0); c.rotate(t * 1.5); c.strokeStyle = '#9fd0ff'; c.lineWidth = 1.6; c.setLineDash([5, 3]); circ(c, 0, 0, 10); c.stroke(); c.setLineDash([]); c.restore();
  c.fillStyle = P.dark; circ(c, 0, 0, 5); c.fill();
  const x = 38 + bob, g = c.createRadialGradient(x - 1.5, -1.5, 0, x, 0, 7); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, `rgba(170,215,255,${xcA(.6 + .4 * rd)})`); g.addColorStop(1, '#3a5a8a'); c.fillStyle = g; circ(c, x, 0, 7); c.fill();
  if (px > .7) { c.strokeStyle = 'rgba(200,230,255,.7)'; c.lineWidth = .9; c.beginPath(); c.ellipse(x, 0, 10, 3.5, t * 1.2, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(x, 0, 10, 3.5, -t * 1.2 + 1, 0, TAU); c.stroke(); }
};
W_PAINT.bladestorm = (c, P, rec, t, m) => {
  const px = xcPx(c), act = m && m.xcOn > time;
  c.fillStyle = P.dark; for (let k = 0; k < 12; k++) { c.save(); c.rotate(k * TAU / 12); c.fillRect(14, -2.4, 4.5, 4.8); c.restore(); }
  c.fillStyle = P.body; circ(c, 0, 0, 15.5); c.fill(); c.strokeStyle = P.plate; c.lineWidth = 1.4; circ(c, 0, 0, 12); c.stroke();
  for (let k = 0; k < 4; k++) {
    c.save(); c.rotate(k * Math.PI / 2 + .3);
    if (!act) { c.fillStyle = '#c9ced3'; c.beginPath(); c.moveTo(8, -3); c.quadraticCurveTo(27, 13, 47, 4); c.quadraticCurveTo(29, 2, 12, -8); c.closePath(); c.fill(); if (px > .7) { c.strokeStyle = '#f2fbff'; c.lineWidth = 1; c.beginPath(); c.moveTo(10, -1); c.quadraticCurveTo(27, 13, 47, 4); c.stroke(); } }
    c.fillStyle = P.body2; rr(c, 6, -5, 10, 10, 2); c.fill(); c.fillStyle = act ? '#9fd8ff' : P.plate; circ(c, 11, 0, 2.2); c.fill();
    c.restore();
  }
  c.fillStyle = P.plate; circ(c, 0, 0, 6); c.fill(); c.fillStyle = act ? '#e8f0ff' : '#9aa4aa'; circ(c, 0, 0, 2.6); c.fill();
};
W_PAINT.volcano = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'volcano'), fl = .75 + .25 * Math.sin(t * 9) * Math.sin(t * 3.7);
  c.fillStyle = P.body; rr(c, -18, -17, 30, 34, 6); c.fill(); c.fillStyle = P.body2; c.fillRect(-18, -4, 30, 8);
  c.fillStyle = XD; c.beginPath(); c.moveTo(10, -9); c.lineTo(40, -12); c.lineTo(40, 12); c.lineTo(10, 9); c.closePath(); c.fill();
  c.strokeStyle = `rgba(255,120,40,${xcA(.5 * fl)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(14, -6); c.lineTo(38, -8); c.moveTo(14, 6); c.lineTo(38, 8); c.stroke();
  c.fillStyle = P.plate; rr(c, 37, -13.5, 6, 27, 2); c.fill(); c.fillStyle = `rgba(255,150,50,${xcA((.4 + .5 * rd) * fl)})`; c.fillRect(42, -8, 2, 16);
  c.fillStyle = '#3a2a20'; circ(c, -3, 0, 13.5); c.fill();
  const g = c.createRadialGradient(-3, 0, 0, -3, 0, 10.5); g.addColorStop(0, `rgba(255,250,200,${xcA(fl)})`); g.addColorStop(.5, '#ff9a30'); g.addColorStop(1, '#a8300c'); c.fillStyle = g; circ(c, -3, 0, 10.5); c.fill();
  if (px > .6) { c.fillStyle = 'rgba(50,24,14,.75)'; for (let k = 0; k < 3; k++) { const a = t * .5 + k * 2.1; circ(c, -3 + Math.cos(a) * 5, Math.sin(a) * 5, 1.6 + .6 * Math.sin(t * 2 + k)); c.fill(); } c.fillStyle = `rgba(255,140,40,${xcA(.7 * fl)})`; for (const y of [-14, 14]) for (const x of [-12, -6, 0]) c.fillRect(x, y - .8, 3.5, 1.6); }
};
W_PAINT.anchor = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'anchor'), sl = (1 - rd) * -26, p = .5 + .5 * Math.sin(t * 5);
  xcBase(c, P, 17, 8, px);
  c.fillStyle = XD; c.fillRect(2, -9, 56, 3.4); c.fillRect(2, 5.6, 56, 3.4);
  c.fillStyle = P.body2; c.fillRect(-14, -3, 8, 6); c.fillStyle = P.plate; circ(c, -12, 0, 5); c.fill(); c.strokeStyle = '#ffd27a'; c.lineWidth = 1; c.beginPath(); c.arc(-12, 0, 7, -1, 1); c.stroke();
  if (rd > .05) {
    c.save(); c.translate(sl, 0); c.globalAlpha = clamp(rd * 1.5, 0, 1);
    c.fillStyle = '#a8925f'; c.beginPath(); c.moveTo(-6, -10); c.lineTo(6, -3); c.lineTo(6, 3); c.lineTo(-6, 10); c.lineTo(-2, 0); c.closePath(); c.fill();
    c.fillStyle = '#c9b48a'; c.fillRect(-4, -2.6, 50, 5.2); c.fillStyle = '#f2e2b8'; c.beginPath(); c.moveTo(44, -6); c.lineTo(62, 0); c.lineTo(44, 6); c.closePath(); c.fill();
    if (px > .7) { c.fillStyle = `rgba(255,210,122,${xcA(.4 + .5 * p * rd)})`; for (let k = 0; k < 5; k++) c.fillRect(8 + k * 7, -1.2, 3, 2.4); }
    c.restore();
  }
};
W_PAINT.crystal = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'crystal');
  c.fillStyle = P.dark; ngon(c, 6, 17.5, 0); c.fill(); c.fillStyle = P.body2; ngon(c, 6, 15, 0); c.fill();
  const shard = (x, y, L, w, a, col) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(L * .3, -w); c.lineTo(L, 0); c.lineTo(L * .3, w); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,245,255,.55)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(L * .3, -w); c.lineTo(L, 0); c.closePath(); c.fill(); c.restore(); };
  shard(-8, -6, 18, 4, -.5, '#7a52b8'); shard(-8, 6, 18, 4, .5, '#7a52b8'); shard(-4, -10, 16, 3.5, -.2, '#9a72d8'); shard(-4, 10, 16, 3.5, .2, '#9a72d8');
  shard(0, 0, 22, 6, 0, '#b896ff');
  c.fillStyle = XD; c.fillRect(16, -2.2, 10, 4.4);
  shard(22, 0, 34, 5.5, 0, `rgba(195,129,255,${xcA(.75 + .25 * rd)})`);
  if (px > .7) for (let k = 0; k < 3; k++) { const q = (t * 1.3 + k * .37) % 1; if (q < .3) { const x = [6, 34, 48][k], y = [-3, 2, -1][k], s = 2.5 * (1 - Math.abs(q - .15) / .15); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * .35, y); c.lineTo(x, y + s); c.lineTo(x - s * .35, y); c.closePath(); c.fill(); } }
  if (rd >= 1) { c.globalCompositeOperation = 'lighter'; xcGlow(c, 54, 0, 8, [[0, 'rgba(230,200,255,.8)'], [1, 'rgba(195,129,255,0)']]); c.globalCompositeOperation = 'source-over'; }
};
W_PAINT.sentinels = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'sentinels'), bl = Math.sin(t * 6) > 0;
  c.fillStyle = P.dark; rr(c, -19, -17, 48, 34, 5); c.fill(); c.fillStyle = P.body; rr(c, -17, -15, 44, 30, 4); c.fill();
  if (px > .7) { c.fillStyle = '#e0b030'; c.fillRect(-17, -15, 44, 2.2); c.fillRect(-17, 12.8, 44, 2.2); c.fillStyle = '#1e1c18'; for (let k = 0; k < 9; k++) { c.fillRect(-16 + k * 5, -15, 2.2, 2.2); c.fillRect(-16 + k * 5, 12.8, 2.2, 2.2); } }
  for (let k = 0; k < 3; k++) { const x = -8 + k * 14, ok = rd >= (k + 1) / 3 - .01; c.fillStyle = XD; circ(c, x, 0, 6.5); c.fill(); if (ok) { c.fillStyle = P.plate; circ(c, x, 0, 5); c.fill(); c.fillStyle = '#6fe3c8'; circ(c, x, 0, 1.8); c.fill(); } else { c.strokeStyle = P.plate; c.lineWidth = 1; c.beginPath(); c.arc(x, 0, 4, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(rd * 3 - k, 0, 1)); c.stroke(); } }
  c.fillStyle = XD; c.fillRect(29, -1.2, 22, 2.4); c.fillStyle = P.body2; c.beginPath(); c.ellipse(44, 0, 2.5, 7, 0, 0, TAU); c.fill(); c.fillStyle = bl ? '#6fe3c8' : '#2a5a50'; circ(c, 52, 0, 2); c.fill();
};
W_PAINT.starbeam = (c, P, rec, t, m) => {
  const px = xcPx(c), w = WEAPONS.starbeam, S = m ? m.xcS || 0 : 0, ch = S === 1 ? clamp(1 - m.xcT / w.charge, 0, 1) : S === 2 ? 1 : 0, rd = m && S === 0 ? clamp(1 - Math.max(0, m.cd) / w.reload, 0, 1) : 1, p = .6 + .4 * Math.sin(t * 4);
  c.fillStyle = P.body; rr(c, -22, -19, 32, 38, 7); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
  c.fillStyle = XD; c.fillRect(8, -8, 52, 16);
  for (let k = 0; k < 8; k++) { const x = 12 + k * 6, lit = clamp(ch * 8 - k, 0, 1); c.fillStyle = P.plate; c.fillRect(x, -11, 2.6, 22); if (lit > 0 || S === 2) { c.fillStyle = `rgba(255,242,168,${xcA(S === 2 ? .9 : lit * .85)})`; c.fillRect(x + .4, -10, 1.8, 20); } }
  if (S === 2) { c.fillStyle = 'rgba(255,255,240,.95)'; c.fillRect(8, -2, 54, 4); }
  c.fillStyle = P.body2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(58, s * 6); c.lineTo(68, s * 11); c.lineTo(64, s * 3); c.closePath(); c.fill(); }
  c.fillStyle = `rgba(255,242,168,${xcA(.3 + .7 * Math.max(ch, rd >= 1 ? .3 : 0))})`; circ(c, 62, 0, 3.6); c.fill();
  const I = S === 2 ? 1 : .35 + .65 * Math.max(ch, rd * .3);
  c.fillStyle = '#e0b030'; c.save(); c.translate(-6, 0); c.rotate(t * .5); for (let k = 0; k < 8; k++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(12, -2.5); c.lineTo(19 + 3 * I * p, 0); c.lineTo(12, 2.5); c.closePath(); c.fill(); } c.restore();
  c.fillStyle = P.dark; circ(c, -6, 0, 13.5); c.fill();
  const g = c.createRadialGradient(-6, 0, 0, -6, 0, 12); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, `rgba(255,242,168,${xcA(.5 + .5 * I)})`); g.addColorStop(1, `rgba(200,120,30,${xcA(.4 + .4 * I)})`); c.fillStyle = g; circ(c, -6, 0, 12); c.fill();
  if (I > .6) { c.globalCompositeOperation = 'lighter'; xcGlow(c, -6, 0, 26 * I, [[0, 'rgba(255,250,220,.7)'], [1, 'rgba(255,200,90,0)']]); c.globalCompositeOperation = 'source-over'; }
};
W_PAINT.collapser = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'collapser'), fl = .6 + .4 * Math.sin(t * 5), pk = Math.sin(t * 3) * 1.5;
  c.fillStyle = P.body2; rr(c, -14, -21 - pk * .3, 22, 6, 2); c.fill(); rr(c, -14, 15 + pk * .3, 22, 6, 2); c.fill();
  c.fillStyle = P.body; rr(c, -22, -18, 36, 36, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
  c.fillStyle = XD; c.beginPath(); c.moveTo(12, -11); for (let k = 0; k <= 8; k++) c.lineTo(14 + k * 6, k % 2 ? -13 : -9 + k * .4); c.lineTo(66, -2); c.lineTo(66, 2); for (let k = 8; k >= 0; k--) c.lineTo(14 + k * 6, k % 2 ? 13 : 9 - k * .4); c.lineTo(12, 11); c.closePath(); c.fill();
  c.strokeStyle = `rgba(255,138,58,${xcA((.4 + .5 * rd) * fl)})`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(14, 0); c.lineTo(62, 0); c.stroke();
  for (const [r, col] of [[14, P.dark], [10.5, P.body2], [7, P.dark]]) { c.fillStyle = col; ngon(c, 8, r, Math.PI / 8, -4, 0); c.fill(); }
  if (px > .6) { c.strokeStyle = `rgba(255,138,58,${xcA(.6 * fl + .3 * rd)})`; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + .3; c.moveTo(-4 + Math.cos(a) * 3, Math.sin(a) * 3); c.lineTo(-4 + Math.cos(a + .2) * 9, Math.sin(a + .2) * 9); c.lineTo(-4 + Math.cos(a - .1) * 13, Math.sin(a - .1) * 13); } c.stroke(); }
  c.fillStyle = `rgba(255,170,90,${xcA(.5 + .5 * rd * fl)})`; circ(c, -4, 0, 3); c.fill();
};
W_PAINT.hurricane = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'hurricane');
  c.fillStyle = P.body2; rr(c, 6, -17, 30, 9, 3); c.fill(); rr(c, 6, 8, 30, 9, 3); c.fill();
  if (px > .6) { c.strokeStyle = '#bfe6ff'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(9 + k * 4.5, -16); c.lineTo(9 + k * 4.5, -9); c.moveTo(9 + k * 4.5, 9); c.lineTo(9 + k * 4.5, 16); c.stroke(); } }
  c.fillStyle = XD; c.fillRect(30, -1.6, 32, 3.2); c.save(); c.translate(32, 0); for (const s of [-1, 1]) { c.save(); c.rotate(s * .32); c.fillRect(0, -1.3, 30, 2.6); c.restore(); } c.restore();
  c.fillStyle = '#d8f2ff'; for (const [x, y] of [[62, 0], [60.5, -9.4], [60.5, 9.4]]) { circ(c, x, y, 2.2); c.fill(); }
  if (rd >= 1 || Math.sin(t * 13) > .2) { c.strokeStyle = 'rgba(220,244,255,.85)'; c.lineWidth = .9; c.beginPath(); const j = k => Math.sin(t * 47 + k * 2.3) * 2; c.moveTo(60.5, -9.4); c.lineTo(62 + j(1), -4.5); c.lineTo(60 + j(2), -1); c.lineTo(62, 0); c.lineTo(61 + j(3), 4.5); c.lineTo(60.5, 9.4); c.stroke(); }
  c.fillStyle = P.dark; circ(c, -2, 0, 21); c.fill(); c.fillStyle = P.body; circ(c, -2, 0, 18.5); c.fill();
  c.save(); c.translate(-2, 0); c.rotate(t * (2 + 4 * rd)); c.strokeStyle = P.plate; c.lineWidth = 3; c.lineCap = 'round'; for (let k = 0; k < 7; k++) { c.rotate(TAU / 7); c.beginPath(); c.arc(7, 0, 9, Math.PI * .8, Math.PI * 1.45); c.stroke(); } c.restore();
  c.fillStyle = `rgba(191,230,255,${xcA(.5 + .5 * rd)})`; circ(c, -2, 0, 4.5); c.fill();
};
W_PAINT.moonshot = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'moonshot');
  c.fillStyle = XD; c.fillRect(-4, -15, 70, 5.5); c.fillRect(-4, 9.5, 70, 5.5);
  if (px > .6) { c.fillStyle = P.plate; for (let k = 0; k < 8; k++) { c.fillRect(4 + k * 8, -16.5, 2.4, 8.5); c.fillRect(4 + k * 8, 8, 2.4, 8.5); } c.fillStyle = `rgba(160,220,255,${xcA(.12 + .15 * Math.sin(t * 4))})`; c.fillRect(0, -9, 64, 18); }
  c.fillStyle = P.body; rr(c, -22, -20, 28, 40, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
  c.fillStyle = P.body2; rr(c, -18, -12, 16, 24, 3); c.fill();
  if (rd > .02) {
    const x = -14 + 20 * Math.min(1, rd * 1.2); c.save(); c.translate(x, 0); c.globalAlpha = clamp(rd * 2, 0, 1);
    const g = c.createRadialGradient(-4, -4, 1, 0, 0, 13); g.addColorStop(0, '#cfc6b4'); g.addColorStop(.6, '#8a8270'); g.addColorStop(1, '#4a443a'); c.fillStyle = g; circ(c, 0, 0, 13); c.fill();
    if (px > .5) { c.fillStyle = 'rgba(60,54,46,.55)'; for (const [a, b, r] of [[-4, 3, 3], [5, -4, 2.4], [3, 6, 1.8], [-6, -6, 1.6]]) { circ(c, a, b, r); c.fill(); } }
    c.restore();
  } else { c.save(); c.translate(-6, 0); c.rotate(-1.2 + rd * 40); c.fillStyle = P.plate; c.fillRect(0, -2, 16, 4); c.restore(); }
};
W_PAINT.phase = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'phase'), gl = Math.sin(t * 17) * Math.sin(t * 5.3) > .55;
  c.fillStyle = XD; c.fillRect(8, -3, 50, 6);
  if (px > .6) { c.fillStyle = `rgba(122,240,255,${xcA(.4 + .5 * rd)})`; for (let k = 0; k < 6; k++) c.fillRect(12 + k * 8, -1, 4, 2); }
  const blade = (ox, oy, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(-2, -12); c.quadraticCurveTo(30, -30, 64, -6); c.quadraticCurveTo(34, -18, 6, -6); c.closePath(); c.fill(); };
  if (gl || px < .6) { c.globalCompositeOperation = 'lighter'; c.save(); c.translate(2.5, -1); blade(0, 0, 'rgba(32,216,255,.35)'); c.restore(); c.save(); c.translate(-2.5, 1.5); blade(0, 0, 'rgba(255,58,216,.3)'); c.restore(); c.globalCompositeOperation = 'source-over'; }
  blade(0, 0, '#bfeef6'); c.strokeStyle = `rgba(122,240,255,${xcA(.6 + .4 * rd)})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-2, -12); c.quadraticCurveTo(30, -30, 64, -6); c.stroke();
  c.fillStyle = P.dark; ngon(c, 6, 16, 0, -6, 0); c.fill(); c.fillStyle = P.body2; ngon(c, 6, 13.5, 0, -6, 0); c.fill();
  for (let k = 0; k < 3; k++) { const h = hash2(k, Math.floor(t * 9), 3); c.fillStyle = k === 1 ? '#ff3ad8' : '#7af0ff'; c.globalAlpha = .5 + .5 * rd; c.fillRect(-10 + h * 7, -6 + k * 4, 3.4, 3.4); }
  c.globalAlpha = 1;
};
W_PAINT.supernova = (c, P, rec, t, m) => {
  const px = xcPx(c), w = WEAPONS.supernova, ch = m && m.xcOn > time ? clamp(1 - (m.xcOn - time) / w.charge, 0, 1) : 0, rd = xcRd(m, 'supernova'), I = ch > 0 ? .5 + .5 * ch : .35 + .4 * rd, p = .7 + .3 * Math.sin(t * (3 + ch * 20));
  c.fillStyle = XD; c.fillRect(20, -7, 32, 14); c.fillStyle = '#e0b030'; for (const x of [28, 36, 44]) c.fillRect(x, -8, 2, 16);
  c.strokeStyle = P.plate; c.lineWidth = 2.4; c.beginPath(); c.moveTo(50, -7); c.lineTo(74, -1.5); c.moveTo(50, 7); c.lineTo(74, 1.5); c.moveTo(50, 0); c.lineTo(76, 0); c.stroke();
  c.fillStyle = `rgba(255,246,216,${xcA(.4 + .6 * I * p)})`; circ(c, 75, 0, 2.6); c.fill();
  c.fillStyle = P.dark; circ(c, 0, 0, 25); c.fill(); c.fillStyle = P.body2; circ(c, 0, 0, 22); c.fill();
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, `rgba(255,246,200,${xcA(.6 + .4 * I)})`); g.addColorStop(.75, `rgba(255,170,60,${xcA(.5 * I + .2)})`); g.addColorStop(1, 'rgba(120,50,10,.9)'); c.fillStyle = g; circ(c, 0, 0, 16); c.fill();
  const op = 3 * ch; c.fillStyle = P.plate;
  for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + Math.PI / 8; c.save(); c.rotate(a); c.beginPath(); c.moveTo(14 + op, -4); c.lineTo(27 + op, -6); c.lineTo(27 + op, 6); c.lineTo(14 + op, 4); c.closePath(); c.fill(); if (px > .6) { c.fillStyle = P.dark; c.fillRect(22 + op, -1.5, 4, 3); c.fillStyle = P.plate; } c.restore(); }
  if (I > .55) { c.globalCompositeOperation = 'lighter'; xcGlow(c, 0, 0, 22 + 26 * ch, [[0, `rgba(255,250,225,${xcA(.6 * I)})`], [1, 'rgba(255,200,100,0)']]); c.globalCompositeOperation = 'source-over'; }
};
W_PAINT.starswarm = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'starswarm'), n = Math.round(rd * 40);
  c.fillStyle = P.plate; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(42, s * 18); c.lineTo(76, s * 7); c.lineTo(74, s * 3); c.lineTo(42, s * 11); c.closePath(); c.fill(); }
  if (rd >= 1) { c.strokeStyle = `rgba(255,233,168,${xcA(.5 + .3 * Math.sin(t * 6))})`; c.lineWidth = 1.4; c.beginPath(); c.arc(60, 0, 9, -1.1, 1.1); c.stroke(); }
  c.fillStyle = P.dark; rr(c, -27, -23, 72, 46, 7); c.fill(); c.fillStyle = P.body; rr(c, -25, -21, 68, 42, 6); c.fill();
  if (px < .7) { c.fillStyle = `rgba(255,220,120,${xcA(.3 + .6 * rd)})`; c.fillRect(-21, -17, 60, 34); return; }
  for (let i = 0; i < 40; i++) {
    const x = -19 + (i % 8) * 8, y = -16 + Math.floor(i / 8) * 8; c.fillStyle = XD; circ(c, x, y, 2.9); c.fill();
    if (i < n) { const tw = .7 + .3 * Math.sin(t * 5 + i * 1.7); c.fillStyle = `rgba(255,236,170,${xcA(tw)})`; c.beginPath(); for (let k = 0; k < 8; k++) { const q = k % 2 ? .8 : 2.4, a = k * Math.PI / 4 + t; k ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }
  }
};
W_PAINT.gravitron = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'gravitron'), act = m && m.xcOn > time, sp = act ? 3 : 1;
  c.fillStyle = P.dark; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(16, s * 10); c.lineTo(72, s * 6); c.lineTo(72, s * 3); c.lineTo(16, s * 4); c.closePath(); c.fill(); }
  c.fillStyle = `rgba(185,160,255,${xcA(.5 + .5 * rd)})`; circ(c, 72, -4.5, 2.3); c.fill(); circ(c, 72, 4.5, 2.3); c.fill();
  if (px > .6) { c.strokeStyle = `rgba(185,160,255,${xcA(.35 + .3 * rd)})`; c.lineWidth = 1; c.setLineDash([3, 3]); c.lineDashOffset = t * 10; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(30 + k * 12, 0, 4 + k, -1.2, 1.2); c.stroke(); } c.setLineDash([]); c.lineDashOffset = 0; }
  c.fillStyle = P.dark; ngon(c, 8, 26, Math.PI / 8); c.fill(); c.fillStyle = P.body2; circ(c, 0, 0, 22); c.fill();
  c.lineWidth = 3; for (let k = 0; k < 3; k++) { const a = t * (.8 + k * .45) * sp, ry = 21 * Math.abs(Math.cos(a)) + 2; c.strokeStyle = k === 1 ? '#b9a0ff' : P.plate; c.beginPath(); c.ellipse(0, 0, 21 - k * 3, Math.min(21 - k * 3, ry), k * Math.PI / 3, 0, TAU); c.stroke(); }
  const g = c.createRadialGradient(0, 0, 3, 0, 0, 12); g.addColorStop(0, '#000000'); g.addColorStop(.6, '#0c0418'); g.addColorStop(1, `rgba(185,160,255,${xcA(.3 + .5 * rd)})`); c.fillStyle = g; circ(c, 0, 0, 12); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; circ(c, 0, 0, 7.5); c.stroke();
};
W_PAINT.eclipse = (c, P, rec, t, m) => {
  const px = xcPx(c), rd = xcRd(m, 'eclipse'), p = .7 + .3 * Math.sin(t * 2);
  c.fillStyle = '#141018'; c.fillRect(14, -7, 54, 14); if (px > .6) { c.fillStyle = `rgba(160,128,255,${xcA(.35 + .4 * rd)})`; c.fillRect(18, -1, 46, 2); for (let k = 0; k < 5; k++) c.fillRect(20 + k * 9, -7, 1.5, 14); }
  c.fillStyle = '#0a0612'; c.beginPath(); c.moveTo(66, -8); c.lineTo(80, 0); c.lineTo(66, 8); c.closePath(); c.fill(); c.strokeStyle = '#b9a0ff'; c.lineWidth = 1; c.stroke();
  c.fillStyle = P.body; rr(c, -26, -21, 40, 42, 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
  c.globalCompositeOperation = 'lighter'; xcGlow(c, -4, 0, 24, [[.45, `rgba(255,207,122,${xcA((.5 + .5 * rd) * p)})`], [.7, `rgba(255,150,60,${xcA(.35 * p)})`], [1, 'rgba(255,120,40,0)']]);
  if (px > .6) { c.strokeStyle = `rgba(255,220,150,${xcA(.6 * p)})`; c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * TAU / 10 + t * .3, l = 19 + 4 * Math.sin(t * 3 + k * 2); c.moveTo(-4 + Math.cos(a) * 15, Math.sin(a) * 15); c.lineTo(-4 + Math.cos(a) * l, Math.sin(a) * l); } c.stroke(); }
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#05030a'; circ(c, -2.5, -1, 14.5); c.fill(); c.strokeStyle = `rgba(255,236,190,${xcA(.5 + .4 * rd)})`; c.lineWidth = .9; c.beginPath(); c.arc(-2.5, -1, 14.5, 1.6, 4.2); c.stroke();
};
