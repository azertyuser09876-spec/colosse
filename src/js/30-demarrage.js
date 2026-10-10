// Boucle d'images et démarrage du jeu.

// ================= BOUCLE =================
function camUpdate(dt) {
  const F = focus(); let z = cam.userZoom;
  if (tactical) z *= .62;
  if (player.inside) z *= pilotZoomMul(player.inside.r);
  { const mz = minZoom(); if (cam.userZoom < mz) cam.userZoom = lerp(cam.userZoom, mz, 1 - Math.exp(-dt * 2)); }
  z = Math.max(z, zoomFloor());
  cam.zoom = lerp(cam.zoom, z, 1 - Math.exp(-dt * 4));
  const LA = Math.max(1, .55 / cam.zoom), lx = tactical || placing ? 0 : clamp((mouse.wx - F.x) * .18, -150 * LA, 150 * LA), ly = tactical || placing ? 0 : clamp((mouse.wy - F.y) * .18, -110 * LA, 110 * LA);
  // la caméra anticipe un peu le déplacement, puis suit en douceur
  const k2 = 1 - Math.exp(-dt * 1.8); cam.lvx = lerp(cam.lvx || 0, tactical || placing ? 0 : clamp((F.vx || 0) * .16, -60, 60), k2); cam.lvy = lerp(cam.lvy || 0, tactical || placing ? 0 : clamp((F.vy || 0) * .16, -45, 45), k2);
  const k = 1 - Math.exp(-dt * 6.5);
  cam.x = camBound(lerp(cam.x, F.x + lx + cam.lvx, k), cam.zoom, VW); cam.y = camBound(lerp(cam.y, F.y + ly + cam.lvy, k), cam.zoom, VH);
  cam.shake = Math.max(0, cam.shake - dt * 36);
  const kk = Math.exp(-dt * 11); cam.kx = (cam.kx || 0) * kk; cam.ky = (cam.ky || 0) * kk;
}
let lastT = performance.now(), frameN = 0, frameMs = 16, frameWork = 8; // frameMs : intervalle entre deux images ; frameWork : travail de l'image précédente
function frame(now) {
  // économie d'énergie : 30 images par seconde au plus
  if (settings.fps30 && now - lastT < 31) { requestAnimationFrame(frame); return; }
  const rdt = Math.min(.05, Math.max(0, (now - lastT) / 1000)), w0 = performance.now(); frameMs = now - lastT; lastT = now;
  try {
    NETVIS = false;
    const live = !!(LIVE.game && state === 'raid');
    if (inGame()) { touchFrame(); if (!paused || live) { update(rdt * (tactical && !live ? .3 : 1)); camUpdate(rdt); } if (live) LIVE.tick(rdt); EXP.tick(rdt); if (EXPV.id && expViewFrame(rdt)) { } else if (!drawerOpen || (frameN++ % 4 === 0)) render(); if (drawerOpen) { animateHub(now / 1000); expTabLive(now); } }
    else if (state === 'result') { EXP.tick(rdt); render(); }
    else if (state === 'title') drawTitle(now / 1000);
    if (TUT.on) TUT.tick(rdt);
    fxAutoTick(rdt);
    hitMarkT = Math.max(0, hitMarkT - rdt); killMarkT = Math.max(0, killMarkT - rdt);
    for (let i = dmgDirs.length - 1; i >= 0; i--) { dmgDirs[i].t -= rdt * .9; if (dmgDirs[i].t <= 0) dmgDirs.splice(i, 1); }
    const vcx = EXPV.id ? EXP.cx.get(EXPV.id) : null; if (vcx) EXP.run(vcx, () => SFX.tick(rdt)); else SFX.tick(rdt);
  } catch (err) { console.error(err); ERRLOG.add('image', err && err.message || err, err && err.stack ? err.stack.split('\n').slice(1, 3).join(' | ') : ''); }
  frameWork = performance.now() - w0;
  requestAnimationFrame(frame);
}

function init() {
  applyColors(); applyTouch(); applyUiScale(); setRegionPalette(null); resize(); refreshKeyHints(); registerSW();
  window.addEventListener('keydown', e => { if (e.key === 'GoBack' || e.key === 'BrowserBack') { e.preventDefault(); window.colosseBack(); } });
  window.addEventListener('resize', resize);
  showScreen('title'); state = 'title';
  try { localStorage.removeItem(TUT_KEY); } catch (e) { } // tutoriel interrompu par une fermeture : la vraie partie n'a pas bougé
  refreshTitle();
  { const vn = $('#verNum'); if (vn) vn.textContent = VERSION; }
  maybeShowNotes();
  if (!LANG_SET) setTimeout(() => openLangs(true), 120); // premier lancement : choix de la langue
  loadoutCheck();
  if (saveNotice) { const t = saveNotice; saveNotice = ''; setTimeout(() => askConfirm({ t: TL('Sauvegarde'), x: t, ok: TL('Compris'), no: false }), 400); }
  requestAnimationFrame(frame);
  netInit();
  probeOrigin().then(() => { if (ORIGIN_SRV && ACC.mode !== 'server') netInit(); });
}
init();
