import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Les nombres affichés sur les cartes de matière sont écrits à la main dans
// topics.ts — importer les banques ferait entrer des centaines de ko dans le
// bundle de l'accueil pour afficher deux entiers. Ces tests empêchent qu'ils
// dérivent, cours par cours.
//
// Le compte est lu dans l'entrée du cours concerné, pas au premier match :
// avec deux cours dans le fichier, une regex globale renverrait toujours le
// même nombre et le second compteur pourrait dériver sans que rien ne tombe.

/** Le bloc de `topics.ts` qui décrit un cours, borné à l'entrée suivante. */
function entreeTopic(topics, id) {
  const debut = topics.indexOf(`id: "${id}"`);
  assert.ok(debut > 0, `entrée ${id} absente de topics.ts`);
  const suivant = topics.indexOf("\n  {", debut);
  return topics.slice(debut, suivant === -1 ? undefined : suivant);
}

function comptePublies(dossier) {
  return readdirSync(dossier)
    .filter((f) => /^ch\d\d\.json$/.test(f))
    .reduce((n, f) => n + JSON.parse(readFileSync(`${dossier}/${f}`, "utf8")).exercices.length, 0);
}

for (const cours of [
  { topicId: "differential-calculus", dossier: "src/data/calcul-differentiel" },
  { topicId: "probability", dossier: "src/data/probabilites-statistique" },
]) {
  test(`le compte annoncé pour ${cours.topicId} correspond aux exercices publiés`, () => {
    const topics = readFileSync("src/data/topics.ts", "utf8");
    const bloc = entreeTopic(topics, cours.topicId);
    const annonce = Number(/nbExercicesPublies:\s*(\d+)/.exec(bloc)?.[1]);
    const publies = comptePublies(cours.dossier);
    assert.equal(
      annonce,
      publies,
      `topics.ts annonce ${annonce} pour ${cours.topicId}, la banque en publie ${publies}`,
    );
  });

  test(`le total annoncé pour ${cours.topicId} correspond au catalogue`, () => {
    const topics = readFileSync("src/data/topics.ts", "utf8");
    const bloc = entreeTopic(topics, cours.topicId);
    const annonce = Number(/nbExercicesTotal:\s*(\d+)/.exec(bloc)?.[1]);
    const catalogue = JSON.parse(readFileSync(`${cours.dossier}/catalogue.json`, "utf8"));
    assert.equal(
      annonce,
      catalogue.exercices.length,
      `topics.ts annonce ${annonce} au total pour ${cours.topicId}, le catalogue en compte ${catalogue.exercices.length}`,
    );
  });
}

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
