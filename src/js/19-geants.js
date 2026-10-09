// Géants : fabrication de renforts, armes démesurées, zoom étendu.

// ================= DÉMESURE : MÉCANIQUES DES GÉANTS =================
// un géant compte dans le cercle d'extraction dès que sa carcasse le couvre
const zoneReach = u => ZONE_R + (u.r > 150 ? u.r * .9 : u.r * .5);

// ---------- fabrication des renforts (temporaires : démontés à l'extraction) ----------
let fabSeq = 0, fabHouseT = 0;
function fabAutoDesigns(maxT) {
  const chs = CHASSIS_KEYS.filter(k => { const C = CHASSIS[k]; return C.tier <= maxT && !C.fab && chassisUnlocked(k); })
    .sort((a, b) => CHASSIS[b].tier - CHASSIS[a].tier || CHASSIS[b].hp - CHASSIS[a].hp);
  const out = [];
  for (const k of chs.slice(0, 2)) {
    const al = allowedWeapons(k).filter(w => !isSupportW(w) && WEAPONS[w].kind !== 'nuke' && WEAPONS[w].kind !== 'singularity');
    al.sort((a, b) => (WEAPONS[b].size - WEAPONS[a].size) || (wDps(WEAPONS[b]) - wDps(WEAPONS[a])));
    const top = al.slice(0, 3); if (!top.length) top.push('mg');
    out.push({ chassis: k, weapons: MOUNTS[k].map((_, i) => top[i % top.length]), modules: [], brain: 'hunter', name: CHASSIS[k].n, split: true });
  }
  return out.length ? out : [{ chassis: 'crawler', weapons: ['mg'], modules: [], brain: 'hunter', name: 'Rampeur', split: false }];
}
// plans choisis au hangar (robots de 3 rangs en dessous ou moins), sinon les meilleurs modèles débloqués
function fabDesigns(u) {
  const F = u.fabC, sr = save.robots.find(s => s.id === u.sid);
  const plan = (sr && Array.isArray(sr.plan) ? sr.plan : []).map(id => save.robots.find(r => r.id === id))
    .filter(r => r && CHASSIS[r.chassis] && CHASSIS[r.chassis].tier <= F.tier && !CHASSIS[r.chassis].fab);
  if (plan.length) return plan.map(r => ({ chassis: r.chassis, weapons: r.weapons.slice(), modules: (r.modules || []).slice(), brain: r.brain, name: r.name, split: !!r.split }));
  if (!u.fabAuto) u.fabAuto = fabAutoDesigns(F.tier);
  return u.fabAuto;
}
function fabTick(u, dt) {
  const F = u.fabC; if (!F || u.net || u.dead || state === 'base' || state === 'assault' || TUT.on) return;
  u.fabK = (u.fabK || []).filter(v => !v.dead);
  if (u.fabK.length >= F.cap) { u.fabP = 1; return; }
  if (!u.fabDur) { u.fabDur = 7; u.fabT = 7; } // le premier sort vite
  u.fabT -= dt * (u.hp > u.maxhp * .25 ? 1 : .5);
  u.fabP = 1 - Math.max(0, u.fabT) / u.fabDur;
  if (u.fabT > 0) return;
  const L = fabDesigns(u), d = L[(u.fabN || 0) % L.length]; u.fabN = (u.fabN || 0) + 1;
  const C = CHASSIS[d.chassis], a = u.ang + Math.PI, back = u.r * .78 + C.r + 10;
  let x = u.x + Math.cos(a) * back, y = u.y + Math.sin(a) * back;
  if (!C.fly) { const q = findWalkableNear(x, y, 0, 160, 24); if (q) { x = q.x; y = q.y; } }
  x = clamp(x, C.r + 140, WPX - C.r - 140); y = clamp(y, C.r + 140, WPX - C.r - 140);
  const sr = { chassis: d.chassis, weapons: d.weapons.slice(0, MOUNTS[d.chassis].length), modules: d.modules || [], brain: d.brain || 'hunter', hp: 1, xp: 0, kills: 0, traits: [], name: d.name + ' ·' + u.fabN, id: -1, split: d.split };
  while (sr.weapons.length < MOUNTS[d.chassis].length) sr.weapons.push(sr.weapons[0] || 'mg');
  const v = makeRobot(sr, x, y);
  v.sid = -(1000 + (++fabSeq)); v.temp = true; v.fabBy = u; v.ang = a; v.mounts.forEach(m => m.aim = a); v.vx = Math.cos(a) * 80; v.vy = Math.sin(a) * 80;
  if (C.r > 60 && !C.fly) clearTiles((x / TILE) | 0, (y / TILE) | 0, Math.ceil(C.r / TILE));
  units.push(v); fleet.push(v); u.fabK.push(v);
  if (raidStats) raidStats.fab = (raidStats.fab || 0) + 1;
  u.fabDur = u.fabT = F.t * (.45 + .55 * C.tier / F.tier);
  parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life: .7, max: .7, size: C.r * 2.4 + 30, col: '#6fe3c8' }); sparks(x, y, 14, '#6fe3c8');
  SFX.play('build', .7, x, y);
  if (u.fabN === 1 && (u.piloted || isMine(u) || u.team === 0)) msg(u.name + ' : premiers renforts sortis de la chaîne (' + C.n + ').', '#6fe3c8', 4);
}
// les renforts détruits quittent la liste de la flotte
function fabHouse(dt) {
  fabHouseT -= dt; if (fabHouseT > 0) return; fabHouseT = 2;
  if (fleet.some(r => r.temp && r.dead)) fleet = fleet.filter(r => !(r.temp && r.dead));
}

// ---------- singularité : un trou noir qui aspire, puis implose ----------
function singOpen(b) {
  fires.push({ x: b.tx, y: b.ty, r: b.sing.pullR, t: b.sing.vt, max: b.sing.vt, dps: 0, team: b.team, tick: 0, vortex: { dmg: b.dmg, splash: b.splash, src: b.src }, vis: b.vis });
  parts.push({ type: 'ring', x: b.tx, y: b.ty, vx: 0, vy: 0, life: .6, max: .6, size: b.sing.pullR, col: '#b9a0ff', thin: true });
  SFX.play('gravity', 1, b.tx, b.ty, { size: 4 }); addShakeNear(b.tx, b.ty, 8);
}
function singTick(f, dt) {
  const R = f.r, p = 1 - f.t / f.max;
  if (!f.vis) {
    query(f.x - R, f.y - R, f.x + R, f.y + R, v => {
      if (v.team === f.team || v.dead || v.hidden || v.static || v.net || v.kind === 'building' || v.kind === 'beacon' || v.kind === 'beacon2') return;
      const dx = f.x - v.x, dy = f.y - v.y, d = Math.hypot(dx, dy) || 1; if (d > R + v.r) return;
      const pull = (1 - d / (R + v.r)) * (520 + 700 * p) * dt * (v.giant || v.boss ? .12 : v.r > 60 ? .4 : 1);
      const k = Math.min(d * .6, pull) / d; v.x += dx * k; v.y += dy * k;
      if (d < R * .35) damage(v, f.vortex.dmg * .015 * dt, f.vortex.src);
    });
  }
  if (Math.random() < dt * 40) { const a = Math.random() * TAU, rr2 = R * rnd(.6, 1); parts.push({ type: 'spark', x: f.x + Math.cos(a) * rr2, y: f.y + Math.sin(a) * rr2, vx: -Math.cos(a) * rr2 * 1.2 - Math.sin(a) * 260, vy: -Math.sin(a) * rr2 * 1.2 + Math.cos(a) * 260, life: .7, max: .7, size: 3, col: '#c9b2ff' }); }
  if (Math.random() < dt * 8) parts.push({ type: 'debris', x: f.x + rnd(-R, R) * .8, y: f.y + rnd(-R, R) * .8, vx: rnd(-40, 40), vy: rnd(-40, 40), life: .8, max: .8, size: rnd(4, 9), col: '#5a4a7a', rot: 0 });
}
function singCollapse(f) {
  const V = f.vortex;
  if (!f.vis) explode(f.x, f.y, V.splash, V.dmg, f.team, V.src, null, true);
  for (let k = 0; k < 4; k++) parts.push({ type: 'ring', x: f.x, y: f.y, vx: 0, vy: 0, life: .5 + k * .3, max: .5 + k * .3, size: V.splash * (1 + k * .45), col: k ? '#b9a0ff' : '#ffffff' });
  flashT = Math.max(flashT, .5); addShakeNear(f.x, f.y, 24); SFX.play('nuke', .9, f.x, f.y);
}
function drawVortex(c, f) {
  const p = 1 - f.t / f.max, R = f.r, core = R * (.16 + .1 * p);
  const g = c.createRadialGradient(f.x, f.y, core * .6, f.x, f.y, R);
  g.addColorStop(0, 'rgba(20,8,40,.85)'); g.addColorStop(.25, 'rgba(120,80,220,.28)'); g.addColorStop(1, 'rgba(120,80,220,0)');
  c.fillStyle = g; circ(c, f.x, f.y, R); c.fill();
  c.save(); c.translate(f.x, f.y);
  for (let k = 0; k < 3; k++) { c.rotate(time * (1.5 + k) * (k % 2 ? -1 : 1)); c.strokeStyle = `rgba(201,178,255,${.5 - k * .12})`; c.lineWidth = Math.max(3, R * .02); c.beginPath(); c.arc(0, 0, core * (1.6 + k * .7), 0, Math.PI * 1.3); c.stroke(); }
  c.fillStyle = '#05030a'; circ(c, 0, 0, core); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(2, R * .008); circ(c, 0, 0, core); c.stroke();
  c.restore();
}

// ---------- les géants voient loin : les ennemis à portée de leurs armes s'éveillent ----------
const actReach = (r, e, base) => Math.max(base, r.r > 120 ? (r.engRange || 0) * 1.15 : 0) + (r.r > 120 ? r.r : 0) + (e.giant ? e.r : 0);

// ---------- géants ennemis ----------
function spawnGiants() {
  const G = armyPower, RG = REGIONS[regionCur], ri = RG ? RG.tier : 1, dl = LIVE.game ? LIVE.game.diff : save.diff;
  if (G < 20) return;
  const list = [];
  const nCol = Math.min(4, Math.max(1, Math.floor((G - 6) / 16)) + (dl >= 2 ? 1 : 0)); for (let i = 0; i < nCol; i++) list.push('colosse_r');
  if (G >= 30) list.push('devoreur');
  if (G >= 40) list.push('forge_noire');
  if (G >= 50 && ri >= 2) list.push('devoreur');
  if (G >= 56) list.push('leviathan');
  if (G >= 78) list.push('necropole');
  for (const type of list) {
    const R = ENEMIES[type].r; let p = null;
    for (let k = 0; k < 40 && !p; k++) { const q = findWalkableNear(WPX / 2, WPX / 2, 1400, WPX * .42, 20); if (q && d2(q.x, q.y, W.spawn.x, W.spawn.y) > (3000 + R) ** 2 && !(LIVE.game && LIVE.nearSpawn(q.x, q.y, 3000 + R))) p = q; }
    if (!p) continue;
    const x = clamp(p.x, R + 300, WPX - R - 300), y = clamp(p.y, R + 300, WPX - R - 300);
    if (!ENEMIES[type].fly) clearTiles((x / TILE) | 0, (y / TILE) | 0, Math.ceil(R / TILE));
    makeEnemy(type, x, y);
  }
}
// renforts géants pendant l'alerte : la région répond à la démesure de votre armée
function giantWave(p, opts) {
  if (armyPower < 30 || alertLv < 2 || Math.random() > Math.min(.45, (armyPower - 20) / 130)) return;
  const n = units.reduce((s, e) => s + (e.giant && !e.dead ? 1 : 0), 0); if (n >= 6) return;
  const type = armyPower >= 60 && Math.random() < .3 ? 'devoreur' : 'colosse_r';
  makeEnemy(type, p.x + rnd(-80, 80), p.y + rnd(-80, 80), Object.assign({ active: true }, opts));
  msg(ENEMIES[type].n + ' rejoint la traque.', '#ff6b74', 4);
}
function giantExtra(e, dt, t) {
  const E = ENEMIES[e.etype];
  if (E.spawner && t) {
    e.sumT = (e.sumT === undefined ? 6 : e.sumT) - dt;
    if (e.sumT <= 0) {
      e.sumT = E.spawner >= 2 ? 16 : 13;
      const act = units.reduce((s, x) => s + (x.kind === 'enemy' && x.active && !x.dead ? 1 : 0), 0);
      const cols = units.reduce((s, x) => s + (x.etype === 'colosse_r' && !x.dead ? 1 : 0), 0);
      if (act < 220) {
        const pool = E.spawner >= 2 ? ['mastodonte', 'char', 'faucon', 'colosse_r'] : ['char', 'faucon', 'char', 'mastodonte'];
        const n = E.spawner >= 2 ? 3 : 2 + (Math.random() < .5 ? 1 : 0), a0 = e.ang + Math.PI;
        for (let k = 0; k < n; k++) {
          let type = pick(pool); if (type === 'colosse_r' && (cols >= 4 || Math.random() < .6)) type = 'mastodonte';
          const R = ENEMIES[type].r, a = a0 + (k - (n - 1) / 2) * .5, d = e.r * .85 + R + 24;
          const q = findWalkableNear(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 0, 180, 20) || { x: e.x + Math.cos(a) * (e.r + R + 30), y: e.y + Math.sin(a) * (e.r + R + 30) };
          makeEnemy(type, q.x, q.y, { active: true, target: t });
        }
        if (!e.spawnMsg) { e.spawnMsg = true; msg(E.n + ' assemble des renforts !', '#ff6b74', 5); }
        parts.push({ type: 'ring', x: e.x + Math.cos(a0) * e.r * .8, y: e.y + Math.sin(a0) * e.r * .8, vx: 0, vy: 0, life: .8, max: .8, size: 180, col: '#ff6b74' });
        SFX.play('build', .8, e.x, e.y);
      }
    }
  }
  if (e.hp < e.maxhp * .3 && !e.enraged) { e.enraged = true; e.spd *= 1.3; for (const m of e.mounts) if (m.w.rate) m.w.rate *= 1.3; msg(E.n + ' entre en surchauffe !', '#ff6b74', 5); SFX.play('alarm', .8); }
}

// ---------- parking des géants : le long de la base, hors de la zone constructible ----------
// la base est une île entourée de falaises : le géant se taille sa place dans la roche
function giantPark(r) {
  const zx0 = BX0 * TILE, zx1 = BX1 * TILE, zy0 = BY0 * TILE, zy1 = BY1 * TILE, cx = (zx0 + zx1) / 2, cy = (zy0 + zy1) / 2, gap = 90;
  const sides = [['s', cx, zy1 + gap + r], ['e', zx1 + gap + r, cy], ['w', zx0 - gap - r, cy], ['n', cx, zy0 - gap - r]];
  for (let ring = 0; ring < 4; ring++) for (const [sd, x0, y0] of sides) for (let k = 0; k < 9; k++) {
    const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (r * .9 + 70), push = ring * (r * 2 + gap);
    let x = x0, y = y0;
    if (sd === 's') { x += off; y += push; } else if (sd === 'n') { x += off; y -= push; } else if (sd === 'e') { y += off; x += push; } else { y += off; x -= push; }
    if (x < r + 260 || y < r + 260 || x > WPX - r - 260 || y > WPX - r - 260) continue;
    if (parked.some(p => d2(p.x, p.y, x, y) < ((p.r + r) * 1.05 + 50) ** 2)) continue;
    parked.push({ x, y, r }); baseCarve(x, y, r + 110); return { x, y };
  }
  return { x: cx, y: zy1 + gap + r };
}
function baseCarve(x, y, R) {
  if (!W || !W.isBase) return;
  const t0x = Math.max(1, Math.floor((x - R) / TILE)), t1x = Math.min(WT - 2, Math.floor((x + R) / TILE)), t0y = Math.max(1, Math.floor((y - R) / TILE)), t1y = Math.min(WT - 2, Math.floor((y + R) / TILE));
  const ch = new Set();
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
    const dx = tx * TILE + 20 - x, dy = ty * TILE + 20 - y; if (dx * dx + dy * dy > R * R) continue;
    const i = ty * WT + tx; if (W.ground[i] !== 7 && W.obs[i] !== 7) continue;
    W.ground[i] = hash2(tx, ty, 3) > .55 ? 1 : 0; W.obs[i] = hash2(tx, ty, 9) < .12 ? 2 : 0; W.ohp[i] = W.obs[i] ? OBS[2].hp : 0;
    miniSetTile(tx, ty); ch.add(((ty / CHT) | 0) * NCH + ((tx / CHT) | 0));
  }
  for (const k of ch) for (let lv = 0; lv < LOD_N; lv++) chunkCache.delete(k * LOD_N + lv);
}

// ---------- zoom : plus loin quand l'armée compte des géants ----------
function fleetMaxR(L) { let R = 0; for (const r of L) if (!r.dead && r.r > R) R = r.r; return R; }
function minZoom() {
  let R = fleetMaxR(fleet); if (player && player.inside) R = Math.max(R, player.inside.r);
  return R <= 160 ? .55 : clamp(.55 * Math.pow(160 / R, .9), .1, .55);
}
function expMinZ() {
  const cx = EXPV.id ? EXP.cx.get(EXPV.id) : null, R = cx && cx.g ? fleetMaxR(cx.g.fleet || []) : 0;
  return R <= 160 ? .4 : clamp(.4 * Math.pow(160 / R, .9), .085, .4);
}
const pilotZoomMul = r => r <= 145 ? clamp(1.12 - r / 250, .55, 1) : .55 * Math.pow(145 / r, .8);
const zoomFloor = () => Math.max(.07, VW / (WPX * 1.15));
// les pas d'un géant font trembler le sol autour de lui
function giantStep(u) {
  if (u.r <= 200 || u.fly || !player) return;
  const F = focus(), dd = Math.hypot(u.x - F.x, u.y - F.y) - u.r;
  if (dd < 900) addShake(Math.min(4, u.r / 160) * (1 - Math.max(0, dd) / 900));
}

// ---------- rendu par niveaux de détail ----------
// niveaux : 0 pleine résolution, 1 moitié, 2 moitié avec obstacles intégrés, 3 quart, 4 huitième (obstacles intégrés)
const LOD_S = [1, .5, .5, .25, .125], LOD_CAP = [46, 46, 64, 140, 400], LOD_N = 5;
const lodLevel = z => { const zd = z * DPR; return zd >= 1 ? 0 : zd >= .55 ? 1 : zd >= .3 ? 2 : zd >= .15 ? 3 : 4; };
// obstacle détruit : les morceaux de sol en basse résolution (obstacles intégrés) seront redessinés
function lodMark(tx, ty) {
  if (!W) return; navTouch(tx, ty); const D = W.lodDirty || (W.lodDirty = new Set());
  for (const dy of [-1, 1]) for (const dx of [-1, 1]) { const x = clamp(tx + dx, 0, WT - 1), y = clamp(ty + dy, 0, WT - 1); D.add(((y / CHT) | 0) * NCH + ((x / CHT) | 0)); }
}
function bakeObstacles(c, cx, cy) {
  const O = W.obs, x0 = Math.max(0, cx * CHT - 1), x1 = Math.min(WT - 1, cx * CHT + CHT), y0 = Math.max(0, cy * CHT - 1), y1 = Math.min(WT - 1, cy * CHT + CHT);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const o = O[ty * WT + tx]; if (!o || o === 8) continue;
    const v = (tx * 5 + ty * 3) % 3;
    c.drawImage(obsAtlas, v * OC, o * OC, OC, OC, (tx - cx * CHT) * TILE + 20 - OC / 2, (ty - cy * CHT) * TILE + 20 - OC / 2, OC, OC);
  }
}

// ---------- interface : plans de fabrication au hangar ----------
function fabPlanHTML(r) {
  const F = CHASSIS[r.chassis].fab; if (!F) return '';
  const plan = Array.isArray(r.plan) ? r.plan : [], seen = new Set();
  const el = save.robots.filter(b => b !== r && CHASSIS[b.chassis].tier <= F.tier && !CHASSIS[b.chassis].fab).filter(b => { const k = b.chassis + ':' + b.weapons.join(','); if (seen.has(k) && !plan.includes(b.id)) return false; seen.add(k); return true; }).sort((a, b) => CHASSIS[b.chassis].tier - CHASSIS[a.chassis].tier).slice(0, 14);
  return `<div class="acts"><span class="sub" title="En raid, ce géant fabrique des renforts d'après ces plans (trois au plus, fabriqués à tour de rôle). Les renforts se battent et ramassent, puis sont démontés à l'extraction : leur chargement est gardé.">Fabrique · rang ${F.tier} au plus · ${F.cap} à la fois</span>
    <button class="chip ${plan.length ? '' : 'on'}" data-act="rplan" data-rid="${r.id}" data-id="auto" title="Les meilleurs modèles débloqués">Automatique</button>
    ${el.map(b => `<button class="chip ${plan.includes(b.id) ? 'on' : ''}" data-act="rplan" data-rid="${r.id}" data-id="${b.id}" title="${esc(b.weapons.map(w => WEAPONS[w].n).join(', '))}">${esc(b.name)} · ${CHASSIS[b.chassis].n}</button>`).join('')}</div>`;
}
function setFabPlan(R, id) {
  if (!R || !CHASSIS[R.chassis].fab) return;
  if (id === 'auto') R.plan = [];
  else { const n = +id; R.plan = Array.isArray(R.plan) ? R.plan : []; if (R.plan.includes(n)) R.plan = R.plan.filter(x => x !== n); else { R.plan.push(n); if (R.plan.length > 3) R.plan.shift(); } }
  writeSave(); SFX.play('ui', 1); renderHub();
}
// liste d'armes regroupée : « Mur de missiles ×10 »
function wList(ws) {
  const n = new Map(); for (const w of ws) n.set(w, (n.get(w) || 0) + 1);
  return [...n].map(([w, k]) => WEAPONS[w].n + (k > 1 ? ' ×' + k : '')).join(', ');
}
// boutons manuel/auto du hangar : un par affût, ou un par type d'arme sur les géants
function wmChips(r) {
  const wm = r.wm || [];
  if (r.weapons.length <= 6) return r.weapons.map((w, i) => isSupportW(w) ? '' : `<button class="chip ${wm[i] === 'a' ? 'on' : ''}" data-act="rwm" data-rid="${r.id}" data-slot="${i}" title="${esc(WEAPONS[w].n)} · ${W_ROLE_TXT[wRole(WEAPONS[w])]}">${i + 1}. ${esc(WEAPONS[w].n)} · ${wm[i] === 'a' ? 'auto' : 'manuel'}</button>`).join('');
  const g = new Map(); r.weapons.forEach((w, i) => { if (!isSupportW(w)) { if (!g.has(w)) g.set(w, []); g.get(w).push(i); } });
  return [...g].map(([w, L]) => { const na = L.filter(i => wm[i] === 'a').length, st = na === L.length ? 'auto' : na ? 'mixte' : 'manuel';
    return `<button class="chip ${na === L.length ? 'on' : ''}" data-act="rwm" data-rid="${r.id}" data-slot="${L[0]}" data-group="${w}" title="${esc(WEAPONS[w].n)} · ${W_ROLE_TXT[wRole(WEAPONS[w])]} · ${L.length} affûts">${esc(WEAPONS[w].n)}${L.length > 1 ? ' ×' + L.length : ''} · ${st}</button>`; }).join('');
}
