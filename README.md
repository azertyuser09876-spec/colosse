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

La progression est enregistrée sur l'appareil.

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

Ensuite :
1. Chaque joueur ouvre **Réglages → En ligne**, choisit un pseudo, colle l'adresse du serveur, puis « Se connecter ».
2. Ou plus simple : ouvrez directement l'adresse du serveur dans un navigateur, le jeu s'y connecte tout seul.

En ligne, vous avez un classement, votre base publiée automatiquement, des assauts sur les bases des autres joueurs (3 minutes, jusqu'à 3 étoiles, aucun vol réel de ressources) et un journal des attaques subies.

Options : `PORT=9000`, `HOST=0.0.0.0` (IPv4 seul), `NAME="Mon serveur"`, `DATA=/chemin/donnees.json`. Les données sont dans `server/data.json`.

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
