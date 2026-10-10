# Historique des versions de Colosse

Chaque section ci-dessous sert aussi de description à la release GitHub de sa version.

## [3.0.0] Dix langues, opérations et grande rénovation

**Dix langues**
- Le jeu parle anglais, chinois mandarin, hindi, espagnol, arabe, français, bengali, portugais (Brésil), russe et indonésien : les dix langues les plus parlées au monde, chacune avec son drapeau.
- Au premier lancement, un écran propose la langue de l'appareil. On la change ensuite à tout moment depuis l'écran titre ou les réglages : le jeu redémarre dans la nouvelle langue et la partie est conservée.
- L'arabe se lit de droite à gauche : menus en miroir, textes du jeu (messages, objectifs, étiquettes) dans le bon sens. Les écritures liées (arabe, devanagari, bengali) ne sont plus espacées lettre à lettre, et chaque écriture a ses polices de repli.
- Les pluriels suivent les règles de chaque langue (jusqu'à six formes en arabe), les nombres décimaux leur séparateur. Les messages d'erreur du serveur sont traduits aussi.
- En raid partagé, les annonces d'un autre joueur (extraction, chute, boss abattu) s'affichent dans la langue de chacun.

**Opérations**
- Cinq nouveaux contrats, marqués « Opération » au bureau des contrats, placent leurs objectifs dans le monde :
  - **Convoi** : un camion blindé n'avance que si vous restez à moins de 65 m ; des embuscades l'attendent sur la route ; bloqué, il dégage la voie à l'explosif.
  - **Sauvetage** : un pilote abattu attend près de son épave fumante, quelque part dans une zone de recherche ; relevez-le, puis ramenez-le vivant dans le cercle d'extraction.
  - **Sabotage** : trois générateurs gardés par des bastions ; dès le premier détruit, l'alarme sonne et il reste de 1 min 50 à 2 min 20 pour abattre les deux autres avant leur verrouillage.
  - **Forage** : lancez la foreuse et tenez la position de 1 min 45 à 2 min 30 sous des vagues d'assaut ; elle s'arrête si personne ne la garde ; le minerai tombe au sol à la fin.
  - **Traque** : une cible d'élite nommée (Char, Mastodonte, Ravageur, Broyeur ou Exécuteur renforcé), escortée, change sans cesse de terrain de chasse ; sa zone approximative se resserre toutes les 30 s.
- Les objectifs apparaissent sur la carte, la minicarte et en flèches au bord de l'écran ; la liste des contrats suit l'opération en direct (progression, minuteries, état du camion ou de la foreuse).
- Une opération rapporte de 1,7 à 1,9 fois un contrat de chasse et compte double pour la réputation de la région.

**Ennemis et difficulté**
- Neuf nouveaux ennemis : le Sapeur qui charge et explose, l'Égide qui protège ses voisins d'un bouclier, le Réparateur volant, le Ravageur lance-missiles, le Spectre presque invisible, le Nid volant qui lâche des drones, l'Obusier à longue portée, et deux élites, le Broyeur et l'Exécuteur.
- Plus d'ennemis : davantage de camps, des groupes des nouveaux adversaires selon le rang de la région, des renforts plus nombreux et plus variés à mesure que l'alerte monte.
- Toutes les difficultés : PV, dégâts et renforts ennemis +10 %, groupes de renforts 15 % plus nombreux.
- Deux difficultés de plus : **Enfer** (PV ×2,5, dégâts ×2,25, butin ×3) et **Apocalypse** (PV ×3,3, dégâts ×2,8, butin ×4,2), chacune débloquée par une extraction réussie dans la précédente.

**Serveur**
- Les raids partagés acceptent les difficultés Enfer et Apocalypse : mettez à jour `server/server.js` sur votre serveur (sans cela, elles y deviennent Cauchemar).

**Robots et armes**
- Démarche procédurale : les pattes se posent et restent plantées, puis enjambent par groupes alternés quand le corps s'éloigne ; les géants font trembler et fissurer le sol à chaque pas.
- Chaque arme repose sur un affût visible, à la taille de son emplacement ; l'arme principale est dessinée plus grosse que les secondaires, et les affûts sont placés précisément sur chaque châssis (la Wyverne porte son arme lourde sous le nez et ses deux moyennes sous les ailes, le Scarabée son arme moyenne à l'avant et la légère sur le dos…).
- Les armes lourdes font reculer toute la machine. Les bobines électriques prennent les couleurs du robot qui les porte.
- Les carcasses abîmées se couvrent de brûlures, puis de fentes rougeoyantes quand la machine est près de céder.

**Décor**
- Le terrain garde la trace des combats jusqu'à la fin du raid, même redessiné : cratères, brûlures des incendies, fissures sous les géants, sol vitrifié par les plus grosses explosions, gravats des murs et rochers abattus, éclats des machines détruites qui retombent et restent au sol, traces de chenilles.

## [2.1.0] Affûts gradués et grands chantiers

**Affûts gradués**
- Un robot ne porte plus que des armes de sa taille maximale : le premier tiers de ses affûts (arrondi au-dessus) les reçoit, le tiers suivant prend une taille en dessous, le reste deux tailles en dessous (jamais moins que léger). Un Colosse porte deux armes titanesques, deux lourdes et deux moyennes ; un Titan deux lourdes et deux moyennes ; une Ville-machine cinq apocalyptiques, cinq colossales et quatre titanesques.
- À la forge, chaque affût affiche sa taille ; une arme trop grosse pour l'affût choisi va d'elle-même sur le premier affût assez grand, et « Même arme partout où elle tient » remplace l'ancien bouton.
- Les robots existants sont réarmés au premier lancement : les armes en trop sont démontées et remboursées, et remplacées gratuitement par des armes adaptées (de préférence du même genre et de portée voisine). Un message récapitule l'opération.
- Les équipes rivales et les renforts fabriqués en raid suivent la même règle.

**Bâtiments jusqu'au niveau 10**
- Tous les bâtiments montent jusqu'au niveau 10 ; le bureau des contrats, le poste d'expédition et le chantier titanesque jusqu'au niveau 5. Le QG reste le plafond des autres.
- Au-delà du niveau 5, chaque niveau coûte ×1,75 au lieu de ×2,15 et dure ×1,5 au lieu de ×1,9 ; les Noyaux IA grimpent plus doucement.
- Nouveaux effets : 6 ouvriers, hangar de 300 robots, forge jusqu'à −36 % sur l'assemblage, recherches jusqu'à −25 %, ancrage plus rapide, zone révélée par le radar plus large, entrepôt qui protège jusqu'à 85 % des stocks, 7 contrats par région, 5 expéditions à la fois, géants jusqu'à −20 % au chantier niveau 5, et des défenses bien plus solides. Le QG autorise davantage de bâtiments de chaque sorte, et les attaques de pillards grossissent en conséquence.
- Les niveaux 6 à 10 s'affichent par une seconde rangée de repères sur chaque bâtiment.

**Bâtiments dessinés**
- Le bureau des contrats (tableau d'affichage, comptoir, caisses), la station radar (écran à balayage), l'entrepôt blindé, la tourelle laser et la tour antiaérienne ont enfin leur propre apparence. La tourelle laser et la tour antiaérienne affichent aussi leurs dégâts.

**Dézoom**
- La vue s'arrête au bord de la carte au lieu de montrer du vide, et l'on ne dézoome plus au-delà de la carte entière.
- La base est entourée d'une friche (routes depuis les portes, bosquets, ruines, buttes rocheuses) au lieu d'un fond noir ; les géants s'y garent.
- Noms des robots, invites et compteurs se rangent sans se chevaucher, et évitent les boutons tactiles ; le mode d'emploi du mode tactique s'efface après quelques secondes.
- Le sol ne passe plus par de gros pixels : une carte de fond de toute la région se prépare dès le début du raid, les niveaux de détail se déduisent les uns des autres et le travail de préparation est dosé image par image.
- Vus de très haut, nuages et bancs de brume s'estompent au lieu de brouiller la carte.
- La qualité d'image baissée automatiquement remonte d'elle-même quand l'appareil retrouve de l'aisance.

**Équilibrage**
- Attaques de pillards : à partir du QG niveau 6, un Mastodonte de plus par vague (dès la première vague au niveau 8).
- Effet des affûts gradués, mesuré sur 42 raids simulés jusqu'au rang 4 (mêmes mondes, trois difficultés) : presque autant d'extractions réussies (29 au lieu de 31) et 20 % de butin en plus, mais des flottes moins résistantes : 37 % de pertes en plus, en valeur. Les robots de rang 5 et plus perdent surtout leurs grosses armes de zone et de portée.

**Serveur**
- Le serveur accepte les bâtiments jusqu'au niveau 10 et jusqu'à 700 constructions par base, et applique la nouvelle protection de l'entrepôt (jusqu'à 85 %). À mettre à jour en même temps que le jeu.

**Corrections**
- La tourelle laser et la tour antiaérienne affichent leurs dégâts dans le panneau du bâtiment.
- Quand plusieurs messages s'affichent au lancement, ils attendent leur tour au lieu de se masquer.
- Les robots ne s'empilent plus devant le hangar quand l'enceinte est pleine : ils se garent dans la friche ; le calcul des places est bien plus rapide.

## [2.0.0] Sortie de la phase alpha

Une remise à neuf complète : le jeu n'ajoute pas de nouveau mode, il devient plus solide, plus beau et mieux réglé.

> **Android, depuis une version 1.x** : la 2.0.0 ne peut pas s'installer par-dessus. Désinstallez d'abord l'ancienne version, ce qui efface la partie enregistrée sur le téléphone (sauf si vous jouez avec un compte sur un serveur Colosse). Ensuite, les mises à jour s'installeront par-dessus sans rien perdre.

**Graphismes**
- Les sols se fondent les uns dans les autres : fini les frontières en escalier entre cendres, humus, marais et cristaux. Bitume et béton gardent des bords nets.
- Ombrage continu du terrain, en nuages doux au lieu de carrés plus ou moins sombres, à tous les niveaux de zoom.
- Cailloux, touffes d'herbe, fissures et taches semés au hasard : le motif des tuiles ne se répète plus.
- Murs, remparts et falaises projettent leur ombre ; les falaises ont une arête éclairée.
- Les morceaux de terrain se préparent à l'avance autour de la vue : plus d'à-coups en avançant.
- Les promotions simultanées tiennent sur une ligne (« A, B et C passent Confirmé ! »).

**Sauvegardes**
- Copie de secours automatique de l'avant-dernier état enregistré.
- Une sauvegarde illisible n'est plus jamais écrasée : elle est mise de côté et la copie de secours est restaurée, avec un message.
- Réglages → Sauvegarde : exporter la partie (fichier ou code à copier), l'importer sur un autre appareil, restaurer la copie de secours.
- Une partie venant d'une version plus récente du jeu n'est pas écrasée par une version plus ancienne.
- Stockage plein : le jeu libère ce qu'il peut et prévient s'il ne peut plus enregistrer.
- Plusieurs fenêtres ouvertes sur la même partie : le jeu prévient.

**Finition**
- Pendant la fenêtre d'extraction, la flotte rejoint le cercle d'elle-même, en continuant de tirer (sauf les robots qui tiennent une position).
- Réglages regroupés en Affichage, Commandes et Son.
- Mode 30 images par seconde pour économiser la batterie.
- Ouvrir les caisses et activer les pylônes d'un seul appui (au lieu de maintenir la touche), au choix.
- Sur les appareils modestes, la résolution baisse d'elle-même quand les effets réduits ne suffisent pas.
- Les confirmations (effacer la partie, démonter un robot, rappeler une expédition…) s'affichent dans le jeu, y compris dans les navigateurs et applications qui bloquent les fenêtres de confirmation.
- Les incidents techniques ne bloquent jamais le jeu ; ils sont notés dans Réglages → À propos, avec un rapport à copier.
- Numéro de version et notes de version sur l'écran titre, affichées une fois après chaque mise à jour.

**Équilibrage**
- Signal de la balise : les vagues attirées en fin de charge sont environ 25 % plus petites, grossissent moins avec la taille de l'armée et arrivent toutes les 14 s au lieu de 12.
- Les robots dans le cercle de la balise se réparent lentement (1,2 % de leurs PV par seconde).
- Balise détruite : la nouvelle reprend 40 % de la charge accumulée au lieu de repartir de zéro.
- Les Cendres ménagent les premières flottes : tirs ennemis 15 % moins forts et moins de Mastodontes autour des bases militaires.
- Laboratoire niveau 5 (géants, armes colossales et apocalyptiques) : coût en Données −20 %, en Noyaux IA −25 %.
- Synthétiseur de noyaux : +33 % de production.
- Mesuré sur 24 raids simulés (quatre étapes de progression, trois difficultés) : 18 extractions réussies au lieu de 13, butin rapporté +80 %, robots perdus −38 % en valeur.

**Code et sortie**
- Le code est découpé en 27 fichiers JavaScript par domaine dans `src/js/`, assemblés en `index.html` par `node outils/construire.js` (lancé automatiquement par publier.sh / publier.bat et par GitHub). 500 lignes de code mort retirées.
- La version se règle à un seul endroit (`package.json`) et se reporte dans le jeu, le cache hors ligne et l'application Android.
- Android : l'application est signée avec une clé fixe ; à partir de cette version, les mises à jour s'installent par-dessus la précédente.
- Page de présentation publiée avec la version web.

## [1.8.0] Une IA qui ne se bloque plus

- Les robots calculent un chemin praticable selon leur taille, se dégagent quand ils coincent et percent les obstacles destructibles.
- Ligne de tir vérifiée avant chaque tir : plus de tirs dans les murs ; les volants tirent par-dessus le décor.
- Le cerveau Récolteur ouvre les caisses et abat cristaux et épaves à distance ; l'escorte récolte aussi au repos.
- Tutoriel à jour (34 étapes), avec une étape « Récolter au tir ».

## [1.7.0] Console de commandement

- Interface entièrement redessinée, dans le style du HUD.
- Arbre de recherche par branches et familles, forge interactive, hangar avec filtres.
- Découverte progressive : on voit ce qu'on possède et le prochain pas en silhouette.

## [1.6.0] Démesure

- Géants des rangs 7 à 9, jusqu'à six fois la taille du Colosse, et Chantier titanesque.
- Armes colossales et apocalyptiques, renforts fabriqués en plein raid, zoom étendu.
- Nouveaux robots plus petits et géants ennemis.

## [1.5.0] Expéditions

- Escouades autonomes qui fouillent une région et s'extraient seules, jusqu'à trois à la fois.
- Observation en direct depuis la base, et rattrapage accéléré quand le jeu était fermé.

## [1.0.0 à 1.4.x] Les fondations

- Raids d'extraction en monde ouvert, base jouable, forge, recherche, contrats et régions.
- Pilote à pied ou aux commandes d'un robot, flotte commandée en mode tactique.
- Serveur Colosse : comptes, sauvegarde en ligne, classement, pillage des bases et raids partagés en coopération ou en affrontement.
- Tutoriel jouable, ambiance (heure, météo, lumières) et son entièrement synthétisés.
- Versions Windows, Android, Linux et web compilées par GitHub.
