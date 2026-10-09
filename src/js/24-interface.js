// Interface : écrans, console de commandement (forge, hangar, recherche, construction, raids), découverte progressive.

// ================= ÉCRANS =================
function showScreen(id) { for (const s of ['title', 'hub']) $('#' + s).classList.toggle('on', s === id); }
function showOverlay(id, on) { $('#' + id).classList.toggle('on', on); }
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), Math.max(2600, Math.min(7000, t.length * 55))); }
// ---------- confirmation dans le jeu (au lieu de confirm(), bloqué par certains navigateurs intégrés) ----------
let askDone = null;
function askConfirm(o) {
  if (typeof o === 'string') o = { x: o };
  if (askDone) askDone(false);
  $('#askBox').innerHTML = `<h3 id="askT">${esc(o.t || 'Confirmer')}</h3><p>${o.html || esc(o.x || '')}</p>
    <div class="btns"><button class="btn ${o.danger ? 'danger' : 'hot'}" data-act="askok">${esc(o.ok || 'Confirmer')}</button>${o.no === false ? '' : `<button class="btn" data-act="askno">${esc(o.no || 'Annuler')}</button>`}</div>`;
  showOverlay('askDlg', true); SFX.play('ui', .8);
  setTimeout(() => { const b = document.querySelector('[data-act=askno]') || document.querySelector('[data-act=askok]'); if (b) b.focus(); }, 30);
  return new Promise(res => { askDone = v => { askDone = null; showOverlay('askDlg', false); res(v); }; });
}
document.addEventListener('click', e => { const el = e.target.closest('[data-act=askok],[data-act=askno]'); if (el && askDone) { e.stopPropagation(); askDone(el.dataset.act === 'askok'); } }, true);
window.addEventListener('keydown', e => { if (!askDone) return; if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); askDone(false); } else if (e.code === 'Enter' && !(e.target && e.target.dataset && e.target.dataset.act === 'askno')) { e.preventDefault(); e.stopImmediatePropagation(); askDone(true); } else e.stopImmediatePropagation(); }, true);

// ---------- titre ----------
const tcv = $('#titleCv'), tctx = tcv.getContext('2d');
const titleScene = { crawlers: Array.from({ length: 14 }, (_, i) => ({ x: rnd(-200, 200), y: rnd(-200, 200), a: rnd(0, 6), ch: ['drone', 'ant', 'ant', 'sentry', 'crawler', 'gunship', 'ant', 'scout'][i % 8] })) };
function drawTitle(t) {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1), w = tcv.clientWidth, h = tcv.clientHeight;
  if (tcv.width !== Math.round(w * dpr) || tcv.height !== Math.round(h * dpr)) { tcv.width = Math.round(w * dpr); tcv.height = Math.round(h * dpr); }
  const c = tctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sc = Math.max(.6, Math.min(w, h) / 700);
  const camx = t * 22;
  c.save(); c.scale(sc, sc);
  const vw = w / sc, vh = h / sc;
  const tx0 = Math.floor(camx / TILE) - 1, ty0 = -1;
  for (let ty = ty0; ty < vh / TILE + 1; ty++) for (let tx = tx0; tx < tx0 + vw / TILE + 3; tx++) {
    const n = clamp((Math.sin(tx * .23) + Math.sin(ty * .29 + tx * .11) + 2) / 4, 0, .99);
    c.drawImage(groundAtlas, ((Math.floor(n * 4) << 1) | ((tx * 7 + ty * 13) & 1)) * TILE, 0, TILE, TILE, tx * TILE - camx, ty * TILE, TILE + .7, TILE + .7);
  }
  // ruines écrasées
  const cxW = camx + vw * .62, cy = vh * .42;
  for (let tx = tx0; tx < tx0 + vw / TILE + 3; tx++) for (let ty = 0; ty < vh / TILE + 1; ty++) {
    const wx = tx * TILE + 20, wy = ty * TILE + 20; const n = hash2(tx, ty, 3);
    if (n > .05) continue;
    if (wx < cxW + 120 && Math.abs(wy - cy) < 170) continue;
    c.drawImage(obsAtlas, ((tx + ty) % 3) * OC, (n < .02 ? 3 : n < .035 ? 1 : 5) * OC, OC, OC, wx - camx - OC / 2, wy - OC / 2, OC, OC);
  }
  // traînée de chenilles
  c.fillStyle = 'rgba(12,10,8,.28)';
  for (const oy of [-.8, .8]) c.fillRect(-10, cy + oy * 145 - 26, vw * .62 - 40, 52);
  c.fillStyle = 'rgba(30,26,22,.35)';
  for (const oy of [-.8, .8]) for (let x = ((-camx * 1) % 18 + 18) % 18 - 10; x < vw * .62 - 50; x += 18) c.fillRect(x, cy + oy * 145 - 24, 6, 48);
  const P = PAL.ally, R = 145;
  c.save(); c.translate(vw * .62, cy);
  c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(R * .18, R * .25, R * 1.05, R * .95, 0, 0, TAU); c.fill();
  paintChassis(c, 'colossus', R, P, t * 1.2, 1, null);
  const wpn = ['rail', 'rail', 'cannon', 'cannon', 'mortar', 'mortar'];
  MOUNTS.colossus.forEach(([mx, my], i) => { c.save(); c.translate(mx * R, my * R); c.rotate(Math.sin(t * .5 + i * 1.3) * .6 - (i > 3 ? .3 : 0)); paintMount(c, wpn[i], MSCALE.colossus, P, 0, t); c.restore(); });
  c.restore();
  for (const r of titleScene.crawlers) {
    r.a += Math.sin(t * .7 + r.x) * .01; r.x += Math.cos(r.a) * .4 + .37; r.y += Math.sin(r.a) * .4;
    if (r.x > 420) r.x = -260; if (Math.abs(r.y) > 260) r.y *= -.9;
    const cr = CHASSIS[r.ch].r;
    c.save(); c.translate(vw * .62 + r.x, cy + r.y + (r.y > 0 ? 190 : -190)); c.rotate(r.a + .4);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(3, r.ch === 'drone' ? 14 : 4, cr, cr * .85, 0, 0, TAU); c.fill();
    paintChassis(c, r.ch, cr, P, t * 1.3, .8, null); c.restore();
  }
  c.restore();
  const g = c.createLinearGradient(0, h, 0, h * .3); g.addColorStop(0, 'rgba(14,17,18,.92)'); g.addColorStop(1, 'rgba(14,17,18,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const g2 = c.createLinearGradient(0, 0, w * .6, 0); g2.addColorStop(0, 'rgba(14,17,18,.6)'); g2.addColorStop(1, 'rgba(14,17,18,0)'); c.fillStyle = g2; c.fillRect(0, 0, w, h);
}

// ================= TIROIR DE GESTION =================
let hubTab = 'atelier', activeSlot = 0, activeMod = 0, buildQty = 1;
let design = { chassis: 'crawler', weapons: ['mg'], modules: [], brain: 'escort', name: '', refit: null };
const CRUSH_TXT = ['Aucun', 'Végétation, cristaux', 'Rochers, épaves', 'Murs', 'Tout, remparts compris', 'Tout : le paysage entier', 'Tout : le paysage entier', 'Tout : le paysage entier', 'Tout : le paysage entier', 'Tout : le paysage entier'];
function randomName(ch) { return (CHASSIS[ch].tier >= 7 ? pick(GIANT_NAMES) : CHASSIS[ch].tier >= 5 ? pick(BIG_NAMES) : pick(ROBOT_NAMES)) + '-' + rndi(2, 99); }
function allowedWeapons(ch) { return CRAFT_WEAPONS.filter(w => weaponUnlocked(w) && WEAPONS[w].size <= CHASSIS[ch].wsize); }
function fitDesign() {
  const ch = CHASSIS[design.chassis], al = allowedWeapons(design.chassis);
  design.weapons = design.weapons.slice(0, ch.slots);
  const pref = al.filter(w => ch.wsize >= 4 && WEAPONS[w].size === ch.wsize && !isSupportW(w) && WEAPONS[w].kind !== 'nuke').concat(['cannon', 'rockets', 'laser', 'rail', 'rifle', 'mg', 'mortar', 'blades'].filter(w => al.includes(w)));
  while (design.weapons.length < ch.slots) design.weapons.push(pref[design.weapons.length % Math.max(1, pref.length)] || al[0] || 'mg');
  design.weapons = design.weapons.map(w => al.includes(w) ? w : (al[0] || 'mg'));
  if (activeSlot >= ch.slots) activeSlot = 0;
  const ms = modSlots(design.chassis);
  design.modules = (design.modules || []).slice(0, ms).map(m => m && moduleUnlocked(m) ? m : '');
  while (design.modules.length < ms) design.modules.push('');
  if (activeMod >= ms) activeMod = 0;
  if (!brainUnlocked(design.brain) && !design.refit) design.brain = 'escort';
}
function refitCost(sr, d) {
  let c = {}; const oldW = sr.weapons.slice(), oldM = (sr.modules || []).slice();
  for (const w of d.weapons) { const i = oldW.indexOf(w); if (i >= 0) oldW.splice(i, 1); else c = addCost(c, WEAPONS[w].cost); }
  for (const m of d.modules) { if (!m) continue; const i = oldM.indexOf(m); if (i >= 0) oldM.splice(i, 1); else c = addCost(c, MODULES[m].cost); }
  if (d.brain !== sr.brain && BRAINS[d.brain].cost) c = addCost(c, BRAINS[d.brain].cost);
  return c;
}
function costHtml(cost, mul = 1) { return Object.keys(cost).map(k => { const n = Math.ceil(cost[k] * mul); const ok = (save.res[k] || 0) >= n; return `<span class="${ok ? 'yes' : 'no'}">${fmt(n)} ${RES[k].n}</span>`; }).join(''); }
function dur(s) { s = Math.round(s); return s >= 60 ? Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '') : s + ' s'; }
function weaponStat(id) {
  const w = WEAPONS[id];
  switch (w.kind) {
    case 'repair': return 'soin ' + w.heal + '/s · ' + w.range + ' px';
    case 'shield': return 'bouclier ' + w.cap + ' · régén. ' + w.regen + '/s';
    case 'bay': return w.max + (w.drone ? ' chasseurs à roquettes' : ' drones de combat');
    case 'singularity': return fmt(w.dmg) + ' dégâts · trou noir ' + w.vt + ' s';
    case 'orbital': return w.strikes + ' frappes de ' + fmt(w.dmg) + ' · ' + w.range + ' px';
    case 'beam': return w.dps + ' dps continu · ' + w.range + ' px';
    case 'chain': return Math.round(w.dmg * w.rate) + ' dps · ' + (w.chain + 1) + ' cibles';
    case 'fusion': return w.dmg + ' dégâts en ligne · charge ' + w.charge + ' s';
    case 'nuke': return w.dmg + ' dégâts · rayon ' + w.splash;
  }
  const dps = (w.dmg || 0) * (w.pellets || 1) * (w.salvo || 1) * w.rate * (w.kind === 'flame' ? 2 : 1);
  return Math.round(dps) + ' dps' + (w.splash ? ' · zone' : '') + ' · ' + (w.kind === 'melee' ? 'contact' : w.range + ' px');
}
function chassisLock(k) {
  const C = CHASSIS[k];
  if (!chassisUnlocked(k)) return 'À rechercher';
  if (C.tier >= 7) { if (forgeMaxTier() < 6) return 'Forge niv. 5 requise'; if (bLevel('shipyard') < C.tier - 6) return 'Chantier titanesque niv. ' + (C.tier - 6) + ' requis'; }
  else if (C.tier > forgeMaxTier()) return 'Forge niv. ' + (C.tier - 1) + ' requise';
  return '';
}
function repairCost(r) {
  const ch = CHASSIS[r.chassis], miss = 1 - r.hp, o = {};
  const s = Math.ceil((ch.cost.scrap || 0) * .28 * miss), a = Math.ceil((ch.cost.alloy || 0) * .28 * miss);
  if (s > 0) o.scrap = s; if (a > 0) o.alloy = a; return o;
}
function openDrawer(tab) {
  if (EXPV.id) expViewClose(true);
  if (attack && attack.phase === 'fight') { toast('Impossible pendant l\'attaque.'); SFX.play('deny', 1); return; }
  if (tab) hubTab = tab; drawerOpen = true; for (const k in keys) keys[k] = false; mouse.l = false; mouse.drag = null;
  showScreen('hub'); renderHub(); $('#hubMain').scrollTop = 0; updateBPanel(); SFX.play('uiopen', 1); updateTouchUI();
}
function closeDrawer(silent) { if (!drawerOpen) return; drawerOpen = false; uiCommit(); uiPendTab = null; try { updateNav(); } catch (e) { } $('#hub').classList.remove('on'); updateBPanel(); if (!silent) SFX.play('uiclose', 1); updateTouchUI(); }
function showBaseBar(on) { $('#baseBar').classList.toggle('on', on); if (on) { try { updateNav(); } catch (e) { } } }

// ---------- panneau du bâtiment sélectionné ----------
function updateBPanel() {
  const el = $('#bPanel');
  if (state !== 'base' || !baseSel || drawerOpen || !save.base.b.includes(baseSel)) { el.classList.remove('on'); return; }
  const b = baseSel, D = BUILD[b.type], now = Date.now();
  const rem = b.busy ? (b.busy - now) / 1000 : 0, why = upgradeCheck(b), nl = b.lvl + 1;
  const finishCost = Math.max(1, Math.ceil(rem / 120));
  el.innerHTML = `<button class="x" data-act="bclose" aria-label="Fermer">×</button>
    <h4>${D.n}</h4>
    <p>Niveau ${b.lvl} / ${D.max}${b.busy ? ` · ${b.lvl ? 'amélioration' : 'construction'} vers ${b.up} : ${mmss(rem + .99)}` : ''}</p>
    <p>${bEffect(b)}</p>
    ${D.prod && b.lvl ? `<p>Stock : ${fmt(b.stored || 0)} / ${fmt(prodCap(b))} ${RES[D.prod].n}</p>` : ''}
    ${b.type === 'hq' ? `<p>Menace : ${Math.round(save.base.threat || 0)} %. Elle monte à chaque extraction. Au-delà de 60 %, une attaque frappe la base à votre retour.</p><div class="acts"><button class="btn sm" data-act="provoke" ${attack ? 'disabled' : ''}>Provoquer une attaque</button></div>` : ''}
    ${b.type === 'wall' && b.lvl < D.max ? (() => { const same = save.base.b.filter(x => x.type === 'wall' && x.lvl === b.lvl), c1 = bCost('wall', b.lvl + 1); return `<div class="acts"><button class="btn sm" data-act="bupall" ${upgradeCheck(b) ? 'disabled' : ''}>Améliorer les ${same.length} murs niv. ${b.lvl} · ${Object.keys(c1).map(k => fmt(c1[k] * same.length) + ' ' + RES[k].n).join(', ')}</button></div>`; })() : ''}
    <div class="acts">
      ${D.ui && b.lvl > 0 ? `<button class="btn hot sm" data-act="bopen">Ouvrir</button>` : ''}
      ${D.prod && b.lvl > 0 ? `<button class="btn sm" data-act="bcollect">Récolter</button>` : ''}
      ${attack && attack.phase === 'fight' ? '' : '<button class="btn sm" data-act="bmove">Déplacer</button>'}
      ${b.busy ? `<button class="btn sm" data-act="bfinish" ${(save.res.cores || 0) >= finishCost ? '' : 'disabled'}>Terminer · ${finishCost} noyau${finishCost > 1 ? 'x' : ''}</button>` : ''}
    </div>
    ${!b.busy && b.lvl < D.max ? `<p style="margin-top:10px">Niveau ${nl} : ${bEffect(b, nl)}</p><div class="cost">${costHtml(bCost(b.type, nl))} · ${dur(bTime(b.type, nl))}</div>
      <div class="acts"><button class="btn sm ${why ? '' : 'hot'}" data-act="bup" ${why ? 'disabled' : ''}>Améliorer</button>${why ? `<span style="font-size:12px;color:#a59c88;align-self:center">${why}</span>` : ''}</div>` : ''}`;
  el.classList.add('on');
}

// ---------- actions ----------
function buildRobots() {
  const cost = robotCost(design.chassis, design.weapons, design.brain, design.modules), room = hangarCap() - save.robots.length;
  const n = cost.heart ? 1 : Math.min(buildQty, room);
  if (chassisLock(design.chassis) || n <= 0 || !canAfford(cost, n)) { SFX.play('deny', 1); return; }
  pay(cost, n);
  const fg = save.base.b.find(b => b.type === 'forge'), fr = fg ? bRect(fg) : null;
  for (let i = 0; i < n; i++) {
    const name = (n === 1 && (design.name || '').trim()) || randomName(design.chassis);
    const r = { id: save.nextId++, name, chassis: design.chassis, weapons: design.weapons.slice(), modules: design.modules.filter(Boolean), brain: design.brain, hp: 1, deploy: cmdUsed() + CHASSIS[design.chassis].cmd <= cmdCap(), group: 0, xp: 0, kills: 0, traits: [] };
    save.robots.push(r);
    if (state === 'base' && fr) { const u = spawnBaseRobot(r, fr.x + fr.w / 2 + rnd(-20, 20), fr.y + fr.h + CHASSIS[r.chassis].r + 10); for (let k = 0; k < 8; k++) sparks(u.x, u.y, 2, '#6fe3c8'); }
  }
  design.name = ''; writeSave(); SFX.play('build', 1);
  toast(n > 1 ? n + ' robots assemblés.' : save.robots[save.robots.length - 1].name + ' assemblé' + (save.robots[save.robots.length - 1].deploy ? ' et déployé.' : '. Commandement plein : il reste au hangar.'));
  renderHub();
}
function syncUnit(sr) { const u = fleet.find(f => f.sid === sr.id); if (u) { u.brain = sr.brain; u.group = sr.group || 0; u.hp = u.maxhp * sr.hp; u.wm = Array.isArray(sr.wm) ? sr.wm.slice() : null; u.split = !!sr.split; for (const m of u.mounts) m.tgt2 = null; } return u; }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-tab]'); if (!el) return;
  SFX.init();
  if (el.dataset.tab) { hubTab = el.dataset.tab; SFX.play('ui', 1); renderHub(); $('#hubMain').scrollTop = 0; return; }
  const act = el.dataset.act, id = el.dataset.id, rid = +el.dataset.rid;
  const R = rid ? save.robots.find(r => r.id === rid) : null;
  if (R && R.exp && ['deploy', 'repair', 'refit', 'scrap', 'rsplit', 'rwm', 'rplan'].includes(act)) { toast(R.name + ' est en expédition.'); SFX.play('deny', 1); return; }
  switch (act) {
    case 'enter': if (!save.tutAsked && !save.seen && !tProgress(save)) { TUT.dialog('ask'); break; } save.seen = true; writeSave(); enterBase(); break;
    case 'help': renderHelp(); showOverlay('help', true); break;
    case 'closehelp': showOverlay('help', false); break;
    case 'reset': askConfirm({ t: 'Effacer la partie', danger: true, ok: 'Tout effacer', x: (ACC.mode === 'server' ? 'Effacer toute la progression du compte ' + ACC.name + ' (sur ce serveur et tous vos appareils) et recommencer ?' : 'Effacer toute la progression de cet appareil et recommencer ?') + ' Votre partie actuelle (' + saveSummary(save) + ') restera disponible sur cet appareil, comme copie de secours dans Réglages → Sauvegarde.' }).then(ok => { if (!ok) return; saveBackupNow(); save = newSave(); bakT = Date.now(); writeSave(); refreshTitle(); toast('Partie effacée : l\'ancienne reste dans la copie de secours de cet appareil.'); }); break;
    case 'opentab': openDrawer(id); break;
    case 'closedrawer': closeDrawer(); break;
    case 'pausebase': pauseGame(); break;
    case 'chassis': if (design.refit) break; design.chassis = id; fitDesign(); SFX.play('ui', 1); renderHub(); break;
    case 'modslot': activeMod = +el.dataset.slot; SFX.play('ui', 1); renderHub(); break;
    case 'mod': { const prev = design.modules[activeMod], j = id ? design.modules.indexOf(id) : -1; if (j >= 0 && j !== activeMod) design.modules[j] = prev || ''; design.modules[activeMod] = id || ''; if (activeMod < design.modules.length - 1 && id) activeMod++; SFX.play('ui', 1); renderHub(); break; }
    case 'refit': if (R) { design = { chassis: R.chassis, weapons: R.weapons.slice(), modules: (R.modules || []).slice(), brain: R.brain, name: R.name, refit: R.id }; activeSlot = 0; activeMod = 0; fitDesign(); hubTab = 'atelier'; renderHub(); $('#hubMain').scrollTop = 0; } break;
    case 'cancelrefit': design.refit = null; design.name = ''; renderHub(); break;
    case 'applyrefit': { const RF = save.robots.find(r => r.id === design.refit); if (!RF) break; const c2 = refitCost(RF, design); if (!canAfford(c2)) { SFX.play('deny', 1); break; } pay(c2);
      RF.weapons = design.weapons.slice(); RF.modules = design.modules.filter(Boolean); RF.brain = design.brain; RF.name = (design.name || '').trim() || RF.name;
      const u = fleet.find(f => f.sid === RF.id); if (u && state === 'base') { const x = u.x, y = u.y; if (player.inside === u) ejectPlayer(false); u.dead = true; fleet = fleet.filter(f => f !== u); const nu = spawnBaseRobot(RF, x, y); sparks(nu.x, nu.y, 10, '#6fe3c8'); }
      design.refit = null; design.name = ''; writeSave(); SFX.play('build', 1); toast(RF.name + ' réaménagé.'); hubTab = 'hangar'; renderHub(); break; }
    case 'provoke': if (!attack && state === 'base') { closeDrawer(true); scheduleAttack(40, 'Vous avez provoqué les pillards. Ils arrivent !'); } break;
    case 'bupall': if (baseSel && baseSel.type === 'wall') { const L = baseSel.lvl; let n = 0; for (const w of save.base.b.filter(x => x.type === 'wall' && x.lvl === L)) { if (upgradeCheck(w)) break; pay(bCost('wall', L + 1)); w.lvl = L + 1; syncProxy(w); n++; } if (n) { SFX.play('build', .8); toast(n + ' murs améliorés.'); writeSave(); } updateBPanel(); } break;
    case 'closeattack': showOverlay('result', false); paused = false; updateBPanel(); break;
    case 'slot': activeSlot = +el.dataset.slot; SFX.play('ui', 1); renderHub(); break;
    case 'weapon': design.weapons[activeSlot] = id; if (activeSlot < design.weapons.length - 1) activeSlot++; SFX.play('ui', 1); renderHub(); break;
    case 'allslots': { const w = design.weapons[activeSlot]; design.weapons = design.weapons.map(() => w); SFX.play('ui', 1); renderHub(); break; }
    case 'brain': design.brain = id; SFX.play('ui', 1); renderHub(); break;
    case 'qty': buildQty = +id; SFX.play('ui', 1); renderHub(); break;
    case 'build': buildRobots(); break;
    case 'deploy': if (R) { R.deploy = !R.deploy; writeSave(); SFX.play('ui', 1); renderHub(); } break;
    case 'rplan': setFabPlan(R, id); break;
    case 'rsplit': if (R) { R.split = id === '1'; syncUnit(R); writeSave(); SFX.play('ui', 1); renderHub(); } break;
    case 'rwm': if (R) { const k = +el.dataset.slot; R.wm = R.weapons.map((w, i) => (R.wm || [])[i] === 'a' ? 'a' : 'm'); const nv = R.wm[k] === 'a' ? 'm' : 'a'; if (el.dataset.group) R.weapons.forEach((w, i) => { if (w === el.dataset.group) R.wm[i] = nv; }); else R.wm[k] = nv; syncUnit(R); writeSave(); SFX.play('ui', 1); renderHub(); } break;
    case 'deployall': { let used = cmdUsed(); for (const r of save.robots.slice().sort((a, b) => CHASSIS[b.chassis].tier - CHASSIS[a.chassis].tier)) { if (r.deploy || r.exp) continue; const c2 = CHASSIS[r.chassis].cmd; if (used + c2 <= cmdCap()) { r.deploy = true; used += c2; } } writeSave(); renderHub(); break; }
    case 'undeployall': for (const r of save.robots) r.deploy = false; writeSave(); renderHub(); break;
    case 'repairall': for (const r of save.robots) { if (r.hp >= 1 || r.exp) continue; const rc = repairCost(r); if (canAfford(rc)) { pay(rc); r.hp = 1; syncUnit(r); } } writeSave(); SFX.play('build', .7); renderHub(); break;
    case 'repair': if (R) { const rc = repairCost(R); if (canAfford(rc)) { pay(rc); R.hp = 1; syncUnit(R); writeSave(); SFX.play('build', .7); renderHub(); } } break;
    case 'scrap': if (R) askConfirm({ t: 'Démonter', ok: 'Démonter', danger: true, x: 'Démonter ' + R.name + ' ? Vous récupérez la moitié des matériaux.' }).then(ok => {
      if (!ok || !save.robots.includes(R)) return;
      const c2 = robotCost(R.chassis, R.weapons, R.brain, R.modules);
      for (const k in c2) { if (k === 'heart') save.res.heart += c2[k]; else save.res[k] += Math.floor(c2[k] * .5 * R.hp); }
      save.robots = save.robots.filter(r => r !== R);
      const u = fleet.find(f => f.sid === R.id); if (u) { if (player.inside === u) ejectPlayer(false); u.dead = true; fleet = fleet.filter(f => f !== u); boom(u.x, u.y, u.r * 1.5); }
      writeSave(); SFX.play('crush', 1); renderHub();
    }); break;
    case 'research': { const r = RESEARCH_BY_ID[id]; if (rCan(r)) { pay(r.cost); save.research[r.id] = true; writeSave(); SFX.play('research', 1); toast(rDoneTxt(r)); renderHub(); } break; }
    case 'diff': save.diff = +id; writeSave(); SFX.play('ui', 1); renderHub(); break;
    case 'pweapon': save.pweapon = id; writeSave(); SFX.play('ui', 1); renderHub(); if (player && state === 'base') { player.pw = PWEAPONS[id]; player.ammo = player.pw.mag; } break;
    case 'launch': if (attack) { toast('Repoussez d\'abord l\'attaque.'); SFX.play('deny', 1); break; }
      if (TUT.on && TUT.cur().ch === 'C') { toast('Terminez d\'abord le tutoriel : il reste quelques étapes à la base.'); SFX.play('deny', 1); break; } if (LIVE.room) LIVE.leave(); leaveBase(); startRaid(); break;
    case 'place': startPlacing(id); break;
    case 'bclose': baseSel = null; updateBPanel(); break;
    case 'bopen': openBuilding(baseSel); break;
    case 'bcollect': if (baseSel) { collect(baseSel); updateBPanel(); } break;
    case 'bmove': if (baseSel) { startPlacing(baseSel.type, baseSel.id); } break;
    case 'bup': if (baseSel) upgradeBuilding(baseSel); break;
    case 'bfinish': if (baseSel && baseSel.busy) { const c2 = Math.max(1, Math.ceil((baseSel.busy - Date.now()) / 120000)); if (save.res.cores >= c2) { save.res.cores -= c2; baseSel.busy = Date.now(); baseTimers(); updateBPanel(); } } break;
    case 'resume': resumeGame(); break;
    case 'mute': muted = !muted; SFX.applyVolumes(); el.textContent = muted ? 'Rétablir le son' : 'Couper le son'; break;
    case 'abandon': showOverlay('pause', false); paused = false; if (state === 'assault') { endAssault(); break; } if (player && !player.dead) { player.hp = 0; player.dead = true; } endRaid(false); break;
    case 'assault': if (TUT.on) break; if (LIVE.room) LIVE.leave(); closeDrawer(true); startAssault(id); break;
    case 'totitle': if (TUT.on) { showOverlay('pause', false); TUT.dialog('quit'); break; } showOverlay('pause', false); paused = false; writeSave(); leaveBase(); state = 'title'; showScreen('title'); refreshTitle(); break;
    case 'tohub': showOverlay('result', false); enterBase(); break;
  }
});
document.addEventListener('change', e => {
  const el = e.target; const rid = +el.dataset.rid; const R = save.robots.find(r => r.id === rid); if (!R || R.exp) return;
  if (el.dataset.act === 'setbrain') {
    const nb = el.value;
    if (nb === 'tactical' && R.brain !== 'tactical') { if ((save.res.cores || 0) < 1) { toast('Il faut un Noyau IA pour installer un cortex tactique.'); renderHub(); return; } save.res.cores--; }
    R.brain = nb; syncUnit(R); writeSave(); renderHub();
  } else if (el.dataset.act === 'setgroup') { R.group = +el.value; syncUnit(R); writeSave(); }
});

// ================= ONGLET RAID : RÉGIONS & CONTRATS =================

// ================= ARBRE DE RECHERCHE =================
let rSel = null;
const R_STATE_TXT = { done: 'Acquis', locked: 'Verrouillé', ready: 'Disponible', avail: 'Ressources manquantes' };

// ================= RÉGLAGES =================
let rebinding = null;
function applyUiScale() { document.documentElement.style.setProperty('--ui', uiScale()); vignette = null; }
function renderSettings() {
  const ch = (k, v, label) => `<button class="chip ${settings[k] === v ? 'on' : ''}" data-act="set" data-k="${k}" data-v="${v}">${label}</button>`;
  $('#settingsBox').innerHTML = `<h3>Réglages</h3>
  <div class="slot-h" style="margin-top:4px">Affichage</div>
  <div class="setgrid">
    <span>Taille de l'interface</span><div class="chips">${[.9, 1, 1.15, 1.3, 1.5].map(v => ch('ui', v, Math.round(v * 100) + ' %')).join('')}</div>
    <span>Palette des équipes</span><div class="chips">${ch('cb', false, 'Standard')}${ch('cb', true, 'Adaptée au daltonisme')}</div>
    <span>Contours renforcés</span><div class="chips">${ch('contrast', false, 'Non')}${ch('contrast', true, 'Oui')}</div>
    <span>Secousses d'écran</span><div class="chips">${ch('shake', 0, 'Aucune')}${ch('shake', .5, 'Réduites')}${ch('shake', 1, 'Normales')}</div>
    <span>Flashs lumineux</span><div class="chips">${ch('flash', true, 'Activés')}${ch('flash', false, 'Atténués')}</div>
    <span>Effets visuels</span><div class="chips">${ch('fx', 'auto', 'Automatique')}${ch('fx', 'high', 'Élevés')}${ch('fx', 'mid', 'Moyens')}${ch('fx', 'low', 'Réduits')}</div>
    <span>Images par seconde</span><div class="chips">${ch('fps30', false, 'Maximum')}${ch('fps30', true, '30 · économie de batterie')}</div>
    <span>Cycle jour/nuit</span><div class="chips">${ch('daynight', true, 'Activé')}${ch('daynight', false, 'Toujours le jour')}</div>
    <span>Indicateurs de cible</span><div class="chips">${ch('tgt', 'full', 'Complets')}${ch('tgt', 'basic', 'Essentiels')}${ch('tgt', 'off', 'Masqués')}</div>
  </div>
  <div class="slot-h" style="margin-top:16px">Commandes</div>
  <div class="setgrid">
    <span>Tir du pilote</span><div class="chips">${ch('toggleFire', false, 'Maintenir le clic')}${ch('toggleFire', true, 'Un clic démarre, un clic arrête')}</div>
    <span>Visée assistée</span><div class="chips">${ch('aim', false, 'Non')}${ch('aim', true, 'Oui')}</div>
    <span>Caisses et pylônes</span><div class="chips">${ch('tapAct', false, 'Maintenir l\'appui')}${ch('tapAct', true, 'Un appui suffit')}</div>
    <span>Commandes tactiles</span><div class="chips">${ch('touch', 'auto', 'Automatique')}${ch('touch', 'on', 'Toujours')}${ch('touch', 'off', 'Jamais')}</div>
    <span>Vibrations (téléphone)</span><div class="chips">${ch('haptics', true, 'Activées')}${ch('haptics', false, 'Désactivées')}</div>
  </div>
  <div class="slot-h" style="margin-top:16px">Son</div>
  <div class="setgrid">
    <span>Volume général</span><div class="chips">${[0, .3, .6, .8, 1].map(v => ch('vol', v, v ? Math.round(v * 100) + ' %' : 'Muet')).join('')}<button class="chip" data-act="sndtest">Tester ▸</button></div>
    <span>Effets sonores</span><div class="chips">${[0, .25, .5, .75, 1].map(v => ch('vSfx', v, v ? Math.round(v * 100) + ' %' : 'Coupés')).join('')}</div>
    <span>Musique</span><div class="chips">${[0, .25, .5, .7, 1].map(v => ch('vMus', v, v ? Math.round(v * 100) + ' %' : 'Coupée')).join('')}</div>
    <span>Ambiance</span><div class="chips">${[0, .25, .5, .7, 1].map(v => ch('vAmb', v, v ? Math.round(v * 100) + ' %' : 'Coupée')).join('')}</div>
  </div>
  <div class="slot-h" style="margin-top:16px">Compte et en ligne</div>
  <div class="setgrid">
    <span>Compte</span><div class="chips"><span class="desc" style="align-self:center">${esc(accountLabel())}</span><button class="btn sm hot" data-act="account">Gérer le compte</button></div>
    <span>État</span><span class="desc" id="netStatus">${esc(NET.status)}</span>
    ${ACC.mode === 'server' ? '' : `<span>Pseudo (invité)</span><input class="name" id="setPseudo" maxlength="20" value="${esc(settings.pseudo || '')}" placeholder="Votre nom de pilote">`}
  </div>
  <div class="slot-h" style="margin-top:16px">Sauvegarde</div>
  ${saveSetHTML()}
  <div class="slot-h" style="margin-top:16px">À propos</div>
  <p>Colosse <b>${esc(VERSION)}</b>. ${ERRLOG.list.length ? `${ERRLOG.n} incident${ERRLOG.n > 1 ? 's' : ''} technique${ERRLOG.n > 1 ? 's' : ''} pendant cette session : la partie a continué. Copiez ce rapport et envoyez-le au développeur (page GitHub du jeu) pour l\'aider à les corriger.` : 'Aucun incident technique pendant cette session.'}</p>
  ${ERRLOG.list.length ? `<pre class="errlist">${esc(ERRLOG.report())}</pre><div class="chips" style="margin-top:6px"><button class="btn sm" data-act="errcopy">Copier le rapport</button></div>` : ''}
  <div class="slot-h" style="margin-top:16px">Raccourcis clavier</div>
  <p>Le déplacement (ZQSD / WASD et flèches) n'est pas modifiable. Pour changer un raccourci, cliquez sur son bouton puis appuyez sur la nouvelle touche.</p>
  <div class="keylist">${Object.keys(ACTIONS).map(a => `<span>${ACTIONS[a].n}</span><button class="btn sm" data-act="rebind" data-id="${a}">${rebinding === a ? 'Appuyez…' : keyOf(a) ? '<kbd>' + keyLabel(a) + '</kbd>' : '<i>non attribuée</i>'}</button>`).join('')}</div>
  <div class="btns"><button class="btn hot" data-act="closesettings">Fermer</button><button class="btn" data-act="resetkeys">Raccourcis par défaut</button></div>`;
}
// ---------- réglages : sauvegarde (copie de secours, export, import) ----------
const SETUI = { imp: false, code: '' };
// application Android (WebView) : ni téléchargement ni choix de fichier, on passe par le code à copier
const APP_ANDROID = /Android/.test(navigator.userAgent) && /; wv\)/.test(navigator.userAgent);
// pas de téléchargement possible non plus dans la version hébergée hors du dépôt (page intégrée sans manifeste) : on propose seulement le code à copier
const NO_DL = APP_ANDROID || !window.COLOSSE_STANDALONE;
function saveSetHTML() {
  const key = accountKey(ACC), bak = parseSave(lsGet(key + BAK_SUFFIX)), broken = lsGet(key + BROKEN_SUFFIX);
  return `<div class="setgrid">
    <span>Partie</span><span class="desc">${esc(saveSummary(save))} · ${save.ut ? 'enregistrée le ' + saveDate(save.ut) : 'pas encore enregistrée'}${saveFrozen ? ' · <b>lecture seule</b> (partie d\'une version plus récente)' : ''}</span>
    <span>Copie de secours</span><div class="chips">${bak ? `<span class="desc" style="align-self:center">${esc(saveSummary(bak))} · ${saveDate(bak.ut)}</span><button class="btn sm" data-act="saverestore">Restaurer</button>` : '<span class="desc">Elle se crée toute seule au fil des enregistrements.</span>'}</div>
    <span>Transférer la partie</span><div class="chips">${NO_DL ? '' : '<button class="btn sm" data-act="saveexport">Exporter un fichier</button>'}<button class="btn sm" data-act="savecopy">Copier le code</button><button class="btn sm ${SETUI.imp ? 'hot' : ''}" data-act="saveimport">Importer…</button></div>
    ${broken ? `<span>Partie illisible</span><div class="chips"><span class="desc" style="align-self:center">Une sauvegarde illisible a été mise de côté.</span><button class="btn sm" data-act="savebroken">${NO_DL ? 'Copier son contenu' : 'La télécharger'}</button></div>` : ''}
  </div>
  ${SETUI.code ? `<div class="savebox"><p>Copie automatique impossible ici : sélectionnez le code ci-dessous et copiez-le.</p><textarea id="expTxt" readonly>${esc(SETUI.code)}</textarea></div>` : ''}
  ${SETUI.imp ? `<div class="savebox"><p>${APP_ANDROID ? 'Collez un code de sauvegarde copié depuis Colosse.' : 'Collez un code de sauvegarde, ou choisissez un fichier exporté par Colosse.'} Votre partie actuelle deviendra la copie de secours.</p>
    <textarea id="impTxt" placeholder="Code de sauvegarde Colosse"></textarea>
    <div class="chips">${APP_ANDROID ? '' : '<label class="btn sm">Choisir un fichier<input type="file" id="impFile" accept=".json,application/json,text/plain" hidden></label>'}<button class="btn sm hot" data-act="saveimportgo">Importer cette partie</button><button class="btn sm" data-act="saveimport">Annuler</button></div>
    <p class="desc" id="impMsg"></p></div>` : ''}`;
}
async function saveReplace(o, what) {
  if (TUT.on) { toast('Quittez d\'abord le tutoriel.'); return false; }
  if (state === 'raid' || state === 'assault' || state === 'result') { toast('Terminez d\'abord le raid en cours.'); return false; }
  const ok = await askConfirm({ t: what, ok: 'Remplacer', danger: true, x: 'Remplacer votre partie actuelle (' + saveSummary(save) + ') par celle-ci (' + saveSummary(o) + ') ? La partie actuelle deviendra la copie de secours.' });
  if (!ok) return false;
  const key = accountKey(ACC); lsSet(key + BAK_SUFFIX, JSON.stringify(save)); bakT = Date.now();
  save = o; if (saveFrozen === key) saveFrozen = ''; writeSave(); if (typeof cloudPush === 'function' && ACC.mode === 'server') cloudPush(true);
  SETUI.imp = false; SETUI.code = '';
  if (state === 'base') enterBase(); else refreshTitle();
  renderSettings(); toast('Partie chargée : ' + saveSummary(save) + '.');
  return true;
}
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  switch (el.dataset.act) {
    case 'saveexport': { const d = new Date(), z = n => String(n).padStart(2, '0'); downloadText(`colosse-${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}-${z(d.getHours())}h${z(d.getMinutes())}.json`, saveExportText()); } toast('Fichier de sauvegarde exporté.'); break;
    case 'savecopy': { const t = saveExportText(); if (await copyText(t)) { SETUI.code = ''; toast('Code copié. Envoyez-le-vous (message, e-mail…), puis collez-le sur l\'autre appareil : Réglages → Sauvegarde → Importer.'); } else { SETUI.code = t; renderSettings(); const ta = $('#expTxt'); if (ta) { ta.focus(); ta.select(); } } break; }
    case 'saveimport': SETUI.imp = !SETUI.imp; renderSettings(); if (SETUI.imp) { const ta = $('#impTxt'); if (ta) ta.focus(); } break;
    case 'saveimportgo': { const ta = $('#impTxt'), r = saveImportParse(ta ? ta.value : ''); if (r.err) { const m = $('#impMsg'); if (m) m.textContent = r.err; SFX.play('deny', 1); break; } await saveReplace(r.o, 'Importer une partie'); break; }
    case 'saverestore': { const b = parseSave(lsGet(accountKey(ACC) + BAK_SUFFIX)); if (b) await saveReplace(b, 'Restaurer la copie de secours'); break; }
    case 'savebroken': { const raw = lsGet(accountKey(ACC) + BROKEN_SUFFIX); if (!raw) break; if (!NO_DL) { downloadText('colosse-partie-abimee.txt', raw, 'text/plain'); break; } if (await copyText(raw)) toast('Contenu copié.'); else { SETUI.code = raw; renderSettings(); const ta = $('#expTxt'); if (ta) { ta.focus(); ta.select(); } } break; }
    case 'errcopy': toast(await copyText(ERRLOG.report()) ? 'Rapport copié.' : 'Copie impossible : sélectionnez le texte du rapport.'); break;
  }
});
document.addEventListener('change', async e => {
  if (e.target && e.target.id === 'impFile' && e.target.files && e.target.files[0]) {
    const f = e.target.files[0]; if (f.size > 8e6) { const m = $('#impMsg'); if (m) m.textContent = 'Fichier trop gros pour être une sauvegarde Colosse.'; return; }
    try { const t = await f.text(), ta = $('#impTxt'); if (ta) ta.value = t; const m = $('#impMsg'); if (m) { const r = saveImportParse(t); m.textContent = r.err || 'Partie trouvée : ' + saveSummary(r.o) + '. Cliquez sur « Importer cette partie ».'; } } catch (er) { }
  }
});
function openSettings() { SETUI.imp = false; SETUI.code = ''; renderSettings(); showOverlay('settings', true); }
function closeSettings() { const ps = $('#setPseudo'); if (ps) { settings.pseudo = ps.value.trim().slice(0, 20); saveSettings(); } rebinding = null; showOverlay('settings', false); refreshKeyHints(); }
function refreshKeyHints() { const k = $('#kbBuild'); if (k) k.textContent = keyLabel('defend'); }
function renderHelp() {
  const rows = [['ZQSD / WASD / flèches', 'Se déplacer, ou piloter le robot embarqué'], ['Clic gauche', 'Tirer · en mode tactique : sélectionner, cliquer-glisser pour un cadre'], ['Clic droit', 'Ordonner à la sélection, ou à toute la flotte : aller ici, ou attaquer la cible'], ['Maj + clic droit', 'Ajouter un point de passage à la file d\'ordres'], ['1 à 5 · Maj+1 à 5', 'Sélectionner · assigner un groupe'], ['Molette', 'Zoom'], ['Échap', 'Annuler, fermer, pause']];
  for (const a in ACTIONS) rows.push([keyOf(a) ? keyLabel(a) : '—', ACTIONS[a].n]);
  rows.push(['Vue d\'expédition', 'Échap : retour à la base · Espace : suivre l\'escouade · Tab ou 1 à 9 : suivre un robot · glisser ou ZQSD : déplacer la vue · molette : zoom · R deux fois : rappeler']);
  $('#helpKeys').innerHTML = rows.map(([k, t]) => `<kbd>${esc(k)}</kbd><span>${esc(t)}</span>`).join('');
}

// ================= ACTIONS SUPPLÉMENTAIRES =================
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  switch (act) {
    case 'region': if (regionUnlocked(+id)) { save.region = +id; save.active = []; writeSave(); SFX.play('ui', 1); renderHub(); } else { toast('Région verrouillée.'); SFX.play('deny', 1); } break;
    case 'contract': { const cid = +id; if (save.active.includes(cid)) save.active = save.active.filter(x => x !== cid); else if (save.active.length < 2) save.active.push(cid); else { toast('Deux contrats au maximum par raid.'); SFX.play('deny', 1); break; } writeSave(); SFX.play('ui', 1); renderHub(); break; }
    case 'reroll': if (save.res.data >= 8) { save.res.data -= 8; const ri = save.region || 0; save.offers[ri] = save.offers[ri].filter(c => save.active.includes(c.id)); refillOffers(); writeSave(); SFX.play('ui', 1); renderHub(); } break;
    case 'rsel': { rSel = id; document.querySelectorAll('.rnode.sel').forEach(n => n.classList.remove('sel')); el.classList.add('sel'); $('#rdetail').innerHTML = researchDetail(id); SFX.play('ui', .6); break; }
    case 'settings': openSettings(); break;
    case 'closesettings': closeSettings(); break;
    case 'set': { const k = el.dataset.k, raw = el.dataset.v; if (k === 'fx' || k === 'fps30') { fxAuto = null; if (resScale !== 1) { resScale = 1; resize(); } } settings[k] = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw; saveSettings(); applyColors(); applyTouch(); applyUiScale(); SFX.init(); SFX.applyVolumes(); renderSettings(); if (drawerOpen) renderHub();
      if (k === 'vSfx' || k === 'vol') setTimeout(() => SFX.play('pistol', .8), 60); else if (k === 'haptics' && settings.haptics) { const t = TOUCH.on; TOUCH.on = true; buzz(40); TOUCH.on = t; } break; }
    case 'sndtest': SFX.init(); SFX.play('explo', 1, undefined, undefined, { size: 2 }); setTimeout(() => SFX.play('cannon', .9, undefined, undefined, { size: 2 }), 700); break;
    case 'account': openAccount(); break;
    case 'lmode': LIVE.wantMode = id === 'pvp' ? 'pvp' : 'coop'; LIVE.refresh(); break;
    case 'lmax': LIVE.wantMax = +id || 4; LIVE.refresh(); break;
    case 'lcreate': LIVE.create(); break;
    case 'ljoin': LIVE.join(id); break;
    case 'lleave': LIVE.leave(); break;
    case 'lstart': LIVE.start(); break;
    case 'lchat': { const ci = $('#liveChat'); if (ci) { LIVE.say(ci.value); ci.value = ''; ci.focus(); } break; }
    case 'accclose': showOverlay('account', false); break;
    case 'acctab': accTab = id; renderAccount(); break;
    case 'acclogout': showOverlay('account', false); accSignOut(); break;
    case 'accsync': cloudPush(true).then(() => renderAccount()); break;
    case 'accgo': {
      const srv = ($('#accSrv') || {}).value || '', name = (($('#accName') || {}).value || '').trim(), pass = ($('#accPass') || {}).value || '', p2 = $('#accPass2'), imp = $('#accImport');
      if (name.length < 3) { renderAccount('Identifiant trop court (3 caractères au moins).'); break; }
      if (pass.length < 6) { renderAccount('Mot de passe trop court (6 caractères au moins).'); break; }
      if (p2 && p2.value !== pass) { renderAccount('Les deux mots de passe ne correspondent pas.'); break; }
      el.disabled = true; el.textContent = 'Connexion…';
      accSignIn(srv, name, pass, accTab === 'create', !!(imp && imp.checked)).then(r => { showOverlay('account', false); toast('Bienvenue, ' + r.name + ' : votre partie est enregistrée sur le serveur.'); })
        .catch(e => { renderAccount(e.message.charAt(0).toUpperCase() + e.message.slice(1) + '.'); const f = $('#accSrv'); if (f) f.value = srv; const n = $('#accName'); if (n) n.value = name; });
      break;
    }
    case 'netretry': netInit(); break;
    case 'portraitok': TOUCH.portraitOk = true; showOverlay('rotate', false); break;
    case 'rebind': rebinding = id; renderSettings(); break;
    case 'resetkeys': settings.keys = {}; saveSettings(); renderSettings(); break;
  }
}, true);

// ================= INTERFACE : DÉCOUVERTE PROGRESSIVE =================
// On voit ce qu'on possède, et le prochain pas en silhouette avec sa condition. Le reste est caché, avec un compteur.
const rReqs = r => [r.req, ...(r.req2 || [])].filter(Boolean);
const rReqsDone = r => rReqs(r).every(has);
const rBldOk = r => !r.bld || bLevel(r.bld[0]) >= r.bld[1];
const rGateOk = r => (r.lab || 1) <= labLevel() && rBldOk(r);
const rCan = r => !!r && !has(r.id) && rReqsDone(r) && rGateOk(r) && canAfford(r.cost);
const rNear = r => !!r && rReqsDone(r) && (r.lab || 1) <= labLevel() + 1 && (!r.bld || bLevel(r.bld[0]) >= r.bld[1] - 1);
// 'done' acquis · 'full' prochain pas (nom et coût visibles) · 'shadow' un pas plus loin (silhouette) · null caché
function rVis(r) {
  if (!r) return null;
  if (RT_BASE[r.id] || has(r.id)) return 'done';
  if (rNear(r)) return 'full';
  if (rReqs(r).every(id => has(id) || rNear(RESEARCH_BY_ID[id]))) return 'shadow';
  return null;
}
function rState(r) { if (RT_BASE[r.id] || has(r.id)) return 'done'; if (!rReqsDone(r) || !rGateOk(r)) return 'locked'; return canAfford(r.cost) ? 'ready' : 'avail'; }
const bldName = b => b[0] === 'shipyard' ? 'Chantier titanesque niveau ' + b[1] : BUILD[b[0]].n + ' niveau ' + b[1];
function rGateTxt(r) {
  const miss = rReqs(r).filter(id => !has(id));
  if (miss.length) return 'Après ' + miss.map(id => RESEARCH_BY_ID[id].n).join(' et ');
  if ((r.lab || 1) > labLevel()) return 'Laboratoire niveau ' + r.lab + ' requis';
  if (!rBldOk(r)) return bldName(r.bld) + ' requis';
  return '';
}
// châssis, armes, modules : possédés, ou visibles en silhouette quand leur recherche est le prochain pas
function chVis(k) { if (chassisUnlocked(k)) return 'own'; return rVis(RESEARCH_BY_ID['c_' + k]) === 'full' ? 'shadow' : null; }
function wVis(k) { if (weaponUnlocked(k)) return 'own'; return rVis(RESEARCH_BY_ID['w_' + k]) === 'full' ? 'shadow' : null; }
function mVis(k) { if (moduleUnlocked(k)) return 'own'; return rVis(RESEARCH_BY_ID['m_' + k]) === 'full' ? 'shadow' : null; }
function bLimitAt(type, hq) { return (BLIMIT[type] || [1])[hq - 1] || 0; }
function bVis(k) {
  if (bLimit(k) > 0 || countType(k) > 0) return 'own';
  for (let h = hqLevel() + 1; h <= Math.min(5, hqLevel() + 1); h++) if (bLimitAt(k, h) > 0) return 'shadow';
  return null;
}
const bNextHq = k => { for (let h = hqLevel() + 1; h <= 5; h++) if (bLimitAt(k, h) > 0) return h; return 0; };
function regionVis(i) { if (regionUnlocked(i)) return 'own'; for (let j = 0; j < REGIONS.length; j++) if (!regionUnlocked(j)) return j === i ? 'shadow' : null; return null; }
function diffOwn(i) {
  if (i <= 1 || save.diff >= i) return true;
  const boss = (save.bossKills || []).some(n => n > 0);
  return i === 2 ? (save.stats.extract >= 2 || boss) : boss;
}
function diffVis(i) { if (diffOwn(i)) return 'own'; for (let j = 0; j < DIFFS.length; j++) if (!diffOwn(j)) return j === i ? 'shadow' : null; return null; }
function tabVis(t) {
  if (TUT.on) return t !== 'online' && t !== 'expe';
  if (t === 'expe') return bLevel('expedition') > 0 || (save.exps || []).length > 0;
  if (t === 'online') return save.stats.extract >= 1 || ACC.mode === 'server' || !!LIVE.room || !!LIVE.game;
  return true;
}
// ressources : les plus rares n'apparaissent qu'une fois obtenues
const RES_BASIC = ['scrap', 'alloy', 'circuits', 'data'];
function resVis(k) {
  if (RES_BASIC.includes(k) || (save.res[k] || 0) > 0) return true;
  const U = save.ui || {}; return !!(U.res && U.res[k]);
}
function resNote() { const U = uiState(); U.res = U.res || {}; for (const k of RES_KEYS) if ((save.res[k] || 0) > 0) U.res[k] = 1; }

// ---------- nouveautés : badges sur les onglets et les éléments ----------
let uiPending = new Set(), uiPendTab = null;
function uiState() { if (!save.ui || typeof save.ui !== 'object') save.ui = {}; if (!save.ui.seen) save.ui.seen = {}; return save.ui; }
function uiKeys() {
  const o = { construire: [], atelier: [], recherche: [], raid: [], expe: [], online: [], hangar: [] };
  for (const k of BUILD_KEYS) if (bLimit(k) > 0) o.construire.push('b:' + k);
  for (const k of CHASSIS_KEYS) if (chassisUnlocked(k)) o.atelier.push('c:' + k);
  for (const k of CRAFT_WEAPONS) if (weaponUnlocked(k)) o.atelier.push('w:' + k);
  for (const k of MODULE_KEYS) if (moduleUnlocked(k)) o.atelier.push('m:' + k);
  for (const r of RESEARCH) if (!has(r.id) && rVis(r) === 'full' && rReqsDone(r) && rGateOk(r)) o.recherche.push('r:' + r.id);
  REGIONS.forEach((R, i) => { if (regionUnlocked(i)) o.raid.push('g:' + i); });
  DIFFS.forEach((D, i) => { if (diffOwn(i)) o.raid.push('d:' + i); });
  for (const k of Object.keys(PWEAPONS)) if (pweaponUnlocked(k)) o.raid.push('p:' + k);
  if (tabVis('expe')) o.expe.push('t:expe');
  if (tabVis('online')) o.online.push('t:online');
  return o;
}
function uiInit() {
  const U = uiState();
  if (!U.v17) { U.v17 = 1; const K = uiKeys(); for (const t in K) for (const k of K[t]) U.seen[k] = 1; resNote(); }
}
const isNew = k => !TUT.on && !uiState().seen[k];
function uiMark(k) { if (isNew(k)) uiPending.add(k); return isNew(k); }
function uiCommit() { if (!uiPending.size) return; const S = uiState().seen; for (const k of uiPending) S[k] = 1; uiPending.clear(); }
function uiCounts() {
  if (TUT.on) return {};
  uiInit(); const K = uiKeys(), S = uiState().seen, out = {};
  for (const t in K) out[t] = K[t].filter(k => !S[k] && !(uiPendTab === t && uiPending.has(k))).length;
  return out;
}
const NAV_N = { construire: '01', atelier: '02', hangar: '03', recherche: '04', raid: '05', expe: '06', online: '07' };
function updateNav() {
  const C = uiCounts();
  document.querySelectorAll('#hubNav [data-tab]').forEach(b => {
    const t = b.dataset.tab, show = tabVis(t) || hubTab === t;
    b.style.display = show ? '' : 'none';
    if (!b.querySelector('.nv-k')) { const lbl = b.textContent; b.innerHTML = `<span class="nv-k">${NAV_N[t] || ''}</span><span class="nv-t">${lbl}</span><span class="nbadge" hidden></span>`; }
    const bd = b.querySelector('.nbadge'), n = hubTab === t ? 0 : C[t] || 0; bd.hidden = !n; bd.textContent = n;
  });
  document.querySelectorAll('#baseBar [data-act=opentab]').forEach(b => {
    const t = b.dataset.id; b.style.display = tabVis(t) ? '' : 'none';
    let bd = b.querySelector('.nbadge'); if (!bd) { bd = document.createElement('span'); bd.className = 'nbadge'; b.appendChild(bd); }
    const n = C[t] || 0; bd.hidden = !n; bd.textContent = n;
  });
  const tb = document.querySelector('[data-tk=base]'); if (tb) { let bd = tb.querySelector('.nbadge'); if (!bd) { bd = document.createElement('span'); bd.className = 'nbadge'; tb.appendChild(bd); } const n = Object.values(C).reduce((s, v) => s + v, 0); bd.hidden = !n; bd.textContent = n; }
}
const newTag = on => on ? '<span class="newtag">Nouveau</span>' : '';

// ================= ARBRE DE RECHERCHE INTERACTIF =================
const RT = { br: 'ch', view: {}, sel: null, hover: null, drag: null, dragged: false, pts: new Map(), pinch: null, lay: null };
const RT_BANDS = ['Départ', 'Labo 1', 'Labo 2', 'Labo 3', 'Labo 4', 'Labo 5', 'Chantier I', 'Chantier II', 'Chantier III'];
const RT_NW = 176, RT_NH = 56, RT_CW = 200, RT_RH = 66, RT_LH = 34, RT_TOP = 30;
const rtNode = id => RT_BASE[id] ? Object.assign({ id, base: true }, RT_BASE[id]) : RESEARCH_BY_ID[id];
const rtBand = n => n.base ? 0 : n.bld && n.bld[0] === 'shipyard' ? 5 + n.bld[1] : (n.lab || 1);
const rtParents = n => n.base ? [] : rReqs(n).length ? rReqs(n) : RT_ROOT[n.id] ? [RT_ROOT[n.id]] : [];
function rtBranchOf(id) { for (const B of RT_BRANCHES) for (const f of B.fam) if (f.ids.includes(id)) return B.id; return 'ch'; }
function rtLayout(brId) {
  const B = RT_BRANCHES.find(b => b.id === brId) || RT_BRANCHES[0], fam = {}, order = [];
  B.fam.forEach((f, fi) => f.ids.forEach(id => { if (rtNode(id)) { fam[id] = fi; order.push(id); } }));
  const sub = {};
  const subOf = id => { if (sub[id] !== undefined) return sub[id]; sub[id] = 0; const n = rtNode(id), b = rtBand(n); let s = 0; for (const p of rtParents(n)) { const pn = rtNode(p); if (pn && fam[p] !== undefined && rtBand(pn) === b) s = Math.max(s, subOf(p) + 1); } return sub[id] = s; };
  const bw = Array(RT_BANDS.length).fill(0);
  for (const id of order) { const b = rtBand(rtNode(id)); bw[b] = Math.max(bw[b], subOf(id) + 1); }
  const bx = []; let x = 24;
  for (let b = 0; b < bw.length; b++) { bx[b] = x; x += bw[b] * RT_CW + (bw[b] ? 18 : 0); }
  const colOf = id => { const b = rtBand(rtNode(id)); return bx[b] + sub[id] * RT_CW; };
  // rangées : chaque nœud s'aligne sur son parent de même famille quand la place est libre
  const pos = {}, lanes = []; let y = RT_TOP;
  B.fam.forEach((f, fi) => {
    const ids = order.filter(id => fam[id] === fi).sort((a, b2) => colOf(a) - colOf(b2) || order.indexOf(a) - order.indexOf(b2));
    const occ = new Map(); let rows = 1;
    for (const id of ids) {
      const cx = colOf(id), ps = rtParents(rtNode(id)).filter(p => pos[p] && fam[p] === fi);
      let want = ps.length ? pos[ps[0]].row : 0;
      const used = occ.get(cx) || new Set(); occ.set(cx, used);
      let row = want;
      for (let k = 0; k < 40; k++) { const c1 = want + Math.ceil(k / 2) * (k % 2 ? 1 : -1); if (c1 >= 0 && !used.has(c1)) { row = c1; break; } }
      used.add(row); rows = Math.max(rows, row + 1);
      pos[id] = { x: cx, row, lane: fi };
    }
    for (const id of ids) pos[id].y = y + RT_LH + pos[id].row * RT_RH;
    lanes.push({ f, y, h: RT_LH + rows * RT_RH + 6 }); y += RT_LH + rows * RT_RH + 6;
  });
  const bands = bw.map((w, b) => w ? { b, x: bx[b] - 9, w: w * RT_CW + 18 - 2 } : null).filter(Boolean);
  return { B, pos, lanes, bands, W: x + 20, H: y + 10, fam, order };
}
function rtBandOk(b) { if (b <= 0) return true; if (b <= 5) return labLevel() >= b; return bLevel('shipyard') >= b - 5; }
function rtBandTxt(b) { if (b === 0) return 'Départ'; if (b <= 5) return RT_BANDS[b] + (labLevel() >= b ? ' ✓' : ''); return RT_BANDS[b] + (bLevel('shipyard') >= b - 5 ? ' ✓' : ''); }
function rtVisOf(id) { const n = rtNode(id); return n.base ? 'done' : rVis(n); }
function rtStats(B) {
  let tot = 0, done = 0, ready = 0;
  for (const f of B.fam) for (const id of f.ids) { const n = rtNode(id); if (!n || n.base) continue; tot++; if (has(id)) done++; else if (rVis(n) === 'full' && rState(n) === 'ready') ready++; }
  return { tot, done, ready };
}
function renderResearch() {
  uiInit();
  if (!RT_BRANCHES.some(b => b.id === RT.br)) RT.br = 'ch';
  if (RT.sel && rtBranchOf(RT.sel) !== RT.br && !RT_BASE[RT.sel]) RT.sel = null;
  const L = labLevel(), lay = RT.lay = rtLayout(RT.br), P = lay.pos;
  const n = RESEARCH.length, nd = RESEARCH.filter(r => has(r.id)).length;
  const vis = {}; for (const id of lay.order) vis[id] = rtVisOf(id);
  let paths = '';
  for (const id of lay.order) {
    if (!vis[id]) continue;
    const nn = rtNode(id), b = P[id];
    rtParents(nn).forEach((p, k) => {
      if (!P[p] || !vis[p]) return; const a = P[p];
      const x1 = a.x + RT_NW, y1 = a.y + RT_NH / 2, x2 = b.x, y2 = b.y + RT_NH / 2, mx = (x1 + x2) / 2;
      const d = x2 > x1 + 4 ? `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}` : `M${a.x + RT_NW / 2} ${a.y + RT_NH} V${b.y}`;
      const cross = k > 0 || lay.fam[p] !== lay.fam[id];
      paths += `<path data-a="${p}" data-b="${id}" class="${vis[id] === 'done' ? 'done' : vis[id] === 'shadow' ? 'sh' : ''}${cross ? ' x' : ''}" d="${d}"/>`;
    });
  }
  const hiddenIn = f => f.ids.filter(id => rtNode(id) && !vis[id]).length;
  const nodes = lay.order.filter(id => vis[id]).map(id => {
    const nn = rtNode(id), p = P[id], v = vis[id];
    if (nn.base) return `<button class="rnode base done ${RT.sel === id ? 'sel' : ''}" style="left:${p.x}px;top:${p.y}px" data-act="rsel" data-id="${id}"><span class="ri">De base</span>${esc(nn.n)}<small>Disponible dès le départ</small></button>`;
    if (v === 'shadow') return `<button class="rnode shadow ${RT.sel === id ? 'sel' : ''}" style="left:${p.x}px;top:${p.y}px" data-act="rsel" data-id="${id}" aria-label="Technologie inconnue"><span class="ri">Inconnu</span>? ? ?<small>${esc(rGateTxt(nn) || 'Plus tard')}</small></button>`;
    const st = rState(nn), nw = st !== 'done' && st !== 'locked' && uiMark('r:' + id);
    const sm = st === 'done' ? 'Acquis' : st === 'locked' ? rGateTxt(nn) : Object.keys(nn.cost).map(k => fmt(nn.cost[k]) + ' ' + RES[k].n.split(' ')[0].toLowerCase()).join(' · ');
    const kind = id[0] === 'c' ? (CHASSIS[id.slice(2)] ? 'Rang ' + CHASSIS[id.slice(2)].tier : 'Châssis') : id[0] === 'w' ? (WEAPONS[id.slice(2)] ? WSIZE_N[WEAPONS[id.slice(2)].size] : 'Arme') : id[0] === 'm' ? 'Module' : id[0] === 'b' ? 'Cerveau' : id[0] === 'p' ? 'Arme du pilote' : 'Protocole';
    return `<button class="rnode ${st} ${RT.sel === id ? 'sel' : ''} ${nw ? 'isnew' : ''}" style="left:${p.x}px;top:${p.y}px" data-act="rsel" data-id="${id}" aria-label="${esc(nn.n)} : ${R_STATE_TXT[st]}"><span class="ri">${kind}</span>${esc(nn.n.replace(/^Châssis /, ''))}<small>${esc(sm)}</small>${newTag(nw)}</button>`;
  }).join('');
  const tabs = RT_BRANCHES.map(B => { const s = rtStats(B); return `<button class="rt-tab ${RT.br === B.id ? 'on' : ''}" data-act="rtbr" data-id="${B.id}"><b>${B.n}</b><small>${s.done} / ${s.tot} acquises${s.ready ? ` · <span class="rd">${s.ready} disponible${s.ready > 1 ? 's' : ''}</span>` : ''}</small><span class="pg"><i style="width:${s.tot ? Math.round(s.done / s.tot * 100) : 0}%"></i></span></button>`; }).join('');
  return `<div class="phead"><h2 class="h2">Recherche</h2><div class="psum"><span>Laboratoire <b>${L || 0}</b></span>${bLevel('shipyard') ? `<span>Chantier titanesque <b>${bLevel('shipyard')}</b></span>` : ''}<span>Acquises <b>${nd} / ${n}</b></span><span>Données <b>${fmt(save.res.data)}</b></span></div></div>
  <p class="lead hint">Chaque famille progresse de gauche à droite. ${TOUCH.on ? 'Glissez pour parcourir, deux doigts pour zoomer' : 'Glissez pour parcourir, molette pour zoomer, survolez une technologie pour voir ses liens'}. Les silhouettes annoncent la suite.</p>
  <div class="rt-tabs">${tabs}</div>
  <div class="rlayout"><div class="rtree-wrap" id="rtreeWrap">
    <div class="rtree" id="rtCanvas" style="width:${lay.W}px;height:${lay.H}px">
      ${lay.bands.map(b => `<div class="rband ${rtBandOk(b.b) ? 'on' : 'off'}" style="left:${b.x}px;width:${b.w}px;height:${lay.H}px"><span>${rtBandTxt(b.b)}</span></div>`).join('')}
      ${lay.lanes.map(l => { const h = hiddenIn(l.f); return `<div class="rlane" style="top:${l.y}px;width:${lay.W}px;height:${l.h}px"><span>${esc(l.f.n)}${h ? `<em>+${h} inconnue${h > 1 ? 's' : ''}</em>` : ''}</span></div>`; }).join('')}
      <svg class="rlinks" width="${lay.W}" height="${lay.H}" aria-hidden="true">${paths}</svg>
      ${nodes}
    </div>
    <div class="rt-legend"><span><i style="background:#173029;border-color:#6fe3c8"></i>Acquis</span><span><i style="border-color:#f2c14e"></i>Disponible</span><span><i style="border-color:#e2622b"></i>Ressources manquantes</span><span><i style="border-style:dashed"></i>Verrouillé</span><span><i style="background:#10161a;border-style:dashed"></i>Inconnu</span></div>
    <div class="rt-tools"><button class="btn sm" data-act="rtzoom" data-id="out" aria-label="Dézoomer">−</button><button class="btn sm" data-act="rtzoom" data-id="in" aria-label="Zoomer">+</button><button class="btn sm" data-act="rtfit">Vue d'ensemble</button><button class="btn sm" data-act="rtnext">Disponibles</button></div>
  </div>
  <aside class="rdetail" id="rdetail">${researchDetail(RT.sel)}</aside></div>`;
}
function rtLineage(id) {
  const lay = RT.lay; if (!lay || !lay.pos[id]) return new Set([id]);
  const out = new Set([id]), up = [id];
  while (up.length) { const x = up.pop(); for (const p of rtParents(rtNode(x))) if (lay.pos[p] && !out.has(p)) { out.add(p); up.push(p); } }
  const down = [id];
  while (down.length) { const x = down.pop(); for (const c of lay.order) if (!out.has(c) && rtParents(rtNode(c)).includes(x)) { out.add(c); down.push(c); } }
  return out;
}
function rtHighlight(id) {
  const tree = $('#rtCanvas'); if (!tree) return;
  const set = id ? rtLineage(id) : null;
  tree.classList.toggle('focus', !!set);
  tree.querySelectorAll('.rnode').forEach(n => n.classList.toggle('hl', !!set && set.has(n.dataset.id)));
  tree.querySelectorAll('.rlinks path').forEach(p => p.classList.toggle('hl', !!set && set.has(p.dataset.a) && set.has(p.dataset.b)));
}
function rtView() {
  const w = $('#rtreeWrap'), lay = RT.lay; if (!w || !lay) return null;
  let V = RT.view[RT.br];
  if (!V) {
    const vw = w.clientWidth || 800, vh = w.clientHeight || 500, z = clamp(Math.min(vw / lay.W, vh / lay.H, 1), .82, 1); V = RT.view[RT.br] = { x: 0, y: 0, z };
    // première visite de la branche : on ouvre sur la frontière (ce qui reste à rechercher le plus à gauche)
    let fx = Infinity; for (const id of lay.order) { const nn = rtNode(id); if (!nn.base && !has(id) && rVis(nn) === 'full') fx = Math.min(fx, lay.pos[id].x); }
    if (fx < Infinity) V.x = Math.min(0, vw * .28 - fx * z);
  }
  return V;
}
function rtApply() {
  const w = $('#rtreeWrap'), c = $('#rtCanvas'), V = rtView(); if (!w || !c || !V) return;
  const lay = RT.lay, vw = w.clientWidth, vh = w.clientHeight;
  V.x = clamp(V.x, Math.min(0, vw - lay.W * V.z - 60), 60); V.y = clamp(V.y, Math.min(0, vh - lay.H * V.z - 60), 60);
  c.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.z})`;
}
function rtZoomAt(f, mx, my) { const V = rtView(); if (!V) return; const z2 = clamp(V.z * f, .3, 1.6); V.x = mx - (mx - V.x) * z2 / V.z; V.y = my - (my - V.y) * z2 / V.z; V.z = z2; rtApply(); }
function rtFocus(id, smooth) {
  const w = $('#rtreeWrap'), V = rtView(), p = RT.lay && RT.lay.pos[id]; if (!w || !V || !p) return;
  const vw = w.clientWidth, vh = w.clientHeight, sx = p.x * V.z + V.x, sy = p.y * V.z + V.y;
  if (sx > 20 && sx + RT_NW * V.z < vw - 20 && sy > 20 && sy + RT_NH * V.z < vh - 20) return;
  V.x = vw / 2 - (p.x + RT_NW / 2) * V.z; V.y = vh / 2 - (p.y + RT_NH / 2) * V.z;
  const c = $('#rtCanvas'); if (c && smooth) { c.style.transition = 'transform .35s ease'; setTimeout(() => { c.style.transition = ''; }, 380); }
  rtApply();
}
function rtBind() {
  const w = $('#rtreeWrap'); if (!w || w.dataset.bound) return; w.dataset.bound = '1';
  rtApply();
  const rel = e => { const r = w.getBoundingClientRect(), k = uiScale(); return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; };
  w.addEventListener('pointerdown', e => {
    if (e.target.closest('.rt-tools,.rt-legend')) return;
    const p = rel(e); RT.pts.set(e.pointerId, p);
    if (RT.pts.size === 2) { const [a, b] = [...RT.pts.values()], V = rtView(); RT.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: V.z, x0: V.x, y0: V.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; RT.drag = null; return; }
    const V = rtView(); RT.drag = { x: p.x, y: p.y, vx: V.x, vy: V.y, moved: false }; RT.dragged = false;
  });
  w.addEventListener('pointermove', e => {
    if (RT.pts.has(e.pointerId)) RT.pts.set(e.pointerId, rel(e));
    const V = rtView(); if (!V) return;
    if (RT.pinch && RT.pts.size >= 2) { const [a, b] = [...RT.pts.values()], P2 = RT.pinch, z2 = clamp(P2.z0 * Math.hypot(a.x - b.x, a.y - b.y) / P2.d0, .3, 1.6); V.x = P2.mx - (P2.mx - P2.x0) * z2 / P2.z0; V.y = P2.my - (P2.my - P2.y0) * z2 / P2.z0; V.z = z2; RT.dragged = true; rtApply(); return; }
    const d = RT.drag; if (!d) return; const p = rel(e);
    if (!d.moved && Math.abs(p.x - d.x) + Math.abs(p.y - d.y) > 6) { d.moved = true; RT.dragged = true; w.classList.add('drag'); try { w.setPointerCapture(e.pointerId); } catch (er) { } }
    if (d.moved) { V.x = d.vx + p.x - d.x; V.y = d.vy + p.y - d.y; rtApply(); }
  });
  const up = e => { RT.pts.delete(e.pointerId); if (RT.pts.size < 2) RT.pinch = null; if (RT.drag) { RT.drag = null; w.classList.remove('drag'); } };
  w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  w.addEventListener('wheel', e => { e.preventDefault(); const p = rel(e); rtZoomAt(e.deltaY > 0 ? .88 : 1.14, p.x, p.y); }, { passive: false });
  w.addEventListener('mouseover', e => { const n = e.target.closest('.rnode'); if (n && n.dataset.id !== RT.hover) { RT.hover = n.dataset.id; rtHighlight(RT.hover); } });
  w.addEventListener('mouseleave', () => { RT.hover = null; rtHighlight(RT.sel); });
  rtHighlight(RT.sel);
}
// un glisser sur l'arbre ne doit pas valoir un clic sur un nœud
window.addEventListener('click', e => { if (RT.dragged && e.target.closest && e.target.closest('#rtreeWrap')) { RT.dragged = false; e.stopPropagation(); e.preventDefault(); } }, true);
function researchDetail(id) {
  const nn = id ? rtNode(id) : null;
  if (!nn) return `<div class="rk">Laboratoire</div><h4>Choisissez une technologie</h4><p class="desc">Cliquez sur un nœud pour voir ce qu'il débloque, ses conditions et son coût. Les nœuds à bord ambré sont disponibles tout de suite.</p>
    <p class="desc">Les données viennent des archives, des pillards, des pylônes relais et du centre de données de la base.</p>`;
  const v = nn.base ? 'done' : rVis(nn), chk = (ok, t) => `<li class="${ok ? '' : 'no'}">${t}</li>`;
  const kids = RESEARCH.filter(r => rtParents(r).includes(id));
  const kidsHtml = kids.length ? `<div class="slot-h" style="margin:4px 0 0">Ouvre la voie à</div><div class="nexts">${kids.map(r => { const kv = rVis(r); return kv === 'done' || kv === 'full' ? `<span data-act="rsel" data-id="${r.id}">${esc(r.n.replace(/^Châssis /, ''))}</span>` : kv === 'shadow' ? `<span data-act="rsel" data-id="${r.id}">? ? ?</span>` : ''; }).join('')}${kids.some(r => !rVis(r)) ? `<span style="cursor:default">+${kids.filter(r => !rVis(r)).length} inconnue${kids.filter(r => !rVis(r)).length > 1 ? 's' : ''}</span>` : ''}</div>` : '';
  if (v === 'shadow') return `<div class="rk">Inconnu</div><h4>Technologie inconnue</h4><canvas id="rdCv" data-sil="1"></canvas><p class="desc">Elle se révèlera quand vous serez assez proche.</p><ul class="cond">${rReqs(nn).map(q => chk(has(q), esc(RESEARCH_BY_ID[q].n))).join('')}${(nn.lab || 1) > labLevel() ? chk(false, 'Laboratoire niveau ' + nn.lab) : ''}${nn.bld && !rBldOk(nn) ? chk(false, bldName(nn.bld)) : ''}</ul>`;
  const ref = nn.ch || (id.startsWith('c_') ? id.slice(2) : null), wref = nn.w || (id.startsWith('w_') ? id.slice(2) : null);
  let info = '';
  if (ref && CHASSIS[ref]) { const C = CHASSIS[ref]; info = `<canvas id="rdCv"></canvas><div class="kv"><span>Rang</span><b>T${C.tier}</b><span>Affûts</span><b>${C.slots} × ${WSIZE_N[C.wsize].toLowerCase()}</b><span>Points de vie</span><b>${fmt(C.hp)}</b><span>Soute</span><b>${C.cargo} kg</b><span>Commandement</span><b>${fmtCmd(C.cmd)}</b>${C.fly ? '<span>Déplacement</span><b>vol</b>' : ''}${C.fab ? `<span>Fabrique</span><b>rang ${C.fab.tier} au plus</b>` : ''}</div>`; }
  else if (wref && WEAPONS[wref]) { const W_ = WEAPONS[wref]; info = `<canvas id="rdCv" style="height:110px"></canvas><div class="kv"><span>Taille</span><b>${WSIZE_N[W_.size]}</b><span>Puissance</span><b>${esc(weaponStat(wref))}</b><span>Rôle</span><b>${isSupportW(wref) ? 'soutien' : W_ROLE_TXT[wRole(W_)] || '—'}</b></div>`; }
  const head = `<div class="rk">${nn.base ? 'De base' : esc(nn.cat || '')}${nn.lab && !nn.base ? ' · labo ' + nn.lab : ''}${nn.bld ? ' · chantier ' + nn.bld[1] : ''}</div><h4>${esc(nn.n)}</h4>${info}<p class="desc">${nn.d || ''}</p>`;
  if (nn.base) return head + kidsHtml;
  const st = rState(nn);
  if (st === 'done') return head + '<p class="good"><b>Acquis</b></p>' + kidsHtml;
  const conds = rReqs(nn).map(q => chk(has(q), 'Après ' + esc(RESEARCH_BY_ID[q].n))).join('') + chk((nn.lab || 1) <= labLevel(), 'Laboratoire niveau ' + (nn.lab || 1)) + (nn.bld ? chk(rBldOk(nn), bldName(nn.bld)) : '');
  return head + `<div class="slot-h" style="margin:4px 0 0">Conditions</div><ul class="cond">${conds}</ul><div class="slot-h" style="margin:4px 0 0">Coût</div><div class="cost">${costHtml(nn.cost)}</div>
    <div><button class="btn ${st === 'ready' ? 'hot' : ''}" data-act="research" data-id="${nn.id}" ${st === 'ready' ? '' : 'disabled'}>Rechercher</button></div>` + kidsHtml;
}
function rtDrawDetail() {
  const cv2 = $('#rdCv'); if (!cv2) return; const nn = RT.sel ? rtNode(RT.sel) : null; if (!nn) return;
  const ref = nn.ch || (nn.id.startsWith('c_') ? nn.id.slice(2) : null), wref = nn.w || (nn.id.startsWith('w_') ? nn.id.slice(2) : null), sil = cv2.dataset.sil === '1';
  if (ref && CHASSIS[ref]) { const al = CRAFT_WEAPONS.filter(w => WEAPONS[w].size <= CHASSIS[ref].wsize && weaponUnlocked(w)); drawRobotPreview(cv2, ref, MOUNTS[ref].map((_, i) => al[Math.min(i, al.length - 1)] || 'mg'), 0, { fill: .4, sil }); }
  else if (wref && WEAPONS[wref]) drawWeaponIcon(cv2, wref, sil);
  else { const c = cv2.getContext('2d'); cv2.width = cv2.clientWidth; cv2.height = cv2.clientHeight; c.fillStyle = '#0b1011'; c.fillRect(0, 0, cv2.width, cv2.height); c.fillStyle = 'rgba(165,156,136,.4)'; c.font = `700 40px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', cv2.width / 2, cv2.height / 2); }
}
function rDoneTxt(r) {
  const id = r.id, k = id.slice(2);
  if (id.startsWith('c_') && CHASSIS[k]) return r.n + ' : recherche terminée. Nouveau châssis à la forge.';
  if (id.startsWith('w_') && WEAPONS[k]) return r.n + ' : recherche terminée. Nouvelle arme à la forge.';
  if (id.startsWith('m_')) return r.n + ' : recherche terminée. Nouveau module à la forge.';
  const nx = RESEARCH.filter(q => rReqs(q).includes(id) && rVis(q) === 'full').length;
  return r.n + ' : recherche terminée.' + (nx ? ' ' + nx + ' nouvelle' + (nx > 1 ? 's' : '') + ' piste' + (nx > 1 ? 's' : '') + ' dans l\'arbre.' : '');
}

// ================= APERÇUS : ROBOTS ET ARMES =================
function drawRobotPreview(cv, chassis, weapons, t, opts = {}) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.clientWidth || cv.width, h = cv.clientHeight || cv.height;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  const ch = CHASSIS[chassis]; if (!ch) return null; const r = ch.r;
  const ext = { ant: 1.5, crawler: 1.35, drone: 1.3, scout: 1.1, mule: 1.05, sentry: 1.05, gunship: 1.4, strider: 1.3, spider: 1.25, rhino: 1.4, goliath: 1.15, reaper: 1.1, airship: 1.1, titan: 1.05, behemoth: 1.35, colossus: 1.05, arche: 1.2 }[chassis] || PREV_EXT[chassis] || 1.2;
  const sc = Math.min(w, h) * (opts.fill || .3) / (r * ext);
  if (groundAtlas && !opts.sil) {
    const ts = TILE * clamp(sc, .7, 1.5), ox = (w / 2) % ts - ts, oy = (h / 2) % ts - ts;
    for (let y = oy, j = 0; y < h; y += ts, j++) for (let x = ox, i = 0; x < w; x += ts, i++) {
      const v = (((Math.sin(i * .9) + Math.cos(j * .7) + 2) * 1.2) | 0) * 2 + ((i * 7 + j * 13) & 1);
      c.drawImage(groundAtlas, clamp(v, 0, 7) * TILE, 0, TILE, TILE, x, y, ts + .5, ts + .5);
    }
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  } else { c.fillStyle = '#0b1011'; c.fillRect(0, 0, w, h); }
  c.save(); c.translate(w / 2, h / 2); c.scale(sc, sc);
  const ang = opts.ang !== undefined ? opts.ang : opts.spin ? t * .35 : -Math.PI / 2 + .5;
  c.rotate(ang);
  if (!opts.sil) { c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(r * .12, r * .2, r * 1.05, r * .95, 0, 0, TAU); c.fill(); }
  const P = PAL.ally; const fake = { cargoW: 3, cargoMax: 6 };
  const sv = parts.length;
  paintChassis(c, chassis, r, P, t * (opts.anim ? 1 : 0), opts.anim ? .6 : 0, fake);
  const ms = MOUNTS[chassis];
  weapons.forEach((wid, i) => {
    if (!wid || !ms[i] || !WEAPONS[wid]) return; c.save(); c.translate(ms[i][0] * r, ms[i][1] * r);
    c.rotate(opts.anim ? Math.sin(t * .8 + i) * .5 : 0);
    paintMount(c, wid, MSCALE[chassis], P, 0, t, null); c.restore();
  });
  c.restore(); parts.length = sv;
  if (opts.sil) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(30,40,44,.96)'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(165,156,136,.55)'; c.font = `700 ${Math.round(Math.min(w, h) * .28)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2); }
  // positions des affûts à l'écran (forge : marqueurs cliquables)
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return ms.map(([mx, my]) => ({ x: w / 2 + (mx * r * ca - my * r * sa) * sc, y: h / 2 + (mx * r * sa + my * r * ca) * sc }));
}
function drawWeaponIcon(cv, wid, sil) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 38, h = cv.clientHeight || 38;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0b1011'; c.fillRect(0, 0, w, h);
  const W_ = WEAPONS[wid]; if (!W_) return;
  const sz = W_.size || 1, s = Math.min(w, h) / (22 + sz * 7);
  c.save(); c.translate(w / 2, h * .6); c.rotate(-Math.PI / 2); c.scale(s * 2.5, s * 2.5);
  const sv = parts.length; try { paintMount(c, wid, 1, PAL.ally, 0, 0, null); } catch (er) { } parts.length = sv; c.restore();
  if (sil) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(30,40,44,.96)'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(165,156,136,.6)'; c.font = `700 ${Math.round(h * .45)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2 + 1); }
}

// ================= FORGE INTERACTIVE =================
const FGS = { fam: 'all', ang: -Math.PI / 2 + .5, dragT: -1e9, drag: null, marks: [], alt: null, role: 'all', last: 0, hoverMark: -1 };
const FG_FAMS = [['all', 'Tous'], ['chenille', 'Chenillés'], ['marcheur', 'Marcheurs'], ['volant', 'Volants'], ['leger', 'Légers'], ['transport', 'Transport'], ['geant', 'Géants']];
const FG_ROLES = [['all', 'Toutes'], ['light', 'Anti-infanterie'], ['heavy', 'Antiblindé'], ['aa', 'Antiaérien'], ['art', 'Artillerie'], ['titan', 'Anti-géant'], ['melee', 'Contact'], ['sup', 'Soutien']];
function chFam(k) {
  const id = k === 'crawler' ? 'x_crawler' : k === 'drone' ? 'x_drone' : 'c_' + k;
  const B = RT_BRANCHES[0]; for (const f of B.fam) if (f.ids.includes(id)) return f.id; return 'autres';
}
const wRoleOf = w => isSupportW(w) ? 'sup' : wRole(WEAPONS[w]);
function designStats(chassis, weapons, modules, RF) {
  const st = robotStats({ chassis, modules: (modules || []).filter(Boolean), xp: RF ? RF.xp : 0, traits: RF ? RF.traits : [] }), C = CHASSIS[chassis];
  const dps = weapons.reduce((s, id) => { const w = WEAPONS[id]; if (!w || (!w.dmg && !w.dps)) return s; return s + (w.dps || w.dmg * (w.pellets || 1) * (w.salvo || 1) * w.rate * (w.kind === 'flame' ? 2 : 1) * (w.strikes || 1)); }, 0) * st.dmg;
  const range = weapons.reduce((m, id) => { const w = WEAPONS[id]; return w && !isSupportW(id) && w.kind !== 'melee' ? Math.max(m, w.range || 0) : m; }, 0);
  return { hp: st.hp, armor: st.armor, spd: st.spd, cargo: st.cargo, dps, range, cmd: C.cmd };
}
const FG_ROWS = [['hp', 'Points de vie', v => fmt(v), 'log', 380000], ['armor', 'Blindage', v => Math.round(v * 100) + ' %', 'lin', .75], ['spd', 'Vitesse', v => Math.round(v), 'lin', 260], ['cargo', 'Soute', v => fmt(v) + ' kg', 'log', 2600], ['dps', 'Puissance', v => fmt(v) + ' dps', 'log', 40000], ['range', 'Portée', v => v ? fmt(v) + ' px' : 'contact', 'log', 6000], ['cmd', 'Commandement', v => fmtCmd(v), 'lin', 50]];
const fgPct = (v, kind, mx) => clamp(kind === 'log' ? Math.log(1 + Math.max(0, v)) / Math.log(1 + mx) : v / mx, 0, 1) * 100;
function fgStatsHTML() {
  return `<div class="fg-stats">${FG_ROWS.map(([k, lb]) => `<span class="lb">${lb}</span><span class="bv"><i class="gh" id="fgG-${k}"></i><i id="fgB-${k}"></i></span><span class="vl" id="fgV-${k}"></span>`).join('')}</div>`;
}
function fgUpdateStats() {
  const d = design, RF = d.refit ? save.robots.find(r => r.id === d.refit) : null;
  const S0 = designStats(d.chassis, d.weapons, d.modules, RF), A = FGS.alt, S1 = A ? designStats(A.chassis, A.weapons, A.modules || d.modules, RF) : null;
  for (const [k, , f, kind, mx] of FG_ROWS) {
    const b = $('#fgB-' + k), g = $('#fgG-' + k), v = $('#fgV-' + k); if (!b) continue;
    const p0 = fgPct(S0[k], kind, mx), p1 = S1 ? fgPct(S1[k], kind, mx) : p0;
    b.style.width = (S1 ? Math.min(p0, p1) : p0) + '%'; g.style.width = Math.max(p0, p1) + '%'; g.style.background = S1 && p1 < p0 ? 'rgba(236,107,116,.55)' : 'rgba(242,193,78,.55)';
    let dl = ''; if (S1) { const dv = S1[k] - S0[k]; if (Math.abs(dv) > 1e-6) dl = `<em class="${(k === 'cmd' ? -dv : dv) > 0 ? 'up' : 'dn'}">${dv > 0 ? '+' : '−'}${k === 'armor' ? Math.round(Math.abs(dv) * 100) + ' %' : k === 'cmd' ? fmtCmd(Math.abs(dv)) : fmt(Math.abs(dv))}</em>`; }
    v.innerHTML = f(S1 ? S1[k] : S0[k]) + dl;
  }
}
function fgSlotTxt(C) { const adj = ['', 'léger', 'moyen', 'lourd', 'titanesque', 'colossal', 'apocalyptique'][C.wsize]; return C.slots + ' affût' + (C.slots > 1 ? 's ' + adj + 's' : ' ' + adj); }
function renderForge() {
  uiInit(); fitDesign();
  const d = design, ch = CHASSIS[d.chassis], lock = chassisLock(d.chassis);
  const RF = d.refit ? save.robots.find(r => r.id === d.refit) : null; if (d.refit && !RF) d.refit = null;
  const cost = RF ? refitCost(RF, d) : robotCost(d.chassis, d.weapons, d.brain, d.modules);
  const room = hangarCap() - save.robots.length, qtyOk = Math.min(buildQty, room);
  const canBuild = RF ? canAfford(cost) : (!lock && room > 0 && canAfford(cost, qtyOk) && (cost.heart ? qtyOk === 1 : true));
  // --- châssis
  const visC = CHASSIS_KEYS.filter(k => chVis(k)), hidC = CHASSIS_KEYS.length - visC.length;
  const fams = FG_FAMS.filter(([f]) => f === 'all' || visC.some(k => f === 'geant' ? CHASSIS[k].tier >= 7 : chFam(k) === f));
  if (!fams.some(([f]) => f === FGS.fam)) FGS.fam = 'all';
  const inFam = k => FGS.fam === 'all' || (FGS.fam === 'geant' ? CHASSIS[k].tier >= 7 : chFam(k) === FGS.fam);
  const cards = visC.filter(inFam).map(k => {
    const C = CHASSIS[k], v = chVis(k);
    if (v === 'shadow') { const r = RESEARCH_BY_ID['c_' + k]; return `<button class="ch-item shadow" data-act="fgshadow" data-id="c_${k}" title="Voir dans la recherche"><canvas data-prev="${k}" data-sil="1"></canvas><span class="tier">T${C.tier}</span><div class="nm">${esc(C.n)}</div><div class="tr">À rechercher${r && (r.lab || 1) > labLevel() ? ' · labo ' + r.lab : ''}</div></button>`; }
    const lk = chassisLock(k), nw = uiMark('c:' + k);
    return `<button class="ch-item ${k === d.chassis ? 'on' : ''} ${lk ? 'locked' : ''} ${nw ? 'isnew' : ''}" data-act="chassis" data-id="${k}"><canvas data-prev="${k}"></canvas><span class="tier">T${C.tier}</span>${newTag(nw)}<div class="nm">${esc(C.n)}</div><div class="tr">${lk || fgSlotTxt(C) + ' · ' + fmtCmd(C.cmd) + ' cmd'}</div></button>`;
  }).join('') + (hidC && FGS.fam === 'all' ? `<div class="hidden-n" style="flex:none;width:156px">${hidC} châssis à découvrir</div>` : '');
  // --- affûts
  const many = ch.slots > 6;
  const slots = d.weapons.map((w, i) => `<button class="slot ${i === activeSlot ? 'on' : ''}" data-act="slot" data-slot="${i}"><span class="sn">${i + 1}</span><small>${WSIZE_N[WEAPONS[w].size].toLowerCase()}</small>${esc(WEAPONS[w].n)}</button>`).join('');
  // --- armurerie : tailles utilisables, filtre par rôle
  const sizes = [1, 2, 3, 4, 5, 6].filter(sz => sz <= ch.wsize);
  const roleOk = w => FGS.role === 'all' || wRoleOf(w) === FGS.role;
  const vw = CRAFT_WEAPONS.filter(w => wVis(w) && WEAPONS[w].size <= ch.wsize);
  const rolesHere = FG_ROLES.filter(([r]) => r === 'all' || vw.some(w => wVis(w) === 'own' && wRoleOf(w) === r));
  if (!rolesHere.some(([r]) => r === FGS.role)) FGS.role = 'all';
  const maxDps = Math.max(1, ...vw.map(w => wDps(WEAPONS[w])));
  const cats = sizes.map(sz => {
    const ws = CRAFT_WEAPONS.filter(w => WEAPONS[w].size === sz), shown = ws.filter(w => wVis(w) && roleOk(w)), hid = ws.filter(w => !wVis(w)).length;
    if (!shown.length && !hid) return '';
    const own = ws.filter(weaponUnlocked).length;
    return `<div class="cat-h">${WSIZE_PL[sz]} <span>${own} / ${ws.length} connues</span></div>
      <div class="armory">${shown.map(w => {
        const W_ = WEAPONS[w], v = wVis(w);
        if (v === 'shadow') return `<button class="wcard shadow" data-act="fgshadow" data-id="w_${w}" title="Voir dans la recherche"><canvas data-wicon="${w}" data-sil="1"></canvas><span class="nm">${esc(W_.n)}</span><span class="st">À rechercher</span></button>`;
        const nw = uiMark('w:' + w), dp = wDps(W_), rg = W_.range || 0;
        const bars = isSupportW(w) ? '' : `<span class="wb" title="Puissance relative">${[0, 1, 2, 3, 4].map(k => `<i class="${dp / maxDps > k / 5 + .001 ? 'f' : ''}"></i>`).join('')}</span>`;
        return `<button class="wcard ${d.weapons[activeSlot] === w ? 'on' : ''} ${nw ? 'isnew' : ''}" data-act="weapon" data-id="${w}" data-hw="${w}" title="${esc(W_.d || '')}"><canvas data-wicon="${w}"></canvas><span class="nm">${esc(W_.n)}</span><span class="st">${esc(weaponStat(w))}</span><span class="wl">${bars}<em>${isSupportW(w) ? 'soutien' : (W_ROLE_TXT[wRole(W_)] || '')}</em></span>${newTag(nw)}</button>`;
      }).join('')}${hid && FGS.role === 'all' ? `<div class="hidden-n">${hid} à découvrir</div>` : ''}</div>`;
  }).join('');
  const bigHidden = [5, 6].filter(sz => sz > ch.wsize && CRAFT_WEAPONS.some(w => WEAPONS[w].size === sz && wVis(w) === 'own')).length;
  // --- modules
  const ms = modSlots(d.chassis), mk = MODULE_KEYS.filter(k => mVis(k));
  const modsHtml = ms && mk.length ? `<div><div class="slot-h">Modules · ${ms} emplacement${ms > 1 ? 's' : ''}</div>
      <div class="slots">${d.modules.map((m, i) => `<button class="slot ${i === activeMod ? 'on' : ''}" data-act="modslot" data-slot="${i}"><span class="sn">${i + 1}</span><small>module</small>${m ? MODULES[m].n : 'Aucun'}</button>`).join('')}</div>
      <div class="armory" style="margin-top:6px"><button class="wcard ${!d.modules[activeMod] ? 'on' : ''}" data-act="mod" data-id="" style="grid-template-columns:1fr"><span class="nm">Aucun</span><span class="st">Libérer l'emplacement</span></button>${mk.map(k => { const M = MODULES[k], ok = moduleUnlocked(k); if (!ok) return `<button class="wcard shadow" data-act="fgshadow" data-id="m_${k}" style="grid-template-columns:1fr"><span class="nm">${M.n}</span><span class="st">À rechercher</span></button>`; const nw = uiMark('m:' + k); return `<button class="wcard ${d.modules[activeMod] === k ? 'on' : ''} ${nw ? 'isnew' : ''}" data-act="mod" data-id="${k}" title="${esc(M.d)}" style="grid-template-columns:1fr"><span class="nm">${M.n}${M.active ? ' · actif' : ''}</span><span class="st">${M.d}</span>${newTag(nw)}</button>`; }).join('')}</div></div>` : '';
  const brains = BRAIN_KEYS.filter(brainUnlocked);
  const perks = [];
  if (ch.fly) perks.push('<b>Vol</b> : ignore le terrain.'); else perks.push('<b>Écrase</b> : ' + CRUSH_TXT[ch.crush || 0].toLowerCase() + '.');
  if (ch.fab) perks.push(`<b>Fabrique en raid</b> des robots du rang ${ch.fab.tier} au plus, ${ch.fab.cap} à la fois.`);
  if (ch.perk === 'leap') perks.push('<b>Bond</b> : saute de lui-même sur ses proies.'); if (ch.perk === 'fortify') perks.push('<b>Carapace</b> : −25 % de dégâts à l\'arrêt.'); if (ch.perk === 'spikes') perks.push('<b>Pointes</b> : blesse au contact.'); if (ch.perk === 'range') perks.push('<b>Échasses</b> : +20 % de portée.');
  const sumParts = [`<span>Forge <b>${forgeLevel()}</b> · rangs jusqu'à <b>${forgeMaxTier()}</b></span>`];
  if (bLevel('shipyard')) sumParts.push(`<span>Chantier <b>${bLevel('shipyard')}</b> · géants jusqu'au rang <b>${6 + bLevel('shipyard')}</b></span>`);
  sumParts.push(`<span>Hangar <b>${save.robots.length} / ${hangarCap()}</b></span>`);
  return `<div class="phead"><h2 class="h2">${RF ? 'Réaménager · ' + esc(RF.name) : 'Forge'}</h2><div class="psum">${sumParts.join('')}</div></div>
  <p class="lead hint">${RF ? `${RANKS[rankOf(RF.chassis, RF.xp || 0)]} · ${RF.kills || 0} victoires. Changez armes, modules et cerveau : vous ne payez que les nouvelles pièces, et le robot garde son expérience et ses traits.` : `Choisissez un châssis, puis cliquez un affût sur l'aperçu ou dans la liste, et une arme dans l'armurerie. Survolez une arme ou un châssis pour comparer avant de choisir.`}</p>
  ${RF ? '' : `<div class="chips" style="margin-bottom:8px">${fams.map(([f, n]) => `<button class="chip ${FGS.fam === f ? 'on' : ''}" data-act="fgfam" data-id="${f}">${n}</button>`).join('')}</div><div class="fg-strip" id="fgStrip">${cards}</div>`}
  <div class="forge">
    <div class="fg-left">
      <div class="forge-view" id="fgView"><canvas id="forgeCv"></canvas><div class="fv-tier">RANG ${ch.tier} · ${esc(fgSlotTxt(ch)).toUpperCase()}</div><div class="fv-hint">${TOUCH.on ? 'toucher un affût · glisser pour tourner' : 'clic sur un affût · glisser pour tourner'}</div><div class="tag">${esc(ch.n)}</div></div>
      <div class="fg-panel">${fgStatsHTML()}<div class="fg-perk">${perks.join(' ')}</div>
        <div class="fg-cost">${RF ? `<div class="slot-h" style="margin:0">Coût des nouvelles pièces</div><div class="cost">${Object.keys(cost).length ? costHtml(cost) : 'Gratuit'}</div>
          <div class="launch"><button class="btn hot" data-act="applyrefit" ${canBuild ? '' : 'disabled'}>Appliquer</button><button class="btn" data-act="cancelrefit">Annuler</button></div>` : `
          <div class="slot-h" style="margin:0">Coût ${qtyOk > 1 ? '× ' + qtyOk : ''}</div><div class="cost">${costHtml(cost, Math.max(1, qtyOk))}</div>
          <div class="launch"><div class="chips">${[1, 5, 10].map(q => `<button class="chip ${buildQty === q ? 'on' : ''}" data-act="qty" data-id="${q}">× ${q}</button>`).join('')}</div>
          <button class="btn hot" data-act="build" ${canBuild ? '' : 'disabled'}>${lock ? lock : room <= 0 ? 'Hangar plein' : 'Assembler' + (qtyOk > 1 ? ' ' + qtyOk + ' robots' : ' le robot')}</button></div>`}</div>
      </div>
    </div>
    <div class="forge-cfg">
      <div class="fg-panel"><p class="desc">${ch.d}</p>
        <div><div class="slot-h">Nom</div><div style="display:flex;gap:6px"><input class="name" id="dName" maxlength="20" placeholder="Laisser vide pour un nom au hasard" value="${esc(d.name)}"><button class="btn sm" data-act="fgname" title="Nom au hasard" aria-label="Nom au hasard">Au hasard</button></div></div>
        <div><div class="slot-h">Affûts · armes ${WSIZE_PL[ch.wsize].toLowerCase()} au plus</div>
          <div class="slots ${many ? 'many' : ''}">${slots}</div>
          ${ch.slots > 1 ? `<div class="chips" style="margin-top:6px"><button class="btn sm" data-act="allslots">Même arme sur tous les affûts</button></div>` : ''}</div>
      </div>
      <div class="fg-panel"><div class="slot-h" style="margin:0">Armurerie · affût ${activeSlot + 1}</div>
        <div class="chips">${rolesHere.map(([r, n]) => `<button class="chip ${FGS.role === r ? 'on' : ''}" data-act="fgrole" data-id="${r}">${n}</button>`).join('')}</div>
        <div id="fgArmory">${cats}</div>${bigHidden ? '' : ''}</div>
      ${modsHtml ? `<div class="fg-panel">${modsHtml}</div>` : ''}
      <div class="fg-panel"><div class="slot-h" style="margin:0">Cerveau</div><div class="chips">${brains.map(b => `<button class="chip ${b === d.brain ? 'on' : ''}" data-act="brain" data-id="${b}">${BRAINS[b].n}</button>`).join('')}</div>
        <p class="desc">${BRAINS[d.brain].d}</p></div>
    </div>
  </div>`;
}
function fgBind() {
  const v = $('#fgView'); if (!v || v.dataset.bound) return; v.dataset.bound = '1';
  const rel = e => { const r = v.getBoundingClientRect(), k = uiScale(); return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; };
  const hit = p => { let best = -1, bd = 26 * 26; FGS.marks.forEach((m, i) => { const q = d2(m.x, m.y, p.x, p.y); if (q < bd) { bd = q; best = i; } }); return best; };
  v.addEventListener('pointerdown', e => { const p = rel(e); FGS.drag = { x: p.x, a: FGS.ang, moved: false }; try { v.setPointerCapture(e.pointerId); } catch (er) { } });
  v.addEventListener('pointermove', e => {
    const p = rel(e), D = FGS.drag;
    if (D) { if (Math.abs(p.x - D.x) > 5) D.moved = true; if (D.moved) { FGS.ang = D.a + (p.x - D.x) * .012; FGS.dragT = performance.now(); } return; }
    const h = hit(p); FGS.hoverMark = h; v.style.cursor = h >= 0 ? 'pointer' : '';
  });
  const up = e => { const D = FGS.drag; FGS.drag = null; if (D && !D.moved) { const h = hit(rel(e)); if (h >= 0 && h < design.weapons.length) { activeSlot = h; SFX.play('ui', 1); renderHub(); } } };
  v.addEventListener('pointerup', up); v.addEventListener('pointercancel', () => { FGS.drag = null; });
  v.addEventListener('pointerleave', () => { FGS.hoverMark = -1; });
  fgHoverBind();
  const s = $('#fgStrip'); if (s) { s.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { s.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false }); }
  fgUpdateStats();
}
// survol : aperçu de l'arme ou du châssis, et comparaison des caractéristiques (une seule fois pour la console)
function fgHoverBind() {
  const m = $('#hubMain'); if (!m || m.dataset.fgb) return; m.dataset.fgb = '1';
  const enter = e => {
    const wc = e.target.closest('[data-hw]'), cc = e.target.closest('.ch-item[data-act=chassis]');
    if (wc && !wc.disabled) { const ws = design.weapons.slice(); ws[activeSlot] = wc.dataset.hw; FGS.alt = { chassis: design.chassis, weapons: ws }; fgUpdateStats(); return; }
    if (cc && !design.refit && cc.dataset.id !== design.chassis) { const k = cc.dataset.id, al = allowedWeapons(k), C = CHASSIS[k]; if (!C) return; const ws = MOUNTS[k].map((_, i) => { const cur = design.weapons[i]; return cur && al.includes(cur) ? cur : al.filter(w => !isSupportW(w)).sort((a, b) => WEAPONS[b].size - WEAPONS[a].size || wDps(WEAPONS[b]) - wDps(WEAPONS[a]))[0] || 'mg'; }); FGS.alt = { chassis: k, weapons: ws, modules: [] }; fgUpdateStats(); }
  };
  const leave = e => { const t = e.target.closest('[data-hw],.ch-item'); if (!t) return; const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-hw],.ch-item') : null; if (to === t) return; FGS.alt = null; fgUpdateStats(); };
  m.addEventListener('mouseover', e => { if (hubTab === 'atelier') enter(e); }); m.addEventListener('mouseout', e => { if (hubTab === 'atelier') leave(e); });
}
function animateHub(t) {
  const f = $('#forgeCv'); if (!(f && hubTab === 'atelier' && drawerOpen)) return;
  const now = performance.now(), dt = Math.min(.05, (now - (FGS.last || now)) / 1000); FGS.last = now;
  if (now - FGS.dragT > 3500 && !FGS.drag) FGS.ang += dt * .22;
  const A = FGS.alt, chs = A ? A.chassis : design.chassis, ws = A ? A.weapons : design.weapons;
  const marks = drawRobotPreview(f, chs, ws, t, { anim: true, ang: FGS.ang, fill: CHASSIS[chs].tier >= 7 ? .42 : .3 }) || [];
  FGS.marks = A && A.chassis !== design.chassis ? [] : marks;
  // marqueurs d'affûts : l'affût actif pulse
  const c = f.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const many = FGS.marks.length > 8;
  FGS.marks.forEach((m, i) => {
    const on = i === activeSlot, hv = i === FGS.hoverMark, R = many ? 8 : 10;
    if (on) { const p = .5 + .5 * Math.sin(t * 5); c.strokeStyle = `rgba(242,193,78,${.35 + .4 * p})`; c.lineWidth = 2; c.beginPath(); c.arc(m.x, m.y, R + 5 + p * 4, 0, TAU); c.stroke(); }
    c.fillStyle = on ? '#f2c14e' : hv ? 'rgba(236,226,204,.95)' : 'rgba(12,16,17,.82)'; c.beginPath(); c.arc(m.x, m.y, R, 0, TAU); c.fill();
    c.strokeStyle = on ? '#f2c14e' : 'rgba(236,226,204,.55)'; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = on || hv ? '#15191a' : '#ece2cc'; c.font = `700 ${many ? 9.5 : 11}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), m.x, m.y + .5);
  });
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
}

// ================= HANGAR =================
const HG = { filter: 'all', sort: 'tier', open: new Set() };
function renderHangar() {
  const used = cmdUsed(), cap = cmdCap(), L = save.robots;
  const flt = { all: r => true, dep: r => r.deploy && !r.exp, res: r => !r.deploy && !r.exp, dmg: r => r.hp < 1 && !r.exp, exp: r => !!r.exp };
  const names = [['all', 'Tous'], ['dep', 'Déployés'], ['res', 'En réserve'], ['dmg', 'Abîmés'], ['exp', 'En expédition']].filter(([k]) => k !== 'exp' || L.some(flt.exp)).filter(([k]) => k !== 'dmg' || L.some(flt.dmg));
  if (!names.some(([k]) => k === HG.filter)) HG.filter = 'all';
  const power = r => { const st = designStats(r.chassis, r.weapons, r.modules, r); return Math.log(1 + st.hp) * Math.log(2 + st.dps); };
  const sorters = { tier: (a, b) => CHASSIS[b.chassis].tier - CHASSIS[a.chassis].tier || b.id - a.id, power: (a, b) => power(b) - power(a), name: (a, b) => a.name.localeCompare(b.name, 'fr'), recent: (a, b) => b.id - a.id };
  const list = L.filter(flt[HG.filter]).sort(sorters[HG.sort] || sorters.tier);
  const body = list.length ? list.map(r => {
    if (r.exp) return expHangarCard(r);
    const ch = CHASSIS[r.chassis], miss = 1 - r.hp, rc = repairCost(r), rk = rankOf(r.chassis, r.xp || 0);
    const nx = rk < 4 ? xpNeed(r.chassis, rk + 1) : 0, px = rk < 4 ? xpNeed(r.chassis, rk) : 0, xf = rk < 4 ? ((r.xp || 0) - px) / (nx - px) : 1;
    return `<div class="card hg-card ${r.deploy ? 'dep' : ''}">
      <div class="row"><canvas data-rid="${r.id}"></canvas><div style="min-width:0"><div class="nm">${esc(r.name)}<span class="rk">${RANKS[rk]}</span></div><div class="sub">${ch.n} · T${ch.tier} · ${fmtCmd(ch.cmd)} cmd · ${r.kills || 0} victoires</div><div class="sub">${wList(r.weapons)}${(r.modules || []).length ? ' · ' + r.modules.map(m => MODULES[m].n).join(', ') : ''}</div></div></div>
      <div class="bars"><span>PV</span><div class="hpbar" title="Points de vie"><i style="width:${Math.round(r.hp * 100)}%;${r.hp < .35 ? 'background:var(--bad)' : ''}"></i></div><span>XP</span><div class="hpbar" title="Expérience${rk < 4 ? ' ' + Math.floor(r.xp || 0) + ' / ' + nx : ''}"><i style="width:${Math.round(clamp(xf, 0, 1) * 100)}%;background:var(--amber)"></i></div></div>
      ${(r.traits || []).length ? `<div class="sub">Traits : ${r.traits.map(t => '<b>' + TRAITS[t].n + '</b>').join(', ')}</div>` : ''}
      <div class="acts">
        <button class="btn sm dep-tg ${r.deploy ? 'on' : ''}" data-act="deploy" data-rid="${r.id}"><span class="sw"></span>${r.deploy ? 'Déployé' : 'Déployer'}</button>
        ${miss > .005 ? `<button class="btn sm" data-act="repair" data-rid="${r.id}" ${canAfford(rc) ? '' : 'disabled'} title="${esc(Object.keys(rc).map(k => rc[k] + ' ' + RES[k].n).join(', ') || 'gratuit')}">Réparer <span class="cst">${Object.keys(rc).map(k => `<span><i style="background:${RES[k].c}"></i>${fmt(rc[k])}</span>`).join('')}</span></button>` : ''}
        <button class="btn sm" data-act="refit" data-rid="${r.id}">Réaménager</button>
      </div>
      <details data-rid="${r.id}" ${HG.open.has(r.id) ? 'open' : ''}><summary>Réglages</summary><div>
        <div class="acts"><label class="sub">Cerveau <select data-act="setbrain" data-rid="${r.id}">${BRAIN_KEYS.filter(b => brainUnlocked(b) || b === r.brain).map(b => `<option value="${b}" ${b === r.brain ? 'selected' : ''}>${BRAINS[b].n}${b === 'tactical' && r.brain !== 'tactical' ? ' (1 noyau)' : ''}</option>`).join('')}</select></label>
          <label class="sub">Groupe <select data-act="setgroup" data-rid="${r.id}">${[0, 1, 2, 3, 4, 5].map(g => `<option value="${g}" ${g === (r.group || 0) ? 'selected' : ''}>${g || '—'}</option>`).join('')}</select></label></div>
        <div class="acts"><span class="sub" title="Concentré : toutes les armes sur la même cible. Fractionné : chaque arme choisit la cible qui lui convient.">Tir</span><button class="chip ${r.split ? '' : 'on'}" data-act="rsplit" data-rid="${r.id}" data-id="0">Concentré</button><button class="chip ${r.split ? 'on' : ''}" data-act="rsplit" data-rid="${r.id}" data-id="1">Fractionné</button></div>
        ${fabPlanHTML(r)}
        ${r.weapons.some(w => !isSupportW(w)) ? `<div class="acts"><span class="sub" title="Quand vous pilotez ce robot : une arme manuelle tire au clic gauche, une arme automatique choisit sa cible et tire seule.">En pilotage</span>${wmChips(r)}</div>` : ''}
        <div class="acts"><button class="btn sm" data-act="scrap" data-rid="${r.id}">Démonter (rend la moitié des matériaux)</button></div>
      </div></details></div>`;
  }).join('') : L.length ? `<div class="card"><div class="nm">Aucun robot ici</div><div class="sub">Changez de filtre pour voir le reste de la flotte.</div></div>` : `<div class="card"><div class="nm">Hangar vide</div><div class="sub">Assemblez votre premier robot à la forge.</div><div class="acts"><button class="btn hot sm" data-tab="atelier">Aller à la forge</button></div></div>`;
  return `<div class="phead"><h2 class="h2">Hangar</h2><div class="psum"><span>Commandement <b>${fmtCmd(used)} / ${cap}</b></span><span>Robots <b>${L.length} / ${hangarCap()}</b></span></div></div>
  <p class="lead">Les robots déployés partent en raid avec vous. Ceux qui restent hors du cercle d'extraction, ou qui tombent, sont perdus. Une baie de réparation les soigne gratuitement à la base.</p>
  <div class="meter"><span>Commandement ${fmtCmd(used)} / ${cap}</span><div class="bar ${used > cap ? 'over' : ''}"><i style="width:${Math.min(100, used / cap * 100)}%"></i></div></div>
  <div class="hg-bar"><div class="chips">${names.map(([k, n]) => `<button class="chip ${HG.filter === k ? 'on' : ''}" data-act="hgf" data-id="${k}">${n}<span class="cn">${L.filter(flt[k]).length}</span></button>`).join('')}</div>
    <label class="sub" style="display:flex;gap:6px;align-items:center">Trier <select data-act="hgsort">${[['tier', 'Rang'], ['power', 'Puissance'], ['name', 'Nom'], ['recent', 'Récents']].map(([k, n]) => `<option value="${k}" ${HG.sort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="chips" style="margin-left:auto"><button class="btn sm" data-act="deployall">Déployer au maximum</button><button class="btn sm" data-act="undeployall">Tout retirer</button>${L.some(r => r.hp < 1 && !r.exp) ? '<button class="btn sm" data-act="repairall">Tout réparer</button>' : ''}</div></div>
  <div class="grid-cards">${body}</div>`;
}

// ================= CONSTRUCTION =================
const B_GROUPS = [['Production', ['scrapper', 'smelter', 'circuitfab', 'refinery', 'datacenter', 'corefab', 'warehouse']], ['Commandement et armée', ['hq', 'forge', 'lab', 'hangar', 'pad', 'uplink', 'repairbay', 'range', 'contracts', 'radar', 'expedition', 'shipyard']]];
function renderBuildTab() {
  uiInit();
  const hq = hqLevel(), free = builderCap() - busyCount();
  const groups = B_GROUPS.map(([t, ks]) => [t, ks.filter(k => BUILD[k])]);
  const known = new Set(groups.flatMap(g => g[1])); groups[1][1].push(...BUILD_KEYS.filter(k => !BUILD[k].def && !known.has(k)));
  groups.push(['Défenses', BUILD_KEYS.filter(k => BUILD[k].def)]);
  const built = [];
  const card = k => {
    const D = BUILD[k], n = countType(k), lim = bLimit(k), cost = bCost(k, 1), v = bVis(k);
    if (!v) return '';
    if (v === 'shadow') return `<div class="card bcard shadow"><canvas data-bprev="${k}" data-sil="1"></canvas><div class="nm">${D.n}</div><div class="sub">Débloqué au QG niveau ${bNextHq(k)}</div></div>`;
    const uniq = BLIMIT[k] && BLIMIT[k].every(x => x === 1);
    if (uniq && n >= 1) { built.push(k); return ''; }
    const why = attack && attack.phase === 'fight' ? 'Attaque en cours' : n >= lim ? (lim === 0 ? 'QG niveau ' + bNextHq(k) + ' requis' : 'Limite atteinte (' + n + ' / ' + lim + ')' + (bNextHq(k) ? ' · plus au QG ' + bNextHq(k) : '')) : free <= 0 ? 'Aucun ouvrier libre' : !canAfford(cost) ? 'Ressources insuffisantes' : '';
    const nw = uiMark('b:' + k);
    return `<div class="card bcard ${nw ? 'isnew' : ''}"><canvas data-bprev="${k}"></canvas><div class="nm">${D.n} ${newTag(nw)}</div><div class="sub">${D.w} × ${D.h} tuile${D.w * D.h > 1 ? 's' : ''} · ${n} / ${lim} construit${n > 1 ? 's' : ''} · ${instantB(k) ? 'immédiat' : dur(bTime(k, 1))}</div><div class="sub">${D.d}</div>
      <div class="cost">${costHtml(cost)}</div><div class="acts"><button class="btn sm ${why ? '' : 'hot'}" data-act="place" data-id="${k}" ${why ? 'disabled' : ''}>Placer</button>${why ? `<span class="sub">${why}</span>` : ''}</div></div>`;
  };
  const html = groups.map(([title, keys]) => { const cs = keys.map(card).join(''), hid = keys.filter(k => !bVis(k)).length; return cs || hid ? `<div class="rs-cat">${title}</div><div class="grid-cards">${cs}${hid ? `<div class="hidden-n">${hid} bâtiment${hid > 1 ? 's' : ''} à découvrir</div>` : ''}</div>` : ''; }).join('');
  return `<div class="phead"><h2 class="h2">Construire</h2><div class="psum"><span>QG <b>${hq}</b></span><span>Ouvriers libres <b>${free} / ${builderCap()}</b></span></div></div>
  <p class="lead">Choisissez un bâtiment, puis posez-le dans l'enceinte de la base. Les constructions avancent en temps réel, même pendant vos raids. Améliorer le QG révèle de nouveaux bâtiments.</p>
  ${html}${built.length ? `<details class="card" style="margin-top:14px"><summary class="slot-h" style="cursor:pointer;margin:0">Déjà construits · ${built.length}</summary><div class="sub" style="margin-top:6px">${built.map(k => BUILD[k].n).join(' · ')}. Cliquez sur eux à la base pour les améliorer ou les déplacer.</div></details>` : ''}`;
}
function drawBuildingPreview(cv2, type) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv2.clientWidth || 200, h = cv2.clientHeight || 120;
  cv2.width = Math.round(w * dpr); cv2.height = Math.round(h * dpr);
  const c = cv2.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let y = 0; y < h; y += 40) for (let x = 0; x < w; x += 40) c.drawImage(groundAtlas, (((x + y) / 40) & 7) * TILE, 0, TILE, TILE, x, y, 40.5, 40.5);
  c.fillStyle = 'rgba(8,12,13,.35)'; c.fillRect(0, 0, w, h);
  const D = BUILD[type], sc = Math.min((w - 20) / (D.w * TILE), (h - 24) / (D.h * TILE), 2.2);
  c.save(); c.translate((w - D.w * TILE * sc) / 2, (h - D.h * TILE * sc) / 2 + 4); c.scale(sc, sc);
  const sv = parts.length; paintBuilding(c, { type, tx: 0, ty: 0, lvl: 1, busy: 0, id: -1 }, 1, true); parts.length = sv; c.restore();
  if (cv2.dataset.sil === '1') { c.fillStyle = 'rgba(12,17,19,.82)'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(165,156,136,.55)'; c.font = `700 34px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2); }
}

// ================= RAIDS =================
function renderRaidTab() {
  uiInit(); refillOffers();
  if (!regionUnlocked(save.region || 0)) save.region = 0;
  if (!diffOwn(save.diff)) save.diff = 1;
  const ri = save.region || 0, R = REGIONS[ri], offers = save.offers[ri];
  save.active = save.active.filter(id => offers.some(c => c.id === id));
  const dep = save.robots.filter(r => r.deploy && !r.exp), used = cmdUsed(), cap = cmdCap(), pad = bLevel('pad');
  const groups = {}; for (const r of dep) groups[r.chassis] = (groups[r.chassis] || 0) + 1;
  const hidR = REGIONS.filter((G, i) => !regionVis(i)).length, hidD = DIFFS.filter((D, i) => !diffVis(i)).length;
  const regions = REGIONS.map((G, i) => {
    const v = regionVis(i); if (!v) return '';
    if (v === 'shadow') return `<div class="region shadow"><span class="tier">RÉGION ${G.tier}</span><span class="nm">? ? ?</span><span class="d">Région inconnue.</span><span class="m">Pour l'ouvrir : remplir 3 contrats dans « ${REGIONS[i - 1].n} » (${save.cdone[i - 1] || 0} / 3) ou abattre son boss.</span></div>`;
    const nw = uiMark('g:' + i);
    return `<button class="region ${i === ri ? 'on' : ''} ${nw ? 'isnew' : ''}" data-act="region" data-id="${i}"><span class="tier">RÉGION ${G.tier} ${newTag(nw)}</span><span class="nm">${G.n}</span><span class="d">${G.d}</span>
      <span class="m">Ennemis +${22 * (G.tier - 1)} % · butin +${30 * (G.tier - 1)} % · ${G.rivals} équipe${G.rivals > 1 ? 's' : ''} rivale${G.rivals > 1 ? 's' : ''} · boss : ${ENEMIES[G.boss].n} · contrats remplis : ${save.cdone[i] || 0}</span></button>`;
  }).join('') + (hidR ? `<div class="hidden-n">${hidR} région${hidR > 1 ? 's' : ''} inconnue${hidR > 1 ? 's' : ''}</div>` : '');
  const diffs = DIFFS.map((D, i) => {
    const v = diffVis(i); if (!v) return '';
    if (v === 'shadow') return `<div class="diff shadow"><span class="nm">? ? ?</span><span class="d">${i === 2 ? 'Réussissez deux extractions, ou abattez un boss, pour la découvrir.' : 'Abattez un boss de région pour la découvrir.'}</span></div>`;
    const nw = uiMark('d:' + i);
    return `<button class="diff ${save.diff === i ? 'on' : ''}" data-act="diff" data-id="${i}"><span class="nm">${D.n} ${newTag(nw)}</span><span class="d">${D.d}</span><span class="m">PV ennemis ×${D.hp} · dégâts ×${D.dmg} · butin ×${D.loot}</span></button>`;
  }).join('');
  const pws = Object.keys(PWEAPONS).filter(pweaponUnlocked);
  return `<div class="phead"><h2 class="h2">Partir en raid</h2><div class="psum"><span>Raids <b>${save.stats.raids}</b></span><span>Extractions <b>${save.stats.extract}</b></span></div></div>
  <p class="lead">Choisissez une région, acceptez jusqu'à deux contrats, puis lancez l'insertion. Trois contrats remplis dans une région, ou son boss abattu, révèlent la suivante.</p>
  <div class="rs-cat">Région</div>
  <div class="regions">${regions}</div>
  <div class="rs-cat">Contrats · ${R.n} <span>${save.active.length} / 2 acceptés</span></div>
  ${bLevel('contracts') ? `<div class="grid-cards">${offers.map(c => { const on = save.active.includes(c.id); return `<button class="contract ${on ? 'on' : ''}" data-act="contract" data-id="${c.id}" aria-pressed="${on}">
      <span class="nm">${esc(contractText(c))}</span><span class="d">Récompense : ${rewardHtml(c.reward)}${c.rep > 1 ? ' · +' + c.rep + ' réputation' : ''}</span><span class="st">${on ? 'Accepté ✓' : 'Cliquer pour accepter'}</span></button>`; }).join('')}</div>
    <div class="launch" style="margin-top:8px"><button class="btn sm" data-act="reroll" ${save.res.data >= 8 ? '' : 'disabled'}>Renouveler les offres · 8 données</button></div>`
    : '<p class="lead">Construisez un bureau des contrats à la base pour recevoir des offres.</p>'}
  <div class="rs-cat">Difficulté</div>
  <div class="diffs">${diffs}</div>
  <div class="cols">
    <div class="list">
      ${pws.length > 1 ? `<div class="slot-h">Arme du pilote</div><div class="chips">${pws.map(k => { const nw = uiMark('p:' + k); return `<button class="chip ${save.pweapon === k ? 'on' : ''}" data-act="pweapon" data-id="${k}">${PWEAPONS[k].n}${nw ? ' •' : ''}</button>`; }).join('')}</div>` : ''}
      <div class="slot-h" style="margin-top:14px">Armée déployée</div>
      <div class="meter"><span>${fmtCmd(used)} / ${cap}</span><div class="bar ${used > cap ? 'over' : ''}"><i style="width:${Math.min(100, used / cap * 100)}%"></i></div></div>
      <div class="sub" style="font-size:13.5px;line-height:1.6;color:var(--mute)">${dep.length ? Object.keys(groups).map(k => CHASSIS[k].n + ' × ' + groups[k]).join('<br>') : 'Aucun robot : vous partez seul.'}</div>
      <div class="launch" style="margin-top:10px"><button class="btn sm" data-tab="hangar">Gérer au hangar</button></div>
    </div>
    <div class="brief">
      <p><b>Ancrage.</b> La balise se pose avec ${keyLabel('beacon')}. Elle charge en 55 s, plus 0,3 s par kilo transporté, 2,5 fois plus vite près d'un pylône relais activé.${pad > 1 ? ' Plateforme niveau ' + pad + ' : balise +' + 20 * (pad - 1) + ' %.' : ''}</p>
      <p><b>Rivaux.</b> D'autres équipes fouillent la zone, ouvrent les caisses et posent leur propre balise. Abattez leur chef pour récupérer son butin, ou détruisez leur balise.</p>
      <p><b>Fenêtre.</b> Charge terminée, 16 s pour entrer dans le cercle. Le lift emporte le pilote et chaque robot à l'intérieur.</p>
    </div>
  </div>
  <div class="raid-go"><button class="btn hot big" data-act="launch" ${used > cap || !pad ? 'disabled' : ''}>Lancer le raid · ${R.n}</button>${NET.kind === 'http' && !TUT.on && tabVis('online') ? '<button class="btn" data-tab="online">Raid partagé à plusieurs…</button>' : ''}<span class="sumr"><b>${DIFFS[save.diff].n}</b> · ${dep.length} robot${dep.length > 1 ? 's' : ''} · ${save.active.length} contrat${save.active.length > 1 ? 's' : ''}</span>${used > cap ? '<span class="lost">Commandement dépassé.</span>' : ''}${!pad ? '<span class="lost">Construisez une plateforme de largage.</span>' : ''}</div>`;
}

// ================= CONSOLE : RENDU ET ÉVÉNEMENTS =================
function renderHub() {
  uiInit(); resNote();
  if (uiPendTab !== hubTab) { uiCommit(); uiPendTab = hubTab; }
  const rv = RES_KEYS.filter(resVis), rb = $('#resBar'); rb.classList.toggle('many', rv.length >= 7);
  rb.innerHTML = rv.map(k => `<span class="res ${(save.res[k] || 0) <= 0 ? 'zero' : ''}" title="${RES[k].n}"><i style="background:${RES[k].c}"></i><span>${RES[k].n}</span><b>${fmt(save.res[k])}</b></span>`).join('');
  document.querySelectorAll('#hubNav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === hubTab));
  const s = save.stats;
  $('#navFoot').innerHTML = `${s.raids} raids · ${s.extract} extractions<br>${s.kills} hostiles abattus${s.boss ? '<br>Souverain vaincu ×' + s.boss : ''}`;
  const m = $('#hubMain'), st = $('#fgStrip'), stl = st ? st.scrollLeft : 0;
  m.innerHTML = hubTab === 'online' ? renderOnline() : hubTab === 'construire' ? renderBuildTab() : hubTab === 'atelier' ? renderForge() : hubTab === 'hangar' ? renderHangar() : hubTab === 'recherche' ? renderResearch() : hubTab === 'expe' ? renderExpTab() : renderRaidTab();
  m.querySelectorAll('canvas[data-prev]').forEach(cv2 => { const k = cv2.dataset.prev; const al = allowedWeapons(k); drawRobotPreview(cv2, k, MOUNTS[k].map((_, i) => al.length && !chassisLock(k) ? al[Math.min(i, al.length - 1)] : null), 0, { fill: .44, sil: cv2.dataset.sil === '1' }); });
  m.querySelectorAll('canvas[data-rid]').forEach(cv2 => { const r = save.robots.find(x => x.id === +cv2.dataset.rid); if (r) drawRobotPreview(cv2, r.chassis, r.weapons, 0, { fill: .44 }); });
  m.querySelectorAll('canvas[data-bprev]').forEach(cv2 => drawBuildingPreview(cv2, cv2.dataset.bprev));
  m.querySelectorAll('canvas[data-wicon]').forEach(cv2 => drawWeaponIcon(cv2, cv2.dataset.wicon, cv2.dataset.sil === '1'));
  m.querySelectorAll('canvas[data-emap]').forEach(cv2 => { const id = +cv2.dataset.emap; drawExpMap(cv2, EXP.cx.get(id), (save.exps || []).find(e => e.id === id)); }); expTabN = (save.exps || []).length;
  const nm = $('#dName'); if (nm) nm.addEventListener('input', e => { design.name = e.target.value; });
  const st2 = $('#fgStrip'); if (st2) { st2.scrollLeft = stl; if (!stl) { const on = st2.querySelector('.ch-item.on'); if (on) st2.scrollLeft = Math.max(0, on.offsetLeft - st2.clientWidth / 2 + on.clientWidth / 2); } }
  if (hubTab === 'recherche') { rtBind(); rtDrawDetail(); }
  if (hubTab === 'atelier') fgBind();
  updateNav();
}
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  switch (act) {
    case 'rtbr': if (RT.br !== id) { RT.br = id; RT.sel = null; SFX.play('ui', 1); renderHub(); } break;
    case 'rtzoom': { const w = $('#rtreeWrap'); if (w) rtZoomAt(id === 'in' ? 1.2 : 1 / 1.2, w.clientWidth / 2, w.clientHeight / 2); break; }
    case 'rtfit': { const w = $('#rtreeWrap'), V = rtView(); if (w && V && RT.lay) { V.z = clamp(Math.min(w.clientWidth / RT.lay.W, w.clientHeight / RT.lay.H), .3, 1); V.x = 0; V.y = 0; rtApply(); } break; }
    case 'rtnext': { const ids = RT.lay ? RT.lay.order.filter(x => { const nn = rtNode(x); return !nn.base && rVis(nn) === 'full' && rState(nn) !== 'done'; }) : []; if (!ids.length) { toast('Rien à rechercher dans cette branche pour l\'instant.'); break; } const ready = ids.filter(x => rState(rtNode(x)) === 'ready'), L2 = ready.length ? ready : ids, i = (L2.indexOf(RT.sel) + 1) % L2.length; RT.sel = L2[i]; rtFocus(RT.sel, true); document.querySelectorAll('.rnode.sel').forEach(n => n.classList.remove('sel')); const nd = document.querySelector(`.rnode[data-id="${RT.sel}"]`); if (nd) nd.classList.add('sel'); $('#rdetail').innerHTML = researchDetail(RT.sel); rtDrawDetail(); rtHighlight(RT.sel); SFX.play('ui', .6); break; }
    case 'fgfam': FGS.fam = id; SFX.play('ui', .8); renderHub(); { const s2 = $('#fgStrip'); if (s2) s2.scrollLeft = 0; } break;
    case 'fgrole': FGS.role = id; SFX.play('ui', .8); renderHub(); break;
    case 'fgname': design.name = randomName(design.chassis); SFX.play('ui', .8); renderHub(); break;
    case 'fgshadow': { const r = RESEARCH_BY_ID[id]; if (!r) break; RT.br = rtBranchOf(id); RT.sel = id; hubTab = 'recherche'; SFX.play('ui', 1); renderHub(); $('#hubMain').scrollTop = 0; setTimeout(() => rtFocus(id, true), 30); break; }
    case 'hgf': HG.filter = id; SFX.play('ui', .8); renderHub(); break;
  }
}, true);
// sélection d'un nœud : le détail suit, l'arbre se recentre si besoin (le gestionnaire d'origine affiche le détail)
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act=rsel]'); if (!el) return;
  RT.sel = el.dataset.id; const br = rtBranchOf(RT.sel);
  if (br !== RT.br && !RT_BASE[RT.sel]) { RT.br = br; setTimeout(() => { renderHub(); rtFocus(RT.sel, true); }, 0); return; }
  setTimeout(() => { document.querySelectorAll('.rnode.sel').forEach(n => n.classList.toggle('sel', n.dataset.id === RT.sel)); rtDrawDetail(); rtHighlight(RT.hover || RT.sel); if (!el.classList.contains('rnode')) rtFocus(RT.sel, true); }, 0);
}, false);
// les réglages dépliés d'un robot restent ouverts quand le hangar se redessine
document.addEventListener('toggle', e => { const d = e.target; if (d && d.tagName === 'DETAILS' && d.dataset.rid) { const id = +d.dataset.rid; if (d.open) HG.open.add(id); else HG.open.delete(id); } }, true);
document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.act === 'hgsort') { HG.sort = el.value; renderHub(); } });
