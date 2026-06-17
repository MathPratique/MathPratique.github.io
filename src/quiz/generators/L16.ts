import type { Exercise } from "../../data/exercises";
import {
  cofactorMatrix3,
  det3,
  mul,
  randInvertible3x3,
  transpose,
} from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L16",
    title,
    difficulty,
  } as const;
}

function fmtFrac(n: number, d: number): string {
  if (d === 1) return String(n);
  if (d === -1) return String(-n);
  if (n === 0) return "0";
  const sign = (n < 0) !== (d < 0) ? "-" : "";
  return `${sign}${Math.abs(n)}/${Math.abs(d)}`;
}

function easyTriangularInverse3(): Exercise {
  // Upper triangular 3×3 with ±1 on diagonal → det = ±1, integer inverse
  const a = pick([1, -1]);
  const b = pick([1, -1]);
  const c = pick([1, -1]);
  const A: number[][] = [
    [a, randInt(-2, 3), randInt(-2, 3)],
    [0, b, randInt(-2, 3)],
    [0, 0, c],
  ];
  const d = det3(A); // = a*b*c ∈ {±1}
  const adj = transpose(cofactorMatrix3(A));
  const inv = adj.map((row) => row.map((v) => v / d));
  return {
    ...meta("quiz-L16-easy", "Inverse 3×3 par cofacteurs (matrice triangulaire)", "Fondamental"),
    prompt: [
      t("Calculer A"),
      sup("-1"),
      t(" pour la matrice triangulaire "),
      mat(asCells(A), "A ="),
      t(" par la méthode des cofacteurs."),
    ],
    steps: [
      [t(`Pour une matrice triangulaire, det(A) = ${a}·${b}·${c} = ${d}.`)],
      [t("Construire la matrice des cofacteurs, puis la transposer pour obtenir adj(A).")],
      [t(`A`), sup("-1"), t(` = (1/${d})·adj(A).`)],
    ],
    answer: [
      bold([
        t("A"),
        sup("-1"),
        t(" = "),
        mat(inv.map((row) => row.map((v) => String(v)))),
        t("."),
      ]),
    ],
  };
}

function interInverse3By3(): Exercise {
  const A = randInvertible3x3();
  const d = det3(A);
  const adj = transpose(cofactorMatrix3(A));
  return {
    ...meta("quiz-L16-inter", "Inverse 3×3 par cofacteurs", "Intermédiaire"),
    prompt: [
      t("Calculer A"),
      sup("-1"),
      t(" pour "),
      mat(asCells(A), "A ="),
      t(" par la méthode des cofacteurs."),
    ],
    steps: [
      [t(`det(A) = ${d}.`)],
      [t("Construire la matrice adjointe.")],
      [t(`A`), sup("-1"), t(` = (1/${d})·adj(A).`)],
    ],
    answer: [
      bold([
        t("A"),
        sup("-1"),
        t(" = "),
        mat(adj.map((row) => row.map((v) => fmtFrac(v, d)))),
        t("."),
      ]),
    ],
  };
}

function interVerify(): Exercise {
  const A = randInvertible3x3();
  const d = det3(A);
  return {
    ...meta("quiz-L16-inter", "Vérifier A · A⁻¹ = I", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", calculer A"),
      sup("-1"),
      t(" par cofacteurs, puis vérifier A · A"),
      sup("-1"),
      t(" = I."),
    ],
    steps: [
      [t(`det(A) = ${d}. Construire adj(A) puis A`), sup("-1"), t(` = adj(A)/${d}.`)],
      [t("Calculer le produit A · A⁻¹ : on doit obtenir I.")],
    ],
    answer: [
      bold([
        t("A · A"),
        sup("-1"),
        t(" = I = "),
        mat([
          ["1", "0", "0"],
          ["0", "1", "0"],
          ["0", "0", "1"],
        ]),
        t("."),
      ]),
    ],
  };
}

function advSolveAXBby3(): Exercise {
  const A = randInvertible3x3();
  const X = [[randInt(-2, 3)], [randInt(-2, 3)], [randInt(-2, 3)]];
  const B = mul(A, X);
  return {
    ...meta("quiz-L16-adv", "Résoudre AX = B (3×3) par cofacteurs", "Avancé"),
    prompt: [
      t("Résoudre AX = B avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", en utilisant A"),
      sup("-1"),
      t(" obtenu par cofacteurs."),
    ],
    steps: [
      [t("X = A"), sup("-1"), t("·B. Calculer A"), sup("-1"), t(" par cofacteurs, puis multiplier par B.")],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function advDetOfAdj(): Exercise {
  const n = 3;
  const d = pick([2, 3, -3, 4]);
  return {
    ...meta("quiz-L16-adv", "det(adj(A)) en dimension n", "Avancé"),
    prompt: [
      t(`Soit A une matrice ${n}×${n} avec det(A) = ${d}. Calculer det(adj(A)).`),
    ],
    steps: [
      [t("Propriété : det(adj(A)) = det(A)ⁿ⁻¹.")],
      [t(`Ici n = ${n}, donc det(adj(A)) = ${d}^${n - 1} = ${Math.pow(d, n - 1)}.`)],
    ],
    answer: [bold([t(`det(adj(A)) = ${Math.pow(d, n - 1)}.`)])],
  };
}

const inters = [interInverse3By3, interVerify];
const advs = [advSolveAXBby3, advDetOfAdj];

export function generateL16Quiz(): Exercise[] {
  return [easyTriangularInverse3(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
