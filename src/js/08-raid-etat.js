// État d'une partie : unités, hachage spatial, terrain et collisions.

// ================= ÉTAT DU RAID =================
let state = 'title';
let paused = false, tactical = false, mapOpen = false;
let units = [], bullets = [], parts = [], items = [], crates = [], beams = [], decals = [], msgs = [], fleet = [], pings = [], fires = [];
let player = null, diff = DIFFS[1], raidTime = 0, alertLv = 0, time = 0, frameDt = 0;
let B = null, spawnT = 0, actT = 0, fogT = 0, toxT = 0, nextUid = 1, endT = -1, endSuccess = false, endExtracted = null;
let raidStats = null, regionCur = null;
const cam = { x: 0, y: 0, zoom: 1.15, userZoom: 1.15, shake: 0 };
const mouse = { x: 0, y: 0, l: false, r: false, wx: 0, wy: 0, drag: null };
const keys = {};
let eProg = 0, eTarget = null;
let EXPSIM = null; // expédition dont le monde est chargé en ce moment (null : votre partie)
const EXPV = { id: null, x: 0, y: 0, z: .85, uz: .85, follow: null, free: false, drag: null, btns: [], kp: {}, tf: new Map(), pinch: null, armT: 0 }; // vue d'observation

function msg(text, col = '#e8dcc4', life = 5, grp) {
  if (EXPSIM) expMsgHook(text, col);
  // messages du même genre arrivés presque ensemble : une seule ligne (« A, B et C passent Confirmé ! »)
  if (grp) { const m = msgs.find(m => m.key === grp.key && m.max - m.t < 2.5); if (m) { m.names.push(grp.name); m.text = grp.fmt(m.names); m.t = m.max = life; return; } }
  msgs.push({ text, col, t: life, max: life, key: grp && grp.key, names: grp ? [grp.name] : null }); if (msgs.length > 7) msgs.shift();
}
const listFr = a => tlList(a); // liste « a, b et c » dans la langue du joueur
function focus() { return player.inside || player; }
function addShake(v) { cam.shake = Math.min(28, cam.shake + v); }

function baseUnit(o) {
  return Object.assign({
    id: nextUid++, x: 0, y: 0, vx: 0, vy: 0, ang: 0, r: 12, hp: 100, maxhp: 100, armor: 0, spd: 100, fly: false, crush: 0, team: 0, kind: 'robot',
    mounts: [], target: null, tt: Math.random() * .3, dead: false, hitFlash: 0, t: Math.random() * 10, mv: 0, cargo: {}, cargoW: 0, cargoMax: 0,
    active: true, hidden: false, chkT: 0, lx: 0, ly: 0, sideT: 0, sideDir: 1, _q: 0, sel: false, group: 0, order: null, engRange: 300, mscale: 1,
    strafe: Math.random() < .5 ? 1 : -1, wantMove: false, static: false
  }, o);
}
function makeMount(wid, def, ox, oy) { return { wid, w: def, ox, oy, aim: 0, cd: Math.random() * .6, recoil: 0, rt: 0, tgt: null, spin: 0, spinA: 0, chg: 0, drones: [] }; }
function calcEngRange(u) {
  let r = 0, ra = 0;
  for (const m of u.mounts) {
    const w = m.w; if (w.kind === 'repair' || w.kind === 'shield' || w.kind === 'bay') continue;
    const v = w.kind === 'melee' ? u.r + 30 * u.mscale : Math.min(w.range, u.r > 120 ? 2600 : 1300) * .85;
    if (ARTILLERY[w.kind] || w.big) ra = Math.max(ra, v * .8); else r = Math.max(r, v);
  }
  return r || ra || 300;
}
function makeRobot(sr, x, y) {
  const ch = CHASSIS[sr.chassis], st = robotStats(sr);
  const u = baseUnit({ kind: 'robot', team: 0, x, y, r: ch.r, maxhp: st.hp, hp: Math.max(1, st.hp * sr.hp), armor: st.armor, spd: st.spd, fly: !!ch.fly, crush: ch.crush || 0, cargoMax: st.cargo, chassis: sr.chassis, brain: sr.brain, name: sr.name, sid: sr.id, tier: ch.tier, group: sr.group || 0, mscale: MSCALE[sr.chassis], piloted: false, sightMul: st.sight,
    xp: sr.xp || 0, kills: sr.kills || 0, traits: (sr.traits || []).slice(), modules: (sr.modules || []).slice(), rank: st.rank, regen: st.regen, dodge: st.dodge, cloak: st.cloak, selfBoom: st.boom, rateMul: 1, overT: 0, queue: [], patrol: false, lastHurt: -99, lastFire: -99 });
  u.abil = u.modules.filter(m => MODULES[m] && MODULES[m].active).map(m => ({ id: m, cd: 2 }));
  if (ch.perk === 'leap' && !u.abil.some(a => a.id === 'jump')) u.abil.push({ id: 'jump', cd: 2 });
  u.fortify = ch.perk === 'fortify'; u.spikes = ch.perk === 'spikes'; u.fabC = ch.fab || null;
  const fit = fitLoadout(sr.chassis, sr.weapons);
  u.wm = Array.isArray(sr.wm) && !fit.moved ? sr.wm.slice() : null; u.split = !!sr.split;
  u.mounts = fit.weapons.map((w, i) => { const m = MOUNTS[sr.chassis][i], mm = makeMount(w, scaledWeapon(w, st), m[0] * ch.r, m[1] * ch.r); mm.slot = slotSize(sr.chassis, i); mm.ds = mountScale(sr.chassis, i, w); mm.main = mm.slot >= ch.wsize; return mm; });
  u.engRange = calcEngRange(u); u.ang = Math.random() * TAU; u.mounts.forEach(m => m.aim = u.ang);
  return u;
}
function refreshRobot(u) {
  const st = robotStats({ chassis: u.chassis, xp: u.xp, modules: u.modules, traits: u.traits }), f = u.hp / u.maxhp;
  u.maxhp = st.hp; u.hp = st.hp * f; u.armor = st.armor; u.spd = st.spd; u.cargoMax = st.cargo; u.sightMul = st.sight; u.rank = st.rank;
  u.regen = st.regen; u.dodge = st.dodge; u.cloak = st.cloak; u.selfBoom = st.boom;
  for (const m of u.mounts) m.w = scaledWeapon(m.wid, st);
  u.engRange = calcEngRange(u);
}
function makeEnemy(type, x, y, opts) {
  const E = ENEMIES[type];
  const u = baseUnit({ kind: 'enemy', team: 1, etype: type, x, y, r: E.r, maxhp: E.hp * diff.hp, hp: E.hp * diff.hp, armor: E.armor || 0, spd: E.spd * (type === 'souverain' ? 1 : rnd(.92, 1.08)), fly: !!E.fly, crush: E.crush || 0, sight: E.sight, static: !!E.static, boss: !!E.boss, elite: !!E.elite, giant: !!E.giant, human: !!E.human, home: { x, y }, active: false, mscale: E.mscale || 1, spikes: type === 'mastodonte', cloak: !!E.cloak, suicide: E.suicide || null, support: !!E.support });
  const rdm = W && !W.isBase && REGIONS[regionCur] && REGIONS[regionCur].tier <= 1 && !E.boss ? .85 : 1; // première région : tirs ennemis un peu moins durs
  u.mounts = E.ws.map(([wid, ox, oy]) => { const def = Object.assign({}, WEAPONS[wid]); def.dmg = (def.dmg || 0) * diff.dmg * rdm; return makeMount(wid, def, ox * E.r, oy * E.r); });
  u.engRange = calcEngRange(u); u.ang = Math.random() * TAU; u.mounts.forEach(m => m.aim = u.ang);
  if (opts) Object.assign(u, opts);
  units.push(u); return u;
}
function makePlayer(x, y) {
  const pw = PWEAPONS[save.pweapon] || PWEAPONS.pistol;
  return baseUnit({ kind: 'player', team: 0, x, y, r: 11, maxhp: playerMaxHp(), hp: playerMaxHp(), spd: 210, cargoMax: playerCap(), pw, ammo: pw.mag, cd: 0, reloadT: 0, dashT: 0, dashCd: 0, inv: 0, lastHurt: -99, inside: null, mscale: 1 });
}

// ================= HACHAGE SPATIAL =================
const HC = 128, HW = Math.ceil(WPX / HC);
let hgrid = new Map(), qstamp = 0;
function hashBuild() {
  for (const a of hgrid.values()) a.length = 0;
  for (const u of units) {
    if (u.dead || !u.active || u.hidden) continue;
    const x0 = Math.max(0, ((u.x - u.r) / HC) | 0), x1 = Math.min(HW - 1, ((u.x + u.r) / HC) | 0);
    const y0 = Math.max(0, ((u.y - u.r) / HC) | 0), y1 = Math.min(HW - 1, ((u.y + u.r) / HC) | 0);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const k = cy * HW + cx; let a = hgrid.get(k); if (!a) { a = []; hgrid.set(k, a); } a.push(u); }
  }
}
function query(x0, y0, x1, y1, fn) {
  qstamp++; const s = qstamp;
  const cx0 = Math.max(0, (x0 / HC) | 0), cx1 = Math.min(HW - 1, (x1 / HC) | 0), cy0 = Math.max(0, (y0 / HC) | 0), cy1 = Math.min(HW - 1, (y1 / HC) | 0);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const a = hgrid.get(cy * HW + cx); if (!a) continue;
    for (let i = 0; i < a.length; i++) { const u = a[i]; if (u._q === s) continue; u._q = s; if (fn(u) === true) return; }
  }
}
function cellAt(x, y) { if (x < 0 || y < 0) return null; return hgrid.get(((y / HC) | 0) * HW + ((x / HC) | 0)); }
function findTarget(u, range, weakest) {
  let best = null, bs = Infinity; const r2 = range * range;
  query(u.x - range, u.y - range, u.x + range, u.y + range, v => {
    if (v.team === u.team || v.dead || v.hidden || v.etype === 'cible' || v.invul) return;
    const dd = d2(u.x, u.y, v.x, v.y); if (dd > r2 + v.r * v.r * 2) return;
    if (v.cloak && time - v.lastFire > 1.5 && dd > r2 * .16) return;
    const sc = weakest ? (v.hp / v.maxhp) * 4e6 + dd : dd - (v.kind === 'beacon' ? 0 : 0);
    if (sc < bs) { bs = sc; best = v; }
  });
  return best;
}

// ================= TERRAIN & COLLISIONS =================
function terrainMul(u) { if (u.fly || u.crush >= 3) return 1; const i = tileAt(u.x, u.y); return (i >= 0 && W.ground[i] === 3) ? .55 : 1; }
function collideTiles(u) {
  const r = u.r;
  if (u.fly) { u.x = clamp(u.x, TILE * 3, WPX - TILE * 3); u.y = clamp(u.y, TILE * 3, WPX - TILE * 3); return; }
  const tx0 = Math.floor((u.x - r) / TILE), tx1 = Math.floor((u.x + r) / TILE), ty0 = Math.floor((u.y - r) / TILE), ty1 = Math.floor((u.y + r) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) continue;
    const i = ty * WT + tx, o = W.obs[i]; if (!o) continue;
    const rx = tx * TILE, ry = ty * TILE, nx = clamp(u.x, rx, rx + TILE), ny = clamp(u.y, ry, ry + TILE);
    const dx = u.x - nx, dy = u.y - ny, dd = dx * dx + dy * dy;
    if (dd >= r * r) continue;
    if (u.crush >= OBS[o].lv) { destroyTile(tx, ty, o, u); u.vx *= .93; u.vy *= .93; continue; }
    if (dd > 1e-6) { const d = Math.sqrt(dd), p = (r - d) / d; u.x += dx * p; u.y += dy * p; }
    else { const ax = u.x - (rx + TILE / 2), ay = u.y - (ry + TILE / 2); if (Math.abs(ax) > Math.abs(ay)) u.x = ax > 0 ? rx + TILE + r : rx - r; else u.y = ay > 0 ? ry + TILE + r : ry - r; }
  }
  u.x = clamp(u.x, r, WPX - r); u.y = clamp(u.y, r, WPX - r);
}
function hitTile(tx, ty, dmg) {
  if (NETVIS || tx < 0 || ty < 0 || tx >= WT || ty >= WT) return false;
  const i = ty * WT + tx, o = W.obs[i]; if (!o || o >= 7) return false;
  W.ohp[i] -= dmg; if (W.ohp[i] <= 0) { destroyTile(tx, ty, o, null); return true; } return false;
}
function destroyTile(tx, ty, o, crusher) {
  if (NETVIS) return;
  const i = ty * WT + tx; W.obs[i] = 0; W.ohp[i] = 0; miniSetTile(tx, ty);
  if (LIVE.game) LIVE.tileGone(tx, ty);
  const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2, D = OBS[o];
  const n = crusher && crusher.r > 80 ? 3 : 7;
  for (let k = 0; k < n; k++) parts.push({ type: 'debris', x: x + rnd(-14, 14), y: y + rnd(-14, 14), vx: rnd(-90, 90), vy: rnd(-90, 90), life: rnd(.4, .9), max: .9, size: rnd(2, 5), col: D.mm, rot: rnd(0, 6) });
  if (o !== 1 || Math.random() < .3) parts.push({ type: 'smoke', x, y, vx: rnd(-10, 10), vy: rnd(-20, -5), life: 1.2, max: 1.2, size: 14, col: 'rgba(120,110,95,' });
  if (D.drop) dropTable(D.drop, x, y, crusher ? .7 : 1);
  scarRubble(tx, ty, o, o === 1 && fires.some(f => !f.vortex && d2(f.x, f.y, x, y) < (f.r + 20) ** 2));
  if (o === 3 || o === 6 || o === 2 || o === 5) { SFX.play('crush', crusher ? .5 : .35, x, y); if (crusher && crusher.r > 50) addShake(.6); }
}
