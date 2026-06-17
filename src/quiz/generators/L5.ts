import type { Exercise } from "../../data/exercises";
import { mul, randMat } from "../math";
import { pick, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L5",
    title,
    difficulty,
  } as const;
}

function easySquareCube(): Exercise {
  const A = randMat(2, 2, -2, 3);
  const A2 = mul(A, A);
  const A3 = mul(A2, A);
  return {
    ...meta("quiz-L5-easy", "Calculer A² et A³", "Fondamental"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", calculer A"),
      sup("2"),
      t(" et A"),
      sup("3"),
      t("."),
    ],
    steps: [
      [t("A² = A · A puis A³ = A² · A.")],
    ],
    answer: [
      bold([
        t("A"),
        sup("2"),
        t(" = "),
        mat(asCells(A2)),
        t(", A"),
        sup("3"),
        t(" = "),
        mat(asCells(A3)),
        t("."),
      ]),
    ],
  };
}

function interShowNonCommut(): Exercise {
  let A = randMat(2, 2, -2, 3);
  let B = randMat(2, 2, -2, 3);
  // Re-roll until AB ≠ BA
  for (let attempt = 0; attempt < 30; attempt++) {
    const AB = mul(A, B);
    const BA = mul(B, A);
    if (JSON.stringify(AB) !== JSON.stringify(BA)) break;
    A = randMat(2, 2, -2, 3);
    B = randMat(2, 2, -2, 3);
  }
  const AB = mul(A, B);
  const BA = mul(B, A);
  return {
    ...meta("quiz-L5-inter", "Vérifier que AB ≠ BA en général", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", calculer AB et BA pour illustrer que la multiplication matricielle n'est pas commutative."),
    ],
    steps: [
      [t("Calculer chacun des deux produits ; comparer ensuite entrée par entrée.")],
    ],
    answer: [
      bold([
        t("AB = "),
        mat(asCells(AB)),
        t(", BA = "),
        mat(asCells(BA)),
        t(" ⇒ AB ≠ BA."),
      ]),
    ],
  };
}

function interMixedExpr(): Exercise {
  // Compute A² − AB + BA for 2x2 A and B
  const A = randMat(2, 2, -2, 2);
  const B = randMat(2, 2, -2, 2);
  const A2 = mul(A, A);
  const AB = mul(A, B);
  const BA = mul(B, A);
  const result = A2.map((row, i) =>
    row.map((v, j) => v - AB[i][j] + BA[i][j])
  );
  return {
    ...meta("quiz-L5-inter", "Calculer A² − AB + BA", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", calculer A"),
      sup("2"),
      t(" − AB + BA."),
    ],
    steps: [
      [t("Calculer A² = A · A, puis AB et BA séparément.")],
      [t("Combiner entrée par entrée.")],
    ],
    answer: [
      bold([
        t("A"),
        sup("2"),
        t(" − AB + BA = "),
        mat(asCells(result)),
        t("."),
      ]),
    ],
  };
}

function advPattern(): Exercise {
  // Use a specific known pattern: A = [[1, 1], [0, 1]] → A^n = [[1, n], [0, 1]]
  // But let's randomize: A = [[1, k], [0, 1]]
  const k = pick([1, 2, 3]);
  const A = [
    [1, k],
    [0, 1],
  ];
  return {
    ...meta("quiz-L5-adv", "Conjecturer Aⁿ pour une matrice unipotente", "Avancé"),
    prompt: [
      t("Soit "),
      mat(asCells(A), "A ="),
      t(". Calculer A"),
      sup("2"),
      t(", A"),
      sup("3"),
      t(" et conjecturer A"),
      sup("n"),
      t(" pour n ≥ 1."),
    ],
    steps: [
      [t("A² = "), mat(asCells(mul(A, A))), t(", A³ = "), mat(asCells(mul(mul(A, A), A))), t(".")],
      [t(`Le motif suggère que la position (1,2) augmente de ${k} à chaque puissance.`)],
    ],
    answer: [
      bold([
        t("A"),
        sup("n"),
        t(" = "),
        mat([
          ["1", `${k}n`],
          ["0", "1"],
        ]),
        t("."),
      ]),
    ],
  };
}

function advNilpotent(): Exercise {
  // A = [[0, 1], [0, 0]] → A² = 0, A^n = 0 for n ≥ 2
  const A = [
    [0, 1],
    [0, 0],
  ];
  return {
    ...meta("quiz-L5-adv", "Étudier les puissances d'une matrice nilpotente", "Avancé"),
    prompt: [
      t("Soit "),
      mat(asCells(A), "A ="),
      t(". Calculer A"),
      sup("2"),
      t(", A"),
      sup("3"),
      t(" et conjecturer la valeur de A"),
      sup("n"),
      t(" pour tout n ≥ 2."),
    ],
    steps: [
      [t("A² = "), mat(asCells(mul(A, A))), t(", A³ = "), mat(asCells(mul(mul(A, A), A))), t(".")],
      [t("Tous les produits A · 0 valent 0.")],
    ],
    answer: [
      bold([
        t("A"),
        sup("n"),
        t(" = "),
        mat([
          ["0", "0"],
          ["0", "0"],
        ]),
        t(" pour tout n ≥ 2 (A est nilpotente d'indice 2)."),
      ]),
    ],
  };
}

const inters = [interShowNonCommut, interMixedExpr];
const advs = [advPattern, advNilpotent];

export function generateL5Quiz(): Exercise[] {
  return [easySquareCube(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
