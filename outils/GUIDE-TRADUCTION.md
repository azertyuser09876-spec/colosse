# Rendre le code traduisible (TL / TLn)

Le jeu COLOSSE (src/js/*.js, concaténés en un seul script par `node outils/construire.js`) est écrit en français.
Chaque texte **affiché au joueur** doit passer par une des deux fonctions définies dans `src/js/00-langues.js` :

```js
TL('Phrase française complète avec {nom} et {n}', { nom: valeur, n: autre })   // texte simple
TLn(n, 'forme singulier avec {n}', 'forme pluriel avec {n}', { autres: vars })  // pluriel (français : singulier si n < 2)
tlList(['a', 'b', 'c'])                                                          // « a, b et c » dans la langue du joueur
```

La **clé est la phrase française elle-même** : un outil extrait tous les `TL('…')` / `TLn(n, '…', '…')` du code
pour fabriquer le catalogue, puis chaque phrase est traduite dans 9 langues (anglais, chinois, hindi, espagnol, arabe,
bengali, portugais, russe, indonésien). En français, `TL` rend exactement la même phrase : le jeu français ne doit pas changer.

## Règles obligatoires

1. **Premier argument = UN SEUL littéral entre apostrophes** : `TL('…')`. Jamais de variable, de concaténation (`+`),
   ni de gabarit `` `…${x}…` `` dans le premier argument (l'outil d'extraction ne les verrait pas).
   Pour `TLn`, les deux formes (2e et 3e arguments) sont aussi des littéraux.
2. **Des phrases entières, pas des morceaux.** Le code qui fabrique une phrase par concaténation doit être réécrit
   avec des espaces réservés nommés :
   ```js
   // avant
   msg('Abattre ' + c.count + ' × ' + ENEMIES[c.target].n, '#fff');
   // après
   msg(TL('Abattre {n} × {foe}', { n: c.count, foe: ENEMIES[c.target].n }), '#fff');
   ```
   L'ordre des mots change d'une langue à l'autre : c'est le traducteur qui place `{foe}`.
   Noms d'espaces réservés : courts, en minuscules, lettres/chiffres/_ (`{n}`, `{name}`, `{time}`, `{key}`, `{res}`…).
3. **Pluriels** : remplacez `n + ' robot' + (n > 1 ? 's' : '')` par `TLn(n, '{n} robot', '{n} robots')`.
   Si le nombre n'apparaît pas dans le texte : `TLn(n, 'robot perdu', 'robots perdus')`. Pour passer un nombre déjà
   formaté : `TLn(x, '{n} kg', '{n} kg', { n: x.toFixed(1) })`.
4. **Séparateurs** : les lignes faites de morceaux « A · B · C » restent découpées : chaque morceau est un `TL(…)`
   séparé, les ` · ` restent dans le code. Pas d'espace au début ni à la fin d'une clé.
5. **HTML** : dans les gabarits `` `<h3>${TL('Extraction réussie')}</h3>` ``. Une valeur dynamique entourée de balises
   va dans l'espace réservé : `TL('Durée {t}', { t: '<b>' + mmss(x) + '</b>' })`. Quelques balises simples **fixes**
   (`<b>`, `<i>`, `<br>`) peuvent rester dans la clé si elles entourent des mots de la phrase (le traducteur les garde).
   Gardez `esc()` là où il était (données du joueur : pseudos, noms de robots…). Une traduction peut contenir une
   apostrophe ou des guillemets : dans un attribut HTML (`title="…"`, `aria-label="…"`, `placeholder="…"`), entourez le
   `TL(…)` de `esc(…)`.
6. **Tables de données : déjà faites.** Les champs `n`, `d`, `cat` des tables (WEAPONS, CHASSIS, ENEMIES, MODULES,
   TRAITS, RES, BRAINS, PWEAPONS, DIFFS, RESEARCH, BUILD, REGIONS, RT_BASE, RT_BRANCHES, GROUND, OBS, EXP_POST,
   ACTIONS, FORMATIONS, RESEARCH_CATS, W_ROLE_TXT, R_STATE_TXT, TUT_CH, TOUCH_LABEL, NOTES) sont déjà enveloppés
   dans `TL(…)` à leur définition. **Ne les enveloppez pas une seconde fois** : `ENEMIES[k].n`, `WEAPONS[w].n`,
   `REGIONS[i].n`… sont déjà traduits ; utilisez-les tels quels comme valeurs d'espaces réservés.
   Ne touchez pas aux `TL(` déjà présents.
7. **Ne traduisez pas** : identifiants et clés d'objets, valeurs `data-act` / `data-id` / `data-tab`, classes CSS,
   couleurs, noms de sons, clés de sauvegarde ou de `localStorage`, champs des messages réseau, expressions régulières,
   `console.log/warn/error`, le nom du jeu « COLOSSE », les numéros de version, les noms de robots et pseudos choisis par
   le joueur, et toute chaîne **comparée** dans la logique (`if (x === 'Libre')`) : traduisez-la seulement au moment de
   l'afficher.
8. **Ne changez pas le comportement** : même logique, même mise en forme du code (pas de reformatage), mêmes
   couleurs, mêmes durées. Les nombres gardent leur mise en forme (`fmt()`, `mmss()`, `toFixed`…) dans la valeur passée.
9. Textes dans des tableaux tirés au hasard (`pick(['…', '…'])`) : enveloppez chaque élément (`pick([TL('…'), TL('…')])`).
10. Dates et nombres localisés : remplacez une locale `'fr-FR'` / `'fr'` codée en dur par `LANG_DEF.loc`.
11. Le nom `L` est déjà pris par des variables locales : n'utilisez que `TL`, `TLn`, `tlList`.
12. Ce qui est affiché sur le canevas (`fillText`, `wLabel`, `msg`, `floatText`, `toast`, `askConfirm`, libellés de
    boutons, `aria-label`, `title`, `placeholder`) est aussi du texte affiché : tout passe par `TL`.

## Vérification

Après chaque fichier : `node --check src/js/NN-fichier.js` (contrôle de syntaxe seul). **Ne lancez pas**
`node outils/construire.js` (d'autres personnes travaillent en parallèle sur d'autres fichiers) et **ne modifiez que
les fichiers qui vous sont confiés**. À la fin, `grep` vos fichiers pour repérer des textes français restés nus
(par exemple `grep -nE "'[^']*[éèàêçù][^']*'" fichier.js | grep -v "TL("`) et traitez-les.
