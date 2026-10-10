// Mode assaut : attaque des bases publiées par les autres joueurs.

// ================= MODE ASSAUT =================
let AS = null;
function assaultLoot(hq, pct, stars) { const k = hq * (pct / 100) * (1 + stars * .25); return { scrap: Math.round(90 * k), alloy: Math.round(28 * k), circuits: Math.round(22 * k), data: Math.round(7 * k) }; }
function curBuildings() { return state === 'assault' && AS ? AS.b : save.base.b; }
async function startAssault(id) {
  let tb = NET.bases.find(b => b.id === id); if (!tb) { toast(TL('Base introuvable.')); return; }
  if (attack) { toast(TL('Repoussez d\'abord l\'attaque sur votre base.')); return; }
  if (!save.robots.some(r => r.deploy && CHASSIS[r.chassis].tier < 7)) { toast(save.robots.some(r => r.deploy) ? TL('Les géants sont trop grands pour attaquer une base : déployez aussi des robots de rang 6 ou moins.') : TL('Déployez au moins un robot au hangar.')); return; }
  // le serveur vérifie le bouclier et réserve la base le temps de l'assaut
  try {
    if (NET.kind === 'http') { const r = await api('/api/assault/start', { token: NET.token, target: id }); tb = Object.assign({}, tb, { b: r.b || tb.b, hq: r.hq || tb.hq }); NET.shield = 0; }
    else if (NET.kind === 'claude') { const prev = (await NET.db.collection('attacks').where('target', '==', id).limit(60).get()).docs.map(d => d.data()), sh = claudeShield(prev); if (sh) throw new Error(TL('cette base est sous bouclier encore {time}', { time: hm((sh - Date.now()) / 1000) })); }
  } catch (e) { toast(TL('Assaut impossible : {err}.', { err: e.message })); netPoll(); return; }
  if (state !== 'base') return;
  const cd = JSON.parse(localStorage.getItem('colosse_atk_cd') || '{}'); cd[id] = Date.now() + 20 * 60000; localStorage.setItem('colosse_atk_cd', JSON.stringify(cd));
  leaveBase(); showOverlay('loading', true); $('#loadTxt').textContent = TL('Approche de la base adverse…');
  setTimeout(() => {
    const list = (tb.b || []).map((a, i) => ({ id: 9000 + i, type: BUILD_KEYS[a[0]], tx: a[1], ty: a[2], lvl: a[3], busy: 0, armed: true })).filter(b => BUILD[b.type] && b.tx > BX0 && b.ty > BY0 && b.tx < BX1 && b.ty < BY1);
    diff = DIFFS[1]; regionCur = null;
    units = []; bullets = []; parts = []; items = []; crates = []; beams = []; decals = []; msgs = []; fleet = []; pings = []; fires = []; crews = []; raidContracts = []; MIS = [];
    nextUid = 1; time = 0; raidTime = 0; endT = -1; eProg = 0; eTarget = null; flashT = 0; attack = null; tactical = false; mapOpen = false; paused = false;
    raidStats = { kills: 0, boss: false, byType: {}, archives: 0, pylons: 0, rivalKills: 0, sabotage: 0, lost: 0, deployed: 0 };
    AS = { target: id, hq: tb.hq || 1, b: list, t: 180, total: list.filter(b => b.type !== 'wall' && b.type !== 'mine').length || 1, destroyed: 0, hqDown: false, over: false };
    setRegionPalette(null); genBase(list); chunkCache.clear(); buildMinimap(); FX.clear(); ENV.startBase();
    for (const u of bProxies.values()) u.dead = true; bProxies.clear();
    for (const b of list) syncProxy(b, 1);
    const sp = findWalkableNear(150 * TILE, (BY1 + 4) * TILE, 0, 160, 60) || { x: 150 * TILE, y: (BY1 + 4) * TILE };
    player = makePlayer(sp.x, sp.y); units.push(player);
    save.robots.filter(r => r.deploy && CHASSIS[r.chassis].tier < 7).forEach((sr, i) => { const a = i * 2.39996, rad = 60 + CHASSIS[sr.chassis].r + Math.sqrt(i) * 46; const p = findWalkableNear(sp.x + Math.cos(a) * rad, sp.y + Math.abs(Math.sin(a)) * rad * .5 + 40, 0, 120, 30) || sp; const u = makeRobot(sr, p.x, p.y); u.brain = u.brain === 'gatherer' ? 'hunter' : u.brain; units.push(u); fleet.push(u); });
    raidStats.deployed = fleet.length;
    B = { state: 'none', unit: null, charge: 0, pulseT: 99, windowT: 0, cd: 0 };
    reveal(150 * TILE, 150 * TILE, 2200);
    { const R = fleetMaxR(fleet); if (R > 160) cam.userZoom = Math.min(cam.userZoom, Math.max(minZoom(), .55 * Math.pow(160 / R, .55))); }
    cam.x = player.x; cam.y = player.y; cam.zoom = cam.userZoom;
    state = 'assault'; showScreen(null); showOverlay('loading', false);
    msg(TL('Assaut sur la base de {name} : 3 minutes. Détruisez le QG et un maximum de bâtiments.', { name: netName(id) }), COL.rival, 8);
    msg(TL('Échap puis « Abandonner » pour vous retirer avec les étoiles acquises.'), '#a59c88', 8);
    if (save.robots.some(r => r.deploy && CHASSIS[r.chassis].tier >= 7)) msg(TL('Vos géants restent à la base : ils sont trop grands pour un assaut.'), '#a59c88', 7);
  }, 40);
}
function assaultStars() { if (!AS) return 0; const pct = AS.destroyed / AS.total * 100; return (pct >= 50 ? 1 : 0) + (AS.hqDown ? 1 : 0) + (pct >= 99.9 ? 1 : 0); }
function assaultTick(dt) {
  if (!AS || AS.over) return;
  AS.t -= dt; turretAI(dt); shieldGens(dt);
  for (const b of AS.b) {
    if (!BUILD[b.type].mine || !b.armed) continue;
    const x = (b.tx + .5) * TILE, y = (b.ty + .5) * TILE; let hit = false;
    query(x - 40, y - 40, x + 40, y + 40, v => { if (v.team === 0 && !v.dead && !v.fly && !v.hidden && d2(v.x, v.y, x, y) < (v.r + 22) ** 2) { hit = true; return true; } });
    if (hit) { b.armed = false; explode(x, y, 105, 170 * (1 + .45 * (b.lvl - 1)), 1, null); }
  }
  if (AS.t <= 0 || AS.destroyed >= AS.total) endAssault();
}
function assaultBuildingDown(b) { if (!AS) return; if (b.type !== 'wall' && b.type !== 'mine') AS.destroyed++; if (b.type === 'hq') { AS.hqDown = true; msg(TL('QG adverse détruit !'), '#f2c14e', 4); } }
function endAssault() {
  if (!AS || AS.over) return; AS.over = true;
  const pct = Math.round(AS.destroyed / AS.total * 100), stars = assaultStars(), base = assaultLoot(AS.hq, pct, stars), salvage = {};
  for (const k in base) { salvage[k] = Math.round(base[k] * .35); save.res[k] += salvage[k]; } // récupération sur les carcasses
  if (stars >= 1) save.stats.assaults = (save.stats.assaults || 0) + 1;
  const ko = [];
  for (const r of fleet) { const sr = save.robots.find(s => s.id === r.sid); if (!sr) continue; if (r.dead) { syncRobotSave(r, false); sr.hp = .15; ko.push(sr.name); } else syncRobotSave(r, true); }
  writeSave();
  const tgt = AS.target, rows = (o, sign) => RES_KEYS.filter(k => o[k]).map(k => `<div><span>${RES[k].n}</span><b class="good">${sign}${fmt(o[k])}</b></div>`).join('');
  state = 'result'; tactical = false; mapOpen = false; SFX.play(stars >= 1 ? 'success' : 'fail', 1);
  $('#resultBox').innerHTML = `<h3>${stars ? TL('Assaut réussi') : TL('Assaut repoussé')}</h3>
    <p>${TL('Base de {name}', { name: esc(netName(tgt)) })} · ${TL('{n} % de destruction', { n: pct })} · ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
    <div class="slot-h">${TL('Pillé dans ses stocks')}</div><div class="res-list" id="stolenRows"><div><span>${stars ? TL('Calcul du butin…') : TL('Aucune étoile : rien n\'est volé.')}</span><b>—</b></div></div>
    <div class="slot-h">${TL('Récupéré sur les carcasses')}</div><div class="res-list">${rows(salvage, '+') || `<div><span>${TL('Rien')}</span><b>—</b></div>`}</div>
    ${ko.length ? `<p class="lost">${TL('Robots hors service, réparés en urgence : {list}', { list: ko.map(esc).join(', ') })}</p>` : ''}
    <div class="btns"><button class="btn hot" data-act="tohub">${TL('Retour à la base')}</button></div>`;
  showOverlay('result', true);
  netAttack(tgt, stars, pct).then(loot => {
    for (const k in loot) if (STEAL_KEYS.includes(k)) save.res[k] = (save.res[k] || 0) + (loot[k] | 0);
    if (Object.keys(loot).length) writeSave();
    const el = $('#stolenRows'); if (el) el.innerHTML = rows(loot, '+') || `<div><span>${stars ? TL('Ses stocks étaient protégés par son entrepôt ou son bouclier.') : TL('Aucune étoile : rien n\'est volé.')}</span><b>—</b></div>`;
  });
}
function drawAssaultPanel(c) {
  panel(c, 14, 14, 300, 62); c.textAlign = 'left';
  c.fillStyle = COL.rival; c.font = `700 14px ${FONT}`; c.fillText(TL('Assaut') + ' · ' + netName(AS.target), 24, 33);
  c.textAlign = 'right'; c.fillStyle = AS.t < 30 ? COL.enemy2 : '#e8dcc4'; c.fillText(mmss(AS.t + .99), 304, 33); c.textAlign = 'left';
  const st = assaultStars(); c.font = `700 15px ${FONT}`; c.fillStyle = '#f2c14e'; c.fillText('★'.repeat(st) + '☆'.repeat(3 - st), 24, 58);
  c.font = `500 12.5px ${FONT}`; c.fillStyle = '#e8dcc4'; c.fillText(TL('{n} % détruit', { n: Math.round(AS.destroyed / AS.total * 100) }) + (AS.hqDown ? ' · ' + TL('QG à terre') : ''), 100, 58);
}
