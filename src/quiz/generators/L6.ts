import type { Exercise } from "../../data/exercises";
import { mul, transpose, randMat } from "../math";
import { pick, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L6",
    title,
    difficulty,
  } as const;
}

function easyTranspose(): Exercise {
  const r = pick([2, 3]);
  const c = pick([3, 4]);
  const A = randMat(r, c, -3, 4);
  const AT = transpose(A);
  return {
    ...meta("quiz-L6-easy", "Calculer la transposée d'une matrice", "Fondamental"),
    prompt: [
      t("Trouver A"),
      sup("T"),
      t(" pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Les lignes de A deviennent les colonnes de Aᵀ.")],
    ],
    answer: [bold([t("A"), sup("T"), t(" = "), mat(asCells(AT))])],
  };
}

function interVerifyABT(): Exercise {
  const A = randMat(2, 2, -2, 3);
  const B = randMat(2, 2, -2, 3);
  const AB = mul(A, B);
  const ABT = transpose(AB);
  const BT = transpose(B);
  const AT = transpose(A);
  const BTAT = mul(BT, AT);
  return {
    ...meta("quiz-L6-inter", "Vérifier (AB)ᵀ = BᵀAᵀ", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", vérifier l'identité (AB)"),
      sup("T"),
      t(" = B"),
      sup("T"),
      t("A"),
      sup("T"),
      t(" en calculant les deux membres."),
    ],
    steps: [
      [t("Calculer AB, puis sa transposée.")],
      [t("Calculer Bᵀ et Aᵀ, puis leur produit dans cet ordre.")],
    ],
    answer: [
      bold([
        t("(AB)"),
        sup("T"),
        t(" = "),
        mat(asCells(ABT)),
        t(" = B"),
        sup("T"),
        t("A"),
        sup("T"),
        t(" = "),
        mat(asCells(BTAT)),
        t("."),
      ]),
    ],
  };
}

function interSymmetricCheck(): Exercise {
  const A = randMat(3, 3, -2, 3);
  const AT = transpose(A);
  const isSym = JSON.stringify(A) === JSON.stringify(AT);
  const isAnti = JSON.stringify(A) === JSON.stringify(AT.map((r) => r.map((v) => -v)));
  return {
    ...meta("quiz-L6-inter", "Symétrique, antisymétrique ou ni l'un ni l'autre", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", calculer A"),
      sup("T"),
      t(" et déterminer si A est symétrique, antisymétrique, ou ni l'un ni l'autre."),
    ],
    steps: [
      [t("Calculer Aᵀ et comparer à A puis à −A.")],
    ],
    answer: [
      bold([
        t("A"),
        sup("T"),
        t(" = "),
        mat(asCells(AT)),
        t(
          isSym
            ? " ; A = Aᵀ donc A est symétrique."
            : isAnti
            ? " ; Aᵀ = −A et la diagonale est nulle ⇒ A est antisymétrique."
            : " ; A ≠ Aᵀ et A ≠ −Aᵀ ⇒ ni symétrique ni antisymétrique."
        ),
      ]),
    ],
  };
}

function advForceSymmetric(): Exercise {
  // Build A so that (A + Aᵀ)/2 is symmetric — show this for any A.
  const A = randMat(2, 2, -2, 3);
  const AT = transpose(A);
  const S = A.map((row, i) => row.map((v, j) => (v + AT[i][j]) / 2));
  return {
    ...meta("quiz-L6-adv", "Construire la partie symétrique de A", "Avancé"),
    prompt: [
      t("Pour toute matrice carrée A, la matrice S = (A + A"),
      sup("T"),
      t(")/2 est symétrique. Le vérifier pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Calculer A + Aᵀ entrée par entrée puis diviser par 2.")],
      [t("Vérifier que Sᵀ = S.")],
    ],
    answer: [bold([t("S = (A + A"), sup("T"), t(")/2 = "), mat(asCells(S)), t(" ; on a bien S"), sup("T"), t(" = S.")])],
  };
}

function advTransposeChain(): Exercise {
  // Compute (A + B)ᵀ and show it equals Aᵀ + Bᵀ
  const A = randMat(2, 3, -2, 3);
  const B = randMat(2, 3, -2, 3);
  const sum = A.map((row, i) => row.map((v, j) => v + B[i][j]));
  const sumT = transpose(sum);
  const ATBT = transpose(A).map((row, i) =>
    row.map((v, j) => v + transpose(B)[i][j])
  );
  return {
    ...meta("quiz-L6-adv", "Vérifier (A + B)ᵀ = Aᵀ + Bᵀ", "Avancé"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", vérifier que (A + B)"),
      sup("T"),
      t(" = A"),
      sup("T"),
      t(" + B"),
      sup("T"),
      t("."),
    ],
    steps: [
      [t("Calculer A + B puis sa transposée.")],
      [t("Calculer Aᵀ et Bᵀ puis les additionner.")],
    ],
    answer: [
      bold([
        t("(A + B)"),
        sup("T"),
        t(" = "),
        mat(asCells(sumT)),
        t(" = A"),
        sup("T"),
        t(" + B"),
        sup("T"),
        t(" = "),
        mat(asCells(ATBT)),
        t("."),
      ]),
    ],
  };
}

const inters = [interVerifyABT, interSymmetricCheck];
const advs = [advForceSymmetric, advTransposeChain];

export function generateL6Quiz(): Exercise[] {
  return [easyTranspose(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
