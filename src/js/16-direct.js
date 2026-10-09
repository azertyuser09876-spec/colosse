// Raids partagés en direct (coopération ou affrontement) avec un serveur Colosse.

// ================= RAIDS PARTAGÉS EN DIRECT : coopération ou PvP (serveur Colosse, WebSocket) =================
// L'hôte fait vivre le monde (ennemis, équipes rivales, butin au sol, caisses). Chaque joueur fait vivre son pilote,
// sa flotte et sa balise. Les unités des autres sont des « reflets » mis à jour dix fois par seconde ; chacun calcule
// les dégâts de ses propres tirs et les envoie au propriétaire de la cible. Si l'hôte part, le joueur suivant reprend le monde.
let NETVIS = false; // vrai pendant la reproduction des tirs d'un autre joueur : effets visuels et sonores seulement
const NPAL_ACC = ['#6fe3c8', '#7fb4ff', '#c6e86a', '#ff9ad5'];
const rgbaOf = h => 'rgba(' + parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16) + ',';
const NPALS = NPAL_ACC.map(a => ({ body: '#34474a', body2: '#243234', plate: '#4f6669', acc: a, glow: rgbaOf(a), dark: '#141c1d' }));
const NPPALS = NPAL_ACC.map(a => ({ body: '#4a3d2c', body2: '#2f271c', plate: '#6b5739', acc: a, glow: rgbaOf(a), dark: '#17120c' }));
const CRATE_T = ['caisse', 'militaire', 'donnees'];
const LIVE = {
  ws: null, on: false, pid: null, rooms: [], room: null, chat: [], wantMode: 'coop', wantMax: 4, retryT: null, backoff: 2000, game: null, err: '', quiet: false,
  // ---------- connexion ----------
  connect() {
    if (this.ws || NET.kind !== 'http' || !NET.ok || !ACC.token || typeof WebSocket === 'undefined') return;
    let ws; try { ws = new WebSocket(NET.srv.replace(/^http/i, 'ws') + '/ws'); } catch (e) { this.err = 'connexion en direct impossible'; return; }
    this.ws = ws; this.err = '';
    ws.onopen = () => { this.backoff = 2000; ws.send(JSON.stringify({ t: 'auth', token: ACC.token })); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } try { this.onMsg(m); } catch (er) { console.error(er); } };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null; this.on = false; this.room = null; this.rooms = [];
      if (this.game) this.lost();
      this.refresh();
      if (NET.kind === 'http' && NET.ok && ACC.token) { clearTimeout(this.retryT); this.retryT = setTimeout(() => this.connect(), this.backoff); this.backoff = Math.min(30000, this.backoff * 2); }
    };
    ws.onerror = () => { this.err = 'serveur en direct injoignable'; };
  },
  disconnect() { clearTimeout(this.retryT); const ws = this.ws; this.ws = null; this.on = false; this.room = null; this.rooms = []; if (this.game) this.lost(); if (ws) try { ws.close(); } catch (e) { } },
  send(m) { if (this.ws && this.ws.readyState === 1 && !(this.game && this.game.offline)) this.ws.send(JSON.stringify(m)); },
  refresh() {
    if (!(drawerOpen && hubTab === 'online')) return;
    const ci = $('#liveChat'), v = ci ? ci.value : '', foc = ci && document.activeElement === ci;
    renderHub(); const c2 = $('#liveChat'); if (c2) { c2.value = v; if (foc) c2.focus(); }
  },
  power: () => Math.round(Math.min(cmdUsed(), cmdCap()) * 10) / 10,
  onMsg(m) {
    switch (m.t) {
      case 'hi': this.on = true; this.pid = m.pid; this.send({ t: 'sub', on: true }); this.refresh(); return;
      case 'err': this.err = m.e; toast(m.e); this.refresh(); return;
      case 'rooms': this.rooms = m.list || []; this.refresh(); return;
      case 'joined': this.room = m.room; this.chat = m.chat || []; this.refresh(); return;
      case 'room': if (this.room && m.room.id === this.room.id) { this.room = m.room; if (this.game) this.syncPeers(m.room); } this.refresh(); return;
      case 'chat': this.chat.push(m.line); if (this.chat.length > 30) this.chat.shift(); if (this.game && state === 'raid') msg(m.line.from + ' : ' + m.line.text, '#e8dcc4', 7); this.refresh(); return;
      case 'start': this.onStart(m); return;
      case 'host': if (this.room) this.room.host = m.pid; if (this.game) this.onHost(m.pid); this.refresh(); return;
      case 'peer': if (this.game) this.onPeer(m.pid, m.why); return;
      case 'late': return;
    }
    const g = this.game; if (!g) return;
    if (!g.ready) { g.queue.push(m); return; }
    this.handle(m);
  },
  // ---------- salon ----------
  create() { if (!this.on) return; this.send({ t: 'create', mode: this.wantMode, max: this.wantMax, region: save.region || 0, diff: save.diff, label: '', power: this.power() }); },
  join(id) { if (!this.on) return; this.send({ t: 'join', id, power: this.power() }); },
  leave() { this.send({ t: 'leave' }); this.room = null; this.chat = []; this.refresh(); },
  start() { if (this.room && this.room.host === this.pid) this.send({ t: 'start' }); },
  say(text) { text = String(text || '').trim(); if (text && this.room) this.send({ t: 'chat', text }); },
  renderTab() {
    if (NET.kind !== 'http' || TUT.on) return '';
    const R = REGIONS[save.region || 0], D = DIFFS[save.diff];
    let h = '<div class="rs-cat">Raids partagés <span style="font-family:var(--f-ui);font-size:14px;color:var(--mute)">en direct, jusqu\'à 4 pilotes</span></div>';
    if (!this.on) return h + `<p class="lead">${this.ws ? 'Connexion au serveur en direct…' : 'Connexion en direct indisponible' + (this.err ? ' : ' + esc(this.err) : '') + '.'}</p>`;
    if (this.game) return h + '<p class="lead">Raid partagé en cours.</p>';
    const mName = m => m === 'pvp' ? 'PvP' : 'Coopération';
    if (this.room) {
      const r = this.room, host = r.host === this.pid, hm = r.members.find(x => x.pid === r.host);
      return h + `<div class="card" style="max-width:820px">
        <div class="nm">Salon de ${esc(hm ? hm.name : '?')} · ${mName(r.mode)} · ${esc(REGIONS[r.region].n)} · ${esc(DIFFS[r.diff].n)}${r.started ? ' · en cours' : ''}</div>
        <div class="sub">${r.mode === 'pvp' ? 'Chacun pour soi : abattez les autres pilotes pour récupérer leur butin. Les monstres et les équipes rivales attaquent tout le monde.' : 'Vous êtes alliés : chacun pose sa balise et s\'extrait quand il veut. L\'hôte fait vivre le monde.'}</div>
        <div class="res-list">${r.members.map(m => `<div><span><b style="color:${NPAL_ACC[m.slot % 4]}">●</b> ${esc(m.name)}${m.pid === r.host ? ' · hôte' : ''}${m.pid === this.pid ? ' · vous' : ''}</span><b>${fmtCmd(m.power || 0)} cmd</b></div>`).join('')}<div><span>${r.members.length} / ${r.max} pilotes</span><b></b></div></div>
        <div class="res-list" style="max-height:150px;overflow:auto">${this.chat.slice(-8).map(l => `<div><span><b>${esc(l.from)}</b> : ${esc(l.text)}</span><b></b></div>`).join('') || '<div><span class="sub">Aucun message.</span><b></b></div>'}</div>
        <div class="acts"><input class="name" id="liveChat" maxlength="140" placeholder="Message pour le salon" style="flex:1;min-width:180px"><button class="btn sm" data-act="lchat">Envoyer</button></div>
        <div class="acts">${host ? `<button class="btn hot" data-act="lstart">${r.started ? 'Raid en cours' : 'Lancer le raid'}</button>` : `<span class="sub">${r.started ? 'Raid en cours.' : 'En attente du lancement par l\'hôte…'}</span>`}<button class="btn" data-act="lleave">Quitter le salon</button></div>
        <div class="sub">Votre flotte : les robots déployés au hangar, dans la limite de votre commandement. Gardez la fenêtre du jeu ouverte pendant le raid.</div></div>`;
    }
    const list = this.rooms.filter(r => r.members.length);
    return h + `<p class="lead">Partez à plusieurs dans la même zone, chacun avec sa flotte. <b>Coopération</b> : vous êtes alliés, chacun pose sa balise et s'extrait quand il veut. <b>PvP</b> : chacun pour soi, et le butin d'un pilote abattu reste au sol pour qui le ramasse. La région et la difficulté sont celles choisies dans « Partir en raid ».</p>
      <div class="chips" style="margin-bottom:10px">${['coop', 'pvp'].map(m => `<button class="chip ${this.wantMode === m ? 'on' : ''}" data-act="lmode" data-id="${m}">${mName(m)}</button>`).join('')}<span class="desc" style="align-self:center;margin:0 6px">Places</span>${[2, 3, 4].map(n => `<button class="chip ${this.wantMax === n ? 'on' : ''}" data-act="lmax" data-id="${n}">${n}</button>`).join('')}
        <button class="btn hot sm" data-act="lcreate" style="margin-left:8px">Créer un salon · ${esc(R.n)} · ${esc(D.n)}</button></div>
      <div class="grid-cards">${list.length ? list.map(r => { const full = r.members.length >= r.max, hm = r.members.find(x => x.pid === r.host); return `<div class="card"><div class="nm">${mName(r.mode)} · ${esc(REGIONS[r.region].n)}</div><div class="sub">Hôte : ${esc(hm ? hm.name : '?')} · ${esc(DIFFS[r.diff].n)} · ${r.members.length} / ${r.max} pilotes${r.started ? ' · en cours' : ''}</div><div class="sub">${r.members.map(m => esc(m.name)).join(', ')}</div><div class="acts"><button class="btn sm ${full ? '' : 'hot'}" data-act="ljoin" data-id="${esc(r.id)}" ${full ? 'disabled' : ''}>${full ? 'Complet' : r.started ? 'Rejoindre la partie en cours' : 'Rejoindre'}</button></div></div>`; }).join('') : '<div class="card"><div class="sub">Aucun salon ouvert. Créez-en un et donnez rendez-vous à vos amis.</div></div>'}</div>`;
  },
  // ---------- début et fin de partie ----------
  onStart(m) {
    const R = m.room; this.room = R;
    const me = R.members.find(x => x.pid === this.pid); if (!me || this.game) return;
    if (state !== 'base' || attack || placing) { toast(state === 'base' ? 'Raid partagé lancé : repoussez d\'abord l\'attaque en cours.' : 'Raid partagé lancé : revenez à la base pour le rejoindre.'); this.leave(); return; }
    const g = this.game = { mode: R.mode, host: R.host, isHost: R.host === this.pid, slot: me.slot, region: R.region, diff: R.diff, seed: m.seed, late: !!m.late, ready: false, offline: false, queue: [],
      peers: new Map(), byNid: new Map(), local: new Map(), specs: new Map(), sentU: new Map(), annU: new Set(), annW: new Map(), hitsOut: new Map(), drops: [], tiles: [], gone: new Set(), itemSeq: 1, crateSeq: 1, tU: 0, tH: 0, kf: 0, spawns: [] };
    this.syncPeers(R);
    closeDrawer(true); showOverlay('result', false); leaveBase();
    startRaid({ net: g });
  },
  syncPeers(R) {
    const g = this.game; if (!g) return;
    for (const m of R.members) { if (m.pid === this.pid) continue; const p = g.peers.get(m.pid) || { focus: null, beacon: null, ready: false, sentW: null, last: 0 }; Object.assign(p, { name: m.name, slot: m.slot, done: m.done || p.done }); g.peers.set(m.pid, p); }
  },
  guest() { return !!(this.game && !this.game.isHost); },
  prepWorld() { const g = this.game; g.spawns = []; for (let s = 0; s < 4; s++) { const p = this.computeSpawn(s); g.spawns.push(p); clearTiles((p.x / TILE) | 0, (p.y / TILE) | 0, 9); } },
  computeSpawn(s) {
    const g = this.game;
    if (g.mode === 'coop') { if (s === 0) return { x: W.spawn.x, y: W.spawn.y }; const a = s * TAU / 4 + .6; return { x: clamp(W.spawn.x + Math.cos(a) * 240, 600, WPX - 600), y: clamp(W.spawn.y + Math.sin(a) * 240, 600, WPX - 600) }; }
    const R = mulberry32(g.seed ^ 0x51ed), a0 = R() * TAU, c = WT / 2;
    for (let k = 0; k < 80; k++) {
      const a = a0 + s * TAU / 4 + (k ? (R() - .5) * .9 : 0), r = 108 + (k ? R() * 24 : 0), tx = Math.round(c + Math.cos(a) * r), ty = Math.round(c + Math.sin(a) * r);
      if (tx < 14 || ty < 14 || tx > WT - 14 || ty > WT - 14) continue;
      const i = ty * WT + tx; if (W.ground[i] === 7 || W.ground[i] === 3 || W.biome[i] === 6) continue;
      return { x: tx * TILE + 20, y: ty * TILE + 20 };
    }
    return { x: W.spawn.x, y: W.spawn.y };
  },
  spawnPoint(slot) { return this.game.spawns[slot % 4]; },
  nearSpawn(x, y, r) { return this.game.spawns.some(p => d2(x, y, p.x, p.y) < r * r); },
  ready() {
    const g = this.game; g.ready = true;
    this.send({ t: 'need' });
    const q = g.queue; g.queue = []; for (const m of q) this.handle(m);
    const others = [...g.peers.values()].filter(p => !p.done).map(p => p.name);
    msg('Raid partagé (' + (g.mode === 'pvp' ? 'PvP : chacun pour soi' : 'coopération') + ')' + (others.length ? ' avec ' + others.join(', ') : '') + '. ' + (g.isHost ? 'Vous faites vivre le monde.' : ''), g.mode === 'pvp' ? COL.rival : COL.ally, 9);
  },
  dropAll() { // pilote tombé : tout ce qu'il transportait, lui et sa flotte, reste au sol
    const add = u => { for (const k in u.cargo) if (u.cargo[k] > 0) spawnItem(k, u.cargo[k], u.x + rnd(-20, 20), u.y + rnd(-20, 20)); };
    if (player) add(player); for (const r of fleet) if (!r.dead) { add(r); boom(r.x, r.y, Math.max(30, r.r * 1.6)); }
  },
  finish(success) {
    const g = this.game; if (!g) return;
    if (!g.offline) {
      if (g.isHost) { this.syncItems(); this.syncBits(); }
      this.flushHits(); this.flushMisc();
      const all = [...g.sentU.keys()];
      this.send({ t: 'u', f: [0, 0], b: 0, l: [], sp: {}, d: success ? [] : all, x: success ? all : [] });
      this.send({ t: 'note', x: pseudo() + (success ? ' s\'est extrait.' : ' est tombé.'), c: success ? '#f2c14e' : '#ec6b74' });
      this.send({ t: 'done' });
    }
    if (success && g.mode === 'coop') save.stats.coop = (save.stats.coop || 0) + 1;
    for (const u of g.byNid.values()) u.dead = true;
    this.game = null; this.room = null; this.chat = [];
  },
  lost() {
    const g = this.game; if (!g || g.offline) return;
    if (!g.ready) { this.game = null; return; }
    if (!g.isHost) this.promote(g.host);
    g.offline = true;
    for (const u of g.byNid.values()) if (u.net) u.dead = true;
    g.byNid.clear();
    msg('Connexion au serveur perdue : vous continuez seul dans cette zone.', '#ec6b74', 9);
  },
  onPeer(pid, why) {
    const g = this.game, p = g.peers.get(pid); if (!p) return;
    p.done = true;
    if (why !== 'done') { msg(p.name + ' a quitté le raid.', '#a59c88', 5); for (const u of g.byNid.values()) if (u.owner === pid && !this.isWorld(u)) { u.dead = true; parts.push({ type: 'flash', x: u.x, y: u.y, vx: 0, vy: 0, life: .3, max: .3, size: u.r * 3, col: '#fff', a: 0 }); } }
  },
  onHost(pid) {
    const g = this.game, old = g.host; if (pid === old) return;
    g.host = pid;
    if (pid === this.pid && !g.isHost) { this.promote(old); msg('L\'hôte a quitté la zone : votre partie fait maintenant vivre le monde.', COL.ally, 7); }
    else for (const u of g.byNid.values()) if (u.owner === old && !this.isWorld(u)) u.dead = true;
  },
  isWorld(u) { return u.kind === 'enemy' || u.kind === 'rival' || u.kind === 'beacon2' || (u.kind === 'minion' && u.worldMinion); },
  // le joueur suivant reprend le monde : les ennemis deviennent réels, le butin et les caisses connus restent
  promote(old) {
    const g = this.game; g.isHost = true;
    for (const u of [...g.byNid.values()]) {
      if (u.dead) continue;
      if (u.kind === 'enemy' && ENEMIES[u.etype]) {
        const E = ENEMIES[u.etype], mh = E.hp * diff.hp;
        Object.assign(u, { net: false, owner: null, static: !!E.static, home: { x: u.nx, y: u.ny }, x: u.nx, y: u.ny, target: null, tt: 0, forced: null, maxhp: mh, hp: Math.max(1, u.hp / 1000 * mh), active: true });
        g.local.set(u.nid, u); g.byNid.delete(u.nid); continue;
      }
      if (this.isWorld(u) || u.owner === old) { u.dead = true; g.byNid.delete(u.nid); }
    }
    g.itemSeq = items.reduce((m, it) => Math.max(m, it.iid || 0), 0) + 1;
    for (const it of items) it.netAmt = it.amt;
    g.crateSeq = crates.reduce((m, c) => Math.max(m, c.cid || 0), 0) + 1;
    for (const c of crates) c.netOpen = c.open;
    for (const p of W.pylons) p.netAct = p.active;
    g.annW = new Map(); for (const p of g.peers.values()) { p.sentW = null; }
    raidTime = Math.max(raidTime, alertLv * 210 / diff.alert + 1); spawnT = 25;
  },
  // ---------- boucle : interpolation des reflets, envois ----------
  tick(dt) {
    const g = this.game; if (!g || !g.ready || state !== 'raid') return;
    const now = performance.now();
    for (const u of g.byNid.values()) {
      if (u.dead) continue;
      const dx = u.nx - u.x, dy = u.ny - u.y, d = Math.hypot(dx, dy);
      if (d > 600) { u.x = u.nx; u.y = u.ny; } else { const k = Math.min(1, dt * 11); u.x += dx * k; u.y += dy * k; }
      u.mv += ((u.nmv || 0) - u.mv) * Math.min(1, dt * 6); u.t += dt * (.25 + u.mv * .95);
      u.ang = turnTo(u.ang, u.na, dt * 9);
      if (u.hitFlash > 0) u.hitFlash -= dt;
      if (now - u.seen > (this.isWorld(u) ? 2600 : 5000)) u.dead = true;
    }
    for (const [nid, u] of g.byNid) if (u.dead) g.byNid.delete(nid);
    if (g.offline) return;
    g.tH += dt; if (g.tH >= .05) { g.tH = 0; this.flushHits(); }
    g.tU += dt;
    if (g.tU >= .1) {
      g.tU = 0; g.kf = (g.kf + 1) % 10; const full = g.kf === 0;
      this.sendUnits(full);
      if (g.isHost) { this.syncItems(); this.syncBits(); this.sendWorld(full); }
      this.flushMisc();
    }
  },
  nidOf(u) { const g = this.game; if (u.nid === undefined) { u.nid = g.slot * 100000 + u.id; } if (!u.net) g.local.set(u.nid, u); return u.nid; },
  spec(u) {
    const crew = () => u.crew ? Math.max(0, CREW_PALS.indexOf(u.crew.pal)) : 0;
    switch (u.kind) {
      case 'player': return { k: 'p', n: pseudo(), g: (u.pw && u.pw.gun) || 'pistol', pw: Object.keys(PWEAPONS).find(k => PWEAPONS[k] === u.pw) || 'pistol' };
      case 'robot': return { k: 'r', c: u.chassis, w: u.mounts.map(m => m.wid), n: u.name, xp: Math.round(u.xp || 0) };
      case 'minion': return { k: 'm', wm: u.owner && u.owner.kind === 'rival' ? 1 : 0 };
      case 'beacon': return { k: 'b' };
      case 'enemy': return { k: 'e', e: u.etype };
      case 'rival': return u.role === 'leader' ? { k: 'rl', n: u.crew ? u.crew.name : '', p: crew() } : { k: 'rb', c: u.chassis, w: u.mounts.map(m => m.wid), n: u.name, xp: Math.round(u.xp || 0), p: crew() };
      case 'beacon2': return { k: 'b2', p: crew() };
    }
    return null;
  },
  state(u) {
    let f = 0; if (u.hidden) f |= 1; if (u.piloted) f |= 2; if (u.shield > 1) f |= 4; if (u.cloak && time - (u.lastFire || -9) > 1.5) f |= 8;
    let ms = 0;
    if (u.kind === 'player') ms = [Math.round(u.ang * 100), u.fc || 0, 0];
    else if (u.mounts.length) { ms = []; for (const m of u.mounts) ms.push(Math.round(m.aim * 100), m.fc || 0, Math.round((m.td || 0) / 10)); }
    const e = [u.nid, Math.round(u.x), Math.round(u.y), Math.round(u.ang * 100), Math.round(clamp(u.hp / u.maxhp, 0, 1) * 1000), f, ms, Math.round((u.jz || 0) * 100)];
    if (u.kind === 'beacon') { e.push(Math.round((B.charge || 0) * 1000)); if (B.state === 'window' || B.state === 'lift') e[5] |= 16; }
    else if (u.kind === 'beacon2') e.push(Math.round(((u.crew && u.crew.charge) || 0) * 1000));
    return e;
  },
  myUnits() {
    const out = [];
    if (player && !player.dead) out.push(player);
    for (const r of fleet) if (!r.dead) out.push(r);
    for (const u of units) if (u.kind === 'minion' && !u.dead && !u.net && u.owner && u.owner.kind === 'robot' && !u.owner.net) out.push(u);
    if (B && B.unit && !B.unit.dead) out.push(B.unit);
    return out;
  },
  sendUnits(full) {
    const g = this.game, l = [], sp = {}, d = [], cur = new Set();
    for (const u of this.myUnits()) {
      const nid = this.nidOf(u); cur.add(nid);
      if (!g.annU.has(nid)) { const s = this.spec(u); if (!s) continue; sp[nid] = s; g.annU.add(nid); }
      const e = this.state(u), key = e.join(',') + (e[6] ? ':' + e[6].join(',') : '');
      if (full || g.sentU.get(nid) !== key) l.push(e);
      g.sentU.set(nid, key);
    }
    for (const nid of [...g.sentU.keys()]) if (!cur.has(nid)) { d.push(nid); g.sentU.delete(nid); g.annU.delete(nid); }
    const F = focus();
    if (l.length || d.length || full || Object.keys(sp).length) this.send({ t: 'u', f: [Math.round(F.x), Math.round(F.y)], b: B && B.unit && !B.unit.dead ? [Math.round(B.unit.x), Math.round(B.unit.y)] : 0, l, sp, d });
  },
  sendWorld(full) {
    const g = this.game, R2 = 2700 * 2700;
    const ents = units.filter(u => !u.dead && !u.net && u.etype !== 'cible' && (u.kind === 'enemy' || u.kind === 'rival' || u.kind === 'beacon2' || (u.kind === 'minion' && u.owner && u.owner.kind === 'rival')));
    for (const [pid, p] of g.peers) {
      if (!p.ready || p.done || !p.focus) continue;
      let ann = g.annW.get(pid); if (!ann) g.annW.set(pid, ann = new Set());
      const sent = p.sentW || (p.sentW = new Map()), l = [], sp = {}, d = [], cur = new Set();
      for (const u of ents) {
        if (!(u.boss || u.kind === 'beacon2' || d2(u.x, u.y, p.focus[0], p.focus[1]) < R2 || (p.beacon && d2(u.x, u.y, p.beacon[0], p.beacon[1]) < R2))) continue;
        const nid = this.nidOf(u); cur.add(nid);
        if (!ann.has(nid)) { const s = this.spec(u); if (!s) continue; sp[nid] = s; ann.add(nid); }
        const e = this.state(u), key = e.join(',') + (e[6] ? ':' + e[6].join(',') : ''), prev = sent.get(nid);
        if (full || !prev || prev.k !== key) l.push(e);
        sent.set(nid, { k: key, u });
      }
      for (const [nid, s] of sent) if (!cur.has(nid)) { if (s.u.dead) d.push(nid); sent.delete(nid); }
      this.send({ t: 'w', to: pid, al: alertLv, l, sp, d });
    }
  },
  syncItems() {
    const g = this.game, a = [], u = [], r = [];
    for (const it of items) {
      if (it.iid === undefined) { it.iid = g.itemSeq++; it.netAmt = it.amt; if (!it.dead) a.push([it.iid, RES_KEYS.indexOf(it.res), it.amt, Math.round(it.x), Math.round(it.y), Math.round(it.vx || 0), Math.round(it.vy || 0)]); else it.netGone = true; continue; }
      if (it.dead) { if (!it.netGone) { it.netGone = true; r.push(it.iid); } continue; }
      if (it.amt !== it.netAmt) { it.netAmt = it.amt; u.push([it.iid, it.amt]); }
    }
    if (items.some(i => i.dead)) items = items.filter(i => !i.dead);
    if (a.length || u.length || r.length) this.send({ t: 'it', a, u, r });
  },
  syncBits() { // caisses ouvertes et pylônes activés
    const g = this.game, co = [], py = [];
    for (const c of crates) { if (c.cid === undefined) c.cid = g.crateSeq++; if (c.open && !c.netOpen) { c.netOpen = true; co.push(c.cid); } }
    W.pylons.forEach((p, i) => { if (p.active && !p.netAct) { p.netAct = true; py.push(i); } });
    if (co.length) this.send({ t: 'crate', open: co });
    if (py.length) this.send({ t: 'pyl', l: py });
  },
  sendWorldInit(pid) {
    const g = this.game; this.syncItems(); this.syncBits();
    this.send({ t: 'wi', to: pid, cr: crates.map(c => [c.cid, Math.round(c.x), Math.round(c.y), Math.max(0, CRATE_T.indexOf(c.type)), c.open ? 1 : 0]), it: items.filter(i => !i.dead).map(i => [i.iid, RES_KEYS.indexOf(i.res), i.amt, Math.round(i.x), Math.round(i.y)]), py: W.pylons.map((p, i) => p.active ? i : -1).filter(i => i >= 0), tl: [...g.gone], al: alertLv });
    const p = g.peers.get(pid); if (p) { p.ready = true; p.sentW = null; }
    g.annW.set(pid, new Set());
  },
  flushHits() {
    const g = this.game;
    for (const [owner, m] of g.hitsOut) { if (!m.size) continue; const h = []; for (const [nid, v] of m) h.push([nid, Math.round(v[0] * 10) / 10, v[1]]); m.clear(); this.send({ t: 'hits', to: owner, h }); }
  },
  flushMisc() {
    const g = this.game;
    if (g.tiles.length) { this.send({ t: 'tile', l: g.tiles }); g.tiles = []; }
    if (g.drops.length && !g.isHost) { this.send({ t: 'drop', to: g.host, l: g.drops }); g.drops = []; }
    if (g.pulses && g.pulses.length) { for (const m of g.pulses) { m.to = g.host; this.send(m); } g.pulses = []; }
  },
  // ---------- appels depuis le jeu ----------
  hit(u, amt, src) {
    const g = this.game; if (!g || g.offline || !u.owner || !(amt > 0)) return;
    let m = g.hitsOut.get(u.owner); if (!m) g.hitsOut.set(u.owner, m = new Map());
    const sn = src && src.x !== undefined ? (src.net ? src.nid : this.nidOf(src)) : 0, cur = m.get(u.nid);
    if (cur) { cur[0] += amt; if (sn) cur[1] = sn; } else m.set(u.nid, [amt, sn]);
  },
  killNote(u, src) {
    const k = u.kind === 'enemy' ? 'e' : u.kind === 'rival' ? (u.role === 'leader' ? 'rl' : 'rb') : u.kind === 'beacon2' ? 'b2' : u.kind === 'player' ? 'pilot' : u.kind === 'robot' ? 'robot' : null;
    if (!k || !src.owner) return;
    this.send({ t: 'kill', to: src.owner, k, e: u.etype || '', b: u.boss ? 1 : 0, el: u.elite ? 1 : 0, s: src.nid, n: u.kind === 'player' ? pseudo() : (u.name || (u.crew && u.crew.name) || ''), cr: u.crew ? u.crew.name : '' });
  },
  drop(res, amt, x, y) { if (amt > 0) this.game.drops.push([RES_KEYS.indexOf(res), Math.round(amt), Math.round(x), Math.round(y)]); },
  tileGone(tx, ty) { const g = this.game; const i = ty * WT + tx; g.gone.add(i); if (!this.quiet) g.tiles.push(i); },
  pick(it, u) {
    const g = this.game; if (it.req > time - .6) return; it.req = time;
    this.send({ t: 'pick', to: g.host, i: it.iid, n: this.nidOf(u), f: Math.max(0, u.cargoMax - u.cargoW) });
  },
  openCrate(c) { const g = this.game; if (c.req > time - 1.5) return; c.req = time; this.send({ t: 'crate', to: g.host, o: c.cid }); },
  pylon(p) { const g = this.game, i = W.pylons.indexOf(p); p.netAct = true; this.send({ t: 'pyl', l: [i], to: g.host }); },
  pulse(u, charge) { const g = this.game; (g.pulses || (g.pulses = [])).push({ t: 'pulse', to: g.host, x: Math.round(u.x), y: Math.round(u.y), c: charge, b: this.nidOf(u) }); }, // envoyé après la position de la balise
  note(text, col, extra) { this.send(Object.assign({ t: 'note', x: text, c: col || '#e8dcc4' }, extra || {})); },
  livingFoci() {
    const g = this.game, out = [];
    if (player && !player.dead) { const F = focus(); out.push({ x: F.x, y: F.y }); }
    for (const p of g.peers.values()) if (!p.done && p.focus && p.focus[0]) out.push({ x: p.focus[0], y: p.focus[1] });
    return out;
  },
  spawnFocus() { const l = this.livingFoci(); return l.length ? pick(l) : focus(); },
  nearestFocus(x, y) { let best = focus(), bd = Infinity; for (const f of this.livingFoci()) { const q = d2(x, y, f.x, f.y); if (q < bd) { bd = q; best = f; } } return best; },
  nearPeers(x, y, r2) { for (const p of this.game.peers.values()) { if (p.done) continue; if (p.focus && d2(x, y, p.focus[0], p.focus[1]) < r2) return true; if (p.beacon && d2(x, y, p.beacon[0], p.beacon[1]) < r2) return true; } return false; },
  peerBeacon(nid) { const u = this.game.byNid.get(nid); return u && !u.dead ? u : null; },
  // ---------- messages reçus pendant la partie ----------
  handle(m) {
    const g = this.game, from = m.from;
    switch (m.t) {
      case 'u': return this.onUnits(from, m);
      case 'w': if (from === g.host) { alertLv = m.al | 0; this.onEntities(from, m, true); } return;
      case 'wi': return this.onWorldInit(m);
      case 'need': g.annU.clear(); if (g.isHost) this.sendWorldInit(from); return;
      case 'hits': return this.onHits(m);
      case 'kill': return this.onKill(m);
      case 'note': if (m.boss && g.mode === 'coop' && raidStats && !raidStats.boss) { raidStats.boss = true; raidStats.bossType = m.boss; if (regionCur !== null) save.bossKills[regionCur] = (save.bossKills[regionCur] || 0) + 1; } if (m.x) msg(m.x, m.c || '#e8dcc4', 6); return;
      case 'tile': this.quiet = true; try { for (const i of m.l) { g.gone.add(i); const o = W.obs[i]; if (o && o < 7) { const tx = i % WT, ty = (i / WT) | 0; W.obs[i] = 0; W.ohp[i] = 0; miniSetTile(tx, ty); for (let k = 0; k < 4; k++) parts.push({ type: 'debris', x: tx * TILE + 20 + rnd(-14, 14), y: ty * TILE + 20 + rnd(-14, 14), vx: rnd(-80, 80), vy: rnd(-80, 80), life: rnd(.4, .8), max: .8, size: rnd(2, 5), col: OBS[o].mm, rot: 0 }); } } } finally { this.quiet = false; } return;
      case 'it': if (g.isHost) return;
        for (const a of m.a || []) if (!items.some(i => i.iid === a[0])) items.push({ iid: a[0], res: RES_KEYS[a[1]], amt: a[2], x: a[3], y: a[4], vx: a[5] || 0, vy: a[6] || 0, t: 0, dead: false });
        if ((m.u && m.u.length) || (m.r && m.r.length)) { const map = new Map(items.map(i => [i.iid, i])); for (const [id, n] of m.u || []) { const it = map.get(id); if (it) it.amt = n; } for (const id of m.r || []) { const it = map.get(id); if (it) it.dead = true; } items = items.filter(i => !i.dead); }
        return;
      case 'drop': if (g.isHost) for (const [ri, n, x, y] of m.l || []) if (RES_KEYS[ri]) spawnItem(RES_KEYS[ri], n, x, y); return;
      case 'pick': {
        if (!g.isHost) return;
        const it = items.find(i => i.iid === m.i && !i.dead); if (!it) return;
        const n = Math.min(it.amt, Math.floor((m.f || 0) / RES[it.res].w + 1e-6)); if (n <= 0) return;
        it.amt -= n; if (it.amt <= 0) it.dead = true;
        this.send({ t: 'got', to: from, n: m.n, res: it.res, a: n, x: Math.round(it.x), y: Math.round(it.y) }); return;
      }
      case 'got': {
        if (m.crate !== undefined) { if (m.ty === 'donnees' && raidStats) { raidStats.archives++; floatText(m.x, m.y - 20, 'Archive de données', '#7fa9ff'); } SFX.play('open', 1, m.x, m.y); return; }
        const u = g.local.get(m.n);
        const got = u && !u.dead ? addCargo(u, m.res, m.a) : 0;
        if (got > 0) { floatText(m.x, m.y - 10, '+' + got + ' ' + RES[m.res].n, u === focus() ? RES[m.res].c : '#6fe3c8'); SFX.play('pickup', .7, undefined, undefined, { note: PICK_NOTE[m.res] || 880, chord: m.res === 'heart' || m.res === 'cores' }); if (m.res === 'heart') msg('Cœur de Colosse récupéré. Ramenez-le vivant.', '#ff8a5c', 8); }
        if (m.a - got > 0) spawnItem(m.res, m.a - got, m.x, m.y);
        return;
      }
      case 'crate':
        if (m.open) { const set = new Set(m.open); for (const c of crates) if (set.has(c.cid) && !c.open) { c.open = true; c.netOpen = true; } return; }
        if (g.isHost && m.o !== undefined) { const c = crates.find(x => x.cid === m.o); if (!c || c.open) return; c.open = true; if (c.claimed) c.claimed = null; dropTable(CRATE_LOOT[c.type], c.x, c.y); this.send({ t: 'got', to: from, crate: c.cid, ty: c.type, x: Math.round(c.x), y: Math.round(c.y) }); }
        return;
      case 'pyl': for (const i of m.l || []) { const p = W.pylons[i]; if (p && !p.active) { p.active = true; reveal(p.x, p.y, 1900); if (!g.isHost) p.netAct = true; } } return;
      case 'pulse': {
        if (!g.isHost) return;
        const bu = this.peerBeacon(m.b) || { x: m.x, y: m.y, dead: false }, rad = 800 + (m.c || 0) * 1000;
        for (const e of units) { if (e.kind !== 'enemy' || e.dead || e.static || e.boss || e.net) continue; if (d2(e.x, e.y, m.x, m.y) < rad * rad) { e.forced = bu.nid !== undefined ? bu : null; e.active = true; } }
        spawnGroup(m.x, m.y, 1000, 1350, Math.round((1 + alertLv * .8 + (m.c || 0) * 3.5) * diff.spawn * armyScale(.6)), bu.nid !== undefined ? { forced: bu } : { alerted: true });
        rivalsHear(m.x, m.y); return;
      }
    }
  },
  onWorldInit(m) {
    const g = this.game; if (g.isHost) return;
    crates = (m.cr || []).map(([cid, x, y, t, o]) => ({ cid, x, y, type: CRATE_T[t] || 'caisse', open: !!o, netOpen: !!o }));
    items = (m.it || []).map(([iid, ri, amt, x, y]) => ({ iid, res: RES_KEYS[ri], amt, x, y, vx: 0, vy: 0, t: 1, dead: false })).filter(i => i.res);
    for (const i of m.py || []) { const p = W.pylons[i]; if (p) { p.active = true; p.netAct = true; } }
    this.quiet = true;
    try { for (const i of m.tl || []) { g.gone.add(i); const o = W.obs[i]; if (o && o < 7) { W.obs[i] = 0; W.ohp[i] = 0; miniSetTile(i % WT, (i / WT) | 0); } } } finally { this.quiet = false; }
    alertLv = m.al | 0; g.gotWorld = true;
  },
  onUnits(from, m) {
    const g = this.game; let p = g.peers.get(from);
    if (!p) { p = { name: '?', slot: 1, done: false, focus: null, beacon: null, ready: false }; g.peers.set(from, p); }
    if (m.f && (m.f[0] || m.f[1])) p.focus = m.f; p.beacon = m.b || null; p.last = performance.now();
    this.onEntities(from, m, false);
    for (const nid of m.x || []) { const u = g.byNid.get(nid); if (u) { u.dead = true; parts.push({ type: 'flash', x: u.x, y: u.y, vx: 0, vy: 0, life: .35, max: .35, size: u.r * 3.5, col: '#fff8dc', a: 0 }); } }
  },
  onEntities(from, m, world) {
    const g = this.game, now = performance.now();
    for (const nid in m.sp || {}) { const s = m.sp[nid]; s.o = from; s.world = world; g.specs.set(+nid, s); }
    for (const e of m.l || []) this.apply(e, from, now);
    for (const nid of m.d || []) this.die(nid);
  },
  apply(e, owner, now) {
    const g = this.game, nid = e[0];
    if (g.local.has(nid)) return; // c'est une de nos unités (après une reprise de l'hôte)
    let u = g.byNid.get(nid);
    if (u && u.dead) { g.byNid.delete(nid); u = null; }
    if (!u) { const s = g.specs.get(nid); if (!s) return; u = this.makeProxy(nid, s, owner, e); if (!u) return; }
    const dt = Math.max(.05, (now - (u.seen || now)) / 1000), mvd = Math.hypot(e[1] - u.nx, e[2] - u.ny);
    u.nmv = clamp(mvd / dt / ((u.spd || 100) * .6 + 1), 0, 1);
    u.owner = owner; u.seen = now; u.nx = e[1]; u.ny = e[2]; u.na = e[3] / 100; u.hp = e[4]; u.maxhp = 1000;
    const f = e[5]; u.hidden = !!(f & 1); u.piloted = !!(f & 2); u.shield = f & 4 ? 60 : 0; u.shieldMax = 100; u.cloak = !!(f & 8); if (u.cloak) u.lastFire = -9; u.netWin = !!(f & 16);
    u.jz = (e[7] || 0) / 100; u.netCharge = (e[8] || 0) / 1000; if (u.crew) u.crew.charge = u.netCharge;
    const ms = e[6], fresh = now - u.born > 350;
    if (!ms) return;
    if (u.kind === 'pilot') { const fc = ms[1]; if (u.gfc === undefined) u.gfc = fc; else if (fc !== u.gfc) { const n = Math.min(3, (fc - u.gfc + 256) & 255); u.gfc = fc; if (fresh) for (let k = 0; k < n; k++) this.visPilot(u, ms[0] / 100); } return; }
    for (let i = 0; i < u.mounts.length && i * 3 < ms.length; i++) {
      const mt = u.mounts[i]; mt.aim = ms[i * 3] / 100; mt.td = ms[i * 3 + 2] * 10; const fc = ms[i * 3 + 1];
      if (mt.nfc === undefined) mt.nfc = fc;
      else if (fc !== mt.nfc) { const n = Math.min(3, (fc - mt.nfc + 256) & 255); mt.nfc = fc; if (fresh) for (let k = 0; k < n; k++) this.visFire(u, mt); }
    }
  },
  makeProxy(nid, s, owner, e) {
    const g = this.game, x = e[1], y = e[2], world = !!s.world || s.k === 'e' || s.k === 'rb' || s.k === 'rl' || s.k === 'b2' || !!s.wm;
    const peer = g.peers.get(s.o || owner), slot = peer ? peer.slot : 1;
    let u;
    try {
      switch (s.k) {
        case 'e': if (!ENEMIES[s.e]) return null; u = makeEnemy(s.e, x, y, { active: true }); units.pop(); break;
        case 'r': case 'rb': if (!CHASSIS[s.c]) return null; u = makeRobot({ chassis: s.c, weapons: (s.w || []).filter(w => WEAPONS[w]), modules: [], brain: 'escort', hp: 1, xp: s.xp || 0, traits: [], name: s.n || '', id: -1 }, x, y); u.kind = s.k === 'rb' ? 'rival' : 'robot'; if (s.k === 'rb') u.role = 'bot'; break;
        case 'p': case 'rl': {
          const pw = PWEAPONS[s.pw] || PWEAPONS.pistol;
          u = baseUnit({ kind: s.k === 'rl' ? 'rival' : 'pilot', role: s.k === 'rl' ? 'leader' : undefined, x, y, r: 12, human: true, pw: s.k === 'rl' ? { gun: 'ar' } : pw, cargoW: 0, cargoMax: 1, name: s.n || '', spd: 210 });
          if (s.k === 'rl') u.mounts = [makeMount('e_rifle', Object.assign({}, WEAPONS.e_rifle), 7, 4)];
          break;
        }
        case 'm': u = baseUnit({ kind: 'minion', r: 8, fly: true, mscale: .7, x, y, spd: 270 }); u.mounts = [makeMount('mg_mini', WEAPONS.mg_mini, 3, 0)]; u.worldMinion = !!s.wm; break;
        case 'b': case 'b2': u = baseUnit({ kind: s.k === 'b' ? 'beacon' : 'beacon2', r: 18, x, y, name: 'Balise' }); break;
        default: return null;
      }
    } catch (er) { return null; }
    const team = world ? (s.k === 'e' ? 1 : 2) : (g.mode === 'coop' ? 0 : 3 + slot);
    Object.assign(u, { net: true, nid, owner, team, active: true, static: true, born: performance.now(), seen: performance.now(), nx: x, ny: y, na: e[3] / 100, ang: e[3] / 100, x, y, vx: 0, vy: 0, mv: 0, sel: false, order: null });
    if (s.k === 'rb' || s.k === 'rl' || s.k === 'b2') u.crew = { pal: CREW_PALS[s.p || 0] || CREW_PALS[0], name: s.n || '', charge: 0 };
    if (!world) { u.npal = (s.k === 'p' ? NPPALS : NPALS)[slot % 4]; u.pname = peer ? peer.name : (s.n || ''); u.pslot = slot; }
    units.push(u); g.byNid.set(nid, u);
    return u;
  },
  die(nid) {
    const u = this.game.byNid.get(nid); if (!u || u.dead) return;
    u.dead = true; this.game.byNid.delete(nid);
    if (u.kind !== 'pilot') FX.wreck(u);
    if (u.kind !== 'pilot') boom(u.x, u.y, Math.max(30, u.r * 2.2)); else { SFX.play('death', .6, u.x, u.y); boom(u.x, u.y, 40); }
  },
  onHits(m) {
    const g = this.game;
    for (const [nid, amt, sn] of m.h || []) {
      const u = g.local.get(nid); if (!u || u.dead || u.net) continue;
      const src = sn ? (g.byNid.get(sn) || null) : null;
      damage(u, amt, src);
    }
  },
  onKill(m) {
    const g = this.game, src = g.local.get(m.s);
    if (!raidStats) return;
    if (m.k === 'e') {
      raidStats.kills++; raidStats.byType[m.e] = (raidStats.byType[m.e] || 0) + 1;
      const E = ENEMIES[m.e], xp = Math.max(1, (E ? E.hp : 100) / 10);
      if (src && src.kind === 'robot' && !src.dead) { src.kills = (src.kills || 0) + 1; giveXP(src, xp); }
      if (src) for (const v of fleet) if (v !== src && !v.dead && d2(v.x, v.y, src.x, src.y) < 600 * 600) giveXP(v, xp * .25);
      if (m.el) msg('Mastodonte abattu.', '#f2c14e');
      if (m.b && !raidStats.boss) { raidStats.boss = true; raidStats.bossType = m.e; if (regionCur !== null) save.bossKills[regionCur] = (save.bossKills[regionCur] || 0) + 1; msg((E ? E.n : 'Le boss') + ' est tombé sous vos coups !', '#ff8a5c', 8); }
    } else if (m.k === 'rl') { raidStats.rivalKills++; msg('Vous avez abattu le chef de ' + (m.cr || 'l\'équipe rivale') + '.', COL.rival, 6); }
    else if (m.k === 'b2') { raidStats.sabotage++; msg('Balise de ' + (m.cr || 'l\'équipe rivale') + ' détruite par vos tirs.', COL.rival, 5); }
    else if (m.k === 'pilot') { save.stats.pvpKills = (save.stats.pvpKills || 0) + 1; msg('Vous avez abattu ' + m.n + ' ! Son butin est tombé au sol.', '#ff8a5c', 7); }
    else if (m.k === 'robot') msg('Robot adverse détruit : ' + m.n + '.', '#f2c14e', 4);
    if (src && isMine(src)) { killMarkT = .4; SFX.play('kill', .7); }
  },
  // ---------- reproduction des tirs des autres ----------
  visFire(u, m) {
    const w = m.w; if (!w || w.kind === 'repair' || w.kind === 'shield' || w.kind === 'bay') return;
    u.lastFire = time;
    const [mx, my] = mountWorldPos(u, m), a = m.aim, range = m.td > 20 ? m.td : (w.range || 400), sc = u.mscale || 1;
    NETVIS = true;
    try {
      if (w.kind === 'beam') {
        const ca = Math.cos(a), sa = Math.sin(a), sx = mx + ca * 14 * sc, sy = my + sa * 14 * sc; let len = w.range;
        for (let s = 0; s < w.range; s += 20) { const tx = ((sx + ca * s) / TILE) | 0, ty = ((sy + sa * s) / TILE) | 0; if (tx < 0 || ty < 0 || tx >= WT || ty >= WT || W.obs[ty * WT + tx]) { len = s; break; } }
        beams.push({ x1: sx, y1: sy, x2: sx + ca * len, y2: sy + sa * len, life: .16, max: .16, col: w.col, w: 4 * sc * .7 * (w.bw || 1), hot: true }); m.recoil = .3;
        SFX.hold('b' + u.id + '_' + u.mounts.indexOf(m), 'beam', .4, sx, sy);
      } else if (w.kind === 'fusion') fusionShot(u, m, mx, my, w);
      else if (w.kind === 'chain') { const sx = mx + Math.cos(a) * 13 * sc, sy = my + Math.sin(a) * 13 * sc, L = Math.min(range, w.range); beams.push({ pts: zig(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L, 7, 10), life: .18, max: .18, col: w.col, w: w.chain > 4 ? 3 : 2 }); m.recoil = 1; SFX.play(w.snd, .5, sx, sy, { size: w.size || 1 }); }
      else if (w.kind === 'melee') { m.recoil = 1; sparks(mx + Math.cos(a) * 18 * sc, my + Math.sin(a) * 18 * sc, 5, '#e8f0ff'); SFX.play(w.snd || 'melee', .5, u.x, u.y); }
      else fireMountCore(u, m, mx + Math.cos(a) * range, my + Math.sin(a) * range, null, w);
    } catch (er) { } finally { NETVIS = false; }
  },
  visPilot(u, aim) {
    const w = u.pw; if (!w || !w.kind) return;
    u.lastFire = time; u.ang = aim;
    const sx = u.x + Math.cos(aim) * 18, sy = u.y + Math.sin(aim) * 18;
    NETVIS = true;
    try {
      if (w.kind === 'chain') beams.push({ pts: zig(sx, sy, sx + Math.cos(aim) * 170, sy + Math.sin(aim) * 170, 6, 8), life: .12, max: .12, col: w.col, w: 2 });
      else for (let i = 0; i < (w.pellets || 1); i++) { const b = shoot(sx, sy, aim + (Math.random() - .5) * 2 * w.spread, w.kind === 'rocket' ? w.spd * .4 : w.spd, w.dmg, u.team, w.range, w.kind, w.col, w.pierce || 0, u, w.splash || 0, 1); b.maxSpd = w.spd; }
      muzzle(sx, sy, aim, '#ffe6a8', 1.2); SFX.play(w.snd, .55, sx, sy);
    } catch (er) { } finally { NETVIS = false; }
  },
  // ---------- affichage ----------
  drawZones(c) {
    if (!this.game || this.game.mode !== 'coop') return;
    for (const u of this.game.byNid.values()) {
      if (u.dead || u.kind !== 'beacon') continue;
      c.save(); c.translate(u.x, u.y); c.strokeStyle = u.netWin ? '#f2c14e' : 'rgba(242,193,78,.3)'; c.lineWidth = u.netWin ? 3 : 1.5; c.setLineDash([14, 12]); c.lineDashOffset = -time * 30; circ(c, 0, 0, ZONE_R); c.stroke(); c.setLineDash([]); c.restore();
    }
  },
  drawTags(c) {
    const z = cam.zoom, g = this.game; if (!g) return;
    c.textAlign = 'center'; c.font = `700 ${12 / z}px ${FONT}`;
    for (const u of g.byNid.values()) {
      if (u.dead || u.hidden || !u.pname || !(u.kind === 'pilot' || (u.kind === 'robot' && (u.piloted || tactical)))) continue;
      const y = u.y - u.r - (u.kind === 'pilot' ? 18 : 22) / z;
      c.fillStyle = 'rgba(14,17,18,.75)'; const tw = c.measureText(u.pname).width; c.fillRect(u.x - tw / 2 - 5 / z, y - 12 / z, tw + 10 / z, 16 / z);
      c.fillStyle = g.mode === 'pvp' ? COL.enemy2 : NPAL_ACC[(u.pslot || 0) % 4]; c.fillText(u.pname, u.x, y);
    }
  },
  drawParty(c, x, y, w) {
    const g = this.game; if (!g) return;
    const ps = [...g.peers.values()].sort((a, b) => a.slot - b.slot), F = focus(), h = 22 + ps.length * 17;
    panel(c, x, y, w, h); c.textAlign = 'left'; c.font = `700 12px ${FONT}`; c.fillStyle = g.mode === 'pvp' ? COL.rival : COL.ally;
    c.fillText((g.mode === 'pvp' ? 'PvP' : 'Coopération') + (g.isHost ? ' · hôte' : '') + (g.offline ? ' · hors ligne' : ''), x + 8, y + 15);
    c.font = `500 11.5px ${FONT}`;
    ps.forEach((p, i) => {
      const yy = y + 32 + i * 17; c.fillStyle = NPAL_ACC[p.slot % 4]; c.fillRect(x + 8, yy - 8, 7, 7);
      c.fillStyle = '#e8dcc4'; c.fillText(fitText(c, p.name, w - 90), x + 20, yy);
      c.textAlign = 'right'; c.fillStyle = '#a59c88';
      c.fillText(p.done ? 'parti' : p.focus ? Math.round(Math.hypot(p.focus[0] - F.x, p.focus[1] - F.y) / 10) + ' m' : '…', x + w - 8, yy); c.textAlign = 'left';
    });
  },
  drawMini(c, M) {
    const g = this.game; if (!g) return;
    for (const u of g.byNid.values()) {
      if (u.dead || u.hidden || u.pslot === undefined) continue;
      const [mx, my] = M(u.x, u.y), s = u.kind === 'pilot' ? 5 : 3;
      c.fillStyle = g.mode === 'pvp' ? COL.enemy : NPAL_ACC[u.pslot % 4]; c.fillRect(mx - s / 2, my - s / 2, s, s);
      if (u.kind === 'pilot') { c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(mx - s / 2 - .5, my - s / 2 - .5, s + 1, s + 1); }
    }
  },
};
