// Nouveautés : notes de version, montrées une fois après une mise à jour et accessibles depuis l'écran titre.

// ================= NOTES DE VERSION =================
// bal : détail de l'équilibrage, affiché sous la version
const NOTES = [
  { v: '3.0.0', t: TL('Dix langues, opérations et grande rénovation'), items: [
    TL('Dix langues : anglais, chinois, hindi, espagnol, arabe (lu de droite à gauche), français, bengali, portugais, russe et indonésien, chacune avec son drapeau. Le choix se fait au premier lancement, puis à tout moment depuis l\'écran titre ou les réglages.'),
    TL('Opérations : cinq nouveaux contrats qui placent leurs objectifs dans le monde. Escorter un convoi jusqu\'à son dépôt, retrouver et ramener un pilote abattu, saboter les générateurs d\'un avant-poste avant leur verrouillage, défendre une foreuse sous des vagues d\'assaut, traquer une cible d\'élite nommée qui change sans cesse de terrain.'),
    TL('Neuf nouveaux ennemis : Sapeurs kamikazes, Égides qui protègent leurs voisins d\'un bouclier, Réparateurs volants, Ravageurs lance-missiles, Spectres presque invisibles, Nids volants, Obusiers, et deux élites, le Broyeur et l\'Exécuteur. Il y a aussi plus d\'ennemis dans le monde.'),
    TL('Deux difficultés de plus, Enfer et Apocalypse : chacune se débloque par une extraction réussie dans la précédente.'),
    TL('Robots : les pattes se posent au sol et enjambent quand le corps s\'éloigne, chaque arme repose sur un affût visible à la taille de son emplacement, et les armes lourdes font reculer toute la machine.'),
    TL('Le décor garde la trace des combats jusqu\'à la fin du raid : cratères, brûlures, sol vitrifié par les plus grosses explosions, gravats des murs abattus, éclats des machines détruites. Les carcasses abîmées se couvrent de brûlures puis de fentes rougeoyantes.'),
  ], bal: [
    TL('Toutes les difficultés : PV, dégâts et renforts ennemis +10 %, renforts 15 % plus nombreux.'),
    TL('Enfer : PV ×2,5, dégâts ×2,25, butin ×3. Apocalypse : PV ×3,3, dégâts ×2,8, butin ×4,2.'),
    TL('Une opération rapporte de 1,7 à 1,9 fois un contrat de chasse et compte double pour la réputation de la région.'),
  ] },
  { v: '2.1.0', t: TL('Affûts gradués et grands chantiers'), items: [
    TL('Affûts gradués : un tiers des affûts d\'un robot reçoit les armes de sa taille maximale, le tiers suivant une taille en dessous, le reste deux tailles en dessous. Un Colosse porte deux armes titanesques, deux lourdes et deux moyennes. Les robots existants sont réarmés d\'eux-mêmes, et les armes en trop remboursées.'),
    TL('Tous les bâtiments montent jusqu\'au niveau 10 (bureau des contrats, poste d\'expédition et chantier titanesque jusqu\'au niveau 5) : hangar de 300 robots, 6 ouvriers, 5 expéditions à la fois, recherches et géants moins chers, défenses bien plus solides.'),
    TL('Le bureau des contrats, la station radar, l\'entrepôt blindé, la tourelle laser et la tour antiaérienne ont enfin leur propre apparence.'),
    TL('Dézoom : la vue s\'arrête au bord de la carte au lieu de montrer du vide, la base est entourée d\'une friche, les noms et invites ne se chevauchent plus, le sol ne passe plus par de gros pixels et les nuages s\'estompent vus de très haut.'),
    TL('La qualité d\'image baissée automatiquement remonte d\'elle-même quand l\'appareil retrouve de l\'aisance.'),
  ], bal: [
    TL('Les équipes rivales et les renforts fabriqués en raid suivent la même règle d\'affûts.'),
    TL('Attaques de pillards : à partir du QG niveau 6, un Mastodonte de plus par vague (dès la première vague au niveau 8).'),
    TL('Effet mesuré sur 42 raids simulés jusqu\'au rang 4 : presque autant d\'extractions réussies (29 au lieu de 31) et 20 % de butin en plus, mais des flottes moins résistantes : 37 % de pertes en plus, en valeur.'),
  ] },
  { v: '2.0.0', t: TL('Sortie de la phase alpha'), items: [
    TL('Terrains retravaillés : les sols se fondent les uns dans les autres au lieu de former des bords en escalier ; l\'ombrage est continu ; cailloux, touffes d\'herbe et fissures cassent la répétition ; murs, remparts et falaises projettent leur ombre.'),
    TL('Sauvegardes solides : copie de secours automatique, une sauvegarde illisible est mise de côté au lieu d\'être écrasée, et Réglages → Sauvegarde permet d\'exporter ou d\'importer une partie (fichier ou code à copier) pour changer d\'appareil.'),
    TL('Réglages regroupés (affichage, commandes, son) ; mode 30 images par seconde pour économiser la batterie ; caisses ouvertes et pylônes activés d\'un seul appui, au choix ; résolution qui s\'adapte d\'elle-même sur les appareils modestes.'),
    TL('Les confirmations s\'affichent dans le jeu, et un journal des incidents techniques (Réglages → À propos) aide à signaler un problème sans que la partie s\'arrête.'),
    TL('Pendant la fenêtre d\'extraction, la flotte rejoint le cercle d\'elle-même (sauf les robots qui tiennent une position).'),
    TL('Équilibrage de la progression : le détail suit.'),
    TL('Les promotions simultanées tiennent sur une seule ligne, et les morceaux de terrain se préparent à l\'avance : plus d\'à-coups en avançant.'),
    TL('Android : désormais, les mises à jour s\'installent par-dessus la version précédente, sans perdre la partie.'),
  ], bal: [
    TL('Signal de la balise : les vagues de fin de charge sont environ 25 % plus petites, grossissent moins avec la taille de l\'armée et arrivent toutes les 14 s au lieu de 12.'),
    TL('Les robots dans le cercle de la balise se réparent lentement (1,2 % de leurs PV par seconde).'),
    TL('Balise détruite : la nouvelle reprend 40 % de la charge accumulée au lieu de repartir de zéro.'),
    TL('Les Cendres ménagent les premières flottes : tirs ennemis 15 % moins forts et moins de Mastodontes autour des bases militaires.'),
    TL('Laboratoire niveau 5 (géants, armes colossales et apocalyptiques) : coût en Données −20 %, en Noyaux IA −25 %.'),
    TL('Synthétiseur de noyaux : +33 % de production.'),
  ] },
  { v: '1.8.0', t: TL('Une IA qui ne se bloque plus'), items: [
    TL('Les robots calculent un chemin praticable, se dégagent quand ils coincent et ne tirent plus dans les murs.'),
    TL('Le cerveau Récolteur ouvre les caisses et abat cristaux et épaves à distance ; l\'escorte récolte aussi au repos.'),
    TL('Tutoriel à jour, avec une étape « Récolter au tir ».'),
  ] },
  { v: '1.7.0', t: TL('Console de commandement'), items: [
    TL('Nouvelle interface, arbre de recherche par familles, forge interactive et découverte progressive du jeu.'),
  ] },
  { v: '1.6.0', t: TL('Démesure'), items: [
    TL('Géants des rangs 7 à 9, armes colossales et apocalyptiques, renforts fabriqués en raid, zoom étendu.'),
  ] },
  { v: '1.5.0', t: TL('Expéditions'), items: [
    TL('Escouades autonomes qui fouillent et s\'extraient seules, même quand le jeu est fermé ; on peut les suivre en direct depuis la base.'),
  ] },
];
const verCmp = (a, b) => { const A = String(a).split('.').map(Number), Bv = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((A[i] || 0) !== (Bv[i] || 0)) return (A[i] || 0) - (Bv[i] || 0); return 0; };
function renderNotes(since) {
  const L = NOTES.filter(n => !since || verCmp(n.v, since) > 0), older = NOTES.filter(n => since && verCmp(n.v, since) <= 0);
  const block = n => `<div class="note-v"><div class="note-h"><b>${esc(n.v)}</b><span>${esc(n.t)}</span></div><ul class="tl">${n.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${n.bal ? `<div class="note-h note-sub"><span>Détail de l'équilibrage</span></div><ul class="tl">${n.bal.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
  $('#notesBox').innerHTML = `<h3>${since ? 'Mise à jour' : 'Nouveautés'}</h3><p>Colosse ${esc(VERSION)}${since ? ` : voici ce qui a changé depuis la version ${esc(since)}.` : '.'}</p>
    ${(L.length ? L : NOTES).map(block).join('')}
    ${older.length ? `<details class="note-old"><summary>Versions précédentes</summary>${older.map(block).join('')}</details>` : ''}
    <div class="btns"><button class="btn hot" data-act="closenotes">Fermer</button></div>`;
}
function openNotes(since) { renderNotes(since); showOverlay('notes', true); }
// après une mise à jour, une seule fois, pour les joueurs qui ont déjà une partie
function maybeShowNotes() {
  const seen = settings.seenVer, played = save.stats.raids > 0 || save.robots.length > 2 || Object.keys(save.research).length > 0;
  if (seen !== VERSION) { settings.seenVer = VERSION; saveSettings(); }
  if (TUT.on || saveNotice) return;
  if (seen ? verCmp(seen, VERSION) < 0 : played) openNotes(seen || '1.8.0');
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'notes') openNotes(null);
  else if (el.dataset.act === 'closenotes') showOverlay('notes', false);
});
window.addEventListener('keydown', e => { if (e.code === 'Escape' && $('#notes').classList.contains('on')) { e.preventDefault(); e.stopImmediatePropagation(); showOverlay('notes', false); } }, true);
