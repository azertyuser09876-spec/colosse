// Expéditions : escouades autonomes jouées dans des mondes parallèles.

// ================= EXPÉDITIONS : ESCOUADES AUTONOMES, PARTIES EN PARALLÈLE =================
// Une expédition est une vraie partie : son monde, ses ennemis, sa météo, sa balise. Elle tourne en même temps que la vôtre :
// à chaque image, son monde est chargé dans les variables du jeu, avance d'un pas, puis le vôtre est remis en place.
// Personne ne la pilote : un meneur invisible choisit les objectifs, l'escouade le suit, se bat, ramasse puis s'extrait.
// Jeu fermé ou onglet en arrière-plan : à la reprise, elle rattrape le temps écoulé en accéléré, quelques millisecondes par image.
const EXP_DUR = [{ n: 'Courte', t: 300 }, { n: 'Moyenne', t: 540 }, { n: 'Longue', t: 840 }];
const EXP_POST = {
  prudent: { n: 'Prudente', d: 'Évite les zones gardées, se replie vite et rentre dès les premiers dégâts.', risk: .45, hpRet: .55, loss: .34, flee: .75, avoid: .4 },
  normal: { n: 'Équilibrée', d: 'Fouille ce qui est à sa mesure et rentre quand l\'escouade faiblit.', risk: .62, hpRet: .45, loss: .4, flee: .95, avoid: .75 },
  audace: { n: 'Audacieuse', d: 'Force les coffres militaires gardés, tient sous le feu et rentre tard.', risk: 1.25, hpRet: .25, loss: .75, flee: 1.6, avoid: 9 },
};
const EXP_POST_KEYS = Object.keys(EXP_POST);
const expSlots = () => Math.min(3, bLevel('expedition'));
const regShort = i => (REGIONS[i] || REGIONS[0]).n.replace(/^(Les |Le |La |L')/, '');

// ---------- couleurs du sol d'une région, sans reconstruire les textures ----------
function applyGroundColors(id) {
  GROUND.forEach((g, i) => { g.base = GROUND_DEF[i].base.slice(); g.mm = GROUND_DEF[i].mm; g.n = GROUND_DEF[i].n; });
  const o = REGION_GROUND[id]; if (o) for (const i in o) { GROUND[i].base = o[i][0].slice(); GROUND[i].mm = o[i][1]; }
  if (id === 'glacier') GROUND[3].n = 'Eau glacée';
}

// ---------- changement de monde : toutes les variables d'une partie ----------
const ENV_KEYS = ['h0', 'rate', 'hour', 'dark', 'night', 'dusk', 'sun', 'tint', 'kind', 'P', 'sched', 'region', 'wind', 'flash', 'thunder', 'clouds', 'drops', 'fogs', 'sightMul', 'revealMul', 'camX', 'camY', 'lightT', 'seedR', 'seedSalt', 'cox', 'coy', 'fox', 'foy', 'base'];
const CAM_KEYS = ['x', 'y', 'zoom', 'userZoom', 'shake', 'kx', 'ky', 'lvx', 'lvy'];
function ctxGrab() {
  const env = {}; for (const k of ENV_KEYS) env[k] = ENV[k];
  const cm = {}; for (const k of CAM_KEYS) cm[k] = cam[k];
  return {
    state, paused, tactical, mapOpen, units, bullets, parts, items, crates, beams, decals, msgs, fleet, pings, fires,
    player, diff, raidTime, alertLv, time, frameDt, B, spawnT, actT, fogT, toxT, nextUid, endT, endSuccess, endExtracted,
    raidStats, regionCur, eProg, eTarget, fullWarnT, fleetAliveN, followSlots, flashT, armyPower, formation, deferred,
    crews, raidContracts, radarLv, attack, W, miniCv, miniCtx, fogCv, fogCtx, explored, chunkCache, hgrid,
    env, cm, mwx: mouse.wx, mwy: mouse.wy, casings: FX.casings, wrecks: FX.wrecks, live: LIVE.game, tut: TUT.on,
  };
}
function ctxPut(o) {
  state = o.state; paused = o.paused; tactical = o.tactical; mapOpen = o.mapOpen; units = o.units; bullets = o.bullets; parts = o.parts;
  items = o.items; crates = o.crates; beams = o.beams; decals = o.decals; msgs = o.msgs; fleet = o.fleet; pings = o.pings; fires = o.fires;
  player = o.player; diff = o.diff; raidTime = o.raidTime; alertLv = o.alertLv; time = o.time; frameDt = o.frameDt; B = o.B; spawnT = o.spawnT;
  actT = o.actT; fogT = o.fogT; toxT = o.toxT; nextUid = o.nextUid; endT = o.endT; endSuccess = o.endSuccess; endExtracted = o.endExtracted;
  raidStats = o.raidStats; regionCur = o.regionCur; eProg = o.eProg; eTarget = o.eTarget; fullWarnT = o.fullWarnT; fleetAliveN = o.fleetAliveN;
  followSlots = o.followSlots; flashT = o.flashT; armyPower = o.armyPower; formation = o.formation; deferred = o.deferred; crews = o.crews;
  raidContracts = o.raidContracts; radarLv = o.radarLv; attack = o.attack; W = o.W; miniCv = o.miniCv; miniCtx = o.miniCtx; fogCv = o.fogCv;
  fogCtx = o.fogCtx; explored = o.explored; chunkCache = o.chunkCache; hgrid = o.hgrid;
  for (const k of ENV_KEYS) ENV[k] = o.env[k];
  for (const k of CAM_KEYS) cam[k] = o.cm[k];
  mouse.wx = o.mwx; mouse.wy = o.mwy; FX.casings = o.casings; FX.wrecks = o.wrecks; LIVE.game = o.live; TUT.on = o.tut;
}
function expFresh() {
  const env = {}; for (const k of ENV_KEYS) env[k] = ENV[k];
  Object.assign(env, { P: Object.assign({}, WXK.clair), wind: { a0: 0, a: 0, s: 30, x: 20, y: 10 }, sched: [], thunder: [], drops: [], clouds: [], fogs: [], tint: [8, 14, 32], flash: 0, base: false, camX: 0, camY: 0, sightMul: 1, revealMul: 1 });
  return {
    state: 'raid', paused: false, tactical: false, mapOpen: false, units: [], bullets: [], parts: [], items: [], crates: [], beams: [], decals: [], msgs: [], fleet: [], pings: [], fires: [],
    player: null, diff: DIFFS[1], raidTime: 0, alertLv: 0, time: 0, frameDt: 0, B: null, spawnT: 50, actT: 0, fogT: 0, toxT: 0, nextUid: 1, endT: -1, endSuccess: false, endExtracted: null,
    raidStats: null, regionCur: 0, eProg: 0, eTarget: null, fullWarnT: 0, fleetAliveN: 0, followSlots: [], flashT: 0, armyPower: 0, formation: 'free', deferred: [],
    crews: [], raidContracts: [], radarLv: 0, attack: null, W: null, miniCv: null, miniCtx: null, fogCv: null, fogCtx: null, explored: null, chunkCache: new Map(), hgrid: new Map(),
    env, cm: { x: 0, y: 0, zoom: .85, userZoom: .85, shake: 0, kx: 0, ky: 0, lvx: 0, lvy: 0 }, mwx: 0, mwy: 0, casings: [], wrecks: [], live: null, tut: false,
  };
}

// ---------- chemins : A* sur la grille des tuiles ----------
const NAV = { g: null, from: null, seen: null, done: null, hi: null, hf: null, stamp: 0 };
const NDX = [1, -1, 0, 0, 1, 1, -1, -1], NDY = [0, 0, 1, -1, 1, -1, 1, -1];
function navInit() { if (NAV.g) return; const N = WT * WT; NAV.g = new Float32Array(N); NAV.from = new Int32Array(N); NAV.seen = new Uint32Array(N); NAV.done = new Uint32Array(N); NAV.hi = new Int32Array(N * 4); NAV.hf = new Float32Array(N * 4); }
// coût de passage de chaque tuile pour l'escouade : 0 = infranchissable (sa plus petite machine ne l'écrase pas)
function navMap(crush, fly) {
  const N = WT * WT, m = new Uint8Array(N), O = W.obs, G = W.ground;
  for (let ty = 0; ty < WT; ty++) for (let tx = 0; tx < WT; tx++) {
    const i = ty * WT + tx;
    if (tx < 3 || ty < 3 || tx >= WT - 3 || ty >= WT - 3) continue;
    if (fly) { m[i] = 1; continue; }
    const o = O[i], g = G[i];
    if (g === 7 || o === 7 || o === 8 || (o && OBS[o].lv > crush)) continue;
    m[i] = 1 + (g === 3 ? 7 : 0) + (o ? 2 : 0);
  }
  if (fly) return m;
  const m2 = m.slice(); // marge : on évite de frôler les obstacles
  for (let ty = 1; ty < WT - 1; ty++) for (let tx = 1; tx < WT - 1; tx++) {
    const i = ty * WT + tx; if (!m[i]) continue; let nb = 0;
    for (let d = 0; d < 8; d++) if (!m[i + NDY[d] * WT + NDX[d]]) nb++;
    if (nb) m2[i] = Math.min(250, m[i] + 2 + nb);
  }
  return m2;
}
function navOpen(m, tx, ty) {
  tx = clamp(tx, 0, WT - 1); ty = clamp(ty, 0, WT - 1);
  if (m[ty * WT + tx]) return ty * WT + tx;
  for (let r = 1; r <= 5; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = tx + dx, y = ty + dy; if (x < 0 || y < 0 || x >= WT || y >= WT) continue;
    if (m[y * WT + x]) return y * WT + x;
  }
  return -1;
}
function navPath(m, sx, sy, gx, gy) {
  navInit();
  const si = navOpen(m, sx, sy), gi = navOpen(m, gx, gy); if (si < 0 || gi < 0) return null; if (si === gi) return [si];
  const st = ++NAV.stamp, G = NAV.g, F = NAV.from, SEEN = NAV.seen, DONE = NAV.done, HI = NAV.hi, HF = NAV.hf, cap = HI.length;
  const gxx = gi % WT, gyy = (gi / WT) | 0; let hn = 0;
  const H = i => { const dx = Math.abs(i % WT - gxx), dy = Math.abs(((i / WT) | 0) - gyy); return dx + dy - .5858 * Math.min(dx, dy); };
  const push = (i, f) => { if (hn >= cap) return; let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (HF[p] <= f) break; HI[k] = HI[p]; HF[k] = HF[p]; k = p; } HI[k] = i; HF[k] = f; };
  const pop = () => { const top = HI[0]; hn--; const li = HI[hn], lf = HF[hn]; let k = 0; for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && HF[c + 1] < HF[c]) c++; if (HF[c] >= lf) break; HI[k] = HI[c]; HF[k] = HF[c]; k = c; } HI[k] = li; HF[k] = lf; return top; };
  G[si] = 0; SEEN[si] = st; F[si] = -1; push(si, H(si));
  let it = 0;
  while (hn > 0 && it++ < 90000) {
    const i = pop(); if (DONE[i] === st) continue; DONE[i] = st;
    if (i === gi) { const out = []; for (let k = i; k >= 0; k = F[k]) out.push(k); return out.reverse(); }
    const x = i % WT, y = (i / WT) | 0, g0 = G[i];
    for (let d = 0; d < 8; d++) {
      const dx = NDX[d], dy = NDY[d], nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= WT || ny >= WT) continue;
      const ni = ny * WT + nx, c = m[ni]; if (!c || DONE[ni] === st) continue;
      if (dx && dy && (!m[i + dx] || !m[i + dy * WT])) continue; // pas de coin coupé
      const ng = g0 + c * (dx && dy ? 1.4142 : 1);
      if (SEEN[ni] !== st || ng < G[ni]) { SEEN[ni] = st; G[ni] = ng; F[ni] = i; push(ni, ng + H(ni)); }
    }
  }
  return null;
}
function navLOS(m, a, b) {
  const ax = a % WT + .5, ay = ((a / WT) | 0) + .5, bx = b % WT + .5, by = ((b / WT) | 0) + .5, n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2.5);
  for (let k = 1; k < n; k++) { const c = m[((ay + (by - ay) * k / n) | 0) * WT + ((ax + (bx - ax) * k / n) | 0)]; if (!c || c >= 8) return false; }
  return true;
}
// raccourcit le chemin : on file droit tant que la ligne de vue est dégagée
function navSmooth(m, p) {
  const out = []; let i = 0;
  while (i < p.length - 1) { let j = Math.min(p.length - 1, i + 24); while (j > i + 1 && !navLOS(m, p[i], p[j])) j--; out.push(p[j]); i = j; }
  if (!out.length) out.push(p[p.length - 1]);
  return out.map(k => ({ x: (k % WT) * TILE + 20, y: ((k / WT) | 0) * TILE + 20 }));
}

// ---------- puissance de feu et solidité, pour jauger un combat ----------
// un combat se gagne quand (PV × dégâts) d'un camp dépasse ceux de l'autre : on compare la racine de ces produits
function wDps(w) { if (!w || SUPPORT_W[w.kind]) return w && w.kind === 'bay' ? 20 : 0; return (w.dps || (w.dmg || 0) * (w.pellets || 1) * (w.salvo || 1) * (w.rate || 0) * (w.strikes || 1)) * (w.kind === 'flame' ? 2 : 1); }
function unitHP(u) { return Math.max(0, u.hp) * (1 + (u.armor || 0) * 1.5) + (u.shield || 0); }
function unitDPS(u) { let d = 0; for (const m of u.mounts) d += wDps(m.w); return d; }
const forceRatio = (h1, d1, h0, d0) => Math.sqrt((h1 * d1) / Math.max(1, h0 * d0));

// ---------- le moteur : construction, pas de simulation, rattrapage, retour à la base ----------
const EXP = {
  cx: new Map(), owner: null, saveT: 0,
  run(cx, fn) {
    const main = ctxGrab(); ctxPut(cx.g); EXPSIM = cx; applyGroundColors(cx.rid);
    try { return fn(); }
    finally { cx.g = ctxGrab(); ctxPut(main); EXPSIM = null; applyGroundColors(curPalette); }
  },
  reset() { if (EXPV.id) expViewClose(true); this.cx.clear(); },
  build(e) {
    const R = REGIONS[e.region] || REGIONS[0];
    const cx = { e, g: expFresh(), D: expNewD(), notes: [], done: null, rid: R.id, viewing: false, err: 0, behind: 0, snapT: 0 };
    this.cx.set(e.id, cx);
    try { this.run(cx, () => expSetup(cx)); }
    catch (er) { console.error(er); this.abort(cx, 'monde introuvable'); }
    return cx;
  },
  // l'escouade est rapatriée sans butin (erreur de simulation, robots introuvables…)
  abort(cx, why) {
    if (cx.done) return;
    cx.done = { success: false, aborted: true, why, gained: {}, robots: cx.e.sq.map(s => ({ sid: s.sid, alive: !s.dead, back: !s.dead, hp: s.hp === undefined ? 1 : s.hp, xp: s.xp, kills: s.kills, traits: s.traits })), kills: cx.e.kills || 0, t: cx.e.simT || 0 };
  },
  tick(rdt) {
    if (TUT.on) return;
    if (this.owner !== save) { this.reset(); this.owner = save; }
    const L = save.exps; if (!L || !L.length) { if (this.cx.size) this.reset(); return; }
    if (state === 'title') return;
    for (const id of [...this.cx.keys()]) if (!L.some(e => e.id === id)) this.cx.delete(id);
    for (const e of L) if (!this.cx.has(e.id)) { this.build(e); return; } // un monde par image : sa génération prend quelques dizaines de ms
    const now = Date.now(), t0 = performance.now();
    const budget = state === 'raid' || state === 'assault' ? 4 : (drawerOpen || state === 'result' || EXPV.id) ? 10 : 6;
    const list = [...this.cx.values()].filter(c => !c.done).sort((a, b) => (b.viewing ? 1 : 0) - (a.viewing ? 1 : 0));
    let left = list.length;
    for (const cx of list) {
      const slice = Math.max(.6, (budget - (performance.now() - t0)) / Math.max(1, left)); left--;
      const s0 = performance.now();
      try {
        this.run(cx, () => {
          let n = 0;
          while (!cx.done) {
            const owed = (now - cx.e.t0) / 1000 - raidTime; if (owed <= .0005) break;
            if (n > 0 && performance.now() - s0 > slice) break;
            expStep(cx, Math.min(.05, owed)); if (++n > 600) break;
          }
          cx.behind = Math.max(0, (now - cx.e.t0) / 1000 - raidTime);
          if (now - cx.snapT > 1000 || cx.done) { cx.snapT = now; expSnap(cx); }
        });
        cx.err = 0;
      } catch (er) { console.error(er); if (++cx.err > 5) this.abort(cx, 'liaison perdue'); }
      if (cx.notes.length) { for (const m of cx.notes) msg('Expédition ' + cx.e.id + ' : ' + m.text, m.col || '#a59c88', 7); cx.notes.length = 0; }
    }
    for (const cx of [...this.cx.values()]) if (cx.done) this.apply(cx);
    if (now - this.saveT > 15000) { this.saveT = now; writeSave(); }
  },
  // bilan : butin au stock, robots rentrés au hangar, robots perdus retirés
  apply(cx) {
    const e = cx.e, R = cx.done; this.cx.delete(e.id);
    if (EXPV.id === e.id) expViewClose(true);
    if (!(save.exps || []).includes(e)) return;
    const byS = new Map((R.robots || []).map(r => [r.sid, r])), back = [], lost = [], rec = [];
    for (const s of e.sq) {
      const sr = save.robots.find(r => r.id === s.sid); if (!sr) continue;
      const r = byS.get(s.sid), alive = r ? r.alive : !s.dead;
      if (r) { sr.xp = Math.round(r.xp || sr.xp || 0); sr.kills = r.kills || sr.kills || 0; if (r.traits) sr.traits = r.traits.slice(); }
      if (r && r.back) { sr.hp = clamp(r.hp, .05, 1); delete sr.exp; back.push(sr.name); if (state === 'base') expArrive(sr); }
      else if (alive && has('u_recall') && Math.random() < .35) { sr.hp = .15; delete sr.exp; rec.push(sr.name); if (state === 'base') expArrive(sr); }
      else { lost.push(sr.name); save.robots = save.robots.filter(x => x !== sr); }
    }
    const g = R.gained || {}; let kg = 0;
    for (const k in g) { const n = Math.floor(g[k]); if (n > 0) { save.res[k] = (save.res[k] || 0) + n; kg += n * RES[k].w; } }
    const ok = !!R.success;
    save.stats.kills += Math.max(0, (R.kills || 0) - (e.kills0 || 0)); save.stats.exps = (save.stats.exps || 0) + 1; if (ok) save.stats.expOk = (save.stats.expOk || 0) + 1;
    if (ok) { const val = (g.scrap || 0) + 3 * (g.alloy || 0) + 2 * (g.circuits || 0) + 3 * (g.crystals || 0) + 30 * (g.cores || 0) + 4 * (g.data || 0); save.base.threat = Math.min(100, (save.base.threat || 0) + 3 + Math.min(12, val / 250)); }
    save.expRep = save.expRep || [];
    save.expRep.unshift({ id: e.id, region: e.region, diff: e.diff, ok, aborted: !!R.aborted, why: R.why || '', t: Math.round(R.t || e.simT || 0), at: Date.now(), gained: g, back, lost, rec, kills: Math.max(0, R.kills || 0), boss: R.boss || null, log: e.log.slice(-6).map(l => [l[0], l[1]]) });
    if (save.expRep.length > 6) save.expRep.length = 6;
    save.exps = save.exps.filter(x => x !== e);
    writeSave();
    const name = 'Expédition ' + e.id;
    if (R.aborted) msg(name + ' : liaison perdue, l\'escouade a été rapatriée sans butin.', '#f2c14e', 8);
    else if (ok) { msg(name + ' rentrée : ' + back.length + ' robot' + (back.length > 1 ? 's' : '') + ', ' + kg.toFixed(0) + ' kg de butin.', '#6fe3c8', 9); SFX.play('success', .6); }
    else { msg(name + ' perdue : aucun robot n\'a été extrait.', '#ec6b74', 9); SFX.play('fail', .6); }
    if (lost.length && ok) msg(name + ' : perdus ' + lost.join(', ') + '.', '#ec6b74', 8);
    if (drawerOpen) toast(R.aborted ? name + ' rapatriée.' : ok ? name + ' rentrée avec ' + kg.toFixed(0) + ' kg de butin.' : name + ' perdue.');
    if (drawerOpen) renderHub();
  },
};
function expArrive(sr) {
  const pb = save.base.b.find(b => b.type === 'expedition') || save.base.b.find(b => b.type === 'pad'); const r = pb ? bRect(pb) : null;
  const u = r ? spawnBaseRobot(sr, r.x + r.w / 2 + rnd(-30, 30), r.y + r.h + CHASSIS[sr.chassis].r + 12) : spawnBaseRobot(sr);
  parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .8, max: .8, size: u.r * 2.5 + 30, col: '#f2c14e' }); sparks(u.x, u.y, 10, '#f2c14e');
}
// un pas de simulation, dans le monde de l'expédition
function expStep(cx, dt) {
  update(dt);
  if (!cx.viewing) { parts.length = 0; beams.length = 0; if (decals.length > 40) decals.length = 0; } // personne ne regarde : pas d'effets visuels
}
function expNewD() { return { phase: 'insert', st: 0, S: null, goal: null, path: null, pi: 0, planT: 0, openT: 0, waitT: 0, fleeT: 0, fleeP: null, bad: new Set(), zones: [], nav: null, navT: -99, navKey: '', ret: false, why: '', site: null, bch0: 0, trailT: 0, insertT: 4, regT: 1, deadSeen: new Set(), calmT: 99, label: 'Insertion', short: 'insertion', winT: 0 }; }
function expLog(cx, text, col) { const L = cx.e.log; L.push([Math.round(raidTime), text, col || '#a59c88']); if (L.length > 40) L.splice(0, L.length - 40); }
function expNote(cx, text, col) { cx.notes.push({ text, col }); }
// les messages du monde de l'expédition alimentent son journal (sauf les consignes destinées au pilote)
function expMsgHook(text, col) {
  if (/\[|pilote|Entrez dans le cercle|Fenêtre manquée|Rejoignez|Soute pleine|Nouvelle balise|Balise reprise|Insertion|Aucun|Sélectionnez|Flotte :|Formation/.test(text)) return;
  expLog(EXPSIM, text, col);
  if (/EST TOMBÉ/.test(text)) expNote(EXPSIM, text.toLowerCase().replace(/^./, s => s.toUpperCase()), '#ff8a5c');
}

// ---------- mise en place du monde (départ ou reprise après fermeture du jeu) ----------
function expSetup(cx) {
  const e = cx.e, D = cx.D, RG = REGIONS[e.region] || REGIONS[0], tr = RG.tier - 1, D0 = DIFFS[e.diff] || DIFFS[1];
  regionCur = REGIONS.indexOf(RG);
  diff = Object.assign({}, D0, { hp: D0.hp * (1 + .22 * tr), dmg: D0.dmg * (1 + .15 * tr), loot: D0.loot * (1 + .3 * tr), spawn: D0.spawn * (1 + .08 * tr) });
  const sq = e.sq.map(s => ({ s, sr: save.robots.find(r => r.id === s.sid && r.exp === e.id) })).filter(o => o.sr && !o.s.dead);
  if (!sq.length) throw new Error('escouade introuvable');
  const resume = (e.simT || 0) > 1;
  raidStats = { kills: e.kills || 0, boss: !!e.boss, bossType: e.boss || null, byType: {}, archives: 0, pylons: 0, rivalKills: 0, sabotage: 0, lost: 0, deployed: e.n0 };
  armyPower = sq.reduce((t, o) => t + CHASSIS[o.sr.chassis].cmd, 0);
  genWorld(e.seed, RG);
  clearTiles((W.spawn.x / TILE) | 0, (W.spawn.y / TILE) | 0, Math.min(14, 6 + Math.round(Math.sqrt(armyPower) * 1.3)));
  buildMinimap();
  const sp = W.spawn;
  // le meneur : invisible, intouchable, il donne le cap ; les robots le suivent avec leurs cerveaux habituels
  player = makePlayer(sp.x, sp.y); Object.assign(player, { hidden: true, inv: 1e12, fly: true, cargoMax: 0, cargoW: 0, anchor: true, r: 10 });
  if (resume && e.ax !== undefined) { player.x = e.ax; player.y = e.ay; }
  units.push(player);
  const carr = sr => { const C = CHASSIS[sr.chassis]; return C.cargo >= 20 && C.cargo / C.hp > .08; };
  sq.sort((a, b) => carr(b.sr) - carr(a.sr) || CHASSIS[b.sr.chassis].r - CHASSIS[a.sr.chassis].r); // transporteurs au centre
  sq.forEach((o, i) => {
    let x, y;
    if (resume && o.s.x !== undefined) { x = o.s.x; y = o.s.y; }
    else { const a = i * 2.39996, rad = 60 + CHASSIS[o.sr.chassis].r + Math.sqrt(i) * 46; x = clamp(sp.x + Math.cos(a) * rad, 200, WPX - 200); y = clamp(sp.y + Math.sin(a) * rad, 200, WPX - 200); }
    const u = makeRobot(o.sr, x, y);
    if (o.s.hp !== undefined) u.hp = Math.max(1, u.maxhp * o.s.hp);
    if (o.s.cargo) { u.cargo = {}; u.cargoW = 0; for (const k in o.s.cargo) if (RES[k] && o.s.cargo[k] > 0) { u.cargo[k] = o.s.cargo[k]; u.cargoW += o.s.cargo[k] * RES[k].w; } }
    if (o.s.kills !== undefined) u.kills = o.s.kills;
    u.order = null; units.push(u); fleet.push(u);
    if (u.r > 40 && !resume) clearTiles((x / TILE) | 0, (y / TILE) | 0, Math.ceil(u.r / TILE) + 1);
  });
  for (const s of e.sq) if (s.dead) D.deadSeen.add(s.sid);
  B = { state: 'carried', unit: null, charge: 0, pulseT: 6, windowT: 0, cd: 0 };
  crews = []; raidContracts = [];
  populate(); spawnRivals();
  ENV.start(e.seed, RG.id);
  raidTime = e.simT || 0; time = raidTime; alertLv = Math.min(5, Math.floor(raidTime / (210 / diff.alert))); spawnT = resume ? 25 : 50;
  if (resume) {
    // le temps a passé : pas d'ennemis collés à l'escouade, caisses déjà fouillées le long du chemin
    for (const u of units) if (u.kind === 'enemy' && !u.boss && fleet.some(r => d2(u.x, u.y, r.x, r.y) < 1400 * 1400)) u.dead = true;
    for (const c of crates) if (e.trail.some(([x, y]) => d2(c.x, c.y, x, y) < 380 * 380)) c.open = true;
    (e.pyl || []).forEach(i => { if (W.pylons[i]) W.pylons[i].active = true; });
    for (const [x, y] of e.trail) reveal(x, y, 700);
    D.ret = !!e.ret; D.why = e.why || ''; D.insertT = 0;
    if (e.bx !== undefined) { D.site = { x: e.bx, y: e.by }; D.bch0 = e.bch || 0; }
    units = units.filter(u => !u.dead || u === player);
  }
  radarLv = bLevel('radar'); reveal(sp.x, sp.y, 900 + 450 * radarLv); if (radarLv >= 2) for (const p of W.pylons) reveal(p.x, p.y, 220);
  reveal(player.x, player.y, 900);
  cam.x = player.x; cam.y = player.y;
  if (!resume) expLog(cx, 'Insertion : ' + RG.n + '. ' + fleet.length + ' robot' + (fleet.length > 1 ? 's' : '') + ' au sol.', '#f2c14e');
  else expLog(cx, 'Liaison rétablie : l\'escouade reprend sa route.', '#a59c88');
}
// photo de l'expédition dans la sauvegarde : de quoi reprendre si le jeu se ferme, et de quoi l'afficher dans les menus
function expSnap(cx) {
  const e = cx.e, D = cx.D;
  e.simT = raidTime; e.kills = raidStats.kills; e.boss = raidStats.boss ? raidStats.bossType || true : null; e.alert = alertLv;
  e.ph = D.label; e.phs = D.short; e.ret = D.ret || false; e.why = D.why || ''; e.ax = Math.round(player.x); e.ay = Math.round(player.y);
  const m = new Map(fleet.map(u => [u.sid, u]));
  e.sq = e.sq.map(s => {
    const u = m.get(s.sid); if (!u) return s;
    return { sid: s.sid, name: u.name, ch: u.chassis, x: Math.round(u.x), y: Math.round(u.y), hp: u.dead ? 0 : +(u.hp / u.maxhp).toFixed(3), dead: u.dead || undefined, cargo: Object.assign({}, u.cargo), cw: +u.cargoW.toFixed(1), cap: u.cargoMax, xp: Math.round(u.xp || 0), kills: u.kills || 0, traits: (u.traits || []).slice() };
  });
  if (B.unit) { e.bx = Math.round(B.unit.x); e.by = Math.round(B.unit.y); e.bch = +B.charge.toFixed(3); } else if (!D.ret) { delete e.bx; delete e.by; delete e.bch; }
  e.pyl = W.pylons.map((p, i) => p.active ? i : -1).filter(i => i >= 0);
}
// fin : le lift est parti, ou plus aucun robot debout
function expEnd(success) {
  const cx = EXPSIM; if (!cx || cx.done) return;
  const ext = success && endExtracted ? endExtracted.filter(r => !r.dead) : [];
  const gained = {}; for (const r of ext) for (const k in r.cargo) if (r.cargo[k] > 0) gained[k] = (gained[k] || 0) + r.cargo[k];
  const robots = fleet.map(r => ({ sid: r.sid, alive: !r.dead, back: ext.includes(r), hp: r.hp / r.maxhp, xp: r.xp, kills: r.kills, traits: (r.traits || []).slice() }));
  cx.done = { success: ext.length > 0, gained, robots, kills: raidStats.kills, boss: raidStats.boss ? raidStats.bossType : null, t: raidTime, why: cx.D.why };
  cx.D.phase = 'done'; endT = -1;
}

// ---------- le meneur : objectifs, regroupement, combat, retour, balise ----------
function expGoalName(G) { if (!G) return ''; if (G.k === 'crate') return G.o.type === 'militaire' ? 'coffre militaire' : G.o.type === 'donnees' ? 'archive de données' : 'caisse'; if (G.k === 'pylon') return 'pylône relais'; return 'butin au sol'; }
function expSquad(cx) {
  const D = cx.D, A = player; let n = 0, nr = 0, hp = 0, mh = 0, cw = 0, cap = 0, spd = 1e9, crush = 9, fly = true, H = 0, Dp = 0, far = 0;
  for (const r of fleet) {
    if (r.dead) { if (!r.temp && !D.deadSeen.has(r.sid)) { D.deadSeen.add(r.sid); expNote(cx, r.name + ' détruit.', '#ec6b74'); } continue; }
    n++; if (!r.temp) nr++; hp += r.hp; mh += r.maxhp; cw += r.cargoW; cap += r.cargoMax; spd = Math.min(spd, r.spd); H += unitHP(r); Dp += unitDPS(r);
    if (!r.fly) { fly = false; crush = Math.min(crush, r.crush || 0); }
    if (!r.reg) far = Math.max(far, Math.hypot(r.x - A.x, r.y - A.y) - r.r);
  }
  // menace : hostiles proches, ou qui visent l'escouade
  let foe = null, fd = 1e9, tH = 0, tD = 0, tx = 0, ty = 0, tw = 0, hot = false;
  for (const u of units) {
    if (u.dead || u.team === 0 || !u.active || u.hidden || u.kind === 'beacon2' || u.etype === 'cible') continue;
    const d = Math.hypot(u.x - A.x, u.y - A.y), tg = u.target && !u.target.dead && u.target.team === 0;
    if (d > (tg ? 1300 : 700)) continue;
    const h = unitHP(u), dp = unitDPS(u); tH += h; tD += dp; tx += u.x * h; ty += u.y * h; tw += h; if (tg) hot = true;
    if (d < fd && (!u.static || tg)) { fd = d; foe = u; }
  }
  D.S = { n, nr, hp, mh, hpF: mh ? hp / mh : 0, cw, cap, free: cap - cw, spd: n ? spd : 100, crush: fly ? 99 : crush, fly, H, Dp, far, tH, tD, q: tH ? forceRatio(tH, tD, H, Dp) : 0, hot, tc: tw ? { x: tx / tw, y: ty / tw } : null, foe, fd };
  // libellés pour l'interface
  const G = D.goal, foeN = foe ? (foe.kind === 'enemy' ? ENEMIES[foe.etype].n : foe.crew ? foe.crew.name : 'hostiles') : '';
  const L = {
    insert: ['Insertion', 'insertion'], wait: ['Regroupement de l\'escouade', 'regroupement'], flee: ['Repli : la menace est trop forte', 'repli'],
    combat: ['Combat' + (foeN ? ' : ' + foeN : ''), 'combat'], sweep: ['Ramassage du butin', 'ramassage'],
    move: [G ? 'En route : ' + expGoalName(G) + ' (' + Math.round(Math.hypot(G.x - A.x, G.y - A.y) / 10) + ' m)' : 'Recherche d\'un objectif', 'fouille'],
    open: [G && G.k === 'pylon' ? 'Activation du pylône relais' : 'Fouille : ' + expGoalName(G), 'fouille'],
    return: ['Retour vers l\'extraction' + (D.why ? ' (' + D.why + ')' : ''), 'retour'],
    anchor: [B.state === 'broken' ? 'Balise détruite · réimpression ' + Math.ceil(B.cd) + ' s' : 'Ancrage ' + Math.floor(B.charge * 100) + ' %' + (B.unit && nearPylon(B.unit.x, B.unit.y) ? ' · relais ×2,5' : ''), B.state === 'broken' ? 'balise détruite' : 'ancrage ' + Math.floor(B.charge * 100) + ' %'],
    window: ['Fenêtre d\'extraction : ' + Math.ceil(B.windowT) + ' s', 'fenêtre'], lift: ['Extraction en cours', 'extraction'], done: ['Terminée', 'terminée'],
  }[D.phase] || ['', ''];
  D.label = L[0]; D.short = L[1];
}
function expPathTo(cx, x, y, from) {
  const D = cx.D, S = D.S, A = from || player, key = S.fly ? 'fly' : 'c' + S.crush;
  if (!D.nav || D.navKey !== key || raidTime - D.navT > 25) { D.nav = navMap(S.crush, S.fly); D.navKey = key; D.navT = raidTime; }
  const p = navPath(D.nav, (A.x / TILE) | 0, (A.y / TILE) | 0, (x / TILE) | 0, (y / TILE) | 0);
  return p ? navSmooth(D.nav, p) : null;
}
function expFollowPath(D, dt, mul = 1) {
  const A = player; if (!D.path || D.pi >= D.path.length) return true;
  const wp = D.path[D.pi], last = D.pi === D.path.length - 1;
  if (steer(A, wp.x, wp.y, dt, mul, last ? 16 : 30) || Math.hypot(wp.x - A.x, wp.y - A.y) < (last ? 24 : 44)) { D.pi++; A.arr = false; }
  return D.pi >= D.path.length;
}
// carte des forces hostiles, en cases de 300 px : rapport de force autour d'un point (les cases du bord comptent moitié)
function expThreat(S) {
  const G = 300, GW = Math.ceil(WPX / G), gH = new Float32Array(GW * GW), gD = new Float32Array(GW * GW);
  for (const u of units) { if (u.dead || u.team === 0 || u.hidden || u.kind === 'beacon2' || u.etype === 'cible') continue; const i = clamp((u.y / G) | 0, 0, GW - 1) * GW + clamp((u.x / G) | 0, 0, GW - 1); gH[i] += unitHP(u) * (u.static ? .5 : 1); gD[i] += unitDPS(u); }
  return (x, y, R = 2, mobile) => {
    const c0 = (x / G) | 0, r0 = (y / G) | 0; let h = 0, dp = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const X = c0 + i, Y = r0 + j; if (X < 0 || Y < 0 || X >= GW || Y >= GW) continue; const k = Math.abs(i) + Math.abs(j) > R ? .5 : 1; h += gH[Y * GW + X] * k; dp += gD[Y * GW + X] * k; }
    return h ? forceRatio(h, dp, S.H, S.Dp) : 0;
  };
}
// prochain objectif : la meilleure valeur à proximité, sans dépasser ce que l'escouade peut encaisser
function expPlan(cx) {
  const D = cx.D, S = D.S, e = cx.e, P = EXP_POST[e.post] || EXP_POST.normal, A = player;
  const danger = expThreat(S);
  const lim = P.risk, cands = []; D.zones = D.zones.filter(z => raidTime < z.t);
  const add = (k, o, x, y, v) => {
    if (D.bad.has(o)) return; const d = Math.hypot(x - A.x, y - A.y); if (d > 4500) return;
    for (const z of D.zones) if (d2(x, y, z.x, z.y) < z.r * z.r) return;
    const dg = danger(x, y); if (dg > lim) return;
    cands.push({ k, o, x, y, d, sc: v * (1 - .6 * dg / lim) / (d / 1000 + .45) });
  };
  if (S.free > .5) {
    for (const c of crates) if (!c.open && !c.claimed) add('crate', c, c.x, c.y, c.type === 'militaire' ? 3.2 : c.type === 'donnees' ? 2 : 1);
    const cl = new Map();
    for (const it of items) { if (it.dead || it.xs) continue; const k = ((it.y / 250) | 0) * 100 + ((it.x / 250) | 0); let q = cl.get(k); if (!q) cl.set(k, q = { x: 0, y: 0, n: 0, v: 0 }); q.x += it.x; q.y += it.y; q.n++; q.v += it.amt * RES[it.res].w * (it.res === 'cores' || it.res === 'heart' ? 8 : 1); }
    for (const [k, q] of cl) if (q.v >= 1.2) add('loot', 'L' + k, q.x / q.n, q.y / q.n, Math.min(3, .3 + q.v * .12));
  }
  for (const p of W.pylons) if (!p.active) add('pylon', p, p.x, p.y, S.free > .5 ? .8 : .3);
  if (!cands.length) { D.exhausted = true; return null; }
  cands.sort((a, b) => b.sc - a.sc);
  for (const c of cands.slice(0, 6)) { const path = expPathTo(cx, c.x, c.y); if (path) { c.path = path; return c; } D.bad.add(c.o); }
  return null;
}
function expNearItem(x, y, R, S, F) {
  let best = null, bd = Infinity; F = F || { x, y };
  for (const it of items) {
    if (it.dead || it.t < .35 || it.xs || d2(it.x, it.y, x, y) > R * R || RES[it.res].w > S.free + .01) continue;
    const q = d2(it.x, it.y, F.x, F.y); if (q < bd) { bd = q; best = it; }
  }
  return best;
}
// le meneur passe sur l'objet : le robot à soute libre le plus proche le récupère (sinon on l'oublie)
function expGrab(it, dt) {
  const A = player, s = it ? it : null; if (!s) return;
  steer(A, s.x, s.y, dt, 1, 0);
  if (d2(A.x, A.y, s.x, s.y) < 36 * 36) { s.xw = (s.xw || 0) + dt; if (s.xw > 1.3) s.xs = 1; }
}
function expRegroup(cx) {
  const A = player;
  for (const r of fleet) {
    if (r.dead || r.fly) continue;
    const d = Math.hypot(r.x - A.x, r.y - A.y);
    if (r.reg) { if (d < 320 || !r.order || r.order.type === 'hold') { r.reg = false; r.order = B.unit ? { type: 'beacon' } : null; r.queue = []; } continue; }
    if (d > 700 && (r.stuckN || 0) >= 2 && (r.target ? r.target.dead : true)) expSendTo(cx, r, A);
    else if (d > 900 && B.unit) expSendTo(cx, r, A); // la balise est posée : tout le monde rentre au cercle
  }
}
// envoie un robot quelque part par le chemin praticable (il reprend sa place une fois arrivé)
// robot de soute fragile : on le protège au centre de l'escouade
const isCarrier = r => r.cargoMax >= 20 && r.cargoMax / r.maxhp > .08;
function expSendTo(cx, r, T) {
  if (r.fly) { r.order = { type: 'move', x: T.x + rnd(-40, 40), y: T.y + rnd(-40, 40) }; r.queue = []; r.reg = true; return; }
  const p = expPathTo(cx, T.x, T.y, r);
  if (p && p.length) { r.order = { type: 'move', x: p[0].x, y: p[0].y }; r.queue = p.slice(1); } else { r.order = { type: 'move', x: T.x, y: T.y }; r.queue = []; }
  r.reg = true; r.patrol = false; r.stuckN = 0;
}
function expBeginReturn(cx, why) {
  const D = cx.D; D.ret = true; D.why = why; D.goal = null; D.path = null; D.site = null;
  expLog(cx, 'Retour vers l\'extraction : ' + why + '.', '#f2c14e'); expNote(cx, 'retour vers l\'extraction (' + why + ').', '#f2c14e');
}
// site d'extraction : la balise attire tout ce qui rôde à 1 500 px, on cherche donc un coin calme, pas trop loin,
// de préférence près d'un pylône relais (ancrage ×2,5)
function expPickSite(cx) {
  const D = cx.D, A = player, danger = expThreat(D.S), cands = [];
  for (const p of W.pylons) { const d = Math.hypot(p.x - A.x, p.y - A.y); if (d < 3200) cands.push({ x: p.x, y: p.y, d, p, k: p.active ? -1.1 : -.7 }); }
  cands.push({ x: A.x, y: A.y, d: 0, k: 0 });
  for (let i = 0; i < 10; i++) { const q = findWalkableNear(A.x, A.y, 500, 1700, 20); if (q) cands.push({ x: q.x, y: q.y, d: Math.hypot(q.x - A.x, q.y - A.y), k: 0 }); }
  let best = null, bs = Infinity;
  for (const c of cands) { if (D.zones.some(z => d2(c.x, c.y, z.x, z.y) < z.r * z.r)) continue; const s = c.d / 1000 + danger(c.x, c.y, 5) * 3 + c.k; if (s < bs) { bs = s; best = c; } }
  best = best || cands[0];
  if (best.p) { const q = findWalkableNear(best.p.x, best.p.y, 70, 170, 30) || { x: best.p.x + 80, y: best.p.y }; D.site = { x: q.x, y: q.y, pylon: best.p.active ? null : best.p }; }
  else { const q = findWalkableNear(best.x, best.y, 0, 120, 30) || { x: best.x, y: best.y }; D.site = { x: q.x, y: q.y }; }
  D.path = null; D.openT = 0;
}
function expPlaceBeacon(cx) {
  const A = player, D = cx.D;
  const hp = 1300 * diff.beacon * (has('u_beacon') ? 2 : 1) * (1 + .2 * Math.max(0, bLevel('pad') - 1)) * (1 + armyPower / 60);
  const pos = findWalkableNear(A.x, A.y, 0, 50, 20) || { x: A.x, y: A.y };
  B.unit = baseUnit({ kind: 'beacon', team: 0, x: pos.x, y: pos.y, r: 18, maxhp: hp, hp, static: true, name: 'Balise' });
  units.push(B.unit); B.state = 'charging'; B.charge = D.bch0 || 0; D.bch0 = 0; B.pulseT = 7;
  SFX.play('beacon', 1, pos.x, pos.y);
  expLog(cx, 'Balise posée' + (nearPylon(pos.x, pos.y) ? ' près d\'un pylône relais : ancrage ×2,5' : '') + '.', '#f2c14e');
  for (const r of fleet) if (!r.dead) { r.order = { type: 'beacon' }; r.reg = false; r.queue = []; }
}
function expActivate(cx, p) {
  p.active = true; reveal(p.x, p.y, 1900); raidStats.pylons++; spawnItem('data', Math.round(4 * diff.loot), p.x, p.y); SFX.play('beacon', 1, p.x, p.y);
  expLog(cx, 'Pylône relais activé : carte révélée.', '#6fe3c8');
}
function expDirect(dt) {
  const cx = EXPSIM, D = cx.D, e = cx.e, A = player, P = EXP_POST[e.post] || EXP_POST.normal;
  A.inv = 1e12; A.hp = A.maxhp;
  if ((D.st -= dt) <= 0) { D.st = .4; expSquad(cx); }
  const S = D.S; if (!S) return;
  if ((D.trailT -= dt) <= 0) { D.trailT = 3; const L = e.trail, l = L[L.length - 1]; if (!l || Math.hypot(l[0] - A.x, l[1] - A.y) > 180) { L.push([A.x | 0, A.y | 0]); if (L.length > 500) L.splice(0, L.length - 500); } }
  if (!S.nr) { if (endT < 0 && !cx.done) { endT = .6; endSuccess = false; D.phase = 'done'; expLog(cx, 'Plus aucun robot debout : signal perdu.', '#ec6b74'); } return; }
  if (B.state === 'lift') { D.phase = 'lift'; return; }
  A.spd = Math.max(55, S.spd * .8);
  // faut-il rentrer ?
  if (!D.ret) {
    const why = e.recall ? 'rappel' : raidTime >= e.dur ? 'temps écoulé' : (S.cap > 0 && S.free < 1.2) ? 'soutes pleines' : S.hpF < P.hpRet ? 'escouade abîmée' : (e.n0 >= 2 && S.nr <= e.n0 * (1 - P.loss)) ? 'pertes trop lourdes' : D.exhausted ? 'zone fouillée' : '';
    if (why) expBeginReturn(cx, why);
  }
  if (B.state === 'charging' && raidTime > e.dur + 600) B.charge = Math.max(B.charge, .995); // garde-fou : la fenêtre finit par s'ouvrir
  if ((D.regT -= dt) <= 0) { D.regT = 2.5; expRegroup(cx); }
  // balise posée : on tient la position jusqu'au lift
  if (B.unit) {
    const U = B.unit, win = B.state === 'window', inZ = r => Math.hypot(r.x - U.x, r.y - U.y) < zoneReach(r) - 8;
    if (win && D.phase !== 'window') {
      expLog(cx, 'Fenêtre d\'extraction ouverte : l\'escouade se resserre dans le cercle.', '#f2c14e');
      for (const r of fleet) if (!r.dead && Math.hypot(r.x - U.x, r.y - U.y) > ZONE_R * .8) expSendTo(cx, r, U);
    }
    D.phase = win ? 'window' : 'anchor';
    // fin de fenêtre avec des robots encore dehors : on la laisse passer (recharge partielle) plutôt que de les abandonner
    if (win && B.windowT - dt <= 0 && raidTime - (D.missT || -9) > 2) {
      const out = fleet.filter(r => !r.dead && !inZ(r));
      if (out.length && (D.missN || 0) < 2 && out.every(r => Math.hypot(r.x - U.x, r.y - U.y) < 1800)) {
        D.missN = (D.missN || 0) + 1; D.missT = raidTime; A.x = U.x + ZONE_R + 80; A.y = U.y; A.vx = A.vy = 0;
        expLog(cx, 'Fenêtre laissée passer : ' + out.map(r => r.name).join(', ') + ' hors du cercle.', '#f2c14e');
        for (const r of out) expSendTo(cx, r, U);
        return;
      }
    }
    if (Math.hypot(U.x - A.x, U.y - A.y) > 24) steer(A, U.x, U.y, dt, 1.5, 8);
    const late = win && B.windowT < 7; let ci = 0;
    for (const r of fleet) {
      if (r.dead || r.reg) continue;
      const dd = Math.hypot(r.x - U.x, r.y - U.y);
      if (isCarrier(r)) { const a = ci++ * 2.4, R = 26 + r.r; if (!r.order || r.order.type !== 'hold' || Math.hypot(r.order.x - U.x, r.order.y - U.y) > R + 5) r.order = { type: 'hold', x: U.x + Math.cos(a) * R, y: U.y + Math.sin(a) * R }; } // les soutes au centre
      else if (late) { if (dd > ZONE_R * .72 && (!r.order || r.order.type !== 'move')) { const a = Math.atan2(r.y - U.y, r.x - U.x); r.order = { type: 'move', x: U.x + Math.cos(a) * ZONE_R * .45, y: U.y + Math.sin(a) * ZONE_R * .45 }; r.queue = []; } }
      else if (!r.order || r.order.type !== 'beacon') r.order = { type: 'beacon' };
    }
    return;
  }
  if (D.ret && B.state === 'broken') { D.phase = 'anchor'; return; } // réimpression : on tient sur place
  // combat
  const fight = S.foe && ((S.fd < 650 && (S.hot || S.q < P.avoid)) || (S.hot && S.fd < 1200));
  if (fight) {
    if (D.calmT > 12) { expLog(cx, 'Contact : ' + (S.foe.kind === 'enemy' ? ENEMIES[S.foe.etype].n : S.foe.crew ? S.foe.crew.name : 'hostiles') + '.', '#ff9a7a'); D.hp0 = S.hpF; D.cmbT = 0; D.k0 = raidStats.kills; D.kT = raidTime; }
    D.calmT = 0; D.cmbT = (D.cmbT || 0) + dt;
    if (raidStats.kills !== D.k0) { D.k0 = raidStats.kills; D.kT = raidTime; }
    // combat qui s'éternise sans victoire (tourelle hors d'atteinte, tireurs embusqués) : on passe son chemin
    const stale = D.cmbT > 30 && raidTime - (D.kT || 0) > 25;
    // dépassés, ou saignés à blanc dans ce combat : on décroche
    const bleed = S.hpF < (D.hp0 || 1) - .3 && S.q > .5;
    if (D.fleeT <= 0 && (S.q > P.flee || bleed || stale) && S.tc) {
      const ax = A.x - S.tc.x, ay = A.y - S.tc.y, l = Math.hypot(ax, ay) || 1, p = findWalkableNear(A.x + ax / l * 700, A.y + ay / l * 700, 0, 220, 25);
      if (p) { D.fleeP = p; D.fleeT = 8; D.path = null; if (D.goal) D.bad.add(D.goal.o); D.goal = null; D.hp0 = S.hpF; D.cmbT = 0; D.kT = raidTime; D.zones.push({ x: S.tc.x, y: S.tc.y, r: 950, t: raidTime + 150 }); expLog(cx, 'Repli : ' + (bleed ? 'l\'escouade saigne' : stale ? 'le combat s\'enlise' : 'l\'adversaire est trop fort') + '.', '#f2c14e'); }
    }
    // les transporteurs se mettent à l'abri au centre de l'escouade, les récolteurs restent groupés
    let ci = 0;
    for (const r of fleet) {
      if (r.dead || r.reg) continue;
      if (isCarrier(r)) { const a = ci++ * 2.4; r.order = { type: 'hold', x: A.x + Math.cos(a) * (20 + r.r), y: A.y + Math.sin(a) * (20 + r.r) }; r.cmb = true; }
      else if (!r.order && r.brain === 'gatherer') { r.order = { type: 'follow' }; r.cmb = true; }
    }
    if (D.fleeT > 0) { D.fleeT -= dt; D.phase = 'flee'; if (steer(A, D.fleeP.x, D.fleeP.y, dt, 1.15, 30)) D.fleeT = 0; return; }
    D.phase = 'combat';
    // au retour, face à plus fort que soi, on continue vers l'extraction en se battant
    if (D.ret && S.q > .45) { if (!D.site) expPickSite(cx); const T = D.site.pylon || D.site; if (!D.path || D.pi >= D.path.length) { D.path = expPathTo(cx, T.x, T.y) || [{ x: T.x, y: T.y }]; D.pi = 0; } expFollowPath(D, dt, .85); return; }
    if (S.fd > 360 && S.hot && S.q < (S.foe.static ? P.avoid : .7)) steer(A, S.foe.x, S.foe.y, dt, .9, S.foe.static ? 300 : 380); // tireur hors de portée : on s'en approche
    return;
  }
  D.calmT += dt;
  if (D.calmT > 3) for (const r of fleet) if (r.cmb) { r.cmb = false; if (r.order && (r.order.type === 'follow' || r.order.type === 'hold')) r.order = null; }
  if (S.foe && !S.hot && S.fd < 700 && S.q >= P.avoid && D.fleeT <= 0 && S.tc) {
    const ax = A.x - S.tc.x, ay = A.y - S.tc.y, l = Math.hypot(ax, ay) || 1, p = findWalkableNear(A.x + ax / l * 500, A.y + ay / l * 500, 0, 200, 20);
    if (p) { D.fleeP = p; D.fleeT = 5; D.path = null; if (D.goal) D.bad.add(D.goal.o); D.goal = null; D.zones.push({ x: S.tc.x, y: S.tc.y, r: 800, t: raidTime + 120 }); expLog(cx, 'Contournement : ' + (S.foe.kind === 'enemy' ? ENEMIES[S.foe.etype].n : 'hostiles') + ' trop forts pour l\'escouade.', '#a59c88'); }
  }
  if (D.fleeT > 0) { D.fleeT -= dt; D.phase = 'flee'; if (steer(A, D.fleeP.x, D.fleeP.y, dt, 1, 30)) D.fleeT = 0; return; }
  // on attend les traînards
  if (S.far > 520 && D.waitT < 14) { D.waitT += dt; D.phase = 'wait'; return; }
  if (S.far <= 380) D.waitT = 0;
  if (D.insertT > 0) { D.insertT -= dt; D.phase = 'insert'; return; }
  // retour : rejoindre le site, activer le pylône au passage, poser la balise
  if (D.ret) {
    D.phase = 'return';
    if (!D.site) expPickSite(cx);
    const T = D.site.pylon || D.site, dd = Math.hypot(T.x - A.x, T.y - A.y);
    if (dd < (D.site.pylon ? 70 : 120)) {
      if (D.site.pylon) { if (D.site.pylon.active) { D.site.pylon = null; D.path = null; return; } D.openT += dt; if (D.openT >= 2.5) { expActivate(cx, D.site.pylon); D.site.pylon = null; D.openT = 0; D.path = null; } return; }
      expPlaceBeacon(cx); return;
    }
    if (!D.path || D.pi >= D.path.length) { D.path = expPathTo(cx, T.x, T.y) || [{ x: T.x, y: T.y }]; D.pi = 0; }
    expFollowPath(D, dt); return;
  }
  // fouille
  if (!D.goal || D.goal.done) {
    D.goal = null; if ((D.planT -= dt) > 0) return; D.planT = 1.5;
    D.goal = expPlan(cx); if (!D.goal) return;
    D.path = D.goal.path; D.pi = 0;
    if (D.goal.k !== 'loot') expLog(cx, 'Objectif : ' + expGoalName(D.goal) + ' à ' + Math.round(D.goal.d / 10) + ' m.', '#a59c88');
  }
  const G = D.goal;
  if (!G.mine && ((G.k === 'crate' && G.o.open) || (G.k === 'pylon' && G.o.active))) { G.done = true; return; } // quelqu'un est passé avant nous
  if (G.stage === 'sweep') {
    D.phase = 'sweep'; G.sweepT -= dt;
    const it = S.free > .3 && G.sweepT > 0 ? expNearItem(G.sx, G.sy, 420, S, A) : null;
    if (!it) { G.done = true; return; }
    expGrab(it, dt); return;
  }
  if (S.free > 1.5) { const it = expNearItem(A.x, A.y, 170, S); if (it) { D.phase = 'sweep'; expGrab(it, dt); return; } } // ramassage en chemin
  D.phase = 'move';
  const arrived = expFollowPath(D, dt), dg = Math.hypot(G.x - A.x, G.y - A.y);
  if (!arrived && dg > 60) return;
  if (G.k === 'loot') { G.stage = 'sweep'; G.sx = G.x; G.sy = G.y; G.sweepT = 14; return; }
  if (dg > 70) { steer(A, G.x, G.y, dt, 1, 30); return; }
  D.phase = 'open'; G.openT = (G.openT || 0) + dt;
  if (G.openT < (G.k === 'crate' ? 1.3 : 2.6)) return;
  G.mine = true;
  if (G.k === 'crate') {
    G.o.open = true; dropTable(CRATE_LOOT[G.o.type], G.o.x, G.o.y); SFX.play('open', 1, G.o.x, G.o.y);
    if (G.o.type === 'donnees') raidStats.archives++;
    expLog(cx, (G.o.type === 'militaire' ? 'Coffre militaire forcé' : G.o.type === 'donnees' ? 'Archive de données extraite' : 'Caisse ouverte') + '.', '#e8dcc4');
  } else expActivate(cx, G.o);
  G.stage = 'sweep'; G.sx = G.o.x; G.sy = G.o.y; G.sweepT = 12;
}

// ---------- départ ----------
let expForm = { region: null, diff: null, dur: 1, post: 'normal', sel: [] };
function expCheck() {
  const f = expForm, L = save.exps || [];
  if (TUT.on) return 'Pas d\'expédition pendant le tutoriel.';
  if (!bLevel('expedition')) return 'Construisez un poste d\'expédition.';
  if (L.length >= expSlots()) return 'Tous les postes sont occupés.';
  if (state !== 'base') return 'Lancez l\'expédition depuis la base.';
  if (attack) return 'Repoussez d\'abord l\'attaque.';
  if (!regionUnlocked(f.region)) return 'Région verrouillée.';
  const sel = f.sel.map(id => save.robots.find(r => r.id === id)).filter(r => r && !r.exp);
  if (!sel.length) return 'Choisissez au moins un robot.';
  if (sel.reduce((s, r) => s + CHASSIS[r.chassis].cmd, 0) > cmdCap() + 1e-6) return 'Commandement dépassé.';
  if (!sel.some(r => robotStats(r).cargo > 0)) return 'Aucune soute dans l\'escouade : elle ne rapporterait rien.';
  return '';
}
function expLaunch() {
  const why = expCheck(); if (why) { toast(why); SFX.play('deny', 1); return; }
  const f = expForm, sel = f.sel.map(id => save.robots.find(r => r.id === id)).filter(r => r && !r.exp);
  save.exps = save.exps || []; const id = save.expN = Math.max(save.expN || 1, 1); save.expN++;
  const e = { id, region: f.region, diff: f.diff, dur: EXP_DUR[f.dur].t, durI: f.dur, post: f.post, seed: (Math.random() * 1e9) | 0, t0: Date.now(), simT: 0, n0: sel.length, kills: 0, kills0: 0, trail: [], log: [], ph: 'Insertion', phs: 'insertion',
    sq: sel.map(r => ({ sid: r.id, name: r.name, ch: r.chassis, hp: r.hp, cargo: {}, cw: 0, cap: robotStats(r).cargo, xp: r.xp || 0, kills: r.kills || 0, traits: (r.traits || []).slice() })) };
  for (const r of sel) { r.exp = e.id; r.deploy = false; }
  save.exps.push(e);
  // à la base : l'escouade décolle
  for (const r of sel) { const u = fleet.find(x => x.sid === r.id); if (!u) continue; if (player && player.inside === u) ejectPlayer(false); u.dead = true; parts.push({ type: 'ring', x: u.x, y: u.y, vx: 0, vy: 0, life: .8, max: .8, size: u.r * 2.5 + 30, col: '#f2c14e' }); parts.push({ type: 'flash', x: u.x, y: u.y, vx: 0, vy: 0, life: .25, max: .25, size: u.r * 3, col: '#fff', a: 0 }); }
  fleet = fleet.filter(u => !u.dead);
  f.sel = []; writeSave(); SFX.play('uplink', .9);
  toast('Expédition ' + e.id + ' en route : ' + REGIONS[e.region].n + '.');
  EXP.owner = save; EXP.build(e);
  renderHub();
}

// ---------- observation en plein écran ----------
function expViewOpen(id) {
  const cx = EXP.cx.get(id); if (!cx || cx.done) { toast('Liaison en cours d\'établissement…'); return; }
  if (state !== 'base') { toast('Observez vos expéditions depuis la base.'); return; }
  if (attack && attack.phase === 'fight') { toast('Impossible pendant l\'attaque de la base.'); SFX.play('deny', 1); return; }
  closeDrawer(true); placing = null; baseSel = null; updateBPanel(); showBaseBar(false); $('#fleetPop').classList.remove('on');
  for (const k in keys) keys[k] = false; mouse.l = false; mouse.ldown = false; mouse.drag = null; fireLatch = false; tactical = false;
  EXPV.id = id; EXPV.follow = null; EXPV.free = false; EXPV.drag = null; EXPV.kp = {}; EXPV.tf.clear(); EXPV.pinch = null; cx.viewing = true;
  EXP.run(cx, () => { setRegionPalette(cx.rid); { const R = fleetMaxR(fleet); if (R > 160) EXPV.uz = Math.min(EXPV.uz, Math.max(.085, .4 * Math.pow(160 / R, .55))); } EXPV.x = player.x; EXPV.y = player.y; EXPV.z = EXPV.uz; });
  SFX.play('uiopen', 1); updateTouchUI();
}
function expViewClose(silent) {
  if (!EXPV.id) return;
  const cx = EXP.cx.get(EXPV.id); EXPV.id = null; EXPV.drag = null; EXPV.tf.clear();
  if (cx) { cx.viewing = false; EXP.run(cx, () => { chunkCache.clear(); FX.wrecks.length = 0; FX.casings.length = 0; parts.length = 0; }); }
  setRegionPalette(state === 'base' || regionCur === null ? null : REGIONS[regionCur].id);
  if (state === 'base') { showBaseBar(true); updateBPanel(); }
  if (!silent) SFX.play('uiclose', 1);
  updateTouchUI();
}
function expViewFrame(rdt) {
  const cx = EXP.cx.get(EXPV.id);
  if (!cx || cx.done || state !== 'base') { expViewClose(true); return false; }
  if (attack && attack.phase === 'fight') { expViewClose(true); toast('Attaque de la base !'); return false; }
  EXP.run(cx, () => {
    const tg = EXPV.follow ? fleet.find(r => r.sid === EXPV.follow && !r.dead) : null;
    if (EXPV.follow && !tg) EXPV.follow = null;
    const pk = EXPV.kp, px = (pk.KeyD || pk.ArrowRight ? 1 : 0) - (pk.KeyA || pk.ArrowLeft ? 1 : 0), py = (pk.KeyS || pk.ArrowDown ? 1 : 0) - (pk.KeyW || pk.ArrowUp ? 1 : 0);
    if (px || py) { EXPV.free = true; EXPV.x += px * 760 * rdt / EXPV.z; EXPV.y += py * 760 * rdt / EXPV.z; }
    if (!EXPV.free) { const T = tg || player, k = 1 - Math.exp(-rdt * 4); EXPV.x = lerp(EXPV.x, T.x, k); EXPV.y = lerp(EXPV.y, T.y, k); }
    EXPV.x = clamp(EXPV.x, 0, WPX); EXPV.y = clamp(EXPV.y, 0, WPX);
    EXPV.z = lerp(EXPV.z, EXPV.uz, 1 - Math.exp(-rdt * 5));
    cam.x = EXPV.x; cam.y = EXPV.y; cam.zoom = EXPV.z; cam.userZoom = EXPV.uz;
    cam.shake = Math.max(0, cam.shake - rdt * 36); const kk = Math.exp(-rdt * 11); cam.kx = (cam.kx || 0) * kk; cam.ky = (cam.ky || 0) * kk;
    mouse.wx = (mouse.x - VW / 2) / cam.zoom + cam.x; mouse.wy = (mouse.y - VH / 2) / cam.zoom + cam.y;
    render();
  });
  return true;
}
function expViewAct(act, arg) {
  const cx = EXP.cx.get(EXPV.id); if (!cx) return;
  if (act === 'close') { expViewClose(); return; }
  if (act === 'squad') { EXPV.follow = null; EXPV.free = false; SFX.play('ui', .8); return; }
  if (act === 'follow') { EXPV.follow = EXPV.follow === arg ? null : arg; EXPV.free = false; SFX.play('ui', .8); return; }
  if (act === 'next') { const al = (cx.g.fleet || []).filter(r => !r.dead); if (!al.length) return; const i = al.findIndex(r => r.sid === EXPV.follow); EXPV.follow = al[(i + 1) % al.length].sid; EXPV.free = false; SFX.play('ui', .8); return; }
  if (act === 'recall') {
    if (cx.e.recall) return;
    if (performance.now() - EXPV.armT > 3000) { EXPV.armT = performance.now(); SFX.play('ui', 1); return; }
    cx.e.recall = true; EXPV.armT = 0; SFX.play('uplink', .7); toast('Rappel transmis : l\'escouade rentre.'); return;
  }
  if (act === 'zin') EXPV.uz = clamp(EXPV.uz * 1.2, expMinZ(), 1.6);
  if (act === 'zout') EXPV.uz = clamp(EXPV.uz / 1.2, expMinZ(), 1.6);
}
function expViewHit(ux, uy) { for (const b of EXPV.btns) if (ux >= b.x && ux <= b.x + b.w && uy >= b.y && uy <= b.y + b.h) { expViewAct(b.act, b.arg); return true; } return false; }
// clic dans le monde : suivre le robot visé
function expViewPick(sx, sy) {
  const cx = EXP.cx.get(EXPV.id); if (!cx) return; const g = cx.g, z = g.cm.zoom;
  const wx = (sx - VW / 2) / z + g.cm.x, wy = (sy - VH / 2) / z + g.cm.y; let best = null, bd = Infinity;
  for (const r of g.fleet) { if (r.dead) continue; const q = d2(r.x, r.y, wx, wy); if (q < (r.r + 26) ** 2 && q < bd) { bd = q; best = r; } }
  if (best) expViewAct('follow', best.sid);
}
function expViewKey(e) {
  const c = e.code;
  if (/^(Key[WASD]|Arrow)/.test(c)) { EXPV.kp[c] = true; e.preventDefault(); return; }
  if (e.repeat) return;
  if (c === 'Escape') expViewClose();
  else if (c === 'Space') { e.preventDefault(); expViewAct('squad'); }
  else if (c === 'Tab') { e.preventDefault(); expViewAct('next'); }
  else if (/^Digit[1-9]$/.test(c)) { const cx = EXP.cx.get(EXPV.id), al = cx ? cx.g.fleet.filter(r => !r.dead) : [], r = al[+c.slice(5) - 1]; if (r) expViewAct('follow', r.sid); }
  else if (c === 'KeyR') expViewAct('recall');
  else if (c === 'Equal' || c === 'NumpadAdd') expViewAct('zin');
  else if (c === 'Minus' || c === 'NumpadSubtract' || c === 'Digit6') expViewAct('zout');
}
function expViewDown(p) { const ui = uiScale(); if (expViewHit(p.x / ui, p.y / ui)) return; EXPV.drag = { x: p.x, y: p.y, x0: p.x, y0: p.y }; }
function expViewMove(p) { const d = EXPV.drag; if (!d) return; const dx = p.x - d.x, dy = p.y - d.y; d.x = p.x; d.y = p.y; if (Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) > 6) { EXPV.free = true; EXPV.x -= dx / EXPV.z; EXPV.y -= dy / EXPV.z; } }
function expViewUp(p) { const d = EXPV.drag; EXPV.drag = null; if (d && Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) <= 6) expViewPick(p.x, p.y); }
function expViewTouch(kind, t) {
  const p = relT(t), F = EXPV.tf;
  if (kind === 'down') {
    const ui = uiScale(); if (expViewHit(p.x / ui, p.y / ui)) return;
    F.set(t.identifier, { x: p.x, y: p.y, x0: p.x, y0: p.y });
    if (F.size === 2) { const [a, b] = [...F.values()]; EXPV.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: EXPV.uz }; }
    return;
  }
  const f = F.get(t.identifier); if (!f) return;
  if (kind === 'move') {
    const dx = p.x - f.x, dy = p.y - f.y; f.x = p.x; f.y = p.y;
    if (EXPV.pinch && F.size >= 2) { const [a, b] = [...F.values()]; EXPV.uz = clamp(EXPV.pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / EXPV.pinch.d0, expMinZ(), 1.6); return; }
    if (Math.abs(p.x - f.x0) + Math.abs(p.y - f.y0) > 10) { EXPV.free = true; EXPV.x -= dx / EXPV.z; EXPV.y -= dy / EXPV.z; }
    return;
  }
  F.delete(t.identifier); if (EXPV.pinch) { if (F.size < 2) EXPV.pinch = null; return; }
  if (Math.abs(p.x - f.x0) + Math.abs(p.y - f.y0) <= 12) expViewPick(p.x, p.y);
}
// interface de la vue (dessinée dans le monde de l'expédition)
function expViewHUD(c) {
  const cx = EXPSIM, e = cx.e, D = cx.D, S = D.S || {}, T = TOUCH.on, btns = EXPV.btns = [];
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const btn = (x, y, w, h, label, act, arg, on, hot) => {
    c.fillStyle = on ? 'rgba(232,220,196,.92)' : hot ? 'rgba(200,70,26,.9)' : 'rgba(20,24,26,.86)'; c.fillRect(x, y, w, h);
    c.strokeStyle = on ? '#e8dcc4' : 'rgba(232,220,196,.28)'; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1);
    c.fillStyle = on ? '#14191b' : '#e8dcc4'; c.font = `600 ${T ? 13 : 12.5}px ${FONT}`; c.textAlign = 'center'; c.fillText(fitText(c, label, w - 10), x + w / 2, y + h / 2 + 4.5); c.textAlign = 'left';
    btns.push({ x, y, w, h, act, arg });
  };
  // --- haut gauche : identité, phase, temps
  const pw = Math.min(340, VW * .44);
  panel(c, 14, 14, pw, 90);
  c.fillStyle = '#f2c14e'; c.font = `700 14px ${FONT}`; c.fillText(fitText(c, 'Expédition ' + e.id + ' · ' + REGIONS[e.region].n, pw - 20), 24, 33);
  c.fillStyle = '#e8dcc4'; c.font = `600 13px ${FONT}`; c.fillText(fitText(c, D.label || '', pw - 20), 24, 53);
  c.font = `500 11.5px ${FONT}`; c.fillStyle = '#a59c88';
  c.fillText(fitText(c, mmss(raidTime) + ' / ' + mmss(e.dur) + ' de fouille · ' + DIFFS[e.diff].n + ' · ' + (EXP_POST[e.post] || EXP_POST.normal).n, pw - 20), 24, 71);
  c.fillText('Alerte', 24, 90); for (let i = 0; i < 5; i++) { c.fillStyle = i < alertLv ? (alertLv >= 4 ? '#ff4d5e' : '#f2c14e') : 'rgba(255,255,255,.1)'; c.fillRect(64 + i * 15, 82, 12, 8); }
  c.textAlign = 'right'; c.fillStyle = ENV.night > .5 ? '#9fb4e0' : ENV.dusk > .4 ? '#f2b06e' : '#a59c88'; c.fillText(ENV.label(), 14 + pw - 10, 90); c.textAlign = 'left';
  // --- journal
  const lines = e.log.slice(-(T ? 3 : 6)).reverse(); let ly = 124;
  for (let i = 0; i < lines.length; i++) {
    const [t, tx, col] = lines[i]; c.globalAlpha = 1 - i * .12; c.font = `500 12.5px ${FONT}`; const s = fitText(c, mmss(t) + '  ' + tx, pw - 16), tw = c.measureText(s).width;
    c.fillStyle = 'rgba(14,17,18,.72)'; c.fillRect(14, ly - 14, tw + 16, 20); c.fillStyle = col || '#a59c88'; c.fillText(s, 22, ly); ly += 23;
  }
  c.globalAlpha = 1;
  // --- haut droite : minicarte
  const MS = Math.round(T ? clamp(VW * .15, 100, 160) : clamp(VW * .17, 130, 210)); drawMinimap(c, VW - MS - 14, 14, MS, 150);
  // --- haut centre : balise, boss, rattrapage
  let cy = 16;
  if (B.state === 'charging' || B.state === 'window') {
    const w = Math.min(380, VW - pw - MS - 70), x = VW / 2 - w / 2, win = B.state === 'window';
    if (w > 160) { panel(c, x, cy, w, 40); c.fillStyle = win ? '#f2c14e' : '#e8dcc4'; c.font = `700 12.5px ${FONT}`; c.fillText(win ? 'Fenêtre d\'extraction : ' + Math.ceil(B.windowT) + ' s' : 'Ancrage ' + Math.floor(B.charge * 100) + ' %', x + 10, cy + 16); bar(c, x + 10, cy + 24, w - 20, 7, win ? B.windowT / 16 : B.charge, win ? '#f2c14e' : '#c99a2e'); if (B.unit) bar(c, x + 10, cy + 33, w - 20, 3, B.unit.hp / B.unit.maxhp, '#6fe3c8'); cy += 48; }
  }
  if (cx.behind > 3) {
    c.font = `600 12px ${FONT}`; const t = 'Rattrapage en accéléré · encore ' + mmss(cx.behind), tw = c.measureText(t).width + 20, x = VW / 2 - tw / 2;
    c.fillStyle = 'rgba(242,193,78,.9)'; c.fillRect(x, cy, tw, 22); c.fillStyle = '#14191b'; c.textAlign = 'center'; c.fillText(t, VW / 2, cy + 15); c.textAlign = 'left'; cy += 28;
  }
  // --- bas : escouade
  const al = fleet.filter(r => !r.temp), n = al.length, cw = clamp((VW - 40) / Math.max(1, n) - 6, 70, 150), chh = T ? 44 : 40, tot = n * (cw + 6) - 6;
  let x0 = Math.max(14, VW / 2 - tot / 2); const yb = VH - chh - 14;
  if (tot > VW - 28) x0 = 14;
  al.forEach((r, i) => {
    const x = x0 + i * (cw + 6); if (x + cw > VW - 10) return;
    const on = EXPV.follow === r.sid;
    c.fillStyle = on ? 'rgba(111,227,200,.16)' : 'rgba(20,24,26,.82)'; c.fillRect(x, yb, cw, chh);
    c.strokeStyle = on ? '#6fe3c8' : 'rgba(232,220,196,.15)'; c.lineWidth = on ? 2 : 1; c.strokeRect(x + .5, yb + .5, cw - 1, chh - 1);
    c.globalAlpha = r.dead ? .45 : 1;
    const kgT = r.dead || !r.cargoMax ? '' : r.cargoW.toFixed(0) + '/' + r.cargoMax + ' kg';
    c.font = `500 10.5px ${FONT}`; const kw = kgT ? c.measureText(kgT).width + 6 : 0;
    c.fillStyle = r.dead ? '#ec6b74' : '#e8dcc4'; c.font = `600 12px ${FONT}`; c.fillText(fitText(c, r.name, cw - 12 - (cw > 110 ? kw : 0)), x + 6, yb + 16);
    if (kgT && cw > 110) { c.font = `500 10.5px ${FONT}`; c.fillStyle = '#a59c88'; c.textAlign = 'right'; c.fillText(kgT, x + cw - 6, yb + 16); c.textAlign = 'left'; }
    if (r.dead) { c.font = `500 11px ${FONT}`; c.fillText('détruit', x + 6, yb + 31); }
    else { bar(c, x + 6, yb + 22, cw - 12, 6, r.hp / r.maxhp, r.hp < r.maxhp * .3 ? COL.enemy : COL.ally); if (r.cargoMax > 0) bar(c, x + 6, yb + 31, cw - 12, 4, r.cargoW / r.cargoMax, r.cargoW >= r.cargoMax - .2 ? '#f2c14e' : '#c4a77a'); }
    c.globalAlpha = 1;
    if (!r.dead) btns.push({ x, y: yb, w: cw, h: chh, act: 'follow', arg: r.sid });
  });
  // --- boutons
  const bh = T ? 36 : 28, by = yb - bh - 10, gap = 6;
  const tg = EXPV.follow ? fleet.find(r => r.sid === EXPV.follow) : null, arm = performance.now() - EXPV.armT < 3000;
  const items2 = [['◂ Base' + (T ? '' : ' · Échap'), 'close', null, false, false, T ? 92 : 118], [tg ? 'Suivi : ' + tg.name : 'Suivi : escouade', tg ? 'squad' : 'next', null, !!tg || !EXPV.free, false, T ? 150 : 170], [e.recall ? 'Rappel en cours' : arm ? 'Confirmer le rappel' : 'Rappeler', 'recall', null, false, arm, T ? 130 : 140]];
  if (T) items2.push(['−', 'zout', null, false, false, 40], ['+', 'zin', null, false, false, 40]);
  let bx = 14; for (const [lb, act, arg, on, hot, w] of items2) { btn(bx, by, w, bh, lb, act, arg, on, hot); bx += w + gap; }
  // --- état de l'escouade
  c.font = `500 12px ${FONT}`; c.fillStyle = '#a59c88'; c.textAlign = 'right';
  const kg = fleet.reduce((s, r) => s + (r.dead ? 0 : r.cargoW), 0), cap = fleet.reduce((s, r) => s + (r.dead ? 0 : r.cargoMax), 0);
  c.fillText((S.nr || 0) + ' / ' + e.n0 + ' robots' + (S.n > S.nr ? ' + ' + (S.n - S.nr) + ' renforts' : '') + ' · ' + kg.toFixed(0) + ' / ' + cap + ' kg · ' + raidStats.kills + ' hostiles abattus', VW - 16, by + bh - 8);
  if (!T && VW > 900) { c.fillStyle = 'rgba(232,220,196,.5)'; c.fillText('Glisser : déplacer la vue · molette : zoom · Tab ou 1 à 9 : suivre un robot · Espace : escouade · R : rappeler', VW - 16, by - 8); }
  c.textAlign = 'left';
}

// ---------- suivi compact : en raid et à la base ----------
let expTrackRows = [];
function expTracker(c, x, y, w, click) {
  expTrackRows = [];
  const L = TUT.on ? [] : save.exps || []; if (!L.length) return 0;
  const h = 22 + L.length * 32; panel(c, x, y, w, h);
  c.textAlign = 'left'; c.fillStyle = '#f2c14e'; c.font = `700 12px ${FONT}`; c.fillText('Expéditions' + (click ? ' · cliquer pour observer' : ''), x + 8, y + 15);
  L.forEach((e, i) => {
    const yy = y + 22 + i * 32, cx = EXP.cx.get(e.id), al = e.sq.filter(s => !s.dead).length, kg = e.sq.reduce((s, q) => s + (q.dead ? 0 : q.cw || 0), 0);
    if (i) { c.fillStyle = 'rgba(232,220,196,.08)'; c.fillRect(x + 6, yy - 1, w - 12, 1); }
    c.fillStyle = '#e8dcc4'; c.font = `600 12px ${FONT}`; c.fillText(fitText(c, e.id + ' · ' + regShort(e.region) + ' · ' + (cx ? cx.D.short : e.phs || 'liaison…'), w - 20), x + 8, yy + 13);
    c.fillStyle = '#a59c88'; c.font = `500 11px ${FONT}`;
    c.fillText(fitText(c, al + ' / ' + e.n0 + ' robots · ' + kg.toFixed(0) + ' kg · ' + mmss(e.simT || 0) + (cx && cx.behind > 3 ? ' · rattrapage' : ''), w - 20), x + 8, yy + 27);
    if (click) expTrackRows.push({ x, y: yy, w, h: 32, id: e.id });
  });
  return h + 8;
}
function expTrackHit(ux, uy) { for (const r of expTrackRows) if (ux >= r.x && ux <= r.x + r.w && uy >= r.y && uy <= r.y + r.h) { expViewOpen(r.id); return true; } return false; }

// ---------- onglet Expéditions ----------
function agoTxt(ms) { const s = Math.max(0, (Date.now() - ms) / 1000); return s < 90 ? 'à l\'instant' : s < 3600 ? 'il y a ' + Math.round(s / 60) + ' min' : s < 86400 ? 'il y a ' + Math.round(s / 3600) + ' h' : 'il y a ' + Math.round(s / 86400) + ' j'; }
function expLiveHTML(e) {
  const cx = EXP.cx.get(e.id), al = e.sq.filter(s => !s.dead), kg = al.reduce((s, q) => s + (q.cw || 0), 0), cap = al.reduce((s, q) => s + (q.cap || 0), 0);
  const ph = cx ? cx.D.label : e.ph || 'Liaison…', beh = cx && cx.behind > 3 ? `<br><span style="color:var(--signal)">Rattrapage en accéléré : encore ${mmss(cx.behind)} de jeu à simuler.</span>` : '';
  return `<div class="exl"><b>${esc(ph)}</b><br>${mmss(e.simT || 0)} / ${mmss(e.dur)} de fouille · alerte ${e.alert || 0} · ${e.kills || 0} hostiles abattus${e.boss ? ' · boss abattu' : ''}${beh}</div>
    <div class="exsq">${e.sq.map(s => `<span${s.dead ? ' class="lost"' : ''}>${esc(s.name || '?')}${s.dead ? ' · détruit' : ' · ' + (s.cw || 0).toFixed(0) + '/' + (s.cap || 0) + ' kg'}</span><div class="hpbar"><i style="width:${Math.round((s.dead ? 0 : s.hp === undefined ? 1 : s.hp) * 100)}%${s.hp < .3 ? ';background:var(--bad)' : ''}"></i></div>`).join('')}</div>
    <div class="exl">${al.length} / ${e.n0} robots · soutes ${kg.toFixed(0)} / ${cap} kg</div>
    <div class="exlog">${e.log.slice(-4).reverse().map(([t, tx]) => `<div>${mmss(t)} · ${esc(tx)}</div>`).join('') || '—'}</div>`;
}
function expCardHTML(e) {
  return `<div class="card expc">
    <div class="nm">Expédition ${e.id} · ${REGIONS[e.region].n}</div>
    <div class="sub">${DIFFS[e.diff].n} · ${(EXP_POST[e.post] || EXP_POST.normal).n} · fouille ${(EXP_DUR[e.durI] || EXP_DUR[1]).n.toLowerCase()}</div>
    <canvas class="expmap" width="240" height="240" data-emap="${e.id}"></canvas>
    <div data-elive="${e.id}">${expLiveHTML(e)}</div>
    <div class="acts"><button class="btn hot sm" data-act="expview" data-id="${e.id}">Observer</button><button class="btn sm" data-act="exprecall" data-id="${e.id}" ${e.recall ? 'disabled' : ''}>${e.recall ? 'Rappel en cours' : 'Rappeler'}</button></div>
  </div>`;
}
function expRepHTML(r) {
  const g = r.gained || {}, ks = RES_KEYS.filter(k => g[k] > 0);
  return `<div class="card ${r.ok ? 'dep' : ''}"><div class="nm">Expédition ${r.id} · ${r.aborted ? 'rapatriée' : r.ok ? 'réussie' : 'perdue'}</div>
    <div class="sub">${REGIONS[r.region].n} · ${DIFFS[r.diff] ? DIFFS[r.diff].n : ''} · ${mmss(r.t)} · ${r.kills} hostiles abattus${r.boss ? ' · boss abattu' : ''} · ${agoTxt(r.at)}</div>
    ${ks.length ? `<div class="res-list">${ks.map(k => `<div><span>${RES[k].n}</span><b class="good">+${fmt(g[k])}</b></div>`).join('')}</div>` : `<div class="sub">${r.aborted ? 'Liaison perdue : retour sans butin.' : 'Aucun butin rapporté.'}</div>`}
    ${r.back.length ? `<div class="sub good">Rentrés : ${r.back.map(esc).join(', ')}</div>` : ''}${(r.rec || []).length ? `<div class="sub good">Rappel automatique : ${r.rec.map(esc).join(', ')}</div>` : ''}${r.lost.length ? `<div class="sub lost">Perdus : ${r.lost.map(esc).join(', ')}</div>` : ''}
    ${(r.log || []).length ? `<div class="exlog">${r.log.slice().reverse().map(([t, x]) => `<div>${mmss(t)} · ${esc(x)}</div>`).join('')}</div>` : ''}</div>`;
}
function expFormHTML() {
  const f = expForm;
  if (f.region === null || !regionUnlocked(f.region)) f.region = regionUnlocked(save.region || 0) ? save.region || 0 : 0;
  if (f.diff === null) f.diff = save.diff;
  f.sel = f.sel.filter(id => { const r = save.robots.find(x => x.id === id); return r && !r.exp; });
  const avail = save.robots.filter(r => !r.exp), sel = f.sel.map(id => save.robots.find(r => r.id === id));
  const used = sel.reduce((s, r) => s + CHASSIS[r.chassis].cmd, 0), cap = cmdCap(), cargo = sel.reduce((s, r) => s + robotStats(r).cargo, 0);
  const dep = sel.filter(r => r.deploy).length, why = expCheck(), P = EXP_POST[f.post];
  return `<div class="rs-cat">Nouvelle expédition</div>
  <div class="slot-h">Région</div><div class="chips">${REGIONS.map((R, i) => `<button class="chip ${f.region === i ? 'on' : ''}" data-act="expreg" data-id="${i}" ${regionUnlocked(i) ? '' : 'disabled'}>${R.n}${regionUnlocked(i) ? '' : ' · verrouillée'}</button>`).join('')}</div>
  <div class="slot-h" style="margin-top:12px">Difficulté</div><div class="chips">${DIFFS.map((D, i) => `<button class="chip ${f.diff === i ? 'on' : ''}" data-act="expdiff" data-id="${i}">${D.n} · butin ×${String(D.loot).replace('.', ',')}</button>`).join('')}</div>
  <div class="slot-h" style="margin-top:12px">Durée de fouille</div><div class="chips">${EXP_DUR.map((d, i) => `<button class="chip ${f.dur === i ? 'on' : ''}" data-act="expdur" data-id="${i}">${d.n} · ${d.t / 60} min</button>`).join('')}</div>
  <p class="desc" style="margin-top:6px">Puis l'escouade pose sa balise et tient jusqu'au lift. Elle rentre plus tôt si ses soutes sont pleines ou si elle est trop abîmée.</p>
  <div class="slot-h" style="margin-top:12px">Consigne</div><div class="chips">${EXP_POST_KEYS.map(k => `<button class="chip ${f.post === k ? 'on' : ''}" data-act="exppost" data-id="${k}">${EXP_POST[k].n}</button>`).join('')}</div>
  <p class="desc" style="margin-top:6px">${P.d}</p>
  <div class="slot-h" style="margin-top:12px">Escouade</div>
  <div class="meter"><span>Commandement ${fmtCmd(used)} / ${cap}</span><div class="bar ${used > cap ? 'over' : ''}"><i style="width:${Math.min(100, used / cap * 100)}%"></i></div></div>
  <div class="chips">${avail.length ? avail.map(r => { const on = f.sel.includes(r.id); return `<button class="chip ${on ? 'on' : ''}" data-act="expbot" data-id="${r.id}" title="${esc(CHASSIS[r.chassis].n + ' · ' + r.weapons.map(w => WEAPONS[w].n).join(', '))}">${esc(r.name)} · ${CHASSIS[r.chassis].n} · ${Math.round(r.hp * 100)} %${r.deploy ? ' · déployé' : ''}</button>`; }).join('') : '<span class="sub">Aucun robot disponible au hangar.</span>'}</div>
  <div class="launch" style="margin-top:8px"><button class="btn sm" data-act="expauto">Choisir pour moi (hors armée de raid)</button><button class="btn sm" data-act="expnone">Vider</button></div>
  <p class="desc" style="margin-top:8px">Soutes de l'escouade : <b>${cargo} kg</b>. Sans pilote, seules les soutes des robots ramènent le butin : une Mule ou un Vautour change tout.${dep ? ` ${dep} robot${dep > 1 ? 's' : ''} de votre armée de raid ${dep > 1 ? 'partiront' : 'partira'} avec l'escouade.` : ''}</p>
  <div class="launch"><button class="btn hot big" data-act="explaunch" ${why ? 'disabled' : ''}>Lancer l'expédition · ${REGIONS[f.region].n}</button>${why ? `<span class="lost">${esc(why)}</span>` : ''}</div>`;
}
function renderExpTab() {
  const L = save.exps || [], lvl = bLevel('expedition'), slots = expSlots();
  let h = `<h2 class="h2">Expéditions</h2>
  <p class="lead">Envoyez une escouade fouiller une région sans vous. Elle reste groupée, ouvre les caisses, ramasse le butin, puis pose sa balise et s'extrait seule. C'est une vraie partie qui tourne en même temps que la vôtre : observez-la quand vous voulez depuis la base. Jeu fermé, elle rattrape le temps écoulé en accéléré à votre retour. Comme en raid, un robot détruit ou resté hors du cercle est perdu.</p>`;
  if (TUT.on) return h + '<p class="lead">Les expéditions ne sont pas disponibles pendant le tutoriel.</p>';
  if (!lvl) h += `<div class="card"><div class="nm">Aucun poste d'expédition</div><div class="sub">Construisez un poste d'expédition à la base. Chaque niveau permet une expédition de plus en même temps, jusqu'à trois.</div><div class="acts"><button class="btn hot sm" data-tab="construire">Construire</button></div></div>`;
  h += `<div class="rs-cat">En cours · ${L.length} / ${slots}</div>`;
  h += L.length ? `<div class="grid-cards exp-grid">${L.map(expCardHTML).join('')}</div>` : '<p class="lead">Aucune expédition en cours.</p>';
  if (lvl && L.length < slots) h += expFormHTML();
  else if (lvl) h += `<p class="lead">Tous les postes sont occupés.${lvl < 3 ? ' Améliorez le poste d\'expédition pour en lancer une de plus.' : ''}</p>`;
  if ((save.expRep || []).length) h += `<div class="rs-cat">Rapports</div><div class="grid-cards">${save.expRep.map(expRepHTML).join('')}</div>`;
  return h;
}
function drawExpMap(cv2, cx, e) {
  const c = cv2.getContext('2d'), S = cv2.width, g = cx && cx.g;
  c.fillStyle = '#0c0f10'; c.fillRect(0, 0, S, S);
  if (!g || !g.miniCv) { c.fillStyle = '#a59c88'; c.font = `500 13px ${FONT}`; c.textAlign = 'center'; c.fillText('Liaison en cours…', S / 2, S / 2); c.textAlign = 'left'; return; }
  c.imageSmoothingEnabled = false; c.drawImage(g.miniCv, 0, 0, S, S); c.imageSmoothingEnabled = true; c.drawImage(g.fogCv, 0, 0, S, S);
  const k = S / WPX;
  c.strokeStyle = 'rgba(255,42,58,.5)'; c.lineWidth = 1; circ(c, WPX / 2 * k, WPX / 2 * k, 27 * TILE * k); c.stroke();
  if (g.W) { c.fillStyle = '#a59c88'; c.fillRect(g.W.spawn.x * k - 2, g.W.spawn.y * k - 2, 4, 4); for (const p of g.W.pylons) if (p.active) { c.fillStyle = '#6fe3c8'; c.fillRect(p.x * k - 2, p.y * k - 2, 4, 4); } }
  if (e.trail.length) { c.strokeStyle = 'rgba(242,193,78,.75)'; c.lineWidth = 1.5; c.beginPath(); e.trail.forEach(([x, y], i) => i ? c.lineTo(x * k, y * k) : c.moveTo(x * k, y * k)); if (g.player) c.lineTo(g.player.x * k, g.player.y * k); c.stroke(); }
  if (g.B && g.B.unit) { c.strokeStyle = '#f2c14e'; c.lineWidth = 1.5; circ(c, g.B.unit.x * k, g.B.unit.y * k, Math.max(3, ZONE_R * k)); c.stroke(); }
  for (const r of g.fleet) if (!r.dead) { c.fillStyle = '#6fe3c8'; c.fillRect(r.x * k - 2, r.y * k - 2, 4, 4); }
}
let expTabT = 0, expTabN = -1;
function expTabLive(now) {
  if (!drawerOpen || hubTab !== 'expe' || now - expTabT < 1000) return; expTabT = now;
  const L = save.exps || [];
  if (L.length !== expTabN) { expTabN = L.length; renderHub(); return; }
  for (const e of L) {
    const el = document.querySelector(`[data-elive="${e.id}"]`); if (el) el.innerHTML = expLiveHTML(e);
    const cv2 = document.querySelector(`canvas[data-emap="${e.id}"]`); if (cv2) drawExpMap(cv2, EXP.cx.get(e.id), e);
  }
}
function expHangarCard(r) {
  const e = (save.exps || []).find(x => x.id === r.exp), s = e ? e.sq.find(q => q.sid === r.id) : null, ch = CHASSIS[r.chassis];
  return `<div class="card exr"><div class="row"><canvas data-rid="${r.id}"></canvas><div><div class="nm">${esc(r.name)}</div><div class="sub">${ch.n} · T${ch.tier} · ${fmtCmd(ch.cmd)} cmd<br><b style="color:var(--signal)">En expédition ${r.exp}</b>${e ? ' · ' + regShort(e.region) + ' · ' + esc((EXP.cx.get(e.id) || { D: { short: e.phs || '' } }).D.short) : ''}${s && s.dead ? ' · <span class="lost">détruit</span>' : ''}</div></div></div>
    <div class="hpbar" title="Points de vie"><i style="width:${Math.round((s ? (s.dead ? 0 : s.hp === undefined ? r.hp : s.hp) : r.hp) * 100)}%"></i></div>
    <div class="acts"><button class="btn sm" data-act="expview" data-id="${r.exp}">Observer</button><span class="sub">Revient avec l'escouade.</span></div></div>`;
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id, f = expForm;
  switch (act) {
    case 'expreg': if (regionUnlocked(+id)) { f.region = +id; SFX.play('ui', 1); renderHub(); } break;
    case 'expdiff': f.diff = +id; SFX.play('ui', 1); renderHub(); break;
    case 'expdur': f.dur = +id; SFX.play('ui', 1); renderHub(); break;
    case 'exppost': if (EXP_POST[id]) { f.post = id; SFX.play('ui', 1); renderHub(); } break;
    case 'expbot': { const n = +id; if (f.sel.includes(n)) f.sel = f.sel.filter(x => x !== n); else f.sel.push(n); SFX.play('ui', .8); renderHub(); break; }
    case 'expnone': f.sel = []; renderHub(); break;
    case 'expauto': {
      f.sel = []; let used = 0; const cap = cmdCap();
      const pool = save.robots.filter(r => !r.exp && !r.deploy && r.hp > .3).sort((a, b) => (robotStats(b).cargo > 15) - (robotStats(a).cargo > 15) || CHASSIS[b.chassis].tier - CHASSIS[a.chassis].tier || b.hp - a.hp);
      for (const r of pool) { const c2 = CHASSIS[r.chassis].cmd; if (used + c2 <= cap + 1e-6) { f.sel.push(r.id); used += c2; } }
      if (!f.sel.length) toast('Aucun robot libre hors de l\'armée de raid : choisissez-les vous-même.');
      SFX.play('ui', 1); renderHub(); break;
    }
    case 'explaunch': expLaunch(); break;
    case 'expview': expViewOpen(+id); break;
    case 'exprecall': { const ex = (save.exps || []).find(x => x.id === +id); if (ex && !ex.recall) askConfirm({ t: 'Rappeler', ok: 'Rappeler', x: 'Rappeler l\'expédition ' + ex.id + ' ? L\'escouade va poser sa balise et rentrer.' }).then(ok => { if (ok && !ex.recall) { ex.recall = true; writeSave(); toast('Rappel transmis.'); renderHub(); } }); break; }
  }
});
