import type { Exercise } from "../../data/exercises";
import {
  cofactor3,
  cofactorMatrix3,
  det3,
  randInvertible3x3,
  transpose,
} from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L15",
    title,
    difficulty,
  } as const;
}

function easySingleCofactor(): Exercise {
  const A = randInvertible3x3();
  const i = randInt(0, 2);
  const j = randInt(0, 2);
  const c = cofactor3(A, i, j);
  return {
    ...meta("quiz-L15-easy", "Calculer un cofacteur précis", "Fondamental"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(`, calculer le cofacteur C${i + 1}${j + 1}.`),
    ],
    steps: [
      [t(`Supprimer la ligne ${i + 1} et la colonne ${j + 1}, calculer le déterminant 2×2, puis multiplier par (−1)^(${i + 1}+${j + 1}).`)],
    ],
    answer: [bold([t(`C${i + 1}${j + 1} = ${c}.`)])],
  };
}

function interCofactorMatrix(): Exercise {
  const A = randInvertible3x3();
  const cof = cofactorMatrix3(A);
  return {
    ...meta("quiz-L15-inter", "Construire la matrice des cofacteurs", "Intermédiaire"),
    prompt: [
      t("Construire la matrice des cofacteurs cof(A) pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Pour chaque position (i, j), calculer le cofacteur Cᵢⱼ = (−1)^(i+j)·Mᵢⱼ.")],
    ],
    answer: [bold([t("cof(A) = "), mat(asCells(cof))])],
  };
}

function interAdjoint(): Exercise {
  const A = randInvertible3x3();
  const cof = cofactorMatrix3(A);
  const adj = transpose(cof);
  return {
    ...meta("quiz-L15-inter", "Calculer la matrice adjointe", "Intermédiaire"),
    prompt: [
      t("Calculer adj(A) (la transposée de la matrice des cofacteurs) pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Construire cof(A) puis transposer.")],
    ],
    answer: [bold([t("adj(A) = cof(A)"), sup("T"), t(" = "), mat(asCells(adj))])],
  };
}

function advInverseByCofactors(): Exercise {
  const A = randInvertible3x3();
  const d = det3(A);
  const cof = cofactorMatrix3(A);
  const adj = transpose(cof);
  const fmt = (n: number) =>
    d === 1 ? String(n) : d === -1 ? String(-n) : `${n}/${d}`;
  return {
    ...meta("quiz-L15-adv", "Calculer A⁻¹ par la méthode des cofacteurs", "Avancé"),
    prompt: [
      t("Calculer A"),
      sup("-1"),
      t(" par la formule A"),
      sup("-1"),
      t(" = (1/det A)·adj(A) pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t(`det(A) = ${d}.`)],
      [t("Construire cof(A) puis adj(A) = cof(A)ᵀ.")],
      [t(`A`), sup("-1"), t(` = (1/${d})·adj(A).`)],
    ],
    answer: [
      bold([
        t("A"),
        sup("-1"),
        t(" = "),
        mat(adj.map((row) => row.map((v) => fmt(v)))),
        t("."),
      ]),
    ],
  };
}

function advVerifyAdjProperty(): Exercise {
  const A = randInvertible3x3();
  const d = det3(A);
  return {
    ...meta("quiz-L15-adv", "Vérifier A · adj(A) = det(A)·I", "Avancé"),
    prompt: [
      t("Vérifier l'identité A · adj(A) = det(A)·I pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Calculer adj(A), puis le produit A · adj(A).")],
      [t(`Le résultat doit être ${d}·I.`)],
    ],
    answer: [
      bold([
        t(`A · adj(A) = ${d}·I = `),
        mat([
          [String(d), "0", "0"],
          ["0", String(d), "0"],
          ["0", "0", String(d)],
        ]),
        t("."),
      ]),
    ],
  };
}

const inters = [interCofactorMatrix, interAdjoint];
const advs = [advInverseByCofactors, advVerifyAdjProperty];

export function generateL15Quiz(): Exercise[] {
  return [easySingleCofactor(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
