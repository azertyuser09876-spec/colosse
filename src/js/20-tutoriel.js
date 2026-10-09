// Tutoriel jouable, dans une partie d'entraînement à part.

// ================= TUTORIEL JOUABLE =================
// Une partie d'entraînement à part : sauvegarde séparée (TUT_KEY), rien n'est envoyé au serveur ni publié.
// Le joueur apprend en jouant, étape par étape ; à la fin, il garde cette partie (elle remplace la sienne)
// ou la supprime et retrouve sa partie intacte.
let MOVE_KEYS = '';
try { if (navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then(m => { const k = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].map(c => (m.get(c) || '').toUpperCase()).join(''); if (/^[A-Z]{4}$/.test(k)) MOVE_KEYS = k; }).catch(() => { }); } catch (e) { }
const tK = a => '<kbd>' + esc(keyLabel(a)) + '</kbd>';
const tMove = () => TOUCH.on ? 'le <b>joystick gauche</b>' : (MOVE_KEYS ? MOVE_KEYS.split('').map(k => '<kbd>' + k + '</kbd>').join('') : '<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> (<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> en QWERTY)') + ' ou les flèches';
const tClick = () => TOUCH.on ? 'Touchez' : 'Cliquez sur';
const tDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const tBld = type => { const b = save.base.b.filter(x => x.type === type).sort((p, q) => q.id - p.id)[0]; if (!b || state !== 'base') return null; const r = bRect(b); return { x: r.x + r.w / 2, y: r.y + r.h / 2, r: Math.max(r.w, r.h) / 2 + 18, lbl: BUILD[type].n }; };
const tAlive = () => fleet.filter(r => !r.dead);
const tHub = (tab, sel) => !drawerOpen ? (TOUCH.on ? '[data-tk=base]' : '#baseBar [data-id=' + tab + ']') : hubTab !== tab ? '#hubNav [data-tab=' + tab + ']' : sel;
const tProgress = s => !!s && (s.stats.raids > 0 || s.robots.length > 2 || Object.keys(s.research).length > 0 || s.base.b.length > 8);
const tSummary = s => `${s.stats.raids} raid${s.stats.raids > 1 ? 's' : ''}, ${s.robots.length} robot${s.robots.length > 1 ? 's' : ''}, ${Object.keys(s.research).length} recherche${Object.keys(s.research).length > 1 ? 's' : ''}`;
const TUT_CH = { A: 'À la base', B: 'En raid', C: 'Gérer la base' };

Object.assign(TUT, {
  i: 0, st: {}, doneT: 0, uiT: 0, dynKey: '', touch: null, min: false, scrolled: new Set(), prev: null,
  hits: 0, pilotHits: 0, dashes: 0, collected: 0, raidOk: null, r0: 2, t0: 1, re0: 0,
  items: [], crate: null, pylon: null, foes: [], bastion: null, mark: null, spot: null, msgY: 0, leftY: 0, res: [],

  steps: [
    // ---------- chapitre A : à la base ----------
    { id: 'welcome', ch: 'A', t: 'Bienvenue, pilote', next: 'C\'est parti',
      x: () => `Ce tutoriel se joue dans une <b>partie à part</b> : votre vraie partie n'est pas touchée. À la fin, vous choisirez de <b>garder</b> cette partie d'entraînement ou de la <b>supprimer</b>.</p><p>Au programme : se battre, piloter un robot, commander la flotte, réussir une extraction, puis construire, rechercher et défendre la base. Comptez une dizaine de minutes.` },
    { id: 'move', ch: 'A', t: 'Se déplacer', where: 'base',
      x: () => `Déplacez votre pilote avec ${tMove()} jusqu'au <b>champ de tir</b>, là où pointe la flèche jaune.${TOUCH.on ? ' Deux doigts pour zoomer.' : ' La molette zoome.'}`,
      tg() { const b = tBld('range'); return b ? { x: b.x, y: b.y - 130, r: 70, lbl: 'Champ de tir' } : null; },
      ok() { const g = this.tg(); return !g || tDist(focus(), g) < 190; } },
    { id: 'shoot', ch: 'A', t: 'Viser et tirer', where: 'base',
      go() { TUT.hits = 0; },
      x: () => TOUCH.on ? 'Poussez le <b>joystick droit</b> vers une cible : un peu pour viser, plus loin pour tirer. Touchez les cibles d\'entraînement.'
        : `Visez avec la souris et <b>maintenez le clic gauche</b> pour tirer sur les cibles. Le chargeur se recharge seul quand il est vide, ou avec ${tK('reload')}.`,
      prog: () => `Touches : ${Math.min(12, TUT.hits)} / 12`,
      tg() { const b = tBld('range'); return b ? { x: b.x, y: b.y - 110, r: 90, lbl: 'Cibles' } : null; },
      ok: () => TUT.hits >= 12 },
    { id: 'dash', ch: 'A', t: 'Esquiver', where: 'base',
      go() { TUT.dashes = 0; },
      x: () => `${tK('dash')} fait faire un bond rapide au pilote, dans la direction où il avance. Pendant ce bond, il est <b>intouchable</b> : c'est le bon réflexe face aux tirs lourds. Esquivez deux fois.`,
      hl: () => TOUCH.on ? '[data-tk=dash]' : null,
      prog: () => `Esquives : ${Math.min(2, TUT.dashes)} / 2`,
      ok: () => TUT.dashes >= 2 },
    { id: 'pilot', ch: 'A', t: 'Piloter un robot', where: 'base',
      go() { TUT.pilotHits = 0; this.st = {}; },
      x: () => `Vos robots attendent près du hangar. Approchez-vous de l'un d'eux et appuyez sur ${tK('pilot')} pour <b>monter à bord</b> : vous le conduisez comme le pilote, et ses armes tirent là où vous visez. Faites-lui toucher les cibles, puis ${tK('pilot')} pour ressortir.`,
      hl: () => TOUCH.on ? '[data-tk=pilot]' : null,
      tick() { if (player.inside) this.st.inside = true; if (this.st.inside && TUT.pilotHits >= 6 && !player.inside) this.st.out = true; },
      list() { return [['Monter à bord d\'un robot', !!this.st.inside], ['Toucher les cibles avec lui (' + Math.min(6, TUT.pilotHits) + ' / 6)', TUT.pilotHits >= 6], ['Ressortir', !!this.st.out]]; },
      tg() {
        if (!player.inside) { let best = null, bd = Infinity; for (const r of tAlive()) { const q = tDist(r, player); if (q < bd) { bd = q; best = r; } } return best ? { x: best.x, y: best.y, r: best.r + 18, lbl: best.name } : null; }
        if (TUT.pilotHits < 6) { const b = tBld('range'); return b ? { x: b.x, y: b.y - 110, r: 90, lbl: 'Cibles' } : null; }
        return null;
      },
      ok() { return !!this.st.out; } },
    { id: 'forge', ch: 'A', t: 'La forge', where: 'base',
      x: () => `Les robots s'assemblent à la <b>forge</b>. Approchez-vous-en et appuyez sur ${tK('interact')} pour l'ouvrir. ${TOUCH.on ? 'Vous pouvez aussi toucher deux fois un bâtiment.' : 'Vous pouvez aussi cliquer deux fois sur un bâtiment.'}`,
      hl: () => drawerOpen ? '#hubNav [data-tab=atelier]' : TOUCH.on ? '[data-tk=act]' : null,
      tg: () => drawerOpen ? null : tBld('forge'),
      ok: () => drawerOpen && hubTab === 'atelier' },
    { id: 'assemble', ch: 'A', t: 'Assembler un robot', where: 'base',
      x: () => `Choisissez un <b>châssis</b> dans la bande du haut (le Rampeur est un bon début). ${tClick()} un <b>affût</b> sur l'aperçu du robot, ou dans la liste, puis une <b>arme</b> dans l'armurerie.${TOUCH.on ? '' : ' Survolez une arme pour comparer ses caractéristiques avec l\'arme en place.'} Le coût s'affiche sous les caractéristiques. ${tClick()} <b>« Assembler le robot »</b>.`,
      hl: () => drawerOpen ? (hubTab === 'atelier' ? '[data-act=build]' : '#hubNav [data-tab=atelier]') : TOUCH.on ? '[data-tk=base]' : '#baseBar [data-id=atelier]',
      prog: () => drawerOpen ? '' : 'Rouvrez la forge pour continuer.',
      ok: () => save.robots.length > TUT.r0 },
    { id: 'hangar', ch: 'A', t: 'Le hangar', where: 'base',
      x: () => `Ouvrez l'onglet <b>Hangar</b> : toute votre flotte y est rangée. Les filtres en haut trient les robots déployés, en réserve ou abîmés.`,
      hl: () => tHub('hangar', null),
      ok: () => drawerOpen && hubTab === 'hangar' },
    { id: 'deploy', ch: 'A', t: 'Déployer', where: 'base', next: 'Compris',
      x: () => `L'interrupteur <b>« Déployé »</b> choisit qui part en raid avec vous. Chaque robot coûte des points de <b>commandement</b> (la jauge en haut) : le QG, les relais et la recherche en ajoutent. Un robot détruit, ou resté hors du cercle d'extraction, est perdu avec son chargement. Votre nouveau robot est déjà déployé.</p><p>« <b>Réglages</b> », sous chaque carte, change son cerveau, son groupe et son mode de tir ; « Réaménager » le renvoie à la forge sans perdre son expérience.`,
      hl: () => drawerOpen && hubTab === 'hangar' ? '[data-act=deploy]' : null },
    { id: 'launch', ch: 'A', t: 'Partir en raid', where: 'base',
      x: () => `Ouvrez l'onglet <b>« Partir en raid »</b>, puis ${TOUCH.on ? 'touchez' : 'cliquez sur'} <b>« Lancer le raid »</b>. Pour l'entraînement, ce sera les Cendres, en difficulté Recrue.`,
      hl: () => tHub('raid', '[data-act=launch]'),
      ok: () => state === 'raid',
      skip() { if (state === 'base' && !attack) { closeDrawer(true); leaveBase(); startRaid(); } } },

    // ---------- chapitre B : en raid ----------
    { id: 'arrive', ch: 'B', t: 'En raid', where: 'raid', next: 'Compris',
      x: () => `Chaque raid se déroule dans un nouveau monde de 12 km². Le principe : <b>fouiller</b>, puis poser la <b>balise d'ancrage</b> et la défendre jusqu'à l'<b>extraction</b>. Seul ce qui est extrait rentre à la base.</p><p>En haut à gauche : l'objectif et l'alerte, qui monte avec le temps. En haut à droite : la minicarte.` },
    { id: 'loot', ch: 'B', t: 'Ramasser le butin', where: 'raid',
      x: () => `De la ferraille traîne devant vous. Passez dessus : elle va dans votre <b>sac</b> (${TOUCH.on ? 'en haut à gauche' : 'en bas à gauche'}). Plus il est lourd, plus vous ralentissez. Quand il est plein, vos robots à soute prennent le reste.`,
      prog: () => `Ferraille ramassée : ${TUT.items.filter(i => i.dead).length} / ${TUT.items.length}`,
      tg() { const it = TUT.items.find(i => !i.dead); return it ? { x: it.x, y: it.y, r: 34, lbl: 'Ferraille' } : null; },
      ok: () => TUT.items.length === 0 || TUT.items.filter(i => i.dead).length >= Math.min(5, TUT.items.length) },
    { id: 'crate', ch: 'B', t: 'Fouiller une caisse', where: 'raid',
      x: () => `Les caisses contiennent ferraille, circuits, alliage et données. Placez-vous contre la caisse et <b>maintenez ${tK('interact')}</b> jusqu'à ce que le cercle se remplisse, puis ramassez ce qui tombe.`,
      hl: () => TOUCH.on ? '[data-tk=act]' : null,
      tg: () => TUT.crate && !TUT.crate.open ? { x: TUT.crate.x, y: TUT.crate.y, r: 38, lbl: 'Caisse' } : null,
      ok: () => !TUT.crate || TUT.crate.open },
    { id: 'harvest', ch: 'B', t: 'Récolter au tir', where: 'raid',
      go() { TUT.spawnHarvest(); },
      x: () => `Les <b>cristaux</b> violets et les <b>épaves</b> se démontent au tir : visez-les et tirez pour en faire tomber cristaux, ferraille et alliage, puis ramassez le tout. Quand la flotte est au repos, sans ennemi en vue, vos robots s'y mettent aussi. Au hangar, le cerveau <b>Récolteur</b> en fait sa spécialité : il ouvre même les caisses.`,
      prog: () => `Démontés : ${TUT.res.filter(([x, y]) => !W.obs[y * WT + x]).length} / ${TUT.res.length}`,
      tg() { const F = focus(); let best = null, bd = Infinity; for (const [x, y] of TUT.res) { const o = W.obs[y * WT + x]; if (!o) continue; const g = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, r: 30, lbl: o === 5 ? 'Épave' : 'Cristal' }, q = tDist(g, F); if (q < bd) { bd = q; best = g; } } return best; },
      ok: () => TUT.res.every(([x, y]) => !W.obs[y * WT + x]),
      skip() { for (const [x, y] of TUT.res) if (W.obs[y * WT + x]) hitTile(x, y, 1e6); } },
    { id: 'map', ch: 'B', t: 'La carte', where: 'raid',
      go() { this.st = {}; },
      x: () => `Appuyez sur ${tK('map')} pour ouvrir la <b>carte du monde</b> : la zone explorée, vos robots, les bases militaires et les <b>pylônes relais</b> (carrés jaunes). Rappuyez sur ${tK('map')} pour la fermer.${TOUCH.on ? '' : ' Sur la carte, un clic droit envoie la flotte au loin.'}`,
      hl: () => TOUCH.on ? '[data-tk=map]' : null,
      tick() { if (mapOpen) this.st.open = true; },
      list() { return [['Ouvrir la carte', !!this.st.open], ['La refermer', !!this.st.open && !mapOpen]]; },
      ok() { return this.st.open && !mapOpen; } },
    { id: 'fight', ch: 'B', t: 'Premier combat', where: 'raid',
      go() { TUT.spawnFoes(); },
      x: () => `Des <b>rôdeurs</b> approchent ! Tirez-leur dessus. Vos robots ripostent tout seuls : ils escortent le pilote, visent ce qui le menace et se déplacent pour garder une <b>ligne de tir dégagée</b>. Les flèches rouges autour du pilote montrent d'où viennent les tirs.`,
      prog: () => `Rôdeurs abattus : ${TUT.foes.filter(e => e.dead).length} / ${TUT.foes.length}`,
      tg() { let best = null, bd = Infinity; for (const e of TUT.foes) { if (e.dead) continue; const q = tDist(e, focus()); if (q < bd) { bd = q; best = e; } } return best ? { x: best.x, y: best.y, r: best.r + 14, lbl: 'Rôdeur', col: '#ff6b74' } : null; },
      ok: () => TUT.foes.every(e => e.dead) },
    { id: 'select', ch: 'B', t: 'Sélectionner des robots', where: 'raid', robots: true,
      x: () => TOUCH.on ? 'Touchez un robot pour le <b>sélectionner</b> (il s\'entoure d\'un cercle), ou ouvrez <kbd>Flotte</kbd> puis « Tout sélect. ». En mode <kbd>Tactique</kbd>, glissez le doigt pour en encadrer plusieurs.'
        : `Appuyez sur ${tK('tactical')} : le <b>mode tactique</b> ralentit le temps et dézoome. Cliquez-glissez pour <b>encadrer</b> vos robots. Raccourcis : ${tK('selectAll')} sélectionne toute la flotte, et un clic sur leurs cartes en bas de l'écran marche aussi.`,
      hl: () => TOUCH.on ? '[data-tk=fleet], [data-tk=f-all], [data-tk=tactical]' : null,
      prog: () => `Robots sélectionnés : ${fleet.filter(r => r.sel && !r.dead).length}`,
      ok: () => fleet.filter(r => r.sel && !r.dead).length >= Math.min(2, tAlive().length) },
    { id: 'order', ch: 'B', t: 'Donner un ordre', where: 'raid', robots: true,
      go() { TUT.mark = TUT.sidePoint(focus(), 260, 330); },
      x: () => TOUCH.on ? 'Touchez le sol au <b>marqueur</b> : les robots sélectionnés s\'y rendent.'
        : `<b>Clic droit</b> sur le marqueur : la sélection s'y rend, en formation (${tK('formation')} change la formation). Sans sélection, toute la flotte obéit. Maj + clic droit enchaîne des points de passage.`,
      prog: () => fleet.some(r => r.sel && !r.dead) ? '' : 'Plus aucun robot sélectionné : sélectionnez-en de nouveau.',
      tg: () => TUT.mark ? { x: TUT.mark.x, y: TUT.mark.y, r: 60, lbl: 'Envoyez vos robots ici' } : null,
      ok: () => !TUT.mark || tAlive().some(r => r.order && (r.order.type === 'move' || r.order.type === 'hold') && tDist(r.order, TUT.mark) < 260 && tDist(r, TUT.mark) < 280) },
    { id: 'follow', ch: 'B', t: 'Rappeler la flotte', where: 'raid', robots: true,
      x: () => TOUCH.on ? 'Ouvrez <kbd>Flotte</kbd> et touchez « <b>Me suivre</b> » : vos robots reviennent vous escorter. « Tenir » les fait garder leur position, « Autonomie » les laisse chasser seuls.'
        : `Appuyez sur ${tK('follow')} : vos robots reviennent vous <b>escorter</b>. ${tK('hold')} les fait tenir leur position, ${tK('auto')} les laisse chasser seuls.`,
      hl: () => TOUCH.on ? '[data-tk=fleet], [data-tk=f-follow]' : null,
      prog: () => !TOUCH.on && tactical ? 'Pensez à quitter le mode tactique avec ' + tK('tactical') + '.' : '',
      ok: () => tAlive().some(r => r.order && r.order.type === 'follow') },
    { id: 'attack', ch: 'B', t: 'Ordre d\'attaque', where: 'raid', robots: true,
      go() { this.st = {}; TUT.spawnBastion(); },
      x: () => `Une tourelle ennemie, un <b>Bastion</b>, garde la zone. Elle tire de loin : envoyez vos robots. ${TOUCH.on ? 'Sélectionnez-les puis touchez la tourelle' : '<b>Clic droit</b> sur la tourelle'} pour ordonner l'attaque, et soutenez-les. Reculez si vos PV baissent : ils remontent hors du combat.`,
      tick() { if (TUT.bastion && tAlive().some(r => r.order && r.order.type === 'attack' && r.order.t === TUT.bastion)) this.st.ord = true; },
      list() { return [['Ordonner l\'attaque', !!this.st.ord], ['Détruire le Bastion', !TUT.bastion || TUT.bastion.dead]]; },
      tg: () => TUT.bastion && !TUT.bastion.dead ? { x: TUT.bastion.x, y: TUT.bastion.y, r: TUT.bastion.r + 22, lbl: 'Bastion', col: '#ff6b74' } : null,
      ok: () => !TUT.bastion || TUT.bastion.dead },
    { id: 'pylon', ch: 'B', t: 'Pylône relais', where: 'raid',
      x: () => `Activez le <b>pylône relais</b> : placez-vous à côté et maintenez ${tK('interact')}. Il révèle la carte autour de lui et donne des données. Surtout, la balise d'ancrage charge <b>2,5 fois plus vite</b> à sa portée.`,
      hl: () => TOUCH.on ? '[data-tk=act]' : null,
      tg: () => TUT.pylon && !TUT.pylon.active ? { x: TUT.pylon.x, y: TUT.pylon.y, r: 44, lbl: 'Pylône relais' } : null,
      ok: () => !TUT.pylon || TUT.pylon.active },
    { id: 'beacon', ch: 'B', t: 'Poser la balise', where: 'raid',
      x: () => `Restez près du pylône et posez la <b>balise d'ancrage</b> avec ${tK('beacon')}. Elle lance l'extraction, mais son signal attire les hostiles des environs. Pour la reprendre, revenez dessus et rappuyez sur ${tK('beacon')} : la charge est alors perdue.`,
      hl: () => TOUCH.on ? '[data-tk=beacon]' : null,
      tg: () => TUT.pylon ? { x: TUT.pylon.x, y: TUT.pylon.y, r: 340, lbl: 'Portée du pylône', thin: true } : null,
      ok: () => B && (B.state === 'charging' || B.state === 'window' || B.state === 'lift'),
      skip() { if (B && B.state === 'carried') toggleBeacon(); } },
    { id: 'defend', ch: 'B', t: 'Défendre la balise', where: 'raid',
      x: () => `Tenez jusqu'à 100 % ! Régulièrement, le signal attire des ennemis vers la balise. ${TOUCH.on ? '<kbd>Flotte</kbd> → « Défendre balise »' : tK('defend')} envoie la flotte la protéger. Les robots dans son cercle se réparent lentement. Détruite, elle se réimprime en 22 s et garde 40 % de sa charge.`,
      hl: () => TOUCH.on ? '[data-tk=fleet], [data-tk=f-beacon]' : null,
      prog: () => !B ? '' : B.state === 'charging' ? 'Ancrage : ' + Math.floor(B.charge * 100) + ' %' + (B.unit && nearPylon(B.unit.x, B.unit.y) ? ' · pylône ×2,5' : '') : B.state === 'broken' ? 'Balise détruite : réimpression dans ' + Math.ceil(B.cd) + ' s.' : B.state === 'carried' ? 'Reposez la balise avec ' + tK('beacon') + '.' : '',
      tg: () => B && B.unit ? { x: B.unit.x, y: B.unit.y, r: 40, lbl: 'Balise' } : null,
      ok: () => B && (B.state === 'window' || B.state === 'lift'),
      skip() { if (B && B.state === 'charging') B.charge = .999; } },
    { id: 'extract', ch: 'B', t: 'Extraction', where: 'raid',
      x: () => `La fenêtre reste ouverte <b>16 secondes</b> : entrez dans le <b>cercle jaune</b>. Vos robots le rejoignent d'eux-mêmes, sauf ceux qui tiennent une position : ${TOUCH.on ? '« Défendre balise »' : tK('defend')} les rappelle aussi. Ceux qui restent dehors sont perdus.`,
      prog() {
        if (!B) return '';
        if (B.state === 'window' && B.unit) { const al = tAlive(), n = al.filter(r => tDist(r, B.unit) < ZONE_R + r.r * .5).length; return `Fenêtre : ${Math.ceil(B.windowT)} s · robots dans le cercle : ${n} / ${al.length}` + (tDist(focus(), B.unit) < ZONE_R ? '' : ' · <b>le pilote doit y être aussi</b>'); }
        if (B.state === 'charging') return 'Fenêtre manquée : la balise se recharge, restez près d\'elle.';
        return '';
      },
      tg: () => B && B.unit ? { x: B.unit.x, y: B.unit.y, r: ZONE_R, lbl: 'Cercle d\'extraction', thin: true } : null,
      ok: () => state === 'result',
      skip() { if (state === 'raid' && B && B.unit && B.state !== 'lift') { endExtracted = tAlive(); endSuccess = true; endT = .2; B.state = 'lift'; } } },
    { id: 'result', ch: 'B', t: 'Retour à la base',
      x: () => `${TUT.raidOk === false ? 'Le raid a échoué : en vrai, le butin transporté et les robots déployés seraient perdus.' : 'Extraction réussie ! Le butin rapporté s\'ajoute à vos stocks, et les robots rentrés gagnent de l\'expérience : avec les combats, ils montent en grade et gagnent des traits.'} ${tClick()} <b>« Retour à la base »</b>.`,
      hl: () => '[data-act=tohub]',
      ok: () => state === 'base',
      skip() { if (state === 'result') { showOverlay('result', false); enterBase(); } } },

    // ---------- chapitre C : gérer la base ----------
    { id: 'collect', ch: 'C', t: 'Récolter', where: 'base',
      go() { this.st = { c0: TUT.collected }; const b = save.base.b.find(x => x.type === 'scrapper'); if (b) { b.lastT = Date.now(); b.stored = Math.min(prodCap(b), Math.max(b.stored || 0, 40)); } },
      x: () => `Les bâtiments de production travaillent en continu, même pendant vos raids. Le <b>collecteur de ferraille</b> a fait le plein : passez juste à côté pour récolter${TOUCH.on ? '' : ', ou cliquez dessus puis « Récolter »'}.`,
      tg: () => drawerOpen ? null : tBld('scrapper'),
      ok() { return TUT.collected > this.st.c0; } },
    { id: 'build', ch: 'C', t: 'Construire', where: 'base',
      x: () => `Ouvrez la construction : ${TOUCH.on ? 'bouton <kbd>Base</kbd>' : tK('defend') + ' ou le bouton « Construire »'}. Dans « Défenses », trouvez la <b>Tourelle mitrailleuse</b> et ${TOUCH.on ? 'touchez' : 'cliquez sur'} « Placer ».`,
      hl: () => tHub('construire', '[data-act=place][data-id=turret_mg]'),
      ok: () => (placing && placing.type === 'turret_mg' && !placing.id) || countType('turret_mg') > TUT.t0 },
    { id: 'place', ch: 'C', t: 'Poser la tourelle', where: 'base',
      go() { const F = focus(); TUT.spot = TUT.findSpot('turret_mg', ((F.x / TILE) | 0) + 1, ((F.y / TILE) | 0) + 2); },
      x: () => TOUCH.on ? 'Touchez le sol pour poser la tourelle : la zone est <b>verte</b> quand l\'emplacement est libre. Le marqueur propose une place libre près de vous. « Terminer la pose » annule.'
        : 'Déplacez la souris : la zone devient <b>verte</b> quand l\'emplacement est libre. <b>Clic gauche</b> pour poser, clic droit ou Échap pour annuler. Le marqueur propose une place libre près de vous.',
      tg: () => TUT.spot ? { x: TUT.spot.x, y: TUT.spot.y, r: 52, lbl: 'Emplacement conseillé' } : null,
      tick() { if (!placing && countType('turret_mg') <= TUT.t0) { this.st.lost = (this.st.lost || 0) + 1; if (this.st.lost > 20) TUT.go(TUT.idx('build')); } else this.st.lost = 0; },
      ok: () => countType('turret_mg') > TUT.t0 },
    { id: 'wait', ch: 'C', t: 'Travaux en cours', where: 'base',
      x: () => `Les constructions prennent du temps, et avancent même pendant vos raids. Le nombre de chantiers simultanés dépend des <b>ouvriers</b> (en haut à droite) : améliorer le QG en ajoute. Cliquer sur un bâtiment permet aussi de l'<b>améliorer</b> ou de le <b>déplacer</b>.`,
      prog() { const b = save.base.b.filter(x => x.type === 'turret_mg').sort((p, q) => q.id - p.id)[0]; return b && b.busy ? 'Fin des travaux dans ' + Math.max(1, Math.ceil((b.busy - Date.now()) / 1000)) + ' s' : ''; },
      tg: () => tBld('turret_mg'),
      ok() { const b = save.base.b.filter(x => x.type === 'turret_mg').sort((p, q) => q.id - p.id)[0]; return !b || (b.lvl >= 1 && !b.busy); },
      skip() { const b = save.base.b.filter(x => x.type === 'turret_mg').sort((p, q) => q.id - p.id)[0]; if (b && b.busy) { b.busy = Date.now(); baseTimers(); } } },
    { id: 'research', ch: 'C', t: 'Recherche', where: 'base',
      x: () => `Ouvrez le <b>laboratoire</b> (${tK('interact')} à côté) ou l'onglet Recherche. Les technologies sont rangées par <b>familles</b> (les onglets du haut) et progressent de gauche à droite ; les <b>silhouettes</b> annoncent ce qui suivra. Choisissez une technologie encadrée en orange, par exemple <b>Châssis Fourmi</b>, puis « Rechercher ». Les <b>données</b> qu'elles coûtent viennent des caisses, des pylônes et des ennemis.`,
      hl: () => tHub('recherche', rSel && !has(rSel) ? '#rdetail [data-act=research]' : '[data-act=rsel][data-id=c_ant]'),
      tg: () => drawerOpen ? null : tBld('lab'),
      ok: () => Object.keys(save.research).length > TUT.re0 },
    { id: 'provoke', ch: 'C', t: 'Défendre la base', where: 'base',
      x: () => `Chaque extraction fait monter la <b>menace</b> (en haut à droite) : au-delà de 60 %, des pillards attaquent la base à votre retour. Entraînez-vous dès maintenant : ${TOUCH.on ? 'touchez' : 'cliquez'} <b>une fois</b> sur le <b>QG</b>, puis sur « Provoquer une attaque ».`,
      prog: () => drawerOpen ? 'Fermez d\'abord ce menu pour voir la base.' : '',
      hl: () => drawerOpen ? '.hub-close' : '[data-act=provoke]',
      tg: () => drawerOpen || baseSel ? null : tBld('hq'),
      ok: () => !!attack,
      skip() { if (!attack && state === 'base') { closeDrawer(true); scheduleAttack(15, 'Entraînement : des pillards approchent !'); } } },
    { id: 'defense', ch: 'C', t: 'Repousser l\'attaque', where: 'base',
      x: () => `Les pillards arrivent en trois vagues. Vos <b>tourelles</b> et vos robots stationnés défendent seuls : aidez-les avec votre pilote, ou montez dans un robot. Si le QG tombe, une partie de vos stocks est volée.`,
      prog: () => attack ? (attack.phase === 'warn' ? 'Arrivée dans ' + Math.ceil(attack.t) + ' s' : 'Vague ' + attack.wave + ' / ' + attack.waves.length + ' · ' + attack.alive + ' assaillants') : $('#result').classList.contains('on') ? tClick() + ' « Continuer ».' : '',
      hl: () => attack ? null : '[data-act=closeattack]',
      tg() { if (!attack || attack.phase !== 'fight') return null; let best = null, bd = Infinity; for (const e of units) { if (!e.baseRaid || e.dead) continue; const q = tDist(e, focus()); if (q < bd) { bd = q; best = e; } } return best ? { x: best.x, y: best.y, r: best.r + 12, lbl: 'Pillards', col: '#ff6b74' } : null; },
      ok: () => !attack && !$('#result').classList.contains('on'),
      skip() { if (attack) endAttack(true); } },
    { id: 'contracts', ch: 'C', t: 'Contrats', where: 'base',
      x: () => `Dernier point : ouvrez « Partir en raid ». Les <b>contrats</b> proposent des objectifs payés : chasser, rapporter des ressources, activer des pylônes… ${TOUCH.on ? 'Touchez-en un' : 'Cliquez sur l\'un d\'eux'} pour l'accepter (deux au plus par raid). Trois contrats remplis dans une région, ou son boss abattu, débloquent la région suivante.`,
      hl: () => tHub('raid', '.contract'),
      ok: () => save.active.length > 0 },
    { id: 'end', ch: 'C', t: 'Vous êtes prêt', next: 'Terminer le tutoriel',
      x: () => `Quelques commandes de plus pour la suite :</p><ul class="tl">${TOUCH.on ? '<li><kbd>Flotte</kbd> : formations, patrouilles et autonomie.</li><li><kbd>Capacité</kbd> : déclenche les modules actifs de la sélection.</li>'
        : `<li><kbd>Maj</kbd> + <kbd>1</kbd> à <kbd>5</kbd> : créer un groupe · <kbd>1</kbd> à <kbd>5</kbd> : le sélectionner.</li><li>${tK('formation')} formation · ${tK('patrol')} patrouille · ${tK('ability')} capacités des modules.</li><li>${tK('wmode')} en pilotage : armes manuelles ou automatiques (un clic sur une arme la bascule seule).</li><li>${tK('help')} : toutes les commandes, modifiables dans Réglages.</li>`}<li>Au hangar, le <b>cerveau</b> de chaque robot règle son comportement, et le <b>tir fractionné</b> laisse chaque arme choisir sa cible.</li><li>Le jeu se dévoile en progressant : un badge <b>Nouveau</b> signale ce qui vient de se débloquer, et les menus apparaissent au fil de vos découvertes.</li><li>Dès le QG niveau 2, un <b>poste d'expédition</b> envoie jusqu'à trois escouades fouiller seules, même jeu fermé : vous pouvez les regarder depuis la base.</li><li>Bien plus tard, le <b>Chantier titanesque</b> assemble des géants plus grands que le Colosse, capables de fabriquer leurs propres renforts en raid.</li></ul><p>En ligne, un compte sur un serveur Colosse garde votre partie et ouvre les raids à plusieurs et le pillage des bases.` },
  ],

  cur() { return this.steps[this.i]; },
  idx(id) { return this.steps.findIndex(s => s.id === id); },

  // ---------- partie d'entraînement ----------
  makeSave() {
    const s = newSave(), now = Date.now();
    s.tut = true; s.seen = true; s.guideDone = true; s.tutAsked = true; s.diff = 0;
    s.base.b.push({ id: s.base.nextId++, type: 'range', tx: 156, ty: 141, lvl: 1, busy: 0, stored: 0, lastT: now });
    return s;
  },
  start() {
    if (this.on || (state !== 'title' && state !== 'base')) return;
    if (state === 'base') { writeSave(); leaveBase(); }
    else writeSave();
    showOverlay('tutDlg', false);
    this.prev = save; this.on = true; this.min = false;
    Object.assign(this, { i: 0, hits: 0, pilotHits: 0, dashes: 0, collected: 0, raidOk: null, items: [], crate: null, pylon: null, foes: [], bastion: null, mark: null, spot: null, res: [] });
    save = this.makeSave(); this.r0 = save.robots.length; this.t0 = countType('turret_mg'); this.re0 = 0;
    try { localStorage.removeItem(TUT_KEY); } catch (e) { }
    writeSave();
    if (LIVE.room) LIVE.leave();
    enterBase();
    this.go(0);
    SFX.play('uiopen', 1);
  },
  stop() {
    this.on = false; this.prev = null;
    try { localStorage.removeItem(TUT_KEY); } catch (e) { }
    const box = $('#tutBox'); box.classList.remove('on'); box.innerHTML = '';
    for (const e of document.querySelectorAll('.tut-hl')) e.classList.remove('tut-hl');
    this.msgY = 0; this.leftY = 0;
  },
  go(i) {
    this.i = clamp(i, 0, this.steps.length - 1); this.doneT = 0; this.scrolled.clear();
    this.min = false; this.userMin = false; this.autoMinT = 16;
    const S = this.cur(); S.st = {};
    if (S.go) S.go.call(S);
    this.render();
  },
  advance() {
    const S = this.cur(), nx = this.steps[this.i + 1];
    if (!nx) return;
    SFX.play(nx.ch !== S.ch ? 'success' : 'rankup', nx.ch !== S.ch ? .6 : .45);
    if (nx.ch !== S.ch) msg('Tutoriel · nouveau chapitre : ' + TUT_CH[nx.ch] + '.', '#f2c14e', 5);
    this.go(this.i + 1);
  },
  skip() {
    const S = this.cur();
    if (S.skip) S.skip.call(S);
    if (S.next) { this.next(); return; }
    // certaines étapes changent l'état du jeu : on laisse le contrôle vérifier
    setTimeout(() => { if (this.on && this.cur() === S) this.advance(); }, 120);
  },
  next() { const S = this.cur(); if (S.id === 'end') { this.dialog('end'); return; } this.advance(); },

  // ---------- boucle ----------
  tick(dt) {
    if (!this.on) return;
    const S = this.cur(); if (!S) return;
    if ($('#tutDlg').classList.contains('on')) { $('#tutBox').classList.remove('on'); return; }
    // le joueur a pris de l'avance ou un raid s'est terminé plus tôt que prévu
    if (S.ch === 'A' && state === 'raid') { this.go(this.idx('arrive')); return; }
    if (S.where === 'raid' && state === 'result') { this.go(this.idx('result')); return; }
    if (S.where === 'raid' && state === 'base') { this.go(this.idx('collect')); return; }
    if (S.robots && state === 'raid' && !tAlive().length) this.dropRobot();
    if (!paused && S.tick) S.tick.call(S, dt);
    if (this.doneT > 0) { this.doneT -= dt; if (this.doneT <= 0) this.advance(); }
    else if (!S.next && S.ok && S.ok.call(S)) { this.doneT = .75; $('#tutBox').classList.add('done'); const h = $('#tutBox h4'); if (h) h.textContent = '✓ ' + S.t; }
    if (this.touch !== TOUCH.on) this.render();
    if (TOUCH.on && innerHeight < 560 && !S.next && !this.min && !this.userMin && state !== 'result') { this.autoMinT -= dt; if (this.autoMinT <= 0) { this.min = true; $('#tutBox').classList.add('min'); const m = $('#tutBox .tmin'); if (m) m.textContent = '▾ texte'; } }
    this.uiT -= dt; if (this.uiT <= 0) { this.uiT = .25; this.dyn(); this.highlight(); }
    this.place();
  },
  render() {
    const S = this.cur(), box = $('#tutBox'); if (!S) return;
    const T = TOUCH.on; this.touch = T; this.dynKey = '';
    const n = this.i + 1, N = this.steps.length;
    const acts = `<div class="tacts">${S.next ? `<button class="btn hot sm" data-act="tutnext">${esc(S.next)}</button>` : `<button class="btn sm" data-act="tutskip">${T ? 'Passer' : 'Passer l\'étape'}</button>`}<button class="btn sm" data-act="tutquit" ${T ? 'aria-label="Quitter le tutoriel"' : ''}>${T ? '✕' : 'Quitter'}</button></div>`;
    box.className = 'tut on' + (T ? ' touch' : '') + (this.min ? ' min' : '');
    // sur téléphone : en-tête compact, boutons à côté du titre, texte repliable
    box.innerHTML = `<div class="tch"><span>Tutoriel · ${TUT_CH[S.ch]}${T ? ' · ' + n + ' / ' + N : ''}</span>${T ? `<button class="tmin" data-act="tutmin" aria-label="${this.min ? 'Déplier' : 'Replier'}">${this.min ? '▾ texte' : '▴'}</button>` : `<span>${n} / ${N}</span>`}</div>
      <div class="trow"><h4>${esc(S.t)}</h4>${T ? acts : ''}</div>
      <div class="tb"><p>${S.x()}</p><ul class="tl" id="tutList"></ul></div>
      <p class="tp" id="tutProg"></p>${T ? '' : acts}`;
    this.dyn(); this.place(true);
  },
  dyn() {
    const S = this.cur(); if (!S) return;
    const p = S.prog ? S.prog.call(S) : '', l = S.list ? S.list.call(S) : null;
    const key = p + '|' + (l ? l.map(x => x[0] + (x[1] ? 1 : 0)).join(',') : '');
    if (key === this.dynKey) return; this.dynKey = key;
    const pe = $('#tutProg'); if (pe) { pe.innerHTML = p; pe.style.display = p ? '' : 'none'; }
    const le = $('#tutList'); if (le) { le.innerHTML = l ? l.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(t)}</li>`).join('') : ''; le.style.display = l ? '' : 'none'; }
  },
  // place le panneau là où il gêne le moins
  place(force) {
    const box = $('#tutBox'); if (!box.classList.contains('on')) return;
    const ui = uiScale(), hub = drawerOpen && $('#hub').classList.contains('on');
    let css;
    if (TOUCH.on) css = 'left:50%;top:6px;transform-origin:50% 0;transform:translateX(-50%) scale(' + ui + ')';
    else if (hub) css = (this.side === 'left' ? 'left:14px;' : 'right:14px;') + 'bottom:14px;transform-origin:' + (this.side === 'left' ? '0' : '100%') + ' 100%;transform:scale(' + ui + ')';
    else if (state === 'base') { css = 'left:14px;top:' + Math.round(118 * ui) + 'px;transform-origin:0 0;transform:scale(' + ui + ')'; }
    else { const S = Math.round(clamp((VW / ui) * .17, 130, 210)); css = 'right:14px;top:' + Math.round((14 + S + 12) * ui) + 'px;transform-origin:100% 0;transform:scale(' + ui + ')'; }
    if (force || css !== this.css) { this.css = css; box.style.cssText = css; }
    // les messages du jeu passent sous le panneau quand il occupe leur place
    const r = box.getBoundingClientRect(), cr = cv.getBoundingClientRect();
    this.msgY = TOUCH.on && !hub ? (r.bottom - cr.top) / ui + 20 : 0;
    this.leftY = !TOUCH.on && !hub && state === 'base' ? (r.bottom - cr.top) / ui + 22 : 0;
  },
  highlight() {
    const S = this.cur(), sel = S && S.hl ? S.hl.call(S) : null;
    let want = [];
    if (sel) try { want = [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null || e.getClientRects().length); } catch (e) { want = []; }
    for (const e of document.querySelectorAll('.tut-hl')) if (!want.includes(e)) e.classList.remove('tut-hl');
    // dans les menus, le panneau change de côté s'il cache l'élément à toucher
    if (!TOUCH.on && drawerOpen) {
      const r = $('#tutBox').getBoundingClientRect(), w = r.width, h = r.height;
      const R = { l: innerWidth - 14 - w, t: innerHeight - 14 - h, r: innerWidth - 14, b: innerHeight - 14 }, L = { l: 14, t: R.t, r: 14 + w, b: R.b };
      const hit = a => want.some(e => { const q = e.getBoundingClientRect(); return q.right > a.l && q.left < a.r && q.bottom > a.t && q.top < a.b; });
      this.side = hit(R) && !hit(L) ? 'left' : hit(L) && !hit(R) ? 'right' : (this.side || 'right');
    }
    for (const e of want) {
      if (!e.classList.contains('tut-hl')) e.classList.add('tut-hl');
      if (!this.scrolled.has(sel) && e.closest('#hubMain')) { this.scrolled.add(sel); try { e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); } catch (er) { } }
    }
  },

  // ---------- repères dans le monde ----------
  target() { const S = this.cur(); if (!S || !S.tg || this.doneT > 0 || paused) return null; if (S.where === 'raid' && state !== 'raid') return null; if (S.where === 'base' && state !== 'base') return null; return S.tg.call(S); },
  drawWorld(c) {
    const g = this.target(); if (!g) return;
    const z = cam.zoom, col = g.col || '#f2c14e', p = (Math.sin(time * 4) + 1) / 2;
    c.save(); c.strokeStyle = col; c.lineWidth = (g.thin ? 2 : 3) / z; c.setLineDash(g.thin ? [14 / z, 10 / z] : []); c.globalAlpha = .55 + .4 * p;
    circ(c, g.x, g.y, g.r + (g.thin ? 0 : p * 6 / z)); c.stroke(); c.setLineDash([]);
    if (!g.thin) { c.globalAlpha = .16; c.fillStyle = col; circ(c, g.x, g.y, g.r); c.fill(); }
    c.globalAlpha = 1; const ay = g.y - (g.thin ? 30 / z : g.r) - (16 + p * 10) / z;
    c.fillStyle = col; c.beginPath(); c.moveTo(g.x, ay + 14 / z); c.lineTo(g.x - 11 / z, ay); c.lineTo(g.x - 4 / z, ay); c.lineTo(g.x - 4 / z, ay - 14 / z); c.lineTo(g.x + 4 / z, ay - 14 / z); c.lineTo(g.x + 4 / z, ay); c.lineTo(g.x + 11 / z, ay); c.closePath();
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5 / z; c.fill(); c.stroke();
    if (g.lbl) { c.font = `700 ${13 / z}px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 3 / z; c.strokeStyle = 'rgba(14,17,18,.85)'; c.strokeText(g.lbl, g.x, ay - 20 / z); c.fillText(g.lbl, g.x, ay - 20 / z); }
    c.restore();
  },
  drawEdge(c) {
    const g = this.target(); if (!g || mapOpen) return;
    const s = worldToScreen(g.x, g.y), m = 46;
    if (s.x > m && s.x < VW - m && s.y > m && s.y < VH - m) return;
    const cx = VW / 2, cy = VH / 2, a = Math.atan2(s.y - cy, s.x - cx), k = Math.min((VW / 2 - m) / Math.max(1e-6, Math.abs(Math.cos(a))), (VH / 2 - m) / Math.max(1e-6, Math.abs(Math.sin(a))));
    const ex = cx + Math.cos(a) * k, ey = cy + Math.sin(a) * k, ui = uiScale(), p = (Math.sin(time * 5) + 1) / 2, col = g.col || '#f2c14e';
    c.save(); c.translate(ex, ey); c.scale(ui, ui);
    c.save(); c.rotate(a); c.translate(p * 5, 0); c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(18, 0); c.lineTo(-8, -13); c.lineTo(-3, 0); c.lineTo(-8, 13); c.closePath(); c.fill(); c.stroke(); c.restore();
    const F = focus(), d = Math.round(Math.hypot(g.x - F.x, g.y - F.y) / 10) + ' m';
    c.font = `700 12px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(14,17,18,.85)'; c.fillStyle = col;
    const lx = -Math.cos(a) * 30, ly = -Math.sin(a) * 30 + 4; c.strokeText(d, lx, ly); c.fillText(d, lx, ly);
    c.restore();
  },

  // ---------- raid d'entraînement ----------
  dir(a, d) { const sp = W.spawn; return { x: sp.x + Math.cos(a) * d, y: sp.y + Math.sin(a) * d }; },
  freePoint(from, d0, d1) {
    const a0 = Math.atan2(WPX / 2 - from.y, WPX / 2 - from.x);
    for (let k = 0; k < 24; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * .4, d = rnd(d0, d1); const p = findWalkableNear(from.x + Math.cos(a) * d, from.y + Math.sin(a) * d, 0, 50, 12); if (p) return p; }
    return findWalkableNear(from.x, from.y, d0 * .6, d1, 60) || { x: from.x + d0, y: from.y };
  },
  // un point sur le côté du pilote, pour qu'il reste à l'écran même sur téléphone (à gauche sur ordinateur, le panneau étant à droite)
  sidePoint(from, d0, d1) {
    for (let k = 0; k < 40; k++) { const a = (k < 20 && !TOUCH.on ? Math.PI : k % 2 ? Math.PI : 0) + rnd(-.3, .3), d = rnd(d0, d1); const p = findWalkableNear(from.x + Math.cos(a) * d, from.y + Math.sin(a) * d, 0, 30, 10); if (p && Math.abs(p.y - from.y) < 130) return p; }
    return this.freePoint(from, d0, d1);
  },
  setupRaid() {
    const sp = W.spawn, a0 = Math.atan2(WPX / 2 - sp.y, WPX / 2 - sp.x);
    // ferraille au sol, devant le pilote
    this.items = [];
    const L = this.freePoint(sp, 250, 300);
    for (let i = 0; i < 6; i++) { const q = findWalkableNear(L.x, L.y, 0, 70, 30) || L; const it = { res: 'scrap', amt: 4, x: q.x, y: q.y, vx: 0, vy: 0, t: 1, dead: false }; items.push(it); this.items.push(it); }
    // une caisse un peu plus loin
    const C = findWalkableNear(sp.x + Math.cos(a0 + .9) * 430, sp.y + Math.sin(a0 + .9) * 430, 0, 90, 40) || this.freePoint(sp, 380, 460);
    this.crate = { x: C.x, y: C.y, type: 'caisse', open: false }; crates.push(this.crate);
    // un pylône relais à portée de marche
    let P = findWalkableNear(sp.x + Math.cos(a0 - .7) * 700, sp.y + Math.sin(a0 - .7) * 700, 0, 120, 60) || this.freePoint(sp, 600, 760);
    const tx = (P.x / TILE) | 0, ty = (P.y / TILE) | 0; clearTiles(tx, ty, 3); chunkCache.clear();
    this.pylon = { tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, active: false, prog: 0 }; W.pylons.push(this.pylon);
    this.foes = []; this.bastion = null; this.mark = null; this.res = [];
  },
  // quelques cristaux et une épave, à côté du pilote, pour apprendre la récolte au tir
  spawnHarvest() {
    this.res = this.res.filter(([x, y]) => W.obs[y * WT + x]);
    if (this.res.length >= 3) return;
    const F = focus(), P = this.sidePoint(F, 230, 300), hx = (P.x / TILE) | 0, hy = (P.y / TILE) | 0;
    clearTiles(hx, hy, 2);
    for (const [dx, dy, o] of [[0, 0, 4], [1, 0, 4], [0, 1, 4], [1, 1, 5]]) {
      const x = hx + dx, y = hy + dy, i = y * WT + x; if (x < 3 || y < 3 || x >= WT - 3 || y >= WT - 3) continue;
      W.obs[i] = o; W.ohp[i] = OBS[o].hp; miniSetTile(x, y); this.res.push([x, y]);
    }
    chunkCache.clear(); navInvalidate();
  },
  spawnFoes() {
    const F = focus(); this.foes = [];
    const p = this.freePoint(F, 720, 820);
    for (let i = 0; i < 4; i++) { const q = findWalkableNear(p.x, p.y, 0, 90, 20) || p; this.foes.push(makeEnemy('rodeur', q.x, q.y, { active: true, hunter: true, alerted: true })); }
  },
  spawnBastion() {
    const F = focus(), p = this.freePoint(F, 760, 860);
    this.bastion = makeEnemy('bastion', p.x, p.y, { active: true });
  },
  dropRobot() {
    const F = focus(), p = findWalkableNear(F.x, F.y, 60, 140, 30) || { x: F.x + 60, y: F.y };
    const u = makeRobot({ id: -(nextUid + 1000), name: 'Recrue-' + rndi(2, 99), chassis: 'crawler', weapons: ['mg'], modules: [], brain: 'escort', hp: 1, deploy: true, group: 0, xp: 0, kills: 0, traits: [] }, p.x, p.y);
    units.push(u); fleet.push(u); sparks(u.x, u.y, 12, '#6fe3c8');
    msg('Tutoriel : un robot d\'entraînement est largué pour continuer.', '#6fe3c8', 5);
  },
  findSpot(type, cx, cy) {
    if (state !== 'base') return null;
    const D = BUILD[type];
    for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const tx = cx + dx, ty = cy + dy; if (canPlace(type, tx, ty)) return { x: (tx + D.w / 2) * TILE, y: (ty + D.h / 2) * TILE };
    }
    return null;
  },
  waves() { return [['rodeur', 'rodeur', 'pillard'], ['rodeur', 'pillard', 'essaim', 'essaim', 'essaim'], ['pillard', 'pillard', 'traqueur', 'rodeur']]; },

  // ---------- fin : garder ou supprimer ----------
  dialog(kind) {
    const prev = this.prev || save, prog = tProgress(kind === 'ask' ? save : prev);
    let h = '';
    if (kind === 'ask') h = `<h3>Première partie ?</h3>
      <p>Un <b>tutoriel jouable</b> d'une dizaine de minutes vous apprend tout : tirer, piloter un robot, commander la flotte, réussir une extraction, construire, rechercher et défendre la base.</p>
      <p>Il se joue dans une partie à part. À la fin, vous gardez cette partie d'entraînement ou vous la supprimez.</p>
      <div class="btns"><button class="btn hot" data-act="tutorial">Lancer le tutoriel</button><button class="btn" data-act="tutplay">Jouer directement</button></div>`;
    else {
      const end = kind === 'end', s = save;
      h = `<h3>${end ? 'Tutoriel terminé' : 'Quitter le tutoriel ?'}</h3>
      <p>${end ? 'Bravo, pilote. ' : ''}Que faire de cette partie d'entraînement (${esc(tSummary(s))}) ?</p>
      <div class="res-list">
        <div><span><b>Garder</b> : elle devient votre partie${state === 'raid' ? ' (le raid en cours est annulé, vos robots rentrent)' : ''}.</span><b></b></div>
        ${prog ? `<div><span class="lost">Elle remplacera votre partie actuelle : ${esc(tSummary(prev))}.</span><b></b></div>` : ''}
        <div><span><b>Supprimer</b> : elle est effacée, ${prog ? 'et vous retrouvez votre partie là où vous l\'aviez laissée' : 'et vous repartez d\'une base neuve'}.</span><b></b></div>
      </div>
      <div class="btns">${end ? '' : '<button class="btn" data-act="tutresume">Reprendre le tutoriel</button>'}<button class="btn ${prog ? '' : 'hot'}" data-act="tutkeep">Garder cette partie</button><button class="btn ${prog ? 'hot' : ''}" data-act="tutdel">${prog ? 'Supprimer et retrouver ma partie' : 'Supprimer cette partie'}</button></div>`;
      if (inGame()) paused = true;
    }
    $('#tutDlgBox').innerHTML = h; showOverlay('tutDlg', true); $('#tutBox').classList.remove('on');
  },
  resume() { showOverlay('tutDlg', false); paused = ['pause', 'result', 'help'].some(o => $('#' + o).classList.contains('on')); this.render(); },
  closeAll() { for (const o of ['tutDlg', 'pause', 'result', 'help']) showOverlay(o, false); paused = false; mapOpen = false; tactical = false; },
  async keep() {
    const prev = this.prev;
    if (tProgress(prev) && !(await askConfirm({ t: 'Garder cette partie', ok: 'Remplacer', danger: true, x: 'Votre partie actuelle (' + tSummary(prev) + ') sera remplacée par celle du tutoriel, mais restera disponible comme copie de secours dans Réglages → Sauvegarde.' }))) return;
    if (!this.on) return;
    if (tProgress(prev)) { lsSet(accountKey(ACC) + BAK_SUFFIX, JSON.stringify(prev)); bakT = Date.now(); }
    const t = save; delete t.tut; t.tutAsked = true; t.tutDone = true; t.guideDone = false;
    this.stop(); this.closeAll(); CLOUD.pending = null;
    if (attack) { for (const u of units) if (u.baseRaid) u.dead = true; attack = null; }
    save = t; writeSave(); cloudPush(true);
    enterBase();
    toast('Partie du tutoriel gardée : bonne continuation, pilote !');
  },
  drop() {
    const real = this.prev || loadSave(accountKey(ACC));
    this.stop(); this.closeAll();
    if (attack) { for (const u of units) if (u.baseRaid) u.dead = true; attack = null; }
    if (state === 'base') leaveBase();
    save = real; save.tutAsked = true; writeSave();
    state = 'title'; showScreen('title'); refreshTitle(); updateTouchUI();
    toast(tProgress(save) ? 'Partie d\'entraînement supprimée : votre partie vous attend.' : 'Partie d\'entraînement supprimée.');
  },
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  switch (el.dataset.act) {
    case 'tutorial': TUT.start(); break;
    case 'tutplay': showOverlay('tutDlg', false); save.tutAsked = true; save.seen = true; writeSave(); enterBase(); break;
    case 'tutnext': TUT.next(); break;
    case 'tutskip': TUT.skip(); break;
    case 'tutquit': TUT.dialog('quit'); break;
    case 'tutresume': TUT.resume(); break;
    case 'tutkeep': TUT.keep(); break;
    case 'tutdel': TUT.drop(); break;
    case 'tutmin': TUT.min = !TUT.min; TUT.userMin = true; TUT.render(); break;
  }
});
