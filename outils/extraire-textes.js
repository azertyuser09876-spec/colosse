#!/usr/bin/env node
// Extrait toutes les phrases à traduire : appels TL('…') et TLn(n, '…', '…') du code, textes fixes de src/page.html
// et messages d'erreur du serveur. Écrit src/langues/_cles.json (clé → { pluriel, fichiers }) et affiche un bilan,
// avec, pour chaque catalogue src/langues/xx.json, les clés manquantes ou en trop.
//   node outils/extraire-textes.js            bilan + _cles.json
//   node outils/extraire-textes.js --manque   liste aussi les clés manquantes de chaque langue
'use strict';
const fs = require('fs'), path = require('path');
const RACINE = path.join(__dirname, '..'), SRC = path.join(RACINE, 'src'), DOS = path.join(SRC, 'langues');
const cles = new Map(); // clé → { pl, f:Set, o: ordre de première apparition, c: contexte }
let ordre = 0;
const ajoute = (k, pl, f, ctx) => { if (!k || !/\p{L}/u.test(k)) return; const o = cles.get(k) || { pl, f: new Set(), o: ordre++, c: '' }; o.pl = o.pl || pl; o.f.add(f); if (!o.c && ctx) o.c = ctx; cles.set(k, o); };
// contexte donné aux traducteurs pour les clés courtes (un mot seul est souvent ambigu : « est », « vol », « suit »)
const contexte = (s, i, k) => k.split(/\s+/).length > 2 || k.length > 25 ? '' : s.slice(Math.max(0, i - 50), i + 70).replace(/\s+/g, ' ').trim();
// lit un littéral JS entre apostrophes ou guillemets à la position i ; renvoie [valeur, fin] ou null
function litteral(s, i) {
  while (/\s/.test(s[i])) i++;
  const q = s[i]; if (q !== "'" && q !== '"') return null;
  let j = i + 1; while (j < s.length && s[j] !== q) { if (s[j] === '\\') j++; j++; }
  return [Function('"use strict"; return ' + s.slice(i, j + 1))(), j + 1];
}
// saute une expression jusqu'à la virgule de premier niveau
function sauteArg(s, i) {
  let d = 0;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"' || c === '`') { const q = c; i++; while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; } continue; }
    if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) { if (d === 0) return -1; d--; } else if (c === ',' && d === 0) return i + 1;
  }
  return -1;
}
const erreurs = [];
for (const f of fs.readdirSync(path.join(SRC, 'js')).filter(f => /^\d\d-.*\.js$/.test(f)).sort()) {
  const s = fs.readFileSync(path.join(SRC, 'js', f), 'utf8'); let m; const re = /\bTL(n?)\(/g;
  while ((m = re.exec(s))) {
    if (/[\w.$]/.test(s[m.index - 1] || '') || /function\s+$/.test(s.slice(m.index - 12, m.index))) continue;
    { const deb = s.lastIndexOf('\n', m.index) + 1; if (s.slice(deb, m.index).includes('//')) continue; } // commentaire
    const ligne = s.slice(0, m.index).split('\n').length; let i = m.index + m[0].length;
    if (m[1]) { // TLn(n, 'un', 'plusieurs')
      i = sauteArg(s, i); const a = i > 0 && litteral(s, i); if (!a) { erreurs.push(f + ':' + ligne + ' TLn sans littéral'); continue; }
      let k = a[1]; while (/\s/.test(s[k])) k++; if (s[k] !== ',') { erreurs.push(f + ':' + ligne + ' TLn incomplet'); continue; }
      const b = litteral(s, k + 1); if (!b) { erreurs.push(f + ':' + ligne + ' TLn sans 2e littéral'); continue; }
      ajoute(a[0] + '|' + b[0], true, f, contexte(s, m.index, a[0]));
    } else {
      const a = litteral(s, i);
      if (!a) { const t = s.slice(i, i + 40); if (!/^\s*(s|k|x|t|v\.replace|document\.title|text|j\.error|String\(m\.e)/.test(t)) erreurs.push(f + ':' + ligne + ' TL sans littéral : ' + t.split('\n')[0]); continue; }
      ajoute(a[0], false, f, /^(04|06|27)-/.test(f) ? '' : contexte(s, m.index, a[0])); // tables de données : l'ordre suffit
    }
  }
}
// textes fixes de la page (nœuds de texte et attributs), tels que le jeu les retrouve au démarrage
{
  const p = fs.readFileSync(path.join(SRC, 'page.html'), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ');
  const dec = t => t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  for (const t of p.split(/<[^>]*>/)) { const k = dec(t).replace(/\s+/g, ' ').trim(); if (k) ajoute(k, false, 'page.html'); }
  let m; const re = /\b(?:title|aria-label|placeholder)="([^"]*)"/g; while ((m = re.exec(p))) ajoute(dec(m[1]).trim(), false, 'page.html');
  const ti = /<title>([^<]*)<\/title>/.exec(fs.readFileSync(path.join(SRC, 'page.html'), 'utf8')); if (ti) ajoute(dec(ti[1]).trim(), false, 'page.html');
}
// messages d'erreur rédigés par le serveur (affichés par le jeu au travers de TL)
{
  const sv = path.join(RACINE, 'server', 'server.js');
  if (fs.existsSync(sv)) { const s = fs.readFileSync(sv, 'utf8'); let m; const re = /\b(?:error|e): ('(?:[^'\\]|\\.)*')/g; while ((m = re.exec(s))) ajoute(Function('return ' + m[1])(), false, 'server.js'); }
}
const tri = [...cles.keys()].sort((a, b) => cles.get(a).o - cles.get(b).o); // ordre du code : les phrases voisines se suivent
const sortie = {}; for (const k of tri) { const o = cles.get(k); sortie[k] = { pl: o.pl ? 1 : 0, f: [...o.f].join(' ') }; if (o.c) sortie[k].c = o.c; }
fs.mkdirSync(DOS, { recursive: true });
fs.writeFileSync(path.join(DOS, '_cles.json'), JSON.stringify(sortie, null, 1));
const nCar = tri.reduce((s, k) => s + k.length, 0);
console.log(tri.length + ' clés (' + tri.filter(k => cles.get(k).pl).length + ' pluriels), ' + nCar + ' caractères → src/langues/_cles.json');
if (erreurs.length) { console.log('À vérifier (' + erreurs.length + ') :'); for (const e of erreurs.slice(0, 60)) console.log('  ' + e); }
// état des catalogues
const ph = k => (k.match(/\{[a-z0-9_]+\}/gi) || []).sort().join(',');
for (const f of fs.readdirSync(DOS).filter(f => /^[a-z]{2}\.json$/.test(f)).sort()) {
  const C = JSON.parse(fs.readFileSync(path.join(DOS, f), 'utf8')); const manque = tri.filter(k => !(k in C)), trop = Object.keys(C).filter(k => !cles.has(k));
  const mauvais = tri.filter(k => k in C).filter(k => {
    const v = C[k], pl = cles.get(k).pl;
    if (pl) { if (!v || typeof v !== 'object' || !v.other) return true; const sansN = t => ph(t).split(',').filter(x => x && x !== '{n}').join(','), ref = sansN(k.split('|')[1]); return Object.values(v).some(x => typeof x !== 'string' || sansN(x) !== ref); } // {n} peut manquer (« un seul »)
    return typeof v !== 'string' || ph(v) !== ph(k);
  });
  console.log(f + ' : ' + (tri.length - manque.length) + ' / ' + tri.length + ' traduites' + (manque.length ? ', ' + manque.length + ' manquantes' : '') + (trop.length ? ', ' + trop.length + ' en trop' : '') + (mauvais.length ? ', ' + mauvais.length + ' aux espaces réservés incorrects' : ''));
  if (process.argv.includes('--manque')) { for (const k of manque.slice(0, 40)) console.log('   manque : ' + k); for (const k of mauvais.slice(0, 40)) console.log('   incorrect : ' + k); }
}
