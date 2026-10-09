// Sauvegarde : lecture, réparation et écriture de la partie, raccourcis sur la progression.

// ================= SAUVEGARDE =================
const SAVE_KEY = 'colosse_save_v4';
const EXP_POST_OK = ['prudent', 'normal', 'audace'];
function defaultBase() {
  const now = Date.now();
  const L = [['hq', 148, 148], ['pad', 148, 139], ['forge', 141, 148], ['lab', 156, 148], ['hangar', 148, 157], ['scrapper', 142, 156], ['turret_mg', 157, 155], ['contracts', 140, 140]];
  return { b: L.map(([type, tx, ty], i) => ({ id: i + 1, type, tx, ty, lvl: 1, busy: 0, stored: 0, lastT: now })), nextId: L.length + 1, threat: 0 };
}
function newSave() {
  return {
    v: 4, res: { scrap: 320, alloy: 40, circuits: 55, crystals: 5, cores: 0, data: 10, heart: 0 },
    robots: [{ id: 1, name: 'Bricole', chassis: 'crawler', weapons: ['mg'], modules: [], brain: 'escort', hp: 1, deploy: true, group: 0, xp: 0, kills: 0, traits: [] }, { id: 2, name: 'Rivet', chassis: 'drone', weapons: ['rifle'], modules: [], brain: 'escort', hp: 1, deploy: true, group: 0, xp: 0, kills: 0, traits: [] }],
    research: {}, diff: 1, pweapon: 'pistol', base: defaultBase(),
    region: 0, cdone: [0, 0, 0, 0], bossKills: [0, 0, 0, 0], offers: [[], [], [], []], active: [], cid: 1,
    stats: { raids: 0, extract: 0, deaths: 0, kills: 0, boss: 0 }, nextId: 3, seen: false, exps: [], expRep: [], expN: 1
  };
}
function fixSave(o) {
  const n = newSave();
  for (const k in n) if (o[k] === undefined) o[k] = n[k];
  for (const k of RES_KEYS) if (typeof o.res[k] !== 'number') o.res[k] = 0;
  o.robots = (o.robots || []).filter(r => CHASSIS[r.chassis]).map(r => { r.weapons = (r.weapons || []).filter(w => WEAPONS[w]); if (!r.weapons.length) r.weapons = ['mg']; r.modules = (r.modules || []).filter(m => MODULES[m]); r.traits = (r.traits || []).filter(t => TRAITS[t]); r.xp = r.xp || 0; r.kills = r.kills || 0; return r; });
  if (!Array.isArray(o.exps)) o.exps = []; o.exps = o.exps.filter(e => e && Array.isArray(e.sq) && REGIONS[e.region] && DIFFS[e.diff]); for (const e of o.exps) { e.trail = e.trail || []; e.log = e.log || []; e.post = EXP_POST_OK.includes(e.post) ? e.post : 'normal'; }
  { const ids = new Set(o.exps.map(e => e.id)); for (const r of o.robots) if (r.exp && !ids.has(r.exp)) delete r.exp; } if (!Array.isArray(o.expRep)) o.expRep = [];
  if (!o.base || !Array.isArray(o.base.b)) o.base = defaultBase();
  o.base.b = o.base.b.filter(b => BUILD[b.type]); if (typeof o.base.threat !== 'number') o.base.threat = 0;
  if (!PWEAPONS[o.pweapon]) o.pweapon = 'pistol';
  return o;
}
// Compte : « invité » (partie gardée sur cet appareil) ou compte d'un serveur Colosse (identifiant + mot de passe,
// partie enregistrée sur le serveur et retrouvée sur n'importe quel appareil). Sur claude.ai, la partie suit le compte claude.ai.
const ACC_KEY = 'colosse_account_v1';
function accLoad() { try { const a = JSON.parse(localStorage.getItem(ACC_KEY) || 'null'); if (a && a.mode === 'server' && a.id && a.srv) return a; } catch (e) { } return { mode: 'guest' }; }
let ACC = accLoad();
function accStore() { try { localStorage.setItem(ACC_KEY, JSON.stringify(ACC)); } catch (e) { } }
const accountKey = a => a.mode === 'server' && a.id ? SAVE_KEY + '@' + a.srv + '#' + a.id : SAVE_KEY;
function parseSave(str) { try { const o = typeof str === 'string' ? JSON.parse(str) : str; if (o && o.v === 4 && o.res && Array.isArray(o.robots)) return fixSave(o); } catch (e) { } return null; }
// ---------- solidité : copie de secours, partie abîmée, version plus récente, stockage plein ----------
// La copie de secours est l'avant-dernier état enregistré (au plus toutes les 4 minutes), et la partie actuelle
// juste avant un import ou un effacement. Une partie illisible n'est jamais écrasée : elle est mise de côté.
const BAK_SUFFIX = '~secours', BROKEN_SUFFIX = '~abimee';
let saveNotice = '', saveFrozen = '', saveFailT = -1e9, bakT = 0;
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
const saveDate = t => t ? new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '?';
function loadSave(key) {
  key = key || accountKey(ACC);
  const s = lsGet(key); if (!s) return newSave();
  const o = parseSave(s); if (o) { if (key === accountKey(ACC)) saveFrozen = ''; return o; }
  let raw = null; try { raw = JSON.parse(s); } catch (e) { }
  if (raw && raw.v > 4) { // partie d'une version plus récente du jeu : on ne la touche pas
    if (key === accountKey(ACC)) { saveFrozen = key; saveNotice = 'Cette partie vient d\'une version plus récente de Colosse : mettez le jeu à jour pour la continuer. Vous pouvez jouer en attendant, mais rien ne sera enregistré ; votre partie reste intacte.'; }
    return newSave();
  }
  lsSet(key + BROKEN_SUFFIX, s);
  const b = parseSave(lsGet(key + BAK_SUFFIX));
  if (key === accountKey(ACC)) saveNotice = b ? 'Sauvegarde illisible : la copie de secours (' + saveDate(b.ut) + ') a été restaurée ; la progression faite depuis est perdue.' : 'Sauvegarde illisible : une nouvelle partie commence. L\'ancienne est mise de côté (Réglages → Sauvegarde).';
  return b || newSave();
}
function saveBackupNow(key) { key = key || accountKey(ACC); const cur = lsGet(key); if (cur && parseSave(cur)) lsSet(key + BAK_SUFFIX, cur); bakT = Date.now(); }
function hasLocalSave(key) { try { return !!localStorage.getItem(key); } catch (e) { return false; } }
// tutoriel : une partie d'entraînement à part, jamais envoyée au serveur (la logique est plus bas)
const TUT_KEY = 'colosse_tuto_v1';
const TUT = { on: false };
function writeSave() {
  save.ut = Date.now();
  if (TUT.on) { lsSet(TUT_KEY, JSON.stringify(save)); return; }
  const key = accountKey(ACC);
  if (saveFrozen === key) return;
  if (Date.now() - bakT > 240000) { const prev = lsGet(key); if (prev) { try { JSON.parse(prev); lsSet(key + BAK_SUFFIX, prev); } catch (e) { } } bakT = Date.now(); }
  const str = JSON.stringify(save);
  if (!lsSet(key, str)) {
    // stockage plein : on libère ce qui peut l'être, puis on réessaie
    lsDel(key + BROKEN_SUFFIX); lsDel(TUT_KEY);
    if (!lsSet(key, str)) { lsDel(key + BAK_SUFFIX); if (!lsSet(key, str) && Date.now() - saveFailT > 120000) { saveFailT = Date.now(); ERRLOG.add('sauvegarde', 'écriture impossible : stockage plein ou refusé'); if (typeof toast === 'function') toast('Mémoire du navigateur pleine : la partie n\'a pas pu être enregistrée. Exportez-la (Réglages → Sauvegarde) pour ne rien perdre.'); } }
  }
  if (typeof cloudDirty === 'function') cloudDirty();
}
// ---------- export et import d'une partie (fichier ou code à copier-coller) ----------
function saveExportText() { return JSON.stringify({ jeu: 'Colosse', version: VERSION, exporte: new Date().toISOString(), partie: save }); }
function saveImportParse(txt) {
  txt = String(txt || '').trim(); if (!txt) return { err: 'Collez d\'abord un code de sauvegarde, ou choisissez un fichier.' };
  let o; try { o = JSON.parse(txt); } catch (e) { return { err: 'Ce texte n\'est pas un code de sauvegarde Colosse (il est peut-être incomplet).' }; }
  if (o && o.partie) o = o.partie;
  if (o && o.v > 4) return { err: 'Cette partie vient d\'une version plus récente de Colosse : mettez d\'abord le jeu à jour.' };
  const p = parseSave(o); return p ? { o: p } : { err: 'Ce code ne contient pas de partie Colosse valide.' };
}
const saveSummary = s => `${s.stats.raids} raid${s.stats.raids > 1 ? 's' : ''}, ${s.robots.length} robot${s.robots.length > 1 ? 's' : ''}, ${Object.keys(s.research).length} recherche${Object.keys(s.research).length > 1 ? 's' : ''}, QG niveau ${Math.max(1, s.base.b.reduce((m, b) => b.type === 'hq' ? Math.max(m, b.lvl) : m, 0))}`;
function downloadText(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) { }
  const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;opacity:0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); return ok;
}
// une autre fenêtre du jeu enregistre la même partie : on prévient (la dernière enregistrée l'emporte)
window.addEventListener('storage', e => { if (e.key && !TUT.on && e.key === accountKey(ACC) && e.newValue && typeof toast === 'function') toast('Colosse est ouvert dans une autre fenêtre : seule la dernière partie enregistrée sera gardée.'); });

const has = id => !!save.research[id];
const bLevel = type => save.base.b.reduce((m, b) => b.type === type ? Math.max(m, b.lvl) : m, 0);
const bLevels = type => save.base.b.filter(b => b.type === type).reduce((s, b) => s + b.lvl, 0);
const hqLevel = () => Math.max(1, bLevel('hq'));
const labLevel = () => bLevel('lab');
const forgeLevel = () => bLevel('forge');
const forgeMaxTier = () => forgeLevel() ? forgeLevel() + 1 : 0;
const hangarCap = () => [12, 24, 40, 64, 100][Math.max(0, bLevel('hangar') - 1)] || 6;
const builderCap = () => 2 + (hqLevel() >= 3 ? 1 : 0) + (hqLevel() >= 5 ? 1 : 0);
const chassisUnlocked = id => id === 'crawler' || id === 'drone' || has('c_' + id);
const weaponUnlocked = id => id === 'mg' || id === 'rifle' || id === 'blades' || has('w_' + id);
const brainUnlocked = id => id === 'escort' || id === 'hunter' || id === 'guard' || has('b_' + id);
const pweaponUnlocked = id => id === 'pistol' || has('p_' + id);
const playerMaxHp = () => 150 + 40 * ['u_armor1', 'u_armor2', 'u_armor3'].filter(has).length;
const playerCap = () => 35 + 20 * ['u_bag1', 'u_bag2', 'u_bag3'].filter(has).length;
const cmdCap = () => 6 + 3 * ['u_cmd1', 'u_cmd2', 'u_cmd3', 'u_cmd4'].filter(has).length + 2 * (hqLevel() - 1) + 4 * bLevels('uplink');
const cmdUsed = () => save.robots.filter(r => r.deploy).reduce((s, r) => s + CHASSIS[r.chassis].cmd, 0);
const fmtCmd = n => Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
function canAfford(cost, mul = 1) { for (const k in cost) if ((save.res[k] || 0) < Math.ceil(cost[k] * mul)) return false; return true; }
function pay(cost, mul = 1) { for (const k in cost) save.res[k] -= Math.ceil(cost[k] * mul); }
function addCost(a, b, mul = 1) { const o = Object.assign({}, a); for (const k in b) o[k] = (o[k] || 0) + Math.ceil(b[k] * mul); return o; }
function robotCost(chassis, weapons, brain, modules) {
  let c = Object.assign({}, CHASSIS[chassis].cost);
  for (const w of weapons) if (w) c = addCost(c, WEAPONS[w].cost);
  for (const m of modules || []) if (m && MODULES[m]) c = addCost(c, MODULES[m].cost);
  if (BRAINS[brain] && BRAINS[brain].cost) c = addCost(c, BRAINS[brain].cost);
  const disc = 1 - .04 * Math.max(0, forgeLevel() - 1);
  for (const k in c) if (k !== 'heart' && k !== 'cores') c[k] = Math.ceil(c[k] * disc);
  return c;
}

let save = loadSave();
