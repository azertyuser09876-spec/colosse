// Châssis de la 3.1, lot C : sept géants des rangs 9, 10 et 11, à l'échelle d'une ville, d'un continent, d'un monde.
// Rang 9 : Orogène, Maelström, Arcologie · rang 10 (Chantier titanesque niv. 4) : Pangée, Éther · rang 11 (niv. 5) : Gaïa, Constellation.
// Les perks (stomp, slowaura, aura, shield, flak) et la fabrique sont gérés ailleurs : ce fichier pose les données, les affûts,
// les peintres et les recherches. Les peintres n'emploient que la palette P pour la carrosserie ; neige, eau, verdure, verre et
// lumières sont des détails translucides, éteints sur les épaves.

// ================= DONNÉES =================
Object.assign(CHASSIS, {
  orogene: { n: TL('OROGÈNE'), tier: 9, hp: 380000, r: 820, spd: 38, slots: 12, wsize: 6, cargo: 1800, cmd: 48, crush: 9, armor: .62, perk: 'stomp', cost: { scrap: 24000, alloy: 9200, circuits: 3800, crystals: 3000, cores: 110, heart: 5 }, d: TL('Une montagne qui marche sur quatre piliers : douze affûts dont quatre apocalyptiques, retranchés dans des forteresses à flanc de roche.') },
  maelstrom: { n: TL('MAELSTRÖM'), tier: 9, hp: 300000, r: 760, spd: 46, slots: 12, wsize: 6, cargo: 1600, cmd: 46, fly: true, armor: .5, perk: 'slowaura', cost: { scrap: 22000, alloy: 7400, circuits: 5200, crystals: 3800, cores: 110, heart: 5 }, d: TL('Vaisseau-tempête enveloppé de nuées : douze affûts dont quatre apocalyptiques, et un champ qui englue tout ce qui l\'approche.') },
  arcologie: { n: TL('ARCOLOGIE'), tier: 9, hp: 340000, r: 850, spd: 30, slots: 12, wsize: 6, cargo: 4500, cmd: 47, crush: 9, armor: .6, perk: 'aura', fab: { tier: 5, cap: 6, t: 30 }, cost: { scrap: 23000, alloy: 7800, circuits: 4000, crystals: 4200, cores: 105, heart: 5 }, d: TL('Ville-jardin en terrasses sur chenilles : elle répare la flotte autour d\'elle, porte une soute immense et fabrique des robots jusqu\'au rang 5.') },
  pangee: { n: TL('PANGÉE'), tier: 10, hp: 820000, r: 980, spd: 28, slots: 16, wsize: 7, cargo: 5000, cmd: 64, crush: 10, armor: .66, perk: 'shield', fab: { tier: 6, cap: 3, t: 50 }, cost: { scrap: 52000, alloy: 17500, circuits: 9000, crystals: 7000, cores: 240, heart: 7 }, d: TL('Un continent sur chenilles : seize affûts dont quatre cataclysmiques, et ses usines lâchent des Colosses.') },
  ether: { n: TL('ÉTHER'), tier: 10, hp: 640000, r: 900, spd: 36, slots: 14, wsize: 7, cargo: 3600, cmd: 62, fly: true, armor: .56, perk: 'flak', fab: { tier: 6, cap: 2, t: 50 }, cost: { scrap: 48000, alloy: 16000, circuits: 10500, crystals: 7800, cores: 240, heart: 7 }, d: TL('Station céleste aux anneaux tournants : quatorze affûts dont quatre cataclysmiques, des tourelles qui abattent les missiles, et des baies qui lâchent des Colosses.') },
  gaia: { n: TL('GAÏA'), tier: 11, hp: 1700000, r: 1100, spd: 30, slots: 18, wsize: 8, cargo: 7000, cmd: 84, crush: 11, armor: .7, perk: 'stomp', cost: { scrap: 110000, alloy: 37000, circuits: 19000, crystals: 15000, cores: 500, heart: 9 }, d: TL('Un monde qui marche sur six jambes : dix-huit affûts dont quatre stellaires, et chacun de ses pas fait trembler le continent.') },
  constellation: { n: TL('CONSTELLATION'), tier: 11, hp: 1350000, r: 1050, spd: 34, slots: 16, wsize: 8, cargo: 5200, cmd: 82, fly: true, armor: .6, perk: 'shield', fab: { tier: 7, cap: 2, t: 80 }, cost: { scrap: 100000, alloy: 34000, circuits: 22000, crystals: 16000, cores: 500, heart: 9 }, d: TL('Forteresse stellaire autour d\'un soleil captif : seize affûts dont quatre stellaires, et sa baie libère des géants de rang 7.') },
});

// ================= AFFÛTS =================
// premiers affûts = principaux ; paires gauche/droite consécutives de même taille (y opposés)
const ccPolar = (deg, rad) => [Math.cos(deg * Math.PI / 180) * rad, Math.sin(deg * Math.PI / 180) * rad];
const ccPair = (deg, rad) => [ccPolar(-deg, rad), ccPolar(deg, rad)];
Object.assign(MOUNTS, {
  // forteresses aux flancs de la montagne, deux postes avancés au nez, deux près du sommet
  orogene: [[.5, -.36], [.5, .36], [.06, -.6], [.06, .6], [-.42, -.5], [-.42, .5], [.76, -.12], [.76, .12], [-.74, -.18], [-.74, .18], [.26, -.18], [.26, .18]],
  // couronne de la coque, puis les nacelles des turbines
  maelstrom: [...ccPair(23, .5), ...ccPair(68, .5), ...ccPair(112, .5), ...ccPair(157, .5), ...ccPair(30, .8), ...ccPair(150, .8)],
  // angles et flancs des terrasses
  arcologie: [[.56, -.42], [.56, .42], [.12, -.6], [.12, .6], [-.4, -.6], [-.4, .6], [-.7, -.42], [-.7, .42], [.02, -.37], [.02, .37], [-.46, -.2], [-.46, .2]],
  // citadelles du pourtour, puis l'intérieur du continent
  pangee: [[.58, -.3], [.58, .3], [.2, -.58], [.2, .58], [-.22, -.6], [-.22, .6], [-.58, -.42], [-.58, .42], [.3, -.14], [.3, .14], [-.12, -.24], [-.12, .24], [-.8, -.16], [-.8, .16], [.78, -.18], [.78, .18]],
  // pylônes fixes de l'anneau, milieu des flèches de cristal, deux relais près du cœur
  ether: [...ccPair(22.5, .64), ...ccPair(67.5, .64), ...ccPair(112.5, .64), ...ccPair(157.5, .64), ...ccPair(60, .86), ...ccPair(120, .86), [-.04, -.3], [-.04, .3]],
  // bastions du berceau, puis deux paires de plates-formes posées sur la planète
  gaia: [...ccPair(15, .73), ...ccPair(45, .73), ...ccPair(74, .73), ...ccPair(102, .73), ...ccPair(128, .73), ...ccPair(150, .73), ...ccPair(170, .73), [.2, -.28], [.2, .28], [-.24, -.2], [-.24, .2]],
  // huit astres-forteresses, quatre étoiles extérieures, quatre relais autour du soleil
  constellation: [...ccPair(22.5, .66), ...ccPair(67.5, .66), ...ccPair(112.5, .66), ...ccPair(157.5, .66), ...ccPair(45, .92), ...ccPair(135, .92), ...ccPair(50, .36), ...ccPair(130, .36)],
});
Object.assign(SLOT_LAYOUT, {
  orogene: [6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4], maelstrom: [6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4], arcologie: [6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4],
  pangee: [7, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4], ether: [7, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4],
  gaia: [8, 8, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4], constellation: [8, 8, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5],
});
Object.assign(MSCALE, { orogene: 8.4, maelstrom: 8.2, arcologie: 8.3, pangee: 9.8, ether: 9.6, gaia: 11, constellation: 10.8 });
Object.assign(PREV_EXT, { orogene: 1.2, maelstrom: 1.12, arcologie: 1.08, pangee: 1.12, ether: 1.14, gaia: 1.2, constellation: 1.1 });

// ================= RECHERCHES =================
addResearch({ id: 'c_orogene', cat: TL('Châssis'), lab: 5, n: TL('Géant Orogène'), req: 'c_titanide', ...SHIP(3), cost: { data: 1280, alloy: 2600, cores: 38 }, d: TL('Rang 9. Une montagne qui marche, couronnée de forteresses.'), fam: 'marcheur' });
addResearch({ id: 'c_maelstrom', cat: TL('Châssis'), lab: 5, n: TL('Géant Maelström'), req: 'c_nebuleuse', ...SHIP(3), cost: { data: 1280, circuits: 2600, cores: 38 }, d: TL('Rang 9. Vaisseau-tempête qui englue ses ennemis.'), fam: 'volant' });
addResearch({ id: 'c_arcologie', cat: TL('Châssis'), lab: 5, n: TL('Géante Arcologie'), req: 'c_caravanserail', ...SHIP(3), cost: { data: 1240, crystals: 2400, cores: 36 }, d: TL('Rang 9. Ville-jardin qui répare la flotte et fabrique jusqu\'au rang 5.'), fam: 'transport' });
addResearch({ id: 'c_pangee', cat: TL('Châssis'), lab: 5, n: TL('Géante Pangée'), req: 'c_villemachine', ...SHIP(4), cost: { data: 2600, alloy: 5200, cores: 80 }, d: TL('Rang 10. Un continent sur chenilles. Exige le Chantier titanesque niveau 4.'), fam: 'chenille' });
addResearch({ id: 'c_ether', cat: TL('Châssis'), lab: 5, n: TL('Géant Éther'), req: 'c_astre', ...SHIP(4), cost: { data: 2600, circuits: 5200, cores: 80 }, d: TL('Rang 10. Station céleste volante. Exige le Chantier titanesque niveau 4.'), fam: 'volant' });
addResearch({ id: 'c_gaia', cat: TL('Châssis'), lab: 5, n: TL('Géante Gaïa'), req: 'c_orogene', req2: ['c_pangee'], ...SHIP(5), cost: { data: 5200, alloy: 10400, cores: 160 }, d: TL('Rang 11. Un monde qui marche. Exige le Chantier titanesque niveau 5.'), fam: 'marcheur' });
addResearch({ id: 'c_constellation', cat: TL('Châssis'), lab: 5, n: TL('Géante Constellation'), req: 'c_ether', ...SHIP(5), cost: { data: 5200, circuits: 10400, cores: 160 }, d: TL('Rang 11. Forteresse stellaire qui libère des géants. Exige le Chantier titanesque niveau 5.'), fam: 'volant' });

// ================= OUTILS DE DESSIN =================
// échelle réelle du dessin (pixels par unité du monde) : le même peintre sert en jeu, dans la forge et pour les épaves
const ccZoom = c => { const T = c.getTransform(); return Math.hypot(T.a, T.b); };
const ccWreck = P => typeof PAL_WRECK !== 'undefined' && P === PAL_WRECK;
// contour organique précalculé (rayon 1) : n sommets, demi-axes ax/ay, relief amp
function ccOutline(n, ax, ay, amp, seed, ox = 0, oy = 0) {
  const p1 = hash2(seed, 1, 3) * TAU, p2 = hash2(seed, 2, 3) * TAU, out = [];
  for (let k = 0; k < n; k++) { const a = k / n * TAU, m = 1 + amp * (.55 * Math.sin(3 * a + p1) + .3 * Math.sin(7 * a + p2) + .5 * (hash2(k, seed, 5) - .5)); out.push([ox + Math.cos(a) * ax * m, oy + Math.sin(a) * ay * m]); }
  return out;
}
// ligne brisée de a vers b (crête, faille) : n segments, écart amp au milieu
function ccJag(ax, ay, bx, by, n, amp, seed) {
  const out = [[ax, ay]], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let k = 1; k < n; k++) { const f = k / n, o = (hash2(k, seed, 11) - .5) * 2 * amp * Math.sin(f * Math.PI); out.push([ax + dx * f + nx * o, ay + dy * f + ny * o]); }
  out.push([bx, by]); return out;
}
// bande effilée qui suit une ligne (langue de glacier) : largeur w au départ, nulle au bout, sur la part len de la ligne
function ccTongue(L, len, w) {
  const m = Math.max(2, Math.round((L.length - 1) * len)), a = [], b = [];
  for (let i = 0; i <= m; i++) { const p = L[i], q = L[Math.min(L.length - 1, i + 1)], o = L[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, ww = w * (1 - i / (m + .5)); a.push([p[0] - dy / d * ww, p[1] + dx / d * ww]); b.push([p[0] + dy / d * ww, p[1] - dx / d * ww]); }
  return a.concat(b.reverse());
}
function ccPath(c, pts, R, ox = 0, oy = 0) { c.beginPath(); for (let i = 0; i < pts.length; i++) { const x = ox + pts[i][0] * R, y = oy + pts[i][1] * R; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
function ccLine(c, pts, R, ox = 0, oy = 0) { c.moveTo(ox + pts[0][0] * R, oy + pts[0][1] * R); for (let i = 1; i < pts.length; i++) c.lineTo(ox + pts[i][0] * R, oy + pts[i][1] * R); }
// lumière qui clignote doucement (0…1)
const ccBlink = (t, k, f = 1.3) => .5 + .5 * Math.sin(t * f + k * 2.17);
// forteresse étoilée vue de dessus (rayon s) : bastions d'angle, cour, créneaux, fanal
function ccFort(c, x, y, s, P, t, k, hi, dead) {
  const star = (ro, ri, rot) => { c.beginPath(); for (let j = 0; j < 8; j++) { const a = rot + j / 8 * TAU, q = j % 2 ? ri : ro; j ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); };
  c.fillStyle = 'rgba(0,0,0,.3)'; star(s * 1.1, s * .78, Math.PI / 4 + .1); c.fill();
  c.fillStyle = P.dark; star(s * 1.1, s * .8, Math.PI / 4); c.fill();
  c.fillStyle = P.plate; star(s * .98, s * .7, Math.PI / 4); c.fill();
  c.fillStyle = P.body2; ngon(c, 8, s * .56, Math.PI / 8, x, y); c.fill();
  if (!hi) return;
  c.fillStyle = P.body; for (let j = 0; j < 4; j++) { const a = Math.PI / 4 + j * Math.PI / 2; c.fillRect(x + Math.cos(a) * s * .8 - s * .08, y + Math.sin(a) * s * .8 - s * .08, s * .16, s * .16); }
  if (!dead) { c.fillStyle = P.glow + (.35 + .55 * ccBlink(t, k, 2.3)).toFixed(2) + ')'; for (let j = 0; j < 4; j++) { const a = Math.PI / 4 + j * Math.PI / 2; circ(c, x + Math.cos(a) * s * .8, y + Math.sin(a) * s * .8, s * .045); c.fill(); } }
}
// turbine carénée (rayon s) : pales qui tournent, flou de rotation
function ccFan(c, x, y, s, P, t, k, hi) {
  c.fillStyle = P.dark; circ(c, x, y, s); c.fill();
  c.fillStyle = P.body2; circ(c, x, y, s * .86); c.fill();
  c.fillStyle = 'rgba(210,225,220,.1)'; circ(c, x, y, s * .8); c.fill();
  if (hi) { c.strokeStyle = 'rgba(220,230,226,.38)'; c.lineWidth = s * .09; c.beginPath(); for (let j = 0; j < 5; j++) { const b = t * 11 + k * 1.3 + j * TAU / 5; c.moveTo(x, y); c.lineTo(x + Math.cos(b) * s * .8, y + Math.sin(b) * s * .8); } c.stroke(); }
  c.strokeStyle = P.plate; c.lineWidth = s * .07; circ(c, x, y, s * .86); c.stroke();
  c.fillStyle = P.body; circ(c, x, y, s * .26); c.fill(); c.fillStyle = P.dark; circ(c, x, y, s * .1); c.fill();
}
// éclair brisé entre deux points (graine sl : change à chaque instant)
function ccBolt(c, x0, y0, x1, y1, n, amp, sl, k) {
  c.moveTo(x0, y0); const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let j = 1; j < n; j++) { const f = j / n, o = (hash2(sl * 7 + j, k, 84) - .5) * 2 * amp; c.lineTo(x0 + dx * f + nx * o, y0 + dy * f + ny * o); }
  c.lineTo(x1, y1);
}

// ================= OROGÈNE : la montagne qui marche =================
const CC_ORO = (() => {
  const S = [-.1, -.03];
  const base = ccOutline(34, .9, .78, .1, 21), mid = ccOutline(28, .64, .55, .16, 22, S[0] * .5, S[1] * .5), top = ccOutline(22, .38, .32, .22, 23, S[0], S[1]), cap = ccOutline(18, .23, .2, .18, 24, S[0], S[1]);
  const ridges = []; for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + .35 + (hash2(k, 4, 9) - .5) * .3; ridges.push(ccJag(S[0], S[1], Math.cos(a) * .84, Math.sin(a) * .72, 8, .07, 40 + k)); }
  const glac = [0, 2, 3, 5, 7].map(k => ccTongue(ridges[k], .66, .065));
  const lava = [0, 1, 2].map(k => { const a = k * 2.2 + 1; return ccJag(S[0] + Math.cos(a) * .12, S[1] + Math.sin(a) * .1, S[0] + Math.cos(a + .35) * .5, S[1] + Math.sin(a + .35) * .42, 7, .05, 70 + k); });
  const vil = []; for (let k = 0; k < 30; k++) { const a = hash2(k, 1, 77) * TAU, d = .3 + hash2(k, 2, 77) * .38; vil.push([S[0] + Math.cos(a) * d * 1.05, S[1] + Math.sin(a) * d * .9]); }
  return { S, base, mid, top, cap, ridges, glac, lava, vil, wall: [6, 0, 2, 4, 8, 9, 5, 3, 1, 7],
    legs: [[.36, -.34, .56, -.88], [.36, .34, .56, .88], [-.42, -.34, -.62, -.86], [-.42, .34, -.62, .86]] };
})();
CH_PAINT.orogene = (c, R, P, t, mv, u) => {
  const O = CC_ORO, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P), Sx = O.S[0] * R, Sy = O.S[1] * R, MS = MOUNTS.orogene;
  // quatre jambes-piliers : les pieds restent plantés, la diagonale opposée enjambe
  gait(u, O.legs, R, t, mv, { groups: [0, 1, 1, 0], stride: .3, dur: .75, f: 1.5, amp: .24, thud: giantThud }).forEach(g => {
    const dx = g.fx - g.hx, dy = g.fy - g.hy, L = Math.hypot(dx, dy), k = 1 + g.lift * .14;
    c.save(); c.translate(g.hx, g.hy); c.rotate(Math.atan2(dy, dx));
    c.fillStyle = P.dark; rr(c, -R * .12, -R * .15, L + R * .12, R * .3, R * .08); c.fill();
    c.fillStyle = P.body2; rr(c, -R * .06, -R * .11, L, R * .22, R * .06); c.fill();
    if (!lo) { c.fillStyle = P.plate; for (let j = 1; j <= 3; j++) c.fillRect(L * j / 4 - R * .02, -R * .12, R * .04, R * .24); }
    c.restore();
    if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; ngon(c, 8, R * .19, Math.PI / 8, g.fx + R * .08 * g.lift, g.fy + R * .1 * g.lift); c.fill(); }
    c.fillStyle = P.dark; ngon(c, 8, R * .2 * k, Math.PI / 8, g.fx, g.fy); c.fill();
    c.fillStyle = P.body2; ngon(c, 8, R * .17 * k, Math.PI / 8, g.fx, g.fy); c.fill();
    c.fillStyle = P.body; ngon(c, 8, R * .1 * k, Math.PI / 8, g.fx, g.fy); c.fill();
    if (hi) { c.strokeStyle = P.plate; c.lineWidth = lw * 1.5; ngon(c, 8, R * .135 * k, Math.PI / 8, g.fx, g.fy); c.stroke(); }
  });
  // le massif : étages de roche de plus en plus clairs vers le sommet
  c.fillStyle = P.body2; ccPath(c, O.base, R); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 3; c.stroke();
  c.fillStyle = P.body; ccPath(c, O.mid, R); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 1.5; c.stroke();
  c.fillStyle = P.plate; ccPath(c, O.top, R); c.fill(); c.stroke();
  // volume : lumière en haut à gauche, ombre en bas à droite
  { const g = c.createRadialGradient(-R * .4, -R * .4, R * .05, -R * .1, -R * .1, R * 1.15); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)'); c.fillStyle = g; ccPath(c, O.base, R); c.fill(); }
  // crêtes : arête sombre et versant éclairé
  c.beginPath(); for (const L of O.ridges) ccLine(c, L, R); c.strokeStyle = P.dark; c.lineWidth = lw * (lo ? 3 : 2.4); c.stroke();
  if (hi) { c.beginPath(); for (const L of O.ridges) ccLine(c, L, R, -lw * 2, -lw * 2); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = lw * 1.8; c.stroke(); }
  // enceinte : un rempart relie les forteresses tout autour de la montagne
  c.beginPath(); O.wall.forEach((i, j) => { const [x, y] = MS[i]; j ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R); }); c.closePath();
  c.strokeStyle = P.dark; c.lineWidth = lw * 5; c.stroke();
  if (!lo) { c.lineCap = 'butt'; c.strokeStyle = P.plate; c.lineWidth = lw * 2.6; c.setLineDash([lw * 3, lw * 2]); c.stroke(); c.setLineDash([]); c.lineCap = 'round'; }
  // glaciers et neiges du sommet
  if (!dead) {
    c.fillStyle = 'rgba(218,230,240,.48)'; c.beginPath(); for (const G of O.glac) { ccLine(c, G, R); c.closePath(); } c.fill();
    c.fillStyle = 'rgba(240,246,250,.82)'; ccPath(c, O.cap, R); c.fill();
    if (hi) { c.strokeStyle = 'rgba(150,180,200,.45)'; c.lineWidth = lw; c.beginPath(); for (const G of O.glac) { const n = G.length / 2 | 0; for (let j = 1; j < n - 1; j += 2) { c.moveTo(G[j][0] * R, G[j][1] * R); c.lineTo(G[G.length - 1 - j][0] * R, G[G.length - 1 - j][1] * R); } } c.stroke(); }
  }
  // cratère et failles de lave
  c.fillStyle = P.dark; c.beginPath(); c.ellipse(Sx, Sy, R * .075, R * .062, .3, 0, TAU); c.fill();
  if (!dead && !lo) { c.beginPath(); for (const L of O.lava) ccLine(c, L, R); c.strokeStyle = P.dark; c.lineWidth = lw * 3.4; c.stroke(); c.strokeStyle = P.glow + (.45 + .3 * Math.sin(t * 2.2)).toFixed(2) + ')'; c.lineWidth = lw * 1.5; c.stroke(); }
  glowCore(c, Sx, Sy, R * .1, P, t);
  // villages de roche : fenêtres qui s'allument et s'éteignent
  if (hi && !dead) { c.fillStyle = 'rgba(255,214,140,.7)'; c.beginPath(); O.vil.forEach(([x, y], k) => { if (ccBlink(t, k, .7) > .35) c.rect(x * R - lw * 1.2, y * R - lw * 1.2, lw * 2.4, lw * 2.4); }); c.fill(); }
  // forteresses accrochées aux flancs : elles portent les affûts
  const L = SLOT_LAYOUT.orogene; MS.forEach(([x, y], i) => ccFort(c, x * R, y * R, R * (.05 + .011 * L[i]), P, t, i, hi, dead));
};

// ================= MAELSTRÖM : le vaisseau-tempête =================
const CC_MAEL = (() => {
  const clouds = []; for (let b = 0; b < 3; b++) { const n = 34 - b * 7, L = []; for (let k = 0; k < n; k++) L.push([(k + hash2(k, b, 61) * .6) / n * TAU, (.97 - b * .14) * (.93 + hash2(k, b, 62) * .14), (.115 - b * .018) * (.7 + hash2(k, b, 63) * .6)]); clouds.push(L); }
  return { clouds, fans: [-30, 30, -90, 90, -150, 150].map(d => d * Math.PI / 180) };
})();
CH_PAINT.maelstrom = (c, R, P, t, mv, u) => {
  const M = CC_MAEL, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P);
  const puffs = (L, rot, k, o) => { c.beginPath(); for (const [a, d, s] of L) { const x = Math.cos(a + rot) * d * R + o * s * R, y = Math.sin(a + rot) * d * R + o * s * R; c.moveTo(x + s * R * k, y); c.arc(x, y, s * R * k, 0, TAU); } };
  const cloud = (b, rot) => {
    const L = M.clouds[b];
    if (dead) { puffs(L, rot, 1, 0); c.fillStyle = 'rgba(26,24,22,.4)'; c.fill(); return; }
    if (!lo && b < 2) { puffs(L, rot, 1, .3); c.fillStyle = 'rgba(40,46,54,.32)'; c.fill(); }
    puffs(L, rot, 1, 0); c.fillStyle = ['rgba(128,136,148,.5)', 'rgba(150,158,170,.42)', 'rgba(176,184,196,.36)'][b]; c.fill();
    if (hi && b === 0) { puffs(L, rot, .62, -.3); c.fillStyle = 'rgba(236,242,248,.2)'; c.fill(); }
  };
  // nuées intérieures et bras de la spirale, qui tournent autour de l'œil
  cloud(2, -t * .16); cloud(1, t * .11);
  if (!lo && !dead) { c.strokeStyle = 'rgba(205,214,224,.2)'; c.lineWidth = R * .045; c.beginPath(); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + t * .22, P2 = (aa, d) => [Math.cos(a + aa) * R * d, Math.sin(a + aa) * R * d]; const [x0, y0] = P2(0, .5), [x1, y1] = P2(.7, .8), [x2, y2] = P2(1.5, .98), [x3, y3] = P2(2.3, 1.04); c.moveTo(x0, y0); c.bezierCurveTo(x1, y1, x2, y2, x3, y3); } c.stroke(); }
  // six turbines sur bras
  M.fans.forEach((a, k) => {
    const x = Math.cos(a) * R * .8, y = Math.sin(a) * R * .8;
    c.strokeStyle = P.dark; c.lineWidth = R * .075; c.beginPath(); c.moveTo(Math.cos(a) * R * .55, Math.sin(a) * R * .55); c.lineTo(x, y); c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = R * .022; c.stroke();
    ccFan(c, x, y, R * (Math.abs(a) > 1.4 && Math.abs(a) < 1.8 ? .13 : .15), P, t, k, !lo);
  });
  // coque discoïde
  c.fillStyle = P.body2; circ(c, 0, 0, R * .64); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 3.5; c.stroke();
  c.fillStyle = P.body; circ(c, 0, 0, R * .55); c.fill();
  if (!lo) {
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = lw * 1.4; c.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + .1; c.moveTo(Math.cos(a) * R * .34, Math.sin(a) * R * .34); c.lineTo(Math.cos(a) * R * .64, Math.sin(a) * R * .64); } c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = lw * 2; circ(c, 0, 0, R * .595); c.stroke(); circ(c, 0, 0, R * .43); c.stroke();
    // ailerons et proue : la pointe indique l'avant
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * .78, 0); c.lineTo(R * .6, -R * .09); c.lineTo(R * .6, R * .09); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    if (hi && !dead) { c.fillStyle = P.acc; c.beginPath(); for (let k = 0; k < 28; k++) { if (ccBlink(t * 2, k, 1.7) < .4) continue; const a = k / 28 * TAU; c.rect(Math.cos(a) * R * .62 - lw, Math.sin(a) * R * .62 - lw, lw * 2, lw * 2); } c.fill(); }
  }
  // l'œil : tourbillon sombre, éclairs internes
  c.fillStyle = P.dark; circ(c, 0, 0, R * .3); c.fill();
  if (!dead) {
    c.save(); c.rotate(t * .9); c.strokeStyle = P.glow + '.35)'; c.lineWidth = lw * 2.4; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(Math.cos(k * 2.1) * R * .27, Math.sin(k * 2.1) * R * .27); c.arc(0, 0, R * (.27 - k * .06), k * 2.1, k * 2.1 + 2.4); } c.stroke(); c.restore();
    const sl = Math.floor(t * 7); c.beginPath();
    for (let i = 0; i < 5; i++) { const h = hash2(sl, i, 81); if (h < .42) continue; const a = hash2(sl, i, 82) * TAU, r1 = h > .86 ? R * .98 : R * (.2 + hash2(sl, i, 83) * .1); ccBolt(c, Math.cos(a) * R * .04, Math.sin(a) * R * .04, Math.cos(a + .25) * r1, Math.sin(a + .25) * r1, h > .86 ? 11 : 6, R * (h > .86 ? .05 : .025), sl, i); }
    c.strokeStyle = P.glow + '.5)'; c.lineWidth = lw * 4; c.stroke(); c.strokeStyle = '#f4fbff'; c.lineWidth = lw * 1.3; c.stroke();
  }
  glowCore(c, 0, 0, R * .15, P, t);
  // nuée extérieure : elle passe devant les turbines
  cloud(0, t * .07);
};

// ================= ARCOLOGIE : la ville-jardin =================
const CC_ARCO = (() => {
  const lv = [[.9, .74], [.74, .6], [.56, .45], [.36, .3]];
  const rectPt = (hw, hh, s) => { const P2 = 4 * (hw + hh); let d = s * P2; if (d < 2 * hw) return [-hw + d, -hh]; d -= 2 * hw; if (d < 2 * hh) return [hw, -hh + d]; d -= 2 * hh; if (d < 2 * hw) return [hw - d, hh]; d -= 2 * hw; return [-hw, hh - d]; };
  const trees = []; for (let l = 0; l < 3; l++) { const [hw, hh] = lv[l], n = 46 - l * 12; for (let k = 0; k < n; k++) { const [x, y] = rectPt(hw - .05, hh - .05, (k + hash2(k, l, 91) * .6) / n); if (l === 0 && x < -.8) continue; trees.push([x + (hash2(k, l, 92) - .5) * .03, y + (hash2(k, l, 93) - .5) * .03, .018 + hash2(k, l, 94) * .016]); } }
  const win = []; for (let l = 1; l < 4; l++) { const [hw, hh] = lv[l], n = 30 - l * 6; for (let k = 0; k < n; k++) win.push(rectPt(hw + .012, hh + .012, (k + .5) / n)); }
  return { lv, trees, win };
})();
CH_PAINT.arcologie = (c, R, P, t, mv, u) => {
  const A = CC_ARCO, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P);
  // sept chenilles par côté sous la dalle
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) treads(c, -R * .9 + k * R * .26, s * R * .86 - R * .08, R * .23, R * .16, P, t, R * .2);
  // dalle de base et éperon avant
  c.fillStyle = P.dark; rr(c, -R * .97, -R * .8, R * 1.92, R * 1.6, R * .08); c.fill();
  c.fillStyle = P.dark; c.beginPath(); c.moveTo(R * .95, -R * .5); c.lineTo(R * 1.04, 0); c.lineTo(R * .95, R * .5); c.closePath(); c.fill();
  if (!lo) { c.save(); c.beginPath(); c.moveTo(R * .95, -R * .47); c.lineTo(R * 1.02, 0); c.lineTo(R * .95, R * .47); c.closePath(); c.clip(); for (let k = -7; k < 7; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#1e1c18'; c.fillRect(R * .94, k * R * .07, R * .1, R * .035); } c.restore(); }
  // terrasses : chaque étage plus clair, avec son ombre portée et sa bande de jardins
  const tone = [P.body2, P.body, P.body2, P.plate];
  A.lv.forEach(([hw, hh], l) => {
    if (l) { c.fillStyle = 'rgba(0,0,0,.32)'; rr(c, -hw * R + R * .02, -hh * R + R * .028, hw * 2 * R, hh * 2 * R, R * .04); c.fill(); }
    c.fillStyle = tone[l]; rr(c, -hw * R, -hh * R, hw * 2 * R, hh * 2 * R, R * .04); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * (l ? 1.6 : 2.5); c.stroke();
    if (l < 3 && !dead) { c.strokeStyle = 'rgba(92,146,70,.55)'; c.lineWidth = R * .045; rr(c, -(hw - .05) * R, -(hh - .05) * R, (hw - .05) * 2 * R, (hh - .05) * 2 * R, R * .03); c.stroke(); }
  });
  // arbres des jardins suspendus
  if (!lo && !dead) {
    c.fillStyle = 'rgba(52,96,46,.85)'; c.beginPath(); for (const [x, y, s] of A.trees) { c.moveTo(x * R + s * R, y * R); c.arc(x * R, y * R, s * R, 0, TAU); } c.fill();
    if (hi) { c.fillStyle = 'rgba(150,200,110,.35)'; c.beginPath(); for (const [x, y, s] of A.trees) { c.moveTo(x * R, y * R); c.arc(x * R - s * R * .3, y * R - s * R * .3, s * R * .45, 0, TAU); } c.fill(); }
  }
  // cascades : de la terrasse du sommet jusqu'aux bassins de la dalle, sur les deux flancs
  if (!dead) for (const s of [-1, 1]) {
    const x = -R * .2, y0 = s * R * .3, y1 = s * R * .76;
    c.fillStyle = 'rgba(96,160,200,.5)'; c.fillRect(x - R * .035, Math.min(y0, y1), R * .07, Math.abs(y1 - y0));
    c.fillStyle = 'rgba(96,160,200,.45)'; c.beginPath(); c.ellipse(x, y1, R * .07, R * .03, 0, 0, TAU); c.fill();
    if (!lo) { c.lineCap = 'butt'; c.strokeStyle = 'rgba(230,246,255,.55)'; c.lineWidth = lw * 1.2; c.beginPath(); [-.022, -.006, .012, .025].forEach((o, j) => { c.setLineDash([R * (.05 + j * .012), R * (.03 + j * .008)]); c.lineDashOffset = (t * R * (.22 + j * .03) + j * R * .02) * -s; c.beginPath(); c.moveTo(x + o * R, y0); c.lineTo(x + o * R, y1); c.stroke(); }); c.setLineDash([]); c.lineDashOffset = 0; c.lineCap = 'round'; }
  }
  // serres : voûte de verre à l'avant, dômes à la proue et à la poupe
  const glass = (al) => dead ? 'rgba(20,18,16,.5)' : `rgba(170,220,232,${al})`;
  c.fillStyle = glass(.3); rr(c, R * .39, -R * .22, R * .14, R * .44, R * .06); c.fill(); c.strokeStyle = 'rgba(220,240,246,.5)'; c.lineWidth = lw * 1.2; c.stroke();
  if (hi) { c.beginPath(); for (let k = 1; k < 8; k++) { c.moveTo(R * .39, -R * .22 + k * R * .055); c.lineTo(R * .53, -R * .22 + k * R * .055); } c.stroke(); }
  for (const x of [.65, -.65]) { c.fillStyle = glass(.32); circ(c, x * R, 0, R * .075); c.fill(); c.stroke(); if (hi) { c.beginPath(); c.moveTo(x * R - R * .075, 0); c.lineTo(x * R + R * .075, 0); c.moveTo(x * R, -R * .075); c.lineTo(x * R, R * .075); c.stroke(); } }
  // pyramide de verre du sommet : quatre faces éclairées différemment
  const [tw, th] = A.lv[3], face = (x1, y1, x2, y2, al) => { c.fillStyle = glass(al); c.beginPath(); c.moveTo(0, 0); c.lineTo(x1 * R, y1 * R); c.lineTo(x2 * R, y2 * R); c.closePath(); c.fill(); };
  face(-tw, -th, tw, -th, .42); face(tw, -th, tw, th, .26); face(tw, th, -tw, th, .18); face(-tw, th, -tw, -th, .34);
  c.strokeStyle = P.plate; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(-tw * R, -th * R); c.lineTo(tw * R, th * R); c.moveTo(tw * R, -th * R); c.lineTo(-tw * R, th * R); c.stroke();
  // fenêtres au pied des terrasses
  if (hi && !dead) { c.fillStyle = 'rgba(255,214,140,.65)'; c.beginPath(); A.win.forEach(([x, y], k) => { if (ccBlink(t, k, .6) > .3) c.rect(x * R - lw, y * R - lw, lw * 2, lw * 2); }); c.fill(); }
  // porte de la fabrique, à la poupe
  c.fillStyle = P.dark; c.fillRect(-R * .97, -R * .26, R * .07, R * .52);
  c.fillStyle = P.glow + (.25 + fabDoor(u) * .6).toFixed(2) + ')'; c.fillRect(-R * .97, -R * .24, R * .035, R * .48);
  if (!lo) { c.strokeStyle = '#e0b030'; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(-R * .9, -R * .28); c.lineTo(-R * .9, R * .28); c.stroke(); }
  // socles des affûts sur les terrasses
  MOUNTS.arcologie.forEach(([x, y], i) => { c.fillStyle = P.dark; ngon(c, 6, R * (.05 + .008 * SLOT_LAYOUT.arcologie[i]), 0, x * R, y * R); c.fill(); });
  glowCore(c, 0, 0, R * .1, P, t);
};

// ================= PANGÉE : le continent sur chenilles =================
const CC_PAN = (() => {
  const coast = ccOutline(60, .84, .78, .17, 31), C0 = [.04, .02];
  const rA = [-2.25, -.7, .95, 2.45], rifts = rA.map((a, k) => ccJag(C0[0], C0[1], Math.cos(a) * .95, Math.sin(a) * .88, 10, .07, 100 + k));
  const plates = rA.map((a, k) => { const b = rA[(k + 1) % 4] + (k === 3 ? TAU : 0), arc = []; for (let j = 1; j < 8; j++) { const q = a + (b - a) * j / 8; arc.push([Math.cos(q) * 1.3, Math.sin(q) * 1.3]); } return rifts[k].concat(arc, rifts[(k + 1) % 4].slice().reverse()); });
  // chaînes de montagnes : [x, y, dx, dy, taille]
  const chain = (ax, ay, bx, by, n, seed) => { const out = [], L = Math.hypot(bx - ax, by - ay); for (let k = 0; k < n; k++) { const f = (k + .5) / n, w = Math.sin(f * Math.PI * 2 + seed) * .03; const ra = Math.atan2(by - ay, bx - ax) + (hash2(k, seed, 6) - .5) * 1.4; out.push([ax + (bx - ax) * f - (by - ay) / L * w + (hash2(k, seed, 7) - .5) * .05, ay + (by - ay) * f + (bx - ax) / L * w + (hash2(k, seed, 8) - .5) * .05, Math.cos(ra), Math.sin(ra), .045 + hash2(k, seed, 9) * .05]); } return out; };
  const peaks = [].concat(chain(.5, -.46, -.1, -.64, 11, 1), chain(.4, .28, -.3, .56, 12, 2), chain(-.66, -.34, -.44, .08, 8, 3), chain(.68, .0, .52, .34, 6, 4));
  const cities = []; [[.42, -.12], [-.36, -.36], [.06, .42], [-.5, .28], [.62, .5], [.1, -.4], [-.3, .02]].forEach(([cx, cy], k) => { const n = 9 + (hash2(k, 1, 13) * 7 | 0); for (let j = 0; j < n; j++) { const a = hash2(j, k, 14) * TAU, d = Math.sqrt(hash2(j, k, 15)) * .075; cities.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, .016 + hash2(j, k, 16) * .018, .016 + hash2(j, k, 17) * .016, k]); } });
  const lakes = [[-.18, -.14, .11, .07], [.24, .16, .08, .06], [-.6, .5, .09, .06], [.66, -.36, .07, .05], [-.04, .7, .06, .04]].map(([x, y, a, b], k) => ccOutline(16, a, b, .3, 120 + k, x, y));
  const woods = [[.16, -.24, .14, .1], [-.46, -.1, .12, .14], [-.16, .44, .16, .08], [.5, .62, .12, .08], [-.2, -.7, .12, .06]].map(([x, y, a, b], k) => ccOutline(18, a, b, .35, 130 + k, x, y));
  const treads = []; for (let k = 0; k < 32; k++) { const a = (k + .5) / 32 * TAU; treads.push([Math.cos(a) * .99, Math.sin(a) * .94]); }
  return { coast, C0, rifts, plates, peaks, cities, lakes, woods, treads };
})();
CH_PAINT.pangee = (c, R, P, t, mv, u) => {
  const N = CC_PAN, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P);
  // jupe porteuse et trente chenilles sur le pourtour
  for (const [x, y] of N.treads) treads(c, x * R - R * .11, y * R - R * .045, R * .22, R * .09, P, t, R * .2);
  c.fillStyle = P.dark; c.beginPath(); c.ellipse(0, 0, R * .97, R * .92, 0, 0, TAU); c.fill();
  if (!dead) { c.strokeStyle = 'rgba(40,92,124,.5)'; c.lineWidth = R * .16; c.beginPath(); c.ellipse(0, 0, R * .86, R * .81, 0, 0, TAU); c.stroke(); }
  // le continent : côte, plaques tectoniques de teintes différentes
  c.fillStyle = P.body2; ccPath(c, N.coast, R); c.fill();
  c.save(); ccPath(c, N.coast, R); c.clip();
  c.fillStyle = P.body; ccPath(c, N.plates[0], R); c.fill(); ccPath(c, N.plates[2], R); c.fill();
  if (!dead && !lo) {
    c.fillStyle = 'rgba(70,112,56,.55)'; c.beginPath(); for (const L of N.woods) { ccLine(c, L, R); c.closePath(); } c.fill();
    c.fillStyle = 'rgba(56,104,136,.7)'; c.beginPath(); for (const L of N.lakes) { ccLine(c, L, R); c.closePath(); } c.fill(); c.strokeStyle = 'rgba(170,214,236,.45)'; c.lineWidth = lw * 1.2; c.stroke();
  }
  // failles : magma qui coule entre les plaques
  c.beginPath(); for (const L of N.rifts) ccLine(c, L, R); c.strokeStyle = P.dark; c.lineWidth = lw * 6; c.stroke();
  if (!dead) { c.strokeStyle = P.glow + (.4 + .25 * Math.sin(t * 1.6)).toFixed(2) + ')'; c.lineWidth = lw * 2.6; c.stroke(); if (!lo) { c.strokeStyle = 'rgba(255,240,210,.5)'; c.lineWidth = lw * 1.1; c.setLineDash([R * .02, R * .05]); c.lineDashOffset = -t * R * .06; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; } }
  c.restore();
  c.strokeStyle = P.dark; c.lineWidth = lw * 3; ccPath(c, N.coast, R); c.stroke();
  if (!lo) { c.strokeStyle = P.plate; c.lineWidth = lw * 1.4; c.save(); c.scale(.965, .965); ccPath(c, N.coast, R); c.restore(); c.stroke(); }
  // chaînes de montagnes : versant éclairé, versant à l'ombre, neiges
  if (!lo) {
    const half = (sg) => { c.beginPath(); for (const [x, y, dx, dy, s] of N.peaks) { const X = x * R, Y = y * R, S = s * R; c.moveTo(X - dx * S, Y - dy * S); c.lineTo(X + dx * S, Y + dy * S); c.lineTo(X - dy * S * .7 * sg, Y + dx * S * .7 * sg); c.closePath(); } };
    half(1); c.fillStyle = P.plate; c.fill(); half(-1); c.fillStyle = P.dark; c.fill();
    if (!dead) { c.fillStyle = 'rgba(238,244,248,.75)'; c.beginPath(); for (const [x, y, dx, dy, s] of N.peaks) { if (s < .07) continue; const X = x * R, Y = y * R, S = s * R * .35; c.moveTo(X - dx * S, Y - dy * S); c.lineTo(X + dx * S, Y + dy * S); c.lineTo(X - dy * S * .7, Y + dx * S * .7); c.closePath(); } c.fill(); }
  }
  // villes : toits, puis lumières
  if (!lo) {
    c.fillStyle = P.plate; c.beginPath(); for (const [x, y, w, h] of N.cities) c.rect((x - w / 2) * R, (y - h / 2) * R, w * R, h * R); c.fill();
    if (hi) { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * .8; c.stroke(); }
    if (hi && !dead) { c.fillStyle = 'rgba(255,214,140,.75)'; c.beginPath(); N.cities.forEach(([x, y, w, h, k], j) => { if (ccBlink(t, j + k, .8) > .4) c.rect(x * R - lw, y * R - lw, lw * 2, lw * 2); }); c.fill(); }
  }
  // lame de proue : elle rase le paysage
  c.strokeStyle = P.dark; c.lineWidth = R * .075; c.beginPath(); c.arc(0, 0, R * .93, -.55, .55); c.stroke();
  if (!lo) { c.lineCap = 'butt'; c.strokeStyle = '#e0b030'; c.lineWidth = R * .05; c.setLineDash([R * .045, R * .045]); c.beginPath(); c.arc(0, 0, R * .93, -.52, .52); c.stroke(); c.setLineDash([]); c.lineCap = 'round'; }
  // usines de la poupe et leur porte
  for (let k = 0; k < 5; k++) { const x = -R * .72 + (k % 2) * R * .1, y = (k - 2) * R * .1; c.fillStyle = P.body; c.fillRect(x - R * .045, y - R * .04, R * .09, R * .08); c.strokeStyle = P.dark; c.lineWidth = lw * 1.3; c.strokeRect(x - R * .045, y - R * .04, R * .09, R * .08); if (!lo) { c.fillStyle = P.dark; circ(c, x + R * .02, y, R * .018); c.fill(); if (!dead) { c.fillStyle = `rgba(255,140,60,${(.4 + .3 * Math.sin(t * 5 + k * 1.7)).toFixed(2)})`; circ(c, x + R * .02, y, R * .009); c.fill(); } } }
  c.fillStyle = P.dark; c.fillRect(-R * .9, -R * .2, R * .07, R * .4); c.fillStyle = P.glow + (.25 + fabDoor(u) * .6).toFixed(2) + ')'; c.fillRect(-R * .9, -R * .18, R * .035, R * .36);
  // citadelles qui portent les affûts
  const L = SLOT_LAYOUT.pangee; MOUNTS.pangee.forEach(([x, y], i) => { const s = R * (.03 + .008 * L[i]); c.fillStyle = P.dark; ngon(c, 6, s * 1.15, 0, x * R, y * R); c.fill(); c.fillStyle = P.plate; ngon(c, 6, s, 0, x * R, y * R); c.fill(); });
  // point chaud : le cœur du continent
  glowCore(c, N.C0[0] * R, N.C0[1] * R, R * .09, P, t);
};

// ================= ÉTHER : la station céleste =================
const CC_ETH = (() => {
  const sw = []; for (let k = 0; k < 48; k++) sw.push([k % 3, hash2(k, 1, 71), hash2(k, 2, 71), hash2(k, 3, 71)]);
  const pyl = MOUNTS.ether.slice(0, 8), spires = [0, 60, 120, 180, 240, 300].map(d => d * Math.PI / 180);
  return { sw, pyl, spires };
})();
CH_PAINT.ether = (c, R, P, t, mv, u) => {
  const E = CC_ETH, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P);
  const pol = (a, d) => [Math.cos(a) * d * R, Math.sin(a) * d * R];
  // voiles d'énergie tendues entre les flèches : elles ondulent
  if (!dead) for (let k = 0; k < 6; k++) {
    const a0 = E.spires[k], a1 = a0 + TAU / 6, am = a0 + TAU / 12, w = .09 + .05 * Math.sin(t * 1.3 + k * 1.7);
    const [x0, y0] = pol(a0 + .1, .36), [x1, y1] = pol(a0 + .045, .88), [xm, ym] = pol(am, .8 + .06 * Math.sin(t * 2 + k)), [x2, y2] = pol(a1 - .045, .88), [x3, y3] = pol(a1 - .1, .36), [xi, yi] = pol(am, .44);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.quadraticCurveTo(xm, ym, x2, y2); c.lineTo(x3, y3); c.quadraticCurveTo(xi, yi, x0, y0); c.closePath();
    c.fillStyle = P.glow + w.toFixed(3) + ')'; c.fill();
    if (!lo) { c.strokeStyle = P.glow + (w + .2).toFixed(3) + ')'; c.lineWidth = lw * 1.2; c.stroke(); }
  }
  // anneau extérieur, qui tourne lentement
  c.strokeStyle = P.dark; c.lineWidth = R * .045; circ(c, 0, 0, R * .94); c.stroke();
  c.strokeStyle = P.body2; c.lineWidth = R * .028; c.stroke();
  if (!lo) { c.save(); c.rotate(t * .05); c.fillStyle = P.plate; for (let k = 0; k < 30; k++) { const a = k / 30 * TAU; c.save(); c.rotate(a); c.fillRect(R * .92, -R * .022, R * .04, R * .044); c.restore(); } c.restore(); }
  // flèches de cristal ; la plus longue marque la proue
  for (let k = 0; k < 6; k++) {
    const L = R * (k === 0 ? 1.12 : 1.0); c.save(); c.rotate(E.spires[k]);
    c.fillStyle = dead ? P.body2 : P.glow + '.32)'; c.beginPath(); c.moveTo(R * .26, 0); c.lineTo(R * .52, -R * .06); c.lineTo(L, 0); c.lineTo(R * .52, R * .06); c.closePath(); c.fill();
    c.strokeStyle = dead ? P.dark : 'rgba(240,252,255,.6)'; c.lineWidth = lw * 1.4; c.stroke();
    if (!dead && !lo) { c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(R * .26, 0); c.lineTo(R * .52, -R * .06); c.lineTo(L, 0); c.closePath(); c.fill(); c.strokeStyle = P.glow + (.5 + .4 * ccBlink(t * 2, k)).toFixed(2) + ')'; c.lineWidth = lw * 1.6; c.beginPath(); c.moveTo(R * .3, 0); c.lineTo(L * .97, 0); c.stroke(); }
    c.restore();
  }
  // deux baies de lancement de part et d'autre de la flèche de poupe : les renforts en sortent
  { const op = fabDoor(u); for (const s of [-1, 1]) { c.fillStyle = P.dark; rr(c, -R * .9, s * R * .13 - R * .055, R * .2, R * .11, R * .02); c.fill(); c.fillStyle = P.body2; c.fillRect(-R * .86, s * R * .13 - R * .035, R * .14, R * .07); c.fillStyle = P.glow + (.2 + op * .65).toFixed(2) + ')'; c.fillRect(-R * .9, s * R * .13 - R * .035, R * .03, R * .07); } }
  // anneau médian habité, contre-rotatif
  c.strokeStyle = P.dark; c.lineWidth = R * .085; circ(c, 0, 0, R * .66); c.stroke();
  c.strokeStyle = P.body2; c.lineWidth = R * .06; c.stroke();
  c.save(); c.rotate(-t * .08);
  for (let k = 0; k < 14; k++) { c.save(); c.rotate(k / 14 * TAU); c.fillStyle = P.body; rr(c, R * .615, -R * .06, R * .09, R * .12, R * .02); c.fill(); if (!lo) { c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke(); } if (hi && !dead) { c.fillStyle = `rgba(255,214,140,${(.25 + .5 * ccBlink(t, k, .9)).toFixed(2)})`; c.fillRect(R * .635, -R * .035, R * .05, R * .018); c.fillRect(R * .635, R * .017, R * .05, R * .018); } c.restore(); }
  c.restore();
  // rayons de liaison et pylônes fixes qui portent les affûts
  c.beginPath(); for (const [x, y] of E.pyl) { c.moveTo(x * R * .3, y * R * .3); c.lineTo(x * R, y * R); } c.strokeStyle = P.dark; c.lineWidth = lw * 4.5; c.stroke(); c.strokeStyle = P.plate; c.lineWidth = lw * 1.6; c.stroke();
  E.pyl.forEach(([x, y], k) => { const s = R * (k < 4 ? .09 : .08); c.fillStyle = P.dark; ngon(c, 6, s * 1.15, 0, x * R, y * R); c.fill(); c.fillStyle = P.plate; ngon(c, 6, s, 0, x * R, y * R); c.fill(); c.fillStyle = P.body2; ngon(c, 6, s * .6, Math.PI / 6, x * R, y * R); c.fill(); });
  // anneau intérieur et cœur de cristal
  c.fillStyle = P.body2; circ(c, 0, 0, R * .3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 3; c.stroke();
  if (!lo) { c.save(); c.rotate(t * .2); c.strokeStyle = P.acc; c.lineWidth = lw * 1.6; c.setLineDash([R * .04, R * .03]); circ(c, 0, 0, R * .25); c.stroke(); c.setLineDash([]); c.restore(); }
  c.save(); c.rotate(t * .3); c.fillStyle = dead ? P.plate : P.glow + '.45)'; c.strokeStyle = dead ? P.dark : 'rgba(240,252,255,.55)'; c.lineWidth = lw;
  for (let k = 0; k < 8; k++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(R * .04, 0); c.lineTo(R * .1, -R * .025); c.lineTo(R * (k % 2 ? .17 : .22), 0); c.lineTo(R * .1, R * .025); c.closePath(); c.fill(); c.stroke(); }
  c.restore();
  glowCore(c, 0, 0, R * .14, P, t);
  // essaims de lumières qui tournent autour de la station
  if (!lo && !dead) {
    const pts = E.sw.map(([g, ph, rd, sp]) => { const A = t * (.18 + g * .05) * (g === 1 ? -1 : 1) + g * 2.1, cx = Math.cos(A) * R * (.8 + .1 * Math.sin(t * .5 + g)), cy = Math.sin(A) * R * (.78 + .1 * Math.cos(t * .4 + g)), b = t * (1.5 + sp) + ph * TAU; return [cx + Math.cos(b) * R * .09 * rd, cy + Math.sin(b) * R * .06 * rd]; });
    for (const [k, col] of [[2.6, P.glow + '.22)'], [.9, 'rgba(255,255,255,.9)']]) { c.fillStyle = col; c.beginPath(); for (const [x, y] of pts) { c.moveTo(x + lw * k, y); c.arc(x, y, lw * k, 0, TAU); } c.fill(); }
  }
};

// ================= GAÏA : le monde qui marche =================
const CC_GAIA = (() => {
  const cont = []; [[0, .45, .5], [.9, -.45, .36], [1.8, .1, .55], [2.9, -.3, .42], [3.7, .5, .4], [4.6, -.2, .5], [5.5, .35, .34]].forEach(([lon, lat, s], i) => { for (let k = 0; k < 5; k++) cont.push([lon + (hash2(k, i, 51) - .5) * s * 1.4, lat + (hash2(k, i, 52) - .5) * s * 1.1, s * (.5 + hash2(k, i, 53) * .45)]); });
  const cloud = []; for (let k = 0; k < 16; k++) cloud.push([hash2(k, 1, 57) * TAU, (hash2(k, 2, 57) - .5) * 2.4, .1 + hash2(k, 3, 57) * .16]);
  const lit = []; for (const [lon, lat, s] of cont) for (let k = 0; k < 2; k++) lit.push([lon + (hash2(k, lon * 100 | 0, 58) - .5) * s, lat + (hash2(k, lat * 100 | 0, 59) - .5) * s]);
  return { cont, cloud, lit,
    legs: [[.38, -.36, .66, -.86], [.38, .36, .66, .86], [-.02, -.52, -.02, -1.04], [-.02, .52, -.02, 1.04], [-.4, -.34, -.68, -.84], [-.4, .34, -.68, .84]] };
})();
CH_PAINT.gaia = (c, R, P, t, mv, u) => {
  const G = CC_GAIA, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P), Rs = R * .58;
  // six jambes cyclopéennes : deux trépieds qui alternent ; genoux vers l'avant, ou vers l'arrière pour la paire de poupe
  gait(u, G.legs, R, t, mv, { groups: [0, 1, 1, 0, 0, 1], stride: .28, dur: .8, f: 1.4, amp: .22, thud: giantThud }).forEach(g => {
    const side = (g.hy < 0 ? 1 : -1) * (g.hx < -.1 * R ? -1 : 1), [kx, ky] = knee(g.hx, g.hy, g.fx, g.fy, R * .42, R * .42, side), k = 1 + g.lift * .3;
    c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(kx, ky); c.lineTo(g.fx, g.fy);
    c.strokeStyle = P.dark; c.lineWidth = R * .14; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = R * .1; c.stroke();
    if (!lo) { c.strokeStyle = P.plate; c.lineWidth = R * .035; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(kx, ky); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(kx + (g.fx - kx) * .2, ky + (g.fy - ky) * .2); c.lineTo(kx + (g.fx - kx) * .8, ky + (g.fy - ky) * .8); c.stroke(); }
    c.fillStyle = P.body; circ(c, kx, ky, R * .085); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke();
    if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; ngon(c, 6, R * .14, 0, g.fx + R * .1 * g.lift, g.fy + R * .13 * g.lift); c.fill(); }
    const fa = Math.atan2(g.fy - ky, g.fx - kx);
    c.fillStyle = P.dark; c.beginPath(); for (const o of [-.6, 0, .6]) { c.moveTo(g.fx + Math.cos(fa + o - .2) * R * .1 * k, g.fy + Math.sin(fa + o - .2) * R * .1 * k); c.lineTo(g.fx + Math.cos(fa + o) * R * .2 * k, g.fy + Math.sin(fa + o) * R * .2 * k); c.lineTo(g.fx + Math.cos(fa + o + .2) * R * .1 * k, g.fy + Math.sin(fa + o + .2) * R * .1 * k); } c.fill();
    c.fillStyle = P.body2; ngon(c, 6, R * .13 * k, 0, g.fx, g.fy); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke();
    if (!lo) { c.fillStyle = P.plate; ngon(c, 6, R * .07 * k, Math.PI / 6, g.fx, g.fy); c.fill(); }
  });
  // berceau : couronne blindée qui porte la planète et les bastions
  c.fillStyle = P.body2; c.beginPath(); c.arc(0, 0, R * .83, 0, TAU); c.arc(0, 0, R * .62, 0, TAU, true); c.fill('evenodd');
  c.strokeStyle = P.dark; c.lineWidth = lw * 3.5; circ(c, 0, 0, R * .83); c.stroke(); c.lineWidth = lw * 2.5; circ(c, 0, 0, R * .62); c.stroke();
  if (!lo) {
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 1.3; c.beginPath(); for (let k = 0; k < 42; k++) { const a = k / 42 * TAU; c.moveTo(Math.cos(a) * R * .64, Math.sin(a) * R * .64); c.lineTo(Math.cos(a) * R * .81, Math.sin(a) * R * .81); } c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = R * .016; circ(c, 0, 0, R * .725); c.stroke();
    if (hi && !dead) { c.fillStyle = P.acc; c.beginPath(); for (let k = 0; k < 56; k++) { if (ccBlink(t * 1.5, k, 1.1) < .45) continue; const a = (k + .5) / 56 * TAU; c.rect(Math.cos(a) * R * .8 - lw, Math.sin(a) * R * .8 - lw, lw * 2, lw * 2); } c.fill(); }
  }
  // épaulières au-dessus des hanches
  for (const L of G.legs) { const a = Math.atan2(L[1], L[0]); c.save(); c.rotate(a); c.fillStyle = P.body; rr(c, R * .6, -R * .1, R * .26, R * .2, R * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke(); if (!lo) { c.fillStyle = P.plate; c.fillRect(R * .64, -R * .07, R * .03, R * .14); c.fillRect(R * .72, -R * .07, R * .03, R * .14); } c.restore(); }
  // bastions de la couronne (affûts 0 à 13)
  const MS = MOUNTS.gaia, SL = SLOT_LAYOUT.gaia;
  for (let i = 0; i < 14; i++) { const [x, y] = MS[i], s = R * (.03 + .007 * SL[i]); c.fillStyle = P.dark; ngon(c, 8, s * 1.15, Math.PI / 8, x * R, y * R); c.fill(); c.fillStyle = P.plate; ngon(c, 8, s, Math.PI / 8, x * R, y * R); c.fill(); }
  // la planète : océans, continents qui défilent, nuages, terminateur et atmosphère
  c.strokeStyle = P.dark; c.lineWidth = R * .05; circ(c, 0, 0, R * .6); c.stroke();
  c.save(); circ(c, 0, 0, Rs); c.clip();
  c.fillStyle = dead ? P.body2 : '#264e68'; c.fillRect(-Rs, -Rs, Rs * 2, Rs * 2);
  c.rotate(-.38);
  const spin = t * .05, proj = (lon, lat) => { const dl = lon + spin, cz = Math.cos(dl) * Math.cos(lat); return [Math.sin(dl) * Math.cos(lat) * Rs, Math.sin(lat) * Rs, cz, Math.cos(dl)]; };
  c.beginPath(); for (const [lon, lat, s] of G.cont) { const [x, y, cz, cl] = proj(lon, lat); if (cz < -.05) continue; const rx = s * Rs * Math.max(.1, cl) * .9, ry = s * Rs * Math.max(.2, Math.cos(lat)) * .8; c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); }
  c.fillStyle = P.plate; c.fill(); if (!dead) { c.fillStyle = 'rgba(96,140,70,.42)'; c.fill(); }
  if (!lo && !dead) {
    c.fillStyle = 'rgba(244,248,252,.8)'; c.beginPath(); c.ellipse(0, -Rs * .96, Rs * .34, Rs * .1, 0, 0, TAU); c.ellipse(0, Rs * .97, Rs * .28, Rs * .08, 0, 0, TAU); c.fill();
    const cs = t * .085; c.fillStyle = 'rgba(240,246,250,.42)'; c.beginPath();
    for (const [lon, lat, s] of G.cloud) { const dl = lon + cs, cz = Math.cos(dl) * Math.cos(lat * .6); if (cz < 0) continue; const x = Math.sin(dl) * Math.cos(lat * .6) * Rs, y = Math.sin(lat * .6) * Rs, rx = s * Rs * 1.6 * Math.max(.15, Math.cos(dl)), ry = s * Rs * .35; c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, .15, 0, TAU); }
    c.fill();
    // lumières des villes, sur la face de nuit
    if (hi) { c.fillStyle = 'rgba(255,214,140,.8)'; c.beginPath(); for (const [lon, lat] of G.lit) { const [x, y, cz] = proj(lon, lat); if (cz < .1 || x + y * .3 < Rs * .15) continue; c.rect(x - lw, y - lw, lw * 2, lw * 2); } c.fill(); }
  }
  c.rotate(.38);
  { const g = c.createRadialGradient(-Rs * .38, -Rs * .38, Rs * .1, -Rs * .1, -Rs * .1, Rs * 1.3); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)'); c.fillStyle = g; c.fillRect(-Rs, -Rs, Rs * 2, Rs * 2); }
  c.restore();
  if (!dead) { c.strokeStyle = P.glow + '.55)'; c.lineWidth = lw * 3; circ(c, 0, 0, Rs * 1.01); c.stroke(); c.strokeStyle = 'rgba(200,236,255,.3)'; c.lineWidth = lw * 1.2; circ(c, 0, 0, Rs * 1.03); c.stroke(); }
  // plates-formes posées sur la planète (affûts 14 à 17)
  for (let i = 14; i < 18; i++) { const [x, y] = MS[i], s = R * (.028 + .006 * SL[i]); c.fillStyle = P.dark; ngon(c, 6, s * 1.2, 0, x * R, y * R); c.fill(); c.fillStyle = P.body; ngon(c, 6, s, 0, x * R, y * R); c.fill(); if (!lo) { c.strokeStyle = P.plate; c.lineWidth = lw * 1.5; c.stroke(); } }
  // une lune minuscule en orbite basse
  if (!lo) { const a = t * .12 + 1, mx = Math.cos(a) * R * .92, my = Math.sin(a) * R * .92 * .9; c.fillStyle = 'rgba(0,0,0,.25)'; circ(c, mx + R * .03, my + R * .04, R * .05); c.fill(); c.fillStyle = P.plate; circ(c, mx, my, R * .05); c.fill(); c.fillStyle = 'rgba(0,0,0,.3)'; circ(c, mx + R * .015, my + R * .012, R * .04); c.fill(); if (hi) { c.fillStyle = 'rgba(0,0,0,.25)'; circ(c, mx - R * .015, my - R * .01, R * .01); c.fill(); circ(c, mx + R * .01, my - R * .02, R * .007); c.fill(); } }
  // proue : un éperon au front du berceau
  c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * .95, 0); c.lineTo(R * .82, -R * .07); c.lineTo(R * .82, R * .07); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
  glowCore(c, R * .87, 0, R * .04, P, t);
};

// ================= CONSTELLATION : la forteresse stellaire =================
const CC_CONS = (() => {
  const M = MOUNTS.constellation, big = M.slice(0, 8), out = M.slice(8, 12), inn = M.slice(12, 16), prow = [.97, 0];
  // ordre angulaire des huit astres : la couronne de faisceaux les relie dans cet ordre
  const ring = big.slice().sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  const links = [];
  ring.forEach((p, k) => links.push([p, ring[(k + 1) % 8]]));
  for (const p of big) links.push([[0, 0], p]);
  for (const o of out) { const near = big.slice().sort((a, b) => d2(a[0], a[1], o[0], o[1]) - d2(b[0], b[1], o[0], o[1])); links.push([o, near[0]], [o, near[1]]); }
  links.push([prow, big[0]], [prow, big[1]]);
  const dust = []; for (let k = 0; k < 26; k++) { const a = hash2(k, 1, 33) * TAU, d = .3 + hash2(k, 2, 33) * .72; dust.push([Math.cos(a) * d, Math.sin(a) * d]); }
  return { big, out, inn, prow, links, dust };
})();
CH_PAINT.constellation = (c, R, P, t, mv, u) => {
  const K = CC_CONS, lw = Math.max(1.5, R * .01), px = R * ccZoom(c), hi = px > 120, lo = px < 45, dead = ccWreck(P);
  // poussière d'étoiles qui scintille
  if (hi && !dead) { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); K.dust.forEach(([x, y], k) => { const s = lw * (.6 + ccBlink(t * 2, k, 1.9) * 1.2); c.moveTo(x * R + s, y * R); c.arc(x * R, y * R, s, 0, TAU); }); c.fill(); }
  // charpente : poutres doubles le long de chaque faisceau
  c.beginPath(); for (const [a, b] of K.links) { c.moveTo(a[0] * R, a[1] * R); c.lineTo(b[0] * R, b[1] * R); }
  c.strokeStyle = P.dark; c.lineWidth = lw * 6; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = lw * 3.4; c.stroke();
  if (!dead) { c.strokeStyle = P.glow + (.3 + .15 * Math.sin(t * 2)).toFixed(2) + ')'; c.lineWidth = lw * 1.8; c.stroke();
    if (!lo) { c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = lw * 1.2; c.setLineDash([R * .015, R * .07]); c.lineDashOffset = -t * R * .12; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; } }
  // baie de lancement des géants, à la poupe
  c.fillStyle = P.body2; rr(c, -R * 1.0, -R * .17, R * .28, R * .34, R * .03); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 3; c.stroke();
  c.fillStyle = P.dark; c.fillRect(-R * .97, -R * .12, R * .2, R * .24); if (!lo) { c.strokeStyle = P.body2; c.lineWidth = lw * 1.5; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(-R * .97 + k * R * .04, -R * .12); c.lineTo(-R * .97 + k * R * .04, R * .12); } c.stroke(); }
  c.fillStyle = P.glow + (.2 + fabDoor(u) * .65).toFixed(2) + ')'; c.fillRect(-R * 1.0, -R * .12, R * .04, R * .24);
  if (!lo) { c.lineCap = 'butt'; c.strokeStyle = '#e0b030'; c.lineWidth = lw * 2; c.setLineDash([lw * 3, lw * 3]); c.beginPath(); c.moveTo(-R * .95, -R * .14); c.lineTo(-R * .76, -R * .14); c.moveTo(-R * .95, R * .14); c.lineTo(-R * .76, R * .14); c.stroke(); c.setLineDash([]); c.lineCap = 'round'; }
  // relais autour du soleil
  for (const [x, y] of K.inn) { c.fillStyle = P.dark; ngon(c, 6, R * .07, 0, x * R, y * R); c.fill(); c.fillStyle = P.plate; ngon(c, 6, R * .058, 0, x * R, y * R); c.fill(); }
  // le soleil captif : couronne, disque, cage gyroscopique
  if (!dead) {
    c.save(); c.rotate(t * .12); c.fillStyle = P.glow + '.22)'; c.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, L = R * (k % 2 ? .4 : .5 + .04 * Math.sin(t * 3 + k)); c.moveTo(Math.cos(a - .09) * R * .2, Math.sin(a - .09) * R * .2); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(Math.cos(a + .09) * R * .2, Math.sin(a + .09) * R * .2); } c.fill(); c.restore();
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R * .34); g.addColorStop(0, '#fffbea'); g.addColorStop(.35, '#fff1c8'); g.addColorStop(.55, P.glow + '.85)'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; circ(c, 0, 0, R * .34); c.fill();
    if (hi) { c.save(); c.rotate(-t * .2); c.fillStyle = 'rgba(255,200,120,.3)'; c.beginPath(); for (let k = 0; k < 7; k++) { const a = k * 2.3, d = R * (.05 + (k % 3) * .035); c.moveTo(Math.cos(a) * d + R * .018, Math.sin(a) * d); c.arc(Math.cos(a) * d, Math.sin(a) * d, R * .018, 0, TAU); } c.fill(); c.restore(); }
  } else { c.fillStyle = P.body; circ(c, 0, 0, R * .2); c.fill(); }
  for (let k = 0; k < 3; k++) { const ph = t * (.35 + k * .12) + k * 2.1, ry = R * .3 * Math.max(.12, Math.abs(Math.cos(ph))); c.beginPath(); c.ellipse(0, 0, R * .3, ry, k * Math.PI / 3, 0, TAU); c.strokeStyle = P.dark; c.lineWidth = lw * 4; c.stroke(); c.strokeStyle = P.plate; c.lineWidth = lw * 2; c.stroke(); }
  // huit astres-forteresses : sphères blindées, bastions, cœur d'étoile
  const SL = SLOT_LAYOUT.constellation;
  K.big.forEach(([x, y], i) => {
    const X = x * R, Y = y * R, s = R * (SL[i] >= 8 ? .13 : .115);
    c.fillStyle = P.dark; c.beginPath(); for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + Math.PI / 4 + t * .05; c.moveTo(X + Math.cos(a - .3) * s * .9, Y + Math.sin(a - .3) * s * .9); c.lineTo(X + Math.cos(a) * s * 1.35, Y + Math.sin(a) * s * 1.35); c.lineTo(X + Math.cos(a + .3) * s * .9, Y + Math.sin(a + .3) * s * .9); } c.fill();
    c.fillStyle = P.dark; circ(c, X, Y, s); c.fill(); c.fillStyle = P.body2; circ(c, X, Y, s * .88); c.fill();
    c.fillStyle = P.body; circ(c, X - s * .14, Y - s * .14, s * .64); c.fill();
    if (!lo) { c.strokeStyle = P.plate; c.lineWidth = lw * 1.8; c.beginPath(); c.ellipse(X, Y, s * .88, s * .3, .5, 0, TAU); c.stroke(); }
    if (!dead) glowCore(c, X + s * .3, Y + s * .3, s * .42, P, t + i * .7);
  });
  // étoiles extérieures et étoile de proue : éclats à quatre branches
  const flare = (X, Y, s, k) => { const p = .75 + .25 * Math.sin(t * 2.6 + k); c.fillStyle = dead ? P.plate : 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(X + s * 1.6 * p, Y); c.lineTo(X + s * .18, Y + s * .18); c.lineTo(X, Y + s * 1.6 * p); c.lineTo(X - s * .18, Y + s * .18); c.lineTo(X - s * 1.6 * p, Y); c.lineTo(X - s * .18, Y - s * .18); c.lineTo(X, Y - s * 1.6 * p); c.lineTo(X + s * .18, Y - s * .18); c.closePath(); c.fill(); };
  K.out.forEach(([x, y], k) => { const X = x * R, Y = y * R, s = R * .085; c.fillStyle = P.dark; circ(c, X, Y, s); c.fill(); c.fillStyle = P.body2; circ(c, X, Y, s * .84); c.fill(); if (!lo) { c.strokeStyle = P.plate; c.lineWidth = lw * 1.6; circ(c, X, Y, s * .6); c.stroke(); } if (!dead) glowCore(c, X, Y, s * .9, P, t + k); });
  glowCore(c, K.prow[0] * R, 0, R * .1, P, t); flare(K.prow[0] * R, 0, R * .05, 9);
  if (!lo) K.out.forEach(([x, y], k) => flare(x * R, y * R, R * .03, k));
};
