import type { Exercise } from "../../data/exercises";
import { det2, det3, inv2, mul, randInvertible2x2, randInvertible3x3, transpose } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L9",
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

function easyDet3FromInverse(): Exercise {
  // Given that |A^-1| = k, find |A|
  const A = randInvertible3x3();
  const d = det3(A);
  return {
    ...meta("quiz-L9-easy", "Lien entre |A| et |A⁻¹|", "Fondamental"),
    prompt: [
      t("Sachant que A est une matrice 3×3 inversible avec det(A"),
      sup("-1"),
      t(`) = ${1}/${d}, trouver det(A).`),
    ],
    steps: [
      [t("Propriété : det(A⁻¹) = 1/det(A).")],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function interSolveAXB_3x3(): Exercise {
  const A = randInvertible3x3();
  const X = [[randInt(-2, 3)], [randInt(-2, 3)], [randInt(-2, 3)]];
  const B = mul(A, X);
  return {
    ...meta("quiz-L9-inter", "Résoudre AX = B en 3 dimensions", "Intermédiaire"),
    prompt: [
      t("Résoudre AX = B avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("Calculer A⁻¹, puis X = A⁻¹·B.")],
      [t(`det(A) = ${det3(A)}, donc A est bien inversible.`)],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function interPropertyChain(): Exercise {
  // (A^T)^-1 = (A^-1)^T
  const A = randInvertible2x2();
  const invAT = transpose(inv2(A)!);
  const d = det2(A);
  return {
    ...meta("quiz-L9-inter", "Vérifier (Aᵀ)⁻¹ = (A⁻¹)ᵀ", "Intermédiaire"),
    prompt: [
      t("Démontrer pratiquement l'identité (A"),
      sup("T"),
      t(")"),
      sup("-1"),
      t(" = (A"),
      sup("-1"),
      t(")"),
      sup("T"),
      t(" pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Calculer Aᵀ puis (Aᵀ)⁻¹ via la formule 2×2.")],
      [t("Calculer A⁻¹ puis le transposer. Comparer.")],
    ],
    answer: [
      bold([
        t("(A"),
        sup("T"),
        t(")"),
        sup("-1"),
        t(" = (A"),
        sup("-1"),
        t(")"),
        sup("T"),
        t(" = "),
        mat(invAT.map((row) => row.map((v) => fmtFrac(v * d, d)))),
        t("."),
      ]),
    ],
  };
}

function advChainOfProperties(): Exercise {
  const A = randInvertible2x2();
  const k = pick([2, 3]);
  const d = det2(A);
  // (kA^T)^-1 = (1/k)(A^-1)^T
  const invAT = transpose(inv2(A)!);
  const result = invAT.map((row) => row.map((v) => v / k));
  return {
    ...meta("quiz-L9-adv", "Combinaison de propriétés d'inverse et transposée", "Avancé"),
    prompt: [
      t(`Calculer (${k}A`),
      sup("T"),
      t(")"),
      sup("-1"),
      t(" pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t(`(${k}A`), sup("T"), t(`)`), sup("-1"), t(` = (1/${k})(A`), sup("T"), t(")"), sup("-1"), t(` = (1/${k})(A`), sup("-1"), t(")"), sup("T"), t(".")],
    ],
    answer: [
      bold([
        t(`(${k}A`),
        sup("T"),
        t(")"),
        sup("-1"),
        t(" = "),
        mat(result.map((row) => row.map((v) => fmtFrac(v * d * k, d * k)))),
        t("."),
      ]),
    ],
  };
}

function advConditionsInvertibility(): Exercise {
  // Find values of k such that [[1, k], [k, 1]] is invertible
  return {
    ...meta("quiz-L9-adv", "Condition d'inversibilité d'une matrice paramétrée", "Avancé"),
    prompt: [
      t("Pour quelles valeurs de k la matrice "),
      mat([
        ["1", "k"],
        ["k", "1"],
      ]),
      t(" est-elle inversible ?"),
    ],
    steps: [
      [t("La matrice est inversible ssi son déterminant est non nul.")],
      [t("det = 1 − k² ≠ 0 ⇔ k² ≠ 1 ⇔ k ≠ ±1.")],
    ],
    answer: [bold([t("La matrice est inversible pour tout k ∈ ℝ \\ {−1, 1}.")])],
  };
}

const inters = [interSolveAXB_3x3, interPropertyChain];
const advs = [advChainOfProperties, advConditionsInvertibility];

export function generateL9Quiz(): Exercise[] {
  return [easyDet3FromInverse(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
