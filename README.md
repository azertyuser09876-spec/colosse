# COLOSSE

Extraction en monde ouvert, flottes de robots, base à défendre, équipes rivales et assauts en ligne.
Tout le jeu tient dans **un seul fichier `index.html`**, sans aucune dépendance : il s'ouvre dans n'importe quel navigateur, sur ordinateur comme sur téléphone.

## Contenu du dossier

| Élément | Rôle |
|---|---|
| `index.html` | Le jeu complet (graphismes et sons générés par le code). |
| `server/server.js` | Serveur en ligne : Node.js seul, **aucun paquet à installer**, IPv6 et IPv4. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation sur l'écran d'accueil et jeu hors ligne (version web). |
| `electron/`, `package.json` | Version bureau : `.exe` Windows et `.AppImage` Linux. |
| `android/` | Version Android : `.apk` (WebView plein écran, sans bibliothèque). |
| `.github/workflows/` | Compilation automatique sur GitHub et version web sur GitHub Pages. |
| `publier.sh`, `publier.bat` | Envoi du dossier sur GitHub depuis le terminal. |
| `serveur.sh`, `serveur.bat` | Lancement du serveur en ligne. |

## Jouer

- **Ordinateur** : ouvrez `index.html` (double-clic). Clavier et souris ; touches modifiables dans Réglages.
- **Téléphone ou tablette** : ouvrez le jeu dans le navigateur, en paysage, ou installez l'`.apk`.
  - Joystick gauche : se déplacer. Joystick droit : viser, et tirer en poussant plus loin.
  - Touchez un robot pour le sélectionner, puis le sol pour l'y envoyer, ou un ennemi pour l'attaquer.
  - Deux doigts : zoomer. Bouton « Tactique » : temps ralenti et sélection au cadre en glissant.
  - Boutons : Esquive, Agir (maintenir pour ouvrir une caisse), Capacité, Piloter, Balise, Flotte, Carte, menu ☰.
  - À la base, « Base » ouvre la construction, la forge, le hangar, la recherche, les raids et le mode en ligne.

### Tutoriel

Le bouton **Tutoriel** de l'écran titre lance une partie d'entraînement jouable, d'environ dix minutes. Il est aussi proposé à la toute première entrée dans la base.

En 33 étapes guidées (consignes adaptées au clavier ou à l'écran tactile, flèche vers chaque objectif, boutons à toucher mis en évidence), le tutoriel apprend à :
- se déplacer, tirer, esquiver et piloter un robot ;
- assembler un robot et le déployer ;
- en raid : ramasser le butin, fouiller une caisse, lire la carte, combattre ;
- commander la flotte : sélectionner, envoyer, rappeler, ordonner une attaque ;
- activer un pylône, poser la balise, la défendre et réussir l'extraction ;
- à la base : récolter, construire une tourelle, lancer une recherche, repousser une attaque et accepter un contrat.

Le tutoriel se joue dans une **partie à part** :
- votre vraie partie n'est pas touchée ;
- rien n'est envoyé au serveur ni publié ;
- chaque étape peut être passée.

À la fin, ou à tout moment avec « Quitter », vous choisissez :
- **garder** cette partie d'entraînement : elle remplace votre partie, après confirmation si vous aviez déjà progressé ;
- ou la **supprimer** : vous retrouvez votre partie là où vous l'aviez laissée.

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
- Le mot de passe est chiffré sur le serveur (scrypt) et n'est jamais gardé sur l'appareil : seul un jeton de session l'est.

### Son

Tout l'audio est synthétisé en direct, sans fichier son : chaque arme a sa propre signature, les sons sont placés dans l'espace (gauche/droite, distance, écho), la musique s'adapte à la région, à l'alerte, aux combats, aux boss et à la fenêtre d'extraction, et chaque région a son ambiance.
Dans Réglages : volume général, effets, musique et ambiance séparés, et vibrations sur téléphone. Le son se coupe quand le jeu passe en arrière-plan.

## Jouer en ligne avec votre propre serveur

Le serveur n'utilise que Node.js (version 18 ou plus) : https://nodejs.org

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
  - Le QG et l'entrepôt protègent une partie des stocks (jusqu'à 70 % avec un entrepôt amélioré).
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
./publier.sh v1.0.0          # Windows : publier.bat v1.0.0
```

ou :

```bash
git tag v1.0.0
git push origin v1.0.0
```

Le workflow **Compiler Colosse** se lance (onglet *Actions*, environ 10 minutes). Il produit puis publie dans **Releases** :
- `Colosse-…-portable.exe` : se lance sans installation ;
- `Colosse-…-nsis.exe` : l'installeur Windows ;
- `Colosse-v1.0.0.apk` : Android, à installer en autorisant les sources inconnues ;
- `Colosse-….AppImage` : Linux ;
- `Colosse-web-et-serveur.zip` : la version web et le serveur.

Vous pouvez aussi lancer la compilation sans version : onglet *Actions* → *Compiler Colosse* → *Run workflow*. Les fichiers sont alors dans les *artifacts* du run.

### 4. Version web (facultatif)

Une seule fois : Settings → Pages → Build and deployment → Source : **GitHub Actions**. Relancez ensuite le workflow *Version web (GitHub Pages)* depuis l'onglet *Actions*.
Le jeu sera en ligne sur https://azertyuser09876-spec.github.io/colosse/ et jouable sur téléphone (« Ajouter à l'écran d'accueil »).
Tant que Pages n'est pas activé, ce workflow se termine sans erreur et l'indique dans son résumé. La compilation du .exe et de l'.apk n'en dépend pas.

### Notes

- Windows peut afficher un avertissement SmartScreen : le `.exe` n'est pas signé. Choisissez « Informations complémentaires → Exécuter quand même ».
- L'`.apk` est signé avec une clé de débogage : parfait pour l'installer soi-même, mais il faut votre propre clé pour le Play Store.
- Tester la version bureau en local, si vous avez Node.js : `npm install` puis `npm start`.

## Licence

MIT. Auteur : azertyuser09876-spec.
