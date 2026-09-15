# Dette technique

Notes des problèmes connus à corriger, dans l'ordre où on les rencontre.
Chaque entrée : date de découverte, problème, contexte reproductible, effet,
et le contournement utilisé en attendant.

---

## 2026-08-22 — `scripts/televerser-documents.js` inutilisable pour une mise à jour ciblée

**Contexte.** Mise à jour intra-session : seuls quelques PDF ont changé
(exemple ce jour, 5 sur 65 après le refactoring LaTeX du chapitre 1 et la
renumérotation des sections dans la banque JSON). L'outil officiel refuse
de partir ou irait téléverser la mauvaise version.

**Trois défauts distincts :**

1. **Pas de filtre.** Le script téléverse la totalité des documents du
   catalogue (`DOCUMENTS` dans `src/acces/documents.ts`), sans option
   `--ids` ni équivalent. Impossible de cibler un sous-ensemble.

2. **Mauvaise source pour les corrigés (et énoncés/indices).** Le mapping
   `SOURCE_PAR_CATEGORIE.exercices = RACINE_NOTES_EXOS` fait chercher les
   cahiers `chNN-1-exercices`, `chNN-2-indices`, `chNN-3-corrige` dans
   `notes+exercices-calcul-differentiel/` — le dossier racine alimenté à
   la main. Or ces cahiers sont produits par `exercices-calcul-differentiel/`
   et vivent dans `sorties/build/`. Un cahier recompilé mais non recopié
   à la racine serait téléversé dans son ancienne version, silencieusement.

3. **`existsSync` bloquant en global.** Le pré-flight vérifie l'existence
   des ~65 sources et arrête tout à la première absente (« aucun
   téléversement partiel »). Un seul fichier oublié à la racine (par
   exemple `ch01-1-exercices.pdf` qui manquait le 2026-08-22) empêche
   même les uploads corrects du reste.

**Contournement du 2026-08-22.** Script ad-hoc
`scratchpad/televerser-5.js` (hors dépôt) — 5 mappings en dur avec source
explicite par entrée, content-type `application/pdf`, aucun autre objet
du seau touché. Les 5 PDF périmés du ch1 ont été téléversés à 15:19 Mtl.

**Correctif attendu (septembre 2026).**
- Ajouter un flag `--ids <id1>,<id2>,…` (les ids du catalogue) pour
  cibler un sous-ensemble.
- Rendre le mapping source paramétrable par document, ou introduire une
  catégorie `corrige` distincte pointant vers `sorties/build/` — ne pas
  laisser une catégorie unique pour trois producteurs différents.
- Rendre le pré-flight `existsSync` non bloquant quand `--ids` est
  présent : ne vérifier que les sources demandées, pas les 65.

### Ajout du 2026-08-24 — quatrième défaut : le mapping est mono-cours

Découvert en préparant l'intégration de « Probabilités et statistique ».
Non listé ci-dessus, et **bloquant dès qu'un deuxième
cours entre au catalogue**.

`SOURCE_PAR_CATEGORIE` (televerser-documents.js:62) est indexé par
**catégorie seule**, jamais par `coursId`. Le script ne fonctionne
aujourd'hui que parce que `DOCUMENTS` ne contient qu'un cours. Dès que
le catalogue en contient deux, les notes de prob-stat sont cherchées
dans le dossier du calcul différentiel : au mieux le pré-flight échoue,
au pire un homonyme est trouvé et le mauvais PDF part en production.

**Correctif à joindre aux trois autres.** Indexer par `(coursId,
categorie)` : `SOURCES[coursId][categorie]`. Un `coursId` absent du
mapping doit lever une erreur nommée, pas produire un `undefined` qui
se propage.

**État au 2026-08-24.** Non corrigé — décision de reporter. Le premier
téléversement de probabilités se fait par script ad-hoc, comme le 2026-08-22 : les
PDF concernés n'existent pas encore dans le seau, donc aucun risque
d'écraser une bonne version par une périmée. La correction complète
(les quatre défauts) est à faire **avant** le téléversement des cahiers
d'exercices de probabilités, où le risque de la dérive racine / `sorties/build/`
redevient réel.

**Vérification de la dérive, faite le 2026-08-24** (calcul différentiel,
racine des notes vs `exercices-calcul-differentiel/sorties/build/`) :

| Fichier | Racine | `sorties/build/` |
|---|---|---|
| `ch01-1-exercices.pdf` | **absent** | présent |
| `ch01-2-indices.pdf` | 338 185 o | **361 643 o** |
| `ch01-3-corrige.pdf` | 453 453 o | **628 659 o** |
| `ch02-1-exercices.pdf` | identique | identique |
| `ch07-3-corrige.pdf` | identique | identique |

Les notes, elles, sont identiques octet pour octet entre la racine et
`notes+exercices-calcul-differentiel/build/` — `build.sh` recopie
correctement. La règle « la source de vérité est le build » y est donc
vraie par accident plutôt que par construction ; le correctif devrait
pointer les notes vers `build/` pour la rendre vraie sans exception.

---

## 2026-08-24 — le catalogue est compilé dans les Cloud Functions

**Contexte.** Vérification faite avant d'intégrer Probabilités et statistique.
`obtenirLienTelechargement` (functions/src/index.ts:364) appelle
`trouverDocument(documentId)`. Le `tsconfig.json` de `functions/`
remonte d'un cran pour inclure `src/acces/` — le catalogue part donc
dans le **bundle déployé de la fonction**, pas seulement dans le site.

**Effet.** Modifier `src/acces/documents.ts` et pousser sur `main` met à
jour le site, **pas la fonction**. Les cartes de téléchargement des
nouveaux documents s'affichent, mais la fonction — qui tourne encore
sur l'ancien catalogue — répond `document-inconnu` (`not-found`) à
chaque demande. Un bouton visible qui échoue, pour quelqu'un qui a payé.

**À faire.** Toute modification du catalogue exige, depuis la racine du
dépôt :

```
firebase deploy --only functions
```

**Ce n'est pas documenté** : ni le README, ni l'en-tête de
`documents.ts` ne mentionnent ce couplage. Rien non plus ne le détecte
au build — `npm run build` compile le site sans rien savoir de la
version déployée de la fonction.

**Correctif souhaitable.** Une note dans l'en-tête de `documents.ts` au
minimum. Mieux : un contrôle qui compare le catalogue local à celui de
la fonction déployée et refuse de laisser passer une divergence.

---

## 2026-08-24 — deux affirmations périmées dans le README

Relevées en lisant le README comme document de référence. **Aucune des
deux n'est corrigée** — décision de les noter d'abord.

**1. Le compte des documents.** Le README annonce « 58 fichiers au
total » (section « Structure à respecter dans le seau »). Le catalogue
en produit **65** : 16 notes + 21 exercices + 10 révision + 18 examens.
Le chiffre 58 date d'avant l'ajout des indices par chapitre. Le nombre
va encore changer avec Probabilités et statistique — un compte écrit à la main dans une prose
est condamné à dériver ; mieux vaudrait ne pas en donner, ou le
laisser produire par `npm run test`.

**2. L'état de Firebase.** Le README dit « État actuel : non configuré,
et le site fonctionne quand même », et décrit la mise en service comme
restant à faire. **C'est faux depuis le 2026-08-18.** Vérifié le
2026-08-24 :

- les 6 secrets `VITE_FIREBASE_*` existent dans GitHub Actions
  (créés le 2026-08-18), et `deploy.yml:42` les injecte au build ;
- le dernier déploiement réussi date du 2026-08-24 13:05 (Mtl), donc
  postérieur ;
- sur `mathpratique.ca`, le lien **Connexion** apparaît dans la
  navigation — il serait masqué si `firebaseEstConfigure` valait
  `false` — et `/connexion` sert un vrai formulaire, pas le message
  d'indisponibilité ;
- les quatre Cloud Functions sont déployées en v2 sur
  `northamerica-northeast1` : `obtenirLienTelechargement`,
  `obtenirExercices`, `creerSessionCheckout`, `webhookStripe`.

Un README qui décrit la production comme inactive alors qu'elle est
vivante est plus dangereux qu'un README incomplet : il invite à
« mettre en service » ce qui tourne déjà.

---

## 2026-09-10 — des sigles de cours restent dans l'historique Git public

**État : close, décision de ne pas corriger. On n'y revient plus.**

**Contexte.** Le balayage du 2026-09-10 a retiré des fichiers suivis tous les
sigles de cours, noms d'établissement et noms de personnes : code,
commentaires, métadonnées de pages, documentation. Un sigle avait notamment
atteint trois endroits servis aux visiteurs — la meta description de la page
d'exercices de probabilités (indexée), la description de cette même page dans
son fragment JS, et un champ `code` du catalogue dans le bundle principal. Les
trois sont corrigés, et le champ `code` est désormais refusé par le schéma
(`CLES_CATALOGUE` dans `src/data/banque-types.ts`).

**Ce qui reste.** L'historique Git, lui, conserve ces occurrences : le
message du commit `03ef918`, et les anciennes versions des fichiers corrigés
(`scripts/prerendre.mjs`, `src/acces/documents.ts`, `src/data/exercises.ts`,
`src/data/lessons.ts`, `src/data/probabilites-statistique/catalogue.json`,
entre autres). Le dépôt étant public, ces versions restent consultables.

**Pourquoi on ne corrige pas.** Réécrire l'historique (`git filter-repo`)
change l'empreinte de chaque commit ultérieur et exige une poussée forcée sur
`main` — la branche que GitHub Pages déploie. Le risque (déploiement cassé,
clones désynchronisés) est réel, alors que le gain est incertain : les forks,
les caches et les archives tierces gardent de toute façon les anciennes
versions. Et ces occurrences ne sont ni servies aux visiteurs ni indexées
comme contenu du site. La règle « aucun sigle, aucun établissement, aucun nom
de personne » s'applique à l'état courant du dépôt et à ce qui est servi.

---

## 2026-09-10 — six problèmes ESLint dans les deux pages d'exercices

**État : ouverte. `npm run lint` n'est volontairement pas dans le workflow de
déploiement** — il y bloquerait la mise en ligne dès aujourd'hui.

**Les six problèmes**, identiques dans les deux pages (4 erreurs, 2
avertissements), relevés par `eslint-plugin-react-hooks` 7 :

| Fichier | Ligne | Règle | Niveau |
|---|---|---|---|
| `src/pages/ExercicesCalculDifferentiel.tsx` | 135 | `react-hooks/refs` | erreur |
| `src/pages/ExercicesCalculDifferentiel.tsx` | 141 | `react-hooks/refs` | erreur |
| `src/pages/ExercicesCalculDifferentiel.tsx` | 142 | `react-hooks/exhaustive-deps` | avertissement |
| `src/pages/ExercicesProbabilitesStatistique.tsx` | 141 | `react-hooks/refs` | erreur |
| `src/pages/ExercicesProbabilitesStatistique.tsx` | 147 | `react-hooks/refs` | erreur |
| `src/pages/ExercicesProbabilitesStatistique.tsx` | 148 | `react-hooks/exhaustive-deps` | avertissement |

**Ce n'est pas un bogue d'inattention.** Les six viennent d'un même motif,
délibéré et documenté dans le code (« Option E ») : le filtre par progression
prend un *instantané* de la progression au moment où il change, pour que
l'exercice qu'on vient de marquer ne disparaisse pas de la liste sous le
curseur.

- `progressionRef.current = progression` est écrit pendant le rendu (ligne
  135 / 141), et lu dans un `useMemo` (ligne 141 / 147) : la règle
  `react-hooks/refs` interdit les deux.
- `chapitreActif`, `typeActif` et `difficulteActive` figurent dans les
  dépendances du `useMemo` sans y être lus : c'est voulu, pour reprendre
  l'instantané quand le filtre change. `exhaustive-deps` les juge inutiles.

**Effet aujourd'hui : aucun.** Le comportement est correct à l'exécution, et
le React Compiler n'est pas activé (rien dans `vite.config.ts`). Le risque
apparaîtrait le jour où on l'activerait : il suppose que le rendu ne touche
pas aux refs, et pourrait figer ou décaler l'instantané.

**Correctif à planifier**, pour les deux pages à la fois — elles partagent le
motif :
- tenir l'instantané dans un `useState`, pris dans un `useEffect` qui dépend
  des filtres, au lieu d'un `useMemo` qui lit une ref ;
- ou, à défaut, un `eslint-disable-next-line` par ligne avec la raison écrite
  en clair — acceptable seulement si on renonce au React Compiler.

**Condition pour mettre `npm run lint` au workflow** : ces six problèmes
réglés, et une vérification manuelle du filtre par progression (marquer un
exercice pendant que le filtre « à revoir » est actif : il doit rester visible
jusqu'au prochain changement de filtre).

---

## 2026-09-10 — reporté pour publier le chapitre 1 de Calcul intégral

**État : ouvertes, volontairement mises de côté.** Priorité du jour : publier
le chapitre 1 de Calcul intégral et ouvrir l'accès aux étudiants. Rien de ce
qui suit n'a été touché.

**1. `src/data/linalg_exercises.json` est servi dans le bundle principal.**
974 Ko, importé par `src/data/exercises.ts`, présent dans `index-*.js` que
charge chaque visiteur dès l'accueil. Il provient de
`scripts/pdf_extract.txt`, extrait le 17 juin 2026 (commit `42299c6`) d'un
PDF intitulé « Algèbre linéaire et géométrie vectorielle — Cahier
d'exercices », portant la mention « © 2026 Vecteur Math, tous droits
réservés ». L'origine et les droits de ce contenu sont à vérifier avant toute
décision. `scripts/pdf_extract.txt` et `scripts/explore_p11.txt` restent en
place en attendant.

**2. Le workflow de déploiement n'a pas encore tourné en CI réelle.** Depuis
le 2026-09-10, il installe Node 24 et lance `npm test` avant le build (un
échec bloque la mise en ligne). Vérifié localement sur un clone propre, pas
dans GitHub Actions. La première exécution réelle sera la prochaine poussée
sur `main` ; si elle échoue, le site en ligne reste tel quel. La
vérification sur une branche dédiée (`gh workflow run deploy.yml --ref
<branche>` — l'environnement `github-pages` n'autorise que `main` à
déployer) est reportée.

**3. ESLint** — voir l'entrée précédente : six problèmes dans les deux pages
d'exercices, `npm run lint` hors du workflow.

**4. Garde sur `--cours` dans `scripts/accorder-acces-lot.js`.** Le script
accepte n'importe quel identifiant de cours : une coquille
(`calcul-integrale`) créerait un accès fantôme sans erreur. La garde
(refuser un cours absent du catalogue) avait été approuvée, puis reportée
avec le reste. En attendant, relire la ligne « Cible : …, cours … » de
l'essai à blanc avant tout `--confirmer`.

---

## 2026-09-15 — « exercices à venir » est écrit à la main dans les titres

**État : close le 2026-09-15. Plus aucune mention dans le catalogue.** Les
notes des chapitres 2 et 3 de Calcul intégral avaient été publiées sans
leurs exercices, qui n'existaient alors ni en PDF ni en source. Pour qu'un
étudiant ne cherche pas un document absent, les quatre titres concernés ont
porté la mention « — exercices à venir » dans `documents.ts`.

**Comment elle s'est refermée.** Les exercices des chapitres 2 puis 3 ont
été écrits, vérifiés par `sympy` et publiés. Chaque paire de mentions a été
retirée **dans le commit même qui déclarait les documents du chapitre
concerné**, jamais avant : tant que les PDF ne sont pas téléchargeables, la
mention doit rester.

**Ce qu'il faut retenir si le cas se représente.** La liste de /mon-compte
n'affiche que le `titre` d'un document : rien, dans le code, ne relie une
mention de ce genre à la réalité. Une mention dérivée du catalogue
(« ce chapitre a des notes mais aucun exercice ») demanderait un champ de
plus et un rendu de plus — un chantier, pas une ligne. Tant qu'on écrit ces
mentions à la main, la règle est celle qui a été suivie ici : elles entrent
et sortent avec les documents, dans le même commit.
