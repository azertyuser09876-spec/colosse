// Entrées : souris et clavier.

// ================= ENTRÉES =================
function pauseGame() {
  if (!inGame()) return;
  paused = true; for (const k in keys) keys[k] = false; mouse.l = false;
  const base = state === 'base';
  $('#abandonBtn').textContent = state === 'assault' ? TL('Se retirer (garder les étoiles)') : TL('Abandonner le raid');
  $('#pauseTxt').textContent = state === 'assault' ? TL('Assaut en pause. Vous pouvez vous retirer en gardant les étoiles déjà acquises.') : base ? TL('La base est en pause, mais vos bâtiments continuent de produire et de se construire en temps réel.') : TL('Le raid est figé. Abandonner compte comme une mort : butin transporté et robots déployés sont perdus.');
  if (LIVE.game && state === 'raid') $('#pauseTxt').textContent = TL('Raid partagé : le monde continue de tourner pendant ce menu, vos robots se défendent seuls. Abandonner compte comme une mort : votre butin reste au sol.');
  $('#abandonBtn').style.display = base ? 'none' : ''; $('#titleBtn').style.display = base ? '' : 'none';
  showOverlay('pause', true);
}
function resumeGame() { paused = false; showOverlay('pause', false); showOverlay('help', false); }
function relPos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function pauseGameSoft() { paused = true; const off = () => { if (!$('#help').classList.contains('on')) { paused = false; } else requestAnimationFrame(off); }; requestAnimationFrame(off); }
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; EXPV.kp = {}; EXPV.drag = null; mouse.l = false; mouse.drag = null; if (state === 'raid' && !paused && !LIVE.game) pauseGame(); });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  SFX.init(); const p = relPos(e); mouse.x = p.x; mouse.y = p.y;
  if (EXPV.id) { if (e.button === 0) expViewDown(p); return; }
  if (!inGame() || paused || drawerOpen) return;
  const w = screenToWorld(p.x, p.y); mouse.wx = w.x; mouse.wy = w.y;
  const base = state === 'base';
  if (e.button === 0) {
    mouse.ldown = true;
    const ux = p.x / uiScale(), uy = p.y / uiScale(), card = hudCards.find(h => ux >= h.x && ux <= h.x + h.w && uy >= h.y && uy <= h.y + h.h);
    if (hitWeaponRow(ux, uy)) return;
    if (base && expTrackHit(ux, uy)) return;
    if (card) {
      const alive = card.units.filter(u => !u.dead); if (!alive.length) return;
      if (e.shiftKey) { const on = !alive.every(u => u.sel); for (const u of alive) u.sel = on; }
      else { const only = alive.every(u => u.sel) && fleet.filter(r => r.sel).length === alive.length; for (const r of fleet) r.sel = false; if (!only) for (const u of alive) u.sel = true; }
      SFX.play('ui', 1); return;
    }
    if (base && placing) { confirmPlace(); return; }
    if (base && !tactical) {
      const b = bAt(w.x, w.y);
      if (b) { if (b === baseSel) openBuilding(b); else { baseSel = b; if (BUILD[b.type].prod) collect(b); updateBPanel(); SFX.play('ui', 1); } return; }
      if (baseSel) { baseSel = null; updateBPanel(); }
    }
    if (mapOpen) return;
    if (tactical) mouse.drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, shift: e.shiftKey }; else if (settings.toggleFire) { fireLatch = !fireLatch; } else mouse.l = true;
  } else if (e.button === 2) {
    if (base && placing) { placing = null; SFX.play('ui', .7); return; }
    if (mapOpen && bigMapRect) { const k = WPX / bigMapRect.S; const wx = (p.x - bigMapRect.x) * k, wy = (p.y - bigMapRect.y) * k; if (wx >= 0 && wy >= 0 && wx <= WPX && wy <= WPX) issueOrderAt(wx, wy, e.shiftKey); }
    else issueOrderAt(w.x, w.y, e.shiftKey);
  }
});
window.addEventListener('mousemove', e => { const p = relPos(e); mouse.x = p.x; mouse.y = p.y; if (EXPV.drag) expViewMove(p); if (mouse.drag) { mouse.drag.x1 = p.x; mouse.drag.y1 = p.y; } });
window.addEventListener('mouseup', e => {
  if (e.button !== 0) return; mouse.l = false; mouse.ldown = false;
  if (EXPV.id) { if (EXPV.drag) expViewUp(relPos(e)); return; }
  const d = mouse.drag; if (!d) return; mouse.drag = null; if (!inGame()) return;
  const small = Math.abs(d.x1 - d.x0) < 6 && Math.abs(d.y1 - d.y0) < 6;
  if (!d.shift) for (const r of fleet) r.sel = false;
  if (small) {
    const w = screenToWorld(d.x1, d.y1); let best = null, bd = Infinity;
    for (const r of fleet) { if (r.dead) continue; const q = d2(r.x, r.y, w.x, w.y); if (q < (r.r + 14) ** 2 && q < bd) { bd = q; best = r; } }
    if (best) best.sel = d.shift ? !best.sel : true;
  } else {
    const x0 = Math.min(d.x0, d.x1), x1 = Math.max(d.x0, d.x1), y0 = Math.min(d.y0, d.y1), y1 = Math.max(d.y0, d.y1);
    for (const r of fleet) { if (r.dead) continue; const s = worldToScreen(r.x, r.y); if (s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1) r.sel = true; }
  }
  if (fleet.some(r => r.sel)) SFX.play('ui', 1);
});
cv.addEventListener('wheel', e => { if (!inGame()) return; e.preventDefault(); if (EXPV.id) { EXPV.uz = clamp(EXPV.uz * (e.deltaY > 0 ? .9 : 1.1), expMinZ(), 1.6); return; } cam.userZoom = clamp(cam.userZoom * (e.deltaY > 0 ? .9 : 1.1), minZoom(), 1.8); }, { passive: false });

// ================= ENTRÉES CLAVIER =================
function normKey(e) { if (e.code === 'Tab') return 'tab'; if (e.code === 'Space') return ' '; return (e.key || '').toLowerCase(); }
window.addEventListener('keydown', e => {
  SFX.init();
  if (rebinding) {
    e.preventDefault();
    if (e.code === 'Escape') { rebinding = null; renderSettings(); return; }
    if (/^(Key[WASD]|Arrow|Digit|Shift|Control|Alt|Meta)/.test(e.code)) { toast(TL('Touche réservée au déplacement ou aux groupes.')); return; }
    const k = normKey(e); for (const a in ACTIONS) if (a !== rebinding && keyOf(a) === k) settings.keys[a] = '';
    settings.keys[rebinding] = k; rebinding = null; saveSettings(); renderSettings(); return;
  }
  if ($('#settings').classList.contains('on')) { if (e.code === 'Escape') closeSettings(); return; }
  if ($('#tutDlg').classList.contains('on')) { if (e.code === 'Escape') { if (TUT.on) TUT.resume(); else showOverlay('tutDlg', false); } return; }
  if ($('#account').classList.contains('on')) { if (e.code === 'Escape') showOverlay('account', false); else if (e.code === 'Enter' && e.target && e.target.tagName === 'INPUT') { const g = document.querySelector('[data-act=accgo]'); if (g) g.click(); } return; }
  if ($('#help').classList.contains('on') && (e.code === 'Escape' || actionFor(normKey(e)) === 'help')) { showOverlay('help', false); e.preventDefault(); return; }
  if (!inGame()) return;
  if (drawerOpen) { if (e.code === 'Escape') { closeDrawer(); e.preventDefault(); } else if (e.code === 'Enter' && e.target && e.target.id === 'liveChat') { LIVE.say(e.target.value); e.target.value = ''; } return; }
  if (EXPV.id) { expViewKey(e); return; }
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  const code = e.code, k = normKey(e), base = state === 'base', act = k ? actionFor(k) : null;
  if (code === 'Tab' || code === 'Space' || code.startsWith('Arrow') || act === 'tactical' || act === 'dash') e.preventDefault();
  keys[code] = true; if (act === 'interact') keys.INTERACT = true;
  if (e.repeat) return;
  if (act === 'tactical') { if (!paused) { tactical = !tactical; mouse.l = false; mouse.drag = null; SFX.play('ui', 1); } return; }
  if (paused) { if (code === 'Escape') resumeGame(); return; }
  if (!base && endT > 0 && !endSuccess) return;
  if (code === 'Escape') {
    if (base && placing) { placing = null; SFX.play('ui', .7); }
    else if (base && baseSel) { baseSel = null; updateBPanel(); }
    else if (mapOpen) mapOpen = false; else if (tactical) tactical = false; else if (fireLatch) fireLatch = false; else pauseGame();
    return;
  }
  if (/^Digit[1-5]$/.test(code)) {
    const n = +code.slice(5);
    if (e.shiftKey) {
      const sel = fleet.filter(r => r.sel && !r.dead); if (!sel.length) { msg(TL('Sélectionnez d\'abord des robots.'), '#a59c88', 3); return; }
      for (const r of fleet) { if (r.sel) r.group = n; else if (r.group === n) r.group = 0; const sr = save.robots.find(s => s.id === r.sid); if (sr) sr.group = r.group; }
      msg(TLn(sel.length, 'Groupe {g} : {n} robot.', 'Groupe {g} : {n} robots.', { g: n }), COL.ally, 3);
    } else {
      const g = fleet.filter(r => r.group === n && !r.dead); if (!g.length) { msg(TL('Groupe {g} vide. Maj+{g} pour l\'assigner.', { g: n }), '#a59c88', 3); return; }
      for (const r of fleet) r.sel = r.group === n && !r.dead;
    }
    SFX.play('ui', 1); return;
  }
  switch (act) {
    case 'pilot': togglePilot(); break;
    case 'follow': orderAll('follow'); break;
    case 'hold': orderAll('hold'); break;
    case 'auto': e.shiftKey ? cycleBrain() : orderAll('auto'); break;
    case 'selectAll': { const alive = fleet.filter(r => !r.dead); const all = alive.length && alive.every(r => r.sel); for (const r of alive) r.sel = !all; SFX.play('ui', 1); break; }
    case 'reload': if (!player.inside && player.ammo < player.pw.mag && player.reloadT <= 0) startReload(player); break;
    case 'help': renderHelp(); showOverlay('help', true); pauseGameSoft(); break;
    case 'beacon': if (!base) toggleBeacon(); break;
    case 'map': if (!base) mapOpen = !mapOpen; break;
    case 'defend': if (base) openDrawer('construire'); else orderAll('beacon'); break;
    case 'interact': if (base && baseNearB && !placing) openBuilding(baseNearB); break;
    case 'formation': cycleFormation(); break;
    case 'patrol': togglePatrol(); break;
    case 'ability': useSelectedAbilities(); break;
    case 'dash': dash(); break;
    case 'wmode': cycleWeaponModes(); break;
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; EXPV.kp[e.code] = false; const k = normKey(e); if (k && actionFor(k) === 'interact') keys.INTERACT = false; });

// tir en bascule & visée assistée
let fireLatch = false;
function aimAssist(p) {
  let best = null, bs = .45; const ma = Math.atan2(mouse.wy - p.y, mouse.wx - p.x);
  query(p.x - 700, p.y - 700, p.x + 700, p.y + 700, v => { if (v.team === 0 || v.dead || v.hidden || v.etype === 'cible') return; const d = Math.hypot(v.x - p.x, v.y - p.y); if (d > 700) return; const da = Math.abs(angDiff(ma, Math.atan2(v.y - p.y, v.x - p.x))); const sc = da + d / 4000; if (sc < bs) { bs = sc; best = v; } });
  if (best) p.ang = Math.atan2(best.y - p.y, best.x - p.x);
}
