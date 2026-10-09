// Nouveautés : notes de version, montrées une fois après une mise à jour et accessibles depuis l'écran titre.

// ================= NOTES DE VERSION =================
const NOTES = [
  { v: '2.0.0', t: 'Sortie de la phase alpha', items: [
    'Terrains retravaillés : les sols se fondent les uns dans les autres au lieu de former des bords en escalier ; l\'ombrage est continu ; cailloux, touffes d\'herbe et fissures cassent la répétition ; murs, remparts et falaises projettent leur ombre.',
    'Sauvegardes solides : copie de secours automatique, une sauvegarde illisible est mise de côté au lieu d\'être écrasée, et Réglages → Sauvegarde permet d\'exporter ou d\'importer une partie (fichier ou code à copier) pour changer d\'appareil.',
    'Réglages regroupés (affichage, commandes, son) ; mode 30 images par seconde pour économiser la batterie ; caisses ouvertes et pylônes activés d\'un seul appui, au choix ; résolution qui s\'adapte d\'elle-même sur les appareils modestes.',
    'Les confirmations s\'affichent dans le jeu, et un journal des incidents techniques (Réglages → À propos) aide à signaler un problème sans que la partie s\'arrête.',
    'Pendant la fenêtre d\'extraction, la flotte rejoint le cercle d\'elle-même (sauf les robots qui tiennent une position).',
    'Équilibrage de la progression : le détail suit.',
    'Les promotions simultanées tiennent sur une seule ligne, et les morceaux de terrain se préparent à l\'avance : plus d\'à-coups en avançant.',
    'Android : désormais, les mises à jour s\'installent par-dessus la version précédente, sans perdre la partie.',
  ] },
  { v: '1.8.0', t: 'Une IA qui ne se bloque plus', items: [
    'Les robots calculent un chemin praticable, se dégagent quand ils coincent et ne tirent plus dans les murs.',
    'Le cerveau Récolteur ouvre les caisses et abat cristaux et épaves à distance ; l\'escorte récolte aussi au repos.',
    'Tutoriel à jour, avec une étape « Récolter au tir ».',
  ] },
  { v: '1.7.0', t: 'Console de commandement', items: [
    'Nouvelle interface, arbre de recherche par familles, forge interactive et découverte progressive du jeu.',
  ] },
  { v: '1.6.0', t: 'Démesure', items: [
    'Géants des rangs 7 à 9, armes colossales et apocalyptiques, renforts fabriqués en raid, zoom étendu.',
  ] },
  { v: '1.5.0', t: 'Expéditions', items: [
    'Escouades autonomes qui fouillent et s\'extraient seules, même quand le jeu est fermé ; on peut les suivre en direct depuis la base.',
  ] },
];
const BALANCE_NOTES = [
  'Signal de la balise : les vagues de fin de charge sont environ 25 % plus petites, grossissent moins avec la taille de l\'armée et arrivent toutes les 14 s au lieu de 12.',
  'Les robots dans le cercle de la balise se réparent lentement (1,2 % de leurs PV par seconde).',
  'Balise détruite : la nouvelle reprend 40 % de la charge accumulée au lieu de repartir de zéro.',
  'Les Cendres ménagent les premières flottes : tirs ennemis 15 % moins forts et moins de Mastodontes autour des bases militaires.',
  'Laboratoire niveau 5 (géants, armes colossales et apocalyptiques) : coût en Données −20 %, en Noyaux IA −25 %.',
  'Synthétiseur de noyaux : +33 % de production.',
];
const verCmp = (a, b) => { const A = String(a).split('.').map(Number), Bv = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((A[i] || 0) !== (Bv[i] || 0)) return (A[i] || 0) - (Bv[i] || 0); return 0; };
function renderNotes(since) {
  const L = NOTES.filter(n => !since || verCmp(n.v, since) > 0), older = NOTES.filter(n => since && verCmp(n.v, since) <= 0);
  const block = n => `<div class="note-v"><div class="note-h"><b>${esc(n.v)}</b><span>${esc(n.t)}</span></div><ul class="tl">${n.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  const bal = typeof BALANCE_NOTES !== 'undefined' && L.some(n => n.v === '2.0.0') ? `<div class="note-v"><div class="note-h"><b>2.0.0</b><span>Détail de l'équilibrage</span></div><ul class="tl">${BALANCE_NOTES.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  $('#notesBox').innerHTML = `<h3>${since ? 'Mise à jour' : 'Nouveautés'}</h3><p>Colosse ${esc(VERSION)}${since ? ` : voici ce qui a changé depuis la version ${esc(since)}.` : '.'}</p>
    ${(L.length ? L : NOTES).map(block).join('')}${bal}
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
