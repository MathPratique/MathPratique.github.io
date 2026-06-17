import type { Exercise } from "../../data/exercises";
import { add, sub as msub, scale, randMat } from "../math";
import { pick, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L3",
    title,
    difficulty,
  } as const;
}

function easySolveLinear(): Exercise {
  // Solve k·X + A = B  ⇒  X = (B − A)/k
  const k = pick([2, 3]);
  const X = randMat(2, 2, -2, 3);
  const A = randMat(2, 2, -3, 3);
  const B = add(scale(k, X), A);
  return {
    ...meta("quiz-L3-easy", `Résoudre ${k}X + A = B pour X`, "Fondamental"),
    prompt: [
      t(`Résoudre l'équation ${k}X + A = B pour X, avec `),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t(`Isoler : ${k}X = B − A, puis X = (B − A)/${k}.`)],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function interIsolateMultiTerm(): Exercise {
  // 4X − 3A = B + X  →  3X = B + 3A  →  X = (B + 3A)/3
  const X = randMat(2, 2, -2, 2);
  const A = randMat(2, 2, -2, 3);
  const B = msub(scale(3, X), scale(3, A));  // B = 3X − 3A, so X = (B + 3A)/3
  return {
    ...meta("quiz-L3-inter", "Isoler X dans 4X − 3A = B + X", "Intermédiaire"),
    prompt: [
      t("Isoler X dans l'équation 4X − 3A = B + X, puis calculer X si "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("Regrouper les X à gauche : 4X − X = B + 3A, donc 3X = B + 3A.")],
      [t("Diviser par 3 : X = (B + 3A)/3.")],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function interMixed(): Exercise {
  // 2X + A = 3B − X  →  3X = 3B − A  →  X = B − A/3
  // Pick A divisible by 3
  const X = randMat(2, 2, -2, 2);
  const B = randMat(2, 2, -2, 3);
  // 3X = 3B − A  →  A = 3B − 3X
  const A = msub(scale(3, B), scale(3, X));
  return {
    ...meta("quiz-L3-inter", "Isoler X dans 2X + A = 3B − X", "Intermédiaire"),
    prompt: [
      t("Isoler X dans 2X + A = 3B − X, puis calculer X avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("Regrouper : 2X + X = 3B − A, soit 3X = 3B − A.")],
      [t("Diviser par 3 : X = B − A/3.")],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

function advSystemXY(): Exercise {
  // X + Y = M1, X − Y = M2 → X = (M1 + M2)/2, Y = (M1 − M2)/2
  // Pick X, Y with even-sum entries to keep nice
  const X = randMat(2, 2, -2, 3);
  const Y = randMat(2, 2, -2, 3);
  const M1 = add(X, Y);
  const M2 = msub(X, Y);
  return {
    ...meta("quiz-L3-adv", "Résoudre un système matriciel X+Y, X−Y", "Avancé"),
    prompt: [
      t("Résoudre pour X et Y : X + Y = "),
      mat(asCells(M1)),
      t(" et X − Y = "),
      mat(asCells(M2)),
      t("."),
    ],
    steps: [
      [t("Additionner les deux équations : 2X = (X+Y) + (X−Y), donc X = ((X+Y) + (X−Y))/2.")],
      [t("Soustraire : 2Y = (X+Y) − (X−Y), donc Y = ((X+Y) − (X−Y))/2.")],
    ],
    answer: [
      bold([
        t("X = "),
        mat(asCells(X)),
        t(", Y = "),
        mat(asCells(Y)),
        t("."),
      ]),
    ],
  };
}

function advTripleEq(): Exercise {
  // 2A − 3X = 5B + X − C  →  4X = 2A − 5B + C  →  X = (2A − 5B + C)/4
  const X = randMat(2, 2, -2, 2);
  // Choose A, B, C so the right side equals 4X
  // Pick A and B freely, then C = 4X − 2A + 5B
  const A = randMat(2, 2, -2, 3);
  const B = randMat(2, 2, -2, 3);
  const C = add(scale(4, X), add(scale(-2, A), scale(5, B)));
  return {
    ...meta("quiz-L3-adv", "Isoler X dans 2A − 3X = 5B + X − C", "Avancé"),
    prompt: [
      t("Isoler X dans 2A − 3X = 5B + X − C, puis calculer X avec "),
      mat(asCells(A), "A ="),
      t(", "),
      mat(asCells(B), "B ="),
      t(" et "),
      mat(asCells(C), "C ="),
      t("."),
    ],
    steps: [
      [t("Regrouper les X : 2A + C − 5B = 4X, donc X = (2A − 5B + C)/4.")],
    ],
    answer: [bold([t("X = "), mat(asCells(X))])],
  };
}

const inters = [interIsolateMultiTerm, interMixed];
const advs = [advSystemXY, advTripleEq];

export function generateL3Quiz(): Exercise[] {
  return [
    easySolveLinear(),
    pick(inters)(),
    pick(inters)(),
    pick(advs)(),
    pick(advs)(),
  ];
}
