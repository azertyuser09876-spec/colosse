// Socle des ajouts de la 3.1 : outils communs aux nouvelles armes, aux nouveaux châssis et à l'équipement.
// Les fichiers 04-plus-*.js se chargent juste après 04-donnees.js (avant la sauvegarde) : ils ne déclarent que des
// données et des fonctions, appelées pendant le jeu. Les registres (CH_PAINT, W_PAINT, W_FIRE, W_TICK, B_KIND, ZONE_K,
// MOD_FX, ABIL, BRAIN_AI, PERK_TICK) sont déclarés en tête de 04-donnees.js.

// ================= TAILLES, CATÉGORIES, PALIERS =================
RESEARCH_CATS.splice(RESEARCH_CATS.indexOf(TL('Armes apocalyptiques')) + 1, 0, TL('Armes cataclysmiques'), TL('Armes stellaires'));
// recherche réservée à un niveau du chantier titanesque (4 : rang 10 et armes cataclysmiques ; 5 : rang 11 et armes stellaires)
const SHIP = n => ({ bld: ['shipyard', n] });

// ================= RECHERCHES =================
// deux familles d'armes de plus dans l'arbre : contrôle (froid, gravité, temps) et déploiements (mines, tourelles, escadrilles)
(() => { const B = RT_BRANCHES.find(b => b.id === 'w'), at = B.fam.findIndex(f => f.id === 'sout'); B.fam.splice(at, 0, { id: 'ctrl', n: TL('Contrôle et gravité'), ids: [] }, { id: 'dep', n: TL('Drones et déploiements'), ids: [] }); })();
// ajoute une recherche : r = { id, cat, lab, n, cost, d, req?, req2?, bld?, fam } ; fam : famille de l'arbre (chenille, marcheur, volant, leger,
// transport · cin, obus, mis, nrj, elec, feu, ctrl, dep, sout · prot, mob, cbt, brain · parm, pequ, cmd, bal) ; root : nœud de départ (x_…) si pas de req
function addResearch(r) {
  const o = Object.assign({}, r); delete o.fam; delete o.root;
  RESEARCH.push(o); RESEARCH_BY_ID[o.id] = o;
  if (r.root) RT_ROOT[o.id] = r.root;
  for (const B of RT_BRANCHES) { const f = B.fam.find(x => x.id === r.fam); if (f) { if (!f.ids.includes(o.id)) f.ids.push(o.id); return o; } }
  return o;
}

// ================= CIBLES =================
// fn(v) pour chaque unité adverse de `team` qui touche le cercle ; o.air === false : pas les volants ; o.ground === false : que les volants
function foesIn(x, y, r, team, fn, o) {
  query(x - r - 200, y - r - 200, x + r + 200, y + r + 200, v => {
    if (v.team === team || v.dead || v.hidden || v.etype === 'cible' || v.invul || v.kind === 'beacon' && team === 0) return;
    if (o && o.air === false && v.fly) return; if (o && o.ground === false && !v.fly) return;
    if (d2(v.x, v.y, x, y) > (r + v.r) ** 2) return;
    fn(v);
  });
}
// fn(v) pour chaque unité alliée de `team` (robots, pilote, objectifs) dans le cercle
function alliesIn(x, y, r, team, fn) {
  query(x - r - 200, y - r - 200, x + r + 200, y + r + 200, v => {
    if (v.team !== team || v.dead || v.hidden || v.kind === 'building' || v.maxhp <= 0) return;
    if (d2(v.x, v.y, x, y) > (r + v.r) ** 2) return;
    fn(v);
  });
}
// adversaire le plus proche dans le rayon (skip : Set d'id à éviter)
function nearestFoe(x, y, r, team, skip, o) {
  let best = null, bd = Infinity;
  foesIn(x, y, r, team, v => { if (skip && skip.has(v.id)) return; const q = d2(v.x, v.y, x, y); if (q < bd) { bd = q; best = v; } }, o);
  return best;
}

// ================= DÉGÂTS ET EFFETS =================
// dégâts avec effets secondaires ; o : { ap (part du blindage ignorée), slow (s), stun (s), corr (blindage retiré, 0 à 1), corrT (s),
// vuln (dégâts subis en plus, 0 à 1), vulnT (s), push (élan en px/s, depuis o.px/o.py ou la source), leech (part rendue au tireur) }
function hurt(v, dmg, src, o) {
  if (NETVIS || !v || v.dead) return;
  const hp0 = v.hp; if (dmg > 0) damage(v, dmg, src, o && o.ap);
  if (!o) return;
  const big = v.boss || v.giant || v.r > 150;
  if (o.leech && src && !src.dead && src.hp > 0 && src.maxhp) src.hp = Math.min(src.maxhp, src.hp + Math.max(0, hp0 - Math.max(0, v.hp)) * o.leech);
  if (v.dead) return;
  if (o.slow) v.slowT = Math.max(v.slowT || 0, o.slow * (big ? .4 : 1));
  if (o.stun) v.stunT = Math.max(v.stunT || 0, time + o.stun * (big ? .3 : 1));
  if (o.corr) { v.corr = Math.max(v.corr || 0, o.corr); v.corrT = Math.max(v.corrT || 0, time + (o.corrT || 5)); }
  if (o.vuln) { v.vuln = Math.max(v.vuln || 0, o.vuln); v.vulnT = Math.max(v.vulnT || 0, time + (o.vulnT || 5)); }
  if (o.push && !v.static && v.kind !== 'building' && !v.jumping) {
    const px = o.px !== undefined ? o.px : src ? src.x : v.x, py = o.py !== undefined ? o.py : src ? src.y : v.y;
    const a = Math.atan2(v.y - py, v.x - px), k = o.push * clamp(28 / (v.r + 14), .03, 1);
    v.vx += Math.cos(a) * k; v.vy += Math.sin(a) * k;
  }
}
// explosion avec effets : les dégâts et le décor passent par explode(), les effets sont posés ensuite
function blast(x, y, r, dmg, team, src, o) {
  explode(x, y, r, dmg, team, src, o && o.burn, o && o.pull);
  if (o && !NETVIS && (o.slow || o.stun || o.corr || o.vuln || o.push)) {
    const e = Object.assign({}, o, { px: x, py: y }); delete e.leech;
    foesIn(x, y, r, team, v => hurt(v, 0, src, e));
  }
}
// effets d'une arme (champ fx) posés sur tout ce qui est dans la zone d'impact, après l'explosion
function fxArea(x, y, r, team, src, fx) { if (NETVIS || !fx) return; const e = Object.assign({ px: x, py: y }, fx); delete e.leech; delete e.ap; foesIn(x, y, r || 30, team, v => hurt(v, 0, src, e)); }
function healUnit(v, amt) { if (!v || v.dead || v.maxhp <= 0) return; v.hp = Math.min(v.maxhp, v.hp + amt); }
// le tireur et sa portée effective (robots, pilote, ennemis)
const shooterTeam = u => u ? u.team : 0;

// ================= PROJECTILES SUR MESURE =================
// pousse un projectile d'un kind enregistré dans B_KIND ; les champs usuels suivent ceux de shoot()
function projectile(kind, x, y, a, spd, o) {
  const b = Object.assign({ kind, x, y, px: x, py: y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, a, spd, life: 0, dist: 0, team: 0, dmg: 0, range: 600, sc: 1, col: '#ffffff', hits: null, vis: NETVIS }, o);
  bullets.push(b); return b;
}
// déplacement pas à pas d'un projectile : renvoie l'unité touchée, 'wall' (obstacle), 'out' (hors carte) ou null
function stepProjectile(b, dt, hitR) {
  const sp = Math.hypot(b.vx, b.vy), steps = Math.max(1, Math.ceil(sp * dt / 14)), sdt = dt / steps;
  for (let s = 0; s < steps; s++) {
    b.px = b.x; b.py = b.y; b.x += b.vx * sdt; b.y += b.vy * sdt; b.dist += sp * sdt;
    const tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0;
    if (b.x < 0 || b.y < 0 || tx >= WT || ty >= WT) return 'out';
    if (!b.air && W.obs[ty * WT + tx]) return 'wall';
    const cell = cellAt(b.x, b.y);
    if (cell) for (let k = 0; k < cell.length; k++) {
      const v = cell[k]; if (v.team === b.team || v.dead || v.hidden || v.invul || v.etype === 'cible') continue;
      if (b.hits && b.hits.has(v.id)) continue;
      const rr = v.r + (hitR || 3); if (d2(v.x, v.y, b.x, b.y) <= rr * rr) return v;
    }
  }
  return null;
}
// heurte l'obstacle sous le projectile (comme les balles ordinaires)
function projectileWall(b, dmg) { const tx = (b.x / TILE) | 0, ty = (b.y / TILE) | 0; if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) return; const o = W.obs[ty * WT + tx]; if (!o) return; if (o === 8) hitBuildingTile(tx, ty, dmg, b.team, b.src); hitTile(tx, ty, dmg); }

// ================= ZONES =================
// une zone vit dans fires (durée de vie, sauvegarde des contextes d'expédition) et se met à jour par ZONE_K[zk]
// f.vis : zone reproduite pour un autre joueur, qui ne doit infliger aucun dégât ici
function addZone(zk, x, y, r, t, team, src, extra) { const f = Object.assign({ zk, x, y, r, t, max: t, team, src, tick: 0, dps: 0, vis: NETVIS }, extra); fires.push(f); return f; }
// unité temporaire (tourelle déployée, leurre…) : elle disparaît à la fin de la zone invisible qui la porte
ZONE_K._life = { tick(f) { if (f.unit && f.unit.dead) f.t = 0; }, draw() { }, end(f) { if (f.unit && !f.unit.dead) { f.unit.dead = true; boom(f.unit.x, f.unit.y, Math.max(20, f.unit.r * 1.5)); } } };
// unité alliée temporaire de `owner` : o = { r, hp, mounts: [[wid, ox, oy]], life, paint (id dans CH_PAINT), fly, static, decoy, spd }
function deployUnit(owner, x, y, o) {
  if (NETVIS) return null;
  const hp = o.hp || 200, u = baseUnit({ kind: 'minion', team: owner.team, x, y, r: o.r || 14, maxhp: hp, hp, spd: o.spd || 0, fly: !!o.fly, static: o.static !== false, owner, mscale: o.sc || 1, active: true, mpaint: o.paint || null, sight: o.sight || 700, leash: 1e6, eng: o.eng || 400, decoy: !!o.decoy, temp: true });
  u.mounts = (o.mounts || []).map(([wid, ox, oy]) => makeMount(wid, scaledWeapon(wid, { dmg: o.dmgMul || 1, range: 1, spread: 1, turn: 1 }), (ox || 0) * u.r, (oy || 0) * u.r));
  u.engRange = calcEngRange(u); units.push(u);
  addZone('_life', x, y, 0, o.life || 20, owner.team, owner, { unit: u });
  return u;
}

// ================= PERKS DE CHÂSSIS (3.1) =================
// 'regen' et 'cloak' sont appliqués dans robotStats ; les suivants agissent en raid à chaque image
PERK_TICK.aura = (u, dt) => { // répare les alliés proches
  u.auraT = (u.auraT || 0) - dt; if (u.auraT > 0) return; u.auraT = .5;
  const R = u.r * 2.2 + 180;
  alliesIn(u.x, u.y, R, u.team, v => { if (v !== u && v.hp < v.maxhp && v.kind !== 'npc') { healUnit(v, v.maxhp * .008 * .5 * (1 + (u.tier || 1) * .1)); if (Math.random() < .25) parts.push({ type: 'spark', x: v.x + rnd(-v.r, v.r) * .5, y: v.y + rnd(-v.r, v.r) * .5, vx: 0, vy: -40, life: .4, max: .4, size: 2, col: '#6fe3c8' }); } });
};
PERK_TICK.shield = (u, dt) => { // bouclier propre qui se recharge hors combat
  const cap = u.maxhp * .3; u.shieldMax = Math.max(u.shieldMax || 0, cap);
  if (time - (u.lastHurt || -99) > 3) { u.shield = Math.min(cap, (u.shield || 0) + cap * .08 * dt); u.shieldT = time; }
};
PERK_TICK.slowaura = (u, dt) => { // champ qui englue les ennemis proches
  u.auraT = (u.auraT || 0) - dt; if (u.auraT > 0) return; u.auraT = .5;
  foesIn(u.x, u.y, u.r * 1.8 + 200, u.team, v => { v.slowT = Math.max(v.slowT || 0, .7); });
};
