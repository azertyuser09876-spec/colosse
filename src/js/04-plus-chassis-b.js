// 3.1 : seize châssis des rangs 6, 7 et 8 (Colosses et géants) : données, affûts, peintres procéduraux et recherches.
// Rang 6 : un Cœur de Colosse, forge niveau 5. Rangs 7 et 8 : géants du Chantier titanesque (niveaux 1 et 2), deux et trois Cœurs.
// Les perks (ram, slowaura, shield, flak, rebirth, aura, rage, stomp, siege, magnet) et la fabrique sont gérés ailleurs.
(() => {
  // prérequis venus des châssis des rangs 1 à 5 (fichier chassis-a) : repli sur un châssis existant si ce fichier est absent (page d'essai)
  const rq = (id, alt) => RESEARCH_BY_ID[id] ? id : alt;

  // ================= DONNÉES =================
  Object.assign(CHASSIS, {
    // ---- rang 6
    terrassier: { n: TL('TERRASSIER'), tier: 6, hp: 13000, r: 140, spd: 66, slots: 5, wsize: 4, cargo: 140, cmd: 14, crush: 5, armor: .5, perk: 'ram', cost: { scrap: 1650, alloy: 460, circuits: 180, crystals: 160, cores: 10, heart: 1 }, d: TL('Bulldozer géant : sa lame rase le décor et il charge tout ce qui se trouve devant lui.') },
    kraken: { n: TL('KRAKEN'), tier: 6, hp: 10500, r: 135, spd: 80, slots: 6, wsize: 4, cargo: 100, cmd: 14, crush: 4, armor: .4, perk: 'slowaura', cost: { scrap: 1450, alloy: 360, circuits: 220, crystals: 280, cores: 10, heart: 1 }, d: TL('Pieuvre de siège : huit tentacules qui rampent partout, et un champ qui englue les ennemis proches.') },
    sphinx: { n: TL('SPHINX'), tier: 6, hp: 12500, r: 140, spd: 70, slots: 5, wsize: 4, cargo: 120, cmd: 14, crush: 4, armor: .45, perk: 'shield', cost: { scrap: 1550, alloy: 400, circuits: 230, crystals: 260, cores: 11, heart: 1 }, d: TL('Grand félin cuirassé : deux affûts titanesques et un bouclier qui se recharge hors combat.') },
    galion: { n: TL('GALION'), tier: 6, hp: 9500, r: 135, spd: 75, slots: 8, wsize: 4, cargo: 160, cmd: 15, fly: true, armor: .35, perk: 'flak', cost: { scrap: 1450, alloy: 400, circuits: 320, crystals: 240, cores: 11, heart: 1 }, d: TL('Galion volant : huit affûts en bordée, et des tourelles qui abattent les missiles.') },
    phenix: { n: TL('PHÉNIX'), tier: 6, hp: 7500, r: 120, spd: 110, slots: 5, wsize: 4, cargo: 60, cmd: 13, fly: true, armor: .3, perk: 'rebirth', cost: { scrap: 1250, alloy: 300, circuits: 300, crystals: 320, cores: 12, heart: 1 }, d: TL('Oiseau de feu rapide : quand il tombe, il renaît une fois de ses cendres.') },
    hospitalier: { n: TL('HOSPITALIER'), tier: 6, hp: 11000, r: 140, spd: 68, slots: 4, wsize: 4, cargo: 200, cmd: 14, crush: 4, armor: .4, perk: 'aura', fab: { tier: 3, cap: 3, t: 22 }, cost: { scrap: 1500, alloy: 380, circuits: 260, crystals: 260, cores: 10, heart: 1 }, d: TL('Hôpital chenillé : il répare les alliés autour de lui et assemble des robots jusqu\'au rang 3.') },
    // ---- rang 7
    bastille: { n: TL('BASTILLE'), tier: 7, hp: 40000, r: 265, spd: 50, slots: 8, wsize: 5, cargo: 380, cmd: 20, crush: 5, armor: .55, perk: 'flak', cost: { scrap: 4400, alloy: 1450, circuits: 620, crystals: 500, cores: 24, heart: 2 }, d: TL('Forteresse étoilée sur chenilles : huit affûts dont deux colossaux, et des tourelles qui abattent les missiles.') },
    tarasque: { n: TL('TARASQUE'), tier: 7, hp: 36000, r: 255, spd: 64, slots: 7, wsize: 5, cargo: 300, cmd: 19, crush: 5, armor: .5, perk: 'rage', cost: { scrap: 3900, alloy: 1300, circuits: 600, crystals: 620, cores: 23, heart: 2 }, d: TL('Dragon-tortue à six pattes : sa carapace encaisse, et il enrage quand il est blessé.') },
    golem: { n: TL('GOLEM'), tier: 7, hp: 42000, r: 250, spd: 58, slots: 6, wsize: 5, cargo: 260, cmd: 20, crush: 5, armor: .55, perk: 'stomp', cost: { scrap: 4300, alloy: 1400, circuits: 560, crystals: 640, cores: 24, heart: 2 }, d: TL('Colosse de pierre et d\'acier : chacun de ses pas étourdit les petits ennemis.') },
    manticore: { n: TL('MANTICORE'), tier: 7, hp: 30000, r: 245, spd: 80, slots: 7, wsize: 5, cargo: 220, cmd: 19, crush: 5, armor: .45, perk: 'siege', cost: { scrap: 3700, alloy: 1200, circuits: 720, crystals: 600, cores: 23, heart: 2 }, d: TL('Lion-scorpion : sa queue porte un affût colossal, et il gagne en portée quand il se cale.') },
    seraphin: { n: TL('SÉRAPHIN'), tier: 7, hp: 27000, r: 240, spd: 78, slots: 6, wsize: 5, cargo: 200, cmd: 19, fly: true, armor: .4, perk: 'aura', cost: { scrap: 3600, alloy: 1150, circuits: 900, crystals: 680, cores: 26, heart: 2 }, d: TL('Vaisseau angélique à six ailes : il répare les alliés autour de lui.') },
    baleine: { n: TL('BALEINE'), tier: 7, hp: 34000, r: 270, spd: 60, slots: 5, wsize: 5, cargo: 900, cmd: 19, fly: true, armor: .4, perk: 'magnet', cost: { scrap: 4000, alloy: 1250, circuits: 820, crystals: 480, cores: 24, heart: 2 }, d: TL('Baleine volante : une soute immense, et un aimant qui ramasse le butin au passage.') },
    // ---- rang 8
    vigie: { n: TL('VIGIE'), tier: 8, hp: 100000, r: 430, spd: 46, slots: 10, wsize: 5, cargo: 700, cmd: 31, crush: 6, sight: 2, armor: .6, perk: 'siege', cost: { scrap: 9400, alloy: 3300, circuits: 1700, crystals: 1100, cores: 50, heart: 3 }, d: TL('Citadelle-observatoire : dix affûts dont quatre colossaux, une vue immense, et plus de portée quand elle se cale.') },
    titanide: { n: TL('TITANIDE'), tier: 8, hp: 95000, r: 440, spd: 60, slots: 10, wsize: 5, cargo: 600, cmd: 31, crush: 6, armor: .55, perk: 'stomp', cost: { scrap: 9200, alloy: 3100, circuits: 1500, crystals: 1300, cores: 48, heart: 3 }, d: TL('Hexapode titanesque : dix affûts dont quatre colossaux, et des pas qui font trembler le sol.') },
    nebuleuse: { n: TL('NÉBULEUSE'), tier: 8, hp: 78000, r: 450, spd: 58, slots: 10, wsize: 5, cargo: 650, cmd: 30, fly: true, armor: .45, perk: 'slowaura', cost: { scrap: 8600, alloy: 2800, circuits: 2100, crystals: 1500, cores: 50, heart: 3 }, d: TL('Anneau de nacelles autour d\'un cœur de gaz : dix affûts dont quatre colossaux, et un champ qui englue les ennemis.') },
    caravanserail: { n: TL('CARAVANSÉRAIL'), tier: 8, hp: 105000, r: 460, spd: 44, slots: 8, wsize: 5, cargo: 2200, cmd: 31, crush: 6, armor: .55, perk: 'magnet', fab: { tier: 3, cap: 6, t: 16 }, cost: { scrap: 10400, alloy: 3500, circuits: 1700, crystals: 1100, cores: 52, heart: 3 }, d: TL('Ville-marché chenillée : une soute géante, un aimant à butin, et des ateliers qui assemblent des robots jusqu\'au rang 3.') },
  });

  // affûts (en rayons, nez vers +x) : les premiers sont les principaux, puis les paires gauche/droite de même taille
  Object.assign(MOUNTS, {
    terrassier: [[.3, 0], [-.06, -.46], [-.06, .46], [-.62, -.3], [-.62, .3]],
    kraken: [[.1, -.3], [.1, .3], [-.3, -.33], [-.3, .33], [-.64, -.2], [-.64, .2]],
    sphinx: [[.14, -.32], [.14, .32], [-.26, -.3], [-.26, .3], [-.58, 0]],
    galion: [[.24, -.25], [.24, .25], [-.22, -.27], [-.22, .27], [-.62, -.2], [-.62, .2], [.74, -.11], [.74, .11]],
    phenix: [[.3, 0], [-.06, -.3], [-.06, .3], [-.36, -.17], [-.36, .17]],
    hospitalier: [[.4, 0], [.04, -.44], [.04, .44], [-.24, 0]],
    bastille: [[.52, -.52], [.52, .52], [-.52, -.52], [-.52, .52], [0, -.4], [0, .4], [.26, -.19], [.26, .19]],
    tarasque: [[.22, -.28], [.22, .28], [-.16, -.36], [-.16, .36], [-.48, -.22], [-.48, .22], [.02, 0]],
    golem: [[.02, -.5], [.02, .5], [.16, -.22], [.16, .22], [-.3, -.24], [-.3, .24]],
    manticore: [[-.1, 0], [.3, -.26], [.3, .26], [-.32, -.3], [-.32, .3], [-.6, -.18], [-.6, .18]],
    seraphin: [[.22, -.2], [.22, .2], [-.14, -.22], [-.14, .22], [-.44, -.14], [-.44, .14]],
    baleine: [[.42, 0], [.04, -.22], [.04, .22], [-.38, -.17], [-.38, .17]],
    vigie: [[.46, -.24], [.46, .24], [.14, -.54], [.14, .54], [-.26, -.5], [-.26, .5], [-.48, -.22], [-.48, .22], [.7, -.2], [.7, .2]],
    titanide: [[.34, -.36], [.34, .36], [0, -.3], [0, .3], [-.3, -.32], [-.3, .32], [-.56, -.18], [-.56, .18], [.6, -.17], [.6, .17]],
    nebuleuse: [[.6, -.25], [.6, .25], [.25, -.6], [.25, .6], [-.25, -.6], [-.25, .6], [-.6, -.25], [-.6, .25], [0, -.37], [0, .37]],
    caravanserail: [[.72, -.58], [.72, .58], [-.72, -.58], [-.72, .58], [0, -.62], [0, .62], [-.84, -.22], [-.84, .22]],
  });
  Object.assign(SLOT_LAYOUT, {
    terrassier: [4, 3, 3, 2, 2], kraken: [4, 4, 3, 3, 3, 3], sphinx: [4, 4, 3, 3, 2], galion: [4, 4, 3, 3, 3, 3, 2, 2], phenix: [4, 3, 3, 2, 2], hospitalier: [4, 3, 3, 2],
    bastille: [5, 5, 4, 4, 4, 4, 3, 3], tarasque: [5, 5, 4, 4, 3, 3, 3], golem: [5, 5, 4, 4, 4, 4], manticore: [5, 5, 5, 4, 4, 3, 3], seraphin: [5, 5, 4, 4, 3, 3], baleine: [5, 4, 4, 3, 3],
    vigie: [5, 5, 5, 5, 4, 4, 4, 4, 3, 3], titanide: [5, 5, 5, 5, 4, 4, 4, 4, 4, 4], nebuleuse: [5, 5, 5, 5, 4, 4, 4, 4, 3, 3], caravanserail: [5, 5, 4, 4, 4, 4, 3, 3],
  });
  Object.assign(MSCALE, { terrassier: 3.3, kraken: 3.2, sphinx: 3.3, galion: 3.2, phenix: 3.2, hospitalier: 3.3, bastille: 4.4, tarasque: 4.2, golem: 4.3, manticore: 4.1, seraphin: 4, baleine: 4.2, vigie: 6.2, titanide: 6, nebuleuse: 5.9, caravanserail: 6.1 });
  Object.assign(PREV_EXT, { terrassier: 1.18, kraken: 1.45, sphinx: 1.18, galion: 1.25, phenix: 1.5, hospitalier: 1.1, bastille: 1.12, tarasque: 1.3, golem: 1.15, manticore: 1.3, seraphin: 1.35, baleine: 1.25, vigie: 1.12, titanide: 1.3, nebuleuse: 1.1, caravanserail: 1.08 });

  // ================= RECHERCHES =================
  const C6 = TL('Châssis'), L = 5;
  addResearch({ id: 'c_terrassier', cat: C6, lab: L, n: TL('Châssis Terrassier'), req: rq('c_donjon', 'c_goliath'), cost: { data: 135, alloy: 220, cores: 4 }, d: TL('Rang 6. Bulldozer géant qui charge. Exige un Cœur de Colosse.'), fam: 'chenille' });
  addResearch({ id: 'c_kraken', cat: C6, lab: L, n: TL('Châssis Kraken'), req: rq('c_chimere', 'c_hydre'), cost: { data: 140, crystals: 210, cores: 4 }, d: TL('Rang 6. Pieuvre de siège qui englue l\'ennemi. Exige un Cœur de Colosse.'), fam: 'marcheur' });
  addResearch({ id: 'c_sphinx', cat: C6, lab: L, n: TL('Châssis Sphinx'), req: rq('c_minotaure', 'c_titan'), cost: { data: 140, alloy: 210, cores: 4 }, d: TL('Rang 6. Grand félin à bouclier. Exige un Cœur de Colosse.'), fam: 'marcheur' });
  addResearch({ id: 'c_galion', cat: C6, lab: L, n: TL('Châssis Galion'), req: rq('c_condor', 'c_wyverne'), cost: { data: 140, circuits: 215, cores: 4 }, d: TL('Rang 6. Galion volant à huit affûts. Exige un Cœur de Colosse.'), fam: 'volant' });
  addResearch({ id: 'c_phenix', cat: C6, lab: L, n: TL('Châssis Phénix'), req: 'c_wyverne', cost: { data: 145, crystals: 220, cores: 4 }, d: TL('Rang 6. Oiseau de feu qui renaît une fois. Exige un Cœur de Colosse.'), fam: 'volant' });
  addResearch({ id: 'c_hospitalier', cat: C6, lab: L, n: TL('Châssis Hospitalier'), req: rq('c_fourgon', 'c_mule'), cost: { data: 130, circuits: 200, cores: 4 }, d: TL('Rang 6. Hôpital chenillé qui répare et fabrique. Exige un Cœur de Colosse.'), fam: 'transport' });
  addResearch({ id: 'c_bastille', cat: C6, lab: L, n: TL('Géante Bastille'), req: 'c_terrassier', ...SHIP(1), cost: { data: 330, alloy: 600, cores: 9 }, d: TL('Rang 7. Forteresse étoilée sur chenilles. Exige le Chantier titanesque et deux Cœurs de Colosse.'), fam: 'chenille' });
  addResearch({ id: 'c_tarasque', cat: C6, lab: L, n: TL('Géante Tarasque'), req: 'c_kraken', ...SHIP(1), cost: { data: 310, crystals: 540, cores: 9 }, d: TL('Rang 7. Dragon-tortue à six pattes. Exige le Chantier titanesque et deux Cœurs de Colosse.'), fam: 'marcheur' });
  addResearch({ id: 'c_golem', cat: C6, lab: L, n: TL('Géant Golem'), req: 'c_sphinx', ...SHIP(1), cost: { data: 320, alloy: 580, cores: 9 }, d: TL('Rang 7. Colosse de pierre et d\'acier. Exige le Chantier titanesque et deux Cœurs de Colosse.'), fam: 'marcheur' });
  addResearch({ id: 'c_manticore', cat: C6, lab: L, n: TL('Géante Manticore'), req: 'c_behemoth', ...SHIP(1), cost: { data: 330, crystals: 560, cores: 9 }, d: TL('Rang 7. Lion-scorpion à queue armée. Exige le Chantier titanesque et deux Cœurs de Colosse.'), fam: 'marcheur' });
  addResearch({ id: 'c_seraphin', cat: C6, lab: L, n: TL('Géant Séraphin'), req: 'c_phenix', ...SHIP(1), cost: { data: 340, circuits: 600, cores: 9 }, d: TL('Rang 7. Vaisseau angélique qui répare. Exige le Chantier titanesque et deux Cœurs de Colosse.'), fam: 'volant' });
  addResearch({ id: 'c_baleine', cat: C6, lab: L, n: TL('Géante Baleine'), req: 'c_mammouth', ...SHIP(1), cost: { data: 300, circuits: 520, cores: 9 }, d: TL('Rang 7. Baleine volante à soute immense. Exige le Chantier titanesque et deux Cœurs de Colosse.'), fam: 'transport' });
  addResearch({ id: 'c_vigie', cat: C6, lab: L, n: TL('Géante Vigie'), req: 'c_bastille', ...SHIP(2), cost: { data: 660, alloy: 1250, cores: 19 }, d: TL('Rang 8. Citadelle-observatoire. Exige le Chantier titanesque niveau 2 et trois Cœurs de Colosse.'), fam: 'chenille' });
  addResearch({ id: 'c_titanide', cat: C6, lab: L, n: TL('Géante Titanide'), req: 'c_golem', ...SHIP(2), cost: { data: 680, alloy: 1300, cores: 19 }, d: TL('Rang 8. Hexapode titanesque. Exige le Chantier titanesque niveau 2 et trois Cœurs de Colosse.'), fam: 'marcheur' });
  addResearch({ id: 'c_nebuleuse', cat: C6, lab: L, n: TL('Géante Nébuleuse'), req: 'c_seraphin', ...SHIP(2), cost: { data: 670, circuits: 1300, cores: 19 }, d: TL('Rang 8. Anneau volant autour d\'un cœur de gaz. Exige le Chantier titanesque niveau 2 et trois Cœurs de Colosse.'), fam: 'volant' });
  addResearch({ id: 'c_caravanserail', cat: C6, lab: L, n: TL('Géant Caravansérail'), req: 'c_baleine', ...SHIP(2), cost: { data: 640, alloy: 1200, cores: 19 }, d: TL('Rang 8. Ville-marché qui fabrique des robots. Exige le Chantier titanesque niveau 2 et trois Cœurs de Colosse.'), fam: 'transport' });

  // ================= OUTILS DE DESSIN =================
  // taille d'un rayon à l'écran (la forge et le raid n'ont pas la même échelle) : sert à doser le détail
  const scr = (c, r) => { const m = c.getTransform(); return r * Math.hypot(m.a, m.b); };
  const HZ = ['#e0b030', '#1e1c18'];
  // bandes de danger jaunes et noires dans le chemin courant (à appeler juste après l'avoir tracé)
  function hazard(c, x0, y0, x1, y1, n) { c.save(); c.clip(); const w = (x1 - x0), h = (y1 - y0), s = Math.max(Math.abs(w), Math.abs(h)) / n; c.fillStyle = HZ[1]; c.fillRect(x0, y0, w, h); c.fillStyle = HZ[0]; c.beginPath(); for (let k = -2 * Math.ceil(n / 2); k < n * 2; k += 2) { c.moveTo(x0 + k * s, y0); c.lineTo(x0 + k * s + s, y0); c.lineTo(x0 + k * s + s - h, y1); c.lineTo(x0 + k * s - h, y1); c.closePath(); } c.fill(); c.restore(); }
  // membre effilé le long d'une polyligne (tableau plat x0,y0,x1,y1…) : contour fermé dans le chemin courant
  const TA = new Float64Array(64), TB = new Float64Array(64);
  function tube(c, p, n, w0, w1) {
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); let dx = p[b * 2] - p[a * 2], dy = p[b * 2 + 1] - p[a * 2 + 1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = (w0 + (w1 - w0) * i / (n - 1)) * .5; TA[i * 2] = p[i * 2] - dy * w; TA[i * 2 + 1] = p[i * 2 + 1] + dx * w; TB[i * 2] = p[i * 2] + dy * w; TB[i * 2 + 1] = p[i * 2 + 1] - dx * w;
    }
    c.beginPath(); c.moveTo(TA[0], TA[1]); for (let i = 1; i < n; i++) c.lineTo(TA[i * 2], TA[i * 2 + 1]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(TB[i * 2], TB[i * 2 + 1]); c.closePath();
  }
  // membre effilé plein, liseré sombre en sous-couche (bien moins coûteux qu'un contour tracé)
  function limb(c, p, n, w0, w1, col, dark, e) { tube(c, p, n, w0 + e, w1 + e); c.fillStyle = dark; c.fill(); tube(c, p, n, w0, w1); c.fillStyle = col; c.fill(); }
  // point d'une courbe de Bézier quadratique
  const qb = (a, b, d, s) => (1 - s) * (1 - s) * a + 2 * (1 - s) * s * b + s * s * d;
  const PT = new Float64Array(64);
  // lueur ronde (couleur fixe ou palette) ; a : opacité au centre
  function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col + a + ')'); g.addColorStop(1, col + '0)'); c.fillStyle = g; circ(c, x, y, r); c.fill(); }
  // ombre portée d'un élément qui domine le corps (tour, queue dressée)
  const SH = 'rgba(0,0,0,.22)';
  const life = u => !!(u && u.x !== undefined && !u.dead);
  // un pied resté planté trop loin (pas forcé) est ramené à portée de jambe, pour ne pas étirer le membre
  function reach(g, L) { const dx = g.fx - g.hx, dy = g.fy - g.hy, d = Math.hypot(dx, dy); if (d > L) { g.fx = g.hx + dx / d * L; g.fy = g.hy + dy / d * L; } return g; }

  // ================= PEINTRES =================

  // ---------- TERRASSIER : bulldozer géant ----------
  CH_PAINT.terrassier = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 60, md = Z > 24;
    for (const [tx, ty] of [[.36, -.78], [.36, .78], [-.5, -.78], [-.5, .78]]) treads(c, tx * R - R * .38, ty * R - R * .17, R * .76, R * .34, P, t, R * .9);
    c.fillStyle = P.body2; for (const s of [-1, 1]) for (const tx of [.36, -.5]) { rr(c, tx * R - R * .36, s * R * .62 - R * .05, R * .72, R * .1, R * .03); c.fill(); }
    // défonceuse arrière : trois dents
    c.fillStyle = P.dark; rr(c, -R * .97, -R * .3, R * .08, R * .6, R * .02); c.fill();
    c.fillStyle = P.plate; c.beginPath(); for (const y of [-.22, 0, .22]) { c.moveTo(-R * .95, y * R - R * .05); c.lineTo(-R * 1.08, y * R); c.lineTo(-R * .95, y * R + R * .05); } c.fill();
    // coque
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .66, -R * .5); c.lineTo(R * .66, R * .5); c.lineTo(R * .56, R * .62); c.lineTo(-R * .78, R * .62); c.lineTo(-R * .9, R * .5); c.lineTo(-R * .9, -R * .5); c.lineTo(-R * .78, -R * .62); c.lineTo(R * .56, -R * .62); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.2; c.stroke();
    c.fillStyle = P.body; rr(c, -R * .44, -R * .54, R * 1.04, R * 1.08, R * .06); c.fill();
    // compartiment moteur : grilles, deux cheminées qui fument
    c.fillStyle = P.dark; rr(c, -R * .86, -R * .46, R * .38, R * .92, R * .04); c.fill();
    if (md) { c.strokeStyle = P.body2; c.lineWidth = lw * 1.4; c.beginPath(); for (let k = 0; k < 7; k++) { const x = -R * .82 + k * R * .05; c.moveTo(x, -R * .4); c.lineTo(x, R * .4); } c.stroke(); }
    for (const s of [-1, 1]) {
      c.fillStyle = P.body2; circ(c, -R * .4, s * R * .52, R * .065); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
      c.fillStyle = '#16120e'; circ(c, -R * .4, s * R * .52, R * .04); c.fill();
      if (md) for (let k = 0; k < 3; k++) { const f = (t * .7 + k / 3) % 1, a = (1 - f) * (.12 + .2 * mv); c.fillStyle = `rgba(78,72,64,${a.toFixed(3)})`; circ(c, -R * (.42 + f * .55), s * R * (.52 + f * .12), R * (.04 + f * .11)); c.fill(); }
    }
    // bras de poussée et vérins de levage
    const bo = (Math.sin(t * 1.6) * .5 + .5) * R * .025;
    for (const s of [-1, 1]) {
      c.strokeStyle = P.dark; c.lineWidth = R * .085; c.beginPath(); c.moveTo(-R * .02, s * R * .74); c.lineTo(R * .83 + bo, s * R * .86); c.stroke();
      c.strokeStyle = P.plate; c.lineWidth = R * .03; c.stroke();
      c.strokeStyle = P.body2; c.lineWidth = R * .075; c.beginPath(); c.moveTo(R * .5, s * R * .3); c.lineTo(R * .66, s * R * .34); c.stroke();
      c.strokeStyle = P.plate; c.lineWidth = R * .035; c.beginPath(); c.moveTo(R * .62, s * R * .33); c.lineTo(R * .84 + bo, s * R * .38); c.stroke();
      c.fillStyle = P.dark; circ(c, -R * .02, s * R * .74, R * .045); c.fill(); circ(c, R * .5, s * R * .3, R * .04); c.fill();
    }
    // lame incurvée
    const bx = bo, fy = 1.07;
    c.fillStyle = P.body; c.beginPath(); c.moveTo(R * .8 + bx, -R * 1.02); c.quadraticCurveTo(R * .92 + bx, 0, R * .8 + bx, R * 1.02); c.lineTo(R * .97 + bx, R * fy); c.quadraticCurveTo(R * 1.09 + bx, 0, R * .97 + bx, -R * fy); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.2; c.stroke();
    if (md) {
      c.beginPath(); c.moveTo(R * .8 + bx, -R * 1.02); c.quadraticCurveTo(R * .92 + bx, 0, R * .8 + bx, R * 1.02); c.lineTo(R * .845 + bx, R * 1.03); c.quadraticCurveTo(R * .965 + bx, 0, R * .845 + bx, -R * 1.03); c.closePath(); hazard(c, R * .78, -R * 1.1, R * 1, R * 1.1, 26);
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 1.6; c.beginPath(); for (let k = 1; k < 8; k++) { const s = k / 8, y = (2 * s - 1); c.moveTo(qb(.845, .965, .845, s) * R + bx, y * 1.03 * R); c.lineTo(qb(.97, 1.09, .97, s) * R + bx - R * .03, y * fy * R); } c.stroke();
    }
    c.strokeStyle = P.plate; c.lineWidth = lw * 3; c.beginPath(); c.moveTo(R * .97 + bx, -R * fy); c.quadraticCurveTo(R * 1.09 + bx, 0, R * .97 + bx, R * fy); c.stroke();
    // terre raclée qui s'accumule devant la lame (elle roule vers les côtés en marche)
    const D = u && u.x !== undefined ? (u._dirt = lerp(u._dirt || 0, mv, .03)) : .6;
    if (D > .05) {
      const col = ['#5e4a33', '#6e5739', '#4d3c2a', '#7d6546'];
      c.fillStyle = '#54422e'; c.beginPath(); for (let i = 0; i <= 10; i++) { const s = i / 10; c.lineTo(qb(.97, 1.09, .97, s) * R + bx - R * .01, (2 * s - 1) * fy * R * .97); } for (let i = 10; i >= 0; i--) { const s = i / 10, th = R * D * (.035 + .085 * Math.pow(Math.sin(Math.PI * s), .7)); c.lineTo(qb(.97, 1.09, .97, s) * R + bx + th + Math.sin(i * 2.1 + t * mv) * R * .008, (2 * s - 1) * fy * R * .97); } c.closePath(); c.fill();
      for (let q = 0; q < 4; q++) { c.fillStyle = col[q]; c.beginPath(); for (let k = q; k < 13; k += 4) {
        const h = hash2(k, 3, 17), y = ((k + .5) / 13 * 2 - 1) * .96, s = (y / fy + 1) / 2, x = qb(.97, 1.09, .97, s) + .02 + h * .04;
        const rad = R * (.05 + h * .05) * D * (1.1 - Math.abs(y) * .45), roll = Math.sin(t * 3 + k) * R * .01 * mv, X = x * R + bx + rad * .4, Y = y * R + roll;
        c.moveTo(X + rad, Y); c.arc(X, Y, rad, 0, TAU); } c.fill(); }
      if (md) { c.fillStyle = col[2]; c.beginPath(); for (let k = 0; k < 6; k++) { const f = (t * .9 * (.4 + mv) + k / 6) % 1, sg = k & 1 ? 1 : -1, X = R * (1.0 + f * .08) + bx, Y = sg * R * (.9 + f * .25), rad = R * .025 * D * (1 - f * .5); c.moveTo(X + rad, Y); c.arc(X, Y, rad, 0, TAU); } c.fill(); }
    }
    // cabine haute : arceau, vitres, gyrophare
    c.fillStyle = SH; rr(c, -R * .44, -R * .17, R * .38, R * .42, R * .05); c.fill();
    c.fillStyle = P.plate; rr(c, -R * .5, -R * .21, R * .38, R * .42, R * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.body2; rr(c, -R * .44, -R * .15, R * .22, R * .3, R * .03); c.fill();
    c.fillStyle = 'rgba(160,210,220,.4)'; c.fillRect(-R * .19, -R * .18, R * .05, R * .36); c.fillRect(-R * .46, -R * .2, R * .26, R * .03); c.fillRect(-R * .46, R * .17, R * .26, R * .03);
    c.fillStyle = P.dark; for (const [x, y] of [[-.48, -.19], [-.48, .19], [-.15, -.19], [-.15, .19]]) { circ(c, x * R, y * R, R * .025); c.fill(); }
    if (md && on) { const bl = (Math.sin(t * 7) + 1) / 2; c.fillStyle = `rgba(255,176,48,${(.45 + bl * .55).toFixed(2)})`; circ(c, -R * .4, 0, R * .03); c.fill(); if (hi) glow(c, -R * .4, 0, R * .1, 'rgba(255,176,48,', (.25 * bl).toFixed(2)); for (const s of [-1, 1]) glow(c, -R * .1, s * R * .13, R * .07, 'rgba(255,236,180,', .5); }
    c.fillStyle = P.plate; ngon(c, 8, R * .11, Math.PI / 8, R * .06, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
    glowCore(c, R * .06, 0, R * .09, P, t);
  };

  // ---------- KRAKEN : pieuvre de siège à huit tentacules ----------
  const KR_L = [], KR_G = [];
  for (let k = 0; k < 8; k++) { const s = k < 4 ? -1 : 1, i = k % 4, th = [.36, .98, 1.62, 2.3][i] * s; KR_L.push([.2 + Math.cos(th) * .26, Math.sin(th) * .26, .12 + Math.cos(th) * 1.16, Math.sin(th) * 1.1]); KR_G.push((i + (s > 0 ? 1 : 0)) % 2); }
  CH_PAINT.kraken = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 60, md = Z > 24;
    const G = gait(u, KR_L, R, t, mv, { groups: KR_G, stride: .32, dur: .38, f: 3.2, amp: .2, thud: giantThud });
    // nageoires de la pointe du manteau
    const fl = Math.sin(t * 2.2) * .08;
    c.fillStyle = P.body2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-R * .8, s * R * .1); c.quadraticCurveTo(-R * 1.0, s * R * (.42 + fl), -R * 1.08, s * R * (.34 + fl)); c.quadraticCurveTo(-R * 1.06, s * R * .1, -R * .96, 0); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke(); }
    // tentacules : courbe de la base au bout planté, effilée, segmentée, ventouses lumineuses
    const N = 9;
    for (let k = 0; k < 8; k++) {
      const g = G[k], hx = g.hx, hy = g.hy, fx = g.fx, fy = g.fy, dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 1;
      let nx = -dy / d, ny = dx / d; if (nx > 0) { nx = -nx; ny = -ny; }
      const bend = d * (.16 + Math.sin(t * 2.4 + k * 1.7) * (.08 + .1 * mv) + g.lift * .22), cx = (hx + fx) / 2 + nx * bend, cy = (hy + fy) / 2 + ny * bend;
      for (let i = 0; i < N - 1; i++) { const s = i / (N - 2); PT[i * 2] = qb(hx, cx, fx, s); PT[i * 2 + 1] = qb(hy, cy, fy, s); }
      // bout recourbé (plus quand il se lève)
      const ex = fx - PT[(N - 3) * 2], ey = fy - PT[(N - 3) * 2 + 1], el = Math.hypot(ex, ey) || 1, cu = R * (.05 + g.lift * .08);
      PT[(N - 1) * 2] = fx + ex / el * cu * .6 + nx * cu; PT[(N - 1) * 2 + 1] = fy + ey / el * cu * .6 + ny * cu;
      limb(c, PT, N, R * .17, R * .03, P.body, P.dark, lw * 3);
      if (md) {
        c.strokeStyle = P.plate; c.lineWidth = R * .022; c.beginPath(); c.moveTo(PT[0], PT[1]); for (let i = 1; i < N - 2; i++) c.lineTo(PT[i * 2], PT[i * 2 + 1]); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw; c.beginPath();
        for (let i = 1; i < N - 2; i += hi ? 1 : 2) { const w = R * (.17 + (.03 - .17) * i / (N - 1)) * .5, ax = PT[i * 2 + 2] - PT[i * 2 - 2], ay = PT[i * 2 + 3] - PT[i * 2 - 1], al = Math.hypot(ax, ay) || 1; c.moveTo(PT[i * 2] - ay / al * w, PT[i * 2 + 1] + ax / al * w); c.lineTo(PT[i * 2] + ay / al * w, PT[i * 2 + 1] - ax / al * w); } c.stroke();
        c.fillStyle = P.glow + (.35 + .45 * (.5 + .5 * Math.sin(t * 3 + k * 1.3))).toFixed(2) + ')'; c.beginPath(); for (let i = 2; i < N - 1; i++) { const w = R * (.17 + (.03 - .17) * i / (N - 1)) * .2; c.moveTo(PT[i * 2] + w, PT[i * 2 + 1]); c.arc(PT[i * 2], PT[i * 2 + 1], w, 0, TAU); } c.fill();
      }
    }
    // manteau bombé
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .42, 0, R * .56, R * .44, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.2; c.stroke();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(-R * .38, 0, R * .46, R * .34, 0, 0, TAU); c.fill();
    if (hi) {
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = lw * 1.3; for (const k of [.3, .6]) { c.beginPath(); c.ellipse(-R * .38, 0, R * .46 * k, R * .34 * k, 0, 0, TAU); c.stroke(); }
      c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.moveTo(-R * .38 + Math.cos(a) * R * .14, Math.sin(a) * R * .1); c.lineTo(-R * .38 + Math.cos(a) * R * .46, Math.sin(a) * R * .34); } c.stroke();
      c.fillStyle = P.plate; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(-R * .52, s * R * .2, R * .2, R * .06, s * .12, 0, TAU); c.fill(); }
    }
    c.strokeStyle = P.plate; c.lineWidth = R * .03; c.beginPath(); c.moveTo(-R * .9, 0); c.lineTo(-R * .12, 0); c.stroke();
    glowCore(c, -R * .5, 0, R * .12, P, t);
    // tête et grands yeux
    c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .2, 0, R * .34, R * .36, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(R * .14, 0, R * .2, R * .14, 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) {
      const ex = R * .42, ey = s * R * .19;
      c.fillStyle = P.dark; c.beginPath(); c.ellipse(ex, ey, R * .09, R * .075, s * .4, 0, TAU); c.fill();
      const g = c.createRadialGradient(ex, ey, 0, ex, ey, R * .08); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, P.glow + '.9)'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; circ(c, ex, ey, R * .08); c.fill();
      c.fillStyle = P.dark; c.fillRect(ex - R * .035, ey - R * .008, R * .07, R * .016);
    }
  };

  // ---------- SPHINX : grand félin couché qui marche, coiffe rayée, bouclier frontal ----------
  const SP_L = [[.3, -.25, .86, -.27], [.3, .25, .86, .27], [-.46, -.24, -.12, -.52], [-.46, .24, -.12, .52]];
  function paw(c, x, y, len, wd, lift, P, lw, md) {
    const k = 1 + lift * .22;
    if (lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, x - len * .5 + len * .2 * lift, y - wd * .5 + wd * .3 * lift, len, wd, wd * .45); c.fill(); }
    c.fillStyle = P.body2; rr(c, x - len * .5 * k, y - wd * .5 * k, len * k, wd * k, wd * .45 * k); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
    if (md) {
      c.fillStyle = P.body; c.beginPath(); for (let j = 0; j < 4; j++) { const X = x + len * .36 * k, Y = y + (j - 1.5) * wd * .23 * k, q = wd * .15 * k; c.moveTo(X + q, Y); c.arc(X, Y, q, 0, TAU); } c.fill();
      c.fillStyle = P.plate; c.beginPath(); for (let j = 0; j < 4; j++) { const yy = y + (j - 1.5) * wd * .23 * k, xx = x + len * .5 * k; c.moveTo(xx, yy - wd * .045); c.lineTo(xx + len * .13, yy); c.lineTo(xx, yy + wd * .045); } c.fill();
    }
  }
  CH_PAINT.sphinx = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), md = Z > 24;
    const G = gait(u, SP_L, R, t, mv, { groups: [0, 1, 1, 0], stride: .32, dur: .42, f: 3, amp: .2, thud: giantThud });
    // queue enroulée le long du flanc, houppe au bout
    const tw = Math.sin(t * 1.3) * .06;
    for (let i = 0; i < 7; i++) { const s = i / 6; PT[i * 2] = qb(-.72, -1.1, -.78, s) * R; PT[i * 2 + 1] = qb(0, .16, .56 + tw, s) * R; }
    tube(c, PT, 7, R * .11, R * .06); c.fillStyle = P.body2; c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(PT[12] + R * .04, PT[13] + R * .02, R * .08, R * .05, .6, 0, TAU); c.fill(); c.stroke(); c.fillStyle = P.acc; circ(c, PT[12], PT[13], R * .03); c.fill();
    // pattes épaisses : avant tendues de chaque côté de la tête, arrière repliées sous les hanches
    G.forEach((g, i) => {
      const fr = i < 2, L1 = R * (fr ? .36 : .3), L2 = R * (fr ? .35 : .27); reach(g, (L1 + L2) * 1.04); const [kx, ky] = knee(g.hx, g.hy, g.fx, g.fy, L1, L2, g.hy < 0 ? -1 : 1);
      PT[0] = g.hx; PT[1] = g.hy; PT[2] = kx; PT[3] = ky; PT[4] = g.fx; PT[5] = g.fy;
      limb(c, PT, 3, R * (fr ? .24 : .22), R * (fr ? .15 : .13), P.body, P.dark, lw * 3.4);
      if (md) { c.strokeStyle = P.plate; c.lineWidth = R * .03; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(kx, ky); c.stroke(); }
      paw(c, g.fx + R * (fr ? .04 : .02), g.fy, R * (fr ? .26 : .2), R * (fr ? .2 : .17), g.lift, P, lw, md);
    });
    // corps : hanches, torse, poitrail
    c.fillStyle = P.body; c.strokeStyle = P.dark; c.lineWidth = lw * 2;
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(-R * .48, s * R * .2, R * .3, R * .23, s * .15, 0, TAU); c.fill(); c.stroke(); }
    c.beginPath(); c.ellipse(-R * .1, 0, R * .62, R * .37, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(R * .26, 0, R * .3, R * .33, 0, 0, TAU); c.fill(); c.stroke();
    // échine cuirassée et côtes
    c.fillStyle = P.plate; for (let k = 0; k < 6; k++) { rr(c, -R * .66 + k * R * .14, -R * .09, R * .11, R * .18, R * .03); c.fill(); }
    if (md) { c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = lw * 1.2; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 5; k += 2) { const x = -R * .5 + k * R * .17; c.moveTo(x, s * R * .12); c.lineTo(x - R * .04, s * R * .31); } c.stroke(); }
    glowCore(c, -R * .1, 0, R * .1, P, t);
    // tête coiffée du némès : pans rayés sur les épaules, calotte rayée, bandeau, uræus
    const hx = R * .6;
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(hx + R * .04, s * R * .13); c.lineTo(hx - R * .08, s * R * .2); c.lineTo(hx - R * .28, s * R * .4); c.lineTo(hx - R * .42, s * R * .33); c.lineTo(hx - R * .24, s * R * .12); c.closePath();
      c.fillStyle = P.plate; c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
      if (md) { c.save(); c.clip(); c.strokeStyle = P.body2; c.lineWidth = R * .026; c.beginPath(); for (let k = 0; k < 8; k++) { const o = k * R * .06; c.moveTo(hx + R * .12 - o, s * R * .02); c.lineTo(hx - R * .1 - o, s * R * .46); } c.stroke(); c.restore(); }
    }
    c.fillStyle = P.body2; rr(c, hx - R * .48, -R * .05, R * .24, R * .1, R * .045); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(hx - R * .03, 0, R * .22, R * .2, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
    if (md) { c.save(); c.clip(); c.strokeStyle = P.body2; c.lineWidth = R * .024; c.beginPath(); for (let k = -4; k <= 4; k++) { c.moveTo(hx + R * .22, 0); c.lineTo(hx - R * .28, k * R * .07); } c.stroke(); c.restore(); }
    c.strokeStyle = P.acc; c.lineWidth = R * .034; c.beginPath(); c.arc(hx - R * .03, 0, R * .2, -.8, .8); c.stroke();
    // visage : museau, yeux lumineux
    c.fillStyle = P.body; c.beginPath(); c.ellipse(hx + R * .22, 0, R * .08, R * .1, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.2; c.stroke();
    c.fillStyle = P.dark; c.fillRect(hx + R * .26, -R * .008, R * .04, R * .016);
    for (const s of [-1, 1]) { c.fillStyle = P.glow + '.95)'; c.beginPath(); c.ellipse(hx + R * .17, s * R * .07, R * .03, R * .015, 0, 0, TAU); c.fill(); }
    const sh = u && u.shieldMax ? clamp(u.shield / u.shieldMax, 0, 1) : .6, pu = .5 + .5 * Math.sin(t * 2.6);
    c.fillStyle = P.acc; circ(c, hx + R * .16, 0, R * .03); c.fill(); if (md) glow(c, hx + R * .16, 0, R * .1, P.glow, (.3 + .4 * sh * pu).toFixed(2));
    // bouclier frontal : arc d'énergie devant les pattes
    if (sh > .02) {
      c.strokeStyle = P.glow + (.08 + .14 * sh).toFixed(2) + ')'; c.lineWidth = R * .07; c.beginPath(); c.arc(R * .12, 0, R * 1.0, -.6, .6); c.stroke();
      c.strokeStyle = P.glow + (.25 + .45 * sh * (.6 + .4 * pu)).toFixed(2) + ')'; c.lineWidth = lw * 2; c.stroke();
      if (md) { c.lineWidth = lw; c.beginPath(); for (let k = -3; k <= 3; k++) { const a = k * .16 + Math.sin(t * 2 + k) * .02; c.moveTo(R * .12 + Math.cos(a) * R * .96, Math.sin(a) * R * .96); c.lineTo(R * .12 + Math.cos(a) * R * 1.04, Math.sin(a) * R * 1.04); } c.stroke(); }
    }
  };
  // ---------- GALION : galion volant, voiles-panneaux solaires, sabords ----------
  function hullG(c, R, k) {
    c.beginPath(); c.moveTo(R * 1.0 * k, 0); c.quadraticCurveTo(R * .82 * k, -R * .42 * k, R * .3 * k, -R * .43 * k); c.lineTo(-R * .62 * k, -R * .4 * k); c.quadraticCurveTo(-R * .86 * k, -R * .38 * k, -R * .9 * k, -R * .3 * k);
    c.lineTo(-R * .9 * k, R * .3 * k); c.quadraticCurveTo(-R * .86 * k, R * .38 * k, -R * .62 * k, R * .4 * k); c.lineTo(R * .3 * k, R * .43 * k); c.quadraticCurveTo(R * .82 * k, R * .42 * k, R * 1.0 * k, 0); c.closePath();
  }
  CH_PAINT.galion = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 60, md = Z > 24;
    // nacelles de sustentation sous la coque
    for (const s of [-1, 1]) for (const x of [.42, -.08, -.56]) { c.fillStyle = P.dark; c.beginPath(); c.ellipse(x * R, s * R * .43, R * .1, R * .06, 0, 0, TAU); c.fill(); if (md) { c.fillStyle = P.glow + (.25 + .2 * Math.sin(t * 5 + x * 7)).toFixed(2) + ')'; c.beginPath(); c.ellipse(x * R, s * R * .47, R * .06, R * .03, 0, 0, TAU); c.fill(); } }
    // ailerons de stabilisation
    c.fillStyle = P.body2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-R * .62, s * R * .38); c.lineTo(-R * .92, s * R * .58); c.lineTo(-R * .86, s * R * .36); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke(); }
    // beaupré et foc
    c.strokeStyle = P.dark; c.lineWidth = R * .035; c.beginPath(); c.moveTo(R * .9, 0); c.lineTo(R * 1.24, 0); c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * 1.2, 0); c.quadraticCurveTo(R * 1.0, R * (.07 + Math.sin(t * 1.4) * .02), R * .78, 0); c.closePath(); c.fill();
    // coque : bordé extérieur, sabords, pont en lattes
    c.fillStyle = P.body2; hullG(c, R, 1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.4; c.stroke();
    if (md) { c.fillStyle = P.dark; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 10; k++) { const x = .56 - k * .135; c.rect(x * R - R * .03, s * R * .385 - R * .022, R * .06, R * .044); } c.fill(); c.fillStyle = P.glow + '.45)'; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 10; k += 2) { const x = .56 - k * .135; c.rect(x * R - R * .015, s * R * .385 - R * .01, R * .03, R * .02); } c.fill(); }
    c.fillStyle = P.body; hullG(c, R, .87); c.fill(); c.strokeStyle = P.plate; c.lineWidth = lw * 1.6; c.stroke();
    if (md) { c.save(); hullG(c, R, .86); c.clip(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = lw; c.beginPath(); for (let j = -3; j <= 3; j++) { c.moveTo(-R, j * R * .1); c.lineTo(R, j * R * .1); } c.stroke(); c.restore(); }
    // château arrière : fenêtres et fanaux
    c.fillStyle = P.plate; rr(c, -R * .88, -R * .3, R * .26, R * .6, R * .04); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
    c.fillStyle = P.body2; rr(c, -R * .84, -R * .24, R * .18, R * .48, R * .03); c.fill();
    c.fillStyle = 'rgba(255,214,140,.55)'; for (let k = -2; k <= 2; k++) c.fillRect(-R * .9, k * R * .1 - R * .025, R * .03, R * .05);
    if (on) for (const s of [-1, 1]) { glow(c, -R * .92, s * R * .3, R * .07, 'rgba(255,200,120,', (.55 + .2 * Math.sin(t * 3 + s)).toFixed(2)); }
    // gaillard d'avant
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * .92, 0); c.quadraticCurveTo(R * .8, -R * .28, R * .62, -R * .3); c.lineTo(R * .62, R * .3); c.quadraticCurveTo(R * .8, R * .28, R * .92, 0); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke();
    // propulseurs de poupe
    const fl = .6 + .4 * mv + .15 * Math.sin(t * 18);
    for (const s of [-1, 1]) { c.fillStyle = P.dark; rr(c, -R * .98, s * R * .12 - R * .05, R * .1, R * .1, R * .03); c.fill(); if (md && on) { const g = c.createLinearGradient(-R * .98, 0, -R * (1 + .22 * fl), 0); g.addColorStop(0, P.glow + '.85)'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-R * .98, s * R * .12 - R * .04); c.lineTo(-R * (1 + .22 * fl), s * R * .12); c.lineTo(-R * .98, s * R * .12 + R * .04); c.closePath(); c.fill(); } }
    glowCore(c, -R * .22, 0, R * .08, P, t);
    // mâts-antennes, vergues et voiles-panneaux solaires gonflées vers l'avant
    for (const [mx, hs] of [[.46, .5], [0, .6], [-.44, .52]]) {
      const bil = R * (.17 + .025 * Math.sin(t * 1.3 + mx * 4)), x = mx * R;
      if (hi) { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = lw * .8; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(x, 0); c.lineTo(x - .08 * R, s * R * .37); } c.stroke(); }
      c.fillStyle = SH; c.beginPath(); c.moveTo(x + R * .04, -hs * R + R * .05); c.quadraticCurveTo(x + bil * 2 + R * .04, R * .05, x + R * .04, hs * R + R * .05); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x, -hs * R); c.quadraticCurveTo(x + bil * 2, 0, x, hs * R); c.closePath();
      c.fillStyle = P.dark; c.fill(); c.strokeStyle = P.plate; c.lineWidth = lw * 1.6; c.stroke();
      if (md) {
        c.strokeStyle = P.glow + '.4)'; c.lineWidth = lw; c.beginPath();
        for (let k = -4; k <= 4; k += 2) { const y = k / 5 * hs * R, e = 1 - (k / 5) * (k / 5); c.moveTo(x + R * .01, y); c.lineTo(x + bil * e * .96, y); }
        if (hi) { c.moveTo(x + R * .01, -hs * R * .95); c.quadraticCurveTo(x + bil, 0, x + R * .01, hs * R * .95); } c.stroke();
        if (hi) { c.fillStyle = P.glow + (.12 + .1 * Math.sin(t * 2 + mx * 5)).toFixed(2) + ')'; c.beginPath(); c.moveTo(x, -hs * R * .5); c.quadraticCurveTo(x + bil * 1.5, -hs * R * .25, x + bil * .8, 0); c.lineTo(x, 0); c.closePath(); c.fill(); }
      }
      c.strokeStyle = P.dark; c.lineWidth = R * .03; c.beginPath(); c.moveTo(x, -(hs + .05) * R); c.lineTo(x, (hs + .05) * R); c.stroke();
      c.fillStyle = P.body2; circ(c, x, 0, R * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke();
      c.fillStyle = (Math.sin(t * 4 + mx * 9) > .3) ? P.acc : P.dark; circ(c, x, 0, R * .02); c.fill();
    }
    // flamme au grand mât
    c.fillStyle = P.acc; c.beginPath(); c.moveTo(0, -R * .015); c.quadraticCurveTo(-R * .12, Math.sin(t * 5) * R * .04, -R * .24, Math.sin(t * 5 - 1) * R * .03); c.quadraticCurveTo(-R * .12, Math.sin(t * 5) * R * .04 + R * .02, 0, R * .015); c.closePath(); c.fill();
  };

  // ---------- PHÉNIX : oiseau de feu mécanique, plumes-lames incandescentes, traînée de braises ----------
  const FIRE_ON = ['rgba(255,110,40,', 'rgba(255,190,90,', 'rgba(255,240,190,'], FIRE_OFF = ['rgba(44,34,28,', 'rgba(60,48,40,', 'rgba(70,58,48,'];
  function feather(c, x, y, dx, dy, len, wd, add) { const nx = -dy * wd * .5, ny = dx * wd * .5, ex = x + dx * len, ey = y + dy * len; if (!add) c.beginPath(); c.moveTo(x + nx, y + ny); c.quadraticCurveTo(x + dx * len * .6 + nx * 1.3, y + dy * len * .6 + ny * 1.3, ex, ey); c.quadraticCurveTo(x + dx * len * .6 - nx * 1.3, y + dy * len * .6 - ny * 1.3, x - nx, y - ny); c.closePath(); }
  CH_PAINT.phenix = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 60, md = Z > 24, ph = t * 3.4, span = .84 + .16 * Math.cos(ph), sw = Math.sin(ph) * .12;
    const fp = .5 + .5 * Math.sin(t * 9), FIRE = on ? FIRE_ON : FIRE_OFF;
    // halo de chaleur et traînée de braises
    if (hi && on) glow(c, -R * .05, 0, R * .7, FIRE[0], .16);
    if (md && on) for (let q = 0; q < 3; q++) { c.fillStyle = FIRE[q] + '.6)'; c.beginPath(); for (let k = q; k < 14; k += 3) { const f = (t * .6 + k / 14) % 1, h = hash2(k, 7, 5), x = -R * (.85 + f * 1.1), y = R * Math.sin(k * 2.3 + t * 1.5) * .35 * f, rad = R * (.035 - f * .028 + h * .01); c.moveTo(x + rad, y); c.arc(x, y, rad, 0, TAU); } c.fill(); }
    // queue : éventail de plumes à bout de flamme
    c.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI + (i - 3) * .17 + Math.sin(t * 2 + i) * .05, len = R * (.62 + (3 - Math.abs(i - 3)) * .06); feather(c, -R * .36, 0, Math.cos(a), Math.sin(a), len + R * .02, R * .13, true); } c.fillStyle = P.dark; c.fill();
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i - 3) * .17 + Math.sin(t * 2 + i) * .05, len = R * (.62 + (3 - Math.abs(i - 3)) * .06); feather(c, -R * .36, 0, Math.cos(a), Math.sin(a), len, R * .1); c.fillStyle = i & 1 ? P.body2 : P.plate; c.fill(); }
    for (let pass = 0; pass < (md ? 2 : 1); pass++) {
      c.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI + (i - 3) * .17 + Math.sin(t * 2 + i) * .05, dx = Math.cos(a), dy = Math.sin(a), len = R * (.62 + (3 - Math.abs(i - 3)) * .06), f = pass ? .7 : .55; feather(c, -R * .36 + dx * len * f, dy * len * f, dx, dy, len * (1 - f), R * (pass ? .03 : .07), true); }
      c.fillStyle = pass ? FIRE[2] + '.8)' : FIRE[0] + (.65 + .3 * fp).toFixed(2) + ')'; c.fill();
    }
    // ailes : rémiges en lames, bord de fuite incandescent
    for (const s of [-1, 1]) {
      const Sx = R * .08, Sy = s * R * .14, Ex = -R * .04, Ey = s * R * .56 * span, Tx = -R * (.24 + sw), Ty = s * R * 1.08 * span;
      const fe = (i, f, wd, add) => { const q = i / 10, bx = q < .5 ? lerp(Sx, Ex, q * 2) : lerp(Ex, Tx, q * 2 - 1), by = q < .5 ? lerp(Sy, Ey, q * 2) : lerp(Ey, Ty, q * 2 - 1); let dx = -1 + q * .4, dy = s * (.16 + q * .62); const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl; const len = R * (.32 + q * .36); feather(c, bx + dx * len * f, by + dy * len * f, dx, dy, len * (1 - f), wd, add); };
      c.beginPath(); for (let i = 0; i < 11; i++) fe(i, -.03, R * .13, true); c.fillStyle = P.dark; c.fill();
      for (let i = 0; i < 11; i++) { fe(i, 0, R * .1); c.fillStyle = i & 1 ? P.body2 : P.plate; c.fill(); }
      c.beginPath(); for (let i = 0; i < 11; i++) fe(i, .55, R * .075, true); c.fillStyle = FIRE[0] + (.65 + .3 * fp).toFixed(2) + ')'; c.fill();
      if (md) { c.beginPath(); for (let i = 0; i < 11; i++) fe(i, .72, R * .035, true); c.fillStyle = FIRE[1] + '.85)'; c.fill(); }
      // couvertures et os de l'aile
      c.beginPath(); for (let i = 0; i < 6; i++) { const q = i / 5; feather(c, lerp(Sx, Ex, q), lerp(Sy, Ey, q), -.9, s * .45, R * .24, R * .13, true); } c.fillStyle = P.dark; c.fill();
      c.beginPath(); for (let i = 0; i < 6; i++) { const q = i / 5; feather(c, lerp(Sx, Ex, q), lerp(Sy, Ey, q), -.9, s * .45, R * .22, R * .1, true); } c.fillStyle = P.body; c.fill();
      c.strokeStyle = P.dark; c.lineWidth = R * .07; c.beginPath(); c.moveTo(Sx, Sy); c.lineTo(Ex, Ey); c.lineTo(Tx, Ty); c.stroke();
      c.strokeStyle = P.plate; c.lineWidth = R * .03; c.stroke();
      c.fillStyle = P.acc; circ(c, Ex, Ey, R * .035); c.fill();
    }
    // corps fuselé, bréchet, tête, bec et crête
    c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, R * .5, R * .18, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(R * .1, 0, R * .3, R * .11, 0, 0, TAU); c.fill();
    if (md) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 5; k++) { const x = -R * .1 + k * R * .08; c.moveTo(x, -R * .1); c.quadraticCurveTo(x + R * .04, 0, x, R * .1); } c.stroke(); }
    for (const s of [-1, 1]) { feather(c, R * .5, s * R * .03, -.85, s * .5, R * .3, R * .07); c.fillStyle = P.acc; c.fill(); feather(c, R * .5 - R * .17, s * R * .13, -.85, s * .5, R * .12, R * .04); c.fillStyle = FIRE[1] + (.6 + .3 * fp).toFixed(2) + ')'; c.fill(); }
    c.fillStyle = P.body; circ(c, R * .52, 0, R * .12); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * .6, -R * .06); c.quadraticCurveTo(R * .76, -R * .03, R * .84, 0); c.quadraticCurveTo(R * .76, R * .03, R * .6, R * .06); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke();
    for (const s of [-1, 1]) { c.fillStyle = FIRE[2] + '.95)'; circ(c, R * .56, s * R * .065, R * .022); c.fill(); }
    glowCore(c, R * .12, 0, R * .1, P, t);
  };

  // ---------- HOSPITALIER : hôpital de campagne chenillé, croix lumineuse, grue, baie de réparation ----------
  CH_PAINT.hospitalier = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 60, md = Z > 24;
    for (const s of [-1, 1]) for (const tx of [-.58, -.02, .5]) treads(c, tx * R - R * .25, s * R * .8 - R * .13, R * .5, R * .26, P, t, R * .5);
    // coque et toit
    c.fillStyle = P.body2; rr(c, -R * .9, -R * .67, R * 1.78, R * 1.34, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.4; c.stroke();
    c.fillStyle = P.body; rr(c, -R * .84, -R * .59, R * 1.36, R * 1.18, R * .08); c.fill();
    // bandes de signalisation à damier le long des flancs
    if (md) { for (const s of [-1, 1]) for (let k = 0; k < 18; k++) { c.fillStyle = k & 1 ? P.plate : P.acc; c.globalAlpha = k & 1 ? .8 : .55; c.fillRect(-R * .8 + k * R * .07, s * R * .62 - R * .03, R * .07, R * .06); } c.globalAlpha = 1; }
    // poste de conduite : pare-brise, rampe de gyrophares
    c.fillStyle = P.plate; rr(c, R * .5, -R * .46, R * .38, R * .92, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = 'rgba(160,210,220,.4)'; rr(c, R * .78, -R * .38, R * .07, R * .76, R * .03); c.fill();
    const fl = Math.sin(t * 8) > 0;
    for (let k = -2; k <= 2; k++) { const lit = on && (k & 1 ? fl : !fl); c.fillStyle = lit ? (k & 1 ? P.acc : '#f0f4f2') : P.dark; rr(c, R * .6, k * R * .1 - R * .035, R * .06, R * .07, R * .015); c.fill(); }
    if (md && on) for (const s of [-1, 1]) glow(c, R * .88, s * R * .33, R * .07, 'rgba(255,236,180,', .55);
    // réservoirs de nano-réparation (niveau qui ondule)
    for (const s of [-1, 1]) {
      c.fillStyle = P.dark; rr(c, -R * .5, s * R * .44 - R * .075, R * .3, R * .15, R * .07); c.fill(); c.strokeStyle = P.plate; c.lineWidth = lw * 1.4; c.stroke();
      const lv = .55 + .25 * Math.sin(t * 1.3 + s); c.fillStyle = P.glow + '.55)'; rr(c, -R * .48, s * R * .44 - R * .05, R * .26 * lv, R * .1, R * .05); c.fill();
      if (hi) { c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 3; k++) { const f = (t * .8 + k / 3) % 1; circ(c, -R * (.46 - f * .24 * lv), s * R * .44 + Math.sin(k * 3 + t * 4) * R * .02, R * .008); c.fill(); } }
    }
    // baie de réparation à l'arrière : toit, porte qui s'ouvre au cycle de fabrication, rampe
    c.fillStyle = P.plate; rr(c, -R * .88, -R * .34, R * .5, R * .68, R * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
    const op = fabDoor(u);
    if (op > .02) { c.fillStyle = P.body2; c.beginPath(); c.moveTo(-R * .9, -R * .24); c.lineTo(-R * (.9 + .16 * op), -R * .2); c.lineTo(-R * (.9 + .16 * op), R * .2); c.lineTo(-R * .9, R * .24); c.closePath(); c.fill(); c.strokeStyle = '#e0b030'; c.lineWidth = lw * 1.4; c.beginPath(); for (let k = -1; k <= 1; k++) { c.moveTo(-R * (.9 + .04 * op), k * R * .12 - R * .04); c.lineTo(-R * (.9 + .1 * op), k * R * .12); c.lineTo(-R * (.9 + .04 * op), k * R * .12 + R * .04); } c.stroke(); }
    c.fillStyle = P.dark; c.fillRect(-R * .94, -R * .26, R * .07, R * .52);
    c.fillStyle = P.glow + (.25 + op * .65).toFixed(2) + ')'; c.fillRect(-R * .94, -R * .26 * op, R * .05, R * .52 * op);
    if (md) { c.strokeStyle = P.body2; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 6; k++) { const y = -R * .26 + k * R * .1; if (Math.abs(y + R * .05) < R * .26 * op) continue; c.moveTo(-R * .93, y); c.lineTo(-R * .88, y); } c.stroke(); }
    // grande croix lumineuse sur le toit de la baie
    const cx = -R * .63, pu = .5 + .5 * Math.sin(t * 2);
    if (md) glow(c, cx, 0, R * .32, P.glow, (.12 + .12 * pu).toFixed(2));
    c.fillStyle = P.dark; rr(c, cx - R * .22, -R * .075, R * .44, R * .15, R * .02); c.fill(); rr(c, cx - R * .075, -R * .22, R * .15, R * .44, R * .02); c.fill();
    c.fillStyle = P.glow + (.6 + .35 * pu).toFixed(2) + ')'; rr(c, cx - R * .19, -R * .05, R * .38, R * .1, R * .02); c.fill(); rr(c, cx - R * .05, -R * .19, R * .1, R * .38, R * .02); c.fill();
    // grue articulée au coin arrière : flèche en treillis qui pivote, câble et crochet
    const gx = -R * .76, gy = -R * .5, ga = -.35 + Math.sin(t * .45) * .7, L = R * .62, ex = gx + Math.cos(ga) * L, ey = gy + Math.sin(ga) * L;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(gx + R * .05, gy + R * .07); c.lineTo(ex + R * .05, ey + R * .07); c.lineWidth = R * .06; c.strokeStyle = 'rgba(0,0,0,.2)'; c.stroke();
    c.fillStyle = P.dark; circ(c, gx, gy, R * .08); c.fill(); c.fillStyle = P.body2; rr(c, gx - Math.cos(ga) * R * .16 - R * .06, gy - Math.sin(ga) * R * .16 - R * .06, R * .12, R * .12, R * .02); c.fill();
    c.strokeStyle = '#e0b030'; c.lineWidth = R * .04; c.beginPath(); c.moveTo(gx, gy); c.lineTo(ex, ey); c.stroke();
    if (md) { const nx = -Math.sin(ga) * R * .018, ny = Math.cos(ga) * R * .018; c.strokeStyle = '#1e1c18'; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 8; k++) { const f0 = k / 8, f1 = (k + 1) / 8, s0 = k & 1 ? 1 : -1; c.moveTo(gx + (ex - gx) * f0 + nx * s0, gy + (ey - gy) * f0 + ny * s0); c.lineTo(gx + (ex - gx) * f1 - nx * s0, gy + (ey - gy) * f1 - ny * s0); } c.stroke(); }
    c.fillStyle = P.dark; circ(c, ex, ey, R * .035); c.fill(); c.strokeStyle = P.plate; c.lineWidth = lw * 1.4; c.beginPath(); c.arc(ex + R * .02, ey + R * .02, R * .03, 0, Math.PI * 1.5); c.stroke();
    c.fillStyle = P.plate; ngon(c, 8, R * .1, Math.PI / 8, R * .1, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
    glowCore(c, R * .1, 0, R * .08, P, t);
  };
  // ---------- BASTILLE : forteresse étoilée sur chenilles ----------
  // contour à quatre bastions (coin avant gauche en repère canonique, tourné de -90° pour chaque coin)
  const BA_C = [[.44, -.3], [.54, -.3], [.7, -.7], [.3, -.54], [.3, -.44]], BA_P = [];
  for (let q = 0; q < 4; q++) for (const [x, y] of BA_C) { let a = x, b = y; for (let k = 0; k < q; k++) { const tmp = a; a = b; b = -tmp; } BA_P.push(a, b); }
  function fortPath(c, R, k) { c.beginPath(); for (let i = 0; i < BA_P.length; i += 2) c.lineTo(BA_P[i] * R * k, BA_P[i + 1] * R * k); c.closePath(); }
  CH_PAINT.bastille = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 70, md = Z > 26;
    for (const s of [-1, 1]) for (const tx of [-.48, 0, .48]) treads(c, tx * R - R * .19, s * R * .84 - R * .11, R * .38, R * .22, P, t, R * .5);
    // ravelin de proue (bandes de danger) et poterne arrière
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .4, -R * .24); c.lineTo(R * .84, 0); c.lineTo(R * .4, R * .24); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    if (md) { c.beginPath(); c.moveTo(R * .62, -R * .14); c.lineTo(R * .84, 0); c.lineTo(R * .62, R * .14); c.lineTo(R * .58, R * .12); c.lineTo(R * .77, 0); c.lineTo(R * .58, -R * .12); c.closePath(); hazard(c, R * .55, -R * .2, R * .86, R * .2, 10); }
    c.fillStyle = P.dark; rr(c, -R * .58, -R * .12, R * .16, R * .24, R * .03); c.fill();
    // douves de métal : anneau sombre qui miroite autour des remparts
    c.fillStyle = P.dark; fortPath(c, R, 1.09); c.fill();
    if (md) { c.save(); fortPath(c, R, 1.09); c.clip(); c.strokeStyle = 'rgba(200,220,230,.12)'; c.lineWidth = R * .012; c.beginPath(); for (let k = 0; k < 5; k++) { const o = ((t * .06 + k / 5) % 1) * 2.4 - 1.2; c.moveTo((o - .3) * R, -R * 1.1); c.lineTo((o + .3) * R, R * 1.1); } c.stroke(); c.restore(); }
    // remparts : courtine épaisse, créneaux, cour intérieure
    c.fillStyle = P.body2; fortPath(c, R, 1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.4; c.stroke();
    c.fillStyle = P.body; fortPath(c, R, .84); c.fill();
    if (md) {
      c.fillStyle = P.plate; c.beginPath();
      for (let i = 0; i < BA_P.length; i += 2) { const j = (i + 2) % BA_P.length, x0 = BA_P[i], y0 = BA_P[i + 1], x1 = BA_P[j], y1 = BA_P[j + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / .075); for (let k = 0; k < n; k++) { const f = (k + .5) / n, x = (x0 + (x1 - x0) * f) * .96, y = (y0 + (y1 - y0) * f) * .96; c.rect(x * R - R * .018, y * R - R * .018, R * .036, R * .036); } }
      c.fill();
    }
    // casernes et magasins dans la cour
    c.fillStyle = P.body2; for (const s of [-1, 1]) { rr(c, -R * .4, s * R * .16 - R * .07, R * .2, R * .14, R * .02); c.fill(); }
    if (md) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(-R * .4, s * R * .16); c.lineTo(-R * .2, s * R * .16); } c.stroke(); }
    // donjon central à tourelles d'angle
    c.fillStyle = SH; rr(c, -R * .13, -R * .15, R * .32, R * .32, R * .03); c.fill();
    c.fillStyle = P.plate; rr(c, -R * .17, -R * .17, R * .32, R * .32, R * .03); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(-R * .17, -R * .17); c.lineTo(R * .15, R * .15); c.moveTo(R * .15, -R * .17); c.lineTo(-R * .17, R * .15); c.stroke();
    c.fillStyle = P.body2; for (const [x, y] of [[-.17, -.17], [.15, -.17], [-.17, .15], [.15, .15]]) { circ(c, x * R, y * R, R * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.2; c.stroke(); }
    glowCore(c, -R * .01, -R * .01, R * .08, P, t);
    // tours de guet aux pointes des bastions, feux qui clignotent
    for (let q = 0; q < 4; q++) { const i = q * 10 + 4, x = BA_P[i] * R * .92, y = BA_P[i + 1] * R * .92; c.fillStyle = P.body2; circ(c, x, y, R * .06); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke(); c.fillStyle = P.plate; ngon(c, 6, R * .04, t * .2, x, y); c.fill(); c.fillStyle = Math.sin(t * 3 + q * 1.7) > 0 ? P.acc : P.dark; circ(c, x, y, R * .015); c.fill(); }
    // tourelles antimissiles (décor) sur le ravelin et la poterne : canons jumeaux qui balaient le ciel
    for (const [x, a0] of [[.64, 0], [-.5, Math.PI]]) {
      const a = a0 + Math.sin(t * 1.7 + x * 5) * .9;
      c.fillStyle = P.body2; circ(c, x * R, 0, R * .055); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke();
      c.strokeStyle = P.dark; c.lineWidth = R * .014; c.beginPath(); for (const o of [-1, 1]) { const ox = -Math.sin(a) * o * R * .018, oy = Math.cos(a) * o * R * .018; c.moveTo(x * R + ox, oy); c.lineTo(x * R + ox + Math.cos(a) * R * .1, oy + Math.sin(a) * R * .1); } c.stroke();
      c.fillStyle = P.acc; circ(c, x * R, 0, R * .015); c.fill();
    }
  };

  // ---------- TARASQUE : dragon-tortue à six pattes, carapace hérissée, queue armée ----------
  const TQ_L = [], TQ_G = [];
  for (let k = 0; k < 6; k++) { const s = k < 3 ? -1 : 1, i = k % 3; TQ_L.push([.34 - i * .36, s * .4, .5 - i * .52, s * .9]); TQ_G.push((i + (s > 0 ? 1 : 0)) % 2); }
  const BONE = '#c9c2b4', BONE2 = '#8f887a';
  function spike(c, x, y, a, len, wd, add) { const ca = Math.cos(a), sa = Math.sin(a); if (!add) c.beginPath(); c.moveTo(x - sa * wd, y + ca * wd); c.lineTo(x + ca * len, y + sa * len); c.lineTo(x + sa * wd, y - ca * wd); c.closePath(); }
  CH_PAINT.tarasque = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 70, md = Z > 26;
    const rage = life(u) && u.maxhp ? clamp((.45 - u.hp / u.maxhp) / .3, 0, 1) : 0;
    // queue segmentée et masse d'armes
    const sw = Math.sin(t * 1.4) * .22;
    for (let i = 0; i < 8; i++) { const q = i / 7; PT[i * 2] = qb(-.6, -.98, -1.22, q) * R; PT[i * 2 + 1] = qb(0, sw * .3, sw, q) * R; }
    limb(c, PT, 8, R * .24, R * .1, P.body2, P.dark, lw * 4);
    if (md) { c.fillStyle = BONE; c.beginPath(); for (let i = 1; i < 7; i++) { const w = R * (.24 - .14 * i / 7) * .5, ax = PT[i * 2 + 2] - PT[i * 2 - 2], ay = PT[i * 2 + 3] - PT[i * 2 - 1], a = Math.atan2(ay, ax); spike(c, PT[i * 2], PT[i * 2 + 1], a - Math.PI / 2, w * 1.5, w * .35, true); spike(c, PT[i * 2], PT[i * 2 + 1], a + Math.PI / 2, w * 1.5, w * .35, true); } c.fill(); }
    { const x = PT[14], y = PT[15]; c.fillStyle = BONE; c.beginPath(); for (let k = 0; k < 7; k++) spike(c, x, y, k / 7 * TAU + t * .2, R * .17, R * .035, true); c.fill(); c.fillStyle = P.body; circ(c, x, y, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke(); }
    // six pattes : pas tripode, pieds griffus
    gait(u, TQ_L, R, t, mv, { groups: TQ_G, stride: .3, dur: .4, f: 3, amp: .2, thud: giantThud }).forEach(g => {
      reach(g, R * .68); const [kx, ky] = knee(g.hx, g.hy, g.fx, g.fy, R * .34, R * .32, g.hy < 0 ? -1 : 1);
      PT[0] = g.hx; PT[1] = g.hy; PT[2] = kx; PT[3] = ky; PT[4] = g.fx; PT[5] = g.fy; limb(c, PT, 3, R * .26, R * .17, P.body2, P.dark, lw * 4);
      if (md) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 1.2; c.beginPath(); for (let j = 1; j < 4; j++) { const f = j / 4, x = kx + (g.fx - kx) * f, y = ky + (g.fy - ky) * f, a = Math.atan2(g.fy - ky, g.fx - kx) + Math.PI / 2, w = R * .09; c.moveTo(x - Math.cos(a) * w, y - Math.sin(a) * w); c.quadraticCurveTo(x + Math.cos(a - Math.PI / 2) * w * .5, y + Math.sin(a - Math.PI / 2) * w * .5, x + Math.cos(a) * w, y + Math.sin(a) * w); } c.stroke(); }
      c.fillStyle = P.body; circ(c, kx, ky, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke();
      const a = Math.atan2(g.fy - ky, g.fx - kx), k = 1 + g.lift * .25;
      if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; circ(c, g.fx + R * .03 * g.lift, g.fy + R * .05 * g.lift, R * .09); c.fill(); }
      c.fillStyle = BONE; c.beginPath(); for (const o of [-.55, 0, .55]) spike(c, g.fx, g.fy, a + o, R * .17 * k, R * .03 * k, true); c.fill();
      c.fillStyle = P.body2; circ(c, g.fx, g.fy, R * .11 * k); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke();
    });
    // cou et tête de dragon : cornes, gueule qui rougeoie
    const hs = Math.sin(t * 1.1) * .05, hxx = R * (.94 + Math.cos(t * .7) * .015), hy = R * hs;
    PT[0] = R * .5; PT[1] = 0; PT[2] = R * .74; PT[3] = hy * .5; PT[4] = hxx - R * .06; PT[5] = hy;
    tube(c, PT, 3, R * .4, R * .26); c.fillStyle = P.body2; c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.save(); c.translate(hxx, hy); c.rotate(hs * 1.5); c.scale(1.25, 1.25);
    c.fillStyle = BONE; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-R * .02, s * R * .1); c.quadraticCurveTo(-R * .12, s * R * .26, -R * .3, s * R * .3); c.quadraticCurveTo(-R * .14, s * R * .18, -R * .1, s * R * .06); c.closePath(); c.fill(); c.strokeStyle = BONE2; c.lineWidth = lw; c.stroke(); }
    c.fillStyle = P.body; c.beginPath(); c.moveTo(-R * .12, -R * .16); c.lineTo(R * .05, -R * .17); c.lineTo(R * .19, -R * .1); c.lineTo(R * .3, -R * .045); c.lineTo(R * .31, R * .045); c.lineTo(R * .19, R * .1); c.lineTo(R * .05, R * .17); c.lineTo(-R * .12, R * .16); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(-R * .08, -R * .08); c.lineTo(R * .14, -R * .05); c.lineTo(R * .24, 0); c.lineTo(R * .14, R * .05); c.lineTo(-R * .08, R * .08); c.closePath(); c.fill();
    c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(R * .02, s * R * .15); c.quadraticCurveTo(R * .1, s * R * .07, R * .17, s * R * .12); } c.stroke();
    const mw = .5 + .3 * Math.sin(t * 5) + rage * .3; if (on) glow(c, R * .31, 0, R * (.16 + rage * .12), 'rgba(255,110,40,', mw.toFixed(2));
    c.fillStyle = on ? `rgba(255,${(150 + 60 * Math.sin(t * 7)) | 0},60,.9)` : P.dark; c.beginPath(); c.moveTo(R * .2, -R * .035); c.lineTo(R * .31, -R * .02); c.lineTo(R * .31, R * .02); c.lineTo(R * .2, R * .035); c.closePath(); c.fill();
    for (const s of [-1, 1]) { c.fillStyle = P.acc; c.beginPath(); c.ellipse(R * .1, s * R * .1, R * .04, R * .018, s * .35, 0, TAU); c.fill(); }
    c.restore();
    // carapace : épines du pourtour, plaques, épines dorsales
    c.fillStyle = BONE; c.beginPath(); for (let k = 0; k < 22; k++) { const a = k / 22 * TAU + .07; if (Math.cos(a) > .9) continue; spike(c, -R * .04 + Math.cos(a) * R * .66, Math.sin(a) * R * .54, a, R * (.14 + (k & 1) * .05), R * .045, true); } c.fill();
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .04, 0, R * .72, R * .6, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.4; c.stroke();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(-R * .04, 0, R * .62, R * .5, 0, 0, TAU); c.fill();
    if (md) {
      c.strokeStyle = rage > 0 ? `rgba(255,${(90 + 60 * Math.sin(t * 6)) | 0},50,${(.3 + rage * .5).toFixed(2)})` : 'rgba(0,0,0,.3)'; c.lineWidth = lw * (1.4 + rage);
      c.beginPath(); for (const [x, y] of [[.36, 0], [-.04, 0], [-.44, 0], [.16, -.34], [.16, .34], [-.24, -.34], [-.24, .34]]) { ngon(c, 6, R * .17, Math.PI / 6, x * R, y * R); } c.stroke();
    }
    { const D = [[.42, 0, .12], [-.42, 0, .12], [-.66, -.3, .09], [-.66, .3, .09], [.46, -.32, .09], [.46, .32, .09], [-.04, -.52, .08], [-.04, .52, .08]]; c.fillStyle = BONE2; c.beginPath(); for (const [x, y, l] of D) { c.moveTo(x * R + R * l * .55, y * R); c.arc(x * R, y * R, R * l * .55, 0, TAU); } c.fill(); c.fillStyle = BONE; c.beginPath(); for (const [x, y, l] of D) spike(c, x * R, y * R, -2.3, R * l, R * l * .45, true); c.fill(); }
    glowCore(c, -R * .04, 0, R * .1, P, t);
  };

  // ---------- GOLEM : colosse bipède de pierre et d'acier, fissures lumineuses, poings immenses ----------
  const GO_L = [[0, -.3, 0, -.44], [0, .3, 0, .44]];
  // blocs de roche sertis : [x, y, rx, ry]
  const GO_B = [[-.02, -.5, .19, .17], [-.02, .5, .19, .17], [.15, -.21, .14, .16], [.15, .21, .14, .16], [-.02, 0, .13, .14], [-.24, -.24, .13, .17], [-.24, .24, .13, .17], [-.3, 0, .08, .09], [-.16, -.42, .1, .11], [-.16, .42, .1, .11], [.15, -.44, .1, .1], [.15, .44, .1, .1]];
  const GO_V = GO_B.map((b, i) => { const n = 7, v = []; for (let k = 0; k < n; k++) { const a = k / n * TAU + hash2(i, k, 3) * .5, m = .82 + hash2(k, i, 9) * .22; v.push(Math.cos(a) * b[2] * m, Math.sin(a) * b[3] * m); } return v; });
  function rock(c, R, i, add) { const b = GO_B[i], v = GO_V[i]; if (!add) c.beginPath(); for (let k = 0; k < v.length; k += 2) { const x = (b[0] + v[k] * .94) * R, y = (b[1] + v[k + 1] * .94) * R; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
  CH_PAINT.golem = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 70, md = Z > 26, pu = .5 + .5 * Math.sin(t * 2.2);
    const G = gait(u, GO_L, R, t, mv, { stride: .46, dur: .52, f: 2.4, amp: .44, thud: giantThud });
    // jambes et pieds-blocs
    G.forEach(g => {
      const fx = g.fx, fy = g.fy, k = 1 + g.lift * .15;
      c.strokeStyle = P.dark; c.lineWidth = R * .22; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(fx, fy); c.stroke();
      if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, fx - R * .34 + R * .07 * g.lift, fy - R * .18 + R * .1 * g.lift, R * .66, R * .36, R * .08); c.fill(); }
      c.fillStyle = P.body2; rr(c, fx - R * .34 * k, fy - R * .18 * k, R * .62 * k, R * .36 * k, R * .08); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
      c.fillStyle = P.body; rr(c, fx - R * .22 * k, fy - R * .12 * k, R * .3 * k, R * .24 * k, R * .05); c.fill();
      c.fillStyle = P.body; c.beginPath(); for (let j = -1; j <= 1; j++) { const x = fx + R * .3 * k, y = fy + j * R * .11 * k; c.moveTo(x + R * .075 * k, y); c.arc(x, y, R * .075 * k, 0, TAU); } c.fill(); c.stroke();
      c.fillStyle = P.dark; c.fillRect(fx - R * .28 * k, fy - R * .18 * k, R * .04 * k, R * .36 * k);
      if (md) { c.strokeStyle = P.glow + (.3 + .3 * pu).toFixed(2) + ')'; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(fx - R * .2 * k, fy - R * .08 * k); c.lineTo(fx - R * .05 * k, fy + R * .02 * k); c.lineTo(fx + R * .1 * k, fy - R * .05 * k); c.stroke(); }
    });
    // bras qui balancent à l'inverse des jambes, poings immenses cerclés d'acier
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, o = G[1 - i], sw = clamp(o.fx * .8, -R * .3, R * .3), shx = 0, shy = s * R * .56, ex = sw * .4 - R * .06, ey = s * R * .8, fx = R * .14 + sw, fy = s * R * .84;
      PT[0] = shx; PT[1] = shy; PT[2] = ex; PT[3] = ey; PT[4] = fx; PT[5] = fy;
      limb(c, PT, 3, R * .26, R * .2, P.body2, P.dark, lw * 4);
      c.save(); c.translate(fx, fy); c.rotate(Math.atan2(fy - ey, fx - ex) * .3);
      c.fillStyle = P.dark; rr(c, -R * .17, -R * .16, R * .14, R * .32, R * .04); c.fill();
      c.fillStyle = P.body; rr(c, -R * .08, -R * .17, R * .3, R * .34, R * .09); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.plate; c.beginPath(); for (let j = 0; j < 4; j++) { const y = (j - 2) * R * .08 + R * .04; c.moveTo(R * .24, y); c.ellipse(R * .18, y, R * .06, R * .034, 0, 0, TAU); } c.fill();
      c.strokeStyle = P.dark; c.lineWidth = lw * 1.2; c.beginPath(); for (let j = 1; j < 4; j++) { c.moveTo(R * .02, (j - 2) * R * .08); c.lineTo(R * .23, (j - 2) * R * .08); } c.stroke();
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(R * .02, -s * R * .17, R * .09, R * .05, -s * .4, 0, TAU); c.fill(); c.stroke();
      if (md) { c.strokeStyle = P.glow + (.35 + .35 * pu).toFixed(2) + ')'; c.lineWidth = lw * 1.4; c.beginPath(); c.moveTo(-R * .04, -R * .12); c.lineTo(R * .04, -R * .03); c.lineTo(0, R * .1); c.stroke(); }
      c.restore();
    }
    // torse : socle sombre, fissures lumineuses entre les blocs
    c.fillStyle = P.dark; c.beginPath(); c.ellipse(-R * .05, 0, R * .4, R * .68, 0, 0, TAU); c.fill();
    if (md) { c.strokeStyle = P.glow + (.35 + .4 * pu).toFixed(2) + ')'; c.lineWidth = lw * 3; c.beginPath(); for (const [x, y] of [[.3, 0], [-.4, 0], [.06, -.62], [.06, .62], [-.26, -.48], [-.26, .48]]) { c.moveTo(-R * .05, 0); c.lineTo(x * R * .55, y * R * .55 + R * .03); c.lineTo(x * R, y * R); } c.stroke(); }
    for (let q = 0; q < 3; q++) { c.fillStyle = q === 2 ? P.plate : q ? P.body : P.body2; c.beginPath(); GO_B.forEach((b, i) => { const h = hash2(i, 5, 11); if ((h > .66 ? 2 : h > .33 ? 1 : 0) === q) rock(c, R, i, true); }); c.fill(); }
    if (md) { c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = lw * 1.5; c.beginPath(); for (let i = 0; i < GO_B.length; i++) { const b = GO_B[i]; c.moveTo((b[0] - b[2] * .5) * R, (b[1] - b[3] * .6) * R); c.lineTo((b[0] + b[2] * .3) * R, (b[1] - b[3] * .75) * R); } c.stroke();
      c.strokeStyle = P.glow + (.3 + .35 * pu).toFixed(2) + ')'; c.lineWidth = lw * 1.2; c.beginPath(); for (let i = 0; i < GO_B.length; i += 2) { const b = GO_B[i], h = hash2(i, 2, 7); c.moveTo((b[0] - b[2] * .6) * R, (b[1] + b[3] * (h - .5)) * R); c.lineTo(b[0] * R, (b[1] + b[3] * .2) * R); c.lineTo((b[0] + b[2] * .5) * R, (b[1] - b[3] * .4) * R); } c.stroke(); }
    // cerclage d'acier rivé
    c.strokeStyle = P.dark; c.lineWidth = R * .045; c.beginPath(); c.moveTo(R * .05, -R * .62); c.quadraticCurveTo(R * .1, 0, R * .05, R * .62); c.moveTo(-R * .16, -R * .6); c.quadraticCurveTo(-R * .11, 0, -R * .16, R * .6); c.stroke();
    if (hi) { c.fillStyle = P.plate; for (const x0 of [.05, -.16]) for (let k = -4; k <= 4; k++) { const f = k / 4.5; circ(c, (x0 + .05 * (1 - f * f)) * R, f * R * .58, R * .012); c.fill(); } }
    // forges dorsales
    for (const s of [-1, 1]) { c.fillStyle = '#16120e'; rr(c, -R * .42, s * R * .12 - R * .03, R * .12, R * .06, R * .02); c.fill(); c.fillStyle = on ? `rgba(255,${(120 + 60 * Math.sin(t * 5 + s)) | 0},50,.75)` : P.dark; c.fillRect(-R * .4, s * R * .12 - R * .012, R * .1, R * .024); }
    // tête enfoncée entre les épaules : visière lumineuse
    c.fillStyle = P.dark; circ(c, R * .34, 0, R * .14); c.fill();
    c.fillStyle = P.body; rr(c, R * .26, -R * .11, R * .2, R * .22, R * .06); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
    c.fillStyle = P.glow + '.95)'; c.fillRect(R * .42, -R * .07, R * .03, R * .14); if (md) glow(c, R * .44, 0, R * .12, P.glow, (.3 + .3 * pu).toFixed(2));
    glowCore(c, -R * .02, 0, R * .09, P, t);
  };
  // ---------- MANTICORE : lion-scorpion, ailes repliées, queue de scorpion qui porte l'affût principal ----------
  const MA_L = [[.36, -.24, .66, -.56], [.36, .24, .66, .56], [-.42, -.26, -.64, -.58], [-.42, .26, -.64, .58]];
  function cubic(a, b, d, e, s) { const m = 1 - s; return m * m * m * a + 3 * m * m * s * b + 3 * m * s * s * d + s * s * s * e; }
  CH_PAINT.manticore = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 70, md = Z > 26;
    // calé (siège) : les ailes s'ouvrent en béquilles
    const sp = life(u) ? (u._wsp = lerp(u._wsp || 0, u.sieged ? 1 : 0, .04)) : 0;
    const G = gait(u, MA_L, R, t, mv, { groups: [0, 1, 1, 0], stride: .4, dur: .34, f: 3.6, amp: .3, thud: giantThud });
    G.forEach((g, i) => {
      const fr = i < 2; reach(g, R * .62); const [kx, ky] = knee(g.hx, g.hy, g.fx, g.fy, R * .3, R * .3, (g.hy < 0 ? -1 : 1) * (fr ? 1 : -1));
      PT[0] = g.hx; PT[1] = g.hy; PT[2] = kx; PT[3] = ky; PT[4] = g.fx; PT[5] = g.fy;
      limb(c, PT, 3, R * .19, R * .11, P.body, P.dark, lw * 3.4);
      if (md) { c.strokeStyle = P.plate; c.lineWidth = R * .025; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(kx, ky); c.stroke(); }
      paw(c, g.fx + R * .02, g.fy, R * .2, R * .15, g.lift, P, lw, md);
    });
    // corps félin
    c.fillStyle = P.body; c.strokeStyle = P.dark; c.lineWidth = lw * 2;
    c.beginPath(); c.ellipse(-R * .28, 0, R * .44, R * .27, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(R * .26, 0, R * .36, R * .31, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = P.plate; for (let k = 0; k < 7; k++) { rr(c, -R * .62 + k * R * .13, -R * .06, R * .1, R * .12, R * .03); c.fill(); }
    // ailes de membrane repliées le long du dos
    const br = Math.sin(t * 1.5) * .02;
    for (const s of [-1, 1]) {
      const Sx = .2, Sy = .2, Ex = .02 - .05 * sp, Ey = .46 + .36 * sp + br, Tx = -.74 + .2 * sp, Ty = .44 + .52 * sp + br, F1x = -.5 + .1 * sp, F1y = .32 + .42 * sp, F2x = -.24 + .05 * sp, F2y = .25 + .22 * sp;
      c.beginPath(); c.moveTo(Sx * R, s * Sy * R); c.lineTo(Ex * R, s * Ey * R); c.lineTo(Tx * R, s * Ty * R);
      c.quadraticCurveTo((Tx + F1x) * .5 * R + R * .02, s * ((Ty + F1y) * .5 - .06) * R, F1x * R, s * F1y * R);
      c.quadraticCurveTo((F1x + F2x) * .5 * R, s * ((F1y + F2y) * .5 - .05) * R, F2x * R, s * F2y * R);
      c.quadraticCurveTo(-.12 * R, s * .19 * R, Sx * R, s * Sy * R); c.closePath();
      c.fillStyle = P.body2; c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.6; c.stroke();
      c.strokeStyle = P.dark; c.lineWidth = R * .03; c.beginPath(); c.moveTo(Sx * R, s * Sy * R); c.lineTo(Ex * R, s * Ey * R); c.lineTo(Tx * R, s * Ty * R); c.moveTo(Ex * R, s * Ey * R); c.lineTo(F1x * R, s * F1y * R); c.moveTo(Ex * R, s * Ey * R); c.lineTo(F2x * R, s * F2y * R); c.stroke();
      if (md) { c.strokeStyle = P.plate; c.lineWidth = R * .012; c.stroke(); }
      c.fillStyle = BONE; spike(c, Ex * R, s * Ey * R, s * (1.2 - sp * .3), R * .1, R * .025); c.fill();
    }
    // tête de lion : crinière de lames, mufle, crocs
    const hx = R * .7;
    c.beginPath(); for (let k = 0; k < 15; k++) { const a = (k / 14 - .5) * Math.PI * 1.7 + Math.PI, l = R * (.16 + (k & 1) * .07 + Math.sin(t * 2 + k) * .006); spike(c, hx + Math.cos(a) * R * .09, Math.sin(a) * R * .11, a, l + R * .12, R * .075, true); } c.fillStyle = P.dark; c.fill();
    for (let q = 1; q >= 0; q--) { c.beginPath(); for (let k = q; k < 15; k += 2) { const a = (k / 14 - .5) * Math.PI * 1.7 + Math.PI, l = R * (.16 + (k & 1) * .07 + Math.sin(t * 2 + k) * .006); spike(c, hx + Math.cos(a) * R * .1, Math.sin(a) * R * .12, a, l + R * .1, R * .06, true); } c.fillStyle = q ? P.plate : P.body2; c.fill(); }
    c.fillStyle = P.body; circ(c, hx, 0, R * .14); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
    c.fillStyle = P.body2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx - R * .06, s * R * .1); c.lineTo(hx - R * .12, s * R * .2); c.lineTo(hx + R * .01, s * R * .13); c.closePath(); c.fill(); }
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(hx + R * .12, 0, R * .08, R * .085, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.4; c.stroke();
    c.fillStyle = P.dark; c.beginPath(); c.moveTo(hx + R * .16, -R * .03); c.lineTo(hx + R * .2, 0); c.lineTo(hx + R * .16, R * .03); c.closePath(); c.fill();
    c.fillStyle = '#ece6d6'; for (const s of [-1, 1]) { spike(c, hx + R * .18, s * R * .05, 0, R * .06, R * .014); c.fill(); }
    for (const s of [-1, 1]) { c.fillStyle = P.glow + '.95)'; c.beginPath(); c.ellipse(hx + R * .05, s * R * .065, R * .03, R * .015, s * .3, 0, TAU); c.fill(); }
    // queue de scorpion : de la croupe, en arrière, puis dressée au-dessus du dos jusqu'au dard (affût principal)
    const sw = Math.sin(t * 1.1) * .06, N = 12;
    for (let i = 0; i < N; i++) { const q = i / (N - 1); PT[i * 2] = cubic(-.6, -1.2, -1.18, -.1, q) * R; PT[i * 2 + 1] = cubic(-.03, -.16, .2 + sw, 0, q) * R; }
    const hgt = q => q < .35 ? q * .6 : .21 + (q - .35) * 1.2;
    c.fillStyle = SH; c.beginPath(); for (let i = 3; i < N; i++) { const q = i / (N - 1), h = hgt(q), x = PT[i * 2] + R * .12 * h, y = PT[i * 2 + 1] + R * .16 * h, ex = R * (.08 + .07 * q); c.moveTo(x + ex, y); c.ellipse(x, y, ex, R * (.05 + .05 * q), 0, 0, TAU); } c.fill();
    for (let i = 0; i < N; i++) {
      const q = i / (N - 1), j = Math.min(N - 1, i + 1), k = Math.max(0, i - 1), a = Math.atan2(PT[j * 2 + 1] - PT[k * 2 + 1], PT[j * 2] - PT[k * 2]), rs = R * (.055 + .065 * q);
      const x = PT[i * 2], y = PT[i * 2 + 1];
      c.fillStyle = P.dark; c.beginPath(); c.ellipse(x, y, rs * 1.25 + lw * 1.2, rs + lw * 1.2, a, 0, TAU); c.fill(); c.fillStyle = P.body2; c.beginPath(); c.ellipse(x, y, rs * 1.25, rs, a, 0, TAU); c.fill();
      if (md) { c.fillStyle = P.plate; c.beginPath(); c.ellipse(x - Math.cos(a) * rs * .1, y - Math.sin(a) * rs * .1, rs * .75, rs * .38, a, 0, TAU); c.fill(); }
    }
    { const x = PT[(N - 1) * 2], y = PT[(N - 1) * 2 + 1]; c.fillStyle = BONE; spike(c, x, y, .1, R * .3, R * .05); c.fill(); c.strokeStyle = BONE2; c.lineWidth = lw; c.stroke();
      c.fillStyle = P.body; circ(c, x, y, R * .15); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke(); glowCore(c, x - R * .02, y, R * .1, P, t); }
  };

  // ---------- SÉRAPHIN : vaisseau angélique, six ailes lumineuses en éventail, halo tournant ----------
  CH_PAINT.seraphin = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 70, md = Z > 26, pu = .5 + .5 * Math.sin(t * 2);
    for (let j = 0; j < 3; j++) for (const s of [-1, 1]) {
      const a = s * ([.74, 1.52, 2.32][j] + Math.sin(t * 1.4 - j * .8) * .1), x0 = [.2, 0, -.22][j] * R, y0 = s * R * .12, ca = Math.cos(a), sa = Math.sin(a), L = R * (1.0 - j * .06);
      if (md) { feather(c, x0, y0, ca, sa, L * 1.04, R * .46); c.fillStyle = P.glow + (.08 + .06 * pu).toFixed(2) + ')'; c.fill(); }
      c.beginPath(); for (let k = 0; k < 5; k++) { const ak = a + s * (k - 2) * .075, lk = L * (1 - Math.abs(k - 2) * .1); feather(c, x0, y0, Math.cos(ak), Math.sin(ak), lk + R * .025, R * .15, true); } c.fillStyle = P.glow + '.75)'; c.fill();
      for (const k of [0, 4, 1, 3, 2]) { const ak = a + s * (k - 2) * .075, lk = L * (1 - Math.abs(k - 2) * .1); feather(c, x0, y0, Math.cos(ak), Math.sin(ak), lk, R * .11); c.fillStyle = k === 2 ? P.plate : k & 1 ? P.body2 : P.body; c.fill(); }
      if (md) { c.strokeStyle = P.dark; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 5; k++) { const ak = a + s * (k - 2) * .075, dx = Math.cos(ak), dy = Math.sin(ak), lk = L * (1 - Math.abs(k - 2) * .1); c.moveTo(x0 + dx * lk * .15, y0 + dy * lk * .15); c.lineTo(x0 + dx * lk * .85, y0 + dy * lk * .85); } c.stroke(); }
      c.fillStyle = P.glow + (.6 + .35 * pu).toFixed(2) + ')'; circ(c, x0 + ca * L * .98, y0 + sa * L * .98, R * .025); c.fill();
    }
    // halo : anneau de lumière qui tourne au-dessus de la nacelle
    c.strokeStyle = P.glow + '.22)'; c.lineWidth = R * .05; circ(c, 0, 0, R * .5); c.stroke();
    c.strokeStyle = P.acc; c.lineWidth = lw * 1.5; c.stroke();
    if (md) { c.strokeStyle = P.acc; c.lineWidth = R * .024; c.beginPath(); for (let k = 0; k < 18; k++) { const a = k / 18 * TAU + t * .35, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(ca * R * .5 - sa * R * .03, sa * R * .5 + ca * R * .03); c.lineTo(ca * R * .5 + sa * R * .03, sa * R * .5 - ca * R * .03); } c.lineCap = 'butt'; c.stroke(); c.lineCap = 'round'; }
    // nacelle centrale
    const body = k => { c.beginPath(); c.moveTo(R * .76 * k, 0); c.bezierCurveTo(R * .62 * k, -R * .2 * k, R * .32 * k, -R * .29 * k, R * .05 * k, -R * .29 * k); c.bezierCurveTo(-R * .3 * k, -R * .29 * k, -R * .56 * k, -R * .17 * k, -R * .72 * k, -R * .06 * k); c.lineTo(-R * .72 * k, R * .06 * k); c.bezierCurveTo(-R * .56 * k, R * .17 * k, -R * .3 * k, R * .29 * k, R * .05 * k, R * .29 * k); c.bezierCurveTo(R * .32 * k, R * .29 * k, R * .62 * k, R * .2 * k, R * .76 * k, 0); c.closePath(); };
    c.fillStyle = P.plate; body(1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.2; c.stroke();
    c.fillStyle = P.body; body(.8); c.fill(); c.strokeStyle = P.acc; c.lineWidth = lw * 1.2; c.stroke();
    c.strokeStyle = P.body2; c.lineWidth = R * .04; c.beginPath(); c.moveTo(-R * .6, 0); c.lineTo(R * .6, 0); c.stroke();
    if (md) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(k * R * .15, -R * .2); c.lineTo(k * R * .15, R * .2); } c.stroke(); }
    c.fillStyle = P.glow + '.6)'; c.beginPath(); c.ellipse(R * .55, 0, R * .1, R * .055, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke();
    glow(c, -R * .74, 0, R * .16, P.glow, (.5 + .3 * pu).toFixed(2));
    glowCore(c, 0, 0, R * .1, P, t);
  };

  // ---------- BALEINE : dirigeable-baleine, côtes, nageoires qui ondulent, soutes ventrales ----------
  function whale(c, R, k) { c.beginPath(); c.moveTo(R * 1.0 * k, 0); c.bezierCurveTo(R * 1.0 * k, -R * .3 * k, R * .55 * k, -R * .42 * k, R * .15 * k, -R * .42 * k); c.bezierCurveTo(-R * .3 * k, -R * .42 * k, -R * .6 * k, -R * .22 * k, -R * .82 * k, -R * .1 * k); c.lineTo(-R * .82 * k, R * .1 * k); c.bezierCurveTo(-R * .6 * k, R * .22 * k, -R * .3 * k, R * .42 * k, R * .15 * k, R * .42 * k); c.bezierCurveTo(R * .55 * k, R * .42 * k, R * 1.0 * k, R * .3 * k, R * 1.0 * k, 0); c.closePath(); }
  CH_PAINT.baleine = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), Z = scr(c, R), hi = Z > 70, md = Z > 26, pu = .5 + .5 * Math.sin(t * 1.8);
    // queue et caudale qui battent
    c.save(); c.translate(-R * .74, 0); c.rotate(Math.sin(t * 1.1) * .14);
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(0, -R * .11); c.quadraticCurveTo(-R * .16, -R * .08, -R * .28, -R * .05); c.lineTo(-R * .28, R * .05); c.quadraticCurveTo(-R * .16, R * .08, 0, R * .11); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-R * .24, 0); c.quadraticCurveTo(-R * .26, s * R * .3, -R * .4, s * R * .5); c.quadraticCurveTo(-R * .5, s * R * .44, -R * .52, s * R * .3); c.quadraticCurveTo(-R * .5, s * R * .1, -R * .44, 0); c.closePath(); c.fill(); c.stroke(); }
    if (md) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(-R * .28, s * R * .04); c.lineTo(-R * .42, s * R * .4); c.moveTo(-R * .34, s * R * .03); c.lineTo(-R * .48, s * R * .3); } c.stroke(); }
    c.restore();
    // nageoires-ailerons avec turbines
    for (const s of [-1, 1]) {
      c.save(); c.translate(R * .26, s * R * .34); c.rotate(s * (1.95 + Math.sin(t * 1.3) * .2));
      feather(c, 0, 0, 1, 0, R * .56, R * .24); c.fillStyle = P.body2; c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
      if (md) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw; c.beginPath(); for (const o of [-.04, 0, .04]) { c.moveTo(R * .05, o * R); c.lineTo(R * .44, o * R * .5); } c.stroke(); }
      c.fillStyle = P.dark; circ(c, R * .36, 0, R * .08); c.fill(); c.fillStyle = 'rgba(210,225,220,.12)'; circ(c, R * .36, 0, R * .065); c.fill();
      c.strokeStyle = 'rgba(220,230,226,.45)'; c.lineWidth = R * .014; c.beginPath(); for (let k = 0; k < 3; k++) { const a = t * 14 + k * TAU / 3; c.moveTo(R * .36, 0); c.lineTo(R * .36 + Math.cos(a) * R * .065, Math.sin(a) * R * .065); } c.stroke();
      c.restore();
    }
    // soutes ventrales qui dépassent sous le ventre
    for (const s of [-1, 1]) for (const x of [.12, -.18, -.46]) { c.fillStyle = P.dark; rr(c, x * R - R * .1, s * R * (x < -.3 ? .3 : .39) - R * .065, R * .2, R * .13, R * .03); c.fill(); c.fillStyle = P.glow + (.3 + .3 * pu).toFixed(2) + ')'; c.fillRect(x * R - R * .06, s * R * (x < -.3 ? .3 : .39) + s * R * .035 - R * .008, R * .12, R * .016); }
    // corps fuselé à côtes
    c.fillStyle = P.body2; whale(c, R, 1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.6; c.stroke();
    c.fillStyle = P.body; whale(c, R, .88); c.fill();
    if (md) {
      c.save(); whale(c, R, .88); c.clip(); c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = lw * 1.4; c.beginPath();
      for (let k = -5; k <= 6; k++) { const x = k * R * .13; c.moveTo(x, -R * .5); c.quadraticCurveTo(x + R * .07, 0, x, R * .5); }
      for (const y of [-.2, .2]) { c.moveTo(-R, y * R); c.quadraticCurveTo(0, y * R * 1.15, R, y * R * .6); } c.stroke(); c.restore();
    }
    // échine : écoutilles de soute dorsales
    c.fillStyle = P.plate; for (let k = 0; k < 7; k++) { rr(c, -R * .54 + k * R * .13, -R * .06, R * .1, R * .12, R * .02); c.fill(); }
    if (md) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 7; k++) { const x = -R * .49 + k * R * .13; c.moveTo(x, -R * .06); c.lineTo(x, R * .06); } c.stroke(); }
    // tête : passerelle vitrée, yeux, évent qui souffle
    c.fillStyle = 'rgba(255,214,140,.5)'; for (let k = -2; k <= 2; k++) { c.save(); c.translate(R * .9, k * R * .07); c.rotate(k * .25); c.fillRect(-R * .02, -R * .02, R * .04, R * .04); c.restore(); }
    for (const s of [-1, 1]) { c.fillStyle = P.dark; circ(c, R * .8, s * R * .25, R * .04); c.fill(); c.fillStyle = P.glow + '.9)'; circ(c, R * .8, s * R * .25, R * .022); c.fill(); }
    c.fillStyle = P.body2; circ(c, R * .64, 0, R * .04); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.2; c.stroke();
    if (md && on) for (let k = 0; k < 3; k++) { const f = (t * .35 + k / 3) % 1; c.fillStyle = `rgba(230,236,232,${((1 - f) * .18).toFixed(3)})`; circ(c, R * (.64 - f * .3), R * Math.sin(k * 2 + t) * .03, R * (.03 + f * .1)); c.fill(); }
    // bobine de l'aimant à butin
    c.fillStyle = P.dark; circ(c, -R * .62, 0, R * .12); c.fill(); c.strokeStyle = P.plate; c.lineWidth = lw * 1.4; c.stroke();
    c.strokeStyle = P.acc; c.lineWidth = lw * 1.4; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.moveTo(-R * .62 + Math.cos(a) * R * .06, Math.sin(a) * R * .06); c.lineTo(-R * .62 + Math.cos(a) * R * .11, Math.sin(a) * R * .11); } c.stroke();
    glowCore(c, -R * .62, 0, R * .08, P, t);
    if (md) { c.strokeStyle = P.glow + ((1 - (t * .8 % 1)) * .35).toFixed(2) + ')'; c.lineWidth = lw * 1.5; circ(c, -R * .62, 0, R * (.12 + (t * .8 % 1) * .2)); c.stroke(); }
  };
  // ---------- VIGIE : citadelle-observatoire, dôme radar rotatif, phares, antennes, huit chenilles ----------
  CH_PAINT.vigie = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), l2 = Math.max(2, R * .006), Z = scr(c, R), hi = Z > 80, md = Z > 28;
    const sg = life(u) ? (u._sg = lerp(u._sg || 0, u.sieged ? 1 : 0, .04)) : 0;
    for (const s of [-1, 1]) for (const tx of [-.62, -.2, .22, .62]) treads(c, tx * R - R * .17, s * R * .84 - R * .1, R * .34, R * .2, P, t, R * .3);
    // béquilles de calage (siège) aux quatre coins
    if (sg > .02) for (const [sx, sy] of [[1, -1], [1, 1], [-1, -1], [-1, 1]]) {
      const x0 = sx * R * .5, y0 = sy * R * .5, x1 = sx * R * (.52 + .36 * sg), y1 = sy * R * (.52 + .36 * sg);
      c.strokeStyle = P.dark; c.lineWidth = R * .07; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = P.plate; c.lineWidth = R * .025; c.stroke();
      c.fillStyle = P.body2; ngon(c, 4, R * .09 * (.5 + .5 * sg), Math.PI / 4, x1, y1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke();
      if (md) { ngon(c, 4, R * .06 * (.5 + .5 * sg), Math.PI / 4, x1, y1); hazard(c, x1 - R * .07, y1 - R * .07, x1 + R * .07, y1 + R * .07, 5); }
    }
    // coque octogonale à gradins
    c.fillStyle = P.body2; ngon(c, 8, R * .88, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 4; c.stroke();
    c.fillStyle = P.dark; c.beginPath(); c.moveTo(R * .8, -R * .3); c.lineTo(R * .98, 0); c.lineTo(R * .8, R * .3); c.closePath(); c.fill();
    if (md) { c.beginPath(); c.moveTo(R * .82, -R * .26); c.lineTo(R * .96, 0); c.lineTo(R * .82, R * .26); c.closePath(); hazard(c, R * .8, -R * .3, R * 1, R * .3, 12); }
    c.fillStyle = P.body; ngon(c, 8, R * .76, Math.PI / 8); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = l2 * 2; c.stroke();
    if (md) {
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = l2 * 1.5; c.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * TAU / 8; c.moveTo(Math.cos(a) * R * .44, Math.sin(a) * R * .44); c.lineTo(Math.cos(a) * R * .76, Math.sin(a) * R * .76); } c.stroke();
      c.fillStyle = 'rgba(255,214,140,.35)'; for (let k = 0; k < 32; k++) { const a = (k + .5) / 32 * TAU; if (k % 4 === 0) continue; c.fillRect(Math.cos(a) * R * .7 - R * .012, Math.sin(a) * R * .7 - R * .012, R * .024, R * .024); }
    }
    c.fillStyle = P.body2; ngon(c, 8, R * .44, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 3; c.stroke();
    // antennes en treillis aux angles arrière et latéraux, feux rouges clignotants
    for (const [x, y] of [[-.6, -.36], [-.6, .36], [.36, -.68], [.36, .68]]) {
      c.fillStyle = P.dark; ngon(c, 3, R * .045, t * .1, x * R, y * R); c.fill();
      if (hi) { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = l2; c.beginPath(); for (const [dx, dy] of [[.08, 0], [-.06, .06], [-.06, -.06]]) { c.moveTo(x * R, y * R); c.lineTo((x + dx) * R, (y + dy) * R); } c.stroke(); }
      const lit = on && Math.sin(t * 2.5 + x * 4 + y * 3) > .4; c.fillStyle = lit ? '#ff3a30' : '#4a1a18'; circ(c, x * R, y * R, R * .015); c.fill(); if (lit && md) glow(c, x * R, y * R, R * .05, 'rgba(255,58,48,', .5);
    }
    // phares avant : faisceaux qui balaient
    for (const s of [-1, 1]) {
      const x = R * .7, y = s * R * .4, a = s * (.28 + .3 * Math.sin(t * .6 + s));
      if (md && on) { c.save(); c.translate(x, y); c.rotate(a); const g = c.createLinearGradient(0, 0, R * .85, 0); g.addColorStop(0, 'rgba(255,246,214,.28)'); g.addColorStop(1, 'rgba(255,246,214,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -R * .03); c.lineTo(R * .85, -R * .2); c.lineTo(R * .85, R * .2); c.lineTo(0, R * .03); c.closePath(); c.fill(); c.restore(); }
      c.fillStyle = P.dark; circ(c, x, y, R * .06); c.fill(); c.strokeStyle = P.plate; c.lineWidth = l2 * 2; c.stroke(); c.fillStyle = on ? '#fff6d6' : P.body2; circ(c, x + Math.cos(a) * R * .02, y + Math.sin(a) * R * .02, R * .03); c.fill();
    }
    // grand dôme radar : coupole, antenne parabolique qui tourne, balayage
    c.fillStyle = P.dark; circ(c, 0, 0, R * .33); c.fill();
    { const g = c.createRadialGradient(-R * .1, -R * .1, R * .02, 0, 0, R * .3); g.addColorStop(0, P.plate); g.addColorStop(1, P.body2); c.fillStyle = g; circ(c, 0, 0, R * .3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2.5; c.stroke(); }
    if (md) { c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = l2; c.beginPath(); for (const k of [.4, .72]) { c.moveTo(R * .3 * k, 0); c.arc(0, 0, R * .3 * k, 0, TAU); } for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; c.moveTo(Math.cos(a) * R * .3, Math.sin(a) * R * .3); c.lineTo(-Math.cos(a) * R * .3, -Math.sin(a) * R * .3); } c.stroke(); }
    const ra = t * .7;
    c.save(); c.rotate(ra);
    if (md) { c.fillStyle = P.glow + '.16)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R * .3, -.9, 0); c.closePath(); c.fill(); }
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(-R * .02, -R * .27); c.quadraticCurveTo(R * .1, 0, -R * .02, R * .27); c.lineTo(-R * .07, R * .26); c.quadraticCurveTo(R * .04, 0, -R * .07, -R * .26); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke();
    c.strokeStyle = P.dark; c.lineWidth = R * .02; c.beginPath(); c.moveTo(R * .03, 0); c.lineTo(R * .16, 0); c.stroke(); c.fillStyle = P.acc; circ(c, R * .16, 0, R * .022); c.fill();
    c.restore();
    glowCore(c, -R * .05, 0, R * .06, P, t);
  };

  // ---------- TITANIDE : hexapode titanesque, torse cuirassé, pieds-pylônes ----------
  const TI_L = [], TI_G = [];
  for (let k = 0; k < 6; k++) { const s = k < 3 ? -1 : 1, i = k % 3; TI_L.push([.34 - i * .36, s * .3, .62 - i * .6, s * 1.0]); TI_G.push((i + (s > 0 ? 1 : 0)) % 2); }
  CH_PAINT.titanide = (c, r, P, t, mv, u) => {
    const on = !(u && u.dead);
    const R = r, lw = Math.max(1.5, R * .01), l2 = Math.max(2, R * .006), Z = scr(c, R), hi = Z > 80, md = Z > 28;
    gait(u, TI_L, R, t, mv, { groups: TI_G, stride: .3, dur: .5, f: 2.4, amp: .2, thud: giantThud }).forEach((g, k) => {
      reach(g, R * .9); const i = k % 3, side = (g.hy < 0 ? 1 : -1) * (i === 2 ? -1 : 1), [kx, ky] = knee(g.hx, g.hy, g.fx, g.fy, R * .44, R * .44, side), lf = 1 + g.lift * .2;
      PT[0] = g.hx; PT[1] = g.hy; PT[2] = kx; PT[3] = ky; limb(c, PT, 2, R * .2, R * .15, P.body2, P.dark, l2 * 5);
      PT[0] = kx; PT[1] = ky; PT[2] = g.fx; PT[3] = g.fy; limb(c, PT, 2, R * .14, R * .1, P.body, P.dark, l2 * 5);
      if (md) { c.strokeStyle = P.plate; c.lineWidth = R * .03; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(kx, ky); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = l2; c.beginPath(); for (let j = 1; j < 4; j++) { const f = j / 4, x = kx + (g.fx - kx) * f, y = ky + (g.fy - ky) * f, a = Math.atan2(g.fy - ky, g.fx - kx) + Math.PI / 2; c.moveTo(x - Math.cos(a) * R * .055, y - Math.sin(a) * R * .055); c.lineTo(x + Math.cos(a) * R * .055, y + Math.sin(a) * R * .055); } c.stroke(); }
      c.fillStyle = P.plate; circ(c, kx, ky, R * .085); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke(); c.fillStyle = P.dark; circ(c, kx, ky, R * .035); c.fill();
      if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; ngon(c, 8, R * .12, Math.PI / 8, g.fx + R * .05 * g.lift, g.fy + R * .08 * g.lift); c.fill(); }
      c.fillStyle = P.body2; ngon(c, 8, R * .12 * lf, Math.PI / 8, g.fx, g.fy); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2.5; c.stroke();
      c.fillStyle = P.plate; ngon(c, 8, R * .07 * lf, Math.PI / 8, g.fx, g.fy); c.fill();
      if (md) { c.fillStyle = P.dark; c.beginPath(); for (let j = 0; j < 8; j++) { const a = j / 8 * TAU, x = g.fx + Math.cos(a) * R * .1 * lf, y = g.fy + Math.sin(a) * R * .1 * lf; c.moveTo(x + R * .012, y); c.arc(x, y, R * .012, 0, TAU); } c.fill(); }
    });
    // abdomen segmenté
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .32, 0, R * .48, R * .36, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 3.5; c.stroke();
    c.fillStyle = P.body; for (let k = 0; k < 4; k++) { const x = -R * .7 + k * R * .2; c.beginPath(); c.ellipse(x + R * .1, 0, R * .1, R * (.26 + (k === 0 ? -.06 : 0)), 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 1.5; c.stroke(); }
    // cheminées dorsales
    for (const s of [-1, 1]) { c.fillStyle = P.dark; circ(c, -R * .72, s * R * .12, R * .045); c.fill(); c.fillStyle = on ? `rgba(255,${(130 + 60 * Math.sin(t * 4 + s)) | 0},60,.6)` : P.dark; circ(c, -R * .72, s * R * .12, R * .022); c.fill(); }
    // torse cuirassé : plastron à lames, épaulières
    c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .14, 0, R * .34, R * .42, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 3.5; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * .64, 0); c.quadraticCurveTo(R * .5, -R * .3, R * .16, -R * .3); c.lineTo(R * .1, 0); c.lineTo(R * .16, R * .3); c.quadraticCurveTo(R * .5, R * .3, R * .64, 0); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2.5; c.stroke();
    if (md) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = l2 * 1.5; c.beginPath(); for (let k = 1; k < 5; k++) { const x = R * (.16 + k * .09); c.moveTo(x, -R * .3 * (1 - k * .14)); c.quadraticCurveTo(x + R * .05, 0, x, R * .3 * (1 - k * .14)); } c.moveTo(R * .12, 0); c.lineTo(R * .62, 0); c.stroke(); }
    for (const s of [-1, 1]) { c.fillStyle = P.body2; c.beginPath(); c.ellipse(R * .3, s * R * .38, R * .2, R * .14, s * .3, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2.5; c.stroke(); if (md) { c.strokeStyle = P.plate; c.lineWidth = l2 * 1.5; c.beginPath(); c.ellipse(R * .3, s * R * .38, R * .14, R * .09, s * .3, 0, TAU); c.stroke(); } }
    // tête casquée à cimier, visière lumineuse
    c.fillStyle = P.dark; circ(c, R * .72, 0, R * .11); c.fill();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .73, 0, R * .1, R * .085, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke();
    c.fillStyle = P.acc; rr(c, R * .62, -R * .018, R * .2, R * .036, R * .015); c.fill();
    c.fillStyle = P.glow + '.95)'; c.beginPath(); c.arc(R * .73, 0, R * .075, -.7, .7); c.lineTo(R * .73 + Math.cos(.7) * R * .055, Math.sin(.7) * R * .055); c.arc(R * .73, 0, R * .055, .7, -.7, true); c.closePath(); c.fill();
    glowCore(c, -R * .02, 0, R * .08, P, t);
  };
  // ---------- NÉBULEUSE : anneau de nacelles autour d'un cœur gazeux qui tourbillonne ----------
  const NB_A = [-.3927, .3927, -1.1781, 1.1781, -1.9635, 1.9635, -2.7489, 2.7489];
  CH_PAINT.nebuleuse = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), l2 = Math.max(2, R * .006), Z = scr(c, R), hi = Z > 80, md = Z > 28, pu = .5 + .5 * Math.sin(t * 1.6);
    if (md) glow(c, 0, 0, R * 1.02, P.glow, (.06 + .03 * pu).toFixed(3));
    // anneau extérieur et ses feux qui courent
    c.strokeStyle = P.dark; c.lineWidth = R * .07; circ(c, 0, 0, R * .7); c.stroke();
    c.strokeStyle = P.body2; c.lineWidth = R * .04; c.stroke(); c.strokeStyle = P.plate; c.lineWidth = l2 * 1.2; circ(c, 0, 0, R * .72); c.stroke();
    if (md) for (let q = 0; q < 2; q++) { c.fillStyle = q ? P.acc : P.glow + '.3)'; c.beginPath(); for (let k = 0; k < 32; k++) { const on = (k + Math.floor(t * 6)) % 4 === 0; if (on !== !!q) continue; const a = k / 32 * TAU - t * .25, x = Math.cos(a) * R * .7, y = Math.sin(a) * R * .7, rad = R * (on ? .012 : .008); c.moveTo(x + rad, y); c.arc(x, y, rad, 0, TAU); } c.fill(); }
    // passerelle de commandement vers l'avant
    c.strokeStyle = P.dark; c.lineWidth = R * .05; c.beginPath(); c.moveTo(R * .3, 0); c.lineTo(R * .86, 0); c.stroke(); c.strokeStyle = P.body2; c.lineWidth = R * .025; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(R * 1.0, 0); c.lineTo(R * .88, -R * .07); c.lineTo(R * .76, -R * .06); c.lineTo(R * .76, R * .06); c.lineTo(R * .88, R * .07); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke();
    c.fillStyle = P.acc; for (let k = 0; k < 3; k++) c.fillRect(R * (.8 + k * .05), -R * .012, R * .025, R * .024);
    // bras en treillis jusqu'aux nacelles
    for (const a of NB_A) {
      const ca = Math.cos(a), sa = Math.sin(a), nx = -sa * R * .028, ny = ca * R * .028;
      c.strokeStyle = P.dark; c.lineWidth = R * .07; c.beginPath(); c.moveTo(ca * R * .3, sa * R * .3); c.lineTo(ca * R * .62, sa * R * .62); c.stroke(); c.strokeStyle = P.body2; c.lineWidth = R * .03; c.stroke();
      if (hi) { c.strokeStyle = P.body2; c.lineWidth = l2 * 1.5; c.beginPath(); for (let k = 0; k < 3; k++) { const f0 = .3 + k * .107, f1 = f0 + .107, o = k & 1 ? 1 : -1; c.moveTo(ca * R * f0 + nx * o, sa * R * f0 + ny * o); c.lineTo(ca * R * f1 - nx * o, sa * R * f1 - ny * o); } c.stroke(); }
    }
    // nacelles : capsules tangentielles, hublots, propulseurs
    NB_A.forEach((a, i) => {
      c.save(); c.translate(Math.cos(a) * R * .68, Math.sin(a) * R * .68); c.rotate(a);
      c.fillStyle = P.dark; rr(c, R * .08, -R * .06, R * .06, R * .12, R * .02); c.fill();
      if (md) { c.fillStyle = P.glow + (.4 + .3 * Math.sin(t * 6 + i)).toFixed(2) + ')'; circ(c, R * .15, 0, R * .035); c.fill(); }
      c.fillStyle = P.dark; rr(c, -R * .115, -R * .165, R * .23, R * .33, R * .09); c.fill(); c.fillStyle = P.body; rr(c, -R * .1, -R * .15, R * .2, R * .3, R * .08); c.fill();
      c.fillStyle = P.plate; rr(c, -R * .06, -R * .11, R * .07, R * .22, R * .03); c.fill();
      if (md) { c.fillStyle = 'rgba(255,214,140,.5)'; c.beginPath(); for (let k = -2; k <= 2; k++) c.rect(R * .03, k * R * .045 - R * .01, R * .03, R * .02); c.fill(); }
      c.restore();
    });
    // cœur gazeux : enceinte de confinement, gaz lumineux qui tourbillonne
    c.fillStyle = P.dark; circ(c, 0, 0, R * .33); c.fill(); c.strokeStyle = P.body2; c.lineWidth = R * .03; circ(c, 0, 0, R * .31); c.stroke();
    for (const s of [-1, 1]) { c.fillStyle = P.body2; rr(c, -R * .06, s * R * .37 - R * .05, R * .12, R * .1, R * .02); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 1.5; c.stroke(); }
    { const g = c.createRadialGradient(0, 0, 0, 0, 0, R * .29); g.addColorStop(0, '#ffffff'); g.addColorStop(.25, P.glow + (.85 + .1 * pu).toFixed(2) + ')'); g.addColorStop(.7, P.glow + '.35)'); g.addColorStop(1, P.glow + '.08)'); c.fillStyle = g; circ(c, 0, 0, R * .29); c.fill(); }
    if (md) {
      c.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const b = k / 4 * TAU + t * .9; c.beginPath();
        for (let j = 0; j <= 10; j++) { const f = j / 10, rr2 = R * (.04 + f * .24), a = b + f * 3.2; j ? c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2) : c.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
        c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = R * .035; c.stroke(); c.strokeStyle = P.glow + '.55)'; c.lineWidth = R * .014; c.stroke();
      }
    }
    c.fillStyle = P.acc; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.PI / 8; circ(c, Math.cos(a) * R * .31, Math.sin(a) * R * .31, R * .018); c.fill(); }
  };

  // ---------- CARAVANSÉRAIL : ville-marché chenillée, cour, entrepôts, conteneurs, grues, portes ----------
  const CV_T = [[.72, -.58, .12], [.72, .58, .12], [-.72, -.58, .12], [-.72, .58, .12], [0, -.62, .1], [0, .62, .1], [-.84, -.22, .08], [-.84, .22, .08]];
  const CV_COL = ['#5a4a32', '#4a5560', '#5c3d34', '#3f5a48', '#6a5a3a'], CV_AWN = ['#a8432e', '#d0a040', '#3f7a8a', '#7a4a8a', '#5f8a3a'];
  CH_PAINT.caravanserail = (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), l2 = Math.max(2, R * .006), Z = scr(c, R), hi = Z > 80, md = Z > 28;
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) treads(c, -R * .82 + k * R * .34, s * R * .86 - R * .1, R * .3, R * .2, P, t, R * .25);
    // coque et proue
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .94, -R * .5); c.lineTo(R * .94, R * .5); c.lineTo(R * .8, R * .78); c.lineTo(-R * .86, R * .78); c.lineTo(-R * .96, R * .62); c.lineTo(-R * .96, -R * .62); c.lineTo(-R * .86, -R * .78); c.lineTo(R * .8, -R * .78); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 4; c.stroke();
    c.fillStyle = P.dark; c.beginPath(); c.moveTo(R * .94, -R * .5); c.lineTo(R * 1.04, 0); c.lineTo(R * .94, R * .5); c.closePath(); c.fill();
    if (md) { c.beginPath(); c.moveTo(R * .94, -R * .46); c.lineTo(R * 1.02, 0); c.lineTo(R * .94, R * .46); c.closePath(); hazard(c, R * .92, -R * .5, R * 1.05, R * .5, 14); }
    // murs d'enceinte à arcades
    c.fillStyle = P.plate; rr(c, -R * .9, -R * .72, R * 1.78, R * 1.44, R * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke();
    c.fillStyle = P.body; rr(c, -R * .84, -R * .66, R * 1.66, R * 1.32, R * .04); c.fill();
    if (md) { c.fillStyle = P.dark; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 22; k++) { const x = -R * .8 + k * R * .075 + R * .03; c.moveTo(x + R * .018, s * R * .69); c.arc(x, s * R * .69, R * .018, 0, TAU); } c.fill(); }
    // entrepôts à toit à deux pans le long des flancs
    for (const s of [-1, 1]) for (const [x0, w] of [[.12, .46], [-.6, .46]]) {
      const x = x0 * R, y = s > 0 ? R * .4 : -R * .62, h = R * .22, W = w * R;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + R * .02, y + R * .025, W, h);
      c.fillStyle = P.body2; c.fillRect(x, y, W, h); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y + h / 2, W, h / 2);
      c.strokeStyle = P.dark; c.lineWidth = l2 * 1.5; c.strokeRect(x, y, W, h); c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + W, y + h / 2); c.stroke();
      if (hi) { c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = l2; c.beginPath(); for (let k = 1; k < 4; k++) { c.moveTo(x + k * W / 4, y); c.lineTo(x + k * W / 4, y + h); } c.stroke(); }
    }
    // parc à conteneurs empilés à l'avant, grue-portique qui va et vient
    for (let k = 0; k < 2; k++) {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if (k && hash2(i + 3, j + 5, 23) <= .55) continue; c.rect(R * (.32 + i * .12) + R * .015 * (k + 1), R * (-.3 + j * .15) + R * .02 * (k + 1), R * .1, R * .12); } c.fill();
      for (let q = 0; q < 5; q++) { c.fillStyle = CV_COL[q]; c.beginPath(); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if ((k && hash2(i + 3, j + 5, 23) <= .55) || (i * 3 + j + k * 2) % 5 !== q) continue; c.rect(R * (.32 + i * .12) - k * R * .008, R * (-.3 + j * .15) - k * R * .012, R * .1, R * .12); } c.fill(); }
      if (hi) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = l2; c.beginPath(); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if (k && hash2(i + 3, j + 5, 23) <= .55) continue; const x = R * (.32 + i * .12) - k * R * .008, y = R * (-.3 + j * .15) - k * R * .012; c.moveTo(x + R * .05, y); c.lineTo(x + R * .05, y + R * .12); } c.stroke(); }
    }
    { const gx = R * (.5 + Math.sin(t * .35) * .18); c.strokeStyle = '#e0b030'; c.lineWidth = R * .03; c.beginPath(); c.moveTo(gx, -R * .38); c.lineTo(gx, R * .38); c.stroke(); c.fillStyle = '#1e1c18'; for (const y of [-.38, .38]) { c.fillRect(gx - R * .04, y * R - R * .03, R * .08, R * .06); } const ty = Math.sin(t * .9) * R * .3; c.fillStyle = P.dark; rr(c, gx - R * .045, ty - R * .04, R * .09, R * .08, R * .015); c.fill(); c.fillStyle = '#e0b030'; c.fillRect(gx - R * .02, ty - R * .01, R * .04, R * .02); }
    // cour centrale du marché : pavés, étals à auvents rayés, fontaine lumineuse
    c.fillStyle = P.body2; rr(c, -R * .62, -R * .32, R * .84, R * .64, R * .03); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 1.5; c.stroke();
    if (hi) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = l2; c.beginPath(); for (let k = 1; k < 8; k++) { c.moveTo(-R * .62 + k * R * .105, -R * .32); c.lineTo(-R * .62 + k * R * .105, R * .32); } for (let k = 1; k < 6; k++) { c.moveTo(-R * .62, -R * .32 + k * R * .107); c.lineTo(R * .22, -R * .32 + k * R * .107); } c.stroke(); }
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { if (i === 2 || i === 3) continue; c.fillStyle = CV_AWN[(i + (s > 0 ? 6 : 0)) % 5]; c.fillRect(R * (-.56 + i * .13), s * R * .22 - R * .05, R * .1, R * .1); }
    c.beginPath(); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { if (i === 2 || i === 3) continue; const x = R * (-.56 + i * .13), y = s * R * .22; if (md) for (let k = 0; k < 3; k++) c.rect(x + k * R * .035, y - R * .05, R * .016, R * .1); } c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = l2; c.beginPath(); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { if (i === 2 || i === 3) continue; c.rect(R * (-.56 + i * .13), s * R * .22 - R * .05, R * .1, R * .1); } c.stroke();
    c.fillStyle = P.plate; ngon(c, 8, R * .1, Math.PI / 8, -R * .2, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2; c.stroke();
    glowCore(c, -R * .2, 0, R * .08, P, t);
    if (md) { const f = (t * .6) % 1; c.strokeStyle = P.glow + ((1 - f) * .45).toFixed(2) + ')'; c.lineWidth = l2 * 1.5; circ(c, -R * .2, 0, R * (.08 + f * .1)); c.stroke(); }
    // portes de sortie des robots à l'arrière (s'ouvrent au cycle de fabrication), rampe
    const op = fabDoor(u);
    c.fillStyle = P.dark; c.fillRect(-R * .98, -R * .14, R * .1, R * .28);
    c.fillStyle = P.glow + (.25 + op * .65).toFixed(2) + ')'; c.fillRect(-R * .98, -R * .13 * op, R * .06, R * .26 * op);
    if (op > .02) { c.fillStyle = P.body2; c.beginPath(); c.moveTo(-R * .98, -R * .13); c.lineTo(-R * (.98 + .12 * op), -R * .11); c.lineTo(-R * (.98 + .12 * op), R * .11); c.lineTo(-R * .98, R * .13); c.closePath(); c.fill(); }
    if (md) { c.strokeStyle = '#e0b030'; c.lineWidth = l2 * 2; c.beginPath(); c.moveTo(-R * .9, -R * .17); c.lineTo(-R * .9, R * .17); c.stroke(); }
    // tours d'angle, de flanc et de porte (les affûts reposent dessus)
    c.beginPath(); for (const [x, y, rad] of CV_T) { c.moveTo((x + rad) * R, y * R); c.arc(x * R, y * R, rad * R, 0, TAU); } c.fillStyle = P.body2; c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 2.5; c.stroke();
    c.beginPath(); for (const [x, y, rad] of CV_T) { c.moveTo((x + rad * .78) * R, y * R); c.arc(x * R, y * R, rad * R * .78, 0, TAU); } c.strokeStyle = P.plate; c.lineWidth = l2 * 1.5; c.stroke();
    // grue à flèche qui pivote au-dessus du parc
    { const gx = R * .3, gy = -R * .44, a = .6 + Math.sin(t * .4) * .8, L = R * .42, ex = gx + Math.cos(a) * L, ey = gy + Math.sin(a) * L;
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = R * .03; c.beginPath(); c.moveTo(gx + R * .03, gy + R * .05); c.lineTo(ex + R * .03, ey + R * .05); c.stroke();
      c.strokeStyle = '#e0b030'; c.lineWidth = R * .022; c.beginPath(); c.moveTo(gx - Math.cos(a) * R * .1, gy - Math.sin(a) * R * .1); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = P.dark; circ(c, gx, gy, R * .04); c.fill(); c.fillStyle = '#1e1c18'; circ(c, ex, ey, R * .018); c.fill(); }
  };
})();
