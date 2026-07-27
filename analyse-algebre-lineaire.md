# Analyse — Quiz personnalisé Algèbre linéaire (pour dupliquer en Probabilités et statistique)

**Date** : 2026-07-27
**Objectif** : documenter l'architecture actuelle du Quiz personnalisé pour Algèbre linéaire, identifier les divergences avec les hypothèses du prompt d'origine, et proposer une stratégie d'implémentation pour Prob-Stat.

---

## ⚠️ Divergence critique avec le prompt d'origine

Le prompt initial suppose que le site utilise **Firestore** (« Structure Firestore utilisée pour les leçons et les questions », « scripts d'import Firestore », « collections / sous-collections »).

**C'est faux pour ce repo.**

| Vérification | Résultat |
|---|---|
| `firebase` / `firestore` dans `package.json` | ❌ Absent |
| Grep `firebase|firestore` dans tout le repo | ❌ 0 hit |
| Dossier `functions/`, `api/`, `server/` | ❌ Aucun |
| Règles de sécurité, config Firebase | ❌ Aucune |

**Le site est 100 % statique** (Vite → `dist/` → GitHub Pages). Il n'y a pas de backend. Les questions du quiz personnalisé Algèbre linéaire sont **du code TypeScript qui les génère procéduralement à la volée** (via `Math.random()`).

**Conséquence** : l'étape 3 du prompt (« Import des questions dans Firestore ») n'est pas applicable telle quelle. Il faut choisir une stratégie alternative (voir §5 ci-dessous).

---

## 1. Architecture actuelle

### Routes
- Router : `src/App.tsx:12-20` (react-router-dom v7)
- Route : `/custom-quiz` → composant `CustomQuiz`
- Consommateur du quiz généré : `src/pages/Quiz.tsx:15-33` lit `?custom=<code>` (base64), décode via `decodeCustomQuiz(...)`, appelle `buildCustomQuiz(...)` et rend via `ExerciseCard`.

### Composants
| Rôle | Fichier |
|---|---|
| Sélecteur de matière + tableau de saisie | `src/pages/CustomQuiz.tsx` (312 lignes) |
| Cartes de matières | `src/components/practice/TopicPicker.tsx` |
| Rendu unifié d'exercice | `src/components/practice/ExerciseCard.tsx` |
| Rendu QCM interactif | `src/components/practice/MCQCard.tsx` |
| Rendu Vrai/Faux | `src/components/practice/TFCard.tsx` |

### Configuration des matières / topics
- Liste des matières : `src/data/topics.ts:8-33` → 4 topics :
  - `differential-calculus`, `integral-calculus`, `linear-algebra`, `probability`
- **Signalisation d'éligibilité au quiz personnalisé** : une matière est « disponible » si au moins **une de ses leçons** figure dans la constante :
  ```ts
  // src/quiz/customGenerators.ts:13-19
  export const CUSTOM_QUIZ_LESSONS = ["L15","L16","L17",...,"L58"];
  ```
  Le regroupement matière → leçons se fait via `lesson.chapterId → chapter.topicId` (`CustomQuiz.tsx:58-63,71-80`).
- **Message « Aucune leçon disponible »** : `CustomQuiz.tsx:207-213`, déclenché quand `lessonMeta.length === 0`.
  Pour Prob-Stat : les leçons sont `PSD1..PSD4` (`src/data/lessons.ts:97-107`), aucune n'est dans `CUSTOM_QUIZ_LESSONS`, donc le message vide s'affiche.

---

## 2. Source de vérité des questions (Algèbre linéaire)

Deux sources coexistent :
1. **`src/quiz/generators/L1.ts` .. `L20.ts`** — fonctions `generateL{N}Quiz()` enregistrées dans `src/quiz/registry.ts:23-44`. Chaque fonction renvoie ~5 exercices thématiques.
2. **`src/quiz/customGenerators.ts`** (1930 lignes) — pour L15..L58 (le quiz personnalisé) : générateurs procéduraux à la volée, ex. `l23Mcq()`, `l24Calc()`, `l50Tf()`, etc.

Le fichier `src/data/linalg_exercises.json` sert au bouton **Pratique** (fusionné dans `exercises.ts`), **PAS** au quiz personnalisé.

### Modèle de données (type `Exercise`, `src/data/exercises.ts:28-45`)
```ts
type Exercise = {
  id: string;
  topicId: string;
  lessonId?: string;
  title: string;
  difficulty: "Facile" | "Moyen" | "Difficile";
  prompt: RichContent;
  steps: RichContent[];
  answer: RichContent;
  type?: "mcq" | "tf";      // absent => CALC
  options?: MCQOption[];
  isTrue?: boolean;
  explanation?: string;
};
```

### Une « leçon » du quiz personnalisé
= un **`lessonId`** (`"L23"`, `"L34"`, …) présent dans `CUSTOM_QUIZ_LESSONS`.
Chaque leçon dispose de fonctions dédiées `l{N}Mcq / l{N}Tf / l{N}Calc` OU tombe dans un fallback générique (`genericMatrixMcq/Tf` pour L15-L20, `geometryMcq/Tf/Calc` pour L50-L58).

---

## 3. Sélection / tirage

- `buildCustomQuiz(specs)` (`customGenerators.ts:1870-1887`) : pour chaque spec `{lessonId, exerciseCount, mcqCount, tfCount}`, appelle les getters N fois.
- **Chaque appel régénère aléatoirement** via `Math.random()` (`src/quiz/rng.ts` : `randInt`, `pick`, `shuffle`, `uniqueId`).
- Pas de cache. Le bouton « Nouveau tirage » (`Quiz.tsx:38-41`) incrémente un `seed` d'état qui invalide le `useMemo`.
- **Pas de sélection par difficulté** dans l'UI actuelle — la difficulté est câblée dans chaque générateur.
- `getAvailableTypes(lessonId)` (`customGenerators.ts:1915-1929`) retourne 3 booléens (`{calc, mcq, tf}`) qui activent/désactivent les inputs numériques.

---

## 4. Rendu

- Dispatcher : `ExerciseCard.tsx:63-64` — sur `type === "mcq"` → `MCQCard`, sur `type === "tf"` → `TFCard`, sinon carte « steps » avec bouton « Voir la solution ».
- **Pas de KaTeX / MathJax** — 0 hit. Le rendu math passe par `src/components/ui/RichContent.tsx` (que j'ai étendu récemment avec `bar`, `hat`, `list` — voir tes récentes corrections). Symboles Unicode (√, ², ×, ≠, μ, σ…) insérés directement dans les chaînes.

---

## 5. Stratégie pour Prob-Stat — deux options

Les 388 exercices Prob-Stat existent déjà dans `src/data/exercises.ts` (avec `lessonId ∈ {PSD1, PSD2, PSD3, PSD4}`, `type ∈ {undefined, "mcq", "tf"}`, `difficulty ∈ {Facile, Moyen, Difficile}`). Chaque leçon = un chapitre entier avec 97 exercices (25 F + 25 M + 15 D + 16 QCM + 16 V/F).

### Option A — Répliquer le pattern Algèbre linéaire (procédural)
Écrire ~15+ fonctions générateurs pour Prob-Stat (une par « sous-génération » : moyennes aléatoires, tests χ² avec n aléatoire, etc.), les enregistrer dans les dispatchers de `customGenerators.ts`.

**Pour** : cohérence architecturale, tirages « infinis ».
**Contre** : gros travail (~1000 lignes de code procédural), déjà 388 exercices figés parfaitement calibrés à recréer, perte de la qualité pédagogique des énoncés soigneusement rédigés.

### Option B — Utiliser la banque figée (recommandé)
Ajouter un chemin alternatif dans `buildCustomQuiz` : quand la leçon est un chapitre Prob-Stat, filtrer `exercises` par `lessonId + type + difficulté` et tirer aléatoirement.

**Pour** : réutilise les 388 exercices, ~50 lignes de code, tirage aléatoire natif via `shuffle()`, permet naturellement d'exposer le filtre **par difficulté** dans l'UI (avantage vs Algèbre linéaire).
**Contre** : le pool est fini (mais 97 par leçon = largement suffisant pour un quiz).

**Ma recommandation** : **Option B**. C'est un léger écart de pattern, mais il évite de dupliquer 388 exercices en code procédural. On peut même le présenter comme une **amélioration** — les étudiants voient exactement les mêmes exercices Prob-Stat qu'en Pratique, dans un format quiz.

---

## 6. Granularité — une leçon = ?

Pour Algèbre linéaire : une leçon quiz = **une leçon du plan de cours** (`L23` = « Vecteurs géométriques – partie 1 »). Granularité fine.

Pour Prob-Stat : les leçons `PSD1..PSD4` correspondent chacune à **un chapitre entier** (« Chapitre 1 — Statistiques descriptives »). Granularité plus grosse. Options possibles :

- **B.1** — 4 leçons quiz, une par chapitre (aligné sur la structure actuelle du site).
- **B.2** — Éclater par sous-section (`structure.json` en compte ~4-8 par chapitre), donc ~20 leçons quiz. Alignerait la granularité avec Algèbre linéaire mais demande de tagger les exercices par sous-section (le champ existe déjà dans `chapitre-*.json` sous `sousSection`, absent de `exercises.ts` site).

**Ma recommandation** : commencer par **B.1** (4 leçons chapitres) — c'est cohérent avec la façon dont la page Pratique présente déjà Prob-Stat, et évite d'ajouter le champ `sousSection` dans `exercises.ts`. Si tu veux plus de granularité plus tard, on peut migrer.

---

## 7. Questions à trancher avant implémentation

1. **Option A ou B ?** (voir §5). Recommandation : B.
2. **Granularité : B.1 (chapitres) ou B.2 (sous-sections) ?** Recommandation : B.1.
3. **Filtre par difficulté** dans l'UI ? Le pattern Algèbre linéaire n'en propose pas (juste CALC/QCM/V/F). Pour Prob-Stat, on pourrait exposer un slider ou 3 boutons Facile/Moyen/Difficile. À décider.
4. **Étiquette « CALC »** dans l'UI : garder « CALC » (cohérent avec Algèbre) ou renommer « Exercice » ? Recommandation : garder « CALC » pour cohérence.
5. **Divergence Firestore** : je confirme qu'on abandonne le script d'import Firestore (non nécessaire) ? Recommandation : oui.

---

## 8. Plan d'implémentation (si option B validée)

1. **Étape A** — Ajouter `PSD1, PSD2, PSD3, PSD4` à `CUSTOM_QUIZ_LESSONS` dans `customGenerators.ts`.
2. **Étape B** — Modifier `getAvailableTypes(lessonId)` pour reconnaître les IDs `PSD*` et retourner `{calc: true, mcq: true, tf: true}` (les 3 types existent dans chaque chapitre).
3. **Étape C** — Créer une fonction `pickProbStatExercise(lessonId, type, difficulty?)` qui :
   - Filtre `exercises` par `lessonId` et `type`
   - Optionnellement filtre par `difficulty`
   - Tire aléatoirement (avec évitement des doublons dans le même quiz)
4. **Étape D** — Modifier `buildCustomQuiz` pour appeler `pickProbStatExercise` quand `lessonId` commence par `PSD`.
5. **Étape E** — (Optionnel) Ajouter dans l'UI de `CustomQuiz.tsx` un sélecteur de difficulté quand la matière sélectionnée est Prob-Stat.
6. **Étape F** — Vérifier que le nom des 4 leçons dans `CustomQuiz.tsx` s'affiche correctement (utilise `lessons` de `data/lessons.ts`, qui donne « Chapitre 1 — Statistiques descriptives », etc.).
7. **Étape G** — Tests manuels (les 5 tests listés dans le prompt).

Aucun script d'import à écrire. Aucun package à installer. **~80 lignes de code au total**.

---

## En attente de ta validation

Merci de confirmer :
- [ ] Option A ou B
- [ ] Granularité B.1 (4 chapitres) ou B.2 (sous-sections)
- [ ] Filtre par difficulté oui/non
- [ ] Étiquette « CALC » ou autre
- [ ] Confirmer l'abandon du volet Firestore
