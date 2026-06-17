import type { Exercise } from "../../data/exercises";
import { det2, inv2, mul, randInvertible2x2, transpose } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L8",
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

function easyAX_B(): Exercise {
  // Solve AX = B via X = A^-1 B. Pick X first to keep nice integer answer.
  const A = randInvertible2x2();
  const X = [[randInt(-2, 3)], [randInt(-2, 3)]];
  const B = mul(A, X);
  const d = det2(A);
  const invA = inv2(A)!;
  return {
    ...meta("quiz-L8-easy", "Résoudre AX = B par la matrice inverse", "Fondamental"),
    prompt: [
      t("Résoudre AX = B avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("X = A"), sup("-1"), t(" · B.")],
      [
        t(`det(A) = ${d}, A`),
        sup("-1"),
        t(" = "),
        mat(invA.map((row) => row.map((v) => fmtFrac(v * d, d)))),
        t("."),
      ],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function interTransposeInverse(): Exercise {
  // (A^T)^-1 = (A^-1)^T
  const A = randInvertible2x2();
  const AT = transpose(A);
  const invAT = inv2(AT)!;
  const dAT = det2(AT);
  return {
    ...meta("quiz-L8-inter", "Calculer (Aᵀ)⁻¹ via (A⁻¹)ᵀ", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", calculer (A"),
      sup("T"),
      t(")"),
      sup("-1"),
      t(" et vérifier qu'elle est égale à (A"),
      sup("-1"),
      t(")"),
      sup("T"),
      t("."),
    ],
    steps: [
      [t("Méthode 1 : calculer Aᵀ puis son inverse via la formule 2×2.")],
      [t("Méthode 2 : calculer A⁻¹ puis transposer.")],
    ],
    answer: [
      bold([
        t("(A"),
        sup("T"),
        t(")"),
        sup("-1"),
        t(" = "),
        mat(invAT.map((row) => row.map((v) => fmtFrac(v * dAT, dAT)))),
        t("."),
      ]),
    ],
  };
}

function interSolveSystem(): Exercise {
  // AX = B, solve for X, A is 2x2 invertible
  const A = randInvertible2x2();
  const X = [[randInt(-3, 3)], [randInt(-3, 3)]];
  const B = mul(A, X);
  return {
    ...meta("quiz-L8-inter", "Résoudre un système 2×2 via l'inverse", "Intermédiaire"),
    prompt: [
      t("Résoudre le système AX = B pour X, avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("Calculer A⁻¹ puis X = A⁻¹·B.")],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function advInversionCheck(): Exercise {
  // Verify A · B = I where B is given (correct or incorrect)
  const A = randInvertible2x2();
  const invA = inv2(A)!;
  const d = det2(A);
  const isCorrect = Math.random() < 0.5;
  // Either give the true inverse or perturb one entry
  const B = invA.map((row) => row.slice());
  if (!isCorrect) {
    B[0][0] += 1;
  }
  const product = mul(A, B);
  return {
    ...meta("quiz-L8-adv", "Vérifier si une matrice est bien l'inverse", "Avancé"),
    prompt: [
      t("Soit "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(B.map((row) => row.map((v) => fmtFrac(v * d, d))), "B ="),
      t(". Est-ce que B = A"),
      sup("-1"),
      t(" ? Justifier en calculant A · B."),
    ],
    steps: [
      [t("Calculer A · B. Si on obtient la matrice identité I, alors B = A⁻¹.")],
    ],
    answer: [
      bold([
        t("A · B = "),
        mat(product.map((row) => row.map((v) => fmtFrac(v, 1)))),
        t(isCorrect ? " = I ⇒ B = A⁻¹." : " ≠ I ⇒ B n'est pas l'inverse de A."),
      ]),
    ],
  };
}

function advProperty(): Exercise {
  // (A^-1)^-1 = A
  const A = randInvertible2x2();
  const invA = inv2(A)!;
  const d = det2(A);
  return {
    ...meta("quiz-L8-adv", "Vérifier (A⁻¹)⁻¹ = A", "Avancé"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", calculer A"),
      sup("-1"),
      t(" puis inverser le résultat pour vérifier que (A"),
      sup("-1"),
      t(")"),
      sup("-1"),
      t(" = A."),
    ],
    steps: [
      [t(`det(A) = ${d}, calculer A`), sup("-1"), t(" avec la formule 2×2.")],
      [t("Appliquer la formule d'inverse à A⁻¹ : on obtient A.")],
    ],
    answer: [
      bold([
        t("A"),
        sup("-1"),
        t(" = "),
        mat(invA.map((row) => row.map((v) => fmtFrac(v * d, d)))),
        t(" ; (A"),
        sup("-1"),
        t(")"),
        sup("-1"),
        t(" = "),
        mat(asCells(A)),
        t(" = A."),
      ]),
    ],
  };
}

const inters = [interTransposeInverse, interSolveSystem];
const advs = [advInversionCheck, advProperty];

export function generateL8Quiz(): Exercise[] {
  return [easyAX_B(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
