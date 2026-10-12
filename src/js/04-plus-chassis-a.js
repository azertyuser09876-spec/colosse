// Châssis supplémentaires de la 3.1 (fiche « chassis-a ») : dix-sept robots des rangs 1 à 5.
// Données, affûts, peintres procéduraux animés et recherches. Les perks (cloak, shield, aura, ram, shieldwall, radar, pack,
// magnet, rage, flak, dodge, siege, stomp) sont codés dans le fichier de l'équipement ; « regen » et « cloak » par le moteur.
(() => {
  // ================= DONNÉES =================
  Object.assign(CHASSIS, {
    taupe: { n: TL('Taupe'), tier: 1, hp: 95, r: 12, spd: 150, slots: 1, wsize: 1, cargo: 5, cmd: 1, armor: .05, perk: 'cloak', cost: { scrap: 18, circuits: 3 }, d: TL('Robot fouisseur : il avance à moitié enterré, et l\'ennemi ne le repère que tout près.') },
    moucheron: { n: TL('Moucheron'), tier: 1, hp: 34, r: 8, spd: 270, slots: 1, wsize: 1, cargo: 0, cmd: .5, fly: true, cost: { scrap: 12, circuits: 3 }, d: TL('Micro-drone volant presque gratuit : un demi-point de commandement, à lâcher en nuée.') },
    sanglier: { n: TL('Sanglier'), tier: 2, hp: 300, r: 18, spd: 190, slots: 1, wsize: 1, cargo: 6, cmd: 2, armor: .15, crush: 2, perk: 'ram', cost: { scrap: 65, alloy: 16, circuits: 8 }, d: TL('Petit chenillé trapu armé de défenses d\'acier : il charge et blesse ce qu\'il percute.') },
    tatou: { n: TL('Tatou'), tier: 2, hp: 230, r: 17, spd: 125, slots: 2, wsize: 1, cargo: 8, cmd: 2, armor: .1, perk: 'shield', cost: { scrap: 60, alloy: 14, circuits: 12 }, d: TL('Marcheur cuirassé à deux affûts légers, protégé par un bouclier qui se recharge.') },
    luciole: { n: TL('Luciole'), tier: 2, hp: 120, r: 14, spd: 230, slots: 1, wsize: 1, cargo: 0, cmd: 2, fly: true, armor: .05, perk: 'aura', cost: { scrap: 45, alloy: 8, circuits: 16 }, d: TL('Drone infirmier : il répare peu à peu les robots alliés autour de lui.') },
    crabe: { n: TL('Crabe'), tier: 3, hp: 700, r: 26, spd: 120, slots: 2, wsize: 2, cargo: 10, cmd: 3, armor: .3, crush: 1, perk: 'shieldwall', cost: { scrap: 165, alloy: 65, circuits: 22 }, d: TL('Large carapace et deux pinces armées : il encaisse beaucoup moins de dégâts de face.') },
    heron: { n: TL('Héron'), tier: 3, hp: 360, r: 24, spd: 175, slots: 2, wsize: 2, cargo: 0, cmd: 3, fly: true, armor: .08, sight: 2.5, perk: 'radar', cost: { scrap: 135, alloy: 35, circuits: 45, crystals: 12 }, d: TL('Aéronef de reconnaissance : il voit très loin et marque les ennemis pour toute la flotte.') },
    chacal: { n: TL('Chacal'), tier: 3, hp: 420, r: 21, spd: 215, slots: 2, wsize: 2, cargo: 8, cmd: 3, armor: .1, crush: 1, perk: 'pack', cost: { scrap: 130, alloy: 35, circuits: 28, crystals: 8 }, d: TL('Chasseur de meute rapide : plus il a de congénères autour de lui, plus il frappe fort.') },
    chameau: { n: TL('Chameau'), tier: 3, hp: 600, r: 26, spd: 130, slots: 1, wsize: 2, cargo: 120, cmd: 3, armor: .2, crush: 1, perk: 'magnet', cost: { scrap: 150, alloy: 45, circuits: 18 }, d: TL('Porteur à longues pattes : une soute énorme et un aimant qui attire le butin.') },
    ours: { n: TL('Ours'), tier: 4, hp: 1600, r: 36, spd: 120, slots: 2, wsize: 2, cargo: 15, cmd: 5, armor: .3, crush: 2, perk: 'rage', cost: { scrap: 300, alloy: 120, circuits: 45, crystals: 25, cores: 1 }, d: TL('Bipède massif aux bras-canons : il tire bien plus vite quand il est gravement blessé.') },
    bourdon: { n: TL('Bourdon'), tier: 4, hp: 1200, r: 34, spd: 140, slots: 3, wsize: 2, cargo: 20, cmd: 4, fly: true, armor: .15, perk: 'flak', cost: { scrap: 280, alloy: 90, circuits: 80, crystals: 30, cores: 1 }, d: TL('Gros volant à quatre rotors carénés : il abat les missiles ennemis qui passent à sa portée.') },
    mangouste: { n: TL('Mangouste'), tier: 4, hp: 900, r: 28, spd: 220, slots: 2, wsize: 2, cargo: 8, cmd: 4, armor: .12, crush: 1, perk: 'dodge', cost: { scrap: 240, alloy: 80, circuits: 50, crystals: 25, cores: 1 }, d: TL('Prédateur souple et très rapide : il esquive une partie des tirs.') },
    fourgon: { n: TL('Fourgon'), tier: 4, hp: 1400, r: 36, spd: 125, slots: 2, wsize: 2, cargo: 70, cmd: 5, armor: .25, crush: 2, fab: { tier: 1, cap: 2, t: 16 }, cost: { scrap: 340, alloy: 120, circuits: 70, crystals: 30, cores: 2 }, d: TL('Camion blindé : sa soute assemble en raid de petits robots de rang 1, d\'après vos plans.') },
    donjon: { n: TL('Donjon'), tier: 5, hp: 4200, r: 66, spd: 70, slots: 4, wsize: 3, cargo: 60, cmd: 9, armor: .38, crush: 3, perk: 'siege', cost: { scrap: 880, alloy: 290, circuits: 110, crystals: 80, cores: 5 }, d: TL('Bunker crénelé sur quatre chenilles : à l\'arrêt, il se cale et gagne en portée et en dégâts.') },
    minotaure: { n: TL('Minotaure'), tier: 5, hp: 3600, r: 60, spd: 115, slots: 3, wsize: 3, cargo: 30, cmd: 8, armor: .3, crush: 3, perk: 'stomp', cost: { scrap: 720, alloy: 230, circuits: 100, crystals: 70, cores: 4 }, d: TL('Bipède cornu aux sabots énormes : ses pas assomment les ennemis autour de lui.') },
    chimere: { n: TL('Chimère'), tier: 5, hp: 3300, r: 64, spd: 105, slots: 4, wsize: 3, cargo: 40, cmd: 8, armor: .25, crush: 3, perk: 'regen', cost: { scrap: 760, alloy: 210, circuits: 120, crystals: 115, cores: 5 }, d: TL('Quadrupède hybride : une tête de lion, une queue-serpent armée, et il se répare tout seul.') },
    condor: { n: TL('Condor'), tier: 5, hp: 2400, r: 58, spd: 150, slots: 3, wsize: 3, cargo: 30, cmd: 8, fly: true, armor: .2, perk: 'dodge', cost: { scrap: 700, alloy: 200, circuits: 145, crystals: 90, cores: 4 }, d: TL('Grand rapace volant aux plumes-lames : il esquive les tirs et porte une arme lourde.') },
  });
  // affûts (en rayons, nez vers +x) : les premiers sont les principaux, les paires gauche/droite se suivent
  Object.assign(MOUNTS, {
    taupe: [[-.24, 0]], moucheron: [[-.3, 0]], sanglier: [[-.2, 0]], tatou: [[.18, -.33], [.18, .33]], luciole: [[.1, 0]],
    crabe: [[.7, -.6], [.7, .6]], heron: [[.12, 0], [-.36, 0]], chacal: [[.1, 0], [-.42, 0]], chameau: [[-.2, 0]],
    ours: [[.26, -.62], [.26, .62]], bourdon: [[.22, 0], [-.38, -.2], [-.38, .2]], mangouste: [[.12, -.3], [.12, .3]], fourgon: [[.5, 0], [-.36, 0]],
    donjon: [[.4, -.36], [.4, .36], [-.42, -.36], [-.42, .36]], minotaure: [[-.14, 0], [.19, -.62], [.19, .62]],
    chimere: [[.14, 0], [-.26, -.3], [-.26, .3], [-.96, 0]], condor: [[.24, 0], [-.04, -.52], [-.04, .52]],
  });
  Object.assign(SLOT_LAYOUT, {
    taupe: [1], moucheron: [1], sanglier: [1], tatou: [1, 1], luciole: [1], crabe: [2, 2], heron: [2, 1], chacal: [2, 1], chameau: [2],
    ours: [2, 2], bourdon: [2, 1, 1], mangouste: [2, 2], fourgon: [2, 1], donjon: [3, 3, 2, 2], minotaure: [3, 2, 2], chimere: [3, 2, 2, 1], condor: [3, 2, 2],
  });
  Object.assign(MSCALE, {
    taupe: .8, moucheron: .7, sanglier: 1.05, tatou: 1, luciole: 1, crabe: 1.35, heron: 1.3, chacal: 1.3, chameau: 1.3,
    ours: 1.7, bourdon: 1.7, mangouste: 1.6, fourgon: 1.6, donjon: 2.6, minotaure: 2.5, chimere: 2.5, condor: 2.4,
  });
  Object.assign(PREV_EXT, {
    taupe: 1.15, moucheron: 1.5, sanglier: 1.25, tatou: 1.25, luciole: 1.3, crabe: 1.45, heron: 1.35, chacal: 1.3, chameau: 1.25,
    ours: 1.2, bourdon: 1.25, mangouste: 1.5, fourgon: 1.1, donjon: 1.2, minotaure: 1.15, chimere: 1.3, condor: 1.45,
  });
  // traces au sol (table déclarée plus loin, dans 17-environnement.js)
  LATE.push(() => { Object.assign(TRACK, { sanglier: 'tread', donjon: 'tread', fourgon: 'wheel', chameau: 'foot' }); });

  // ================= RECHERCHES =================
  [
    { id: 'c_taupe', lab: 1, n: TL('Châssis Taupe'), req: 'c_scout', cost: { data: 4, scrap: 25 }, d: TL('Fouisseur que l\'ennemi repère tard.'), fam: 'leger' },
    { id: 'c_moucheron', lab: 1, n: TL('Châssis Moucheron'), root: 'x_drone', cost: { data: 3, circuits: 6 }, d: TL('Micro-drone volant à un demi-point de commandement.'), fam: 'volant' },
    { id: 'c_sanglier', lab: 2, n: TL('Châssis Sanglier'), req: 'c_sentry', cost: { data: 10, alloy: 16 }, d: TL('Petit chenillé qui charge l\'ennemi.'), fam: 'chenille' },
    { id: 'c_tatou', lab: 2, n: TL('Châssis Tatou'), root: 'x_crawler', cost: { data: 10, crystals: 8 }, d: TL('Marcheur cuirassé à bouclier.'), fam: 'marcheur' },
    { id: 'c_luciole', lab: 2, n: TL('Châssis Luciole'), root: 'x_drone', cost: { data: 12, crystals: 10 }, d: TL('Drone volant qui répare les alliés.'), fam: 'volant' },
    { id: 'c_crabe', lab: 3, n: TL('Châssis Crabe'), req: 'c_strider', cost: { data: 28, alloy: 35 }, d: TL('Marcheur à pinces, très solide de face.'), fam: 'marcheur' },
    { id: 'c_heron', lab: 3, n: TL('Châssis Héron'), req: 'c_gunship', cost: { data: 26, circuits: 30 }, d: TL('Volant de reconnaissance qui marque les ennemis.'), fam: 'volant' },
    { id: 'c_chacal', lab: 3, n: TL('Châssis Chacal'), req: 'c_mantis', cost: { data: 24, alloy: 25 }, d: TL('Quadrupède rapide qui chasse en meute.'), fam: 'leger' },
    { id: 'c_chameau', lab: 2, n: TL('Châssis Chameau'), req: 'c_mule', cost: { data: 16, scrap: 60 }, d: TL('Porteur à grande soute qui attire le butin.'), fam: 'transport' },
    { id: 'c_ours', lab: 3, n: TL('Châssis Ours'), req: 'c_crabe', cost: { data: 40, alloy: 50, cores: 1 }, d: TL('Bipède massif qui s\'enrage quand il est blessé.'), fam: 'marcheur' },
    { id: 'c_bourdon', lab: 4, n: TL('Châssis Bourdon'), req: 'c_heron', cost: { data: 50, circuits: 60, cores: 1 }, d: TL('Volant lourd qui abat les missiles.'), fam: 'volant' },
    { id: 'c_mangouste', lab: 4, n: TL('Châssis Mangouste'), req: 'c_chacal', cost: { data: 45, alloy: 45, cores: 1 }, d: TL('Chasseur très rapide qui esquive les tirs.'), fam: 'leger' },
    { id: 'c_fourgon', lab: 3, n: TL('Châssis Fourgon'), req: 'c_chameau', cost: { data: 40, alloy: 45, cores: 1 }, d: TL('Camion blindé qui fabrique de petits robots en raid.'), fam: 'transport' },
    { id: 'c_donjon', lab: 4, n: TL('Châssis Donjon'), req: 'c_goliath', cost: { data: 100, alloy: 130, cores: 3 }, d: TL('Bunker chenillé qui se cale pour le siège.'), fam: 'chenille' },
    { id: 'c_minotaure', lab: 4, n: TL('Châssis Minotaure'), req: 'c_ours', cost: { data: 90, alloy: 110, cores: 3 }, d: TL('Bipède cornu dont les pas assomment.'), fam: 'marcheur' },
    { id: 'c_chimere', lab: 4, n: TL('Châssis Chimère'), req: 'c_hydre', cost: { data: 95, crystals: 90, cores: 3 }, d: TL('Quadrupède hybride qui se répare seul.'), fam: 'marcheur' },
    { id: 'c_condor', lab: 4, n: TL('Châssis Condor'), req: 'c_bourdon', cost: { data: 95, circuits: 120, cores: 3 }, d: TL('Grand rapace volant qui esquive les tirs.'), fam: 'volant' },
  ].forEach(r => addResearch(Object.assign({ cat: TL('Châssis') }, r)));

  // ================= OUTILS DE DESSIN =================
  // Les formes d'une même couleur sont regroupées dans un seul chemin (un remplissage au lieu de dix) : ces peintres servent à chaque image.
  const frac = x => x - Math.floor(x);
  const STEEL = '#cfd4d6', IVORY = '#d8d2c2', IVORY_D = '#5c574c';
  // pixels à l'écran par unité de dessin pour le peintre en cours (aperçus compris) : les détails fins n'apparaissent que de près
  let PX = 1;
  const def = (id, fn) => { CH_PAINT[id] = (c, r, P, t, mv, u) => { const T = c.getTransform(); PX = Math.hypot(T.a, T.b); fn(c, r, P, t, mv, u); }; };
  // épave : plus aucune lumière vive
  const wreck = P => typeof PAL_WRECK !== 'undefined' && P === PAL_WRECK;
  // ajoute un disque au chemin courant
  const disc = (c, x, y, rad) => { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, TAU); };
  // ajoute au chemin courant un polygone (pts en rayons : [x0, y0, x1, y1…]) tourné de a autour de (ox, oy)
  function poly(c, ox, oy, a, pts, R) { const ca = Math.cos(a) * R, sa = Math.sin(a) * R; for (let i = 0; i < pts.length; i += 2) { const x = ox + pts[i] * ca - pts[i + 1] * sa, y = oy + pts[i] * sa + pts[i + 1] * ca; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
  // bandes jaunes et noires de danger dans un rectangle
  function hazard(c, x, y, w, h, s) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#1e1c18'; c.fillRect(x, y, w, h); c.fillStyle = '#e0b030'; c.beginPath();
    for (let k = -2, n = Math.ceil((w + h) / s) + 2; k < n; k += 2) { c.moveTo(x + k * s, y); c.lineTo(x + k * s + s, y); c.lineTo(x + k * s + s - h, y + h); c.lineTo(x + k * s - h, y + h); c.closePath(); }
    c.fill(); c.restore();
  }
  // bouffée de fumée (dessinée, pas de particule)
  function puff(c, x, y, rad, a, col) { c.fillStyle = `rgba(${col || '120,114,104'},${a.toFixed(3)})`; c.beginPath(); disc(c, x, y, rad); c.fill(); }
  // lueur ronde (yeux, réacteurs) : un dégradé de près, une simple tache de loin
  function glow(c, x, y, rad, P, a) {
    if (rad * PX < 7) { c.fillStyle = P.glow + (a * .7).toFixed(3) + ')'; c.beginPath(); disc(c, x, y, rad * .6); c.fill(); return; }
    const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(255,250,235,${a.toFixed(3)})`); g.addColorStop(.35, P.glow + (a * .85).toFixed(3) + ')'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; c.beginPath(); disc(c, x, y, rad); c.fill();
  }
  // griffes : n pointes claires devant (x, y), orientées selon a (un seul remplissage)
  function claws(c, x, y, a, len, w, n, sp) {
    const ca = Math.cos(a), sa = Math.sin(a), X = (lx, ly) => x + lx * ca - ly * sa, Y = (lx, ly) => y + lx * sa + ly * ca;
    c.fillStyle = STEEL; c.beginPath();
    for (let j = 0; j < n; j++) { const yy = (j - (n - 1) / 2) * sp; c.moveTo(X(0, yy - w), Y(0, yy - w)); c.quadraticCurveTo(X(len * .7, yy - w * .6), Y(len * .7, yy - w * .6), X(len, yy + w * .4), Y(len, yy + w * .4)); c.lineTo(X(0, yy + w), Y(0, yy + w)); c.closePath(); }
    c.fill();
  }

  // ================= PEINTRES =================
  // ---- Taupe : fouisseur à moitié enterré, foreuse conique, griffes-pelles
  def('taupe', (c, r, P, t, mv, u) => {
    const E1 = '#45382a', E2 = '#56452f', E3 = '#68553b', fine = r * PX > 20;
    if (r * PX < 7) { // de loin : monticule, corps, foreuse
      c.fillStyle = E1; c.beginPath(); c.ellipse(-r * .1, 0, r, r * .86, 0, 0, TAU); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(-r * .14, 0, r * .62, r * .5, 0, 0, TAU); c.fill();
      c.fillStyle = P.plate; c.beginPath(); c.moveTo(r * .44, -r * .26); c.lineTo(r * 1.06, 0); c.lineTo(r * .44, r * .26); c.closePath(); c.fill(); return;
    }
    // mottes projetées derrière les griffes en avançant
    if (mv > .05 && fine) for (let k = 0; k < 4; k++) {
      const f = frac(t * 2.4 + k / 4), s = k & 1 ? 1 : -1;
      c.globalAlpha = Math.min(1, mv * 1.4) * (1 - f); c.fillStyle = k % 3 ? E2 : E3; c.beginPath();
      disc(c, r * (.2 - f * 1.35), s * r * (.5 + f * .45 + Math.sin(k * 3.1) * .1), r * (.13 - f * .06)); c.fill();
    }
    c.globalAlpha = 1;
    // monticule de terre et ses mottes (ombre, puis deux teintes)
    c.fillStyle = E1; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, q = 1 + (hash2(k, 3, 7) - .5) * .16 + Math.sin(t * 8 + k * 2.3) * .04 * mv, x = Math.cos(a) * r * q - r * .1, y = Math.sin(a) * r * q * .86; k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.fill();
    for (let pass = r * PX > 30 ? 0 : 1; pass < 3; pass++) {
      c.fillStyle = pass === 0 ? 'rgba(0,0,0,.25)' : pass === 1 ? E2 : E3; c.beginPath();
      for (let k = 0; k < 9; k++) { if (pass && (k & 1) !== (pass === 1 ? 1 : 0)) continue; const a = k / 9 * TAU + .3, d = .82 + hash2(k, 5, 9) * .12, q = r * (.08 + hash2(k, 1, 4) * .06), x = Math.cos(a) * r * d - r * .1 + (pass ? 0 : q * .3), y = Math.sin(a) * r * d * .82 + (pass ? 0 : q * .35); disc(c, x, y, q); }
      c.fill();
    }
    // griffes-pelles qui creusent
    for (const s of [-1, 1]) {
      const dig = Math.sin(t * 13 + (s > 0 ? Math.PI : 0)) * (.12 + .38 * mv), a = s * (.55 + dig), ca = Math.cos(a), sa = Math.sin(a);
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(r * .3 + ca * r * .14, s * r * .38 + sa * r * .14, r * .2, r * .14, a, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
      claws(c, r * .3 + ca * r * .28, s * r * .38 + sa * r * .28, a, r * .22, r * .035, 3, r * .085);
    }
    // corps bombé et ses crêtes
    c.fillStyle = P.body; c.beginPath(); c.ellipse(-r * .14, 0, r * .62, r * .5, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = r * .07; c.beginPath();
    for (let k = 0; k < 4; k++) { const x = -r * (.62 - k * .17), h = r * .44 * Math.sqrt(Math.max(0, 1 - ((x + r * .14) / (r * .62)) ** 2)); c.moveTo(x, -h * .85); c.quadraticCurveTo(x + r * .1, 0, x, h * .85); }
    c.stroke();
    // terre retombée sur l'arrière : il avance à moitié enfoui
    c.fillStyle = E1; c.beginPath(); c.ellipse(-r * .7, 0, r * .2, r * .44, 0, 0, TAU); c.fill();
    c.fillStyle = E3; c.beginPath(); for (let k = 0; k < 3; k++) disc(c, -r * (.62 + hash2(k, 7, 2) * .1), (k - 1) * r * .28, r * .08); c.fill();
    // tête et foreuse conique qui tourne
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(r * .38, 0, r * .18, r * .3, 0, 0, TAU); c.fill();
    const x0 = r * .44, dl = r * .62, dw = r * .26;
    c.save(); c.beginPath(); c.moveTo(x0, -dw); c.lineTo(x0 + dl, 0); c.lineTo(x0, dw); c.closePath(); c.fillStyle = P.plate; c.fill(); c.clip();
    c.strokeStyle = P.dark; c.lineWidth = r * .07; const st = r * .17, o = frac(t * 9) * st;
    c.beginPath(); for (let k = -2; k < 6; k++) { const x = x0 + o + k * st; c.moveTo(x, -dw); c.lineTo(x + st * 1.1, dw); } c.stroke();
    c.restore();
    c.strokeStyle = P.dark; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, -dw); c.lineTo(x0 + dl, 0); c.lineTo(x0, dw); c.closePath(); c.stroke();
    c.fillStyle = P.dark; c.fillRect(x0 - r * .05, -dw, r * .08, dw * 2);
    c.fillStyle = P.acc; c.beginPath(); disc(c, r * .3, -r * .17, r * .055); disc(c, r * .3, r * .17, r * .055); c.fill();
  });

  // ---- Moucheron : micro-drone à deux rotors, corps-goutte, œil lumineux
  def('moucheron', (c, r, P, t, mv, u) => {
    const x = -r * .08, y = r * .84, R0 = r * .56;
    c.strokeStyle = P.body2; c.lineWidth = r * .18; c.beginPath(); c.moveTo(0, -r * .2); c.lineTo(x, -y); c.moveTo(0, r * .2); c.lineTo(x, y); c.stroke();
    c.fillStyle = 'rgba(210,225,220,.13)'; c.beginPath(); disc(c, x, -y, R0); disc(c, x, y, R0); c.fill();
    c.strokeStyle = 'rgba(222,232,228,.5)'; c.lineWidth = Math.max(1, r * .12); c.beginPath();
    for (const s of [-1, 1]) { const a = t * 60 * s, dx = Math.cos(a) * R0, dy = Math.sin(a) * R0; c.moveTo(x - dx, s * y - dy); c.lineTo(x + dx, s * y + dy); }
    c.stroke(); c.fillStyle = P.plate; c.beginPath(); disc(c, x, -y, R0 * .2); disc(c, x, y, R0 * .2); c.fill();
    // corps-goutte : rond à l'avant, effilé à l'arrière
    c.fillStyle = P.body; c.beginPath(); c.moveTo(-r * .92, 0); c.quadraticCurveTo(-r * .2, -r * .44, r * .3, -r * .4); c.arc(r * .3, 0, r * .4, -Math.PI / 2, Math.PI / 2); c.quadraticCurveTo(-r * .2, r * .44, -r * .92, 0); c.closePath(); c.fill();
    c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .3, 0, r * .3, r * .14, 0, 0, TAU); c.fill();
    c.fillStyle = P.dark; c.beginPath(); disc(c, r * .5, 0, r * .2); c.fill();
    glow(c, r * .52, 0, r * .3, P, wreck(P) ? .2 : .65 + .3 * Math.sin(t * 7));
  });

  // ---- Sanglier : petit chenillé trapu, chasse-pierres et défenses, échappements
  def('sanglier', (c, r, P, t, mv, u) => {
    for (const s of [-1, 1]) treads(c, -r * .84, s * r * .74 - r * .2, r * 1.5, r * .4, P, t, r * 2.2);
    // fumée des échappements
    if (r * PX > 8) for (let k = 0; k < 4; k++) { const f = frac(t * 1.5 + k / 4), s = k & 1 ? 1 : -1; puff(c, -r * (.66 + f * .7), s * r * (.34 + f * .12), r * (.07 + f * .2), (1 - f) * (.14 + .3 * mv)); }
    // caisse
    c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .55, -r * .52); c.lineTo(r * .72, -r * .32); c.lineTo(r * .72, r * .32); c.lineTo(r * .55, r * .52); c.lineTo(-r * .7, r * .54); c.lineTo(-r * .82, r * .36); c.lineTo(-r * .82, -r * .36); c.lineTo(-r * .7, -r * .54); c.closePath(); c.fill();
    c.strokeStyle = P.dark; c.lineWidth = 1.8; c.stroke();
    // échappements arrière
    c.fillStyle = P.dark; c.beginPath(); disc(c, -r * .62, -r * .34, r * .1); disc(c, -r * .62, r * .34, r * .1); c.fill(); c.strokeStyle = P.plate; c.lineWidth = 1.2; c.stroke();
    // hure bombée et crête de soies
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .12, 0, r * .5, r * .36, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
    c.lineWidth = r * .05; c.beginPath(); for (let k = 0; k < 8; k++) { const x = -r * .58 + k * r * .13; c.moveTo(x, -r * .08); c.lineTo(x - r * .07, 0); c.lineTo(x, r * .08); } c.stroke();
    // chasse-pierres
    c.fillStyle = P.dark; c.beginPath(); c.moveTo(r * .62, -r * .6); c.lineTo(r * .98, -r * .14); c.lineTo(r * .98, r * .14); c.lineTo(r * .62, r * .6); c.closePath(); c.fill();
    c.strokeStyle = P.plate; c.lineWidth = r * .045; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(r * .66, k * r * .24); c.lineTo(r * .95, k * r * .055); } c.stroke();
    // défenses d'acier
    c.fillStyle = IVORY; c.beginPath();
    for (const s of [-1, 1]) { c.moveTo(r * .8, s * r * .12); c.quadraticCurveTo(r * 1.26, s * r * .18, r * 1.14, s * r * .64); c.quadraticCurveTo(r * 1.04, s * r * .36, r * .76, s * r * .3); c.closePath(); }
    c.fill(); c.strokeStyle = IVORY_D; c.lineWidth = 1; c.stroke();
    // yeux plissés
    c.fillStyle = P.acc; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .46, s * r * .14); c.lineTo(r * .6, s * r * .22); c.lineTo(r * .46, s * r * .26); c.closePath(); } c.fill();
  });

  // ---- Tatou : carapace en bandes articulées, quatre pattes courtes, émetteur de bouclier au dos
  def('tatou', (c, r, P, t, mv, u) => {
    const G = gait(u, [[.32, -.3, .42, -.8], [.32, .3, .42, .8], [-.36, -.3, -.42, -.8], [-.36, .3, -.42, .8]], r, t, mv, { groups: [0, 1, 1, 0], stride: .3, dur: .16, f: 11, amp: .25 });
    if (r * PX < 7) { // de loin : carapace, tête, queue
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(r * 1.1, 0); c.lineTo(r * .4, -r * .25); c.lineTo(-r * 1.2, 0); c.lineTo(r * .4, r * .25); c.closePath(); c.fill();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .02, 0, r * .74, r * .64, 0, 0, TAU); c.fill(); c.fillStyle = P.body2; c.fillRect(-r * .26, -r * .6, r * .14, r * 1.2); c.fillRect(r * .02, -r * .6, r * .14, r * 1.2); return;
    }
    G.forEach((g, k) => legIK(c, g, r * .3, r * .3, (k < 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .17, P, r * .11, false));
    // queue annelée
    const sw = Math.sin(t * 4) * r * .1 * (.3 + mv);
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(-r * .6, -r * .15); c.quadraticCurveTo(-r * .95, sw * .5 - r * .07, -r * 1.2, sw); c.quadraticCurveTo(-r * .95, sw * .5 + r * .07, -r * .6, r * .15); c.closePath(); c.fill();
    c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); c.beginPath(); for (let k = 1; k < 4; k++) { const x = -r * (.68 + k * .12), y = sw * (k * .25), h = r * (.13 - k * .025); c.moveTo(x, y - h); c.lineTo(x, y + h); } c.stroke();
    // tête pointue et oreilles
    c.fillStyle = P.body2; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .6 + r * .1, s * r * .24); c.ellipse(r * .6, s * r * .24, r * .1, r * .06, s * .7, 0, TAU); } c.fill();
    c.beginPath(); c.moveTo(r * .5, -r * .25); c.quadraticCurveTo(r * .95, -r * .14, r * 1.1, 0); c.quadraticCurveTo(r * .95, r * .14, r * .5, r * .25); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = P.acc; c.beginPath(); disc(c, r * .78, -r * .1, r * .045); disc(c, r * .78, r * .1, r * .045); c.fill();
    // carapace : boucliers avant et arrière, bandes articulées au milieu
    const ex = r * .74, ey = r * .64, cx = -r * .02, br = Math.sin(t * 11) * mv * r * .02, bw = r * .136;
    c.save(); c.beginPath(); c.ellipse(cx, 0, ex, ey, 0, 0, TAU); c.fillStyle = P.body; c.fill(); c.clip();
    c.fillStyle = P.plate; c.fillRect(r * .28, -ey, r * .5, ey * 2); c.fillRect(-r * .8, -ey, r * .4, ey * 2);
    c.fillStyle = P.body2; c.beginPath(); for (let k = 1; k < 5; k += 2) c.rect(-r * .4 + k * bw + br * (k - 2), -ey, bw, ey * 2); c.fill();
    c.strokeStyle = P.dark; c.lineWidth = 1.3; c.beginPath(); for (let k = 0; k <= 5; k++) { const x = k < 5 ? -r * .4 + k * bw + br * (k - 2) : r * .28; c.moveTo(x, -ey); c.lineTo(x, ey); } c.stroke();
    if (r * PX > 24) { c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = r * .035; c.beginPath(); for (const x of [.4, .52, .64, -.5, -.62, -.74]) { c.moveTo(x * r, -ey); c.lineTo(x * r, ey); } c.stroke(); }
    c.restore();
    c.strokeStyle = P.dark; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, 0, ex, ey, 0, 0, TAU); c.stroke();
    // émetteur de bouclier : coupole et anneau qui tourne (plus vif quand le bouclier est chargé)
    const on = u && u.shield > 1 ? 1 : .5, p = .5 + .5 * Math.sin(t * 4), ox = -r * .56;
    c.fillStyle = P.dark; c.beginPath(); disc(c, ox, 0, r * .17); c.fill();
    c.fillStyle = P.glow + (.3 + .5 * p * on).toFixed(3) + ')'; c.beginPath(); disc(c, ox, 0, r * .11); c.fill();
    c.strokeStyle = P.acc; c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 3; k++) { const a = t * 2 + k * TAU / 3; c.moveTo(ox + Math.cos(a) * r * .22, Math.sin(a) * r * .22); c.arc(ox, 0, r * .22, a, a + .9); } c.stroke();
  });

  // ---- Luciole : drone-infirmier, abdomen vert qui pulse, croix de soin, quatre petites ailes
  def('luciole', (c, r, P, t, mv, u) => {
    const fl = Math.abs(Math.sin(t * 46)), p = .5 + .5 * Math.sin(t * 3), ax = -r * .44, dead = wreck(P);
    if (!dead) { const halo = c.createRadialGradient(ax, 0, 0, ax, 0, r * .95); halo.addColorStop(0, `rgba(170,255,140,${(.22 + .25 * p).toFixed(3)})`); halo.addColorStop(1, 'rgba(170,255,140,0)'); c.fillStyle = halo; c.beginPath(); disc(c, ax, 0, r * .95); c.fill(); }
    // ailes (deux paires), translucides, qui vibrent
    c.fillStyle = `rgba(210,235,225,${(.13 + .12 * fl).toFixed(3)})`; c.beginPath();
    for (const s of [-1, 1]) for (const [x, tilt, L] of [[r * .2, -.35, .8], [-r * .02, .35, .68]]) { const a = s * (Math.PI / 2 + tilt), h = L * r * .5; c.moveTo(x + Math.cos(a) * h * 2, s * r * .16 + Math.sin(a) * h * 2); c.ellipse(x + Math.cos(a) * h, s * r * .16 + Math.sin(a) * h, h, r * (.1 + .09 * fl), a, 0, TAU); }
    c.fill();
    c.strokeStyle = 'rgba(225,240,232,.45)'; c.lineWidth = 1; c.beginPath();
    for (const s of [-1, 1]) for (const [x, tilt, L] of [[r * .2, -.35, .8], [-r * .02, .35, .68]]) { const a = s * (Math.PI / 2 + tilt); c.moveTo(x, s * r * .16); c.lineTo(x + Math.cos(a) * L * r * .92, s * r * .16 + Math.sin(a) * L * r * .92); }
    c.stroke();
    // abdomen lumineux et croix de soin
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(ax, 0, r * .5, r * .34, 0, 0, TAU); c.fill();
    c.fillStyle = dead ? P.plate : `rgba(165,255,135,${(.5 + .45 * p).toFixed(3)})`; c.beginPath(); c.ellipse(ax - r * .05, 0, r * .4, r * .26, 0, 0, TAU); c.fill();
    c.strokeStyle = P.body2; c.lineWidth = r * .05; c.beginPath(); for (const k of [-.18, .06]) { c.moveTo(ax + k * r * 1.6, -r * .3); c.quadraticCurveTo(ax + k * r * 1.6 - r * .07, 0, ax + k * r * 1.6, r * .3); } c.stroke();
    c.fillStyle = dead ? P.body : '#f4fff0'; c.fillRect(ax - r * .17, -r * .055, r * .34, r * .11); c.fillRect(ax - r * .055, -r * .17, r * .11, r * .34);
    // thorax, tête, antennes
    c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .12, 0, r * .3, r * .27, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
    const an = s => s * r * (.3 + Math.sin(t * 5 + s) * .04);
    c.strokeStyle = P.plate; c.lineWidth = 1; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .58, s * r * .08); c.quadraticCurveTo(r * .8, s * r * .1, r * .9, an(s)); } c.stroke();
    c.fillStyle = P.body2; c.beginPath(); disc(c, r * .5, 0, r * .16); c.fill();
    c.fillStyle = P.acc; c.beginPath(); disc(c, r * .9, an(-1), r * .04); disc(c, r * .9, an(1), r * .04); disc(c, r * .56, -r * .08, r * .05); disc(c, r * .56, r * .08, r * .05); c.fill();
  });

  // ---- Crabe : carapace large, deux grosses pinces armées, six pattes écartées
  const CRABE_L = [], CRABE_G = [];
  for (let k = 0; k < 6; k++) { const s = k < 3 ? -1 : 1, i = k % 3, hx = .2 - i * .24; CRABE_L.push([hx, s * .5, hx + (1 - i) * .22 - .04, s * 1.22]); CRABE_G.push((i + (s > 0 ? 1 : 0)) & 1); }
  def('crabe', (c, r, P, t, mv, u) => {
    gait(u, CRABE_L, r, t, mv, { groups: CRABE_G, stride: .32, dur: .2, f: 8, amp: .2 }).forEach((g, k) => legIK(c, g, r * .44, r * .48, (k % 3 === 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .12, P, 0, r * PX > 30));
    // bras des pinces
    c.lineCap = 'round'; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .22, s * r * .5); c.lineTo(r * .38, s * r * .74); c.lineTo(r * .58, s * r * .64); }
    c.strokeStyle = P.dark; c.lineWidth = r * .22; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = r * .13; c.stroke();
    // carapace dentelée
    const cx = -r * .06;
    c.fillStyle = P.body; c.beginPath(); c.ellipse(cx, 0, r * .56, r * .8, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const a = s * (.5 + k * .32), x = cx + Math.cos(a) * r * .56, y = Math.sin(a) * r * .8; c.moveTo(x - Math.sin(a) * r * .07 * s, y - r * .06 * s); c.lineTo(x + Math.cos(a) * r * .14, y + Math.sin(a) * r * .1); c.lineTo(x + Math.sin(a) * r * .07 * s, y + r * .06 * s); c.closePath(); }
    c.fill(); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); for (const s of [-1, 1]) { const X = cx - r * .04, Y = s * r * .38, a = s * .35; c.moveTo(X + Math.cos(a) * r * .3, Y + Math.sin(a) * r * .3); c.ellipse(X, Y, r * .3, r * .24, a, 0, TAU); } c.fill();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx + r * .42, 0); c.lineTo(cx + r * .12, 0); c.moveTo(cx + r * .12, -r * .14); c.lineTo(cx + r * .12, r * .14); c.moveTo(cx + r * .12, -r * .14); c.lineTo(cx - r * .3, -r * .1); c.moveTo(cx + r * .12, r * .14); c.lineTo(cx - r * .3, r * .1); c.stroke();
    // yeux pédonculés
    const ey = s => s * r * (.18 + Math.sin(t * 2.2 + s * 1.7) * .06);
    c.strokeStyle = P.dark; c.lineWidth = r * .05; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .42, s * r * .1); c.lineTo(r * .62, ey(s)); } c.stroke();
    c.fillStyle = P.acc; c.beginPath(); disc(c, r * .62, ey(-1), r * .065); disc(c, r * .62, ey(1), r * .065); c.fill();
    // pinces : main (l'affût y est posé), doigt fixe côté intérieur, dactyle mobile côté extérieur
    const fine = r * PX > 30, w = r * .13, len = r * .46;
    for (const s of [-1, 1]) {
      const op = .24 + .16 * Math.sin(t * 2.4 + (s > 0 ? 1.4 : 0)) + .12 * mv * Math.sin(t * 9);
      c.save(); c.translate(r * .7, s * r * .6);
      for (const [sd, rot] of [[-s, -s * .06], [s, s * op]]) { // sd : côté du doigt (son bord extérieur), le bout se recourbe vers l'autre
        c.save(); c.translate(r * .2, sd * r * .1); c.rotate(rot);
        c.fillStyle = P.plate; c.beginPath(); c.moveTo(0, sd * w); c.quadraticCurveTo(len * .65, sd * w * 1.2, len, -sd * w * .45); c.quadraticCurveTo(len * .55, -sd * w * .15, 0, -sd * w * .75); c.closePath(); c.fill();
        c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
        if (fine) { c.fillStyle = STEEL; c.beginPath(); for (let k = 1; k < 4; k++) { const x = k * len * .22, y = -sd * w * (.45 + k * .02); c.moveTo(x - r * .03, y); c.lineTo(x, y - sd * r * .05); c.lineTo(x + r * .03, y); c.closePath(); } c.fill(); }
        c.restore();
      }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .32, r * .23, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .08, 0, r * .17, r * .12, 0, 0, TAU); c.fill();
      c.restore();
    }
  });

  // ---- Héron : aéronef effilé, long cou-capteur, ailes battantes lentes, radar tournant
  const HERON_W = [-.3, 1.08, -.24, .98, -.42, .9, -.34, .78, -.48, .68, -.38, .54, -.5, .44, -.4, .3, -.42, .14];
  def('heron', (c, r, P, t, mv, u) => {
    const fl = Math.sin(t * 2.2), sp = .9 + .12 * fl, nk = Math.sin(t * 1.3) * r * .05;
    // pattes repliées qui traînent derrière
    c.strokeStyle = P.dark; c.lineWidth = r * .045; c.beginPath();
    for (const s of [-1, 1]) { c.moveTo(-r * .55, s * r * .05); c.lineTo(-r * 1.08, s * r * .1); c.lineTo(-r * 1.2, s * r * .17); c.moveTo(-r * 1.08, s * r * .1); c.lineTo(-r * 1.22, s * r * .06); }
    c.stroke();
    // ailes larges aux rémiges sombres (les deux ailes dans les mêmes chemins)
    c.fillStyle = P.body2; c.beginPath();
    for (const s of [-1, 1]) { const Y = v => s * r * v * sp; c.moveTo(r * .2, s * r * .12); c.lineTo(r * .16, Y(.5)); c.quadraticCurveTo(r * .12, Y(.95), -r * .12, Y(1.2)); for (let i = 0; i < HERON_W.length; i += 2) c.lineTo(HERON_W[i] * r, Y(HERON_W[i + 1])); c.closePath(); }
    c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath();
    for (const s of [-1, 1]) { const Y = v => s * r * v * sp; c.moveTo(r * .18, s * r * .14); c.lineTo(r * .14, Y(.5)); c.quadraticCurveTo(r * .1, Y(.9), -r * .08, Y(1.1)); c.lineTo(-r * .1, Y(.86)); c.quadraticCurveTo(-r * .04, Y(.5), -r * .06, s * r * .14); c.closePath(); }
    c.fill();
    if (r * PX > 12) { c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.2; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const y = .3 + k * .17; c.moveTo(-r * .1, s * r * y * sp); c.lineTo(-r * .36, s * r * (y + .03) * sp); } c.stroke(); }
    // fuselage effilé
    c.fillStyle = P.body; c.beginPath(); c.ellipse(-r * .1, 0, r * .62, r * .2, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    c.fillStyle = P.body2; c.fillRect(-r * .55, -r * .05, r * .9, r * .1);
    // long cou-capteur et tête
    c.beginPath(); c.moveTo(r * .4, 0); c.quadraticCurveTo(r * .65, nk * 2, r * .9, nk); c.strokeStyle = P.dark; c.lineWidth = r * .14; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = r * .08; c.stroke();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .92, nk, r * .12, r * .08, 0, 0, TAU); c.fill();
    c.fillStyle = P.plate; c.beginPath(); c.moveTo(r * 1.0, nk - r * .04); c.lineTo(r * 1.32, nk); c.lineTo(r * 1.0, nk + r * .04); c.closePath(); c.fill();
    glow(c, r * .95, nk, r * .1, P, .7 + .3 * Math.sin(t * 5));
    // radar tournant sur le croupion
    const rx = -r * .66, a = t * 2.5;
    c.fillStyle = P.dark; c.beginPath(); disc(c, rx, 0, r * .1); c.fill();
    c.fillStyle = P.plate; c.beginPath(); poly(c, rx, 0, a, [-.05, -.26, .05, -.26, .05, .26, -.05, .26], r); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = P.acc; c.beginPath(); poly(c, rx, 0, a, [.03, -.22, .055, -.22, .055, .22, .03, .22], r); c.fill();
  });

  // ---- Chacal : quadrupède nerveux de meute, oreilles-antennes, queue-stabilisateur
  def('chacal', (c, r, P, t, mv, u) => {
    gait(u, [[.32, -.2, .55, -.78], [.32, .2, .55, .78], [-.42, -.2, -.6, -.78], [-.42, .2, -.6, .78]], r, t, mv, { groups: [0, 1, 1, 0], stride: .48, dur: .11, f: 19, amp: .38 })
      .forEach((g, k) => legIK(c, g, r * .42, r * .44, (k < 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .12, P, r * .07, false));
    // queue-stabilisateur qui fouette
    const sw = Math.PI + Math.sin(t * 7) * .32 * (.35 + mv) + Math.sin(t * 2.3) * .1, tx = -r * .7, ca = Math.cos(sw), sa = Math.sin(sw);
    c.beginPath(); c.moveTo(tx, 0); c.lineTo(tx + ca * r * .48, sa * r * .48); c.strokeStyle = P.dark; c.lineWidth = r * .12; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = r * .06; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); poly(c, tx, 0, sw, [.36, 0, .66, -.17, .58, 0, .66, .17], r); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
    // arrière-train, poitrail, échine
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-r * .36, 0, r * .36, r * .26, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .12, 0, r * .44, r * .3, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = P.plate; c.beginPath(); for (let k = 0; k < 6; k++) c.rect(-r * .62 + k * r * .15, -r * .06, r * .1, r * .12); c.fill();
    // oreilles-antennes qui tressaillent
    c.fillStyle = P.plate; c.beginPath(); const tip = [];
    for (const s of [-1, 1]) { const a = s * (2.35 - Math.max(0, Math.sin(t * 9 + s) * Math.sin(t * 1.7 + s * 2)) * .45), ex = r * .58, ey = s * r * .11; poly(c, ex, ey, a, [0, -.07, .38, 0, 0, .07], r); tip.push(ex + Math.cos(a) * r * .38, ey + Math.sin(a) * r * .38); }
    c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke();
    // tête effilée
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(r * .46, -r * .17); c.lineTo(r * .78, -r * .12); c.lineTo(r * 1.08, 0); c.lineTo(r * .78, r * .12); c.lineTo(r * .46, r * .17); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = P.acc; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .7, s * r * .05); c.lineTo(r * .86, s * r * .07); c.lineTo(r * .72, s * r * .11); c.closePath(); } disc(c, tip[0], tip[1], r * .035); disc(c, tip[2], tip[3], r * .035); c.fill();
    c.fillStyle = P.dark; c.beginPath(); disc(c, r * 1.06, 0, r * .03); c.fill();
  });

  // ---- Chameau : porteur à quatre longues pattes, deux bosses-conteneurs, tête-aimant à bobine
  def('chameau', (c, r, P, t, mv, u) => {
    const kn = gait(u, [[.36, -.3, .46, -.98], [.36, .3, .46, .98], [-.5, -.3, -.58, -.98], [-.5, .3, -.58, .98]], r, t, mv, { groups: [0, 1, 0, 1], stride: .44, dur: .34, f: 5, amp: .32 })
      .map((g, k) => legIK(c, g, r * .5, r * .5, (k < 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .1, P, r * .11));
    c.fillStyle = P.body2; c.beginPath(); for (const [kx, ky] of kn) disc(c, kx, ky, r * .06); c.fill();
    // corps
    c.fillStyle = P.body; rr(c, -r * .8, -r * .4, r * 1.28, r * .8, r * .2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    // cou et tête-aimant
    const nk = Math.sin(t * 5.5) * mv * r * .04, hx = r * .86, R2 = r * .16;
    c.beginPath(); c.moveTo(r * .4, 0); c.quadraticCurveTo(r * .6, nk, r * .76, nk); c.strokeStyle = P.dark; c.lineWidth = r * .2; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = r * .12; c.stroke();
    c.beginPath(); c.moveTo(hx + r * .14, nk - R2); c.lineTo(hx, nk - R2); c.arc(hx, nk, R2, -Math.PI / 2, Math.PI / 2, true); c.lineTo(hx + r * .14, nk + R2); c.strokeStyle = P.dark; c.lineWidth = r * .15; c.stroke(); c.strokeStyle = P.body2; c.lineWidth = r * .09; c.stroke();
    c.strokeStyle = '#b8743a'; c.lineWidth = r * .03; c.beginPath(); for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k + .5) / 5 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), x = hx + ca * R2, y = nk + sa * R2; c.moveTo(x - ca * r * .06, y - sa * r * .06); c.lineTo(x + ca * r * .06, y + sa * r * .06); } c.stroke();
    c.fillStyle = P.acc; c.fillRect(hx + r * .08, nk - R2 - r * .06, r * .09, r * .12); c.fillStyle = P.plate; c.fillRect(hx + r * .08, nk + R2 - r * .06, r * .09, r * .12);
    // champ magnétique : arcs qui s'éloignent
    if (!wreck(P)) { c.lineWidth = 1.2; for (let k = 0; k < 3; k++) { const f = frac(t * .9 + k / 3); c.strokeStyle = P.glow + ((1 - f) * .6).toFixed(3) + ')'; c.beginPath(); c.arc(hx + r * .18, nk, R2 * (.6 + f * 1.6), -1.1, 1.1); c.stroke(); } }
    // deux bosses-conteneurs, jauge de chargement
    const f = u && u.cargoMax ? clamp(u.cargoW / u.cargoMax, 0, 1) : .5, HX = [-.56 * r, .08 * r];
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); for (const X of HX) { c.moveTo(X + r * .28, r * .05); c.ellipse(X + r * .05, r * .05, r * .23, r * .36, 0, 0, TAU); } c.fill();
    c.fillStyle = P.plate; c.beginPath(); for (const X of HX) { c.moveTo(X + r * .23, 0); c.ellipse(X, 0, r * .23, r * .36, 0, 0, TAU); } c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.2; c.beginPath(); for (const X of HX) for (let k = -2; k <= 2; k++) { const y = k * r * .12, w = r * .23 * Math.sqrt(1 - (y / (r * .36)) ** 2); c.moveTo(X - w, y); c.lineTo(X + w, y); } c.stroke();
    c.fillStyle = P.dark; c.beginPath(); for (const X of HX) c.rect(X - r * .05, -r * .26, r * .1, r * .52); c.fill();
    c.fillStyle = '#c8a050'; c.beginPath(); HX.forEach((X, i) => { const q = clamp(f * 2 - i, 0, 1); if (q > 0) c.rect(X - r * .03, r * .24 - r * .48 * q, r * .06, r * .48 * q); }); c.fill();
  });

  // ---- Ours : bipède massif voûté, épaules énormes, bras-canons griffus
  def('ours', (c, r, P, t, mv, u) => {
    gait(u, [[-.26, -.26, -.36, -.4], [-.26, .26, -.36, .4]], r, t, mv, { stride: .44, dur: .3, f: 4.4, amp: .45 }).forEach(g => {
      const k = 1 + g.lift * .2;
      c.strokeStyle = P.dark; c.lineWidth = r * .2; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(g.fx, g.fy); c.stroke();
      if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, g.fx - r * .24 + r * .07 * g.lift, g.fy - r * .17 + r * .09 * g.lift, r * .46, r * .34, r * .12); c.fill(); }
      claws(c, g.fx + r * .17 * k, g.fy, 0, r * .17 * k, r * .035, 3, r * .1 * k);
      c.fillStyle = P.body2; rr(c, g.fx - r * .25 * k, g.fy - r * .17 * k, r * .46 * k, r * .34 * k, r * .12); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; c.fillRect(g.fx - r * .18 * k, g.fy - r * .1 * k, r * .2 * k, r * .2 * k);
    });
    const rage = u && u.maxhp && u.hp < u.maxhp * .4 ? 1 : 0;
    // dos voûté et poitrail
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-r * .2, 0, r * .34, r * .4, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k < 4; k++) { const x = -r * (.56 - k * .11); c.moveTo(x + Math.cos(-.85) * r * .3, Math.sin(-.85) * r * .3); c.arc(x, 0, r * .3, -.85, .85); } c.stroke();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .02, 0, r * .36, r * .48, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
    glowCore(c, -r * .12, 0, r * .14 * (1 + rage * .5), P, t * (1 + rage * 2));
    // bras-canons griffus sous des épaulières énormes
    for (const s of [-1, 1]) {
      const sw = Math.sin(t * 4.4 + (s > 0 ? Math.PI : 0)) * mv * r * .05;
      claws(c, r * .6 + sw, s * r * .62, 0, r * .2, r * .035, 3, r * .1);
      c.fillStyle = P.body2; rr(c, -r * .06, s * r * .62 - r * .15, r * .68 + sw, r * .3, r * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.dark; c.beginPath(); for (let k = 0; k < 3; k++) c.rect(r * (.42 + k * .07) + sw, s * r * .62 - r * .1, r * .03, r * .2); c.fill();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(r * .04, s * r * .5, r * .27, r * .25, 0, 0, TAU); c.fill(); c.lineWidth = 2.5; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.beginPath(); disc(c, r * .04, s * r * .5, r * .16); c.stroke();
    }
    // tête basse entre les épaules
    c.fillStyle = P.body2; c.beginPath(); disc(c, r * .3, -r * .17, r * .075); disc(c, r * .3, r * .17, r * .075); c.fill();
    c.fillStyle = P.dark; c.beginPath(); disc(c, r * .3, -r * .17, r * .035); disc(c, r * .3, r * .17, r * .035); c.fill();
    c.fillStyle = P.body2; c.beginPath(); disc(c, r * .38, 0, r * .19); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); disc(c, r * .54, 0, r * .1); c.fill();
    c.fillStyle = P.dark; c.beginPath(); disc(c, r * .61, 0, r * .035); c.fill();
    if (rage) for (const s of [-1, 1]) glow(c, r * .44, s * r * .08, r * .12, P, .8 + .2 * Math.sin(t * 12));
    c.fillStyle = P.acc; c.beginPath(); disc(c, r * .44, -r * .08, r * .035); disc(c, r * .44, r * .08, r * .035); c.fill();
  });

  // ---- Bourdon : gros volant à quatre rotors carénés, corps rayé, tourelle ventrale
  const BOURDON_R = [.58, -.66, .58, .66, -.58, -.66, -.58, .66];
  def('bourdon', (c, r, P, t, mv, u) => {
    const RP = BOURDON_R, n = RP.length;
    c.strokeStyle = P.dark; c.lineWidth = r * .1; c.beginPath(); for (let i = 0; i < n; i += 2) { c.moveTo(RP[i] * r * .4, RP[i + 1] * r * .4); c.lineTo(RP[i] * r, RP[i + 1] * r); } c.stroke();
    c.fillStyle = P.body2; c.beginPath(); for (let i = 0; i < n; i += 2) disc(c, RP[i] * r, RP[i + 1] * r, r * .29); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(210,225,220,.13)'; c.beginPath(); for (let i = 0; i < n; i += 2) disc(c, RP[i] * r, RP[i + 1] * r, r * .24); c.fill();
    c.strokeStyle = 'rgba(222,232,228,.5)'; c.lineWidth = r * .035; c.beginPath();
    for (let i = 0; i < n; i += 2) { const X = RP[i] * r, Y = RP[i + 1] * r, a0 = t * 32 + RP[i] * 2 + RP[i + 1]; for (let k = 0; k < 3; k++) { const b = a0 + k * TAU / 3; c.moveTo(X, Y); c.lineTo(X + Math.cos(b) * r * .24, Y + Math.sin(b) * r * .24); } }
    c.stroke();
    c.fillStyle = P.plate; c.beginPath(); for (let i = 0; i < n; i += 2) disc(c, RP[i] * r, RP[i + 1] * r, r * .05); c.fill();
    c.strokeStyle = 'rgba(224,176,48,.45)'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < n; i += 2) { const X = RP[i] * r, Y = RP[i + 1] * r, a = Math.atan2(Y, X); c.moveTo(X + Math.cos(a - .5) * r * .27, Y + Math.sin(a - .5) * r * .27); c.arc(X, Y, r * .27, a - .5, a + .5); } c.stroke();
    // dard
    c.fillStyle = P.dark; c.beginPath(); c.moveTo(-r * .66, -r * .08); c.lineTo(-r * .96, 0); c.lineTo(-r * .66, r * .08); c.closePath(); c.fill();
    // abdomen rayé jaune et noir, discret
    const ax = -r * .2;
    c.save(); c.beginPath(); c.ellipse(ax, 0, r * .52, r * .44, 0, 0, TAU); c.fillStyle = P.body; c.fill(); c.clip();
    c.fillStyle = 'rgba(224,176,48,.32)'; c.beginPath(); for (let k = 0; k < 5; k += 2) c.rect(-r * (.74 - k * .12), -r * .5, r * .07, r); c.fill();
    c.fillStyle = 'rgba(20,18,14,.42)'; c.beginPath(); for (let k = 1; k < 5; k += 2) c.rect(-r * (.74 - k * .12), -r * .5, r * .07, r); c.fill();
    c.restore();
    c.strokeStyle = P.dark; c.lineWidth = 2.5; c.beginPath(); c.ellipse(ax, 0, r * .52, r * .44, 0, 0, TAU); c.stroke();
    // thorax et tête aux grands yeux composés
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(r * .26, 0, r * .3, r * .34, 0, 0, TAU); c.fill(); c.lineWidth = 2; c.stroke();
    c.fillStyle = P.body2; c.beginPath(); disc(c, r * .62, 0, r * .19); c.fill(); c.stroke();
    c.fillStyle = P.dark; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .76, s * r * .12); c.ellipse(r * .66, s * r * .12, r * .1, r * .07, s * .5, 0, TAU); } c.fill();
    for (const s of [-1, 1]) glow(c, r * .68, s * r * .12, r * .1, P, .55 + .2 * Math.sin(t * 3 + s));
    c.lineWidth = r * .03; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .76, s * r * .05); c.quadraticCurveTo(r * .92, s * r * .06, r * .98, s * r * .2); } c.stroke();
  });

  // ---- Mangouste : long corps bas et souple qui ondule, pattes rapides
  const MANG_PL = [-.07, -.12, .07, -.12, .07, .12, -.07, .12];
  def('mangouste', (c, r, P, t, mv, u) => {
    const A = r * .1 * (.2 + mv), ph = t * 8, s0 = Math.sin(ph - .12 * 2.2);
    const fy = x => A * (Math.sin(ph - x * 2.2) - s0); // ondulation, nulle à la ligne des affûts
    gait(u, [[.3, -.18, .5, -.66], [.3, .18, .5, .66], [-.44, -.18, -.58, -.66], [-.44, .18, -.58, .66]], r, t, mv, { groups: [0, 1, 1, 0], stride: .5, dur: .1, f: 20, amp: .4 })
      .forEach((g, k) => { g.hy += fy(g.hx / r); legIK(c, g, r * .3, r * .33, (k < 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .1, P, r * .06, false); });
    // queue touffue annelée
    c.lineCap = 'round';
    for (let k = 0; k < 8; k++) { const x0 = -.7 - k * .11, x1 = x0 - .13; c.strokeStyle = k & 1 ? P.plate : P.body2; c.lineWidth = r * (.2 - k * .018); c.beginPath(); c.moveTo(x0 * r, fy(x0) * 1.6); c.lineTo(x1 * r, fy(x1) * 1.6); c.stroke(); }
    // corps : contour lissé le long de l'échine (bord gauche à l'aller, bord droit au retour)
    const W = x => x > .62 ? .2 * Math.sqrt(Math.max(0, (1.04 - x) / .42)) : x > .45 ? .17 : .19 + .08 * Math.sin((x + .76) / 1.21 * Math.PI);
    const edge = (x, sd) => { const y = fy(x), dy = (fy(x + .02) - fy(x - .02)) / (.04 * r), n = 1 / Math.hypot(1, dy), w = W(x) * r * sd; return [x * r + dy * w * n, y - w * n]; };
    c.fillStyle = P.body; c.beginPath();
    for (let i = 0; i <= 26; i++) { const [x, y] = edge(1.04 - i * .07, 1); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    for (let i = 26; i >= 0; i--) { const [x, y] = edge(1.04 - i * .07, -1); c.lineTo(x, y); }
    c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    // plaques dorsales et nacelles d'affûts
    c.fillStyle = P.plate; c.beginPath(); for (let k = 0; k < 6; k++) { const x = .4 - k * .2; poly(c, x * r, fy(x), Math.atan2(fy(x + .05) - fy(x - .05), .1 * r), MANG_PL, r); } c.fill();
    c.fillStyle = P.body2; c.beginPath(); for (const s of [-1, 1]) c.rect(-r * .06, s * r * .3 - r * .12, r * .38, r * .24); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
    // tête : oreilles rondes, yeux, moustaches
    const hy = fy(.85);
    c.fillStyle = P.body2; c.beginPath(); disc(c, r * .66, hy - r * .15, r * .06); disc(c, r * .66, hy + r * .15, r * .06); c.fill();
    c.fillStyle = P.acc; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(r * .87, hy + s * r * .075); c.ellipse(r * .82, hy + s * r * .075, r * .05, r * .025, s * .4, 0, TAU); } c.fill();
    c.fillStyle = P.dark; c.beginPath(); disc(c, r * 1.03, fy(1.03), r * .035); c.fill();
    if (r * PX > 14) { c.strokeStyle = 'rgba(232,220,196,.35)'; c.lineWidth = 1; c.beginPath(); for (const s of [-1, 1]) for (const k of [0, 1]) { c.moveTo(r * .96, hy + s * r * .04); c.lineTo(r * (1.12 - k * .05), hy + s * r * (.14 + k * .08)); } c.stroke(); }
  });

  // ---- Fourgon : camion blindé à six roues, soute arrière à porte (fabrique)
  def('fourgon', (c, r, P, t, mv, u) => {
    for (const s of [-1, 1]) for (const x of [.56, -.26, -.62]) treads(c, x * r - r * .17, s * r * .6 - r * .12, r * .34, r * .24, P, t, r * 1.5);
    const op = fabDoor(u);
    // châssis
    c.fillStyle = P.dark; rr(c, -r * .98, -r * .5, r * 1.92, r * 1, r * .06); c.fill();
    // soute
    c.fillStyle = P.glow + (.2 + op * .65).toFixed(3) + ')'; c.fillRect(-r * .98, -r * .4, r * .08, r * .8);
    c.fillStyle = P.body; rr(c, -r * .92, -r * .5, r * 1.2, r * 1, r * .06); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.5; c.beginPath(); for (let k = 1; k < 7; k++) { const x = -r * .92 + k * r * .17; c.moveTo(x, -r * .5); c.lineTo(x, -r * .38); c.moveTo(x, r * .38); c.lineTo(x, r * .5); } c.stroke();
    c.fillStyle = P.plate; rr(c, -r * .8, -r * .34, r * .96, r * .68, r * .05); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = P.body2; c.fillRect(-r * .62, -r * .2, r * .22, r * .4);
    // porte arrière à deux battants qui s'ouvre quand un robot sort
    for (const s of [-1, 1]) {
      c.save(); c.translate(-r * .92, s * r * .44); c.rotate(-s * op * 1.5);
      if (r * PX > 10) hazard(c, -r * .05, s > 0 ? -r * .42 : 0, r * .05, r * .42, r * .06); else { c.fillStyle = '#e0b030'; c.fillRect(-r * .05, s > 0 ? -r * .42 : 0, r * .05, r * .42); }
      c.restore();
    }
    // cabine blindée, pare-brise, phares
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(r * .3, -r * .5); c.lineTo(r * .78, -r * .5); c.lineTo(r * .92, -r * .36); c.lineTo(r * .92, r * .36); c.lineTo(r * .78, r * .5); c.lineTo(r * .3, r * .5); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
    c.fillStyle = P.body; rr(c, r * .32, -r * .38, r * .38, r * .76, r * .06); c.fill();
    c.fillStyle = '#1c2224'; c.beginPath(); c.moveTo(r * .72, -r * .36); c.lineTo(r * .84, -r * .3); c.lineTo(r * .84, r * .3); c.lineTo(r * .72, r * .36); c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,210,220,.35)'; c.fillRect(r * .76, -r * .26, r * .03, r * .52);
    c.fillStyle = P.dark; c.fillRect(r * .92, -r * .42, r * .06, r * .84);
    c.fillStyle = wreck(P) ? P.plate : '#fff1c4'; c.beginPath(); c.rect(r * .9, -r * .41, r * .05, r * .1); c.rect(r * .9, r * .31, r * .05, r * .1); c.fill();
    // échappements derrière la cabine
    c.fillStyle = P.dark; c.beginPath(); disc(c, r * .26, -r * .44, r * .05); disc(c, r * .26, r * .44, r * .05); c.fill();
    if (mv > .1) for (const s of [-1, 1]) { const f = frac(t * 2 + s * .3); puff(c, r * (.2 - f * .4), s * r * .46, r * (.04 + f * .1), (1 - f) * .3 * mv); }
  });

  // ---- Donjon : bunker crénelé sur quatre chenilles, tours d'angle, meurtrières, vérins qui se calent à l'arrêt
  def('donjon', (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), dep = clamp(1 - mv * 2.5, 0, 1), fine = R * PX > 72;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) treads(c, sx > 0 ? R * .06 : -R * .84, sy * R * .8 - R * .15, R * .78, R * .3, P, t, R * .8);
    // vérins de calage : sortent en diagonale quand il s'arrête
    const e = R * .32 * dep, J = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) J.push(sx, sy, sx * R * .66, sy * R * .54);
    c.strokeStyle = P.dark; c.lineWidth = R * .11; c.beginPath(); for (let i = 0; i < 16; i += 4) { c.moveTo(J[i + 2], J[i + 3]); c.lineTo(J[i + 2] + J[i] * e, J[i + 3] + J[i + 1] * e); } c.stroke();
    c.strokeStyle = P.plate; c.lineWidth = R * .04; c.beginPath(); for (let i = 0; i < 16; i += 4) { c.moveTo(J[i + 2] + J[i] * R * .1, J[i + 3] + J[i + 1] * R * .1); c.lineTo(J[i + 2] + J[i] * e, J[i + 3] + J[i + 1] * e); } c.stroke();
    if (dep > .05) {
      c.globalAlpha = Math.min(1, dep * 2); c.fillStyle = P.body2; c.beginPath();
      for (let i = 0; i < 16; i += 4) { const ex = J[i + 2] + J[i] * e, ey = J[i + 3] + J[i + 1] * e; for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k / 8 * TAU, x = ex + Math.cos(a) * R * .11, y = ey + Math.sin(a) * R * .11; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
      c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      if (fine) for (let i = 0; i < 16; i += 4) hazard(c, J[i + 2] + J[i] * e - R * .07, J[i + 3] + J[i + 1] * e - R * .025, R * .14, R * .05, R * .03);
      c.globalAlpha = 1;
    }
    // rempart extérieur
    const a = R * .8, b = R * .66, ch = R * .16;
    const wall = k => { c.beginPath(); c.moveTo(-a * k + ch, -b * k); c.lineTo(a * k - ch, -b * k); c.lineTo(a * k, -b * k + ch); c.lineTo(a * k, b * k - ch); c.lineTo(a * k - ch, b * k); c.lineTo(-a * k + ch, b * k); c.lineTo(-a * k, b * k - ch); c.lineTo(-a * k, -b * k + ch); c.closePath(); };
    c.fillStyle = P.body2; wall(1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke();
    // créneaux sur le pourtour
    const m = R * .07; c.fillStyle = P.plate; c.beginPath();
    for (let k = 0; k < 9; k++) { const x = -a + ch + k * (2 * a - 2 * ch) / 8.5; c.rect(x, -b, m, m * .8); c.rect(x, b - m * .8, m, m * .8); }
    for (let k = 0; k < 6; k++) { const y = -b + ch + k * (2 * b - 2 * ch) / 5.5; c.rect(-a, y, m * .8, m); c.rect(a - m * .8, y, m * .8, m); }
    c.fill();
    // cour intérieure et chemin de ronde
    c.fillStyle = P.body; wall(.82); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 1.5; c.stroke();
    // meurtrières (lueur plus vive une fois calé)
    const fl = .35 + .25 * dep + .1 * Math.sin(t * 7), dy = s => s > 0 ? R * .03 : 0;
    c.fillStyle = P.dark; c.beginPath(); for (const s of [-1, 1]) for (const x of [-.12, .12]) c.rect(x * R - R * .04, s * b - R * .02 - dy(s), R * .08, R * .05); for (const y of [-.2, .2]) c.rect(-a + R * .01, y * R - R * .04, R * .05, R * .08); c.fill();
    if (!wreck(P)) { c.fillStyle = P.glow + fl.toFixed(3) + ')'; c.beginPath(); for (const s of [-1, 1]) for (const x of [-.12, .12]) c.rect(x * R - R * .03, s * b - R * .01 - dy(s), R * .06, R * .02); for (const y of [-.2, .2]) c.rect(-a + R * .02, y * R - R * .03, R * .02, R * .06); c.fill(); }
    // herse à l'avant
    c.fillStyle = P.dark; c.fillRect(a - R * .07, -R * .17, R * .1, R * .34); c.strokeStyle = P.plate; c.lineWidth = lw * 1.5; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(a - R * .06, k * R * .06); c.lineTo(a + R * .02, k * R * .06); } c.stroke();
    // tours d'angle (sous les affûts), crénelées, et donjon central
    const TW = MOUNTS.donjon, trr = i => R * (i < 2 ? .23 : .2);
    if (fine) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); TW.forEach(([x, y], i) => disc(c, x * R + R * .03, y * R + R * .04, trr(i))); c.fill(); }
    c.fillStyle = P.body2; c.beginPath(); TW.forEach(([x, y], i) => disc(c, x * R, y * R, trr(i))); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    if (fine) { c.strokeStyle = P.plate; c.lineWidth = R * .06; const q = TAU * R * .2 * .88 / 20; c.setLineDash([q, q]); c.beginPath(); TW.forEach(([x, y], i) => disc(c, x * R, y * R, trr(i) * .88)); c.stroke(); c.setLineDash([]); }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-R * .17, -R * .19, R * .38, R * .38);
    c.fillStyle = P.plate; c.fillRect(-R * .2, -R * .2, R * .38, R * .38); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.strokeRect(-R * .2, -R * .2, R * .38, R * .38);
    c.fillStyle = P.body2; c.beginPath(); for (let k = 0; k < 4; k++) { const q = -R * .2 + k * R * .11; c.rect(q, -R * .2, R * .05, R * .05); c.rect(q, R * .13, R * .05, R * .05); c.rect(-R * .2, q, R * .05, R * .05); c.rect(R * .13, q, R * .05, R * .05); } c.fill();
    glowCore(c, -R * .01, 0, R * .1 * (1 + dep * .4), P, t);
  });

  // ---- Minotaure : bipède cornu, sabots énormes (pas lourds), naseaux fumants
  const MINO_RIV = [.05, -.11, .05, .11, .33, -.11, .33, .11];
  def('minotaure', (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), fine = R * PX > 70;
    gait(u, [[-.16, -.28, -.2, -.47], [-.16, .28, -.2, .47]], R, t, mv, { stride: .45, dur: .44, f: 2.9, amp: .45, thud: giantThud }).forEach(g => {
      const k = 1 + g.lift * .16, fx = g.fx, fy = g.fy;
      c.strokeStyle = P.dark; c.lineWidth = R * .2; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(fx, fy); c.stroke();
      if (g.lift > .05) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(fx + R * .07 * g.lift, fy + R * .1 * g.lift, R * .2, R * .17, 0, 0, TAU); c.fill(); }
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(fx - R * .12 * k, fy, R * .1 * k, R * .17 * k, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
      // sabot fendu : deux onglons
      c.fillStyle = P.body2; c.beginPath(); for (const j of [-1, 1]) { c.moveTo(fx + R * .26 * k, fy + j * R * .1 * k); c.ellipse(fx + R * .05 * k, fy + j * R * .1 * k, R * .21 * k, R * .095 * k, 0, 0, TAU); } c.fill(); c.stroke();
      c.fillStyle = P.dark; c.fillRect(fx + R * .1 * k, fy - R * .012, R * .17 * k, R * .024);
    });
    // dos massif et crête dorsale
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .2, 0, R * .34, R * .38, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = IVORY; c.beginPath(); for (let k = 0; k < 3; k++) { const x = -R * (.38 + k * .07); c.moveTo(x + R * .05, -R * .04); c.lineTo(x - R * .06, 0); c.lineTo(x + R * .05, R * .04); c.closePath(); } c.fill();
    // épaulières rivetées
    c.fillStyle = P.plate; c.strokeStyle = P.dark; c.lineWidth = lw * 2; for (const s of [-1, 1]) { rr(c, -R * .01, s * R * .62 - R * .17, R * .4, R * .34, R * .1); c.fill(); c.stroke(); }
    if (fine) { c.fillStyle = P.dark; c.beginPath(); for (const s of [-1, 1]) for (let i = 0; i < 8; i += 2) disc(c, MINO_RIV[i] * R, s * R * .62 + MINO_RIV[i + 1] * R, R * .022); c.fill(); }
    // poitrail
    c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .08, 0, R * .34, R * .46, 0, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * 1.2; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(R * .2, k * R * .13); c.lineTo(R * .36, k * R * .11); } c.stroke();
    // cornes
    c.fillStyle = IVORY; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(R * .44, s * R * .13); c.quadraticCurveTo(R * .46, s * R * .54, R * .8, s * R * .58); c.quadraticCurveTo(R * .56, s * R * .42, R * .56, s * R * .12); c.closePath(); } c.fill(); c.strokeStyle = IVORY_D; c.lineWidth = lw * 1.2; c.stroke();
    if (fine) { c.strokeStyle = 'rgba(92,87,76,.6)'; c.lineWidth = lw; c.beginPath(); for (const s of [-1, 1]) for (let k = 1; k < 4; k++) { const q = k / 4, x = R * (.44 + q * .12), y = s * R * (.13 + q * .3); c.moveTo(x - R * .03, y); c.lineTo(x + R * .04, y - s * R * .02); } c.stroke(); }
    // tête de taureau
    c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .36, -R * .2); c.lineTo(R * .6, -R * .18); c.lineTo(R * .74, -R * .1); c.lineTo(R * .76, R * .1); c.lineTo(R * .6, R * .18); c.lineTo(R * .36, R * .2); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); c.ellipse(R * .69, 0, R * .08, R * .12, 0, 0, TAU); c.fill();
    c.fillStyle = P.dark; c.beginPath(); disc(c, R * .73, -R * .05, R * .025); disc(c, R * .73, R * .05, R * .025); c.fill();
    c.strokeStyle = IVORY; c.lineWidth = lw * 1.5; c.beginPath(); c.arc(R * .77, 0, R * .05, -1.2, 1.2); c.stroke();
    if (fine) for (const s of [-1, 1]) glow(c, R * .56, s * R * .1, R * .07, P, .7);
    c.fillStyle = P.acc; c.beginPath(); disc(c, R * .56, -R * .1, R * .022); disc(c, R * .56, R * .1, R * .022); c.fill();
    // naseaux fumants
    if (fine) for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const f = frac(t * 1.2 + k / 3 + (s > 0 ? .5 : 0)); puff(c, R * (.78 + f * .3), s * R * (.05 + f * .16), R * (.025 + f * .07), (1 - f) * .3, '205,205,198'); }
  });

  // ---- Chimère : quadrupède hybride, tête de lion à crinière de lames, cornes, queue-serpent armée
  def('chimere', (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), fine = R * PX > 70;
    // queue-serpent : ses deux bouts sont fixes (la tête porte l'affût arrière), le milieu ondule ; anneaux de deux teintes
    const [tx, ty] = MOUNTS.chimere[3], x0 = -R * .55, x1 = tx * R, y1 = ty * R, N = 10, s1 = Math.sin(t * 1.7), c1 = Math.cos(t * 1.1);
    const TX = i => lerp(x0, x1, i / N), TY = i => lerp(0, y1, i / N) + R * (.2 * Math.sin(i / N * TAU) * s1 + .12 * Math.sin(i / N * Math.PI) * c1), TW = i => R * (.12 - i * .004);
    for (const odd of [0, 1]) { c.fillStyle = odd ? P.body2 : P.body; c.beginPath(); for (let i = N - 1 - ((N - 1 - odd) & 1); i >= 0; i -= 2) disc(c, TX(i), TY(i), TW(i)); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke(); }
    if (fine) { c.fillStyle = P.plate; c.beginPath(); for (let i = 0; i < N; i++) disc(c, TX(i), TY(i), TW(i) * .35); c.fill(); }
    { const a = Math.atan2(y1 - TY(N - 1), x1 - TX(N - 1));
      c.fillStyle = P.body; c.beginPath(); poly(c, x1, y1, a, [.17, 0, .02, -.11, -.1, -.07, -.1, .07, .02, .11], R); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
      c.fillStyle = IVORY; c.beginPath(); poly(c, x1, y1, a, [.13, -.03, .22, -.05, .13, -.06], R); poly(c, x1, y1, a, [.13, .03, .22, .05, .13, .06], R); c.fill();
      c.fillStyle = P.acc; c.beginPath(); for (const s of [-1, 1]) disc(c, x1 + Math.cos(a) * R * .06 - Math.sin(a) * s * R * .065, y1 + Math.sin(a) * R * .06 + Math.cos(a) * s * R * .065, R * .022); c.fill(); }
    // pattes de lion griffues
    gait(u, [[.3, -.3, .48, -.74], [.3, .3, .48, .74], [-.32, -.28, -.4, -.74], [-.32, .28, -.4, .74]], R, t, mv, { groups: [0, 1, 1, 0], stride: .36, dur: .36, f: 3.2, amp: .3, thud: giantThud })
      .forEach((g, k) => { legIK(c, g, R * .32, R * .34, (k < 2 ? 1 : -1) * (g.hy < 0 ? 1 : -1), R * .14, P, R * .1); if (fine) claws(c, g.fx + R * .08 * (1 + g.lift * .35), g.fy, 0, R * .08, R * .018, 3, R * .045 * (1 + g.lift * .35)); });
    // corps de lion : arrière-train, torse, côtes
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .36, 0, R * .28, R * .34, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .02, 0, R * .54, R * .4, 0, 0, TAU); c.fill(); c.stroke();
    const ribs = dx => { c.beginPath(); for (let k = 0; k < 4; k++) { const x = -R * (.08 + k * .1) + dx; for (const s of [-1, 1]) { c.moveTo(x, s * R * .12); c.quadraticCurveTo(x - R * .04, s * R * .26, x + R * .02, s * R * .37); } } };
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * 1.4; ribs(0); c.stroke();
    c.fillStyle = P.plate; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(-R * .06, s * R * .3); c.ellipse(-R * .26, s * R * .3, R * .2, R * .12, 0, 0, TAU); } c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
    // coutures lumineuses entre les côtes : elles pulsent (régénération)
    const p = .5 + .5 * Math.sin(t * 2.2);
    if (!wreck(P)) { c.strokeStyle = P.glow + (.2 + .4 * p).toFixed(3) + ')'; c.lineWidth = lw * 1.2; ribs(R * .05); c.stroke(); }
    // crinière de lames (deux teintes)
    const hx = R * .62;
    for (const odd of [0, 1]) { c.fillStyle = odd ? P.plate : P.body2; c.beginPath(); for (let k = odd; k < 14; k += 2) { const q = k / 14 * TAU, e = R * (.36 + odd * .05); c.moveTo(hx + Math.cos(q - .2) * R * .2, Math.sin(q - .2) * R * .2); c.lineTo(hx + Math.cos(q) * e, Math.sin(q) * e); c.lineTo(hx + Math.cos(q + .2) * R * .2, Math.sin(q + .2) * R * .2); c.closePath(); } c.fill(); if (fine || odd) { c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke(); } }
    // cornes de bouc, recourbées vers l'arrière
    c.fillStyle = IVORY; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(hx - R * .02, s * R * .07); c.quadraticCurveTo(hx - R * .1, s * R * .5, hx - R * .48, s * R * .36); c.quadraticCurveTo(hx - R * .18, s * R * .34, hx - R * .12, s * R * .15); c.closePath(); } c.fill(); c.strokeStyle = IVORY_D; c.lineWidth = lw * 1.2; c.stroke();
    if (fine) { c.strokeStyle = 'rgba(92,87,76,.65)'; c.lineWidth = lw; c.beginPath(); for (const s of [-1, 1]) for (let k = 1; k < 5; k++) { const q = k / 5, x = hx - R * (.06 + q * .3), y = s * R * (.12 + q * .26); c.moveTo(x, y - s * R * .05); c.lineTo(x + R * .03, y + s * R * .04); } c.stroke(); }
    // visage
    c.fillStyle = P.body; c.beginPath(); disc(c, hx + R * .04, 0, R * .19); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(hx + R * .18, 0, R * .1, R * .12, 0, 0, TAU); c.fill();
    c.fillStyle = P.dark; c.beginPath(); c.moveTo(hx + R * .24, -R * .04); c.lineTo(hx + R * .28, 0); c.lineTo(hx + R * .24, R * .04); c.closePath(); c.fill();
    if (fine) for (const s of [-1, 1]) glow(c, hx + R * .08, s * R * .08, R * .07, P, .6 + .3 * p);
    c.fillStyle = P.acc; c.beginPath(); disc(c, hx + R * .08, -R * .08, R * .02); disc(c, hx + R * .08, R * .08, R * .02); c.fill();
  });

  // ---- Condor : grand rapace mécanique, ailes déployées aux plumes-lames, réacteurs
  const CONDOR_TAIL = [0, -.06, .48, -.05, .54, 0, .48, .05, 0, .06], CONDOR_PRIM = [0, -.05, .36, -.02, .42, .01, 0, .05], CONDOR_TIP = [.2, -.03, .42, .01, .2, 0];
  def('condor', (c, r, P, t, mv, u) => {
    const R = r, lw = Math.max(1.5, R * .01), fl = Math.sin(t * 1.4), sp = 1 + fl * .04, fine = R * PX > 70, Y = (s, v) => s * R * v * sp;
    // queue en éventail
    for (const odd of [0, 1]) { c.fillStyle = odd ? P.body2 : P.plate; c.beginPath(); for (let k = -2 + odd; k <= 2; k += 2) poly(c, -R * .5, 0, Math.PI + k * .22, CONDOR_TAIL, R); c.fill(); if (fine || odd) { c.strokeStyle = P.dark; c.lineWidth = lw * 1.2; c.stroke(); } }
    // rémiges primaires écartées au bout des ailes (doigts) et leurs pointes d'acier
    const prim = (pts) => { c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 5; k++) poly(c, -R * (.04 + k * .06), Y(s, 1.08 + k * .04), s * (1.25 + k * .2 + fl * .05), pts, R); };
    c.fillStyle = P.body2; prim(CONDOR_PRIM); c.fill(); if (fine) { c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke(); }
    if (fine) { c.fillStyle = STEEL; prim(CONDOR_TIP); c.fill(); }
    // plumes-lames du bord de fuite
    for (const odd of [0, 1]) { c.fillStyle = odd ? P.plate : P.body2; c.beginPath(); for (const s of [-1, 1]) for (let k = odd; k < 7; k += 2) { const y = Y(s, .24 + k * .12), x = -R * (.3 + odd * .02); c.moveTo(x + R * .04, y - s * R * .06); c.lineTo(x - R * .26, y + s * R * .01); c.lineTo(x + R * .04, y + s * R * .06); c.closePath(); } c.fill(); if (fine || odd) { c.strokeStyle = P.dark; c.lineWidth = lw; c.stroke(); } }
    if (fine) { c.strokeStyle = STEEL; c.lineWidth = lw; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { const y = Y(s, .24 + k * .12), x = -R * (.3 + (k & 1) * .02); c.moveTo(x - R * .02, y); c.lineTo(x - R * .25, y + s * R * .01); } c.stroke(); }
    // ailes
    c.fillStyle = P.body2; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(R * .2, s * R * .14); c.lineTo(R * .17, Y(s, .55)); c.quadraticCurveTo(R * .1, Y(s, .92), -R * .02, Y(s, 1.08)); c.lineTo(-R * .28, Y(s, 1.22)); c.lineTo(-R * .34, Y(s, 1.0)); c.lineTo(-R * .34, Y(s, .2)); c.closePath(); } c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.plate; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(R * .18, s * R * .16); c.lineTo(R * .15, Y(s, .55)); c.quadraticCurveTo(R * .08, Y(s, .9), -R * .04, Y(s, 1.04)); c.lineTo(-R * .1, Y(s, .86)); c.quadraticCurveTo(-R * .02, Y(s, .5), R * .02, s * R * .16); c.closePath(); } c.fill();
    if (fine) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw; c.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const y = .3 + k * .15; c.moveTo(-R * .04, Y(s, y)); c.lineTo(-R * .3, Y(s, y + .02)); } c.stroke(); }
    // réacteurs sous les ailes
    const jx = -R * .16;
    c.fillStyle = P.dark; for (const s of [-1, 1]) { rr(c, jx - R * .16, Y(s, .84) - R * .07, R * .34, R * .14, R * .06); c.fill(); }
    c.fillStyle = P.plate; c.beginPath(); for (const s of [-1, 1]) c.rect(jx + R * .06, Y(s, .84) - R * .07, R * .03, R * .14); c.fill();
    if (!wreck(P)) for (const s of [-1, 1]) glow(c, jx - R * .2, Y(s, .84), R * (.1 + .02 * Math.sin(t * 20 + s)), P, .55 + .3 * mv);
    // fuselage, collerette, tête chauve au bec crochu
    c.fillStyle = P.body; c.beginPath(); c.ellipse(-R * .06, 0, R * .54, R * .21, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
    c.fillStyle = P.body2; c.fillRect(-R * .48, -R * .05, R * .8, R * .1);
    c.fillStyle = P.plate; c.beginPath(); for (let k = 0; k < 10; k++) { const q = k / 10 * TAU; c.moveTo(R * .44 + Math.cos(q - .3) * R * .08, Math.sin(q - .3) * R * .08); c.lineTo(R * .44 + Math.cos(q) * R * .16, Math.sin(q) * R * .16); c.lineTo(R * .44 + Math.cos(q + .3) * R * .08, Math.sin(q + .3) * R * .08); c.closePath(); } c.fill();
    c.fillStyle = P.body2; c.beginPath(); c.ellipse(R * .58, 0, R * .1, R * .075, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
    c.fillStyle = IVORY; c.beginPath(); c.moveTo(R * .64, -R * .045); c.quadraticCurveTo(R * .78, -R * .04, R * .84, R * .01); c.lineTo(R * .76, R * .02); c.quadraticCurveTo(R * .72, R * .04, R * .64, R * .045); c.closePath(); c.fill(); c.strokeStyle = IVORY_D; c.lineWidth = lw; c.stroke();
    c.fillStyle = P.acc; c.beginPath(); disc(c, R * .6, -R * .045, R * .018); disc(c, R * .6, R * .045, R * .018); c.fill();
  });
})();
