#!/usr/bin/env node
// Construit index.html à partir des sources de src/ (aucune dépendance : Node.js seul).
//   node outils/construire.js            reconstruit index.html
//   node outils/construire.js --verifier vérifie seulement que index.html est à jour (sortie 1 sinon)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RACINE = path.join(__dirname, '..'), SRC = path.join(RACINE, 'src'), CIBLE = path.join(RACINE, 'index.html');
const verifier = process.argv.includes('--verifier');

const page = fs.readFileSync(path.join(SRC, 'page.html'), 'utf8');
const style = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
const fichiers = fs.readdirSync(path.join(SRC, 'js')).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
if (!fichiers.length) { console.error('Aucun fichier dans src/js.'); process.exit(1); }
const morceaux = fichiers.map(f => fs.readFileSync(path.join(SRC, 'js', f), 'utf8').replace(/\s+$/, '') + '\n');
const script = "'use strict';\n" + morceaux.join('\n');

// contrôle de syntaxe, avec le fichier source fautif en cas d'erreur
try { new vm.Script(script, { filename: 'index.html' }); }
catch (e) {
  const m = /:(\d+)/.exec(e.stack.split('\n')[0]) || [];
  let ligne = +m[1] || 0, nom = '?';
  for (let i = 0, l = 2; i < fichiers.length; i++) { const n = morceaux[i].split('\n').length; if (ligne < l + n - 1) { nom = fichiers[i]; ligne -= l - 1; break; } l += n; }
  console.error('Erreur de syntaxe dans src/js/' + nom + ' vers la ligne ' + ligne + ' : ' + e.message);
  process.exit(1);
}
if (!page.includes('/*@STYLE*/') || !page.includes('/*@SCRIPT*/')) { console.error('src/page.html doit contenir /*@STYLE*/ et /*@SCRIPT*/.'); process.exit(1); }
// version unique : celle de package.json, reportée dans le jeu, le cache hors ligne et l'application Android
const version = JSON.parse(fs.readFileSync(path.join(RACINE, 'package.json'), 'utf8')).version;
const [vM, vm_, vp] = version.split('.').map(n => parseInt(n, 10) || 0), versionCode = vM * 10000 + vm_ * 100 + vp;
const sortie = page.replace('/*@STYLE*/\n', () => style).replace('/*@SCRIPT*/\n', () => script.split('__VERSION__').join(version));
const annexes = [
  ['sw.js', /const CACHE = '[^']*';/, "const CACHE = 'colosse-" + version + "';"],
  ['android/app/build.gradle', /versionCode \d+/, 'versionCode ' + versionCode],
  ['android/app/build.gradle', /versionName '[^']*'/, "versionName '" + version + "'"],
];

const textes = new Map();
for (const [f, re, val] of annexes) { const p = path.join(RACINE, f); if (!fs.existsSync(p)) continue; if (!textes.has(p)) textes.set(p, fs.readFileSync(p, 'utf8')); textes.set(p, textes.get(p).replace(re, val)); }
const aJour = [...textes].filter(([p, n]) => n !== fs.readFileSync(p, 'utf8'));
if (verifier) {
  const actuel = fs.existsSync(CIBLE) ? fs.readFileSync(CIBLE, 'utf8') : '';
  if (actuel !== sortie || aJour.length) { console.error('index.html (ou la version de sw.js / Android) n\'est pas à jour : lancez « node outils/construire.js ».'); process.exit(1); }
  console.log('index.html est à jour (version ' + version + ').');
} else {
  fs.writeFileSync(CIBLE, sortie);
  for (const [p, n] of aJour) fs.writeFileSync(p, n);
  console.log('index.html construit : version ' + version + ', ' + fichiers.length + ' fichiers, ' + Math.round(sortie.length / 1024) + ' Ko.');
}
