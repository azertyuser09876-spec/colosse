// En ligne : comptes, sauvegarde du compte, classement, bases publiées, pillages.

// ================= EN LIGNE : comptes, sauvegarde du compte, classement, bases, pillages =================
// Deux modes : un serveur Colosse autonome (comptes identifiant + mot de passe, raids partagés en direct)
// ou la base partagée de claude.ai (la partie suit le compte claude.ai).
const NET = { ok: false, kind: null, me: null, token: null, srv: '', names: {}, board: [], bases: [], inbox: [], sent: [], lastScore: '', lastBase: '', status: 'Hors ligne', shield: 0, info: null };
const inGame = () => state === 'raid' || state === 'base' || state === 'assault';
function netScore() {
  const s = save.stats, cd = save.cdone.reduce((a, b) => a + b, 0);
  return Math.round(s.extract * 10 + s.kills * .2 + s.boss * 50 + cd * 15 + (s.defenses || 0) * 20 + (s.assaults || 0) * 12 + (s.coop || 0) * 8 + (s.pvpKills || 0) * 6 + hqLevel() * 25 + Object.keys(save.research).length * 2);
}
function pseudo() {
  if (ACC.mode === 'server' && ACC.name) return ACC.name;
  if (!settings.pseudo) { settings.pseudo = 'Pilote-' + rndi(1000, 9999); saveSettings(); }
  return String(settings.pseudo).replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 20) || 'Pilote';
}
// adresse du serveur : on retire une page (index.html), /api/… et les barres finales collées par erreur
function normSrv(s) {
  s = String(s || '').trim(); if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
  try {
    const u = new URL(s), p = u.pathname.replace(/\/[^/]*\.html?$/i, '').replace(/\/api(\/.*)?$/i, '').replace(/\/+$/, '');
    return u.origin + p;
  } catch (e) { return s.replace(/[?#].*$/, '').replace(/\/+$/, ''); }
}
// la page vient-elle d'un serveur Colosse ? (pas d'une page statique comme GitHub Pages)
let ORIGIN_SRV = '';
async function probeOrigin() {
  if (!window.COLOSSE_STANDALONE || !/^https?:$/.test(location.protocol)) return;
  try { const i = await apiAt(location.origin, '/api/info'); if (i && i.version) ORIGIN_SRV = location.origin; } catch (e) { }
}
function srvUrl() {
  if (ACC.mode === 'server' && ACC.srv) return ACC.srv;
  return normSrv(String(settings.server || '').trim() || ORIGIN_SRV);
}
const httpsPage = () => location.protocol === 'https:';
// cherche le serveur Colosse à l'adresse donnée, puis à la racine du site
async function findServer(srv) {
  const tries = [srv]; try { const o = new URL(srv).origin; if (o !== srv) tries.push(o); } catch (e) { }
  let status = 0;
  for (const s of tries) {
    try { const info = await apiAt(s, '/api/info'); if (info && info.version !== undefined) return { srv: s, info }; }
    catch (e) { if (!e.status) throw e; if (e.status >= 400) status = e.status; }
  }
  const here = (() => { try { return new URL(srv).origin === location.origin; } catch (e) { return false; } })();
  if (here) throw new Error('cette page n\'est pas un serveur Colosse' + (status ? ' (erreur ' + status + ')' : '') + ' : entrez l\'adresse de votre serveur, celle qu\'affiche sa fenêtre au démarrage');
  throw new Error('aucun serveur Colosse à l\'adresse ' + srv + (status ? ' (erreur ' + status + ')' : '') + '. Vérifiez l\'adresse et le port, par exemple http://192.168.1.20:8787, comme l\'affiche la fenêtre du serveur');
}
async function apiAt(srv, path, body) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(srv + path, body ? { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), signal: ctl.signal } : { signal: ctl.signal });
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok || j.error) { const e = new Error(j.error || ('HTTP ' + r.status)); e.status = r.status; e.body = j; throw e; }
    return j;
  } catch (e) {
    if (e.name === 'AbortError') { const e2 = new Error('le serveur ne répond pas'); e2.status = 0; throw e2; }
    if (e.status === undefined) { const e2 = new Error(location.protocol === 'https:' && /^http:/.test(srv) ? 'cette page est en https et le navigateur y bloque un serveur en http : ouvrez plutôt l\'adresse du serveur dans le navigateur (' + srv + '), ou jouez avec le .exe ou l\'.apk' : 'serveur injoignable à l\'adresse ' + srv + ' : vérifiez qu\'il est lancé, l\'adresse et le port, et que le pare-feu le laisse passer'); e2.status = 0; throw e2; }
    throw e;
  } finally { clearTimeout(to); }
}
const api = (path, body) => apiAt(NET.srv, path, body);
let netPollT = null;
async function netInit() {
  Object.assign(NET, { ok: false, kind: null, board: [], bases: [], inbox: [], sent: [], lastScore: '', lastBase: '', shield: 0 });
  clearInterval(netPollT);
  if (typeof LIVE !== 'undefined') LIVE.disconnect();
  if (ACC.mode === 'server' && ACC.token) {
    const srv = NET.srv = ACC.srv; NET.status = 'Connexion à ' + srv + '…'; netRefreshUI();
    try {
      const info = await api('/api/info'), me = await api('/api/account/me', { token: ACC.token });
      if (me.name && me.name !== ACC.name) { ACC.name = me.name; accStore(); }
      Object.assign(NET, { ok: true, kind: 'http', me: me.id, token: ACC.token, info, status: 'En ligne · ' + (info.name || srv) + ' · ' + (info.players || 0) + ' pilotes' });
      await cloudPull();
      await netPoll(); netPublish();
      if (typeof LIVE !== 'undefined' && info.ws) LIVE.connect();
      netPollT = setInterval(() => { if (state === 'base' || state === 'title' || drawerOpen) netPoll(); }, 25000);
    } catch (e) {
      if (e.status === 403) accExpired();
      else NET.status = e.message.charAt(0).toUpperCase() + e.message.slice(1) + '. La partie continue sur cet appareil.';
    }
    netRefreshUI(); refreshAccountUI(); return;
  }
  if (window.claude && typeof window.claude.use === 'function') {
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) { NET.status = 'Fonctions en ligne indisponibles pour ce compte.'; return; }
      const me = await user.id(); if (!me) { NET.status = 'Connectez-vous à claude.ai pour jouer en ligne.'; return; }
      Object.assign(NET, { db, user, me, ok: true, kind: 'claude', status: 'En ligne (claude.ai) · la partie suit votre compte claude.ai' });
      await cloudPull();
      db.collection('scores').orderBy('score', 'desc').limit(50).onSnapshot(sn => { NET.board = sn.docs.map(d => Object.assign({ id: d.id }, d.data())); claudeNames(); netRefreshUI(); }, () => { });
      db.collection('bases').orderBy('t', 'desc').limit(80).onSnapshot(sn => { NET.bases = sn.docs.map(d => { const o = Object.assign({ id: d.id }, d.data()); o.avail = stealCalc(o, 3, 100); return o; }); claudeNames(); netRefreshUI(); }, () => { });
      db.collection('attacks').where('target', '==', me).limit(60).onSnapshot(sn => { NET.inbox = sn.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => b.t - a.t); claudeNames(); applyThefts(NET.inbox); netNotifyInbox(); netRefreshUI(); }, () => { });
      db.collection('attacks').where('attacker', '==', me).limit(40).onSnapshot(sn => { NET.sent = sn.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => b.t - a.t); netRefreshUI(); }, () => { });
      netPublish();
    } catch (e) { NET.ok = false; NET.status = 'Fonctions en ligne indisponibles.'; }
    refreshAccountUI(); return;
  }
  const s = srvUrl();
  NET.status = s ? 'Serveur ' + s + ' : connectez-vous ou créez un compte pour jouer en ligne.' : 'Invité, hors ligne. Lancez un serveur Colosse puis créez un compte (bouton Compte).';
  refreshAccountUI();
}
async function netPoll() {
  if (NET.kind !== 'http') return;
  try {
    const [sc, bs, at] = await Promise.all([api('/api/scores'), api('/api/bases'), api('/api/attacks?target=' + encodeURIComponent(NET.me))]);
    NET.board = sc.list || []; NET.bases = bs.list || [];
    const all = (at.list || []).sort((a, b) => b.t - a.t);
    NET.inbox = all.filter(a => a.target === NET.me); NET.sent = all.filter(a => a.attacker === NET.me);
    for (const x of NET.board.concat(NET.bases)) if (x.name) NET.names[x.id] = x.name;
    for (const a of all) { if (a.attackerName) NET.names[a.attacker] = a.attackerName; if (a.targetName) NET.names[a.target] = a.targetName; }
    const mine = NET.bases.find(b => b.id === NET.me); NET.shield = mine ? mine.shield || 0 : 0;
    applyThefts(NET.inbox); netNotifyInbox(); netRefreshUI();
  } catch (e) { if (e.status === 403) accExpired(); }
}
async function claudeNames() {
  if (!NET.user) return;
  const ids = new Set(); NET.board.forEach(x => ids.add(x.id)); NET.bases.forEach(x => ids.add(x.id)); NET.inbox.forEach(x => ids.add(x.attacker)); NET.sent.forEach(x => ids.add(x.target));
  try { const ps = await NET.user.profiles([...ids]); for (const id in ps) NET.names[id] = (ps[id] && ps[id].name) || ''; netRefreshUI(); } catch (e) { }
}
let lastInboxNote = 0;
function netNotifyInbox() {
  const seen = +(localStorage.getItem('colosse_seen_atk') || 0), fresh = NET.inbox.filter(a => a.t > seen);
  if (fresh.length && state === 'base' && Date.now() - lastInboxNote > 60000) { lastInboxNote = Date.now(); msg(fresh.length + ' attaque' + (fresh.length > 1 ? 's' : '') + ' de joueurs sur votre base. Voir l\'onglet En ligne.', COL.rival, 7); }
}
const netName = id => id === NET.me ? 'Vous' : (NET.names[id] || 'Pilote ' + String(id).slice(-4));
function netRefreshUI() { if (drawerOpen && hubTab === 'online') renderHub(); const st = $('#netStatus'); if (st) st.textContent = NET.status; }
let netBusy = false;
const STEAL_KEYS = ['scrap', 'alloy', 'circuits', 'crystals', 'data'];
const STEAL_BASE = { scrap: 150, alloy: 40, circuits: 30, crystals: 25, data: 10 };
// même règle que le serveur : part protégée par le QG et l'entrepôt, taux selon les étoiles et la destruction
function stealCalc(base, stars, pct) {
  const res = base.res || {}, hq = base.hq || 1, wh = base.wh || 0, loot = {}, rate = [0, .1, .18, .25][stars] * (.4 + .6 * pct / 100);
  for (const k of STEAL_KEYS) { const have = Math.max(0, res[k] || 0), prot = Math.max(STEAL_BASE[k] * (1 + .5 * hq), have * Math.min(.7, .15 + .1 * wh)); const n = Math.min(5000, Math.floor(Math.max(0, have - prot) * rate)); if (n > 0) loot[k] = n; }
  return loot;
}
const hm = s => { s = Math.max(60, Math.round(s)); const h = Math.floor(s / 3600), m = Math.ceil((s % 3600) / 60); return h ? h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : '') : m + ' min'; };
const protectPct = () => Math.round(Math.min(.7, .15 + .1 * bLevel('warehouse')) * 100);
const SHIELD_H = [0, 1, 2, 4];
function claudeShield(list) { let s = 0; for (const a of list) if (a.stars > 0) s = Math.max(s, a.t + SHIELD_H[a.stars] * 3600e3); return s > Date.now() ? s : 0; }
// pillages subis : appliqués une seule fois, la date du dernier est gardée dans la sauvegarde (donc sur tous les appareils)
function applyThefts(list) {
  if (TUT.on || !NET.me || state === 'raid' || state === 'assault') return;
  const t0 = save.theftT || 0, tot = {}, who = new Set(); let n = 0, last = t0;
  for (const a of list) {
    if (a.target !== NET.me || !a.loot || !(a.t > t0)) continue;
    for (const k in a.loot) { if (!STEAL_KEYS.includes(k)) continue; const v = Math.min(save.res[k] || 0, Math.max(0, a.loot[k] | 0)); save.res[k] -= v; tot[k] = (tot[k] || 0) + v; }
    last = Math.max(last, a.t); who.add(netName(a.attacker)); n++;
  }
  if (!n) return;
  save.theftT = last; writeSave();
  const txt = Object.keys(tot).filter(k => tot[k]).map(k => '−' + fmt(tot[k]) + ' ' + RES[k].n.toLowerCase()).join(', ');
  const line = [...who].join(', ') + (n > 1 ? ' ont' : ' a') + ' pillé votre base' + (txt ? ' : ' + txt : ' sans rien emporter') + '.';
  if (state === 'base') msg(line, COL.rival, 9); else toast(line);
}
async function netPublish() {
  if (!NET.ok || netBusy || TUT.on) return; netBusy = true;
  try {
    const sc = { score: netScore(), extract: save.stats.extract, kills: save.stats.kills, boss: save.stats.boss, defenses: save.stats.defenses || 0, assaults: save.stats.assaults || 0, hq: hqLevel(), region: REGIONS.filter((_, i) => regionUnlocked(i)).length };
    const b = save.base.b.filter(x => x.lvl > 0).map(x => [BUILD_KEYS.indexOf(x.type), x.tx, x.ty, x.lvl]);
    const res = {}; for (const k of STEAL_KEYS) res[k] = Math.floor(save.res[k] || 0);
    const bd = { b, hq: hqLevel(), def: save.base.b.filter(x => BUILD[x.type].def && x.lvl > 0).length, wh: bLevel('warehouse'), res };
    const k1 = JSON.stringify(sc) + pseudo(), k2 = JSON.stringify(bd);
    if (NET.kind === 'http') {
      if (k1 !== NET.lastScore) { await api('/api/score', Object.assign({ token: NET.token, name: pseudo() }, sc)); NET.lastScore = k1; }
      if (k2 !== NET.lastBase) { const r = await api('/api/base', Object.assign({ token: NET.token }, bd)); NET.lastBase = k2; NET.shield = r.shield || 0; }
    } else if (NET.kind === 'claude') {
      if (k1 !== NET.lastScore) { await NET.db.doc('scores/' + NET.me).set(Object.assign({ t: Date.now() }, sc)); NET.lastScore = k1; }
      if (k2 !== NET.lastBase) { await NET.db.doc('bases/' + NET.me).set(Object.assign({ t: Date.now() }, bd)); NET.lastBase = k2; }
    }
  } catch (e) { if (e.status === 403) accExpired(); }
  netBusy = false;
}
// fin d'assaut : le serveur calcule le butin réellement volé et pose le bouclier du défenseur
async function netAttack(target, stars, pct) {
  if (!NET.ok) return {};
  try {
    if (NET.kind === 'http') { const r = await api('/api/attack', { token: NET.token, target, stars, pct }); netPublish(); return r.loot || {}; }
    if (NET.kind === 'claude') {
      const tb = NET.bases.find(b => b.id === target), prev = (await NET.db.collection('attacks').where('target', '==', target).limit(60).get()).docs.map(d => d.data());
      const loot = tb && stars > 0 && !claudeShield(prev) ? stealCalc(tb, stars, pct) : {};
      await NET.db.doc('attacks/' + NET.me + '_' + Date.now()).set({ target, attacker: NET.me, stars, pct, loot, t: Date.now() });
      netPublish(); return loot;
    }
  } catch (e) { toast('Butin non transmis : ' + e.message); }
  return {};
}

// ---------- sauvegarde du compte (serveur Colosse ou claude.ai) ----------
const CLOUD = { t: null, busy: false, dirty: false, last: 0, pending: null, state: '' };
const cloudOn = () => !TUT.on && ((ACC.mode === 'server' && !!ACC.token && NET.kind === 'http' && NET.ok) || (NET.kind === 'claude' && NET.ok));
function cloudDirty() {
  if (!cloudOn()) return;
  CLOUD.dirty = true; if (CLOUD.t) return;
  const gap = NET.kind === 'claude' ? 45000 : 12000;
  CLOUD.t = setTimeout(() => { CLOUD.t = null; cloudPush(); }, Math.max(2500, gap - (Date.now() - CLOUD.last)));
}
async function cloudPush(force) {
  if (!cloudOn()) return;
  if (CLOUD.busy) { setTimeout(() => cloudPush(force), 3000); return; }
  clearTimeout(CLOUD.t); CLOUD.t = null;
  CLOUD.busy = true; CLOUD.dirty = false; CLOUD.last = Date.now();
  const data = JSON.stringify(save);
  try {
    if (NET.kind === 'http') { const r = await api('/api/save/put', { token: ACC.token, rev: ACC.rev || 0, data, force: !!force }); ACC.rev = r.rev; accStore(); }
    else await NET.db.doc('data/users/' + NET.me + '/save').set({ json: data, ut: save.ut || Date.now() });
    CLOUD.state = 'Sauvegarde du compte à jour (' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ').';
  } catch (e) {
    if (e.status === 409) { CLOUD.busy = false; await cloudResolve(); return; }
    if (e.status === 403) accExpired();
    else { CLOUD.dirty = true; CLOUD.state = 'Sauvegarde du compte en attente : ' + e.message + '.'; clearTimeout(CLOUD.t); CLOUD.t = setTimeout(() => { CLOUD.t = null; cloudPush(); }, 30000); }
  }
  CLOUD.busy = false;
}
async function cloudFetch() {
  if (NET.kind === 'http') { const r = await api('/api/save/get', { token: ACC.token }); return { rev: r.rev || 0, o: r.data ? parseSave(r.data) : null }; }
  const d = await NET.db.doc('data/users/' + NET.me + '/save').get();
  return { rev: 0, o: d.exists ? parseSave(d.data().json) : null };
}
// au démarrage ou à la connexion : la partie la plus récente gagne
async function cloudPull() {
  try {
    const { rev, o } = await cloudFetch();
    if (!o) { cloudPush(true); return; }
    if ((o.ut || 0) > (save.ut || 0)) { ACC.rev = rev; accStore(); adoptSave(o, 'Partie la plus récente du compte chargée.'); }
    else if ((o.ut || 0) < (save.ut || 0)) { ACC.rev = rev; cloudPush(true); }
    else { ACC.rev = rev; accStore(); }
  } catch (e) { if (e.status === 403) accExpired(); }
}
// un autre appareil a enregistré entre-temps : on garde la partie la plus récente
async function cloudResolve() {
  try {
    const { rev, o } = await cloudFetch(); ACC.rev = rev; accStore();
    if (o && (o.ut || 0) > (save.ut || 0)) adoptSave(o, 'Partie plus récente reçue d\'un autre appareil.');
    else cloudPush(true);
  } catch (e) { }
}
function adoptSave(o, why) {
  if (TUT.on) { TUT.prev = o; try { localStorage.setItem(accountKey(ACC), JSON.stringify(o)); } catch (e) { } return; } // la vraie partie, mise à jour pendant le tutoriel
  if (state === 'raid' || state === 'assault') { CLOUD.pending = { o, why }; return; } // appliquée au retour à la base
  save = o; try { localStorage.setItem(accountKey(ACC), JSON.stringify(save)); } catch (e) { }
  if (state === 'base') enterBase(); else if (state === 'result') { } else refreshTitle();
  if (why) toast(why);
}
function applyPendingSave() { if (!TUT.on && CLOUD.pending && state !== 'raid' && state !== 'assault') { const p = CLOUD.pending; CLOUD.pending = null; save = p.o; try { localStorage.setItem(accountKey(ACC), JSON.stringify(save)); } catch (e) { } if (p.why) toast(p.why); } }

// ---------- compte : connexion, création, déconnexion ----------
function accExpired() {
  if (ACC.mode !== 'server') return;
  ACC.token = null; accStore(); NET.ok = false; NET.kind = null;
  NET.status = 'Session expirée : reconnectez-vous (bouton Compte). La partie continue sur cet appareil.';
  refreshAccountUI(); toast('Session expirée : reconnectez-vous.');
}
function legacyCred(srv) { try { return JSON.parse(localStorage.getItem('colosse_net_' + srv) || 'null'); } catch (e) { return null; } }
const guestProgress = () => { const g = loadSave(SAVE_KEY); return g.stats.raids > 0 || g.robots.length > 2 || g.base.b.length > 8 || Object.keys(g.research).length > 0; };
async function accSignIn(srv, name, pass, create, importGuest) {
  if (TUT.on) throw new Error('terminez ou quittez d\'abord le tutoriel');
  srv = normSrv(srv); if (!srv) throw new Error('indiquez l\'adresse du serveur');
  if (state === 'raid' || state === 'assault') throw new Error('terminez d\'abord le raid en cours');
  const found = await findServer(srv), info = found.info; srv = found.srv;
  const old = 'ce serveur est trop ancien (version ' + (info.version || '?') + ') pour les comptes : remplacez server/server.js par celui de la version 1.2, puis relancez le serveur';
  if (!info.accounts) throw new Error(old);
  const body = { name, pass }, leg = legacyCred(srv); if (create && leg) { body.legacyId = leg.id; body.legacyToken = leg.token; }
  let r;
  try { r = await apiAt(srv, create ? '/api/account/create' : '/api/account/login', body); }
  catch (e) { if (e.status === 404) throw new Error(old); throw e; }
  if (typeof LIVE !== 'undefined') LIVE.disconnect();
  const guest = loadSave(SAVE_KEY);
  ACC = { mode: 'server', srv, id: r.id, name: r.name, token: r.token, rev: 0 }; accStore();
  settings.server = srv; settings.pseudo = r.name; saveSettings();
  const cached = hasLocalSave(accountKey(ACC)) ? loadSave(accountKey(ACC)) : null;
  NET.srv = srv;
  const sv = await apiAt(srv, '/api/save/get', { token: r.token }), remote = sv.data ? parseSave(sv.data) : null;
  ACC.rev = sv.rev || 0; accStore();
  let pick = remote || cached;
  if (importGuest && (!pick || await askConfirm({ t: 'Partie du compte', ok: 'Remplacer', no: 'Garder celle du compte', danger: true, x: 'Ce compte a déjà une partie (' + saveSummary(pick) + '). La remplacer par la partie de cet appareil (' + saveSummary(guest) + ') ? Celle du compte restera seulement dans la copie de secours de cet appareil.' }))) { if (pick) { lsSet(accountKey(ACC) + BAK_SUFFIX, JSON.stringify(pick)); bakT = Date.now(); } pick = guest; }
  save = pick || newSave(); save.ut = Date.now();
  try { localStorage.setItem(accountKey(ACC), JSON.stringify(save)); } catch (e) { }
  await netInit();
  if (NET.kind === 'http') await cloudPush(true);
  if (state === 'base') enterBase(); else refreshTitle();
  return r;
}
async function accSignOut() {
  if (TUT.on) { toast('Terminez ou quittez d\'abord le tutoriel.'); return; }
  if (state === 'raid' || state === 'assault') { toast('Terminez d\'abord le raid en cours.'); return; }
  if (ACC.mode === 'server' && ACC.token) { try { if (CLOUD.dirty) await cloudPush(); await apiAt(ACC.srv, '/api/account/logout', { token: ACC.token }); } catch (e) { } }
  ACC = { mode: 'guest' }; accStore();
  save = loadSave(SAVE_KEY);
  await netInit();
  if (state === 'base') enterBase(); else refreshTitle();
  toast('Déconnecté : vous jouez en invité sur cet appareil.');
}
function accountLabel() {
  if (ACC.mode === 'server') return (ACC.token ? 'Connecté : ' : 'Déconnecté : ') + ACC.name + ' · ' + ACC.srv.replace(/^https?:\/\//, '');
  if (NET.kind === 'claude') return 'Compte claude.ai';
  return 'Invité (partie sur cet appareil)';
}
let accTab = 'login';
function renderAccount(errTxt) {
  const box = $('#accountBox'); if (!box) return;
  const srv = ACC.mode === 'server' ? ACC.srv : srvUrl(), logged = ACC.mode === 'server' && ACC.token;
  const gp = ACC.mode !== 'server' && guestProgress();
  box.innerHTML = `<h3>Compte</h3>
    <p>${logged ? `Vous êtes connecté en tant que <b>${esc(ACC.name)}</b> sur <b>${esc(ACC.srv)}</b>. Votre partie est enregistrée sur ce serveur : connectez-vous avec le même identifiant sur un autre PC ou un téléphone pour la retrouver.` : NET.kind === 'claude' ? 'Sur claude.ai, votre partie suit automatiquement votre compte claude.ai. Vous pouvez aussi vous connecter à un serveur Colosse.' : 'Vous jouez en <b>invité</b> : la partie reste sur cet appareil. Un compte sur un serveur Colosse garde votre partie sur le serveur et ouvre les raids partagés.'}</p>
    ${logged ? `<p class="desc" id="cloudState">${esc(CLOUD.state || '')}</p>
      <div class="btns"><button class="btn" data-act="accsync">Enregistrer maintenant</button><button class="btn" data-act="acclogout">Se déconnecter</button><button class="btn hot" data-act="accclose">Fermer</button></div>` : `
    <div class="chips" style="margin:8px 0 12px">${[['login', 'Se connecter'], ['create', 'Créer un compte']].map(([k, n]) => `<button class="chip ${accTab === k ? 'on' : ''}" data-act="acctab" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="setgrid">
      <span>Serveur</span><input class="name" id="accSrv" value="${esc(srv || '')}" placeholder="http://192.168.1.20:8787 ou http://[2001:db8::42]:8787" autocomplete="url">
      <span>Identifiant</span><input class="name" id="accName" maxlength="20" value="${esc(ACC.mode === 'server' ? ACC.name : '')}" autocomplete="username" placeholder="3 caractères au moins">
      <span>Mot de passe</span><input class="name" id="accPass" type="password" maxlength="100" autocomplete="${accTab === 'create' ? 'new-password' : 'current-password'}" placeholder="6 caractères au moins">
      ${accTab === 'create' ? '<span>Confirmer</span><input class="name" id="accPass2" type="password" maxlength="100" autocomplete="new-password">' : ''}
      ${gp ? `<span></span><label class="desc"><input type="checkbox" id="accImport" ${accTab === 'create' ? 'checked' : ''}> Reprendre ma partie invitée de cet appareil dans ce compte</label>` : ''}
    </div>
    <p class="lost" id="accErr">${esc(errTxt || '')}</p>
    ${httpsPage() && !ORIGIN_SRV ? '<p class="desc">Cette page est en https : elle ne peut joindre qu\'un serveur Colosse en https. Avec un serveur en http, le cas habituel à la maison, ouvrez directement son adresse dans le navigateur (par exemple <b>http://192.168.1.20:8787</b>) : le jeu s\'y charge déjà relié au serveur. Le .exe et l\'.apk acceptent aussi un serveur en http.</p>' : ''}
    <div class="btns"><button class="btn hot" data-act="accgo">${accTab === 'create' ? 'Créer le compte' : 'Se connecter'}</button><button class="btn" data-act="accclose">Jouer en invité</button></div>
    <p class="desc" style="margin-top:12px">Le serveur se lance depuis le dossier du jeu : <b>node server/server.js</b> (ou serveur.bat). Le mot de passe est chiffré sur le serveur et n'est jamais stocké sur cet appareil.</p>`}`;
}
function openAccount() { if (TUT.on) { toast('Le compte est en pause pendant le tutoriel.'); return; } renderAccount(); showOverlay('account', true); const f = $('#accName'); if (f && !f.value) f.focus(); }
function refreshAccountUI() {
  const b = $('#accBtn'); if (b) b.textContent = ACC.mode === 'server' && ACC.token ? 'Compte : ' + ACC.name : 'Compte';
  const n = $('#accLine'); if (n) n.textContent = accountLabel();
  if ($('#account') && $('#account').classList.contains('on')) { const c = $('#cloudState'); if (c) c.textContent = CLOUD.state || ''; }
}
function refreshTitle() {
  refreshAccountUI();
  const t = $('#titleNote'); if (!t) return;
  if (TOUCH.on) t.textContent = 'Écran tactile : joystick gauche pour bouger, joystick droit pour viser et tirer. Touchez un robot pour le sélectionner, puis le sol pour l\'envoyer. Deux doigts pour zoomer. Jouez en paysage.';
  else if (save.stats.raids) t.textContent = `Sauvegarde : ${save.stats.raids} raids, ${save.stats.extract} extractions, ${save.robots.length} robot${save.robots.length > 1 ? 's' : ''} au hangar.`;
  else t.textContent = 'Clavier et souris, ou écran tactile en mode paysage. ZQSD ou WASD : les touches suivent la position physique du clavier.';
}
document.addEventListener('visibilitychange', () => { if (document.hidden && CLOUD.dirty && cloudOn()) cloudPush(); });

function renderOnline() {
  if (TUT.on) return `<h2 class="h2">En ligne</h2><p class="lead">Le mode en ligne est en pause pendant le tutoriel : cette partie d'entraînement n'est ni publiée, ni pillable, ni enregistrée sur le serveur.</p>`;
  const seen = +(localStorage.getItem('colosse_seen_atk') || 0);
  if (NET.inbox.length) localStorage.setItem('colosse_seen_atk', String(NET.inbox[0].t || Date.now()));
  const cd = JSON.parse(localStorage.getItem('colosse_atk_cd') || '{}');
  const accBar = `<div class="launch" style="margin:0 0 14px"><span class="sub" style="font-size:14px">${esc(accountLabel())}</span><button class="btn sm" data-act="account">${ACC.mode === 'server' && ACC.token ? 'Gérer le compte' : 'Se connecter / créer un compte'}</button></div>`;
  if (!NET.ok) return `<h2 class="h2">En ligne</h2>${accBar}<p class="lead" id="netStatus">${esc(NET.status)}</p>
    <div class="brief"><p><b>Jouer en ligne sans dépendre de personne.</b> Le dossier du jeu contient un petit serveur (server/server.js) qui fonctionne avec Node.js seul, sans aucun paquet à installer. Lancez-le sur un PC, un serveur ou un Raspberry Pi : <b>node server/server.js</b>. Il écoute en IPv6 et en IPv4 sur le port 8787.</p>
    <p>Ensuite, chaque joueur clique sur <b>Compte</b>, entre l'adresse du serveur (par exemple <b>http://192.168.1.20:8787</b>) et crée son compte avec un identifiant et un mot de passe. La partie est alors enregistrée sur le serveur : on la retrouve sur n'importe quel PC ou téléphone.</p>
    <p>Le serveur gère le classement, les bases publiées, les pillages entre joueurs et les raids partagés en direct, en coopération ou en PvP.</p></div>
    <div class="launch"><button class="btn hot" data-act="account">Compte</button><button class="btn" data-act="netretry">Réessayer la connexion</button></div>`;
  const others = NET.bases.filter(b => b.id !== NET.me), now = Date.now();
  const myShield = NET.kind === 'claude' ? claudeShield(NET.inbox) : NET.shield;
  const lootTxt = (l, sg = '') => { const t = Object.keys(l || {}).filter(k => l[k] > 0).map(k => sg + fmt(l[k]) + ' ' + RES[k].n.toLowerCase()).join(', '); return t || 'rien'; };
  const live = typeof LIVE !== 'undefined' ? LIVE.renderTab() : '';
  return `<h2 class="h2">En ligne</h2>${accBar}
  <p class="lead"><span id="netStatus">${esc(NET.status)}</span> · vous jouez sous le nom <b>${esc(pseudo())}</b> · score ${netScore()}. Votre base est publiée automatiquement : les autres joueurs peuvent la piller. L'entrepôt protège ${protectPct()} % de vos stocks${myShield > now ? ` · <b>bouclier actif encore ${hm((myShield - now) / 1000)}</b>` : ''}.</p>
  ${live}
  <div class="rs-cat">Bases à piller</div>
  <p class="lead">Votre armée déployée part à l'assaut pendant 3 minutes. Étoiles : 50 % de destruction, le QG détruit, 100 %. Le butin est pris dans les vrais stocks du défenseur (hors part protégée), puis sa base passe sous bouclier (1, 2 ou 4 h selon les étoiles). Attaquer retire votre propre bouclier. Vos robots tombés reviennent endommagés.</p>
  <div class="grid-cards">${others.length ? others.map(b => {
    const wait = (cd[b.id] || 0) - now, sh = NET.kind === 'claude' ? 0 : (b.shield || 0) - now;
    const dis = wait > 0 || sh > 0;
    return `<div class="card"><div class="nm">${esc(netName(b.id))}</div><div class="sub">QG niveau ${b.hq || 1} · ${(b.b || []).length} bâtiments · ${b.def || 0} défenses</div><div class="sub">Butin possible (3 étoiles) : ${lootTxt(b.avail)}</div><div class="acts"><button class="btn sm ${dis ? '' : 'hot'}" data-act="assault" data-id="${esc(b.id)}" ${dis ? 'disabled' : ''}>${sh > 0 ? 'Bouclier encore ' + hm(sh / 1000) : wait > 0 ? 'Disponible dans ' + Math.ceil(wait / 60000) + ' min' : 'Attaquer'}</button></div></div>`;
  }).join('') : '<div class="card"><div class="sub">Aucune autre base publiée. Partagez le jeu avec vos amis pour en voir apparaître.</div></div>'}</div>
  <div class="rs-cat">Classement</div>
  <div class="res-list" style="max-width:760px">${NET.board.length ? NET.board.map((r, i) => `<div style="${r.id === NET.me ? 'font-weight:700' : ''}"><span>${i + 1}. ${esc(netName(r.id))} · QG ${r.hq || 1} · ${r.extract || 0} extractions · ${r.boss || 0} boss · ${r.defenses || 0} défenses</span><b>${fmt(r.score || 0)}</b></div>`).join('') : '<div><span>Aucun score pour l\'instant.</span><b>—</b></div>'}</div>
  <div class="rs-cat">Pillages subis</div>
  <div class="res-list" style="max-width:860px">${NET.inbox.length ? NET.inbox.slice(0, 15).map(a => `<div><span>${a.t > seen ? '● ' : ''}${esc(netName(a.attacker))} · ${new Date(a.t).toLocaleString('fr-FR')} · ${'★'.repeat(a.stars || 0)}${'☆'.repeat(3 - (a.stars || 0))} ${a.pct || 0} %</span><b class="lost">${a.loot ? lootTxt(a.loot, '−') : '—'}</b></div>`).join('') : '<div><span>Personne ne vous a encore attaqué.</span><b>—</b></div>'}</div>
  <div class="rs-cat">Vos pillages</div>
  <div class="res-list" style="max-width:860px">${NET.sent.length ? NET.sent.slice(0, 10).map(a => `<div><span>${esc(netName(a.target))} · ${new Date(a.t).toLocaleString('fr-FR')} · ${'★'.repeat(a.stars || 0)}${'☆'.repeat(3 - (a.stars || 0))} ${a.pct || 0} %</span><b class="good">${a.loot ? lootTxt(a.loot, '+') : '—'}</b></div>`).join('') : '<div><span>Aucun pillage pour l\'instant.</span><b>—</b></div>'}</div>`;
}
