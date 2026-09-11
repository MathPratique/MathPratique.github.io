import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Les nombres affichés sur les cartes de matière, dans les descriptions de
// pages et sur la boutique sont DÉRIVÉS de `totaux`, le résumé que chaque
// catalogue porte. Jusqu'au 2026-09-10 ils étaient écrits à la main, et trois
// ajouts d'exercices les ont rendus faux en ligne.
//
// Deux familles de tests :
//   1. les invariants dont la dérivation dépend : `totaux` doit décrire
//      exactement le contenu réel de la banque ;
//   2. la garde : aucun de ces nombres ne doit revenir sous forme littérale.

function comptePublies(dossier) {
  return readdirSync(dossier)
    .filter((f) => /^ch\d\d\.json$/.test(f))
    .reduce((n, f) => n + JSON.parse(readFileSync(`${dossier}/${f}`, "utf8")).exercices.length, 0);
}

for (const cours of [
  { topicId: "differential-calculus", dossier: "src/data/calcul-differentiel" },
  { topicId: "probability", dossier: "src/data/probabilites-statistique" },
]) {
  test(`${cours.topicId} : totaux.gratuit égale le nombre d'exercices publiés`, () => {
    const { totaux } = JSON.parse(readFileSync(`${cours.dossier}/catalogue.json`, "utf8"));
    const publies = comptePublies(cours.dossier);
    assert.equal(
      totaux.gratuit,
      publies,
      `le catalogue annonce ${totaux.gratuit} gratuits, la banque en publie ${publies}`,
    );
  });

  test(`${cours.topicId} : totaux.gratuit + totaux.payant égale le nombre de fiches`, () => {
    const catalogue = JSON.parse(readFileSync(`${cours.dossier}/catalogue.json`, "utf8"));
    const somme = catalogue.totaux.gratuit + catalogue.totaux.payant;
    assert.equal(
      somme,
      catalogue.exercices.length,
      `totaux annonce ${somme} exercices, le catalogue porte ${catalogue.exercices.length} fiches`,
    );
  });
}

test("topics.ts n'écrit aucun compteur d'exercices en dur", () => {
  const topics = readFileSync("src/data/topics.ts", "utf8");
  const litteraux = topics.match(/nbExercices(Publies|Total):\s*\d+/g) ?? [];
  assert.deepEqual(litteraux, [], "compteur littéral trouvé — le dériver de `totaux`");
});

test("les pages et le pré-rendu n'écrivent aucun nombre d'exercices en dur", () => {
  // Formes relevées le 2026-09-10 : « "70 exercices de… », « Les 395 exercices ».
  const motif = /(["'`]\d+ exercices\b|\bLes \d+ exercices\b)/g;
  for (const fichier of [
    "scripts/prerendre.mjs",
    "src/pages/ExercicesCalculDifferentiel.tsx",
    "src/pages/ExercicesProbabilitesStatistique.tsx",
    "src/pages/BoutiqueCalculDifferentiel.tsx",
  ]) {
    const trouves = readFileSync(fichier, "utf8").match(motif) ?? [];
    assert.deepEqual(trouves, [], `${fichier} : nombre d'exercices écrit en dur`);
  }
});

test("prob-stat pointe vers sa vitrine dédiée", () => {
  const topics = readFileSync("src/data/topics.ts", "utf8");
  assert.ok(topics.includes('pageDediee: "/exercices/probabilites-statistique"'));
});

test("le calcul différentiel pointe vers sa vitrine dédiée", () => {
  const topics = readFileSync("src/data/topics.ts", "utf8");
  assert.ok(topics.includes('pageDediee: "/exercices/calcul-differentiel"'));
});

test("aucun exercice publié n'est marqué payant", () => {
  for (const f of readdirSync("src/data/calcul-differentiel").filter((x) => /^ch\d\d\.json$/.test(x))) {
    for (const e of JSON.parse(readFileSync(`src/data/calcul-differentiel/${f}`, "utf8")).exercices) {
      assert.equal(e.acces, "gratuit", `${e.id} publié avec acces=${e.acces}`);
      assert.ok(e.etapes?.length >= 3, `${e.id} n'a que ${e.etapes?.length} paliers`);
    }
  }
});
