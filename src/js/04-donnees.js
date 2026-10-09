// Données du jeu : modules, châssis, armes, ennemis, bâtiments, recherches, régions, contrats.

// ================= MODULES, VÉTÉRANS, FORMATIONS =================
const MODULES = {
  armor: { n: 'Blindage réactif', cost: { alloy: 15, scrap: 20 }, d: '+12 % de blindage, −5 % de vitesse.' },
  plating: { n: 'Plaques lourdes', cost: { alloy: 30 }, d: '+30 % de PV, −12 % de vitesse.' },
  thrusters: { n: 'Propulseurs', cost: { scrap: 25, circuits: 8 }, d: '+25 % de vitesse.' },
  sensors: { n: 'Capteurs longue portée', cost: { circuits: 20, crystals: 6 }, d: '+12 % de portée, détection +40 %.' },
  stabil: { n: 'Stabilisateurs', cost: { circuits: 18, alloy: 10 }, d: 'Tir deux fois plus précis, tourelles plus vives, +8 % de dégâts.' },
  regen: { n: 'Nano-régénération', cost: { crystals: 15, circuits: 10 }, d: 'Répare 1,2 % des PV par seconde hors combat.' },
  cargo: { n: 'Soute étendue', cost: { scrap: 20, alloy: 6 }, d: '+60 % de soute (au moins +5 kg).' },
  cloak: { n: 'Camouflage optique', cost: { crystals: 30, circuits: 25, cores: 1 }, d: 'Repéré à 40 % de la distance de vue ennemie, sauf quand il tire.' },
  selfdestruct: { n: 'Charge d\'autodestruction', cost: { scrap: 25, crystals: 8 }, d: 'Explose violemment quand il est détruit.' },
  overcharge: { n: 'Surcharge', active: 1, cd: 28, dur: 6, cost: { circuits: 25, crystals: 15 }, d: 'Capacité : cadence ×1,8 pendant 6 s. Recharge 28 s.' },
  emshield: { n: 'Bouclier d\'urgence', active: 1, cd: 35, cost: { crystals: 25, circuits: 20 }, d: 'Capacité : bouclier instantané de 45 % des PV. Recharge 35 s.' },
  jump: { n: 'Réacteurs de saut', active: 1, cd: 14, cost: { alloy: 25, circuits: 15 }, d: 'Capacité : bond vers la cible et onde de choc. Recharge 14 s.' },
};
const MODULE_KEYS = Object.keys(MODULES);
const modSlots = ch => [0, 1, 1, 2, 2, 3, 3, 4, 4, 5][CHASSIS[ch].tier];
const moduleUnlocked = id => has('m_' + id);
const TRAITS = {
  sniper: { n: 'Œil de lynx', d: '+15 % de portée' },
  tough: { n: 'Increvable', d: '+20 % de PV' },
  fast: { n: 'Fonceur', d: '+15 % de vitesse' },
  brute: { n: 'Brute', d: '+15 % de dégâts' },
  lucky: { n: 'Chanceux', d: '12 % d\'esquive' },
  mender: { n: 'Bricoleur', d: 'Se répare en continu' },
};
const TRAIT_KEYS = Object.keys(TRAITS);
const RANKS = ['Recrue', 'Confirmé', 'Vétéran', 'Élite', 'Héros'];
const RANK_XP = [0, 30, 90, 220, 500];
function xpNeed(ch, rk) { return Math.round(RANK_XP[rk] * (1 + (CHASSIS[ch].tier - 1) * .5)); }
function rankOf(ch, xp) { let r = 0; for (let k = 1; k < 5; k++) if (xp >= xpNeed(ch, k)) r = k; return r; }
function robotStats(sr) {
  const ch = CHASSIS[sr.chassis], rk = rankOf(sr.chassis, sr.xp || 0), M = sr.modules || [], T = sr.traits || [];
  const s = { hp: ch.hp * (1 + .07 * rk), armor: ch.armor || 0, spd: ch.spd, cargo: ch.cargo, sight: ch.sight || 1, dmg: 1 + .06 * rk, range: 1, spread: 1 - .08 * rk, turn: 1, regen: 0, dodge: 0, cloak: false, boom: false, rank: rk };
  for (const m of M) switch (m) {
    case 'armor': s.armor = Math.min(.7, s.armor + .12); s.spd *= .95; break;
    case 'plating': s.hp *= 1.3; s.spd *= .88; break;
    case 'thrusters': s.spd *= 1.25; break;
    case 'sensors': s.range *= 1.12; s.sight *= 1.4; break;
    case 'stabil': s.spread *= .5; s.turn *= 1.5; s.dmg *= 1.08; break;
    case 'regen': s.regen += .012; break;
    case 'cargo': s.cargo = Math.max(s.cargo + 5, Math.round(s.cargo * 1.6)); break;
    case 'cloak': s.cloak = true; break;
    case 'selfdestruct': s.boom = true; break;
  }
  for (const t of T) switch (t) {
    case 'sniper': s.range *= 1.15; break; case 'tough': s.hp *= 1.2; break; case 'fast': s.spd *= 1.15; break;
    case 'brute': s.dmg *= 1.15; break; case 'lucky': s.dodge = .12; break; case 'mender': s.regen += .006; break;
  }
  if (ch.perk === 'range') s.range *= 1.2;
  s.hp = Math.round(s.hp); return s;
}
function scaledWeapon(id, st) {
  const d = Object.assign({}, WEAPONS[id]);
  if (d.dmg) d.dmg *= st.dmg; if (d.dps) d.dps *= st.dmg; if (d.heal) d.heal *= st.dmg;
  if (d.range && d.kind !== 'melee') d.range *= st.range;
  if (d.spread) d.spread *= Math.max(.1, st.spread);
  d.turnMul = st.turn; return d;
}

const FORMATIONS = { free: 'Libre', line: 'Ligne', wedge: 'Coin', circle: 'Cercle', column: 'Colonne' };
const FORM_KEYS = Object.keys(FORMATIONS);
let formation = 'free';
// renvoie des décalages [avant, côté] relatifs à un point d'ancrage orienté
function formationSlots(n, kind, sp, hollow) {
  const out = [];
  switch (kind) {
    case 'line': { const cols = Math.max(1, Math.ceil(Math.sqrt(n * 4))); for (let i = 0; i < n; i++) { const row = Math.floor(i / cols), col = i % cols, w = Math.min(cols, n - row * cols); out.push([-row * sp, (col - (w - 1) / 2) * sp]); } break; }
    case 'wedge': for (let i = 0; i < n; i++) { const k = Math.ceil(i / 2), s = i === 0 ? 0 : (i % 2 ? 1 : -1); out.push([-k * sp * .85, s * k * sp * .8]); } break;
    case 'circle': { let i = 0, ring = hollow ? 1 : 0; while (i < n) { const rad = ring * sp, cap = ring === 0 ? 1 : Math.max(6, Math.floor(TAU * rad / sp)); for (let k = 0; k < cap && i < n; k++, i++) { const a = k / cap * TAU + ring * .4; out.push([Math.cos(a) * rad, Math.sin(a) * rad]); } ring++; } break; }
    case 'column': for (let i = 0; i < n; i++) out.push([-Math.floor(i / 2) * sp, (i % 2 ? .5 : -.5) * sp]); break;
    default: for (let i = 0; i < n; i++) { const a = i * 2.39996, r = Math.sqrt(i) * sp * .9; out.push([Math.cos(a) * r, Math.sin(a) * r]); }
  }
  return out;
}

// ================= DONNÉES =================
const RES = {
  scrap: { n: 'Ferraille', w: .1, c: '#c4a77a' },
  alloy: { n: 'Alliage', w: .25, c: '#9fbad0' },
  circuits: { n: 'Circuits', w: .08, c: '#69d07f' },
  crystals: { n: 'Cristaux', w: .15, c: '#c381ff' },
  cores: { n: 'Noyaux IA', w: 1, c: '#ffcf4a' },
  data: { n: 'Données', w: .02, c: '#7fa9ff' },
  heart: { n: 'Cœur de Colosse', w: 10, c: '#ff5a3c' },
};
const RES_KEYS = Object.keys(RES);
const WSIZE_N = ['', 'Légère', 'Moyenne', 'Lourde', 'Titanesque'];
const WSIZE_PL = ['', 'Légères', 'Moyennes', 'Lourdes', 'Titanesques'];

const WEAPONS = {
  // ---- légères
  mg: { n: 'Mitrailleuse', size: 1, dmg: 6, rate: 8, spd: 950, range: 520, spread: .09, kind: 'bullet', col: '#ffd27a', snd: 'mg', cost: { scrap: 10 }, d: 'Tir soutenu, polyvalente.' },
  rifle: { n: 'Fusil long', size: 1, dmg: 22, rate: 1.6, spd: 1350, range: 720, spread: .02, kind: 'bullet', col: '#fff1b8', snd: 'shot', cost: { scrap: 12, circuits: 2 }, d: 'Précis et longue portée.' },
  blades: { n: 'Lames', size: 1, dmg: 26, rate: 2, range: 40, kind: 'melee', col: '#e8f0ff', snd: 'melee', cost: { scrap: 8, alloy: 2 }, d: 'Corps à corps dévastateur.' },
  scatter: { n: 'Grenailleuse', size: 1, dmg: 7, pellets: 6, rate: 1.5, spd: 850, range: 320, spread: .3, kind: 'bullet', col: '#ffe6a8', snd: 'cannon', cost: { scrap: 14, alloy: 3 }, d: 'Six plombs par tir, à bout portant.' },
  flamer: { n: 'Lance-flammes', size: 1, dmg: 3.6, rate: 22, spd: 380, range: 240, spread: .26, kind: 'flame', col: '#ff8a2a', snd: 'flame', cost: { scrap: 14, crystals: 4 }, d: 'Traverse les cibles, brûle la forêt.' },
  grenade: { n: 'Lance-grenades', size: 1, dmg: 32, rate: .85, range: 480, minRange: 60, splash: 62, arc: 45, kind: 'lob', col: '#c8e07a', snd: 'shot', cost: { scrap: 16, alloy: 5 }, d: 'Tir en cloche, passe par-dessus les murs.' },
  tesla: { n: 'Arc électrique', size: 1, dmg: 15, rate: 1.6, range: 300, chain: 3, chainR: 160, kind: 'chain', col: '#9fd8ff', snd: 'tesla', cost: { circuits: 12, crystals: 6 }, d: 'L\'arc rebondit sur trois cibles.' },
  repair: { n: 'Nano-réparateur', size: 1, heal: 15, range: 240, kind: 'repair', col: '#6fb5a4', cost: { circuits: 10, crystals: 4 }, d: 'Répare alliés et pilote.' },
  // ---- moyennes
  laser: { n: 'Laser', size: 2, dmg: 12, rate: 6, spd: 1900, range: 640, spread: .012, kind: 'laser', col: '#ff5fd8', snd: 'laser', cost: { circuits: 14, crystals: 10 }, d: 'Précis, perce deux cibles.' },
  rockets: { n: 'Roquettes', size: 2, dmg: 40, rate: 1.1, spd: 520, range: 820, spread: .12, kind: 'rocket', splash: 80, col: '#ffb020', snd: 'rocket', cost: { scrap: 30, alloy: 10, circuits: 6 }, d: 'Autoguidées, dégâts de zone.' },
  cannon: { n: 'Canon', size: 2, dmg: 58, rate: .7, spd: 820, range: 740, spread: .03, kind: 'shell', splash: 65, col: '#ffe0a0', snd: 'cannon', cost: { scrap: 40, alloy: 20 }, d: 'Obus explosifs anti-blindés.' },
  gatling: { n: 'Minigun rotatif', size: 2, dmg: 7, rate: 24, spin: 1.3, spd: 1150, range: 620, spread: .07, kind: 'bullet', col: '#ffd27a', snd: 'mg', cost: { scrap: 40, alloy: 18, circuits: 8 }, d: 'Lent à lancer, puis un mur de balles.' },
  swarm: { n: 'Essaim de missiles', size: 2, dmg: 20, salvo: 6, rate: .42, spd: 540, range: 860, spread: .1, splash: 42, kind: 'rocket', col: '#ffb020', snd: 'rocket', cost: { alloy: 20, circuits: 22 }, d: 'Salve de six mini-missiles guidés.' },
  napalm: { n: 'Canon à napalm', size: 2, dmg: 22, rate: .6, spd: 620, range: 560, spread: .05, splash: 70, burn: { r: 85, t: 6, dps: 26 }, kind: 'shell', col: '#ff7a30', snd: 'cannon', cost: { scrap: 30, crystals: 20 }, d: 'Laisse un brasier pendant 6 s.' },
  plasma: { n: 'Canon à plasma', size: 2, dmg: 70, rate: .55, spd: 520, range: 700, spread: .02, splash: 80, pierce: 3, kind: 'plasma', col: '#b08bff', snd: 'laser', cost: { circuits: 20, crystals: 30 }, d: 'Boule qui traverse trois cibles puis explose.' },
  shield: { n: 'Projecteur de bouclier', size: 2, cap: 140, regen: 28, range: 280, kind: 'shield', col: '#7fc8ff', cost: { circuits: 30, crystals: 25, cores: 1 }, d: 'Bouclier régénérant sur les alliés proches.' },
  bay: { n: 'Baie à drones', size: 2, max: 3, rate: .18, range: 450, kind: 'bay', col: '#6fe3c8', cost: { scrap: 50, circuits: 30 }, d: 'Libère jusqu\'à trois drones de combat.' },
  // ---- lourdes
  rail: { n: 'Railgun', size: 3, dmg: 190, rate: .35, range: 1150, kind: 'rail', col: '#7ef9ff', snd: 'rail', cost: { alloy: 60, circuits: 40, crystals: 30, cores: 1 }, d: 'Traverse tout sur sa ligne.' },
  mortar: { n: 'Mortier lourd', size: 3, dmg: 85, rate: .33, range: 1250, minRange: 240, splash: 125, kind: 'mortar', col: '#ffa060', snd: 'cannon', cost: { scrap: 120, alloy: 50, crystals: 20 }, d: 'Bombarde par-dessus les obstacles.' },
  beam: { n: 'Rayon thermique', size: 3, dps: 170, range: 760, kind: 'beam', col: '#ff6a3a', snd: 'beam', cost: { crystals: 60, circuits: 50, cores: 1 }, d: 'Rayon continu qui balaie et fait fondre.' },
  siege: { n: 'Canon de siège', size: 3, dmg: 280, rate: .24, spd: 700, range: 1050, spread: .03, splash: 165, kind: 'shell', col: '#ffe0a0', snd: 'cannon', cost: { scrap: 150, alloy: 120 }, d: 'Un obus, un pâté de maisons.' },
  cruise: { n: 'Missile de croisière', size: 3, dmg: 420, rate: .12, spd: 400, range: 1750, spread: .05, splash: 230, big: 1, kind: 'rocket', col: '#ff9a40', snd: 'rocket', cost: { alloy: 80, circuits: 60, cores: 1 }, d: 'Très longue portée, énorme explosion.' },
  storm: { n: 'Bobine tempête', size: 3, dmg: 55, rate: 1.1, range: 480, chain: 8, chainR: 240, kind: 'chain', col: '#a8e4ff', snd: 'tesla', cost: { circuits: 80, crystals: 60, cores: 1 }, d: 'La foudre saute sur huit cibles.' },
  // ---- titanesques
  fusion: { n: 'Canon à fusion', size: 4, dmg: 1300, rate: .12, range: 1700, width: 46, charge: 1.3, kind: 'fusion', col: '#9ff6ff', snd: 'rail', cost: { alloy: 300, crystals: 250, cores: 6 }, d: 'Se charge, puis tranche le paysage.' },
  nuke: { n: 'Missile tactique Aube', size: 4, dmg: 2400, rate: .045, range: 2300, minRange: 500, splash: 430, kind: 'nuke', col: '#fff1b0', snd: 'cannon', cost: { alloy: 400, circuits: 200, cores: 10 }, d: 'Rase un quartier entier. Recharge 22 s.' },
  // ---- internes
  mg_mini: { hidden: 1, size: 1, dmg: 5, rate: 5, spd: 900, range: 420, spread: .1, kind: 'bullet', col: '#bff5e6', snd: 'mg' },
  e_pistol: { hidden: 1, dmg: 5, rate: 1.5, spd: 780, range: 430, spread: .13, kind: 'bullet', col: '#ff9a7a', snd: 'shot' },
  e_rifle: { hidden: 1, dmg: 9, rate: 1.1, spd: 1000, range: 580, spread: .07, kind: 'bullet', col: '#ff9a7a', snd: 'shot' },
  e_sting: { hidden: 1, dmg: 3, rate: 2, spd: 650, range: 220, spread: .2, kind: 'bullet', col: '#ff6070', snd: 'laser' },
  e_claw: { hidden: 1, dmg: 15, rate: 1.7, range: 40, kind: 'melee', snd: 'melee' },
  e_cannon: { hidden: 1, dmg: 21, rate: .8, spd: 760, range: 680, spread: .05, kind: 'shell', splash: 55, col: '#ffb08a', snd: 'cannon' },
  e_rockets: { hidden: 1, dmg: 23, rate: .9, spd: 480, range: 760, spread: .15, kind: 'rocket', splash: 70, col: '#ff7a50', snd: 'rocket' },
  e_mg: { hidden: 1, dmg: 4.5, rate: 7, spd: 900, range: 560, spread: .12, kind: 'bullet', col: '#ff8a70', snd: 'mg' },
  e_mortar: { hidden: 1, dmg: 58, rate: .3, range: 1100, minRange: 200, splash: 130, kind: 'mortar', col: '#ff6a40', snd: 'cannon' },
  e_lob: { hidden: 1, dmg: 26, rate: .33, range: 950, minRange: 200, splash: 90, kind: 'mortar', col: '#ff6a40', snd: 'cannon' },
  e_laser: { hidden: 1, dmg: 10, rate: 5, spd: 1700, range: 700, spread: .03, kind: 'laser', col: '#ff3050', snd: 'laser' },
  e_ram: { hidden: 1, dmg: 45, rate: .8, range: 40, kind: 'melee', snd: 'crush' },
};
const CRAFT_WEAPONS = Object.keys(WEAPONS).filter(k => !WEAPONS[k].hidden);
const ARTILLERY = { mortar: 1, lob: 1, nuke: 1 };

const CHASSIS = {
  ant: { n: 'Fourmi', tier: 1, hp: 46, r: 9, spd: 215, slots: 1, wsize: 1, cargo: 2, cmd: .5, cost: { scrap: 10, circuits: 1 }, d: 'Minuscule et bon marché : elle compte sur le nombre. Un demi-point de commandement.' },
  crawler: { n: 'Rampeur', tier: 1, hp: 88, r: 13, spd: 175, slots: 1, wsize: 1, cargo: 6, cmd: 1, cost: { scrap: 20, circuits: 2 }, d: 'Petit robot à six pattes. Bon marché, rapide à remplacer.' },
  drone: { n: 'Libellule', tier: 1, hp: 56, r: 12, spd: 245, slots: 1, wsize: 1, cargo: 0, cmd: 1, fly: true, cost: { scrap: 16, circuits: 5 }, d: 'Drone volant. Survole murs, forêts et marais.' },
  scout: { n: 'Éclaireur', tier: 1, hp: 78, r: 13, spd: 285, slots: 1, wsize: 1, cargo: 4, cmd: 1, sight: 2, cost: { scrap: 20, circuits: 4 }, d: 'Buggy très rapide. Révèle la carte deux fois plus loin.' },
  mule: { n: 'Mule', tier: 2, hp: 200, r: 19, spd: 150, slots: 1, wsize: 1, cargo: 45, cmd: 2, cost: { scrap: 55, alloy: 8, circuits: 6 }, d: 'Transporteur blindé : récupère le butin quand votre sac est plein.' },
  sentry: { n: 'Sentinelle', tier: 2, hp: 250, r: 19, spd: 135, slots: 2, wsize: 1, cargo: 6, cmd: 2, armor: .05, cost: { scrap: 70, alloy: 14, circuits: 10 }, d: 'Chenillé polyvalent à deux affûts.' },
  gunship: { n: 'Faucon', tier: 2, hp: 155, r: 17, spd: 215, slots: 2, wsize: 1, cargo: 0, cmd: 2, fly: true, armor: .05, cost: { scrap: 45, alloy: 8, circuits: 14 }, d: 'Hélicoptère de combat à deux affûts légers.' },
  strider: { n: 'Arpenteur', tier: 3, hp: 460, r: 27, spd: 122, slots: 2, wsize: 2, cargo: 15, cmd: 3, crush: 1, armor: .1, cost: { scrap: 150, alloy: 40, circuits: 25, crystals: 12 }, d: 'Marcheur quadrupède. Piétine arbres et cristaux.' },
  spider: { n: 'Tisseuse', tier: 3, hp: 400, r: 24, spd: 145, slots: 3, wsize: 1, cargo: 8, cmd: 3, crush: 1, armor: .1, cost: { scrap: 130, alloy: 30, circuits: 30, crystals: 10 }, d: 'Araignée de combat à trois affûts légers.' },
  rhino: { n: 'Rhinocéros', tier: 3, hp: 650, r: 26, spd: 175, slots: 1, wsize: 2, cargo: 10, cmd: 3, crush: 2, armor: .28, cost: { scrap: 160, alloy: 55, circuits: 15 }, d: 'Bélier blindé : fonce dans le tas et écrase l\'infanterie.' },
  goliath: { n: 'Goliath', tier: 4, hp: 1150, r: 38, spd: 102, slots: 3, wsize: 2, cargo: 30, cmd: 5, crush: 2, armor: .2, cost: { scrap: 240, alloy: 70, circuits: 35, crystals: 25, cores: 1 }, d: 'Char de siège. Roule sur les rochers, les épaves et l\'infanterie.' },
  reaper: { n: 'Faucheuse', tier: 4, hp: 950, r: 32, spd: 170, slots: 2, wsize: 2, cargo: 10, cmd: 4, crush: 1, armor: .15, cost: { scrap: 220, alloy: 80, circuits: 40, crystals: 20, cores: 1 }, d: 'Méca d\'assaut bipède, rapide et agile.' },
  airship: { n: 'Cuirassé', tier: 4, hp: 1700, r: 46, spd: 92, slots: 4, wsize: 2, cargo: 40, cmd: 6, fly: true, armor: .15, cost: { scrap: 380, alloy: 140, circuits: 90, crystals: 50, cores: 2 }, d: 'Navire volant à quatre tourelles. Survole tout.' },
  titan: { n: 'Titan', tier: 5, hp: 2900, r: 62, spd: 88, slots: 4, wsize: 3, cargo: 60, cmd: 8, crush: 3, armor: .32, cost: { scrap: 600, alloy: 180, circuits: 90, crystals: 70, cores: 4 }, d: 'Méca de guerre bipède. Traverse les murs comme du carton.' },
  behemoth: { n: 'Béhémoth', tier: 5, hp: 4400, r: 80, spd: 72, slots: 5, wsize: 3, cargo: 80, cmd: 10, crush: 3, armor: .35, cost: { scrap: 900, alloy: 300, circuits: 150, crystals: 120, cores: 6 }, d: 'Araignée de siège à huit pattes et cinq affûts lourds.' },
  colossus: { n: 'COLOSSE', tier: 6, hp: 11000, r: 145, spd: 74, slots: 6, wsize: 4, cargo: 160, cmd: 14, crush: 4, armor: .5, cost: { scrap: 1500, alloy: 350, circuits: 220, crystals: 220, cores: 10, heart: 1 }, d: 'Forteresse sur chenilles, haute comme un immeuble. Rien ne lui résiste, pas même les remparts.' },
  arche: { n: 'ARCHE', tier: 6, hp: 8500, r: 125, spd: 70, slots: 6, wsize: 4, cargo: 120, cmd: 14, fly: true, armor: .4, cost: { scrap: 1400, alloy: 420, circuits: 300, crystals: 300, cores: 12, heart: 1 }, d: 'Forteresse volante. Elle n\'écrase rien, mais rien ne l\'arrête.' },
};
const CHASSIS_KEYS = Object.keys(CHASSIS);
const MOUNTS = {
  ant: [[.15, 0]], crawler: [[.08, 0]], drone: [[.2, 0]], scout: [[-.08, 0]], mule: [[.5, 0]],
  sentry: [[.05, -.3], [.05, .3]], gunship: [[.18, -.48], [.18, .48]],
  strider: [[.2, -.3], [.2, .3]], spider: [[.3, 0], [-.05, -.34], [-.05, .34]], rhino: [[-.1, 0]],
  goliath: [[.22, 0], [-.32, -.34], [-.32, .34]], reaper: [[.05, -.52], [.05, .52]],
  airship: [[.5, 0], [.17, 0], [-.16, 0], [-.48, 0]],
  titan: [[0, -.62], [0, .62], [.32, -.24], [.32, .24]],
  behemoth: [[.38, 0], [.06, -.36], [.06, .36], [-.3, -.22], [-.3, .22]],
  colossus: [[.36, -.34], [.36, .34], [-.02, -.5], [-.02, .5], [-.4, -.3], [-.4, .3]],
  arche: [[.32, -.3], [.32, .3], [0, -.42], [0, .42], [-.32, -.3], [-.32, .3]],
};
const MSCALE = { ant: .7, crawler: .9, drone: .85, scout: .9, mule: 1, sentry: 1.05, gunship: 1, strider: 1.4, spider: 1.2, rhino: 1.5, goliath: 1.8, reaper: 1.6, airship: 1.9, titan: 2.5, behemoth: 2.7, colossus: 3.4, arche: 3.2 };

const BRAINS = {
  escort: { n: 'Escorte', ic: 'E', d: 'Reste près du pilote et engage les menaces qui s\'approchent de lui.' },
  hunter: { n: 'Chasseur', ic: 'C', d: 'Part au contact de tout ennemi repéré autour de la flotte.' },
  guard: { n: 'Gardien', ic: 'G', d: 'Ne poursuit pas. Se poste autour de la balise dès qu\'elle est posée.' },
  gatherer: { n: 'Récolteur', ic: 'R', d: 'Ramasse le butin, ouvre les caisses quand la voie est libre, abat cristaux et épaves à distance, revient plein.' },
  tactical: { n: 'Cortex tactique', ic: 'T', d: 'Garde sa portée idéale, vise les cibles affaiblies, se replie blessé. Tir 2,5× plus précis.', cost: { cores: 1 } },
};
const BRAIN_KEYS = Object.keys(BRAINS);

const PWEAPONS = {
  pistol: { n: 'Pistolet', dmg: 16, rate: 4, spd: 1050, range: 620, spread: .03, mag: 12, reload: 1, kind: 'bullet', col: '#ffe6a8', snd: 'shot', gun: 'pistol' },
  shotgun: { n: 'Fusil à pompe', dmg: 10, pellets: 7, rate: 1.4, spd: 900, range: 390, spread: .3, mag: 6, reload: 1.5, kind: 'bullet', col: '#ffe6a8', snd: 'cannon', gun: 'shotgun' },
  ar: { n: 'Fusil d\'assaut', dmg: 14, rate: 9, spd: 1150, range: 680, spread: .06, mag: 30, reload: 1.7, kind: 'bullet', col: '#ffe6a8', snd: 'mg', gun: 'ar' },
  sniper: { n: 'Fusil de précision', dmg: 95, rate: .9, spd: 2400, range: 1150, spread: .004, pierce: 2, mag: 5, reload: 2, kind: 'bullet', col: '#fff6d0', snd: 'rail', gun: 'rifle' },
  arc: { n: 'Projecteur d\'arc', dmg: 22, rate: 3, range: 380, chain: 3, chainR: 170, mag: 20, reload: 1.6, kind: 'chain', col: '#9fd8ff', snd: 'tesla', gun: 'plasma' },
  launcher: { n: 'Lance-roquettes', dmg: 65, rate: .9, spd: 560, range: 850, spread: .03, splash: 90, mag: 4, reload: 2.2, kind: 'rocket', col: '#ffb020', snd: 'rocket', gun: 'shotgun' },
  plasma: { n: 'Lance-plasma', dmg: 34, rate: 3.2, spd: 850, range: 720, spread: .03, mag: 18, reload: 2, kind: 'shell', splash: 55, col: '#b08bff', snd: 'laser', gun: 'plasma' },
};

const DIFFS = [
  { id: 'recrue', n: 'Recrue', hp: .55, dmg: .45, spawn: .55, alert: .55, loot: 1, beacon: 1.8, d: 'Ennemis fragiles, alerte lente. Pour découvrir la forge et la flotte.' },
  { id: 'merc', n: 'Mercenaire', hp: .85, dmg: .75, spawn: .85, alert: .85, loot: 1.25, beacon: 1.4, d: 'L\'équilibre prévu. Chaque raid demande un plan d\'extraction.' },
  { id: 'vet', n: 'Vétéran', hp: 1.2, dmg: 1.1, spawn: 1.15, alert: 1.15, loot: 1.6, beacon: 1.1, d: 'Les patrouilles mordent fort. Le butin compense.' },
  { id: 'night', n: 'Cauchemar', hp: 1.7, dmg: 1.6, spawn: 1.5, alert: 1.45, loot: 2.2, beacon: .9, d: 'La zone veut votre peau. Butin plus que doublé.' },
];

const ENEMIES = {
  rodeur: { n: 'Rôdeur', hp: 55, r: 11, spd: 135, sight: 480, ws: [['e_pistol', .6, .35]], human: 1, loot: [['scrap', 2, 6, 1], ['circuits', 1, 2, .35]] },
  pillard: { n: 'Pillard', hp: 95, r: 12, spd: 125, sight: 560, ws: [['e_rifle', .6, .35]], human: 1, loot: [['scrap', 3, 8, 1], ['data', 1, 2, .4], ['circuits', 1, 3, .5]] },
  essaim: { n: 'Essaim', hp: 24, r: 8, spd: 255, sight: 440, fly: true, ws: [['e_sting', .4, 0]], loot: [['circuits', 1, 1, .3]] },
  traqueur: { n: 'Traqueur', hp: 170, r: 15, spd: 215, sight: 520, ws: [['e_claw', .6, 0]], loot: [['alloy', 1, 4, .8], ['scrap', 2, 6, 1]] },
  faucon: { n: 'Faucon pillard', hp: 160, r: 17, spd: 200, sight: 620, fly: true, painter: 'gunship', ws: [['e_mg', .18, -.48], ['e_mg', .18, .48]], loot: [['circuits', 2, 5, 1], ['data', 1, 3, .5]] },
  char: { n: 'Char pillard', hp: 700, r: 26, spd: 115, sight: 650, crush: 2, armor: .25, painter: 'rhino', mscale: 1.5, ws: [['e_cannon', -.1, 0]], loot: [['alloy', 4, 9, 1], ['scrap', 6, 12, 1], ['cores', 1, 1, .12]] },
  artilleur: { n: 'Artilleur', hp: 260, r: 22, spd: 75, sight: 950, painter: 'spider', mscale: 1.3, ws: [['e_lob', .1, 0]], loot: [['alloy', 2, 5, 1], ['circuits', 2, 4, 1], ['data', 1, 3, .5]] },
  bastion: { n: 'Bastion', hp: 420, r: 22, spd: 0, sight: 700, static: true, mscale: 1.5, ws: [['e_cannon', 0, 0]], loot: [['alloy', 3, 8, 1], ['cores', 1, 1, .35], ['circuits', 2, 5, 1]] },
  mastodonte: { n: 'Mastodonte', hp: 1500, r: 40, spd: 75, sight: 720, crush: 2, armor: .2, mscale: 1.8, elite: 1, ws: [['e_rockets', .2, 0], ['e_mg', -.3, -.35], ['e_mg', -.3, .35]], loot: [['alloy', 10, 20, 1], ['cores', 1, 2, 1], ['data', 4, 8, 1], ['circuits', 6, 12, 1]] },
  souverain: { n: 'Le Souverain', hp: 11000, r: 100, spd: 55, sight: 950, crush: 3, armor: .35, mscale: 3, boss: 1, ws: [['e_mortar', -.1, 0], ['e_mg', .45, -.3], ['e_mg', .45, .3], ['e_laser', .2, -.55], ['e_laser', .2, .55]], loot: [['heart', 1, 1, 1], ['cores', 4, 6, 1], ['data', 30, 45, 1], ['alloy', 60, 90, 1], ['circuits', 40, 60, 1], ['crystals', 30, 50, 1]] },
  belier: { n: 'Bélier', hp: 520, r: 24, spd: 125, sight: 900, crush: 2, armor: .3, painter: 'rhino', mscale: 1.4, siege: 1, ws: [['e_ram', .3, 0]], loot: [['alloy', 3, 6, 1], ['scrap', 5, 10, 1]] },
  cible: { n: 'Cible d\'entraînement', hp: 600, r: 16, spd: 0, sight: 0, static: true, ws: [], loot: [] },
};

// lab : niveau de laboratoire requis
const RESEARCH = [
  { id: 'c_ant', cat: 'Châssis', lab: 1, n: 'Châssis Fourmi', cost: { data: 2, scrap: 20 }, d: 'Robots miniatures à un demi-point de commandement : idéal pour les grandes armées.' },
  { id: 'c_scout', cat: 'Châssis', lab: 1, n: 'Châssis Éclaireur', cost: { data: 3, circuits: 6 }, d: 'Buggy rapide qui révèle la carte.' },
  { id: 'c_mule', cat: 'Châssis', lab: 1, n: 'Châssis Mule', cost: { data: 3, scrap: 30 }, d: 'Transporteur de butin.' },
  { id: 'c_sentry', cat: 'Châssis', lab: 1, n: 'Châssis Sentinelle', cost: { data: 5, scrap: 40 }, d: 'Chenillé à deux affûts.' },
  { id: 'c_gunship', cat: 'Châssis', lab: 2, n: 'Châssis Faucon', cost: { data: 10, circuits: 15 }, d: 'Hélicoptère de combat.' },
  { id: 'c_strider', cat: 'Châssis', lab: 2, n: 'Châssis Arpenteur', req: 'c_sentry', cost: { data: 14, circuits: 20 }, d: 'Premier marcheur : armes moyennes.' },
  { id: 'c_spider', cat: 'Châssis', lab: 2, n: 'Châssis Tisseuse', req: 'c_strider', cost: { data: 16, crystals: 10 }, d: 'Araignée à trois affûts.' },
  { id: 'c_rhino', cat: 'Châssis', lab: 2, n: 'Châssis Rhinocéros', req: 'c_sentry', cost: { data: 16, alloy: 20 }, d: 'Bélier blindé qui écrase l\'infanterie.' },
  { id: 'c_goliath', cat: 'Châssis', lab: 3, n: 'Châssis Goliath', req: 'c_strider', cost: { data: 35, alloy: 40, cores: 1 }, d: 'Char de siège à trois affûts.' },
  { id: 'c_reaper', cat: 'Châssis', lab: 3, n: 'Châssis Faucheuse', req: 'c_spider', cost: { data: 40, alloy: 40, cores: 1 }, d: 'Méca d\'assaut rapide.' },
  { id: 'c_airship', cat: 'Châssis', lab: 3, n: 'Châssis Cuirassé', req: 'c_gunship', cost: { data: 45, circuits: 50, cores: 1 }, d: 'Navire volant à quatre tourelles.' },
  { id: 'c_titan', cat: 'Châssis', lab: 4, n: 'Châssis Titan', req: 'c_goliath', cost: { data: 80, alloy: 100, cores: 2 }, d: 'Méca bipède : armes lourdes, écrase les murs.' },
  { id: 'c_behemoth', cat: 'Châssis', lab: 4, n: 'Châssis Béhémoth', req: 'c_titan', cost: { data: 110, alloy: 140, cores: 3 }, d: 'Araignée de siège à cinq affûts lourds.' },
  { id: 'c_colossus', cat: 'Châssis', lab: 5, n: 'Châssis Colosse', req: 'c_titan', cost: { data: 120, alloy: 180, cores: 4 }, d: 'Le méca ultime sur chenilles. Exige un Cœur de Colosse, porté par le Souverain.' },
  { id: 'c_arche', cat: 'Châssis', lab: 5, n: 'Châssis Arche', req: 'c_airship', cost: { data: 130, circuits: 200, cores: 4 }, d: 'Forteresse volante. Exige aussi un Cœur de Colosse.' },
  { id: 'w_scatter', cat: 'Armes légères', lab: 1, n: 'Grenailleuse', cost: { data: 4, scrap: 30 }, d: WEAPONS.scatter.d },
  { id: 'w_flamer', cat: 'Armes légères', lab: 1, n: 'Lance-flammes', cost: { data: 5, crystals: 4 }, d: WEAPONS.flamer.d },
  { id: 'w_repair', cat: 'Armes légères', lab: 1, n: 'Nano-réparateur', cost: { data: 8, circuits: 10 }, d: WEAPONS.repair.d },
  { id: 'w_grenade', cat: 'Armes légères', lab: 2, n: 'Lance-grenades', cost: { data: 8, alloy: 8 }, d: WEAPONS.grenade.d },
  { id: 'w_tesla', cat: 'Armes légères', lab: 2, n: 'Arc électrique', cost: { data: 12, circuits: 15 }, d: WEAPONS.tesla.d },
  { id: 'w_laser', cat: 'Armes moyennes', lab: 2, n: 'Laser', cost: { data: 14, crystals: 10 }, d: WEAPONS.laser.d },
  { id: 'w_rockets', cat: 'Armes moyennes', lab: 2, n: 'Roquettes', cost: { data: 16, alloy: 10 }, d: WEAPONS.rockets.d },
  { id: 'w_cannon', cat: 'Armes moyennes', lab: 2, n: 'Canon', cost: { data: 18, alloy: 15 }, d: WEAPONS.cannon.d },
  { id: 'w_gatling', cat: 'Armes moyennes', lab: 3, n: 'Minigun rotatif', cost: { data: 24, alloy: 30 }, d: WEAPONS.gatling.d },
  { id: 'w_napalm', cat: 'Armes moyennes', lab: 3, n: 'Canon à napalm', cost: { data: 24, crystals: 25 }, d: WEAPONS.napalm.d },
  { id: 'w_swarm', cat: 'Armes moyennes', lab: 3, n: 'Essaim de missiles', req: 'w_rockets', cost: { data: 28, circuits: 30 }, d: WEAPONS.swarm.d },
  { id: 'w_plasma', cat: 'Armes moyennes', lab: 3, n: 'Canon à plasma', cost: { data: 30, crystals: 35 }, d: WEAPONS.plasma.d },
  { id: 'w_shield', cat: 'Armes moyennes', lab: 3, n: 'Projecteur de bouclier', cost: { data: 30, cores: 1 }, d: WEAPONS.shield.d },
  { id: 'w_bay', cat: 'Armes moyennes', lab: 4, n: 'Baie à drones', cost: { data: 40, circuits: 50 }, d: WEAPONS.bay.d },
  { id: 'w_rail', cat: 'Armes lourdes', lab: 3, n: 'Railgun', req: 'c_goliath', cost: { data: 55, cores: 2 }, d: WEAPONS.rail.d },
  { id: 'w_mortar', cat: 'Armes lourdes', lab: 4, n: 'Mortier lourd', req: 'c_titan', cost: { data: 70, alloy: 60 }, d: WEAPONS.mortar.d },
  { id: 'w_siege', cat: 'Armes lourdes', lab: 4, n: 'Canon de siège', req: 'c_titan', cost: { data: 75, alloy: 90 }, d: WEAPONS.siege.d },
  { id: 'w_beam', cat: 'Armes lourdes', lab: 4, n: 'Rayon thermique', req: 'c_titan', cost: { data: 80, crystals: 60 }, d: WEAPONS.beam.d },
  { id: 'w_cruise', cat: 'Armes lourdes', lab: 4, n: 'Missile de croisière', req: 'w_rockets', cost: { data: 90, cores: 2 }, d: WEAPONS.cruise.d },
  { id: 'w_storm', cat: 'Armes lourdes', lab: 4, n: 'Bobine tempête', req: 'w_tesla', cost: { data: 90, crystals: 70 }, d: WEAPONS.storm.d },
  { id: 'w_fusion', cat: 'Armes titanesques', lab: 5, n: 'Canon à fusion', cost: { data: 140, cores: 4 }, d: WEAPONS.fusion.d + ' Réservé au Colosse et à l\'Arche.' },
  { id: 'w_nuke', cat: 'Armes titanesques', lab: 5, n: 'Missile tactique Aube', req: 'w_fusion', cost: { data: 200, cores: 8 }, d: WEAPONS.nuke.d },
  { id: 'm_armor', cat: 'Modules', lab: 1, n: 'Blindage réactif', cost: { data: 4, alloy: 10 }, d: '+12 % de blindage.' },
  { id: 'm_thrusters', cat: 'Modules', lab: 1, n: 'Propulseurs', cost: { data: 4, circuits: 8 }, d: '+25 % de vitesse.' },
  { id: 'm_cargo', cat: 'Modules', lab: 1, n: 'Soute étendue', cost: { data: 3, scrap: 25 }, d: '+60 % de soute.' },
  { id: 'm_plating', cat: 'Modules', lab: 2, n: 'Plaques lourdes', cost: { data: 10, alloy: 20 }, d: '+30 % de PV.' },
  { id: 'm_sensors', cat: 'Modules', lab: 2, n: 'Capteurs longue portée', cost: { data: 10, circuits: 15 }, d: '+12 % de portée, meilleure détection.' },
  { id: 'm_regen', cat: 'Modules', lab: 2, n: 'Nano-régénération', cost: { data: 12, crystals: 12 }, d: 'Auto-réparation hors combat.' },
  { id: 'm_selfdestruct', cat: 'Modules', lab: 2, n: 'Charge d\'autodestruction', cost: { data: 8, crystals: 6 }, d: 'Le robot explose en tombant.' },
  { id: 'm_stabil', cat: 'Modules', lab: 3, n: 'Stabilisateurs', cost: { data: 18, circuits: 25 }, d: 'Précision doublée, +8 % de dégâts.' },
  { id: 'm_overcharge', cat: 'Modules', lab: 3, n: 'Surcharge', cost: { data: 22, crystals: 20 }, d: 'Capacité active : cadence ×1,8.' },
  { id: 'm_jump', cat: 'Modules', lab: 3, n: 'Réacteurs de saut', cost: { data: 20, alloy: 25 }, d: 'Capacité active : bond et onde de choc.' },
  { id: 'm_emshield', cat: 'Modules', lab: 3, n: 'Bouclier d\'urgence', cost: { data: 24, crystals: 25 }, d: 'Capacité active : bouclier instantané.' },
  { id: 'm_cloak', cat: 'Modules', lab: 4, n: 'Camouflage optique', cost: { data: 40, cores: 1 }, d: 'Les ennemis le repèrent très tard.' },
  { id: 'b_gatherer', cat: 'Cerveaux', lab: 1, n: 'Cerveau Récolteur', cost: { data: 4, circuits: 6 }, d: 'Les robots ramassent le butin tout seuls.' },
  { id: 'b_tactical', cat: 'Cerveaux', lab: 3, n: 'Cortex tactique', cost: { data: 30, cores: 2 }, d: 'IA de combat avancée. Chaque cortex coûte un Noyau IA à l\'assemblage.' },
  { id: 'p_shotgun', cat: 'Pilote', lab: 1, n: 'Fusil à pompe', cost: { data: 8, scrap: 40 }, d: 'Dévastateur à courte portée.' },
  { id: 'p_ar', cat: 'Pilote', lab: 2, n: 'Fusil d\'assaut', cost: { data: 20, alloy: 20 }, d: 'Cadence élevée, chargeur de 30.' },
  { id: 'p_sniper', cat: 'Pilote', lab: 2, n: 'Fusil de précision', cost: { data: 22, alloy: 25 }, d: 'Un tir, une cible, et la suivante derrière.' },
  { id: 'p_arc', cat: 'Pilote', lab: 3, n: 'Projecteur d\'arc', cost: { data: 35, circuits: 40 }, d: 'L\'arc électrique saute d\'ennemi en ennemi.' },
  { id: 'p_launcher', cat: 'Pilote', lab: 3, n: 'Lance-roquettes', cost: { data: 40, alloy: 40 }, d: 'Roquettes explosives.' },
  { id: 'p_plasma', cat: 'Pilote', lab: 3, n: 'Lance-plasma', req: 'p_ar', cost: { data: 50, crystals: 30 }, d: 'Projectiles explosifs à cadence rapide.' },
  { id: 'u_armor1', cat: 'Pilote', lab: 1, n: 'Exosquelette I', cost: { data: 6, alloy: 10 }, d: '+40 points de vie.' },
  { id: 'u_armor2', cat: 'Pilote', lab: 2, n: 'Exosquelette II', req: 'u_armor1', cost: { data: 18, alloy: 30 }, d: '+40 points de vie.' },
  { id: 'u_armor3', cat: 'Pilote', lab: 3, n: 'Exosquelette III', req: 'u_armor2', cost: { data: 40, alloy: 60, cores: 1 }, d: '+40 points de vie.' },
  { id: 'u_bag1', cat: 'Pilote', lab: 1, n: 'Sac renforcé I', cost: { data: 4, scrap: 30 }, d: '+20 kg de capacité.' },
  { id: 'u_bag2', cat: 'Pilote', lab: 2, n: 'Sac renforcé II', req: 'u_bag1', cost: { data: 14, alloy: 15 }, d: '+20 kg de capacité.' },
  { id: 'u_bag3', cat: 'Pilote', lab: 3, n: 'Sac renforcé III', req: 'u_bag2', cost: { data: 30, alloy: 35 }, d: '+20 kg de capacité.' },
  { id: 'u_cmd1', cat: 'Protocoles', lab: 1, n: 'Liaison de commandement I', cost: { data: 4, circuits: 8 }, d: '+3 points de commandement.' },
  { id: 'u_cmd2', cat: 'Protocoles', lab: 2, n: 'Liaison de commandement II', req: 'u_cmd1', cost: { data: 12, circuits: 20 }, d: '+3 points de commandement.' },
  { id: 'u_cmd3', cat: 'Protocoles', lab: 3, n: 'Liaison de commandement III', req: 'u_cmd2', cost: { data: 30, circuits: 45, cores: 1 }, d: '+3 points de commandement.' },
  { id: 'u_cmd4', cat: 'Protocoles', lab: 4, n: 'Liaison de commandement IV', req: 'u_cmd3', cost: { data: 60, circuits: 80, cores: 2 }, d: '+3 points de commandement.' },
  { id: 'u_beacon', cat: 'Protocoles', lab: 2, n: 'Balise blindée', cost: { data: 16, alloy: 25 }, d: 'La balise d\'ancrage encaisse deux fois plus de dégâts.' },
  { id: 'u_anchor', cat: 'Protocoles', lab: 3, n: 'Ancrage rapide', cost: { data: 35, crystals: 25 }, d: 'L\'ancrage se charge 25 % plus vite.' },
  { id: 'u_recall', cat: 'Protocoles', lab: 3, n: 'Protocole de rappel', cost: { data: 45, cores: 2 }, d: 'Si vous tombez, chaque robot déployé a 35 % de chances de rentrer seul.' },
];
const ROBOT_NAMES = ['Bricole', 'Rouille', 'Écrou', 'Boulon', 'Cliquet', 'Vérin', 'Mandrin', 'Chignole', 'Tenaille', 'Grappin', 'Rivet', 'Fusible', 'Bobine', 'Dynamo', 'Soudure', 'Pignon', 'Torque', 'Piston', 'Clé-de-12', 'Manivelle', 'Bielle', 'Taraud', 'Étau', 'Burin', 'Fourchette', 'Tournevis', 'Ressort', 'Engrenage'];
const BIG_NAMES = ['Léviathan', 'Béhémoth', 'Cathédrale', 'Montagne', 'Ziggourat', 'Basilique', 'Massif', 'Atlas', 'Monolithe', 'Citadelle', 'Orage', 'Tonnerre'];
const RESEARCH_BY_ID = Object.fromEntries(RESEARCH.map(r => [r.id, r]));
const RESEARCH_CATS = ['Châssis', 'Armes légères', 'Armes moyennes', 'Armes lourdes', 'Armes titanesques', 'Modules', 'Cerveaux', 'Pilote', 'Protocoles'];

// ================= BÂTIMENTS DE LA BASE =================
// cost(L) = coût pour atteindre le niveau L ; t = durée de construction (s) au niveau 1, ×1,9 par niveau
const BUILD = {
  hq: { n: 'Quartier général', w: 4, h: 4, max: 5, ui: 'build', cost: { scrap: 180, alloy: 40, circuits: 20 }, t: 25, d: 'Le cœur de la base. Son niveau plafonne celui des autres bâtiments et débloque de nouvelles constructions. +2 commandement par niveau.' },
  forge: { n: 'Forge d\'assemblage', w: 3, h: 3, max: 5, ui: 'atelier', cost: { scrap: 120, alloy: 25, circuits: 10 }, t: 18, d: 'Assemble les robots. Chaque niveau débloque un rang de châssis et réduit le coût d\'assemblage de 4 %.' },
  lab: { n: 'Laboratoire', w: 3, h: 3, max: 5, ui: 'recherche', cost: { scrap: 100, circuits: 25, data: 6 }, t: 18, d: 'Mène les recherches. Son niveau débloque les technologies avancées.' },
  hangar: { n: 'Hangar', w: 4, h: 3, max: 5, ui: 'hangar', cost: { scrap: 140, alloy: 30 }, t: 15, d: 'Abrite la flotte. Le niveau augmente le nombre de robots stockés.' },
  pad: { n: 'Plateforme de largage', w: 4, h: 4, max: 5, ui: 'raid', cost: { scrap: 120, alloy: 35 }, t: 15, d: 'Point de départ des raids. Chaque niveau renforce la balise (+20 %) et accélère l\'ancrage (−6 %).' },
  uplink: { n: 'Relais de commandement', w: 2, h: 2, max: 5, cost: { scrap: 80, circuits: 25 }, t: 12, d: '+4 points de commandement par niveau : déployez des armées plus grandes.' },
  scrapper: { n: 'Collecteur de ferraille', w: 2, h: 2, max: 5, prod: 'scrap', rate: 22, cost: { scrap: 60 }, t: 8, d: 'Produit de la ferraille en continu, même quand vous êtes en raid.' },
  smelter: { n: 'Fonderie', w: 2, h: 2, max: 5, prod: 'alloy', rate: 5, cost: { scrap: 120, alloy: 5 }, t: 12, d: 'Coule de l\'alliage en continu.' },
  circuitfab: { n: 'Usine de circuits', w: 2, h: 2, max: 5, prod: 'circuits', rate: 4, cost: { scrap: 100, alloy: 12 }, t: 12, d: 'Grave des circuits en continu.' },
  refinery: { n: 'Raffinerie de cristaux', w: 2, h: 2, max: 5, prod: 'crystals', rate: 3, cost: { scrap: 110, alloy: 18 }, t: 14, d: 'Fait pousser des cristaux en cuve.' },
  datacenter: { n: 'Centre de données', w: 2, h: 2, max: 5, prod: 'data', rate: 1.4, cost: { scrap: 90, circuits: 30 }, t: 14, d: 'Décrypte les archives : produit des données.' },
  corefab: { n: 'Synthétiseur de noyaux', w: 3, h: 3, max: 5, prod: 'cores', rate: .06, cost: { alloy: 120, circuits: 80, crystals: 40 }, t: 30, d: 'Assemble lentement des Noyaux IA.' },
  repairbay: { n: 'Baie de réparation', w: 3, h: 3, max: 5, ui: 'hangar', cost: { scrap: 120, alloy: 30 }, t: 15, d: 'Répare gratuitement les robots de la base : 5 % par minute et par niveau.' },
  range: { n: 'Champ de tir', w: 3, h: 3, max: 5, cost: { scrap: 80, alloy: 10 }, t: 10, d: 'Place des cibles d\'entraînement pour essayer vos robots et vos armes.' },
  wall: { n: 'Mur', w: 1, h: 1, max: 5, def: 1, hp: 450, cost: { scrap: 12 }, t: 0, d: 'Bloque les assaillants. Maintenez le clic et glissez pour poser une rangée.' },
  mine: { n: 'Mine', w: 1, h: 1, max: 5, def: 1, mine: 1, cost: { scrap: 20, crystals: 3 }, t: 0, d: 'Invisible pour l\'ennemi. Explose au contact et se réarme après l\'attaque.' },
  turret_mg: { n: 'Tourelle mitrailleuse', w: 2, h: 2, max: 5, def: 1, hp: 900, weapon: 'mg', wmul: 1.5, cost: { scrap: 90, alloy: 15 }, t: 10, d: 'Défense rapide contre l\'infanterie et les drones.' },
  turret_cannon: { n: 'Tourelle canon', w: 2, h: 2, max: 5, def: 1, hp: 1300, weapon: 'cannon', wmul: 1.5, cost: { scrap: 150, alloy: 40 }, t: 14, d: 'Obus explosifs contre les blindés.' },
  turret_tesla: { n: 'Bobine de défense', w: 2, h: 2, max: 5, def: 1, hp: 1000, weapon: 'tesla', wmul: 1.7, cost: { circuits: 60, crystals: 30 }, t: 16, d: 'Foudroie les groupes d\'assaillants.' },
  turret_missile: { n: 'Batterie de missiles', w: 2, h: 2, max: 5, def: 1, hp: 1100, weapon: 'swarm', wmul: 1.3, cost: { alloy: 60, circuits: 50 }, t: 18, d: 'Salves guidées, efficaces aussi contre les aériens.' },
  mortar_pit: { n: 'Fosse à mortier', w: 3, h: 3, max: 5, def: 1, hp: 1600, weapon: 'mortar', wmul: 1.3, cost: { scrap: 220, alloy: 80, crystals: 20 }, t: 24, d: 'Bombarde de loin. Zone morte au pied de la fosse.' },
  shieldgen: { n: 'Générateur de bouclier', w: 2, h: 2, max: 5, def: 1, hp: 900, cost: { crystals: 60, circuits: 50, cores: 1 }, t: 20, d: 'Couvre les bâtiments proches d\'un bouclier régénérant pendant les attaques.' },
};
const BUILD_KEYS = Object.keys(BUILD);
// nombre maximal de chaque bâtiment selon le niveau du QG (index = niveau - 1)
const BLIMIT = {
  hq: [1, 1, 1, 1, 1], forge: [1, 1, 1, 1, 1], lab: [1, 1, 1, 1, 1], hangar: [1, 1, 1, 1, 1], pad: [1, 1, 1, 1, 1],
  uplink: [1, 1, 2, 2, 3], scrapper: [1, 2, 2, 3, 3], smelter: [1, 1, 2, 2, 2], circuitfab: [0, 1, 1, 2, 2], refinery: [0, 1, 1, 2, 2],
  datacenter: [1, 1, 1, 2, 2], corefab: [0, 0, 1, 1, 1], repairbay: [0, 1, 1, 1, 1], range: [1, 1, 1, 1, 1],
  wall: [30, 60, 90, 130, 180], mine: [6, 10, 14, 18, 24], turret_mg: [2, 3, 4, 5, 6], turret_cannon: [1, 2, 3, 3, 4], turret_tesla: [0, 1, 2, 2, 3],
  turret_missile: [0, 0, 1, 2, 3], mortar_pit: [0, 0, 1, 1, 2], shieldgen: [0, 0, 1, 1, 2],
};
const BX0 = 122, BX1 = 178, BY0 = 126, BY1 = 174; // zone constructible (tuiles)
function bCost(type, lvl) { const b = BUILD[type], m = Math.pow(2.15, lvl - 1), o = {}; for (const k in b.cost) o[k] = Math.ceil(b.cost[k] * m * (k === 'cores' ? .5 : 1)); return o; }
function bTime(type, lvl) { return Math.round(BUILD[type].t * Math.pow(1.9, lvl - 1)); }
const instantB = type => BUILD[type].t === 0;
function prodRate(b) { const B_ = BUILD[b.type]; return B_.rate ? B_.rate * b.lvl * (1 + (b.lvl - 1) * .15) : 0; } // par minute
function prodCap(b) { return prodRate(b) * 45 * (1 + .4 * bLevel('warehouse')); }

// ================= DONNÉES : CHÂSSIS, ARMES, ENNEMIS ET BÂTIMENTS SUPPLÉMENTAIRES =================
Object.assign(CHASSIS, {
  mantis: { n: 'Mante', tier: 2, hp: 185, r: 16, spd: 235, slots: 2, wsize: 1, cargo: 4, cmd: 2, armor: .05, perk: 'leap', cost: { scrap: 50, alloy: 12, circuits: 8 }, d: 'Chasseuse rapide qui bondit d\'elle-même sur ses proies.' },
  tortue: { n: 'Tortue', tier: 3, hp: 900, r: 28, spd: 85, slots: 2, wsize: 2, cargo: 20, cmd: 3, crush: 1, armor: .3, perk: 'fortify', cost: { scrap: 170, alloy: 70, circuits: 15 }, d: 'Carapace épaisse : encaisse 25 % de dégâts en moins à l\'arrêt.' },
  echassier: { n: 'Échassier', tier: 3, hp: 380, r: 24, spd: 110, slots: 1, wsize: 3, cargo: 8, cmd: 3, armor: .08, perk: 'range', cost: { scrap: 150, alloy: 45, circuits: 35, crystals: 15 }, d: 'Plateforme sur échasses : une arme lourde dès le rang 3, et +20 % de portée.' },
  vautour: { n: 'Vautour', tier: 3, hp: 420, r: 30, spd: 170, slots: 1, wsize: 1, cargo: 90, cmd: 3, fly: true, armor: .1, cost: { scrap: 140, alloy: 40, circuits: 40 }, d: 'Transporteur volant à soute énorme : idéal pour rapporter le butin.' },
  scolopendre: { n: 'Scolopendre', tier: 4, hp: 1300, r: 34, spd: 120, slots: 6, wsize: 1, cargo: 25, cmd: 5, crush: 2, armor: .18, cost: { scrap: 280, alloy: 90, circuits: 60, crystals: 20, cores: 1 }, d: 'Mille-pattes blindé hérissé de six affûts légers.' },
});
CHASSIS_KEYS.length = 0; Object.keys(CHASSIS).sort((a, b) => CHASSIS[a].tier - CHASSIS[b].tier).forEach(k => CHASSIS_KEYS.push(k));
Object.assign(MOUNTS, {
  mantis: [[.3, -.32], [.3, .32]], tortue: [[.15, -.3], [.15, .3]], echassier: [[.1, 0]], vautour: [[.5, 0]],
  scolopendre: [[.6, 0], [.28, -.4], [.28, .4], [-.12, -.4], [-.12, .4], [-.5, 0]],
});
Object.assign(MSCALE, { mantis: 1, tortue: 1.5, echassier: 1.7, vautour: 1.2, scolopendre: 1.25 });
Object.assign(WEAPONS, {
  needler: { n: 'Aiguilleur', size: 1, dmg: 9, rate: 5, spd: 1400, range: 560, spread: .05, pierce: 1, kind: 'bullet', col: '#c8f0ff', snd: 'laser', cost: { circuits: 10, crystals: 4 }, d: 'Fléchettes qui traversent une cible.' },
  emp: { n: 'Émetteur IEM', size: 1, dmg: 6, rate: 1.2, spd: 900, range: 420, spread: .04, slow: 2.5, kind: 'bullet', col: '#8fd0ff', snd: 'tesla', cost: { circuits: 16, crystals: 6 }, d: 'Ralentit la cible et sa cadence de tir pendant 2,5 s.' },
  cluster: { n: 'Obus à sous-munitions', size: 2, dmg: 26, rate: .5, range: 760, minRange: 120, splash: 55, cluster: 5, arc: 110, kind: 'lob', col: '#ffd27a', snd: 'cannon', cost: { scrap: 45, alloy: 25 }, d: 'Se fragmente en cinq explosions.' },
  gravity: { n: 'Canon à gravité', size: 3, dmg: 160, rate: .28, spd: 620, range: 900, spread: .03, splash: 170, pull: 1, kind: 'shell', col: '#b9a0ff', snd: 'rail', cost: { crystals: 80, circuits: 60, cores: 2 }, d: 'Aspire les ennemis vers l\'impact avant d\'exploser.' },
  orbital: { n: 'Frappe orbitale', size: 4, dmg: 420, rate: .07, range: 2000, minRange: 300, splash: 120, strikes: 9, kind: 'orbital', col: '#ffe6a8', snd: 'rail', cost: { alloy: 300, circuits: 250, cores: 8 }, d: 'Neuf frappes tombées du ciel sur une large zone.' },
  flak: { hidden: 1, size: 2, dmg: 14, rate: 4, spd: 1000, range: 700, spread: .08, splash: 35, aa: 3, kind: 'shell', col: '#ffe0a0', snd: 'cannon' },
  e_sniper: { hidden: 1, dmg: 28, rate: .35, spd: 2200, range: 900, spread: .01, kind: 'bullet', col: '#ff9a7a', snd: 'rail' },
  e_acid: { hidden: 1, dmg: 8, rate: .8, spd: 600, range: 380, spread: .05, splash: 40, burn: { r: 50, t: 3, dps: 12 }, kind: 'shell', col: '#9fe06a', snd: 'flame' },
  e_frost: { hidden: 1, dmg: 7, rate: 2, spd: 900, range: 520, spread: .05, slow: 2, kind: 'bullet', col: '#bfe8ff', snd: 'tesla' },
});
for (const k of ['needler', 'emp', 'cluster', 'gravity', 'orbital']) CRAFT_WEAPONS.push(k);
// identité sonore propre à chaque arme
const WSND = { mg: 'mg', rifle: 'rifle', blades: 'melee', scatter: 'scatter', flamer: 'flame', grenade: 'lob', tesla: 'tesla', laser: 'laser', rockets: 'rocket', cannon: 'cannon', gatling: 'gatling', swarm: 'swarm', napalm: 'napalm', plasma: 'plasma', rail: 'rail', mortar: 'mortar', beam: 'beam', siege: 'siege', cruise: 'cruise', storm: 'storm', fusion: 'fusion', nuke: 'launch', mg_mini: 'mgmini', e_pistol: 'pistol', e_rifle: 'rifle', e_sting: 'sting', e_claw: 'claw', e_cannon: 'cannon', e_rockets: 'rocket', e_mg: 'mg', e_mortar: 'mortar', e_lob: 'lob', e_laser: 'laser', e_ram: 'crush', needler: 'needle', emp: 'emp', cluster: 'lob', gravity: 'gravity', orbital: 'uplink', flak: 'flak', e_sniper: 'sniper', e_acid: 'acid', e_frost: 'frost' };
for (const k in WSND) if (WEAPONS[k]) WEAPONS[k].snd = WSND[k];
Object.assign(PWEAPONS.pistol, { snd: 'pistol' }); Object.assign(PWEAPONS.shotgun, { snd: 'shotgun' }); Object.assign(PWEAPONS.ar, { snd: 'ar' }); Object.assign(PWEAPONS.sniper, { snd: 'sniper' });
Object.assign(PWEAPONS.arc, { snd: 'tesla' }); Object.assign(PWEAPONS.launcher, { snd: 'rocket' }); Object.assign(PWEAPONS.plasma, { snd: 'plasma' });
Object.assign(ENEMIES, {
  sniper: { n: 'Tireur d\'élite', hp: 70, r: 11, spd: 110, sight: 900, human: 1, ws: [['e_sniper', .6, .35]], loot: [['data', 1, 3, .6], ['circuits', 1, 3, .6], ['scrap', 2, 5, 1]] },
  scorpion: { n: 'Scorpion', hp: 260, r: 18, spd: 200, sight: 560, painter: 'mantis', mscale: 1.1, ws: [['e_claw', .5, 0], ['e_acid', .1, 0]], loot: [['crystals', 2, 5, 1], ['alloy', 1, 3, .6]] },
  givre: { n: 'Marcheur de givre', hp: 600, r: 28, spd: 85, sight: 700, painter: 'tortue', mscale: 1.4, armor: .25, ws: [['e_frost', .2, 0]], loot: [['crystals', 3, 7, 1], ['alloy', 3, 6, 1], ['cores', 1, 1, .15]] },
  rouilleux: { n: 'Le Rouilleux', hp: 4800, r: 70, spd: 60, sight: 850, crush: 3, armor: .3, mscale: 2.2, boss: 1, painter: 'goliath', ws: [['e_cannon', .3, 0], ['e_rockets', -.3, -.4], ['e_rockets', -.3, .4], ['e_mg', .5, -.3], ['e_mg', .5, .3]], loot: [['cores', 2, 3, 1], ['data', 15, 25, 1], ['alloy', 30, 50, 1], ['scrap', 60, 90, 1]] },
  ruche: { n: 'La Ruche', hp: 7000, r: 85, spd: 0, static: true, sight: 1000, armor: .2, mscale: 2.4, boss: 1, hive: 1, painter: 'hive', ws: [['e_sting', .5, 0], ['e_acid', 0, .5], ['e_acid', 0, -.5], ['e_acid', -.5, 0]], loot: [['crystals', 60, 90, 1], ['cores', 3, 4, 1], ['data', 20, 30, 1], ['circuits', 30, 50, 1]] },
  archonte: { n: 'L\'Archonte', hp: 16000, r: 110, spd: 55, sight: 1000, crush: 4, armor: .4, mscale: 3.3, boss: 1, ws: [['e_mortar', -.1, 0], ['e_laser', .2, -.55], ['e_laser', .2, .55], ['e_rockets', .45, -.3], ['e_rockets', .45, .3], ['e_lob', -.4, 0]], loot: [['heart', 1, 1, 1], ['cores', 8, 12, 1], ['data', 50, 70, 1], ['alloy', 90, 130, 1], ['crystals', 60, 90, 1]] },
});
Object.assign(BUILD, {
  contracts: { n: 'Bureau des contrats', w: 3, h: 3, max: 3, ui: 'raid', cost: { scrap: 100, alloy: 20 }, t: 12, d: 'Propose les contrats rémunérés. Chaque niveau ajoute un contrat proposé par région et +15 % de récompense.' },
  radar: { n: 'Station radar', w: 2, h: 2, max: 5, cost: { scrap: 90, circuits: 30 }, t: 14, d: 'À l\'insertion, révèle la carte autour de vous ; niveau 2 : localise les pylônes ; niveau 3 : suit les équipes rivales.' },
  warehouse: { n: 'Entrepôt blindé', w: 3, h: 3, max: 5, cost: { scrap: 150, alloy: 40 }, t: 16, d: '+40 % de stock pour les producteurs par niveau. Protège vos stocks des pillages des autres joueurs (25 % au niveau 1, +10 % par niveau) et réduit les pertes face aux pillards.' },
  turret_beam: { n: 'Tourelle laser', w: 2, h: 2, max: 5, def: 1, hp: 1100, weapon: 'beam', wmul: .6, cost: { crystals: 70, circuits: 60, cores: 1 }, t: 20, d: 'Rayon continu qui fait fondre les blindés.' },
  expedition: { n: 'Poste d\'expédition', w: 3, h: 3, max: 3, ui: 'expe', cost: { scrap: 150, alloy: 30, circuits: 25 }, t: 20, d: 'Envoie des escouades autonomes fouiller une région et s\'extraire seules, pendant que vous jouez. Une expédition simultanée par niveau, trois au plus.' },
  turret_flak: { n: 'Tour antiaérienne', w: 2, h: 2, max: 5, def: 1, hp: 900, weapon: 'flak', wmul: 1, cost: { scrap: 110, alloy: 30, circuits: 20 }, t: 14, d: 'Shrapnel qui inflige le triple de dégâts aux aériens.' },
});
for (const k of ['contracts', 'radar', 'warehouse', 'turret_beam', 'turret_flak', 'expedition']) BUILD_KEYS.push(k);
Object.assign(BLIMIT, { contracts: [1, 1, 1, 1, 1], radar: [0, 1, 1, 1, 1], warehouse: [0, 1, 1, 2, 2], turret_beam: [0, 0, 1, 2, 2], turret_flak: [1, 1, 2, 2, 3], expedition: [1, 1, 1, 1, 1] });
[
  { id: 'c_mantis', cat: 'Châssis', lab: 2, n: 'Châssis Mante', cost: { data: 10, alloy: 12 }, d: 'Chasseuse rapide qui bondit sur ses proies.' },
  { id: 'c_tortue', cat: 'Châssis', lab: 2, n: 'Châssis Tortue', req: 'c_sentry', cost: { data: 14, alloy: 30 }, d: 'Blindage lourd, encore plus solide à l\'arrêt.' },
  { id: 'c_vautour', cat: 'Châssis', lab: 2, n: 'Châssis Vautour', req: 'c_gunship', cost: { data: 16, circuits: 25 }, d: 'Transporteur volant à soute énorme.' },
  { id: 'c_echassier', cat: 'Châssis', lab: 3, n: 'Châssis Échassier', req: 'c_strider', cost: { data: 30, alloy: 40 }, d: 'Une arme lourde avant les Titans.' },
  { id: 'c_scolopendre', cat: 'Châssis', lab: 3, n: 'Châssis Scolopendre', req: 'c_spider', cost: { data: 40, alloy: 50, cores: 1 }, d: 'Six affûts légers sur un corps blindé.' },
  { id: 'w_needler', cat: 'Armes légères', lab: 1, n: 'Aiguilleur', cost: { data: 5, circuits: 10 }, d: WEAPONS.needler.d },
  { id: 'w_emp', cat: 'Armes légères', lab: 2, n: 'Émetteur IEM', cost: { data: 12, circuits: 15 }, d: WEAPONS.emp.d },
  { id: 'w_cluster', cat: 'Armes moyennes', lab: 3, n: 'Obus à sous-munitions', req: 'w_grenade', cost: { data: 26, alloy: 30 }, d: WEAPONS.cluster.d },
  { id: 'w_gravity', cat: 'Armes lourdes', lab: 4, n: 'Canon à gravité', req: 'w_rail', cost: { data: 85, cores: 2 }, d: WEAPONS.gravity.d },
  { id: 'w_orbital', cat: 'Armes titanesques', lab: 5, n: 'Frappe orbitale', req: 'w_fusion', cost: { data: 180, cores: 6 }, d: WEAPONS.orbital.d },
].forEach(r => { RESEARCH.push(r); RESEARCH_BY_ID[r.id] = r; });
RESEARCH_BY_ID.w_mortar.req = undefined; RESEARCH_BY_ID.w_mortar.lab = 3;

// ================= DÉMESURE : GÉANTS, NOUVEAUX ROBOTS, ARMES COLOSSALES ET APOCALYPTIQUES =================
// Trois rangs au-dessus du Colosse (7, 8, 9). Les plus grands fabriquent en raid des renforts de trois rangs en dessous,
// d'après vos plans : ils se battent et ramassent, puis sont démontés à l'extraction.
WSIZE_N.push('Colossale', 'Apocalyptique'); WSIZE_PL.push('Colossales', 'Apocalyptiques');
Object.assign(CHASSIS, {
  grillon: { n: 'Grillon', tier: 1, hp: 66, r: 11, spd: 240, slots: 1, wsize: 1, cargo: 3, cmd: 1, perk: 'leap', cost: { scrap: 18, circuits: 3 }, d: 'Sauteur minuscule : il bondit de lui-même au cœur de la mêlée.' },
  herisson: { n: 'Hérisson', tier: 2, hp: 270, r: 18, spd: 118, slots: 2, wsize: 1, cargo: 6, cmd: 2, armor: .12, perk: 'spikes', cost: { scrap: 65, alloy: 18, circuits: 6 }, d: 'Carapace hérissée de pointes : blesse tout ce qui le touche ou tente de l\'écraser.' },
  scarabee: { n: 'Scarabée', tier: 3, hp: 560, r: 25, spd: 150, slots: 2, wsize: 2, cargo: 12, cmd: 3, fly: true, armor: .18, cost: { scrap: 150, alloy: 55, circuits: 32, crystals: 8 }, d: 'Coléoptère volant blindé, deux armes moyennes sous les élytres.' },
  hydre: { n: 'Hydre', tier: 4, hp: 1550, r: 40, spd: 104, slots: 5, wsize: 2, cargo: 30, cmd: 5, crush: 2, armor: .2, cost: { scrap: 300, alloy: 100, circuits: 55, crystals: 25, cores: 1 }, d: 'Cinq têtes armées sur un même corps : un feu croisé permanent.' },
  wyverne: { n: 'Wyverne', tier: 5, hp: 2700, r: 62, spd: 125, slots: 3, wsize: 3, cargo: 40, cmd: 8, fly: true, armor: .25, cost: { scrap: 650, alloy: 220, circuits: 130, crystals: 80, cores: 4 }, d: 'Bombardier volant lourd : trois armes lourdes au-dessus de la mêlée.' },
  mammouth: { n: 'MAMMOUTH', tier: 6, hp: 14000, r: 150, spd: 62, slots: 4, wsize: 4, cargo: 320, cmd: 13, crush: 4, armor: .5, cost: { scrap: 1600, alloy: 420, circuits: 200, crystals: 160, cores: 9, heart: 1 }, d: 'Transporteur de siège : la plus grande soute avant les géants, et quatre armes titanesques.' },
  rempart: { n: 'REMPART', tier: 7, hp: 38000, r: 270, spd: 56, slots: 8, wsize: 5, cargo: 420, cmd: 20, crush: 5, armor: .55, cost: { scrap: 4200, alloy: 1300, circuits: 650, crystals: 520, cores: 24, heart: 2 }, d: 'Forteresse chenillée large comme une place : huit affûts colossaux et un blindage que rien n\'entame.' },
  arachne: { n: 'ARACHNÉ', tier: 7, hp: 31000, r: 235, spd: 92, slots: 7, wsize: 5, cargo: 260, cmd: 19, crush: 5, armor: .45, cost: { scrap: 3600, alloy: 1200, circuits: 700, crystals: 600, cores: 22, heart: 2 }, d: 'Araignée géante, rapide pour sa taille : elle enjambe les ruines et frappe de tous côtés.' },
  portenef: { n: 'PORTE-NEF', tier: 7, hp: 26000, r: 250, spd: 70, slots: 5, wsize: 4, cargo: 360, cmd: 20, fly: true, armor: .4, fab: { tier: 4, cap: 5, t: 18 }, cost: { scrap: 3800, alloy: 1250, circuits: 900, crystals: 520, cores: 26, heart: 2 }, d: 'Porte-nef volant : il fabrique en vol des robots jusqu\'au rang 4, d\'après vos plans.' },
  cyclope: { n: 'CYCLOPE', tier: 8, hp: 92000, r: 410, spd: 58, slots: 10, wsize: 5, cargo: 600, cmd: 30, crush: 6, armor: .55, cost: { scrap: 9000, alloy: 3000, circuits: 1500, crystals: 1200, cores: 48, heart: 3 }, d: 'Géant bipède haut comme une tour : dix affûts colossaux, et chacun de ses pas fait trembler la région.' },
  forgemere: { n: 'FORGE-MÈRE', tier: 8, hp: 110000, r: 470, spd: 44, slots: 8, wsize: 5, cargo: 900, cmd: 32, crush: 6, armor: .6, fab: { tier: 5, cap: 6, t: 24 }, cost: { scrap: 10000, alloy: 3400, circuits: 1800, crystals: 1100, cores: 52, heart: 3 }, d: 'Usine roulante : elle assemble en marche des robots jusqu\'au rang 5, Titans et Béhémoths compris.' },
  aeropole: { n: 'AÉROPOLE', tier: 8, hp: 82000, r: 440, spd: 54, slots: 10, wsize: 5, cargo: 700, cmd: 30, fly: true, armor: .5, cost: { scrap: 8800, alloy: 3000, circuits: 2000, crystals: 1400, cores: 50, heart: 3 }, d: 'Cité volante : dix affûts colossaux qui survolent tout, murs et marais compris.' },
  villemachine: { n: 'VILLE-MACHINE', tier: 9, hp: 360000, r: 870, spd: 32, slots: 14, wsize: 6, cargo: 2400, cmd: 48, crush: 9, armor: .65, fab: { tier: 6, cap: 4, t: 40 }, cost: { scrap: 24000, alloy: 8000, circuits: 4200, crystals: 3200, cores: 110, heart: 5 }, d: 'Une ville entière sur chenilles. Elle rase le paysage, porte quatorze affûts apocalyptiques et fabrique des Colosses.' },
  astre: { n: 'ASTRE', tier: 9, hp: 290000, r: 780, spd: 40, slots: 12, wsize: 6, cargo: 1800, cmd: 46, fly: true, armor: .55, fab: { tier: 6, cap: 3, t: 45 }, cost: { scrap: 22000, alloy: 7600, circuits: 4800, crystals: 3600, cores: 110, heart: 5 }, d: 'Vaisseau-mère : douze affûts apocalyptiques, et ses baies lâchent des Arches en plein vol.' },
});
CHASSIS_KEYS.length = 0; Object.keys(CHASSIS).sort((a, b) => CHASSIS[a].tier - CHASSIS[b].tier).forEach(k => CHASSIS_KEYS.push(k));
const ringM = (n, rad, a0 = 0) => Array.from({ length: n }, (_, k) => [Math.cos(a0 + k / n * TAU) * rad, Math.sin(a0 + k / n * TAU) * rad]);
Object.assign(MOUNTS, {
  grillon: [[.2, 0]], herisson: [[.12, -.3], [.12, .3]], scarabee: [[.42, -.28], [.42, .28]],
  hydre: [[.86, 0], [.7, -.5], [.7, .5], [.3, -.78], [.3, .78]], wyverne: [[.5, 0], [-.02, -.58], [-.02, .58]],
  mammouth: [[.42, -.36], [.42, .36], [-.32, -.36], [-.32, .36]],
  rempart: [[.58, -.3], [.58, .3], [.22, -.5], [.22, .5], [-.18, -.5], [-.18, .5], [-.56, -.3], [-.56, .3]],
  arachne: [[.58, 0], [.32, -.3], [.32, .3], [0, -.4], [0, .4], [-.34, -.2], [-.34, .2]],
  portenef: [[.62, 0], [.22, -.44], [.22, .44], [-.34, -.4], [-.34, .4]],
  cyclope: [[.04, -.78], [.04, .78], [.36, -.32], [.36, .32], [.02, -.46], [.02, .46], [-.3, -.6], [-.3, .6], [-.28, -.18], [-.28, .18]],
  forgemere: [[.62, -.34], [.62, .34], [.28, -.62], [.28, .62], [-.14, -.62], [-.14, .62], [-.56, -.44], [-.56, .44]],
  aeropole: ringM(8, .58, Math.PI / 8).concat([[.2, 0], [-.2, 0]]),
  villemachine: [[.66, -.34], [.66, .34], [.66, 0], [.36, -.6], [.36, .6], [.04, -.66], [.04, .66], [-.28, -.62], [-.28, .62], [-.6, -.4], [-.6, .4], [-.6, 0], [.18, -.2], [-.2, .2]],
  astre: ringM(10, .66, Math.PI / 10).concat([[.25, 0], [-.25, 0]]),
});
Object.assign(MSCALE, { grillon: .9, herisson: 1.05, scarabee: 1.4, hydre: 1.6, wyverne: 2.3, mammouth: 3.2, rempart: 4.4, arachne: 4, portenef: 4.1, cyclope: 5.8, forgemere: 6.2, aeropole: 5.9, villemachine: 8.6, astre: 8 });
const PREV_EXT = { grillon: 1.4, herisson: 1.1, scarabee: 1.3, hydre: 1.15, wyverne: 1.5, mammouth: 1.1, rempart: 1.1, arachne: 1.6, portenef: 1.15, cyclope: 1.15, forgemere: 1.1, aeropole: 1.1, villemachine: 1.08, astre: 1.1 };
const GIANT_NAMES = ['Apocalypse', 'Hégémonie', 'Leviathan', 'Pandémonium', 'Ragnarök', 'Babel', 'Golgotha', 'Tartare', 'Empyrée', 'Mégalopole', 'Abysse', 'Zénith'];

Object.assign(WEAPONS, {
  // ---- légères
  harpoon: { n: 'Lance-harpon', size: 1, dmg: 34, rate: .9, spd: 1150, range: 560, spread: .02, pierce: 1, slow: 1.2, kind: 'bullet', col: '#e8e0c8', snd: 'rifle', cost: { scrap: 14, alloy: 4 }, d: 'Harpon qui traverse une cible et ralentit ce qu\'il touche.' },
  acidgun: { n: 'Projecteur d\'acide', size: 1, dmg: 9, rate: 1.1, spd: 640, range: 420, spread: .05, splash: 44, burn: { r: 55, t: 4, dps: 15 }, kind: 'shell', col: '#9fe06a', snd: 'acid', cost: { scrap: 12, crystals: 5 }, d: 'Flaque corrosive qui ronge le sol et les cibles pendant 4 s.' },
  // ---- moyennes
  dca: { n: 'Canon de DCA', size: 2, dmg: 14, rate: 4, spd: 1000, range: 720, spread: .08, splash: 35, aa: 3, kind: 'shell', col: '#ffe0a0', snd: 'flak', cost: { scrap: 40, alloy: 16 }, d: 'Shrapnel qui inflige le triple de dégâts aux aériens.' },
  disc: { n: 'Lance-disques', size: 2, dmg: 30, rate: 1.4, spd: 900, range: 600, spread: .04, pierce: 4, kind: 'bullet', col: '#d8f4ff', snd: 'needle', cost: { alloy: 22, circuits: 12 }, d: 'Disques tranchants qui traversent quatre cibles.' },
  // ---- lourdes
  thermo: { n: 'Roquettes thermobariques', size: 3, dmg: 110, salvo: 4, rate: .32, spd: 500, range: 1150, spread: .1, splash: 140, burn: { r: 120, t: 5, dps: 40 }, kind: 'rocket', col: '#ff8a40', snd: 'swarm', cost: { alloy: 90, crystals: 50, circuits: 30 }, d: 'Quatre roquettes guidées qui embrasent la zone touchée.' },
  lance: { n: 'Lance-foudre', size: 3, dmg: 140, rate: .5, range: 900, chain: 5, chainR: 300, kind: 'chain', col: '#c8e8ff', snd: 'storm', cost: { circuits: 70, crystals: 55 }, d: 'Un éclair qui saute sur six cibles.' },
  // ---- titanesques
  disint: { n: 'Désintégrateur', size: 4, dps: 650, range: 1150, bw: 1.6, kind: 'beam', col: '#ff3a6a', snd: 'beam', cost: { crystals: 260, circuits: 200, cores: 5 }, d: 'Rayon continu qui fait fondre les blindés lourds.' },
  gauss: { n: 'Canon de Gauss', size: 4, dmg: 1100, rate: .22, range: 1900, kind: 'rail', col: '#a8f0ff', snd: 'rail', cost: { alloy: 320, circuits: 180, cores: 6 }, d: 'Projectile magnétique qui traverse toute la ligne.' },
  // ---- colossales (rangs 7 et 8)
  battle: { n: 'Canon de bataille', size: 5, dmg: 2400, rate: .2, spd: 950, range: 2700, spread: .02, splash: 340, kind: 'shell', col: '#ffe0a0', snd: 'siege', cost: { scrap: 1400, alloy: 700, cores: 10 }, d: 'Obus de cuirassé : un quartier soufflé à chaque coup.' },
  mwall: { n: 'Mur de missiles', size: 5, dmg: 130, salvo: 20, rate: .17, spd: 560, range: 2500, spread: .12, splash: 85, kind: 'rocket', col: '#ffb020', snd: 'swarm', cost: { alloy: 600, circuits: 600, cores: 12 }, d: 'Vingt missiles guidés lancés d\'un coup.' },
  annihil: { n: 'Rayon annihilateur', size: 5, dps: 2600, range: 2000, bw: 3, kind: 'beam', col: '#ff5a2a', snd: 'beam', cost: { crystals: 900, circuits: 700, cores: 14 }, d: 'Rayon continu qui efface ce qu\'il touche.' },
  furnace: { n: 'Fournaise', size: 5, dmg: 80, rate: 14, spd: 540, range: 700, spread: .34, kind: 'flame', col: '#ff7a20', snd: 'flame', cost: { scrap: 900, crystals: 500, cores: 8 }, d: 'Un mur de flammes qui calcine tout devant le géant.' },
  ion: { n: 'Tempête ionique', size: 5, dmg: 420, rate: .6, range: 1400, chain: 14, chainR: 440, kind: 'chain', col: '#9fe8ff', snd: 'storm', cost: { circuits: 900, crystals: 800, cores: 14 }, d: 'La foudre saute sur quinze cibles.' },
  fighters: { n: 'Hangar de chasseurs', size: 5, max: 8, rate: .25, range: 1500, drone: 'fighter', kind: 'bay', col: '#6fe3c8', cost: { scrap: 1000, alloy: 500, circuits: 600, cores: 10 }, d: 'Lance jusqu\'à huit chasseurs armés de roquettes.' },
  dome: { n: 'Dôme de bouclier', size: 5, cap: 5000, regen: 450, range: 1300, kind: 'shield', col: '#7fc8ff', cost: { crystals: 900, circuits: 700, cores: 16 }, d: 'Un dôme régénérant sur toute l\'armée autour du géant.' },
  nanoswarm: { n: 'Nuée réparatrice', size: 5, heal: 420, range: 1100, kind: 'repair', col: '#6fb5a4', cost: { circuits: 700, crystals: 600, cores: 10 }, d: 'Répare en continu les robots et le pilote autour du géant.' },
  // ---- apocalyptiques (rang 9)
  fission: { n: 'Lance de fission', size: 6, dmg: 16000, rate: .07, range: 4400, width: 170, charge: 2.4, kind: 'fusion', col: '#c8ffff', snd: 'fusion', cost: { alloy: 2200, crystals: 2000, cores: 40 }, d: 'Se charge, puis fend la région de part en part.' },
  singul: { n: 'Projecteur de singularité', size: 6, dmg: 22000, rate: .045, range: 3600, minRange: 600, splash: 800, pullR: 1100, vt: 4, kind: 'singularity', col: '#b9a0ff', snd: 'gravity', cost: { crystals: 2600, circuits: 1800, cores: 45 }, d: 'Ouvre un trou noir qui aspire tout pendant 4 s, puis implose.' },
  dusk: { n: 'Missile Crépuscule', size: 6, dmg: 34000, rate: .025, range: 5600, minRange: 900, splash: 1600, kind: 'nuke', col: '#ffd0a0', snd: 'launch', cost: { alloy: 2600, circuits: 1800, cores: 55 }, d: 'Rase une ville entière. Recharge 40 s.' },
  meteor: { n: 'Pluie de météores', size: 6, dmg: 1600, rate: .045, range: 4200, minRange: 500, splash: 280, strikes: 36, area: 900, kind: 'orbital', col: '#ffb070', snd: 'uplink', cost: { alloy: 2400, circuits: 2400, cores: 45 }, d: 'Trente-six météores s\'abattent sur une région entière.' },
  // ---- armes des géants ennemis
  e_siege: { hidden: 1, dmg: 200, rate: .25, spd: 760, range: 1500, spread: .03, splash: 190, kind: 'shell', col: '#ffb08a', snd: 'siege' },
  e_flame: { hidden: 1, dmg: 7, rate: 18, spd: 420, range: 340, spread: .3, kind: 'flame', col: '#ff7a30', snd: 'flame' },
  e_beam: { hidden: 1, dps: 260, range: 1000, bw: 1.4, kind: 'beam', col: '#ff3050', snd: 'beam' },
  e_storm: { hidden: 1, dmg: 80, rate: .8, range: 850, chain: 6, chainR: 300, kind: 'chain', col: '#ffa0b0', snd: 'storm' },
  e_titan: { hidden: 1, dmg: 1100, rate: .16, spd: 850, range: 2400, spread: .03, splash: 320, kind: 'shell', col: '#ffb08a', snd: 'siege' },
  e_mwall: { hidden: 1, dmg: 65, salvo: 10, rate: .2, spd: 520, range: 2000, spread: .14, splash: 70, kind: 'rocket', col: '#ff7a50', snd: 'swarm' },
  e_nova: { hidden: 1, dmg: 800, rate: .08, range: 2600, minRange: 400, splash: 360, kind: 'mortar', col: '#ff6a40', snd: 'mortar' },
});
for (const k of ['harpoon', 'acidgun', 'dca', 'disc', 'thermo', 'lance', 'disint', 'gauss', 'battle', 'mwall', 'annihil', 'furnace', 'ion', 'fighters', 'dome', 'nanoswarm', 'fission', 'singul', 'dusk', 'meteor']) CRAFT_WEAPONS.push(k);
ARTILLERY.singularity = 1;
// chasseurs des hangars : plus gros et mieux armés que les drones de la baie
const DRONES = { fighter: { r: 15, hp: 420, spd: 330, wid: 'rockets', sight: 900, leash: 1600, eng: 420, paint: 'gunship', sc: 1.1 } };

Object.assign(ENEMIES, {
  colosse_r: { n: 'Colosse renégat', hp: 26000, r: 145, spd: 66, sight: 1300, crush: 4, armor: .45, mscale: 3.4, giant: 1, painter: 'colossus', ws: [['e_siege', .36, -.34], ['e_siege', .36, .34], ['e_rockets', -.02, -.5], ['e_rockets', -.02, .5], ['e_beam', -.4, -.3], ['e_mg', -.4, .3]], loot: [['cores', 3, 6, 1], ['alloy', 60, 110, 1], ['circuits', 40, 80, 1], ['data', 20, 40, 1], ['heart', 1, 1, .12]] },
  devoreur: { n: 'Le Dévoreur', hp: 95000, r: 280, spd: 54, sight: 1600, crush: 6, armor: .5, mscale: 5.4, giant: 1, painter: 'x_devoreur', ws: [['e_flame', .72, -.26], ['e_flame', .72, .26], ['e_titan', .1, 0], ['e_mwall', -.34, -.42], ['e_mwall', -.34, .42], ['e_storm', -.56, 0]], loot: [['heart', 1, 1, .5], ['cores', 8, 14, 1], ['alloy', 200, 320, 1], ['crystals', 120, 200, 1], ['data', 60, 90, 1]] },
  forge_noire: { n: 'La Forge noire', hp: 140000, r: 330, spd: 30, sight: 1500, crush: 6, armor: .55, mscale: 6, giant: 1, spawner: 1, painter: 'x_forge', ws: [['e_siege', .52, -.42], ['e_siege', .52, .42], ['e_nova', 0, 0], ['e_mg', -.5, -.42], ['e_mg', -.5, .42]], loot: [['heart', 1, 1, .6], ['cores', 10, 18, 1], ['alloy', 260, 400, 1], ['circuits', 200, 300, 1], ['scrap', 500, 800, 1]] },
  leviathan: { n: 'Le Léviathan', hp: 240000, r: 480, spd: 46, sight: 1900, fly: true, armor: .5, mscale: 8, giant: 1, painter: 'x_leviathan', ws: [['e_titan', .56, 0], ['e_mwall', .2, -.5], ['e_mwall', .2, .5], ['e_beam', -.1, -.62], ['e_beam', -.1, .62], ['e_nova', -.46, 0], ['e_storm', .36, 0]], loot: [['heart', 1, 1, 1], ['heart', 1, 1, .35], ['cores', 20, 30, 1], ['data', 120, 180, 1], ['crystals', 300, 450, 1]] },
  necropole: { n: 'La Nécropole', hp: 620000, r: 860, spd: 26, sight: 2400, crush: 9, armor: .6, mscale: 11.5, giant: 1, spawner: 2, painter: 'x_necropole', ws: [['e_titan', .62, -.3], ['e_titan', .62, .3], ['e_nova', .2, 0], ['e_nova', -.3, 0], ['e_mwall', .3, -.62], ['e_mwall', .3, .62], ['e_beam', -.1, -.7], ['e_beam', -.1, .7], ['e_storm', -.6, -.3], ['e_storm', -.6, .3], ['e_siege', .7, 0]], loot: [['heart', 1, 1, 1], ['heart', 1, 1, 1], ['heart', 1, 1, .5], ['cores', 40, 60, 1], ['data', 250, 350, 1], ['alloy', 900, 1300, 1], ['crystals', 600, 900, 1]] },
});

Object.assign(BUILD, {
  shipyard: { n: 'Chantier titanesque', w: 6, h: 6, max: 3, ui: 'atelier', cost: { scrap: 2500, alloy: 800, circuits: 400, crystals: 200, cores: 10 }, t: 90, d: 'Cale démesurée où s\'assemblent les géants. Niveau 1 : rang 7 ; niveau 2 : rang 8 ; niveau 3 : rang 9, villes-machines et vaisseaux-mères.' },
});
BUILD_KEYS.push('shipyard'); BLIMIT.shipyard = [0, 0, 0, 0, 1];

RESEARCH_CATS.splice(RESEARCH_CATS.indexOf('Armes titanesques') + 1, 0, 'Armes colossales', 'Armes apocalyptiques');
[
  { id: 'c_grillon', cat: 'Châssis', lab: 1, n: 'Châssis Grillon', cost: { data: 3, circuits: 6 }, d: 'Petit sauteur qui bondit sur ses proies.' },
  { id: 'c_herisson', cat: 'Châssis', lab: 2, n: 'Châssis Hérisson', req: 'c_sentry', cost: { data: 10, alloy: 18 }, d: 'Carapace à pointes qui blesse au contact.' },
  { id: 'c_scarabee', cat: 'Châssis', lab: 3, n: 'Châssis Scarabée', req: 'c_gunship', cost: { data: 28, alloy: 40 }, d: 'Volant blindé à deux armes moyennes.' },
  { id: 'c_hydre', cat: 'Châssis', lab: 3, n: 'Châssis Hydre', req: 'c_spider', cost: { data: 45, alloy: 60, cores: 1 }, d: 'Cinq têtes armées.' },
  { id: 'c_wyverne', cat: 'Châssis', lab: 4, n: 'Châssis Wyverne', req: 'c_airship', cost: { data: 95, circuits: 120, cores: 3 }, d: 'Bombardier volant à trois armes lourdes.' },
  { id: 'c_mammouth', cat: 'Châssis', lab: 5, n: 'Châssis Mammouth', req: 'c_titan', cost: { data: 130, alloy: 200, cores: 4 }, d: 'Transporteur de siège à quatre armes titanesques. Exige un Cœur de Colosse.' },
  { id: 'c_rempart', cat: 'Châssis', lab: 5, n: 'Géant Rempart', req: 'c_colossus', cost: { data: 320, alloy: 600, cores: 9 }, d: 'Rang 7. Exige le Chantier titanesque et deux Cœurs de Colosse.' },
  { id: 'c_arachne', cat: 'Châssis', lab: 5, n: 'Géante Arachné', req: 'c_behemoth', cost: { data: 300, crystals: 500, cores: 9 }, d: 'Rang 7. Araignée géante, rapide pour sa taille.' },
  { id: 'c_portenef', cat: 'Châssis', lab: 5, n: 'Géant Porte-nef', req: 'c_arche', cost: { data: 340, circuits: 600, cores: 9 }, d: 'Rang 7. Volant, fabrique des robots jusqu\'au rang 4.' },
  { id: 'c_cyclope', cat: 'Châssis', lab: 5, n: 'Géant Cyclope', req: 'c_rempart', cost: { data: 640, alloy: 1200, cores: 19 }, d: 'Rang 8. Bipède haut comme une tour.' },
  { id: 'c_forgemere', cat: 'Châssis', lab: 5, n: 'Géante Forge-mère', req: 'c_portenef', cost: { data: 680, alloy: 1300, cores: 19 }, d: 'Rang 8. Usine roulante qui fabrique jusqu\'au rang 5.' },
  { id: 'c_aeropole', cat: 'Châssis', lab: 5, n: 'Géante Aéropole', req: 'c_portenef', cost: { data: 660, circuits: 1300, cores: 19 }, d: 'Rang 8. Cité volante à dix affûts.' },
  { id: 'c_villemachine', cat: 'Châssis', lab: 5, n: 'Ville-machine', req: 'c_forgemere', cost: { data: 1280, alloy: 2600, cores: 38 }, d: 'Rang 9. Une ville sur chenilles qui fabrique des Colosses.' },
  { id: 'c_astre', cat: 'Châssis', lab: 5, n: 'Vaisseau-mère Astre', req: 'c_aeropole', cost: { data: 1280, circuits: 2600, cores: 38 }, d: 'Rang 9. Vaisseau-mère qui lâche des Arches.' },
  { id: 'w_harpoon', cat: 'Armes légères', lab: 1, n: 'Lance-harpon', cost: { data: 5, alloy: 6 }, d: WEAPONS.harpoon.d },
  { id: 'w_acidgun', cat: 'Armes légères', lab: 2, n: 'Projecteur d\'acide', cost: { data: 9, crystals: 8 }, d: WEAPONS.acidgun.d },
  { id: 'w_dca', cat: 'Armes moyennes', lab: 2, n: 'Canon de DCA', cost: { data: 14, alloy: 14 }, d: WEAPONS.dca.d },
  { id: 'w_disc', cat: 'Armes moyennes', lab: 3, n: 'Lance-disques', cost: { data: 22, alloy: 25 }, d: WEAPONS.disc.d },
  { id: 'w_thermo', cat: 'Armes lourdes', lab: 4, n: 'Roquettes thermobariques', req: 'w_rockets', cost: { data: 80, crystals: 50 }, d: WEAPONS.thermo.d },
  { id: 'w_lance', cat: 'Armes lourdes', lab: 4, n: 'Lance-foudre', req: 'w_tesla', cost: { data: 85, circuits: 70 }, d: WEAPONS.lance.d },
  { id: 'w_disint', cat: 'Armes titanesques', lab: 5, n: 'Désintégrateur', req: 'w_beam', cost: { data: 160, cores: 4 }, d: WEAPONS.disint.d },
  { id: 'w_gauss', cat: 'Armes titanesques', lab: 5, n: 'Canon de Gauss', req: 'w_rail', cost: { data: 170, cores: 4 }, d: WEAPONS.gauss.d },
  { id: 'w_battle', cat: 'Armes colossales', lab: 5, n: 'Canon de bataille', req: 'c_rempart', cost: { data: 340, cores: 8 }, d: WEAPONS.battle.d },
  { id: 'w_mwall', cat: 'Armes colossales', lab: 5, n: 'Mur de missiles', req: 'c_rempart', cost: { data: 360, cores: 8 }, d: WEAPONS.mwall.d },
  { id: 'w_dome', cat: 'Armes colossales', lab: 5, n: 'Dôme de bouclier', req: 'c_rempart', cost: { data: 380, cores: 9 }, d: WEAPONS.dome.d },
  { id: 'w_annihil', cat: 'Armes colossales', lab: 5, n: 'Rayon annihilateur', req: 'c_arachne', cost: { data: 400, cores: 9 }, d: WEAPONS.annihil.d },
  { id: 'w_furnace', cat: 'Armes colossales', lab: 5, n: 'Fournaise', req: 'c_arachne', cost: { data: 340, cores: 8 }, d: WEAPONS.furnace.d },
  { id: 'w_ion', cat: 'Armes colossales', lab: 5, n: 'Tempête ionique', req: 'c_portenef', cost: { data: 400, cores: 9 }, d: WEAPONS.ion.d },
  { id: 'w_fighters', cat: 'Armes colossales', lab: 5, n: 'Hangar de chasseurs', req: 'c_portenef', cost: { data: 360, cores: 8 }, d: WEAPONS.fighters.d },
  { id: 'w_nanoswarm', cat: 'Armes colossales', lab: 5, n: 'Nuée réparatrice', req: 'c_portenef', cost: { data: 340, cores: 8 }, d: WEAPONS.nanoswarm.d },
  { id: 'w_fission', cat: 'Armes apocalyptiques', lab: 5, n: 'Lance de fission', req: 'c_villemachine', cost: { data: 960, cores: 22 }, d: WEAPONS.fission.d + ' Réservée aux géants de rang 9.' },
  { id: 'w_dusk', cat: 'Armes apocalyptiques', lab: 5, n: 'Missile Crépuscule', req: 'c_villemachine', cost: { data: 1120, cores: 30 }, d: WEAPONS.dusk.d },
  { id: 'w_singul', cat: 'Armes apocalyptiques', lab: 5, n: 'Projecteur de singularité', req: 'c_astre', cost: { data: 1040, cores: 26 }, d: WEAPONS.singul.d },
  { id: 'w_meteor', cat: 'Armes apocalyptiques', lab: 5, n: 'Pluie de météores', req: 'c_astre', cost: { data: 1040, cores: 26 }, d: WEAPONS.meteor.d },
].forEach(r => { RESEARCH.push(r); RESEARCH_BY_ID[r.id] = r; });

// ================= ARBRE DE RECHERCHE PAR FAMILLES =================
// Chaque technologie découle de sa famille : chenillés, marcheurs, volants… cinétique, obus, missiles, énergie…
// req : prérequis principal (même famille) · req2 : prérequis supplémentaires · bld : bâtiment exigé [type, niveau].
(() => {
  const R = RESEARCH_BY_ID;
  const S = (id, req, o = {}) => { const r = R[id]; if (!r) return; r.req = req || undefined; r.req2 = o.also || undefined; if (o.lab) r.lab = o.lab; if (o.bld) r.bld = o.bld; };
  const C1 = { bld: ['shipyard', 1] }, C2 = { bld: ['shipyard', 2] }, C3 = { bld: ['shipyard', 3] };
  // ---- châssis
  S('c_ant'); S('c_scout'); S('c_grillon'); S('c_mantis', 'c_grillon'); S('c_reaper', 'c_mantis');
  S('c_sentry'); S('c_rhino', 'c_sentry'); S('c_tortue', 'c_sentry'); S('c_herisson', 'c_sentry'); S('c_goliath', 'c_rhino'); S('c_colossus', 'c_goliath');
  S('c_rempart', 'c_colossus', C1); S('c_forgemere', 'c_rempart', C2); S('c_villemachine', 'c_forgemere', C3);
  S('c_strider'); S('c_spider', 'c_strider'); S('c_scolopendre', 'c_spider'); S('c_hydre', 'c_spider'); S('c_echassier', 'c_strider'); S('c_titan', 'c_echassier'); S('c_behemoth', 'c_titan');
  S('c_arachne', 'c_behemoth', C1); S('c_cyclope', 'c_arachne', C2);
  S('c_gunship'); S('c_scarabee', 'c_gunship'); S('c_airship', 'c_gunship'); S('c_wyverne', 'c_airship'); S('c_arche', 'c_wyverne');
  S('c_portenef', 'c_arche', C1); S('c_aeropole', 'c_portenef', C2); S('c_astre', 'c_aeropole', C3);
  S('c_mule'); S('c_vautour', 'c_mule', { also: ['c_gunship'] }); S('c_mammouth', 'c_mule', { also: ['c_goliath'] });
  // ---- armes
  S('w_scatter'); S('w_gatling', 'w_scatter'); S('w_needler'); S('w_harpoon'); S('w_disc', 'w_needler'); S('w_rail', 'w_needler'); S('w_gauss', 'w_rail'); S('w_gravity', 'w_rail'); S('w_singul', 'w_gravity', C3);
  S('w_cannon'); S('w_dca', 'w_cannon'); S('w_siege', 'w_cannon'); S('w_battle', 'w_siege', C1);
  S('w_grenade'); S('w_cluster', 'w_grenade'); S('w_mortar', 'w_grenade', { lab: 3 }); S('w_orbital', 'w_mortar'); S('w_meteor', 'w_orbital', C3);
  S('w_rockets'); S('w_swarm', 'w_rockets'); S('w_thermo', 'w_swarm'); S('w_mwall', 'w_thermo', C1); S('w_cruise', 'w_rockets'); S('w_nuke', 'w_cruise'); S('w_dusk', 'w_nuke', C3);
  S('w_laser'); S('w_plasma', 'w_laser'); S('w_fusion', 'w_plasma'); S('w_fission', 'w_fusion', C3); S('w_beam', 'w_laser'); S('w_disint', 'w_beam'); S('w_annihil', 'w_disint', C1);
  S('w_tesla'); S('w_emp', 'w_tesla'); S('w_storm', 'w_tesla'); S('w_lance', 'w_storm'); S('w_ion', 'w_lance', C1);
  S('w_flamer'); S('w_acidgun', 'w_flamer'); S('w_napalm', 'w_flamer'); S('w_furnace', 'w_napalm', C1);
  S('w_repair'); S('w_shield', 'w_repair'); S('w_dome', 'w_shield', C1); S('w_nanoswarm', 'w_repair', C1); S('w_bay'); S('w_fighters', 'w_bay', C1);
  // ---- modules et cerveaux
  S('m_armor'); S('m_plating', 'm_armor'); S('m_emshield', 'm_plating'); S('m_regen', 'm_armor');
  S('m_thrusters'); S('m_jump', 'm_thrusters'); S('m_cloak', 'm_thrusters'); S('m_cargo');
  S('m_sensors'); S('m_stabil', 'm_sensors'); S('m_overcharge', 'm_stabil'); S('m_selfdestruct');
  S('b_gatherer'); S('b_tactical');
  // ---- pilote et protocoles
  S('p_shotgun'); S('p_ar'); S('p_sniper'); S('p_plasma', 'p_ar'); S('p_arc'); S('p_launcher');
  S('u_armor1'); S('u_armor2', 'u_armor1'); S('u_armor3', 'u_armor2'); S('u_bag1'); S('u_bag2', 'u_bag1'); S('u_bag3', 'u_bag2');
  S('u_cmd1'); S('u_cmd2', 'u_cmd1'); S('u_cmd3', 'u_cmd2'); S('u_cmd4', 'u_cmd3'); S('u_beacon'); S('u_anchor', 'u_beacon'); S('u_recall', 'u_anchor');
  // textes : les géants et les armes démesurées se conçoivent au Chantier titanesque
  for (const id of ['w_battle', 'w_mwall', 'w_annihil', 'w_furnace', 'w_ion', 'w_dome', 'w_nanoswarm', 'w_fighters']) if (R[id]) R[id].d = WEAPONS[id.slice(2)].d + ' Arme colossale : se monte sur les géants des rangs 7 et 8.';
  for (const id of ['w_fission', 'w_dusk', 'w_singul', 'w_meteor']) if (R[id]) R[id].d = WEAPONS[id.slice(2)].d + ' Arme apocalyptique : réservée aux géants de rang 9.';
})();
// le poste d'expédition se découvre au QG niveau 2
BLIMIT.expedition = [0, 1, 1, 1, 1];

// points de départ (déjà acquis) et branches de l'arbre
const RT_BASE = {
  x_crawler: { n: 'Rampeur', ch: 'crawler', d: 'Chenillé d\'entrée de gamme, disponible dès le départ.' },
  x_drone: { n: 'Libellule', ch: 'drone', d: 'Petit volant d\'entrée de gamme, disponible dès le départ.' },
  x_mg: { n: 'Mitrailleuse', w: 'mg', d: 'Arme de départ : cadence élevée, courte portée.' },
  x_rifle: { n: 'Fusil long', w: 'rifle', d: 'Arme de départ : précise et lointaine.' },
  x_blades: { n: 'Lames', w: 'blades', d: 'Arme de départ : corps à corps.' },
  x_brains: { n: 'Escorte, Chasseur, Gardien', d: 'Les trois cerveaux disponibles dès le départ.' },
  x_pistol: { n: 'Pistolet', d: 'L\'arme de départ du pilote.' },
};
const RT_ROOT = { c_sentry: 'x_crawler', c_gunship: 'x_drone', w_scatter: 'x_mg', w_needler: 'x_rifle', w_harpoon: 'x_rifle', w_flamer: 'x_blades', b_gatherer: 'x_brains', b_tactical: 'x_brains', p_shotgun: 'x_pistol', p_ar: 'x_pistol', p_sniper: 'x_pistol', p_arc: 'x_pistol', p_launcher: 'x_pistol' };
const RT_BRANCHES = [
  { id: 'ch', n: 'Châssis', fam: [
    { id: 'chenille', n: 'Chenillés', ids: ['x_crawler', 'c_sentry', 'c_rhino', 'c_tortue', 'c_herisson', 'c_goliath', 'c_colossus', 'c_rempart', 'c_forgemere', 'c_villemachine'] },
    { id: 'marcheur', n: 'Marcheurs', ids: ['c_strider', 'c_echassier', 'c_spider', 'c_titan', 'c_hydre', 'c_scolopendre', 'c_behemoth', 'c_arachne', 'c_cyclope'] },
    { id: 'volant', n: 'Volants', ids: ['x_drone', 'c_gunship', 'c_airship', 'c_scarabee', 'c_wyverne', 'c_arche', 'c_portenef', 'c_aeropole', 'c_astre'] },
    { id: 'leger', n: 'Légers et rapides', ids: ['c_ant', 'c_grillon', 'c_scout', 'c_mantis', 'c_reaper'] },
    { id: 'transport', n: 'Transport', ids: ['c_mule', 'c_vautour', 'c_mammouth'] },
  ] },
  { id: 'w', n: 'Armes', fam: [
    { id: 'cin', n: 'Cinétique', ids: ['x_mg', 'x_rifle', 'w_scatter', 'w_needler', 'w_harpoon', 'w_gatling', 'w_rail', 'w_disc', 'w_gravity', 'w_gauss', 'w_singul'] },
    { id: 'obus', n: 'Obus et artillerie', ids: ['w_cannon', 'w_grenade', 'w_dca', 'w_cluster', 'w_mortar', 'w_siege', 'w_orbital', 'w_battle', 'w_meteor'] },
    { id: 'mis', n: 'Missiles', ids: ['w_rockets', 'w_swarm', 'w_cruise', 'w_thermo', 'w_nuke', 'w_mwall', 'w_dusk'] },
    { id: 'nrj', n: 'Énergie', ids: ['w_laser', 'w_plasma', 'w_beam', 'w_fusion', 'w_disint', 'w_annihil', 'w_fission'] },
    { id: 'elec', n: 'Électricité', ids: ['w_tesla', 'w_emp', 'w_storm', 'w_lance', 'w_ion'] },
    { id: 'feu', n: 'Feu, acide et lames', ids: ['x_blades', 'w_flamer', 'w_acidgun', 'w_napalm', 'w_furnace'] },
    { id: 'sout', n: 'Soutien', ids: ['w_repair', 'w_shield', 'w_bay', 'w_nanoswarm', 'w_dome', 'w_fighters'] },
  ] },
  { id: 'eq', n: 'Modules et cerveaux', fam: [
    { id: 'prot', n: 'Protection', ids: ['m_armor', 'm_plating', 'm_regen', 'm_emshield'] },
    { id: 'mob', n: 'Mobilité et soute', ids: ['m_thrusters', 'm_cargo', 'm_jump', 'm_cloak'] },
    { id: 'cbt', n: 'Combat', ids: ['m_sensors', 'm_selfdestruct', 'm_stabil', 'm_overcharge'] },
    { id: 'brain', n: 'Cerveaux', ids: ['x_brains', 'b_gatherer', 'b_tactical'] },
  ] },
  { id: 'pi', n: 'Pilote et protocoles', fam: [
    { id: 'parm', n: 'Armes du pilote', ids: ['x_pistol', 'p_shotgun', 'p_ar', 'p_sniper', 'p_plasma', 'p_arc', 'p_launcher'] },
    { id: 'pequ', n: 'Équipement du pilote', ids: ['u_armor1', 'u_bag1', 'u_armor2', 'u_bag2', 'u_armor3', 'u_bag3'] },
    { id: 'cmd', n: 'Commandement', ids: ['u_cmd1', 'u_cmd2', 'u_cmd3', 'u_cmd4'] },
    { id: 'bal', n: 'Balise et extraction', ids: ['u_beacon', 'u_anchor', 'u_recall'] },
  ] },
];
// toute technologie oubliée par les familles rejoint une famille « Autres » de sa branche
(() => {
  const seen = new Set(RT_BRANCHES.flatMap(b => b.fam.flatMap(f => f.ids)));
  const brOf = id => id[0] === 'c' ? 'ch' : id[0] === 'w' ? 'w' : id[0] === 'm' || id[0] === 'b' ? 'eq' : 'pi';
  for (const r of RESEARCH) if (!seen.has(r.id)) { const B = RT_BRANCHES.find(b => b.id === brOf(r.id)); let f = B.fam.find(x => x.id === 'autres'); if (!f) B.fam.push(f = { id: 'autres', n: 'Autres', ids: [] }); f.ids.push(r.id); }
})();

// ================= RÉGIONS =================
const REGIONS = [
  { id: 'cendres', n: 'Les Cendres', tier: 1, boss: 'rouilleux', bias: { u: 0, m: 0 }, bases: 5, rivals: 1, extra: {}, lootBias: {}, d: 'Plaines grises, ruines et marais épars. Le Rouilleux garde le cratère.' },
  { id: 'acide', n: 'Marais d\'acide', tier: 2, boss: 'ruche', bias: { u: -.05, m: .12 }, bases: 4, rivals: 2, extra: { 3: [['scorpion', 1, 2]], 1: [['scorpion', 0, 1], ['faucon', 0, 1, .3]], 0: [['scorpion', 0, 1, .4]] }, lootBias: { crystals: 1.6, circuits: 1.3 }, d: 'Marécages toxiques infestés d\'essaims et de scorpions. Une ruche cristalline pulse au centre.' },
  { id: 'megapole', n: 'Mégapole morte', tier: 3, boss: 'souverain', bias: { u: .15, m: -.04 }, bases: 8, rivals: 2, extra: { 2: [['sniper', 1, 2]], 0: [['sniper', 0, 1, .5], ['char', 0, 1, .3]] }, lootBias: { alloy: 1.4, data: 1.5, cores: 1.3 }, d: 'Gratte-ciel effondrés, tireurs embusqués, bases militaires. Le Souverain y porte un Cœur de Colosse.' },
  { id: 'glacier', n: 'Glacier noir', tier: 4, boss: 'archonte', bias: { u: 0, m: .04 }, bases: 6, rivals: 3, extra: { all: [['givre', 0, 2, .6]] }, lootBias: { cores: 1.5, crystals: 1.3 }, ice: 1, d: 'Le front gelé. Marcheurs de givre, équipes rivales aguerries et l\'Archonte, qui garde un Cœur.' },
];
const REGION_GROUND = {
  acide: { 0: [[56, 60, 46], '#4f5644'], 1: [[30, 42, 26], '#2e3e26'], 3: [[64, 104, 30], '#66a62a'] },
  megapole: { 0: [[62, 62, 64], '#58585c'], 1: [[42, 44, 40], '#3c3e38'] },
  glacier: { 0: [[188, 196, 204], '#b8c2cc'], 1: [[118, 130, 138], '#7d8a94'], 2: [[78, 86, 96], '#5a6470'], 3: [[112, 160, 190], '#7fb0cc'], 4: [[118, 128, 168], '#7680a8'], 5: [[40, 48, 70], '#2e3650'], 6: [[150, 156, 162], '#9aa0a6'], 7: [[38, 42, 50], '#22262c'] },
};
const regionUnlocked = i => i === 0 || save.cdone[i - 1] >= 3 || save.bossKills[i - 1] >= 1;

// ================= CONTRATS =================
const HUNT_N = { rodeur: 12, pillard: 10, essaim: 20, traqueur: 6, faucon: 5, char: 3, artilleur: 4, sniper: 5, scorpion: 5, givre: 3 };
function huntPool(ri) { const p = ['rodeur', 'pillard', 'essaim', 'traqueur']; if (ri >= 1) p.push('faucon', 'scorpion'); if (ri >= 2) p.push('char', 'artilleur', 'sniper'); if (ri >= 3) p.push('givre'); return p; }
function rewardFor(v) {
  const r = { scrap: Math.round(60 * v), alloy: Math.round(18 * v), circuits: Math.round(14 * v), data: Math.round(6 * v) };
  if (v >= 1.6) r.crystals = Math.round(12 * v); if (v >= 2.5) r.cores = Math.max(1, Math.round(v / 2.5)); return r;
}
function genContract(ri) {
  const R = REGIONS[ri], t = R.tier, have = save.offers[ri].map(c => c.kind);
  let k; for (let i = 0; i < 20; i++) { k = pick(['hunt', 'hunt', 'salvage', 'archives', 'pylons', 'rival', 'sabotage', 'speed', 'noloss', 'elite', 'boss']); if (!have.includes(k) || k === 'hunt') break; }
  const c = { id: save.cid++, region: ri, kind: k };
  switch (k) {
    case 'hunt': c.target = pick(huntPool(ri)); c.count = Math.round(HUNT_N[c.target] * (1 + .25 * (t - 1))); break;
    case 'elite': c.target = 'mastodonte'; c.count = t >= 3 ? 2 : 1; break;
    case 'salvage': c.res = pick(['alloy', 'circuits', 'crystals', 'data']); c.count = Math.round({ alloy: 30, circuits: 30, crystals: 25, data: 20 }[c.res] * (1 + .4 * (t - 1))); break;
    case 'archives': c.count = 2 + Math.floor(t / 2); break;
    case 'pylons': c.count = 2 + (t >= 3 ? 1 : 0); break;
    case 'rival': case 'sabotage': c.count = 1; break;
    case 'speed': c.time = 420 - 30 * t; break;
    case 'noloss': c.min = 3; break;
    case 'boss': c.target = R.boss; break;
  }
  const val = { hunt: 1, elite: 1.6, salvage: 1.2, archives: 1, pylons: .9, rival: 1.6, sabotage: 1.4, speed: 1.2, noloss: 1.3, boss: 3 }[k] * t;
  c.reward = rewardFor(val); c.rep = k === 'boss' ? 3 : 1;
  return c;
}
function contractText(c) {
  switch (c.kind) {
    case 'hunt': return 'Abattre ' + c.count + ' × ' + ENEMIES[c.target].n;
    case 'elite': return 'Abattre ' + c.count + ' mastodonte' + (c.count > 1 ? 's' : '');
    case 'salvage': return 'Rapporter ' + c.count + ' ' + RES[c.res].n;
    case 'archives': return 'Extraire ' + c.count + ' archives de données';
    case 'pylons': return 'Activer ' + c.count + ' pylônes relais';
    case 'rival': return 'Éliminer le chef d\'une équipe rivale';
    case 'sabotage': return 'Détruire la balise d\'une équipe rivale';
    case 'speed': return 'S\'extraire en moins de ' + mmss(c.time);
    case 'noloss': return 'S\'extraire sans perdre de robot (' + c.min + ' déployés au moins)';
    case 'boss': return 'Abattre ' + ENEMIES[c.target].n;
  }
  return '';
}
function refillOffers() { const n = 2 + Math.max(1, bLevel('contracts')); for (let ri = 0; ri < REGIONS.length; ri++) { const L = save.offers[ri]; while (L.length < n) L.push(genContract(ri)); } }
