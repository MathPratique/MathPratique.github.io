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

Découvert en préparant l'intégration de « Probabilités et statistique »
(201-SN1-RE). Non listé ci-dessus, et **bloquant dès qu'un deuxième
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
téléversement SN1 se fait par script ad-hoc, comme le 2026-08-22 : les
PDF concernés n'existent pas encore dans le seau, donc aucun risque
d'écraser une bonne version par une périmée. La correction complète
(les quatre défauts) est à faire **avant** le téléversement des cahiers
d'exercices SN1, où le risque de la dérive racine / `sorties/build/`
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

**Contexte.** Vérification faite avant d'intégrer SN1.
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
va encore changer avec SN1 — un compte écrit à la main dans une prose
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
