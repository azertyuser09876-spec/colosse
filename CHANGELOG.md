# Historique des versions de Colosse

Chaque section ci-dessous sert aussi de description à la release GitHub de sa version.

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
