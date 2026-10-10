// Langues : le français est la langue source du jeu. Chaque texte affiché passe par TL() (ou TLn() pour un pluriel) ;
// la clé est la phrase française elle-même. Les catalogues des autres langues sont intégrés à la construction (I18N_DATA,
// tiré de src/langues/*.json). Changer de langue recharge la page : tout le jeu est alors reconstruit dans la nouvelle langue.

// ================= LANGUES =================
// les dix langues les plus parlées au monde (locuteurs natifs et seconds), chacune avec un drapeau dessiné dans le jeu
const LANGS = [
  { id: 'en', n: 'English', fr: 'Anglais', flag: 'gb', loc: 'en-GB' },
  { id: 'zh', n: '中文', fr: 'Chinois mandarin', flag: 'cn', loc: 'zh-CN' },
  { id: 'hi', n: 'हिन्दी', fr: 'Hindi', flag: 'in', loc: 'hi-IN' },
  { id: 'es', n: 'Español', fr: 'Espagnol', flag: 'es', loc: 'es-ES' },
  { id: 'ar', n: 'العربية', fr: 'Arabe', flag: 'eg', loc: 'ar-EG', rtl: true },
  { id: 'fr', n: 'Français', fr: 'Français', flag: 'fr', loc: 'fr-FR' },
  { id: 'bn', n: 'বাংলা', fr: 'Bengali', flag: 'bd', loc: 'bn-BD' },
  { id: 'pt', n: 'Português', fr: 'Portugais', flag: 'br', loc: 'pt-BR' },
  { id: 'ru', n: 'Русский', fr: 'Russe', flag: 'ru', loc: 'ru-RU' },
  { id: 'id', n: 'Bahasa Indonesia', fr: 'Indonésien', flag: 'id', loc: 'id-ID' },
];
const LANG_KEY = 'colosse_lang_v1';
// langue choisie (null tant que le joueur n'a pas choisi : on prend alors celle de l'appareil)
const LANG_SET = (() => { try { const v = localStorage.getItem(LANG_KEY); return LANGS.some(l => l.id === v) ? v : null; } catch (e) { return null; } })();
function langGuess() {
  const L0 = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'fr']).map(s => String(s).toLowerCase());
  for (const s of L0) { const b = s.split('-')[0]; if (LANGS.some(l => l.id === b)) return b; }
  return 'fr';
}
const LANG = LANG_SET || langGuess();
const LANG_DEF = LANGS.find(l => l.id === LANG) || LANGS[5];
const TR = LANG !== 'fr' && typeof I18N_DATA !== 'undefined' && I18N_DATA[LANG] ? I18N_DATA[LANG] : null;
const PLURAL = (() => { try { return new Intl.PluralRules(LANG_DEF.loc); } catch (e) { return null; } })();
// arabe : le canevas écrit de droite à gauche (ponctuation et morceaux « A · B » à leur place), mais les alignements
// explicites du jeu restent ceux du dessin ('start' et 'end' deviennent 'left' et 'right')
if (LANG_DEF.rtl && typeof CanvasRenderingContext2D !== 'undefined') {
  try {
    const P = CanvasRenderingContext2D.prototype, ta = Object.getOwnPropertyDescriptor(P, 'textAlign');
    Object.defineProperty(P, 'textAlign', { configurable: true, get() { return ta.get.call(this); }, set(v) { ta.set.call(this, v === 'start' ? 'left' : v === 'end' ? 'right' : v); } });
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, o) { const c = gc.call(this, t, o); if (c && t === '2d' && !c.__rtl) { c.__rtl = 1; c.direction = 'rtl'; c.textAlign = 'left'; } return c; };
  } catch (e) { }
}
const I18N_MISS = new Set(); // clés absentes du catalogue (consultables dans la console : I18N_MISS)
const TL_DEC = ['fr', 'es', 'pt', 'ru', 'id'].includes(LANG) ? ',' : '.'; // séparateur décimal
const TL_LAST = { s: '', out: '' }; // dernière phrase traduite : permet de retrouver la phrase française d'origine d'un message

// texte traduit ; v remplace les {noms} du modèle
function TL(s, v) {
  let t = s;
  if (TR) { const x = TR[s]; if (typeof x === 'string' && x) t = x; else if (I18N_MISS.size < 2000) I18N_MISS.add(s); }
  t = v ? tlFill(t, v) : t; TL_LAST.s = s; TL_LAST.out = t; return t;
}
// pluriel : one et other sont les deux formes françaises (le français met le singulier sous 2) ; {n} reçoit le nombre
function TLn(n, one, other, v) {
  let t = null; const k = one + '|' + other;
  if (TR) { const x = TR[k]; if (x && typeof x === 'object') { const cat = PLURAL ? PLURAL.select(n) : 'other'; t = x[cat] || x.other || null; } else if (I18N_MISS.size < 2000) I18N_MISS.add(k); }
  if (t === null) t = Math.abs(n) < 2 ? one : other;
  t = tlFill(t, Object.assign({ n: tlNum(n) }, v)); TL_LAST.s = k; TL_LAST.out = t; return t;
}
function tlFill(t, v) { return t.replace(/\{([a-z0-9_]+)\}/gi, (m, k) => v[k] !== undefined && v[k] !== null ? v[k] : m); }
// les nombres gardent l'écriture française (espaces fines, virgule) sauf dans les langues qui ont leurs propres chiffres
function tlNum(n) { if (typeof n !== 'number') return n; return Number.isInteger(n) ? String(n) : String(+n.toFixed(2)).replace('.', TL_DEC); }
// liste « a, b et c » dans la langue du joueur
function tlList(a) {
  if (a.length < 2) return a.join('');
  if (a.length > 4) return TL('{a} et {n} autres', { a: a.slice(0, 3).join(LANG === 'zh' ? '、' : LANG === 'ar' ? '، ' : ', '), n: a.length - 3 });
  try { return new Intl.ListFormat(LANG_DEF.loc, { style: 'long', type: 'conjunction' }).format(a); } catch (e) { return a.slice(0, -1).join(', ') + ' ' + TL('et') + ' ' + a[a.length - 1]; }
}
