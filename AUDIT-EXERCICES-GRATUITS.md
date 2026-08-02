# Audit — publier les exercices gratuits de Calcul différentiel

Dépôt : `MathPratique.github.io`, branche `main`, commit `028ba12`.
Banque : `…/Calcul différentiel/exercices-calcul-differentiel/`.
Date : 2 août 2026. **Aucune modification n'a été faite.**

---

## Résumé

L'exercice affiché est **écrit en dur dans le code du site**. La banque de
305 exercices n'a jamais été reliée à la page — le pipeline qui produit
l'export web existe et fonctionne, mais **personne ne le lit**.

Trois constats changent la forme du travail :

| | |
|---|---|
| **La banque est déjà gratuite à 59 %** | 181 exercices sur 305. Ta cible de 65 signifie **retirer** l'accès à 116 exercices, pas en libérer. |
| **L'export web fait déjà exactement ce que tu demandes** | quatre paliers de dévoilement, contenu payant absent des fichiers publics, fiches signalétiques pour les compteurs. Rien à réarchitecturer. |
| **Le contenu est en LaTeX, et le site ne sait pas le lire** | KaTeX n'est pas seulement souhaitable : sans lui, les énoncés seront illisibles, pas seulement laids. |

---

## 1. D'où vient l'exercice affiché

**Écrit à la main dans le code**, pas tiré de la banque.

| | |
|---|---|
| Fichier | [`src/data/exercises.ts`](src/data/exercises.ts), tableau `manualExercises`, ligne 59 |
| Identifiant | `calc-chain-rule` |
| Énoncé | `Trouver f′(x) pour f(x) = (3x² + 1)⁵` |

C'est bien celui de ta capture. Le format est le type maison `RichContent` :
soit une chaîne, soit un arbre d'objets (`text`, `sup`, `frac`, `matrix`…).
Ici, c'est une simple chaîne avec des exposants Unicode — `²`, `⁵` — d'où le
rendu en texte courant.

### Ce que contient réellement `exercises.ts`

| Matière | Exercices |
|---|---|
| Calcul différentiel | **1** |
| Calcul intégral | 1 |
| Algèbre linéaire | 180 |
| Probabilités et statistique | 388 |

Le déséquilibre n'est pas un bogue d'affichage : il n'y a qu'un exercice.

---

## 2. La banque est-elle reliée au site ?

**Non. Aucun lien, dans aucun sens.**

Le pipeline existe pourtant, et il est bien fait. `scripts/generer-web.js`
produit dans `sorties/web/` :

```
index.json              catalogue des 305 exercices, fiches signalétiques seulement
chapitres/ch01.json     …ch07.json — le CONTENU des exercices gratuits
figures/                les figures TikZ pré-rendues en SVG
index-melimelo.json
```

### La séparation est déjà celle que tu demandes

J'ai ouvert les fichiers pour vérifier plutôt que de croire le commentaire.

`index.json` — 305 entrées, **aucune avec le moindre contenu**. Une entrée
complète ressemble à ceci, et c'est tout :

```json
{"id":"CD-C01-E001","chapitre":1,"section":"1.1","type":"qcm",
 "difficulte":"facile","tempsEstime":2,"acces":"gratuit"}
```

`chapitres/ch07.json` — 6 exercices, soit exactement les 6 gratuits du
chapitre 7. Les 34 payants n'y figurent pas, même vides.

**La règle « aucun contenu payant dans les fichiers publics » est donc déjà
respectée par construction**, par liste blanche et non par filtrage. Il n'y a
rien à corriger de ce côté ; il faut seulement que le site consomme ces
fichiers.

### Les quatre paliers existent déjà

Chaque exercice publié porte un tableau `etapes` :

```
{"etape":"enonce",   "titre":"Énoncé",             "texte": "…"}
{"etape":"indice",   "titre":"Indice",             "texte": "…"}
{"etape":"reponse",  "titre":"Réponse finale",     "texte": "…"}
{"etape":"demarche", "titre":"Démarche détaillée", "lignes": [ … ]}
```

C'est exactement la séquence de ta section 5.3. Le travail côté site est de
l'afficher, pas de l'inventer.

---

## 3. Le rendu mathématique

**KaTeX n'est branché nulle part.** Aucune trace dans `package.json`, dans
`src/`, ni dans `index.html`.

Les mathématiques passent par
[`src/components/ui/RichContent.tsx`](src/components/ui/RichContent.tsx), un
composant maison qui interprète onze types de nœuds : `text`, `sub`, `sup`,
`frac`, `matrix`, `cases`, `bold`, `vec`, `bar`, `hat`, `list`.

### Le point de blocage

Ce composant attend un **arbre d'objets**. Le contenu de la banque est du
**LaTeX brut** :

```latex
$h(t) = -4{,}9\,t^{2} + 30t + 1{,}5$
\[ v(t) = \dfrac{dh}{dt} = -9{,}8\,t + 30. \]
```

`RichContent` afficherait ces chaînes telles quelles, antislashs compris.
Ce n'est pas une question d'élégance : **le contenu serait incompréhensible**.

Trois voies possibles, à trancher au point de contrôle suivant :

1. **Brancher KaTeX** — une dépendance, rendu correct et rapide, CSS à
   inclure. C'est ce que je recommande, et ce que ta section 5.1 demande.
2. Convertir le LaTeX en `RichContent` dans le générateur — pas de dépendance,
   mais il faudrait écrire un analyseur LaTeX partiel. Beaucoup de travail
   pour un résultat inférieur.
3. Pré-rendre chaque formule en SVG à la compilation, comme les figures. Le
   HTML servi contiendrait les formules, ce qui règle aussi le point 7 — mais
   alourdit nettement les fichiers.

⚠️ KaTeX serait une **nouvelle dépendance**. Je te le signale avant, comme
convenu.

---

## 4. L'état du champ `acces`

Voilà le constat qui change le travail demandé.

| Chapitre | Total | Gratuits | Payants | Ta cible | Écart |
|---|---|---|---|---|---|
| 1 — Fonctions et domaines | 25 | 14 | 11 | 8 | **−6** |
| 2 — Limites | 60 | 40 | 20 | 12 | **−28** |
| 3 — Continuité | 30 | 21 | 9 | 8 | **−13** |
| 4 — La dérivée : définition | 35 | 26 | 9 | 9 | **−17** |
| 5 — Règles de dérivation | 60 | 39 | 21 | 12 | **−27** |
| 6 — Étude de fonction | 55 | 35 | 20 | 9 | **−26** |
| 7 — Applications | 40 | 6 | 34 | 7 | **+1** |
| **Total** | **305** | **181 (59 %)** | **124** | **65 (21 %)** | **−116** |

**Ta consigne dit « sélection, pas génération », et suppose qu'il s'agit de
libérer des exercices. C'est l'inverse : il s'agit d'en reverrouiller 116.**

Le chapitre 7 est le seul à augmenter, de six à sept.

### Répartition actuelle des 181 gratuits

| Type | Nombre | | Difficulté | Nombre |
|---|---|---|---|---|
| calcul-court | 93 | | facile | 90 |
| qcm | 54 | | moyen | 87 |
| vrai-faux | 30 | | **difficile** | **4** |
| calcul-long | 4 | | | |

Deux chiffres à retenir : **4 exercices difficiles** et **4 problèmes longs**
sont gratuits aujourd'hui, sur 181. La vitrine actuelle montre surtout du
facile et du court — exactement ce que ta consigne cherche à corriger.

### Les contraintes par chapitre sont toutes satisfiables

J'ai vérifié la disponibilité réelle, tous exercices confondus :

| Ch. | Cible | qcm | v/f | court | long | facile | moyen | difficile |
|---|---|---|---|---|---|---|---|---|
| 1 | 8 | 3 | 2 | 10 | 10 | 8 | 12 | 5 |
| 2 | 12 | 11 | 7 | 22 | 20 | 21 | 28 | 11 |
| 3 | 8 | 7 | 3 | 12 | 8 | 10 | 14 | 6 |
| 4 | 9 | 8 | 4 | 14 | 9 | 12 | 16 | 7 |
| 5 | 12 | 13 | 8 | 19 | 20 | 20 | 29 | 11 |
| 6 | 9 | 11 | 5 | 19 | 20 | 18 | 24 | 13 |
| 7 | 7 | **1** | **1** | **5** | 33 | **2** | 24 | 14 |

**Aucune contrainte n'est impossible.** Mais le chapitre 7 est contraint à
l'os : un seul QCM, un seul Vrai/Faux. Avec sept places et six exigences
(QCM, V/F, facile, moyen, difficile, courte démarche) plus au moins un
problème long, la sélection y est **presque entièrement forcée**. Il ne
restera qu'un ou deux choix libres.

---

## 5. Comment la page fonctionne aujourd'hui

[`src/pages/Practice.tsx`](src/pages/Practice.tsx), 320 lignes.

| Élément | État |
|---|---|
| Choix de la matière | `TopicPicker`, paramètre d'URL `?topic=` |
| Chapitres | `LessonNav`, paramètre `?lesson=` — **inutilisé en calcul différentiel**, faute de contenu |
| Filtre | par **type** seulement (`?kind=`), via `ExerciseKind` |
| Filtre par difficulté | **inexistant** |
| Groupement par chapitre | **inexistant** — grille plate |
| Pagination | aucune ; tout s'affiche d'un coup |
| Compteurs « … avec le package » | inexistants |

### Le dévoilement

[`ExerciseCard.tsx`](src/components/practice/ExerciseCard.tsx) n'a **qu'un
seul palier** : un booléen `open`, un bouton « Voir la solution » qui montre
d'un coup les étapes et la réponse. `MCQCard` et `TFCard` gèrent les QCM et
Vrai/Faux séparément, avec validation immédiate.

Les trois paliers `indice → réponse → démarche` sont à construire. La donnée
existe déjà côté banque ; c'est l'affichage qui manque.

---

## 6. Référencement — le point qui demande une décision

**Le HTML servi est vide.** Vérifié sur le fichier produit :

```html
<body>
  <div id="root"></div>   <!-- 21 caractères, scripts exclus -->
</body>
```

Tout est injecté par JavaScript après coup. Un moteur qui n'exécute pas le
script ne voit **aucun exercice**. Ta section 7 n'est donc pas satisfaite, et
ne peut pas l'être par un simple ajout de balises.

Il n'y a **ni `sitemap.xml`, ni `robots.txt`**.

### Ce que je propose, sans le mettre en œuvre

Comme demandé, je signale et j'attends.

**Pré-rendu à la compilation.** Un script qui, après `vite build`, produit un
fichier HTML complet par page d'exercices — `/practice/calcul-differentiel/`
et une page par chapitre — avec les énoncés, indices, réponses et démarches
dans le HTML. L'application React reprend la main au chargement.

C'est l'option la plus légère : pas de serveur, pas de changement de pile,
GitHub Pages continue de servir des fichiers statiques. Le coût est un script
de génération et le choix d'un moteur de rendu hors navigateur.

L'alternative — passer à un cadriciel à génération statique — réglerait le
problème plus proprement mais changerait la nature du projet. Je ne le
recommande pas pour sept pages.

**Matière disponible pour les titres et mots-clés** : la banque porte
394 mots-clés distincts, déjà rédigés — *dérivation en chaîne*, *formes
indéterminées*, *taux liés*, *règle de L'Hospital*, *dérivation implicite*,
*optimisation*, *asymptote horizontale*… Les titres de section demandés en
§7 n'ont pas à être inventés.

---

## 7. Ce que je propose de faire, dans l'ordre

| | Action | Dépend de |
|---|---|---|
| 1 | Établir la liste des 65, chapitre par chapitre, et te la soumettre | ton accord sur la réduction 181 → 65 |
| 2 | Appliquer `acces` dans les 7 fichiers de banque, régénérer l'export | 1 |
| 3 | Brancher KaTeX et importer l'export web dans le site | ton accord sur la dépendance |
| 4 | Groupement par chapitre, filtres type + difficulté, trois paliers | 3 |
| 5 | Compteurs par chapitre, tirés des fiches signalétiques | 2 |
| 6 | `sitemap.xml`, titres, méta-description | — |
| 7 | Pré-rendu pour l'indexation | **ton accord explicite** |

---

## 8. Cinq questions

1. **La réduction de 181 à 65 est-elle bien voulue ?** Elle retire l'accès
   gratuit à 116 exercices aujourd'hui publiables. C'est défendable — la
   vitrine actuelle donne près de 60 % du matériel — mais c'est une décision
   commerciale, pas technique, et je ne veux pas la prendre à ta place.

2. **KaTeX** — j'ajoute la dépendance ? Sans elle, ou sans l'une des deux
   solutions de rechange, les énoncés s'afficheront avec leurs antislashs.

3. **Le pré-rendu** — je le construis, ou on laisse les pages non indexables
   pour l'instant ? Ta section 7 dit que ces pages sont ton canal principal
   d'acquisition ; si c'est le cas, c'est le point le plus rentable de toute
   la liste.

4. **Les autres matières.** Algèbre linéaire et probabilités ont 568
   exercices dans l'ancien format `RichContent`, sans champ `acces` ni
   paliers. Je les laisse tels quels et je ne touche qu'au calcul
   différentiel ?

5. **Le chapitre 7** n'a que 2 exercices faciles et 1 QCM sur 40. Ses sept
   places seront donc presque entièrement dictées par tes contraintes. Tu
   confirmes que les contraintes priment sur la qualité pédagogique dans ce
   cas précis ?

---

*© 2026 MathPratique.ca. Tous droits réservés.*
