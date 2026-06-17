import type { Exercise, RichContent, RichPart, MatrixCell } from "../../data/exercises";
import { nonZero, pick, randInt, uniqueId } from "../rng";

// Helpers to assemble rich content concisely
const t = (s: string): RichPart => ({ type: "text", content: s });
const sub = (s: string): RichPart => ({ type: "sub", content: s });
const sup = (s: string): RichPart => ({ type: "sup", content: s });
const mat = (
  data: MatrixCell[][],
  label?: string
): RichPart => ({ type: "matrix", data, label });
const bold = (content: RichContent): RichPart => ({ type: "bold", content });

function buildMatrix(
  rows: number,
  cols: number,
  formula: (i: number, j: number) => number
): MatrixCell[][] {
  const data: MatrixCell[][] = [];
  for (let i = 1; i <= rows; i++) {
    const row: MatrixCell[] = [];
    for (let j = 1; j <= cols; j++) {
      row.push(String(formula(i, j)));
    }
    data.push(row);
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// FACILE : Construire la matrice étant donné une formule simple
// ─────────────────────────────────────────────────────────────────────────────
function easyConstructMatrix(): Exercise {
  const c1 = nonZero(1, 4);
  const c2 = nonZero(1, 4);
  const rows = pick([2, 3]);
  const cols = pick([3, 4]);
  const data = buildMatrix(rows, cols, (i, j) => c1 * i + c2 * j);

  const prompt: RichContent = [
    t("Soit la matrice A = (a"),
    sub("ij"),
    t(`) de dimension ${rows}×${cols} où a`),
    sub("ij"),
    t(` = ${c1}i + ${c2}j. Construire A.`),
  ];

  const steps: RichContent[] = [
    [t("Calculer a"), sub("ij"), t(` = ${c1}i + ${c2}j pour chaque position (i, j).`)],
    [t("A = "), mat(data)],
  ];

  const answer: RichContent = [mat(data, "A =")];

  return {
    id: uniqueId("quiz-L1-easy"),
    topicId: "linear-algebra",
    lessonId: "L1",
    title: "Construire une matrice à partir d'une formule",
    difficulty: "Fondamental",
    prompt,
    steps,
    answer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERMÉDIAIRE : Trouver x et y pour égalité matricielle
// ─────────────────────────────────────────────────────────────────────────────
function intermediateMatrixEquality(): Exercise {
  // Build A with entries [2x+a, b ; c, 3y-d] = [target1, b ; c, target2]
  const a = nonZero(1, 5);
  const d = nonZero(1, 5);
  const b = nonZero(-5, 5);
  const c = nonZero(-5, 5);
  const x = randInt(1, 6);
  const y = randInt(1, 6);
  const t1 = 2 * x + a;
  const t2 = 3 * y - d;

  const left: MatrixCell[][] = [
    [`2x + ${a}`, String(b)],
    [String(c), `3y - ${d}`],
  ];
  const right: MatrixCell[][] = [
    [String(t1), String(b)],
    [String(c), String(t2)],
  ];

  const prompt: RichContent = [
    t("Trouver les valeurs de x et y telles que les matrices suivantes soient égales :"),
    mat(left, "A ="),
    t("=  "),
    mat(right, "B ="),
  ];

  const steps: RichContent[] = [
    [t("Égalité matricielle : comparer chaque entrée correspondante.")],
    [t(`Position (1,1) : 2x + ${a} = ${t1} ⇒ x = ${x}.`)],
    [t(`Position (2,2) : 3y - ${d} = ${t2} ⇒ y = ${y}.`)],
  ];

  const answer: RichContent = [bold([t(`x = ${x}, y = ${y}.`)])];

  return {
    id: uniqueId("quiz-L1-inter"),
    topicId: "linear-algebra",
    lessonId: "L1",
    title: "Trouver les inconnues d'une égalité matricielle",
    difficulty: "Intermédiaire",
    prompt,
    steps,
    answer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERMÉDIAIRE : Construire la matrice et identifier un élément
// ─────────────────────────────────────────────────────────────────────────────
function intermediateBuildAndQuery(): Exercise {
  const c1 = nonZero(2, 4);
  const c2 = nonZero(1, 3);
  const rows = 3;
  const cols = 3;
  const formula = (i: number, j: number) => c1 * i * i - c2 * j;
  const data = buildMatrix(rows, cols, formula);

  // Pick a random position to ask about
  const qi = randInt(1, rows);
  const qj = randInt(1, cols);
  const val = formula(qi, qj);

  const prompt: RichContent = [
    t("Soit A = (a"),
    sub("ij"),
    t(`)`),
    sub(`${rows}×${cols}`),
    t(" avec a"),
    sub("ij"),
    t(` = ${c1}i`),
    sup("2"),
    t(` - ${c2}j. Construire A et identifier l'élément a`),
    sub(`${qi}${qj}`),
    t("."),
  ];

  const steps: RichContent[] = [
    [t(`Évaluer a${qi}${qj} = ${c1}(${qi})² - ${c2}(${qj}) = ${c1 * qi * qi} - ${c2 * qj} = ${val}.`)],
    [t("A = "), mat(data)],
  ];

  const answer: RichContent = [
    mat(data, "A ="),
    bold([t(" ; a"), sub(`${qi}${qj}`), t(` = ${val}.`)]),
  ];

  return {
    id: uniqueId("quiz-L1-inter"),
    topicId: "linear-algebra",
    lessonId: "L1",
    title: "Construire A et identifier un élément",
    difficulty: "Intermédiaire",
    prompt,
    steps,
    answer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVANCÉ : Symétrique / antisymétrique ?
// ─────────────────────────────────────────────────────────────────────────────
function advancedSymmetryCheck(): Exercise {
  // Build A with formula a_ij = c1*i² + c2*j (likely NOT symmetric)
  // Or a_ij = i + j (symmetric) — randomly pick
  const isSymmetric = Math.random() < 0.4;
  const isAntisymmetric = !isSymmetric && Math.random() < 0.3;
  let formulaStr: RichContent;
  let formula: (i: number, j: number) => number;

  if (isSymmetric) {
    const c = nonZero(1, 3);
    formulaStr = [t(`${c}(i + j)`)];
    formula = (i, j) => c * (i + j);
  } else if (isAntisymmetric) {
    formulaStr = [t("i - j")];
    formula = (i, j) => i - j;
  } else {
    const c1 = nonZero(1, 3);
    const c2 = nonZero(1, 3);
    formulaStr = [t(`${c1}i`), sup("2"), t(` - ${c2}j`)];
    formula = (i, j) => c1 * i * i - c2 * j;
  }

  const data = buildMatrix(3, 3, formula);
  const transposed: MatrixCell[][] = [];
  for (let i = 0; i < 3; i++) {
    const row: MatrixCell[] = [];
    for (let j = 0; j < 3; j++) {
      row.push(String(formula(j + 1, i + 1)));
    }
    transposed.push(row);
  }

  const conclusion = isSymmetric
    ? "symétrique (A = Aᵀ)"
    : isAntisymmetric
    ? "antisymétrique (Aᵀ = -A et diagonale nulle)"
    : "ni symétrique ni antisymétrique";

  const prompt: RichContent = [
    t("Soit A = (a"),
    sub("ij"),
    t(")"),
    sub("3×3"),
    t(" avec a"),
    sub("ij"),
    t(" = "),
    ...formulaStr,
    t(". Construire A puis déterminer si A est symétrique, antisymétrique ou ni l'un ni l'autre."),
  ];

  const steps: RichContent[] = [
    [t("Calculer A puis comparer à sa transposée A"), sup("T"), t(".")],
    [t("A = "), mat(data), t(" ; A"), sup("T"), t(" = "), mat(transposed)],
    [
      t("Comparer entrée par entrée : A "),
      isSymmetric ? t("= ") : t("≠ "),
      t("A"),
      sup("T"),
      t("."),
    ],
  ];

  const answer: RichContent = [bold([t(`A est ${conclusion}.`)])];

  return {
    id: uniqueId("quiz-L1-adv"),
    topicId: "linear-algebra",
    lessonId: "L1",
    title: "Symétrique, antisymétrique ou ni l'un ni l'autre ?",
    difficulty: "Avancé",
    prompt,
    steps,
    answer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVANCÉ : Toutes les matrices 2×2 binaires satisfaisant une contrainte
// ─────────────────────────────────────────────────────────────────────────────
function advancedEnumerateMatrices(): Exercise {
  // Find all A = (a_ij)_{2×2} with a_ij ∈ {0,1} such that sum = S and a11 = a22
  const S = pick([2, 3]);

  // Enumerate all 2x2 binary matrices satisfying the constraints
  const solutions: MatrixCell[][][] = [];
  for (const a11 of [0, 1]) {
    for (const a12 of [0, 1]) {
      for (const a21 of [0, 1]) {
        for (const a22 of [0, 1]) {
          if (a11 === a22 && a11 + a12 + a21 + a22 === S) {
            solutions.push([
              [String(a11), String(a12)],
              [String(a21), String(a22)],
            ]);
          }
        }
      }
    }
  }

  const prompt: RichContent = [
    t("Trouver toutes les matrices A = (a"),
    sub("ij"),
    t(")"),
    sub("2×2"),
    t(" avec a"),
    sub("ij"),
    t(" ∈ {0, 1} telles que a"),
    sub("11"),
    t(" + a"),
    sub("12"),
    t(" + a"),
    sub("21"),
    t(" + a"),
    sub("22"),
    t(` = ${S} et a`),
    sub("11"),
    t(" = a"),
    sub("22"),
    t("."),
  ];

  const steps: RichContent[] = [
    [
      t("Énumérer les cas selon la valeur de a"),
      sub("11"),
      t(" = a"),
      sub("22"),
      t(" ∈ {0, 1}, puis ajuster a"),
      sub("12"),
      t(" + a"),
      sub("21"),
      t(` pour que la somme totale soit ${S}.`),
    ],
  ];

  const answerParts: RichPart[] = [
    t(`Il y a ${solutions.length} matrice${solutions.length > 1 ? "s" : ""} possible${solutions.length > 1 ? "s" : ""} : `),
  ];
  solutions.forEach((sol, idx) => {
    answerParts.push(mat(sol));
    if (idx < solutions.length - 1) answerParts.push(t(", "));
  });
  answerParts.push(t("."));

  return {
    id: uniqueId("quiz-L1-adv"),
    topicId: "linear-algebra",
    lessonId: "L1",
    title: "Énumérer des matrices binaires sous contraintes",
    difficulty: "Avancé",
    prompt,
    steps,
    answer: [bold(answerParts)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry: assemble 1 easy + 2 intermediate + 2 advanced
// ─────────────────────────────────────────────────────────────────────────────
const intermediateTemplates = [intermediateMatrixEquality, intermediateBuildAndQuery];
const advancedTemplates = [advancedSymmetryCheck, advancedEnumerateMatrices];

export function generateL1Quiz(): Exercise[] {
  const inter = [pick(intermediateTemplates)(), pick(intermediateTemplates)()];
  const adv = [pick(advancedTemplates)(), pick(advancedTemplates)()];
  return [easyConstructMatrix(), ...inter, ...adv];
}
