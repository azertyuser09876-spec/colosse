# COLOSSE

Extraction en monde ouvert, flottes de robots jusqu'aux géants grands comme des villes, base à défendre, expéditions autonomes, équipes rivales et assauts en ligne.
Tout le jeu tient dans **un seul fichier `index.html`**, sans aucune dépendance : il s'ouvre dans n'importe quel navigateur, sur ordinateur comme sur téléphone.

**Version 3.0.0** : dix langues avec leur drapeau (dont l'arabe de droite à gauche), opérations (convoi, sauvetage, sabotage, forage, traque), neuf nouveaux ennemis, difficultés Enfer et Apocalypse, robots et décor rénovés. Les nouveautés de chaque version sont dans [CHANGELOG.md](CHANGELOG.md), et dans le jeu (lien « Nouveautés » de l'écran titre).

## Contenu du dossier

| Élément | Rôle |
|---|---|
| `index.html` | Le jeu complet (graphismes et sons générés par le code), construit depuis `src/`. |
| `src/`, `outils/construire.js` | Sources du jeu, découpées par domaine, et leur assemblage en `index.html`. |
| `src/langues/`, `outils/extraire-textes.js` | Traductions (une par langue) et outil qui recense les phrases à traduire. |
| `server/server.js` | Serveur en ligne : Node.js seul, **aucun paquet à installer**, IPv6 et IPv4. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation sur l'écran d'accueil et jeu hors ligne (version web). |
| `electron/`, `package.json` | Version bureau : `.exe` Windows et `.AppImage` Linux. |
| `android/` | Version Android : `.apk` (WebView plein écran, sans bibliothèque). |
| `.github/workflows/` | Compilation automatique sur GitHub et version web sur GitHub Pages. |
| `site/` | Page de présentation (`presentation.html`) et ses captures, publiées avec la version web. |
| `CHANGELOG.md` | Historique des versions, repris dans les notes de chaque release GitHub. |
| `cle-android/` | Clé de signature Android : **reste sur votre ordinateur**, jamais envoyée sur GitHub (voir plus bas). |
| `publier.sh`, `publier.bat` | Envoi du dossier sur GitHub depuis le terminal. |
| `serveur.sh`, `serveur.bat` | Lancement du serveur en ligne. |

## Jouer

- **Ordinateur** : ouvrez `index.html` (double-clic). Clavier et souris ; touches modifiables dans Réglages.
- **Téléphone ou tablette** : ouvrez le jeu dans le navigateur, en paysage, ou installez l'`.apk`.
  - Joystick gauche : se déplacer. Joystick droit : viser, et tirer en poussant plus loin.
  - Touchez un robot pour le sélectionner, puis le sol pour l'y envoyer, ou un ennemi pour l'attaquer.
  - Deux doigts : zoomer. Bouton « Tactique » : temps ralenti et sélection au cadre en glissant.
  - Boutons : Esquive, Agir (maintenir pour ouvrir une caisse, ou un seul appui selon les Réglages), Capacité, Piloter, Balise, Flotte, Carte, menu ☰.
  - À la base, « Base » ouvre la construction, la forge, le hangar, la recherche, les raids, les expéditions et le mode en ligne.
  - Vue d'une expédition : glisser pour déplacer la vue, deux doigts pour zoomer, toucher un robot pour le suivre.

### Tutoriel

Le bouton **Tutoriel** de l'écran titre lance une partie d'entraînement jouable, d'environ dix minutes. Il est aussi proposé à la toute première entrée dans la base.

En 34 étapes guidées (consignes adaptées au clavier ou à l'écran tactile, flèche vers chaque objectif, boutons à toucher mis en évidence), le tutoriel apprend à :
- se déplacer, tirer, esquiver et piloter un robot ;
- assembler un robot à la forge (affûts sur l'aperçu, comparaison des armes) et le déployer depuis le hangar ;
- en raid : ramasser le butin, fouiller une caisse, démonter au tir cristaux et épaves, lire la carte, combattre ;
- commander la flotte : sélectionner, envoyer, rappeler, ordonner une attaque ;
- activer un pylône, poser la balise, la défendre et réussir l'extraction (pendant la fenêtre, la flotte rejoint le cercle d'elle-même) ;
- à la base : récolter, construire une tourelle, lancer une recherche dans l'arbre par familles, repousser une attaque et accepter un contrat.

La dernière étape présente ce qui se dévoile ensuite : badges « Nouveau », poste d'expédition et géants du Chantier titanesque.

Le tutoriel se joue dans une **partie à part** :
- votre vraie partie n'est pas touchée ;
- rien n'est envoyé au serveur ni publié ;
- chaque étape peut être passée.

À la fin, ou à tout moment avec « Quitter », vous choisissez :
- **garder** cette partie d'entraînement : elle remplace votre partie, après confirmation si vous aviez déjà progressé ;
- ou la **supprimer** : vous retrouvez votre partie là où vous l'aviez laissée.

### Interface et découverte

L'interface est une **console de commandement** sombre, dans le même style que le HUD en jeu.

- **On découvre en progressant** :
  - on voit ce qu'on possède, et le prochain pas en **silhouette** avec sa condition (« Après Châssis Tisseuse », « Laboratoire niveau 3 », « Débloqué au QG niveau 2 ») ;
  - le reste est caché, avec un compteur (« 12 châssis à découvrir », « +3 inconnues ») ;
  - concernés : recherche, châssis et armes de la forge, modules, bâtiments, régions, difficultés, ressources rares (Noyaux IA, Cœur de Colosse) ;
  - l'onglet Expéditions apparaît avec le poste d'expédition, l'onglet En ligne après la première extraction (ou avec un compte) ;
  - une pastille ambrée sur les onglets et un badge **Nouveau** signalent ce qui vient de se débloquer.
- **Recherche** : quatre branches (Châssis, Armes, Modules et cerveaux, Pilote et protocoles), chacune découpée en familles qui progressent de gauche à droite : Départ, Labo 1 à 5, puis Chantier I à III.
  - Familles de châssis : chenillés, marcheurs, volants, légers et rapides, transport. Familles d'armes : cinétique, obus et artillerie, missiles, énergie, électricité, feu, acide et lames, soutien.
  - Chaque technologie découle de sa famille : par exemple le Titan vient de l'Échassier, le Colosse du Goliath, le Railgun de l'Aiguilleur, le Canon de siège du Canon, le Missile Aube du Missile de croisière. Les armes colossales et apocalyptiques prolongent leur famille et demandent le Chantier titanesque.
  - Glisser pour parcourir, molette ou deux doigts pour zoomer, « Vue d'ensemble » et « Disponibles » pour s'y retrouver. Survoler une technologie surligne d'où elle vient et ce qu'elle ouvre.
  - Le détail liste les conditions (prérequis, laboratoire, chantier) avec ✓ ou ✗, le coût, et ce que la technologie débloque ensuite.
- **Forge** :
  - châssis filtrés par famille (et géants), avec aperçu ;
  - affûts numérotés directement sur l'aperçu : un clic sur un numéro choisit l'affût, glisser fait tourner le robot ;
  - **affûts gradués** (version 2.1) : le premier tiers des affûts reçoit les armes de la taille maximale du châssis, le tiers suivant une taille en dessous, le reste deux tailles en dessous (jamais moins que léger). Un Colosse porte ainsi deux armes titanesques, deux lourdes et deux moyennes ; une Ville-machine cinq apocalyptiques, cinq colossales et quatre titanesques. Une arme trop grosse pour l'affût choisi va d'elle-même sur le premier affût assez grand ;
  - armurerie filtrée par rôle (anti-infanterie, antiblindé, antiaérien, artillerie, anti-géant, contact, soutien) ;
  - survoler une arme ou un châssis montre l'aperçu et la comparaison des caractéristiques (barres et écarts) avant de choisir ;
  - une silhouette de châssis ou d'arme mène à sa recherche.
- **Hangar** : filtres (déployés, en réserve, abîmés, en expédition), tri (rang, puissance, nom, récents), interrupteur de déploiement, réglages repliés (cerveau, groupe, tir, pilotage, plans de fabrication).

### Intelligence des robots

Les robots, alliés comme ennemis, se déplacent et tirent avec plus de jugeote (version 1.8).

- **Ils ne restent plus coincés** :
  - chaque robot calcule un chemin praticable selon sa taille et ce qu'il peut écraser, et contourne falaises, murs, remparts et bâtiments ;
  - s'il bloque malgré tout, il recalcule son chemin, perce l'obstacle devant lui s'il est destructible, recule pour se dégager et, en dernier recours, se replace sur une case libre hors de votre vue ;
  - un robot arrêté par la foule tout près de son but considère qu'il est arrivé, au lieu de pousser sans fin.
- **Ils ne tirent plus dans les murs** :
  - avant de tirer, chaque arme vérifie sa ligne de tir, en tenant compte de sa dispersion ;
  - les cibles qu'on peut toucher passent avant celles cachées derrière un rocher ;
  - sans ligne de tir, le robot se déplace pour trouver un angle ;
  - un arbre, un cristal ou une épave tout proche ne gêne pas : on tire au travers, et on le récolte au passage ;
  - les tirs des robots volants, et ceux visant un volant, passent au-dessus des obstacles.
- **Au combat** :
  - choix de cible selon la menace, les cibles affaiblies et la ligne de tir ;
  - les ennemis s'écartent pour encercler au lieu d'arriver en file ;
  - un robot très abîmé et pris pour cible se met à l'abri derrière le pilote sans cesser de tirer ;
  - les pillards contournent les défenses de la base pour atteindre leur cible.
- **Récolte** :
  - le cerveau **Récolteur** ramasse le butin, ouvre lui-même les caisses quand aucun ennemi n'est à proximité, et abat cristaux et épaves à distance avec ses armes ;
  - quand le pilote avance, il reste dans son sillage et ne ramasse que ce qui est sur le chemin ;
  - au repos, sans ennemi en vue, l'escorte abat elle aussi les cristaux et épaves à portée de tir.
- **Expéditions** : les escouades autonomes profitent des mêmes règles.

Mesures sur un banc d'essai (mêmes mondes, trois graines, simulation à pas fixe), avant et après :
- escorte d'un pilote sur un parcours encombré : 45 robots-secondes bloqués → 13 ;
- ordres de déplacement à travers les obstacles : 85 arrivées sur 90 → 90 sur 90 ;
- tirs alliés perdus dans le décor : 37 % → 25 %, à victoire égale ;
- performances inchangées.

### Expéditions

Une expédition envoie une escouade de robots fouiller une région **sans vous**. C'est une vraie partie, avec son monde, ses ennemis, sa météo et sa balise, qui tourne en même temps que la vôtre, pendant que vous jouez à la base ou en raid.

- **Poste d'expédition** : à construire à la base, à partir du QG niveau 2. Chaque niveau permet une expédition de plus en même temps, jusqu'à cinq (niveau 5 : QG 5). L'onglet Expéditions apparaît une fois le poste construit.
- **Départ** (onglet Expéditions, à la base) : région, difficulté, durée de fouille (5, 9 ou 14 minutes), consigne et robots. L'escouade utilise son propre commandement, sans toucher à celui de votre armée de raid.
- **Consignes** :
  - Prudente : évite les zones gardées et rentre tôt.
  - Équilibrée : fouille ce qui est à sa mesure.
  - Audacieuse : force les coffres militaires et rentre tard.
- **Déroulement** :
  - L'escouade reste groupée autour d'un meneur invisible qui choisit les objectifs : caisses, coffres, archives, pylônes, butin au sol.
  - Elle évite ce qui la dépasse, se replie quand elle saigne et attend ses traînards.
  - Au retour, elle cherche un coin calme, de préférence près d'un pylône relais, pose sa balise, la défend, puis entre dans le cercle à la fenêtre d'extraction.
  - Elle rentre plus tôt si ses soutes sont pleines, si elle est trop abîmée, si elle a perdu trop de robots ou si vous la rappelez.
  - La balise d'une expédition émet un signal plus discret que la vôtre : moitié moins de renforts ennemis.
- **Butin** : sans pilote, seules les soutes des robots le ramènent. Une Mule ou un Vautour change tout. Comme en raid, un robot détruit ou resté hors du cercle est perdu.
- **Observer** :
  - Depuis la base, cliquez sur une ligne du panneau Expéditions (en haut à droite), ou sur Observer dans l'onglet ou au hangar.
  - Vue en direct : Échap pour revenir, Espace pour suivre l'escouade, Tab ou 1 à 9 pour suivre un robot, glisser ou ZQSD pour déplacer la vue, molette pour zoomer, R deux fois pour rappeler.
  - En raid, le panneau sous la minicarte résume chaque expédition.
- **Jeu fermé** : l'expédition est enregistrée dans la sauvegarde. À la réouverture, elle reprend là où elle en était et rattrape le temps écoulé en accéléré, quelques millisecondes par image, pendant que vous jouez.

### Démesure : géants et armes colossales

Au-dessus du Colosse, trois nouveaux rangs de **géants** (7, 8 et 9), jusqu'à six fois sa taille, s'ajoutent à la recherche et à la forge.

- **Construire un géant** :
  - **Chantier titanesque** à la base (QG niveau 5) : son niveau 1, 2 ou 3 permet de rechercher puis d'assembler les géants du rang 7, 8 ou 9 ; les niveaux 4 et 5 les rendent 10 % moins chers chacun ;
  - recherche au laboratoire de niveau 5, dans la suite de chaque famille : Colosse → Rempart → Forge-mère → Ville-machine (chenillés), Béhémoth → Arachné → Cyclope (marcheurs), Arche → Porte-nef → Aéropole → Astre (volants) ;
  - forge de niveau 5 et des Cœurs de Colosse.
- **Les géants** :
  - Rang 7 : Rempart (forteresse chenillée), Arachné (araignée rapide), Porte-nef (volant, fabrique des robots).
  - Rang 8 : Cyclope (bipède), Forge-mère (usine roulante), Aéropole (cité volante).
  - Rang 9 : Ville-machine (une ville sur chenilles, 14 affûts) et Astre (vaisseau-mère volant, 12 affûts).
- **Fabrication** : le Porte-nef, la Forge-mère, la Ville-machine et l'Astre fabriquent en raid des robots de trois rangs en dessous au plus (rang 4, 5 ou 6).
  - Au hangar, choisissez jusqu'à trois de vos robots comme plans, ou laissez « Automatique » (les meilleurs modèles débloqués).
  - Ce sont des renforts temporaires : ils se battent et ramassent, puis sont démontés à l'extraction. Le chargement de ceux qui sont dans le cercle est gardé.
- **Nouveaux robots plus petits** : Grillon (sauteur), Hérisson (pointes qui blessent au contact), Scarabée (volant blindé), Hydre (cinq têtes armées), Wyverne (bombardier volant), Mammouth (transporteur de siège à deux armes titanesques).
- **20 nouvelles armes**, dont deux nouvelles tailles réservées aux géants :
  - légères à titanesques : lance-harpon, projecteur d'acide, canon de DCA, lance-disques, roquettes thermobariques, lance-foudre, désintégrateur, canon de Gauss ;
  - **colossales** (rangs 7 et 8) : canon de bataille, mur de missiles, rayon annihilateur, fournaise, tempête ionique, hangar de chasseurs, dôme de bouclier, nuée réparatrice ;
  - **apocalyptiques** (rang 9) : lance de fission, projecteur de singularité (un trou noir qui aspire puis implose), missile Crépuscule, pluie de météores.
- **Géants ennemis** : quand votre armée grossit, les régions répondent avec des Colosses renégats, le Dévoreur, la Forge noire (qui assemble des renforts), le Léviathan volant et la Nécropole.
- **Zoom** : plus votre plus grand robot est gros, plus le zoom recule, jusqu'à voir presque toute la région. De loin, le jeu simplifie l'affichage (sol en basse résolution, petites unités en points) pour rester fluide. La vue s'arrête au bord de la carte ; une carte de fond de toute la région se prépare dès le début du raid, si bien que le sol reste net en dézoomant, et les noms et invites se rangent sans se chevaucher.
- **À savoir** :
  - un géant compte dans le cercle d'extraction dès que sa carcasse le couvre ;
  - les petits robots alliés passent sous les géants ;
  - à la base, les géants se garent dans la friche autour de l'enceinte ;
  - les géants ne participent pas aux assauts de base en ligne : ils sont trop grands.

### Langues

Depuis la version 3.0, le jeu parle les dix langues les plus parlées au monde : anglais, chinois mandarin, hindi, espagnol, arabe, français, bengali, portugais (Brésil), russe et indonésien. Chacune a son drapeau.

- Au premier lancement, un écran propose la langue de l'appareil. On la change ensuite depuis le bouton à drapeau de l'écran titre, ou dans Réglages → Langue : le jeu redémarre dans la nouvelle langue, la partie est conservée (le changement se fait entre deux raids).
- L'arabe se lit de droite à gauche : les menus passent en miroir et les textes du jeu s'écrivent dans le bon sens.
- En raid partagé, les annonces des autres joueurs (extraction, chute, boss abattu) s'affichent dans la langue de chacun ; les noms d'équipes rivales gardent celle de l'hôte.

**Corriger ou compléter une traduction.** Le français est la langue source : chaque texte affiché passe par `TL('phrase française')` (ou `TLn(n, 'singulier', 'pluriel')`), et la phrase française sert de clé dans `src/langues/xx.json` (`en`, `zh`, `hi`, `es`, `ar`, `bn`, `pt`, `ru`, `id`). Pour corriger une traduction, modifiez la valeur dans le fichier de la langue, puis reconstruisez. Après un ajout de texte dans le code, `node outils/extraire-textes.js --manque` liste les phrases qui manquent dans chaque langue ; une phrase absente s'affiche simplement en français. Les espaces réservés `{nom}` et les balises `<b>` doivent rester tels quels ; les pluriels sont des objets (`one`, `few`, `many`, `other`… selon la langue).

### Opérations

Cinq contrats, marqués « Opération », placent leurs objectifs dans le monde ; comme les autres contrats, leur récompense se touche à l'extraction. Ils rapportent de 1,7 à 1,9 fois un contrat de chasse et comptent double pour la réputation.

| Opération | Objectif |
|---|---|
| Convoi | Escorter un camion blindé jusqu'à son dépôt. Il n'avance que si le pilote ou un robot reste à moins de 65 m, des embuscades l'attendent, et il dégage la route à l'explosif s'il est bloqué. |
| Sauvetage | Trouver un pilote abattu dans une zone de recherche (fumée de l'épave visible de loin), le relever (touche Interagir), puis le ramener vivant dans le cercle d'extraction. |
| Sabotage | Détruire les trois générateurs d'un avant-poste. Le premier détruit déclenche l'alarme : il reste de 1 min 50 à 2 min 20 avant le verrouillage des autres. |
| Forage | Lancer une foreuse (touche Interagir) et la défendre de 1 min 45 à 2 min 30. Elle s'arrête si personne ne reste à moins de 70 m ; le minerai tombe au sol à la fin. |
| Traque | Abattre une cible d'élite nommée, renforcée et escortée, qui change de terrain de chasse. Sa zone approximative se resserre toutes les 30 s ; elle se révèle quand on s'en approche. |

### Ennemis et difficultés

Neuf ennemis apparaissent en 3.0 : Sapeur (charge et explose), Égide (bouclier pour ses voisins), Réparateur (volant, soigne les autres), Ravageur (lance-missiles), Spectre (presque invisible de loin), Nid volant (lâche des drones), Obusier (artillerie), et deux élites, Broyeur et Exécuteur. Les plus durs n'arrivent que dans les régions de rang élevé et quand l'alerte monte.

Deux difficultés s'ajoutent après Cauchemar : Enfer (PV ×2,5, dégâts ×2,25, butin ×3) et Apocalypse (PV ×3,3, dégâts ×2,8, butin ×4,2). Chacune se débloque par une extraction réussie dans la précédente.

### Base : bâtiments jusqu'au niveau 10

Depuis la version 2.1, tous les bâtiments montent jusqu'au niveau 10 (le bureau des contrats, le poste d'expédition et le chantier titanesque jusqu'au niveau 5). Le niveau du QG reste le plafond des autres.

- Au-delà du niveau 5, chaque niveau coûte ×1,75 (au lieu de ×2,15) et dure ×1,5 (au lieu de ×1,9). Les Noyaux IA grimpent plus doucement (×1,4).
- Ce que rapportent les niveaux 6 à 10 :
  - QG : 6 ouvriers au niveau 9, +2 commandement par niveau, et davantage de bâtiments de chaque sorte (collecteurs, tourelles, murs…) ; les attaques de pillards grossissent aussi ;
  - forge : −4 % sur l'assemblage par niveau (−36 % au niveau 10) ; laboratoire : recherches −5 % par niveau au-delà de 5 ;
  - hangar : 130, 160, 200, 250 puis 300 robots ; relais de commandement : +3 commandement par niveau au-delà de 5 ;
  - plateforme de largage : balise +20 % par niveau, ancrage −3 % par niveau au-delà de 5 ; station radar : zone révélée plus large ;
  - producteurs, baie de réparation, champ de tir, défenses et murs : leurs effets continuent de croître ;
  - entrepôt blindé : jusqu'à 85 % des stocks à l'abri des pillages ; bureau des contrats : 7 contrats par région et +60 % de récompense au niveau 5 ; poste d'expédition : 5 escouades à la fois.

### Armes en pilotage et tir fractionné

- **Robot piloté** : chaque arme est soit **manuelle**, soit **automatique**.
  - Une arme manuelle tire au clic gauche, là où vous visez.
  - Une arme automatique choisit sa propre cible et tire seule, indépendamment des autres.
  - En pilotage, un clic sur une arme dans le panneau des armes la bascule (sur téléphone, toucher sa pastille). La touche **Y** bascule toutes les armes d'un coup.
  - Le clic droit garde les ordres à la flotte.
- **Robots non pilotés** : au hangar, chaque robot a un réglage de tir.
  - En tir **concentré**, toutes les armes visent la même cible. Une arme qui ne peut pas l'atteindre tire sur ce qui passe à sa portée.
  - En tir **fractionné**, chaque arme choisit la cible qui lui convient : l'antiaérien vise les volants, le canon les blindés, la mitrailleuse l'infanterie, le mortier les cibles lentes.
- **Missiles guidés** : ils visent le point d'interception plutôt que la position de la cible et tournent plus serré quand ils sont lents ou proches. Une fusée de proximité les fait exploser au plus près au lieu de tourner autour. Si leur cible meurt, ils en cherchent une autre devant eux. Les missiles ennemis restent plus faciles à esquiver.

### Indicateurs de cible

- Des crochets entourent les ennemis visés par votre flotte, avec le nombre de robots qui les visent (×2, ×3…) et le numéro des affûts automatiques.
- Un losange tournant marque une cible verrouillée par vos missiles.
- Le nom et les PV de l'ennemi sous le curseur s'affichent.
- Une flèche rouge surmonte chaque ennemi qui vise votre pilote, votre robot ou votre balise.
- Si un missile ennemi est guidé sur vous, l'alerte « MISSILE VERROUILLÉ » s'affiche avec sa direction et un bip.
- En mode tactique, des traits relient chaque robot à sa cible.
- Réglages → Indicateurs de cible : Complets, Essentiels ou Masqués.

### Ambiance

- **Jour et nuit** :
  - Chaque raid commence à une heure différente, et le temps avance d'une heure toutes les 75 secondes. L'heure s'affiche en haut à gauche.
  - La nuit, robots et pilote allument phares et lampe, les machines ennemies ont des yeux rouges, et les ennemis voient un peu moins loin.
  - La base suit l'heure réelle de votre appareil.
  - En raid partagé, tous les joueurs ont la même heure et la même météo.
- **Météo selon la région** :
  - Les Cendres : cendres et tempêtes de cendres.
  - Marais d'acide : brume, pluie acide et orages.
  - Mégapole morte : smog, pluie et orages.
  - Glacier noir : neige et blizzard.
  - Partout : ombres de nuages, bancs de brume, vent qui pousse la fumée, éclairs suivis du tonnerre. Il y a aussi un bruit de pluie.
- **Lumières** : tirs, explosions, incendies, plasma, missiles, balise, pylônes et épaves en feu éclairent le terrain autour d'eux.
- **Combat** :
  - Douilles éjectées, poussière d'impact à la couleur du sol, éclaboussures dans le marais.
  - Traces de chenilles, de roues et de pas qui restent au sol.
  - Épaves qui brûlent puis restent calcinées, machines abîmées qui fument et prennent feu.
  - Souffle des explosions qui repousse les unités légères, recul de la caméra sur les tirs lourds.
- **Mouvements plus fluides** :
  - Les grosses machines ont de l'inertie.
  - Les robots ralentissent en douceur à l'arrivée et ne tremblent plus sur place.
  - Les virages sont amortis.
  - La caméra anticipe le déplacement, et les secousses sont lissées.
- **Réglages** :
  - Effets visuels : Automatique (baisse tout seul si l'appareil peine), Élevés, Moyens ou Réduits.
  - Cycle jour/nuit : Activé ou Toujours le jour.

### Sauvegarde et compte

- **Invité** (par défaut, sans serveur) : la partie est enregistrée dans le navigateur ou l'application, sur cet appareil seulement.
- **Compte** (bouton « Compte » sur l'écran titre) : sur un serveur Colosse, chaque joueur crée un compte avec un **identifiant et un mot de passe**. Sa partie est alors enregistrée **sur le serveur, une par compte**, et on la retrouve en se connectant depuis n'importe quel PC ou téléphone. À la création du compte, la partie invitée de l'appareil peut être reprise.
- Si deux appareils jouent avec le même compte, la partie enregistrée le plus récemment l'emporte.
- Sans réseau, la partie continue sur l'appareil et se renvoie au serveur à la connexion suivante.
- Sur claude.ai, la partie suit automatiquement le compte claude.ai.
- **Copie de secours** : le jeu garde l'avant-dernier état enregistré. Une sauvegarde illisible n'est jamais écrasée : elle est mise de côté et la copie de secours est restaurée, avec un message.
- **Changer d'appareil sans serveur** : Réglages → Sauvegarde → « Exporter un fichier » ou « Copier le code », puis « Importer… » sur l'autre appareil. La partie remplacée devient la copie de secours. Dans l'application Android, qui ne gère pas les fichiers, passez par « Copier le code ».
- Effacer la partie, garder celle du tutoriel ou importer une partie se confirment dans le jeu ; la partie précédente reste dans la copie de secours.
- Une partie venant d'une version plus récente du jeu n'est jamais écrasée par une version plus ancienne.
- Le mot de passe est haché sur le serveur (scrypt), jamais stocké en clair, et n'est jamais gardé sur l'appareil : seul un jeton de session l'est.

### Son

Tout l'audio est synthétisé en direct, sans fichier son : chaque arme a sa propre signature, les sons sont placés dans l'espace (gauche/droite, distance, écho), la musique s'adapte à la région, à l'alerte, aux combats, aux boss et à la fenêtre d'extraction, et chaque région a son ambiance.
Dans Réglages : volume général, effets, musique et ambiance séparés, et vibrations sur téléphone. Le son se coupe quand le jeu passe en arrière-plan.

## Jouer en ligne avec votre propre serveur

Le serveur n'utilise que Node.js (version 18 ou plus) : https://nodejs.org

> **Mise à jour 2.1** : remplacez `server/server.js` et relancez le serveur en même temps que vous publiez le jeu. L'ancien serveur refuse les bâtiments au-delà du niveau 5 et les bases de plus de 400 constructions ; les comptes et les parties enregistrées sont conservés.

```bash
node server/server.js          # ou ./serveur.sh  (Windows : serveur.bat)
```

Il écoute sur le port **8787**, en **IPv6 et IPv4** (`HOST=::`), et affiche les adresses à donner aux joueurs, par exemple :

```
Local    : http://localhost:8787
Réseau   : http://[2001:db8::42]:8787
Réseau   : http://192.168.1.20:8787
```

Ensuite, chaque joueur clique sur **Compte** (écran titre), entre l'adresse du serveur, puis crée son compte avec un identifiant et un mot de passe. Si vous ouvrez directement l'adresse du serveur dans un navigateur, elle est déjà remplie.

En ligne, vous avez :
- **Raids partagés en direct** (onglet *En ligne*, ou « Raid partagé à plusieurs… » dans *Partir en raid*) : de 2 à 4 pilotes dans la même zone, chacun avec sa flotte.
  - **Coopération** : vous êtes alliés, chacun pose sa balise et s'extrait quand il veut.
  - **PvP** : chacun pour soi, et le butin d'un pilote abattu tombe au sol pour qui le ramasse. Les monstres et les équipes rivales attaquent tout le monde.
  - On peut rejoindre une partie déjà lancée.
  - L'hôte fait vivre le monde. S'il part, un autre joueur prend le relais. Gardez la fenêtre du jeu ouverte pendant le raid.
- **Pillage des bases** : votre armée attaque la base d'un autre joueur pendant 3 minutes (jusqu'à 3 étoiles) et emporte une **vraie part de ses stocks**.
  - Le QG et l'entrepôt protègent une partie des stocks (jusqu'à 85 % avec un entrepôt de niveau 10).
  - La base pillée passe sous bouclier : 1, 2 ou 4 h selon les étoiles.
  - Attaquer retire votre propre bouclier.
  - Le défenseur voit le pillage dans son journal à sa prochaine connexion.
- le classement et le journal des pillages subis et menés.

Options :
- `PORT=9000` ;
- `HOST=0.0.0.0` (IPv4 seul) ;
- `NAME="Mon serveur"` ;
- `DATA=/chemin/donnees.json` ;
- `SAVES=/chemin/dossier`.

Les comptes, bases et pillages sont dans `server/data.json`, les parties des joueurs dans `server/saves/` (un fichier par compte). Gardez ces deux éléments si vous déplacez le serveur.

**Mise à jour d'un serveur existant** : remplacez `server/server.js`, puis relancez-le. Les anciens joueurs créent leur compte depuis le même appareil, et leur score et leur base sont repris.

**Si la connexion ou la création de compte échoue**, le message indique la cause :
- *Cette page n'est pas un serveur Colosse (erreur 404)* : le champ Serveur contient l'adresse de la page du jeu, par exemple la version GitHub Pages, au lieu de celle de votre serveur. Entrez l'adresse affichée par la fenêtre du serveur.
- *Aucun serveur Colosse à l'adresse…* : l'adresse ou le port mènent à autre chose qu'un serveur Colosse.
- *Serveur trop ancien* : remplacez `server/server.js`, puis relancez le serveur.
- *Serveur injoignable* : le serveur n'est pas lancé, l'adresse ou le port sont faux, ou le pare-feu bloque le port 8787.
- *Cette page est en https…* : la version GitHub Pages ne joint qu'un serveur en `https`. Ouvrez plutôt directement l'adresse du serveur dans le navigateur (`http://…:8787`), ou utilisez le `.exe` ou l'`.apk`.

Pour jouer hors de votre réseau local :
- en **IPv6**, ouvrez le port 8787 dans le pare-feu de la box ou de la machine. L'adresse IPv6 publique suffit, sans redirection de port ;
- en **IPv4**, redirigez le port 8787 de la box vers la machine du serveur ;
- la version **GitHub Pages** est servie en `https` et ne peut joindre qu'un serveur en `https`. Placez alors le serveur derrière un proxy HTTPS, par exemple Caddy ou nginx. Les versions `.exe`, `.apk` et le fichier `index.html` local acceptent un serveur `http`.

## Compiler le .exe et l'.apk avec GitHub

Rien à installer sur votre ordinateur à part **git**. GitHub compile tout.

### 1. Créer le dépôt

Sur https://github.com/new, créez le dépôt **colosse** pour le compte **azertyuser09876-spec**, vide, sans README.

### 2. Envoyer le dossier depuis le terminal

Dans le dossier `colosse` :

```bash
./publier.sh                 # Windows : publier.bat
```

ou à la main :

```bash
git init
git branch -M main
git remote add origin https://github.com/azertyuser09876-spec/colosse.git
git add -A
git commit -m "Colosse"
git push -u origin main
```

GitHub demande de vous identifier : utilisez un *personal access token* (Settings → Developer settings → Personal access tokens) comme mot de passe, ou `gh auth login`.

### 3. Lancer la compilation et créer une version

```bash
./publier.sh v2.1.0          # Windows : publier.bat v2.1.0
```

ou :

```bash
git tag v2.1.0
git push origin v2.1.0
```

Le workflow **Compiler Colosse** se lance (onglet *Actions*, environ 10 minutes). Il reconstruit `index.html` depuis `src/`, puis produit et publie dans **Releases**, avec comme description la section de cette version dans `CHANGELOG.md` :
- `Colosse-…-portable.exe` : se lance sans installation ;
- `Colosse-…-nsis.exe` : l'installeur Windows ;
- `Colosse-v2.1.0.apk` : Android, à installer en autorisant les sources inconnues ;
- `Colosse-….AppImage` : Linux ;
- `Colosse-web-et-serveur.zip` : la version web et le serveur.

Vous pouvez aussi lancer la compilation sans version : onglet *Actions* → *Compiler Colosse* → *Run workflow*. Les fichiers sont alors dans les *artifacts* du run.

### 4. Version web (facultatif)

Une seule fois : Settings → Pages → Build and deployment → Source : **GitHub Actions**. Relancez ensuite le workflow *Version web (GitHub Pages)* depuis l'onglet *Actions*.
Le jeu sera en ligne sur https://azertyuser09876-spec.github.io/colosse/ et jouable sur téléphone (« Ajouter à l'écran d'accueil »). La page de présentation sera sur https://azertyuser09876-spec.github.io/colosse/presentation.html.
Tant que Pages n'est pas activé, ce workflow se termine sans erreur et l'indique dans son résumé. La compilation du .exe et de l'.apk n'en dépend pas.

### Notes

- Windows peut afficher un avertissement SmartScreen : le `.exe` n'est pas signé. Choisissez « Informations complémentaires → Exécuter quand même ».
- L'`.apk` est signé avec la clé fixe de Colosse si les secrets GitHub sont en place (voir ci-dessous), sinon avec une clé de débogage différente à chaque compilation.
- Tester la version bureau en local, si vous avez Node.js : `npm install` puis `npm start`.

### 5. Clé de signature Android (une seule fois)

Android n'installe une mise à jour par-dessus l'ancienne que si les deux portent la même signature. La version 2.0.0 fournit donc une clé fixe, dans le dossier `cle-android/` (créé une seule fois, propre à votre jeu). Ce dossier est exclu de git : gardez-en une copie en lieu sûr.

1. Sur GitHub : Settings → Secrets and variables → Actions → **New repository secret**.
2. Secret `ANDROID_KEYSTORE_BASE64` : collez tout le contenu de `cle-android/ANDROID_KEYSTORE_BASE64.txt`.
3. Secret `ANDROID_KEYSTORE_PASSWORD` : collez le contenu de `cle-android/ANDROID_KEYSTORE_PASSWORD.txt`.

Les compilations suivantes signent l'APK avec cette clé. Sur un téléphone qui a une version 1.x, la 2.0.0 ne peut pas s'installer par-dessus : il faut désinstaller l'ancienne version, ce qui efface sa partie (sauf avec un compte sur un serveur Colosse, la partie étant alors sur le serveur). Les versions suivantes s'installeront par-dessus sans rien perdre. Le détail est dans `cle-android/LISEZMOI.txt`.

## Structure du code

Le jeu est écrit en JavaScript sans bibliothèque. Ses sources sont dans `src/` et s'assemblent en un seul `index.html` :

```
node outils/construire.js             reconstruit index.html
node outils/construire.js --verifier  vérifie que index.html correspond aux sources
```

`publier.sh` / `publier.bat` et la compilation sur GitHub reconstruisent `index.html` automatiquement : il suffit de modifier `src/`. Le numéro de version se change à un seul endroit, `package.json` : la construction le reporte dans le jeu, le cache hors ligne (`sw.js`) et l'application Android.

| Fichier | Contenu |
|---|---|
| `src/page.html` | Squelette de la page : écrans, menus, commandes tactiles (textes traduits au chargement). |
| `src/style.css` | Thème « console de commandement ». |
| `src/js/00-langues.js` | Langues : `TL`, `TLn`, pluriels, liste des dix langues. |
| `src/js/01-outils.js` | Mathématiques, aléas, dessin de base. |
| `src/js/02-audio.js` | Son synthétisé : effets spatialisés, musique générative, ambiances. |
| `src/js/03-reglages.js` | Réglages et accessibilité. |
| `src/js/04-donnees.js` | Châssis, armes, ennemis, bâtiments, recherches, régions, contrats ; affûts gradués et niveaux 6 à 10 des bâtiments. |
| `src/js/05-sauvegarde.js` | Sauvegarde de la partie. |
| `src/js/06-monde.js` | Génération des régions et de la base. |
| `src/js/07-peintres.js` | Dessin procédural des robots, armes, bâtiments et géants. |
| `src/js/08-raid-etat.js` | État d'une partie, hachage spatial, collisions. |
| `src/js/09-combat.js` | Dégâts, projectiles, montures, armes spéciales, ciblage. |
| `src/js/10-ia.js` | Déplacement, navigation, ligne de tir, comportement des robots et ennemis. |
| `src/js/11-raid.js` | Déroulement d'un raid, balise, pilote, ordres. |
| `src/js/12-flotte.js` | Vétérans, capacités, formations, patrouilles. |
| `src/js/13-base.js` | Base jouable et défense contre les pillards. |
| `src/js/14-rivaux-contrats.js` | Équipes rivales et contrats. |
| `src/js/15-en-ligne.js`, `16-direct.js` | Comptes, classement, pillages, raids partagés en direct. |
| `src/js/17-environnement.js` | Heure, météo, lumières. |
| `src/js/18-expeditions.js` | Expéditions autonomes. |
| `src/js/19-geants.js` | Mécaniques des géants. |
| `src/js/20-tutoriel.js`, `21-assaut.js` | Tutoriel jouable, mode assaut. |
| `src/js/22-rendu.js`, `23-tactile.js` | Rendu et HUD, commandes tactiles. |
| `src/js/24-interface.js`, `25-entrees.js` | Console de commandement, souris et clavier. |
| `src/js/26-nouveautes.js` | Notes de version affichées après une mise à jour. |
| `src/js/27-ennemis.js` | Ennemis de la 3.0, difficultés Enfer et Apocalypse. |
| `src/js/28-missions.js` | Opérations : convoi, sauvetage, sabotage, forage, traque. |
| `src/js/29-langues.js` | Écran des langues, drapeaux, traduction des textes fixes de la page, sens de lecture. |
| `src/js/30-demarrage.js` | Boucle d'images et démarrage. |
| `src/langues/xx.json` | Traductions : phrase française → traduction (intégrées à `index.html` à la construction). |

Les fichiers s'assemblent dans l'ordre de leur numéro.

## Licence

MIT. Auteur : azertyuser09876-spec.
