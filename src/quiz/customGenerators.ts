import type { Exercise, RichPart } from "../data/exercises";
import { randInt, nonZero, pick, uniqueId } from "./rng";
import { generateQuiz, hasQuizGenerator } from "./registry";

// Inline rich-content helpers (same shape as the manualExercises).
const t = (s: string): RichPart => ({ type: "text", content: s });
const vec = (s: string): RichPart => ({ type: "vec", content: [{ type: "text", content: s }] });

// ════════════════════════════════════════════════════════════════════════
//  Eligible lessons for the custom quiz generator
// ════════════════════════════════════════════════════════════════════════

export const CUSTOM_QUIZ_LESSONS = [
  "L15", "L16", "L17", "L18", "L19", "L20", "L21", "L22",
  "L23", "L24", "L25", "L26", "L27", "L28", "L29",
  "L34", "L35", "L36", "L37",
];

// ════════════════════════════════════════════════════════════════════════
//  Random helpers
// ════════════════════════════════════════════════════════════════════════

const vectorNames = ["u", "v", "w", "a", "b"];
function diffPick<T>(arr: T[], not: T): T {
  let p = pick(arr);
  while (p === not) p = pick(arr);
  return p;
}
function rand3(min = -5, max = 5): [number, number, number] {
  return [nonZero(min, max), nonZero(min, max), nonZero(min, max)];
}
function rand2(min = -5, max = 5): [number, number] {
  return [nonZero(min, max), nonZero(min, max)];
}
function fmt3(v: [number, number, number]) {
  return `(${v[0]}, ${v[1]}, ${v[2]})`;
}
function fmt2(v: [number, number]) {
  return `(${v[0]}, ${v[1]})`;
}
function addV(a: number[], b: number[]) {
  return a.map((x, i) => x + b[i]);
}
function scaleV(k: number, a: number[]) {
  return a.map((x) => k * x);
}

// ════════════════════════════════════════════════════════════════════════
//  L23 — Vecteurs géométriques 1 (Chasles, addition, opposés)
// ════════════════════════════════════════════════════════════════════════

function l23Mcq(): Exercise {
  const points = ["A", "B", "C", "D"];
  const [p1, p2, p3] = [points[0], points[1], points[2]]; // A, B, C
  return {
    id: uniqueId("gen-L23-mcq"),
    topicId: "linear-algebra",
    lessonId: "L23",
    title: "QCM — Relation de Chasles",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t(`Selon la relation de Chasles, ${p1}${p2} + ${p2}${p3} = ?`),
    ],
    options: [
      { id: "a", content: [vec(`${p1}${p3}`)], correct: true },
      { id: "b", content: [vec(`${p3}${p1}`)], correct: false },
      { id: "c", content: [vec(`${p2}${p1}`), t(" + "), vec(`${p2}${p3}`)], correct: false },
      { id: "d", content: "0 (vecteur nul)", correct: false },
    ],
    explanation: [
      t(`Par la relation de Chasles : ${p1}${p2} + ${p2}${p3} = ${p1}${p3}.`),
    ],
    steps: [],
    answer: `${p1}${p3}`,
  };
}

function l23Tf(): Exercise {
  const p1 = pick(["A", "B"]);
  const p2 = p1 === "A" ? "B" : "C";
  const isTrue = pick([true, false]);
  if (isTrue) {
    return {
      id: uniqueId("gen-L23-tf"),
      topicId: "linear-algebra",
      lessonId: "L23",
      title: "Vrai ou Faux — Vecteur opposé",
      difficulty: "Intermédiaire",
      type: "tf",
      prompt: [
        t("Le vecteur opposé de "), vec(`${p1}${p2}`), t(" est "), vec(`${p2}${p1}`),
        t(", et "), vec(`${p1}${p2}`), t(" + "), vec(`${p2}${p1}`), t(" = 0."),
      ],
      isTrue: true,
      explanation: [
        t("Vrai. Par Chasles : "), vec(`${p1}${p2}`), t(" + "), vec(`${p2}${p1}`),
        t(` = ${p1}${p1} = 0.`),
      ],
      steps: [],
      answer: "Vrai",
    };
  } else {
    const v1 = pick(vectorNames);
    const v2 = diffPick(vectorNames, v1);
    return {
      id: uniqueId("gen-L23-tf"),
      topicId: "linear-algebra",
      lessonId: "L23",
      title: "Vrai ou Faux — Addition non commutative ?",
      difficulty: "Intermédiaire",
      type: "tf",
      prompt: [
        t("L'addition de vecteurs n'est pas commutative : "),
        vec(v1), t(" + "), vec(v2), t(" ≠ "), vec(v2), t(" + "), vec(v1), t("."),
      ],
      isTrue: false,
      explanation: [
        t("Faux. L'addition de vecteurs EST commutative (règle du parallélogramme)."),
      ],
      steps: [],
      answer: "Faux",
    };
  }
}

function l23Calc(): Exercise {
  // "Simplify" a Chasles chain
  const p = ["A", "B", "C", "D"];
  return {
    id: uniqueId("gen-L23-calc"),
    topicId: "linear-algebra",
    lessonId: "L23",
    title: "Simplifier par Chasles",
    difficulty: "Intermédiaire",
    prompt: [
      t("Simplifier l'expression : "),
      vec(`${p[0]}${p[1]}`), t(" + "), vec(`${p[1]}${p[2]}`), t(" + "), vec(`${p[2]}${p[3]}`), t("."),
    ],
    steps: [
      [t("Appliquer la relation de Chasles successivement : "),
        vec(`${p[0]}${p[1]}`), t(" + "), vec(`${p[1]}${p[2]}`), t(" = "), vec(`${p[0]}${p[2]}`), t(".")],
      [t("Puis : "), vec(`${p[0]}${p[2]}`), t(" + "), vec(`${p[2]}${p[3]}`), t(" = "), vec(`${p[0]}${p[3]}`), t(".")],
    ],
    answer: [t("La somme vaut "), vec(`${p[0]}${p[3]}`), t(".")],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L24 — Vecteurs géométriques 2 (multiplication scalaire)
// ════════════════════════════════════════════════════════════════════════

function l24Mcq(): Exercise {
  const k = nonZero(-5, -2);
  const v = pick(vectorNames);
  const ak = Math.abs(k);
  return {
    id: uniqueId("gen-L24-mcq"),
    topicId: "linear-algebra",
    lessonId: "L24",
    title: "QCM — Multiplication par un scalaire négatif",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Si "), vec(v), t(" est un vecteur non nul, alors le vecteur "),
      t(`${k}`), vec(v), t(" a :"),
    ],
    options: [
      { id: "a", content: [t("Même direction et même sens que "), vec(v), t(`, norme ${ak} fois plus grande`)], correct: false },
      { id: "b", content: [t("Même direction que "), vec(v), t(`, sens opposé, norme ${ak} fois plus grande`)], correct: true },
      { id: "c", content: [t("Direction perpendiculaire à "), vec(v)], correct: false },
      { id: "d", content: [t("La même norme que "), vec(v)], correct: false },
    ],
    explanation: [
      t(`Multiplier par k change la norme par |k| = ${ak}. Comme k = ${k} < 0, le sens est inversé, la direction est conservée.`),
    ],
    steps: [],
    answer: `Même direction, sens opposé, norme ${ak}× plus grande`,
  };
}

function l24Tf(): Exercise {
  const k = nonZero(-9, 9);
  const norm = randInt(2, 10);
  const v = pick(vectorNames);
  const correct = Math.abs(k) * norm;
  const isTrueQ = pick([true, false]);
  const proposed = isTrueQ ? correct : correct + nonZero(-3, 3);
  return {
    id: uniqueId("gen-L24-tf"),
    topicId: "linear-algebra",
    lessonId: "L24",
    title: "Vrai ou Faux — Norme d'un multiple",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t(`Si ‖`), vec(v), t(`‖ = ${norm}, alors ‖`), t(`${k}`), vec(v), t(`‖ = ${proposed}.`),
    ],
    isTrue: proposed === correct,
    explanation: [
      t(`‖k`), vec(v), t(`‖ = |k|·‖`), vec(v), t(`‖ = ${Math.abs(k)}·${norm} = ${correct}. ${proposed === correct ? "Vrai." : `Faux : la bonne valeur est ${correct}.`}`),
    ],
    steps: [],
    answer: proposed === correct ? "Vrai" : "Faux",
  };
}

function l24Calc(): Exercise {
  const k = nonZero(-5, 5);
  const norm = randInt(2, 10);
  const v = pick(vectorNames);
  return {
    id: uniqueId("gen-L24-calc"),
    topicId: "linear-algebra",
    lessonId: "L24",
    title: "Calculer une norme",
    difficulty: "Fondamental",
    prompt: [
      t(`Sachant que ‖`), vec(v), t(`‖ = ${norm}, calculer ‖`), t(`${k}`), vec(v), t(`‖.`),
    ],
    steps: [
      [t(`Appliquer la propriété ‖k·`), vec(v), t(`‖ = |k|·‖`), vec(v), t(`‖.`)],
      [t(`Substituer : |${k}|·${norm} = ${Math.abs(k)}·${norm} = ${Math.abs(k) * norm}.`)],
    ],
    answer: [t(`‖`), t(`${k}`), vec(v), t(`‖ = ${Math.abs(k) * norm}.`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L25 — Vecteurs géométriques 3 (combinaisons, vecteurs unitaires)
// ════════════════════════════════════════════════════════════════════════

function l25Mcq(): Exercise {
  const norm = pick([2, 3, 4, 5, 6, 8]);
  const v = pick(vectorNames);
  return {
    id: uniqueId("gen-L25-mcq"),
    topicId: "linear-algebra",
    lessonId: "L25",
    title: "QCM — Norme d'un vecteur réduit",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t(`Soit `), vec(v), t(` un vecteur tel que ‖`), vec(v), t(`‖ = ${norm}. Quelle est la norme du vecteur (1/${norm})`), vec(v), t(` ?`),
    ],
    options: [
      { id: "a", content: "1", correct: true },
      { id: "b", content: String(norm), correct: false },
      { id: "c", content: `1/${norm}`, correct: false },
      { id: "d", content: String(norm * norm), correct: false },
    ],
    explanation: [
      t(`‖(1/${norm})`), vec(v), t(`‖ = (1/${norm})·‖`), vec(v), t(`‖ = (1/${norm})·${norm} = 1. C'est un vecteur unitaire.`),
    ],
    steps: [],
    answer: "1",
  };
}

function l25Tf(): Exercise {
  const v = pick(vectorNames);
  const isTrueQ = pick([true, false]);
  return {
    id: uniqueId("gen-L25-tf"),
    topicId: "linear-algebra",
    lessonId: "L25",
    title: "Vrai ou Faux — Vecteur unitaire",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t(`Le vecteur ${isTrueQ ? "" : "−"}`), vec(v), t(` / ‖`), vec(v), t(`‖ est un vecteur unitaire ${isTrueQ ? "dans le même sens" : "dans le sens opposé"} de `), vec(v), t("."),
    ],
    isTrue: true,
    explanation: [
      t(`Vrai. La norme est ‖`), vec(v), t(`‖ / ‖`), vec(v), t(`‖ = 1. ${isTrueQ ? "Le sens est conservé." : "Le signe négatif inverse le sens."}`),
    ],
    steps: [],
    answer: "Vrai",
  };
}

function l25Calc(): Exercise {
  const a = nonZero(-4, 4);
  const b = nonZero(-4, 4);
  const v1 = pick(vectorNames);
  const v2 = diffPick(vectorNames, v1);
  return {
    id: uniqueId("gen-L25-calc"),
    topicId: "linear-algebra",
    lessonId: "L25",
    title: "Simplifier une combinaison linéaire",
    difficulty: "Fondamental",
    prompt: [
      t(`Simplifier l'expression : ${a}`), vec(v1), t(` + ${b}`), vec(v2), t(` + ${-a}`), vec(v1),
      t(` + ${1 - b}`), vec(v2), t("."),
    ],
    steps: [
      [t(`Regrouper les termes en `), vec(v1), t(` : (${a} + ${-a})`), vec(v1), t(` = 0.`)],
      [t(`Regrouper les termes en `), vec(v2), t(` : (${b} + ${1 - b})`), vec(v2), t(` = 1·`), vec(v2), t(` = `), vec(v2), t(".")],
    ],
    answer: [vec(v2)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L26 — Démonstrations en géométrie (milieu, parallélogramme, barycentre)
// ════════════════════════════════════════════════════════════════════════

function l26Mcq(): Exercise {
  const k = pick([2, 3, 4, 5]);
  const points = ["A", "B", "C", "D"];
  const [P, Q] = [points[0], points[1]];
  return {
    id: uniqueId("gen-L26-mcq"),
    topicId: "linear-algebra",
    lessonId: "L26",
    title: "QCM — Point sur un segment",
    difficulty: "Avancé",
    type: "mcq",
    prompt: [
      t(`Soit M un point tel que `), vec(`${P}M`), t(` = (1/${k})`), vec(`${P}${Q}`),
      t(`. Que vaut `), vec(`M${Q}`), t(` ?`),
    ],
    options: [
      { id: "a", content: [t(`(${k - 1}/${k})`), vec(`${P}${Q}`)], correct: true },
      { id: "b", content: [t(`(1/${k})`), vec(`${P}${Q}`)], correct: false },
      { id: "c", content: [t(`(${k}/${k - 1})`), vec(`${P}${Q}`)], correct: false },
      { id: "d", content: [vec(`${P}${Q}`)], correct: false },
    ],
    explanation: [
      t(`Par Chasles : `), vec(`M${Q}`), t(` = `), vec(`${P}${Q}`), t(` − `), vec(`${P}M`),
      t(` = `), vec(`${P}${Q}`), t(` − (1/${k})`), vec(`${P}${Q}`), t(` = (${k - 1}/${k})`), vec(`${P}${Q}`), t("."),
    ],
    steps: [],
    answer: `(${k - 1}/${k})·PQ`,
  };
}

function l26Tf(): Exercise {
  const isTrueQ = pick([true, false]);
  const points = ["A", "B", "C", "D"];
  const [P, Q, R, S] = points;
  return {
    id: uniqueId("gen-L26-tf"),
    topicId: "linear-algebra",
    lessonId: "L26",
    title: "Vrai ou Faux — Parallélogramme",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t(`${P}${Q}${R}${S} est un parallélogramme si et seulement si `),
      vec(`${P}${Q}`), t(" = "), vec(isTrueQ ? `${S}${R}` : `${R}${S}`), t("."),
    ],
    isTrue: isTrueQ,
    explanation: [
      t(isTrueQ
        ? `Vrai. ${P}${Q} = ${S}${R} signifie que les côtés (${P}${Q}) et (${S}${R}) sont parallèles, de même longueur et même sens : c'est la définition d'un parallélogramme.`
        : `Faux. ${P}${Q} = ${R}${S} caractériserait un parallélogramme croisé. La bonne relation est `) ,
      isTrueQ ? t("") : vec(`${P}${Q}`),
      isTrueQ ? t("") : t(" = "),
      isTrueQ ? t("") : vec(`${S}${R}`),
      isTrueQ ? t("") : t("."),
    ],
    steps: [],
    answer: isTrueQ ? "Vrai" : "Faux",
  };
}

function l26Calc(): Exercise {
  // "Trouver C tel que B est milieu de AC" — given A and B, find C
  const A: [number, number] = rand2(-5, 5);
  const B: [number, number] = rand2(-5, 5);
  const C: [number, number] = [2 * B[0] - A[0], 2 * B[1] - A[1]];
  return {
    id: uniqueId("gen-L26-calc"),
    topicId: "linear-algebra",
    lessonId: "L26",
    title: "Trouver le point symétrique",
    difficulty: "Intermédiaire",
    prompt: [
      t(`Soit A = ${fmt2(A)} et B = ${fmt2(B)}. Trouver le point C tel que B soit le milieu du segment [AC].`),
    ],
    steps: [
      [t("Si B est le milieu de [AC], alors B = (A + C)/2, donc C = 2B − A.")],
      [t(`Calcul : C = 2·${fmt2(B)} − ${fmt2(A)} = (${2 * B[0]} − ${A[0]}, ${2 * B[1]} − ${A[1]}) = ${fmt2(C)}.`)],
    ],
    answer: [t(`C = ${fmt2(C)}.`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L27 — Vecteurs algébriques 1 (composantes, addition)
// ════════════════════════════════════════════════════════════════════════

function l27Mcq(): Exercise {
  const use3D = pick([true, false]);
  if (use3D) {
    const A = rand3(-5, 5);
    const B = rand3(-5, 5);
    const AB: [number, number, number] = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    return {
      id: uniqueId("gen-L27-mcq"),
      topicId: "linear-algebra",
      lessonId: "L27",
      title: "QCM — Composantes d'un vecteur en 3D",
      difficulty: "Intermédiaire",
      type: "mcq",
      prompt: [
        t(`Si A = ${fmt3(A)} et B = ${fmt3(B)} dans R³, quelles sont les composantes de `),
        vec("AB"), t(" ?"),
      ],
      options: [
        { id: "a", content: fmt3(AB), correct: true },
        { id: "b", content: fmt3([A[0] + B[0], A[1] + B[1], A[2] + B[2]]), correct: false },
        { id: "c", content: fmt3([-AB[0], -AB[1], -AB[2]] as [number, number, number]), correct: false },
        { id: "d", content: fmt3(A), correct: false },
      ],
      explanation: [
        vec("AB"), t(` = B − A = ${fmt3(AB)}.`),
      ],
      steps: [],
      answer: fmt3(AB),
    };
  } else {
    const A = rand2(-5, 5);
    const B = rand2(-5, 5);
    const AB: [number, number] = [B[0] - A[0], B[1] - A[1]];
    return {
      id: uniqueId("gen-L27-mcq"),
      topicId: "linear-algebra",
      lessonId: "L27",
      title: "QCM — Composantes d'un vecteur (2D)",
      difficulty: "Intermédiaire",
      type: "mcq",
      prompt: [
        t(`Si A = ${fmt2(A)} et B = ${fmt2(B)}, quelles sont les composantes de `),
        vec("AB"), t(" ?"),
      ],
      options: [
        { id: "a", content: fmt2(AB), correct: true },
        { id: "b", content: fmt2([A[0] + B[0], A[1] + B[1]]), correct: false },
        { id: "c", content: fmt2([-AB[0], -AB[1]] as [number, number]), correct: false },
        { id: "d", content: fmt2(A), correct: false },
      ],
      explanation: [
        vec("AB"), t(` = B − A = ${fmt2(AB)}.`),
      ],
      steps: [],
      answer: fmt2(AB),
    };
  }
}

function l27Tf(): Exercise {
  const u: [number, number, number] = rand3(-4, 4);
  const v: [number, number, number] = rand3(-4, 4);
  const sum = addV(u, v) as number[];
  const isTrueQ = pick([true, false]);
  const proposed: [number, number, number] = isTrueQ
    ? (sum as [number, number, number])
    : ([sum[0] + nonZero(-2, 2), sum[1], sum[2]] as [number, number, number]);
  return {
    id: uniqueId("gen-L27-tf"),
    topicId: "linear-algebra",
    lessonId: "L27",
    title: "Vrai ou Faux — Addition 3D",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t(`Si `), vec("u"), t(` = ${fmt3(u)} et `), vec("v"), t(` = ${fmt3(v)}, alors `),
      vec("u"), t(" + "), vec("v"), t(` = ${fmt3(proposed)}.`),
    ],
    isTrue: isTrueQ,
    explanation: [
      t(`Calcul : `), vec("u"), t(" + "), vec("v"), t(` = (${u[0]}+${v[0]}, ${u[1]}+${v[1]}, ${u[2]}+${v[2]}) = ${fmt3(sum as [number, number, number])}. ${isTrueQ ? "Vrai." : "Faux."}`),
    ],
    steps: [],
    answer: isTrueQ ? "Vrai" : "Faux",
  };
}

function l27Calc(): Exercise {
  const A = rand3(-5, 5);
  const B = rand3(-5, 5);
  const AB: [number, number, number] = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  return {
    id: uniqueId("gen-L27-calc"),
    topicId: "linear-algebra",
    lessonId: "L27",
    title: "Trouver les composantes d'un vecteur 3D",
    difficulty: "Fondamental",
    prompt: [
      t(`Soit A = ${fmt3(A)} et B = ${fmt3(B)} dans R³. Trouver les composantes de `),
      vec("AB"), t("."),
    ],
    steps: [
      [t(`Appliquer la formule `), vec("AB"), t(` = B − A.`)],
      [t(`Calcul : (${B[0]} − ${A[0]}, ${B[1]} − ${A[1]}, ${B[2]} − ${A[2]}) = ${fmt3(AB)}.`)],
    ],
    answer: [vec("AB"), t(` = ${fmt3(AB)}.`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L28 — Vecteurs algébriques 2 (norme, distance)
// ════════════════════════════════════════════════════════════════════════

// Pythagorean triples for clean integer norms
const triples2D: [number, number, number][] = [
  [3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15],
];
const triples3D: [number, number, number, number][] = [
  [1, 2, 2, 3], [2, 3, 6, 7], [2, 6, 9, 11], [4, 4, 7, 9], [1, 4, 8, 9],
];

function randomSign() { return pick([1, -1]); }

function l28Mcq(): Exercise {
  const use3D = pick([true, false]);
  if (use3D) {
    const [a, b, c, n] = pick(triples3D);
    const v: [number, number, number] = [randomSign() * a, randomSign() * b, randomSign() * c];
    return {
      id: uniqueId("gen-L28-mcq"),
      topicId: "linear-algebra",
      lessonId: "L28",
      title: "QCM — Norme d'un vecteur 3D",
      difficulty: "Intermédiaire",
      type: "mcq",
      prompt: [
        t(`Quelle est la norme du vecteur `), vec("v"), t(` = ${fmt3(v)} dans R³ ?`),
      ],
      options: [
        { id: "a", content: String(n), correct: true },
        { id: "b", content: String(n + 1), correct: false },
        { id: "c", content: String(a * a + b * b + c * c), correct: false },
        { id: "d", content: String(Math.abs(v[0]) + Math.abs(v[1]) + Math.abs(v[2])), correct: false },
      ],
      explanation: [
        t(`‖`), vec("v"), t(`‖ = √(${a}² + ${b}² + ${c}²) = √${a * a + b * b + c * c} = ${n}.`),
      ],
      steps: [],
      answer: `‖v‖ = ${n}`,
    };
  } else {
    const [a, b, n] = pick(triples2D);
    const v: [number, number] = [randomSign() * a, randomSign() * b];
    return {
      id: uniqueId("gen-L28-mcq"),
      topicId: "linear-algebra",
      lessonId: "L28",
      title: "QCM — Norme d'un vecteur 2D",
      difficulty: "Intermédiaire",
      type: "mcq",
      prompt: [
        t(`Quelle est la norme du vecteur `), vec("v"), t(` = ${fmt2(v)} ?`),
      ],
      options: [
        { id: "a", content: String(n), correct: true },
        { id: "b", content: String(n + 1), correct: false },
        { id: "c", content: String(a * a + b * b), correct: false },
        { id: "d", content: String(Math.abs(v[0]) + Math.abs(v[1])), correct: false },
      ],
      explanation: [
        t(`‖`), vec("v"), t(`‖ = √(${a}² + ${b}²) = √${a * a + b * b} = ${n}.`),
      ],
      steps: [],
      answer: `‖v‖ = ${n}`,
    };
  }
}

function l28Tf(): Exercise {
  const [a, b, c, n] = pick(triples3D);
  const v: [number, number, number] = [randomSign() * a, randomSign() * b, randomSign() * c];
  const isTrueQ = pick([true, false]);
  const proposed = isTrueQ ? n : n + nonZero(-2, 2);
  return {
    id: uniqueId("gen-L28-tf"),
    topicId: "linear-algebra",
    lessonId: "L28",
    title: "Vrai ou Faux — Norme 3D",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t(`Le vecteur `), vec("v"), t(` = ${fmt3(v)} a une norme de ${proposed}.`),
    ],
    isTrue: isTrueQ,
    explanation: [
      t(`‖`), vec("v"), t(`‖ = √(${a}² + ${b}² + ${c}²) = √${a * a + b * b + c * c} = ${n}. ${isTrueQ ? "Vrai." : `Faux : la norme est ${n}.`}`),
    ],
    steps: [],
    answer: isTrueQ ? "Vrai" : "Faux",
  };
}

function l28Calc(): Exercise {
  const [a, b, c, n] = pick(triples3D);
  const v: [number, number, number] = [randomSign() * a, randomSign() * b, randomSign() * c];
  return {
    id: uniqueId("gen-L28-calc"),
    topicId: "linear-algebra",
    lessonId: "L28",
    title: "Calculer la norme d'un vecteur 3D",
    difficulty: "Fondamental",
    prompt: [
      t(`Calculer la norme du vecteur `), vec("v"), t(` = ${fmt3(v)}.`),
    ],
    steps: [
      [t(`Appliquer ‖`), vec("v"), t(`‖ = √(x² + y² + z²).`)],
      [t(`Calcul : √(${a}² + ${b}² + ${c}²) = √(${a * a} + ${b * b} + ${c * c}) = √${a * a + b * b + c * c} = ${n}.`)],
    ],
    answer: [t(`‖`), vec("v"), t(`‖ = ${n}.`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L29 — Vecteurs algébriques 3 (combinaisons, colinéarité)
// ════════════════════════════════════════════════════════════════════════

function l29Mcq(): Exercise {
  const u: [number, number, number] = rand3(-4, 4);
  const v: [number, number, number] = rand3(-4, 4);
  const a = nonZero(-3, 3);
  const b = nonZero(-3, 3);
  const result = addV(scaleV(a, u), scaleV(b, v)) as [number, number, number];
  return {
    id: uniqueId("gen-L29-mcq"),
    topicId: "linear-algebra",
    lessonId: "L29",
    title: "QCM — Combinaison linéaire (3D)",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t(`Soit `), vec("u"), t(` = ${fmt3(u)} et `), vec("v"), t(` = ${fmt3(v)} dans R³. Quelle est la valeur de ${a}`),
      vec("u"), t(` + ${b}`), vec("v"), t(" ?"),
    ],
    options: [
      { id: "a", content: fmt3(result), correct: true },
      { id: "b", content: fmt3([result[0] + 1, result[1], result[2]] as [number, number, number]), correct: false },
      { id: "c", content: fmt3([-result[0], -result[1], -result[2]] as [number, number, number]), correct: false },
      { id: "d", content: fmt3(addV(u, v) as [number, number, number]), correct: false },
    ],
    explanation: [
      t(`Calcul : ${a}`), vec("u"), t(` = ${fmt3(scaleV(a, u) as [number, number, number])}, ${b}`), vec("v"), t(` = ${fmt3(scaleV(b, v) as [number, number, number])}. Somme : ${fmt3(result)}.`),
    ],
    steps: [],
    answer: fmt3(result),
  };
}

function l29Tf(): Exercise {
  // Colinearity check
  const k = nonZero(-4, 4);
  const v: [number, number, number] = rand3(-3, 3);
  const u: [number, number, number] = scaleV(k, v) as [number, number, number];
  const reallyColin = pick([true, false]);
  const realU: [number, number, number] = reallyColin
    ? u
    : ([u[0] + nonZero(1, 2), u[1], u[2]] as [number, number, number]);
  return {
    id: uniqueId("gen-L29-tf"),
    topicId: "linear-algebra",
    lessonId: "L29",
    title: "Vrai ou Faux — Colinéarité en 3D",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t(`Les vecteurs `), vec("u"), t(` = ${fmt3(realU)} et `), vec("v"), t(` = ${fmt3(v)} sont colinéaires.`),
    ],
    isTrue: reallyColin,
    explanation: [
      t(reallyColin
        ? `Vrai. On observe que `
        : `Faux. Comparons composante par composante : `),
      vec("u"), t(reallyColin ? ` = ${k}·` : ` ne s'écrit pas comme k·`),
      vec("v"), t(reallyColin ? ` (chaque composante est ${k}× celle de v).` : " (les rapports diffèrent)."),
    ],
    steps: [],
    answer: reallyColin ? "Vrai" : "Faux",
  };
}

function l29Calc(): Exercise {
  const u: [number, number, number] = rand3(-4, 4);
  const v: [number, number, number] = rand3(-4, 4);
  const a = nonZero(-3, 3);
  const b = nonZero(-3, 3);
  const result = addV(scaleV(a, u), scaleV(b, v)) as [number, number, number];
  return {
    id: uniqueId("gen-L29-calc"),
    topicId: "linear-algebra",
    lessonId: "L29",
    title: "Calculer une combinaison linéaire 3D",
    difficulty: "Intermédiaire",
    prompt: [
      t(`Soit `), vec("u"), t(` = ${fmt3(u)} et `), vec("v"), t(` = ${fmt3(v)}. Calculer ${a}`),
      vec("u"), t(` + ${b}`), vec("v"), t("."),
    ],
    steps: [
      [t(`Calculer ${a}`), vec("u"), t(` = ${fmt3(scaleV(a, u) as [number, number, number])}.`)],
      [t(`Calculer ${b}`), vec("v"), t(` = ${fmt3(scaleV(b, v) as [number, number, number])}.`)],
      [t(`Additionner : ${fmt3(result)}.`)],
    ],
    answer: [t(`Résultat : ${fmt3(result)}.`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L21-L22 — Gauss-Jordan / RREF — simple templates
// ════════════════════════════════════════════════════════════════════════

function l21Mcq(): Exercise {
  return {
    id: uniqueId("gen-L21-mcq"),
    topicId: "linear-algebra",
    lessonId: "L21",
    title: "QCM — Nombre de solutions d'un système",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Un système d'équations linéaires à n inconnues peut avoir :"),
    ],
    options: [
      { id: "a", content: "0, 1 ou une infinité de solutions", correct: true },
      { id: "b", content: "Toujours exactement 1 solution", correct: false },
      { id: "c", content: "0 ou 1 solution seulement", correct: false },
      { id: "d", content: "Toujours une infinité de solutions", correct: false },
    ],
    explanation: [
      t("Un système linéaire est soit incompatible (0 solution), soit compatible déterminé (1 solution unique), soit compatible indéterminé (infinité de solutions)."),
    ],
    steps: [],
    answer: "0, 1 ou une infinité",
  };
}

function l21Tf(): Exercise {
  return {
    id: uniqueId("gen-L21-tf"),
    topicId: "linear-algebra",
    lessonId: "L21",
    title: "Vrai ou Faux — Échange de lignes",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t("Échanger deux lignes d'une matrice augmentée modifie l'ensemble des solutions du système associé."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. Les opérations élémentaires (échange, multiplication d'une ligne par un scalaire non nul, ajout d'un multiple d'une ligne à une autre) préservent l'ensemble des solutions."),
    ],
    steps: [],
    answer: "Faux",
  };
}

function l21Calc(): Exercise {
  // Solve a 2x2 system
  const a = nonZero(1, 4);
  const b = nonZero(1, 4);
  const c = nonZero(-4, -1);
  const d = nonZero(1, 4);
  const x = nonZero(-3, 3);
  const y = nonZero(-3, 3);
  const r1 = a * x + b * y;
  const r2 = c * x + d * y;
  return {
    id: uniqueId("gen-L21-calc"),
    topicId: "linear-algebra",
    lessonId: "L21",
    title: "Résoudre un système 2×2",
    difficulty: "Intermédiaire",
    prompt: [
      t(`Résoudre le système : ${a}x + ${b}y = ${r1} ; ${c}x + ${d}y = ${r2}.`),
    ],
    steps: [
      [t("Utiliser la méthode de substitution ou élimination.")],
      [t(`Solution : x = ${x}, y = ${y}.`)],
    ],
    answer: [t(`x = ${x}, y = ${y}.`)],
  };
}

function l22Mcq(): Exercise {
  return {
    id: uniqueId("gen-L22-mcq"),
    topicId: "linear-algebra",
    lessonId: "L22",
    title: "QCM — Méthode de la matrice inverse",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t("Pour résoudre AX = B avec A inversible n×n par Gauss-Jordan, on réduit [A | B] jusqu'à obtenir :"),
    ],
    options: [
      { id: "a", content: "[I | X] où X est la solution", correct: true },
      { id: "b", content: "[A | I]", correct: false },
      { id: "c", content: "[I | A]", correct: false },
      { id: "d", content: "[A⁻¹ | B]", correct: false },
    ],
    explanation: [
      t("Quand A est inversible, la réduction transforme A en I et la colonne B devient X = A⁻¹·B."),
    ],
    steps: [],
    answer: "[I | X]",
  };
}

function l22Tf(): Exercise {
  return {
    id: uniqueId("gen-L22-tf"),
    topicId: "linear-algebra",
    lessonId: "L22",
    title: "Vrai ou Faux — Solution unique garantie ?",
    difficulty: "Avancé",
    type: "tf",
    prompt: [
      t("La méthode de Gauss-Jordan donne toujours une solution unique pour AX = B."),
    ],
    isTrue: false,
    explanation: [
      t("Faux. La méthode révèle la structure du système : 0 solution (incompatible), 1 solution (unique) ou une infinité (variables libres)."),
    ],
    steps: [],
    answer: "Faux",
  };
}

function l22Calc(): Exercise {
  return l21Calc();
}

// ════════════════════════════════════════════════════════════════════════
//  L34 — Combinaison linéaire (espaces vectoriels)
// ════════════════════════════════════════════════════════════════════════

function l34Mcq(): Exercise {
  // Vérifier si w est une combinaison linéaire de u et v en R²
  const u: [number, number] = rand2(-3, 3);
  let v: [number, number] = rand2(-3, 3);
  // Ensure u and v are not colinear
  while (u[0] * v[1] - u[1] * v[0] === 0) v = rand2(-3, 3);
  const a = nonZero(-3, 3);
  const b = nonZero(-3, 3);
  const w: [number, number] = [a * u[0] + b * v[0], a * u[1] + b * v[1]];
  return {
    id: uniqueId("gen-L34-mcq"),
    topicId: "linear-algebra",
    lessonId: "L34",
    title: "QCM — Combinaison linéaire en 2D",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t(`Soit `), vec("u"), t(` = ${fmt2(u)}, `), vec("v"), t(` = ${fmt2(v)} et `),
      vec("w"), t(` = ${fmt2(w)}. Trouver a et b tels que `),
      vec("w"), t(" = a"), vec("u"), t(" + b"), vec("v"), t("."),
    ],
    options: [
      { id: "a", content: `a = ${a}, b = ${b}`, correct: true },
      { id: "b", content: `a = ${b}, b = ${a}`, correct: false },
      { id: "c", content: `a = ${-a}, b = ${b}`, correct: false },
      { id: "d", content: "Aucune solution", correct: false },
    ],
    explanation: [
      t(`On résout (${w[0]}, ${w[1]}) = a${fmt2(u)} + b${fmt2(v)}. Le système donne a = ${a}, b = ${b}.`),
    ],
    steps: [],
    answer: `a = ${a}, b = ${b}`,
  };
}

function l34Tf(): Exercise {
  const isTrueQ = pick([true, false]);
  return {
    id: uniqueId("gen-L34-tf"),
    topicId: "linear-algebra",
    lessonId: "L34",
    title: "Vrai ou Faux — Combinaison linéaire",
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: [
      t(isTrueQ
        ? "Toute combinaison linéaire avec coefficients tous nuls donne le vecteur nul."
        : "Si une combinaison linéaire est nulle, alors tous les coefficients sont nuls."),
    ],
    isTrue: isTrueQ,
    explanation: [
      t(isTrueQ
        ? "Vrai. 0·v₁ + 0·v₂ + ... + 0·vₙ = 0 toujours."
        : "Faux. Ce n'est vrai que si les vecteurs sont linéairement indépendants. S'ils sont liés, il existe des coefficients non tous nuls dont la combinaison est nulle."),
    ],
    steps: [],
    answer: isTrueQ ? "Vrai" : "Faux",
  };
}

function l34Calc(): Exercise {
  const u: [number, number] = rand2(-3, 3);
  const v: [number, number] = rand2(-3, 3);
  const a = nonZero(-3, 3);
  const b = nonZero(-3, 3);
  const result: [number, number] = [a * u[0] + b * v[0], a * u[1] + b * v[1]];
  return {
    id: uniqueId("gen-L34-calc"),
    topicId: "linear-algebra",
    lessonId: "L34",
    title: "Calculer une combinaison linéaire",
    difficulty: "Fondamental",
    prompt: [
      t(`Soit `), vec("u"), t(` = ${fmt2(u)} et `), vec("v"), t(` = ${fmt2(v)}. Calculer ${a}`),
      vec("u"), t(` + ${b}`), vec("v"), t("."),
    ],
    steps: [
      [t(`${a}`), vec("u"), t(` = ${fmt2([a * u[0], a * u[1]])}.`)],
      [t(`${b}`), vec("v"), t(` = ${fmt2([b * v[0], b * v[1]])}.`)],
      [t(`Somme : ${fmt2(result)}.`)],
    ],
    answer: [t(`Résultat : ${fmt2(result)}.`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L35 — Ensemble générateur de V
// ════════════════════════════════════════════════════════════════════════

function l35Mcq(): Exercise {
  const templates = [
    {
      title: "QCM — Engendre R² ?",
      prompt: "Lequel des ensembles suivants engendre R² ?",
      options: [
        { id: "a", content: "{(1, 0), (0, 1)}", correct: true },
        { id: "b", content: "{(2, 4), (1, 2)}", correct: false },
        { id: "c", content: "{(0, 0), (1, 1)}", correct: false },
        { id: "d", content: "{(1, 1)}", correct: false },
      ],
      explanation: "La base canonique {(1, 0), (0, 1)} engendre R². Les autres ensembles contiennent des vecteurs colinéaires ou le vecteur nul.",
      answer: "{(1, 0), (0, 1)}",
    },
    {
      title: "QCM — Engendre R³ ?",
      prompt: "Lequel des ensembles suivants engendre R³ ?",
      options: [
        { id: "a", content: "{(1, 0, 0), (0, 1, 0), (0, 0, 1)}", correct: true },
        { id: "b", content: "{(1, 1, 1), (2, 2, 2)}", correct: false },
        { id: "c", content: "{(1, 0, 0), (0, 1, 0)}", correct: false },
        { id: "d", content: "{(1, 2, 3)}", correct: false },
      ],
      explanation: "La base canonique de R³ a 3 vecteurs et engendre R³. Les autres ensembles ont trop peu de vecteurs ou sont colinéaires.",
      answer: "Base canonique de R³",
    },
  ];
  const tpl = pick(templates);
  return {
    id: uniqueId("gen-L35-mcq"),
    topicId: "linear-algebra",
    lessonId: "L35",
    title: tpl.title,
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: tpl.prompt,
    options: tpl.options,
    explanation: tpl.explanation,
    steps: [],
    answer: tpl.answer,
  };
}

function l35Tf(): Exercise {
  const templates = [
    {
      title: "Vrai ou Faux — Plus de vecteurs qu'il n'en faut",
      prompt: "Un ensemble générateur de R² peut contenir plus de 2 vecteurs.",
      isTrue: true,
      explanation: "Vrai. {(1, 0), (0, 1), (1, 1)} engendre R² avec 3 vecteurs. Un générateur n'a pas à être minimal.",
    },
    {
      title: "Vrai ou Faux — Trop peu de vecteurs",
      prompt: "Deux vecteurs suffisent toujours pour engendrer R³.",
      isTrue: false,
      explanation: "Faux. Deux vecteurs n'engendrent qu'un plan (au plus). Il faut au moins 3 vecteurs linéairement indépendants pour engendrer R³.",
    },
  ];
  const tpl = pick(templates);
  return {
    id: uniqueId("gen-L35-tf"),
    topicId: "linear-algebra",
    lessonId: "L35",
    title: tpl.title,
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: tpl.prompt,
    isTrue: tpl.isTrue,
    explanation: tpl.explanation,
    steps: [],
    answer: tpl.isTrue ? "Vrai" : "Faux",
  };
}

function l35Calc(): Exercise {
  // Verify if a given vector is in span{e1, e2} (plan z=0)
  const x = nonZero(-5, 5);
  const y = nonZero(-5, 5);
  const z = pick([0, nonZero(-5, 5)]);
  const v: [number, number, number] = [x, y, z];
  const inSpan = z === 0;
  return {
    id: uniqueId("gen-L35-calc"),
    topicId: "linear-algebra",
    lessonId: "L35",
    title: "Tester l'appartenance à un sous-espace",
    difficulty: "Intermédiaire",
    prompt: [
      t(`Soit S = {(1, 0, 0), (0, 1, 0)}. Le vecteur `), vec("v"),
      t(` = ${fmt3(v)} appartient-il à l'engendrement de S ? Justifier.`),
    ],
    steps: [
      [t("L'engendrement de S est l'ensemble des vecteurs de la forme a(1, 0, 0) + b(0, 1, 0) = (a, b, 0).")],
      [t(`Pour que `), vec("v"), t(` ∈ engendrement(S), il faut z = 0. Ici z = ${z}, donc `),
        t(inSpan ? "le vecteur appartient à l'engendrement (a = " + x + ", b = " + y + ")." : "le vecteur n'appartient pas à l'engendrement.")],
    ],
    answer: [t(inSpan ? "Oui" : "Non")],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L36 — Dépendance et indépendance linéaire
// ════════════════════════════════════════════════════════════════════════

function l36Mcq(): Exercise {
  // Test if 2 vectors are colinear (dependent) in R²
  const k = nonZero(-4, 4);
  const v: [number, number] = rand2(-3, 3);
  const useColin = pick([true, false]);
  const u: [number, number] = useColin
    ? [k * v[0], k * v[1]]
    : [v[1] + 1, v[0]]; // typically not colinear
  return {
    id: uniqueId("gen-L36-mcq"),
    topicId: "linear-algebra",
    lessonId: "L36",
    title: "QCM — Indépendance de 2 vecteurs",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t(`Soit `), vec("u"), t(` = ${fmt2(u)} et `), vec("v"),
      t(` = ${fmt2(v)}. Ces vecteurs sont :`),
    ],
    options: [
      { id: "a", content: useColin ? "Linéairement dépendants" : "Linéairement indépendants", correct: true },
      { id: "b", content: useColin ? "Linéairement indépendants" : "Linéairement dépendants", correct: false },
      { id: "c", content: "Orthogonaux", correct: false },
      { id: "d", content: "Identiques", correct: false },
    ],
    explanation: [
      t(useColin
        ? `Calcul du déterminant : ${u[0]}·${v[1]} − ${u[1]}·${v[0]} = ${u[0] * v[1] - u[1] * v[0]} = 0. Les vecteurs sont colinéaires (dépendants).`
        : `Calcul du déterminant : ${u[0]}·${v[1]} − ${u[1]}·${v[0]} = ${u[0] * v[1] - u[1] * v[0]} ≠ 0. Les vecteurs sont indépendants.`),
    ],
    steps: [],
    answer: useColin ? "Linéairement dépendants" : "Linéairement indépendants",
  };
}

function l36Tf(): Exercise {
  const templates = [
    {
      title: "Vrai ou Faux — Vecteur nul dans l'ensemble",
      prompt: "Tout ensemble de vecteurs contenant le vecteur nul est linéairement dépendant.",
      isTrue: true,
      explanation: "Vrai. La combinaison 1·0 + 0·v₁ + ... = 0 a un coefficient non nul, ce qui rend l'ensemble lié.",
    },
    {
      title: "Vrai ou Faux — Trop de vecteurs dans R³",
      prompt: "Quatre vecteurs de R³ sont toujours linéairement dépendants.",
      isTrue: true,
      explanation: "Vrai. La dimension de R³ est 3. Tout ensemble de plus de 3 vecteurs dans R³ est nécessairement lié.",
    },
    {
      title: "Vrai ou Faux — Trop de vecteurs dans R²",
      prompt: "Trois vecteurs de R² sont toujours linéairement dépendants.",
      isTrue: true,
      explanation: "Vrai. La dimension de R² est 2. Tout ensemble de plus de 2 vecteurs dans R² est lié.",
    },
  ];
  const tpl = pick(templates);
  return {
    id: uniqueId("gen-L36-tf"),
    topicId: "linear-algebra",
    lessonId: "L36",
    title: tpl.title,
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: tpl.prompt,
    isTrue: tpl.isTrue,
    explanation: tpl.explanation,
    steps: [],
    answer: tpl.isTrue ? "Vrai" : "Faux",
  };
}

function l36Calc(): Exercise {
  const v: [number, number] = rand2(-3, 3);
  const k = nonZero(-3, 3);
  const u: [number, number] = [k * v[0], k * v[1]];
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    id: uniqueId("gen-L36-calc"),
    topicId: "linear-algebra",
    lessonId: "L36",
    title: "Tester l'indépendance par déterminant",
    difficulty: "Intermédiaire",
    prompt: [
      t(`Vérifier si `), vec("u"), t(` = ${fmt2(u)} et `), vec("v"),
      t(` = ${fmt2(v)} sont linéairement indépendants.`),
    ],
    steps: [
      [t(`Calculer le déterminant : ${u[0]}·${v[1]} − ${u[1]}·${v[0]} = ${u[0] * v[1]} − ${u[1] * v[0]} = ${det}.`)],
      [t(det === 0
        ? `Le déterminant est 0, donc les vecteurs sont liés.`
        : `Le déterminant est ≠ 0, donc les vecteurs sont indépendants.`)],
    ],
    answer: [t(det === 0 ? "Liés" : "Indépendants")],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L37 — Base et composantes
// ════════════════════════════════════════════════════════════════════════

function l37Mcq(): Exercise {
  const x = nonZero(-5, 5);
  const y = nonZero(-5, 5);
  const z = nonZero(-5, 5);
  return {
    id: uniqueId("gen-L37-mcq"),
    topicId: "linear-algebra",
    lessonId: "L37",
    title: "QCM — Composantes dans la base canonique",
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: [
      t(`Soit `), vec("v"),
      t(` = (${x}, ${y}, ${z}) dans R³. Quelles sont ses composantes dans la base canonique ?`),
    ],
    options: [
      { id: "a", content: `(${x}, ${y}, ${z})`, correct: true },
      { id: "b", content: `(${z}, ${y}, ${x})`, correct: false },
      { id: "c", content: `(${x + 1}, ${y}, ${z})`, correct: false },
      { id: "d", content: "(1, 1, 1)", correct: false },
    ],
    explanation: [
      t(`Dans la base canonique, les composantes sont les coordonnées : (${x}, ${y}, ${z}). En effet, `),
      vec("v"), t(` = ${x}`), vec("e₁"), t(` + ${y}`), vec("e₂"), t(` + ${z}`), vec("e₃"), t("."),
    ],
    steps: [],
    answer: `(${x}, ${y}, ${z})`,
  };
}

function l37Tf(): Exercise {
  const templates = [
    {
      title: "Vrai ou Faux — Cardinalité d'une base",
      prompt: "Toute base de R² contient exactement 2 vecteurs.",
      isTrue: true,
      explanation: "Vrai. La dimension de R² est 2, et toutes les bases d'un même espace ont le même cardinal (la dimension).",
    },
    {
      title: "Vrai ou Faux — Cardinalité dans R³",
      prompt: "Toute base de R³ contient exactement 3 vecteurs.",
      isTrue: true,
      explanation: "Vrai. La dimension de R³ est 3, donc toutes les bases ont 3 vecteurs.",
    },
    {
      title: "Vrai ou Faux — Base avec vecteurs colinéaires",
      prompt: "Un ensemble {(1, 0), (2, 0)} est une base de R².",
      isTrue: false,
      explanation: "Faux. Les deux vecteurs sont colinéaires (le 2e est 2× le 1er), donc l'ensemble est lié et n'est pas une base.",
    },
  ];
  const tpl = pick(templates);
  return {
    id: uniqueId("gen-L37-tf"),
    topicId: "linear-algebra",
    lessonId: "L37",
    title: tpl.title,
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: tpl.prompt,
    isTrue: tpl.isTrue,
    explanation: tpl.explanation,
    steps: [],
    answer: tpl.isTrue ? "Vrai" : "Faux",
  };
}

function l37Calc(): Exercise {
  // Find components of (x,y) in base B = {(1,1), (1,-1)}
  const a = nonZero(-4, 4);
  const b = nonZero(-4, 4);
  const x = a + b;
  const y = a - b;
  return {
    id: uniqueId("gen-L37-calc"),
    topicId: "linear-algebra",
    lessonId: "L37",
    title: "Trouver les composantes dans une base donnée",
    difficulty: "Avancé",
    prompt: [
      t(`Soit B = {`), vec("b₁"), t(` = (1, 1), `), vec("b₂"),
      t(` = (1, −1)} une base de R². Trouver les composantes de `),
      vec("v"), t(` = (${x}, ${y}) dans la base B.`),
    ],
    steps: [
      [t(`On cherche a, b tels que (${x}, ${y}) = a(1, 1) + b(1, −1) = (a + b, a − b).`)],
      [t(`Système : a + b = ${x} et a − b = ${y}. Addition : 2a = ${x + y}, donc a = ${a}. Soustraction : 2b = ${x - y}, donc b = ${b}.`)],
      [t(`Composantes : (a, b) = (${a}, ${b}).`)],
    ],
    answer: [t(`Composantes dans B : (${a}, ${b}).`)],
  };
}

// ════════════════════════════════════════════════════════════════════════
//  L15-L20 — Use existing calc generators; provide MCQ/V-F templates
// ════════════════════════════════════════════════════════════════════════

function genericMatrixMcq(lessonId: string): Exercise {
  const templates = [
    {
      title: "QCM — Propriété de l'inverse",
      prompt: "Pour des matrices carrées inversibles A et B, on a (AB)⁻¹ = ?",
      options: [
        { id: "a", content: "B⁻¹·A⁻¹", correct: true },
        { id: "b", content: "A⁻¹·B⁻¹", correct: false },
        { id: "c", content: "A·B", correct: false },
        { id: "d", content: "(BA)⁻¹", correct: false },
      ],
      explanation: "(AB)·(B⁻¹A⁻¹) = A·(BB⁻¹)·A⁻¹ = A·I·A⁻¹ = I, donc (AB)⁻¹ = B⁻¹A⁻¹.",
      answer: "B⁻¹·A⁻¹",
    },
    {
      title: "QCM — Déterminant d'un produit",
      prompt: "Pour deux matrices carrées de même taille A et B : det(AB) = ?",
      options: [
        { id: "a", content: "det(A)·det(B)", correct: true },
        { id: "b", content: "det(A) + det(B)", correct: false },
        { id: "c", content: "det(A)/det(B)", correct: false },
        { id: "d", content: "det(B) − det(A)", correct: false },
      ],
      explanation: "Propriété multiplicative du déterminant : det(AB) = det(A)·det(B).",
      answer: "det(A)·det(B)",
    },
    {
      title: "QCM — Déterminant de l'inverse",
      prompt: "Si A est inversible, alors det(A⁻¹) = ?",
      options: [
        { id: "a", content: "1/det(A)", correct: true },
        { id: "b", content: "det(A)", correct: false },
        { id: "c", content: "−det(A)", correct: false },
        { id: "d", content: "0", correct: false },
      ],
      explanation: "AA⁻¹ = I, donc det(A)·det(A⁻¹) = det(I) = 1, soit det(A⁻¹) = 1/det(A).",
      answer: "1/det(A)",
    },
  ];
  const tpl = pick(templates);
  return {
    id: uniqueId(`gen-${lessonId}-mcq`),
    topicId: "linear-algebra",
    lessonId,
    title: tpl.title,
    difficulty: "Intermédiaire",
    type: "mcq",
    prompt: tpl.prompt,
    options: tpl.options,
    explanation: tpl.explanation,
    steps: [],
    answer: tpl.answer,
  };
}

function genericMatrixTf(lessonId: string): Exercise {
  const templates = [
    {
      title: "Vrai ou Faux — Inverse d'une matrice singulière",
      prompt: "Une matrice carrée A est inversible si et seulement si det(A) ≠ 0.",
      isTrue: true,
      explanation: "Vrai. C'est le critère fondamental d'inversibilité.",
    },
    {
      title: "Vrai ou Faux — Transposée et produit",
      prompt: "Pour deux matrices A et B compatibles : (AB)ᵀ = AᵀBᵀ.",
      isTrue: false,
      explanation: "Faux. La formule correcte est (AB)ᵀ = Bᵀ·Aᵀ (l'ordre s'inverse).",
    },
    {
      title: "Vrai ou Faux — Échange de lignes et déterminant",
      prompt: "Échanger deux lignes d'une matrice change le signe de son déterminant.",
      isTrue: true,
      explanation: "Vrai. C'est une propriété fondamentale des déterminants.",
    },
  ];
  const tpl = pick(templates);
  return {
    id: uniqueId(`gen-${lessonId}-tf`),
    topicId: "linear-algebra",
    lessonId,
    title: tpl.title,
    difficulty: "Intermédiaire",
    type: "tf",
    prompt: tpl.prompt,
    isTrue: tpl.isTrue,
    explanation: tpl.explanation,
    steps: [],
    answer: tpl.isTrue ? "Vrai" : "Faux",
  };
}

// ════════════════════════════════════════════════════════════════════════
//  Master dispatcher
// ════════════════════════════════════════════════════════════════════════

function getCalcExercise(lessonId: string): Exercise | null {
  // L15-L20 already have calc generators returning 5 exercises each
  if (hasQuizGenerator(lessonId)) {
    const batch = generateQuiz(lessonId);
    if (batch.length > 0) return pick(batch);
  }
  // L21-L37 use our procedural calc templates
  const calcMap: Record<string, () => Exercise> = {
    L21: l21Calc, L22: l22Calc,
    L23: l23Calc, L24: l24Calc, L25: l25Calc, L26: l26Calc,
    L27: l27Calc, L28: l28Calc, L29: l29Calc,
    L34: l34Calc, L35: l35Calc, L36: l36Calc, L37: l37Calc,
  };
  const fn = calcMap[lessonId];
  return fn ? fn() : null;
}

function getMcqExercise(lessonId: string): Exercise | null {
  const lessonNum = parseInt(lessonId.slice(1), 10);
  const mcqMap: Record<string, () => Exercise> = {
    L21: l21Mcq, L22: l22Mcq,
    L23: l23Mcq, L24: l24Mcq, L25: l25Mcq, L26: l26Mcq,
    L27: l27Mcq, L28: l28Mcq, L29: l29Mcq,
    L34: l34Mcq, L35: l35Mcq, L36: l36Mcq, L37: l37Mcq,
  };
  const fn = mcqMap[lessonId];
  if (fn) return fn();
  // L15-L20: generic matrix MCQs
  if (lessonNum >= 15 && lessonNum <= 20) {
    return genericMatrixMcq(lessonId);
  }
  return null;
}

function getTfExercise(lessonId: string): Exercise | null {
  const lessonNum = parseInt(lessonId.slice(1), 10);
  const tfMap: Record<string, () => Exercise> = {
    L21: l21Tf, L22: l22Tf,
    L23: l23Tf, L24: l24Tf, L25: l25Tf, L26: l26Tf,
    L27: l27Tf, L28: l28Tf, L29: l29Tf,
    L34: l34Tf, L35: l35Tf, L36: l36Tf, L37: l37Tf,
  };
  const fn = tfMap[lessonId];
  if (fn) return fn();
  // L15-L20: generic matrix TFs
  if (lessonNum >= 15 && lessonNum <= 20) {
    return genericMatrixTf(lessonId);
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════
//  Public API
// ════════════════════════════════════════════════════════════════════════

export type CustomQuizSpec = {
  lessonId: string;
  exerciseCount: number;
  mcqCount: number;
  tfCount: number;
};

export function buildCustomQuiz(specs: CustomQuizSpec[]): Exercise[] {
  const out: Exercise[] = [];
  for (const spec of specs) {
    for (let i = 0; i < spec.exerciseCount; i++) {
      const ex = getCalcExercise(spec.lessonId);
      if (ex) out.push(ex);
    }
    for (let i = 0; i < spec.mcqCount; i++) {
      const ex = getMcqExercise(spec.lessonId);
      if (ex) out.push(ex);
    }
    for (let i = 0; i < spec.tfCount; i++) {
      const ex = getTfExercise(spec.lessonId);
      if (ex) out.push(ex);
    }
  }
  return out;
}

// URL encoding: "L15-e2m3t1_L17-e1m2t0"  (e=exercise, m=mcq, t=tf)
export function encodeCustomQuiz(specs: CustomQuizSpec[]): string {
  return specs
    .filter((s) => s.exerciseCount + s.mcqCount + s.tfCount > 0)
    .map((s) => `${s.lessonId}-e${s.exerciseCount}m${s.mcqCount}t${s.tfCount}`)
    .join("_");
}

export function decodeCustomQuiz(str: string): CustomQuizSpec[] {
  if (!str) return [];
  return str
    .split("_")
    .map((seg) => {
      const m = seg.match(/^(L\d+)-e(\d+)m(\d+)t(\d+)$/);
      if (!m) return null;
      return {
        lessonId: m[1],
        exerciseCount: parseInt(m[2], 10),
        mcqCount: parseInt(m[3], 10),
        tfCount: parseInt(m[4], 10),
      };
    })
    .filter((x): x is CustomQuizSpec => x !== null);
}

// Which lesson-type combos have a generator (used to enable/disable inputs in the UI)
export function getAvailableTypes(lessonId: string): {
  exercise: boolean;
  mcq: boolean;
  tf: boolean;
} {
  const lessonNum = parseInt(lessonId.slice(1), 10);
  const hasL34To37 = lessonNum >= 34 && lessonNum <= 37;
  const hasL21To29 = lessonNum >= 21 && lessonNum <= 29;
  return {
    exercise: hasQuizGenerator(lessonId) || hasL21To29 || hasL34To37,
    mcq: getMcqExercise(lessonId) !== null,
    tf: getTfExercise(lessonId) !== null,
  };
}
