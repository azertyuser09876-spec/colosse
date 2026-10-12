// Armes de la 3.1, lot A : dix-huit armes légères, moyennes et lourdes (tailles 1 à 3).
// Chaque arme a son entrée WEAPONS, son tir (W_FIRE) ou son affût continu (W_TICK), ses projectiles (B_KIND), ses zones (ZONE_K),
// son dessin d'affût (W_PAINT) et sa recherche. Tout ce qui touche au moteur (dégâts, particules, sons) n'est appelé qu'en jeu.
// Les objets purement visuels posés dans bullets (givre, réticule…) portent vfx: 1 : un intercepteur de projectiles doit les ignorer.

// ================= DONNÉES =================
const AA_ST = (...p) => p.filter(Boolean).join(' · ');
Object.assign(WEAPONS, {
  // ---- légères
  ricochet: { n: TL('Ricocheur'), size: 1, dmg: 15, rate: 2, bounceK: .7, spd: 1050, range: 540, spread: .03, bounces: 3, jump: 260, dps: 42, kind: 'ricochet', col: '#fff1c4', snd: 'rifle', cost: { scrap: 14, circuits: 4 }, d: TL('Balle qui ricoche sur les murs et saute sur trois cibles de plus.'),
    stat: w => AA_ST(TL('{n} dps', { n: w.dps }), TLn(w.bounces, '{n} ricochet', '{n} ricochets'), TL('{n} px', { n: w.range })) },
  boomerang: { n: TL('Lame boomerang'), size: 1, dmg: 20, rate: 1.1, spd: 520, range: 380, dps: 40, kind: 'boomer', col: '#e4ecf0', snd: 'claw', cost: { scrap: 12, alloy: 4 }, d: TL('Lame tournoyante qui fauche tout à l\'aller et au retour.'),
    stat: w => AA_ST(TL('{n} dps', { n: w.dps }), TL('aller-retour'), TL('{n} px', { n: w.range })) },
  minelayer: { n: TL('Lance-mines'), size: 1, dmg: 70, rate: .55, range: 440, minRange: 40, mineR: 70, maxMines: 6, dps: 34, noRival: 1, kind: 'mines', col: '#ff5a3c', snd: 'lob', cost: { scrap: 16, alloy: 5 }, d: TL('Sème des mines qui sautent au passage des ennemis (six à la fois).'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TLn(w.maxMines, '{n} mine', '{n} mines'), TL('{n} px', { n: w.range })) },
  cryo: { n: TL('Projecteur cryogénique'), size: 1, dps: 22, range: 260, cone: .35, kind: 'cryo', col: '#bfe8ff', snd: 'frost', cost: { circuits: 12, crystals: 6 }, d: TL('Jet glacé continu : ralentit, puis gèle sur place ce qu\'il arrose trop longtemps.'),
    stat: w => AA_ST(TL('{n} dps continu', { n: w.dps }), TL('gèle'), TL('{n} px', { n: w.range })) },
  marker: { n: TL('Désignateur laser'), size: 1, dps: 9, range: 820, vuln: .25, vulnT: 3, role: 'heavy', kind: 'mark', col: '#ff3b3b', snd: 'laser', cost: { circuits: 14, crystals: 4 }, d: TL('Marque la cible : elle subit 25 % de dégâts en plus de toutes les armes pendant 3 s.'),
    stat: w => AA_ST(TL('+{n} % de dégâts subis', { n: Math.round(w.vuln * 100) }), TL('{n} px', { n: w.range })) },
  // ---- moyennes
  flechette: { n: TL('Canon à fléchettes'), size: 2, dmg: 10, flechettes: 12, rate: .6, spd: 900, range: 660, spread: .03, dps: 60, kind: 'burst', col: '#dfe8f0', snd: 'cannon', cost: { scrap: 35, alloy: 14 }, d: TL('L\'obus éclate devant la cible en douze fléchettes perforantes.'),
    stat: w => AA_ST(TL('{n} × {dmg} dégâts', { n: w.flechettes, dmg: w.dmg }), TL('perforant'), TL('{n} px', { n: w.range })) },
  corroder: { n: TL('Lance-corrosif'), size: 2, dmg: 30, rate: .6, range: 560, minRange: 60, splash: 60, pool: 22, dps: 52, kind: 'acidball', col: '#9fe06a', snd: 'acid', cost: { scrap: 30, crystals: 18 }, d: TL('Globe d\'acide en cloche : la flaque ronge le blindage de ce qui y passe.'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TL('flaque corrosive'), TL('{n} px', { n: w.range })) },
  disruptor: { n: TL('Disrupteur'), size: 2, dmg: 26, rate: .5, range: 380, fan: 70, stun: .8, push: 220, dps: 26, kind: 'pulse', col: '#b8c8ff', snd: 'emp', cost: { circuits: 30, crystals: 14 }, d: TL('Onde en éventail qui étourdit et repousse tout ce qui est devant.'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TL('étourdit'), TL('repousse'), TL('{n} px', { n: w.range })) },
  kamikaze: { n: TL('Drones-suicides'), size: 2, dmg: 48, salvo: 2, rate: .5, range: 900, splash: 55, loiter: 7, noRival: 1, kind: 'kamikaze', col: '#ff5a4a', snd: 'drone', cost: { scrap: 40, circuits: 22 }, d: TL('Deux petits drones qui rôdent, choisissent une proie et plongent dessus.'),
    stat: w => AA_ST(TL('{n} × {dmg} dégâts', { n: w.salvo, dmg: w.dmg }), TL('zone'), TL('{n} px', { n: w.range })) },
  tether: { n: TL('Grappin magnétique'), size: 2, dps: 34, rate: .3, spd: 950, range: 520, hold: 3, drag: 150, kind: 'tether', col: '#ff6a4a', snd: 'rifle', cost: { alloy: 26, circuits: 14 }, d: TL('Câble aimanté : agrippe la cible, la ralentit et traîne les plus légères jusqu\'à vous.'),
    stat: w => AA_ST(TL('{n} dps', { n: w.dps }), TL('attire'), TL('{n} px', { n: w.range })) },
  sonic: { n: TL('Canon sonique'), size: 2, dmg: 36, rate: .75, spd: 700, range: 520, width: 70, push: 260, dps: 36, kind: 'sonic', col: '#c8f0ff', cost: { scrap: 30, circuits: 20 }, d: TL('Onde de choc large qui traverse les rangs, repousse et brise les arbres.'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TL('traverse'), TL('repousse'), TL('{n} px', { n: w.range })) },
  // ---- lourdes
  deployer: { n: TL('Lance-tourelles'), size: 3, rate: .07, range: 620, minRange: 80, life: 20, maxT: 2, dps: 100, noRival: 1, kind: 'deploy', col: '#f2c14e', snd: 'mortar', cost: { scrap: 120, alloy: 60, circuits: 40 }, d: TL('Largue une tourelle à minigun qui tient la position 20 s (deux à la fois).'),
    stat: w => AA_ST(TL('tourelle {n} s', { n: w.life }), TL('{n} au plus', { n: w.maxT }), TL('{n} px', { n: w.range })) },
  carpet: { n: TL('Bombardement en tapis'), size: 3, dmg: 75, shells: 10, len: 600, rate: .16, range: 1300, minRange: 260, splash: 85, dps: 110, kind: 'carpet', col: '#ffa060', snd: 'mortar', cost: { scrap: 140, alloy: 60, crystals: 20 }, d: TL('Dix obus qui labourent une bande de terrain.'),
    stat: w => AA_ST(TL('{n} × {dmg} dégâts', { n: w.shells, dmg: w.dmg }), TL('zone'), TL('{n} px', { n: w.range })) },
  cryobomb: { n: TL('Bombe cryogénique'), size: 3, dmg: 65, rate: .3, range: 1000, minRange: 150, splash: 150, stun: 1.2, dps: 32, kind: 'cryolob', col: '#bfe8ff', snd: 'mortar', cost: { crystals: 70, circuits: 40, cores: 1 }, d: TL('Obus glacé en cloche : gèle tout dans un large rayon et laisse une plaque de givre.'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TL('gèle'), TL('rayon {n}', { n: w.splash })) },
  gravwell: { n: TL('Puits gravitationnel'), size: 3, dmg: 20, rate: .18, spd: 500, range: 950, splash: 200, wellR: 230, dur: 5, dps: 40, kind: 'well', col: '#b9a0ff', snd: 'gravity', cost: { crystals: 70, circuits: 50, cores: 1 }, d: TL('Ouvre pendant 5 s un puits qui attire et englue les ennemis.'),
    stat: w => AA_ST(TL('{n} dps', { n: w.dmg }), TL('attire'), TL('puits {n} s', { n: w.dur })) },
  lightrod: { n: TL('Paratonnerre'), size: 3, dmg: 36, rate: .12, range: 900, minRange: 60, dur: 8, zr: 320, bolts: 2, every: .65, dps: 95, kind: 'rod', col: '#cfe6ff', snd: 'lob', cost: { circuits: 70, crystals: 50 }, d: TL('Plante une tige qui foudroie les ennemis autour pendant 8 s.'),
    stat: w => AA_ST(TL('foudre {n} s', { n: w.dur }), TL('{n} dps', { n: w.dps }), TL('{n} px', { n: w.range })) },
  borer: { n: TL('Foreuse perforante'), size: 3, dmg: 170, rate: .32, spd: 420, range: 950, spread: .02, fx: { ap: .6 }, dps: 75, kind: 'drill', col: '#e0b030', snd: 'siege', cost: { alloy: 90, circuits: 40, cores: 1 }, d: TL('Ogive-foreuse qui perce blindages, murs et rangs entiers.'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TL('perce tout'), TL('{n} px', { n: w.range })) },
  hammer: { n: TL('Marteau-pilon'), size: 3, dmg: 180, rate: .5, range: 150, qr: 140, stun: .6, push: 300, role: 'melee', kind: 'quake', col: '#e8dcc4', snd: 'servo', cost: { scrap: 150, alloy: 90 }, d: TL('Frappe le sol devant le robot : onde de choc qui assomme et repousse.'),
    stat: w => AA_ST(TL('{n} dégâts', { n: w.dmg }), TL('étourdit'), TL('contact')) },
});
// tirs en cloche ou largages : visée indirecte, par-dessus les obstacles
Object.assign(ARTILLERY, { mines: 1, acidball: 1, deploy: 1, carpet: 1, cryolob: 1, rod: 1 });

// ================= RECHERCHES =================
[
  ['ricochet', TL('Armes légères'), 2, { data: 8, circuits: 10 }, 'cin', { req: 'w_needler' }],
  ['boomerang', TL('Armes légères'), 1, { data: 5, alloy: 6 }, 'feu', { root: 'x_blades' }],
  ['minelayer', TL('Armes légères'), 2, { data: 9, alloy: 10 }, 'dep', { req: 'w_grenade' }],
  ['cryo', TL('Armes légères'), 2, { data: 10, crystals: 10 }, 'ctrl', { req: 'w_emp' }],
  ['marker', TL('Armes légères'), 2, { data: 10, circuits: 12 }, 'nrj', { req: 'w_laser' }],
  ['flechette', TL('Armes moyennes'), 2, { data: 16, alloy: 16 }, 'cin', { req: 'w_scatter' }],
  ['corroder', TL('Armes moyennes'), 3, { data: 22, crystals: 25 }, 'feu', { req: 'w_acidgun' }],
  ['disruptor', TL('Armes moyennes'), 3, { data: 24, circuits: 28 }, 'elec', { req: 'w_emp' }],
  ['kamikaze', TL('Armes moyennes'), 3, { data: 26, circuits: 30 }, 'dep', { req: 'w_minelayer' }],
  ['tether', TL('Armes moyennes'), 3, { data: 22, alloy: 28 }, 'ctrl', { req: 'w_harpoon' }],
  ['sonic', TL('Armes moyennes'), 3, { data: 24, circuits: 24 }, 'ctrl', { req: 'w_cryo' }],
  ['deployer', TL('Armes lourdes'), 4, { data: 70, alloy: 60 }, 'dep', { req: 'w_kamikaze' }],
  ['carpet', TL('Armes lourdes'), 4, { data: 75, alloy: 70 }, 'obus', { req: 'w_mortar' }],
  ['cryobomb', TL('Armes lourdes'), 4, { data: 70, crystals: 60 }, 'ctrl', { req: 'w_cryo' }],
  ['gravwell', TL('Armes lourdes'), 4, { data: 80, cores: 2 }, 'ctrl', { req: 'w_gravity' }],
  ['lightrod', TL('Armes lourdes'), 4, { data: 80, circuits: 70 }, 'elec', { req: 'w_storm' }],
  ['borer', TL('Armes lourdes'), 4, { data: 80, alloy: 80 }, 'cin', { req: 'w_rail' }],
  ['hammer', TL('Armes lourdes'), 3, { data: 60, alloy: 70 }, 'feu', { req: 'w_boomerang' }],
].forEach(([id, cat, lab, cost, fam, o]) => addResearch(Object.assign({ id: 'w_' + id, cat, lab, n: WEAPONS[id].n, cost, d: WEAPONS[id].d, fam }, o)));

// ================= CROCHETS TARDIFS =================
LATE.push(() => {
  // tirs directs : ils respectent la ligne de tir (la foreuse, elle, perce : pas de contrôle)
  Object.assign(LOF_KIND, { ricochet: 1, boomer: 1, burst: 1, tether: 1, sonic: 1, well: 1 });
  // rôle imposé par l'arme (champ role) : le marteau-pilon est une arme de contact, le désignateur vise les gros
  if (!wRole.aRole) { const f0 = wRole; wRole = w => (w && w.role) || f0(w); wRole.aRole = 1; }
});

// ================= OUTILS COMMUNS =================
// coefficient de dégâts de l'affût (rang du robot, difficulté pour les ennemis, multiplicateur de déploiement)
function aaK(m, w) { const B = m && WEAPONS[m.wid]; return B && B.dmg && w.dmg ? w.dmg / B.dmg : 1; }
// bouche de l'arme, à L unités de dessin de l'affût
const aaMz = (F, L) => [F.mx + Math.cos(F.a) * L * F.sc, F.my + Math.sin(F.a) * L * F.sc];
// point visé ramené entre min et max (distance comptée depuis l'affût) : [x, y, distance, angle]
function aaPoint(F, min, max) { const dx = F.tx - F.mx, dy = F.ty - F.my, d = Math.hypot(dx, dy), a = d > 1 ? Math.atan2(dy, dx) : F.a, r = clamp(d, min, max); return [F.mx + Math.cos(a) * r, F.my + Math.sin(a) * r, r, a]; }
const aaRoom = n => parts.length < (n || 860) && fxQ() !== 'low';
const aaRoomAny = () => parts.length < 880;
// l'unité peut-elle être traînée ou attirée ?
const aaMovable = v => !v.static && !v.boss && !v.giant && v.r <= 150 && !v.net && v.kind !== 'building' && v.kind !== 'beacon' && v.kind !== 'beacon2' && !v.jumping;
// obstacle dur entre deux points (les arbres, cristaux et épaves laissent passer)
function aaBlocked(x0, y0, x1, y1, r) { if (!W) return false; const i = lofBlock(x0, y0, x1, y1, r || 0); return i >= 0 && !lofCheap(W.obs[i]); }
// éclaboussure sans boule de feu : dégâts dégressifs, effets, décor léger (les visuels sont faits à part)
function aaSplash(x, y, r, dmg, team, src, o, groundOnly) {
  if (NETVIS) return;
  foesIn(x, y, r, team, v => { const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.r); hurt(v, dmg * (1 - clamp(d / r, 0, 1) * .5), src, o ? Object.assign({ px: x, py: y }, o) : null); }, groundOnly ? { air: false } : null);
  aaTiles(x, y, r * .45, dmg * .5);
}
// décor seul : arbres, cristaux et murs touchés dans le rayon
function aaTiles(x, y, tr, dmg) {
  if (NETVIS || !W || dmg <= 0) return;
  const t0x = Math.floor((x - tr) / TILE), t1x = Math.floor((x + tr) / TILE), t0y = Math.floor((y - tr) / TILE), t1y = Math.floor((y + tr) / TILE);
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) if (d2(tx * TILE + 20, ty * TILE + 20, x, y) < (tr + 20) ** 2) hitTile(tx, ty, dmg);
}
// marque de tir réussi pour le joueur
function aaHitMark(src) { if (!NETVIS && isMine(src)) { hitMarkT = .14; SFX.play('hitm', .45); } }
// ombre au sol d'un projectile en cloche
function aaShadow(c, x, y, s, h) { c.fillStyle = `rgba(0,0,0,${(.32 - Math.min(.2, h / 600)).toFixed(3)})`; c.beginPath(); c.ellipse(x + h * .12, y + h * .06, s * 1.3, s * .8, 0, 0, TAU); c.fill(); }
// anneau qui annonce l'impact d'un tir en cloche
function aaImpactRing(c, x, y, r, k, col) { if (k < .35) return; c.strokeStyle = col; c.globalAlpha = Math.min(1, (k - .35) * 2.5) * .55; c.lineWidth = 1.5; circ(c, x, y, r * (1 - k * .45)); c.stroke(); c.globalAlpha = 1; }

// visée d'un affût continu (W_TICK) : pilotage manuel, cible propre de l'affût ou cible du robot
const AA_AIM = { tgt: null, tx: 0, ty: 0, want: false, manual: false };
function aaAim(u, m, dt, mx, my) {
  const w = m.w, pil = u.piloted, mine = u.kind === 'robot' && u.team === 0 && !u.net, A = AA_AIM;
  A.tgt = null; A.want = false; A.manual = false;
  if (pil && !(u.wm && u.wm[u.mounts.indexOf(m)] === 'a')) {
    A.manual = true; A.tx = mouse.wx; A.ty = mouse.wy;
    A.want = (mouse.l || fireLatch || TOUCH.fire) && !mapOpen && (!tactical || TOUCH.fire);
    return A;
  }
  const base = !pil && u.target && !u.target.dead && !u.target.hidden ? u.target : null;
  let t;
  if (pil) t = mountTarget(u, m, dt, null, Math.max(950, (w.range || 0) + 60));
  else if (mine && (u.split || !base || !mountReach(u, m, base))) t = mountTarget(u, m, dt, base, u.split ? 900 : 700) || base;
  else { t = base; if (mine) m.tgt2 = null; }
  if (t) { A.tgt = t; A.tx = t.x; A.ty = t.y; const d = Math.hypot(t.x - mx, t.y - my); A.want = d <= (w.range || 300) + t.r && d >= (w.minRange || 0); }
  else { A.tx = mx + Math.cos(u.ang) * 100; A.ty = my + Math.sin(u.ang) * 100; }
  return A;
}
const aaTurn = (w, u) => ((w.size || 1) >= 3 ? 2.8 : w.size === 2 ? 4.8 : 9) * (u.piloted ? 1.6 : 1) * (w.turnMul || 1);
// compteur de tir d'un affût continu : les autres joueurs reproduisent l'effet (W_FIRE sous NETVIS)
function aaFc(u, m, tx, ty) { u.lastFire = time; if (time - (m.fcT || 0) > .1) { m.fcT = time; m.fc = ((m.fc || 0) + 1) & 255; m.td = Math.round(Math.hypot(tx - u.x, ty - u.y)); } }

// ---------- givre sur une cible gelée (objet visuel qui suit l'unité) ----------
function aaFreeze(v, dur) {
  if (!v || v.dead || NETVIS) return;
  const big = v.boss || v.giant || v.r > 150, end = time + dur * (big ? .3 : 1), o = v.aIce;
  if (o && o.v === v && time - o.upd < .15) { o.end = Math.max(o.end, end); return; }
  v.aIce = projectile(v.fly ? 'a_iceh' : 'a_ice', v.x, v.y, 0, 0, { team: v.team, vfx: 1, v, end, t0: time, upd: time, seed: Math.random() * 100 });
}
const AA_ICE = {
  update(b) { b.upd = time; const v = b.v; if (!v || v.dead || v.hidden || time > b.end + .35) return true; b.x = v.x; b.y = v.y; return false; },
  draw(c, b) {
    const v = b.v, R = v.r, k = clamp(Math.min((time - b.t0) / .12, (b.end + .35 - time) / .35), 0, 1); if (k <= 0) return;
    c.translate(b.x, b.y); c.globalAlpha = k;
    const g = c.createRadialGradient(0, 0, R * .2, 0, 0, R * 1.25); g.addColorStop(0, 'rgba(225,245,255,.42)'); g.addColorStop(.75, 'rgba(170,220,250,.3)'); g.addColorStop(1, 'rgba(170,220,250,0)');
    c.fillStyle = g; circ(c, 0, 0, R * 1.25); c.fill();
    const n = R > 60 ? 12 : 8;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + hash2(i, 3, b.seed | 0) * .6, L = R * (.45 + hash2(i, 7, b.seed | 0) * .55), w = R * (.1 + hash2(i, 9, b.seed | 0) * .08), d0 = R * .55;
      c.fillStyle = i % 2 ? 'rgba(235,250,255,.85)' : 'rgba(170,215,245,.8)';
      c.beginPath(); c.moveTo(Math.cos(a) * d0 + Math.cos(a + 1.57) * w, Math.sin(a) * d0 + Math.sin(a + 1.57) * w); c.lineTo(Math.cos(a) * (d0 + L), Math.sin(a) * (d0 + L)); c.lineTo(Math.cos(a) * d0 - Math.cos(a + 1.57) * w, Math.sin(a) * d0 - Math.sin(a + 1.57) * w); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(240,252,255,.7)'; c.lineWidth = Math.max(1, R * .05); circ(c, 0, 0, R * .9); c.stroke();
    if ((time * 7 + b.seed) % 1 < .25) { c.fillStyle = '#ffffff'; const a = b.seed + Math.floor(time * 7); circ(c, Math.cos(a) * R * .7, Math.sin(a) * R * .7, Math.max(1.2, R * .07)); c.fill(); }
    c.globalAlpha = 1;
  },
};
B_KIND.a_ice = AA_ICE; B_KIND.a_iceh = Object.assign({ high: true }, AA_ICE);

// ================= LÉGÈRES : MÉCANIQUES =================
// ---------- Ricocheur : rebond sur les murs (normale de la tuile) et saut vers l'ennemi suivant ----------
W_FIRE.ricochet = (u, m, w, F) => {
  const [sx, sy] = aaMz(F, 15);
  projectile('ricochet', sx, sy, F.a + (Math.random() - .5) * 2 * (w.spread || 0) * F.spr, w.spd, { team: u.team, src: u, dmg: F.dmg, range: w.range, col: w.col, sc: F.sc, n: w.bounces || 3, jump: w.jump || 260, hits: new Set(), fx: w.fx, bx: sx, by: sy, bk: w.bounceK || .7 });
  muzzle(sx, sy, F.a, w.col, F.sc * .8);
  return true;
};
function aaBounceFx(b) { sparks(b.x, b.y, 4, '#fff1c4'); if (aaRoomAny()) parts.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: .16, max: .16, size: 9, col: '#fff1c4', thin: true }); SFX.play('hit', .22, b.x, b.y); }
B_KIND.ricochet = {
  update(b, dt) {
    b.life += dt;
    const r = stepProjectile(b, dt, 3);
    if (r === 'out') return true;
    if (r === 'wall') {
      projectileWall(b, b.dmg * .6);
      if (b.n <= 0) { sparks(b.x, b.y, 3, b.col); return true; }
      // on revient au point d'avant le mur et on inverse la composante qui a franchi le bord de la tuile
      const tx0 = (b.px / TILE) | 0, ty0 = (b.py / TILE) | 0, tx1 = (b.x / TILE) | 0, ty1 = (b.y / TILE) | 0, solid = (x, y) => x < 0 || y < 0 || x >= WT || y >= WT || !!W.obs[y * WT + x];
      if (tx0 !== tx1 && ty0 === ty1) b.vx = -b.vx;
      else if (ty0 !== ty1 && tx0 === tx1) b.vy = -b.vy;
      else { const sx = solid(tx1, ty0), sy = solid(tx0, ty1); if (sx && !sy) b.vx = -b.vx; else if (sy && !sx) b.vy = -b.vy; else { b.vx = -b.vx; b.vy = -b.vy; } }
      b.x = b.px; b.y = b.py; b.n--; b.dmg *= b.bk; b.range = Math.max(b.range, b.dist + b.jump); b.bx = b.x; b.by = b.y;
      aaBounceFx(b); return false;
    }
    if (r) {
      hurt(r, b.dmg, b.src, b.fx); sparks(b.x, b.y, 4, b.col); SFX.play(r.human ? 'hitsoft' : 'hit', .3, b.x, b.y); aaHitMark(b.src);
      b.hits.add(r.id);
      if (b.n > 0) {
        const nx = nearestFoe(b.x, b.y, b.jump, b.team, b.hits);
        if (nx) {
          const lead = Math.hypot(nx.x - b.x, nx.y - b.y) / b.spd, a = Math.atan2(nx.y + (nx.vy || 0) * lead - b.y, nx.x + (nx.vx || 0) * lead - b.x);
          b.vx = Math.cos(a) * b.spd; b.vy = Math.sin(a) * b.spd; b.n--; b.dmg *= b.bk; b.range = b.dist + b.jump + 40; b.bx = b.x; b.by = b.y; if (nx.fly) b.air = true;
          aaBounceFx(b); return false;
        }
      }
      return true;
    }
    return b.dist >= b.range;
  },
  draw(c, b) {
    const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, L = Math.min(38, Math.hypot(b.x - b.bx, b.y - b.by)), s = Math.min(1.6, b.sc || 1);
    c.strokeStyle = 'rgba(255,236,190,.28)'; c.lineWidth = 3.4 * s; c.beginPath(); c.moveTo(b.x - ux * L, b.y - uy * L); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = b.col; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(b.x - ux * L * .6, b.y - uy * L * .6); c.lineTo(b.x, b.y); c.stroke();
    c.fillStyle = '#ffffff'; circ(c, b.x, b.y, 1.5 * s); c.fill();
    if (b.n < 3) { c.fillStyle = 'rgba(255,241,196,.6)'; circ(c, b.x, b.y, (2.6 + (3 - b.n) * .6) * s); c.fill(); } // la balle s'échauffe à chaque rebond
  },
};

// ---------- Lame boomerang : aller en ligne droite, ralentit, revient vers l'affût ; deux lames au plus en vol ----------
W_FIRE.boomer = (u, m, w, F) => {
  m.blades = (m.blades || []).filter(b => !b.gone && time - b.born < 6 && time - b.upd < .3);
  if (m.blades.length >= 2) return false;
  const [sx, sy] = aaMz(F, 9), d = clamp(Math.hypot(F.tx - F.mx, F.ty - F.my) + 50, 140, w.range);
  const b = projectile('boomer', sx, sy, F.a, w.spd, { team: u.team, src: u, m, dmg: F.dmg, range: d, sc: F.sc, hits: new Set(), born: time, upd: time, sp: w.spd, rot: Math.random() * 6, dir: m.blades.length ? -1 : 1, col: w.col, fx: w.fx });
  m.blades.push(b);
  return true;
};
B_KIND.boomer = {
  update(b, dt) {
    b.life += dt; b.upd = time; b.rot += dt * 24 * b.dir;
    const u = b.src, alive = u && !u.dead;
    let hx = b.lx, hy = b.ly;
    if (alive) { const p = mountWorldPos(u, b.m); hx = b.lx = p[0]; hy = b.ly = p[1]; }
    if (!b.ret) {
      b.sp = b.spd * Math.max(.22, Math.sqrt(Math.max(0, 1 - b.dist / b.range)));
      if (b.dist >= b.range * .97) { b.ret = true; b.hits.clear(); }
    } else {
      b.sp = Math.min(b.spd * 1.15, b.sp + b.spd * 1.6 * dt);
      const a0 = Math.atan2(b.vy, b.vx), a1 = Math.atan2(hy - b.y, hx - b.x), a = turnTo(a0, a1, 7 * dt);
      b.vx = Math.cos(a); b.vy = Math.sin(a);
      if (d2(b.x, b.y, hx, hy) < (14 * b.sc + 8) ** 2) { b.gone = true; return true; } // rattrapée
    }
    if (time - b.born > 5) { sparks(b.x, b.y, 4, b.col); b.gone = true; return true; }
    const n0 = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / n0 * b.sp; b.vy = b.vy / n0 * b.sp;
    const steps = Math.max(1, Math.ceil(b.sp * dt / 12)), sdt = dt / steps, hr = 8 * Math.min(1.8, b.sc);
    for (let s = 0; s < steps; s++) {
      b.x += b.vx * sdt; b.y += b.vy * sdt; b.dist += b.sp * sdt;
      const tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0;
      if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) { b.gone = true; return true; }
      const o = b.air ? 0 : W.obs[ty * WT + tx];
      if (o === 1) { destroyTile(tx, ty, o, null); if (aaRoomAny()) parts.push({ type: 'debris', x: b.x, y: b.y, vx: rnd(-60, 60), vy: rnd(-60, 60), life: .5, max: .5, size: 3, col: '#3e5a2c' }); }
      else if (o) { projectileWall(b, b.dmg * .6); sparks(b.x, b.y, 4, '#e8f0ff'); SFX.play('hit', .25, b.x, b.y); if (b.ret) { b.gone = true; return true; } b.ret = true; b.hits.clear(); b.x -= b.vx * sdt * 2; b.y -= b.vy * sdt * 2; b.vx = -b.vx; b.vy = -b.vy; break; }
      const cell = cellAt(b.x, b.y);
      if (cell) for (let k = 0; k < cell.length; k++) {
        const v = cell[k]; if (v.team === b.team || v.dead || v.hidden || v.invul || v.etype === 'cible' || b.hits.has(v.id)) continue;
        if (d2(v.x, v.y, b.x, b.y) > (v.r + hr) ** 2) continue;
        b.hits.add(v.id); hurt(v, b.dmg, b.src, b.fx); sparks(b.x, b.y, 5, '#e8f0ff'); SFX.play('melee', .3, b.x, b.y); aaHitMark(b.src);
      }
    }
    return false;
  },
  draw(c, b) {
    const s = 1.15 * Math.min(1.8, b.sc || 1);
    c.translate(b.x, b.y);
    c.fillStyle = 'rgba(0,0,0,.22)'; circ(c, 4, 6, 7 * s); c.fill();
    c.fillStyle = 'rgba(228,236,240,.12)'; circ(c, 0, 0, 9 * s); c.fill(); // flou de rotation
    c.rotate(b.rot); aaBlade(c, s, '#d8e0e4', '#7d8a90');
  },
};
// lame en V, bords affûtés (dessin commun à l'affût et au projectile)
function aaBlade(c, s, fill, edge) {
  c.fillStyle = fill; c.strokeStyle = edge; c.lineWidth = .7 * s;
  c.beginPath(); c.moveTo(-1.2 * s, 0); c.quadraticCurveTo(-2 * s, -5 * s, 3 * s, -8.2 * s); c.quadraticCurveTo(.6 * s, -3.2 * s, 2.2 * s, 0); c.quadraticCurveTo(.6 * s, 3.2 * s, 3 * s, 8.2 * s); c.quadraticCurveTo(-2 * s, 5 * s, -1.2 * s, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#5a6468'; circ(c, 0, 0, 1.3 * s); c.fill();
}

// ---------- Lance-mines : la mine vole en cloche, s'arme, puis saute au passage d'un ennemi au sol ----------
W_FIRE.mines = (u, m, w, F) => {
  let tx = F.tx, ty = F.ty;
  if (F.tgt && !NETVIS) { if (F.tgt.fly) return false; const T = F.tgt; tx = T.x + (T.vx || 0) * 1.1; ty = T.y + (T.vy || 0) * 1.1; } // devant la cible qui bouge
  const dx = tx - F.mx, dy = ty - F.my, d = Math.hypot(dx, dy) || 1, r = clamp(d, w.minRange || 40, w.range) + rnd(-12, 12), a = Math.atan2(dy, dx) + rnd(-.05, .05);
  const px = F.mx + Math.cos(a) * r, py = F.my + Math.sin(a) * r, [sx, sy] = aaMz(F, 10);
  projectile('a_minefly', sx, sy, a, 0, { team: u.team, src: u, m, x0: sx, y0: sy, tx: px, ty: py, t: 0, T: .4, arc: 30 + r * .06, dmg: F.dmg, R: w.mineR || 70, max: w.maxMines || 6, sc: F.sc, rot: Math.random() * 6 });
  muzzle(sx, sy, F.a, '#ffcf7a', F.sc * .8);
  return true;
};
B_KIND.a_minefly = {
  high: true,
  update(b, dt) {
    b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc; b.rot += dt * 12;
    if (k < 1) return false;
    const tx = (b.tx / TILE) | 0, ty = (b.ty / TILE) | 0;
    if (!W || tx < 0 || ty < 0 || tx >= WT || ty >= WT || W.obs[ty * WT + tx]) { sparks(b.tx, b.ty, 4, '#c9c2b4'); return true; } // tombée sur un obstacle : perdue
    const f = addZone('a_mine', b.tx, b.ty, 40, 45, b.team, b.src, { arm: .7, dmg: b.dmg, R: b.R, seed: b.rot });
    const m = b.m; if (m) { m.mines = (m.mines || []).filter(z => z.t > 0 && !z.blown); m.mines.push(f); while (m.mines.length > b.max) m.mines.shift().boom = true; } // la plus vieille saute
    FX.dust(b.tx, b.ty, 2, 6, 25); SFX.play('clank', .3, b.tx, b.ty);
    return true;
  },
  draw(c, b) { aaShadow(c, b.x, b.y, 4, b.h); c.translate(b.x, b.y - b.h); c.rotate(b.rot); aaMineBody(c, 1, '#c8461a', 0); },
};
function aaMineBody(c, s, led, glow) {
  c.fillStyle = '#2b2f2c'; ngon(c, 8, 7 * s, Math.PI / 8); c.fill(); c.strokeStyle = '#121413'; c.lineWidth = 1.1 * s; c.stroke();
  c.fillStyle = '#e0b030'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; c.beginPath(); c.arc(0, 0, 6.2 * s, a - .22, a + .22); c.arc(0, 0, 4.9 * s, a + .22, a - .22, true); c.closePath(); c.fill(); }
  c.fillStyle = '#4a4f48'; circ(c, 0, 0, 4 * s); c.fill();
  c.strokeStyle = '#7a7e72'; c.lineWidth = .9 * s; c.beginPath(); for (let k = 0; k < 3; k++) { const a = k * TAU / 3; c.moveTo(Math.cos(a) * 2.2 * s, Math.sin(a) * 2.2 * s); c.lineTo(Math.cos(a) * 4 * s, Math.sin(a) * 4 * s); } c.stroke();
  if (glow) { c.fillStyle = `rgba(255,60,40,${glow})`; circ(c, 0, 0, 5.5 * s); c.fill(); }
  c.fillStyle = led; circ(c, 0, 0, 1.7 * s); c.fill();
}
function aaMineBoom(f) { if (f.blown) return; f.blown = true; f.t = 0; blast(f.x, f.y, f.R, f.dmg, f.team, f.src); }
ZONE_K.a_mine = {
  tick(f, dt) {
    if (f.boom) { aaMineBoom(f); return; }
    if (f.arm > 0) { f.arm -= dt; if (f.arm <= 0) SFX.play('mine', .25, f.x, f.y); return; }
    if (f.tick > 0) return; f.tick = .1;
    let hit = false; foesIn(f.x, f.y, 40, f.team, () => { hit = true; }, { air: false });
    if (hit) aaMineBoom(f);
  },
  draw(c, f) {
    const armed = f.arm <= 0, ph = (time * (armed ? 1.4 : 6) + f.seed) % 1, on = armed ? ph < .16 : ph < .5;
    c.translate(f.x, f.y); c.rotate(f.seed);
    c.fillStyle = 'rgba(0,0,0,.28)'; circ(c, 1.5, 2, 7.5); c.fill();
    aaMineBody(c, 1, armed ? (on ? '#ff3a2a' : '#5a1a14') : (on ? '#ffcf4a' : '#5a4a14'), armed && on ? .22 : 0);
    if (!armed) { c.strokeStyle = 'rgba(255,207,74,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 9.5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - f.arm / .7)); c.stroke(); }
  },
  end(f) { if (!f.blown) { sparks(f.x, f.y, 3, '#c9c2b4'); if (aaRoomAny()) parts.push({ type: 'smoke', x: f.x, y: f.y, vx: 0, vy: -12, life: .8, max: .8, size: 6, col: '' }); } },
};

// ---------- Projecteur cryogénique : cône continu, froid accumulé, gel au bout de 2 s ----------
W_TICK.cryo = (u, m, dt, mx, my) => {
  if (u.stunT > time) { m.on = false; return true; }
  const w = m.w, A = aaAim(u, m, dt, mx, my), da = Math.atan2(A.ty - my, A.tx - mx);
  m.aim = turnTo(m.aim, da, aaTurn(w, u) * dt);
  if (!A.want || Math.abs(angDiff(m.aim, da)) > .5) { m.on = false; m.ct = 0; return true; }
  const sc = m.ds || u.mscale || 1, ca = Math.cos(m.aim), sa = Math.sin(m.aim), nx = mx + ca * 12 * sc, ny = my + sa * 12 * sc;
  m.on = true; m.onT = time; m.jetL = w.range / sc; aaFc(u, m, A.tx, A.ty);
  aaMist(nx, ny, m.aim, w.range, dt);
  m.ct = (m.ct || 0) + dt;
  if (m.ct >= .1) { const k = m.ct; m.ct = 0; aaCone(u, nx, ny, m.aim, w.range, w.cone || .35, w.dps * k * diffDmg(u.team), k); }
  SFX.hold('cr' + u.id + '_' + u.mounts.indexOf(m), 'flame', u.piloted ? .32 : .2, nx, ny);
  if (time - (m.sndT || 0) > .45) { m.sndT = time; SFX.play('frost', u.piloted ? .3 : .16, nx, ny, { size: 1 }); }
  return true;
};
// reproduction chez les autres joueurs : un souffle de brume dans l'axe
W_FIRE.cryo = (u, m, w, F) => {
  if (!NETVIS) return false;
  m.on = true; m.onT = time; m.jetL = w.range / F.sc; aaMist(F.mx + Math.cos(F.a) * 12 * F.sc, F.my + Math.sin(F.a) * 12 * F.sc, F.a, w.range, .1);
  return false;
};
function aaMist(x, y, a, R, dt) {
  if (!aaRoom(840)) return;
  if (Math.random() < Math.min(1, dt * 22)) { const aa = a + rnd(-.3, .3), s = R * rnd(1.5, 2.1); parts.push({ type: 'dust', x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: rnd(.35, .5), max: .5, size: rnd(4, 7), rgb: '175,215,240' }); }
  if (Math.random() < .35) { const aa = a + rnd(-.35, .35), s = R * rnd(1.4, 2.4); parts.push({ type: 'spark', x, y, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: .3, max: .3, size: 1.5, col: '#f0fbff' }); }
}
// tout ce qui est dans le cône prend le froid ; derrière un mur, rien
function aaCone(u, x, y, a, R, half, dmg, k) {
  foesIn(x, y, R, u.team, v => {
    const dx = v.x - x, dy = v.y - y, d = Math.hypot(dx, dy);
    if (d > 4 && Math.abs(angDiff(a, Math.atan2(dy, dx))) > half + Math.atan2(v.r, d)) return;
    if (!u.fly && !v.fly && aaBlocked(x, y, v.x, v.y, v.r)) return;
    hurt(v, dmg, u, { slow: .6 });
    if (v.dead) return;
    if (time - (v.coldT || -9) > .35) v.cold = 0; // exposition interrompue : le froid retombe
    v.cold = (v.cold || 0) + k; v.coldT = time;
    if (v.cold >= 2) { v.cold = 0; hurt(v, 0, u, { stun: 1 }); aaFreeze(v, 1); SFX.play('icecrack', .6, v.x, v.y); sparks(v.x, v.y, 6, '#e8f8ff'); }
  });
}

// ---------- Désignateur laser : fin rayon, la cible touchée subit plus de dégâts de tout le monde ----------
W_TICK.mark = (u, m, dt, mx, my) => {
  if (u.stunT > time) { m.on = false; return true; }
  const w = m.w, A = aaAim(u, m, dt, mx, my), da = Math.atan2(A.ty - my, A.tx - mx);
  m.aim = turnTo(m.aim, da, aaTurn(w, u) * dt);
  if (!A.want || Math.abs(angDiff(m.aim, da)) > .25) { m.on = false; return true; }
  const sc = m.ds || u.mscale || 1, ca = Math.cos(m.aim), sa = Math.sin(m.aim), sx = mx + ca * 11 * sc, sy = my + sa * 11 * sc;
  m.on = true; m.onT = time; aaFc(u, m, A.tx, A.ty);
  let len = w.range, hit = null;
  for (let s = 0; s < w.range; s += 14) {
    const x = sx + ca * s, y = sy + sa * s, tx = (x / TILE) | 0, ty = (y / TILE) | 0;
    if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) { len = s; break; }
    const o = W.obs[ty * WT + tx]; if (o && !u.fly && !lofCheap(o)) { len = s; break; }
    const cell = cellAt(x, y);
    if (cell) for (let k = 0; k < cell.length; k++) { const v = cell[k]; if (v.team === u.team || v.dead || v.hidden || v.invul || v.etype === 'cible') continue; if (d2(v.x, v.y, x, y) < (v.r + 4) ** 2) { hit = v; break; } }
    if (hit) { len = s; break; }
  }
  const ex = sx + ca * len, ey = sy + sa * len;
  beams.push({ x1: sx, y1: sy, x2: ex, y2: ey, life: dt * 1.6, max: dt * 1.6, col: 'rgba(255,58,58,.85)', w: Math.max(1, .7 * sc), hot: true });
  if (hit) {
    hurt(hit, w.dps * dt * diffDmg(u.team), u, { vuln: w.vuln || .25, vulnT: w.vulnT || 3 });
    aaRet(m, hit, u.team);
    if (hit !== m.mk) { m.mk = hit; if (isMine(u) || u.team === 0 && isMine(u.owner)) SFX.play('lockon', .35, hit.x, hit.y); }
  } else m.mk = null;
  if (Math.random() < dt * 14 && aaRoomAny()) parts.push({ type: 'spark', x: ex, y: ey, vx: rnd(-40, 40), vy: rnd(-40, 40), life: .15, max: .15, size: 1.4, col: '#ff6a5a' });
  return true;
};
W_FIRE.mark = (u, m, w, F) => {
  if (!NETVIS) return false;
  const L = Math.min(w.range, (m.td || w.range)), sx = F.mx + Math.cos(F.a) * 11 * F.sc, sy = F.my + Math.sin(F.a) * 11 * F.sc;
  beams.push({ x1: sx, y1: sy, x2: sx + Math.cos(F.a) * L, y2: sy + Math.sin(F.a) * L, life: .12, max: .12, col: 'rgba(255,58,58,.85)', w: Math.max(1, .7 * F.sc), hot: true });
  m.on = true; m.onT = time;
  return false;
};
// réticule sur la cible marquée (objet visuel tenu à jour par l'affût)
function aaRet(m, v, team) {
  let b = m.ret;
  if (!b || time - b.upd > .1) b = m.ret = projectile('a_ret', v.x, v.y, 0, 0, { team, vfx: 1, v, upd: time, t0: time, until: time });
  if (b.v !== v) { b.v = v; b.t0 = time; }
  b.until = time + .12;
}
B_KIND.a_ret = {
  high: true,
  update(b) { b.upd = time; const v = b.v; if (!v || v.dead || v.hidden || time > b.until + .35) return true; b.x = v.x; b.y = v.y; return false; },
  draw(c, b) {
    const v = b.v, k = time > b.until ? clamp(1 - (time - b.until) / .35, 0, 1) : 1, z = Math.max(.5, cam.zoom), lock = clamp((time - b.t0) / .25, 0, 1);
    const R = v.r + (8 + (1 - lock) * 14) / z, L = Math.max(4, v.r * .35) + 3 / z;
    c.translate(b.x, b.y); c.rotate(time * .9); c.globalAlpha = .9 * k;
    c.strokeStyle = '#ff4a3a'; c.lineWidth = 1.6 / z; c.beginPath();
    for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4, cx = Math.cos(a) * R, cy = Math.sin(a) * R, ta = a + Math.PI / 2; c.moveTo(cx - Math.cos(ta) * L, cy - Math.sin(ta) * L); c.lineTo(cx, cy); c.lineTo(cx - Math.cos(a) * L * .7, cy - Math.sin(a) * L * .7); }
    c.stroke();
    c.rotate(-time * .9); c.lineWidth = 1 / z; c.globalAlpha = .55 * k; c.beginPath(); c.moveTo(-R * .45, 0); c.lineTo(-R * .2, 0); c.moveTo(R * .2, 0); c.lineTo(R * .45, 0); c.moveTo(0, -R * .45); c.lineTo(0, -R * .2); c.moveTo(0, R * .2); c.lineTo(0, R * .45); c.stroke();
    c.globalAlpha = 1;
  },
};

// ================= MOYENNES : MÉCANIQUES =================
// ---------- Canon à fléchettes : l'obus éclate devant la cible en un cône de fléchettes perforantes ----------
W_FIRE.burst = (u, m, w, F) => {
  const [sx, sy] = aaMz(F, 20), dT = F.tgt ? Math.hypot(F.tgt.x - sx, F.tgt.y - sy) - F.tgt.r * .5 : Math.hypot(F.tx - sx, F.ty - sy);
  projectile('burst', sx, sy, F.a + (Math.random() - .5) * 2 * (w.spread || 0) * F.spr, w.spd, { team: u.team, src: u, dmg: F.dmg, range: clamp(dT - 120, 50, w.range), sc: F.sc, col: w.col, n: w.flechettes || 12, fx: w.fx });
  muzzle(sx, sy, F.a, '#ffe0a0', F.sc * 1.3);
  if (aaRoom()) for (let k = 0; k < 2; k++) parts.push({ type: 'smoke', x: sx, y: sy, vx: Math.cos(F.a) * rnd(30, 60), vy: Math.sin(F.a) * rnd(30, 60), life: rnd(.5, .9), max: .9, size: 3.5 * F.sc, col: '' });
  addShakeNear(sx, sy, 1.2 * F.sc);
  return true;
};
function aaBurst(b) {
  const a = Math.atan2(b.vy, b.vx), n = b.n;
  for (let i = 0; i < n; i++) { const s = shoot(b.x, b.y, a + (i / (n - 1) - .5) * .5 + rnd(-.04, .04), 1150 * rnd(.9, 1.08), b.dmg, b.team, 300 * rnd(.85, 1.1), 'bullet', '#dfe8f0', 1, b.src, 0, b.sc * .7); s.air = b.air; if (b.fx) s.fx = b.fx; }
  parts.push({ type: 'flash', x: b.x, y: b.y, vx: 0, vy: 0, life: .08, max: .08, size: 16, col: '#fff2c8', a }); sparks(b.x, b.y, 6, '#ffe0a0');
  if (aaRoom()) { parts.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: .2, max: .2, size: 14, col: '#ffe6b0', thin: true }); parts.push({ type: 'smoke', x: b.x, y: b.y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 1, max: 1, size: 9, col: '' }); }
  SFX.play('scatter', .5, b.x, b.y);
}
B_KIND.burst = {
  update(b, dt) {
    b.life += dt; const r = stepProjectile(b, dt, 4);
    if (r === 'out') return true;
    if (r === 'wall') { b.x = b.px; b.y = b.py; aaBurst(b); return true; }
    if (r || b.dist >= b.range) { aaBurst(b); return true; }
    return false;
  },
  draw(c, b) {
    const a = Math.atan2(b.vy, b.vx), s = .8 * Math.min(1.8, b.sc || 1);
    c.strokeStyle = 'rgba(220,210,190,.25)'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(b.x - Math.cos(a) * Math.min(26, b.dist), b.y - Math.sin(a) * Math.min(26, b.dist)); c.lineTo(b.x, b.y); c.stroke();
    c.translate(b.x, b.y); c.rotate(a);
    c.fillStyle = '#3a3f3b'; rr(c, -5 * s, -2.2 * s, 9 * s, 4.4 * s, 1.5 * s); c.fill();
    c.fillStyle = '#c9a26a'; c.fillRect(-1 * s, -2.2 * s, 1.6 * s, 4.4 * s);
    c.fillStyle = '#dfe8f0'; c.beginPath(); c.moveTo(4 * s, -2 * s); c.lineTo(6.5 * s, 0); c.lineTo(4 * s, 2 * s); c.closePath(); c.fill();
  },
};

// ---------- Lance-corrosif : globe d'acide en cloche, flaque qui ronge le blindage ----------
W_FIRE.acidball = (u, m, w, F) => {
  const [px, py, r] = aaPoint(F, w.minRange || 0, w.range), err = r * .05 * F.spr, [sx, sy] = aaMz(F, 14);
  projectile('acidball', sx, sy, F.a, 0, { team: u.team, src: u, x0: sx, y0: sy, tx: px + rnd(-err, err), ty: py + rnd(-err, err), t: 0, T: .45 + r / 750, arc: 55 + r * .12, dmg: F.dmg, splash: w.splash || 60, pool: (w.pool || 22) * aaK(m, w), sc: F.sc, col: w.col });
  muzzle(sx, sy, F.a, '#9fe06a', F.sc);
  return true;
};
B_KIND.acidball = {
  high: true,
  update(b, dt) {
    b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc;
    if (Math.random() < dt * 14 && aaRoomAny()) parts.push({ type: 'spark', x: b.x, y: b.y - b.h, vx: rnd(-15, 15), vy: rnd(10, 50), life: .35, max: .35, size: 2, col: '#9fe06a' });
    if (k < 1) return false;
    aaSplash(b.tx, b.ty, b.splash, b.dmg, b.team, b.src, { corr: .3, corrT: 3 });
    addZone('a_acid', b.tx, b.ty, 80, 5, b.team, b.src, { dps: b.pool, seed: (Math.random() * 1000) | 0 });
    parts.push({ type: 'ring', x: b.tx, y: b.ty, vx: 0, vy: 0, life: .3, max: .3, size: b.splash, col: '#b8f080' });
    for (let i = 0; i < 12 && aaRoomAny(); i++) { const a = Math.random() * TAU, s = rnd(60, 200); parts.push({ type: 'spark', x: b.tx, y: b.ty, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.2, .45), max: .45, size: 2.4, col: i % 2 ? '#9fe06a' : '#d8ffa0' }); }
    if (aaRoom()) for (let i = 0; i < 4; i++) { const a = Math.random() * TAU; parts.push({ type: 'dust', x: b.tx, y: b.ty, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: 1, max: 1, size: 14, rgb: '150,215,90' }); }
    SFX.play('acid', .7, b.tx, b.ty, { size: 1.5 }); addShakeNear(b.tx, b.ty, 1.5);
    return true;
  },
  draw(c, b) {
    const s = 1.1 * Math.min(1.8, b.sc || 1), y = b.y - b.h;
    aaShadow(c, b.x, b.y, 4 * s, b.h); aaImpactRing(c, b.tx, b.ty, b.splash, b.t / b.T, 'rgba(160,230,100,1)');
    const g = c.createRadialGradient(b.x - 1.5 * s, y - 1.5 * s, .5, b.x, y, 5 * s); g.addColorStop(0, '#f0ffd0'); g.addColorStop(.4, '#9fe06a'); g.addColorStop(1, '#3f7a22');
    c.fillStyle = g; circ(c, b.x, y, 5 * s); c.fill(); c.strokeStyle = 'rgba(20,40,10,.6)'; c.lineWidth = .8; c.stroke();
  },
};
ZONE_K.a_acid = {
  tick(f) {
    if (f.tick > 0 || f.vis) return; f.tick = .25;
    foesIn(f.x, f.y, f.r * .9, f.team, v => hurt(v, f.dps * .25, f.src, { corr: .3, corrT: 2 }), { air: false });
  },
  draw(c, f) {
    const age = f.max - f.t, k = clamp(Math.min(age / .3, f.t / 1), 0, 1), R = f.r * (.55 + .45 * Math.min(1, age / .3)), S = f.seed;
    c.translate(f.x, f.y); c.globalAlpha = k;
    c.beginPath();
    for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, rr2 = R * (.78 + .22 * hash2(i % 16, S, 3) + Math.sin(time * 1.6 + i) * .025); i ? c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2) : c.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
    c.closePath();
    const g = c.createRadialGradient(0, 0, R * .1, 0, 0, R); g.addColorStop(0, 'rgba(160,230,80,.46)'); g.addColorStop(.7, 'rgba(100,175,45,.34)'); g.addColorStop(1, 'rgba(75,140,30,.26)');
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(195,250,125,.45)'; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 7; i++) { // bulles qui gonflent puis éclatent
      const ph = (time * .9 + hash2(i, S, 5)) % 1, a = hash2(i, S, 7) * TAU, d = R * .7 * Math.sqrt(hash2(i, S, 9)), x = Math.cos(a) * d, y = Math.sin(a) * d, br = 1.5 + ph * 4.5;
      if (ph < .85) { c.fillStyle = 'rgba(210,255,150,.45)'; circ(c, x, y, br); c.fill(); c.fillStyle = 'rgba(255,255,230,.6)'; circ(c, x - br * .3, y - br * .3, br * .3); c.fill(); }
      else { c.strokeStyle = `rgba(220,255,170,${(1 - ph) * 4})`; c.lineWidth = 1; circ(c, x, y, br * 1.3); c.stroke(); }
    }
    c.globalAlpha = 1;
  },
  end(f) { if (!f.vis) scarSprite('scorch', f.x, f.y, f.r * .6, Math.random() * TAU); },
};

// ---------- Disrupteur : onde en éventail qui s'élargit, étourdit et repousse ----------
W_FIRE.pulse = (u, m, w, F) => {
  if (!F.tgt && !NETVIS && !u.piloted) return false; // rien devant (récolte, percée) : on garde la charge
  const [sx, sy] = aaMz(F, 13);
  projectile('a_pulse', sx, sy, F.a, 0, { team: u.team, src: u, a: F.a, R: w.range, half: (w.fan || 70) * Math.PI / 360, dmg: F.dmg, stun: w.stun || .8, push: w.push || 220, rad: 0, hits: new Set(), sc: F.sc });
  muzzle(sx, sy, F.a, '#b8c8ff', F.sc * 1.2);
  return true;
};
B_KIND.a_pulse = {
  update(b, dt) {
    b.life += dt; b.rad = Math.min(b.R, b.rad + 950 * dt);
    if (!b.vis) foesIn(b.x, b.y, b.rad, b.team, v => {
      if (b.hits.has(v.id)) return;
      const dx = v.x - b.x, dy = v.y - b.y, d = Math.hypot(dx, dy);
      if (d > 4 && Math.abs(angDiff(b.a, Math.atan2(dy, dx))) > b.half + Math.atan2(v.r, d)) return;
      b.hits.add(v.id);
      if (!(b.src && b.src.fly) && !v.fly && aaBlocked(b.x, b.y, v.x, v.y, v.r)) return;
      hurt(v, b.dmg, b.src, { stun: b.stun, push: b.push, px: b.x, py: b.y }); sparks(v.x, v.y, 4, '#c8d8ff'); aaHitMark(b.src);
    });
    if (b.rad >= b.R) { b.fade = (b.fade || 0) + dt; if (b.fade > .22) return true; }
    return false;
  },
  draw(c, b) {
    const k = 1 - (b.fade || 0) / .22, z = Math.max(.5, cam.zoom);
    const g = c.createRadialGradient(b.x, b.y, Math.max(1, b.rad * .55), b.x, b.y, b.rad + 1); g.addColorStop(0, 'rgba(184,200,255,0)'); g.addColorStop(1, `rgba(184,200,255,${(.24 * k).toFixed(3)})`);
    c.fillStyle = g; c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.rad + 1, b.a - b.half, b.a + b.half); c.closePath(); c.fill();
    for (let j = 0; j < 4; j++) {
      const r = b.rad - j * 22; if (r < 8) continue;
      c.strokeStyle = j ? `rgba(184,200,255,${((.62 - j * .12) * k).toFixed(3)})` : `rgba(240,244,255,${(.95 * k).toFixed(3)})`; c.lineWidth = (j ? 2.2 : 3.2) / z + (j ? 1 : 2.5);
      c.beginPath(); c.arc(b.x, b.y, r, b.a - b.half, b.a + b.half); c.stroke();
    }
  },
};

// ---------- Drones-suicides : décollage, maraude, choix d'une proie, piqué ----------
W_FIRE.kamikaze = (u, m, w, F) => {
  if (!F.tgt && !NETVIS && !u.piloted) return false;
  const n = w.salvo || 2;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 1.2, [sx, sy] = aaMz(F, 4);
    projectile('kamikaze', sx + rnd(-3, 3), sy + rnd(-3, 3), F.a + off, 90, { team: u.team, src: u, dmg: F.dmg, splash: w.splash || 55, prey: F.tgt, gx: F.tx, gy: F.ty, max: w.loiter || 7, sc: F.sc, air: true, seed: Math.random() * 6, hd: F.a + off, h: 0 });
  }
  return true;
};
function aaKamiBoom(b, harmless) {
  if (harmless) { sparks(b.x, b.y, 6, '#ffcf7a'); boomLite(b.x, b.y, 14); SFX.play('hit', .4, b.x, b.y); return; }
  blast(b.x, b.y, b.splash, b.dmg, b.team, b.src);
}
B_KIND.kamikaze = {
  high: true,
  update(b, dt) {
    b.life += dt;
    let T = b.prey && !b.prey.dead && !b.prey.hidden ? b.prey : null;
    if (!T && b.life > .5) { b.rt = (b.rt || 0) - dt; if (b.rt <= 0) { b.rt = .3; T = b.prey = nearestFoe(b.x, b.y, 650, b.team); } }
    let want = b.hd, spd;
    if (b.life < .55) spd = 70 + 260 * b.life; // décollage lent
    else if (T) {
      const d = Math.hypot(T.x - b.x, T.y - b.y);
      if (d < T.r + 80) b.dive = true;
      const lead = b.dive ? .15 : .4; want = Math.atan2(T.y + (T.vy || 0) * lead - b.y, T.x + (T.vx || 0) * lead - b.x); spd = b.dive ? 540 : 380;
      if (b.dive && d < T.r + 8) { aaKamiBoom(b); return true; }
    } else { const a = time * 1.5 + b.seed, gx = b.gx + Math.cos(a) * 110, gy = b.gy + Math.sin(a) * 110; want = Math.atan2(gy - b.y, gx - b.x); spd = 240; } // maraude au-dessus du point visé
    if (b.dive) { b.dt2 = (b.dt2 || 0) + dt; if (b.dt2 > 1.4) { aaKamiBoom(b); return true; } }
    if (b.life > b.max) { if (T) b.dive = true; else { aaKamiBoom(b, true); return true; } }
    if (b.life > b.max + 2) { aaKamiBoom(b, true); return true; }
    b.hd = turnTo(b.hd, want, (b.dive ? 7 : 3.6) * dt); b.vx = Math.cos(b.hd) * spd; b.vy = Math.sin(b.hd) * spd;
    b.x += b.vx * dt; b.y += b.vy * dt; b.h = b.dive ? Math.max(2, b.h - 60 * dt) : Math.min(22, b.h + 40 * dt);
    if (b.x < 0 || b.y < 0 || b.x >= WPX || b.y >= WPX) return true;
    return false;
  },
  draw(c, b) {
    const s = .95 * Math.min(1.6, b.sc || 1), h = b.h * s;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(b.x + h * .5, b.y + h * .8, 6 * s, 5 * s, 0, 0, TAU); c.fill();
    c.translate(b.x, b.y); c.rotate(b.hd); const k = 1 + h / 60; c.scale(k, k);
    c.strokeStyle = '#2e3432'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(-4.5 * s, -4.5 * s); c.lineTo(4.5 * s, 4.5 * s); c.moveTo(-4.5 * s, 4.5 * s); c.lineTo(4.5 * s, -4.5 * s); c.stroke();
    for (const [x, y] of [[4.5, 4.5], [4.5, -4.5], [-4.5, 4.5], [-4.5, -4.5]]) {
      c.fillStyle = 'rgba(210,220,215,.18)'; circ(c, x * s, y * s, 3.2 * s); c.fill();
      const a = time * 60 + x * y; c.strokeStyle = 'rgba(230,236,232,.6)'; c.lineWidth = .7 * s; c.beginPath(); c.moveTo(x * s + Math.cos(a) * 3 * s, y * s + Math.sin(a) * 3 * s); c.lineTo(x * s - Math.cos(a) * 3 * s, y * s - Math.sin(a) * 3 * s); c.stroke();
    }
    c.fillStyle = '#4a4f48'; rr(c, -3 * s, -2.2 * s, 6.5 * s, 4.4 * s, 1.5 * s); c.fill(); c.fillStyle = '#c8461a'; c.fillRect(-2.6 * s, -.6 * s, 4.6 * s, 1.2 * s);
    const on = (time * (b.dive ? 12 : 3) + b.seed) % 1 < .5; c.fillStyle = on ? '#ff3a2a' : '#601a14'; circ(c, 3 * s, 0, 1.2 * s); c.fill();
    if (on && b.dive) { c.fillStyle = 'rgba(255,60,40,.3)'; circ(c, 3 * s, 0, 3.4 * s); c.fill(); }
  },
};

// ---------- Grappin magnétique : crochet, câble tendu 3 s, ralentit et traîne les plus légères ----------
W_TICK.tether = (u, m, dt, mx, my) => {
  const b = m.teth; if (!b || b.gone || time - b.upd > .2 || b.st !== 'hold') return false;
  if (u.stunT > time) return true;
  const v = b.v; m.aim = turnTo(m.aim, Math.atan2(v.y - my, v.x - mx), aaTurn(m.w, u) * 1.5 * dt); // l'affût suit sa prise
  return true;
};
W_FIRE.tether = (u, m, w, F) => {
  if (m.teth && !m.teth.gone && time - m.teth.upd < .2) return false;
  if (!F.tgt && !NETVIS && !u.piloted) return false;
  const [sx, sy] = aaMz(F, 16);
  m.teth = projectile('tether', sx, sy, F.a, w.spd || 950, { team: u.team, src: u, m, st: 'fly', dps: (w.dps || 30) * diffDmg(u.team), range: w.range + 30, sc: F.sc, upd: time, hx: sx, hy: sy, ox: sx, oy: sy, hold: w.hold || 3, drag: w.drag || 150, tk: 0 });
  return true;
};
B_KIND.tether = {
  update(b, dt) {
    b.upd = time; b.life += dt;
    const u = b.src; if (!u || u.dead) { b.gone = true; return true; }
    const [mx, my] = mountWorldPos(u, b.m), ma = b.m.aim; b.ox = mx + Math.cos(ma) * 16 * b.sc; b.oy = my + Math.sin(ma) * 16 * b.sc;
    if (b.st === 'fly') {
      const sp = b.spd, steps = Math.max(1, Math.ceil(sp * dt / 14)), sdt = dt / steps;
      for (let s = 0; s < steps && b.st === 'fly'; s++) {
        b.hx += b.vx * sdt; b.hy += b.vy * sdt; b.dist += sp * sdt;
        const tx = (b.hx / TILE) | 0, ty = (b.hy / TILE) | 0;
        if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) { b.st = 'back'; break; }
        if (!b.air && W.obs[ty * WT + tx] && !lofCheap(W.obs[ty * WT + tx])) { sparks(b.hx, b.hy, 4, '#c9c2b4'); SFX.play('hit', .3, b.hx, b.hy); b.st = 'back'; break; }
        const cell = cellAt(b.hx, b.hy);
        if (cell) for (let k = 0; k < cell.length; k++) {
          const v = cell[k]; if (v.team === b.team || v.dead || v.hidden || v.invul || v.etype === 'cible') continue;
          if (d2(v.x, v.y, b.hx, b.hy) > (v.r + 5) ** 2) continue;
          b.v = v; b.st = 'hold'; b.t = b.hold; sparks(b.hx, b.hy, 6, '#ffb08a'); SFX.play('clank', .6, b.hx, b.hy); aaHitMark(u); break;
        }
        if (b.dist > b.range) b.st = 'back';
      }
    } else if (b.st === 'hold') {
      const v = b.v;
      if (!v || v.dead || v.hidden) b.st = 'back';
      else {
        const dx = v.x - mx, dy = v.y - my, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
        b.hx = v.x - ux * v.r * .8; b.hy = v.y - uy * v.r * .8;
        b.t -= dt; b.tk -= dt;
        if (b.tk <= 0) { b.tk = .25; hurt(v, b.dps * .25, u, { slow: .6 }); if (Math.random() < .5) sparks(b.hx, b.hy, 2, '#9fd0ff'); }
        b.taut = 0;
        if (!b.vis && aaMovable(v) && v.r < u.r * .8 && d > u.r + v.r + 26) { const s = b.drag * dt; v.x -= ux * s; v.y -= uy * s; v.vx *= .85; v.vy *= .85; b.taut = 1; } // traînée jusqu'au tireur
        if (d > b.range + 140) { sparks(b.hx, b.hy, 5, '#ffcf7a'); SFX.play('hit', .4, b.hx, b.hy); b.st = 'back'; } // le câble cède
        if (b.t <= 0) b.st = 'back';
      }
    } else { // rembobinage
      const dx = b.ox - b.hx, dy = b.oy - b.hy, d = Math.hypot(dx, dy), s = 1300 * dt;
      if (d <= s + 4) { b.gone = true; return true; }
      b.hx += dx / d * s; b.hy += dy / d * s;
    }
    b.x = (b.hx + b.ox) / 2; b.y = (b.hy + b.oy) / 2;
    return false;
  },
  draw(c, b) {
    const s = Math.min(1.8, b.sc || 1), dx = b.hx - b.ox, dy = b.hy - b.oy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const sag = b.st === 'hold' ? (b.taut ? 1.5 : 6 + L * .03) * (1 + .3 * Math.sin(time * 9)) : b.st === 'fly' ? 4 + Math.sin(b.life * 30) * 3 : 10;
    const cx = (b.ox + b.hx) / 2 + nx * sag, cy = (b.oy + b.hy) / 2 + ny * sag;
    c.lineCap = 'round';
    c.strokeStyle = '#1e2120'; c.lineWidth = 2.6 * s; c.beginPath(); c.moveTo(b.ox, b.oy); c.quadraticCurveTo(cx, cy, b.hx, b.hy); c.stroke();
    c.strokeStyle = b.st === 'hold' ? '#8fb8d8' : '#8a8f88'; c.lineWidth = .9 * s; c.stroke();
    // crochet aimanté
    c.translate(b.hx, b.hy); c.rotate(Math.atan2(dy, dx));
    if (b.st === 'hold') { const p = .5 + .5 * Math.sin(time * 14); c.strokeStyle = `rgba(140,200,255,${(.35 + .4 * p).toFixed(2)})`; c.lineWidth = 1; for (let k = 1; k <= 2; k++) { c.beginPath(); c.arc(1 * s, 0, (2.5 + k * 2) * s, -1.1, 1.1); c.stroke(); } }
    aaMagnet(c, s);
  },
};
// aimant en U (crochet du grappin, aussi dessiné sur l'affût)
function aaMagnet(c, s) {
  c.fillStyle = '#c8461a'; c.beginPath(); c.moveTo(-2.4 * s, -3.4 * s); c.lineTo(2.2 * s, -3.4 * s); c.lineTo(2.2 * s, -1.8 * s); c.lineTo(-.6 * s, -1.8 * s); c.arc(-.6 * s, 0, 1.8 * s, -Math.PI / 2, Math.PI / 2, true); c.lineTo(2.2 * s, 1.8 * s); c.lineTo(2.2 * s, 3.4 * s); c.lineTo(-2.4 * s, 3.4 * s); c.arc(-2.4 * s, 0, 3.4 * s, Math.PI / 2, -Math.PI / 2); c.closePath(); c.fill();
  c.fillStyle = '#d8dde0'; c.fillRect(1.2 * s, -3.4 * s, 1.6 * s, 1.6 * s); c.fillRect(1.2 * s, 1.8 * s, 1.6 * s, 1.6 * s);
}

// ---------- Canon sonique : onde large qui traverse les rangs, repousse et brise arbres et cristaux ----------
W_FIRE.sonic = (u, m, w, F) => {
  const [sx, sy] = aaMz(F, 17);
  projectile('sonic', sx, sy, F.a, w.spd, { team: u.team, src: u, dmg: F.dmg, range: w.range, wd: w.width || 70, push: w.push || 260, hits: new Set(), sc: F.sc });
  muzzle(sx, sy, F.a, '#e0f6ff', F.sc * 1.4); SFX.play('gravity', u.piloted ? .7 : .4, sx, sy, { size: 1, pitch: 1.7, self: u.piloted && !u.net });
  return true;
};
B_KIND.sonic = {
  update(b, dt) {
    b.life += dt; const sp = b.spd, ca = Math.cos(b.a), sa = Math.sin(b.a), steps = Math.max(1, Math.ceil(sp * dt / 14)), sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      b.x += ca * sp * sdt; b.y += sa * sp * sdt; b.dist += sp * sdt;
      const half = b.wd / 2 * (1 + b.dist / b.range * .4), tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0;
      if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) return true;
      if (!b.air) {
        const o = W.obs[ty * WT + tx];
        if (o && o !== 1 && o !== 4) { projectileWall(b, b.dmg * .3); FX.dust(b.x, b.y, 3, 10, 50); return true; } // mur, rocher, épave : l'onde s'y brise
        for (let k = -2; k <= 2; k++) { const px = b.x - sa * half * k / 2, py = b.y + ca * half * k / 2, qx = (px / TILE) | 0, qy = (py / TILE) | 0; if (qx < 0 || qy < 0 || qx >= WT || qy >= WT) continue; const q = W.obs[qy * WT + qx]; if (q === 1 || q === 4) destroyTile(qx, qy, q, null); }
      }
      if (b.dist >= b.range) return true;
    }
    if (!b.vis) {
      const half = b.wd / 2 * (1 + b.dist / b.range * .4), tol = Math.max(20, sp * dt * .6);
      foesIn(b.x, b.y, half + 24, b.team, v => {
        if (b.hits.has(v.id)) return;
        const rx = v.x - b.x, ry = v.y - b.y, al = rx * ca + ry * sa, pe = -rx * sa + ry * ca;
        if (Math.abs(al) > tol + v.r || Math.abs(pe) > half + v.r) return;
        b.hits.add(v.id); hurt(v, b.dmg, b.src, { push: b.push, px: v.x - ca * 40, py: v.y - sa * 40 }); sparks(v.x, v.y, 4, '#d8f4ff'); aaHitMark(b.src);
      });
    }
    return false;
  },
  draw(c, b) {
    const half = b.wd / 2 * (1 + b.dist / b.range * .4), k = clamp(Math.min(b.dist / 40, (b.range - b.dist) / 90), 0, 1), Rc = half * 1.35, cx = b.x - Math.cos(b.a) * Rc * .75, cy = b.y - Math.sin(b.a) * Rc * .75, sp = Math.asin(Math.min(1, half / Rc)), z = Math.max(.5, cam.zoom);
    for (let j = 0; j < 3; j++) {
      const ox = Math.cos(b.a) * j * 11, oy = Math.sin(b.a) * j * 11;
      c.strokeStyle = j ? `rgba(200,240,255,${((.45 - j * .13) * k).toFixed(3)})` : `rgba(240,252,255,${(.8 * k).toFixed(3)})`; c.lineWidth = (j ? 3 : 4) / z + 1;
      c.beginPath(); c.arc(cx - ox, cy - oy, Rc, b.a - sp, b.a + sp); c.stroke();
    }
    c.fillStyle = `rgba(200,240,255,${(.1 * k).toFixed(3)})`; c.beginPath(); c.arc(cx, cy, Rc, b.a - sp, b.a + sp); c.arc(cx - Math.cos(b.a) * 30, cy - Math.sin(b.a) * 30, Rc, b.a + sp, b.a - sp, true); c.closePath(); c.fill();
  },
};

// ================= LOURDES : MÉCANIQUES =================
// ---------- Lance-tourelles : une capsule en cloche, puis une tourelle à minigun pour 20 s (deux par affût) ----------
W_FIRE.deploy = (u, m, w, F) => {
  let [px, py, r] = aaPoint(F, w.minRange || 80, w.range);
  if (!NETVIS && W) { const tx = (px / TILE) | 0, ty = (py / TILE) | 0; if (!walkableTile(tx, ty, true)) { const q = findWalkableNear(px, py, 20, 110, 18); if (!q) return false; px = q.x; py = q.y; } }
  const [sx, sy] = aaMz(F, 20);
  projectile('a_pod', sx, sy, F.a, 0, { team: u.team, src: u, m, x0: sx, y0: sy, tx: px, ty: py, t: 0, T: .8, arc: 70 + r * .1, sc: F.sc, k: aaK(m, w), life8: w.life || 20, maxT: w.maxT || 2, rot: F.a });
  muzzle(sx, sy, F.a, '#ffe0a0', F.sc * 1.4); addShakeNear(sx, sy, 2);
  return true;
};
B_KIND.a_pod = {
  high: true,
  update(b, dt) {
    b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc;
    if (k < 1) return false;
    FX.dust(b.tx, b.ty, 6, 14, 70); parts.push({ type: 'ring', x: b.tx, y: b.ty, vx: 0, vy: 0, life: .35, max: .35, size: 34, col: '#e8dcc4', thin: true }); sparks(b.tx, b.ty, 6, '#ffcf7a');
    SFX.play('clank', .8, b.tx, b.ty); SFX.play('crush', .5, b.tx, b.ty); addShakeNear(b.tx, b.ty, 2.5);
    if (!NETVIS) scarSprite('scorch', b.tx, b.ty, 18, Math.random() * TAU);
    const u = b.src; if (NETVIS || !u || u.dead) return true;
    const m = b.m; m.turrets = (m.turrets || []).filter(t => !t.dead);
    while (m.turrets.length >= b.maxT) { const o = m.turrets.shift(); if (!o.dead) { o.dead = true; boom(o.x, o.y, 24); } } // la plus ancienne se saborde
    const t = deployUnit(u, b.tx, b.ty, { r: 16, hp: 900 * (u.team === 1 ? diff.hp : 1), mounts: [['gatling', 0, 0]], life: b.life8, paint: '_tourelle', static: true, dmgMul: .65 * b.k, sc: 1.05, sight: 720, eng: 560 });
    if (t) { t.ang = b.rot; t.mounts[0].aim = b.rot; t.dep0 = time; t.depL = b.life8; m.turrets.push(t); }
    return true;
  },
  draw(c, b) {
    aaShadow(c, b.x, b.y, 9, b.h); aaImpactRing(c, b.tx, b.ty, 22, b.t / b.T, 'rgba(242,193,78,1)');
    c.translate(b.x, b.y - b.h); c.rotate(b.rot + b.t * 2); const s = 1 + b.h / 160; c.scale(s, s);
    c.fillStyle = '#3d4446'; ngon(c, 8, 8, Math.PI / 8); c.fill(); c.strokeStyle = '#141a1b'; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#e0b030'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.fillRect(Math.cos(a) * 5 - 1.4, Math.sin(a) * 5 - 1.4, 2.8, 2.8); }
    c.fillStyle = '#6fe3c8'; circ(c, 0, 0, 1.6); c.fill();
  },
};
// tourelle déployée : trépied, socle, bouclier tourné vers la cible ; la minigun est l'affût dessiné par-dessus
CH_PAINT._tourelle = (c, r, P, t, mv, u) => {
  c.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + Math.PI / 3, x = Math.cos(a) * r * 1.12, y = Math.sin(a) * r * 1.12; c.strokeStyle = P.dark; c.lineWidth = r * .26; c.beginPath(); c.moveTo(Math.cos(a) * r * .3, Math.sin(a) * r * .3); c.lineTo(x, y); c.stroke(); c.strokeStyle = P.plate; c.lineWidth = r * .1; c.stroke(); c.fillStyle = P.body2; circ(c, x, y, r * .2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); }
  c.fillStyle = P.body; ngon(c, 8, r * .66, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = P.plate; ngon(c, 8, r * .44, Math.PI / 8); c.fill();
  const da = u && u.mounts && u.mounts[0] ? u.mounts[0].aim - u.ang : 0;
  c.save(); c.rotate(da);
  c.fillStyle = P.body2; c.beginPath(); c.arc(0, 0, r * .98, -.95, .95); c.arc(0, 0, r * .74, .95, -.95, true); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.4; c.stroke();
  c.fillStyle = '#e0b030'; for (let k = -1; k <= 1; k += 2) { c.beginPath(); c.arc(0, 0, r * .95, k * .62 - .1, k * .62 + .1); c.arc(0, 0, r * .77, k * .62 + .1, k * .62 - .1, true); c.closePath(); c.fill(); }
  c.restore();
  if (u && u.dep0 !== undefined && !u.dead) { const f = clamp(1 - (time - u.dep0) / u.depL, 0, 1); c.strokeStyle = P.glow + '.55)'; c.lineWidth = Math.max(1.2, r * .08); c.beginPath(); c.arc(0, 0, r * 1.3, -Math.PI / 2 - u.ang, -Math.PI / 2 - u.ang + TAU * f); c.stroke(); }
};

// ---------- Bombardement en tapis : dix obus lâchés un à un, qui tombent en ligne le long de l'axe de tir ----------
W_FIRE.carpet = (u, m, w, F) => {
  const [cx, cy, r, a] = aaPoint(F, w.minRange || 0, w.range), n = w.shells || 10, L = w.len || 600, err = r * .03 * F.spr, ca = Math.cos(a), sa = Math.sin(a), T = 1 + r / 1600;
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1) - .5) * L, j = rnd(-16, 16);
    projectile('carpet', F.mx, F.my, a, 0, { team: u.team, src: u, m, x0: F.mx, y0: F.my, tx: cx + ca * o - sa * j + rnd(-err, err), ty: cy + sa * o + ca * j + rnd(-err, err), wait: i * .12, t: 0, T, arc: 160 + r * .18, dmg: F.dmg, splash: w.splash || 85, sc: F.sc, i });
  }
  m.salvoT = time; m.left = n;
  return true;
};
B_KIND.carpet = {
  high: true,
  update(b, dt) {
    if (b.wait > 0) { // encore dans son tube : il part de l'affût, où qu'il soit alors
      b.wait -= dt; if (b.wait > 0) return false;
      const u = b.src;
      if (u && !u.dead && b.m) { const [mx, my] = mountWorldPos(u, b.m), ma = b.m.aim; b.x0 = mx + Math.cos(ma) * 14 * b.sc; b.y0 = my + Math.sin(ma) * 14 * b.sc; b.m.left = Math.max(0, (b.m.left || 1) - 1); muzzle(b.x0, b.y0, ma, '#ffe0a0', b.sc * .9); }
      if (aaRoom()) parts.push({ type: 'smoke', x: b.x0, y: b.y0, vx: rnd(-20, 20), vy: rnd(-30, -5), life: .9, max: .9, size: 6, col: '' });
      SFX.play('lob', .3, b.x0, b.y0, { size: 2 });
    }
    b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc;
    if (Math.random() < .3 && aaRoom()) parts.push({ type: 'smoke', x: b.x, y: b.y - b.h, vx: 0, vy: -5, life: .45, max: .45, size: 4, col: '' });
    if (k < 1) return false;
    explode(b.tx, b.ty, b.splash, b.dmg, b.team, b.src);
    return true;
  },
  draw(c, b) {
    if (b.wait > 0) return;
    const k = b.t / b.T;
    // ombre au sol avant l'impact : elle grandit et fonce à mesure que l'obus descend
    if (k > .4) { const q = (k - .4) / .6; c.fillStyle = `rgba(0,0,0,${(.12 + .25 * q).toFixed(3)})`; c.beginPath(); c.ellipse(b.tx, b.ty, 6 + q * 10, 4 + q * 6, 0, 0, TAU); c.fill(); if (q > .45) { c.strokeStyle = `rgba(255,120,70,${((q - .45) * .5).toFixed(3)})`; c.lineWidth = 1; circ(c, b.tx, b.ty, b.splash * (1 - q * .45)); c.stroke(); } }
    const y = b.y - b.h, a = Math.atan2((b.ty - b.y0) / b.T - Math.cos(k * Math.PI) * Math.PI * b.arc / b.T, (b.tx - b.x0) / b.T);
    c.translate(b.x, y); c.rotate(a); const s = 1.1;
    c.fillStyle = '#2a2420'; rr(c, -5 * s, -2.2 * s, 9 * s, 4.4 * s, 2 * s); c.fill(); c.fillStyle = '#ffa060'; c.fillRect(-1 * s, -2.2 * s, 1.4 * s, 4.4 * s);
  },
};

// ---------- Bombe cryogénique : impact glacé, gel sur un large rayon, plaque de givre ----------
W_FIRE.cryolob = (u, m, w, F) => {
  const [px, py, r] = aaPoint(F, w.minRange || 0, w.range), err = r * .04 * F.spr, [sx, sy] = aaMz(F, 12);
  projectile('cryolob', sx, sy, F.a, 0, { team: u.team, src: u, x0: sx, y0: sy, tx: px + rnd(-err, err), ty: py + rnd(-err, err), t: 0, T: .55 + r / 800, arc: 120 + r * .15, dmg: F.dmg, splash: w.splash || 150, stun: w.stun || 1.2, sc: F.sc, rot: 0 });
  muzzle(sx, sy, F.a, '#dff4ff', F.sc * 1.5); addShakeNear(sx, sy, 2);
  return true;
};
B_KIND.cryolob = {
  high: true,
  update(b, dt) {
    b.t += dt; b.rot += dt * 5; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc;
    if (Math.random() < dt * 20 && aaRoomAny()) parts.push({ type: 'dust', x: b.x, y: b.y - b.h, vx: rnd(-10, 10), vy: rnd(-10, 10), life: .5, max: .5, size: 5, rgb: '215,240,255' });
    if (k < 1) return false;
    const R = b.splash, x = b.tx, y = b.ty;
    if (!NETVIS) foesIn(x, y, R, b.team, v => { const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.r); hurt(v, b.dmg * (1 - clamp(d / R, 0, 1) * .5), b.src, { slow: 3, stun: b.stun }); if (!v.dead) aaFreeze(v, b.stun); });
    aaTiles(x, y, R * .4, b.dmg * .5);
    addZone('a_frost', x, y, R, 4, b.team, b.src, { seed: (Math.random() * 1000) | 0 });
    parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .12, max: .12, size: R * .8, col: '#e8f8ff', a: 0 });
    for (let j = 0; j < 3; j++) parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .35 + j * .15, max: .35 + j * .15, size: R * (.6 + j * .25), col: j ? '#9fd8ff' : '#ffffff', thin: j > 0 });
    for (let i = 0; i < 16 && aaRoomAny(); i++) { const a = Math.random() * TAU, s = rnd(R * .6, R * 2); parts.push({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.5, 1), max: 1, size: rnd(2, 4.5), rot: rnd(0, 6), col: i % 3 ? '#dff4ff' : '#8fc8f0' }); }
    sparks(x, y, 12, '#f0fbff');
    if (aaRoom()) for (let i = 0; i < 6; i++) { const a = Math.random() * TAU; parts.push({ type: 'dust', x, y, vx: Math.cos(a) * R * .5, vy: Math.sin(a) * R * .5, life: 1.3, max: 1.3, size: 22, rgb: '215,240,255' }); }
    SFX.play('icecrack', 1, x, y); SFX.play('frost', .8, x, y, { size: 3 }); SFX.play('explo', .5, x, y, { size: 1.5 }); addShakeNear(x, y, 6);
    return true;
  },
  draw(c, b) {
    const y = b.y - b.h; aaShadow(c, b.x, b.y, 6, b.h); aaImpactRing(c, b.tx, b.ty, b.splash, b.t / b.T, 'rgba(160,215,255,1)');
    c.translate(b.x, y); c.rotate(b.rot);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 9); g.addColorStop(0, 'rgba(230,248,255,.7)'); g.addColorStop(1, 'rgba(160,215,255,0)'); c.fillStyle = g; circ(c, 0, 0, 9); c.fill();
    c.fillStyle = '#9fd8ff'; ngon(c, 6, 5, 0); c.fill(); c.strokeStyle = '#eaf8ff'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#ffffff'; ngon(c, 6, 2.2, Math.PI / 6); c.fill();
  },
};
ZONE_K.a_frost = {
  tick(f) {
    if (f.tick > 0 || f.vis) return; f.tick = .25;
    foesIn(f.x, f.y, f.r * .92, f.team, v => { v.slowT = Math.max(v.slowT || 0, (v.boss || v.giant ? .25 : .55)); }, { air: false });
  },
  draw(c, f) {
    const age = f.max - f.t, k = clamp(Math.min(age / .2, f.t / .8), 0, 1), R = f.r, S = f.seed;
    c.translate(f.x, f.y); c.globalAlpha = k;
    const g = c.createRadialGradient(0, 0, R * .1, 0, 0, R); g.addColorStop(0, 'rgba(225,242,255,.26)'); g.addColorStop(.75, 'rgba(170,215,245,.18)'); g.addColorStop(1, 'rgba(160,210,240,0)');
    c.fillStyle = g; circ(c, 0, 0, R); c.fill();
    c.strokeStyle = 'rgba(235,248,255,.42)'; c.lineWidth = 1.3; c.beginPath();
    for (let i = 0; i < 11; i++) { let a = hash2(i, S, 2) * TAU, x = 0, y = 0; c.moveTo(0, 0); for (let j = 0; j < 4; j++) { a += (hash2(i, j + S, 4) - .5) * .9; const l = R * (.14 + hash2(i, j, S) * .12); x += Math.cos(a) * l; y += Math.sin(a) * l; c.lineTo(x, y); } }
    c.stroke();
    c.fillStyle = 'rgba(240,250,255,.55)';
    for (let i = 0; i < 9; i++) { const a = hash2(i, S, 8) * TAU, d = R * (.3 + .6 * hash2(i, S, 9)), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 2 + hash2(i, S, 10) * 3; c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-s, 0); c.lineTo(0, -s * .45); c.lineTo(s, 0); c.lineTo(0, s * .45); c.closePath(); c.fill(); c.restore(); }
    c.globalAlpha = 1;
  },
};

// ---------- Puits gravitationnel : boule lente, puis puits de 5 s qui attire, englue et broie ----------
W_FIRE.well = (u, m, w, F) => {
  if (!F.tgt && !NETVIS && !u.piloted) return false;
  const [sx, sy] = aaMz(F, 24);
  projectile('a_wellball', sx, sy, F.a, w.spd || 500, { team: u.team, src: u, range: clamp(Math.hypot(F.tx - sx, F.ty - sy), 60, w.range), R: w.wellR || 230, dur: w.dur || 5, dps: F.dmg || 30, sc: F.sc, seed: rnd(0, 6) });
  muzzle(sx, sy, F.a, '#b9a0ff', F.sc * 1.5);
  return true;
};
function aaWellOpen(b, x, y) {
  addZone('a_well', x, y, b.R, b.dur, b.team, b.src, { dps: b.dps, seed: b.seed, list: [] });
  parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .15, max: .15, size: 60, col: '#d8c8ff', a: 0 });
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .5, max: .5, size: b.R, col: '#b9a0ff', thin: true });
  SFX.play('gravity', .8, x, y, { size: 2 }); addShakeNear(x, y, 3);
}
B_KIND.a_wellball = {
  update(b, dt) {
    b.life += dt; const sp = b.spd, steps = Math.max(1, Math.ceil(sp * dt / 14)), sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      const ox = b.x, oy = b.y; b.x += b.vx * sdt; b.y += b.vy * sdt; b.dist += sp * sdt;
      const tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0;
      if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) return true;
      if (!b.air && W.obs[ty * WT + tx] && !lofCheap(W.obs[ty * WT + tx])) { aaWellOpen(b, ox, oy); return true; }
      if (b.dist >= b.range) { aaWellOpen(b, b.x, b.y); return true; }
    }
    if (Math.random() < dt * 30 && aaRoomAny()) { const a = Math.random() * TAU; parts.push({ type: 'spark', x: b.x + Math.cos(a) * 14, y: b.y + Math.sin(a) * 14, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, life: .22, max: .22, size: 1.6, col: '#c8b4ff' }); }
    return false;
  },
  draw(c, b) {
    const s = Math.min(1.8, b.sc || 1), R = 7 * s;
    const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, R * 2.2); g.addColorStop(0, 'rgba(185,160,255,.0)'); g.addColorStop(.45, 'rgba(185,160,255,.45)'); g.addColorStop(1, 'rgba(185,160,255,0)');
    c.fillStyle = g; circ(c, b.x, b.y, R * 2.2); c.fill();
    c.fillStyle = '#07040e'; circ(c, b.x, b.y, R * .8); c.fill();
    c.strokeStyle = '#e0d4ff'; c.lineWidth = 1.2; c.beginPath(); c.arc(b.x, b.y, R, b.life * 9, b.life * 9 + 4); c.stroke();
  },
};
ZONE_K.a_well = {
  tick(f, dt) {
    f.age = (f.age || 0) + dt;
    if (aaRoom(820) && Math.random() < dt * 40) { const a = Math.random() * TAU, d = f.r * rnd(.55, 1), x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d, s = d * 1.6; parts.push({ type: 'spark', x, y, vx: -Math.cos(a) * s * .7 - Math.sin(a) * s * .7, vy: -Math.sin(a) * s * .7 + Math.cos(a) * s * .7, life: .55, max: .55, size: 1.8, col: Math.random() < .5 ? '#b9a0ff' : '#e6dcff' }); }
    if (f.vis) return;
    if (f.tick <= 0) { f.tick = .1; f.list.length = 0; foesIn(f.x, f.y, f.r, f.team, v => { f.list.push(v); hurt(v, f.dps * .1, f.src, { slow: .5 }); }); }
    for (const v of f.list) {
      if (v.dead || !aaMovable(v)) continue; // boss, géants, statiques : seulement englués
      const dx = f.x - v.x, dy = f.y - v.y, d = Math.hypot(dx, dy); if (d < 24) continue;
      const s = (90 + 110 * Math.min(1, d / f.r)) * dt; v.x += dx / d * s; v.y += dy / d * s; v.vx *= .9; v.vy *= .9;
    }
  },
  draw(c, f) {
    const age = f.max - f.t, k = clamp(Math.min(age / .3, f.t / .5), 0, 1), R = f.r * (.4 + .6 * Math.min(1, age / .3)), rot = -age * 2.4 + f.seed;
    c.translate(f.x, f.y); c.globalAlpha = k;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(8,4,18,.85)'); g.addColorStop(.18, 'rgba(40,20,80,.5)'); g.addColorStop(.6, 'rgba(110,80,200,.16)'); g.addColorStop(1, 'rgba(110,80,200,0)');
    c.fillStyle = g; circ(c, 0, 0, R); c.fill();
    c.lineCap = 'round';
    for (let arm = 0; arm < 4; arm++) { // bras de spirale qui s'enroulent vers le centre
      c.beginPath();
      for (let i = 0; i <= 14; i++) { const q = i / 14, r = R * (.12 + .88 * q), a = rot + arm * Math.PI / 2 + Math.log(1 + q * 6) * 1.6; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.strokeStyle = 'rgba(190,165,255,.42)'; c.lineWidth = 3; c.stroke(); c.strokeStyle = 'rgba(235,225,255,.35)'; c.lineWidth = 1; c.stroke();
    }
    for (let j = 0; j < 3; j++) { const q = 1 - ((age * .7 + j / 3) % 1); c.strokeStyle = `rgba(200,180,255,${(.35 * q).toFixed(3)})`; c.lineWidth = 1.5; circ(c, 0, 0, R * q); c.stroke(); } // anneaux qui se resserrent
    c.fillStyle = '#05030a'; circ(c, 0, 0, 13); c.fill(); c.strokeStyle = '#d8c8ff'; c.lineWidth = 1.5; circ(c, 0, 0, 13 + Math.sin(time * 9) * 1.2); c.stroke();
    c.globalAlpha = 1;
  },
};

// ---------- Paratonnerre : tige plantée 8 s qui foudroie les deux ennemis les plus proches ----------
W_FIRE.rod = (u, m, w, F) => {
  const [px, py, r] = aaPoint(F, w.minRange || 60, w.range), [sx, sy] = aaMz(F, 22);
  projectile('a_rod', sx, sy, F.a, 0, { team: u.team, src: u, x0: sx, y0: sy, tx: px, ty: py, t: 0, T: .5, arc: 80 + r * .08, dmg: F.dmg, dur: w.dur || 8, zr: w.zr || 320, n: w.bolts || 2, every: w.every || .5, st: 'fly', sc: F.sc, rot: F.a, zt: .25, left: 0 });
  return true;
};
const AA_ROD_H = 34; // hauteur de la tige (décalage vers le haut de l'écran)
B_KIND.a_rod = {
  high: true,
  update(b, dt) {
    if (b.st === 'fly') {
      b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k); b.h = Math.sin(k * Math.PI) * b.arc; b.rot += dt * 9;
      if (k < 1) return false;
      b.st = 'up'; b.left = b.dur; sparks(b.x, b.y, 8, '#cfe6ff'); FX.dust(b.x, b.y, 3, 8, 40); SFX.play('clank', .7, b.x, b.y); if (!NETVIS) scarSprite('scorch', b.x, b.y, 12, Math.random() * TAU);
      return false;
    }
    b.left -= dt; if (b.left <= 0) { sparks(b.x, b.y - AA_ROD_H, 10, '#cfe6ff'); SFX.play('hit', .5, b.x, b.y); return true; }
    b.zt -= dt; if (b.zt > 0) return false; b.zt = b.every;
    const L = []; foesIn(b.x, b.y, b.zr, b.team, v => L.push(v));
    const tx = b.x, ty = b.y - AA_ROD_H;
    if (!L.length) { if (Math.random() < .5) beams.push({ pts: zig(tx, ty, tx + rnd(-26, 26), ty + rnd(-10, 30), 4, 5), life: .1, max: .1, col: '#cfe6ff', w: 1 }); return false; }
    L.sort((p, q) => d2(p.x, p.y, b.x, b.y) - d2(q.x, q.y, b.x, b.y));
    for (let i = 0; i < Math.min(b.n, L.length); i++) {
      const v = L[i];
      beams.push({ pts: zig(tx, ty, v.x, v.y, 8, 13), life: .22, max: .22, col: '#cfe6ff', w: 2.6 }); beams.push({ pts: zig(tx, ty, v.x, v.y, 6, 7), life: .12, max: .12, col: '#a8d0ff', w: 1.4 });
      hurt(v, b.dmg, b.src); sparks(v.x, v.y, 6, '#e8f4ff'); parts.push({ type: 'flash', x: v.x, y: v.y, vx: 0, vy: 0, life: .08, max: .08, size: 14 + v.r * .4, col: '#dff0ff', a: 0 }); aaHitMark(b.src);
    }
    SFX.play('storm', .55, tx, ty, { size: 1.5 });
    return false;
  },
  draw(c, b) {
    const s = 1;
    if (b.st === 'fly') {
      aaShadow(c, b.x, b.y, 5, b.h); c.translate(b.x, b.y - b.h); c.rotate(b.rot);
      c.strokeStyle = '#b8c4cc'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.stroke(); c.fillStyle = '#e8f4ff'; circ(c, 11, 0, 2.2); c.fill(); return;
    }
    const x = b.x, y = b.y, H = AA_ROD_H, f = b.left / b.dur, ph = .5 + .5 * Math.sin(time * 12 + b.rot);
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + H * .55, y + H * .3); c.stroke(); // ombre portée
    c.strokeStyle = '#2a2e30'; c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + b.rot; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 6); } c.stroke();
    c.strokeStyle = `rgba(160,210,255,${(.18 + .15 * ph).toFixed(3)})`; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
    c.strokeStyle = '#3a4246'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - H); c.stroke();
    c.strokeStyle = '#b8c4cc'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - .6, y); c.lineTo(x - .6, y - H); c.stroke();
    c.fillStyle = '#c18a52'; for (const q of [.35, .62]) { c.beginPath(); c.ellipse(x, y - H * q, 3.6, 1.6, 0, 0, TAU); c.fill(); }
    const g = c.createRadialGradient(x, y - H, 0, x, y - H, 12); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, `rgba(190,225,255,${(.5 + .4 * ph).toFixed(2)})`); g.addColorStop(1, 'rgba(160,210,255,0)');
    c.fillStyle = g; circ(c, x, y - H, 12); c.fill();
    if (Math.random() < .35) { c.strokeStyle = '#e8f4ff'; c.lineWidth = .9; c.beginPath(); c.moveTo(x, y - H); c.lineTo(x + rnd(-9, 9), y - H + rnd(-9, 9)); c.lineTo(x + rnd(-12, 12), y - H + rnd(-12, 12)); c.stroke(); }
  },
};

// ---------- Foreuse perforante : traverse tous les ennemis et creuse le décor jusqu'aux murs ----------
W_FIRE.drill = (u, m, w, F) => {
  const [sx, sy] = aaMz(F, 24);
  projectile('drill', sx, sy, F.a + (Math.random() - .5) * 2 * (w.spread || 0) * F.spr, w.spd, { team: u.team, src: u, dmg: F.dmg, range: w.range, ap: (w.fx && w.fx.ap) || .6, sc: F.sc, hits: new Set(), bore: 0 });
  muzzle(sx, sy, F.a, '#ffd27a', F.sc * 1.6); addShakeNear(sx, sy, 2.5);
  if (aaRoom()) for (let k = 0; k < 3; k++) parts.push({ type: 'smoke', x: sx, y: sy, vx: Math.cos(F.a) * rnd(20, 50), vy: Math.sin(F.a) * rnd(20, 50), life: rnd(.6, 1.1), max: 1.1, size: 5 * F.sc, col: '' });
  return true;
};
function aaDrillEnd(b) { sparks(b.x, b.y, 10, '#ffd27a'); FX.dust(b.x, b.y, 4, 12, 60); boomLite(b.x, b.y, 22); SFX.play('crush', .7, b.x, b.y); if (!NETVIS) scarSprite('crack', b.x, b.y, 26, Math.random() * TAU); }
B_KIND.drill = {
  update(b, dt) {
    b.life += dt; b.bore -= dt;
    const sp = b.spd * (b.bore > 0 ? .45 : 1), ca = Math.cos(b.a), sa = Math.sin(b.a), steps = Math.max(1, Math.ceil(sp * dt / 12)), sdt = dt / steps, hr = 9 * Math.min(2, b.sc);
    b.vx = ca * sp; b.vy = sa * sp;
    for (let s = 0; s < steps; s++) {
      b.x += ca * sp * sdt; b.y += sa * sp * sdt; b.dist += sp * sdt;
      const tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0;
      if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) return true;
      const o = b.air ? 0 : W.obs[ty * WT + tx];
      if (o) {
        if (o >= 6) { if (o === 8) hitBuildingTile(tx, ty, b.dmg, b.team, b.src); hitTile(tx, ty, b.dmg); aaDrillEnd(b); return true; } // rempart, falaise, bâtiment : la foreuse s'y arrête
        if (!b.vis && b.dug !== ty * WT + tx) { b.dug = ty * WT + tx; destroyTile(tx, ty, o, null); b.bore = .16; SFX.play('crush', .5, b.x, b.y); for (let k = 0; k < 5 && aaRoomAny(); k++) parts.push({ type: 'debris', x: b.x, y: b.y, vx: -ca * rnd(40, 140) + rnd(-60, 60), vy: -sa * rnd(40, 140) + rnd(-60, 60), life: rnd(.4, .8), max: .8, size: rnd(2, 4), col: (OBS[o] && OBS[o].mm) || '#6a6862' }); }
      }
      const cell = cellAt(b.x, b.y);
      if (cell) for (let k = 0; k < cell.length; k++) {
        const v = cell[k]; if (v.team === b.team || v.dead || v.hidden || v.invul || v.etype === 'cible' || b.hits.has(v.id)) continue;
        if (d2(v.x, v.y, b.x, b.y) > (v.r + hr) ** 2) continue;
        b.hits.add(v.id); hurt(v, b.dmg, b.src, { ap: b.ap }); sparks(b.x, b.y, 8, '#ffd27a'); SFX.play('hit', .5, b.x, b.y); addShakeNear(b.x, b.y, 1); aaHitMark(b.src); b.bore = Math.max(b.bore, .08);
      }
    }
    if (b.dist >= b.range) { aaDrillEnd(b); return true; }
    b.dt2 = (b.dt2 || 0) + sp * dt; if (b.dt2 > 26 && aaRoom()) { b.dt2 = 0; parts.push({ type: 'dust', x: b.x - ca * 10, y: b.y - sa * 10, vx: rnd(-15, 15), vy: rnd(-15, 15), life: .9, max: .9, size: 8, rgb: '150,140,120' }); }
    return false;
  },
  draw(c, b) {
    const s = .9 * Math.min(1.8, b.sc || 1);
    c.translate(b.x, b.y); c.rotate(b.a);
    if (b.bore > 0 || Math.random() < .3) { c.fillStyle = 'rgba(255,170,70,.45)'; circ(c, -13 * s, 0, (3 + Math.random() * 2) * s); c.fill(); }
    c.fillStyle = '#2e3436'; rr(c, -12 * s, -4 * s, 13 * s, 8 * s, 2 * s); c.fill();
    c.fillStyle = '#4a5254'; c.beginPath(); c.moveTo(-12 * s, -4 * s); c.lineTo(-15 * s, -6.5 * s); c.lineTo(-9 * s, -4 * s); c.moveTo(-12 * s, 4 * s); c.lineTo(-15 * s, 6.5 * s); c.lineTo(-9 * s, 4 * s); c.fill();
    aaDrillCone(c, 1 * s, 11 * s, 4.2 * s, b.life * 14);
  },
};
// cône de forage à spirale (projectile et affût)
function aaDrillCone(c, x0, L, hw, ph) {
  c.save(); c.beginPath(); c.moveTo(x0, -hw); c.lineTo(x0 + L, 0); c.lineTo(x0, hw); c.closePath();
  c.fillStyle = '#b8902c'; c.fill(); c.clip();
  c.strokeStyle = '#ffe08a'; c.lineWidth = hw * .32; const st = hw * .9, o = ((ph % 1) + 1) % 1 * st;
  c.beginPath(); for (let x = x0 - hw * 2 + o; x < x0 + L + hw; x += st) { c.moveTo(x, -hw); c.lineTo(x + hw * 1.1, hw); } c.stroke();
  c.restore(); c.strokeStyle = '#5a4416'; c.lineWidth = .7; c.beginPath(); c.moveTo(x0, -hw); c.lineTo(x0 + L, 0); c.lineTo(x0, hw); c.stroke();
}

// ---------- Marteau-pilon : le bras s'abat devant le robot, onde de choc au sol ----------
W_FIRE.quake = (u, m, w, F) => {
  if (F.tgt && F.tgt.fly && !u.piloted && !NETVIS) return false; // l'onde court au sol : inutile contre un volant
  const reach = clamp(Math.hypot(F.tx - F.mx, F.ty - F.my) - (F.tgt ? F.tgt.r * .3 : 0), 26 * F.sc, w.range * .8);
  const px = F.mx + Math.cos(F.a) * reach, py = F.my + Math.sin(F.a) * reach;
  m.hamT = time; m.hamR = reach / F.sc;
  addZone('a_quake', px, py, w.qr || 140, 1, u.team, u, { d: .2, dmg: F.dmg, stun: w.stun || .6, push: w.push || 300, sc: F.sc });
  return true;
};
function aaQuake(f) {
  const R = f.r, x = f.x, y = f.y;
  if (!NETVIS) foesIn(x, y, R, f.team, v => { const d = Math.max(0, Math.hypot(v.x - x, v.y - y) - v.r); hurt(v, f.dmg * (1 - clamp(d / R, 0, 1) * .5), f.src, { stun: f.stun, push: f.push, px: x, py: y }); }, { air: false });
  aaTiles(x, y, R * .45, f.dmg * .6); // le décor proche encaisse
  parts.push({ type: 'flash', x, y, vx: 0, vy: 0, life: .1, max: .1, size: 40, col: '#fff2c8', a: 0 });
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .4, max: .4, size: R, col: '#e8dcc4' }); parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .6, max: .6, size: R * 1.3, col: 'rgba(200,190,170,.8)', thin: true });
  for (let i = 0; i < 10 && aaRoomAny(); i++) { const a = Math.random() * TAU, s = rnd(R * .8, R * 2); parts.push({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.4, .8), max: .8, size: rnd(2, 4), rot: rnd(0, 6), col: i % 2 ? '#4a443c' : '#6a6458' }); }
  FX.dust(x, y, 8, R * .22, R * 1.3);
  if (!NETVIS) scarSprite('crack', x, y, R * .6, Math.random() * TAU);
  addShakeNear(x, y, 7 + f.sc); SFX.play('explo', .7, x, y, { size: 1.6 }); SFX.play('crush', .9, x, y);
  if (!NETVIS && isMine(f.src)) buzz(40);
}
ZONE_K.a_quake = {
  tick(f, dt) { if (f.done) { f.t = 0; return; } f.d -= dt; if (f.d > 0) return; f.done = true; aaQuake(f); },
  draw(c, f) { if (f.done) return; const q = 1 - f.d / .2; c.strokeStyle = `rgba(232,220,196,${(.25 * q).toFixed(3)})`; c.lineWidth = 2; circ(c, f.x, f.y, f.r * (1.1 - q * .5)); c.stroke(); },
};

// ================= DESSINS DES AFFÛTS =================
// repère de l'affût déjà mis à l'échelle, canon vers +x ; m peut être null (aperçus, icônes)
const AA_D = '#181c1e';
const aaLoaded = (m, f) => !m || !m.w || !m.w.rate || m.cd < (1 / m.w.rate) * (f || .5);
function aaHazard(c, x, y, w, h) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#e0b030'; c.fillRect(x, y, w, h); c.fillStyle = '#1e1c18'; for (let k = -6; k < 12; k++) { const q = y + k * 2.4; c.beginPath(); c.moveTo(x, q); c.lineTo(x + w, q + w * .8); c.lineTo(x + w, q + w * .8 + 1.2); c.lineTo(x, q + 1.2); c.fill(); } c.restore(); }
// ---- légères (≈ 5 × 15)
W_PAINT.ricochet = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -4.5, -3.4, 9, 6.8, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .6; c.stroke();
  c.fillStyle = P.plate; circ(c, -1.4, 0, 2.2); c.fill(); c.fillStyle = AA_D; circ(c, -1.4, 0, .8); c.fill();
  c.fillStyle = AA_D; c.fillRect(2, -1, 11, 2);
  c.fillStyle = '#c9c2b4'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(11.2, s * .9); c.lineTo(15.6, s * 3.8); c.lineTo(16.4, s * 2.9); c.lineTo(13.2, s * .4); c.closePath(); c.fill(); } // déflecteur en fourche
  c.fillStyle = '#fff1c4'; c.fillRect(13, -.45, 2.4, .9);
  c.fillStyle = P.acc; c.fillRect(3.2, -2.6, 1.3, 1.3);
};
W_PAINT.boomerang = (c, P, rec, t, m) => {
  let fl = 0; if (m && m.blades) for (const b of m.blades) if (!b.gone && time - b.upd < .3) fl++;
  c.fillStyle = AA_D; c.fillRect(0, -3.4, 11, 1.3); c.fillRect(0, 2.1, 11, 1.3);
  c.fillStyle = P.body2; circ(c, -.5, 0, 4.2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .7; c.stroke();
  c.fillStyle = P.plate; circ(c, -.5, 0, 2); c.fill();
  if (fl < 2) { c.save(); c.translate(3.6, 0); aaBlade(c, .5, '#bfc8cc', '#6d7a80'); c.restore(); }
  if (fl < 1) { c.save(); c.translate(8, 0); aaBlade(c, .6, '#dfe6ea', '#7d8a90'); c.restore(); }
  c.fillStyle = P.acc; circ(c, -.5, 0, .7); c.fill();
};
W_PAINT.minelayer = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -6, -4.8, 9.5, 9.6, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .7; c.stroke();
  for (let k = 0; k < 3; k++) { const y = -3 + k * 3; c.fillStyle = '#2b2f2c'; circ(c, -3.2, y, 1.35); c.fill(); c.fillStyle = (t * 1.3 + k * .3) % 1 < .2 ? '#ff3a2a' : '#6a221a'; circ(c, -3.2, y, .45); c.fill(); }
  c.fillStyle = AA_D; rr(c, 1.5, -2.7, 9, 5.4, 1); c.fill();
  aaHazard(c, 9.2, -2.9, 2.2, 5.8);
  c.fillStyle = '#0a0c0d'; c.fillRect(10.6, -1.8, .8, 3.6);
};
W_PAINT.cryo = (c, P, rec, t, m) => {
  const on = m && m.on && time - (m.onT || -9) < .15;
  if (on && m.jetL) { // cône de brume glacée : voile léger et bouffées qui s'éloignent en s'élargissant
    const L = m.jetL, tw = Math.tan(.35) * L, g = c.createLinearGradient(12, 0, L, 0); g.addColorStop(0, 'rgba(200,232,252,.09)'); g.addColorStop(.7, 'rgba(175,220,250,.03)'); g.addColorStop(1, 'rgba(190,230,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(12, -2.4); c.lineTo(L, -tw); c.quadraticCurveTo(L * 1.06, 0, L, tw); c.lineTo(12, 2.4); c.closePath(); c.fill();
    const spr = FX.dustSpr('190,226,250');
    for (let i = 0; i < 8; i++) { const q = (t * 2.6 + i / 8) % 1, x = 12 + q * (L - 12) * .95, y = Math.sin(i * 2.3 + t * 3) * tw * q * .35, r = 3 + q * tw * 1.05; c.globalAlpha = .26 * (1 - q) * (q < .1 ? q * 10 : 1); c.drawImage(spr, x - r, y - r, r * 2, r * 2); }
    c.globalAlpha = 1;
  }
  const g = c.createRadialGradient(-3.6, -1.6, .4, -2.5, 0, 4.6); g.addColorStop(0, '#f4fcff'); g.addColorStop(.6, '#b8dcee'); g.addColorStop(1, '#7da6bc');
  c.fillStyle = g; circ(c, -2.5, 0, 4.5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .6; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .5; c.beginPath(); c.moveTo(-4.6, 1.4); c.lineTo(-3.6, 2.6); c.moveTo(-1.2, -3.2); c.lineTo(-.4, -2.2); c.moveTo(-5.2, -1); c.lineTo(-4.4, -.4); c.stroke();
  c.fillStyle = AA_D; c.fillRect(1, -1.4, 8, 2.8);
  c.fillStyle = '#7fb8d8'; c.fillRect(3, -1.8, .9, 3.6); c.fillRect(5.4, -1.8, .9, 3.6);
  c.fillStyle = P.plate; c.beginPath(); c.moveTo(8.4, -1.7); c.lineTo(12, -3); c.lineTo(12, 3); c.lineTo(8.4, 1.7); c.closePath(); c.fill();
  c.fillStyle = on ? '#e8f8ff' : `rgba(191,232,255,${(.45 + .25 * Math.sin(t * 3)).toFixed(2)})`; c.fillRect(11.3, -2.6, .9, 5.2);
};
W_PAINT.marker = (c, P, rec, t, m) => {
  const on = m && m.on && time - (m.onT || -9) < .15;
  c.fillStyle = P.body2; rr(c, -4.2, -2.8, 10, 5.6, 1.6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .6; c.stroke();
  c.fillStyle = P.plate; c.fillRect(-3, -4, 6.5, 1.4); c.fillStyle = AA_D; c.fillRect(2.8, -4.2, 1.8, 1.8);
  c.strokeStyle = P.plate; c.lineWidth = .6; c.beginPath(); c.arc(-3.4, 3.2, 1.8, -2.6, -.5); c.stroke();
  c.fillStyle = AA_D; c.fillRect(5, -2.4, 2.6, 4.8); circ(c, 7.8, 0, 2.5); c.fill();
  const p = on ? 1 : .5 + .5 * Math.sin(t * 3);
  if (on) { c.fillStyle = 'rgba(255,60,60,.3)'; circ(c, 8.2, 0, 3.6); c.fill(); }
  c.fillStyle = `rgba(255,59,59,${(.45 + .55 * p).toFixed(2)})`; circ(c, 8.1, 0, 1.5); c.fill(); c.fillStyle = 'rgba(255,220,220,.8)'; circ(c, 7.7, -.5, .45); c.fill();
};
// ---- moyennes (≈ 7 × 20)
W_PAINT.flechette = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -4.5, -8.6, 8.5, 2.8, 1); c.fill(); c.fillStyle = '#dfe8f0'; for (let k = 0; k < 3; k++) { const x = -3.4 + k * 2.6; c.beginPath(); c.moveTo(x, -6); c.lineTo(x + 1, -8.2); c.lineTo(x + 2, -6); c.closePath(); c.fill(); }
  c.fillStyle = P.body; circ(c, 0, 0, 6.4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke();
  c.fillStyle = P.plate; circ(c, -1.2, 0, 3); c.fill();
  c.fillStyle = AA_D; c.beginPath(); c.moveTo(3, -2.3); c.lineTo(15.5, -2.4); c.lineTo(20, -3.8); c.lineTo(20, 3.8); c.lineTo(15.5, 2.4); c.lineTo(3, 2.3); c.closePath(); c.fill();
  c.fillStyle = '#4a443a'; for (const x of [7, 10, 13]) c.fillRect(x, -2.8, 1.1, 5.6);
  c.fillStyle = '#c9a26a'; c.fillRect(19.2, -3.6, .9, 7.2);
};
W_PAINT.corroder = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -7.5, -6.2, 12.5, 12.4, 2.5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .9; c.stroke();
  c.fillStyle = AA_D; rr(c, 2.5, -2.8, 12, 5.6, 1.2); c.fill(); c.fillStyle = '#9fe06a'; c.fillRect(13.4, -2.2, 1.5, 4.4);
  c.fillStyle = '#3e5a2a'; c.fillRect(5, -3.4, 1.4, 6.8);
  const g = c.createRadialGradient(-3.2, -1.6, .4, -2, 0, 4.8); g.addColorStop(0, '#f0ffd0'); g.addColorStop(.45, '#9fe06a'); g.addColorStop(1, '#2e5a18');
  c.fillStyle = g; circ(c, -2, 0, 4.6); c.fill(); c.strokeStyle = '#1a2a10'; c.lineWidth = .7; c.stroke();
  c.fillStyle = 'rgba(230,255,190,.75)'; for (let k = 0; k < 3; k++) { const q = (t * .7 + k / 3) % 1; circ(c, -2 + Math.sin(k * 2.3 + q * 4) * 2, 2.6 - q * 5, .4 + q * .7); c.fill(); }
};
W_PAINT.disruptor = (c, P, rec, t, m) => {
  const ch = aaLoaded(m, 1) && m && m.w ? clamp(1 - m.cd * m.w.rate, 0, 1) : 1;
  c.fillStyle = P.body2; circ(c, -1.5, 0, 5.8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .8; c.stroke();
  c.fillStyle = AA_D; c.fillRect(0, -1.2, 7, 2.4);
  c.strokeStyle = P.dark; c.lineWidth = 3.2; c.beginPath(); c.arc(-3, 0, 11, -.72, .72); c.stroke();
  c.strokeStyle = P.plate; c.lineWidth = 2; c.stroke();
  c.strokeStyle = `rgba(184,200,255,${(.25 + .5 * ch).toFixed(2)})`; c.lineWidth = .8; for (const r of [6.6, 8.6]) { c.beginPath(); c.arc(-3, 0, r, -.6, .6); c.stroke(); }
  const g = c.createRadialGradient(7, 0, 0, 7, 0, 3.6); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, `rgba(200,215,255,${(.4 + .6 * ch).toFixed(2)})`); g.addColorStop(1, 'rgba(184,200,255,0)');
  c.fillStyle = g; circ(c, 7, 0, 3.6); c.fill();
};
W_PAINT.kamikaze = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -8, -7.4, 15.5, 14.8, 2.5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .9; c.stroke();
  aaHazard(c, 5.6, -7.4, 1.9, 14.8);
  const ld = aaLoaded(m, .55);
  for (const s of [-1, 1]) {
    c.fillStyle = AA_D; rr(c, -6.5, s * 3.4 - 2.9, 11, 5.8, 1.5); c.fill();
    if (!ld) continue;
    c.save(); c.translate(-1, s * 3.4);
    c.strokeStyle = '#3a3f3b'; c.lineWidth = .9; c.beginPath(); c.moveTo(-2.2, -2.2); c.lineTo(2.2, 2.2); c.moveTo(-2.2, 2.2); c.lineTo(2.2, -2.2); c.stroke();
    c.fillStyle = 'rgba(200,210,205,.35)'; for (const [x, y] of [[2.2, 2.2], [2.2, -2.2], [-2.2, 2.2], [-2.2, -2.2]]) { circ(c, x, y, 1.3); c.fill(); }
    c.fillStyle = '#c8461a'; c.fillRect(-1.2, -.7, 2.4, 1.4); c.fillStyle = (t * 2 + s) % 1 < .5 ? '#ff3a2a' : '#601a14'; circ(c, 1.4, 0, .5); c.fill();
    c.restore();
  }
};
W_PAINT.tether = (c, P, rec, t, m) => {
  const home = !m || !m.teth || m.teth.gone || time - m.teth.upd > .2;
  c.fillStyle = AA_D; c.fillRect(2, -1.8, 13, 3.6); c.fillStyle = P.plate; c.fillRect(5, -2.4, 2, 4.8); c.fillRect(10.5, -2.2, 1.2, 4.4);
  c.fillStyle = P.body2; circ(c, -2, 0, 5.8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .8; c.stroke();
  const sp = home ? t * .5 : t * 9; c.strokeStyle = '#6a6e66'; c.lineWidth = .7; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-2, 0, 2 + k * 1.1, sp + k, sp + k + 4.2); c.stroke(); } // câble enroulé
  c.fillStyle = AA_D; circ(c, -2, 0, 1); c.fill();
  if (home) { c.save(); c.translate(17.6, 0); aaMagnet(c, .85); c.restore(); }
};
W_PAINT.sonic = (c, P, rec, t, m) => {
  c.fillStyle = AA_D; c.beginPath(); c.moveTo(2, -2.6); c.lineTo(16, -6.8); c.quadraticCurveTo(17.6, 0, 16, 6.8); c.lineTo(2, 2.6); c.closePath(); c.fill();
  c.strokeStyle = P.plate; c.lineWidth = .9; c.beginPath(); for (const x of [6, 10, 14]) { const h = 2.6 + (x - 2) / 14 * 4.2; c.moveTo(x, -h); c.lineTo(x, h); } c.stroke();
  const p = .5 + .5 * Math.sin(t * 7); c.fillStyle = `rgba(200,240,255,${(.35 + .35 * p).toFixed(2)})`; c.beginPath(); c.ellipse(15.6, 0, 1.2, 6.2, 0, 0, TAU); c.fill();
  c.fillStyle = P.body2; circ(c, -1.5, 0, 5.6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = .8; c.stroke();
  c.fillStyle = P.plate; circ(c, -1.5, 0, 2.6); c.fill(); c.fillStyle = '#c8f0ff'; circ(c, -1.5, 0, 1); c.fill();
};
// ---- lourdes (≈ 9 × 26)
W_PAINT.deployer = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -10.5, -8.6, 20, 17.2, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = AA_D; rr(c, 4, -5, 20, 10, 2); c.fill(); aaHazard(c, 21.4, -5, 2.4, 10);
  c.fillStyle = P.plate; rr(c, -9, -7.2, 4.6, 14.4, 1.2); c.fill();
  let n = 0; if (m && m.turrets) for (const u of m.turrets) if (!u.dead) n++;
  for (let k = 0; k < 2; k++) { c.fillStyle = k < n ? P.acc : '#2a3032'; circ(c, -6.7, -3.4 + k * 6.8, 1.2); c.fill(); }
  if (aaLoaded(m, .5)) { c.save(); c.translate(1.5, 0); c.rotate(Math.PI / 8); c.fillStyle = '#3d4446'; ngon(c, 8, 5.2, 0); c.fill(); c.strokeStyle = '#141a1b'; c.lineWidth = .8; c.stroke(); c.fillStyle = '#e0b030'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.fillRect(Math.cos(a) * 3.3 - .9, Math.sin(a) * 3.3 - .9, 1.8, 1.8); } c.fillStyle = '#6fe3c8'; circ(c, 0, 0, 1.1); c.fill(); c.restore(); }
  else { c.fillStyle = '#0c0f10'; circ(c, 1.5, 0, 4.2); c.fill(); }
};
W_PAINT.carpet = (c, P, rec, t, m) => {
  let ld = 10;
  if (m && m.w) ld = time - (m.salvoT || -9) < 1.4 ? (m.left || 0) : Math.floor(10 * clamp(1 - m.cd * m.w.rate, 0, 1));
  c.fillStyle = P.body2; rr(c, -11, -8.4, 28.5, 16.8, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  aaHazard(c, -11, -8.4, 2.4, 16.8);
  c.fillStyle = P.plate; c.fillRect(-7.6, -.6, 23, 1.2);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
    const x = -5.5 + i * 5, y = j ? 3.7 : -3.7, idx = i * 2 + j;
    c.fillStyle = AA_D; circ(c, x, y, 2.3); c.fill();
    if (idx < ld) { c.fillStyle = '#7a4a2a'; circ(c, x, y, 1.5); c.fill(); c.fillStyle = '#ffa060'; circ(c, x, y, .7); c.fill(); }
  }
};
W_PAINT.cryobomb = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -9, -9, 18, 18, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = 'rgba(225,245,255,.4)'; for (const [x, y] of [[-9, -9], [-9, 9], [9, -9], [9, 9]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.sign(x) * 4.5, y); c.lineTo(x, y - Math.sign(y) * 4.5); c.closePath(); c.fill(); }
  c.fillStyle = AA_D; circ(c, 3, 0, 6.8); c.fill(); c.strokeStyle = P.plate; c.lineWidth = 1.3; circ(c, 3, 0, 5.2); c.stroke();
  c.fillStyle = '#eaf8ff'; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .2; c.beginPath(); c.moveTo(3 + Math.cos(a - .14) * 6.6, Math.sin(a - .14) * 6.6); c.lineTo(3 + Math.cos(a) * 8.6, Math.sin(a) * 8.6); c.lineTo(3 + Math.cos(a + .14) * 6.6, Math.sin(a + .14) * 6.6); c.fill(); }
  if (aaLoaded(m, .5)) { const g = c.createRadialGradient(3, 0, 0, 3, 0, 4); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#bfe8ff'); g.addColorStop(1, '#5a9ac8'); c.fillStyle = g; circ(c, 3, 0, 3.8); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = .6; ngon(c, 6, 2.2, t * .5, 3, 0); c.stroke(); }
};
W_PAINT.gravwell = (c, P, rec, t, m) => {
  c.fillStyle = AA_D; rr(c, 3, -3.6, 21, 7.2, 1.5); c.fill();
  for (let k = 0; k < 3; k++) { const x = 7 + k * 5; c.fillStyle = '#3e3258'; rr(c, x, -5.2, 2.6, 10.4, 1); c.fill(); c.fillStyle = `rgba(185,160,255,${(.35 + .4 * (.5 + .5 * Math.sin(t * 6 - k))).toFixed(2)})`; c.fillRect(x + .7, -4.6, 1.2, 9.2); }
  c.fillStyle = P.body2; circ(c, -1, 0, 8.6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = P.plate; circ(c, -2, 0, 3.8); c.fill();
  const g = c.createRadialGradient(25.5, 0, 0, 25.5, 0, 6); g.addColorStop(0, 'rgba(185,160,255,0)'); g.addColorStop(.5, 'rgba(185,160,255,.4)'); g.addColorStop(1, 'rgba(185,160,255,0)'); c.fillStyle = g; circ(c, 25.5, 0, 6); c.fill();
  c.fillStyle = '#05030a'; circ(c, 25.5, 0, 2.6); c.fill(); c.strokeStyle = '#d8c8ff'; c.lineWidth = .6; circ(c, 25.5, 0, 2.6); c.stroke();
  c.fillStyle = '#e0d4ff'; for (let k = 0; k < 3; k++) { const a = t * 4 + k * TAU / 3; circ(c, 25.5 + Math.cos(a) * 4.4, Math.sin(a) * 4.4, .8); c.fill(); }
};
W_PAINT.lightrod = (c, P, rec, t, m) => {
  c.fillStyle = P.body2; rr(c, -9, -7.6, 18, 15.2, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = AA_D; c.fillRect(1, -2.4, 23, 4.8);
  c.lineCap = 'round';
  for (const s of [-1, 1]) { c.strokeStyle = '#7a848a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-7, s * 5.2); c.lineTo(6, s * 5.2); c.stroke(); c.fillStyle = '#c18a52'; c.fillRect(-1, s * 5.2 - .8, 1.2, 1.6); }
  if (aaLoaded(m, .6)) {
    c.strokeStyle = '#b8c4cc'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-5, 0); c.lineTo(22, 0); c.stroke();
    c.fillStyle = '#c18a52'; c.fillRect(6, -1.4, 1.6, 2.8); c.fillRect(14, -1.4, 1.6, 2.8);
    const p = .5 + .5 * Math.sin(t * 10), g = c.createRadialGradient(23, 0, 0, 23, 0, 4.5); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, `rgba(200,230,255,${(.5 + .4 * p).toFixed(2)})`); g.addColorStop(1, 'rgba(160,210,255,0)'); c.fillStyle = g; circ(c, 23, 0, 4.5); c.fill();
    if (Math.random() < .25) { c.strokeStyle = '#e8f4ff'; c.lineWidth = .5; c.beginPath(); c.moveTo(23, 0); c.lineTo(23 + rnd(-4, 4), rnd(-4, 4)); c.stroke(); }
  }
  c.lineCap = 'butt';
};
W_PAINT.borer = (c, P, rec, t, m) => {
  c.fillStyle = AA_D; rr(c, 3, -4.6, 15.5, 9.2, 2); c.fill();
  c.fillStyle = '#4a443a'; for (const x of [6, 9.5, 13]) c.fillRect(x, -5, 1.3, 10);
  c.fillStyle = P.body; circ(c, -1, 0, 8.6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = P.plate; circ(c, -2, 0, 4); c.fill(); c.fillStyle = '#e0b030'; c.fillRect(-3, -.7, 2, 1.4);
  if (aaLoaded(m, .5)) aaDrillCone(c, 18, 9, 4.3, t * 1.5);
  else { c.fillStyle = '#0c0f10'; c.fillRect(16.5, -3.4, 2, 6.8); }
};
W_PAINT.hammer = (c, P, rec, t, m) => {
  const p = m && m.hamT !== undefined ? time - m.hamT : 9, R0 = 15, RF = m ? clamp(m.hamR || 24, 18, 38) : 24;
  let ext = R0, k = 1;
  if (p < .2) { const q = p / .2; ext = R0 - 3.5 * q; k = 1 + .38 * q; } // le marteau se lève (il grossit : il monte vers nous)
  else if (p < .3) { const q = (p - .2) / .1; ext = lerp(R0 - 3.5, RF, q * q); k = lerp(1.38, .9, q); } // il s'abat
  else if (p < .8) { const q = (p - .3) / .5; ext = lerp(RF, R0, q); k = lerp(.9, 1, q); } // retour
  c.fillStyle = P.plate; rr(c, 1, -4.6, 8, 2.8, 1); c.fill(); rr(c, 1, 1.8, 8, 2.8, 1); c.fill();
  c.lineCap = 'round'; c.strokeStyle = AA_D; c.lineWidth = 2.3; c.beginPath(); c.moveTo(3, -3.2); c.lineTo(ext - 3, -2.6); c.moveTo(3, 3.2); c.lineTo(ext - 3, 2.6); c.stroke();
  c.strokeStyle = '#a8b0aa'; c.lineWidth = .8; c.stroke(); c.lineCap = 'butt';
  c.fillStyle = P.body2; circ(c, -1.5, 0, 8.4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = P.plate; circ(c, -1.5, 0, 3.6); c.fill(); c.fillStyle = P.acc; c.fillRect(-2.5, -.8, 2, 1.6);
  c.save(); c.translate(ext, 0);
  if (k > 1.02) { c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, -4 + (k - 1) * 10, -7 + (k - 1) * 12, 9, 14, 2); c.fill(); }
  c.scale(k, k);
  c.fillStyle = '#464c4e'; rr(c, -4, -7, 9, 14, 2); c.fill(); c.strokeStyle = AA_D; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#6a7072'; rr(c, -2.6, -5.6, 5, 11.2, 1.2); c.fill();
  aaHazard(c, 3.4, -7, 1.6, 14);
  c.restore();
  if (p >= .2 && p < .36) { c.fillStyle = `rgba(255,242,200,${((.36 - p) * 5).toFixed(2)})`; circ(c, RF + 6, 0, 7); c.fill(); }
};
