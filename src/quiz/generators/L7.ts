import type { Exercise } from "../../data/exercises";
import { det2, inv2, mul, randInvertible2x2 } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L7",
    title,
    difficulty,
  } as const;
}

function fmtFrac(n: number, d: number): string {
  if (d === 1) return String(n);
  if (d === -1) return String(-n);
  if (n === 0) return "0";
  // Simplify with sign on numerator
  const sign = (n < 0) !== (d < 0) ? "-" : "";
  return `${sign}${Math.abs(n)}/${Math.abs(d)}`;
}

function easyInverse2x2(): Exercise {
  // Pick a matrix with det = ±1 so the inverse has integer entries
  let A;
  let d;
  do {
    A = [
      [randInt(-3, 3), randInt(-3, 3)],
      [randInt(-3, 3), randInt(-3, 3)],
    ];
    d = det2(A);
  } while (Math.abs(d) !== 1);
  // A^-1 = (1/d) * [[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]]
  const inv = [
    [d * A[1][1], d * -A[0][1]],
    [d * -A[1][0], d * A[0][0]],
  ];
  return {
    ...meta("quiz-L7-easy", "Inverse d'une matrice 2×2 avec det = ±1", "Fondamental"),
    prompt: [
      t("Calculer A"),
      sup("-1"),
      t(" pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t(`det(A) = ${A[0][0]}·${A[1][1]} − ${A[0][1]}·${A[1][0]} = ${d}.`)],
      [
        t("A"),
        sup("-1"),
        t(" = (1/det) · "),
        mat([
          ["d", "-b"],
          ["-c", "a"],
        ]),
      ],
    ],
    answer: [bold([t("A"), sup("-1"), t(" = "), mat(asCells(inv))])],
  };
}

function interVerifyInverse(): Exercise {
  const A = randInvertible2x2();
  const inv = inv2(A)!;
  // Show that A · inv ≈ I
  return {
    ...meta("quiz-L7-inter", "Vérifier qu'une matrice est l'inverse d'une autre", "Intermédiaire"),
    prompt: [
      t("Vérifier que B = "),
      mat([
        [fmtFrac(inv[0][0] * det2(A), det2(A)), fmtFrac(inv[0][1] * det2(A), det2(A))],
        [fmtFrac(inv[1][0] * det2(A), det2(A)), fmtFrac(inv[1][1] * det2(A), det2(A))],
      ]),
      t(" est l'inverse de A = "),
      mat(asCells(A)),
      t(" en calculant A · B."),
    ],
    steps: [
      [t("Effectuer le produit A · B entrée par entrée.")],
      [t("Si A · B = I (la matrice identité), alors B = A⁻¹.")],
    ],
    answer: [bold([t("A · B = "), mat([["1", "0"], ["0", "1"]]), t(" = I, donc B = A"), sup("-1"), t(".")])],
  };
}

function interInverseFormula(): Exercise {
  const A = randInvertible2x2();
  const d = det2(A);
  const cof = [
    [A[1][1], -A[0][1]],
    [-A[1][0], A[0][0]],
  ];
  const fracStr = (n: number) => fmtFrac(n, d);
  const invStr = cof.map((row) => row.map(fracStr));
  return {
    ...meta("quiz-L7-inter", "Inverse d'une matrice 2×2 par la formule", "Intermédiaire"),
    prompt: [
      t("Trouver A"),
      sup("-1"),
      t(" pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t(`det(A) = ${A[0][0]}·${A[1][1]} − ${A[0][1]}·${A[1][0]} = ${d}.`)],
      [t("A"), sup("-1"), t(` = (1/${d}) · `), mat(asCells(cof))],
    ],
    answer: [bold([t("A"), sup("-1"), t(" = "), mat(invStr)])],
  };
}

function advProductInverse(): Exercise {
  const A = randInvertible2x2();
  const B = randInvertible2x2();
  const AB = mul(A, B);
  const invAB = inv2(AB)!;
  const dAB = det2(AB);
  const invStr = invAB.map((row) => row.map((v) => fmtFrac(v * dAB, dAB)));
  return {
    ...meta("quiz-L7-adv", "Inverse d'un produit AB", "Avancé"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", calculer (AB)"),
      sup("-1"),
      t(" en utilisant la propriété (AB)"),
      sup("-1"),
      t(" = B"),
      sup("-1"),
      t("A"),
      sup("-1"),
      t("."),
    ],
    steps: [
      [t("Calculer AB d'abord, puis appliquer la formule d'inverse à AB.")],
      [t(`det(AB) = det(A)·det(B) = ${det2(A)}·${det2(B)} = ${dAB}.`)],
    ],
    answer: [bold([t("(AB)"), sup("-1"), t(" = "), mat(invStr)])],
  };
}

function advInverseOfkA(): Exercise {
  // (kA)^-1 = (1/k) A^-1
  const A = randInvertible2x2();
  const k = pick([2, 3]);
  const invA = inv2(A)!;
  const dA = det2(A);
  // (kA)^-1 = (1/k) A^-1
  const inv_kA_num = invA.map((row) => row.map((v) => v * dA));
  return {
    ...meta("quiz-L7-adv", "Inverse de kA", "Avancé"),
    prompt: [
      t("Soit "),
      mat(asCells(A), "A ="),
      t(`. En utilisant que (${k}A)`),
      sup("-1"),
      t(` = (1/${k})·A`),
      sup("-1"),
      t(", calculer ("),
      t(`${k}A`),
      t(")"),
      sup("-1"),
      t("."),
    ],
    steps: [
      [t(`Calculer d'abord A`), sup("-1"), t(`, puis multiplier par 1/${k}.`)],
    ],
    answer: [
      bold([
        t(`(${k}A)`),
        sup("-1"),
        t(" = "),
        mat(
          inv_kA_num.map((row) => row.map((v) => fmtFrac(v, k * dA)))
        ),
        t("."),
      ]),
    ],
  };
}

const inters = [interVerifyInverse, interInverseFormula];
const advs = [advProductInverse, advInverseOfkA];

export function generateL7Quiz(): Exercise[] {
  return [easyInverse2x2(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
