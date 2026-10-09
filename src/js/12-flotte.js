// Flotte : actions différées, vétérans, capacités actives, formations et patrouilles.

// ================= ACTIONS DIFFÉRÉES =================
let deferred = [];
function runDeferred() { if (!deferred.length) return; const d = deferred; deferred = []; for (const f of d) f(); }

// ================= VÉTÉRANS =================
function syncRobotSave(u, withHp) {
  const sr = save.robots.find(s => s.id === u.sid); if (!sr) return;
  sr.xp = Math.round(u.xp || 0); sr.kills = u.kills || 0; sr.traits = (u.traits || []).slice();
  if (withHp) sr.hp = clamp(u.hp / u.maxhp, .05, 1);
}
function creditKill(e, src) {
  if (e.etype === 'cible') return; const E = ENEMIES[e.etype];
  const r = src && src.kind === 'minion' ? src.owner : src, xp = Math.max(1, (E ? E.hp : e.maxhp) / 10);
  if (r && r.kind === 'robot' && !r.dead) { r.kills = (r.kills || 0) + 1; giveXP(r, xp); }
  for (const v of fleet) if (v !== r && !v.dead && d2(v.x, v.y, e.x, e.y) < 600 * 600) giveXP(v, xp * .25);
}
function giveXP(r, x) { r.xp = (r.xp || 0) + x; const nr = rankOf(r.chassis, r.xp); if (nr > (r.rank || 0)) rankUp(r, nr); }
function rankUp(r, nr) {
  const old = r.rank || 0; let tr = null;
  for (let k = old + 1; k <= nr; k++) if (k === 2 || k === 4) { const av = TRAIT_KEYS.filter(t => !r.traits.includes(t)); if (av.length) { tr = pick(av); r.traits.push(tr); } }
  r.rank = nr; refreshRobot(r); r.hp = Math.min(r.maxhp, r.hp + r.maxhp * .25);
  msg(r.name + ' passe ' + RANKS[nr] + (tr ? ' · trait : ' + TRAITS[tr].n : '') + ' !', '#f2c14e', 6, tr ? null : { key: 'rang:' + nr, name: r.name, fmt: L => listFr(L) + (L.length > 1 ? ' passent ' : ' passe ') + RANKS[nr] + ' !' });
  parts.push({ type: 'ring', x: r.x, y: r.y, vx: 0, vy: 0, life: .7, max: .7, size: r.r * 2.5 + 20, col: '#f2c14e' });
  sparks(r.x, r.y, 12, '#f2c14e'); SFX.play('rankup', .9);
  syncRobotSave(r, false);
}

// ================= CAPACITÉS ACTIVES =================
function abilitiesTick(dt) {
  for (const u of fleet) {
    if (u.dead) continue;
    if (u.abil) for (const a of u.abil) if (a.cd > 0) a.cd -= dt;
    if (u.overT > 0) { u.overT -= dt; u.rateMul = 1.8; if (u.overT <= 0) u.rateMul = 1; }
    if (u.regen && time - u.lastHurt > 4 && u.hp < u.maxhp) u.hp = Math.min(u.maxhp, u.hp + u.maxhp * u.regen * dt);
  }
}
function useAbility(u, a, aimX, aimY) {
  if (!a || a.cd > 0 || u.dead) return false;
  const M = MODULES[a.id];
  switch (a.id) {
    case 'overcharge': u.overT = M.dur; u.rateMul = 1.8; parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .5, max: .5, size: u.r * 2 + 10, col: '#ff8a3d' }); break;
    case 'emshield': { const v = u.maxhp * .45; u.shieldMax = Math.max(u.shieldMax || 0, v); u.shield = Math.max(u.shield || 0, v); u.shieldT = time + 6; parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .5, max: .5, size: u.r * 1.6 + 10, col: '#7fc8ff' }); break; }
    case 'jump': {
      const t = u.target && !u.target.dead ? u.target : null; let tx, ty;
      if (aimX !== undefined) { tx = aimX; ty = aimY; } else if (u.order && u.order.type === 'move') { tx = u.order.x; ty = u.order.y; } else if (t) { tx = t.x; ty = t.y; } else { tx = u.x + Math.cos(u.ang) * 300; ty = u.y + Math.sin(u.ang) * 300; }
      const dd = Math.hypot(tx - u.x, ty - u.y), L = Math.min(dd - (t && aimX === undefined ? t.r + u.r + 20 : 0), 260 + u.r * 2);
      if (L < 60) return false;
      const ang = Math.atan2(ty - u.y, tx - u.x); let ex = u.x + Math.cos(ang) * L, ey = u.y + Math.sin(ang) * L;
      if (!u.fly) { const p = findWalkableNear(ex, ey, 0, 70, 24); if (p) { ex = p.x; ey = p.y; } }
      u.jump = { x0: u.x, y0: u.y, x1: ex, y1: ey, t: 0, T: .5 + L / 1600 }; u.jumping = true; break;
    }
  }
  a.cd = M.cd; SFX.play('board', .6, u.x, u.y); return true;
}
function jumpTick(u, dt) {
  const j = u.jump; j.t += dt; const k = Math.min(1, j.t / j.T);
  u.x = lerp(j.x0, j.x1, k); u.y = lerp(j.y0, j.y1, k); u.jz = Math.sin(k * Math.PI); u.vx = u.vy = 0; u.ang = Math.atan2(j.y1 - j.y0, j.x1 - j.x0);
  if (Math.random() < .6) parts.push({ type: 'smoke', x: u.x, y: u.y, vx: rnd(-20, 20), vy: rnd(-20, 20), life: .6, max: .6, size: u.r * .5, col: '' });
  if (k >= 1) {
    u.jump = null; u.jumping = false; u.jz = 0; collideTiles(u);
    const x = u.x, y = u.y, r = u.r, tm = u.team;
    deferred.push(() => explode(x, y, 70 + r * 1.6, 40 + r * 2.5, tm, u)); addShakeNear(x, y, 4 + r / 20);
  }
}
function autoAbilities(u, tgt) {
  if (!u.abil || !u.abil.length || u.piloted || u.jump) return;
  for (const a of u.abil) {
    if (a.cd > 0) continue;
    if (a.id === 'overcharge' && tgt && d2(u.x, u.y, tgt.x, tgt.y) < (u.engRange * 1.1) ** 2) useAbility(u, a);
    else if (a.id === 'emshield' && u.hp < u.maxhp * .5 && time - u.lastHurt < 1) useAbility(u, a);
    else if (a.id === 'jump' && tgt && !(u.order && u.order.type === 'hold')) { const d = Math.hypot(tgt.x - u.x, tgt.y - u.y); if (d > u.engRange * 1.15 && d < 900) useAbility(u, a); }
  }
}
function useSelectedAbilities() {
  let n = 0;
  if (player.inside) { for (const a of player.inside.abil || []) if (useAbility(player.inside, a, mouse.wx, mouse.wy)) n++; }
  else { const sel = selection(); for (const u of sel) for (const a of u.abil || []) if (useAbility(u, a)) n++; }
  if (!n) { msg('Aucune capacité prête dans la sélection (modules Surcharge, Bouclier d\'urgence, Saut).', '#a59c88', 3); SFX.play('deny', .6); }
}

// ================= FORMATIONS, POINTS DE PASSAGE, PATROUILLES =================
function nextWaypoint(u) {
  const o = u.order;
  if (u.queue && u.queue.length) { const n = u.queue.shift(); if (u.patrol) u.queue.push({ x: o.x, y: o.y }); u.order = { type: 'move', x: n.x, y: n.y }; }
  else u.order = { type: 'hold', x: o.x, y: o.y };
}
function issueOrderAt(wx, wy, queue) {
  const sel = selection(); if (!sel.length) return;
  let enemy = null;
  query(wx - 40, wy - 40, wx + 40, wy + 40, v => { if (v.team !== 0 && !v.dead && !v.hidden && d2(v.x, v.y, wx, wy) < (v.r + 24) ** 2) { enemy = v; return true; } });
  if (enemy) { for (const r of sel) { r.order = { type: 'attack', t: enemy }; r.queue = []; r.patrol = false; } pings.push({ x: enemy.x, y: enemy.y, t: .7, col: '#ff4d5e', r: enemy.r + 10 }); SFX.play('ui', 1); return; }
  let cx = 0, cy = 0, rs = 0; for (const r of sel) { cx += r.x; cy += r.y; rs += r.r; } cx /= sel.length; cy /= sel.length;
  const ang = Math.atan2(wy - cy, wx - cx), ca = Math.cos(ang), sa = Math.sin(ang), sp = Math.max(48, rs / sel.length * 2.4);
  const slots = formationSlots(sel.length, formation, sp, false);
  let us = sel.slice(), sl = slots.slice();
  if (formation === 'free' || formation === 'circle') us.sort((a, b) => b.r - a.r);
  else { const lat = u => -(u.x - cx) * sa + (u.y - cy) * ca; us.sort((a, b) => lat(a) - lat(b)); sl.sort((a, b) => a[1] - b[1] || b[0] - a[0]); }
  us.forEach((r, i) => {
    const [f, s] = sl[i]; const x = wx + ca * f - sa * s, y = wy + sa * f + ca * s;
    if (!r.queue) r.queue = [];
    if (queue && r.order && r.order.type === 'move') r.queue.push({ x, y });
    else { r.from = { x: r.x, y: r.y }; r.order = { type: 'move', x, y }; if (!queue) { r.queue = []; r.patrol = false; } }
  });
  pings.push({ x: wx, y: wy, t: .7, col: queue ? '#f2c14e' : '#6fe3c8', r: 20 }); SFX.play('ui', 1);
}
function togglePatrol() {
  const sel = selection(); let on = 0, off = 0;
  for (const r of sel) {
    if (r.patrol) { r.patrol = false; r.queue = []; off++; continue; }
    const o = r.order; if (!o || (o.type !== 'move' && o.type !== 'hold') || !r.from || Math.hypot(r.from.x - o.x, r.from.y - o.y) < 60) continue;
    if (o.type === 'hold') { r.order = { type: 'move', x: r.from.x, y: r.from.y }; r.queue = [{ x: o.x, y: o.y }]; }
    else r.queue.push({ x: r.from.x, y: r.from.y });
    r.patrol = true; on++;
  }
  if (on) msg('Patrouille : ' + on + ' robot' + (on > 1 ? 's font' : ' fait') + ' des allers-retours.', '#6fe3c8', 3);
  else if (off) msg('Patrouille arrêtée.', '#a59c88', 3);
  else msg('Envoyez d\'abord la sélection quelque part (clic droit, Maj+clic droit pour enchaîner), puis P.', '#a59c88', 4);
  SFX.play('ui', 1);
}
function cycleFormation() { formation = FORM_KEYS[(FORM_KEYS.indexOf(formation) + 1) % FORM_KEYS.length]; msg('Formation : ' + FORMATIONS[formation] + '.', '#6fe3c8', 3); SFX.play('ui', 1); }
