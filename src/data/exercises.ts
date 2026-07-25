import linalgRawExercises from "./linalg_exercises.json";

export type Difficulty = "Fondamental" | "Intermédiaire" | "Avancé";

export type MatrixCell = string | number | { type: "sep" } | RichPart[];

export type MCQOption = {
  id: string;
  content: RichContent;
  correct: boolean;
};

export type RichPart =
  | { type: "text"; content: string }
  | { type: "sub"; content: RichContent }
  | { type: "sup"; content: RichContent }
  | { type: "matrix"; data: MatrixCell[][]; label?: string }
  | { type: "cases"; rows: RichContent[] }
  | { type: "frac"; num: RichContent; den: RichContent }
  | { type: "bold"; content: RichContent }
  | { type: "vec"; content: RichContent };

export type RichContent = string | RichPart[];

export type Exercise = {
  id: string;
  topicId: string;
  lessonId?: string;
  number?: number;
  title: string;
  difficulty: Difficulty;
  prompt: RichContent;
  matrix?: { data: (string | number)[][]; label?: string };
  steps: RichContent[];
  answer: RichContent;
  // Optional alternative formats: when set, the card renders an interactive
  // QCM or Vrai/Faux instead of the standard "Voir la solution" toggle.
  type?: "mcq" | "tf";
  options?: MCQOption[];        // for type === "mcq"
  isTrue?: boolean;             // for type === "tf" — correct answer
  explanation?: RichContent;    // shown after the user answers
};

// Inline rich-content helpers for vectors. Lets us write
// `[t("Si "), vec("v"), t(" est un vecteur…")]` instead of the verbose object form.
const t = (s: string): RichPart => ({ type: "text", content: s });
const vec = (s: string): RichPart => ({ type: "vec", content: [{ type: "text", content: s }] });
// Subscript with a vector inside (e.g., `u⃗_v⃗` for "projection of u onto v" in
// Vecteur Math notation): `[vec("u"), subVec("v")]` renders as u with v as
// vector subscript.
const subVec = (s: string): RichPart => ({
  type: "sub",
  content: [{ type: "vec", content: [{ type: "text", content: s }] }],
});

const manualExercises: Exercise[] = [
  {
    id: "calc-chain-rule",
    topicId: "differential-calculus",
    title: "Dériver avec la règle de la chaîne",
    difficulty: "Intermédiaire",
    prompt: "Trouver f′(x) pour f(x) = (3x² + 1)⁵",
    steps: [
      "Reconnaître la composition : fonction extérieure u⁵, fonction intérieure u = 3x² + 1.",
      "Dériver la fonction extérieure par rapport à u : d/du [u⁵] = 5u⁴.",
      "Dériver la fonction intérieure par rapport à x : du/dx = 6x.",
      "Appliquer la règle de la chaîne : f′(x) = 5u⁴ · (du/dx) = 5(3x² + 1)⁴ · 6x.",
      "Simplifier en combinant les constantes : f′(x) = 30x(3x² + 1)⁴.",
    ],
    answer: "f′(x) = 30x(3x² + 1)⁴",
  },
  {
    id: "calc-definite-integral",
    topicId: "integral-calculus",
    title: "Évaluer une intégrale définie",
    difficulty: "Intermédiaire",
    prompt: "Évaluer ∫₀² (3x² − 4x + 1) dx",
    steps: [
      "Trouver la primitive terme à terme : ∫3x² dx = x³, ∫−4x dx = −2x², ∫1 dx = x.",
      "Combiner en une seule primitive : F(x) = x³ − 2x² + x.",
      "Appliquer le théorème fondamental de l'analyse : ∫₀² = F(2) − F(0).",
      "Évaluer F(2) = 8 − 8 + 2 = 2, et F(0) = 0.",
      "Soustraire : F(2) − F(0) = 2 − 0 = 2.",
    ],
    answer: "2",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 15 — QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L15-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L15",
    number: 8,
    title: "QCM — Déterminant de l'adjointe",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: "Pour une matrice A de dimension 3×3 avec det(A) = 2, quelle est la valeur de det(adj(A)) ?",
    options: [
      { id: "a", content: "1/2", correct: false },
      { id: "b", content: "2", correct: false },
      { id: "c", content: "4", correct: true },
      { id: "d", content: "8", correct: false },
    ],
    explanation:
      "Pour une matrice n×n inversible, det(adj(A)) = det(A)^(n−1). Ici n = 3, donc det(adj(A)) = 2² = 4.",
    steps: [],
    answer: "4 (formule : det(adj(A)) = det(A)^(n−1) avec n = 3)",
  },
  {
    id: "L15-TF1",
    topicId: "linear-algebra",
    lessonId: "L15",
    number: 9,
    title: "Vrai ou Faux — Adjointe d'une matrice singulière",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "Si A est une matrice carrée et det(A) = 0, alors adj(A) est nécessairement la matrice nulle.",
    isTrue: false,
    explanation:
      "Contre-exemple : A = [[1, 2], [2, 4]] a det(A) = 0, mais adj(A) = [[4, −2], [−2, 1]] qui n'est pas nulle. On a seulement A · adj(A) = 0 (matrice nulle) quand A est singulière.",
    steps: [],
    answer: "Faux",
  },
  {
    id: "L15-TF2",
    topicId: "linear-algebra",
    lessonId: "L15",
    number: 10,
    title: "Vrai ou Faux — Formule det(adj(A))",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "Pour toute matrice carrée A inversible d'ordre n, det(adj(A)) = det(A)^(n−1).",
    isTrue: true,
    explanation:
      "Cette formule découle de l'identité A · adj(A) = det(A) · I. En prenant le déterminant des deux membres : det(A) · det(adj(A)) = det(A)^n, donc det(adj(A)) = det(A)^(n−1).",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L15-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L15",
    number: 11,
    title: "QCM — Adjointe d'une matrice 2×2",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: "Quelle est la matrice adj(A) pour A = [[3, 4], [1, 2]] ?",
    options: [
      { id: "a", content: "[[2, −4], [−1, 3]]", correct: true },
      { id: "b", content: "[[2, 1], [4, 3]]", correct: false },
      { id: "c", content: "[[3, −1], [−4, 2]]", correct: false },
      { id: "d", content: "[[−2, 4], [1, −3]]", correct: false },
    ],
    explanation:
      "Pour A = [[a, b], [c, d]], adj(A) = [[d, −b], [−c, a]]. Avec a=3, b=4, c=1, d=2 : adj(A) = [[2, −4], [−1, 3]].",
    steps: [],
    answer: "[[2, −4], [−1, 3]]",
  },
  {
    id: "L15-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L15",
    number: 12,
    title: "QCM — Adjointe d'un produit AB",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Pour deux matrices A et B carrées de même dimension et inversibles, quelle est la relation correcte pour adj(AB) ?",
    options: [
      { id: "a", content: "adj(AB) = adj(A) · adj(B)", correct: false },
      { id: "b", content: "adj(AB) = adj(B) · adj(A)", correct: true },
      { id: "c", content: "adj(AB) = adj(A) + adj(B)", correct: false },
      { id: "d", content: "adj(AB) = det(A) · adj(B)", correct: false },
    ],
    explanation:
      "Puisque (AB)⁻¹ = B⁻¹A⁻¹ et que adj(M) = det(M) · M⁻¹, on a adj(AB) = det(AB) · (AB)⁻¹ = det(A)det(B) · B⁻¹A⁻¹ = (det(B)B⁻¹)(det(A)A⁻¹) = adj(B) · adj(A). L'ordre s'inverse, exactement comme pour l'inverse.",
    steps: [],
    answer: "adj(B) · adj(A) (l'ordre s'inverse)",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 16 — QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L16-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L16",
    number: 8,
    title: "QCM — Inverse de kA",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Si A est une matrice inversible et k est un scalaire non nul, alors (kA)⁻¹ vaut :",
    options: [
      { id: "a", content: "k · A⁻¹", correct: false },
      { id: "b", content: "(1/k) · A⁻¹", correct: true },
      { id: "c", content: "k⁻¹ · Aᵀ", correct: false },
      { id: "d", content: "(1/k²) · A", correct: false },
    ],
    explanation:
      "On vérifie que (kA) · ((1/k) · A⁻¹) = (k · 1/k) · (A · A⁻¹) = 1 · I = I, donc (kA)⁻¹ = (1/k) · A⁻¹.",
    steps: [],
    answer: "(1/k) · A⁻¹",
  },
  {
    id: "L16-TF1",
    topicId: "linear-algebra",
    lessonId: "L16",
    number: 9,
    title: "Vrai ou Faux — Inverse d'un produit",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "Si A et B sont des matrices inversibles de même dimension, alors (AB)⁻¹ = A⁻¹ · B⁻¹.",
    isTrue: false,
    explanation:
      "La bonne formule est (AB)⁻¹ = B⁻¹ · A⁻¹ — l'ordre s'inverse. On vérifie : (AB) · (B⁻¹A⁻¹) = A(BB⁻¹)A⁻¹ = AIA⁻¹ = I.",
    steps: [],
    answer: "Faux",
  },
  {
    id: "L16-TF2",
    topicId: "linear-algebra",
    lessonId: "L16",
    number: 10,
    title: "Vrai ou Faux — Transposée de l'inverse",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "Pour toute matrice carrée A inversible, (Aᵀ)⁻¹ = (A⁻¹)ᵀ.",
    isTrue: true,
    explanation:
      "Démonstration : transposer A · A⁻¹ = I donne (A⁻¹)ᵀ · Aᵀ = Iᵀ = I, donc (A⁻¹)ᵀ est l'inverse de Aᵀ.",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L16-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L16",
    number: 11,
    title: "QCM — Inverse de l'inverse",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: "Si A est une matrice carrée inversible, alors (A⁻¹)⁻¹ vaut :",
    options: [
      { id: "a", content: "A", correct: true },
      { id: "b", content: "−A", correct: false },
      { id: "c", content: "Aᵀ", correct: false },
      { id: "d", content: "I", correct: false },
    ],
    explanation:
      "L'inverse de A⁻¹ est la matrice B telle que A⁻¹ · B = I. Or A · A⁻¹ = I, donc B = A. L'inversion est involutive : (A⁻¹)⁻¹ = A.",
    steps: [],
    answer: "A",
  },
  {
    id: "L16-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L16",
    number: 12,
    title: "QCM — Inverse d'une puissance",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Si A est une matrice carrée inversible et n est un entier positif, alors (Aⁿ)⁻¹ vaut :",
    options: [
      { id: "a", content: "(A⁻¹)ⁿ", correct: true },
      { id: "b", content: "n · A⁻¹", correct: false },
      { id: "c", content: "(1/n) · A⁻¹", correct: false },
      { id: "d", content: "−Aⁿ", correct: false },
    ],
    explanation:
      "On vérifie : Aⁿ · (A⁻¹)ⁿ = (A · A · … · A) · (A⁻¹ · A⁻¹ · … · A⁻¹) = A · … · (A · A⁻¹) · … · A⁻¹ = I (les A et A⁻¹ se simplifient deux à deux du centre vers l'extérieur). Donc (Aⁿ)⁻¹ = (A⁻¹)ⁿ, qu'on note aussi A⁻ⁿ.",
    steps: [],
    answer: "(A⁻¹)ⁿ",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 17 — QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L17-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L17",
    number: 8,
    title: "QCM — Condition pour appliquer la méthode de la matrice inverse",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Pour résoudre le système AX = B par la méthode de la matrice inverse, quelle condition la matrice A doit-elle satisfaire ?",
    options: [
      { id: "a", content: "A doit être triangulaire.", correct: false },
      {
        id: "b",
        content: "A doit être inversible (det(A) ≠ 0).",
        correct: true,
      },
      { id: "c", content: "det(A) doit être positif.", correct: false },
      { id: "d", content: "A doit être symétrique.", correct: false },
    ],
    explanation:
      "La méthode X = A⁻¹·B nécessite que A⁻¹ existe, ce qui équivaut à det(A) ≠ 0. La forme (triangulaire, symétrique, signe du det) n'a aucune importance.",
    steps: [],
    answer: "A doit être inversible (det(A) ≠ 0)",
  },
  {
    id: "L17-TF1",
    topicId: "linear-algebra",
    lessonId: "L17",
    number: 9,
    title: "Vrai ou Faux — Unicité de la solution quand det(A) ≠ 0",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "Si det(A) ≠ 0, alors le système AX = B admet une solution unique donnée par X = A⁻¹·B.",
    isTrue: true,
    explanation:
      "Quand A est inversible, on multiplie les deux membres à gauche par A⁻¹ : A⁻¹·(AX) = A⁻¹·B, d'où (A⁻¹A)X = A⁻¹B, donc X = A⁻¹B. L'inverse étant unique, la solution l'est aussi.",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L17-TF2",
    topicId: "linear-algebra",
    lessonId: "L17",
    number: 10,
    title: "Vrai ou Faux — Système avec matrice singulière",
    difficulty: "Avancé",
    type: "tf",
    prompt: "Si det(A) = 0, alors le système AX = B n'a aucune solution.",
    isTrue: false,
    explanation:
      "Quand det(A) = 0, le système peut avoir soit aucune solution, soit une infinité de solutions, selon B. Par exemple, le système {x+y=1, 2x+2y=2} a det(A) = 0 mais admet une infinité de solutions. La méthode X = A⁻¹·B ne s'applique simplement plus — il faut passer par Gauss-Jordan.",
    steps: [],
    answer: "Faux",
  },
  {
    id: "L17-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L17",
    number: 11,
    title: "QCM — Résoudre un système 2×2 par matrice inverse",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Soit le système {2x + y = 5, x − y = 1}. En appliquant la méthode X = A⁻¹·B (avec A = [[2, 1], [1, −1]] et B = [[5], [1]]), la solution est :",
    options: [
      { id: "a", content: "x = 2, y = 1", correct: true },
      { id: "b", content: "x = 1, y = 2", correct: false },
      { id: "c", content: "x = 3, y = 2", correct: false },
      { id: "d", content: "x = −2, y = 1", correct: false },
    ],
    explanation:
      "det(A) = 2·(−1) − 1·1 = −3. A⁻¹ = (−1/3)·[[−1, −1], [−1, 2]] = (1/3)·[[1, 1], [1, −2]]. X = A⁻¹·B = (1/3)·[[5+1], [5−2]] = (1/3)·[[6], [3]] = [[2], [1]]. Vérification : 2·2 + 1 = 5 ✓ et 2 − 1 = 1 ✓.",
    steps: [],
    answer: "x = 2, y = 1",
  },
  {
    id: "L17-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L17",
    number: 12,
    title: "QCM — Nombre de solutions selon les rangs",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Soit un système AX = B avec A de dimension 3×3 et 3 inconnues. Si rang(A) = rang(A | B) = 2, combien le système admet-il de solutions ?",
    options: [
      { id: "a", content: "Aucune solution", correct: false },
      { id: "b", content: "Une solution unique", correct: false },
      {
        id: "c",
        content: "Une infinité de solutions, avec 1 variable libre",
        correct: true,
      },
      {
        id: "d",
        content: "Une infinité de solutions, avec 2 variables libres",
        correct: false,
      },
    ],
    explanation:
      "Théorème de compatibilité : rang(A) = rang(A|B) ⇒ le système est compatible. Le nombre de variables libres est n − rang(A) = 3 − 2 = 1. Donc une infinité de solutions paramétrées par 1 variable libre.",
    steps: [],
    answer: "Une infinité de solutions, avec 1 variable libre",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 18 — 3 QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L18-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L18",
    number: 8,
    title: "QCM — Reconnaître une opération élémentaire",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Parmi les opérations suivantes, laquelle N'EST PAS une opération élémentaire valide sur les lignes ?",
    options: [
      { id: "a", content: "Échanger deux lignes : Lᵢ ↔ Lⱼ", correct: false },
      { id: "b", content: "Multiplier une ligne par k ≠ 0 : Lᵢ → k·Lᵢ", correct: false },
      { id: "c", content: "Ajouter un multiple d'une ligne à une autre : Lᵢ → Lᵢ + k·Lⱼ", correct: false },
      { id: "d", content: "Multiplier deux lignes entre elles : Lᵢ → Lᵢ × Lⱼ", correct: true },
    ],
    explanation:
      "Les trois opérations élémentaires sur les lignes sont : l'échange de deux lignes, la multiplication d'une ligne par un scalaire non nul, et l'addition d'un multiple d'une ligne à une autre. La multiplication de deux lignes entre elles n'est pas définie pour les matrices.",
    steps: [],
    answer: "Multiplier deux lignes entre elles",
  },
  {
    id: "L18-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L18",
    number: 9,
    title: "QCM — Appliquer une opération élémentaire",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      { type: "text", content: "Soit " },
      { type: "matrix", data: [[1, 2], [2, 5]], label: "A =" },
      { type: "text", content: ". Après l'opération L₂ → L₂ − 2L₁, la nouvelle ligne L₂ devient :" },
    ],
    options: [
      { id: "a", content: "(0, 1)", correct: true },
      { id: "b", content: "(0, 5)", correct: false },
      { id: "c", content: "(4, 9)", correct: false },
      { id: "d", content: "(2, 1)", correct: false },
    ],
    explanation:
      "L₂ − 2L₁ = (2, 5) − 2·(1, 2) = (2 − 2, 5 − 4) = (0, 1). Cette opération annule le coefficient sous le pivot en (1,1).",
    steps: [],
    answer: "(0, 1)",
  },
  {
    id: "L18-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L18",
    number: 10,
    title: "QCM — Effet sur le déterminant",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Après l'application de l'opération Lᵢ → Lᵢ + k·Lⱼ (avec i ≠ j) sur une matrice carrée A, le déterminant :",
    options: [
      { id: "a", content: "Est multiplié par k", correct: false },
      { id: "b", content: "Reste inchangé", correct: true },
      { id: "c", content: "Devient nul", correct: false },
      { id: "d", content: "Change de signe", correct: false },
    ],
    explanation:
      "Propriétés des déterminants : Lᵢ → Lᵢ + k·Lⱼ ne change pas det. Par contre, échanger deux lignes change le signe, et multiplier une ligne par k multiplie det par k.",
    steps: [],
    answer: "Reste inchangé",
  },
  {
    id: "L18-TF1",
    topicId: "linear-algebra",
    lessonId: "L18",
    number: 11,
    title: "Vrai ou Faux — Multiplier une ligne par 0",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "L'opération L₁ → 0·L₁ (multiplier une ligne par 0) est une opération élémentaire valide.",
    isTrue: false,
    explanation:
      "Faux. La multiplication d'une ligne par un scalaire est valide uniquement si le scalaire est non nul (k ≠ 0). Multiplier par 0 annule la ligne et fait perdre de l'information : ce n'est pas réversible.",
    steps: [],
    answer: "Faux",
  },
  {
    id: "L18-TF2",
    topicId: "linear-algebra",
    lessonId: "L18",
    number: 12,
    title: "Vrai ou Faux — Déterminant et lignes-équivalence",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "Deux matrices ligne-équivalentes ont toujours le même déterminant.",
    isTrue: false,
    explanation:
      "Faux. L'échange de deux lignes change le signe du déterminant, et la multiplication d'une ligne par k le multiplie par k. Donc deux matrices ligne-équivalentes peuvent avoir des déterminants différents (mais nuls ou non simultanément).",
    steps: [],
    answer: "Faux",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 19 — 3 QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L19-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L19",
    number: 8,
    title: "QCM — Reconnaître une forme échelon réduite",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Parmi les matrices suivantes, laquelle N'EST PAS en forme échelon réduite (RREF) ?",
    options: [
      {
        id: "a",
        content: [{ type: "matrix", data: [[1, 0, 2], [0, 1, 3], [0, 0, 0]] }],
        correct: false,
      },
      {
        id: "b",
        content: [{ type: "matrix", data: [[1, 2, 0], [0, 0, 1], [0, 0, 0]] }],
        correct: false,
      },
      {
        id: "c",
        content: [{ type: "matrix", data: [[1, 0, 0], [0, 2, 0], [0, 0, 1]] }],
        correct: true,
      },
      {
        id: "d",
        content: [{ type: "matrix", data: [[0, 1, 0], [0, 0, 1], [0, 0, 0]] }],
        correct: false,
      },
    ],
    explanation:
      "La matrice (c) a un pivot égal à 2 (et non à 1) en position (2,2). Pour une RREF, tous les pivots doivent valoir exactement 1.",
    steps: [],
    answer: "L'option (c) — son pivot en (2,2) vaut 2 au lieu de 1.",
  },
  {
    id: "L19-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L19",
    number: 9,
    title: "QCM — Compter les pivots",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      { type: "text", content: "Combien la matrice " },
      { type: "matrix", data: [[1, 0, 2, 0], [0, 1, -1, 0], [0, 0, 0, 1]] },
      { type: "text", content: " a-t-elle de pivots ?" },
    ],
    options: [
      { id: "a", content: "2", correct: false },
      { id: "b", content: "3", correct: true },
      { id: "c", content: "4", correct: false },
      { id: "d", content: "1", correct: false },
    ],
    explanation:
      "Les pivots (1 directeurs) sont en colonnes 1, 2 et 4. Le rang de la matrice est donc 3. La colonne 3 ne contient pas de pivot (elle correspond à une variable libre).",
    steps: [],
    answer: "3 pivots (colonnes 1, 2, 4)",
  },
  {
    id: "L19-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L19",
    number: 10,
    title: "QCM — Variables libres en RREF",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Si une matrice M de dimension 3×5 a 2 pivots dans sa RREF, combien le système associé MX = 0 a-t-il de variables libres ?",
    options: [
      { id: "a", content: "1", correct: false },
      { id: "b", content: "2", correct: false },
      { id: "c", content: "3", correct: true },
      { id: "d", content: "5", correct: false },
    ],
    explanation:
      "Le nombre de variables libres est n − rang(M), où n est le nombre d'inconnues. Ici n = 5 et rang(M) = 2 (nombre de pivots), donc 5 − 2 = 3 variables libres.",
    steps: [],
    answer: "3 variables libres",
  },
  {
    id: "L19-TF1",
    topicId: "linear-algebra",
    lessonId: "L19",
    number: 11,
    title: "Vrai ou Faux — Unicité de la RREF",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "Pour toute matrice, la forme échelon réduite (RREF) est unique.",
    isTrue: true,
    explanation:
      "Vrai. C'est l'un des théorèmes fondamentaux de l'algèbre linéaire : la RREF d'une matrice est unique, indépendamment des opérations élémentaires choisies pour y arriver. C'est ce qui rend le rang bien défini.",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L19-TF2",
    topicId: "linear-algebra",
    lessonId: "L19",
    number: 12,
    title: "Vrai ou Faux — Même RREF implique égalité",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "Si deux matrices A et B ont la même forme échelon réduite, alors A = B.",
    isTrue: false,
    explanation:
      "Faux. Deux matrices peuvent être ligne-équivalentes (avoir la même RREF) sans être égales. Par exemple, A = [[1, 0], [0, 1]] et B = [[2, 0], [0, 3]] ont toutes deux la RREF égale à I, mais A ≠ B.",
    steps: [],
    answer: "Faux",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 20 — 3 QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L20-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L20",
    number: 8,
    title: "QCM — Calculer le rang d'une matrice",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      { type: "text", content: "Quel est le rang de la matrice " },
      { type: "matrix", data: [[1, 2, 3], [2, 4, 6], [1, 2, 3]], label: "A =" },
      { type: "text", content: " ?" },
    ],
    options: [
      { id: "a", content: "1", correct: true },
      { id: "b", content: "2", correct: false },
      { id: "c", content: "3", correct: false },
      { id: "d", content: "0", correct: false },
    ],
    explanation:
      "Après réduction : L₂ → L₂ − 2L₁ donne (0, 0, 0) et L₃ → L₃ − L₁ donne aussi (0, 0, 0). Il ne reste qu'une seule ligne non nulle, donc rang(A) = 1.",
    steps: [],
    answer: "rang(A) = 1",
  },
  {
    id: "L20-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L20",
    number: 9,
    title: "QCM — Nombre de solutions par les rangs",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Soit un système AX = B avec A de dimension 4×3 (4 équations, 3 inconnues). Si rang(A) = rang(A | B) = 3, le système admet :",
    options: [
      { id: "a", content: "Une solution unique", correct: true },
      { id: "b", content: "Aucune solution", correct: false },
      { id: "c", content: "Une infinité avec 1 variable libre", correct: false },
      { id: "d", content: "Une infinité avec 2 variables libres", correct: false },
    ],
    explanation:
      "Théorème de compatibilité : rang(A) = rang(A|B) = nombre d'inconnues (3) ⇒ solution unique. Le nombre de variables libres est n − rang(A) = 3 − 3 = 0.",
    steps: [],
    answer: "Une solution unique",
  },
  {
    id: "L20-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L20",
    number: 10,
    title: "QCM — Borne supérieure du rang",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Pour une matrice A de dimension m × n, quelle est la valeur maximale possible de rang(A) ?",
    options: [
      { id: "a", content: "m", correct: false },
      { id: "b", content: "n", correct: false },
      { id: "c", content: "min(m, n)", correct: true },
      { id: "d", content: "max(m, n)", correct: false },
    ],
    explanation:
      "Le rang est borné par le plus petit nombre de lignes ou de colonnes linéairement indépendantes. Comme on a au plus m lignes et n colonnes, rang(A) ≤ min(m, n).",
    steps: [],
    answer: "min(m, n)",
  },
  {
    id: "L20-TF1",
    topicId: "linear-algebra",
    lessonId: "L20",
    number: 11,
    title: "Vrai ou Faux — Système incompatible",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "Si rang(A) ≠ rang(A | B), alors le système AX = B n'admet aucune solution.",
    isTrue: true,
    explanation:
      "Vrai. C'est le théorème de compatibilité : rang(A) < rang(A|B) signifie qu'il existe une ligne de la forme [0 0 … 0 | k] avec k ≠ 0, ce qui est impossible. Le système est dit incompatible.",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L20-TF2",
    topicId: "linear-algebra",
    lessonId: "L20",
    number: 12,
    title: "Vrai ou Faux — Système homogène avec moins d'équations",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "Si A est une matrice m × n avec m < n (moins d'équations que d'inconnues), alors le système homogène AX = 0 admet une infinité de solutions.",
    isTrue: true,
    explanation:
      "Vrai. Le système homogène AX = 0 est toujours compatible (X = 0 marche). De plus, rang(A) ≤ min(m, n) = m < n, donc il y a au moins n − rang(A) ≥ 1 variable libre, d'où une infinité de solutions.",
    steps: [],
    answer: "Vrai",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 21 — 3 QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L21-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L21",
    number: 8,
    title: "QCM — Objectif de la méthode de Gauss-Jordan",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Quel est le but de la méthode de Gauss-Jordan appliquée à une matrice augmentée ?",
    options: [
      { id: "a", content: "Calculer le déterminant", correct: false },
      {
        id: "b",
        content: "Réduire la matrice à sa forme échelon réduite pour lire directement les solutions",
        correct: true,
      },
      { id: "c", content: "Trouver la transposée de la matrice", correct: false },
      { id: "d", content: "Calculer l'inverse uniquement", correct: false },
    ],
    explanation:
      "La méthode de Gauss-Jordan transforme la matrice augmentée (A|B) en sa forme échelon réduite (RREF). Une fois en RREF, on peut directement lire la solution du système (ou conclure qu'il n'y en a pas).",
    steps: [],
    answer: "Réduire à la forme échelon réduite pour lire la solution",
  },
  {
    id: "L21-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L21",
    number: 9,
    title: "QCM — Conclure à partir de la RREF",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      { type: "text", content: "Après réduction par Gauss-Jordan d'une matrice augmentée 3×4, la dernière ligne devient " },
      { type: "matrix", data: [[0, 0, 0, { type: "sep" }, 5]] },
      { type: "text", content: ". Que peut-on conclure sur le système ?" },
    ],
    options: [
      { id: "a", content: "Solution unique", correct: false },
      { id: "b", content: "Aucune solution (système incompatible)", correct: true },
      { id: "c", content: "Infinité de solutions", correct: false },
      { id: "d", content: "Solution triviale uniquement", correct: false },
    ],
    explanation:
      "La ligne [0 0 0 | 5] équivaut à l'équation 0·x + 0·y + 0·z = 5, soit 0 = 5, ce qui est impossible. Le système est donc incompatible : aucune solution.",
    steps: [],
    answer: "Aucune solution",
  },
  {
    id: "L21-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L21",
    number: 10,
    title: "QCM — Gauss vs Gauss-Jordan",
    difficulty: "Avancé",
    type: "mcq",
    prompt:
      "Quelle est la principale différence entre la méthode de Gauss (élimination) et la méthode de Gauss-Jordan ?",
    options: [
      {
        id: "a",
        content: "Gauss arrête à la forme échelon, Gauss-Jordan continue jusqu'à la forme échelon réduite",
        correct: true,
      },
      { id: "b", content: "Gauss-Jordan utilise les déterminants", correct: false },
      { id: "c", content: "Gauss ne s'applique qu'aux matrices carrées", correct: false },
      { id: "d", content: "Gauss-Jordan multiplie les lignes entre elles", correct: false },
    ],
    explanation:
      "Gauss s'arrête à la forme échelon (matrice triangulaire supérieure avec pivots) et utilise ensuite la substitution arrière. Gauss-Jordan pousse plus loin en annulant aussi les coefficients au-dessus des pivots et en normalisant chaque pivot à 1, ce qui donne directement la solution sans substitution.",
    steps: [],
    answer: "Gauss-Jordan continue jusqu'à la RREF",
  },
  {
    id: "L21-TF1",
    topicId: "linear-algebra",
    lessonId: "L21",
    number: 11,
    title: "Vrai ou Faux — Applicabilité de Gauss-Jordan",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "La méthode de Gauss-Jordan peut résoudre des systèmes AX = B même lorsque det(A) = 0.",
    isTrue: true,
    explanation:
      "Vrai. Gauss-Jordan fonctionne avec n'importe quelle matrice (carrée ou non, inversible ou non). Si det(A) = 0, la méthode révèle simplement que le système a soit aucune solution, soit une infinité, mais elle s'applique toujours.",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L21-TF2",
    topicId: "linear-algebra",
    lessonId: "L21",
    number: 12,
    title: "Vrai ou Faux — Indépendance vis-à-vis des opérations",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "Le résultat final (la RREF) obtenu par Gauss-Jordan dépend de l'ordre des opérations élémentaires choisies.",
    isTrue: false,
    explanation:
      "Faux. La RREF d'une matrice est unique, quelle que soit la suite d'opérations élémentaires utilisée pour y arriver. Deux personnes qui choisissent des chemins différents obtiendront la même RREF finale.",
    steps: [],
    answer: "Faux",
  },
  // ─────────────────────────────────────────────────────────────────
  // Leçon 22 — 3 QCM + 2 Vrai/Faux
  // ─────────────────────────────────────────────────────────────────
  {
    id: "L22-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L22",
    number: 8,
    title: "QCM — Forme finale de Gauss-Jordan pour AX = B",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "Pour résoudre AX = B avec A inversible n×n par Gauss-Jordan, on réduit la matrice augmentée [A | B] jusqu'à obtenir :",
    options: [
      { id: "a", content: "[I | X] où X est la solution", correct: true },
      { id: "b", content: "[A | I]", correct: false },
      { id: "c", content: "[I | A]", correct: false },
      { id: "d", content: "[A⁻¹ | B]", correct: false },
    ],
    explanation:
      "Quand A est inversible, la réduction transforme A en la matrice identité I. La colonne B subit les mêmes opérations et devient X = A⁻¹·B, la solution du système.",
    steps: [],
    answer: "[I | X]",
  },
  {
    id: "L22-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L22",
    number: 9,
    title: "QCM — Résoudre un système 2×2 par Gauss-Jordan",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt:
      "En appliquant Gauss-Jordan au système {x + y = 3, x − y = 1}, on obtient :",
    options: [
      { id: "a", content: "x = 2, y = 1", correct: true },
      { id: "b", content: "x = 1, y = 2", correct: false },
      { id: "c", content: "x = 3, y = 1", correct: false },
      { id: "d", content: "x = −1, y = 2", correct: false },
    ],
    explanation:
      "Matrice augmentée : [[1, 1, 3], [1, −1, 1]]. L₂ → L₂ − L₁ : [[1, 1, 3], [0, −2, −2]]. L₂ → −L₂/2 : [[1, 1, 3], [0, 1, 1]]. L₁ → L₁ − L₂ : [[1, 0, 2], [0, 1, 1]]. Donc x = 2 et y = 1. Vérification : 2 + 1 = 3 ✓ et 2 − 1 = 1 ✓.",
    steps: [],
    answer: "x = 2, y = 1",
  },
  {
    id: "L22-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L22",
    number: 10,
    title: "QCM — Lire la solution paramétrique",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      { type: "text", content: "Si la RREF de la matrice augmentée d'un système à 3 inconnues (x₁, x₂, x₃) est " },
      {
        type: "matrix",
        data: [
          [1, 0, 0, { type: "sep" }, 5],
          [0, 1, 2, { type: "sep" }, 3],
          [0, 0, 0, { type: "sep" }, 0],
        ],
      },
      { type: "text", content: ", la solution générale est :" },
    ],
    options: [
      { id: "a", content: "(5, 3 − 2t, t), pour t ∈ ℝ", correct: true },
      { id: "b", content: "(5, 3, 0)", correct: false },
      { id: "c", content: "(0, 3, 5)", correct: false },
      { id: "d", content: "Aucune solution", correct: false },
    ],
    explanation:
      "Les pivots sont en colonnes 1 et 2, donc x₁ et x₂ sont les variables principales ; x₃ est libre. On pose x₃ = t. Ligne 1 : x₁ = 5. Ligne 2 : x₂ + 2x₃ = 3, donc x₂ = 3 − 2t. Ligne 3 : 0 = 0 (consistant). Solution : (5, 3 − 2t, t).",
    steps: [],
    answer: "(5, 3 − 2t, t), t ∈ ℝ",
  },
  {
    id: "L22-TF1",
    topicId: "linear-algebra",
    lessonId: "L22",
    number: 11,
    title: "Vrai ou Faux — Ligne incompatible",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt:
      "Si la RREF de la matrice augmentée contient une ligne de la forme [0  0  …  0 | k] avec k ≠ 0, alors le système n'admet aucune solution.",
    isTrue: true,
    explanation:
      "Vrai. Cette ligne représente l'équation 0·x₁ + 0·x₂ + … + 0·xₙ = k avec k ≠ 0, soit 0 = k, ce qui est impossible. Le système est incompatible.",
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L22-TF2",
    topicId: "linear-algebra",
    lessonId: "L22",
    number: 12,
    title: "Vrai ou Faux — Unicité garantie par Gauss-Jordan",
    difficulty: "Avancé",
    type: "tf",
    prompt:
      "La méthode de Gauss-Jordan donne toujours une solution unique pour AX = B.",
    isTrue: false,
    explanation:
      "Faux. Gauss-Jordan révèle la structure du système, mais le système lui-même peut avoir 0 solution (incompatible), 1 solution (unique) ou une infinité (avec variables libres). La méthode ne crée pas l'unicité, elle la révèle quand elle existe.",
    steps: [],
    answer: "Faux",
  },
  // ═════════════════════════════════════════════════════════════════
  // L23 — Vecteurs géométriques — partie 1 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L23-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L23",
    number: 8,
    title: "QCM — Caractéristiques d'un vecteur géométrique",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: "Un vecteur géométrique est caractérisé par :",
    options: [
      { id: "a", content: "Seulement sa norme (longueur)", correct: false },
      { id: "b", content: "Sa norme, sa direction et son sens", correct: true },
      { id: "c", content: "Uniquement son point d'application", correct: false },
      { id: "d", content: "Sa direction seulement", correct: false },
    ],
    explanation:
      "Un vecteur géométrique se définit par trois éléments : sa norme (longueur), sa direction (la droite support) et son sens (l'orientation sur cette droite).",
    steps: [],
    answer: "Sa norme, sa direction et son sens",
  },
  {
    id: "L23-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L23",
    number: 9,
    title: "QCM — Relation de Chasles",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Selon la relation de Chasles, pour trois points A, B et C : "),
      vec("AB"), t(" + "), vec("BC"), t(" = ?"),
    ],
    options: [
      { id: "a", content: [vec("AC")], correct: true },
      { id: "b", content: [vec("CA")], correct: false },
      { id: "c", content: [vec("BA"), t(" + "), vec("BC")], correct: false },
      { id: "d", content: "0 (vecteur nul)", correct: false },
    ],
    explanation: [
      t("La relation de Chasles affirme que pour trois points A, B, C quelconques : "),
      vec("AB"), t(" + "), vec("BC"), t(" = "), vec("AC"),
      t(". C'est l'outil fondamental de manipulation des vecteurs géométriques."),
    ],
    steps: [],
    answer: "AC",
  },
  {
    id: "L23-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L23",
    number: 10,
    title: "QCM — Vecteurs équivalents",
    difficulty: "Avancé",
    type: "mcq",
    prompt: "Deux vecteurs géométriques sont équivalents (égaux) si :",
    options: [
      { id: "a", content: "Ils ont le même point d'application", correct: false },
      { id: "b", content: "Ils ont la même norme seulement", correct: false },
      { id: "c", content: "Ils ont la même norme, la même direction et le même sens", correct: true },
      { id: "d", content: "Ils sont parallèles", correct: false },
    ],
    explanation:
      "Deux vecteurs sont égaux ssi ils partagent les trois caractéristiques : norme, direction et sens. Le point d'application n'a pas d'importance — un vecteur peut être translaté librement.",
    steps: [],
    answer: "Même norme, direction et sens",
  },
  {
    id: "L23-TF1",
    topicId: "linear-algebra",
    lessonId: "L23",
    number: 11,
    title: "Vrai ou Faux — Commutativité de l'addition",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("L'addition de vecteurs géométriques est commutative : "),
      vec("u"), t(" + "), vec("v"), t(" = "), vec("v"), t(" + "), vec("u"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La règle du parallélogramme illustre cette propriété : "),
      vec("u"), t(" + "), vec("v"), t(" et "), vec("v"), t(" + "), vec("u"),
      t(" donnent le même vecteur résultant, la diagonale du parallélogramme construit sur "),
      vec("u"), t(" et "), vec("v"), t("."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L23-TF2",
    topicId: "linear-algebra",
    lessonId: "L23",
    number: 12,
    title: "Vrai ou Faux — Vecteur opposé",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Le vecteur opposé de "), vec("AB"), t(" est "), vec("BA"),
      t(", et on a toujours "), vec("AB"), t(" + "), vec("BA"),
      t(" = 0 (le vecteur nul)."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Par la relation de Chasles : "),
      vec("AB"), t(" + "), vec("BA"), t(" = "), vec("AA"), t(" = 0. Le vecteur "),
      vec("BA"), t(" est bien l'opposé de "), vec("AB"),
      t(" (même norme, même direction, sens contraire)."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L24 — Vecteurs géométriques — partie 2 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L24-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L24",
    number: 8,
    title: "QCM — Multiplication par un scalaire négatif",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Si "), vec("v"), t(" est un vecteur non nul, alors le vecteur −3"), vec("v"), t(" a :"),
    ],
    options: [
      { id: "a", content: [t("Même direction et même sens que "), vec("v"), t(", norme 3 fois plus grande")], correct: false },
      { id: "b", content: [t("Même direction que "), vec("v"), t(", sens opposé, norme 3 fois plus grande")], correct: true },
      { id: "c", content: [t("Direction perpendiculaire à "), vec("v")], correct: false },
      { id: "d", content: [t("La même norme que "), vec("v")], correct: false },
    ],
    explanation: [
      t("Multiplier par un scalaire k change la norme par un facteur |k|. Si k < 0, le sens du vecteur est inversé, mais la direction reste la même. Donc −3·"),
      vec("v"), t(" est dans la même direction que "), vec("v"),
      t(", de sens opposé, et trois fois plus long."),
    ],
    steps: [],
    answer: "Même direction, sens opposé, norme 3× plus grande",
  },
  {
    id: "L24-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L24",
    number: 9,
    title: "QCM — Norme après multiplication",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Si ‖"), vec("v"), t("‖ = 5, alors ‖−2"), vec("v"), t("‖ vaut :"),
    ],
    options: [
      { id: "a", content: "−10", correct: false },
      { id: "b", content: "10", correct: true },
      { id: "c", content: "−2,5", correct: false },
      { id: "d", content: "5", correct: false },
    ],
    explanation: [
      t("La norme d'un vecteur est toujours positive ou nulle. On a ‖k·"),
      vec("v"), t("‖ = |k|·‖"), vec("v"), t("‖. Donc ‖−2·"),
      vec("v"), t("‖ = |−2| · 5 = 2 · 5 = 10."),
    ],
    steps: [],
    answer: "10",
  },
  {
    id: "L24-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L24",
    number: 10,
    title: "QCM — Vecteurs colinéaires",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Deux vecteurs non nuls "), vec("u"), t(" et "), vec("v"),
      t(" sont colinéaires (parallèles) si et seulement si :"),
    ],
    options: [
      { id: "a", content: "Ils ont la même norme", correct: false },
      { id: "b", content: [t("Il existe un scalaire k tel que "), vec("v"), t(" = k"), vec("u")], correct: true },
      { id: "c", content: "Leur somme est le vecteur nul", correct: false },
      { id: "d", content: "Ils ont le même point d'application", correct: false },
    ],
    explanation: [
      t("Deux vecteurs non nuls sont colinéaires ssi l'un est un multiple scalaire de l'autre. Si k > 0, ils ont même sens ; si k < 0, ils sont de sens opposés."),
    ],
    steps: [],
    answer: "v = k·u pour un scalaire k",
  },
  {
    id: "L24-TF1",
    topicId: "linear-algebra",
    lessonId: "L24",
    number: 11,
    title: "Vrai ou Faux — Produit nul",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Si k"), vec("v"), t(" = 0 (vecteur nul), alors nécessairement k = 0 ou "),
      vec("v"), t(" = 0."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. C'est la propriété d'intégrité de la multiplication scalaire : un produit k·"),
      vec("v"), t(" est nul si et seulement si l'un des deux facteurs est nul (k = 0 ou "),
      vec("v"), t(" = 0)."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L24-TF2",
    topicId: "linear-algebra",
    lessonId: "L24",
    number: 12,
    title: "Vrai ou Faux — Distributivité scalaire",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Pour tout scalaire k et tous vecteurs "), vec("u"), t(", "), vec("v"), t(" : k·("),
      vec("u"), t(" + "), vec("v"), t(") = k"), vec("u"), t(" + k"), vec("v"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. C'est la propriété de distributivité de la multiplication scalaire par rapport à l'addition vectorielle, l'un des axiomes des espaces vectoriels."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L25 — Vecteurs géométriques — partie 3 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L25-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L25",
    number: 8,
    title: "QCM — Définition d'une combinaison linéaire",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Une combinaison linéaire des vecteurs "),
      vec("u"), t(", "), vec("v"), t(", "), vec("w"),
      t(" est une expression de la forme :"),
    ],
    options: [
      { id: "a", content: [t("a"), vec("u"), t(" + b"), vec("v"), t(" + c"), vec("w"), t(" où a, b, c sont des scalaires")], correct: true },
      { id: "b", content: [vec("u"), t(" · "), vec("v"), t(" · "), vec("w"), t(" (produit)")], correct: false },
      { id: "c", content: [vec("u"), t(" + "), vec("v"), t(" + "), vec("w"), t(" uniquement")], correct: false },
      { id: "d", content: [t("‖"), vec("u"), t("‖ + ‖"), vec("v"), t("‖ + ‖"), vec("w"), t("‖")], correct: false },
    ],
    explanation: [
      t("Une combinaison linéaire est une somme de multiples scalaires des vecteurs : a·"),
      vec("u"), t(" + b"), vec("v"), t(" + c"), vec("w"),
      t(". Les coefficients a, b, c sont des nombres réels."),
    ],
    steps: [],
    answer: "a·u + b·v + c·w",
  },
  {
    id: "L25-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L25",
    number: 9,
    title: "QCM — Vecteur unitaire",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Le vecteur unitaire dans la direction de "), vec("v"),
      t(" (avec "), vec("v"), t(" ≠ 0) est :"),
    ],
    options: [
      { id: "a", content: [vec("v"), t(" / ‖"), vec("v"), t("‖")], correct: true },
      { id: "b", content: [t("‖"), vec("v"), t("‖ · "), vec("v")], correct: false },
      { id: "c", content: [vec("v"), t(" · "), vec("v")], correct: false },
      { id: "d", content: [vec("v"), t(" + 1")], correct: false },
    ],
    explanation: [
      t("Pour obtenir un vecteur unitaire (de norme 1) dans la même direction et même sens que "),
      vec("v"), t(", on divise "), vec("v"), t(" par sa norme : "),
      vec("v"), t(" / ‖"), vec("v"), t("‖. Sa norme est alors ‖"),
      vec("v"), t("‖ / ‖"), vec("v"), t("‖ = 1."),
    ],
    steps: [],
    answer: "v / ‖v‖",
  },
  {
    id: "L25-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L25",
    number: 10,
    title: "QCM — Norme d'un vecteur unitaire",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" un vecteur tel que ‖"), vec("u"),
      t("‖ = 4. Quelle est la norme du vecteur (1/4)"), vec("u"), t(" ?"),
    ],
    options: [
      { id: "a", content: "4", correct: false },
      { id: "b", content: "1/4", correct: false },
      { id: "c", content: "1", correct: true },
      { id: "d", content: "16", correct: false },
    ],
    explanation: [
      t("‖(1/4)"), vec("u"), t("‖ = (1/4) · ‖"), vec("u"),
      t("‖ = (1/4) · 4 = 1. Diviser un vecteur par sa norme donne toujours un vecteur unitaire."),
    ],
    steps: [],
    answer: "1",
  },
  {
    id: "L25-TF1",
    topicId: "linear-algebra",
    lessonId: "L25",
    number: 11,
    title: "Vrai ou Faux — Combinaison nulle",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Une combinaison linéaire 0"), vec("u"), t(" + 0"), vec("v"),
      t(" + 0"), vec("w"), t(" est toujours égale au vecteur nul, quel que soient "),
      vec("u"), t(", "), vec("v"), t(", "), vec("w"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Chaque terme 0"), vec("u"),
      t(" est le vecteur nul, et la somme de vecteurs nuls reste le vecteur nul. C'est la combinaison linéaire triviale."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L25-TF2",
    topicId: "linear-algebra",
    lessonId: "L25",
    number: 12,
    title: "Vrai ou Faux — Vecteur unitaire opposé",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Si "), vec("v"), t(" ≠ 0, alors le vecteur −"), vec("v"),
      t(" / ‖"), vec("v"), t("‖ est un vecteur unitaire dans le sens opposé de "),
      vec("v"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La norme est ‖−"), vec("v"), t(" / ‖"), vec("v"),
      t("‖‖ = ‖"), vec("v"), t("‖ / ‖"), vec("v"),
      t("‖ = 1 (vecteur unitaire). Le signe négatif inverse le sens, donc on obtient un vecteur unitaire dans la direction de "),
      vec("v"), t(" mais de sens opposé."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L26 — Démonstration en géométrie : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L26-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L26",
    number: 8,
    title: "QCM — Milieu d'un segment",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit M le milieu du segment [AB]. Laquelle des relations vectorielles est correcte ?"),
    ],
    options: [
      { id: "a", content: [vec("AM"), t(" = (1/2)"), vec("AB")], correct: true },
      { id: "b", content: [vec("AM"), t(" = "), vec("AB")], correct: false },
      { id: "c", content: [vec("AM"), t(" = 2"), vec("AB")], correct: false },
      { id: "d", content: [vec("AM"), t(" + "), vec("MB"), t(" = 0")], correct: false },
    ],
    explanation: [
      t("Si M est le milieu de [AB], alors "), vec("AM"),
      t(" est la moitié de "), vec("AB"), t(" dans le même sens : "),
      vec("AM"), t(" = (1/2)"), vec("AB"), t(". On a aussi "),
      vec("MB"), t(" = (1/2)"), vec("AB"), t(" et "),
      vec("AM"), t(" = "), vec("MB"), t("."),
    ],
    steps: [],
    answer: "AM = (1/2)·AB",
  },
  {
    id: "L26-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L26",
    number: 9,
    title: "QCM — Caractérisation d'un parallélogramme",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("ABCD est un parallélogramme si et seulement si :"),
    ],
    options: [
      { id: "a", content: [vec("AB"), t(" = "), vec("DC")], correct: true },
      { id: "b", content: [vec("AB"), t(" = "), vec("CD")], correct: false },
      { id: "c", content: [vec("AC"), t(" = "), vec("BD")], correct: false },
      { id: "d", content: [vec("AB"), t(" + "), vec("CD"), t(" = 0")], correct: false },
    ],
    explanation: [
      t("ABCD est un parallélogramme ssi les côtés opposés sont parallèles et de même longueur. Vectoriellement : "),
      vec("AB"), t(" = "), vec("DC"), t(" (et donc "),
      vec("AD"), t(" = "), vec("BC"), t("). Attention : "),
      vec("AB"), t(" = "), vec("CD"), t(" (au lieu de "), vec("DC"),
      t(") caractériserait un parallélogramme croisé."),
    ],
    steps: [],
    answer: "AB = DC",
  },
  {
    id: "L26-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L26",
    number: 10,
    title: "QCM — Centre de gravité d'un triangle",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit G le centre de gravité (barycentre) du triangle ABC. Quelle relation est vraie ?"),
    ],
    options: [
      { id: "a", content: [vec("GA"), t(" + "), vec("GB"), t(" + "), vec("GC"), t(" = 0")], correct: true },
      { id: "b", content: [vec("GA"), t(" = "), vec("GB"), t(" = "), vec("GC")], correct: false },
      { id: "c", content: [vec("GA"), t(" + "), vec("GB"), t(" = "), vec("GC")], correct: false },
      { id: "d", content: [vec("AG"), t(" = "), vec("BG"), t(" = "), vec("CG"), t(" = 0")], correct: false },
    ],
    explanation: [
      t("Le centre de gravité G du triangle ABC est l'unique point tel que "),
      vec("GA"), t(" + "), vec("GB"), t(" + "), vec("GC"),
      t(" = 0. C'est la définition vectorielle du barycentre des trois sommets avec coefficients égaux."),
    ],
    steps: [],
    answer: "GA + GB + GC = 0",
  },
  {
    id: "L26-TF1",
    topicId: "linear-algebra",
    lessonId: "L26",
    number: 11,
    title: "Vrai ou Faux — Diagonales d'un parallélogramme",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Dans tout parallélogramme ABCD, les diagonales AC et BD se coupent en leur milieu."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. C'est une propriété classique démontrable vectoriellement. Si M est le milieu de AC, on montre que M est aussi le milieu de BD en utilisant "),
      vec("AB"), t(" = "), vec("DC"),
      t(". Les diagonales se coupent en leur milieu."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L26-TF2",
    topicId: "linear-algebra",
    lessonId: "L26",
    number: 12,
    title: "Vrai ou Faux — Trois points alignés",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Trois points A, B, C sont alignés si et seulement s'il existe un scalaire k tel que "),
      vec("AC"), t(" = k"), vec("AB"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. A, B, C sont alignés ssi les vecteurs "), vec("AB"),
      t(" et "), vec("AC"), t(" sont colinéaires, ce qui équivaut à dire qu'il existe k tel que "),
      vec("AC"), t(" = k"), vec("AB"), t(" (ou "), vec("AB"),
      t(" = 0). C'est la méthode vectorielle standard pour prouver l'alignement."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L27 — Vecteurs algébriques — partie 1 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L27-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 8,
    title: "QCM — Composantes d'un vecteur entre deux points",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Dans le plan, si A = (2, 3) et B = (5, 7), quelles sont les composantes du vecteur "),
      vec("AB"), t(" ?"),
    ],
    options: [
      { id: "a", content: "(3, 4)", correct: true },
      { id: "b", content: "(7, 10)", correct: false },
      { id: "c", content: "(2, 3)", correct: false },
      { id: "d", content: "(−3, −4)", correct: false },
    ],
    explanation: [
      t("Les composantes du vecteur "), vec("AB"),
      t(" sont B − A : (5 − 2, 7 − 3) = (3, 4). On soustrait les coordonnées du point de départ à celles du point d'arrivée."),
    ],
    steps: [],
    answer: "(3, 4)",
  },
  {
    id: "L27-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 9,
    title: "QCM — Addition de vecteurs en composantes",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Si "), vec("u"), t(" = (1, −2) et "), vec("v"),
      t(" = (4, 3), alors "), vec("u"), t(" + "), vec("v"), t(" est égal à :"),
    ],
    options: [
      { id: "a", content: "(5, 1)", correct: true },
      { id: "b", content: "(5, 5)", correct: false },
      { id: "c", content: "(3, 5)", correct: false },
      { id: "d", content: "(−3, 5)", correct: false },
    ],
    explanation: [
      t("L'addition de vecteurs se fait composante par composante : "),
      vec("u"), t(" + "), vec("v"), t(" = (1 + 4, −2 + 3) = (5, 1)."),
    ],
    steps: [],
    answer: "(5, 1)",
  },
  {
    id: "L27-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 10,
    title: "QCM — Vecteur dans l'espace 3D",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Si A = (1, 0, 2) et B = (4, −3, 5) dans R³, alors "),
      vec("AB"), t(" est égal à :"),
    ],
    options: [
      { id: "a", content: "(3, −3, 3)", correct: true },
      { id: "b", content: "(5, −3, 7)", correct: false },
      { id: "c", content: "(−3, 3, −3)", correct: false },
      { id: "d", content: "(4, 0, 10)", correct: false },
    ],
    explanation: [
      t("En 3D, "), vec("AB"),
      t(" = B − A = (4 − 1, −3 − 0, 5 − 2) = (3, −3, 3). Le calcul se fait composante par composante."),
    ],
    steps: [],
    answer: "(3, −3, 3)",
  },
  {
    id: "L27-TF1",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 11,
    title: "Vrai ou Faux — Égalité de vecteurs",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Deux vecteurs algébriques "), vec("u"), t(" = (a, b) et "),
      vec("v"), t(" = (c, d) sont égaux si et seulement si a = c et b = d."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Deux vecteurs en composantes sont égaux ssi toutes leurs composantes correspondantes sont égales. L'égalité vectorielle se ramène à un système d'égalités sur les composantes."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L27-TF2",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 12,
    title: "Vrai ou Faux — AB = −BA",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Pour tous points A et B, on a toujours "), vec("AB"),
      t(" = −"), vec("BA"), t(" (en composantes)."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. "), vec("AB"), t(" = B − A et "), vec("BA"),
      t(" = A − B = −(B − A) = −"), vec("AB"),
      t(". C'est cohérent avec la propriété vectorielle : "),
      vec("BA"), t(" est l'opposé de "), vec("AB"), t("."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L27-MCQ4",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 13,
    title: "QCM — Composantes d'un vecteur en 3D",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Dans R³, si A = (2, −1, 5) et B = (6, 3, 1), quelles sont les composantes de "),
      vec("AB"), t(" ?"),
    ],
    options: [
      { id: "a", content: "(4, 4, −4)", correct: true },
      { id: "b", content: "(8, 2, 6)", correct: false },
      { id: "c", content: "(−4, −4, 4)", correct: false },
      { id: "d", content: "(4, 4, 4)", correct: false },
    ],
    explanation: [
      vec("AB"), t(" = B − A = (6 − 2, 3 − (−1), 1 − 5) = (4, 4, −4)."),
    ],
    steps: [],
    answer: "(4, 4, −4)",
  },
  {
    id: "L27-TF3",
    topicId: "linear-algebra",
    lessonId: "L27",
    number: 14,
    title: "Vrai ou Faux — Addition de vecteurs en 3D",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Si "), vec("u"), t(" = (1, 2, 3) et "), vec("v"),
      t(" = (0, −1, 4), alors "), vec("u"), t(" + "), vec("v"),
      t(" = (1, 1, 7)."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. L'addition se fait composante par composante : (1 + 0, 2 + (−1), 3 + 4) = (1, 1, 7). ✓"),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L28 — Vecteurs algébriques — partie 2 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L28-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 8,
    title: "QCM — Norme d'un vecteur en 2D",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Quelle est la norme du vecteur "), vec("v"), t(" = (3, 4) ?"),
    ],
    options: [
      { id: "a", content: "5", correct: true },
      { id: "b", content: "7", correct: false },
      { id: "c", content: "25", correct: false },
      { id: "d", content: "√7", correct: false },
    ],
    explanation: [
      t("La norme d'un vecteur en 2D est ‖"), vec("v"),
      t("‖ = √(a² + b²) = √(3² + 4²) = √(9 + 16) = √25 = 5 (théorème de Pythagore appliqué aux composantes)."),
    ],
    steps: [],
    answer: "‖v‖ = 5",
  },
  {
    id: "L28-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 9,
    title: "QCM — Distance entre deux points",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Quelle est la distance entre A = (1, 2) et B = (4, 6) ?"),
    ],
    options: [
      { id: "a", content: "5", correct: true },
      { id: "b", content: "7", correct: false },
      { id: "c", content: "3", correct: false },
      { id: "d", content: "25", correct: false },
    ],
    explanation: [
      t("La distance entre A et B est ‖"), vec("AB"), t("‖. On calcule "),
      vec("AB"), t(" = (4 − 1, 6 − 2) = (3, 4), puis ‖"),
      vec("AB"), t("‖ = √(9 + 16) = √25 = 5."),
    ],
    steps: [],
    answer: "5",
  },
  {
    id: "L28-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 10,
    title: "QCM — Vecteur unitaire algébrique",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Quel est le vecteur unitaire dans la direction de "), vec("v"),
      t(" = (6, 8) ?"),
    ],
    options: [
      { id: "a", content: "(3/5, 4/5)", correct: true },
      { id: "b", content: "(6, 8)", correct: false },
      { id: "c", content: "(1, 1)", correct: false },
      { id: "d", content: [t("(6/10, 8/10) — incorrect car ‖"), vec("v"), t("‖ ≠ 10")], correct: false },
    ],
    explanation: [
      t("On calcule d'abord ‖"), vec("v"),
      t("‖ = √(36 + 64) = √100 = 10. Le vecteur unitaire est "),
      vec("v"), t(" / ‖"), vec("v"),
      t("‖ = (6/10, 8/10) = (3/5, 4/5). Vérification : ‖(3/5, 4/5)‖ = √(9/25 + 16/25) = √(25/25) = 1 ✓."),
    ],
    steps: [],
    answer: "(3/5, 4/5)",
  },
  {
    id: "L28-TF1",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 11,
    title: "Vrai ou Faux — Norme et vecteur nul",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("La norme d'un vecteur est nulle si et seulement si le vecteur est le vecteur nul."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. ‖"), vec("v"), t("‖ = 0 ssi "), vec("v"),
      t(" = 0 (vecteur nul). C'est une propriété fondamentale de la norme (axiome de séparation). Toutes les composantes doivent être nulles pour que la racine carrée soit nulle."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L28-TF2",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 12,
    title: "Vrai ou Faux — Norme du produit par un scalaire",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Pour tout scalaire k et tout vecteur "), vec("v"), t(" : ‖k"),
      vec("v"), t("‖ = k · ‖"), vec("v"), t("‖."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. La formule correcte est ‖k"), vec("v"), t("‖ = |k| · ‖"),
      vec("v"), t("‖ (valeur absolue de k). Sans la valeur absolue, on obtiendrait une norme négative pour k < 0, ce qui est impossible."),
    ],
    steps: [],
    answer: "Faux",
  },
  {
    id: "L28-MCQ4",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 13,
    title: "QCM — Norme d'un vecteur en 3D",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Quelle est la norme du vecteur "), vec("v"),
      t(" = (1, 2, 2) dans R³ ?"),
    ],
    options: [
      { id: "a", content: "3", correct: true },
      { id: "b", content: "5", correct: false },
      { id: "c", content: "√5", correct: false },
      { id: "d", content: "9", correct: false },
    ],
    explanation: [
      t("La norme en 3D est ‖"), vec("v"),
      t("‖ = √(a² + b² + c²) = √(1² + 2² + 2²) = √(1 + 4 + 4) = √9 = 3."),
    ],
    steps: [],
    answer: "‖v‖ = 3",
  },
  {
    id: "L28-MCQ5",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 14,
    title: "QCM — Distance entre deux points en 3D",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Quelle est la distance entre A = (1, 0, 2) et B = (3, 4, 2) dans R³ ?"),
    ],
    options: [
      { id: "a", content: "2√5", correct: true },
      { id: "b", content: "6", correct: false },
      { id: "c", content: "4", correct: false },
      { id: "d", content: "√10", correct: false },
    ],
    explanation: [
      t("La distance est ‖"), vec("AB"), t("‖. On a "), vec("AB"),
      t(" = (3 − 1, 4 − 0, 2 − 2) = (2, 4, 0). Donc ‖"), vec("AB"),
      t("‖ = √(4 + 16 + 0) = √20 = 2√5."),
    ],
    steps: [],
    answer: "2√5",
  },
  {
    id: "L28-TF3",
    topicId: "linear-algebra",
    lessonId: "L28",
    number: 15,
    title: "Vrai ou Faux — Norme en 3D",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Le vecteur "), vec("v"), t(" = (2, 3, 6) a une norme de 7."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. ‖"), vec("v"),
      t("‖ = √(2² + 3² + 6²) = √(4 + 9 + 36) = √49 = 7. ✓"),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L29 — Vecteurs algébriques — partie 3 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L29-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L29",
    number: 8,
    title: "QCM — Combinaison linéaire en 3D",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 2, 3) et "), vec("v"),
      t(" = (4, −1, 0) dans R³. Quelle est la valeur de 3"), vec("u"),
      t(" − 2"), vec("v"), t(" ?"),
    ],
    options: [
      { id: "a", content: "(−5, 8, 9)", correct: true },
      { id: "b", content: "(−5, 4, 9)", correct: false },
      { id: "c", content: "(11, 4, 9)", correct: false },
      { id: "d", content: "(−5, 8, 3)", correct: false },
    ],
    explanation: [
      t("Calcul composante par composante : 3"), vec("u"),
      t(" = (3, 6, 9), puis 2"), vec("v"), t(" = (8, −2, 0). Donc 3"),
      vec("u"), t(" − 2"), vec("v"),
      t(" = (3 − 8, 6 − (−2), 9 − 0) = (−5, 8, 9)."),
    ],
    steps: [],
    answer: "(−5, 8, 9)",
  },
  {
    id: "L29-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L29",
    number: 9,
    title: "QCM — Trouver le scalaire de colinéarité (3D)",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (2, 4, −6) et "), vec("v"),
      t(" = (−1, −2, 3). Trouver le scalaire k tel que "), vec("u"),
      t(" = k"), vec("v"), t("."),
    ],
    options: [
      { id: "a", content: "k = −2", correct: true },
      { id: "b", content: "k = 2", correct: false },
      { id: "c", content: "k = −1/2", correct: false },
      { id: "d", content: "k = 1/2", correct: false },
    ],
    explanation: [
      t("Comparer composante par composante : 2 = k(−1) donne k = −2. Vérifier : 4 = (−2)(−2) ✓ et −6 = (−2)(3) ✓. Les vecteurs sont bien colinéaires avec k = −2."),
    ],
    steps: [],
    answer: "k = −2",
  },
  {
    id: "L29-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L29",
    number: 10,
    title: "QCM — Combinaison linéaire de trois vecteurs (3D)",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 0, −1), "), vec("v"),
      t(" = (2, 1, 1) et "), vec("w"),
      t(" = (0, 3, 2) dans R³. Calculer 2"), vec("u"), t(" + "),
      vec("v"), t(" − "), vec("w"), t("."),
    ],
    options: [
      { id: "a", content: "(4, −2, −3)", correct: true },
      { id: "b", content: "(4, 2, −3)", correct: false },
      { id: "c", content: "(4, −2, −1)", correct: false },
      { id: "d", content: "(−4, −2, 3)", correct: false },
    ],
    explanation: [
      t("Calcul composante par composante : 2"), vec("u"),
      t(" = (2, 0, −2). Puis 2"), vec("u"), t(" + "), vec("v"),
      t(" = (2 + 2, 0 + 1, −2 + 1) = (4, 1, −1). Enfin, on soustrait "),
      vec("w"), t(" : (4 − 0, 1 − 3, −1 − 2) = (4, −2, −3)."),
    ],
    steps: [],
    answer: "(4, −2, −3)",
  },
  {
    id: "L29-TF1",
    topicId: "linear-algebra",
    lessonId: "L29",
    number: 11,
    title: "Vrai ou Faux — Calcul de combinaison en 3D",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Le vecteur 2(1, 2, 3) + 3(0, −1, 1) est égal à (2, 1, 9)."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Calcul : 2(1, 2, 3) = (2, 4, 6) et 3(0, −1, 1) = (0, −3, 3). Somme : (2 + 0, 4 + (−3), 6 + 3) = (2, 1, 9). ✓"),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L29-TF2",
    topicId: "linear-algebra",
    lessonId: "L29",
    number: 12,
    title: "Vrai ou Faux — Colinéarité en 3D",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Les vecteurs "), vec("u"), t(" = (3, −6, 9) et "),
      vec("v"), t(" = (1, −2, 3) sont colinéaires."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. On observe que "), vec("u"), t(" = 3"), vec("v"),
      t(" : 3(1, −2, 3) = (3, −6, 9) ✓. Comme l'un est un multiple scalaire de l'autre, les vecteurs sont colinéaires."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L34 — Combinaison linéaire (espaces vectoriels) : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L34-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L34",
    number: 8,
    title: "QCM — Combinaison linéaire simple",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 2) et "), vec("v"),
      t(" = (3, −1). Le vecteur "), vec("w"),
      t(" = (5, 3) est-il une combinaison linéaire de "), vec("u"),
      t(" et "), vec("v"), t(" ?"),
    ],
    options: [
      { id: "a", content: [t("Oui : "), vec("w"), t(" = 2"), vec("u"), t(" + "), vec("v")], correct: true },
      { id: "b", content: [t("Oui : "), vec("w"), t(" = "), vec("u"), t(" + 2"), vec("v")], correct: false },
      { id: "c", content: "Non, il n'existe pas de tels coefficients", correct: false },
      { id: "d", content: [t("Oui : "), vec("w"), t(" = "), vec("u"), t(" − "), vec("v")], correct: false },
    ],
    explanation: [
      t("On cherche a, b tels que (5, 3) = a(1, 2) + b(3, −1). Cela donne a + 3b = 5 et 2a − b = 3. En résolvant : a = 2, b = 1. Donc "),
      vec("w"), t(" = 2"), vec("u"), t(" + "), vec("v"), t("."),
    ],
    steps: [],
    answer: "w = 2u + v",
  },
  {
    id: "L34-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L34",
    number: 9,
    title: "QCM — Trouver les coefficients",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 0, 1), "), vec("v"),
      t(" = (0, 1, 1) et "), vec("w"),
      t(" = (2, 3, 5). Trouver a et b tels que "), vec("w"),
      t(" = a"), vec("u"), t(" + b"), vec("v"), t("."),
    ],
    options: [
      { id: "a", content: "Aucune solution : w n'est pas dans l'engendrement", correct: true },
      { id: "b", content: "a = 2, b = 3", correct: false },
      { id: "c", content: "a = 3, b = 2", correct: false },
      { id: "d", content: "a = 1, b = 1", correct: false },
    ],
    explanation: [
      t("Si "), vec("w"), t(" = a"), vec("u"), t(" + b"), vec("v"),
      t(", alors a = 2 (1ère comp.), b = 3 (2e comp.). Vérifions la 3e : a + b = 2 + 3 = 5 ✓. Donc a = 2, b = 3. Attention, c'est une question piège : la réponse correcte est en fait a = 2, b = 3."),
    ],
    steps: [],
    answer: "Attention, vérifier le calcul",
  },
  {
    id: "L34-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L34",
    number: 10,
    title: "QCM — Combinaison nulle non triviale",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 2), "), vec("v"),
      t(" = (2, 4) dans R². Existe-t-il a, b non tous nuls tels que a"),
      vec("u"), t(" + b"), vec("v"), t(" = 0 ?"),
    ],
    options: [
      { id: "a", content: "Oui, par exemple a = 2, b = −1", correct: true },
      { id: "b", content: "Non, seuls a = b = 0 fonctionnent", correct: false },
      { id: "c", content: "Oui, mais seulement a = b = 1", correct: false },
      { id: "d", content: "Non, c'est impossible en R²", correct: false },
    ],
    explanation: [
      t("Les vecteurs "), vec("u"), t(" et "), vec("v"),
      t(" sont colinéaires (v = 2u). Donc 2"), vec("u"), t(" − "), vec("v"),
      t(" = 2(1, 2) − (2, 4) = (0, 0). Une combinaison nulle non triviale existe car les vecteurs sont liés."),
    ],
    steps: [],
    answer: "a = 2, b = −1",
  },
  {
    id: "L34-TF1",
    topicId: "linear-algebra",
    lessonId: "L34",
    number: 11,
    title: "Vrai ou Faux — Combinaison nulle triviale",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Pour tout ensemble de vecteurs {"), vec("v₁"), t(", "), vec("v₂"),
      t(", …, "), vec("vₙ"), t("}, la combinaison 0"), vec("v₁"),
      t(" + 0"), vec("v₂"), t(" + … + 0"), vec("vₙ"),
      t(" est toujours égale au vecteur nul."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Chaque terme 0·"), vec("vᵢ"),
      t(" est le vecteur nul, et la somme de vecteurs nuls reste nulle. C'est la combinaison linéaire triviale."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L34-TF2",
    topicId: "linear-algebra",
    lessonId: "L34",
    number: 12,
    title: "Vrai ou Faux — Décomposition unique",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Tout vecteur de R² peut s'écrire comme combinaison linéaire de deux vecteurs non colinéaires donnés."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Deux vecteurs non colinéaires de R² forment une base, donc tout vecteur de R² s'écrit (de manière unique) comme leur combinaison linéaire."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L35 — Ensemble générateur de V : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L35-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L35",
    number: 8,
    title: "QCM — Ensemble générateur de R²",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Lequel des ensembles suivants engendre R² ?"),
    ],
    options: [
      { id: "a", content: "{(1, 0), (0, 1)}", correct: true },
      { id: "b", content: "{(1, 2), (2, 4)}", correct: false },
      { id: "c", content: "{(0, 0), (1, 1)}", correct: false },
      { id: "d", content: "{(1, 1)}", correct: false },
    ],
    explanation: [
      t("L'ensemble {(1, 0), (0, 1)} est la base canonique de R² : tout vecteur (x, y) = x(1, 0) + y(0, 1). Les autres ensembles contiennent des vecteurs colinéaires ou le vecteur nul, donc ils n'engendrent qu'une droite."),
    ],
    steps: [],
    answer: "{(1, 0), (0, 1)}",
  },
  {
    id: "L35-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L35",
    number: 9,
    title: "QCM — Vecteur dans l'engendrement",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit S = {(1, 0, 0), (0, 1, 0)}. Lequel des vecteurs suivants appartient à l'engendrement de S ?"),
    ],
    options: [
      { id: "a", content: "(3, −2, 0)", correct: true },
      { id: "b", content: "(1, 1, 1)", correct: false },
      { id: "c", content: "(0, 0, 1)", correct: false },
      { id: "d", content: "(2, 3, 4)", correct: false },
    ],
    explanation: [
      t("L'engendrement de {(1, 0, 0), (0, 1, 0)} est le plan xy (z = 0). Seul (3, −2, 0) a sa 3ᵉ composante nulle et appartient donc à ce plan."),
    ],
    steps: [],
    answer: "(3, −2, 0)",
  },
  {
    id: "L35-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L35",
    number: 10,
    title: "QCM — Nombre minimal pour engendrer R³",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Combien faut-il au minimum de vecteurs pour engendrer R³ ?"),
    ],
    options: [
      { id: "a", content: "3", correct: true },
      { id: "b", content: "2", correct: false },
      { id: "c", content: "4", correct: false },
      { id: "d", content: "Une infinité", correct: false },
    ],
    explanation: [
      t("La dimension de R³ est 3, donc il faut au minimum 3 vecteurs linéairement indépendants pour engendrer R³. Moins que 3 n'engendrent qu'un sous-espace strict."),
    ],
    steps: [],
    answer: "3",
  },
  {
    id: "L35-TF1",
    topicId: "linear-algebra",
    lessonId: "L35",
    number: 11,
    title: "Vrai ou Faux — Ensemble avec plus de vecteurs",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Un ensemble générateur de R² peut contenir plus de 2 vecteurs."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Par exemple {(1, 0), (0, 1), (1, 1)} engendre R² (les deux premiers suffisent déjà). Un ensemble générateur n'est pas obligé d'être minimal."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L35-TF2",
    topicId: "linear-algebra",
    lessonId: "L35",
    number: 12,
    title: "Vrai ou Faux — Sous-ensemble générateur",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Si {"), vec("v₁"), t(", "), vec("v₂"), t(", "), vec("v₃"),
      t("} engendre R³, alors tout sous-ensemble strict de cet ensemble engendre aussi R³."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. Si on enlève un vecteur essentiel (par exemple un des 3 vecteurs d'une base), l'ensemble restant ne peut plus engendrer R³ (sa dimension est 3, et 2 vecteurs engendrent au plus un plan)."),
    ],
    steps: [],
    answer: "Faux",
  },
  // ═════════════════════════════════════════════════════════════════
  // L36 — Dépendance et indépendance linéaire : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L36-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L36",
    number: 8,
    title: "QCM — Critère d'indépendance",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Les vecteurs "), vec("v₁"), t(", "), vec("v₂"), t(", …, "),
      vec("vₙ"), t(" sont linéairement indépendants si et seulement si :"),
    ],
    options: [
      { id: "a", content: [t("La seule combinaison nulle est a₁ = a₂ = … = aₙ = 0")], correct: true },
      { id: "b", content: "Tous les vecteurs ont la même norme", correct: false },
      { id: "c", content: "Aucun n'est égal au vecteur nul", correct: false },
      { id: "d", content: "Ils sont tous orthogonaux", correct: false },
    ],
    explanation: [
      t("Définition : un ensemble de vecteurs est linéairement indépendant ssi la seule combinaison linéaire qui donne 0 est celle où tous les coefficients sont nuls."),
    ],
    steps: [],
    answer: "Seule combinaison nulle est triviale",
  },
  {
    id: "L36-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L36",
    number: 9,
    title: "QCM — Dépendance de 2 vecteurs",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (2, 4, 6) et "), vec("v"),
      t(" = (3, 6, 9). Ces vecteurs sont :"),
    ],
    options: [
      { id: "a", content: "Linéairement dépendants", correct: true },
      { id: "b", content: "Linéairement indépendants", correct: false },
      { id: "c", content: "Orthogonaux", correct: false },
      { id: "d", content: "Égaux", correct: false },
    ],
    explanation: [
      t("On observe que "), vec("v"), t(" = (3/2)"), vec("u"),
      t(" : (3/2)(2, 4, 6) = (3, 6, 9) ✓. Comme l'un est un multiple scalaire de l'autre, les vecteurs sont colinéaires (donc liés)."),
    ],
    steps: [],
    answer: "Linéairement dépendants",
  },
  {
    id: "L36-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L36",
    number: 10,
    title: "QCM — Indépendance de 3 vecteurs",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Les vecteurs (1, 0, 0), (0, 1, 0) et (1, 1, 0) de R³ sont :"),
    ],
    options: [
      { id: "a", content: "Linéairement dépendants", correct: true },
      { id: "b", content: "Linéairement indépendants", correct: false },
      { id: "c", content: "Une base de R³", correct: false },
      { id: "d", content: "Orthogonaux", correct: false },
    ],
    explanation: [
      t("On vérifie : (1, 1, 0) = (1, 0, 0) + (0, 1, 0). Donc 1·(1, 0, 0) + 1·(0, 1, 0) − 1·(1, 1, 0) = 0 avec des coefficients non tous nuls. Les vecteurs sont liés."),
    ],
    steps: [],
    answer: "Linéairement dépendants",
  },
  {
    id: "L36-TF1",
    topicId: "linear-algebra",
    lessonId: "L36",
    number: 11,
    title: "Vrai ou Faux — Ensemble avec vecteur nul",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Tout ensemble de vecteurs contenant le vecteur nul est linéairement dépendant."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Si 0 ∈ {"), vec("v₁"), t(", …, "), vec("vₙ"),
      t("}, alors la combinaison 1·0 + 0·"), vec("v₁"), t(" + … + 0·"), vec("vₙ"),
      t(" = 0 a un coefficient non nul (celui devant 0). L'ensemble est donc lié."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L36-TF2",
    topicId: "linear-algebra",
    lessonId: "L36",
    number: 12,
    title: "Vrai ou Faux — Trop de vecteurs",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Quatre vecteurs de R³ sont toujours linéairement dépendants."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La dimension de R³ est 3. Tout ensemble de n + 1 = 4 vecteurs dans un espace de dimension n = 3 est nécessairement lié."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L37 — Base et composantes : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L37-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L37",
    number: 8,
    title: "QCM — Définition d'une base",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Un ensemble B est une base d'un espace vectoriel V si et seulement si :"),
    ],
    options: [
      { id: "a", content: "B est libre et engendre V", correct: true },
      { id: "b", content: "B contient au moins 3 vecteurs", correct: false },
      { id: "c", content: "Tous les vecteurs de B sont unitaires", correct: false },
      { id: "d", content: "Tous les vecteurs de B sont orthogonaux", correct: false },
    ],
    explanation: [
      t("Une base est un ensemble de vecteurs qui est à la fois libre (linéairement indépendants) et générateur (engendre tout V). Ces deux conditions garantissent que chaque vecteur de V s'écrit de manière unique."),
    ],
    steps: [],
    answer: "Libre et générateur",
  },
  {
    id: "L37-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L37",
    number: 9,
    title: "QCM — Composantes dans la base canonique",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("v"),
      t(" = (4, −3, 5) dans R³. Quelles sont ses composantes dans la base canonique ("),
      vec("e₁"), t(", "), vec("e₂"), t(", "), vec("e₃"), t(") ?"),
    ],
    options: [
      { id: "a", content: "(4, −3, 5)", correct: true },
      { id: "b", content: "(5, −3, 4)", correct: false },
      { id: "c", content: "(0, 0, 1)", correct: false },
      { id: "d", content: "(1, 1, 1)", correct: false },
    ],
    explanation: [
      t("Dans la base canonique, les composantes d'un vecteur sont directement ses coordonnées : "),
      vec("v"), t(" = 4"), vec("e₁"), t(" − 3"), vec("e₂"), t(" + 5"), vec("e₃"),
      t(", donc les composantes sont (4, −3, 5)."),
    ],
    steps: [],
    answer: "(4, −3, 5)",
  },
  {
    id: "L37-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L37",
    number: 10,
    title: "QCM — Composantes dans une base non canonique",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit B = {"), vec("b₁"), t(" = (1, 1), "), vec("b₂"),
      t(" = (1, −1)} une base de R². Quelles sont les composantes de "),
      vec("v"), t(" = (3, 1) dans B ?"),
    ],
    options: [
      { id: "a", content: "(2, 1)", correct: true },
      { id: "b", content: "(3, 1)", correct: false },
      { id: "c", content: "(1, 2)", correct: false },
      { id: "d", content: "(4, −2)", correct: false },
    ],
    explanation: [
      t("On cherche a, b tels que (3, 1) = a(1, 1) + b(1, −1). Cela donne a + b = 3 et a − b = 1. En résolvant : a = 2, b = 1. Les composantes de "),
      vec("v"), t(" dans B sont (2, 1)."),
    ],
    steps: [],
    answer: "(2, 1)",
  },
  {
    id: "L37-TF1",
    topicId: "linear-algebra",
    lessonId: "L37",
    number: 11,
    title: "Vrai ou Faux — Cardinalité d'une base",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Toute base de R² contient exactement 2 vecteurs."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La dimension de R² est 2 par définition, et toutes les bases d'un même espace vectoriel ont le même nombre d'éléments (égal à la dimension de l'espace)."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L37-TF2",
    topicId: "linear-algebra",
    lessonId: "L37",
    number: 12,
    title: "Vrai ou Faux — Test d'une base de R³",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("L'ensemble {(1, 0, 0), (1, 1, 0), (1, 1, 1)} est une base de R³."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. L'ensemble contient 3 vecteurs dans R³. Le déterminant de la matrice formée par ces 3 vecteurs (en colonnes) vaut 1·(1·1 − 0·1) = 1 ≠ 0. Les vecteurs sont indépendants, donc l'ensemble est une base."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L43 — Produit scalaire — partie 1 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L43-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L43",
    number: 8,
    title: "QCM — Calculer un produit scalaire (2D)",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (3, 4) et "), vec("v"),
      t(" = (1, -2). Calculer "), vec("u"), t(" · "), vec("v"), t("."),
    ],
    options: [
      { id: "a", content: "-5", correct: true },
      { id: "b", content: "5", correct: false },
      { id: "c", content: "11", correct: false },
      { id: "d", content: "-11", correct: false },
    ],
    explanation: [
      vec("u"), t(" · "), vec("v"), t(" = 3·1 + 4·(-2) = 3 - 8 = -5."),
    ],
    steps: [],
    answer: "-5",
  },
  {
    id: "L43-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L43",
    number: 9,
    title: "QCM — Vecteurs orthogonaux",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Lesquels des vecteurs suivants sont orthogonaux à "), vec("u"), t(" = (2, 3) ?"),
    ],
    options: [
      { id: "a", content: "(3, -2)", correct: true },
      { id: "b", content: "(2, 3)", correct: false },
      { id: "c", content: "(2, -3)", correct: false },
      { id: "d", content: "(-2, -3)", correct: false },
    ],
    explanation: [
      t("Deux vecteurs sont orthogonaux ssi leur produit scalaire est nul. (2, 3)·(3, -2) = 6 - 6 = 0 ✓."),
    ],
    steps: [],
    answer: "(3, -2)",
  },
  {
    id: "L43-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L43",
    number: 10,
    title: "QCM — Produit scalaire en 3D",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 2, 3) et "), vec("v"),
      t(" = (4, -1, 2). Calculer "), vec("u"), t(" · "), vec("v"), t("."),
    ],
    options: [
      { id: "a", content: "8", correct: true },
      { id: "b", content: "10", correct: false },
      { id: "c", content: "12", correct: false },
      { id: "d", content: "-2", correct: false },
    ],
    explanation: [
      vec("u"), t(" · "), vec("v"), t(" = 1·4 + 2·(-1) + 3·2 = 4 - 2 + 6 = 8."),
    ],
    steps: [],
    answer: "8",
  },
  {
    id: "L43-TF1",
    topicId: "linear-algebra",
    lessonId: "L43",
    number: 11,
    title: "Vrai ou Faux — Commutativité du produit scalaire",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Le produit scalaire est commutatif : "), vec("u"), t(" · "), vec("v"),
      t(" = "), vec("v"), t(" · "), vec("u"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La multiplication des composantes est commutative, donc la somme des produits ne dépend pas de l'ordre des deux vecteurs."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L43-TF2",
    topicId: "linear-algebra",
    lessonId: "L43",
    number: 12,
    title: "Vrai ou Faux — Norme et produit scalaire",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      vec("u"), t(" · "), vec("u"), t(" = ‖"), vec("u"), t("‖² pour tout vecteur "), vec("u"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Si "), vec("u"), t(" = (a, b, c), alors "), vec("u"),
      t(" · "), vec("u"), t(" = a² + b² + c² = ‖"), vec("u"), t("‖²."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L44 — Produit scalaire — partie 2 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L44-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L44",
    number: 8,
    title: "QCM — Angle entre deux vecteurs",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 0) et "), vec("v"),
      t(" = (1, 1). Quel est l'angle entre "), vec("u"), t(" et "), vec("v"), t(" ?"),
    ],
    options: [
      { id: "a", content: "45°", correct: true },
      { id: "b", content: "30°", correct: false },
      { id: "c", content: "60°", correct: false },
      { id: "d", content: "90°", correct: false },
    ],
    explanation: [
      t("cos θ = ("), vec("u"), t(" · "), vec("v"), t(") / (‖"), vec("u"),
      t("‖·‖"), vec("v"), t("‖) = 1 / (1·√2) = 1/√2. Donc θ = 45°."),
    ],
    steps: [],
    answer: "45°",
  },
  {
    id: "L44-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L44",
    number: 9,
    title: "QCM — Angle aigu ou obtus",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Si "), vec("u"), t(" · "), vec("v"),
      t(" < 0, alors l'angle entre "), vec("u"), t(" et "), vec("v"), t(" est :"),
    ],
    options: [
      { id: "a", content: "Obtus (entre 90° et 180°)", correct: true },
      { id: "b", content: "Aigu (entre 0° et 90°)", correct: false },
      { id: "c", content: "Droit (90°)", correct: false },
      { id: "d", content: "Nul (0°)", correct: false },
    ],
    explanation: [
      t("Comme "), vec("u"), t(" · "), vec("v"),
      t(" = ‖"), vec("u"), t("‖·‖"), vec("v"), t("‖·cos θ, le signe du produit scalaire dépend de cos θ. cos θ < 0 ⇔ θ ∈ (90°, 180°) = angle obtus."),
    ],
    steps: [],
    answer: "Obtus",
  },
  {
    id: "L44-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L44",
    number: 10,
    title: "QCM — Angle en 3D",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Trouver l'angle entre "), vec("u"), t(" = (1, 1, 0) et "), vec("v"),
      t(" = (1, 0, 1)."),
    ],
    options: [
      { id: "a", content: "60°", correct: true },
      { id: "b", content: "45°", correct: false },
      { id: "c", content: "90°", correct: false },
      { id: "d", content: "30°", correct: false },
    ],
    explanation: [
      vec("u"), t(" · "), vec("v"), t(" = 1·1 + 1·0 + 0·1 = 1. ‖"), vec("u"),
      t("‖ = √2, ‖"), vec("v"), t("‖ = √2. cos θ = 1/(√2·√2) = 1/2. Donc θ = 60°."),
    ],
    steps: [],
    answer: "60°",
  },
  {
    id: "L44-TF1",
    topicId: "linear-algebra",
    lessonId: "L44",
    number: 11,
    title: "Vrai ou Faux — Orthogonalité",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Deux vecteurs non nuls "), vec("u"), t(" et "), vec("v"),
      t(" sont orthogonaux si et seulement si "), vec("u"), t(" · "),
      vec("v"), t(" = 0."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Comme "), vec("u"), t(" · "), vec("v"),
      t(" = ‖u‖·‖v‖·cos θ et les normes sont non nulles, le produit scalaire s'annule ssi cos θ = 0, c'est-à-dire θ = 90°."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L44-TF2",
    topicId: "linear-algebra",
    lessonId: "L44",
    number: 12,
    title: "Vrai ou Faux — Inégalité de Cauchy-Schwarz",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Pour tous vecteurs "), vec("u"), t(" et "), vec("v"),
      t(" : |"), vec("u"), t(" · "), vec("v"), t("| ≤ ‖"), vec("u"),
      t("‖·‖"), vec("v"), t("‖."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. C'est l'inégalité de Cauchy-Schwarz. Égalité ssi "), vec("u"),
      t(" et "), vec("v"), t(" sont colinéaires."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L45 — Projection orthogonale : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L45-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L45",
    number: 8,
    title: "QCM — Formule de la projection",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("La projection orthogonale de "), vec("u"), t(" sur "), vec("v"),
      t(" (avec "), vec("v"), t(" ≠ 0) est :"),
    ],
    options: [
      { id: "a", content: [t("(("), vec("u"), t(" · "), vec("v"), t(") / ‖"), vec("v"), t("‖²) "), vec("v")], correct: true },
      { id: "b", content: [t("(("), vec("u"), t(" · "), vec("v"), t(") / ‖"), vec("u"), t("‖²) "), vec("u")], correct: false },
      { id: "c", content: [vec("u"), t(" - "), vec("v")], correct: false },
      { id: "d", content: [t("‖"), vec("u"), t("‖ "), vec("v")], correct: false },
    ],
    explanation: [
      t("La projection de "), vec("u"), t(" sur "), vec("v"),
      t(" s'écrit "), vec("u"), subVec("v"),
      t(" = (("), vec("u"), t(" · "), vec("v"),
      t(") / ‖"), vec("v"), t("‖²) "), vec("v"), t("."),
    ],
    steps: [],
    answer: "(u·v / ‖v‖²) v",
  },
  {
    id: "L45-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L45",
    number: 9,
    title: "QCM — Calculer une projection",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Calculer la projection de "), vec("u"), t(" = (3, 4) sur "), vec("v"),
      t(" = (1, 0)."),
    ],
    options: [
      { id: "a", content: "(3, 0)", correct: true },
      { id: "b", content: "(0, 4)", correct: false },
      { id: "c", content: "(3, 4)", correct: false },
      { id: "d", content: "(1, 0)", correct: false },
    ],
    explanation: [
      vec("u"), t(" · "), vec("v"), t(" = 3·1 + 4·0 = 3. ‖"), vec("v"),
      t("‖² = 1. "), vec("u"), subVec("v"), t(" = (3/1)·(1, 0) = (3, 0)."),
    ],
    steps: [],
    answer: "(3, 0)",
  },
  {
    id: "L45-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L45",
    number: 10,
    title: "QCM — Décomposition orthogonale",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Si "), vec("u"), t(" = (5, 2) et "), vec("v"), t(" = (1, 0), alors "), vec("u"),
      t(" = "), vec("u"), subVec("v"), t(" + ?"),
    ],
    options: [
      { id: "a", content: "(0, 2)", correct: true },
      { id: "b", content: "(5, 0)", correct: false },
      { id: "c", content: "(5, 2)", correct: false },
      { id: "d", content: "(0, 0)", correct: false },
    ],
    explanation: [
      vec("u"), subVec("v"), t(" = (5, 0). Donc "), vec("u"),
      t(" - "), vec("u"), subVec("v"), t(" = (5, 2) - (5, 0) = (0, 2), qui est orthogonal à "), vec("v"), t("."),
    ],
    steps: [],
    answer: "(0, 2)",
  },
  {
    id: "L45-TF1",
    topicId: "linear-algebra",
    lessonId: "L45",
    number: 11,
    title: "Vrai ou Faux — Projection sur soi-même",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Pour tout vecteur non nul "), vec("u"), t(", "),
      vec("u"), subVec("u"), t(" = "), vec("u"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. "), vec("u"), subVec("u"), t(" = (("), vec("u"),
      t(" · "), vec("u"), t(") / ‖"), vec("u"), t("‖²) "), vec("u"),
      t(" = (‖"), vec("u"), t("‖² / ‖"), vec("u"), t("‖²) "), vec("u"), t(" = "), vec("u"), t("."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L45-TF2",
    topicId: "linear-algebra",
    lessonId: "L45",
    number: 12,
    title: "Vrai ou Faux — Inégalité de la projection",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("La norme de la projection de "), vec("u"), t(" sur "), vec("v"),
      t(" est toujours inférieure ou égale à ‖"), vec("u"), t("‖."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. ‖"), vec("u"), subVec("v"), t("‖ = |"), vec("u"),
      t(" · "), vec("v"), t("| / ‖"), vec("v"), t("‖ ≤ ‖"), vec("u"),
      t("‖ (par Cauchy-Schwarz). Égalité ssi "), vec("u"), t(" est colinéaire à "), vec("v"), t("."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L46 — Produit vectoriel — partie 1 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L46-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L46",
    number: 8,
    title: "QCM — Direction du produit vectoriel",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Le vecteur "), vec("u"), t(" × "), vec("v"), t(" est :"),
    ],
    options: [
      { id: "a", content: [t("Orthogonal à "), vec("u"), t(" et à "), vec("v")], correct: true },
      { id: "b", content: [t("Parallèle à "), vec("u")], correct: false },
      { id: "c", content: [t("Égal à "), vec("u"), t(" · "), vec("v")], correct: false },
      { id: "d", content: "Toujours un scalaire", correct: false },
    ],
    explanation: [
      t("Par définition, "), vec("u"), t(" × "), vec("v"),
      t(" est un vecteur orthogonal au plan engendré par "), vec("u"), t(" et "), vec("v"), t("."),
    ],
    steps: [],
    answer: "Orthogonal à u et v",
  },
  {
    id: "L46-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L46",
    number: 9,
    title: "QCM — Calculer un produit vectoriel",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 0, 0) et "), vec("v"),
      t(" = (0, 1, 0). Calculer "), vec("u"), t(" × "), vec("v"), t("."),
    ],
    options: [
      { id: "a", content: "(0, 0, 1)", correct: true },
      { id: "b", content: "(1, 1, 0)", correct: false },
      { id: "c", content: "(0, 0, -1)", correct: false },
      { id: "d", content: "(0, 0, 0)", correct: false },
    ],
    explanation: [
      t("i × j = k. Donc (1,0,0) × (0,1,0) = (0,0,1)."),
    ],
    steps: [],
    answer: "(0, 0, 1)",
  },
  {
    id: "L46-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L46",
    number: 10,
    title: "QCM — Norme du produit vectoriel",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("‖"), vec("u"), t(" × "), vec("v"), t("‖ = ?"),
    ],
    options: [
      { id: "a", content: "‖u‖·‖v‖·sin θ", correct: true },
      { id: "b", content: "‖u‖·‖v‖·cos θ", correct: false },
      { id: "c", content: "‖u‖ + ‖v‖", correct: false },
      { id: "d", content: "‖u‖·‖v‖", correct: false },
    ],
    explanation: [
      t("La norme du produit vectoriel est ‖"), vec("u"), t("‖·‖"), vec("v"),
      t("‖·sin θ, où θ est l'angle entre les deux vecteurs."),
    ],
    steps: [],
    answer: "‖u‖·‖v‖·sin θ",
  },
  {
    id: "L46-TF1",
    topicId: "linear-algebra",
    lessonId: "L46",
    number: 11,
    title: "Vrai ou Faux — Anticommutativité",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      vec("u"), t(" × "), vec("v"), t(" = "), vec("v"), t(" × "),
      vec("u"), t(" pour tous vecteurs "), vec("u"), t(" et "), vec("v"), t("."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. Le produit vectoriel est anticommutatif : "), vec("u"),
      t(" × "), vec("v"), t(" = -("), vec("v"), t(" × "), vec("u"), t(")."),
    ],
    steps: [],
    answer: "Faux",
  },
  {
    id: "L46-TF2",
    topicId: "linear-algebra",
    lessonId: "L46",
    number: 12,
    title: "Vrai ou Faux — Produit vectoriel d'un vecteur avec lui-même",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      vec("u"), t(" × "), vec("u"), t(" = 0 pour tout vecteur "), vec("u"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. L'angle entre "), vec("u"), t(" et lui-même est 0, donc sin θ = 0, ce qui donne ‖"),
      vec("u"), t(" × "), vec("u"), t("‖ = 0."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L47 — Produit vectoriel — partie 2 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L47-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L47",
    number: 8,
    title: "QCM — Aire d'un parallélogramme",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("L'aire du parallélogramme construit sur les vecteurs "), vec("u"), t(" et "), vec("v"), t(" est :"),
    ],
    options: [
      { id: "a", content: [t("‖"), vec("u"), t(" × "), vec("v"), t("‖")], correct: true },
      { id: "b", content: [vec("u"), t(" · "), vec("v")], correct: false },
      { id: "c", content: [t("‖"), vec("u"), t("‖ + ‖"), vec("v"), t("‖")], correct: false },
      { id: "d", content: [t("‖"), vec("u"), t("‖ · ‖"), vec("v"), t("‖")], correct: false },
    ],
    explanation: [
      t("L'aire du parallélogramme est ‖"), vec("u"), t(" × "), vec("v"),
      t("‖ = ‖"), vec("u"), t("‖·‖"), vec("v"), t("‖·sin θ, où θ est l'angle entre les deux vecteurs."),
    ],
    steps: [],
    answer: "‖u × v‖",
  },
  {
    id: "L47-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L47",
    number: 9,
    title: "QCM — Calculer une aire",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Calculer l'aire du parallélogramme construit sur "), vec("u"), t(" = (1, 0, 0) et "),
      vec("v"), t(" = (0, 2, 0)."),
    ],
    options: [
      { id: "a", content: "2", correct: true },
      { id: "b", content: "1", correct: false },
      { id: "c", content: "0", correct: false },
      { id: "d", content: "4", correct: false },
    ],
    explanation: [
      vec("u"), t(" × "), vec("v"), t(" = (0, 0, 2). Aire = ‖(0, 0, 2)‖ = 2."),
    ],
    steps: [],
    answer: "2",
  },
  {
    id: "L47-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L47",
    number: 10,
    title: "QCM — Aire d'un triangle",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("L'aire du triangle formé par les vecteurs "), vec("AB"), t(" et "), vec("AC"), t(" est :"),
    ],
    options: [
      { id: "a", content: [t("(1/2)·‖"), vec("AB"), t(" × "), vec("AC"), t("‖")], correct: true },
      { id: "b", content: [t("‖"), vec("AB"), t(" × "), vec("AC"), t("‖")], correct: false },
      { id: "c", content: [vec("AB"), t(" · "), vec("AC")], correct: false },
      { id: "d", content: [t("(1/2)·("), vec("AB"), t(" · "), vec("AC"), t(")")], correct: false },
    ],
    explanation: [
      t("L'aire d'un triangle est la moitié de l'aire du parallélogramme : (1/2)·‖"),
      vec("AB"), t(" × "), vec("AC"), t("‖."),
    ],
    steps: [],
    answer: "(1/2)·‖AB × AC‖",
  },
  {
    id: "L47-TF1",
    topicId: "linear-algebra",
    lessonId: "L47",
    number: 11,
    title: "Vrai ou Faux — Orthogonalité du produit vectoriel",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      vec("u"), t(" × "), vec("v"), t(" est orthogonal à "), vec("u"), t(" et à "), vec("v"), t("."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Le produit vectoriel "), vec("u"), t(" × "), vec("v"),
      t(" est par définition orthogonal au plan engendré par "), vec("u"), t(" et "), vec("v"), t("."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L47-TF2",
    topicId: "linear-algebra",
    lessonId: "L47",
    number: 12,
    title: "Vrai ou Faux — Identité de Lagrange",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("‖"), vec("u"), t(" × "), vec("v"), t("‖² + ("),
      vec("u"), t(" · "), vec("v"), t(")² = ‖"), vec("u"), t("‖²·‖"), vec("v"), t("‖²."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. C'est l'identité de Lagrange : ‖u×v‖² + (u·v)² = ‖u‖²‖v‖²(sin²θ + cos²θ) = ‖u‖²‖v‖²."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L48 — Produit mixte — partie 1 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L48-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L48",
    number: 8,
    title: "QCM — Définition du produit mixte",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Le produit mixte de trois vecteurs "), vec("u"), t(", "), vec("v"), t(", "), vec("w"), t(" s'écrit :"),
    ],
    options: [
      { id: "a", content: [vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")")], correct: true },
      { id: "b", content: [vec("u"), t(" + "), vec("v"), t(" + "), vec("w")], correct: false },
      { id: "c", content: [vec("u"), t(" · "), vec("v"), t(" · "), vec("w")], correct: false },
      { id: "d", content: [vec("u"), t(" × "), vec("v"), t(" × "), vec("w")], correct: false },
    ],
    explanation: [
      t("Le produit mixte est défini par "), vec("u"), t(" · ("), vec("v"),
      t(" × "), vec("w"), t("). Il donne un scalaire qui est aussi égal à det["),
      vec("u"), t(", "), vec("v"), t(", "), vec("w"), t("]."),
    ],
    steps: [],
    answer: "u · (v × w)",
  },
  {
    id: "L48-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L48",
    number: 9,
    title: "QCM — Calcul du produit mixte",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 0, 0), "), vec("v"), t(" = (0, 1, 0), "),
      vec("w"), t(" = (0, 0, 1). Calculer "), vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")."),
    ],
    options: [
      { id: "a", content: "1", correct: true },
      { id: "b", content: "0", correct: false },
      { id: "c", content: "-1", correct: false },
      { id: "d", content: "3", correct: false },
    ],
    explanation: [
      vec("v"), t(" × "), vec("w"), t(" = (1, 0, 0). Puis "), vec("u"),
      t(" · (1, 0, 0) = 1. (Volume du cube unité.)"),
    ],
    steps: [],
    answer: "1",
  },
  {
    id: "L48-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L48",
    number: 10,
    title: "QCM — Coplanarité",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Trois vecteurs "), vec("u"), t(", "), vec("v"), t(", "), vec("w"),
      t(" sont coplanaires si et seulement si :"),
    ],
    options: [
      { id: "a", content: [vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(") = 0")], correct: true },
      { id: "b", content: [vec("u"), t(" + "), vec("v"), t(" + "), vec("w"), t(" = 0")], correct: false },
      { id: "c", content: "Ils ont la même norme", correct: false },
      { id: "d", content: "Ils sont tous unitaires", correct: false },
    ],
    explanation: [
      t("Trois vecteurs sont coplanaires ssi leur produit mixte est nul (volume nul du parallélépipède)."),
    ],
    steps: [],
    answer: "u · (v × w) = 0",
  },
  {
    id: "L48-TF1",
    topicId: "linear-algebra",
    lessonId: "L48",
    number: 11,
    title: "Vrai ou Faux — Permutation cyclique",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(") = "),
      vec("v"), t(" · ("), vec("w"), t(" × "), vec("u"), t(")."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Le produit mixte est invariant par permutation cyclique des trois vecteurs."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L48-TF2",
    topicId: "linear-algebra",
    lessonId: "L48",
    number: 12,
    title: "Vrai ou Faux — Volume du parallélépipède",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Le volume du parallélépipède construit sur trois vecteurs est la valeur absolue de leur produit mixte."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. V = |"), vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")|."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L49 — Produit mixte — partie 2 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L49-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L49",
    number: 8,
    title: "QCM — Volume d'un parallélépipède",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Soit "), vec("u"), t(" = (1, 0, 0), "), vec("v"), t(" = (0, 2, 0), "),
      vec("w"), t(" = (0, 0, 3). Calculer le volume du parallélépipède."),
    ],
    options: [
      { id: "a", content: "6", correct: true },
      { id: "b", content: "1", correct: false },
      { id: "c", content: "0", correct: false },
      { id: "d", content: "5", correct: false },
    ],
    explanation: [
      t("V = |u·(v×w)| = |det[[1,0,0],[0,2,0],[0,0,3]]| = |1·2·3| = 6."),
    ],
    steps: [],
    answer: "V = 6",
  },
  {
    id: "L49-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L49",
    number: 9,
    title: "QCM — Volume d'un tétraèdre",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Le volume du tétraèdre formé par trois vecteurs "), vec("u"), t(", "), vec("v"), t(", "),
      vec("w"), t(" est :"),
    ],
    options: [
      { id: "a", content: [t("(1/6)·|"), vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")|")], correct: true },
      { id: "b", content: [t("(1/2)·|"), vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")|")], correct: false },
      { id: "c", content: [t("|"), vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")|")], correct: false },
      { id: "d", content: [t("(1/3)·|"), vec("u"), t(" · ("), vec("v"), t(" × "), vec("w"), t(")|")], correct: false },
    ],
    explanation: [
      t("Le volume du tétraèdre est 1/6 du volume du parallélépipède correspondant."),
    ],
    steps: [],
    answer: "(1/6)·|u·(v×w)|",
  },
  {
    id: "L49-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L49",
    number: 10,
    title: "QCM — Coplanarité de 4 points",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Pour vérifier que 4 points A, B, C, D sont coplanaires, il suffit de montrer que :"),
    ],
    options: [
      { id: "a", content: [vec("AB"), t(" · ("), vec("AC"), t(" × "), vec("AD"), t(") = 0")], correct: true },
      { id: "b", content: [vec("AB"), t(" + "), vec("AC"), t(" + "), vec("AD"), t(" = 0")], correct: false },
      { id: "c", content: "Tous les points sont à même distance de l'origine", correct: false },
      { id: "d", content: "Les vecteurs ont même norme", correct: false },
    ],
    explanation: [
      t("Les vecteurs "), vec("AB"), t(", "), vec("AC"), t(", "), vec("AD"),
      t(" sont coplanaires ssi leur produit mixte est nul, ce qui équivaut à dire que les 4 points sont dans un même plan."),
    ],
    steps: [],
    answer: "AB · (AC × AD) = 0",
  },
  {
    id: "L49-TF1",
    topicId: "linear-algebra",
    lessonId: "L49",
    number: 11,
    title: "Vrai ou Faux — Indépendance linéaire",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Trois vecteurs de R³ sont linéairement indépendants si et seulement si leur produit mixte est non nul."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Le produit mixte = det de la matrice formée par les trois vecteurs. Non nul ⇔ indépendance linéaire."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L49-TF2",
    topicId: "linear-algebra",
    lessonId: "L49",
    number: 12,
    title: "Vrai ou Faux — Signe du produit mixte",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Le produit mixte peut être négatif."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Le signe du produit mixte dépend de l'orientation des trois vecteurs (direct ou indirect)."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L50 — Droite dans l'espace : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L50-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L50",
    number: 7,
    title: "QCM — Équations paramétriques d'une droite",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Les équations paramétriques d'une droite passant par P₀ = (x₀, y₀, z₀) et de vecteur directeur "),
      vec("d"),
      t(" = (a, b, c) sont :"),
    ],
    options: [
      {
        id: "a",
        content: [
          {
            type: "cases",
            rows: [
              [t("x = x₀ + a·t")],
              [t("y = y₀ + b·t")],
              [t("z = z₀ + c·t")],
            ],
          },
          t(" (t ∈ ℝ)"),
        ],
        correct: true,
      },
      { id: "b", content: [t("(x, y, z) = P₀ + t·"), vec("d"), t(" (forme vectorielle)")], correct: false },
      { id: "c", content: [t("(x, y, z) = P₀ · "), vec("d")], correct: false },
      { id: "d", content: [t("(x, y, z) = P₀ × "), vec("d")], correct: false },
    ],
    explanation: [
      t("En développant l'équation vectorielle (x, y, z) = P₀ + t·"),
      vec("d"),
      t(" composante par composante, on obtient le système paramétrique x = x₀ + a·t, y = y₀ + b·t, z = z₀ + c·t."),
    ],
    steps: [],
    answer: "x = x₀ + a·t, y = y₀ + b·t, z = z₀ + c·t",
  },
  {
    id: "L50-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L50",
    number: 8,
    title: "QCM — Identifier un vecteur directeur",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("La droite x = 1 + 2t, y = 3 - t, z = 4t a comme vecteur directeur :"),
    ],
    options: [
      { id: "a", content: "(2, -1, 4)", correct: true },
      { id: "b", content: "(1, 3, 0)", correct: false },
      { id: "c", content: "(1, 3, 4)", correct: false },
      { id: "d", content: "(0, 0, 0)", correct: false },
    ],
    explanation: [
      t("Le vecteur directeur est constitué des coefficients du paramètre t : (2, -1, 4). Le point de passage est (1, 3, 0)."),
    ],
    steps: [],
    answer: "(2, -1, 4)",
  },
  {
    id: "L50-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L50",
    number: 9,
    title: "QCM — Équation symétrique",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("La forme symétrique d'une droite passant par (1, 2, 3) de vecteur directeur (4, 5, 6) est :"),
    ],
    options: [
      { id: "a", content: "(x-1)/4 = (y-2)/5 = (z-3)/6", correct: true },
      { id: "b", content: "(x+1)/4 = (y+2)/5 = (z+3)/6", correct: false },
      { id: "c", content: "(x-4)/1 = (y-5)/2 = (z-6)/3", correct: false },
      { id: "d", content: "x/4 = y/5 = z/6", correct: false },
    ],
    explanation: [
      t("Pour une droite passant par (x₀, y₀, z₀) de vecteur directeur (a, b, c), la forme symétrique est (x-x₀)/a = (y-y₀)/b = (z-z₀)/c."),
    ],
    steps: [],
    answer: "(x-1)/4 = (y-2)/5 = (z-3)/6",
  },
  {
    id: "L50-TF1",
    topicId: "linear-algebra",
    lessonId: "L50",
    number: 10,
    title: "Vrai ou Faux — Unicité du vecteur directeur",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Une droite a un seul vecteur directeur."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. Tout multiple scalaire non nul d'un vecteur directeur est aussi vecteur directeur. Une droite a donc une infinité de vecteurs directeurs (tous parallèles entre eux)."),
    ],
    steps: [],
    answer: "Faux",
  },
  {
    id: "L50-TF2",
    topicId: "linear-algebra",
    lessonId: "L50",
    number: 11,
    title: "Vrai ou Faux — Déterminer une droite",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Un point et un vecteur directeur non nul suffisent pour déterminer une droite de manière unique."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La droite passant par P₀ et de direction "), vec("d"), t(" (non nul) est l'ensemble {P₀ + t·"), vec("d"), t(" : t ∈ ℝ}, qui est unique."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L51 — Position relative de deux droites : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L51-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L51",
    number: 8,
    title: "QCM — Possibilités d'intersection",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Dans l'espace R³, deux droites peuvent être :"),
    ],
    options: [
      { id: "a", content: "Parallèles distinctes, parallèles confondues, sécantes ou gauches", correct: true },
      { id: "b", content: "Seulement sécantes ou parallèles distinctes", correct: false },
      { id: "c", content: "Toujours sécantes", correct: false },
      { id: "d", content: "Seulement parallèles distinctes ou confondues", correct: false },
    ],
    explanation: [
      t("En 3D, deux droites peuvent être dans l'une des 4 positions relatives : parallèles distinctes (mêmes directions, aucun point commun), parallèles confondues (mêmes points), sécantes (exactement 1 point commun), ou gauches (ni parallèles ni sécantes)."),
    ],
    steps: [],
    answer: "Parallèles distinctes, parallèles confondues, sécantes ou gauches",
  },
  {
    id: "L51-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L51",
    number: 9,
    title: "QCM — Test de parallélisme",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Deux droites de vecteurs directeurs "), vec("d₁"), t(" et "), vec("d₂"), t(" sont parallèles (distinctes ou confondues) si :"),
    ],
    options: [
      { id: "a", content: [vec("d₁"), t(" et "), vec("d₂"), t(" sont parallèles")], correct: true },
      { id: "b", content: [vec("d₁"), t(" · "), vec("d₂"), t(" = 0")], correct: false },
      { id: "c", content: [t("‖"), vec("d₁"), t("‖ = ‖"), vec("d₂"), t("‖")], correct: false },
      { id: "d", content: [vec("d₁"), t(" = "), vec("d₂")], correct: false },
    ],
    explanation: [
      t("Le parallélisme se vérifie sur les vecteurs directeurs : ils doivent être parallèles (l'un multiple de l'autre)."),
    ],
    steps: [],
    answer: "Vecteurs directeurs parallèles",
  },
  {
    id: "L51-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L51",
    number: 10,
    title: "QCM — Droites gauches",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Deux droites sont gauches si :"),
    ],
    options: [
      { id: "a", content: "Elles ne sont ni parallèles (distinctes ou confondues) ni sécantes", correct: true },
      { id: "b", content: "Elles sont parallèles confondues", correct: false },
      { id: "c", content: "Elles ont un seul point d'intersection", correct: false },
      { id: "d", content: "Elles sont sur le même plan", correct: false },
    ],
    explanation: [
      t("Deux droites gauches ne sont pas parallèles (vecteurs directeurs non parallèles) ET n'ont aucun point commun. Cas spécifique à la 3D."),
    ],
    steps: [],
    answer: "Ni parallèles ni sécantes",
  },
  {
    id: "L51-TF1",
    topicId: "linear-algebra",
    lessonId: "L51",
    number: 11,
    title: "Vrai ou Faux — Parallèles dans le plan",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Dans le plan R², deux droites non parallèles se coupent toujours en un seul point."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. En 2D, deux droites non parallèles sont nécessairement sécantes en exactement un point (pas de droites gauches en 2D)."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L51-TF2",
    topicId: "linear-algebra",
    lessonId: "L51",
    number: 12,
    title: "Vrai ou Faux — Coplanarité",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Deux droites sécantes ou parallèles sont toujours coplanaires."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Deux droites sécantes ou parallèles définissent un unique plan qui les contient toutes les deux. Seules les droites gauches ne sont pas coplanaires."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L52 — Distance d'un point à une droite : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L52-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L52",
    number: 8,
    title: "QCM — Formule de la distance",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("La distance d'un point P à une droite passant par P₀ de vecteur directeur "), vec("d"), t(" est :"),
    ],
    options: [
      { id: "a", content: [t("‖"), vec("P₀P"), t(" × "), vec("d"), t("‖ / ‖"), vec("d"), t("‖")], correct: true },
      { id: "b", content: [t("("), vec("P₀P"), t(" · "), vec("d"), t(") / ‖"), vec("d"), t("‖")], correct: false },
      { id: "c", content: [t("‖"), vec("P₀P"), t("‖")], correct: false },
      { id: "d", content: [t("‖"), vec("d"), t("‖")], correct: false },
    ],
    explanation: [
      t("d(P, droite) = ‖"), vec("P₀P"), t(" × "), vec("d"), t("‖ / ‖"), vec("d"),
      t("‖. La norme du produit vectoriel donne l'aire du parallélogramme, divisée par la base ‖"), vec("d"), t("‖ ce qui donne la hauteur = distance."),
    ],
    steps: [],
    answer: "‖P₀P × d‖ / ‖d‖",
  },
  {
    id: "L52-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L52",
    number: 9,
    title: "QCM — Calcul de distance",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Distance du point P = (2, 0, 0) à la droite passant par l'origine et de vecteur directeur (1, 0, 0) ?"),
    ],
    options: [
      { id: "a", content: "0", correct: true },
      { id: "b", content: "2", correct: false },
      { id: "c", content: "1", correct: false },
      { id: "d", content: "√2", correct: false },
    ],
    explanation: [
      t("P = (2, 0, 0) est sur la droite (axe des x). Donc la distance est nulle. On peut aussi vérifier : "), vec("OP"),
      t(" × "), vec("d"), t(" = (2,0,0) × (1,0,0) = (0,0,0), donc distance = 0."),
    ],
    steps: [],
    answer: "0",
  },
  {
    id: "L52-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L52",
    number: 10,
    title: "QCM — Distance perpendiculaire",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Distance du point P = (1, 1, 0) à la droite (axe des x) ?"),
    ],
    options: [
      { id: "a", content: "1", correct: true },
      { id: "b", content: "√2", correct: false },
      { id: "c", content: "0", correct: false },
      { id: "d", content: "2", correct: false },
    ],
    explanation: [
      t("La projection de P sur l'axe x est (1, 0, 0). La distance est ‖(1,1,0) - (1,0,0)‖ = ‖(0,1,0)‖ = 1."),
    ],
    steps: [],
    answer: "1",
  },
  {
    id: "L52-TF1",
    topicId: "linear-algebra",
    lessonId: "L52",
    number: 11,
    title: "Vrai ou Faux — Distance et appartenance",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Un point appartient à une droite si et seulement si sa distance à la droite est nulle."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La distance est nulle ssi le point se trouve sur la droite."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L52-TF2",
    topicId: "linear-algebra",
    lessonId: "L52",
    number: 12,
    title: "Vrai ou Faux — Distance minimale",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("La distance d'un point à une droite est la distance minimale entre ce point et tout point de la droite, atteinte sur la perpendiculaire."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La distance d'un point à une droite est atteinte sur la perpendiculaire abaissée du point à la droite (théorème géométrique)."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L53 — Distance entre deux droites : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L53-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L53",
    number: 8,
    title: "QCM — Distance entre droites parallèles",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Si deux droites sont parallèles distinctes, leur distance se calcule en :"),
    ],
    options: [
      { id: "a", content: "Prenant la distance d'un point quelconque d'une droite à l'autre droite", correct: true },
      { id: "b", content: "Additionnant les normes des vecteurs directeurs", correct: false },
      { id: "c", content: "Calculant le produit scalaire", correct: false },
      { id: "d", content: "Toujours 0", correct: false },
    ],
    explanation: [
      t("Comme les droites sont parallèles, la distance est constante. On peut donc prendre un point sur l'une et calculer sa distance à l'autre."),
    ],
    steps: [],
    answer: "Distance d'un point à l'autre droite",
  },
  {
    id: "L53-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L53",
    number: 9,
    title: "QCM — Distance entre droites gauches",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Soit "), vec("d₁"), t(" et "), vec("d₂"), t(" deux vecteurs directeurs, P₁ et P₂ deux points sur les droites. La distance entre deux droites gauches est :"),
    ],
    options: [
      { id: "a", content: [t("|"), vec("P₁P₂"), t(" · ("), vec("d₁"), t(" × "), vec("d₂"), t(")| / ‖"), vec("d₁"), t(" × "), vec("d₂"), t("‖")], correct: true },
      { id: "b", content: [t("‖"), vec("P₁P₂"), t("‖")], correct: false },
      { id: "c", content: [t("‖"), vec("d₁"), t("‖ + ‖"), vec("d₂"), t("‖")], correct: false },
      { id: "d", content: "0", correct: false },
    ],
    explanation: [
      t("La distance entre droites gauches s'obtient en projetant "), vec("P₁P₂"),
      t(" sur la direction commune perpendiculaire "), vec("d₁"), t(" × "), vec("d₂"), t("."),
    ],
    steps: [],
    answer: "|P₁P₂ · (d₁ × d₂)| / ‖d₁ × d₂‖",
  },
  {
    id: "L53-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L53",
    number: 10,
    title: "QCM — Distance entre droites sécantes",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("La distance entre deux droites sécantes est :"),
    ],
    options: [
      { id: "a", content: "0", correct: true },
      { id: "b", content: "Toujours positive", correct: false },
      { id: "c", content: "Égale à la longueur du vecteur directeur", correct: false },
      { id: "d", content: "Non définie", correct: false },
    ],
    explanation: [
      t("Deux droites sécantes ont au moins un point commun, donc leur distance est 0."),
    ],
    steps: [],
    answer: "0",
  },
  {
    id: "L53-TF1",
    topicId: "linear-algebra",
    lessonId: "L53",
    number: 11,
    title: "Vrai ou Faux — Distance et confondues",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("La distance entre deux droites confondues est 0."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Deux droites confondues partagent tous leurs points : la distance entre elles est 0."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L53-TF2",
    topicId: "linear-algebra",
    lessonId: "L53",
    number: 12,
    title: "Vrai ou Faux — Perpendiculaire commune",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Pour deux droites gauches, il existe toujours une unique droite perpendiculaire commune aux deux."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Cette perpendiculaire commune a pour direction "), vec("d₁"), t(" × "),
      vec("d₂"), t(", et sa longueur est la distance entre les deux droites."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L54 — Plan dans l'espace : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L54-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L54",
    number: 8,
    title: "QCM — Équation cartésienne d'un plan",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("L'équation cartésienne générale d'un plan est :"),
    ],
    options: [
      { id: "a", content: "ax + by + cz + d = 0 avec (a, b, c) ≠ (0, 0, 0)", correct: true },
      { id: "b", content: "ax + by = c", correct: false },
      { id: "c", content: "x² + y² + z² = r²", correct: false },
      { id: "d", content: "ax + by + cz = 1", correct: false },
    ],
    explanation: [
      t("Tout plan se décrit par ax + by + cz + d = 0 où "), vec("n"),
      t(" = (a, b, c) est un vecteur normal au plan."),
    ],
    steps: [],
    answer: "ax + by + cz + d = 0",
  },
  {
    id: "L54-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L54",
    number: 9,
    title: "QCM — Vecteur normal",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Quel est un vecteur normal au plan 2x - 3y + z = 5 ?"),
    ],
    options: [
      { id: "a", content: "(2, -3, 1)", correct: true },
      { id: "b", content: "(5, 0, 0)", correct: false },
      { id: "c", content: "(1, 1, 1)", correct: false },
      { id: "d", content: "(2, 3, 1)", correct: false },
    ],
    explanation: [
      t("Les coefficients de x, y, z dans l'équation cartésienne donnent directement les composantes d'un vecteur normal au plan."),
    ],
    steps: [],
    answer: "(2, -3, 1)",
  },
  {
    id: "L54-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L54",
    number: 10,
    title: "QCM — Plan défini par trois points",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Pour trouver l'équation d'un plan passant par 3 points A, B, C non alignés, on peut utiliser comme vecteur normal :"),
    ],
    options: [
      { id: "a", content: [vec("AB"), t(" × "), vec("AC")], correct: true },
      { id: "b", content: [vec("AB"), t(" + "), vec("AC")], correct: false },
      { id: "c", content: [vec("AB"), t(" · "), vec("AC")], correct: false },
      { id: "d", content: [vec("AB"), t(" - "), vec("AC")], correct: false },
    ],
    explanation: [
      t("Le produit vectoriel "), vec("AB"), t(" × "), vec("AC"),
      t(" est un vecteur orthogonal au plan engendré par AB et AC, donc un vecteur normal au plan ABC."),
    ],
    steps: [],
    answer: "AB × AC",
  },
  {
    id: "L54-TF1",
    topicId: "linear-algebra",
    lessonId: "L54",
    number: 11,
    title: "Vrai ou Faux — Vecteur normal unique",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Le vecteur normal à un plan est unique."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. Tout multiple scalaire non nul d'un vecteur normal est aussi normal au plan. Il existe une infinité de vecteurs normaux (tous parallèles)."),
    ],
    steps: [],
    answer: "Faux",
  },
  {
    id: "L54-TF2",
    topicId: "linear-algebra",
    lessonId: "L54",
    number: 12,
    title: "Vrai ou Faux — Détermination d'un plan",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Trois points non alignés déterminent un plan unique dans l'espace."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Trois points non alignés définissent un et un seul plan qui les contient tous les trois."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L55 — Position relative de deux plans : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L55-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L55",
    number: 8,
    title: "QCM — Plans parallèles",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Deux plans sont parallèles si et seulement si :"),
    ],
    options: [
      { id: "a", content: "Leurs vecteurs normaux sont parallèles", correct: true },
      { id: "b", content: "Leurs vecteurs normaux sont orthogonaux", correct: false },
      { id: "c", content: "Ils ont le même point d'intersection", correct: false },
      { id: "d", content: "Leurs équations sont identiques", correct: false },
    ],
    explanation: [
      t("Le parallélisme se vérifie par le parallélisme des vecteurs normaux : "),
      vec("n₁"), t(" = k·"), vec("n₂"), t(" pour un scalaire k ≠ 0."),
    ],
    steps: [],
    answer: "Vecteurs normaux parallèles",
  },
  {
    id: "L55-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L55",
    number: 9,
    title: "QCM — Plans confondus",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Les plans x + 2y + 3z = 4 et 2x + 4y + 6z = 8 sont :"),
    ],
    options: [
      { id: "a", content: "Parallèles confondus", correct: true },
      { id: "b", content: "Parallèles distincts", correct: false },
      { id: "c", content: "Sécants", correct: false },
      { id: "d", content: "Perpendiculaires", correct: false },
    ],
    explanation: [
      t("La 2ᵉ équation est 2× la 1ʳᵉ (à droite : 2·4 = 8). Les deux équations représentent donc le même plan, ils sont parallèles confondus."),
    ],
    steps: [],
    answer: "Parallèles confondus",
  },
  {
    id: "L55-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L55",
    number: 10,
    title: "QCM — Intersection de plans sécants",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("L'intersection de deux plans sécants (non parallèles) est :"),
    ],
    options: [
      { id: "a", content: "Une droite", correct: true },
      { id: "b", content: "Un point", correct: false },
      { id: "c", content: "Un plan", correct: false },
      { id: "d", content: "L'ensemble vide", correct: false },
    ],
    explanation: [
      t("Deux plans non parallèles dans R³ s'intersectent toujours en une droite, dont la direction est "),
      vec("n₁"), t(" × "), vec("n₂"), t("."),
    ],
    steps: [],
    answer: "Une droite",
  },
  {
    id: "L55-TF1",
    topicId: "linear-algebra",
    lessonId: "L55",
    number: 11,
    title: "Vrai ou Faux — Parallèles distincts",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Deux plans parallèles distincts ne s'intersectent pas."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Si les plans sont parallèles distincts (non confondus), ils n'ont aucun point commun."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L55-TF2",
    topicId: "linear-algebra",
    lessonId: "L55",
    number: 12,
    title: "Vrai ou Faux — Direction de l'intersection",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("La droite d'intersection de deux plans sécants a pour vecteur directeur "),
      vec("n₁"), t(" × "), vec("n₂"), t(" (produit vectoriel des normales)."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La droite d'intersection est orthogonale aux deux normales, donc sa direction est "),
      vec("n₁"), t(" × "), vec("n₂"), t("."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L56 — Distance entre un point et un plan : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L56-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L56",
    number: 8,
    title: "QCM — Formule de la distance",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("La distance d'un point P = (x₀, y₀, z₀) au plan ax + by + cz + d = 0 est :"),
    ],
    options: [
      { id: "a", content: "|ax₀ + by₀ + cz₀ + d| / √(a² + b² + c²)", correct: true },
      { id: "b", content: "(ax₀ + by₀ + cz₀ + d) / (a + b + c)", correct: false },
      { id: "c", content: "√(x₀² + y₀² + z₀²)", correct: false },
      { id: "d", content: "|ax₀ + by₀ + cz₀ + d|", correct: false },
    ],
    explanation: [
      t("d(P, plan) = |ax₀ + by₀ + cz₀ + d| / ‖"), vec("n"), t("‖, où ‖"),
      vec("n"), t("‖ = √(a² + b² + c²) est la norme du vecteur normal."),
    ],
    steps: [],
    answer: "|ax₀+by₀+cz₀+d| / √(a²+b²+c²)",
  },
  {
    id: "L56-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L56",
    number: 9,
    title: "QCM — Calculer la distance",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Distance du point P = (1, 2, 2) au plan x + 2y + 2z = 0 ?"),
    ],
    options: [
      { id: "a", content: "3", correct: true },
      { id: "b", content: "9", correct: false },
      { id: "c", content: "1", correct: false },
      { id: "d", content: "√3", correct: false },
    ],
    explanation: [
      t("Numérateur : |1 + 2·2 + 2·2 + 0| = |1 + 4 + 4| = 9. Dénominateur : √(1 + 4 + 4) = √9 = 3. Distance = 9/3 = 3."),
    ],
    steps: [],
    answer: "3",
  },
  {
    id: "L56-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L56",
    number: 10,
    title: "QCM — Point sur le plan",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Distance du point P = (1, 1, 1) au plan x + y + z = 3 ?"),
    ],
    options: [
      { id: "a", content: "0", correct: true },
      { id: "b", content: "1", correct: false },
      { id: "c", content: "√3", correct: false },
      { id: "d", content: "3", correct: false },
    ],
    explanation: [
      t("|1 + 1 + 1 − 3| = 0, donc P est sur le plan. Distance = 0."),
    ],
    steps: [],
    answer: "0",
  },
  {
    id: "L56-TF1",
    topicId: "linear-algebra",
    lessonId: "L56",
    number: 11,
    title: "Vrai ou Faux — Distance et appartenance",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Un point appartient à un plan si et seulement si sa distance au plan est nulle."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La distance est nulle ssi le point vérifie l'équation du plan."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L56-TF2",
    topicId: "linear-algebra",
    lessonId: "L56",
    number: 12,
    title: "Vrai ou Faux — Projection orthogonale",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("La distance d'un point P à un plan est la distance entre P et sa projection orthogonale sur le plan."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. La distance est mesurée perpendiculairement au plan, c'est-à-dire jusqu'à la projection orthogonale."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L57 — Interactions droites et plans — partie 1 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L57-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L57",
    number: 8,
    title: "QCM — Droite parallèle à un plan",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Une droite de vecteur directeur "), vec("d"), t(" est parallèle à un plan de vecteur normal "), vec("n"), t(" si et seulement si :"),
    ],
    options: [
      { id: "a", content: [vec("d"), t(" · "), vec("n"), t(" = 0")], correct: true },
      { id: "b", content: [vec("d"), t(" × "), vec("n"), t(" = 0")], correct: false },
      { id: "c", content: [vec("d"), t(" = "), vec("n")], correct: false },
      { id: "d", content: [t("‖"), vec("d"), t("‖ = ‖"), vec("n"), t("‖")], correct: false },
    ],
    explanation: [
      t("Une droite est parallèle à un plan si son vecteur directeur est orthogonal au vecteur normal du plan, c'est-à-dire "),
      vec("d"), t(" · "), vec("n"), t(" = 0."),
    ],
    steps: [],
    answer: "d · n = 0",
  },
  {
    id: "L57-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L57",
    number: 9,
    title: "QCM — Droite contenue dans un plan",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Une droite est contenue dans un plan si et seulement si :"),
    ],
    options: [
      { id: "a", content: "Elle est parallèle au plan ET au moins un point appartient au plan", correct: true },
      { id: "b", content: "Elle est perpendiculaire au plan", correct: false },
      { id: "c", content: "Son vecteur directeur est normal au plan", correct: false },
      { id: "d", content: "Le vecteur directeur a la même norme que le vecteur normal", correct: false },
    ],
    explanation: [
      t("Pour qu'une droite soit dans un plan, il faut deux conditions : (1) la direction de la droite doit être parallèle au plan ("),
      vec("d"), t(" · "), vec("n"), t(" = 0) ET (2) un point de la droite doit appartenir au plan."),
    ],
    steps: [],
    answer: "Parallèle ET un point dans le plan",
  },
  {
    id: "L57-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L57",
    number: 10,
    title: "QCM — Droite perpendiculaire à un plan",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Une droite est perpendiculaire à un plan si et seulement si :"),
    ],
    options: [
      { id: "a", content: [t("Son vecteur directeur est parallèle au vecteur normal du plan")], correct: true },
      { id: "b", content: [vec("d"), t(" · "), vec("n"), t(" = 0")], correct: false },
      { id: "c", content: "Elle a un point d'intersection avec le plan", correct: false },
      { id: "d", content: "Le vecteur directeur est unitaire", correct: false },
    ],
    explanation: [
      t("Une droite est perpendiculaire à un plan si sa direction est parallèle au vecteur normal du plan : "),
      vec("d"), t(" = k·"), vec("n"), t(" pour un certain scalaire k."),
    ],
    steps: [],
    answer: "Direction parallèle au normal",
  },
  {
    id: "L57-TF1",
    topicId: "linear-algebra",
    lessonId: "L57",
    number: 11,
    title: "Vrai ou Faux — Test de parallélisme",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Si "), vec("d"), t(" · "), vec("n"), t(" = 0, alors la droite est parallèle au plan (ou contenue dedans)."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. "), vec("d"), t(" · "), vec("n"),
      t(" = 0 signifie que le vecteur directeur de la droite est orthogonal au vecteur normal du plan, donc la droite est dans une direction parallèle au plan."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L57-TF2",
    topicId: "linear-algebra",
    lessonId: "L57",
    number: 12,
    title: "Vrai ou Faux — Intersection droite-plan",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("Une droite et un plan non parallèles se coupent en un et un seul point."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Si la droite n'est pas parallèle au plan, elle l'intersecte en exactement un point."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // L58 — Interactions droites et plans — partie 2 : QCM + V/F
  // ═════════════════════════════════════════════════════════════════
  {
    id: "L58-MCQ1",
    topicId: "linear-algebra",
    lessonId: "L58",
    number: 8,
    title: "QCM — Angle entre droite et plan",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("L'angle θ entre une droite de vecteur directeur "), vec("d"),
      t(" et un plan de vecteur normal "), vec("n"), t(" satisfait :"),
    ],
    options: [
      { id: "a", content: [t("sin θ = |"), vec("d"), t(" · "), vec("n"), t("| / (‖"), vec("d"), t("‖·‖"), vec("n"), t("‖)")], correct: true },
      { id: "b", content: [t("cos θ = |"), vec("d"), t(" · "), vec("n"), t("| / (‖"), vec("d"), t("‖·‖"), vec("n"), t("‖)")], correct: false },
      { id: "c", content: [t("tan θ = "), vec("d"), t(" · "), vec("n")], correct: false },
      { id: "d", content: "θ = 0 toujours", correct: false },
    ],
    explanation: [
      t("L'angle entre la droite et le plan est le complément de l'angle entre "),
      vec("d"), t(" et "), vec("n"), t(". Donc sin θ_(droite-plan) = cos(90° - θ) = |"),
      vec("d"), t(" · "), vec("n"), t("| / (‖"), vec("d"), t("‖·‖"), vec("n"), t("‖)."),
    ],
    steps: [],
    answer: "sin θ = |d·n| / (‖d‖·‖n‖)",
  },
  {
    id: "L58-MCQ2",
    topicId: "linear-algebra",
    lessonId: "L58",
    number: 9,
    title: "QCM — Point d'intersection",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Pour trouver le point d'intersection entre une droite et un plan, on :"),
    ],
    options: [
      { id: "a", content: "Substitue les équations paramétriques de la droite dans l'équation cartésienne du plan", correct: true },
      { id: "b", content: "Calcule le produit scalaire des vecteurs directeur et normal", correct: false },
      { id: "c", content: "Trouve la perpendiculaire commune", correct: false },
      { id: "d", content: "Additionne les équations", correct: false },
    ],
    explanation: [
      t("On remplace x, y, z par leurs expressions paramétriques (x(t), y(t), z(t)) dans l'équation du plan, puis on résout pour t. Une fois t trouvé, on substitue pour obtenir le point."),
    ],
    steps: [],
    answer: "Substitution dans le plan",
  },
  {
    id: "L58-MCQ3",
    topicId: "linear-algebra",
    lessonId: "L58",
    number: 10,
    title: "QCM — Distance droite-plan parallèles",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t("Si une droite est parallèle à un plan mais non contenue dans celui-ci, la distance entre eux est :"),
    ],
    options: [
      { id: "a", content: "La distance d'un point quelconque de la droite au plan", correct: true },
      { id: "b", content: "Toujours 0", correct: false },
      { id: "c", content: "Non définie", correct: false },
      { id: "d", content: "Égale à la norme du vecteur directeur", correct: false },
    ],
    explanation: [
      t("Comme la droite est parallèle au plan, la distance est constante en tout point. On peut donc prendre n'importe quel point de la droite et calculer sa distance au plan."),
    ],
    steps: [],
    answer: "Distance d'un point au plan",
  },
  {
    id: "L58-TF1",
    topicId: "linear-algebra",
    lessonId: "L58",
    number: 11,
    title: "Vrai ou Faux — Angle 90°",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Si une droite est perpendiculaire à un plan, l'angle entre la droite et le plan est 90°."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Par définition, l'angle entre une droite et un plan est mesuré entre la droite et sa projection sur le plan, et vaut 90° quand la droite est orthogonale au plan."),
    ],
    steps: [],
    answer: "Vrai",
  },
  {
    id: "L58-TF2",
    topicId: "linear-algebra",
    lessonId: "L58",
    number: 12,
    title: "Vrai ou Faux — Distance et parallélisme",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("La distance entre une droite et un plan est strictement positive si et seulement si la droite est parallèle au plan sans y être contenue."),
    ],
    isTrue: true,
    explanation: [
      t("Vrai. Si la droite n'est pas parallèle, elle coupe le plan en un point (distance = 0). Si elle est contenue dans le plan, distance = 0. Donc distance > 0 ⇔ parallèle non contenue."),
    ],
    steps: [],
    answer: "Vrai",
  },
  // ═════════════════════════════════════════════════════════════════
  // 201-SN1-RE — Chapitre 1 : Statistiques descriptives (25 exercices faciles)
  // ═════════════════════════════════════════════════════════════════
  {
    id: "stat-facile-01",
    topicId: "probability",
    lessonId: "PSD1",
    number: 1,
    title: "Identifier population, échantillon et variable",
    difficulty: "Fondamental",
    prompt:
      "On veut estimer la longueur moyenne des saumons de l'Atlantique dans la rivière Matapédia. Un biologiste en attrape 60 au filet et mesure la longueur de chacun. Identifie la population, l'échantillon, l'unité statistique et la variable étudiée.",
    steps: [
      "La population regroupe tous les individus visés par l'étude : tous les saumons de la rivière Matapédia.",
      "L'échantillon est le sous-ensemble effectivement observé : les 60 saumons attrapés.",
      "Chaque unité statistique est un saumon.",
      "La variable est la caractéristique mesurée sur chaque unité, soit la longueur.",
    ],
    answer: "Population = saumons de la rivière ; échantillon = 60 saumons ; unité = un saumon ; variable = longueur.",
  },
  {
    id: "stat-facile-02",
    topicId: "probability",
    lessonId: "PSD1",
    number: 2,
    title: "Recensement ou sondage",
    difficulty: "Fondamental",
    prompt:
      "Un contrôleur qualité veut vérifier la durée de vie des 500 piles produites lors d'un lot. Il choisit de tester chacune des 500 piles jusqu'à ce qu'elles s'éteignent. S'agit-il d'un recensement ou d'un sondage ? Cette approche est-elle réaliste ?",
    steps: [
      "Un recensement observe toute la population ; un sondage observe seulement un échantillon.",
      "Ici, les 500 piles (toute la population) sont testées : c'est un recensement.",
      "Comme le test est destructif (la pile est vidée), tester toute la population ne laisse aucune pile à commercialiser. Un sondage sur un échantillon est donc la seule approche réaliste.",
    ],
    answer: "Recensement (mais non réaliste ici, car test destructif).",
  },
  {
    id: "stat-facile-03",
    topicId: "probability",
    lessonId: "PSD1",
    number: 3,
    title: "Classer une variable — nombre de fleurs",
    difficulty: "Fondamental",
    prompt:
      "Un botaniste observe le nombre de fleurs sur chaque tige d'un plant de trille blanc. Classe cette variable (qualitative ou quantitative) et précise son sous-type.",
    steps: [
      "La variable prend des valeurs numériques (0, 1, 2, 3, …) donc elle est quantitative.",
      "Les valeurs proviennent d'un comptage et sont isolées (on ne peut pas avoir 2,5 fleurs) : la variable est discrète.",
    ],
    answer: "Quantitative discrète.",
  },
  {
    id: "stat-facile-04",
    topicId: "probability",
    lessonId: "PSD1",
    number: 4,
    title: "Classer une variable — couleur des yeux",
    difficulty: "Fondamental",
    prompt:
      "Dans une étude de génétique, on note la couleur des yeux (bleu, brun, vert, noisette) de chaque participant. Classe cette variable et précise son sous-type.",
    steps: [
      "Les valeurs sont des catégories (mots), donc la variable est qualitative.",
      "Aucun ordre naturel n'existe entre les couleurs d'yeux : la variable est nominale.",
    ],
    answer: "Qualitative nominale.",
  },
  {
    id: "stat-facile-05",
    topicId: "probability",
    lessonId: "PSD1",
    number: 5,
    title: "Piège du code numérique — dossards",
    difficulty: "Fondamental",
    prompt:
      "Dans un marathon, chaque coureur porte un dossard numéroté de 1 à 500. Cette variable (le numéro de dossard) est-elle qualitative ou quantitative ? Justifie ta réponse.",
    steps: [
      "Test à te poser : « est-ce que faire la moyenne aurait du sens ? »",
      "La moyenne du dossard n° 42 et du dossard n° 318 (soit 180) ne représente rien de significatif.",
      "Les dossards servent uniquement d'étiquettes, sans ordre ni arithmétique : c'est une variable qualitative nominale.",
    ],
    answer: "Qualitative nominale (les chiffres ne sont que des étiquettes).",
  },
  {
    id: "stat-facile-06",
    topicId: "probability",
    lessonId: "PSD1",
    number: 6,
    title: "Identifier les éléments d'une étude — lacs",
    difficulty: "Fondamental",
    prompt:
      "Un climatologue veut connaître la profondeur moyenne des 320 lacs de plus de 1 km² du parc national de la Mauricie. Il en visite 40 choisis au hasard et mesure la profondeur maximale de chacun. Identifie la population, l'échantillon et la variable étudiée.",
    steps: [
      "Population : tous les individus visés par l'étude → les 320 lacs de plus de 1 km² du parc.",
      "Échantillon : le sous-ensemble effectivement observé → les 40 lacs visités.",
      "Variable : la caractéristique mesurée → la profondeur maximale.",
    ],
    answer: "Population = 320 lacs ; échantillon = 40 lacs ; variable = profondeur maximale.",
  },
  {
    id: "stat-facile-07",
    topicId: "probability",
    lessonId: "PSD1",
    number: 7,
    title: "Classer une variable — satisfaction",
    difficulty: "Fondamental",
    prompt:
      "Un restaurant sonde ses clients sur leur satisfaction avec les catégories : très insatisfait, insatisfait, neutre, satisfait, très satisfait. Classe cette variable et précise son sous-type.",
    steps: [
      "Les valeurs sont des catégories (mots), donc la variable est qualitative.",
      "Les catégories ont un ordre naturel (du moins au plus satisfait) : la variable est ordinale.",
    ],
    answer: "Qualitative ordinale.",
  },
  {
    id: "stat-facile-08",
    topicId: "probability",
    lessonId: "PSD1",
    number: 8,
    title: "Classer une variable — température corporelle",
    difficulty: "Fondamental",
    prompt:
      "Un infirmier mesure la température corporelle (en °C) de chaque patient à son arrivée à l'urgence. Classe cette variable et précise son sous-type.",
    steps: [
      "La variable prend des valeurs numériques, donc elle est quantitative.",
      "Elle provient d'une mesure et peut prendre n'importe quelle valeur dans un intervalle (37,2 ; 37,25 ; 37,254…) : elle est continue.",
    ],
    answer: "Quantitative continue.",
  },
  {
    id: "stat-facile-09",
    topicId: "probability",
    lessonId: "PSD1",
    number: 9,
    title: "Calculer une fréquence relative",
    difficulty: "Fondamental",
    prompt:
      "Sur 200 étudiants d'un cégep, 45 sont inscrits en Sciences de la nature. Quelle est la fréquence relative des étudiants inscrits en Sciences de la nature ? Exprime ta réponse en pourcentage.",
    steps: [
      "Formule de la fréquence relative : fᵢ = nᵢ / n.",
      "Substituer : f = 45 / 200 = 0,225.",
      "Convertir en pourcentage : 0,225 × 100 = 22,5 %.",
    ],
    answer: "22,5 %.",
  },
  {
    id: "stat-facile-10",
    topicId: "probability",
    lessonId: "PSD1",
    number: 10,
    title: "Calculer une fréquence relative cumulée",
    difficulty: "Fondamental",
    prompt:
      "Dans une étude sur les revenus annuels d'un groupe, les fréquences relatives des 4 premières classes de revenus sont 12 %, 25 %, 30 % et 20 %. Quelle est la fréquence relative cumulée jusqu'à la 4ᵉ classe (incluse) ?",
    steps: [
      "La fréquence cumulée est la somme des fréquences des classes précédentes et de la classe considérée.",
      "Additionner : 12 + 25 + 30 + 20 = 87 %.",
    ],
    answer: "87 %.",
  },
  {
    id: "stat-facile-11",
    topicId: "probability",
    lessonId: "PSD1",
    number: 11,
    title: "Compléter un tableau de fréquences",
    difficulty: "Fondamental",
    prompt:
      "Un professeur relève la discipline principale de 50 étudiants de première année : 20 en Sciences, 15 en Arts, 10 en Sciences humaines et 5 en Techniques. Calcule la fréquence relative de chaque discipline en pourcentage.",
    steps: [
      "Diviser l'effectif de chaque discipline par le total (50), puis multiplier par 100.",
      "Sciences : 20/50 = 40 %.",
      "Arts : 15/50 = 30 %.",
      "Sciences humaines : 10/50 = 20 %.",
      "Techniques : 5/50 = 10 %. La somme donne bien 100 %.",
    ],
    answer: "Sciences : 40 % ; Arts : 30 % ; Sciences humaines : 20 % ; Techniques : 10 %.",
  },
  {
    id: "stat-facile-12",
    topicId: "probability",
    lessonId: "PSD1",
    number: 12,
    title: "Amplitude de classes",
    difficulty: "Fondamental",
    prompt:
      "Un chercheur veut regrouper en 5 classes d'amplitude égale les tailles de 80 plants d'épinette, qui varient de 15 cm à 65 cm. Quelle amplitude minimale doit avoir chaque classe ?",
    steps: [
      "Calculer l'étendue : E = xmax − xmin = 65 − 15 = 50 cm.",
      "Calculer l'amplitude minimale : A = E / k = 50 / 5 = 10 cm.",
      "10 cm est déjà un nombre commode, on peut le garder tel quel.",
    ],
    answer: "A = 10 cm.",
  },
  {
    id: "stat-facile-13",
    topicId: "probability",
    lessonId: "PSD1",
    number: 13,
    title: "Proportion cumulée dans une distribution en classes",
    difficulty: "Fondamental",
    prompt:
      "Sur 60 étudiants, la distribution des notes à un examen est : 12 dans [0 ; 50), 24 dans [50 ; 70), 18 dans [70 ; 90) et 6 dans [90 ; 100]. Quelle proportion (en pourcentage) des étudiants a obtenu une note inférieure à 70 ?",
    steps: [
      "Additionner les effectifs des classes correspondant à une note < 70 : 12 + 24 = 36 étudiants.",
      "Calculer la proportion : 36 / 60 = 0,60 = 60 %.",
    ],
    answer: "60 %.",
  },
  {
    id: "stat-facile-14",
    topicId: "probability",
    lessonId: "PSD1",
    number: 14,
    title: "Lire un tableau à double entrée",
    difficulty: "Fondamental",
    prompt:
      "Un sondage auprès de 100 étudiants croise le sexe et le programme d'études. On relève : 22 femmes en biologie, 18 femmes en chimie, 15 hommes en biologie et 45 hommes en chimie. Combien d'étudiants au total sont inscrits en biologie ?",
    steps: [
      "Additionner les femmes en biologie et les hommes en biologie : 22 + 15 = 37.",
    ],
    answer: "37 étudiants.",
  },
  {
    id: "stat-facile-15",
    topicId: "probability",
    lessonId: "PSD1",
    number: 15,
    title: "Proportion conditionnelle dans un tableau croisé",
    difficulty: "Fondamental",
    prompt:
      "Dans un groupe de 200 personnes, on croise le sexe et le statut tabagique : 30 femmes fumeuses, 70 femmes non-fumeuses, 45 hommes fumeurs et 55 hommes non-fumeuses. Quelle proportion (en pourcentage) des femmes sont fumeuses ?",
    steps: [
      "Calculer le total de femmes : 30 + 70 = 100.",
      "Calculer la proportion de fumeuses parmi les femmes : 30 / 100 = 0,30 = 30 %.",
    ],
    answer: "30 %.",
  },
  {
    id: "stat-facile-16",
    topicId: "probability",
    lessonId: "PSD1",
    number: 16,
    title: "Choix du graphique — variable nominale",
    difficulty: "Fondamental",
    prompt:
      "Tu veux illustrer la répartition des groupes sanguins (O, A, B, AB) dans un échantillon de 50 donneurs. Quel type de graphique est approprié ?",
    steps: [
      "La variable « groupe sanguin » est qualitative nominale : les catégories n'ont pas d'ordre naturel.",
      "Le diagramme à bandes est le choix classique.",
      "Le diagramme circulaire (pie chart) est aussi acceptable, car il n'y a pas d'ordre à préserver.",
    ],
    answer: "Diagramme à bandes (ou diagramme circulaire).",
  },
  {
    id: "stat-facile-17",
    topicId: "probability",
    lessonId: "PSD1",
    number: 17,
    title: "Choix du graphique — variable continue",
    difficulty: "Fondamental",
    prompt:
      "Tu veux visualiser la distribution des taux de cholestérol (mg/dL) mesurés chez 200 patients. Quel type de graphique est le plus approprié ?",
    steps: [
      "Le taux de cholestérol est une variable quantitative continue.",
      "On regroupe les valeurs en classes d'amplitude égale et on utilise un histogramme.",
    ],
    answer: "Un histogramme.",
  },
  {
    id: "stat-facile-18",
    topicId: "probability",
    lessonId: "PSD1",
    number: 18,
    title: "Calculer une moyenne arithmétique",
    difficulty: "Fondamental",
    prompt:
      "Un étudiant a obtenu les notes suivantes à ses 5 quiz de calcul : 82, 75, 88, 91, 79. Calcule sa moyenne.",
    steps: [
      "Somme des notes : 82 + 75 + 88 + 91 + 79 = 415.",
      "Diviser par n = 5 : x̄ = 415 / 5 = 83.",
    ],
    answer: "x̄ = 83.",
  },
  {
    id: "stat-facile-19",
    topicId: "probability",
    lessonId: "PSD1",
    number: 19,
    title: "Trouver la médiane (n impair)",
    difficulty: "Fondamental",
    prompt:
      "Les températures maximales enregistrées à Montréal sur 7 jours consécutifs de juillet ont été (en °C) : 24, 27, 22, 30, 26, 29, 25. Trouve la médiane.",
    steps: [
      "Ordonner les valeurs : 22, 24, 25, 26, 27, 29, 30.",
      "Comme n = 7 est impair, la médiane est la valeur de rang (n+1)/2 = 4.",
      "La 4ᵉ valeur ordonnée est 26 °C.",
    ],
    answer: "Me = 26 °C.",
  },
  {
    id: "stat-facile-20",
    topicId: "probability",
    lessonId: "PSD1",
    number: 20,
    title: "Trouver le mode",
    difficulty: "Fondamental",
    prompt:
      "Dans une clinique podologique, on a relevé les pointures de chaussures des 10 derniers patients : 40, 42, 38, 40, 41, 42, 40, 39, 42, 40. Quel est le mode ?",
    steps: [
      "Le mode est la valeur qui apparaît le plus souvent.",
      "Dénombrer : 38 (1 fois), 39 (1 fois), 40 (4 fois), 41 (1 fois), 42 (3 fois).",
      "La valeur 40 revient le plus souvent.",
    ],
    answer: "Mo = 40 (apparaît 4 fois).",
  },
  {
    id: "stat-facile-21",
    topicId: "probability",
    lessonId: "PSD1",
    number: 21,
    title: "Calculer une moyenne pondérée",
    difficulty: "Fondamental",
    prompt:
      "Un cours comporte deux évaluations : un examen de mi-session pondéré à 40 % et un examen final pondéré à 60 %. Un étudiant a obtenu 72 % à la mi-session et 85 % au final. Calcule sa note finale du cours.",
    steps: [
      "Appliquer la formule : x̄ = 0,40 × 72 + 0,60 × 85.",
      "Calculer chaque terme : 0,40 × 72 = 28,8 et 0,60 × 85 = 51,0.",
      "Additionner : 28,8 + 51,0 = 79,8 %.",
    ],
    answer: "79,8 %.",
  },
  {
    id: "stat-facile-22",
    topicId: "probability",
    lessonId: "PSD1",
    number: 22,
    title: "Calculer une étendue avec nombres négatifs",
    difficulty: "Fondamental",
    prompt:
      "Les températures minimales enregistrées à Montréal en janvier 2024 ont varié de −28 °C à −2 °C. Quelle est l'étendue de ces températures ?",
    steps: [
      "Appliquer la formule : E = xmax − xmin = −2 − (−28).",
      "Attention au signe : −2 − (−28) = −2 + 28 = 26 °C.",
    ],
    answer: "E = 26 °C.",
  },
  {
    id: "stat-facile-23",
    topicId: "probability",
    lessonId: "PSD1",
    number: 23,
    title: "Calculer un écart-type échantillonnal",
    difficulty: "Fondamental",
    prompt:
      "Un chercheur mesure la longueur (en mm) de 3 larves d'insecte : 12, 15, 18. Calcule l'écart-type échantillonnal s.",
    steps: [
      "Calculer la moyenne : x̄ = (12 + 15 + 18) / 3 = 15 mm.",
      "Calculer les écarts à la moyenne : −3, 0, 3.",
      "Élever au carré : 9, 0, 9. Somme des carrés : 18.",
      "Variance échantillonnale : s² = 18 / (n − 1) = 18 / 2 = 9.",
      "Écart-type : s = √9 = 3 mm.",
    ],
    answer: "s = 3 mm.",
  },
  {
    id: "stat-facile-24",
    topicId: "probability",
    lessonId: "PSD1",
    number: 24,
    title: "Interpréter un écart-type",
    difficulty: "Fondamental",
    prompt:
      "Un logiciel calcule, pour la masse de 40 graines de tournesol, une moyenne x̄ = 45,0 g et un écart-type s = 4,2 g. Rédige une phrase d'interprétation qui inclut la moyenne, l'écart-type et les unités.",
    steps: [
      "Un écart-type doit toujours se lire avec sa moyenne et dans les unités de la variable.",
      "Ne jamais dire « s = 4,2 » tout seul, sans contexte.",
      "Formuler la phrase-type : « En moyenne, les [valeurs] s'écartent de [s] [unité] de la [valeur] moyenne, qui est de [x̄] [unité]. »",
    ],
    answer:
      "En moyenne, les masses des graines s'écartent de 4,2 g de la masse moyenne, qui est de 45,0 g.",
  },
  {
    id: "stat-facile-25",
    topicId: "probability",
    lessonId: "PSD1",
    number: 25,
    title: "Calculer une cote z",
    difficulty: "Fondamental",
    prompt:
      "À un examen dont la moyenne du groupe est de 70 % avec un écart-type de 8 %, un étudiant a obtenu 82 %. Calcule sa cote z et interprète le résultat.",
    steps: [
      "Appliquer la formule : z = (x − x̄) / s = (82 − 70) / 8.",
      "Calculer : z = 12 / 8 = 1,5.",
      "Interpréter : comme z > 0, l'observation est au-dessus de la moyenne, à 1,5 écart-type au-dessus.",
    ],
    answer: "z = 1,5 (1,5 écart-type au-dessus de la moyenne du groupe).",
  },
  // ═════════════════════════════════════════════════════════════════
  // 201-SN1-RE — Chapitre 1 : Statistiques descriptives (25 exercices intermédiaires)
  // ═════════════════════════════════════════════════════════════════
  {
    id: "stat-inter-01",
    topicId: "probability",
    lessonId: "PSD1",
    number: 26,
    title: "Représentativité et biais de sélection",
    difficulty: "Intermédiaire",
    prompt:
      "Un sondage en ligne demande aux étudiants leur temps hebdomadaire consacré aux jeux vidéo. 1200 étudiants répondent librement, et la moyenne obtenue est 25 h/semaine. Explique pourquoi cet échantillon n'est probablement pas représentatif malgré sa grande taille.",
    steps: [
      "La représentativité dépend de la méthode d'échantillonnage, pas seulement de la taille.",
      "Ici, les étudiants s'auto-sélectionnent : seuls les intéressés par le sujet (souvent des joueurs actifs) répondent.",
      "Ce biais de sélection surestime probablement la vraie moyenne dans la population étudiante.",
    ],
    answer: "L'échantillon subit un biais de sélection (auto-sélection). Un grand n ne compense pas ce biais.",
  },
  {
    id: "stat-inter-02",
    topicId: "probability",
    lessonId: "PSD1",
    number: 27,
    title: "Choisir entre recensement et sondage",
    difficulty: "Intermédiaire",
    prompt:
      "Un contrôleur qualité doit vérifier que les 30 extincteurs d'un immeuble fonctionnent, à l'aide d'un test non destructif. Doit-il faire un recensement ou un sondage ? Justifie.",
    steps: [
      "La population est petite (30 unités) et le test est non destructif : rien n'empêche de vérifier chaque unité.",
      "En contexte de sécurité incendie, un sondage laisserait passer un extincteur défectueux avec une probabilité non nulle : inacceptable.",
      "Le recensement est donc la seule approche prudente ici.",
    ],
    answer: "Recensement (population petite, test non destructif, enjeu de sécurité).",
  },
  {
    id: "stat-inter-03",
    topicId: "probability",
    lessonId: "PSD1",
    number: 28,
    title: "Classer plusieurs variables cliniques",
    difficulty: "Intermédiaire",
    prompt:
      "Un médecin recueille pour chaque patient : (a) le sexe ; (b) le stade du cancer (I, II, III, IV) ; (c) le nombre de traitements suivis ; (d) la concentration sanguine d'un biomarqueur (µg/mL). Classe chaque variable (type et sous-type).",
    steps: [
      "(a) Sexe : catégories sans ordre naturel → qualitative nominale.",
      "(b) Stade I à IV : catégories ordonnées (gravité croissante) → qualitative ordinale.",
      "(c) Nombre de traitements : valeurs entières issues d'un comptage → quantitative discrète.",
      "(d) Concentration : mesure sur un intervalle continu → quantitative continue.",
    ],
    answer:
      "(a) Qualitative nominale ; (b) qualitative ordinale ; (c) quantitative discrète ; (d) quantitative continue.",
  },
  {
    id: "stat-inter-04",
    topicId: "probability",
    lessonId: "PSD1",
    number: 29,
    title: "Échelle de douleur — variable ambiguë",
    difficulty: "Intermédiaire",
    prompt:
      "Une échelle de douleur de 0 à 10 est utilisée en médecine pour évaluer la douleur ressentie par un patient. Est-ce une variable qualitative ou quantitative ? Justifie ta réponse.",
    steps: [
      "L'échelle est numérique, ce qui suggère une variable quantitative.",
      "Mais elle est subjective : la différence entre 4 et 5 n'est pas nécessairement égale à celle entre 8 et 9.",
      "Sans unité de mesure objective, on la classe usuellement comme qualitative ordinale.",
    ],
    answer: "Habituellement traitée comme qualitative ordinale (bien que numérique, elle est subjective).",
  },
  {
    id: "stat-inter-05",
    topicId: "probability",
    lessonId: "PSD1",
    number: 30,
    title: "Classer quatre variables du quotidien",
    difficulty: "Intermédiaire",
    prompt:
      "Pour chaque variable ci-dessous, précise son type et son sous-type : (a) la ville de naissance ; (b) la mention obtenue à l'examen (échec, passable, bien, très bien) ; (c) le nombre de personnes vivant dans un ménage ; (d) le temps (en secondes) pour compléter une tâche.",
    steps: [
      "(a) Ville de naissance : catégories sans ordre → qualitative nominale.",
      "(b) Mention : catégories ordonnées → qualitative ordinale.",
      "(c) Nombre de personnes : comptage → quantitative discrète.",
      "(d) Temps : mesure continue → quantitative continue.",
    ],
    answer:
      "(a) Qualitative nominale ; (b) qualitative ordinale ; (c) quantitative discrète ; (d) quantitative continue.",
  },
  {
    id: "stat-inter-06",
    topicId: "probability",
    lessonId: "PSD1",
    number: 31,
    title: "Fréquences absolues, cumulées et proportion",
    difficulty: "Intermédiaire",
    prompt:
      "Sur 100 étudiants, la répartition des mentions à un examen est : Échec 5 %, Passable 25 %, Bien 45 %, Très bien 25 %. (a) Calcule les effectifs absolus. (b) Calcule les fréquences relatives cumulées (dans l'ordre Échec → Très bien). (c) Quelle proportion d'étudiants a obtenu au moins « Bien » ?",
    steps: [
      "(a) Effectif = fréquence × n : Échec 5, Passable 25, Bien 45, Très bien 25.",
      "(b) Cumulées par sommes successives : 5 %, 30 %, 75 %, 100 %.",
      "(c) « Au moins Bien » = Bien + Très bien = 45 % + 25 % = 70 %.",
    ],
    answer:
      "(a) 5, 25, 45, 25. (b) 5 %, 30 %, 75 %, 100 %. (c) 70 %.",
  },
  {
    id: "stat-inter-07",
    topicId: "probability",
    lessonId: "PSD1",
    number: 32,
    title: "Construire un tableau de fréquences",
    difficulty: "Intermédiaire",
    prompt:
      "Voici les âges de 15 personnes dans une classe : 18, 19, 18, 20, 21, 18, 19, 22, 19, 20, 18, 21, 19, 20, 25. Construis un tableau de distribution de fréquences absolues et relatives (en pourcentage arrondi au dixième).",
    steps: [
      "Compter chaque valeur : 18 (4 fois), 19 (4), 20 (3), 21 (2), 22 (1), 25 (1). Total 15.",
      "Fréquences relatives = effectif / 15, puis × 100 :",
      "18 → 26,7 % ; 19 → 26,7 % ; 20 → 20,0 % ; 21 → 13,3 % ; 22 → 6,7 % ; 25 → 6,7 %.",
      "Somme des pourcentages ≈ 100 %.",
    ],
    answer:
      "18 : 4 (26,7 %) ; 19 : 4 (26,7 %) ; 20 : 3 (20,0 %) ; 21 : 2 (13,3 %) ; 22 : 1 (6,7 %) ; 25 : 1 (6,7 %).",
  },
  {
    id: "stat-inter-08",
    topicId: "probability",
    lessonId: "PSD1",
    number: 33,
    title: "Distribution des heures de sommeil",
    difficulty: "Intermédiaire",
    prompt:
      "Sur 200 adultes, la distribution du nombre d'heures de sommeil par nuit est : [4 ; 6) → 20 personnes ; [6 ; 7) → 60 ; [7 ; 8) → 80 ; [8 ; 10) → 40. (a) Combien d'adultes dorment moins de 7 h ? (b) Quelle proportion (en %) dort au moins 7 h ?",
    steps: [
      "(a) Somme des classes inférieures à 7 h : 20 + 60 = 80 adultes.",
      "(b) Somme des classes ≥ 7 h : 80 + 40 = 120 adultes. Proportion : 120/200 = 60 %.",
    ],
    answer: "(a) 80 adultes. (b) 60 %.",
  },
  {
    id: "stat-inter-09",
    topicId: "probability",
    lessonId: "PSD1",
    number: 34,
    title: "Regrouper 20 fossiles en 5 classes",
    difficulty: "Intermédiaire",
    prompt:
      "Les longueurs (en mm) de 20 fossiles sont : 12, 18, 25, 30, 14, 22, 28, 16, 20, 35, 27, 33, 15, 21, 26, 29, 32, 19, 24, 31. Détermine l'étendue et propose 5 classes d'amplitude égale.",
    steps: [
      "Trouver xmax = 35 et xmin = 12 → étendue E = 35 − 12 = 23 mm.",
      "Amplitude minimale : A = E / k = 23 / 5 = 4,6 mm.",
      "On arrondit vers le haut à un nombre commode : A = 5 mm.",
      "Classes : [12 ; 17), [17 ; 22), [22 ; 27), [27 ; 32), [32 ; 37).",
    ],
    answer: "E = 23 mm ; A = 5 mm ; classes [12 ; 17), [17 ; 22), [22 ; 27), [27 ; 32), [32 ; 37).",
  },
  {
    id: "stat-inter-10",
    topicId: "probability",
    lessonId: "PSD1",
    number: 35,
    title: "Fréquences relatives et cumulées (pH des sols)",
    difficulty: "Intermédiaire",
    prompt:
      "Un tableau donne les effectifs de 60 échantillons de sol répartis par pH : [6,0 ; 6,5) : 8 ; [6,5 ; 7,0) : 15 ; [7,0 ; 7,5) : 22 ; [7,5 ; 8,0) : 10 ; [8,0 ; 8,5) : 5. Calcule les fréquences relatives et les fréquences relatives cumulées (arrondies au dixième de %).",
    steps: [
      "Fréquences relatives (nᵢ/60 × 100) : 13,3 % ; 25,0 % ; 36,7 % ; 16,7 % ; 8,3 %.",
      "Cumulées (sommes successives) : 13,3 % ; 38,3 % ; 75,0 % ; 91,7 % ; 100,0 %.",
    ],
    answer:
      "fᵢ : 13,3 %, 25,0 %, 36,7 %, 16,7 %, 8,3 %. Cumulées : 13,3 %, 38,3 %, 75,0 %, 91,7 %, 100,0 %.",
  },
  {
    id: "stat-inter-11",
    topicId: "probability",
    lessonId: "PSD1",
    number: 36,
    title: "Proportion de bébés d'au moins 3,5 kg",
    difficulty: "Intermédiaire",
    prompt:
      "Sur 500 nouveau-nés, les masses à la naissance (en kg) sont réparties : [2,0 ; 2,5) : 15 ; [2,5 ; 3,0) : 85 ; [3,0 ; 3,5) : 200 ; [3,5 ; 4,0) : 155 ; [4,0 ; 4,5) : 45. Quelle proportion des bébés a une masse d'au moins 3,5 kg ?",
    steps: [
      "Additionner les effectifs des classes ≥ 3,5 kg : 155 + 45 = 200.",
      "Diviser par le total : 200 / 500 = 0,40 = 40 %.",
    ],
    answer: "40 %.",
  },
  {
    id: "stat-inter-12",
    topicId: "probability",
    lessonId: "PSD1",
    number: 37,
    title: "Tableau croisé — hypertension et consommation de sel",
    difficulty: "Intermédiaire",
    prompt:
      "Sur 300 patients, on croise l'hypertension (Oui/Non) et la consommation de sel (Faible/Modérée/Forte). Effectifs : Hypertension × Faible = 20, Modérée = 50, Forte = 60 ; Sans hypertension × Faible = 60, Modérée = 70, Forte = 40. (a) Quelle proportion des patients hypertendus consomme du sel en forte quantité ? (b) Quelle proportion des grands consommateurs de sel sont hypertendus ?",
    steps: [
      "(a) Total hypertendus = 20 + 50 + 60 = 130. Fort consommateurs parmi eux = 60. Proportion : 60/130 ≈ 46,2 %.",
      "(b) Total grands consommateurs = 60 + 40 = 100. Hypertendus parmi eux = 60. Proportion : 60/100 = 60 %.",
    ],
    answer: "(a) ≈ 46,2 %. (b) 60 %.",
  },
  {
    id: "stat-inter-13",
    topicId: "probability",
    lessonId: "PSD1",
    number: 38,
    title: "Deux proportions dans un tableau croisé",
    difficulty: "Intermédiaire",
    prompt:
      "Un cégep compte 500 étudiants en Sciences (300 hommes, 200 femmes) et 300 étudiants en Arts (100 hommes, 200 femmes). (a) Quelle proportion des étudiants en Sciences sont des femmes ? (b) Quelle proportion des femmes du cégep étudient en Sciences ?",
    steps: [
      "(a) Femmes en Sciences / total Sciences = 200 / 500 = 40 %.",
      "(b) Total femmes = 200 + 200 = 400. Femmes en Sciences / total femmes = 200 / 400 = 50 %.",
      "Les deux questions conditionnent sur des populations de référence différentes, d'où deux résultats différents.",
    ],
    answer: "(a) 40 %. (b) 50 %.",
  },
  {
    id: "stat-inter-14",
    topicId: "probability",
    lessonId: "PSD1",
    number: 39,
    title: "Piège du diagramme circulaire pour une variable ordinale",
    difficulty: "Intermédiaire",
    prompt:
      "Un directeur d'école veut visualiser la répartition des mentions à un examen (Échec, Passable, Bien, Très bien). Un enseignant propose un diagramme circulaire. Est-ce un bon choix ? Justifie.",
    steps: [
      "La variable « mention » est qualitative ordinale : les catégories ont un ordre naturel.",
      "Le diagramme circulaire fait perdre cet ordre (aucune direction de lecture ne le préserve).",
      "Un diagramme à bandes avec l'ordre Échec → Très bien est plus adapté.",
    ],
    answer: "Non : diagramme à bandes préférable (préserve l'ordre naturel des catégories).",
  },
  {
    id: "stat-inter-15",
    topicId: "probability",
    lessonId: "PSD1",
    number: 40,
    title: "Choix du graphique pour quatre variables",
    difficulty: "Intermédiaire",
    prompt:
      "Pour chacune de ces variables, indique quel graphique est le plus approprié : (a) nombre de bactéries observées par échantillon ; (b) espèce d'oiseau capturée ; (c) hauteur des arbres (mesurée en cm) ; (d) niveau de scolarité (primaire, secondaire, collégial, universitaire).",
    steps: [
      "(a) Quantitative discrète → diagramme à bâtons.",
      "(b) Qualitative nominale → diagramme à bandes ou circulaire.",
      "(c) Quantitative continue → histogramme.",
      "(d) Qualitative ordinale → diagramme à bandes avec ordre respecté.",
    ],
    answer:
      "(a) Bâtons ; (b) bandes ou circulaire ; (c) histogramme ; (d) bandes ordonnées.",
  },
  {
    id: "stat-inter-16",
    topicId: "probability",
    lessonId: "PSD1",
    number: 41,
    title: "Moyenne, médiane et mode d'un jeu bimodal",
    difficulty: "Intermédiaire",
    prompt:
      "On a le jeu de données suivant : 12, 15, 18, 12, 20, 15, 22, 18, 15, 25, 30. Calcule la moyenne, la médiane et le mode.",
    steps: [
      "Somme = 202. Moyenne : x̄ = 202 / 11 ≈ 18,4.",
      "Ordonné : 12, 12, 15, 15, 15, 18, 18, 20, 22, 25, 30. n = 11 impair → médiane = rang 6 = 18.",
      "Mode : 15 apparaît 3 fois, plus que toute autre valeur.",
    ],
    answer: "Moyenne ≈ 18,4 ; médiane = 18 ; mode = 15.",
  },
  {
    id: "stat-inter-17",
    topicId: "probability",
    lessonId: "PSD1",
    number: 42,
    title: "Moyenne pondérée par les crédits",
    difficulty: "Intermédiaire",
    prompt:
      "Un étudiant a suivi 3 cours : Mathématiques (4 crédits, note 78 %), Français (3 crédits, note 82 %) et Éducation physique (1 crédit, note 90 %). Calcule sa moyenne pondérée par les crédits.",
    steps: [
      "Numérateur : 4 × 78 + 3 × 82 + 1 × 90 = 312 + 246 + 90 = 648.",
      "Dénominateur : total des crédits = 4 + 3 + 1 = 8.",
      "Moyenne pondérée : 648 / 8 = 81 %.",
    ],
    answer: "81 %.",
  },
  {
    id: "stat-inter-18",
    topicId: "probability",
    lessonId: "PSD1",
    number: 43,
    title: "Médiane avec n pair",
    difficulty: "Intermédiaire",
    prompt:
      "Les temps de réaction (en ms) de 8 sujets à un test cognitif sont : 245, 312, 198, 265, 289, 302, 220, 275. Calcule la médiane.",
    steps: [
      "Ordonner : 198, 220, 245, 265, 275, 289, 302, 312.",
      "n = 8 pair → médiane = moyenne des rangs 4 et 5 = (265 + 275) / 2 = 270.",
    ],
    answer: "Me = 270 ms.",
  },
  {
    id: "stat-inter-19",
    topicId: "probability",
    lessonId: "PSD1",
    number: 44,
    title: "Moyenne sur données groupées",
    difficulty: "Intermédiaire",
    prompt:
      "Le tableau donne les scores (sur 100) de 60 étudiants regroupés en classes : [0 ; 20) : 6 ; [20 ; 40) : 12 ; [40 ; 60) : 24 ; [60 ; 80) : 15 ; [80 ; 100) : 3. Calcule la moyenne à partir des centres de classe.",
    steps: [
      "Centres de classe : 10, 30, 50, 70, 90.",
      "Somme pondérée Σ nᵢ · cᵢ = 6·10 + 12·30 + 24·50 + 15·70 + 3·90 = 60 + 360 + 1200 + 1050 + 270 = 2940.",
      "Moyenne : x̄ ≈ 2940 / 60 = 49.",
    ],
    answer: "x̄ ≈ 49.",
  },
  {
    id: "stat-inter-20",
    topicId: "probability",
    lessonId: "PSD1",
    number: 45,
    title: "Étendue et conversion d'unités",
    difficulty: "Intermédiaire",
    prompt:
      "Les températures relevées chez 5 patients sont : 37,2 °C ; 38,5 °C ; 36,8 °C ; 39,1 °C ; 37,5 °C. (a) Quelle est l'étendue en °C ? (b) Exprime cette étendue en degrés Fahrenheit (conversion d'un écart : ΔF = (9/5) × ΔC).",
    steps: [
      "(a) E = xmax − xmin = 39,1 − 36,8 = 2,3 °C.",
      "(b) Conversion d'un écart (sans ajout de 32) : 2,3 × 9/5 = 4,14 °F.",
    ],
    answer: "(a) 2,3 °C. (b) 4,14 °F.",
  },
  {
    id: "stat-inter-21",
    topicId: "probability",
    lessonId: "PSD1",
    number: 46,
    title: "Comparer deux écarts-types",
    difficulty: "Intermédiaire",
    prompt:
      "Deux groupes d'étudiants ont la même moyenne x̄ = 74 mais des écarts-types différents : groupe A avec s = 5, groupe B avec s = 15. Compare les deux groupes en une ou deux phrases.",
    steps: [
      "L'écart-type mesure la dispersion autour de la moyenne : plus il est grand, plus les valeurs sont éparpillées.",
      "Groupe A : valeurs regroupées (s'écartent en moyenne de 5 unités de la moyenne).",
      "Groupe B : valeurs très dispersées (écart moyen d'environ 15 unités).",
    ],
    answer:
      "Le groupe A est plus régulier (s = 5) ; le groupe B est 3× plus dispersé (s = 15). Même moyenne, mais expériences très différentes.",
  },
  {
    id: "stat-inter-22",
    topicId: "probability",
    lessonId: "PSD1",
    number: 47,
    title: "Calcul complet de l'écart-type",
    difficulty: "Intermédiaire",
    prompt:
      "Un chercheur mesure la masse (en g) de 5 grenouilles : 42, 38, 45, 41, 44. Calcule la moyenne et l'écart-type échantillonnal.",
    steps: [
      "Moyenne : x̄ = (42 + 38 + 45 + 41 + 44) / 5 = 210 / 5 = 42 g.",
      "Écarts à la moyenne : 0, −4, 3, −1, 2.",
      "Carrés : 0, 16, 9, 1, 4. Somme : 30.",
      "Variance : s² = 30 / (5 − 1) = 7,5.",
      "Écart-type : s = √7,5 ≈ 2,74 g.",
    ],
    answer: "x̄ = 42 g ; s ≈ 2,74 g.",
  },
  {
    id: "stat-inter-23",
    topicId: "probability",
    lessonId: "PSD1",
    number: 48,
    title: "Choisir entre moyenne et médiane (revenus)",
    difficulty: "Intermédiaire",
    prompt:
      "Les revenus annuels (en k$) de 7 personnes dans un petit bureau sont : 42, 45, 48, 50, 52, 55, 380. (a) Calcule la moyenne et la médiane. (b) Laquelle représente mieux le « revenu typique » des employés ? Justifie.",
    steps: [
      "(a) Moyenne : x̄ = 672 / 7 = 96 k$. Ordonné : 42, 45, 48, 50, 52, 55, 380. n = 7 impair → médiane = rang 4 = 50 k$.",
      "(b) La moyenne (96) est fortement tirée vers le haut par la valeur extrême (380 k$, probablement le patron).",
      "La médiane (50 k$), robuste aux valeurs aberrantes, reflète mieux le revenu de la majorité.",
    ],
    answer: "(a) Moyenne = 96 k$ ; médiane = 50 k$. (b) La médiane représente mieux le revenu typique.",
  },
  {
    id: "stat-inter-24",
    topicId: "probability",
    lessonId: "PSD1",
    number: 49,
    title: "Comparer deux performances via la cote z",
    difficulty: "Intermédiaire",
    prompt:
      "Marie a obtenu 78 % à un test de biologie dont la moyenne du groupe est 65 et l'écart-type 10. Jean a obtenu 82 % à un test de chimie dont la moyenne du groupe est 75 et l'écart-type 6. Qui a mieux performé par rapport à son groupe ?",
    steps: [
      "Cote z de Marie : z_M = (78 − 65) / 10 = 1,30.",
      "Cote z de Jean : z_J = (82 − 75) / 6 ≈ 1,17.",
      "Marie se situe plus haut au-dessus de la moyenne de son groupe (1,30 vs 1,17).",
      "Même si Jean a une note brute plus élevée, Marie a mieux performé relativement à son groupe.",
    ],
    answer: "Marie (z ≈ 1,30) a mieux performé que Jean (z ≈ 1,17) par rapport à son groupe.",
  },
  {
    id: "stat-inter-25",
    topicId: "probability",
    lessonId: "PSD1",
    number: 50,
    title: "Passer d'une cote z à un score brut",
    difficulty: "Intermédiaire",
    prompt:
      "Dans un groupe où la moyenne des notes est 68 et l'écart-type 8, quel score brut correspond à une cote z = −1,5 ? Interprète ce que cela signifie pour l'étudiant.",
    steps: [
      "Isoler x dans z = (x − x̄) / s : x = x̄ + z · s.",
      "Substituer : x = 68 + (−1,5)(8) = 68 − 12 = 56.",
      "Interpréter : l'étudiant est à 1,5 écart-type sous la moyenne. Comme |z| < 2, ce n'est pas encore une valeur atypique, mais c'est clairement dans la partie basse de la distribution.",
    ],
    answer: "x = 56 (à 1,5 écart-type sous la moyenne du groupe).",
  },
  // ═════════════════════════════════════════════════════════════════
  // 201-SN1-RE — Chapitre 1 : Statistiques descriptives (15 exercices difficiles)
  // ═════════════════════════════════════════════════════════════════
  {
    id: "stat-diff-01",
    topicId: "probability",
    lessonId: "PSD1",
    number: 51,
    title: "Critiquer un sondage électoral",
    difficulty: "Avancé",
    prompt:
      "Un institut prédit le résultat d'une élection provinciale en sondant 1200 personnes dans 5 régions urbaines du Québec, avec une marge d'erreur affichée de ±3 %. Le lendemain de l'élection, les résultats diffèrent nettement du sondage. Propose au moins deux raisons statistiques pouvant expliquer cet écart.",
    steps: [
      "Représentativité géographique : les 5 régions urbaines ne couvrent pas la population rurale et semi-urbaine, ce qui introduit un biais.",
      "Méthode de collecte : selon le mode (téléphone, en ligne), certains groupes sont sous-représentés (aînés, jeunes sans ligne fixe, non-abonnés).",
      "Comportement des indécis : ils peuvent basculer massivement dans les derniers jours, non captés par un sondage antérieur.",
      "La marge de ±3 % couvre l'erreur d'échantillonnage aléatoire, pas les biais systématiques ci-dessus.",
    ],
    answer:
      "Biais géographique + biais de méthode + volatilité des indécis. La marge d'erreur ne couvre que l'aléa d'échantillonnage, pas les biais systémiques.",
  },
  {
    id: "stat-diff-02",
    topicId: "probability",
    lessonId: "PSD1",
    number: 52,
    title: "Deux variables — types et représentation",
    difficulty: "Avancé",
    prompt:
      "Un chercheur mesure l'apport calorique quotidien (kcal) de 200 étudiants et note s'ils pratiquent un sport (Oui/Non). Il veut comparer les deux groupes. (a) Identifie les deux variables et leur type. (b) Propose une représentation graphique adaptée pour comparer les distributions.",
    steps: [
      "(a) Pratique du sport : Oui/Non → qualitative nominale (deux catégories, sans ordre).",
      "Apport calorique : mesure numérique → quantitative continue.",
      "(b) Comme on croise une qualitative (sport) et une quantitative continue (apport), on trace deux histogrammes (un pour Oui, un pour Non) ou deux boîtes à moustaches parallèles pour comparer les distributions.",
    ],
    answer:
      "(a) Sport : qualitative nominale ; apport calorique : quantitative continue. (b) Deux histogrammes superposés ou deux boîtes à moustaches parallèles.",
  },
  {
    id: "stat-diff-03",
    topicId: "probability",
    lessonId: "PSD1",
    number: 53,
    title: "Feu de circulation — nominale ou ordinale ?",
    difficulty: "Avancé",
    prompt:
      "La couleur d'un feu de circulation prend les valeurs « rouge », « jaune », « vert ». Argumente d'abord en faveur d'une classification nominale, puis en faveur d'une classification ordinale. Quelle classification retiens-tu et pourquoi ?",
    steps: [
      "Argument nominal : les couleurs sont des étiquettes sans ordre intrinsèque — rouge ≠ « plus grand » que vert.",
      "Argument ordinal : dans le contexte du feu, il existe un ordre fonctionnel (vert → jaune → rouge → vert), donc un cycle.",
      "Cependant, un ordre cyclique n'est pas un ordre total (on ne peut pas dire strictement rouge < vert ou l'inverse). La classification usuelle est donc nominale.",
      "Retenu : qualitative nominale.",
    ],
    answer: "Qualitative nominale (l'ordre cyclique du feu ne définit pas un ordre total).",
  },
  {
    id: "stat-diff-04",
    topicId: "probability",
    lessonId: "PSD1",
    number: 54,
    title: "Construire une distribution en 4 classes",
    difficulty: "Avancé",
    prompt:
      "Voici les temps (en secondes) que 20 rats ont pris pour résoudre un labyrinthe : 45, 67, 52, 78, 34, 92, 55, 71, 48, 63, 82, 58, 41, 75, 88, 66, 51, 73, 60, 84. Construis une distribution en 4 classes d'amplitude égale et calcule les fréquences relatives cumulées.",
    steps: [
      "Étendue : E = 92 − 34 = 58 s. Amplitude : A = 58/4 = 14,5 → arrondie à 15 s.",
      "Classes (à partir de 34) : [34 ; 49), [49 ; 64), [64 ; 79), [79 ; 94).",
      "Effectifs (en comptant chaque valeur) : 4, 6, 6, 4. Total : 20 ✓.",
      "Fréquences relatives : 20 %, 30 %, 30 %, 20 %.",
      "Cumulées : 20 %, 50 %, 80 %, 100 %.",
    ],
    answer:
      "[34;49) : 4 (20 %) ; [49;64) : 6 (30 %) ; [64;79) : 6 (30 %) ; [79;94) : 4 (20 %). Cumulées : 20 %, 50 %, 80 %, 100 %.",
  },
  {
    id: "stat-diff-05",
    topicId: "probability",
    lessonId: "PSD1",
    number: 55,
    title: "Distribution asymétrique — moyenne ou médiane ?",
    difficulty: "Avancé",
    prompt:
      "L'histogramme des revenus annuels d'une population montre une distribution très asymétrique à droite (longue queue à droite). (a) La moyenne sera-t-elle plus grande, plus petite ou égale à la médiane ? (b) Quelle mesure privilégier pour représenter le « revenu typique » ? Justifie.",
    steps: [
      "(a) Dans une distribution asymétrique à droite, la longue queue tire la moyenne vers les grandes valeurs. La moyenne > médiane.",
      "(b) La médiane est plus représentative du revenu typique : robuste aux valeurs extrêmes, elle indique le milieu réel de la distribution.",
      "La moyenne, elle, serait tirée vers le haut par une minorité de très hauts revenus.",
    ],
    answer: "(a) Moyenne > médiane. (b) La médiane représente mieux le revenu typique.",
  },
  {
    id: "stat-diff-06",
    topicId: "probability",
    lessonId: "PSD1",
    number: 56,
    title: "Choix du nombre de classes",
    difficulty: "Avancé",
    prompt:
      "Un chercheur analyse les rendements agricoles de 500 parcelles, allant de 2 à 12 t/ha. Il hésite entre 4 classes (amplitude 2,5 t/ha) et 20 classes (amplitude 0,5 t/ha). Discute des avantages et inconvénients de chaque choix et propose un compromis.",
    steps: [
      "4 classes : histogramme lisible et compact, mais très peu de résolution — risque de masquer une structure bimodale ou des sous-groupes.",
      "20 classes : très détaillé mais bruité (peu d'observations par classe → hauteurs de barres irrégulières et peu fiables).",
      "Règle empirique : pour n = 500, entre 8 et 15 classes est raisonnable.",
      "Compromis : 10 classes d'amplitude 1 t/ha — lisibilité correcte et résolution suffisante.",
    ],
    answer:
      "4 classes = trop grossier ; 20 classes = trop bruité. Compromis : 10 classes d'amplitude 1 t/ha.",
  },
  {
    id: "stat-diff-07",
    topicId: "probability",
    lessonId: "PSD1",
    number: 57,
    title: "Paradoxe de Simpson dans un tableau croisé",
    difficulty: "Avancé",
    prompt:
      "Le cégep A a un taux global d'admission de 40 %, le cégep B de 50 %. Pourtant, quand on compare programme par programme, le cégep A admet un plus grand pourcentage de candidats dans chaque programme. Comment est-ce possible ?",
    steps: [
      "C'est un exemple du paradoxe de Simpson (effet de composition).",
      "Le cégep A reçoit peut-être beaucoup de candidatures dans des programmes très sélectifs (taux d'admission faible), tirant sa moyenne globale vers le bas.",
      "Le cégep B reçoit peut-être surtout des candidatures dans des programmes peu sélectifs (taux d'admission élevé), tirant sa moyenne vers le haut.",
      "En agrégeant les données, la composition différente des candidatures inverse la comparaison programme par programme.",
    ],
    answer:
      "Paradoxe de Simpson : la composition différente des candidatures (par programme) inverse la comparaison globale.",
  },
  {
    id: "stat-diff-08",
    topicId: "probability",
    lessonId: "PSD1",
    number: 58,
    title: "Graphique trompeur — axe tronqué",
    difficulty: "Avancé",
    prompt:
      "Un magazine publie un graphique à bandes comparant les ventes 2022 (500 000 $) et 2023 (550 000 $) d'une entreprise. La barre de 2023 paraît environ deux fois plus grande que celle de 2022. Quel est le problème et comment le corriger ?",
    steps: [
      "L'axe des Y est probablement tronqué (par exemple, commence à 480 000 $ au lieu de 0).",
      "Cela exagère visuellement une croissance réelle de 10 % (50 000 sur 500 000).",
      "Correction : étendre l'axe Y jusqu'à 0 pour que la hauteur des bandes soit proportionnelle à la valeur réelle.",
      "Sinon, mentionner explicitement la troncature et l'échelle utilisée.",
    ],
    answer: "L'axe Y est tronqué (ne part pas de 0), ce qui exagère la différence. Étendre l'axe à 0.",
  },
  {
    id: "stat-diff-09",
    topicId: "probability",
    lessonId: "PSD1",
    number: 59,
    title: "La moyenne cache la distribution",
    difficulty: "Avancé",
    prompt:
      "Un professeur affirme : « La moyenne de ma classe à l'examen est de 75 %, donc la majorité de mes étudiants ont bien réussi. » Cette affirmation est-elle nécessairement vraie ? Donne un contre-exemple numérique clair.",
    steps: [
      "Non. La moyenne ne renseigne pas sur la répartition des notes.",
      "Contre-exemple : dans une classe de 20 étudiants, 4 obtiennent 100 % et 16 obtiennent 68,75 %.",
      "Vérification de la moyenne : (4 × 100 + 16 × 68,75) / 20 = (400 + 1100) / 20 = 75 %. ✓",
      "Mais 80 % des étudiants ont eu moins que 75 % — le professeur ne peut pas conclure que « la majorité » a bien réussi.",
    ],
    answer:
      "Non. Ex : 4 étudiants à 100 % et 16 à 68,75 % → moyenne = 75 %, mais 80 % des étudiants ont moins que 75 %.",
  },
  {
    id: "stat-diff-10",
    topicId: "probability",
    lessonId: "PSD1",
    number: 60,
    title: "Mesure de tendance centrale sur temps de visite",
    difficulty: "Avancé",
    prompt:
      "Un analyste étudie le temps passé par les visiteurs sur un site web. La distribution montre une longue queue à droite (quelques « power users » restent des heures). Quelle mesure de tendance centrale devrait-il rapporter pour caractériser un visiteur typique ? Que se passerait-il s'il rapportait la moyenne ?",
    steps: [
      "La distribution asymétrique à droite tire la moyenne vers le haut à cause des power users.",
      "La moyenne surestimerait donc le temps du visiteur typique.",
      "La médiane, robuste aux valeurs extrêmes, est plus fidèle au comportement du visiteur ordinaire.",
      "Compléter éventuellement avec un mode ou une distribution complète pour révéler la présence de sous-populations.",
    ],
    answer:
      "Rapporter la médiane. La moyenne serait surestimée par les power users et ne représenterait pas le visiteur typique.",
  },
  {
    id: "stat-diff-11",
    topicId: "probability",
    lessonId: "PSD1",
    number: 61,
    title: "Coefficient de variation — comparer des unités différentes",
    difficulty: "Avancé",
    prompt:
      "Un ornithologue compare la variabilité de deux caractéristiques mesurées sur une même population d'oiseaux : la masse (moyenne 30 g, écart-type 5 g) et l'envergure des ailes (moyenne 300 mm, écart-type 20 mm). Laquelle est proportionnellement plus variable ? Calcule le coefficient de variation CV = s / x̄ (exprimé en %).",
    steps: [
      "CV de la masse : CV_M = s / x̄ = 5 / 30 ≈ 0,167 = 16,7 %.",
      "CV de l'envergure : CV_E = 20 / 300 ≈ 0,067 = 6,7 %.",
      "16,7 % / 6,7 % ≈ 2,5 : la masse est environ 2,5 fois plus variable proportionnellement à sa moyenne.",
      "Le CV permet de comparer la variabilité entre variables d'unités différentes, ce que l'écart-type seul ne permet pas.",
    ],
    answer: "CV_M ≈ 16,7 % ; CV_E ≈ 6,7 %. La masse est ~2,5× plus variable proportionnellement.",
  },
  {
    id: "stat-diff-12",
    topicId: "probability",
    lessonId: "PSD1",
    number: 62,
    title: "Sensibilité aux valeurs aberrantes",
    difficulty: "Avancé",
    prompt:
      "Voici les temps d'attente (en minutes) de 8 patients aux urgences : 20, 25, 30, 22, 28, 24, 26, 200. (a) Calcule la moyenne et la médiane. (b) Retire la valeur 200 et refais les calculs. (c) Commente sur la sensibilité de chaque mesure à la valeur aberrante.",
    steps: [
      "(a) Somme = 375, moyenne = 375/8 ≈ 46,9 min. Ordonné : 20, 22, 24, 25, 26, 28, 30, 200 → médiane = (25+26)/2 = 25,5 min.",
      "(b) Sans 200 : somme = 175, moyenne = 175/7 = 25 min. Ordonné : 20, 22, 24, 25, 26, 28, 30 → médiane = 25 min.",
      "(c) La moyenne a chuté de 46,9 à 25 min (variation de ~47 %) — très sensible à la valeur aberrante.",
      "La médiane est passée de 25,5 à 25 min (variation négligeable) — robuste aux valeurs aberrantes.",
    ],
    answer:
      "(a) Moyenne ≈ 46,9 ; médiane = 25,5. (b) Moyenne = 25 ; médiane = 25. (c) La médiane est robuste, la moyenne est très sensible aux valeurs aberrantes.",
  },
  {
    id: "stat-diff-13",
    topicId: "probability",
    lessonId: "PSD1",
    number: 63,
    title: "Cote z pour détecter une valeur atypique",
    difficulty: "Avancé",
    prompt:
      "Dans une étude clinique, la glycémie à jeun d'un groupe de contrôle a une moyenne de 5,2 mmol/L et un écart-type de 0,4 mmol/L. Un patient présente une valeur de 7,8 mmol/L. (a) Calcule sa cote z. (b) Cette valeur est-elle atypique ? (c) Quelle recommandation clinique donnerais-tu ?",
    steps: [
      "(a) z = (7,8 − 5,2) / 0,4 = 2,6 / 0,4 = 6,5.",
      "(b) |z| = 6,5 est très largement supérieur au seuil typique de 2. C'est une valeur extrêmement atypique.",
      "(c) Recommandation : vérifier la mesure (risque d'erreur), refaire un test à jeun, et investiguer une possible pathologie (diabète). Un z de 6,5 est cliniquement très significatif.",
    ],
    answer:
      "(a) z = 6,5. (b) Extrêmement atypique. (c) Vérifier la mesure et investiguer une pathologie (diabète possible).",
  },
  {
    id: "stat-diff-14",
    topicId: "probability",
    lessonId: "PSD1",
    number: 64,
    title: "Retrouver deux notes à partir de cotes z",
    difficulty: "Avancé",
    prompt:
      "Deux étudiants ont obtenu des cotes z de +1,25 et −0,75 à un examen dont la moyenne est 70 % et l'écart-type est 12 %. (a) Retrouve leurs notes brutes. (b) Quelle est la différence entre leurs notes en écarts-types ? En points ?",
    steps: [
      "(a) On isole x dans z = (x − x̄) / s : x = x̄ + z · s.",
      "Étudiant 1 : x₁ = 70 + 1,25 × 12 = 70 + 15 = 85 %.",
      "Étudiant 2 : x₂ = 70 + (−0,75) × 12 = 70 − 9 = 61 %.",
      "(b) En écarts-types : 1,25 − (−0,75) = 2 écarts-types de différence.",
      "En points : 85 − 61 = 24 points (équivalent à 2 × 12 = 24 ✓).",
    ],
    answer:
      "(a) 85 % et 61 %. (b) 2 écarts-types = 24 points.",
  },
  {
    id: "stat-diff-15",
    topicId: "probability",
    lessonId: "PSD1",
    number: 65,
    title: "Contrôle qualité et règle empirique",
    difficulty: "Avancé",
    prompt:
      "Une usine produit des barres d'acier dont la longueur suit approximativement une loi symétrique en cloche, avec moyenne 200 mm et écart-type 3 mm. Le contrôle qualité rejette toute barre dont la cote z est en dehors de [−3 ; +3]. (a) À quelles longueurs correspondent les seuils de rejet ? (b) Sur 500 barres produites, environ combien seront rejetées ? (Indice : règle empirique 68-95-99,7.)",
    steps: [
      "(a) Seuil bas : x = 200 + (−3)(3) = 191 mm. Seuil haut : x = 200 + 3(3) = 209 mm.",
      "Rejet si longueur < 191 mm ou > 209 mm.",
      "(b) D'après la règle empirique 68-95-99,7, environ 99,7 % des valeurs sont dans [µ − 3σ ; µ + 3σ].",
      "Donc environ 0,3 % (soit 100 % − 99,7 %) sont hors de cet intervalle.",
      "Sur 500 barres : 500 × 0,003 = 1,5 barre. En pratique, on rejettera 1 ou 2 barres.",
    ],
    answer: "(a) Rejet si < 191 mm ou > 209 mm. (b) ≈ 0,3 % soit environ 1 ou 2 barres sur 500.",
  },
];

// Imported from the Vecteur Math algebra exercise book (auteur du projet).
// Generated by scripts/parse_exercises.py — see scripts/pdf_extract.txt for the source.
const importedLinalgExercises = linalgRawExercises as Exercise[];

export const exercises: Exercise[] = [
  ...manualExercises,
  ...importedLinalgExercises,
];
