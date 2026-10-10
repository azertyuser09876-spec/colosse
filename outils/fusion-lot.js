#!/usr/bin/env node
// Fusionne des morceaux de traduction : node outils/fusion-lot.js sortie.json morceau1.json morceau2.json …
'use strict';
const fs = require('fs'); const [out, ...ins] = process.argv.slice(2); const R = {};
for (const f of ins) { try { Object.assign(R, JSON.parse(fs.readFileSync(f, 'utf8'))); } catch (e) { console.error('JSON invalide dans ' + f + ' : ' + e.message); process.exit(1); } }
fs.writeFileSync(out, JSON.stringify(R, null, 1)); console.log(out + ' : ' + Object.keys(R).length + ' clés');
