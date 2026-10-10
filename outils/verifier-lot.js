#!/usr/bin/env node
// Vérifie une traduction de lot : node outils/verifier-lot.js src/langues/_lots/lot1.json src/langues/_parts/en-1.json en
// Contrôle : JSON valide, toutes les clés du lot présentes, mêmes espaces réservés {x}, mêmes balises HTML,
// formes de pluriel complètes pour la langue, pas de texte vide. Sortie 1 s'il reste des erreurs.
'use strict';
const fs = require('fs');
const [lotF, trF, lang] = process.argv.slice(2);
if (!lotF || !trF || !lang) { console.error('usage : verifier-lot.js lot.json traduction.json code_langue'); process.exit(2); }
const LOC = { en: 'en-GB', zh: 'zh-CN', hi: 'hi-IN', es: 'es-ES', ar: 'ar-EG', bn: 'bn-BD', pt: 'pt-BR', ru: 'ru-RU', id: 'id-ID' }[lang];
const cats = new Intl.PluralRules(LOC).resolvedOptions().pluralCategories;
const lot = JSON.parse(fs.readFileSync(lotF, 'utf8'));
let T; try { T = JSON.parse(fs.readFileSync(trF, 'utf8')); } catch (e) { console.log('JSON invalide : ' + e.message); process.exit(1); }
const ph = s => (s.match(/\{[a-z0-9_]+\}/gi) || []).sort().join(',');
const tags = s => (s.match(/<\/?[a-z]+[^>]*>/gi) || []).map(t => t.replace(/\s.*?>/, '>').toLowerCase()).sort().join(',');
const err = [];
for (const e of lot) {
  const k = e.k, v = T[k];
  if (v === undefined) { err.push('manque : ' + k); continue; }
  if (e.pl) {
    const [one, other] = k.split('|');
    if (!v || typeof v !== 'object' || Array.isArray(v)) { err.push('pluriel attendu (objet ' + cats.join('/') + ') : ' + k); continue; }
    for (const c of cats) if (typeof v[c] !== 'string' || !v[c].trim()) err.push('forme « ' + c + ' » manquante : ' + k);
    for (const c in v) {
      if (!cats.includes(c)) { err.push('forme « ' + c + ' » inutile en ' + lang + ' : ' + k); continue; }
      const ref = ph(other).split(',').filter(x => x && x !== '{n}').join(','), got = ph(v[c]).split(',').filter(x => x && x !== '{n}').join(',');
      if (ref !== got) err.push('espaces réservés différents (' + c + ') : ' + k + ' → ' + v[c]);
      if (tags(other) !== tags(v[c])) err.push('balises différentes (' + c + ') : ' + k);
    }
  } else {
    if (typeof v !== 'string' || !v.trim()) { err.push('texte vide ou non textuel : ' + k); continue; }
    if (ph(k) !== ph(v)) err.push('espaces réservés différents : ' + k + ' → ' + v);
    if (tags(k) !== tags(v)) err.push('balises différentes : ' + k + ' → ' + v);
  }
}
const set = new Set(lot.map(e => e.k)); const trop = Object.keys(T).filter(k => !set.has(k));
if (trop.length) err.push(trop.length + ' clés en trop (absentes du lot), par exemple : ' + trop.slice(0, 3).join(' | '));
if (err.length) { console.log(err.length + ' problème(s) :'); for (const x of err.slice(0, 80)) console.log(' - ' + x); process.exit(1); }
console.log('OK : ' + lot.length + ' clés, langue ' + lang + ' (pluriels : ' + cats.join(', ') + ')');
