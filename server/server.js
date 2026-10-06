#!/usr/bin/env node
'use strict';
/*
 * Serveur COLOSSE — aucune dépendance, Node.js 18 ou plus.
 *   node server/server.js
 * Variables d'environnement facultatives :
 *   PORT=8787        port d'écoute
 *   HOST=::          adresse d'écoute ("::" = IPv6 + IPv4 sur la plupart des systèmes)
 *   NAME="Colosse"   nom affiché aux joueurs
 *   DATA=chemin.json fichier de sauvegarde des données
 * Le serveur sert aussi le jeu (index.html) : ouvrez http://adresse:8787 dans un navigateur.
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
const VERSION = '1.0.0';
const MAX_BODY = 300 * 1024;
const MAX_PLAYERS = 5000;
const MAX_ATTACKS = 20000;

// ---------- données ----------
let db = { players: {}, bases: {}, attacks: [] };
try { if (fs.existsSync(DATA)) db = Object.assign(db, JSON.parse(fs.readFileSync(DATA, 'utf8'))); } catch (e) { console.error('Données illisibles, nouveau fichier :', e.message); }
let dirty = false;
function persist() {
  if (!dirty) return; dirty = false;
  const tmp = DATA + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), err => { if (err) return console.error('Écriture impossible :', err.message); fs.rename(tmp, DATA, e2 => { if (e2) console.error(e2.message); }); });
}
setInterval(persist, 5000).unref();
process.on('SIGINT', () => { dirty = true; try { fs.writeFileSync(DATA, JSON.stringify(db)); } catch (e) { } process.exit(0); });
process.on('SIGTERM', () => { dirty = true; try { fs.writeFileSync(DATA, JSON.stringify(db)); } catch (e) { } process.exit(0); });

// ---------- outils ----------
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const int = (v, a, b) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a; };
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 20) || 'Pilote';
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('requête trop grande')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('JSON invalide')); } });
    req.on('error', reject);
  });
}
function auth(b) { const p = db.players[String(b.id || '')]; return p && p.tok === sha(b.token || '') ? p : null; }
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h); return h.n > 120;
}
setInterval(() => { const now = Date.now(); for (const [k, h] of hits) if (now - h.t > 120000) hits.delete(k); }, 60000).unref();

// ---------- API ----------
async function apiRoute(req, res, url) {
  const ip = req.socket.remoteAddress || '?';
  if (limited(ip)) return send(res, 429, { error: 'trop de requêtes, patientez une minute' });
  const p = url.pathname;
  if (req.method === 'GET' && p === '/api/info') return send(res, 200, { name: NAME, version: VERSION, players: Object.keys(db.players).length });
  if (req.method === 'GET' && p === '/api/scores') {
    const list = Object.entries(db.players).filter(([, x]) => x.score !== undefined).map(([id, x]) => ({ id, name: x.name, score: x.score, extract: x.extract, kills: x.kills, boss: x.boss, defenses: x.defenses, assaults: x.assaults, hq: x.hq, region: x.region, t: x.t }))
      .sort((a, b) => b.score - a.score).slice(0, 50);
    return send(res, 200, { list });
  }
  if (req.method === 'GET' && p === '/api/bases') {
    const list = Object.entries(db.bases).map(([id, x]) => ({ id, name: (db.players[id] || {}).name || 'Pilote', b: x.b, hq: x.hq, def: x.def, t: x.t })).sort((a, b) => b.t - a.t).slice(0, 80);
    return send(res, 200, { list });
  }
  if (req.method === 'GET' && p === '/api/attacks') {
    const target = String(url.searchParams.get('target') || '');
    const list = db.attacks.filter(a => a.target === target).slice(-40).map(a => Object.assign({}, a, { attackerName: (db.players[a.attacker] || {}).name || 'Pilote' }));
    return send(res, 200, { list });
  }
  if (req.method !== 'POST') return send(res, 404, { error: 'inconnu' });
  const b = await readBody(req);
  if (p === '/api/register') {
    if (Object.keys(db.players).length >= MAX_PLAYERS) return send(res, 503, { error: 'serveur complet' });
    const id = crypto.randomBytes(8).toString('hex'), token = crypto.randomBytes(24).toString('hex');
    db.players[id] = { tok: sha(token), name: cleanName(b.name), created: Date.now(), t: Date.now() }; dirty = true;
    return send(res, 200, { id, token });
  }
  const pl = auth(b); if (!pl) return send(res, 403, { error: 'identifiant invalide' });
  if (p === '/api/score') {
    Object.assign(pl, { name: cleanName(b.name || pl.name), score: int(b.score, 0, 1e9), extract: int(b.extract, 0, 1e7), kills: int(b.kills, 0, 1e9), boss: int(b.boss, 0, 1e6), defenses: int(b.defenses, 0, 1e6), assaults: int(b.assaults, 0, 1e6), hq: int(b.hq, 1, 5), region: int(b.region, 1, 4), t: Date.now() });
    dirty = true; return send(res, 200, { ok: true });
  }
  if (p === '/api/base') {
    if (!Array.isArray(b.b) || b.b.length > 400) return send(res, 400, { error: 'base invalide' });
    const list = b.b.filter(a => Array.isArray(a) && a.length === 4).map(a => [int(a[0], 0, 63), int(a[1], 0, 299), int(a[2], 0, 299), int(a[3], 1, 5)]);
    db.bases[b.id] = { b: list, hq: int(b.hq, 1, 5), def: int(b.def, 0, 400), t: Date.now() }; dirty = true;
    return send(res, 200, { ok: true });
  }
  if (p === '/api/attack') {
    const target = String(b.target || ''); if (!db.players[target] || target === b.id) return send(res, 400, { error: 'cible invalide' });
    const recent = db.attacks.find(a => a.attacker === b.id && a.target === target && Date.now() - a.t < 25 * 60000);
    if (recent) return send(res, 429, { error: 'cette base a déjà été attaquée récemment' });
    db.attacks.push({ attacker: b.id, target, stars: int(b.stars, 0, 3), pct: int(b.pct, 0, 100), t: Date.now() });
    if (db.attacks.length > MAX_ATTACKS) db.attacks.splice(0, db.attacks.length - MAX_ATTACKS);
    dirty = true; return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'inconnu' });
}

// ---------- fichiers du jeu ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.css': 'text/css' };
const ALLOWED = new Set(['index.html', 'manifest.webmanifest', 'sw.js']);
function staticRoute(req, res, url) {
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
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
    if (url.pathname.startsWith('/api/')) return await apiRoute(req, res, url);
    if (req.method === 'GET' || req.method === 'HEAD') return staticRoute(req, res, url);
    send(res, 405, { error: 'méthode refusée' });
  } catch (e) { send(res, 400, { error: e.message || 'erreur' }); }
});
function announce() {
  const addrs = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (!a.internal) addrs.push(a.family === 'IPv6' || a.family === 6 ? `http://[${a.address.split('%')[0]}]:${PORT}` : `http://${a.address}:${PORT}`);
  console.log(`\n  ${NAME} · version ${VERSION}`);
  console.log(`  Données : ${DATA}`);
  console.log(`  Local    : http://localhost:${PORT}`);
  for (const a of addrs) console.log(`  Réseau   : ${a}`);
  console.log('\n  Donnez une de ces adresses aux joueurs (Réglages → En ligne), ou ouvrez-la dans un navigateur.\n');
}
server.once('listening', announce);
server.on('error', e => {
  if (HOST === '::' && (e.code === 'EAFNOSUPPORT' || e.code === 'EADDRNOTAVAIL')) { console.log('IPv6 indisponible sur cette machine : écoute en IPv4 seulement.'); server.listen(PORT, '0.0.0.0'); }
  else { console.error(e.code === 'EADDRINUSE' ? `Le port ${PORT} est déjà utilisé : lancez avec PORT=8788 par exemple.` : e.message); process.exit(1); }
});
server.listen({ port: PORT, host: HOST, ipv6Only: false });
