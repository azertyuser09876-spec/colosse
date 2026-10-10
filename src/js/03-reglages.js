// Réglages et accessibilité : options du joueur, couleurs, taille de l'interface.

// ================= RÉGLAGES & ACCESSIBILITÉ =================
const SET_KEY = 'colosse_settings_v1';
const ACTIONS = {
  tactical: { n: TL('Mode tactique'), def: 'tab' }, pilot: { n: TL('Piloter / sortir'), def: 't' }, beacon: { n: TL('Poser / reprendre la balise'), def: 'v' },
  interact: { n: TL('Interagir (maintenir en raid)'), def: 'e' }, follow: { n: TL('Flotte : suivre'), def: 'f' }, hold: { n: TL('Flotte : tenir la position'), def: 'g' },
  defend: { n: TL('Base : construire · Raid : défendre la balise'), def: 'c' }, auto: { n: TL('Autonomie (Maj : changer de cerveau)'), def: 'b' },
  selectAll: { n: TL('Tout sélectionner'), def: 'x' }, reload: { n: TL('Recharger'), def: 'r' }, map: { n: TL('Carte du monde'), def: 'm' },
  help: { n: TL('Aide'), def: 'h' }, formation: { n: TL('Changer de formation'), def: 'n' }, patrol: { n: TL('Patrouille'), def: 'p' },
  ability: { n: TL('Capacités actives'), def: 'u' }, dash: { n: TL('Esquive'), def: ' ' }, wmode: { n: TL('Pilotage : armes manuelles ou auto'), def: 'y' },
};
const DEFAULT_SET = { fps30: false, tapAct: false, ui: 1, cb: false, contrast: false, shake: 1, flash: true, aim: false, toggleFire: false, vol: .8, vSfx: 1, vMus: .7, vAmb: .7, haptics: true, keys: {}, touch: 'auto', pseudo: '', server: '', fx: 'auto', daynight: true, tgt: 'full' };
function loadSettings() { try { const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null'); if (s) return Object.assign({}, DEFAULT_SET, s, { keys: Object.assign({}, s.keys || {}) }); } catch (e) { } return Object.assign({}, DEFAULT_SET, { keys: {} }); }
let settings = loadSettings();
function saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (e) { } }
const uiScale = () => settings.ui * (typeof TOUCH !== 'undefined' && TOUCH.on && innerHeight < 520 ? .8 : 1);
const keyOf = a => (settings.keys[a] !== undefined ? settings.keys[a] : ACTIONS[a].def);
const TOUCH_LABEL = { beacon: TL('Balise'), interact: TL('Agir'), pilot: TL('Piloter'), dash: TL('Esquive'), ability: TL('Capacité'), tactical: TL('Tactique'), map: TL('Carte'), defend: TL('Flotte'), follow: TL('Flotte'), hold: TL('Flotte'), auto: TL('Flotte'), help: '☰', formation: TL('Flotte'), patrol: TL('Flotte'), selectAll: TL('Flotte'), reload: TL('auto'), wmode: TL('pastilles') };
function keyLabel(a) { if (typeof TOUCH !== 'undefined' && TOUCH.on && TOUCH_LABEL[a]) return TOUCH_LABEL[a]; const k = keyOf(a); return k === ' ' ? TL('Espace') : k === 'tab' ? 'Tab' : k.length === 1 ? k.toUpperCase() : k; }
function actionFor(k) { for (const a in ACTIONS) if (keyOf(a) === k) return a; return null; }
const COL = { ally: '#6fe3c8', enemy: '#ff4d5e', enemy2: '#ff6b74', rival: '#d6a8ff', allyRGB: '111,227,200' };
function applyColors() {
  if (settings.cb) Object.assign(COL, { ally: '#5fb0ff', enemy: '#ffa040', enemy2: '#ffb060', rival: '#ffe14d', allyRGB: '95,176,255' });
  else Object.assign(COL, { ally: '#6fe3c8', enemy: '#ff4d5e', enemy2: '#ff6b74', rival: '#d6a8ff', allyRGB: '111,227,200' });
  try {
    PAL.ally.acc = COL.ally; PAL.ally.glow = 'rgba(' + COL.allyRGB + ',';
    PAL.enemy.acc = settings.cb ? '#ffa040' : '#ff4d5e'; PAL.enemy.glow = settings.cb ? 'rgba(255,160,64,' : 'rgba(255,77,94,';
  } catch (e) { }
}
applyColors();
