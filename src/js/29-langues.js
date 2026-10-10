// Écran des langues : choix au premier lancement et dans les réglages, drapeaux dessinés, sens de lecture (arabe).

// ================= DRAPEAUX =================
// dessinés en SVG sur un format 3:2 ; chaque langue a le drapeau du pays qui en compte le plus de locuteurs (ou de son berceau)
let flagUid = 0;
function flagStar(cx, cy, r, rot = -Math.PI / 2) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, q = i % 2 ? r * .382 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * q).toFixed(2) + ',' + (cy + Math.sin(a) * q).toFixed(2); }
  return d + 'Z';
}
function flagSvg(code, w = 42, h = 28, cls = '') {
  const id = 'fl' + (++flagUid);
  let b = '', vb = '0 0 30 20';
  switch (code) {
    case 'gb': vb = '0 0 60 30';
      b = `<clipPath id="${id}a"><path d="M0,0v30h60V0z"/></clipPath><clipPath id="${id}b"><path d="M30,15h30v15zv15H0zH0V0zV0h30z"/></clipPath>
        <g clip-path="url(#${id}a)"><path d="M0,0v30h60V0z" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/>
        <path d="M0,0 60,30M60,0 0,30" clip-path="url(#${id}b)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/>
        <path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></g>`; break;
    case 'cn': {
      b = `<rect width="30" height="20" fill="#EE1C25"/><path d="${flagStar(5, 5, 3)}" fill="#FFFF00"/>`;
      for (const [x, y] of [[10, 2], [12, 4], [12, 7], [10, 9]]) b += `<path d="${flagStar(x, y, 1, Math.atan2(5 - y, 5 - x))}" fill="#FFFF00"/>`;
      break;
    }
    case 'in': {
      b = `<rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#FF9933"/><rect y="13.33" width="30" height="6.67" fill="#138808"/>
        <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".35"/><circle cx="15" cy="10" r=".5" fill="#000080"/><path d="`;
      for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; b += `M15,10L${(15 + Math.cos(a) * 2.5).toFixed(2)},${(10 + Math.sin(a) * 2.5).toFixed(2)}`; }
      b += `" stroke="#000080" stroke-width=".18"/>`; break;
    }
    case 'es': b = `<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>`; break;
    case 'eg': b = `<rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#CE1126"/><rect y="13.33" width="30" height="6.67" fill="#000"/>
        <path d="M11.8,9.4L13.9,8.6L14.3,7.2L15.7,7.2L16.1,8.6L18.2,9.4L17,11.1L15.8,10.6L15.9,12.6L15,13L14.1,12.6L14.2,10.6L13,11.1Z" fill="#C09300"/>`; break;
    case 'fr': b = `<rect width="30" height="20" fill="#fff"/><rect width="10" height="20" fill="#002395"/><rect x="20" width="10" height="20" fill="#ED2939"/>`; break;
    case 'bd': b = `<rect width="30" height="20" fill="#006A4E"/><circle cx="13.5" cy="10" r="6" fill="#F42A41"/>`; break;
    case 'br': b = `<rect width="30" height="20" fill="#009C3B"/><path d="M2.6,10L15,1.8L27.4,10L15,18.2Z" fill="#FFDF00"/><circle cx="15" cy="10" r="5" fill="#002776"/>
        <path d="M10.2,9.1Q15.2,7.9 19.8,10.6" stroke="#fff" stroke-width=".9" fill="none"/>`;
      for (const [x, y] of [[13, 11.6], [15.5, 12.8], [17.2, 11.9], [14.2, 13.9], [16.4, 14.2], [12.2, 12.9]]) b += `<circle cx="${x}" cy="${y}" r=".32" fill="#fff"/>`;
      break;
    case 'ru': b = `<rect width="30" height="20" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039A6"/><rect y="13.33" width="30" height="6.67" fill="#D52B1E"/>`; break;
    case 'id': b = `<rect width="30" height="20" fill="#fff"/><rect width="30" height="10" fill="#FF0000"/>`; break;
  }
  return `<svg class="flag ${cls}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${b}</svg>`;
}

// ================= ÉCRAN DES LANGUES =================
// le nom de chaque langue dans la langue du joueur (le nom natif est toujours affiché en premier)
const LANG_NAMES = { en: TL('Anglais'), zh: TL('Chinois mandarin'), hi: TL('Hindi'), es: TL('Espagnol'), ar: TL('Arabe'), fr: TL('Français'), bn: TL('Bengali'), pt: TL('Portugais'), ru: TL('Russe'), id: TL('Indonésien') };
function langsHtml(first) {
  const cards = LANGS.map(l => `<button class="lang-card ${l.id === LANG ? 'on' : ''}" data-act="setlang" data-id="${l.id}" lang="${l.id}" dir="${l.rtl ? 'rtl' : 'ltr'}">
      ${flagSvg(l.flag, 48, 32, 'fl')}<span class="txt"><span class="nm">${l.n}</span><span class="sub">${l.id === LANG ? '✓ ' : ''}${esc(LANG_NAMES[l.id])}</span></span></button>`).join('');
  return `<h3>${TL('Langue')}</h3>
    <p>${first ? TL('Choisissez la langue du jeu. Vous pourrez la changer à tout moment dans les réglages.') : TL('Le jeu redémarre dans la langue choisie ; votre partie est conservée.')}</p>
    <div class="lang-grid">${cards}</div>
    <p class="small-note" style="margin-top:12px">${TL('Les dix langues les plus parlées au monde.')}</p>
    <div class="btns"><button class="btn" data-act="closelangs">${first ? TL('Continuer') + ' · ' + LANG_DEF.n : TL('Fermer')}</button></div>`;
}
function openLangs(first) {
  let o = $('#langs');
  if (!o) { o = document.createElement('div'); o.id = 'langs'; o.className = 'overlay'; o.innerHTML = '<div class="dlg langs" id="langsBox"></div>'; $('#app').appendChild(o); }
  $('#langsBox').innerHTML = langsHtml(first); o.dataset.first = first ? '1' : '';
  showOverlay('langs', true); SFX.play('uiopen', 1);
}
function setLang(id) {
  if (!LANGS.some(l => l.id === id)) return;
  try { localStorage.setItem(LANG_KEY, id); } catch (e) { }
  if (id === LANG) { showOverlay('langs', false); SFX.play('ui', 1); return; }
  // tout le jeu est construit dans la langue courante : on recharge (la partie est déjà enregistrée)
  try { if (typeof writeSave === 'function' && typeof save !== 'undefined' && save && state !== 'raid' && state !== 'assault') writeSave(); } catch (e) { }
  $('#langsBox').innerHTML = `<h3>${LANGS.find(l => l.id === id).n}</h3><p>…</p>`;
  setTimeout(() => location.reload(), 60);
}
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act;
  if (act === 'langs') { openLangs(false); }
  else if (act === 'setlang') { if (TUT.on && el.dataset.id !== LANG) { toast(TL('Changez de langue après le tutoriel : le jeu redémarre.')); return; } if (state === 'raid' || state === 'assault') { toast(TL('Changez de langue entre deux raids : le jeu redémarre.')); return; } setLang(el.dataset.id); }
  else if (act === 'closelangs') { const o = $('#langs'); if (o && o.dataset.first) { try { localStorage.setItem(LANG_KEY, LANG); } catch (er) { } } showOverlay('langs', false); SFX.play('uiclose', 1); }
});

// ================= TEXTES FIXES DE LA PAGE =================
// les textes écrits dans page.html sont traduits une fois, au chargement ; le reste du jeu passe par TL au moment de l'affichage
function i18nPage() {
  const H = document.documentElement; H.lang = LANG; H.dir = LANG_DEF.rtl ? 'rtl' : 'ltr';
  if (TR) {
    document.title = TL(document.title.replace(/\s+/g, ' ').trim());
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => /^(SCRIPT|STYLE)$/.test(n.parentNode && n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const raw = n.nodeValue, k = raw.replace(/\s+/g, ' ').trim(); if (!k || !/\p{L}/u.test(k)) continue;
      const t = TL(k); if (t !== k) n.nodeValue = raw.match(/^\s*/)[0] + t + raw.match(/\s*$/)[0];
    }
    for (const el of document.querySelectorAll('[title],[aria-label],[placeholder]')) for (const a of ['title', 'aria-label', 'placeholder']) { const v = el.getAttribute(a); if (v && /\p{L}/u.test(v)) el.setAttribute(a, TL(v.replace(/\s+/g, ' ').trim())); }
  }
  const b = $('#langBtn'); if (b) b.innerHTML = flagSvg(LANG_DEF.flag, 24, 16) + ' <span>' + LANG_DEF.n + '</span>';
}
i18nPage();
