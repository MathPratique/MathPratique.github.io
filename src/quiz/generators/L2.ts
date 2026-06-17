import type { Exercise } from "../../data/exercises";
import { add, sub as msub, scale, randMat } from "../math";
import { pick, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L2",
    title,
    difficulty,
  } as const;
}

function easyAdd(): Exercise {
  const A = randMat(2, 2, -3, 4);
  const B = randMat(2, 2, -3, 4);
  const C = add(A, B);
  return {
    ...meta("quiz-L2-easy", "Additionner deux matrices 2×2", "Fondamental"),
    prompt: [
      t("Effectuer A + B avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [[t("Additionner entrée par entrée.")]],
    answer: [bold([t("A + B = "), mat(asCells(C))])],
  };
}

function interLinear(): Exercise {
  const A = randMat(2, 2, -3, 4);
  const B = randMat(2, 2, -3, 4);
  const a = pick([2, 3]);
  const b = pick([1, 2]);
  const C = msub(scale(a, A), scale(b, B));
  return {
    ...meta("quiz-L2-inter", `Calculer ${a}A − ${b}B`, "Intermédiaire"),
    prompt: [
      t(`Calculer ${a}A − ${b}B avec `),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t(`Calculer ${a}A et ${b}B séparément, puis soustraire entrée par entrée.`)],
    ],
    answer: [bold([t(`${a}A − ${b}B = `), mat(asCells(C))])],
  };
}

function interSolveX(): Exercise {
  const A = randMat(2, 2, -3, 4);
  const k = pick([2, 3]);
  // Solve kX − A = B → X = (B + A)/k. Pick X first so all entries stay nice,
  // then derive B = kX − A so the solution is exactly X.
  const X = randMat(2, 2, -2, 3);
  const realB = msub(scale(k, X), A);
  return {
    ...meta("quiz-L2-inter", `Résoudre ${k}X − A = B pour X`, "Intermédiaire"),
    prompt: [
      t(`Résoudre l'équation matricielle ${k}X − A = B pour X, avec `),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(realB), "B ="),
      t("."),
    ],
    steps: [
      [t(`Isoler X : ${k}X = B + A, donc X = (B + A)/${k}.`)],
      [t("Additionner B + A puis diviser chaque entrée par "), t(String(k)), t(".")],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function advancedHalfSum(): Exercise {
  // Compute (1/2)(A + B) — make sure entries are even so the half is integer
  const A = randMat(2, 2, -3, 4).map((row) => row.map((v) => v * 2));
  const B = randMat(2, 2, -3, 4).map((row) => row.map((v) => v * 2));
  const half = scale(0.5, add(A, B));
  return {
    ...meta("quiz-L2-adv", "Calculer (1/2)(A + B)", "Avancé"),
    prompt: [
      t("Calculer (1/2)(A + B) avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("Additionner d'abord A + B, puis diviser chaque entrée par 2.")],
    ],
    answer: [bold([t("(1/2)(A + B) = "), mat(asCells(half))])],
  };
}

function advancedVerifyZero(): Exercise {
  const A = randMat(2, 2, -3, 4);
  return {
    ...meta("quiz-L2-adv", "Vérifier que 0·A = 0 et (−1)·A = −A", "Avancé"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", vérifier en calculant directement que 0·A donne la matrice nulle et que (−1)·A = −A."),
    ],
    steps: [
      [t("0·A : multiplier chaque entrée de A par 0 — tout devient 0.")],
      [t("(−1)·A : multiplier chaque entrée par −1 — chaque entrée change de signe.")],
    ],
    answer: [
      bold([
        t("0·A = "),
        mat(asCells(scale(0, A))),
        t(" ; (−1)·A = "),
        mat(asCells(scale(-1, A))),
        t(" = −A."),
      ]),
    ],
  };
}

const inters = [interLinear, interSolveX];
const advs = [advancedHalfSum, advancedVerifyZero];

export function generateL2Quiz(): Exercise[] {
  return [easyAdd(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
