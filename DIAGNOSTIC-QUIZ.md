# Diagnostic — Quiz personnalisé, Calcul différentiel

**Date** : 2026-08-02

## 1. Comment le quiz identifie les leçons d'une matière

- Point d'entrée : `src/pages/CustomQuiz.tsx`
- Source : la constante `CUSTOM_QUIZ_LESSONS` dans `src/quiz/customGenerators.ts:13-20`
- Chaîne de lookup : pour chaque `lessonId` de la liste →
  `getLessonById(id).chapterId` (dans `src/data/lessons.ts`) → `getChapterById(...)?.topicId` (idem)
- Regroupement par `topicId` → si `lessonMeta.length === 0` pour la matière sélectionnée, affichage de : **« Aucune leçon n'est encore disponible dans cette matière pour le quiz personnalisé. »** (`CustomQuiz.tsx:224-227`)

## 2. Pourquoi les autres matières « fonctionnent »

État actuel de `CUSTOM_QUIZ_LESSONS` :

```ts
["L15","L16",…,"L58",        // Algèbre linéaire (35 leçons)
 "PSD1","PSD2","PSD3","PSD4" // Probabilités et statistique (4 chapitres)]
```

Pour chaque matière :

| Matière | Leçons dans `lessons.ts` | Dans `CUSTOM_QUIZ_LESSONS` | Quiz fonctionne ? |
|---|---|---|---|
| Algèbre linéaire | L1..L58 (chapitres/leçons) | ✅ L15..L58 | ✅ Oui — générateurs procéduraux |
| Probabilités et statistique | PSD1..PSD4 | ✅ PSD1..PSD4 | ✅ Oui — banque figée `exercises.ts` via `probStatPicker.ts` |
| **Calcul différentiel** | **❌ zéro leçon** | **❌ zéro** | **❌ Message vide** |
| **Calcul intégral** | **❌ zéro leçon** | **❌ zéro** | **❌ Message vide (probablement)** — le prompt dit qu'il « fonctionne normalement », c'est faux — il n'a aucun contenu et devrait afficher le même écran vide qu'un clic sur Calcul différentiel |

## 3. Ce qui manque exactement à Calcul différentiel

**Trois choses distinctes, toutes absentes** :

1. **Aucune entrée dans `src/data/lessons.ts`** pour ce topic
   - Aucun `chapter` avec `topicId: "differential-calculus"`
   - Aucun `lesson` non plus
2. **Aucun ID dans `CUSTOM_QUIZ_LESSONS`** — corollaire direct du point 1
3. **Aucun picker/dispatcher** dans `customGenerators.ts` capable de lire la banque `src/data/calcul-differentiel/`

Le format de la banque JSON diffère aussi de celui du reste du site :

| Champ banque JSON | Équivalent site (`Exercise`) |
|---|---|
| `type: "qcm"` | `type: "mcq"` |
| `type: "vrai-faux"` | `type: "tf"` |
| `type: "calcul-court" \| "calcul-long"` | `type` absent (exercise) |
| `difficulte: "facile"/"moyen"/"difficile"` | `difficulty: "Facile"/"Moyen"/"Difficile"` |
| `etapes[]` avec `enonce`/`indice`/`reponse`/`demarche` | `prompt`, `steps[]`, `answer` |
| Contenu en LaTeX brut | Ni le rendu KaTeX ni le RichContent n'est câblé pour ces textes |

Il y a un traducteur possible mais **il n'est pas encore écrit** — les composants `Mathematiques.tsx`, `latex-vers-html.ts` (utilisés pour la vitrine `/exercices/calcul-differentiel`) rendent LaTeX+KaTeX, mais `ExerciseCard.tsx` ne les utilise pas.

## 4. D'où vient le « 65 exercices » sur la carte

- `src/components/practice/TopicPicker.tsx:59` :
  ```ts
  const count = topic.nbExercicesPublies ?? exercises.filter((e) => e.topicId === topic.id).length;
  ```
- Le topic `differential-calculus` a **`nbExercicesPublies: 65`** codé en dur dans `src/data/topics.ts` (récente addition)
- Ce chiffre reflète `catalogue.json` → `totaux.gratuit: 65` (calqué à la main dans `topics.ts`)
- **Il n'a aucun lien avec le quiz** : le quiz interroge une source complètement différente (`CUSTOM_QUIZ_LESSONS`), qui reste vide pour ce topic

C'est cette **désynchronisation** qui produit le paradoxe : la carte annonce 65 exercices, le quiz en trouve zéro.

## 5. Comment la banque calc-diff est reliée au site

**Actuellement** :
- Vitrine dédiée : route `/exercices/calcul-differentiel` (`src/pages/ExercicesCalculDifferentiel.tsx`)
- `src/data/calcul-differentiel/index.ts` expose `CHAPITRES`, `TOTAL_GRATUITS`, `TOTAL_BANQUE`, types `Exercice`, `Etape`, etc.
- La page Practice redirige `?topic=differential-calculus` vers la vitrine (via `topic.pageDediee`)
- 7 chapitres × ~5-12 exercices = 65 gratuits publiés
- Les 240 payants n'existent PAS dans les fichiers publics — seule leur fiche signalétique (`id`, `chapitre`, `type`, `difficulte`, `acces: "payant"`) figure dans `catalogue.json`. Leur contenu est ailleurs (probablement Firestore, servi par la Cloud Function `functions/`)

**Pas relié** au quiz personnalisé. Aucun code du dossier `src/quiz/` ne connaît ce dossier.

## Bogue en résumé

Le quiz s'attend à trouver des leçons via `CUSTOM_QUIZ_LESSONS + lessons.ts`. La banque Calcul différentiel a été mise en place selon un pattern différent (banque JSON isolée + vitrine dédiée), sans jamais brancher ces chapitres dans la structure des leçons. **Le compteur voit la banque, le quiz voit les leçons — et les leçons pour ce topic n'existent pas.**

---

# Plan de correction

## Chantier 1 — Réparer

**Étape A** — Ajouter chapitre + 7 leçons pour Calcul différentiel dans `src/data/lessons.ts` :
- 1 chapter : `{ id: "calcul-differentiel", name: "Calcul différentiel", topicId: "differential-calculus" }`
- 7 lessons : `CD1..CD7` avec les titres tirés directement des JSON (`ch0N.titre`)

**Étape B** — Ajouter `CD1..CD7` à `CUSTOM_QUIZ_LESSONS`

**Étape C** — Créer `src/quiz/calcDiffPicker.ts` (calqué sur `probStatPicker.ts`) qui :
- lit `CHAPITRES` de `src/data/calcul-differentiel/index.ts`
- expose `isCalcDiffLesson`, `hasAny`, `CalcDiffPicker.draw(lessonId, kind, difficulty?)`
- traduit chaque `Exercice` (JSON) en `Exercise` (site) au moment du tirage :
  - Types : `qcm` → `mcq`, `vrai-faux` → `tf`, `calcul-*` → exercise
  - Difficultés : `facile`/`moyen`/`difficile` → `Facile`/`Moyen`/`Difficile`
  - Étapes : `enonce.texte` → `prompt` ; `demarche.lignes[]` → `steps` ; `reponse.texte` → `answer`
- Tirage sans remise par `(lessonId, kind, difficulty)` (même stratégie que Prob-Stat, pool réinitialisé à chaque tirage)

**Étape D** — Router dans `getCalcExercise/getMcqExercise/getTfExercise` (`customGenerators.ts`) vers le nouveau picker quand `lessonId.startsWith("CD")`

**Étape E** — Faire fonctionner le rendu KaTeX dans `ExerciseCard`/`MCQCard`/`TFCard` : leurs `prompt/steps/answer` deviennent des strings contenant du LaTeX brut. Deux options :
- E1 : passer par les composants existants `Mathematiques`/`latex-vers-html` (déjà utilisés dans la vitrine dédiée)
- E2 : intégrer KaTeX dans `RichContent`

**Étape F** — Protection : si un topic annonce `nbExercicesPublies > 0` mais aucune leçon exploitable, `console.warn(...)` visible dans la console navigateur ET (idéalement) une note discrète dans l'UI en développement uniquement.

## Chantier 2 — Modèle d'accès (à activer après validation du Chantier 1)

Le vrai chantier — dépend de plusieurs décisions :

- **Bassin payant** : les 240 payants ne sont pas dans les fichiers publics. Le prompt dit « les nombres viennent des métadonnées des exercices payants » (OK, `catalogue.json` suffit) mais aussi « bassin complet : 305 exercices » — donc pour un utilisateur avec accès, le quiz doit servir aussi les 240 payants. **D'où viennent-ils au moment du tirage ?** Cloud Function ? Firestore lu par le client authentifié ? À trancher.
- **Séries méli-mélo cumulatives** : n'existent pas encore côté quiz — c'est une nouvelle feature, pas juste une réparation.
- **Mode examen chronométré** : idem, nouvelle feature.
- **Compteur « 65 exercices gratuits sur 305 »** : pour Calcul différentiel, OK. Pour Algèbre linéaire (procédural, infini) et Prob-Stat (388 exercices tous « gratuits ») la formule perd son sens. **Formule cohérente à trouver.**

---

# 4 questions à trancher avant d'attaquer

1. **Étape E — rendu KaTeX** : je pars sur E1 (réutiliser `Mathematiques` + `latex-vers-html` déjà en place) ou tu préfères E2 (intégrer dans `RichContent`) ? E1 = moins invasif, mais crée un chemin de rendu parallèle. E2 = plus unifié, mais plus de travail et risque de casser les exercices Prob-Stat/Algèbre linéaire existants.

2. **Chantier 2, bassin payant** : d'où viennent les 240 exercices payants au moment du tirage quiz ? Cloud Function qui renvoie le contenu, ou lecture Firestore directe par le client authentifié ? Ou on scope le Chantier 2 aux 65 gratuits pour l'instant et on branche les payants plus tard ?

3. **Chantier 2, méli-mélo et mode examen** : est-ce prioritaire dans ce passage ou on peut le repousser à un chantier suivant ? Ce sont des vraies features distinctes.

4. **Compteur « X sur Y »** : pour Algèbre linéaire (procédural, illimité), tu préfères garder `35 exercice(s)` (le nombre actuel), ou afficher `35 leçons`, ou autre chose ? Pour Prob-Stat, garder `388 exercices` tel quel ?

---

**Point d'arrêt : j'attends tes réponses aux 4 questions et ton feu vert sur le chantier 1 avant de coder.**
