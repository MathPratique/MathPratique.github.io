import type { Exercise } from "../../data/exercises";
import { mul, randMat } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L4",
    title,
    difficulty,
  } as const;
}

function easyProduct22(): Exercise {
  const A = randMat(2, 2, -3, 3);
  const B = randMat(2, 2, -3, 3);
  const C = mul(A, B);
  return {
    ...meta("quiz-L4-easy", "Produit matriciel 2×2", "Fondamental"),
    prompt: [
      t("Effectuer le produit AB avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t("."),
    ],
    steps: [
      [t("L'entrée (i,j) du produit est la somme des produits ligne_i(A) × colonne_j(B).")],
    ],
    answer: [bold([t("AB = "), mat(asCells(C))])],
  };
}

function interDimensions(): Exercise {
  const m = pick([2, 3]);
  const n = pick([3, 4]);
  const p = pick([2, 3]);
  const q = pick([3, 4]);
  const ABDefined = n === p;
  const BADefined = q === m;
  return {
    ...meta("quiz-L4-inter", "Vérifier les dimensions d'un produit", "Intermédiaire"),
    prompt: [
      t(`Soit A de dimension ${m}×${n} et B de dimension ${p}×${q}. Déterminer si les produits AB et BA sont définis. Donner les dimensions des produits définis.`),
    ],
    steps: [
      [t(`AB : on doit avoir (colonnes de A) = (lignes de B), donc ${n} ${n === p ? "=" : "≠"} ${p}.`)],
      [t(`BA : on doit avoir (colonnes de B) = (lignes de A), donc ${q} ${q === m ? "=" : "≠"} ${m}.`)],
    ],
    answer: [
      bold([
        t(
          `AB ${ABDefined ? `défini, dimension ${m}×${q}` : "non défini"} ; BA ${
            BADefined ? `défini, dimension ${p}×${n}` : "non défini"
          }.`
        ),
      ]),
    ],
  };
}

function interSpecificEntry(): Exercise {
  const A = randMat(2, 3, -2, 3);
  const B = randMat(3, 2, -2, 3);
  const C = mul(A, B);
  // Pick a random entry to ask about
  const i = randInt(0, 1);
  const j = randInt(0, 1);
  return {
    ...meta("quiz-L4-inter", "Calculer un élément précis d'un produit", "Intermédiaire"),
    prompt: [
      t("Soit "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(`. Calculer l'élément c${i + 1}${j + 1} du produit C = AB.`),
    ],
    steps: [
      [
        t(
          `c${i + 1}${j + 1} = ligne ${i + 1} de A · colonne ${j + 1} de B = ${A[i]
            .map((v, k) => `(${v})(${B[k][j]})`)
            .join(" + ")} = ${C[i][j]}.`
        ),
      ],
    ],
    answer: [bold([t(`c${i + 1}${j + 1} = ${C[i][j]}.`)])],
  };
}

function advCompareABBA(): Exercise {
  const A = randMat(2, 2, -2, 3);
  const B = randMat(2, 2, -2, 3);
  const AB = mul(A, B);
  const BA = mul(B, A);
  return {
    ...meta("quiz-L4-adv", "Comparer AB et BA", "Avancé"),
    prompt: [
      t("Calculer AB et BA pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(", puis vérifier si AB = BA."),
    ],
    steps: [
      [t("Effectuer chaque produit entrée par entrée.")],
    ],
    answer: [
      bold([
        t("AB = "),
        mat(asCells(AB)),
        t(", BA = "),
        mat(asCells(BA)),
        t(JSON.stringify(AB) === JSON.stringify(BA) ? " (AB = BA)." : " (AB ≠ BA en général)."),
      ]),
    ],
  };
}

function advMixedProduct(): Exercise {
  // A 2×3 × B 3×2 — both AB (2x2) and BA (3x3) defined
  const A = randMat(2, 3, -2, 3);
  const B = randMat(3, 2, -2, 3);
  const AB = mul(A, B);
  const BA = mul(B, A);
  return {
    ...meta("quiz-L4-adv", "Produits non carrés AB et BA", "Avancé"),
    prompt: [
      t("Calculer AB et BA pour "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(". Noter que les deux produits sont définis mais de tailles différentes."),
    ],
    steps: [
      [t("AB : (2×3)(3×2) → 2×2. BA : (3×2)(2×3) → 3×3.")],
    ],
    answer: [
      bold([
        t("AB = "),
        mat(asCells(AB)),
        t(" (2×2) ; BA = "),
        mat(asCells(BA)),
        t(" (3×3)."),
      ]),
    ],
  };
}

const inters = [interDimensions, interSpecificEntry];
const advs = [advCompareABBA, advMixedProduct];

export function generateL4Quiz(): Exercise[] {
  return [easyProduct22(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
