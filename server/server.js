#!/usr/bin/env node
'use strict';
/*
 * Serveur COLOSSE — aucune dépendance, Node.js 18 ou plus.
 *   node server/server.js
 * Variables d'environnement facultatives :
 *   PORT=8787        port d'écoute
 *   HOST=::          adresse d'écoute ("::" = IPv6 + IPv4 sur la plupart des systèmes)
 *   NAME="Colosse"   nom affiché aux joueurs
 *   DATA=chemin.json fichier des données (comptes, classement, bases, attaques)
 *   SAVES=dossier    dossier des sauvegardes de parties (une par compte)
 * Le serveur sert aussi le jeu (index.html) : ouvrez http://adresse:8787 dans un navigateur.
 * Il gère : comptes (identifiant + mot de passe), sauvegardes par compte, classement,
 * bases publiées, attaques avec vol de ressources et bouclier, et raids partagés en direct (WebSocket).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8787;
const HOST = process.env.HOST || '::';
const NAME = String(process.env.NAME || 'Serveur Colosse').slice(0, 40);
const ROOT = path.resolve(__dirname, '..');
const DATA = path.resolve(process.env.DATA || path.join(__dirname, 'data.json'));
const SAVES = path.resolve(process.env.SAVES || path.join(path.dirname(DATA), 'saves'));
const VERSION = '1.2.1';
const MAX_BODY = 1024 * 1024;
const MAX_SAVE = 900 * 1024;
const MAX_PLAYERS = 5000;
const MAX_ATTACKS = 20000;
const SESSION_DAYS = 90;

// ---------- données ----------
let db = { players: {}, names: {}, sessions: {}, bases: {}, attacks: [] };
try { if (fs.existsSync(DATA)) db = Object.assign(db, JSON.parse(fs.readFileSync(DATA, 'utf8'))); } catch (e) { console.error('Données illisibles, nouveau fichier :', e.message); }
for (const k of ['players', 'names', 'sessions', 'bases']) if (!db[k] || typeof db[k] !== 'object') db[k] = {};
if (!Array.isArray(db.attacks)) db.attacks = [];
// index des noms (comptes créés avant la version 1.2 : sans mot de passe, ils restent jouables avec leur jeton)
for (const [id, p] of Object.entries(db.players)) if (p.pass && p.name && !db.names[p.name.toLowerCase()]) db.names[p.name.toLowerCase()] = id;
try { fs.mkdirSync(SAVES, { recursive: true }); } catch (e) { console.error('Dossier des sauvegardes inaccessible :', e.message); }
let dirty = false;
function persist() {
  if (!dirty) return; dirty = false;
  const tmp = DATA + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), err => { if (err) return console.error('Écriture impossible :', err.message); fs.rename(tmp, DATA, e2 => { if (e2) console.error(e2.message); }); });
}
setInterval(persist, 5000).unref();
function quit() { try { fs.writeFileSync(DATA, JSON.stringify(db)); } catch (e) { } process.exit(0); }
process.on('SIGINT', quit); process.on('SIGTERM', quit);

// ---------- outils ----------
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const int = (v, a, b) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a; };
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 20);
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Private-Network': 'true', 'Cache-Control': 'no-store' };
function send(res, code, obj) { res.writeHead(code, HEADERS); res.end(JSON.stringify(obj)); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('requête trop grande')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('JSON invalide')); } });
    req.on('error', reject);
  });
}
function hashPass(pass, salt) { return crypto.scryptSync(String(pass), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex'); }
function newSession(id) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[sha(token)] = { id, t: Date.now() }; dirty = true;
  return token;
}
// jeton de session (comptes) ou ancien couple identifiant + jeton (versions 1.0 et 1.1)
function auth(b) {
  const tk = String(b.token || ''); if (!tk) return null;
  const s = db.sessions[sha(tk)];
  const tag = (p, id) => { Object.defineProperty(p, '_id', { value: id, enumerable: false, configurable: true, writable: true }); return p; };
  if (s && db.players[s.id]) { if (Date.now() - s.t > 3600e3) { s.t = Date.now(); dirty = true; } return tag(db.players[s.id], s.id); }
  const p = db.players[String(b.id || '')];
  return p && p.tok && p.tok === sha(tk) ? tag(p, String(b.id)) : null;
}
function authToken(tk) { return auth({ token: tk }); }
setInterval(() => { const lim = Date.now() - SESSION_DAYS * 864e5; for (const [k, s] of Object.entries(db.sessions)) if (s.t < lim) { delete db.sessions[k]; dirty = true; } }, 3600e3).unref();
const hits = new Map(), fails = new Map();
function limited(map, ip, max, win = 60000) {
  const now = Date.now(), h = map.get(ip) || { n: 0, t: now };
  if (now - h.t > win) { h.n = 0; h.t = now; }
  h.n++; map.set(ip, h); return h.n > max;
}
setInterval(() => { const now = Date.now(); for (const m of [hits, fails]) for (const [k, h] of m) if (now - h.t > 600000) m.delete(k); }, 60000).unref();
const pub = id => { const p = db.players[id] || {}; return p.name || 'Pilote'; };

// ---------- sauvegardes ----------
const saveFile = id => path.join(SAVES, String(id).replace(/[^\w-]/g, '') + '.json');
function readSave(id) { try { return JSON.parse(fs.readFileSync(saveFile(id), 'utf8')); } catch (e) { return null; } }
function writeSaveFile(id, obj) { const f = saveFile(id), tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, f); }

// ---------- vol de ressources ----------
// Ressources pillables, part protégée (QG + entrepôt), taux selon les étoiles, bouclier ensuite.
const STEAL = { scrap: 150, alloy: 40, circuits: 30, crystals: 25, data: 10 };
const SHIELD_H = [0, 1, 2, 4];
// part des stocks à l'abri grâce à l'entrepôt blindé (même règle que le jeu, niveaux 1 à 10)
const whProtect = L => Math.min(.85, .15 + .1 * Math.min(L, 5) + .04 * Math.max(0, L - 5));
function stealFrom(base, stars, pct) {
  const res = base.res || {}, hq = base.hq || 1, wh = base.wh || 0, loot = {};
  const rate = [0, .1, .18, .25][stars] * (.4 + .6 * pct / 100);
  for (const k in STEAL) {
    const have = Math.max(0, res[k] || 0), prot = Math.max(STEAL[k] * (1 + .5 * hq), have * whProtect(wh));
    const n = Math.min(5000, Math.floor(Math.max(0, have - prot) * rate));
    if (n > 0) { loot[k] = n; res[k] = have - n; }
  }
  base.res = res; return loot;
}

// ---------- API HTTP ----------
async function apiRoute(req, res, url) {
  const ip = req.socket.remoteAddress || '?';
  if (limited(hits, ip, 240)) return send(res, 429, { error: 'trop de requêtes, patientez une minute' });
  const p = url.pathname, now = Date.now();
  if (req.method === 'GET' && p === '/api/info') return send(res, 200, { name: NAME, version: VERSION, players: Object.keys(db.players).length, accounts: true, ws: true, rooms: rooms.size });
  if (req.method === 'GET' && p === '/api/scores') {
    const list = Object.entries(db.players).filter(([, x]) => x.score !== undefined).map(([id, x]) => ({ id, name: x.name, score: x.score, extract: x.extract, kills: x.kills, boss: x.boss, defenses: x.defenses, assaults: x.assaults, hq: x.hq, region: x.region, t: x.t }))
      .sort((a, b) => b.score - a.score).slice(0, 50);
    return send(res, 200, { list });
  }
  if (req.method === 'GET' && p === '/api/bases') {
    const list = Object.entries(db.bases).map(([id, x]) => {
      const cp = { res: Object.assign({}, x.res || {}), hq: x.hq, wh: x.wh };
      return { id, name: pub(id), b: x.b, hq: x.hq, def: x.def, t: x.t, shield: x.shield > now ? x.shield : 0, avail: stealFrom(cp, 3, 100) };
    }).sort((a, b) => b.t - a.t).slice(0, 80);
    return send(res, 200, { list });
  }
  if (req.method === 'GET' && p === '/api/attacks') {
    const target = String(url.searchParams.get('target') || '');
    const list = db.attacks.filter(a => a.target === target || a.attacker === target).slice(-60).map(a => Object.assign({}, a, { attackerName: pub(a.attacker), targetName: pub(a.target) }));
    return send(res, 200, { list });
  }
  if (req.method !== 'POST') return send(res, 404, { error: 'inconnu' });
  const b = await readBody(req);

  // --- comptes ---
  if (p === '/api/account/create') {
    const name = cleanName(b.name), pass = String(b.pass || '');
    if (name.length < 3) return send(res, 400, { error: 'identifiant trop court (3 caractères au moins)' });
    if (pass.length < 6) return send(res, 400, { error: 'mot de passe trop court (6 caractères au moins)' });
    if (db.names[name.toLowerCase()]) return send(res, 409, { error: 'cet identifiant est déjà pris' });
    if (Object.keys(db.players).length >= MAX_PLAYERS) return send(res, 503, { error: 'serveur complet' });
    // reprise d'un ancien profil anonyme (classement, base publiée) s'il est fourni
    let id = null; const old = db.players[String(b.legacyId || '')];
    if (old && !old.pass && old.tok === sha(b.legacyToken || '')) id = String(b.legacyId);
    if (!id) { id = crypto.randomBytes(8).toString('hex'); db.players[id] = { created: now }; }
    const salt = crypto.randomBytes(16).toString('hex');
    Object.assign(db.players[id], { name, pass: { salt, hash: hashPass(pass, salt) }, t: now }); delete db.players[id].tok;
    db.names[name.toLowerCase()] = id; dirty = true;
    return send(res, 200, { id, name, token: newSession(id) });
  }
  if (p === '/api/account/login') {
    if (limited(fails, ip, 12)) return send(res, 429, { error: 'trop d\'essais, patientez une minute' });
    const name = cleanName(b.name), id = db.names[name.toLowerCase()], pl = id && db.players[id];
    if (!pl || !pl.pass || hashPass(b.pass || '', pl.pass.salt) !== pl.pass.hash) return send(res, 403, { error: 'identifiant ou mot de passe incorrect' });
    fails.delete(ip);
    return send(res, 200, { id, name: pl.name, token: newSession(id) });
  }
  if (p === '/api/register') { // ancien client (1.0 / 1.1) : profil anonyme
    if (Object.keys(db.players).length >= MAX_PLAYERS) return send(res, 503, { error: 'serveur complet' });
    const id = crypto.randomBytes(8).toString('hex'), token = crypto.randomBytes(24).toString('hex');
    db.players[id] = { tok: sha(token), name: cleanName(b.name) || 'Pilote', created: now, t: now }; dirty = true;
    return send(res, 200, { id, token });
  }
  const pl = auth(b); if (!pl) return send(res, 403, { error: 'session expirée : reconnectez-vous' });
  const me = pl._id;
  if (p === '/api/account/me') return send(res, 200, { id: me, name: pl.name, account: !!pl.pass });
  if (p === '/api/account/logout') { delete db.sessions[sha(b.token || '')]; dirty = true; return send(res, 200, { ok: true }); }
  if (p === '/api/account/password') {
    if (!pl.pass || hashPass(b.old || '', pl.pass.salt) !== pl.pass.hash) return send(res, 403, { error: 'mot de passe actuel incorrect' });
    if (String(b.pass || '').length < 6) return send(res, 400, { error: 'nouveau mot de passe trop court' });
    const salt = crypto.randomBytes(16).toString('hex'); pl.pass = { salt, hash: hashPass(b.pass, salt) };
    const keep = sha(b.token || ''); for (const [k, s] of Object.entries(db.sessions)) if (s.id === me && k !== keep) delete db.sessions[k];
    dirty = true; return send(res, 200, { ok: true });
  }

  // --- sauvegarde de la partie ---
  if (p === '/api/save/get') { const s = readSave(me); return send(res, 200, s ? { rev: s.rev, t: s.t, data: s.data } : { rev: 0, t: 0, data: null }); }
  if (p === '/api/save/put') {
    const data = String(b.data || ''); if (!data || data.length > MAX_SAVE) return send(res, 400, { error: 'sauvegarde invalide ou trop grande' });
    try { JSON.parse(data); } catch (e) { return send(res, 400, { error: 'sauvegarde illisible' }); }
    const cur = readSave(me), rev = cur ? cur.rev : 0;
    if (!b.force && int(b.rev, 0, 1e12) !== rev) return send(res, 409, { error: 'une sauvegarde plus récente existe (autre appareil)', rev, t: cur ? cur.t : 0 });
    try { writeSaveFile(me, { rev: rev + 1, t: now, data }); } catch (e) { return send(res, 500, { error: 'écriture impossible sur le serveur' }); }
    return send(res, 200, { rev: rev + 1, t: now });
  }

  // --- classement, base publiée ---
  if (p === '/api/score') {
    Object.assign(pl, { name: pl.pass ? pl.name : (cleanName(b.name) || pl.name), score: int(b.score, 0, 1e9), extract: int(b.extract, 0, 1e7), kills: int(b.kills, 0, 1e9), boss: int(b.boss, 0, 1e6), defenses: int(b.defenses, 0, 1e6), assaults: int(b.assaults, 0, 1e6), hq: int(b.hq, 1, 10), region: int(b.region, 1, 4), t: now });
    dirty = true; return send(res, 200, { ok: true });
  }
  if (p === '/api/base') {
    // 2.1 : bâtiments jusqu'au niveau 10 et jusqu'à ~530 constructions au QG 10
    if (!Array.isArray(b.b) || b.b.length > 700) return send(res, 400, { error: 'base invalide' });
    const list = b.b.filter(a => Array.isArray(a) && a.length === 4).map(a => [int(a[0], 0, 63), int(a[1], 0, 299), int(a[2], 0, 299), int(a[3], 1, 10)]);
    const old = db.bases[me] || {}, r = {};
    if (b.res && typeof b.res === 'object') for (const k in STEAL) r[k] = int(b.res[k], 0, 1e9);
    db.bases[me] = { b: list, hq: int(b.hq, 1, 10), def: int(b.def, 0, 700), wh: int(b.wh, 0, 10), res: b.res ? r : (old.res || {}), shield: old.shield || 0, lock: old.lock || 0, t: now }; dirty = true;
    return send(res, 200, { ok: true, shield: db.bases[me].shield > now ? db.bases[me].shield : 0 });
  }
  if (p === '/api/assault/start') {
    const target = String(b.target || ''), tb = db.bases[target];
    if (!tb || target === me) return send(res, 400, { error: 'cible invalide' });
    if (tb.shield > now) return send(res, 409, { error: 'cette base est sous bouclier', shield: tb.shield });
    if (tb.lock > now && tb.lockBy !== me) return send(res, 409, { error: 'cette base est déjà attaquée en ce moment' });
    if (db.attacks.some(a => a.attacker === me && a.target === target && now - a.t < 20 * 60000)) return send(res, 429, { error: 'vous avez attaqué cette base il y a moins de 20 minutes' });
    tb.lock = now + 4.5 * 60000; tb.lockBy = me;
    if (db.bases[me] && db.bases[me].shield > now) db.bases[me].shield = 0; // attaquer retire votre propre bouclier
    dirty = true; return send(res, 200, { ok: true, b: tb.b, hq: tb.hq, name: pub(target) });
  }
  if (p === '/api/attack') {
    const target = String(b.target || ''), tb = db.bases[target];
    if (!db.players[target] || target === me) return send(res, 400, { error: 'cible invalide' });
    const stars = int(b.stars, 0, 3), pct = int(b.pct, 0, 100);
    let loot = {};
    if (tb) { if (stars > 0 && !(tb.shield > now)) { loot = stealFrom(tb, stars, pct); tb.shield = now + SHIELD_H[stars] * 3600e3; } tb.lock = 0; }
    const a = { id: crypto.randomBytes(6).toString('hex'), attacker: me, target, stars, pct, loot, t: now };
    db.attacks.push(a);
    if (db.attacks.length > MAX_ATTACKS) db.attacks.splice(0, db.attacks.length - MAX_ATTACKS);
    dirty = true; return send(res, 200, { ok: true, loot, shield: tb ? tb.shield : 0 });
  }
  return send(res, 404, { error: 'inconnu' });
}

// ---------- WebSocket (aucune dépendance) et salons de raid partagé ----------
const WS_MAX = 512 * 1024;
const RELAY = new Set(['u', 'w', 'wi', 'hits', 'kill', 'tile', 'it', 'pick', 'got', 'crate', 'pyl', 'pulse', 'drop', 'note', 'need']);
const rooms = new Map(); let roomSeq = 1;
const conns = new Set();
class Conn {
  constructor(sock) {
    this.s = sock; this.buf = null; this.frag = null; this.last = Date.now(); this.pid = null; this.name = ''; this.room = null; this.sub = false; this.open = true;
    sock.on('data', d => { try { this.onData(d); } catch (e) { this.close(); } });
    sock.on('close', () => this.onClose()); sock.on('error', () => this.onClose());
    conns.add(this);
  }
  onData(d) {
    this.last = Date.now();
    this.buf = this.buf ? Buffer.concat([this.buf, d]) : d;
    while (this.buf && this.buf.length >= 2) {
      const B = this.buf, fin = B[0] & 0x80, op = B[0] & 0x0f; let len = B[1] & 0x7f, off = 2;
      if (!(B[1] & 0x80)) return this.close();
      if (len === 126) { if (B.length < 4) return; len = B.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (B.length < 10) return; if (B.readUInt32BE(2)) return this.close(); len = B.readUInt32BE(6); off = 10; }
      if (len > WS_MAX) return this.close();
      if (B.length < off + 4 + len) return;
      const m0 = B[off], m1 = B[off + 1], m2 = B[off + 2], m3 = B[off + 3]; off += 4;
      const pl = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) pl[i] = B[off + i] ^ (i & 3 ? i & 2 ? i & 1 ? m3 : m2 : m1 : m0);
      this.buf = B.length > off + len ? B.subarray(off + len) : null;
      if (op === 8) return this.close();
      if (op === 9) { this.raw(0x8a, pl); continue; }
      if (op === 10) continue;
      if (op === 1 || op === 2) { if (fin) this.onText(pl); else this.frag = [pl]; continue; }
      if (op === 0 && this.frag) { this.frag.push(pl); if (fin) { const all = Buffer.concat(this.frag); this.frag = null; if (all.length <= WS_MAX) this.onText(all); } continue; }
    }
  }
  raw(b0, pl) {
    if (!this.open) return;
    const n = pl.length, h = n < 126 ? Buffer.from([b0, n]) : n < 65536 ? Buffer.from([b0, 126, n >> 8, n & 255]) : Buffer.concat([Buffer.from([b0, 127, 0, 0, 0, 0]), (() => { const x = Buffer.alloc(4); x.writeUInt32BE(n); return x; })()]);
    this.s.write(Buffer.concat([h, pl]));
  }
  send(obj, droppable) { if (!this.open) return; if (droppable && this.s.writableLength > 1.5e6) return; this.raw(0x81, Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))); }
  close() { if (!this.open) return; try { this.raw(0x88, Buffer.alloc(0)); } catch (e) { } this.open = false; try { this.s.end(); setTimeout(() => this.s.destroy(), 1000).unref(); } catch (e) { } this.onClose(); }
  onClose() { if (this.closed) return; this.closed = true; this.open = false; conns.delete(this); leaveRoom(this, 'gone'); }
  onText(buf) {
    let m; try { m = JSON.parse(buf.toString('utf8')); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'auth') {
      const pl = authToken(m.token); if (!pl) return this.send({ t: 'err', e: 'Session expirée : reconnectez-vous.' });
      for (const c of conns) if (c !== this && c.pid === pl._id) c.close(); // une seule connexion en direct par compte
      this.pid = pl._id; this.name = pl.name || 'Pilote'; return this.send({ t: 'hi', pid: this.pid, name: this.name });
    }
    if (!this.pid) return this.send({ t: 'err', e: 'Connectez-vous d\'abord.' });
    const R = this.room ? rooms.get(this.room) : null;
    switch (m.t) {
      case 'sub': this.sub = !!m.on; if (this.sub) this.send({ t: 'rooms', list: roomList() }); return;
      case 'create': {
        if (R) leaveRoom(this, 'left');
        const id = String(roomSeq++);
        const room = { id, label: String(m.label || '').replace(/[<>]/g, '').slice(0, 40), mode: m.mode === 'pvp' ? 'pvp' : 'coop', region: int(m.region, 0, 3), diff: int(m.diff, 0, 5), max: int(m.max, 2, 4), host: this.pid, members: new Map(), started: false, seed: 0, t: Date.now(), chat: [] };
        rooms.set(id, room); joinRoom(this, room, m.power); return;
      }
      case 'join': { const room = rooms.get(String(m.id)); if (!room) return this.send({ t: 'err', e: 'Ce salon n\'existe plus.' }); if (R && R !== room) leaveRoom(this, 'left'); if (room.members.size >= room.max && !room.members.has(this.pid)) return this.send({ t: 'err', e: 'Salon complet.' }); joinRoom(this, room, m.power); return; }
      case 'leave': leaveRoom(this, 'left'); return;
      case 'power': if (R && R.members.has(this.pid)) { R.members.get(this.pid).power = int(m.power, 0, 999); roomUpdate(R); } return;
      case 'chat': if (R) { const line = { from: this.name, text: String(m.text || '').slice(0, 140), t: Date.now() }; R.chat.push(line); if (R.chat.length > 30) R.chat.shift(); for (const mm of R.members.values()) mm.c.send({ t: 'chat', line }); } return;
      case 'start': {
        if (!R || R.host !== this.pid || R.started) return;
        R.started = true; R.seed = 1 + Math.floor(Math.random() * 2e9); R.t0 = Date.now();
        for (const mm of R.members.values()) mm.c.send({ t: 'start', room: roomInfo(R), seed: R.seed });
        broadcastRooms(); return;
      }
      case 'done': if (R && R.members.has(this.pid)) { R.members.get(this.pid).done = true; afterChange(R, this.pid, 'done'); } return;
      default:
        if (!R || !RELAY.has(m.t) || !R.started) return;
        m.from = this.pid; const s = JSON.stringify(m), drop = m.t === 'u' || m.t === 'w';
        if (m.to) { const tm = R.members.get(String(m.to)); if (tm) tm.c.send(s, drop); }
        else for (const [pid, mm] of R.members) if (pid !== this.pid && !mm.done) mm.c.send(s, drop);
    }
  }
}
function roomInfo(R) { return { id: R.id, label: R.label, mode: R.mode, region: R.region, diff: R.diff, max: R.max, host: R.host, started: R.started, t0: R.t0 || 0, members: [...R.members.entries()].map(([pid, m]) => ({ pid, name: m.c.name, slot: m.slot, power: m.power || 0, done: !!m.done })) }; }
function roomList() { return [...rooms.values()].filter(R => R.members.size).map(roomInfo); }
function broadcastRooms() { const s = JSON.stringify({ t: 'rooms', list: roomList() }); for (const c of conns) if (c.sub && c.pid) c.send(s); }
function roomUpdate(R) { const s = JSON.stringify({ t: 'room', room: roomInfo(R) }); for (const m of R.members.values()) m.c.send(s); broadcastRooms(); }
function joinRoom(c, R, power) {
  if (!R.members.has(c.pid)) {
    const used = new Set([...R.members.values()].map(m => m.slot)); let slot = 0; while (used.has(slot)) slot++;
    R.members.set(c.pid, { c, slot, power: int(power, 0, 999), done: false });
  } else R.members.get(c.pid).c = c;
  c.room = R.id;
  c.send({ t: 'joined', room: roomInfo(R), chat: R.chat });
  if (R.started) { // arrivée en cours de raid : l'hôte envoie l'état du monde
    c.send({ t: 'start', room: roomInfo(R), seed: R.seed, late: true });
    const H = R.members.get(R.host); if (H) H.c.send({ t: 'late', pid: c.pid });
  }
  roomUpdate(R);
}
function leaveRoom(c, why) {
  const R = c.room ? rooms.get(c.room) : null; c.room = null; if (!R) return;
  if (R.members.get(c.pid) && R.members.get(c.pid).c === c) { R.members.delete(c.pid); afterChange(R, c.pid, why); }
}
function afterChange(R, pid, why) {
  for (const m of R.members.values()) m.c.send({ t: 'peer', pid, why });
  const active = [...R.members.entries()].filter(([, m]) => !m.done);
  if (!active.length) { rooms.delete(R.id); broadcastRooms(); return; }
  if (R.host === pid || !R.members.has(R.host) || R.members.get(R.host).done) {
    active.sort((a, b) => a[1].slot - b[1].slot); R.host = active[0][0];
    for (const m of R.members.values()) m.c.send({ t: 'host', pid: R.host });
  }
  if (!R.members.size) rooms.delete(R.id);
  roomUpdate(R);
}
setInterval(() => {
  const now = Date.now();
  for (const c of conns) { if (now - c.last > 60000) c.close(); else if (now - c.last > 20000) c.raw(0x89, Buffer.alloc(0)); }
  for (const [id, R] of rooms) if (!R.members.size || (R.started && now - R.t0 > 6 * 3600e3)) rooms.delete(id);
}, 15000).unref();

// ---------- fichiers du jeu ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.css': 'text/css' };
const ALLOWED = new Set(['index.html', 'manifest.webmanifest', 'sw.js']);
function staticRoute(req, res, url) {
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const ic = rel.match(/(?:^|\/)(icons\/[\w.-]+)$/); rel = ic ? ic[1] : rel.split('/').pop() || 'index.html';
  const ok = ALLOWED.has(rel) || /^icons\/[\w.-]+\.(png|svg|ico)$/.test(rel);
  if (!ok) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Introuvable'); }
  const file = path.join(ROOT, rel);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Introuvable'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': rel === 'sw.js' ? 'no-cache' : 'public, max-age=300' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return send(res, 204, {});
    // une adresse saisie avec un chemin en trop (/colosse/api/…, /index.html/api/…) reste comprise
    const ai = url.pathname.indexOf('/api/'); if (ai > 0) url.pathname = url.pathname.slice(ai);
    if (url.pathname.startsWith('/api/')) return await apiRoute(req, res, url);
    if (req.method === 'GET' || req.method === 'HEAD') return staticRoute(req, res, url);
    send(res, 405, { error: 'méthode refusée' });
  } catch (e) { send(res, 400, { error: e.message || 'erreur' }); }
});
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || !/(^|\/)ws\/?$/.test((req.url || '').split('?')[0]) || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  socket.setNoDelay(true); socket.setTimeout(0);
  new Conn(socket);
});
function announce() {
  const addrs = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (!a.internal) addrs.push(a.family === 'IPv6' || a.family === 6 ? `http://[${a.address.split('%')[0]}]:${PORT}` : `http://${a.address}:${PORT}`);
  console.log(`\n  ${NAME} · version ${VERSION}`);
  console.log(`  Données : ${DATA}`);
  console.log(`  Sauvegardes des joueurs : ${SAVES}`);
  console.log(`  Local    : http://localhost:${PORT}`);
  for (const a of addrs) console.log(`  Réseau   : ${a}`);
  console.log('\n  Donnez une de ces adresses aux joueurs (Compte → Serveur), ou ouvrez-la dans un navigateur.\n');
}
server.once('listening', announce);
server.on('error', e => {
  if (HOST === '::' && (e.code === 'EAFNOSUPPORT' || e.code === 'EADDRNOTAVAIL')) { console.log('IPv6 indisponible sur cette machine : écoute en IPv4 seulement.'); server.listen(PORT, '0.0.0.0'); }
  else { console.error(e.code === 'EADDRINUSE' ? `Le port ${PORT} est déjà utilisé : lancez avec PORT=8788 par exemple.` : e.message); process.exit(1); }
});
server.listen({ port: PORT, host: HOST, ipv6Only: false });
