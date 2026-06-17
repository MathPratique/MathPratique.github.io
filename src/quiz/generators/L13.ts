import type { Exercise } from "../../data/exercises";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L13",
    title,
    difficulty,
  } as const;
}

function easyZeroByRow(): Exercise {
  return {
    ...meta("quiz-L13-easy", "Identifier un déterminant nul", "Fondamental"),
    prompt: [
      t("Sans calculer, donner det("),
      mat([
        ["1", "2", "3"],
        ["0", "0", "0"],
        ["4", "5", "6"],
      ]),
      t(")."),
    ],
    steps: [
      [t("Une ligne nulle ⇒ det = 0.")],
    ],
    answer: [bold([t("det = 0.")])],
  };
}

function interDetkA(): Exercise {
  const n = pick([2, 3, 4]);
  const k = pick([2, 3]);
  const d = pick([2, 3, 5, -4]);
  return {
    ...meta("quiz-L13-inter", "Calculer det(kA) en dimension n", "Intermédiaire"),
    prompt: [
      t(`Si A est une matrice ${n}×${n} avec det(A) = ${d}, calculer det(${k}A).`),
    ],
    steps: [
      [t(`det(kA) = kⁿ·det(A) = ${k}^${n}·${d} = ${Math.pow(k, n)}·${d}.`)],
    ],
    answer: [bold([t(`det(${k}A) = ${Math.pow(k, n) * d}.`)])],
  };
}

function interProdInv(): Exercise {
  const da = pick([2, -3, 5]);
  const db = pick([3, -2, 4]);
  return {
    ...meta("quiz-L13-inter", "det(A⁻¹B²) par les propriétés", "Intermédiaire"),
    prompt: [
      t(`Si det(A) = ${da} et det(B) = ${db}, calculer det(A⁻¹B²).`),
    ],
    steps: [
      [t(`det(A⁻¹B²) = det(A⁻¹)·det(B)² = (1/det(A))·det(B)² = ${db * db}/${da}.`)],
    ],
    answer: [
      bold([
        t(`det(A⁻¹B²) = ${db * db}/${da}${da !== 0 && (db * db) % da === 0 ? ` = ${(db * db) / da}` : ""}.`),
      ]),
    ],
  };
}

function advProportional(): Exercise {
  const k = pick([2, 3, -2]);
  const A = [
    [randInt(1, 3), randInt(-2, 3), randInt(-2, 3)],
    [randInt(-2, 3), randInt(1, 3), randInt(-2, 3)],
    [0, 0, 0],
  ];
  A[2] = [k * A[0][0], k * A[0][1], k * A[0][2]];
  return {
    ...meta("quiz-L13-adv", "Déterminant avec lignes proportionnelles", "Avancé"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", remarquer qu'une ligne est multiple d'une autre, puis donner det(A)."),
    ],
    steps: [
      [t(`Ligne 3 = ${k}·ligne 1.`)],
      [t("Propriété : si une ligne est multiple d'une autre, det = 0.")],
    ],
    answer: [bold([t("det(A) = 0.")])],
  };
}

function advChain(): Exercise {
  const da = pick([2, 3, 4]);
  const n = pick([2, 3]);
  return {
    ...meta("quiz-L13-adv", "Chaîne de propriétés sur le déterminant", "Avancé"),
    prompt: [
      t(`Soit A une matrice ${n}×${n} avec det(A) = ${da}. Calculer det((2A)⁻¹·Aᵀ·A).`),
    ],
    steps: [
      [t(`det(Aᵀ) = det(A) = ${da}, det(A·A) = det(A)² = ${da * da}.`)],
      [
        t(
          `det((2A)⁻¹) = 1/det(2A) = 1/(2ⁿ·det(A)) = 1/(${Math.pow(2, n)}·${da}) = 1/${Math.pow(2, n) * da}.`
        ),
      ],
      [
        t(
          `det((2A)⁻¹·Aᵀ·A) = (1/${Math.pow(2, n) * da})·${da}·${da} = ${(da * da) / (Math.pow(2, n) * da)}.`
        ),
      ],
    ],
    answer: [
      bold([
        t(`det((2A)⁻¹·Aᵀ·A) = ${(da * da) / (Math.pow(2, n) * da)}.`),
      ]),
    ],
  };
}

const inters = [interDetkA, interProdInv];
const advs = [advProportional, advChain];

export function generateL13Quiz(): Exercise[] {
  return [easyZeroByRow(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
