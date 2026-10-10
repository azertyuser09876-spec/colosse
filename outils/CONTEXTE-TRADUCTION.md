# Traduire COLOSSE

COLOSSE est un jeu d'action et de stratégie en temps réel (navigateur, PC, Android). Le joueur est un **pilote**
qui commande une **flotte de robots** de combat, de la minuscule « Fourmi » d'acier aux **géants** titanesques
(« Colosse », « Ville-machine »…). Il bâtit une **base**, y fabrique ses robots (**forge**), mène des **recherches**,
puis part en **raid** dans un monde dévasté : il fouille, combat, ramasse du **butin**, et doit poser une **balise**
d'extraction puis la défendre jusqu'à l'ouverture de la **fenêtre d'extraction** pour rentrer avec ce qu'il a trouvé.
Ton : science-fiction militaire sobre, phrases courtes et claires, tutoiement exclu (le jeu vouvoie le joueur en
français ; utilisez la forme naturelle et polie de votre langue pour un jeu vidéo).

## Glossaire (choisissez un terme par notion et gardez-le partout)

| Français | Sens dans le jeu |
|---|---|
| pilote | le personnage du joueur (à pied, ou à bord d'un robot qu'il « pilote ») |
| robot, flotte, escouade | les unités du joueur ; escouade = petit groupe envoyé en expédition |
| châssis | le modèle de robot (corps) |
| affût | emplacement d'arme sur un robot (hardpoint) ; « affûts gradués » = tailles d'emplacements décroissantes |
| arme légère / moyenne / lourde / titanesque / colossale / apocalyptique | tailles d'armes 1 à 6 |
| cerveau (Escorte, Chasseur, Gardien, Récolteur, Cortex tactique) | programme de comportement d'un robot |
| commandement (points de) | limite de la taille de l'armée déployée |
| rang (T1…T9), Recrue, Confirmé, Vétéran, Élite… | niveau de châssis ou grade d'un robot |
| raid | sortie dans le monde ouvert |
| balise, ancrage, fenêtre d'extraction, lift orbital | la balise se « charge » (ancrage) ; quand elle est pleine, une fenêtre de 16 s s'ouvre et tout ce qui est dans le cercle est remonté |
| pylône relais | structure à activer qui révèle la carte et accélère l'ancrage |
| extraction réussie / signal perdu | fin de raid gagnée / perdue |
| contrat, opération | mission rémunérée ; « opération » = contrat avec objectif placé dans le monde (convoi, sauvetage, sabotage, forage, traque) |
| alerte (niveaux 1 à 5) | l'hostilité du monde monte avec le temps |
| ferraille, alliage, circuits, cristaux, noyaux IA, données, Cœur de Colosse | les ressources |
| équipe rivale | autres pilotes contrôlés par l'ordinateur ou d'autres joueurs |
| expédition | escouade envoyée seule en raid pendant que le joueur fait autre chose |
| QG (quartier général) | bâtiment principal de la base |
| PV | points de vie (HP) |
| Souverain, Archonte, Rouilleux, Ruche… | noms de boss : traduisez s'ils sont des mots, gardez l'esprit (titres menaçants) |

Les noms propres de robots, d'armes et d'ennemis sont des mots descriptifs (« Arpenteur », « Tisseuse », « Railgun »,
« Rôdeur ») : traduisez-les par des noms courts et évocateurs dans votre langue, comme le ferait un jeu localisé.
« COLOSSE » (le nom du jeu) ne se traduit pas.

## Format

Vous recevez un lot JSON : une liste d'entrées `{ "k": clé française, "pl": 1 si pluriel, "f": fichier source, "c": contexte }`.
Les entrées sont dans l'ordre du code : les voisines parlent souvent de la même chose. `c` (contexte) montre le code
autour des clés courtes, ambiguës hors contexte (« est » = l'est, point cardinal ; « suit » = « suit le pilote »…).

Produisez un objet JSON `{ "clé française": "traduction", … }` avec **toutes** les clés du lot, à l'identique.

- **Espaces réservés** `{n}`, `{name}`, `{key}`… : gardez-les tels quels (mêmes noms, tous présents), placez-les où
  la grammaire de votre langue le demande. Ne traduisez jamais ce qui est entre accolades.
- **Pluriels** (`"pl": 1`) : la clé est `forme_singulier|forme_pluriel`. La valeur est un **objet** avec une entrée par
  catégorie de pluriel de votre langue (voir plus bas), chacune avec `{n}` si le français l'a.
  Exemple anglais : `"{n} robot|{n} robots": { "one": "{n} robot", "other": "{n} robots" }`.
- **Balises HTML** (`<b>…</b>`, `<br>`, `<kbd>…</kbd>`…) : gardez les mêmes balises autour des mots équivalents.
- Gardez les symboles et la ponctuation de structure : `·`, `×`, `→`, `[ ]`, `« »` (remplacez les guillemets par ceux
  de votre langue si l'usage l'exige), `%`, `/`, chiffres.
- **Longueur** : boutons, onglets, libellés et textes du HUD ont peu de place : restez aussi court que le français,
  voire plus. Les phrases d'aide ou de tutoriel peuvent être naturelles.
- Unités : m (mètres), km, kg, s (secondes), min, px (pixels), PV (points de vie → abréviation usuelle de votre langue).
- Les clés qui ne sont que des noms de touches, codes ou symboles se recopient.

## Catégories de pluriel par langue

en : one, other · zh : other · hi : one, other · es : one, many, other · ar : zero, one, two, few, many, other ·
bn : one, other · pt : one, many, other · ru : one, few, many, other · id : other

(`many` en espagnol et portugais ne sert qu'aux très grands nombres ronds : recopiez la forme `other`.)
