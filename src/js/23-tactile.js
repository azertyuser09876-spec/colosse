// Téléphone et tablette : commandes tactiles, orientation, retour Android.

// ================= TÉLÉPHONE ET TABLETTE =================
const TOUCH = { on: false, mx: 0, my: 0, fire: false };
const TC = { move: null, aim: null, free: new Map(), pinch: null };
const STICK_R = 62;
function touchWanted() { return settings.touch === 'on' || (settings.touch !== 'off' && (TOUCH.seen || (window.matchMedia && matchMedia('(pointer: coarse)').matches))); }
function applyTouch() {
  const on = touchWanted();
  if (on !== TOUCH.on) { TOUCH.on = on; resize(); }
  document.body.classList.toggle('touch', on);
  updateTouchUI();
}
function updateTouchUI() {
  const ui = $('#touchUI'); if (!ui) return;
  const show = TOUCH.on && inGame() && !drawerOpen && !paused && !EXPV.id;
  ui.classList.toggle('on', show);
  if (!show) return;
  const base = state === 'base';
  ui.querySelector('[data-tk=beacon]').style.display = state === 'raid' ? '' : 'none';
  ui.querySelector('[data-tk=base]').style.display = base ? '' : 'none';
  ui.querySelector('[data-tk=map]').style.display = state === 'raid' ? '' : 'none';
  ui.querySelector('[data-tk=place]').style.display = base && placing ? '' : 'none';
  ui.querySelector('[data-tk=tactical]').classList.toggle('on', tactical);
  const pil = ui.querySelector('[data-tk=pilot]'); pil.textContent = player && player.inside ? 'Sortir' : 'Piloter';
}
function relT(t) { const r = cv.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; }
function stickZone(p) { if (p.y < VH * .45) return null; if (p.x < VW * .33) return 'move'; if (p.x > VW * .67) return 'aim'; return null; }
function touchDown(t) {
  const p = relT(t);
  if (!inGame() || paused || drawerOpen) return;
  const ux = p.x / uiScale(), uy = p.y / uiScale();
  if (hitWeaponRow(ux, uy)) return;
  if (state === 'base' && expTrackHit(ux, uy)) return;
  const card = hudCards.find(h => ux >= h.x && ux <= h.x + h.w && uy >= h.y && uy <= h.y + h.h);
  if (card) { const alive = card.units.filter(u => !u.dead); if (alive.length) { const on = !alive.every(u => u.sel); for (const u of alive) u.sel = on; SFX.play('ui', 1); } return; }
  if (state === 'base' && placing) { mouse.x = p.x; mouse.y = p.y; const w = screenToWorld(p.x, p.y); mouse.wx = w.x; mouse.wy = w.y; baseTick(0); mouse.ldown = true; confirmPlace(); TC.free.set(t.identifier, { x0: p.x, y0: p.y, x: p.x, y: p.y, t0: performance.now(), place: true }); return; }
  const z = stickZone(p);
  if (z === 'move' && !TC.move) { TC.move = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y }; return; }
  if (z === 'aim' && !TC.aim) { TC.aim = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y }; return; }
  TC.free.set(t.identifier, { x0: p.x, y0: p.y, x: p.x, y: p.y, t0: performance.now() });
  if (TC.free.size === 2) { const [a, b] = [...TC.free.values()]; TC.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.userZoom }; mouse.drag = null; }
  else if (tactical && TC.free.size === 1) mouse.drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, shift: true, touch: true };
}
function touchMoveEv(t) {
  const p = relT(t);
  if (TC.move && TC.move.id === t.identifier) { TC.move.x = p.x; TC.move.y = p.y; return; }
  if (TC.aim && TC.aim.id === t.identifier) { TC.aim.x = p.x; TC.aim.y = p.y; return; }
  const f = TC.free.get(t.identifier); if (!f) return;
  f.x = p.x; f.y = p.y;
  if (f.place) { mouse.x = p.x; mouse.y = p.y; return; }
  if (TC.pinch && TC.free.size >= 2) { const [a, b] = [...TC.free.values()]; cam.userZoom = clamp(TC.pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / TC.pinch.d0, Math.min(.5, minZoom()), 1.8); return; }
  if (mouse.drag && mouse.drag.touch) { mouse.drag.x1 = p.x; mouse.drag.y1 = p.y; }
}
function touchUpEv(t) {
  if (TC.move && TC.move.id === t.identifier) { TC.move = null; return; }
  if (TC.aim && TC.aim.id === t.identifier) { TC.aim = null; return; }
  const f = TC.free.get(t.identifier); if (!f) return;
  TC.free.delete(t.identifier);
  if (f.place) { mouse.ldown = false; return; }
  if (TC.pinch) { if (TC.free.size < 2) TC.pinch = null; return; }
  const moved = Math.hypot(f.x - f.x0, f.y - f.y0), dt = performance.now() - f.t0;
  if (mouse.drag && mouse.drag.touch) {
    const d = mouse.drag; mouse.drag = null;
    if (moved > 14) { const x0 = Math.min(d.x0, d.x1), x1 = Math.max(d.x0, d.x1), y0 = Math.min(d.y0, d.y1), y1 = Math.max(d.y0, d.y1); let n = 0; for (const r of fleet) { if (r.dead) continue; const s = worldToScreen(r.x, r.y); if (s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1) { r.sel = true; n++; } } if (n) SFX.play('ui', 1); return; }
  }
  if (moved < 16 && dt < 450) touchTap(f.x, f.y);
}
function touchTap(sx, sy) {
  const w = screenToWorld(sx, sy);
  let rob = null, bd = Infinity;
  for (const r of fleet) { if (r.dead) continue; const q = d2(r.x, r.y, w.x, w.y); if (q < (r.r + 26) ** 2 && q < bd) { bd = q; rob = r; } }
  if (rob) { rob.sel = !rob.sel; SFX.play('ui', 1); return; }
  if (state === 'base' && !tactical) {
    const b = bAt(w.x, w.y);
    if (b) { if (b === baseSel) openBuilding(b); else { baseSel = b; if (BUILD[b.type].prod) collect(b); updateBPanel(); SFX.play('ui', 1); } return; }
    if (baseSel) { baseSel = null; updateBPanel(); }
  }
  if (fleet.some(r => r.sel && !r.dead)) issueOrderAt(w.x, w.y, false);
}
function touchFrame() {
  TOUCH.mx = TOUCH.my = 0; TOUCH.fire = false;
  if (!TOUCH.on || !inGame()) return;
  if (TC.move) { const dx = TC.move.x - TC.move.ox, dy = TC.move.y - TC.move.oy, l = Math.hypot(dx, dy); if (l > 8) { const k = Math.min(1, l / STICK_R) / l; TOUCH.mx = dx * k; TOUCH.my = dy * k; } }
  if (TC.aim) {
    const dx = TC.aim.x - TC.aim.ox, dy = TC.aim.y - TC.aim.oy, l = Math.hypot(dx, dy);
    if (l > 10) { const F = focus(), s = worldToScreen(F.x, F.y); mouse.x = s.x + dx / l * 240; mouse.y = s.y + dy / l * 240; TOUCH.fire = l > 26; }
  }
}
function drawTouch(c) {
  if (!TOUCH.on || !inGame() || drawerOpen) return;
  const stick = (st, dx, dy, label) => {
    const ox = st ? st.ox : dx, oy = st ? st.oy : dy;
    c.globalAlpha = st ? .55 : .22; c.strokeStyle = '#e8dcc4'; c.lineWidth = 3; circ(c, ox, oy, STICK_R); c.stroke();
    let kx = ox, ky = oy; if (st) { const vx = st.x - ox, vy = st.y - oy, l = Math.hypot(vx, vy), m = Math.min(l, STICK_R); if (l > 0) { kx = ox + vx / l * m; ky = oy + vy / l * m; } }
    c.fillStyle = '#e8dcc4'; c.globalAlpha = st ? .6 : .25; circ(c, kx, ky, 24); c.fill();
    if (!st) { c.globalAlpha = .45; c.font = `600 12px ${FONT}`; c.textAlign = 'center'; c.fillText(label, ox, oy + STICK_R + 16); }
    c.globalAlpha = 1;
  };
  stick(TC.move, Math.max(110, VW * .14), VH - 120, 'Déplacement');
  stick(TC.aim, VW - Math.max(170, VW * .17), VH - 120, 'Visée et tir');
}
function hideFleetPop() { $('#fleetPop').classList.remove('on'); }
cv.addEventListener('touchstart', e => { e.preventDefault(); SFX.init(); hideFleetPop(); if (!TOUCH.seen) { TOUCH.seen = true; applyTouch(); } for (const t of e.changedTouches) { if (EXPV.id) expViewTouch('down', t); else touchDown(t); } }, { passive: false });
cv.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) { if (EXPV.id) expViewTouch('move', t); else touchMoveEv(t); } }, { passive: false });
cv.addEventListener('touchend', e => { e.preventDefault(); for (const t of e.changedTouches) { if (EXPV.id) expViewTouch('up', t); else touchUpEv(t); } }, { passive: false });
cv.addEventListener('touchcancel', e => { for (const t of e.changedTouches) { if (EXPV.id) expViewTouch('up', t); else touchUpEv(t); } }, { passive: false });
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-tk]'); if (!b) return;
  e.preventDefault(); SFX.init();
  const k = b.dataset.tk, base = state === 'base';
  if (k !== 'fleet') hideFleetPop();
  switch (k) {
    case 'dash': dash(); break;
    case 'act': if (base) { if (baseNearB && !placing) openBuilding(baseNearB); } else { keys.INTERACT = true; actPointer = e.pointerId; } break;
    case 'ability': useSelectedAbilities(); break;
    case 'pilot': togglePilot(); break;
    case 'beacon': toggleBeacon(); break;
    case 'base': openDrawer('construire'); break;
    case 'tactical': tactical = !tactical; mouse.drag = null; SFX.play('ui', 1); break;
    case 'map': mapOpen = !mapOpen; break;
    case 'menu': pauseGame(); break;
    case 'place': placing = null; SFX.play('ui', .7); break;
    case 'fleet': $('#fleetPop').classList.toggle('on'); break;
    case 'f-follow': orderAll('follow'); break;
    case 'f-hold': orderAll('hold'); break;
    case 'f-beacon': if (base) openDrawer('construire'); else orderAll('beacon'); break;
    case 'f-auto': orderAll('auto'); break;
    case 'f-all': { const alive = fleet.filter(r => !r.dead); const all = alive.length && alive.every(r => r.sel); for (const r of alive) r.sel = !all; SFX.play('ui', 1); break; }
    case 'f-none': for (const r of fleet) r.sel = false; SFX.play('ui', .6); break;
    case 'f-form': cycleFormation(); break;
    case 'f-patrol': togglePatrol(); break;
  }
  updateTouchUI();
});
let actPointer = null;
document.addEventListener('pointerup', e => { if (e.pointerId === actPointer) { keys.INTERACT = false; actPointer = null; } });
document.addEventListener('pointercancel', e => { if (e.pointerId === actPointer) { keys.INTERACT = false; actPointer = null; } });
// retour Android / Échap
window.colosseBack = function () {
  if ($('#tutDlg').classList.contains('on')) { if (TUT.on) TUT.resume(); else showOverlay('tutDlg', false); return; }
  if ($('#account').classList.contains('on')) { showOverlay('account', false); return; }
  if ($('#settings').classList.contains('on')) { closeSettings(); return; }
  if ($('#help').classList.contains('on')) { showOverlay('help', false); return; }
  if (EXPV.id) { expViewClose(); return; }
  if (drawerOpen) { closeDrawer(); return; }
  if (state === 'base' && placing) { placing = null; return; }
  if (mapOpen) { mapOpen = false; return; }
  if (paused) { resumeGame(); return; }
  if (inGame()) pauseGame();
};
function checkOrientation() {
  const rot = $('#rotate'); if (!rot) return;
  rot.classList.toggle('on', TOUCH.on && inGame() && innerHeight > innerWidth * 1.05 && !TOUCH.portraitOk);
}
setInterval(() => { checkOrientation(); updateTouchUI(); }, 500);
function registerSW() {
  try { if ('serviceWorker' in navigator && document.querySelector('link[rel=manifest]') && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
}
window.colossePause = () => { if (inGame() && !paused && state !== 'base' && !LIVE.game) pauseGame(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) window.colossePause(); SFX.suspend(document.hidden); });
window.colosseAudio = on => SFX.suspend(!on);
