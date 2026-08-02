import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Le nombre affiché sur la carte de matière est écrit à la main dans
// topics.ts — importer la banque ferait entrer 425 ko dans le bundle de
// l'accueil pour afficher un entier. Ce test empêche qu'il dérive.
test("le compte annoncé sur la carte correspond aux exercices publiés", () => {
  const topics = readFileSync("src/data/topics.ts", "utf8");
  const annonce = Number(/nbExercicesPublies:\s*(\d+)/.exec(topics)?.[1]);

  const publies = readdirSync("src/data/calcul-differentiel")
    .filter((f) => /^ch\d\d\.json$/.test(f))
    .reduce(
      (n, f) =>
        n + JSON.parse(readFileSync(`src/data/calcul-differentiel/${f}`, "utf8")).exercices.length,
      0
    );

  assert.equal(annonce, publies, `topics.ts annonce ${annonce}, la banque en publie ${publies}`);
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
