// Opérations (3.0) : convoi, sauvetage, sabotage, forage et traque. Ce sont des contrats qui posent leurs propres
// objectifs dans le monde au début du raid. Comme les autres contrats, leur récompense se touche à l'extraction.

const MIS_KINDS = ['convoy', 'rescue', 'demolition', 'hold', 'manhunt'];
const MISCOL = '#59d2ff';
let MIS = [], misReachG = null;
const isMission = c => !!c && MIS_KINDS.includes(c.kind);

const NPC_PAL = {
  truck: { body: '#5b5a42', body2: '#3c3b2c', plate: '#7b795a', acc: '#f2c14e', glow: 'rgba(242,193,78,', dark: '#1a1a13' },
  drill: { body: '#6d5b2b', body2: '#47391b', plate: '#93803e', acc: '#ffcf4a', glow: 'rgba(255,207,74,', dark: '#1b170c' },
  surv: { body: '#c4692b', body2: '#7c401c', plate: '#dcd6c8', acc: MISCOL, glow: 'rgba(89,210,255,', dark: '#2a1a10' },
};
const PAL_BOUNTY = { body: '#3b3327', body2: '#231d15', plate: '#5e4f33', acc: '#ffb020', glow: 'rgba(255,176,32,', dark: '#120f0a' };
const BOUNTY_NAMES = [TL('Croc-de-Fer'), TL('La Veuve'), TL('Rouille-Rouge'), TL('Le Fossoyeur'), TL('Mâchoire'), TL('Cendre-Noire'), TL('Le Héraut'), TL('Vieux Tonnerre'), TL('Le Boucher'), TL('Sept-Lames'), TL('La Herse'), TL('Grand-Faucheur')];
const misName = c => c.nk !== undefined && BOUNTY_NAMES[c.nk] ? BOUNTY_NAMES[c.nk] : c.name || TL('Cible'); // le nom suit la langue du joueur
const BOUNTY_POOL = [null, ['char'], ['char', 'mastodonte'], ['ravageur', 'mastodonte'], ['broyeur', 'ravageur', 'executeur']];
const BOUNTY_HP = { char: 3, mastodonte: 1.8, ravageur: 2.4, broyeur: 1.6, executeur: 1.3 };

// ================= CONTRATS D'OPÉRATION =================
function missionGen(c, t) {
  switch (c.kind) {
    case 'demolition': c.count = 3; c.time = Math.max(90, 150 - 10 * t); break;
    case 'hold': c.time = 90 + 15 * t; break;
    case 'manhunt': c.target = pick(BOUNTY_POOL[clamp(t, 1, 4)]); c.nk = (Math.random() * BOUNTY_NAMES.length) | 0; c.name = BOUNTY_NAMES[c.nk]; break;
  }
}
function missionText(c) {
  switch (c.kind) {
    case 'convoy': return TL('Escorter un convoi jusqu\'au dépôt');
    case 'rescue': return TL('Retrouver et ramener un pilote abattu');
    case 'demolition': return TL('Saboter les 3 générateurs d\'un avant-poste');
    case 'hold': return TL('Défendre une foreuse pendant {t}', { t: mmss(c.time) });
    case 'manhunt': return TL('Traquer et abattre « {name} »', { name: misName(c) });
  }
  return '';
}
function missionDesc(c) {
  switch (c.kind) {
    case 'convoy': return TL('Un camion blindé attend près du point d\'insertion. Il n\'avance que si vous restez près de lui, et la route est piégée.');
    case 'rescue': return TL('Un pilote allié s\'est écrasé dans une zone de recherche. Trouvez-le, relevez-le, puis gardez-le en vie jusque dans le cercle d\'extraction.');
    case 'demolition': return TL('Dès le premier générateur détruit, l\'alarme sonne : il reste {t} pour abattre les deux autres avant leur verrouillage.', { t: mmss(c.time) });
    case 'hold': return TL('Lancez la foreuse, puis tenez la position sous des vagues d\'assaut. Elle s\'arrête si personne ne la garde. Le minerai tombe au sol à la fin.');
    case 'manhunt': return TL('{foe} d\'élite renforcé, escorté et toujours en mouvement. Les relevés ne donnent qu\'une zone approximative.', { foe: ENEMIES[c.target] ? ENEMIES[c.target].n : TL('Machine') });
  }
  return '';
}
function misState(c) { return raidStats && raidStats.mis ? raidStats.mis[c.id] : null; }
function misProgress(c) { const s = misState(c); return s ? [s.a, s.b] : [0, c.kind === 'demolition' ? 3 : 1]; }
function misFailed(c) { const s = misState(c); return !!(s && s.fail); }
function misLine(c) {
  const T = missionText(c), s = misState(c), m = MIS.find(o => o.c === c);
  if (!s) return T + ' · ' + TL('indisponible ici');
  if (s.fail) return T + ' · ' + ((m && m.why) || TL('échoué'));
  if (!m) return s.a >= s.b ? T + ' · ' + TL('fait') : T; // raid terminé : l'opération n'est plus suivie
  if (s.a >= s.b && c.kind !== 'demolition') return T + ' · ' + ({ convoy: TL('livré'), rescue: TL('pilote extrait'), hold: TL('forage terminé'), manhunt: TL('cible abattue') }[c.kind] || TL('fait'));
  switch (c.kind) {
    case 'convoy': return T + ' · ' + (m.phase === 'idle' ? TL('rejoignez le camion') : TL('{n} %', { n: Math.round(m.prog * 100) }) + (m.wait ? ' · ' + TL('en attente d\'escorte') : '')) + misHp(m.npc);
    case 'rescue': return T + ' · ' + (m.phase === 'lost' ? TL('fouillez la zone') : m.phase === 'found' ? TL('relevez-le [{key}]', { key: keyLabel('interact') }) : TL('ramenez-le au cercle') + misHp(m.npc));
    case 'demolition': return TL('Générateurs {a} / 3', { a: s.a }) + (m.phase === 'alarm' ? ' · ' + TL('verrouillage dans {t}', { t: mmss(Math.max(0, m.left)) }) : s.a >= 3 ? ' · ' + TL('avant-poste détruit') : '');
    case 'hold': return T + ' · ' + (m.phase === 'idle' ? TL('lancez le forage [{key}]', { key: keyLabel('interact') }) : TL('{n} %', { n: Math.floor(100 * (1 - m.left / m.T)) }) + ' · ' + TL('reste {t}', { t: mmss(Math.max(0, m.left)) }) + (m.wait ? ' · ' + TL('arrêtée, sans garde') : '')) + misHp(m.npc);
    case 'manhunt': return T + ' · ' + (time - m.seenT < 6 ? TL('en vue') : TL('zone de {n} m', { n: Math.round(m.hint.r / 10) }));
  }
  return T;
}
function misHp(u) { const p = u && !u.dead ? Math.floor(100 * u.hp / u.maxhp) : 100; return p < 100 ? ' · ' + TL('{n} % PV', { n: p }) : ''; }

// ================= MISE EN PLACE =================
// cases que le convoi peut atteindre depuis l'insertion (les murs se dynamitent, pas les falaises ni les immeubles)
function misReach() {
  if (misReachG && misReachG.W === W) return misReachG.g;
  const g = new Uint8Array(WT * WT), q = new Int32Array(WT * WT); let h = 0, n = 0;
  const pass = i => W.ground[i] !== 7 && (!W.obs[i] || OBS[W.obs[i]].lv <= 4);
  const s = ((W.spawn.y / TILE) | 0) * WT + ((W.spawn.x / TILE) | 0); g[s] = 1; q[n++] = s;
  while (h < n) {
    const i = q[h++], x = i % WT, y = (i / WT) | 0;
    if (x > 1 && !g[i - 1] && pass(i - 1)) { g[i - 1] = 1; q[n++] = i - 1; }
    if (x < WT - 2 && !g[i + 1] && pass(i + 1)) { g[i + 1] = 1; q[n++] = i + 1; }
    if (y > 1 && !g[i - WT] && pass(i - WT)) { g[i - WT] = 1; q[n++] = i - WT; }
    if (y < WT - 2 && !g[i + WT] && pass(i + WT)) { g[i + WT] = 1; q[n++] = i + WT; }
  }
  misReachG = { W, g }; return g;
}
function misSite(minD, maxD) {
  const sp = W.spawn, C = WPX / 2, R = misReach();
  for (let pass = 0; pass < 2; pass++) for (let k = 0; k < 160; k++) {
    const p = findWalkableNear(sp.x, sp.y, minD * (pass ? .6 : 1), maxD, 3); if (!p) continue;
    if (!R[tileAt(p.x, p.y)]) continue;
    if (p.x < 700 || p.y < 700 || p.x > WPX - 700 || p.y > WPX - 700) continue;
    if (!pass && d2(p.x, p.y, C, C) < 1900 * 1900) continue;
    if (!pass && MIS.some(m => m.site && d2(m.site.x, m.site.y, p.x, p.y) < 1300 * 1300)) continue;
    return p;
  }
  return findWalkableNear(sp.x, sp.y, minD * .5, maxD, 80) || { x: clamp(sp.x + minD, 700, WPX - 700), y: sp.y };
}
function misNpc(type, x, y, o) {
  const u = baseUnit(Object.assign({ kind: 'npc', npc: type, team: 0, x, y, npal: NPC_PAL[type], active: true }, o));
  units.push(u); return u;
}
// un groupe d'hostiles posté sur place, tiré des ennemis de la région
function misCamp(x, y, n, spread, opts) {
  const pool = huntPool(regionCur).filter(k => k !== 'broyeur');
  n = Math.round(n * armyScale(.3));
  for (let i = 0; i < n; i++) { const q = findWalkableNear(x, y, 40, spread, 15); if (q) makeEnemy(pick(pool), q.x, q.y, opts); }
}
function misClear(x, y, r) { for (const e of units) if (e.kind === 'enemy' && !e.boss && !e.giant && !e.dead && d2(e.x, e.y, x, y) < r * r) e.dead = true; }
function misSetup() {
  MIS = []; misReachG = null; if (!raidStats) return; raidStats.mis = {};
  const tier = REGIONS[regionCur].tier;
  for (const c of raidContracts) {
    if (!isMission(c)) continue;
    const st = raidStats.mis[c.id] = { a: 0, b: c.kind === 'demolition' ? 3 : 1, fail: false };
    const m = { c, kind: c.kind, st, tier, phase: 'idle' };
    try { MIS_SETUP[c.kind](m); MIS.push(m); } catch (e) { console.warn('opération', c.kind, e); raidStats.mis[c.id] = null; }
  }
  for (const m of MIS) msg(TL('Opération : {what}. {how}', { what: missionText(m.c), how: MIS_INTRO[m.kind] }), MISCOL, 10);
}
const MIS_INTRO = {
  convoy: TL('Le camion attend près de vous.'),
  rescue: TL('Fouillez la zone de recherche marquée sur la carte.'),
  demolition: TL('L\'avant-poste est marqué sur la carte.'),
  hold: TL('La foreuse est marquée sur la carte.'),
  manhunt: TL('Sa zone approximative est marquée sur la carte.'),
};
const MIS_SETUP = {
  convoy(m) {
    const sp = W.spawn, p0 = findWalkableNear(sp.x, sp.y, 220, 380, 40) || { x: sp.x + 260, y: sp.y }, dst = misSite(2400, 3300);
    clearTiles((p0.x / TILE) | 0, (p0.y / TILE) | 0, 2); clearTiles((dst.x / TILE) | 0, (dst.y / TILE) | 0, 4); misClear(dst.x, dst.y, 420);
    const hp = 2600 * (1 + .35 * (m.tier - 1)) * diff.beacon * (1 + armyPower / 60);
    m.site = dst; m.npc = misNpc('truck', p0.x, p0.y, { r: 30, maxhp: hp, hp, armor: .25, spd: 66, crush: 2, invul: true, name: TL('Convoi') });
    m.npc.ang = Math.atan2(dst.y - p0.y, dst.x - p0.x);
    m.d0 = Math.hypot(dst.x - p0.x, dst.y - p0.y); m.prog = 0; m.amb = rnd(26, 34); m.waves = [.3, .64]; m.stuck = 0; m.blasts = 0; m.lp = { x: p0.x, y: p0.y }; m.waitT = 0; m.waitMsg = 0; m.hurtMsg = 0;
    misPad(dst.x, dst.y, 'depot'); reveal(dst.x, dst.y, 320);
    for (const f of [.42, .74]) { const p = findWalkableNear(lerp(p0.x, dst.x, f), lerp(p0.y, dst.y, f), 120, 380, 20); if (p) misCamp(p.x, p.y, 3 + m.tier * 2, 260); }
  },
  rescue(m) {
    const p = misSite(2200, 3800), q = findWalkableNear(p.x, p.y, 70, 150, 30) || p;
    clearTiles((p.x / TILE) | 0, (p.y / TILE) | 0, 3);
    m.site = p; m.ang = rnd(0, TAU);
    scarSprite('crater', p.x, p.y, 120, rnd(0, TAU)); scarSprite('burn', p.x - Math.cos(m.ang) * 140, p.y - Math.sin(m.ang) * 140, 150, rnd(0, TAU)); misPad(p.x, p.y, 'crash', m.ang);
    const hp = 170 * (1 + .3 * (m.tier - 1)) * Math.sqrt(diff.dmg);
    m.npc = misNpc('surv', q.x, q.y, { r: 9, human: true, maxhp: hp, hp, armor: .2, spd: 178, hidden: true, invul: true, down: true, name: TL('Pilote') });
    const a = rnd(0, TAU), d = rnd(80, 300); m.zone = { x: q.x + Math.cos(a) * d, y: q.y + Math.sin(a) * d, r: 560 };
    misCamp(p.x, p.y, 4 + m.tier * 2, 420);
    m.smokeT = 0; m.phase = 'lost';
  },
  demolition(m) {
    const p = misSite(2600, 4200); m.site = p;
    clearTiles((p.x / TILE) | 0, (p.y / TILE) | 0, 6); misClear(p.x, p.y, 340);
    m.gens = []; const a0 = rnd(0, TAU);
    for (let i = 0; i < 3; i++) {
      const a = a0 + i * TAU / 3, x = p.x + Math.cos(a) * 175, y = p.y + Math.sin(a) * 175;
      clearTiles((x / TILE) | 0, (y / TILE) | 0, 2); const g = makeEnemy('generateur', x, y); g.misObj = true; m.gens.push(g);
    }
    misPad(p.x, p.y, 'outpost', a0);
    for (let i = 0; i < 2; i++) { const a = a0 + Math.PI / 3 + i * Math.PI, q = findWalkableNear(p.x + Math.cos(a) * 280, p.y + Math.sin(a) * 280, 0, 70, 20); if (q) makeEnemy('bastion', q.x, q.y); }
    if (m.tier >= 2) { const q = findWalkableNear(p.x, p.y, 60, 160, 20); if (q) makeEnemy('egide', q.x, q.y); }
    misCamp(p.x, p.y, 5 + m.tier * 2, 460);
    m.T = m.c.time || 120; m.left = m.T; m.half = false; reveal(p.x, p.y, 300);
  },
  hold(m) {
    const p = misSite(1900, 3000); m.site = p;
    clearTiles((p.x / TILE) | 0, (p.y / TILE) | 0, 4); misClear(p.x, p.y, 480); misPad(p.x, p.y, 'drill');
    const hp = 3000 * (1 + .35 * (m.tier - 1)) * diff.beacon * (1 + armyPower / 60);
    m.npc = misNpc('drill', p.x, p.y, { r: 34, maxhp: hp, hp, armor: .3, static: true, invul: true, name: TL('Foreuse') });
    m.T = m.c.time || 120; m.left = m.T; m.wave = 6; m.hurtMsg = 0; m.waitMsg = 0; reveal(p.x, p.y, 300);
  },
  manhunt(m) {
    const type = ENEMIES[m.c.target] ? m.c.target : 'char', p = misSite(2600, 4600), E = ENEMIES[type], k = BOUNTY_HP[type] || 2;
    const e = makeEnemy(type, p.x, p.y); m.site = p; m.tgt = e;
    e.maxhp *= k; e.hp = e.maxhp; e.spd *= 1.18; e.sight = (e.sight || 600) * 1.2; e.elite = true; e.roam = true; e.bounty = misName(m.c); e.npal = PAL_BOUNTY;
    e.r = Math.round(E.r * 1.12); e.mscale = (e.mscale || 1) * 1.12; for (const mm of e.mounts) { mm.ox *= 1.12; mm.oy *= 1.12; mm.w.dmg = (mm.w.dmg || 0) * 1.3; }
    m.esc = []; const pool = huntPool(regionCur).filter(t => (ENEMIES[t].hp || 0) < 900);
    for (let i = 0; i < 3; i++) { const q = findWalkableNear(p.x, p.y, 70, 170, 15) || p; const g = makeEnemy(pick(pool), q.x, q.y); g.roam = true; m.esc.push(g); }
    m.hint = { x: p.x, y: p.y, r: 1000 }; m.roamT = rnd(30, 42); m.seenT = -99;
    misHint(m); m.hintT = 30;
  },
};
function misHint(m, keep) {
  const e = m.tgt; if (!keep) m.hint.r = Math.max(400, m.hint.r - 100);
  const a = rnd(0, TAU), d = rnd(0, m.hint.r * .6); m.hint.x = clamp(e.x + Math.cos(a) * d, 0, WPX); m.hint.y = clamp(e.y + Math.sin(a) * d, 0, WPX);
}

// marques au sol des sites (dépôt, foreuse, avant-poste, épave) : retenues comme les cicatrices du terrain
function misPad(x, y, kind, a = 0) {
  const R = kind === 'outpost' ? 300 : kind === 'crash' ? 260 : 170;
  stampGround(x - R, y - R, R * 2, R * 2, c => {
    c.save(); c.translate(x, y);
    if (kind === 'depot') {
      c.fillStyle = 'rgba(92,90,82,.82)'; rr(c, -130, -130, 260, 260, 10); c.fill();
      c.strokeStyle = 'rgba(30,28,24,.55)'; c.lineWidth = 2; for (let k = -130; k <= 130; k += 52) { c.beginPath(); c.moveTo(k, -130); c.lineTo(k, 130); c.moveTo(-130, k); c.lineTo(130, k); c.stroke(); }
      c.save(); rr(c, -130, -130, 260, 260, 10); c.clip(); c.lineWidth = 9; for (let k = -300; k < 300; k += 28) { c.strokeStyle = (k / 28) & 1 ? 'rgba(242,193,78,.55)' : 'rgba(20,18,14,.6)'; c.beginPath(); c.moveTo(k, -140); c.lineTo(k + 18, -122); c.moveTo(k, 122); c.lineTo(k + 18, 140); c.stroke(); } c.restore();
      c.strokeStyle = 'rgba(89,210,255,.5)'; c.lineWidth = 5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-40, s * 40 - 30); c.lineTo(0, s * 40); c.lineTo(40, s * 40 - 30); c.stroke(); }
    } else if (kind === 'drill') {
      c.fillStyle = 'rgba(88,86,78,.85)'; ngon(c, 8, 120, Math.PI / 8); c.fill();
      c.strokeStyle = 'rgba(22,20,16,.6)'; c.lineWidth = 3; ngon(c, 8, 120, Math.PI / 8); c.stroke();
      c.lineWidth = 8; c.setLineDash([16, 12]); c.strokeStyle = 'rgba(255,207,74,.45)'; circ(c, 0, 0, 100); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(14,12,10,.55)'; for (let k = 0; k < 8; k++) { const b = k * TAU / 8; circ(c, Math.cos(b) * 84, Math.sin(b) * 84, 4); c.fill(); }
    } else if (kind === 'outpost') {
      c.rotate(a); c.fillStyle = 'rgba(80,80,76,.78)'; ngon(c, 6, 255, 0); c.fill();
      c.strokeStyle = 'rgba(20,20,18,.5)'; c.lineWidth = 2; for (let k = -240; k <= 240; k += 48) { c.beginPath(); c.moveTo(k, -230); c.lineTo(k, 230); c.stroke(); }
      c.strokeStyle = 'rgba(18,18,16,.8)'; c.lineWidth = 9; for (let i = 0; i < 3; i++) { const b = i * TAU / 3; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(b + .4) * 90, Math.sin(b + .4) * 90, Math.cos(b) * 175, Math.sin(b) * 175); c.stroke(); }
      c.fillStyle = 'rgba(28,26,22,.85)'; rr(c, -34, -34, 68, 68, 6); c.fill(); c.strokeStyle = 'rgba(255,77,94,.4)'; c.lineWidth = 3; rr(c, -34, -34, 68, 68, 6); c.stroke();
    } else if (kind === 'crash') {
      c.rotate(a);
      c.strokeStyle = 'rgba(12,10,8,.45)'; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(-250, -6); c.quadraticCurveTo(-120, 10, -30, 0); c.stroke();
      c.lineWidth = 5; c.strokeStyle = 'rgba(8,6,5,.4)'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-240, s * 16); c.quadraticCurveTo(-120, s * 22, -40, s * 14); c.stroke(); }
      const hull = (pts, col) => { c.beginPath(); pts.forEach(([px, py], j) => j ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.stroke(); };
      hull([[-40, -26], [30, -32], [52, -12], [38, 18], [-30, 28], [-52, 6]], '#2e2c29');
      hull([[60, -20], [104, -30], [128, -6], [112, 22], [70, 26]], '#34312d');
      hull([[-10, -34], [10, -82], [26, -78], [18, -30]], '#2a2825'); hull([[0, 30], [24, 74], [38, 70], [22, 26]], '#2a2825');
      c.strokeStyle = 'rgba(200,190,170,.18)'; c.lineWidth = 1.5; for (let k = -30; k < 40; k += 14) { c.beginPath(); c.moveTo(k, -24); c.lineTo(k + 4, 22); c.stroke(); }
      c.fillStyle = 'rgba(89,210,255,.35)'; c.fillRect(84, -6, 22, 10);
    }
    c.restore();
  }, 'pad');
}

// ================= DÉROULEMENT =================
function misEscorted(u, R) {
  const F = focus(), R2 = R * R; if (!F.dead && d2(F.x, F.y, u.x, u.y) < R2) return true;
  for (const r of fleet) if (!r.dead && d2(r.x, r.y, u.x, u.y) < R2) return true;
  return false;
}
function misDone(m, txt) { m.phase = 'done'; m.st.a = m.st.b; msg(txt, MISCOL, 8); SFX.play('success', .7); }
function misFail(m, txt, why) { m.phase = 'fail'; m.st.fail = true; m.why = why; msg(txt, '#ec6b74', 8); SFX.play('fail', .5); }
function misWaveSize(m, k) { return Math.round((2 + m.tier * .8 + alertLv * .5) * k * diff.spawn * armyScale(.35)); }
function missionsTick(dt) {
  if (!MIS.length || !raidStats) return;
  const F = focus();
  for (const m of MIS) {
    if (m.phase === 'fail') continue;
    MIS_TICK[m.kind](m, dt, F);
  }
}
const MIS_TICK = {
  convoy(m, dt, F) {
    const u = m.npc; if (m.phase === 'done') return;
    if (u.dead) { misFail(m, TL('Le convoi a été détruit. Opération échouée.'), TL('convoi détruit')); return; }
    const esc = misEscorted(u, 650); m.wait = !esc && m.phase === 'go';
    if (m.phase === 'idle') { if (esc && raidTime > 6) { m.phase = 'go'; u.invul = false; msg(TL('Le convoi démarre. Il n\'avance que si vous restez à moins de 65 m.'), MISCOL, 7); SFX.play('beacon', .6); } return; }
    const dd = Math.hypot(m.site.x - u.x, m.site.y - u.y); m.prog = clamp(1 - dd / m.d0, 0, 1);
    if (dd < 150) { u.static = true; u.vx = u.vy = 0; misDone(m, TL('Convoi livré au dépôt. Contrat rempli à l\'extraction.')); return; }
    if (u.lastHurt > time - .3 && time > m.hurtMsg) { m.hurtMsg = time + 12; msg(TL('Le convoi est attaqué !'), '#ec6b74', 4); }
    if (esc) {
      goTo(u, m.site.x, m.site.y, dt, 1, 100); m.waitT = 0;
      // bloqué : le convoi dégage la route à l'explosif
      m.stuck += dt; if (Math.hypot(u.x - m.lp.x, u.y - m.lp.y) > 60) { m.stuck = 0; m.blasts = 0; m.lp = { x: u.x, y: u.y }; }
      if (m.stuck > 8) { m.stuck = 0; misBlast(m, u); }
    } else { m.waitT += dt; if (m.waitT > 2.5 && time > m.waitMsg) { m.waitMsg = time + 25; msg(TL('Le convoi s\'arrête : il attend son escorte.'), MISCOL, 4); } }
    if (m.waves.length && m.prog >= m.waves[0]) { m.waves.shift(); misAmbush(m, u, 1.6); msg(TL('Embuscade sur la route du convoi !'), '#ec6b74', 5); SFX.play('alarm', .6); }
    m.amb -= dt * (esc ? 1 : .4);
    if (m.amb <= 0) { m.amb = rnd(26, 34) / Math.sqrt(diff.spawn); misAmbush(m, u, 1); }
    if (u.mv > .2 && Math.random() < dt * 3) parts.push({ type: 'smoke', x: u.x - Math.cos(u.ang) * u.r * .2, y: u.y - Math.sin(u.ang) * u.r * .2, vx: rnd(-6, 6), vy: -14, life: 1.2, max: 1.2, size: 6, col: 'rgba(60,58,54,' });
  },
  rescue(m, dt, F) {
    const s = m.npc; if (m.phase === 'done') return;
    if (s.dead) { misFail(m, TL('Le pilote abattu n\'a pas survécu. Opération échouée.'), TL('pilote perdu')); return; }
    // fumée de l'épave, visible de loin
    m.smokeT -= dt;
    if (m.smokeT <= 0) { m.smokeT = .35; if (d2(m.site.x, m.site.y, cam.x, cam.y) < 2200 * 2200) parts.push({ type: 'smoke', x: m.site.x + rnd(-30, 30), y: m.site.y + rnd(-30, 30), vx: rnd(-8, 8), vy: -24, life: 4, max: 4, size: 20, col: 'rgba(66,62,56,' }); }
    if (m.phase === 'lost' || m.phase === 'idle') {
      m.phase = 'lost';
      if (d2(F.x, F.y, s.x, s.y) < 420 * 420 || fleet.some(r => !r.dead && d2(r.x, r.y, s.x, s.y) < 300 * 300)) {
        m.phase = 'found'; s.hidden = false; reveal(s.x, s.y, 420); SFX.play('beacon', .7);
        msg(TL('Pilote repéré ! Maintenez [{key}] près de lui pour le relever.', { key: keyLabel('interact') }), MISCOL, 7);
      }
      return;
    }
    if (m.phase === 'found') { if (Math.random() < dt * 4) parts.push({ type: 'smoke', x: s.x + 8, y: s.y - 4, vx: rnd(-5, 5), vy: -20, life: 1.8, max: 1.8, size: 7, col: 'rgba(225,70,60,' }); return; }
    // il suit le pilote (ou le robot piloté) ; s'il est distancé, il attend
    // pendant la fenêtre d'extraction, il court au centre du cercle (un grand robot le laisserait au bord)
    const lift = (B.state === 'window' || B.state === 'lift') && B.unit && d2(B.unit.x, B.unit.y, s.x, s.y) < 1100 * 1100, G = lift ? B.unit : F;
    const d = Math.hypot(G.x - s.x, G.y - s.y);
    if (d > 1100) { if (time > (m.lagMsg || 0)) { m.lagMsg = time + 15; msg(TL('Le pilote secouru est à la traîne : revenez le chercher.'), MISCOL, 4); } }
    else goTo(s, G.x, G.y, dt, d > 400 ? 1.15 : 1, lift ? 40 : G.r + 34);
    if (time - s.lastHurt > 5 && s.hp < s.maxhp) s.hp = Math.min(s.maxhp, s.hp + s.maxhp * .02 * dt);
    if (s.lastHurt > time - .3 && time > (m.hurtMsg || 0)) { m.hurtMsg = time + 10; msg(TL('Le pilote secouru est touché !'), '#ec6b74', 3); }
  },
  demolition(m, dt, F) {
    if (m.phase === 'done') return;
    const alive = m.gens.filter(g => !g.dead).length; m.st.a = 3 - alive;
    if (m.phase === 'idle' && alive < 3) {
      m.phase = 'alarm'; m.left = m.T; SFX.play('alarm', 1);
      msg(TL('ALARME ! Les générateurs restants se verrouillent dans {t}.', { t: mmss(m.T) }), '#ec6b74', 8);
      const g = m.gens.find(o => !o.dead); spawnGroup(m.site.x, m.site.y, 1000, 1300, misWaveSize(m, 1.4), { forced: g || undefined, alerted: true });
    }
    if (m.phase !== 'alarm') return;
    if (alive === 0) {
      misDone(m, TL('Avant-poste saboté : les trois générateurs sont détruits.'));
      const x = m.site.x, y = m.site.y, wt = EXPSIM; scarSprite('crater', x, y, 170, rnd(0, TAU));
      for (let k = 0; k < 5; k++) setTimeout(() => { if (state === 'raid' && EXPSIM === wt && !wt) boom(x + rnd(-150, 150), y + rnd(-150, 150), rnd(60, 110)); }, 200 + k * 260);
      return;
    }
    m.left -= dt;
    if (!m.half && m.left < m.T / 2) { m.half = true; const g = m.gens.find(o => !o.dead); spawnGroup(m.site.x, m.site.y, 1000, 1300, misWaveSize(m, 1), { forced: g, alerted: true }); msg(TL('Renforts en route vers l\'avant-poste.'), '#ec6b74', 5); }
    if (m.left <= 0) { for (const g of m.gens) if (!g.dead) { g.armor = .92; g.npal = PAL.boss; } misFail(m, TL('Verrouillage : les générateurs restants sont blindés. Opération échouée.'), TL('générateurs verrouillés')); }
  },
  hold(m, dt, F) {
    const u = m.npc; if (m.phase === 'done' || m.phase === 'idle') return;
    if (u.dead) { u.drill = false; misFail(m, TL('La foreuse a été détruite. Opération échouée.'), TL('foreuse détruite')); return; }
    const esc = misEscorted(u, 700); m.wait = !esc; u.drill = esc;
    if (esc) m.left -= dt; else if (time > m.waitMsg) { m.waitMsg = time + 20; msg(TL('La foreuse s\'arrête : personne ne la garde (70 m).'), MISCOL, 4); }
    if (u.lastHurt > time - .3 && time > m.hurtMsg) { m.hurtMsg = time + 12; msg(TL('La foreuse est attaquée !'), '#ec6b74', 4); }
    m.wave -= dt;
    if (m.wave <= 0) { m.wave = 18 / Math.sqrt(diff.spawn); spawnGroup(u.x, u.y, 1000, 1300, misWaveSize(m, 1 + (1 - m.left / m.T) * 1.2), { forced: u }); }
    if (esc && Math.random() < dt * 6) { FX.dust(u.x + rnd(-u.r, u.r), u.y + rnd(-u.r, u.r), 1, 14, 50); if (Math.random() < .3) parts.push({ type: 'spark', x: u.x, y: u.y, vx: rnd(-140, 140), vy: rnd(-140, 140), life: .4, max: .4, size: 2, col: '#ffcf4a' }); }
    if (m.left <= 0) {
      u.drill = false; scarSprite('crack', u.x, u.y, 150, rnd(0, TAU));
      const L = diff.loot, t = m.tier, out = { crystals: Math.round(10 * t * L), alloy: Math.round(8 * t * L), data: Math.round(5 * t * L), cores: t >= 2 ? 1 + (Math.random() < .3 * t ? 1 : 0) : 0 };
      for (const k in out) { let left = out[k]; while (left > 0) { const a = k === 'cores' ? 1 : Math.max(1, Math.ceil(out[k] / 4)), n = Math.min(left, a); left -= n; spawnItem(k, n, u.x + rnd(-40, 40), u.y + rnd(-40, 40)); } }
      misDone(m, TL('Forage terminé : le minerai est au sol, ramassez-le avant l\'extraction.'));
    }
  },
  manhunt(m, dt, F) {
    const e = m.tgt; if (m.phase === 'done') return;
    if (e.dead) {
      misDone(m, TL('« {name} » est abattu. Contrat rempli à l\'extraction.', { name: e.bounty }));
      spawnItem('cores', 1 + (m.tier >= 3 ? 1 : 0), e.x, e.y); spawnItem('data', Math.round(6 * m.tier * diff.loot), e.x, e.y);
      for (const g of m.esc) g.roam = false; return;
    }
    // il change de terrain de chasse de temps en temps, son escorte le suit
    m.roamT -= dt;
    if (m.roamT <= 0 && !(e.target && !e.target.dead)) {
      m.roamT = rnd(35, 50);
      for (let k = 0; k < 20; k++) {
        const q = findWalkableNear(e.x, e.y, 700, 1400, 4); if (!q || q.x < 600 || q.y < 600 || q.x > WPX - 600 || q.y > WPX - 600 || d2(q.x, q.y, W.spawn.x, W.spawn.y) < 1500 * 1500) continue;
        e.home = q; e.wp = null; e.wt = 0; for (const g of m.esc) if (!g.dead) { g.home = { x: q.x + rnd(-120, 120), y: q.y + rnd(-120, 120) }; g.wp = null; g.wt = 0; } break;
      }
    }
    m.hintT -= dt; if (m.hintT <= 0) { m.hintT = 30; misHint(m); }
    else if (d2(e.x, e.y, m.hint.x, m.hint.y) > (m.hint.r * 1.1) ** 2) { m.hintT = Math.max(m.hintT, 12); misHint(m, true); } // sortie de la zone : nouveau relevé, sans la resserrer
    if (d2(F.x, F.y, e.x, e.y) < 700 * 700 || fleet.some(r => !r.dead && d2(r.x, r.y, e.x, e.y) < 560 * 560)) {
      if (time - m.seenT > 25) { msg(TL('Cible en vue : « {name} ».', { name: e.bounty }), '#ffb020', 5); SFX.play('alarm', .4); }
      m.seenT = time;
    }
  },
};
function misAmbush(m, u, k) {
  const a = Math.atan2(m.site.y - u.y, m.site.x - u.x), x = u.x + Math.cos(a) * 700, y = u.y + Math.sin(a) * 700;
  spawnGroup(x, y, 450, 750, misWaveSize(m, k), { forced: u });
}
function misBlast(m, u) {
  const a = Math.atan2(m.site.y - u.y, m.site.x - u.x), fx = u.x + Math.cos(a) * (u.r + 30), fy = u.y + Math.sin(a) * (u.r + 30);
  const tx = (fx / TILE) | 0, ty = (fy / TILE) | 0; let n = 0;
  for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) {
    if (x < 3 || y < 3 || x >= WT - 3 || y >= WT - 3) continue; const i = y * WT + x, o = W.obs[i];
    if (o && OBS[o].lv < 99) { destroyTile(x, y, o, u); n++; }
  }
  m.blasts++;
  if (n) { boomLite(fx, fy, 60); msg(TL('Le convoi dégage la route à l\'explosif.'), MISCOL, 3); }
  else if (m.blasts >= 2) { const q = findWalkableNear(fx + Math.cos(a) * 80, fy + Math.sin(a) * 80, 0, 160, 40); if (q) { u.x = q.x; u.y = q.y; u.vx = u.vy = 0; u.nv = null; } m.blasts = 0; }
}

// ================= INTERACTIONS =================
function misNearest(F, reach) {
  let best = null, bd = Infinity;
  for (const m of MIS) {
    if (m.kind === 'rescue' && m.phase === 'found' && !m.npc.dead) { const q = d2(m.npc.x, m.npc.y, F.x, F.y); if (q < (reach + 34) ** 2 && q < bd) { bd = q; best = { kind: 'mis', o: m.npc, m, dur: 1.6, label: TL('Relever le pilote abattu'), q }; } }
    if (m.kind === 'hold' && m.phase === 'idle' && !m.npc.dead) { const q = d2(m.npc.x, m.npc.y, F.x, F.y); if (q < (reach + m.npc.r + 24) ** 2 && q < bd) { bd = q; best = { kind: 'mis', o: m.npc, m, dur: 1.2, label: TL('Lancer le forage'), q }; } }
  }
  return best;
}
function misActivate(it) {
  const m = it.m, u = m.npc;
  if (m.kind === 'rescue') {
    m.phase = 'follow'; u.down = false; u.invul = false; SFX.play('ui', 1);
    msg(TL('Le pilote vous suit. Ramenez-le vivant dans le cercle d\'extraction.'), MISCOL, 7);
    spawnGroup(u.x, u.y, 1000, 1300, misWaveSize(m, 1), { forced: u });
  } else if (m.kind === 'hold') {
    m.phase = 'drill'; u.invul = false; u.drill = true; m.wave = 6; SFX.play('beacon', 1); scarSprite('crack', u.x, u.y, 90, rnd(0, TAU));
    msg(TL('Forage lancé : tenez la position {t}. Les vagues vont converger sur la foreuse.', { t: mmss(m.T) }), MISCOL, 7);
  }
}
function missionsEnd(success) {
  for (const m of MIS) {
    if (m.kind === 'rescue' && m.phase === 'follow' && success) {
      const s = m.npc, z = B && (B.unit || B.last), F = focus(); // B.last : la balise peut tomber pendant le décollage
      if (!s.dead && z && (d2(s.x, s.y, z.x, z.y) < (ZONE_R + 80) ** 2 || d2(s.x, s.y, F.x, F.y) < (F.r + 160) ** 2)) m.st.a = 1;
    }
  }
  MIS = []; misReachG = null;
}

// ================= RENDU =================
function paintNpc(c, u, P, t, mv) {
  if (u.npc === 'truck') paintTruck(c, u.r, P, t, mv, u);
  else if (u.npc === 'drill') paintDrill(c, u.r, P, t, mv, u);
  else paintSurvivor(c, u.r, P, t, mv, u);
}
function paintTruck(c, r, P, t, mv, u) {
  const L = r * 1.15, H = r * .62, dark = '#111213';
  // trois essieux, pneus à crampons qui défilent
  for (const ax of [-.74, -.32, .62]) for (const sd of [-1, 1]) {
    const x = ax * L, y = sd * (H + r * .02);
    c.fillStyle = dark; rr(c, x - r * .21, y - r * .14, r * .42, r * .28, r * .08); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = Math.max(1, r * .035); const st = r * .1, off = ((t * r * 1.3) % st + st) % st;
    c.beginPath(); for (let k = -r * .21 + off; k < r * .2; k += st) { c.moveTo(x + k, y - r * .12); c.lineTo(x + k, y + r * .12); } c.stroke();
  }
  c.fillStyle = P.dark; rr(c, -L, -H * .86, L * 2.08, H * 1.72, r * .1); c.fill();
  // conteneur blindé
  c.fillStyle = P.body; rr(c, -L * 1.02, -H, L * 1.32, H * 2, r * .08); c.fill(); c.strokeStyle = P.dark; c.lineWidth = Math.max(1, r * .05); c.stroke();
  c.strokeStyle = P.body2; c.lineWidth = Math.max(1, r * .04);
  for (let i = 1; i < 7; i++) { const x = -L * 1.02 + i * L * 1.32 / 7; c.beginPath(); c.moveTo(x, -H * .94); c.lineTo(x, H * .94); c.stroke(); }
  c.fillStyle = P.plate; rr(c, -L * .62, -H * .42, L * .56, H * .84, r * .05); c.fill();
  c.save(); c.beginPath(); c.rect(-L * 1.02, -H, L * .1, H * 2); c.clip(); c.lineWidth = r * .07;
  for (let k = -H * 1.4; k < H * 1.4; k += r * .2) { c.strokeStyle = ((k / (r * .2)) | 0) & 1 ? '#f2c14e' : '#16140f'; c.beginPath(); c.moveTo(-L * 1.05, k); c.lineTo(-L * .9, k + r * .15); c.stroke(); }
  c.restore();
  c.fillStyle = MISCOL; c.globalAlpha *= .8; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-L * .5, s * H * .2); c.lineTo(-L * .38, s * H * .2 - s * r * .04); c.lineTo(-L * .38, s * H * .2 + s * r * .08); c.closePath(); c.fill(); } c.globalAlpha /= .8;
  // attelage puis cabine
  c.fillStyle = P.dark; c.fillRect(L * .3, -H * .5, L * .1, H);
  c.fillStyle = P.plate; rr(c, L * .38, -H * .92, L * .66, H * 1.84, r * .18); c.fill(); c.strokeStyle = P.dark; c.lineWidth = Math.max(1, r * .05); c.stroke();
  c.fillStyle = P.body2; rr(c, L * .44, -H * .7, L * .3, H * 1.4, r * .08); c.fill();
  c.fillStyle = '#1d3a40'; c.beginPath(); c.moveTo(L * .78, -H * .72); c.lineTo(L * .98, -H * .56); c.lineTo(L * .98, H * .56); c.lineTo(L * .78, H * .72); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(170,235,255,.35)'; c.lineWidth = Math.max(1, r * .04); c.beginPath(); c.moveTo(L * .82, -H * .5); c.lineTo(L * .94, -H * .4); c.stroke();
  c.fillStyle = P.body2; c.beginPath(); c.moveTo(L * 1.03, -H * .8); c.lineTo(L * 1.16, -H * .55); c.lineTo(L * 1.16, H * .55); c.lineTo(L * 1.03, H * .8); c.closePath(); c.fill();
  // gyrophares : ils tournent quand le convoi roule
  const on = u && !u.dead && u.mv > .1, k = on ? .5 + .5 * Math.sin(time * 12) : .25;
  for (const s of [-1, 1]) { c.fillStyle = `rgba(242,193,78,${s > 0 ? k : 1 - k})`; circ(c, L * .58, s * H * .55, r * .08); c.fill(); }
  if (on) { c.fillStyle = 'rgba(242,193,78,.12)'; circ(c, L * .58, 0, r * .55); c.fill(); }
}
function paintDrill(c, r, P, t, mv, u) {
  const on = u && u.drill, T = u && u.x !== undefined ? time : t, spin = on ? T * 7 : 0;
  // stabilisateurs
  c.lineCap = 'round';
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, x = Math.cos(a) * r * 1.05, y = Math.sin(a) * r * 1.05; c.strokeStyle = P.body2; c.lineWidth = r * .14; c.beginPath(); c.moveTo(0, 0); c.lineTo(x, y); c.stroke(); c.fillStyle = P.dark; rr(c, x - r * .14, y - r * .14, r * .28, r * .28, r * .05); c.fill(); }
  c.lineCap = 'butt';
  c.fillStyle = P.body; ngon(c, 8, r * .8, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = Math.max(1.5, r * .06); c.stroke();
  c.save(); c.setLineDash([r * .14, r * .1]); c.strokeStyle = 'rgba(255,207,74,.7)'; c.lineWidth = r * .06; ngon(c, 8, r * .7, Math.PI / 8); c.stroke(); c.restore();
  // réservoirs et moteur
  for (const s of [-1, 1]) { c.fillStyle = P.plate; rr(c, -r * .58, s * r * .42 - r * .13, r * .62, r * .26, r * .13); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-r * .5, s * r * .42 - r * .08, r * .46, r * .05); }
  c.fillStyle = P.body2; rr(c, -r * .74, -r * .24, r * .3, r * .48, r * .05); c.fill();
  c.strokeStyle = P.dark; c.lineWidth = Math.max(1, r * .03); for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-r * .7, k * r * .08); c.lineTo(-r * .48, k * r * .08); c.stroke(); }
  // tour et tête de forage
  c.fillStyle = P.dark; rr(c, -r * .28, -r * .28, r * .56, r * .56, r * .05); c.fill();
  c.strokeStyle = P.plate; c.lineWidth = Math.max(1, r * .04); c.beginPath(); c.moveTo(-r * .26, -r * .26); c.lineTo(r * .26, r * .26); c.moveTo(r * .26, -r * .26); c.lineTo(-r * .26, r * .26); c.stroke();
  c.save(); c.rotate(spin); c.fillStyle = '#9a9890';
  for (let k = 0; k < 6; k++) { c.save(); c.rotate(k * TAU / 6); c.beginPath(); c.moveTo(r * .1, -r * .05); c.lineTo(r * .27, 0); c.lineTo(r * .1, r * .05); c.closePath(); c.fill(); c.restore(); }
  c.fillStyle = '#5e5c56'; circ(c, 0, 0, r * .13); c.fill(); c.fillStyle = P.acc; circ(c, r * .05, 0, r * .04); c.fill(); c.restore();
  const lit = on ? .6 + .4 * Math.sin(T * 8) : .5 + .5 * Math.sin(T * 2.5);
  c.fillStyle = on ? `rgba(111,227,200,${lit})` : `rgba(242,193,78,${lit})`; circ(c, r * .52, -r * .52, r * .08); c.fill();
}
function paintSurvivor(c, r, P, t, mv, u) {
  if (u && u.down) {
    const T = time;
    c.fillStyle = P.dark; c.beginPath(); c.ellipse(-r * .5, r * .2, r * .6, r * .3, .3, 0, TAU); c.fill();
    c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .62, r * .82, .4, 0, TAU); c.fill();
    c.strokeStyle = P.body; c.lineWidth = r * .28; c.lineCap = 'round'; const wv = Math.sin(T * 6) * .6;
    c.beginPath(); c.moveTo(r * .2, -r * .3); c.lineTo(r * .2 + Math.cos(-1.2 + wv) * r * .9, -r * .3 + Math.sin(-1.2 + wv) * r * .9); c.stroke(); c.lineCap = 'butt';
    c.fillStyle = P.plate; circ(c, r * .1, 0, r * .42); c.fill(); c.fillStyle = P.acc; c.fillRect(r * .22, -r * .2, r * .16, r * .4);
    const fl = .6 + .4 * Math.sin(T * 17); c.fillStyle = `rgba(255,80,60,${fl})`; circ(c, r * .9, r * .5, r * .22); c.fill();
    c.fillStyle = `rgba(255,80,60,${.15 * fl})`; circ(c, r * .9, r * .5, r * 1.1); c.fill();
    return;
  }
  paintHuman(c, r, P, t, mv, 'pistol', 0);
  c.strokeStyle = '#e8e2d4'; c.lineWidth = Math.max(1, r * .14); c.beginPath(); c.arc(r * .05, 0, r * .42, 1.9, 3.2); c.stroke(); // bandage
}

// marques dans le monde (sous les étiquettes)
function misWorld(c, z) {
  const pulse = .55 + .45 * Math.sin(time * 4);
  const ring = (x, y, r, col, w, dash) => { c.strokeStyle = col; c.lineWidth = w / z; if (dash) c.setLineDash([dash / z, dash / z]); circ(c, x, y, r); c.stroke(); if (dash) c.setLineDash([]); };
  for (const m of MIS) {
    if (m.phase === 'fail') continue;
    if (m.kind === 'convoy') {
      const u = m.npc;
      if (m.phase !== 'done') { ring(m.site.x, m.site.y, 150, `rgba(89,210,255,${.35 + .3 * pulse})`, 3, 10); wLabel(m.site.x, m.site.y - 160, TL('Dépôt du convoi'), { pri: 3, col: MISCOL }); }
      if (!u.dead) {
        if (m.phase === 'idle') ring(u.x, u.y, u.r + 16, `rgba(89,210,255,${.4 + .4 * pulse})`, 2.5);
        if (m.wait) ring(u.x, u.y, 650, 'rgba(89,210,255,.28)', 2, 14);
        wLabel(u.x, u.y - u.r - 22 / z, m.phase === 'done' ? TL('Convoi livré') : m.phase === 'idle' ? TL('Convoi') + ' · ' + TL('approchez pour le faire partir') : TL('Convoi') + ' · ' + TL('{n} %', { n: Math.round(m.prog * 100) }), { pri: 4, col: MISCOL });
      }
    } else if (m.kind === 'rescue') {
      const s = m.npc;
      if (m.phase === 'lost') { ring(m.zone.x, m.zone.y, m.zone.r, 'rgba(89,210,255,.4)', 2.5, 16); wLabel(m.zone.x, m.zone.y - m.zone.r - 8, TL('Zone de recherche'), { pri: 3, col: MISCOL }); }
      else if (m.phase === 'found' && !s.dead) { ring(s.x, s.y, 30 + 6 * pulse, `rgba(89,210,255,${.5 + .4 * pulse})`, 2.5); wLabel(s.x, s.y - 40 / z, TL('Pilote abattu'), { pri: 5, col: MISCOL }); }
      else if (m.phase === 'follow' && !s.dead) ring(s.x, s.y, s.r + 6, 'rgba(89,210,255,.65)', 1.5);
    } else if (m.kind === 'demolition') {
      if (m.phase === 'done') continue;
      for (const g of m.gens) if (!g.dead) { ring(g.x, g.y, g.r + 12, `rgba(255,77,94,${.35 + .35 * pulse})`, 2.5, 8); wLabel(g.x, g.y - g.r - 18 / z, ENEMIES.generateur.n, { pri: 3, col: '#ff8a8f' }); }
      if (m.phase === 'alarm') wLabel(m.site.x, m.site.y - 240, TL('Verrouillage dans {t}', { t: mmss(Math.max(0, m.left)) }), { pri: 6, size: 13, col: '#ff6b74', bg: 'rgba(20,24,26,.8)' });
    } else if (m.kind === 'hold') {
      const u = m.npc; if (u.dead) continue;
      if (m.phase === 'idle') { ring(u.x, u.y, u.r + 18, `rgba(89,210,255,${.4 + .4 * pulse})`, 2.5); wLabel(u.x, u.y - u.r - 26 / z, TL('Foreuse'), { pri: 4, col: MISCOL }); }
      else if (m.phase === 'drill') {
        ring(u.x, u.y, 700, m.wait ? 'rgba(236,107,116,.4)' : 'rgba(89,210,255,.22)', 2, 14);
        const f = 1 - m.left / m.T; c.strokeStyle = MISCOL; c.lineWidth = 5 / z; c.beginPath(); c.arc(u.x, u.y, u.r + 16, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
        wLabel(u.x, u.y - u.r - 30 / z, TL('Forage {n} %', { n: Math.floor(f * 100) }) + (m.wait ? ' · ' + TL('arrêtée') : ''), { pri: 5, col: m.wait ? '#ec6b74' : MISCOL });
      }
    } else if (m.kind === 'manhunt') {
      const e = m.tgt; if (m.phase === 'done' || e.dead) continue;
      ring(m.hint.x, m.hint.y, m.hint.r, 'rgba(255,176,32,.32)', 2.5, 18);
      ring(e.x, e.y, e.r + 10 + 3 * pulse, 'rgba(255,176,32,.55)', 2, 6);
      wLabel(e.x, e.y - e.r - 24 / z, TL('« {name} »', { name: e.bounty }), { pri: 6, size: 12, col: '#ffb020' });
    }
  }
}
// carte : minicarte (sc = pixels par pixel du monde) et grande carte (big)
function misMap(c, M, sc, big) {
  c.save(); c.lineWidth = big ? 2 : 1.5; c.strokeStyle = MISCOL; c.fillStyle = MISCOL;
  const dia = (x, y, s, fill) => { const [mx, my] = M(x, y); c.beginPath(); c.moveTo(mx, my - s); c.lineTo(mx + s, my); c.lineTo(mx, my + s); c.lineTo(mx - s, my); c.closePath(); fill ? c.fill() : c.stroke(); };
  const ring = (x, y, r) => { const [mx, my] = M(x, y); c.setLineDash([4, 4]); circ(c, mx, my, Math.max(4, r * sc)); c.stroke(); c.setLineDash([]); };
  const tag = (x, y, t, col) => { if (!big) return; const [mx, my] = M(x, y); c.font = `600 11px ${FONT}`; c.textAlign = 'center'; c.fillStyle = col || MISCOL; c.fillText(t, mx, my - 11); c.fillStyle = MISCOL; };
  const S = big ? 6 : 4;
  for (const m of MIS) {
    if (m.phase === 'fail') continue;
    c.strokeStyle = MISCOL; c.fillStyle = MISCOL;
    if (m.kind === 'convoy') {
      const u = m.npc;
      if (m.phase !== 'done') { dia(m.site.x, m.site.y, S, false); tag(m.site.x, m.site.y, TL('Dépôt')); if (big && !u.dead) { const [a, b] = M(u.x, u.y), [d, e] = M(m.site.x, m.site.y); c.setLineDash([3, 5]); c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); c.setLineDash([]); } }
      if (!u.dead) { const [mx, my] = M(u.x, u.y); c.fillRect(mx - S / 2 - 1, my - S / 2 - 1, S + 2, S + 2); if (m.phase === 'idle') tag(u.x, u.y, TL('Convoi')); }
    } else if (m.kind === 'rescue') {
      if (m.phase === 'lost') { ring(m.zone.x, m.zone.y, m.zone.r); tag(m.zone.x, m.zone.y - m.zone.r, TL('Zone de recherche')); }
      else if (!m.npc.dead && m.phase !== 'done') dia(m.npc.x, m.npc.y, S * .8, true);
    } else if (m.kind === 'demolition') {
      if (m.phase === 'done') continue;
      dia(m.site.x, m.site.y, S, false); tag(m.site.x, m.site.y, m.phase === 'alarm' ? TL('Avant-poste') + ' · ' + mmss(Math.max(0, m.left)) : TL('Avant-poste'), m.phase === 'alarm' ? '#ff6b74' : null);
      c.fillStyle = '#ff6b74'; for (const g of m.gens) if (!g.dead) { const [mx, my] = M(g.x, g.y); c.fillRect(mx - 1.5, my - 1.5, 3, 3); }
    } else if (m.kind === 'hold') {
      if (m.npc.dead || m.phase === 'done') continue;
      dia(m.site.x, m.site.y, S, m.phase === 'drill'); tag(m.site.x, m.site.y, m.phase === 'drill' ? TL('Foreuse') + ' · ' + TL('{n} %', { n: Math.floor(100 * (1 - m.left / m.T)) }) : TL('Foreuse'));
    } else if (m.kind === 'manhunt') {
      const e = m.tgt; if (e.dead || m.phase === 'done') continue;
      c.strokeStyle = '#ffb020'; ring(m.hint.x, m.hint.y, m.hint.r); tag(m.hint.x, m.hint.y - m.hint.r, TL('« {name} »', { name: e.bounty }), '#ffb020');
      if (time - m.seenT < 6) { c.fillStyle = '#ffb020'; dia(e.x, e.y, S, true); }
    }
  }
  c.restore();
}
// cibles des flèches au bord de l'écran
function misGoals() {
  const out = [];
  for (const m of MIS) {
    if (m.phase === 'fail' || m.phase === 'done') continue;
    if (m.kind === 'convoy') { if (m.npc.dead) continue; const g = m.phase === 'idle' || m.wait ? m.npc : m.site; out.push({ x: g.x, y: g.y, l: m.phase === 'idle' || m.wait ? TL('convoi') : TL('dépôt') }); }
    else if (m.kind === 'rescue') { if (m.phase === 'lost') out.push({ x: m.zone.x, y: m.zone.y, l: TL('recherche') }); else if (m.phase === 'found') out.push({ x: m.npc.x, y: m.npc.y, l: TL('pilote') }); }
    else if (m.kind === 'demolition') out.push({ x: m.site.x, y: m.site.y, l: TL('avant-poste') });
    else if (m.kind === 'hold') { if (!m.npc.dead) out.push({ x: m.npc.x, y: m.npc.y, l: TL('foreuse') }); }
    else if (m.kind === 'manhunt') { const s = time - m.seenT < 6; out.push({ x: s ? m.tgt.x : m.hint.x, y: s ? m.tgt.y : m.hint.y, l: TL('cible') }); }
  }
  return out;
}
