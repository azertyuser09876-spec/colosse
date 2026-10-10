// Ennemis de la version 3.0 : nouveaux adversaires, difficultés supérieures, densité et comportements particuliers.

// ================= ARMES DES NOUVEAUX ENNEMIS =================
Object.assign(WEAPONS, {
  e_swarm4: { hidden: 1, dmg: 26, salvo: 4, rate: .34, spd: 520, range: 900, spread: .12, splash: 48, kind: 'rocket', col: '#ff7a50', snd: 'swarm' },
  e_howitzer: { hidden: 1, dmg: 125, rate: .2, range: 1450, minRange: 300, splash: 150, kind: 'mortar', col: '#ff6a40', snd: 'mortar' },
  e_blade: { hidden: 1, dmg: 55, rate: 1.25, range: 44, kind: 'melee', snd: 'melee' },
  e_shield: { hidden: 1, cap: 260, regen: 45, range: 330, kind: 'shield', col: '#ff9ab0' },
  e_repair: { hidden: 1, heal: 42, range: 300, kind: 'repair', col: '#9fe06a' },
  e_bay: { hidden: 1, max: 4, rate: .3, range: 600, kind: 'bay', col: '#ff6070' },
  e_heavy: { hidden: 1, dmg: 260, rate: .3, spd: 820, range: 1100, spread: .03, splash: 120, kind: 'shell', col: '#ffb08a', snd: 'siege' },
});
// apparence des armes ennemies : celle d'une arme du joueur de même famille
const WLOOK = { e_swarm4: 'swarm', e_howitzer: 'mortar', e_blade: 'blades', e_shield: 'shield', e_repair: 'repair', e_bay: 'bay', e_heavy: 'siege' };

// ================= PEINTRES DES NOUVEAUX ENNEMIS =================
// sapeur : bombe sur pattes, son voyant clignote de plus en plus vite à l'approche de sa cible
function paintSapeur(c, r, P, t, mv, u) {
  gait(u, [[.3, -.3, .55, -.95], [-.3, -.3, -.55, -.95], [.3, .3, .55, .95], [-.3, .3, -.55, .95]], r, t, mv, { groups: [0, 1, 1, 0], stride: .45, dur: .1, f: 22, amp: .3 }).forEach((g, k) => legIK(c, g, r * .5, r * .5, (k % 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .16, P, 0, false));
  c.fillStyle = P.body2; circ(c, 0, 0, r * .72); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
  c.save(); circ(c, 0, 0, r * .62); c.clip(); for (let k = -4; k < 5; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#1e1c18'; c.beginPath(); c.moveTo(k * r * .3 - r, -r); c.lineTo(k * r * .3 - r * .8, -r); c.lineTo(k * r * .3 + r, r); c.lineTo(k * r * .3 + r * .8, r); c.fill(); } c.restore();
  c.fillStyle = P.dark; circ(c, 0, 0, r * .36); c.fill();
  const near = u && u.target && !u.target.dead ? clamp(1 - Math.hypot(u.target.x - u.x, u.target.y - u.y) / 500, 0, 1) : 0;
  const on = Math.sin(t * (6 + near * 30)) > 0; c.fillStyle = on ? '#ff3040' : '#5a1a1e'; circ(c, 0, 0, r * .2); c.fill();
  if (on) { c.fillStyle = 'rgba(255,48,64,.25)'; circ(c, 0, 0, r * .5); c.fill(); }
}
// égide : marcheur porteur d'un projecteur de bouclier qui couvre ses alliés
function paintEgide(c, r, P, t, mv, u) {
  gait(u, [[.3, -.35, .6, -1.05], [-.3, -.35, -.6, -1.05], [.3, .35, .6, 1.05], [-.3, .35, -.6, 1.05]], r, t, mv, { groups: [0, 1, 1, 0], stride: .4, dur: .28, f: 6, amp: .3 }).forEach((g, k) => legIK(c, g, r * .55, r * .6, (k % 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .14, P, r * .1));
  c.fillStyle = P.body; ngon(c, 6, r * .72, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = P.plate; ngon(c, 6, r * .5, 0); c.fill();
  const p = .5 + .5 * Math.sin(t * 3), g = c.createRadialGradient(-r * .1, 0, 0, -r * .1, 0, r * .42);
  g.addColorStop(0, `rgba(255,220,230,${.75 + .2 * p})`); g.addColorStop(1, 'rgba(255,154,176,0)'); c.fillStyle = g; circ(c, -r * .1, 0, r * .42); c.fill();
  c.strokeStyle = `rgba(255,154,176,${.35 + .35 * p})`; c.lineWidth = 2; circ(c, -r * .1, 0, r * (.5 + p * .12)); c.stroke();
}
// réparateur : drone à trois rotors et bras soudeur
function paintMecano(c, r, P, t, mv, u) {
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * TAU + Math.PI / 3, x = Math.cos(a) * r * .8, y = Math.sin(a) * r * .8;
    c.strokeStyle = P.body2; c.lineWidth = r * .18; c.beginPath(); c.moveTo(0, 0); c.lineTo(x, y); c.stroke();
    c.fillStyle = 'rgba(210,225,220,.13)'; circ(c, x, y, r * .45); c.fill();
    const sa = t * 50 + k; c.strokeStyle = P.plate; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + Math.cos(sa) * r * .4, y + Math.sin(sa) * r * .4); c.lineTo(x - Math.cos(sa) * r * .4, y - Math.sin(sa) * r * .4); c.stroke();
  }
  c.fillStyle = P.body; circ(c, 0, 0, r * .5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#9fe06a'; c.fillRect(-r * .28, -r * .08, r * .56, r * .16); c.fillRect(-r * .08, -r * .28, r * .16, r * .56);
}
// ravageur : char moyen à nacelle de missiles
function paintRavageur(c, r, P, t, mv, u) {
  treads(c, -r * .95, -r * .98, r * 1.9, r * .4, P, t, r * 1.6); treads(c, -r * .95, r * .58, r * 1.9, r * .4, P, t, r * 1.6);
  c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .85, -r * .45); c.lineTo(r * .5, -r * .66); c.lineTo(-r * .85, -r * .62); c.lineTo(-r * .85, r * .62); c.lineTo(r * .5, r * .66); c.lineTo(r * .85, r * .45); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = P.plate; rr(c, -r * .7, -r * .42, r * .7, r * .84, r * .08); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-r * .7 + k * r * .175, -r * .4); c.lineTo(-r * .7 + k * r * .175, r * .4); c.stroke(); }
  c.fillStyle = P.acc; c.fillRect(r * .72, -r * .25, r * .08, r * .5);
}
// spectre : chasseur furtif, silhouette fine et visière
function paintSpectre(c, r, P, t, mv, u) {
  gait(u, [[0, -.22, 0, -.36], [0, .22, 0, .36]], r, t, mv, { stride: .55, dur: .16, f: 11, amp: .5 }).forEach(g => { c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .16; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(g.fx, g.fy); c.stroke(); c.fillStyle = P.body2; circ(c, g.fx, g.fy, r * .13 * (1 + g.lift * .3)); c.fill(); });
  c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .55, 0); c.lineTo(-r * .2, -r * .42); c.lineTo(-r * .5, 0); c.lineTo(-r * .2, r * .42); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = `rgba(160,240,255,${.6 + .3 * Math.sin(t * 5)})`; c.fillRect(r * .18, -r * .2, r * .12, r * .4);
}
// nid volant : ruche portée par quatre rotors, qui lâche des essaims
function paintNid(c, r, P, t, mv, u) {
  for (const [x, y] of [[.55, -.6], [.55, .6], [-.55, -.6], [-.55, .6]]) {
    c.fillStyle = 'rgba(210,225,220,.12)'; circ(c, x * r, y * r, r * .36); c.fill();
    c.strokeStyle = 'rgba(220,230,226,.45)'; c.lineWidth = r * .03; c.beginPath(); for (let k = 0; k < 2; k++) { const a = t * 30 + k * Math.PI / 2 + x; c.moveTo(x * r + Math.cos(a) * r * .34, y * r + Math.sin(a) * r * .34); c.lineTo(x * r - Math.cos(a) * r * .34, y * r - Math.sin(a) * r * .34); } c.stroke();
  }
  c.fillStyle = P.body2; c.beginPath(); c.ellipse(0, 0, r * .72, r * .55, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, x = k ? Math.cos(a) * r * .32 : 0, y = k ? Math.sin(a) * r * .26 : 0; c.fillStyle = k % 2 ? P.body : P.plate; ngon(c, 6, r * .15, 0, x, y); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); }
  const op = .5 + .5 * Math.sin(t * 2.4); c.fillStyle = `rgba(255,96,112,${.4 + .5 * op})`; ngon(c, 6, r * .1, 0, 0, 0); c.fill();
}
// obusier : pièce d'artillerie chenillée, béquilles déployées
function paintObusier(c, r, P, t, mv, u) {
  const dep = u && u.target && !u.mv ? 1 : clamp(1 - (u ? u.mv : 1) * 2, 0, 1);
  for (const s of [-1, 1]) for (const x of [-.55, .45]) { c.strokeStyle = P.dark; c.lineWidth = r * .1; c.beginPath(); c.moveTo(x * r, s * r * .5); c.lineTo(x * r + (x < 0 ? -1 : 1) * r * .3 * dep, s * r * (.6 + .45 * dep)); c.stroke(); c.fillStyle = P.body2; circ(c, x * r + (x < 0 ? -1 : 1) * r * .3 * dep, s * r * (.6 + .45 * dep), r * .08); c.fill(); }
  treads(c, -r * .9, -r * .82, r * 1.8, r * .34, P, t, r * 1.4); treads(c, -r * .9, r * .48, r * 1.8, r * .34, P, t, r * 1.4);
  c.fillStyle = P.body; rr(c, -r * .82, -r * .52, r * 1.6, r * 1.04, r * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = P.plate; rr(c, -r * .7, -r * .36, r * .55, r * .72, r * .06); c.fill();
  c.fillStyle = P.acc; for (let k = 0; k < 3; k++) c.fillRect(-r * .62 + k * r * .16, r * .2, r * .08, r * .08);
}
// broyeur : bipède cuirassé, chaudière lance-flammes à l'avant
function paintBroyeur(c, r, P, t, mv, u) {
  gait(u, [[0, -.3, 0, -.46], [0, .3, 0, .46]], r, t, mv, { stride: .42, dur: .42, f: 3, amp: .38, thud: giantThud }).forEach(g => {
    c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .24; c.beginPath(); c.moveTo(g.hx, g.hy); c.lineTo(g.fx, g.fy); c.stroke();
    const k = 1 + g.lift * .18; c.fillStyle = P.body2; rr(c, g.fx - r * .32 * k, g.fy - r * .18 * k, r * .66 * k, r * .36 * k, r * .07); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
  });
  c.fillStyle = P.body; ngon(c, 8, r * .62, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3.5; c.stroke();
  for (const s of [-1, 1]) { c.fillStyle = P.plate; c.beginPath(); c.moveTo(r * .35, s * r * .35); c.lineTo(-r * .4, s * r * .4); c.lineTo(-r * .3, s * r * .82); c.lineTo(r * .3, s * r * .74); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke(); c.fillStyle = P.dark; for (let k = 0; k < 3; k++) { circ(c, -r * .2 + k * r * .2, s * r * .6, r * .035); c.fill(); } }
  const p = .6 + .4 * Math.sin(t * 9), g = c.createRadialGradient(r * .32, 0, 0, r * .32, 0, r * .3); g.addColorStop(0, `rgba(255,220,140,${p})`); g.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = g; circ(c, r * .32, 0, r * .3); c.fill();
  glowCore(c, -r * .15, 0, r * .16, P, t);
}
// exécuteur : quadrupède de siège, canon lourd et nacelles de missiles
function paintExecuteur(c, r, P, t, mv, u) {
  const L = [[.4, -.35, .85, -1.15], [-.4, -.35, -.85, -1.15], [.4, .35, .85, 1.15], [-.4, .35, -.85, 1.15]];
  gait(u, L, r, t, mv, { groups: [0, 1, 1, 0], stride: .36, dur: .45, f: 3, amp: .25, thud: giantThud }).forEach((g, k) => legIK(c, g, r * .65, r * .7, (k % 2 ? -1 : 1) * (g.hy < 0 ? 1 : -1), r * .16, P, r * .12));
  c.fillStyle = P.body2; rr(c, -r * .78, -r * .58, r * 1.5, r * 1.16, r * .14); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
  c.fillStyle = P.body; ngon(c, 8, r * .55, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
  c.fillStyle = P.plate; ngon(c, 8, r * .4, Math.PI / 8); c.fill();
  c.save(); rr(c, -r * .74, -r * .5, r * .12, r * 1.0, 3); c.clip(); for (let k = -10; k < 10; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#1e1c18'; c.fillRect(-r * .74, k * r * .1, r * .12, r * .05); } c.restore();
  glowCore(c, 0, 0, r * .18, P, t);
}
// générateur (cible de mission) : bobine tournante et cœur d'énergie
function paintGenerateur(c, r, P, t, mv, u) {
  c.fillStyle = P.dark; rr(c, -r, -r, r * 2, r * 2, r * .15); c.fill();
  c.fillStyle = P.body; rr(c, -r * .88, -r * .88, r * 1.76, r * 1.76, r * .12); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
  for (const [x, y] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) { c.fillStyle = P.plate; circ(c, x * r, y * r, r * .12); c.fill(); }
  c.save(); c.rotate(t * 2.2); c.strokeStyle = P.plate; c.lineWidth = r * .12; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, r * .58, k * TAU / 3, k * TAU / 3 + 1.4); c.stroke(); } c.restore();
  const hurt = u && u.maxhp ? 1 - u.hp / u.maxhp : 0, p = .55 + .45 * Math.sin(t * (4 + hurt * 10));
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r * .45); g.addColorStop(0, '#fff6e0'); g.addColorStop(.4, `rgba(255,170,80,${.8 * p})`); g.addColorStop(1, 'rgba(255,90,40,0)'); c.fillStyle = g; circ(c, 0, 0, r * .45); c.fill();
}

// ================= NOUVEAUX ENNEMIS =================
Object.assign(ENEMIES, {
  sapeur: { n: TL('Sapeur'), hp: 70, r: 11, spd: 265, sight: 620, suicide: { r: 95, dmg: 140 }, ws: [], paint: paintSapeur, loot: [['scrap', 2, 5, 1], ['circuits', 1, 2, .4]] },
  egide: { n: TL('Égide'), hp: 480, r: 21, spd: 100, sight: 650, armor: .15, ws: [['e_shield', -.1, 0], ['e_mg', .45, 0]], paint: paintEgide, loot: [['crystals', 2, 5, 1], ['circuits', 2, 4, 1], ['cores', 1, 1, .1]] },
  mecano: { n: TL('Réparateur'), hp: 150, r: 13, spd: 215, sight: 600, fly: true, support: true, ws: [['e_repair', .3, 0]], paint: paintMecano, loot: [['circuits', 2, 5, 1], ['data', 1, 2, .5]] },
  ravageur: { n: TL('Ravageur'), hp: 950, r: 28, spd: 105, sight: 800, crush: 2, armor: .25, mscale: 1.5, ws: [['e_swarm4', .05, 0], ['e_mg', .45, -.35]], paint: paintRavageur, loot: [['alloy', 4, 9, 1], ['circuits', 3, 6, 1], ['cores', 1, 1, .15]] },
  spectre: { n: TL('Spectre'), hp: 280, r: 14, spd: 245, sight: 650, cloak: true, ws: [['e_blade', .5, 0]], paint: paintSpectre, loot: [['data', 2, 4, 1], ['crystals', 1, 3, .6]] },
  nid: { n: TL('Nid volant'), hp: 1300, r: 34, spd: 75, sight: 750, fly: true, armor: .1, mscale: 1.4, ws: [['e_bay', 0, 0], ['e_sting', .5, 0]], paint: paintNid, loot: [['crystals', 4, 8, 1], ['cores', 1, 1, .3], ['data', 3, 6, 1]] },
  obusier: { n: TL('Obusier'), hp: 760, r: 27, spd: 62, sight: 1300, armor: .2, mscale: 1.5, ws: [['e_howitzer', 0, 0]], paint: paintObusier, loot: [['alloy', 3, 7, 1], ['scrap', 6, 12, 1], ['data', 2, 4, .6]] },
  broyeur: { n: TL('Broyeur'), hp: 3400, r: 46, spd: 72, sight: 760, crush: 3, armor: .35, mscale: 2, elite: 1, ws: [['e_flame', .55, 0], ['e_mg', .2, -.55], ['e_mg', .2, .55]], paint: paintBroyeur, loot: [['alloy', 14, 24, 1], ['cores', 2, 3, 1], ['circuits', 8, 14, 1]] },
  executeur: { n: TL('Exécuteur'), hp: 6200, r: 58, spd: 64, sight: 900, crush: 3, armor: .4, mscale: 2.4, elite: 1, ws: [['e_heavy', .35, 0], ['e_swarm4', -.1, -.5], ['e_swarm4', -.1, .5], ['e_mg', .5, -.3], ['e_mg', .5, .3]], paint: paintExecuteur, loot: [['alloy', 25, 40, 1], ['cores', 3, 5, 1], ['data', 10, 16, 1], ['crystals', 10, 18, 1]] },
  generateur: { n: TL('Générateur'), hp: 2600, r: 26, spd: 0, sight: 0, static: true, armor: .2, ws: [], paint: paintGenerateur, loot: [['circuits', 6, 10, 1], ['data', 3, 6, 1]] },
});
Object.assign(HUNT_N, { sapeur: 10, egide: 3, mecano: 4, ravageur: 3, spectre: 4, nid: 2, obusier: 3, broyeur: 1, executeur: 1 });
// nouveaux ennemis selon le rang de la région (contrats de chasse, camps et renforts)
const NEW_FOES = [['sapeur', 1, 3], ['spectre', 2, 2], ['mecano', 2, 1], ['egide', 2, 2], ['ravageur', 3, 2], ['obusier', 3, 2], ['nid', 3, 1], ['broyeur', 4, 1]];
const newFoes = tier => NEW_FOES.filter(([, t]) => t <= tier).map(([k]) => k);
// tirage pondéré : les plus redoutables sont plus rares
function pickFoe(tier, skip) { const L = NEW_FOES.filter(([k, t]) => t <= tier && (!skip || !skip.includes(k))); let s = 0; for (const f of L) s += f[2]; let x = Math.random() * s; for (const f of L) { x -= f[2]; if (x <= 0) return f[0]; } return L.length ? L[0][0] : null; }

// (difficultés Enfer et Apocalypse : déclarées avec les autres dans 04-donnees.js, avant le chargement de la sauvegarde)

// ================= COMPORTEMENTS PARTICULIERS =================
// appelé au début de l'IA ennemie ; renvoie true si l'unité a déjà agi
function foeSpecial(e, t, dt) {
  // sapeur : fonce et explose au contact
  if (e.suicide && t) {
    if (d2(e.x, e.y, t.x, t.y) < (e.r + t.r + 14) ** 2) { const S = e.suicide; explode(e.x, e.y, S.r, S.dmg * diff.dmg, 1, e); e.noCredit = true; kill(e, null); return true; }
    goTo(e, t.x, t.y, dt, 1.1, 0); return true;
  }
  // réparateur : reste en retrait des siens les plus abîmés
  if (e.support) {
    e.st = (e.st || 0) - dt;
    if (e.st <= 0 || !e.buddy || e.buddy.dead) { e.st = 1; let best = null, bs = 1e18; query(e.x - 800, e.y - 800, e.x + 800, e.y + 800, v => { if (v.team !== 1 || v === e || v.dead || v.static || v.support) return; const s = d2(v.x, v.y, e.x, e.y) * (.3 + v.hp / v.maxhp); if (s < bs) { bs = s; best = v; } }); e.buddy = best; }
    const b = e.buddy; if (b) { const a = Math.atan2(e.y - b.y, e.x - b.x); goTo(e, b.x + Math.cos(a) * (b.r + 110), b.y + Math.sin(a) * (b.r + 110), dt, 1, 30); return true; }
  }
  return false;
}
// les réparateurs et projecteurs de bouclier ennemis soignent et protègent les leurs
function foesNear(u, R, fn) { query(u.x - R, u.y - R, u.x + R, u.y + R, v => { if (v.team === u.team && !v.dead && !v.hidden && d2(v.x, v.y, u.x, u.y) < R * R) fn(v); }); }
