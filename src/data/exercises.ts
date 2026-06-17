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
];

// Imported from the Vecteur Math algebra exercise book (auteur du projet).
// Generated by scripts/parse_exercises.py — see scripts/pdf_extract.txt for the source.
const importedLinalgExercises = linalgRawExercises as Exercise[];

export const exercises: Exercise[] = [
  ...manualExercises,
  ...importedLinalgExercises,
];
