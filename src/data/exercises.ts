import linalgRawExercises from "./linalg_exercises.json";

export type Difficulty = "Fondamental" | "Intermédiaire" | "Avancé";

export type MatrixCell = string | number | { type: "sep" };

export type MCQOption = {
  id: string;
  content: RichContent;
  correct: boolean;
};

export type RichPart =
  | { type: "text"; content: string }
  | { type: "sub"; content: string }
  | { type: "sup"; content: string }
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
  {
    id: "prob-bayes",
    topicId: "probability",
    title: "Appliquer le théorème de Bayes",
    difficulty: "Avancé",
    prompt:
      "Un test de dépistage est précis à 99 %, et 1 % de la population est atteinte. Sachant qu'un test est positif, quelle est la probabilité que la personne soit réellement atteinte ?",
    steps: [
      "Définir les événements : M = malade (P = 0,01), + = test positif.",
      "Écrire le théorème de Bayes : P(M|+) = P(+|M)·P(M) / P(+).",
      "Calculer P(+|M)·P(M) = 0,99 × 0,01 = 0,0099.",
      "Calculer P(+) par la probabilité totale : P(+|M)P(M) + P(+|¬M)P(¬M) = 0,0099 + (0,01 × 0,99) = 0,0099 + 0,0099 = 0,0198.",
      "Diviser : P(M|+) = 0,0099 / 0,0198 = 0,5, soit 50 %.",
    ],
    answer: "50 % — même avec un test précis à 99 %, un résultat positif équivaut à pile ou face quand la maladie est rare.",
  },
  {
    id: "prob-comb-committee",
    topicId: "probability",
    title: "Former un comité (combinaison simple)",
    difficulty: "Fondamental",
    prompt:
      "Combien de comités distincts de 3 personnes peut-on former dans un groupe de 10 étudiants ?",
    steps: [
      "Reconnaître qu'on choisit 3 personnes sans tenir compte de l'ordre : c'est une combinaison C(n, k).",
      "Identifier les paramètres : n = 10 et k = 3.",
      "Écrire la formule : C(n, k) = n! / (k! · (n − k)!).",
      "Substituer : C(10, 3) = 10! / (3! · 7!) = (10 · 9 · 8) / (3 · 2 · 1).",
      "Calculer : 720 / 6 = 120 comités distincts.",
    ],
    answer: "C(10, 3) = 120 comités",
  },
  {
    id: "prob-comb-anagrams",
    topicId: "probability",
    title: "Compter les anagrammes de MISSISSIPPI",
    difficulty: "Intermédiaire",
    prompt:
      "Combien d'anagrammes distinctes peut-on former avec toutes les lettres du mot MISSISSIPPI ?",
    steps: [
      "Compter les lettres : le mot contient 11 lettres au total.",
      "Repérer les répétitions : 1 M, 4 I, 4 S et 2 P.",
      "Appliquer la formule des permutations avec répétitions : n! / (n₁! · n₂! · … · nₖ!).",
      "Substituer : 11! / (1! · 4! · 4! · 2!) = 39 916 800 / (1 · 24 · 24 · 2).",
      "Simplifier le dénominateur (1 152) puis diviser : 39 916 800 / 1 152 = 34 650.",
    ],
    answer: "34 650 anagrammes distinctes",
  },
  {
    id: "prob-comb-derangements",
    topicId: "probability",
    title: "Le problème des chapeaux (dérangements)",
    difficulty: "Avancé",
    prompt:
      "Cinq invités déposent leur chapeau au vestiaire. À la sortie, on leur rend les chapeaux au hasard. De combien de manières peut-on les distribuer pour qu'aucun invité ne reçoive le sien ?",
    steps: [
      "Reconnaître un problème de dérangements : permutations sans point fixe, notées D(n).",
      "Utiliser la formule du principe d'inclusion-exclusion : D(n) = n! · Σ_{k=0}^{n} (−1)^k / k!.",
      "Développer pour n = 5 : D(5) = 5! · (1 − 1/1! + 1/2! − 1/3! + 1/4! − 1/5!).",
      "Mettre au même dénominateur (120) : la somme devient (120 − 120 + 60 − 20 + 5 − 1) / 120 = 44 / 120.",
      "Multiplier par 5! = 120 : D(5) = 120 · (44 / 120) = 44 distributions valides.",
    ],
    answer: "D(5) = 44 manières",
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
];

// Imported from the Vecteur Math algebra exercise book (auteur du projet).
// Generated by scripts/parse_exercises.py — see scripts/pdf_extract.txt for the source.
const importedLinalgExercises = linalgRawExercises as Exercise[];

export const exercises: Exercise[] = [
  ...manualExercises,
  ...importedLinalgExercises,
];
